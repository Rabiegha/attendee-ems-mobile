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
    try {
      console.log('[RegistrationsService] Fetching registrations for event:', eventId, 'with params:', params);
      const response = await axiosClient.get(`/registrations/events/${eventId}/registrations`, { params });
      console.log('[RegistrationsService] Registrations fetched successfully:', response.data.meta);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Error fetching registrations:', {
        eventId,
        params,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Récupérer une registration par ID
   */
  getRegistrationById: async (eventId: string, registrationId: string): Promise<Registration> => {
    try {
      console.log('[RegistrationsService] Fetching registration:', { eventId, registrationId });
      const response = await axiosClient.get(`/registrations/events/${eventId}/registrations/${registrationId}`);
      console.log('[RegistrationsService] Registration fetched successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Error fetching registration by ID:', {
        eventId,
        registrationId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Check-in d'une registration
   */
  checkInRegistration: async (eventId: string, registrationId: string): Promise<Registration> => {
    try {
      console.log('[RegistrationsService] Checking in registration:', { eventId, registrationId });
      const response = await axiosClient.post(`/registrations/events/${eventId}/registrations/${registrationId}/check-in`);
      console.log('[RegistrationsService] Registration checked in successfully:', response.data.status);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Error checking in registration:', {
        eventId,
        registrationId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Marquer le badge comme imprimé
   */
  markBadgePrinted: async (eventId: string, registrationId: string): Promise<Registration> => {
    try {
      console.log('[RegistrationsService] Marking badge as printed:', { eventId, registrationId });
      const response = await axiosClient.post(`/registrations/events/${eventId}/registrations/${registrationId}/print-badge`);
      console.log('[RegistrationsService] Badge marked as printed successfully');
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Error marking badge as printed:', {
        eventId,
        registrationId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },
};
