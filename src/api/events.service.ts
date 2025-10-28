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
    const response = await axiosClient.get<any>('/events', { params });
    
    console.log('[eventsService.getEvents] Response:', {
      total: response.data.meta?.total,
      count: response.data.data?.length,
      firstEvent: response.data.data?.[0],
    });
    
    return {
      data: response.data.data.map(mapEventFromBackend),
      meta: response.data.meta,
    };
  },

  /**
   * Récupérer un événement par ID
   */
  async getEventById(id: string): Promise<Event> {
    const response = await axiosClient.get<any>(`/events/${id}`);
    return mapEventFromBackend(response.data);
  },

  /**
   * Récupérer les statistiques d'un événement
   */
  async getEventStats(id: string): Promise<EventStats> {
    const response = await axiosClient.get<EventStats>(`/events/${id}/stats`);
    return response.data;
  },

  /**
   * Créer un événement
   */
  async createEvent(data: Partial<Event>): Promise<Event> {
    const response = await axiosClient.post<Event>('/events', data);
    return response.data;
  },

  /**
   * Mettre à jour un événement
   */
  async updateEvent(id: string, data: Partial<Event>): Promise<Event> {
    const response = await axiosClient.patch<Event>(`/events/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un événement
   */
  async deleteEvent(id: string): Promise<void> {
    await axiosClient.delete(`/events/${id}`);
  },
};
