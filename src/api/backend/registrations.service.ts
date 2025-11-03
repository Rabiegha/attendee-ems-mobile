/**
 * Service API pour les registrations (inscriptions aux événements)
 */

import axiosClient from './axiosClient';
import { Registration, RegistrationsResponse } from '../../types/attendee';

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
      const response = await axiosClient.get(`/events/${eventId}/registrations`, { params });
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
      const response = await axiosClient.get(`/events/${eventId}/registrations/${registrationId}`);
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
   * Check-in d'une registration via QR Code
   * @param registrationId - UUID scanné depuis le QR Code
   * @param eventId - ID de l'événement (validation croisée obligatoire)
   * @param location - Coordonnées GPS optionnelles
   */
  checkIn: async (
    registrationId: string,
    eventId: string,
    location?: { lat: number; lng: number }
  ): Promise<{ success: boolean; message: string; registration: Registration }> => {
    try {
      console.log('[RegistrationsService] Checking in registration:', { 
        registrationId, 
        eventId,
        hasLocation: !!location 
      });
      
      const response = await axiosClient.post(`/registrations/${registrationId}/check-in`, {
        eventId,
        checkinLocation: location,
      });
      
      console.log('[RegistrationsService] Check-in successful:', response.data.message);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Check-in failed:', {
        registrationId,
        eventId,
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
      const response = await axiosClient.post(`/events/${eventId}/registrations/${registrationId}/print-badge`);
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

  /**
   * Récupérer les statistiques d'un événement
   */
  getEventStats: async (eventId: string): Promise<{
    total: number;
    checkedIn: number;
    percentage: number;
  }> => {
    try {
      console.log('[RegistrationsService] Fetching event stats for:', eventId);
      const response = await axiosClient.get(`/events/${eventId}/stats`);
      console.log('[RegistrationsService] Event stats fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Error fetching event stats:', {
        eventId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },
};
