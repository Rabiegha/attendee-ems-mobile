/**
 * Redux slice pour les participants
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { attendeesService } from '../api/backend/attendees.service';
import { Attendee, CreateAttendeeDto, UpdateAttendeeDto } from '../types/attendee';

interface AttendeesState {
  attendees: Attendee[];
  currentAttendee: Attendee | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: AttendeesState = {
  attendees: [],
  currentAttendee: null,
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
export const fetchAttendeesThunk = createAsyncThunk(
  'attendees/fetchAttendees',
  async (params: {
    eventId: string;
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await attendeesService.getAttendees(params.eventId, params);
    return response;
  }
);

export const fetchAttendeeByIdThunk = createAsyncThunk(
  'attendees/fetchAttendeeById',
  async (id: string) => {
    const response = await attendeesService.getAttendeeById(id);
    return response;
  }
);

export const createAttendeeThunk = createAsyncThunk(
  'attendees/createAttendee',
  async (data: CreateAttendeeDto) => {
    const response = await attendeesService.createAttendee(data);
    return response;
  }
);

export const updateAttendeeThunk = createAsyncThunk(
  'attendees/updateAttendee',
  async ({ id, data }: { id: string; data: UpdateAttendeeDto }) => {
    const response = await attendeesService.updateAttendee(id, data);
    return response;
  }
);

export const checkInAttendeeThunk = createAsyncThunk(
  'attendees/checkInAttendee',
  async (id: string) => {
    const response = await attendeesService.checkInAttendee(id);
    return response;
  }
);

export const markBadgePrintedThunk = createAsyncThunk(
  'attendees/markBadgePrinted',
  async (id: string) => {
    const response = await attendeesService.markBadgePrinted(id);
    return response;
  }
);

// Slice
const attendeesSlice = createSlice({
  name: 'attendees',
  initialState,
  reducers: {
    setCurrentAttendee: (state, action: PayloadAction<Attendee | null>) => {
      state.currentAttendee = action.payload;
    },
    clearAttendees: (state) => {
      state.attendees = [];
      state.currentAttendee = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch attendees
    builder
      .addCase(fetchAttendeesThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendeesThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendees = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchAttendeesThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Erreur lors du chargement des participants';
      });

    // Fetch attendee by ID
    builder
      .addCase(fetchAttendeeByIdThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAttendeeByIdThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentAttendee = action.payload;
      })
      .addCase(fetchAttendeeByIdThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Erreur lors du chargement du participant';
      });

    // Create attendee
    builder
      .addCase(createAttendeeThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createAttendeeThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.attendees.unshift(action.payload);
      })
      .addCase(createAttendeeThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Erreur lors de la création du participant';
      });

    // Update attendee
    builder
      .addCase(updateAttendeeThunk.fulfilled, (state, action) => {
        const index = state.attendees.findIndex((a) => a.id === action.payload.id);
        if (index !== -1) {
          state.attendees[index] = action.payload;
        }
        if (state.currentAttendee?.id === action.payload.id) {
          state.currentAttendee = action.payload;
        }
      });

    // Check-in
    builder.addCase(checkInAttendeeThunk.fulfilled, (state, action) => {
      const index = state.attendees.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.attendees[index] = action.payload;
      }
      if (state.currentAttendee?.id === action.payload.id) {
        state.currentAttendee = action.payload;
      }
    });

    // Mark badge printed
    builder.addCase(markBadgePrintedThunk.fulfilled, (state, action) => {
      const index = state.attendees.findIndex((a) => a.id === action.payload.id);
      if (index !== -1) {
        state.attendees[index] = action.payload;
      }
      if (state.currentAttendee?.id === action.payload.id) {
        state.currentAttendee = action.payload;
      }
    });
  },
});

export const { setCurrentAttendee, clearAttendees, clearError } = attendeesSlice.actions;
export default attendeesSlice.reducer;
