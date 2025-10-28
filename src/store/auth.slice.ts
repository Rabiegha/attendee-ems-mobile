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
      const response = await authService.login(credentials);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Erreur de connexion');
    }
  }
);

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

export const checkAuthThunk = createAsyncThunk('auth/checkAuth', async () => {
  const isAuth = await authService.isAuthenticated();
  if (!isAuth) {
    throw new Error('Not authenticated');
  }
  return isAuth;
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
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.organization = action.payload.organization;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
      });

    // Logout
    builder
      .addCase(logoutThunk.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.organization = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
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
        state.isAuthenticated = false;
        state.user = null;
        state.organization = null;
      });
  },
});

export const { setUser, clearAuth, setError, clearError } = authSlice.actions;
export default authSlice.reducer;
