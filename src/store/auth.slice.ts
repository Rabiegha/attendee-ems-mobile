/**
 * Redux slice pour l'authentification
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../api/backend/auth.service';
import { setAuthTokens, clearAuthTokens, refreshAccessToken } from '../api/backend/axiosClient';
import { LoginCredentials, User, Organization } from '../types/auth';
import { secureStorage, STORAGE_KEYS } from '../utils/storage';
import axiosClient, { getAccessToken } from '../api/backend/axiosClient';
import { decodeJwtPayload } from '../api/backend/auth.service';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isRestoringAuth: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  organization: null,
  isAuthenticated: false,
  isRestoringAuth: true,
  isLoading: false,
  error: null,
};

// Thunks
export const loginThunk = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      console.log('[AuthSlice] loginThunk - Starting login for:', credentials.email);
      const response = await authService.login(credentials);
      console.log('[AuthSlice] loginThunk - Login successful');
      return response;
    } catch (error: any) {
      const isNetworkError =
        error?.message === 'Network Error' ||
        error?.code === 'ERR_NETWORK' ||
        !error?.response;

      // Extraire le message d'erreur du serveur
      const errorMessage =
        (isNetworkError
          ? "Impossible de contacter l'API. Vérifiez EXPO_PUBLIC_API_URL et que le backend est démarré."
          : null) ||
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Erreur de connexion';
      
      console.error('[AuthSlice] loginThunk - Login failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: errorMessage,
      });
      
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    console.log('[AuthSlice] logoutThunk - Starting logout');
    await authService.logout();
    console.log('[AuthSlice] logoutThunk - Logout successful');
  } catch (error: any) {
    console.error('[AuthSlice] logoutThunk - Logout failed:', error);
    return rejectWithValue(error.message);
  }
});

// Guard pour empêcher les appels concurrents de restoreSession
let _isSessionRestoreInProgress = false;

/**
 * Thunk centralisé de restauration de session.
 * Remplace l'ancien checkAuthThunk + useTokenRestoration.
 * 
 * Flux :
 * 1. Vérifie qu'un refresh token existe
 * 2. Vérifie si l'access token en mémoire/storage est encore valide
 * 3. Si non → refresh via refreshAccessToken() (centralisé dans axiosClient)
 * 4. Charge le profil utilisateur frais
 * 5. Seulement APRÈS tout ça → isAuthenticated = true
 * 
 * Options :
 * - silent: true → ne pas afficher le splash (utilisé au retour foreground)
 */
export const restoreSessionThunk = createAsyncThunk(
  'auth/restoreSession',
  async (options: { silent?: boolean } | undefined, { dispatch, rejectWithValue }) => {
    _isSessionRestoreInProgress = true;
    try {
      console.log('[AuthSlice] restoreSession - Starting...', { silent: options?.silent });

      // 1. Vérifier qu'un refresh token existe en storage
      const storedRefreshToken = await secureStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      if (!storedRefreshToken) {
        console.log('[AuthSlice] restoreSession - No refresh token found');
        return rejectWithValue('No refresh token');
      }

      // 2. Vérifier si on a déjà un access token valide en mémoire
      let currentToken = getAccessToken();

      if (!currentToken) {
        // Tenter de restaurer depuis le SecureStore
        const storedToken = await secureStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedExpiresAt = await secureStorage.getItem(STORAGE_KEYS.TOKEN_EXPIRES_AT);

        if (storedToken && storedExpiresAt) {
          const expiresAt = parseInt(storedExpiresAt, 10);
          const timeLeft = expiresAt - Date.now();

          if (timeLeft > 5 * 60 * 1000) {
            // Token encore valide pour >5 min → restaurer en mémoire
            await setAuthTokens(storedToken, Math.round(timeLeft / 1000));
            currentToken = storedToken;
            console.log('[AuthSlice] restoreSession - Restored valid token from storage');
          }
        }
      }

      // 3. Si toujours pas de token valide, faire un refresh
      if (!currentToken) {
        console.log('[AuthSlice] restoreSession - No valid access token, refreshing...');
        currentToken = await refreshAccessToken();
        if (!currentToken) {
          return rejectWithValue('Token refresh returned null');
        }
        console.log('[AuthSlice] restoreSession - Token refreshed successfully');
      }

      // 4. Charger le profil utilisateur frais
      console.log('[AuthSlice] restoreSession - Fetching user profile...');
      const profileResult = await dispatch(fetchUserProfileThunk()).unwrap();

      console.log('[AuthSlice] restoreSession - Session restored successfully');
      return profileResult;
    } catch (error: any) {
      console.error('[AuthSlice] restoreSession - Failed:', error.message || error);
      return rejectWithValue(error.message || 'Session restoration failed');
    } finally {
      _isSessionRestoreInProgress = false;
    }
  },
  {
    condition: () => {
      if (_isSessionRestoreInProgress) {
        console.log('[AuthSlice] restoreSession - Already in progress, skipping');
        return false;
      }
      return true;
    },
  }
);

