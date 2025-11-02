/**
 * Client Axios centralisé avec intercepteurs
 * Gère l'authentification, le refresh token et les erreurs
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { secureStorage, STORAGE_KEYS } from '../../utils/storage';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
const TOKEN_REFRESH_THRESHOLD = Number(process.env.TOKEN_EXP_SOFT_REFRESH_SECONDS) || 60;

// État global pour gérer le refresh
let isRefreshing = false;
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
    'Content-Type': 'application/json',
    'x-client-type': 'mobile', // Identifier l'app mobile pour le backend
  },
});

// Store pour le token en mémoire
let accessToken: string | null = null;
let expiresAt: number | null = null;

export const setAuthTokens = (token: string, expiresIn: number) => {
  accessToken = token;
  expiresAt = Date.now() + expiresIn * 1000;
};

export const getAccessToken = () => accessToken;

export const clearAuthTokens = () => {
  accessToken = null;
  expiresAt = null;
};

// Fonction de refresh du token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    console.log('[axiosClient] 🔄 refreshAccessToken - Starting...');
    const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    
    console.log('[axiosClient] refreshAccessToken - Refresh token from storage:', refreshToken ? 'EXISTS' : 'NULL');
    
    if (!refreshToken) {
      console.error('[axiosClient] ❌ No refresh token available');
      throw new Error('No refresh token available');
    }

    console.log('[axiosClient] 📡 Calling /auth/refresh endpoint...');
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-type': 'mobile',
      },
    });

    console.log('[axiosClient] ✅ Refresh response received:', {
      status: response.status,
      hasAccessToken: !!response.data.access_token,
      hasRefreshToken: !!response.data.refresh_token,
    });

    const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;

    // Mettre à jour les tokens
    setAuthTokens(access_token, expires_in);
    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

    console.log('[axiosClient] ✅ Tokens updated successfully');
    return access_token;
  } catch (error: any) {
    console.error('[axiosClient] ❌ refreshAccessToken failed:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
    });
    // Nettoyer les tokens en cas d'échec
    clearAuthTokens();
    await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    throw error;
  }
};

// Intercepteur de requête
axiosClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Ne pas ajouter de token pour les routes publiques
    if (config.url?.includes('/auth/login') || config.url?.includes('/auth/refresh')) {
      return config;
    }

    // Restaurer le token au premier appel si nécessaire
    // On vérifie si on n'a pas de token en mémoire mais qu'on a un refresh token en storage
    if (!accessToken) {
      try {
        const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        if (refreshToken && !isRefreshing) {
          console.log('[axiosClient] 🔄 No access token in memory, attempting restoration from refresh token...');
          isRefreshing = true;
          
          // Timeout de sécurité pour éviter que isRefreshing reste bloqué
          const refreshTimeout = setTimeout(() => {
            console.warn('[axiosClient] ⚠️ Refresh timeout, resetting flag');
            isRefreshing = false;
          }, 10000); // 10 secondes max
          
          try {
            const newToken = await refreshAccessToken();
            clearTimeout(refreshTimeout);
            if (newToken) {
              accessToken = newToken;
              console.log('[axiosClient] ✅ Access token restored successfully');
            }
          } catch (error) {
            clearTimeout(refreshTimeout);
            console.warn('[axiosClient] ⚠️ Could not restore access token:', error);
            // Si la restauration échoue, continuer sans token (401 sera géré par l'intercepteur de réponse)
          } finally {
            isRefreshing = false;
          }
        } else if (isRefreshing) {
          console.log('[axiosClient] ⏳ Refresh already in progress, waiting...');
        }
      } catch (error) {
        console.warn('[axiosClient] Error checking refresh token:', error);
      }
    }

    // Vérifier si le token expire bientôt
    if (accessToken && expiresAt) {
      const timeUntilExpiration = expiresAt - Date.now();
      const shouldRefresh = timeUntilExpiration <= TOKEN_REFRESH_THRESHOLD * 1000;

      if (shouldRefresh && !isRefreshing) {
        isRefreshing = true;
        try {
          const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) {
            console.warn('[axiosClient] No refresh token available for preventive refresh');
            isRefreshing = false;
            return config;
          }
          
          const newToken = await refreshAccessToken();
          if (newToken) {
            accessToken = newToken;
          }
        } catch (error) {
          console.error('Échec du refresh préventif:', error);
        } finally {
          isRefreshing = false;
        }
      }
    }

    // Ajouter le token d'authentification
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur de réponse
axiosClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    console.log('[axiosClient] ⚠️ Response error:', {
      status: error.response?.status,
      url: originalRequest.url,
      retry: originalRequest._retry,
    });

    // Ne pas essayer de refresh sur les routes d'authentification
    if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
      console.log('[axiosClient] Auth endpoint error, not retrying');
      return Promise.reject(error);
    }

    // Si erreur 401 et pas déjà en train de retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[axiosClient] 401 Unauthorized - Attempting token refresh...');
      
      if (isRefreshing) {
        console.log('[axiosClient] Refresh already in progress, queuing request...');
        // Si un refresh est déjà en cours, mettre en queue
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return axiosClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        console.log('[axiosClient] Starting token refresh...');
        const newToken = await refreshAccessToken();
        
        if (newToken) {
          console.log('[axiosClient] ✅ Token refreshed, retrying original request');
          processQueue(null, newToken);
          
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          
          return axiosClient(originalRequest);
        }
      } catch (refreshError: any) {
        console.error('[axiosClient] ❌ Token refresh failed:', refreshError.message);
        processQueue(refreshError, null);
        // Rediriger vers login (sera géré par Redux)
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default axiosClient;
