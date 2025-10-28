/**
 * Service pour les participants
 */

import axiosClient from './axiosClient';
import { Attendee, CreateAttendeeDto, UpdateAttendeeDto } from '../types/attendee';
import { PaginatedResponse } from '../types/api';

export const attendeesService = {
  /**
   * Récupérer tous les participants d'un événement
   */
  async getAttendees(
    eventId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }
  ): Promise<PaginatedResponse<Attendee>> {
    const response = await axiosClient.get<PaginatedResponse<Attendee>>('/attendees', {
      params: { ...params, eventId },
    });
    return response.data;
  },

  /**
   * Récupérer un participant par ID
   */
  async getAttendeeById(id: string): Promise<Attendee> {
    const response = await axiosClient.get<Attendee>(`/attendees/${id}`);
    return response.data;
  },

  /**
   * Créer un participant
   */
  async createAttendee(data: CreateAttendeeDto): Promise<Attendee> {
    const response = await axiosClient.post<Attendee>('/attendees', data);
    return response.data;
  },

  /**
   * Mettre à jour un participant
   */
  async updateAttendee(id: string, data: UpdateAttendeeDto): Promise<Attendee> {
    const response = await axiosClient.patch<Attendee>(`/attendees/${id}`, data);
    return response.data;
  },

  /**
   * Supprimer un participant
   */
  async deleteAttendee(id: string): Promise<void> {
    await axiosClient.delete(`/attendees/${id}`);
  },

  /**
   * Check-in d'un participant
   */
  async checkInAttendee(id: string): Promise<Attendee> {
    const response = await axiosClient.post<Attendee>(`/attendees/${id}/check-in`);
    return response.data;
  },

  /**
   * Marquer un badge comme imprimé
   */
  async markBadgePrinted(id: string): Promise<Attendee> {
    const response = await axiosClient.post<Attendee>(`/attendees/${id}/print`);
    return response.data;
  },
};
