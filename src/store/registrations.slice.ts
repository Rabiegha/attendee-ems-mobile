/**
 * Redux slice pour les registrations (inscriptions aux événements)
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { registrationsService } from '../api/registrations.service';
import { Registration } from '../types/attendee';

interface RegistrationsState {
  registrations: Registration[];
  currentRegistration: Registration | null;
  isLoading: boolean;
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
  }) => {
    const response = await registrationsService.getRegistrations(params.eventId, params);
    return response;
  }
);

export const fetchRegistrationByIdThunk = createAsyncThunk(
  'registrations/fetchRegistrationById',
  async (params: { eventId: string; registrationId: string }) => {
    const response = await registrationsService.getRegistrationById(params.eventId, params.registrationId);
    return response;
  }
);

export const checkInRegistrationThunk = createAsyncThunk(
  'registrations/checkInRegistration',
  async (params: { eventId: string; registrationId: string }) => {
    const response = await registrationsService.checkInRegistration(params.eventId, params.registrationId);
    return response;
  }
);

export const markBadgePrintedThunk = createAsyncThunk(
  'registrations/markBadgePrinted',
  async (params: { eventId: string; registrationId: string }) => {
    const response = await registrationsService.markBadgePrinted(params.eventId, params.registrationId);
    return response;
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
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRegistrationsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.registrations = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchRegistrationsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Erreur lors du chargement des inscriptions';
      });

    // Fetch registration by ID
    builder
      .addCase(fetchRegistrationByIdThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchRegistrationByIdThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRegistration = action.payload;
      })
      .addCase(fetchRegistrationByIdThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Erreur lors du chargement de l\'inscription';
      });

    // Check-in
    builder
      .addCase(checkInRegistrationThunk.fulfilled, (state, action) => {
        const index = state.registrations.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.registrations[index] = action.payload;
        }
        if (state.currentRegistration?.id === action.payload.id) {
          state.currentRegistration = action.payload;
        }
      });

    // Mark badge printed
    builder
      .addCase(markBadgePrintedThunk.fulfilled, (state, action) => {
        const index = state.registrations.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.registrations[index] = action.payload;
        }
        if (state.currentRegistration?.id === action.payload.id) {
          state.currentRegistration = action.payload;
        }
      });
  },
});

export const { setCurrentRegistration, clearRegistrations, clearError } = registrationsSlice.actions;
export default registrationsSlice.reducer;
