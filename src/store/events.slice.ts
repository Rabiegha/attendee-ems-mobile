/**
 * Redux slice pour les événements
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { eventsService } from '../api/backend/events.service';
import { Event, EventStats } from '../types/event';

interface PaginationState {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EventsListState {
  events: Event[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  pagination: PaginationState;
  hasMore: boolean;
}

interface EventsState {
  upcoming: EventsListState;
  past: EventsListState;
  currentEvent: Event | null;
}

const initialListState: EventsListState = {
  events: [],
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

const initialState: EventsState = {
  upcoming: { ...initialListState },
  past: { ...initialListState },
  currentEvent: null,
};

// Thunks
export const fetchUpcomingEventsThunk = createAsyncThunk(
  'events/fetchUpcomingEvents',
  async (params: { page?: number; limit?: number; search?: string } | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { events: EventsState };
      
      const page = params?.page ?? state.events.upcoming.pagination.page;
      const limit = params?.limit ?? state.events.upcoming.pagination.limit;
      const search = params?.search;
      
      const requestParams: any = { 
        page, 
        limit, 
        search,
        startAfter: new Date().toISOString() // Événements futurs
      };
      
      console.log('[EventsSlice] fetchUpcomingEventsThunk - Starting with params:', requestParams);
      const response = await eventsService.getEvents(requestParams);
      console.log('[EventsSlice] fetchUpcomingEventsThunk - Success:', response.meta);
      return response;
    } catch (error: any) {
      console.error('[EventsSlice] fetchUpcomingEventsThunk - Error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchPastEventsThunk = createAsyncThunk(
  'events/fetchPastEvents',
  async (params: { page?: number; limit?: number; search?: string } | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { events: EventsState };
      
      const page = params?.page ?? state.events.past.pagination.page;
      const limit = params?.limit ?? state.events.past.pagination.limit;
      const search = params?.search;
      
      const requestParams: any = { 
        page, 
        limit, 
        search,
        startBefore: new Date().toISOString() // Événements passés
      };
      
      console.log('[EventsSlice] fetchPastEventsThunk - Starting with params:', requestParams);
      const response = await eventsService.getEvents(requestParams);
      console.log('[EventsSlice] fetchPastEventsThunk - Success:', response.meta);
      return response;
    } catch (error: any) {
      console.error('[EventsSlice] fetchPastEventsThunk - Error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMoreUpcomingEventsThunk = createAsyncThunk(
  'events/fetchMoreUpcomingEvents',
  async (params: { search?: string } | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { events: EventsState };
      
      const nextPage = state.events.upcoming.pagination.page + 1;
      const limit = state.events.upcoming.pagination.limit;
      const search = params?.search;
      
      const requestParams: any = { 
        page: nextPage, 
        limit, 
        search,
        startAfter: new Date().toISOString()
      };
      
      console.log('[EventsSlice] fetchMoreUpcomingEventsThunk - Loading page', nextPage);
      const response = await eventsService.getEvents(requestParams);
      console.log('[EventsSlice] fetchMoreUpcomingEventsThunk - Success:', response.meta);
      return response;
    } catch (error: any) {
      console.error('[EventsSlice] fetchMoreUpcomingEventsThunk - Error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMorePastEventsThunk = createAsyncThunk(
  'events/fetchMorePastEvents',
  async (params: { search?: string } | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { events: EventsState };
      
      const nextPage = state.events.past.pagination.page + 1;
      const limit = state.events.past.pagination.limit;
      const search = params?.search;
      
      const requestParams: any = { 
        page: nextPage, 
        limit, 
        search,
        startBefore: new Date().toISOString()
      };
      
      console.log('[EventsSlice] fetchMorePastEventsThunk - Loading page', nextPage);
      const response = await eventsService.getEvents(requestParams);
      console.log('[EventsSlice] fetchMorePastEventsThunk - Success:', response.meta);
      return response;
    } catch (error: any) {
      console.error('[EventsSlice] fetchMorePastEventsThunk - Error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Garder l'ancien thunk pour la compatibilité (pour fetchEventsThunk utilisé ailleurs)
export const fetchEventsThunk = createAsyncThunk(
  'events/fetchEvents',
  async (params: { page?: number; limit?: number; search?: string; timeFilter?: 'past' | 'upcoming' } | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { events: EventsState };
      const timeFilter = params?.timeFilter || 'upcoming';
      const currentState = timeFilter === 'upcoming' ? state.events.upcoming : state.events.past;
      
      const page = params?.page ?? currentState.pagination.page;
      const limit = params?.limit ?? currentState.pagination.limit;
      const search = params?.search;
      
      const requestParams: any = { page, limit, search };
      
      if (timeFilter === 'upcoming') {
        requestParams.startAfter = new Date().toISOString();
      } else {
        requestParams.startBefore = new Date().toISOString();
      }
      
      console.log('[EventsSlice] fetchEventsThunk - Starting with params:', requestParams);
      const response = await eventsService.getEvents(requestParams);
      console.log('[EventsSlice] fetchEventsThunk - Success:', response.meta);
      return { ...response, timeFilter };
    } catch (error: any) {
      console.error('[EventsSlice] fetchEventsThunk - Error:', error);
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const fetchMoreEventsThunk = createAsyncThunk(
  'events/fetchMoreEvents',
  async (params: { search?: string; timeFilter?: 'past' | 'upcoming' } | undefined, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { events: EventsState };
      const timeFilter = params?.timeFilter || 'upcoming';
      const currentState = timeFilter === 'upcoming' ? state.events.upcoming : state.events.past;
      
      const nextPage = currentState.pagination.page + 1;
      const limit = currentState.pagination.limit;
      const search = params?.search;
      
      const requestParams: any = { page: nextPage, limit, search };
      
      if (timeFilter === 'upcoming') {
        requestParams.startAfter = new Date().toISOString();
      } else {
        requestParams.startBefore = new Date().toISOString();
      }
      
      console.log('[EventsSlice] fetchMoreEventsThunk - Loading page', nextPage);
      const response = await eventsService.getEvents(requestParams);
      console.log('[EventsSlice] fetchMoreEventsThunk - Success:', response.meta);
      return { ...response, timeFilter };
    } catch (error: any) {
      console.error('[EventsSlice] fetchMoreEventsThunk - Error:', error);
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
    clearUpcomingEvents: (state) => {
      state.upcoming = { ...initialListState };
    },
    clearPastEvents: (state) => {
      state.past = { ...initialListState };
    },
    clearError: (state) => {
      state.upcoming.error = null;
      state.past.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch upcoming events
    builder
      .addCase(fetchUpcomingEventsThunk.pending, (state) => {
        state.upcoming.isLoading = true;
        state.upcoming.error = null;
      })
      .addCase(fetchUpcomingEventsThunk.fulfilled, (state, action) => {
        state.upcoming.isLoading = false;
        state.upcoming.events = action.payload.data;
        state.upcoming.pagination = action.payload.meta;
        state.upcoming.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchUpcomingEventsThunk.rejected, (state, action) => {
        state.upcoming.isLoading = false;
        state.upcoming.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement';
      });

    // Fetch more upcoming events
    builder
      .addCase(fetchMoreUpcomingEventsThunk.pending, (state) => {
        state.upcoming.isLoadingMore = true;
        state.upcoming.error = null;
      })
      .addCase(fetchMoreUpcomingEventsThunk.fulfilled, (state, action) => {
        state.upcoming.isLoadingMore = false;
        
        const existingIds = new Set(state.upcoming.events.map(e => e.id));
        const newEvents = action.payload.data.filter(e => !existingIds.has(e.id));
        state.upcoming.events = [...state.upcoming.events, ...newEvents];
        
        state.upcoming.pagination = action.payload.meta;
        state.upcoming.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchMoreUpcomingEventsThunk.rejected, (state, action) => {
        state.upcoming.isLoadingMore = false;
        state.upcoming.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement';
      });

    // Fetch past events
    builder
      .addCase(fetchPastEventsThunk.pending, (state) => {
        state.past.isLoading = true;
        state.past.error = null;
      })
      .addCase(fetchPastEventsThunk.fulfilled, (state, action) => {
        state.past.isLoading = false;
        state.past.events = action.payload.data;
        state.past.pagination = action.payload.meta;
        state.past.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchPastEventsThunk.rejected, (state, action) => {
        state.past.isLoading = false;
        state.past.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement';
      });

    // Fetch more past events
    builder
      .addCase(fetchMorePastEventsThunk.pending, (state) => {
        state.past.isLoadingMore = true;
        state.past.error = null;
      })
      .addCase(fetchMorePastEventsThunk.fulfilled, (state, action) => {
        state.past.isLoadingMore = false;
        
        const existingIds = new Set(state.past.events.map(e => e.id));
        const newEvents = action.payload.data.filter(e => !existingIds.has(e.id));
        state.past.events = [...state.past.events, ...newEvents];
        
        state.past.pagination = action.payload.meta;
        state.past.hasMore = action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchMorePastEventsThunk.rejected, (state, action) => {
        state.past.isLoadingMore = false;
        state.past.error = (action.payload as any)?.detail || action.error.message || 'Erreur lors du chargement';
      });

    // Fetch event by ID (garde l'ancien comportement)
    builder
      .addCase(fetchEventByIdThunk.pending, (state) => {
        console.log('[EventsSlice] fetchEventByIdThunk.pending');
      })
      .addCase(fetchEventByIdThunk.fulfilled, (state, action) => {
        console.log('[EventsSlice] fetchEventByIdThunk.fulfilled - Event:', action.payload.name);
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventByIdThunk.rejected, (state, action) => {
        console.error('[EventsSlice] fetchEventByIdThunk.rejected:', action.payload || action.error);
      });
  },
});

export const { setCurrentEvent, clearUpcomingEvents, clearPastEvents, clearError } = eventsSlice.actions;
export default eventsSlice.reducer;
