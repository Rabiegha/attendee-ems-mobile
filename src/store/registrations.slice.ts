/**
 * Redux slice pour les registrations (inscriptions aux événements)
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { registrationsService } from '../api/backend/registrations.service';
import { Registration } from '../types/attendee';

interface RegistrationsState {
  registrations: Registration[];
  currentRegistration: Registration | null;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: RegistrationsState = {
  registrations: [],
  currentRegistration: null,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
};

// Thunks
export const fetchRegistrationsThunk = createAsyncThunk(
  'registrations/fetchRegistrations',
  async (params: {
    eventId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }, { rejectWithValue }) => {
    try {
      console.log('[RegistrationsSlice] fetchRegistrationsThunk - Starting with params:', params);
      
      // Extraire eventId et garder seulement les query params
      const { eventId, ...queryParams } = params;
      
      const response = await registrationsService.getRegistrations(eventId, queryParams);
      console.log('[RegistrationsSlice] fetchRegistrationsThunk - Success:', response.meta);
      return response;
    } catch (error: any) {
      console.error('[RegistrationsSlice] fetchRegistrationsThunk - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMoreRegistrationsThunk = createAsyncThunk(
  'registrations/fetchMoreRegistrations',
  async (params: {
    eventId: string;
    search?: string;
    status?: string;
  }, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { registrations: RegistrationsState };
      
      const nextPage = state.registrations.pagination.page + 1;
      const limit = state.registrations.pagination.limit;
      
      const queryParams: any = {
        page: nextPage,
        limit,
        search: params.search,
        status: params.status,
      };
      
      console.log('[RegistrationsSlice] fetchMoreRegistrationsThunk - Loading page', nextPage);
      const response = await registrationsService.getRegistrations(params.eventId, queryParams);
      console.log('[RegistrationsSlice] fetchMoreRegistrationsThunk - Success:', response.meta);
      return response;
    } catch (error: any) {
      console.error('[RegistrationsSlice] fetchMoreRegistrationsThunk - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchRegistrationByIdThunk = createAsyncThunk(
  'registrations/fetchRegistrationById',
  async (params: { eventId: string; registrationId: string }, { rejectWithValue }) => {
    try {
      console.log('[RegistrationsSlice] fetchRegistrationByIdThunk - Starting:', params);
      const response = await registrationsService.getRegistrationById(params.eventId, params.registrationId);
      console.log('[RegistrationsSlice] fetchRegistrationByIdThunk - Success:', response.id);
      return response;
    } catch (error: any) {
      console.error('[RegistrationsSlice] fetchRegistrationByIdThunk - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const checkInRegistrationThunk = createAsyncThunk(
  'registrations/checkInRegistration',
  async (params: { eventId: string; registrationId: string }, { rejectWithValue }) => {
    try {
      console.log('[RegistrationsSlice] checkInRegistrationThunk - Starting:', params);
      const response = await registrationsService.checkInRegistration(params.eventId, params.registrationId);
      console.log('[RegistrationsSlice] checkInRegistrationThunk - Success:', response.status);
      return response;
    } catch (error: any) {
      console.error('[RegistrationsSlice] checkInRegistrationThunk - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const markBadgePrintedThunk = createAsyncThunk(
  'registrations/markBadgePrinted',
  async (params: { eventId: string; registrationId: string }, { rejectWithValue }) => {
    try {
      console.log('[RegistrationsSlice] markBadgePrintedThunk - Starting:', params);
      const response = await registrationsService.markBadgePrinted(params.eventId, params.registrationId);
      console.log('[RegistrationsSlice] markBadgePrintedThunk - Success');
      return response;
    } catch (error: any) {
      console.error('[RegistrationsSlice] markBadgePrintedThunk - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Slice
const registrationsSlice = createSlice({
  name: 'registrations',
  initialState,
  reducers: {
    setCurrentRegistration: (state, action: PayloadAction<Registration | null>) => {
      state.currentRegistration = action.payload;
    },
    clearRegistrations: (state) => {
      state.registrations = [];
      state.currentRegistration = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch registrations
    builder
      .addCase(fetchRegistrationsThunk.pending, (state) => {
        console.log('[RegistrationsSlice] fetchRegistrationsThunk.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRegistrationsThunk.fulfilled, (state, action) => {
        console.log('[RegistrationsSlice] fetchRegistrationsThunk.fulfilled - Loaded', action.payload.data.length, 'registrations');
        state.isLoading = false;
        state.registrations = action.payload.data;
        state.pagination = action.payload.meta;
        state.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchRegistrationsThunk.rejected, (state, action) => {
        console.error('[RegistrationsSlice] fetchRegistrationsThunk.rejected:', action.payload || action.error);
        state.isLoading = false;
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement des inscriptions';
      });

    // Fetch more registrations (pagination)
    builder
      .addCase(fetchMoreRegistrationsThunk.pending, (state) => {
        console.log('[RegistrationsSlice] fetchMoreRegistrationsThunk.pending');
        state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(fetchMoreRegistrationsThunk.fulfilled, (state, action) => {
        console.log('[RegistrationsSlice] fetchMoreRegistrationsThunk.fulfilled - Loaded', action.payload.data.length, 'more registrations');
        state.isLoadingMore = false;
        
        // Déduplication
        const existingIds = new Set(state.registrations.map((r: Registration) => r.id));
        const newRegistrations = action.payload.data.filter((r: Registration) => !existingIds.has(r.id));
        state.registrations = [...state.registrations, ...newRegistrations];
        
        state.pagination = action.payload.meta;
        state.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchMoreRegistrationsThunk.rejected, (state, action) => {
        console.error('[RegistrationsSlice] fetchMoreRegistrationsThunk.rejected:', action.payload || action.error);
        state.isLoadingMore = false;
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement';
      });

    // Fetch registration by ID
    builder
      .addCase(fetchRegistrationByIdThunk.pending, (state) => {
        console.log('[RegistrationsSlice] fetchRegistrationByIdThunk.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRegistrationByIdThunk.fulfilled, (state, action) => {
        console.log('[RegistrationsSlice] fetchRegistrationByIdThunk.fulfilled - Registration:', action.payload.id);
        state.isLoading = false;
        state.currentRegistration = action.payload;
      })
      .addCase(fetchRegistrationByIdThunk.rejected, (state, action) => {
        console.error('[RegistrationsSlice] fetchRegistrationByIdThunk.rejected:', action.payload || action.error);
        state.isLoading = false;
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement de l\'inscription';
      });

    // Check-in
    builder
      .addCase(checkInRegistrationThunk.pending, (state) => {
        console.log('[RegistrationsSlice] checkInRegistrationThunk.pending');
      })
      .addCase(checkInRegistrationThunk.fulfilled, (state, action) => {
        console.log('[RegistrationsSlice] checkInRegistrationThunk.fulfilled - Registration checked in:', action.payload.id);
        const index = state.registrations.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.registrations[index] = action.payload;
          console.log('[RegistrationsSlice] Updated registration in list at index:', index);
        }
        if (state.currentRegistration?.id === action.payload.id) {
          state.currentRegistration = action.payload;
          console.log('[RegistrationsSlice] Updated current registration');
        }
      })
      .addCase(checkInRegistrationThunk.rejected, (state, action) => {
        console.error('[RegistrationsSlice] checkInRegistrationThunk.rejected:', action.payload || action.error);
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du check-in';
      });

    // Mark badge printed
    builder
      .addCase(markBadgePrintedThunk.pending, (state) => {
        console.log('[RegistrationsSlice] markBadgePrintedThunk.pending');
      })
      .addCase(markBadgePrintedThunk.fulfilled, (state, action) => {
        console.log('[RegistrationsSlice] markBadgePrintedThunk.fulfilled - Badge printed for:', action.payload.id);
        const index = state.registrations.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.registrations[index] = action.payload;
          console.log('[RegistrationsSlice] Updated registration in list at index:', index);
        }
        if (state.currentRegistration?.id === action.payload.id) {
          state.currentRegistration = action.payload;
          console.log('[RegistrationsSlice] Updated current registration');
        }
      })
      .addCase(markBadgePrintedThunk.rejected, (state, action) => {
        console.error('[RegistrationsSlice] markBadgePrintedThunk.rejected:', action.payload || action.error);
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors de l\'impression du badge';
      });
  },
});

export const { setCurrentRegistration, clearRegistrations, clearError } = registrationsSlice.actions;
export default registrationsSlice.reducer;
