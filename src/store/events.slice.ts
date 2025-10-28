/**
 * Redux slice pour les événements
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsService } from '../api/events.service';
import { Event, EventStats } from '../types/event';

interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  currentEventStats: EventStats | null;
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
  currentEventStats: null,
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
  async (params?: { page?: number; limit?: number; search?: string }) => {
    const response = await eventsService.getEvents(params);
    return response;
  }
);

export const fetchEventByIdThunk = createAsyncThunk(
  'events/fetchEventById',
  async (id: string) => {
    const response = await eventsService.getEventById(id);
    return response;
  }
);

export const fetchEventStatsThunk = createAsyncThunk(
  'events/fetchEventStats',
  async (id: string) => {
    const response = await eventsService.getEventStats(id);
    return response;
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
      state.currentEventStats = null;
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
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventsThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.events = action.payload.data;
        state.pagination = action.payload.meta;
      })
      .addCase(fetchEventsThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Erreur lors du chargement des événements';
      });

    // Fetch event by ID
    builder
      .addCase(fetchEventByIdThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventByIdThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventByIdThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Erreur lors du chargement de l\'événement';
      });

    // Fetch event stats
    builder
      .addCase(fetchEventStatsThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(fetchEventStatsThunk.fulfilled, (state, action) => {
        state.currentEventStats = action.payload;
      })
      .addCase(fetchEventStatsThunk.rejected, (state, action) => {
        state.error = action.error.message || 'Erreur lors du chargement des statistiques';
      });
  },
});

export const { setCurrentEvent, clearEvents, clearError } = eventsSlice.actions;
export default eventsSlice.reducer;
