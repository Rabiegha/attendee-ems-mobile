/**
 * Client Axios centralisé avec intercepteurs
 * Gère l'authentification, le refresh token et les erreurs
 *
 * Fix P4: refreshPromise partagé → un seul refresh à la fois, tous les appelants attendent la même promesse
 * Fix P5: l'intercepteur de requête attend le refresh en cours au lieu de skip
 * Fix P7: timeout de sécurité augmenté de 10s à 25s
 */

import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { secureStorage, STORAGE_KEYS } from "../../utils/storage";
import { getApiUrl } from "../../config/apiUrl";
import { logger } from "../../utils/logger";

const API_URL = getApiUrl();
const TOKEN_REFRESH_THRESHOLD =
  Number(process.env.TOKEN_EXP_SOFT_REFRESH_SECONDS) || 60;
const REFRESH_TIMEOUT_MS = 25000; // P7: aligné avec le timeout Axios (30s)

logger.log("[axiosClient] 🌐 API_URL resolved to:", API_URL);

// État global pour gérer le refresh — UNE SEULE promesse partagée (P4+P5)
let refreshPromise: Promise<string | null> | null = null;

// File d'attente pour les requêtes 401 en cours de retry
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any = null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Création de l'instance Axios
const axiosClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    "x-client-type": "mobile", // Identifier l'app mobile pour le backend
  },
});

// Store pour le token en mémoire
let accessToken: string | null = null;
let expiresAt: number | null = null;

// Callback pour déconnecter l'utilisateur en cas d'échec de refresh
let onAuthFailureCallback: (() => void) | null = null;

export const setOnAuthFailure = (callback: () => void) => {
  onAuthFailureCallback = callback;
};

export const setAuthTokens = async (token: string, expiresIn: number) => {
  accessToken = token;
  expiresAt = Date.now() + expiresIn * 1000;
  // Stocker aussi dans le secure storage pour le WebSocket et la persistance
  try {
    await secureStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    await secureStorage.setItem(
      STORAGE_KEYS.TOKEN_EXPIRES_AT,
      expiresAt.toString(),
    );
    logger.log(
      "[axiosClient] ✅ Token stored with expiration:",
      new Date(expiresAt).toISOString(),
    );
  } catch (error) {
    logger.error("[axiosClient] Error storing access token:", error);
  }
};

export const getAccessToken = () => accessToken;

export const clearAuthTokens = async () => {
  accessToken = null;
  expiresAt = null;
  // Supprimer aussi du secure storage
  try {
    await secureStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
    await secureStorage.removeItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
  } catch (error) {
    logger.error("[axiosClient] Error clearing access token:", error);
  }
};

