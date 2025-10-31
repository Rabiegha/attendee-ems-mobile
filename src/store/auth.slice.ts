/**
 * Redux slice pour l'authentification
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../api/auth.service';
import { setAuthTokens, clearAuthTokens } from '../api/axiosClient';
import { LoginCredentials, User, Organization } from '../types/auth';
import { secureStorage, STORAGE_KEYS } from '../utils/storage';

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
    console.log('[AuthSlice] checkAuthThunk - Checking authentication');
    const isAuth = await authService.isAuthenticated();
    if (!isAuth) {
      console.log('[AuthSlice] checkAuthThunk - Not authenticated');
      throw new Error('Not authenticated');
    }
    console.log('[AuthSlice] checkAuthThunk - User is authenticated');
    return isAuth;
  } catch (error: any) {
    console.error('[AuthSlice] checkAuthThunk - Error:', error);
    return rejectWithValue(error.message);
  }
});

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
        console.log('[AuthSlice] checkAuthThunk.fulfilled');
        state.isAuthenticated = true;
      })
      .addCase(checkAuthThunk.rejected, (state) => {
        console.log('[AuthSlice] checkAuthThunk.rejected');
        state.isAuthenticated = false;
        state.user = null;
        state.organization = null;
      });
  },
});

export const { setUser, clearAuth, setError, clearError } = authSlice.actions;
export default authSlice.reducer;
