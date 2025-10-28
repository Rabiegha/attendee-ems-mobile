/**
 * Service pour les événements
 */

import axiosClient from './axiosClient';
import { Event, EventStats } from '../types/event';
import { PaginatedResponse } from '../types/api';

export const eventsService = {
  /**
   * Récupérer tous les événements
   */
  async getEvents(params?: {
    page?: number;
    limit?: number;
    status?: 'upcoming' | 'past';
    search?: string;
  }): Promise<PaginatedResponse<Event>> {
    const response = await axiosClient.get<PaginatedResponse<Event>>('/events', { params });
    return response.data;
  },

  /**
   * Récupérer un événement par ID
   */
  async getEventById(id: string): Promise<Event> {
    const response = await axiosClient.get<Event>(`/events/${id}`);
    return response.data;
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
