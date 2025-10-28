/**
 * Service d'authentification
 */

import axiosClient, { setAuthTokens, clearAuthTokens } from './axiosClient';
import { secureStorage, STORAGE_KEYS } from '../utils/storage';
import { LoginCredentials, LoginResponse, RefreshTokenResponse } from '../types/auth';

export const authService = {
  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await axiosClient.post<LoginResponse>('/auth/login', credentials);
    const { access_token, refresh_token, expires_in } = response.data;

    console.log('[authService.login] Response data:', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      expiresIn: expires_in,
    });

    if (!refresh_token) {
      throw new Error('No refresh token received from server');
    }

    // Stocker les tokens
    setAuthTokens(access_token, expires_in);
    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refresh_token);

    console.log('[authService.login] Tokens stored successfully');

    return response.data;
  },

  /**
   * Refresh du token
   */
  async refresh(refreshToken: string): Promise<RefreshTokenResponse> {
    const response = await axiosClient.post<RefreshTokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    
    const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;

    // Mettre à jour les tokens
    setAuthTokens(access_token, expires_in);
    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

    return response.data;
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      // Appeler l'endpoint de logout si disponible
      await axiosClient.post('/auth/logout');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      // Nettoyer les tokens localement
      clearAuthTokens();
      await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  },

  /**
   * Vérifier si l'utilisateur est authentifié
   */
  async isAuthenticated(): Promise<boolean> {
    const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    return !!refreshToken;
  },
};
