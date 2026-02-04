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
  isCreating: boolean;
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
  isCreating: false,
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

/**
 * Thunk pour check-in via QR Code scan
 */
export const checkInRegistrationThunk = createAsyncThunk(
  'registrations/checkInRegistration',
  async (params: { 
    registrationId: string; 
    eventId: string;
    location?: { lat: number; lng: number };
  }, { rejectWithValue }) => {
    try {
      console.log('[RegistrationsSlice] checkInRegistrationThunk - Starting:', params);
      const response = await registrationsService.checkIn(
        params.registrationId,
        params.eventId,
        params.location
      );
      console.log('[RegistrationsSlice] checkInRegistrationThunk - Success:', response.message);
      return response.registration;
    } catch (error: any) {
      console.error('[RegistrationsSlice] checkInRegistrationThunk - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      
      // Retourner l'objet d'erreur complet pour un meilleur traitement dans les composants
      return rejectWithValue({
        message: error.message,
        detail: error.response?.data?.detail || error.response?.data?.message,
        status: error.response?.status,
        response: error.response?.data,
      });
    }
  }
);

/**
 * Thunk pour check-out (quand le participant quitte l'événement)
 */
export const checkOutRegistrationThunk = createAsyncThunk(
  'registrations/checkOutRegistration',
  async (params: {
    registrationId: string;
    eventId: string;
    location?: { lat: number; lng: number };
  }, { rejectWithValue }) => {
    try {
      console.log('[RegistrationsSlice] checkOutRegistrationThunk - Starting:', params);
      const response = await registrationsService.checkOut(
        params.registrationId,
        params.eventId,
        params.location
      );
      console.log('[RegistrationsSlice] checkOutRegistrationThunk - Success:', response.message);
      return response.registration;
    } catch (error: any) {
      console.error('[RegistrationsSlice] checkOutRegistrationThunk - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      return rejectWithValue({
        message: error.message,
        detail: error.response?.data?.detail || error.response?.data?.message,
        status: error.response?.status,
        response: error.response?.data,
      });
    }
  }
);

/**
 * Thunk pour annuler un check-out
 */
