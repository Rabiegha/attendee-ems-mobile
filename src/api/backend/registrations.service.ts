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
   * Récupérer les statistiques de check-in d'un événement
   */
  getEventStats: async (eventId: string): Promise<{
    total: number;
    checkedIn: number;
    percentage: number;
  }> => {
    try {
      console.log('[RegistrationsService] Fetching event checkin stats for:', eventId);
      const response = await axiosClient.get(`/events/${eventId}/check-in-stats`);
      console.log('[RegistrationsService] Event checkin stats fetched successfully:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Error fetching event checkin stats:', {
        eventId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Vérifier la disponibilité d'un badge
   */
  checkBadgeAvailability: async (eventId: string, registrationId: string): Promise<{
    available: boolean;
    pdfUrl?: string;
    imageUrl?: string;
    needsGeneration: boolean;
  }> => {
    try {
      console.log('[RegistrationsService] Checking badge availability:', { eventId, registrationId });
      const registration = await registrationsService.getRegistrationById(eventId, registrationId);
      
      const result = {
        available: !!(registration.badge_pdf_url || registration.badge_image_url),
        pdfUrl: registration.badge_pdf_url || undefined,
        imageUrl: registration.badge_image_url || undefined,
        needsGeneration: !registration.badge_pdf_url && !registration.badge_image_url,
      };
      
      console.log('[RegistrationsService] Badge availability check result:', result);
      return result;
    } catch (error: any) {
      console.error('[RegistrationsService] Error checking badge availability:', {
        eventId,
        registrationId,
        error: error.response?.data || error.message,
      });
      throw error;
    }
  },

  /**
   * Annuler le check-in d'une registration
   * @param registrationId - ID de la registration
   * @param eventId - ID de l'événement (validation croisée obligatoire)
   */
  undoCheckIn: async (
    registrationId: string,
    eventId: string
  ): Promise<{ success: boolean; message: string; registration: Registration }> => {
    try {
      console.log('[RegistrationsService] Undoing check-in for registration:', { 
        registrationId, 
        eventId
      });
      
      const response = await axiosClient.post(`/registrations/${registrationId}/undo-check-in`, {
        eventId,
      });
      
      console.log('[RegistrationsService] Undo check-in successful:', response.data.message);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Undo check-in failed:', {
        registrationId,
        eventId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Check-out d'une registration (quand le participant quitte l'événement)
   * @param registrationId - ID de la registration
   * @param eventId - ID de l'événement (validation croisée obligatoire)
   * @param location - Coordonnées GPS optionnelles
   */
  checkOut: async (
    registrationId: string,
    eventId: string,
    location?: { lat: number; lng: number }
  ): Promise<{ success: boolean; message: string; registration: Registration }> => {
    try {
      console.log('[RegistrationsService] Checking out registration:', { 
        registrationId, 
        eventId,
        hasLocation: !!location 
      });
      
      const response = await axiosClient.post(`/registrations/${registrationId}/check-out`, {
        eventId,
        checkoutLocation: location,
      });
      
      console.log('[RegistrationsService] Check-out successful:', response.data.message);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Check-out failed:', {
        registrationId,
        eventId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Annuler le check-out d'une registration
   * @param registrationId - ID de la registration
   * @param eventId - ID de l'événement (validation croisée obligatoire)
   */
  undoCheckOut: async (
    registrationId: string,
    eventId: string
  ): Promise<{ success: boolean; message: string; registration: Registration }> => {
    try {
      console.log('[RegistrationsService] Undoing check-out for registration:', { 
        registrationId, 
        eventId
      });
      
      const response = await axiosClient.post(`/registrations/${registrationId}/undo-check-out`, {
        eventId,
      });
      
      console.log('[RegistrationsService] Undo check-out successful:', response.data.message);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Undo check-out failed:', {
        registrationId,
        eventId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Créer une nouvelle registration
   */
  createRegistration: async (eventId: string, registrationData: any): Promise<Registration> => {
    try {
      console.log('[RegistrationsService] Creating registration for event:', eventId);
      const response = await axiosClient.post(`/events/${eventId}/registrations`, registrationData);
      console.log('[RegistrationsService] Registration created successfully:', response.data.id);
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Error creating registration:', {
        eventId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },

  /**
   * Générer un badge si nécessaire
   */
  generateBadgeIfNeeded: async (eventId: string, registrationId: string): Promise<Registration> => {
    try {
      console.log('[RegistrationsService] Generating badge if needed:', { eventId, registrationId });
      
      // Vérifier d'abord si le badge existe
      const registration = await registrationsService.getRegistrationById(eventId, registrationId);
      
      if (registration.badge_pdf_url || registration.badge_image_url) {
        console.log('[RegistrationsService] Badge already exists:', {
          hasPdf: !!registration.badge_pdf_url,
          hasImage: !!registration.badge_image_url,
          pdfUrl: registration.badge_pdf_url?.substring(0, 50) + '...',
          imageUrl: registration.badge_image_url?.substring(0, 50) + '...'
        });
        return registration;
      }
      
      // Générer le badge via l'endpoint du backend
      console.log('[RegistrationsService] 📡 Calling badge generation endpoint...');
      const response = await axiosClient.post(`/events/${eventId}/registrations/${registrationId}/generate-badge`);
      console.log('[RegistrationsService] ✅ Badge generation API response:', {
        status: response.status,
        data: response.data ? 'received' : 'empty'
      });
      
      // Attendre un peu pour que le badge soit disponible
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Récupérer la registration mise à jour
      const updatedRegistration = await registrationsService.getRegistrationById(eventId, registrationId);
      console.log('[RegistrationsService] ✅ Badge generation result:', {
        hasPdf: !!updatedRegistration.badge_pdf_url,
        hasImage: !!updatedRegistration.badge_image_url,
        pdfUrl: updatedRegistration.badge_pdf_url?.substring(0, 50) + '...',
        imageUrl: updatedRegistration.badge_image_url?.substring(0, 50) + '...'
      });
      
      return updatedRegistration;
    } catch (error: any) {
      console.error('[RegistrationsService] ❌ Error generating badge:', {
        eventId,
        registrationId,
        status: error.response?.status,
        statusText: error.response?.statusText,
        error: error.response?.data || error.message,
        url: error.config?.url,
        method: error.config?.method
      });
      throw error;
    }
  },

  /**
   * Mettre à jour une registration et son attendee
   */
  updateRegistration: async (
    registrationId: string,
    data: {
      attendee?: {
        first_name?: string;
        last_name?: string;
        email?: string;
        phone?: string;
        company?: string;
        job_title?: string;
        country?: string;
      };
      comment?: string;
      status?: string;
      attendance_type?: string;
      event_attendee_type_id?: string;
    }
  ): Promise<Registration> => {
    try {
      console.log('[RegistrationsService] Updating registration:', { registrationId, data });
      const response = await axiosClient.patch(`/registrations/${registrationId}`, data);
      console.log('[RegistrationsService] Registration updated successfully');
      return response.data;
    } catch (error: any) {
      console.error('[RegistrationsService] Error updating registration:', {
        registrationId,
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw error;
    }
  },
};
