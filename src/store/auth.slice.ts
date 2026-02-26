/**
 * Redux slice pour l'authentification
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../api/backend/auth.service';
import { setAuthTokens, clearAuthTokens } from '../api/backend/axiosClient';
import { LoginCredentials, User, Organization } from '../types/auth';
import { secureStorage, STORAGE_KEYS } from '../utils/storage';
import axiosClient, { getAccessToken } from '../api/backend/axiosClient';
import { decodeJwtPayload } from '../api/backend/auth.service';

interface AuthState {
  user: User | null;
  organization: Organization | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  organization: null,
  isAuthenticated: false,
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
      // Extraire le message d'erreur du serveur
      const errorMessage = 
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

export const checkAuthThunk = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      // Pas d'erreur, c'est normal de ne pas être authentifié au premier lancement
      throw new Error('Not authenticated');
    }
    console.log('[AuthSlice] ✓ User is authenticated');
    return isAuth;
  } catch (error: any) {
    // Silent fail - c'est normal de ne pas être authentifié au démarrage
    return rejectWithValue(error.message);
  }
});

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
        console.error('[AuthSlice] loginThunk.rejected:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
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

    // Check auth
    builder
      .addCase(checkAuthThunk.fulfilled, (state) => {
        state.isAuthenticated = true;
      })
      .addCase(checkAuthThunk.rejected, (state) => {
        // Silent - pas d'erreur affichée, c'est normal de ne pas être authentifié
        state.isAuthenticated = false;
        state.user = null;
        state.organization = null;
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
