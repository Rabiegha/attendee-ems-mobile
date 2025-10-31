/**
 * Redux slice pour les événements
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsService } from '../api/events.service';
import { Event, EventStats } from '../types/event';

interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
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
export const fetchEventsThunk = createAsyncThunk(
  'events/fetchEvents',
  async (params: { page?: number; limit?: number; search?: string } | undefined, { rejectWithValue }) => {
    try {
      console.log('[EventsSlice] fetchEventsThunk - Starting with params:', params);
      const response = await eventsService.getEvents(params);
      console.log('[EventsSlice] fetchEventsThunk - Success:', response.meta);
      return response;
    } catch (error: any) {
      console.error('[EventsSlice] fetchEventsThunk - Error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchEventByIdThunk = createAsyncThunk(
  'events/fetchEventById',
  async (id: string, { rejectWithValue }) => {
    try {
      console.log('[EventsSlice] fetchEventByIdThunk - Starting for ID:', id);
      const response = await eventsService.getEventById(id);
      console.log('[EventsSlice] fetchEventByIdThunk - Success:', response.name);
      return response;
    } catch (error: any) {
      console.error('[EventsSlice] fetchEventByIdThunk - Error:', {
        id,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Slice
const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    setCurrentEvent: (state, action: PayloadAction<Event | null>) => {
      state.currentEvent = action.payload;
    },
    clearEvents: (state) => {
      state.events = [];
      state.currentEvent = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch events
    builder
      .addCase(fetchEventsThunk.pending, (state) => {
        console.log('[EventsSlice] fetchEventsThunk.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventsThunk.fulfilled, (state, action) => {
        console.log('[EventsSlice] fetchEventsThunk.fulfilled - Loaded', action.payload.data.length, 'events');
        state.isLoading = false;
        state.events = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchEventsThunk.rejected, (state, action) => {
        console.error('[EventsSlice] fetchEventsThunk.rejected:', action.payload || action.error);
        state.isLoading = false;
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement des événements';
      });

    // Fetch event by ID
    builder
      .addCase(fetchEventByIdThunk.pending, (state) => {
        console.log('[EventsSlice] fetchEventByIdThunk.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventByIdThunk.fulfilled, (state, action) => {
        console.log('[EventsSlice] fetchEventByIdThunk.fulfilled - Event:', action.payload.name);
        state.isLoading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventByIdThunk.rejected, (state, action) => {
        console.error('[EventsSlice] fetchEventByIdThunk.rejected:', action.payload || action.error);
        state.isLoading = false;
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement de l\'événement';
      });
  },
});

export const { setCurrentEvent, clearEvents, clearError } = eventsSlice.actions;
export default eventsSlice.reducer;