export const undoCheckOutThunk = createAsyncThunk(
  'registrations/undoCheckOut',
  async (params: {
    registrationId: string;
    eventId: string;
  }, { rejectWithValue }) => {
    try {
      console.log('[RegistrationsSlice] undoCheckOutThunk - Starting:', params);
      const response = await registrationsService.undoCheckOut(
        params.registrationId,
        params.eventId
      );
      console.log('[RegistrationsSlice] undoCheckOutThunk - Success:', response.message);
      return response.registration;
    } catch (error: any) {
      console.error('[RegistrationsSlice] undoCheckOutThunk - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });

      return rejectWithValue({
        message: error.message,
        detail: error.response?.data?.detail || error.response?.data?.message,
        status: error.response?.status,
        response: error.response?.data,
      });
    }
  }
);

export const createRegistrationThunk = createAsyncThunk(
  'registrations/createRegistration',
  async (params: {
    eventId: string;
    registrationData: {
      attendee: {
        email: string;
        first_name?: string;
        last_name?: string;
        phone?: string;
        company?: string;
        job_title?: string;
        country?: string;
      };
      attendance_type: 'onsite' | 'online' | 'hybrid';
      event_attendee_type_id?: string;
      answers?: any;
    };
  }, { rejectWithValue }) => {
    try {
      console.log('[RegistrationsSlice] createRegistrationThunk - Starting:', params);
      const response = await registrationsService.createRegistration(params.eventId, params.registrationData);
      console.log('[RegistrationsSlice] createRegistrationThunk - Success:', response.id);
      return response;
    } catch (error: any) {
      console.error('[RegistrationsSlice] createRegistrationThunk - Error:', {
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
    updateRegistration: (state, action: PayloadAction<Registration>) => {
      const updatedRegistration = action.payload;
      const index = state.registrations.findIndex(reg => reg.id === updatedRegistration.id);
      if (index !== -1) {
        // Fusionner avec les données existantes pour préserver les relations imbriquées
        state.registrations[index] = {
          ...state.registrations[index],
          ...updatedRegistration,
          // Préserver eventAttendeeType si non fourni dans la mise à jour
          eventAttendeeType: updatedRegistration.eventAttendeeType || state.registrations[index].eventAttendeeType,
          // Préserver attendee si non fourni dans la mise à jour
          attendee: updatedRegistration.attendee || state.registrations[index].attendee,
        };
        console.log('[RegistrationsSlice] Registration updated in store:', updatedRegistration.id);
      }
    },
  },
  extraReducers: (builder) => {
    // WebSocket events
    builder.addCase('registrations/created' as any, (state, action: PayloadAction<Registration>) => {
      console.log('[RegistrationsSlice] WebSocket - Registration created:', action.payload.id);
      // Vérifier si la registration existe déjà avant de l'ajouter
      const exists = state.registrations.some(reg => reg.id === action.payload.id);
      if (!exists) {
        // Ajouter la nouvelle registration au début de la liste
        state.registrations.unshift(action.payload);
        state.pagination.total += 1;
      } else {
        console.log('[RegistrationsSlice] Registration already exists, skipping add');
      }
    });
    
    builder.addCase('registrations/updated' as any, (state, action: PayloadAction<Registration>) => {
      console.log('[RegistrationsSlice] WebSocket - Registration updated:', action.payload.id);
      const index = state.registrations.findIndex(reg => reg.id === action.payload.id);
      if (index !== -1) {
        state.registrations[index] = {
          ...state.registrations[index],
          ...action.payload,
          eventAttendeeType: action.payload.eventAttendeeType || state.registrations[index].eventAttendeeType,
          attendee: action.payload.attendee || state.registrations[index].attendee,
        };
      }
    });
    
    builder.addCase('registrations/deleted' as any, (state, action: PayloadAction<{ id: string }>) => {
      console.log('[RegistrationsSlice] WebSocket - Registration deleted:', action.payload.id);
      state.registrations = state.registrations.filter(reg => reg.id !== action.payload.id);
      state.pagination.total -= 1;
    });
    
    builder.addCase('registrations/checkedIn' as any, (state, action: PayloadAction<Registration>) => {
      console.log('[RegistrationsSlice] WebSocket - Registration checked-in:', action.payload.id);
      const index = state.registrations.findIndex(reg => reg.id === action.payload.id);
      if (index !== -1) {
        state.registrations[index] = {
          ...state.registrations[index],
          ...action.payload,
          // Préserver les relations si elles ne sont pas dans le payload
          eventAttendeeType: action.payload.eventAttendeeType || state.registrations[index].eventAttendeeType,
          attendee: action.payload.attendee || state.registrations[index].attendee,
        };
      }
    });
    
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
        state.error = null;
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
        state.error = null;
      })
      .addCase(checkInRegistrationThunk.rejected, (state, action) => {
        console.error('[RegistrationsSlice] checkInRegistrationThunk.rejected:', action.payload || action.error);
        state.error = (action.payload as string) || action.error.message || 'Erreur lors du check-in';
      });

    // Check-out
    builder
      .addCase(checkOutRegistrationThunk.pending, (state) => {
        console.log('[RegistrationsSlice] checkOutRegistrationThunk.pending');
        state.error = null;
      })
      .addCase(checkOutRegistrationThunk.fulfilled, (state, action) => {
        console.log('[RegistrationsSlice] checkOutRegistrationThunk.fulfilled - Registration checked out:', action.payload.id);
        const index = state.registrations.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.registrations[index] = action.payload;
          console.log('[RegistrationsSlice] Updated registration in list at index:', index);
        }
        if (state.currentRegistration?.id === action.payload.id) {
          state.currentRegistration = action.payload;
          console.log('[RegistrationsSlice] Updated current registration');
        }
        state.error = null;
      })
      .addCase(checkOutRegistrationThunk.rejected, (state, action) => {
        console.error('[RegistrationsSlice] checkOutRegistrationThunk.rejected:', action.payload || action.error);
        state.error = (action.payload as string) || action.error.message || 'Erreur lors du check-out';
      });

    // Undo Check-out
    builder
      .addCase(undoCheckOutThunk.pending, (state) => {
        console.log('[RegistrationsSlice] undoCheckOutThunk.pending');
        state.error = null;
      })
      .addCase(undoCheckOutThunk.fulfilled, (state, action) => {
        console.log('[RegistrationsSlice] undoCheckOutThunk.fulfilled - Check-out undone:', action.payload.id);
        const index = state.registrations.findIndex((r) => r.id === action.payload.id);
        if (index !== -1) {
          state.registrations[index] = action.payload;
          console.log('[RegistrationsSlice] Updated registration in list at index:', index);
        }
        if (state.currentRegistration?.id === action.payload.id) {
          state.currentRegistration = action.payload;
          console.log('[RegistrationsSlice] Updated current registration');
        }
        state.error = null;
      })
      .addCase(undoCheckOutThunk.rejected, (state, action) => {
        console.error('[RegistrationsSlice] undoCheckOutThunk.rejected:', action.payload || action.error);
        state.error = (action.payload as string) || action.error.message || 'Erreur lors de l\'annulation du check-out';
      });

        // Create registration
    builder
      .addCase(createRegistrationThunk.pending, (state) => {
        console.log('[RegistrationsSlice] createRegistrationThunk.pending');
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createRegistrationThunk.fulfilled, (state, action) => {
        console.log('[RegistrationsSlice] createRegistrationThunk.fulfilled - Registration created:', action.payload.id);
        state.isCreating = false;
        // Ajouter la nouvelle registration au début de la liste
        state.registrations = [action.payload, ...state.registrations];
        state.pagination.total += 1;
      })
      .addCase(createRegistrationThunk.rejected, (state, action) => {
        console.error('[RegistrationsSlice] createRegistrationThunk.rejected:', action.payload || action.error);
        state.isCreating = false;
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors de la création de l\'inscription';
      });

    // Mark badge as printed
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

export const { setCurrentRegistration, clearRegistrations, clearError, updateRegistration } = registrationsSlice.actions;
export default registrationsSlice.reducer;
