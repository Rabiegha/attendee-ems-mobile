/**
 * Redux slice pour les événements
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsService } from '../api/backend/events.service';
import { Event, EventStats } from '../types/event';

interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  isLoadingMore: boolean; // Pour le scroll infini
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  hasMore: boolean; // Indique s'il y a plus de pages à charger
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
  hasMore: true,
};

// Thunks
export const fetchEventsThunk = createAsyncThunk(
  'events/fetchEvents',
  async (params: { page?: number; limit?: number; search?: string } | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { events: EventsState };
      
      // Utiliser les valeurs du state si non fournies dans params
      const page = params?.page ?? state.events.pagination.page;
      const limit = params?.limit ?? state.events.pagination.limit;
      const search = params?.search;
      
      const requestParams = { page, limit, search };
      
      console.log('[EventsSlice] fetchEventsThunk - Starting with params:', requestParams);
      const response = await eventsService.getEvents(requestParams);
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

export const fetchMoreEventsThunk = createAsyncThunk(
  'events/fetchMoreEvents',
  async (params: { search?: string } | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { events: EventsState };
      
      // Charger la page suivante
      const nextPage = state.events.pagination.page + 1;
      const limit = state.events.pagination.limit;
      const search = params?.search;
      
      const requestParams = { page: nextPage, limit, search };
      
      console.log('[EventsSlice] fetchMoreEventsThunk - Loading page', nextPage);
      const response = await eventsService.getEvents(requestParams);
      console.log('[EventsSlice] fetchMoreEventsThunk - Success:', response.meta);
      return response;
    } catch (error: any) {
      console.error('[EventsSlice] fetchMoreEventsThunk - Error:', {
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
    setPagination: (state, action: PayloadAction<Partial<{ page: number; limit: number }>>) => {
      state.pagination = {
        ...state.pagination,
        ...action.payload,
      };
    },
    clearEvents: (state) => {
      state.events = [];
      state.currentEvent = null;
      state.error = null;
      state.pagination.page = 1;
      state.hasMore = true;
    },
    resetPagination: (state) => {
      state.pagination.page = 1;
      state.hasMore = true;
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
        state.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchEventsThunk.rejected, (state, action) => {
        console.error('[EventsSlice] fetchEventsThunk.rejected:', action.payload || action.error);
        state.isLoading = false;
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement des événements';
      });

    // Fetch more events (infinite scroll)
    builder
      .addCase(fetchMoreEventsThunk.pending, (state) => {
        console.log('[EventsSlice] fetchMoreEventsThunk.pending');
        state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(fetchMoreEventsThunk.fulfilled, (state, action) => {
        console.log('[EventsSlice] fetchMoreEventsThunk.fulfilled - Loaded', action.payload.data.length, 'more events');
        state.isLoadingMore = false;
        // Ajouter les nouveaux événements à la liste existante
        state.events = [...state.events, ...action.payload.data];
        state.pagination = action.payload.meta;
        state.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchMoreEventsThunk.rejected, (state, action) => {
        console.error('[EventsSlice] fetchMoreEventsThunk.rejected:', action.payload || action.error);
        state.isLoadingMore = false;
        state.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement';
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

export const { setCurrentEvent, setPagination, clearEvents, clearError, resetPagination } = eventsSlice.actions;
export default eventsSlice.reducer;
