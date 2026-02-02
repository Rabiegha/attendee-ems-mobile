/**
 * Hook pour restaurer le token au démarrage de l'app
 */

import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { setAuthTokens, getAccessToken } from '../api/backend/axiosClient';
import { secureStorage, STORAGE_KEYS } from '../utils/storage';
import { useAppDispatch } from '../store/hooks';
import { fetchUserProfileThunk, clearAuth } from '../store/auth.slice';
import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

let isRestoring = false; // Flag global pour éviter les restaurations multiples

const restoreToken = async (dispatch: any, getState: any) => {
  console.log('[useTokenRestoration] 🎯 restoreToken() called');
  console.log('[useTokenRestoration] isRestoring:', isRestoring);
  
  if (isRestoring) {
    console.log('[useTokenRestoration] ⏳ Restoration already in progress, skipping...');
    return;
  }

  // Vérifier si Redux a déjà les données (redux-persist les a restaurées)
  const state = getState();
  const hasUserData = state.auth.user && state.auth.organization;
  console.log('[useTokenRestoration] Redux state:', {
    hasUser: !!state.auth.user,
    hasOrg: !!state.auth.organization,
    isAuthenticated: state.auth.isAuthenticated,
  });

  // Vérifier si on a déjà un token en mémoire
  const currentToken = getAccessToken();
  console.log('[useTokenRestoration] Current token in memory:', currentToken ? 'EXISTS' : 'NULL');
  
  if (currentToken && hasUserData) {
    console.log('[useTokenRestoration] ✅ Access token and user data already available (from cache), skipping restoration');
    return;
  }
  
  if (currentToken && !hasUserData) {
    console.log('[useTokenRestoration] ✅ Access token in memory but no user data, fetching user profile...');
    // Token existe mais pas de données utilisateur, récupérer le profil
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
    await setAuthTokens(access_token, expires_in);
    
    // Vérifier que le token est bien en mémoire
    const tokenCheck = getAccessToken();
    console.log('[useTokenRestoration] 🔍 Token in memory after setAuthTokens:', tokenCheck ? 'EXISTS (' + tokenCheck.substring(0, 20) + '...)' : 'NULL');
    
    console.log('[useTokenRestoration] 💾 Saving new refresh token to storage...');
    await secureStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, newRefreshToken);

    console.log('[useTokenRestoration] ✅ Token restored successfully');
    
    // Petit délai pour s'assurer que le token est bien propagé
    // (évite les race conditions avec l'intercepteur axios)
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Mettre à jour Redux pour restaurer l'état d'authentification
    console.log('[useTokenRestoration] 🔄 Dispatching fetchUserProfileThunk to load user data...');
    const profileResult = await dispatch(fetchUserProfileThunk());
    
    if (profileResult.type.endsWith('/fulfilled')) {
      console.log('[useTokenRestoration] ✅ User profile loaded successfully');
    } else {
      console.error('[useTokenRestoration] ⚠️ Failed to load user profile, but keeping token:', profileResult);
      // NE PAS déconnecter l'utilisateur ici - il peut s'agir d'un problème réseau temporaire
      // L'intercepteur axios va gérer les 401 et appeler clearAuth() si nécessaire
    }

  } catch (error: any) {
    console.error('[useTokenRestoration] ❌ Failed to restore token:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
    });
    
    // Si le refresh échoue, nettoyer le refresh token invalide et déconnecter
    if (error.response?.status === 401) {
      console.log('[useTokenRestoration] 🗑️ Refresh token expired, clearing storage and auth state');
      await secureStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      // Déconnecter l'utilisateur automatiquement
      dispatch(clearAuth());
    }
  } finally {
    isRestoring = false;
    console.log('[useTokenRestoration] 🔓 Set isRestoring = false');
  }
};

export const useTokenRestoration = () => {
  const dispatch = useAppDispatch();
  const appState = useRef(AppState.currentState);
  const hasRestoredOnce = useRef(false);

  useEffect(() => {
    // Importer store dynamiquement pour avoir accès à getState
    const { store } = require('../store');
    
    // Restaurer au montage initial (une seule fois)
    if (!hasRestoredOnce.current) {
      console.log('[useTokenRestoration] 🚀 Hook mounted, attempting token restoration...');
      hasRestoredOnce.current = true;
      restoreToken(dispatch, store.getState);
    }

    // Écouter les changements d'état de l'app (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('[useTokenRestoration] 📱 App came to foreground, checking token...');
        restoreToken(dispatch, store.getState);
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [dispatch]); // Dépendance dispatch uniquement
};
