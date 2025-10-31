/**
 * Service pour les événements
 */

import axiosClient from './axiosClient';
import { Event, EventStats } from '../types/event';
import { PaginatedResponse } from '../types/api';

// Mapper les données du backend vers le format frontend
const mapEventFromBackend = (backendEvent: any): Event => {
  // Pour le lieu, on affiche juste la ville ou "En ligne"
  let location = 'En ligne';
  if (backendEvent.location_type === 'physical' || backendEvent.location_type === 'hybrid') {
    location = backendEvent.address_city || 'Lieu physique';
  }
  
  return {
    id: backendEvent.id,
    name: backendEvent.name,
    description: backendEvent.description,
    startDate: backendEvent.start_at,
    endDate: backendEvent.end_at,
    location: location,
    status: backendEvent.status === 'published' ? 'upcoming' : backendEvent.status,
    organizationId: backendEvent.org_id,
    createdAt: backendEvent.created_at,
    updatedAt: backendEvent.updated_at,
    stats: backendEvent.stats, // Inclure les stats si présentes
  };
};

export const eventsService = {
  /**
   * Récupérer tous les événements
   */
  async getEvents(params?: {
    page?: number;
    limit?: number;
    search?: string;
  }): Promise<PaginatedResponse<Event>> {
    try {
      console.log('[EventsService] Fetching events with params:', params);
      const response = await axiosClient.get<any>('/events', { params });
      
      console.log('[EventsService] Events fetched successfully:', {
        total: response.data.meta?.total,
        count: response.data.data?.length,
        firstEvent: response.data.data?.[0]?.name,
      });
      
      return {
        data: response.data.data.map(mapEventFromBackend),
        meta: response.data.meta,
      };
    } catch (error: any) {
      console.error('[EventsService] Error fetching events:', {
        params,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Récupérer un événement par ID
   */
  async getEventById(id: string): Promise<Event> {
    try {
      console.log('[EventsService] Fetching event by ID:', id);
      const response = await axiosClient.get<any>(`/events/${id}`);
      console.log('[EventsService] Event fetched successfully:', response.data.name);
      return mapEventFromBackend(response.data);
    } catch (error: any) {
      console.error('[EventsService] Error fetching event by ID:', {
        id,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Récupérer les statistiques d'un événement
   */
  async getEventStats(id: string): Promise<EventStats> {
    try {
      console.log('[EventsService] Fetching event stats for ID:', id);
      const response = await axiosClient.get<EventStats>(`/events/${id}/stats`);
      console.log('[EventsService] Event stats fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[EventsService] Error fetching event stats:', {
        id,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Créer un événement
   */
  async createEvent(data: Partial<Event>): Promise<Event> {
    try {
      console.log('[EventsService] Creating event:', data.name);
      const response = await axiosClient.post<Event>('/events', data);
      console.log('[EventsService] Event created successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[EventsService] Error creating event:', {
        data,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Mettre à jour un événement
   */
  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    try {
      console.log('[EventsService] Updating event:', id);
      const response = await axiosClient.patch<Event>(`/events/${id}`, data);
      console.log('[EventsService] Event updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('[EventsService] Error updating event:', {
        id,
        data,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Supprimer un événement
   */
  async deleteEvent(id: string): Promise<void> {
    try {
      console.log('[EventsService] Deleting event:', id);
      await axiosClient.delete(`/events/${id}`);
      console.log('[EventsService] Event deleted successfully');
    } catch (error: any) {
      console.error('[EventsService] Error deleting event:', {
        id,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },
};