export const fetchUserProfileThunk = createAsyncThunk(
  'auth/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[AuthSlice] fetchUserProfileThunk - Fetching user profile...');
      const response = await axiosClient.get('/users/me');
      const raw = response.data;
      console.log('[AuthSlice] fetchUserProfileThunk - Profile fetched:', raw.email);

      // Mapper la réponse backend (snake_case + role objet) en User (camelCase + role string)
      const roleCode: string =
        typeof raw.role === 'string'
          ? raw.role
          : raw.role?.code || raw.roles?.[0] || 'VIEWER';

      // Extraire les permissions depuis le JWT (elles ne sont PAS dans /users/me)
      const currentToken = getAccessToken();
      const jwtPayload = currentToken ? decodeJwtPayload(currentToken) : {};
      const permissions: string[] = jwtPayload.permissions || raw.permissions || [];

      const mappedUser = {
        id: raw.id,
        email: raw.email,
        firstName: raw.first_name || raw.firstName || '',
        lastName: raw.last_name || raw.lastName || '',
        role: roleCode,
        organizationId: raw.org_id || raw.organizationId || '',
        permissions,
        createdAt: raw.created_at || raw.createdAt || '',
        updatedAt: raw.updated_at || raw.updatedAt || '',
      };

      const mappedOrganization = raw.organization
        ? {
            id: raw.organization.id,
            name: raw.organization.name,
            slug: raw.organization.slug,
            createdAt: raw.organization.created_at || '',
            updatedAt: raw.organization.updated_at || '',
          }
        : null;

      console.log('[AuthSlice] fetchUserProfileThunk - Mapped role:', mappedUser.role);
      return { user: mappedUser, organization: mappedOrganization };
    } catch (error: any) {
      console.error('[AuthSlice] fetchUserProfileThunk - Error:', {
        message: error.message,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    clearAuth: (state) => {
      state.user = null;
      state.organization = null;
      state.isAuthenticated = false;
      state.isRestoringAuth = false;
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
    builder
      .addCase(loginThunk.pending, (state) => {
        console.log('[AuthSlice] loginThunk.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        console.log('[AuthSlice] loginThunk.fulfilled - User:', action.payload.user.email);
        state.isLoading = false;
        state.user = action.payload.user;
        state.organization = action.payload.organization;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        console.warn('[AuthSlice] loginThunk.rejected:', action.payload || action.error?.message);
        state.isLoading = false;
        state.error = (action.payload as string) || action.error?.message || 'Erreur de connexion';
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutThunk.pending, (state) => {
        console.log('[AuthSlice] logoutThunk.pending');
        state.isLoading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        console.log('[AuthSlice] logoutThunk.fulfilled');
        state.isLoading = false;
        state.user = null;
        state.organization = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
        console.warn('[AuthSlice] logoutThunk.rejected - Forcing logout anyway');
        state.isLoading = false;
        // Même en cas d'erreur, on déconnecte l'utilisateur
        state.user = null;
        state.organization = null;
        state.isAuthenticated = false;
      });

    // Restore session (bootstrap + foreground)
    builder
      .addCase(restoreSessionThunk.pending, (state, action) => {
        // Ne montrer le splash que pour le bootstrap initial, pas les re-vérifications silencieuses
        if (!action.meta.arg?.silent) {
          state.isRestoringAuth = true;
        }
      })
      .addCase(restoreSessionThunk.fulfilled, (state) => {
        state.isRestoringAuth = false;
        // isAuthenticated, user, organization sont déjà mis à jour par fetchUserProfileThunk.fulfilled
      })
      .addCase(restoreSessionThunk.rejected, (state, action) => {
        state.isRestoringAuth = false;
        // Ne nettoyer l'état que pour le bootstrap initial
        // Les re-vérifications silencieuses (foreground) gardent l'état actuel
        if (!action.meta.arg?.silent) {
          state.isAuthenticated = false;
          state.user = null;
          state.organization = null;
        }
      });

    // Fetch user profile
    builder
      .addCase(fetchUserProfileThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchUserProfileThunk.fulfilled, (state, action) => {
        console.log('[AuthSlice] fetchUserProfileThunk.fulfilled - User:', action.payload.user.email, 'Role:', action.payload.user.role);
        state.isLoading = false;
        state.user = action.payload.user;
        state.organization = action.payload.organization;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(fetchUserProfileThunk.rejected, (state, action) => {
        console.error('[AuthSlice] fetchUserProfileThunk.rejected:', action.payload);
        state.isLoading = false;
        
        // Si l'utilisateur a déjà des données (redux-persist), ne pas les effacer
        // Cela permet de continuer à utiliser l'app même avec un problème réseau temporaire
        if (!state.user || !state.organization) {
          console.warn('[AuthSlice] No cached user data, clearing auth state');
          state.isAuthenticated = false;
          state.user = null;
          state.organization = null;
        } else {
          console.log('[AuthSlice] User data exists in cache, keeping auth state');
          // Garder l'état d'authentification car les données sont déjà en cache
        }
      });
  },
});

export const { setUser, clearAuth, setError, clearError } = authSlice.actions;

// Selectors
export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated;

export default authSlice.reducer;
