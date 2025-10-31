/**
 * Service d'authentification
 */

import axiosClient, { setAuthTokens, clearAuthTokens } from './axiosClient';
import { secureStorage, STORAGE_KEYS } from '../../utils/storage';
import { LoginCredentials, LoginResponse, RefreshTokenResponse } from '../../types/auth';

export const authService = {
  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('[AuthService] Login attempt for:', credentials.email);
      
      const response = await axiosClient.post<LoginResponse>('/auth/login', credentials);
      const { access_token, refresh_token, expires_in } = response.data;

      console.log('[AuthService] Login successful:', {
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token,
        expiresIn: expires_in,
      });

      if (!refresh_token) {
        const error = new Error('No refresh token received from server');
        console.error('[AuthService] Login failed:', error.message);
        throw error;
      }

      // S'assurer que le refresh_token est une string
      const refreshTokenString = typeof refresh_token === 'string' 
        ? refresh_token 
        : JSON.stringify(refresh_token);

      // Stocker les tokens
      setAuthTokens(access_token, expires_in);
      
      try {
        await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshTokenString);
        console.log('[AuthService] Tokens stored successfully');
      } catch (storageError) {
        console.error('[AuthService] Error storing refresh token:', storageError);
        throw storageError;
      }

      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Login failed:', {
        email: credentials.email,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Refresh du token
   */
  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      console.log('[AuthService] Refreshing token');
      
      const response = await axiosClient.post<RefreshTokenResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });
      
      const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;

      console.log('[AuthService] Token refreshed successfully:', {
        hasAccessToken: !!access_token,
        hasRefreshToken: !!newRefreshToken,
      });

      // S'assurer que le refresh_token est une string
      const refreshTokenString = typeof newRefreshToken === 'string' 
        ? newRefreshToken 
        : JSON.stringify(newRefreshToken);

      // Mettre à jour les tokens
      setAuthTokens(access_token, expires_in);
      await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshTokenString);

      return response.data;
    } catch (error: any) {
      console.error('[AuthService] Token refresh failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      console.log('[AuthService] Logging out');
      // Appeler l'endpoint de logout si disponible
      await axiosClient.post('/auth/logout');
      console.log('[AuthService] Logout successful');
    } catch (error: any) {
      console.error('[AuthService] Logout API call failed:', error.response?.data || error.message);
    } finally {
      // Nettoyer les tokens localement
      clearAuthTokens();
      await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      console.log('[AuthService] Tokens cleared from storage');
    }
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  async isAuthenticated(): Promise<boolean> {
    try {
      const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const isAuth = !!refreshToken;
      console.log('[AuthService] isAuthenticated:', isAuth);
      return isAuth;
    } catch (error) {
      console.error('[AuthService] Error checking authentication:', error);
      return false;
    }
  },
};
