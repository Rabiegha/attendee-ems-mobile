import axiosClient from './axiosClient';
import { Session, SessionScanMetadata } from '../../types/session';

export const SessionsService = {
  /**
   * Récupère la liste des sessions pour un événement
   */
  getSessions: async (eventId: string): Promise<Session[]> => {
    const response = await axiosClient.get<Session[]>(`/events/${eventId}/sessions`);
    return response.data;
  },

  /**
   * Récupère une session par son ID
   */
  getSession: async (eventId: string, sessionId: string): Promise<Session> => {
    const response = await axiosClient.get<Session>(`/events/${eventId}/sessions/${sessionId}`);
    return response.data;
  },

  /**
   * Scanne un participant pour une session (entrée ou sortie)
   */
  scanParticipant: async (
    eventId: string, 
    sessionId: string, 
    data: SessionScanMetadata
  ): Promise<any> => {
    const response = await axiosClient.post(
      `/events/${eventId}/sessions/${sessionId}/scan`,
      data
    );
    return response.data;
  },

  /**
   * Récupère l'historique des scans pour une session
   */
  getSessionHistory: async (eventId: string, sessionId: string): Promise<any[]> => {
    const response = await axiosClient.get<any[]>(`/events/${eventId}/sessions/${sessionId}/history`);
    return response.data;
  }
};
