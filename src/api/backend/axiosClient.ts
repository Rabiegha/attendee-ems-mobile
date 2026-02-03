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
    await secureStorage.setItem(STORAGE_KEYS.TOKEN_EXPIRES_AT, expiresAt.toString());
    console.log('[axiosClient] ✅ Token stored with expiration:', new Date(expiresAt).toISOString());
  } catch (error) {
    console.error('[axiosClient] Error storing access token:', error);
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
    console.error('[axiosClient] Error clearing access token:', error);
  }
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
    await setAuthTokens(access_token, expires_in);
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
    
    // Appeler le callback de déconnexion pour nettoyer Redux
    if (onAuthFailureCallback) {
      console.log('[axiosClient] 🚪 Calling auth failure callback (logout)');
      onAuthFailureCallback();
    }
    
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

    // Restaurer le token et son expiration au premier appel si nécessaire
    if (!accessToken) {
      try {
        // Essayer de restaurer depuis le storage
        const storedToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedExpiresAt = await secureStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);
        
        if (storedToken && storedExpiresAt) {
          accessToken = storedToken;
          expiresAt = parseInt(storedExpiresAt, 10);
          console.log('[axiosClient] 📦 Restored token from storage, expires:', new Date(expiresAt).toISOString());
          
          // Vérifier immédiatement si le token restauré est expiré
          const timeUntilExpiration = expiresAt - Date.now();
          if (timeUntilExpiration <= 0) {
            console.log('[axiosClient] ⚠️ Restored token is expired, refreshing...');
            accessToken = null;
            expiresAt = null;
          }
        }
        
        // Si pas de token en mémoire, tenter le refresh
        if (!accessToken) {
          const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (refreshToken && !isRefreshing) {
            console.log('[axiosClient] 🔄 No valid access token, attempting restoration from refresh token...');
            isRefreshing = true;
            
            // Timeout de sécurité
            const refreshTimeout = setTimeout(() => {
              console.warn('[axiosClient] ⚠️ Refresh timeout, resetting flag');
              isRefreshing = false;
            }, 10000);
            
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
            } finally {
              isRefreshing = false;
            }
          }
        }
      } catch (error) {
        console.warn('[axiosClient] Error checking refresh token:', error);
      }
    }

    // Vérifier si le token expire bientôt ou est déjà expiré
    if (accessToken && expiresAt) {
      const timeUntilExpiration = expiresAt - Date.now();
      const isExpired = timeUntilExpiration <= 0;
      const shouldRefresh = timeUntilExpiration <= TOKEN_REFRESH_THRESHOLD * 1000;

      console.log('[axiosClient] Token expiration check:', {
        timeUntilExpiration: Math.round(timeUntilExpiration / 1000) + 's',
        isExpired,
        shouldRefresh,
      });

      if ((shouldRefresh || isExpired) && !isRefreshing) {
        console.log('[axiosClient] 🔄 Token expiring soon or expired, refreshing...');
        isRefreshing = true;
        try {
          const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) {
            console.warn('[axiosClient] No refresh token available for preventive refresh');
            isRefreshing = false;
            // Si le token est expiré et pas de refresh token, nettoyer et rejeter
            if (isExpired) {
              await clearAuthTokens();
              throw new Error('Access token expired and no refresh token available');
            }
            return config;
          }
          
          const newToken = await refreshAccessToken();
          if (newToken) {
            accessToken = newToken;
            console.log('[axiosClient] ✅ Token refreshed successfully');
          }
        } catch (error) {
          console.error('[axiosClient] ❌ Token refresh failed:', error);
          // Si le refresh échoue, laisser l'intercepteur de réponse gérer le 401
        } finally {
          isRefreshing = false;
        }
      }
    }

    // Ajouter le token d'authentification
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
      console.log('[axiosClient] ✅ Added Authorization header to request:', config.url);
    } else {
      console.warn('[axiosClient] ⚠️ No access token available for request:', config.url);
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