// Fonction de refresh du token (exportée pour le bootstrap auth centralisé)
// P4: Si un refresh est déjà en cours, retourne la même promesse → un seul appel /auth/refresh
export const refreshAccessToken = async (): Promise<string | null> => {
  // Si un refresh est déjà en cours, retourner la même promesse
  if (refreshPromise) {
    logger.log(
      "[axiosClient] 🔄 refreshAccessToken - Reusing existing refresh promise",
    );
    return refreshPromise;
  }

  refreshPromise = (async () => {
    try {
      logger.log("[axiosClient] 🔄 refreshAccessToken - Starting...");
      const refreshToken = await secureStorage.getItem(
        STORAGE_KEYS.REFRESH_TOKEN,
      );

      if (!refreshToken) {
        logger.error("[axiosClient] ❌ No refresh token available");
        throw new Error("No refresh token available");
      }

      logger.log("[axiosClient] 📡 Calling /auth/refresh endpoint...");
      const response = await axios.post(
        `${API_URL}/auth/refresh`,
        {
          refresh_token: refreshToken,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "x-client-type": "mobile",
          },
          timeout: REFRESH_TIMEOUT_MS,
        },
      );

      const {
        access_token,
        refresh_token: newRefreshToken,
        expires_in,
      } = response.data;

      // Mettre à jour les tokens
      await setAuthTokens(access_token, expires_in);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

      logger.log("[axiosClient] ✅ Tokens updated successfully");
      return access_token;
    } catch (error: any) {
      logger.error(
        "[axiosClient] ❌ refreshAccessToken failed:",
        error.message,
      );
      // Nettoyer les tokens en cas d'échec
      clearAuthTokens();
      await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);

      // Appeler le callback de déconnexion pour nettoyer Redux
      if (onAuthFailureCallback) {
        logger.log("[axiosClient] 🚪 Calling auth failure callback (logout)");
        onAuthFailureCallback();
      }

      throw error;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
};

// Intercepteur de requête
// P5: Si un refresh est en cours, TOUTES les requêtes attendent qu'il finisse (via refreshPromise)
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Ne pas ajouter de token pour les routes publiques
    if (
      config.url?.includes("/auth/login") ||
      config.url?.includes("/auth/refresh")
    ) {
      return config;
    }

    // P5: Si un refresh est en cours, attendre qu'il finisse avant de continuer
    if (refreshPromise) {
      logger.log(
        "[axiosClient] ⏳ Refresh in progress, waiting before sending:",
        config.url,
      );
      try {
        const freshToken = await refreshPromise;
        if (freshToken) {
          accessToken = freshToken;
        }
      } catch {
        // Le refresh a échoué, on continue quand même — l'intercepteur de réponse gérera le 401
      }
    }

    // Restaurer le token depuis le storage si pas en mémoire
    if (!accessToken) {
      try {
        const storedToken = await secureStorage.getItem(
          STORAGE_KEYS.ACCESS_TOKEN,
        );
        const storedExpiresAt = await secureStorage.getItem(
          STORAGE_KEYS.TOKEN_EXPIRES_AT,
        );

        if (storedToken && storedExpiresAt) {
          accessToken = storedToken;
          expiresAt = parseInt(storedExpiresAt, 10);

          // Vérifier si le token restauré est expiré
          if (expiresAt - Date.now() <= 0) {
            logger.log("[axiosClient] ⚠️ Restored token is expired");
            accessToken = null;
            expiresAt = null;
          }
        }

        // Si toujours pas de token, tenter un refresh
        if (!accessToken) {
          const refreshToken = await secureStorage.getItem(
            STORAGE_KEYS.REFRESH_TOKEN,
          );
          if (refreshToken) {
            logger.log("[axiosClient] 🔄 No valid access token, refreshing...");
            try {
              const newToken = await refreshAccessToken();
              if (newToken) {
                accessToken = newToken;
              }
            } catch (error) {
              logger.warn(
                "[axiosClient] ⚠️ Could not restore access token:",
                error,
              );
            }
          }
        }
      } catch (error) {
        logger.warn("[axiosClient] Error checking refresh token:", error);
      }
    }

    // Vérifier si le token expire bientôt ou est déjà expiré
    if (accessToken && expiresAt) {
      const timeUntilExpiration = expiresAt - Date.now();
      const isExpired = timeUntilExpiration <= 0;
      const shouldRefresh =
        timeUntilExpiration <= TOKEN_REFRESH_THRESHOLD * 1000;

      if (shouldRefresh || isExpired) {
        logger.log("[axiosClient] 🔄 Token expiring soon, refreshing...");
        try {
          const refreshToken = await secureStorage.getItem(
            STORAGE_KEYS.REFRESH_TOKEN,
          );
          if (!refreshToken) {
            if (isExpired) {
              await clearAuthTokens();
              throw new Error(
                "Access token expired and no refresh token available",
              );
            }
            return config;
          }

          const newToken = await refreshAccessToken();
          if (newToken) {
            accessToken = newToken;
          }
        } catch (error) {
          logger.error("[axiosClient] ❌ Token refresh failed:", error);
        }
      }
    }

    // Ajouter le token d'authentification
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    } else {
      logger.warn(
        "[axiosClient] ⚠️ No access token available for request:",
        config.url,
      );
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Intercepteur de réponse
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Ne pas essayer de refresh sur les routes d'authentification
    if (
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh")
    ) {
      return Promise.reject(error);
    }

    // Si erreur 401 et pas déjà en train de retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      logger.log("[axiosClient] 401 on:", originalRequest.url);

      // P5: Si un refresh est déjà en cours, attendre son résultat
      if (refreshPromise) {
        logger.log("[axiosClient] Refresh in progress, waiting...");
        try {
          const token = await refreshPromise;
          if (token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          originalRequest._retry = true;
          return axiosClient(originalRequest);
        } catch {
          return Promise.reject(error);
        }
      }

      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (newToken) {
          processQueue(null, newToken);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }

          return axiosClient(originalRequest);
        }
      } catch (refreshError: any) {
        logger.error(
          "[axiosClient] ❌ Token refresh failed:",
          refreshError.message,
        );
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosClient;
