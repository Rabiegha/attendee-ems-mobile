/**
 * Redux slice pour les événements
 */

import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { eventsService } from "../api/backend/events.service";
import { Event, EventStats } from "../types/event";
import { logger } from "../utils/logger";

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
  ongoing: EventsListState;
  upcoming: EventsListState;
  past: EventsListState;
  currentEvent: Event | null;
  currentEventStats: EventStats | null;
  currentEventAttendeeTypes: any[];
  currentEventRegistrationFields: any[];
  isLoadingAttendeeTypes: boolean;
  isLoadingRegistrationFields: boolean;
  isLoadingStats: boolean;
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
  ongoing: { ...initialListState },
  upcoming: { ...initialListState },
  past: { ...initialListState },
  currentEvent: null,
  currentEventStats: null,
  currentEventAttendeeTypes: [],
  currentEventRegistrationFields: [],
  isLoadingAttendeeTypes: false,
  isLoadingRegistrationFields: false,
  isLoadingStats: false,
};

// Thunks avec protection contre les appels multiples

// Événements EN COURS (startDate < now < endDate)
export const fetchOngoingEventsThunk = createAsyncThunk(
  "events/fetchOngoingEvents",
  async (
    params: { page?: number; limit?: number; search?: string } | undefined,
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as { events: EventsState };

      const page = params?.page ?? state.events.ongoing.pagination.page;
      const limit = params?.limit ?? state.events.ongoing.pagination.limit;
      const search = params?.search;

      const now = new Date();

      const requestParams: any = {
        page,
        limit,
        search,
        startBefore: now.toISOString(), // startDate < now
        endAfter: now.toISOString(), // endDate > now
      };

      logger.log(
        "[EventsSlice] fetchOngoingEventsThunk - Starting with params:",
        requestParams,
      );
      const response = await eventsService.getEvents(requestParams);
      logger.log(
        "[EventsSlice] fetchOngoingEventsThunk - Success:",
        response.meta,
      );
      return response;
    } catch (error: any) {
      logger.error("[EventsSlice] fetchOngoingEventsThunk - Error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
  {
    // P6: Guard dans condition → empêche .pending de fire si déjà en cours
    condition: (params, { getState }) => {
      const state = getState() as { events: EventsState };
      if (state.events.ongoing.isLoading && !params?.page) {
        return false;
      }
      return true;
    },
  },
);

// Événements À VENIR (startDate > now)
export const fetchUpcomingEventsThunk = createAsyncThunk(
  "events/fetchUpcomingEvents",
  async (
    params: { page?: number; limit?: number; search?: string } | undefined,
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as { events: EventsState };

      const page = params?.page ?? state.events.upcoming.pagination.page;
      const limit = params?.limit ?? state.events.upcoming.pagination.limit;
      const search = params?.search;

      const now = new Date();

      const requestParams: any = {
        page,
        limit,
        search,
        startAfter: now.toISOString(), // startDate > now
      };

      logger.log(
        "[EventsSlice] fetchUpcomingEventsThunk - Starting with params:",
        requestParams,
      );
      const response = await eventsService.getEvents(requestParams);
      logger.log(
        "[EventsSlice] fetchUpcomingEventsThunk - Success:",
        response.meta,
      );
      return response;
    } catch (error: any) {
      logger.error("[EventsSlice] fetchUpcomingEventsThunk - Error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
  {
    condition: (params, { getState }) => {
      const state = getState() as { events: EventsState };
      if (state.events.upcoming.isLoading && !params?.page) {
        return false;
      }
      return true;
    },
  },
);

// Événements TERMINÉS (endDate < now)
export const fetchPastEventsThunk = createAsyncThunk(
  "events/fetchPastEvents",
  async (
    params: { page?: number; limit?: number; search?: string } | undefined,
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as { events: EventsState };

      const page = params?.page ?? state.events.past.pagination.page;
      const limit = params?.limit ?? state.events.past.pagination.limit;
      const search = params?.search;

      const now = new Date();

      const requestParams: any = {
        page,
        limit,
        search,
        endBefore: now.toISOString(), // endDate < now
      };

      logger.log(
        "[EventsSlice] fetchPastEventsThunk - Starting with params:",
        requestParams,
      );
      const response = await eventsService.getEvents(requestParams);
      logger.log(
        "[EventsSlice] fetchPastEventsThunk - Success:",
        response.meta,
      );
      return response;
    } catch (error: any) {
      logger.error("[EventsSlice] fetchPastEventsThunk - Error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
  {
    condition: (params, { getState }) => {
      const state = getState() as { events: EventsState };
      if (state.events.past.isLoading && !params?.page) {
        return false;
      }
      return true;
    },
  },
);

export const fetchMoreOngoingEventsThunk = createAsyncThunk(
  "events/fetchMoreOngoingEvents",
  async (
    params: { search?: string } | undefined,
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as { events: EventsState };

      const nextPage = state.events.ongoing.pagination.page + 1;
      const limit = state.events.ongoing.pagination.limit;
      const search = params?.search;

      const now = new Date();

      const requestParams: any = {
        page: nextPage,
        limit,
        search,
        startBefore: now.toISOString(),
        endAfter: now.toISOString(),
      };

      logger.log(
        "[EventsSlice] fetchMoreOngoingEventsThunk - Loading page",
        nextPage,
      );
      const response = await eventsService.getEvents(requestParams);
      logger.log(
        "[EventsSlice] fetchMoreOngoingEventsThunk - Success:",
        response.meta,
      );
      return response;
    } catch (error: any) {
      logger.error("[EventsSlice] fetchMoreOngoingEventsThunk - Error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { events: EventsState };
      if (state.events.ongoing.isLoadingMore || !state.events.ongoing.hasMore) {
        return false;
      }
      return true;
    },
  },
);

export const fetchMoreUpcomingEventsThunk = createAsyncThunk(
  "events/fetchMoreUpcomingEvents",
  async (
    params: { search?: string } | undefined,
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as { events: EventsState };

      const nextPage = state.events.upcoming.pagination.page + 1;
      const limit = state.events.upcoming.pagination.limit;
      const search = params?.search;

      const now = new Date();

      const requestParams: any = {
        page: nextPage,
        limit,
        search,
        startAfter: now.toISOString(),
      };

      logger.log(
        "[EventsSlice] fetchMoreUpcomingEventsThunk - Loading page",
        nextPage,
      );
      const response = await eventsService.getEvents(requestParams);
      logger.log(
        "[EventsSlice] fetchMoreUpcomingEventsThunk - Success:",
        response.meta,
      );
      return response;
    } catch (error: any) {
      logger.error(
        "[EventsSlice] fetchMoreUpcomingEventsThunk - Error:",
        error,
      );
      return rejectWithValue(error.response?.data || error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { events: EventsState };
      if (
        state.events.upcoming.isLoadingMore ||
        !state.events.upcoming.hasMore
      ) {
        return false;
      }
      return true;
    },
  },
);

export const fetchMorePastEventsThunk = createAsyncThunk(
  "events/fetchMorePastEvents",
  async (
    params: { search?: string } | undefined,
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as { events: EventsState };

      const nextPage = state.events.past.pagination.page + 1;
      const limit = state.events.past.pagination.limit;
      const search = params?.search;

      const now = new Date();

      const requestParams: any = {
        page: nextPage,
        limit,
        search,
        endBefore: now.toISOString(),
      };

      logger.log(
        "[EventsSlice] fetchMorePastEventsThunk - Loading page",
        nextPage,
      );
      const response = await eventsService.getEvents(requestParams);
      logger.log(
        "[EventsSlice] fetchMorePastEventsThunk - Success:",
        response.meta,
      );
      return response;
    } catch (error: any) {
      logger.error("[EventsSlice] fetchMorePastEventsThunk - Error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const state = getState() as { events: EventsState };
      if (state.events.past.isLoadingMore || !state.events.past.hasMore) {
        return false;
      }
      return true;
    },
  },
);

// Garder l'ancien thunk pour la compatibilité (pour fetchEventsThunk utilisé ailleurs)
export const fetchEventsThunk = createAsyncThunk(
  "events/fetchEvents",
  async (
    params:
      | {
          page?: number;
          limit?: number;
          search?: string;
          timeFilter?: "past" | "upcoming";
        }
      | undefined,
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as { events: EventsState };
      const timeFilter = params?.timeFilter || "upcoming";
      const currentState =
        timeFilter === "upcoming" ? state.events.upcoming : state.events.past;

      const page = params?.page ?? currentState.pagination.page;
      const limit = params?.limit ?? currentState.pagination.limit;
      const search = params?.search;

      const requestParams: any = { page, limit, search };

      if (timeFilter === "upcoming") {
        requestParams.startAfter = new Date().toISOString();
      } else {
        requestParams.startBefore = new Date().toISOString();
      }

      logger.log(
        "[EventsSlice] fetchEventsThunk - Starting with params:",
        requestParams,
      );
      const response = await eventsService.getEvents(requestParams);
      logger.log("[EventsSlice] fetchEventsThunk - Success:", response.meta);
      return { ...response, timeFilter };
    } catch (error: any) {
      logger.error("[EventsSlice] fetchEventsThunk - Error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchMoreEventsThunk = createAsyncThunk(
  "events/fetchMoreEvents",
  async (
    params: { search?: string; timeFilter?: "past" | "upcoming" } | undefined,
    { rejectWithValue, getState },
  ) => {
    try {
      const state = getState() as { events: EventsState };
      const timeFilter = params?.timeFilter || "upcoming";
      const currentState =
        timeFilter === "upcoming" ? state.events.upcoming : state.events.past;

      const nextPage = currentState.pagination.page + 1;
      const limit = currentState.pagination.limit;
      const search = params?.search;

      const requestParams: any = { page: nextPage, limit, search };

      if (timeFilter === "upcoming") {
        requestParams.startAfter = new Date().toISOString();
      } else {
        requestParams.startBefore = new Date().toISOString();
      }

      logger.log("[EventsSlice] fetchMoreEventsThunk - Loading page", nextPage);
      const response = await eventsService.getEvents(requestParams);
      logger.log(
        "[EventsSlice] fetchMoreEventsThunk - Success:",
        response.meta,
      );
      return { ...response, timeFilter };
    } catch (error: any) {
      logger.error("[EventsSlice] fetchMoreEventsThunk - Error:", error);
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchEventByIdThunk = createAsyncThunk(
  "events/fetchEventById",
  async (id: string, { rejectWithValue }) => {
    try {
      logger.log("[EventsSlice] fetchEventByIdThunk - Starting for ID:", id);
      const response = await eventsService.getEventById(id);
      logger.log("[EventsSlice] fetchEventByIdThunk - Success:", response.name);
      return response;
    } catch (error: any) {
      logger.error("[EventsSlice] fetchEventByIdThunk - Error:", {
        id,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Charger les statistiques d'un événement
export const fetchEventStatsThunk = createAsyncThunk(
  "events/fetchEventStats",
  async (id: string, { rejectWithValue }) => {
    try {
      logger.log("[EventsSlice] fetchEventStatsThunk - Starting for ID:", id);
      const response = await eventsService.getEventStats(id);
      logger.log("[EventsSlice] fetchEventStatsThunk - Success:", response);
      return response;
    } catch (error: any) {
      logger.error("[EventsSlice] fetchEventStatsThunk - Error:", {
        id,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchEventAttendeeTypesThunk = createAsyncThunk(
  "events/fetchEventAttendeeTypes",
  async (eventId: string, { rejectWithValue }) => {
    try {
      logger.log(
        "[EventsSlice] fetchEventAttendeeTypesThunk - Starting for event:",
        eventId,
      );
      const response = await eventsService.getEventAttendeeTypes(eventId);
      logger.log(
        "[EventsSlice] fetchEventAttendeeTypesThunk - Success:",
        response.length,
        "types found",
      );
      return response;
    } catch (error: any) {
      logger.error("[EventsSlice] fetchEventAttendeeTypesThunk - Error:", {
        eventId,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

export const fetchEventRegistrationFieldsThunk = createAsyncThunk(
  "events/fetchEventRegistrationFields",
  async (eventId: string, { rejectWithValue }) => {
    try {
      logger.log(
        "[EventsSlice] fetchEventRegistrationFieldsThunk - Starting for event:",
        eventId,
      );
      const response = await eventsService.getEventRegistrationFields(eventId);
      logger.log(
        "[EventsSlice] fetchEventRegistrationFieldsThunk - Success:",
        response.length,
        "fields found",
      );
      return response;
    } catch (error: any) {
      logger.error("[EventsSlice] fetchEventRegistrationFieldsThunk - Error:", {
        eventId,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return rejectWithValue(error.response?.data || error.message);
    }
  },
);

// Slice
const eventsSlice = createSlice({
  name: "events",
  initialState,
  reducers: {
    setCurrentEvent: (state, action: PayloadAction<Event | null>) => {
      state.currentEvent = action.payload;
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    clearOngoingEvents: (state) => {
      state.ongoing = { ...initialListState };
    },
    clearUpcomingEvents: (state) => {
      state.upcoming = { ...initialListState };
    },
    clearPastEvents: (state) => {
      state.past = { ...initialListState };
    },
    clearError: (state) => {
      state.ongoing.error = null;
      state.upcoming.error = null;
      state.past.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch ongoing events
    builder
      .addCase(fetchOngoingEventsThunk.pending, (state) => {
        state.ongoing.isLoading = true;
        state.ongoing.error = null;
      })
      .addCase(fetchOngoingEventsThunk.fulfilled, (state, action) => {
        state.ongoing.isLoading = false;
        state.ongoing.events = action.payload.data;
        state.ongoing.pagination = action.payload.meta;
        state.ongoing.hasMore =
          action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchOngoingEventsThunk.rejected, (state, action) => {
        state.ongoing.isLoading = false;
        state.ongoing.error =
          (action.payload as any)?.detail ||
          action.error.message ||
          "Erreur lors du chargement";
      });

    // Fetch more ongoing events
    builder
      .addCase(fetchMoreOngoingEventsThunk.pending, (state) => {
        state.ongoing.isLoadingMore = true;
      })
      .addCase(fetchMoreOngoingEventsThunk.fulfilled, (state, action) => {
        state.ongoing.isLoadingMore = false;
        state.ongoing.events = [
          ...state.ongoing.events,
          ...action.payload.data,
        ];
        state.ongoing.pagination = action.payload.meta;
        state.ongoing.hasMore =
          action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchMoreOngoingEventsThunk.rejected, (state, action) => {
        state.ongoing.isLoadingMore = false;
        state.ongoing.error =
          (action.payload as any)?.detail ||
          action.error.message ||
          "Erreur lors du chargement";
      });

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
        state.upcoming.hasMore =
          action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchUpcomingEventsThunk.rejected, (state, action) => {
        state.upcoming.isLoading = false;
        state.upcoming.error =
          (action.payload as any)?.detail ||
          action.error.message ||
          "Erreur lors du chargement";
      });

    // Fetch more upcoming events
    builder
      .addCase(fetchMoreUpcomingEventsThunk.pending, (state) => {
        state.upcoming.isLoadingMore = true;
        state.upcoming.error = null;
      })
      .addCase(fetchMoreUpcomingEventsThunk.fulfilled, (state, action) => {
        state.upcoming.isLoadingMore = false;

        const existingIds = new Set(state.upcoming.events.map((e) => e.id));
        const newEvents = action.payload.data.filter(
          (e) => !existingIds.has(e.id),
        );
        state.upcoming.events = [...state.upcoming.events, ...newEvents];

        state.upcoming.pagination = action.payload.meta;
        state.upcoming.hasMore =
          action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchMoreUpcomingEventsThunk.rejected, (state, action) => {
        state.upcoming.isLoadingMore = false;
        state.upcoming.error =
          (action.payload as any)?.detail ||
          action.error.message ||
          "Erreur lors du chargement";
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
        state.past.hasMore =
          action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchPastEventsThunk.rejected, (state, action) => {
        state.past.isLoading = false;
        state.past.error =
          (action.payload as any)?.detail ||
          action.error.message ||
          "Erreur lors du chargement";
      });

    // Fetch more past events
    builder
      .addCase(fetchMorePastEventsThunk.pending, (state) => {
        state.past.isLoadingMore = true;
        state.past.error = null;
      })
      .addCase(fetchMorePastEventsThunk.fulfilled, (state, action) => {
        state.past.isLoadingMore = false;

        const existingIds = new Set(state.past.events.map((e) => e.id));
        const newEvents = action.payload.data.filter(
          (e) => !existingIds.has(e.id),
        );
        state.past.events = [...state.past.events, ...newEvents];

        state.past.pagination = action.payload.meta;
        state.past.hasMore =
          action.payload.meta.page < action.payload.meta.totalPages;
      })
      .addCase(fetchMorePastEventsThunk.rejected, (state, action) => {
        state.past.isLoadingMore = false;
        state.past.error =
          (action.payload as any)?.detail ||
          action.error.message ||
          "Erreur lors du chargement";
      });

    // Fetch event by ID (garde l'ancien comportement)
    builder
      .addCase(fetchEventByIdThunk.pending, (state) => {
        logger.log("[EventsSlice] fetchEventByIdThunk.pending");
      })
      .addCase(fetchEventByIdThunk.fulfilled, (state, action) => {
        logger.log(
          "[EventsSlice] fetchEventByIdThunk.fulfilled - Event:",
          action.payload.name,
        );
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventByIdThunk.rejected, (state, action) => {
        logger.error(
          "[EventsSlice] fetchEventByIdThunk.rejected:",
          action.payload || action.error,
        );
      });

    // Fetch event stats
    builder
      .addCase(fetchEventStatsThunk.pending, (state) => {
        logger.log("[EventsSlice] fetchEventStatsThunk.pending");
        state.isLoadingStats = true;
      })
      .addCase(fetchEventStatsThunk.fulfilled, (state, action) => {
        logger.log(
          "[EventsSlice] fetchEventStatsThunk.fulfilled - Stats:",
          action.payload,
        );
        state.isLoadingStats = false;
        state.currentEventStats = action.payload;
      })
      .addCase(fetchEventStatsThunk.rejected, (state, action) => {
        logger.error(
          "[EventsSlice] fetchEventStatsThunk.rejected:",
          action.payload || action.error,
        );
        state.isLoadingStats = false;
        state.currentEventStats = null;
      });

    // Fetch event attendee types
    builder
      .addCase(fetchEventAttendeeTypesThunk.pending, (state) => {
        logger.log("[EventsSlice] fetchEventAttendeeTypesThunk.pending");
        state.isLoadingAttendeeTypes = true;
      })
      .addCase(fetchEventAttendeeTypesThunk.fulfilled, (state, action) => {
        logger.log(
          "[EventsSlice] fetchEventAttendeeTypesThunk.fulfilled - Types:",
          action.payload.length,
        );
        state.isLoadingAttendeeTypes = false;
        state.currentEventAttendeeTypes = action.payload;
      })
      .addCase(fetchEventAttendeeTypesThunk.rejected, (state, action) => {
        logger.error(
          "[EventsSlice] fetchEventAttendeeTypesThunk.rejected:",
          action.payload || action.error,
        );
        state.isLoadingAttendeeTypes = false;
        state.currentEventAttendeeTypes = [];
      });

    // Fetch event registration fields
    builder
      .addCase(fetchEventRegistrationFieldsThunk.pending, (state) => {
        logger.log("[EventsSlice] fetchEventRegistrationFieldsThunk.pending");
        state.isLoadingRegistrationFields = true;
      })
      .addCase(fetchEventRegistrationFieldsThunk.fulfilled, (state, action) => {
        logger.log(
          "[EventsSlice] fetchEventRegistrationFieldsThunk.fulfilled - Fields:",
          action.payload.length,
        );
        state.isLoadingRegistrationFields = false;
        state.currentEventRegistrationFields = action.payload;
      })
      .addCase(fetchEventRegistrationFieldsThunk.rejected, (state, action) => {
        logger.error(
          "[EventsSlice] fetchEventRegistrationFieldsThunk.rejected:",
          action.payload || action.error,
        );
        state.isLoadingRegistrationFields = false;
        state.currentEventRegistrationFields = [];
      });

    // WebSocket events - Mettre à jour les stats en temps réel
    builder.addCase(
      "registrations/checkedIn" as any,
      (state, action: PayloadAction<any>) => {
        logger.log(
          "[EventsSlice] WebSocket - Registration checked-in event, updating stats",
        );
        if (state.currentEventStats) {
          // Vérifier si c'est un check-in ou un undo (checked_in_at === null signifie undo)
          const isCheckIn = action.payload.checked_in_at !== null;
          const isUndoCheckIn = action.payload.checked_in_at === null;

          if (isCheckIn) {
            logger.log(
              "[EventsSlice] WebSocket - Check-in detected, incrementing stats",
            );
            state.currentEventStats = {
              ...state.currentEventStats,
              checkedIn: state.currentEventStats.checkedIn + 1,
              checkedInPercentage: Math.round(
                ((state.currentEventStats.checkedIn + 1) /
                  state.currentEventStats.totalRegistrations) *
                  100,
              ),
            };
          } else if (isUndoCheckIn) {
            logger.log(
              "[EventsSlice] WebSocket - Undo check-in detected, decrementing stats",
            );
            state.currentEventStats = {
              ...state.currentEventStats,
              checkedIn: Math.max(0, state.currentEventStats.checkedIn - 1),
              checkedInPercentage: Math.round(
                (Math.max(0, state.currentEventStats.checkedIn - 1) /
                  state.currentEventStats.totalRegistrations) *
                  100,
              ),
            };
          }
        }
      },
    );

    builder.addCase(
      "registrations/updated" as any,
      (state, action: PayloadAction<any>) => {
        logger.log("[EventsSlice] WebSocket - Registration updated");
        // Si le statut a changé, recalculer les stats (pour simplifier, on recharge)
        // En production, vous pourriez vouloir comparer l'ancien et le nouveau statut
      },
    );

    builder.addCase(
      "registrations/created" as any,
      (state, action: PayloadAction<any>) => {
        logger.log(
          "[EventsSlice] WebSocket - Registration created, updating stats",
        );
        if (state.currentEventStats) {
          state.currentEventStats = {
            ...state.currentEventStats,
            totalRegistrations: state.currentEventStats.totalRegistrations + 1,
            checkedInPercentage: Math.round(
              (state.currentEventStats.checkedIn /
                (state.currentEventStats.totalRegistrations + 1)) *
                100,
            ),
          };
        }
      },
    );

    builder.addCase(
      "registrations/deleted" as any,
      (state, action: PayloadAction<any>) => {
        logger.log(
          "[EventsSlice] WebSocket - Registration deleted, updating stats",
        );
        if (state.currentEventStats) {
          state.currentEventStats = {
            ...state.currentEventStats,
            totalRegistrations: Math.max(
              0,
              state.currentEventStats.totalRegistrations - 1,
            ),
            checkedInPercentage:
              state.currentEventStats.totalRegistrations > 1
                ? Math.round(
                    (state.currentEventStats.checkedIn /
                      (state.currentEventStats.totalRegistrations - 1)) *
                      100,
                  )
                : 0,
          };
        }
      },
    );
  },
});

export const {
  setCurrentEvent,
  clearCurrentEvent,
  clearUpcomingEvents,
  clearPastEvents,
  clearError,
} = eventsSlice.actions;
export default eventsSlice.reducer;
