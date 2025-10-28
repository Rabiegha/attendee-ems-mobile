/**
 * Service API pour les registrations (inscriptions aux événements)
 */

import axiosClient from './axiosClient';
import { Registration, RegistrationsResponse } from '../types/attendee';

export const registrationsService = {
  /**
   * Récupérer les registrations d'un événement
   */
  getRegistrations: async (
    eventId: string,
    params?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: string;
    }
  ): Promise<RegistrationsResponse> => {
    const response = await axiosClient.get(`/events/${eventId}/registrations`, { params });
    return response.data;
  },

  /**
   * Récupérer une registration par ID
   */
  getRegistrationById: async (eventId: string, registrationId: string): Promise<Registration> => {
    const response = await axiosClient.get(`/events/${eventId}/registrations/${registrationId}`);
    return response.data;
  },

  /**
   * Check-in d'une registration
   */
  checkInRegistration: async (eventId: string, registrationId: string): Promise<Registration> => {
    const response = await axiosClient.post(`/events/${eventId}/registrations/${registrationId}/check-in`);
    return response.data;
  },

  /**
   * Marquer le badge comme imprimé
   */
  markBadgePrinted: async (eventId: string, registrationId: string): Promise<Registration> => {
    const response = await axiosClient.post(`/events/${eventId}/registrations/${registrationId}/print-badge`);
    return response.data;
  },
};
