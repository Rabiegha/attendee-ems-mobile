/**
 * Hook pour restaurer le token au démarrage de l'app
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { setAuthTokens, getAccessToken } from '../api/backend/axiosClient';
import { secureStorage, STORAGE_KEYS } from '../utils/storage';
import { useAppDispatch } from '../store/hooks';
import { fetchUserProfileThunk } from '../store/auth.slice';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let isRestoring = false; // Flag global pour éviter les restaurations multiples

const restoreToken = async (dispatch: any) => {
  console.log('[useTokenRestoration] 🎯 restoreToken() called');
  console.log('[useTokenRestoration] isRestoring:', isRestoring);
  
  if (isRestoring) {
    console.log('[useTokenRestoration] ⏳ Restoration already in progress, skipping...');
    return;
  }

  // Vérifier si on a déjà un token en mémoire
  const currentToken = getAccessToken();
  console.log('[useTokenRestoration] Current token in memory:', currentToken ? 'EXISTS' : 'NULL');
  
  if (currentToken) {
    console.log('[useTokenRestoration] ✅ Access token already in memory, fetching user profile...');
    // Même si le token existe, récupérer le profil utilisateur pour mettre à jour Redux
    dispatch(fetchUserProfileThunk());
    return;
  }

  isRestoring = true;
  console.log('[useTokenRestoration] 🔒 Set isRestoring = true');

  try {
    console.log('[useTokenRestoration] 🔄 Attempting to restore access token...');
    
    const refreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    console.log('[useTokenRestoration] Refresh token from storage:', refreshToken ? 'EXISTS (' + refreshToken.substring(0, 20) + '...)' : 'NULL');
    
    if (!refreshToken) {
      console.log('[useTokenRestoration] ⚠️ No refresh token found, user needs to login');
      isRestoring = false;
      return;
    }

    console.log('[useTokenRestoration] 📡 Calling /auth/refresh with existing refresh token...');
    console.log('[useTokenRestoration] API_URL:', API_URL);
    
    const response = await axios.post(`${API_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-client-type': 'mobile',
      },
    });

    console.log('[useTokenRestoration] 📥 Response status:', response.status);
    console.log('[useTokenRestoration] Response data:', {
      hasAccessToken: !!response.data.access_token,
      hasRefreshToken: !!response.data.refresh_token,
      expiresIn: response.data.expires_in,
    });

    const { access_token, refresh_token: newRefreshToken, expires_in } = response.data;

    console.log('[useTokenRestoration] 💾 Calling setAuthTokens...');
    // Mettre à jour les tokens
    setAuthTokens(access_token, expires_in);
    
    console.log('[useTokenRestoration] 💾 Saving new refresh token to storage...');
    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

    console.log('[useTokenRestoration] ✅ Token restored successfully');
    
    // Mettre à jour Redux pour restaurer l'état d'authentification
    console.log('[useTokenRestoration] 🔄 Dispatching fetchUserProfileThunk to load user data...');
    dispatch(fetchUserProfileThunk());

  } catch (error: any) {
    console.error('[useTokenRestoration] ❌ Failed to restore token:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    // Si le refresh échoue, nettoyer le refresh token invalide
    if (error.response?.status === 401) {
      console.log('[useTokenRestoration] 🗑️ Refresh token expired, clearing storage');
      await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
    }
  } finally {
    isRestoring = false;
    console.log('[useTokenRestoration] 🔓 Set isRestoring = false');
  }
};

export const useTokenRestoration = () => {
  const dispatch = useAppDispatch();
  const appState = useRef(AppState.currentState);
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current += 1;
    
    // Restaurer au montage initial
    console.log('[useTokenRestoration] 🚀 Hook effect triggered (render #' + renderCount.current + ')');
    
    // TOUJOURS tenter une restauration au montage/remontage du composant
    // Cela couvre aussi le hot reload en dev
    restoreToken(dispatch);

    // Écouter les changements d'état de l'app (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[useTokenRestoration] 📱 App came to foreground, checking token...');
        restoreToken(dispatch);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }); // PAS de dépendances → s'exécute à chaque render (pour capturer le hot reload)
};
