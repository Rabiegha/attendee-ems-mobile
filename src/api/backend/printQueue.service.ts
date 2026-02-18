/**
 * Service API pour la file d'impression EMS Print Client
 * 
 * Envoie les jobs d'impression au backend, qui les transmet
 * via WebSocket au client Electron pour impression locale.
 */

import axiosClient from './axiosClient';

export interface PrintQueueJob {
  id: string;
  registration_id: string;
  event_id: string;
  user_id: string;
  badge_url: string;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
  printer_name: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Ajoute un job à la file d'impression EMS
 * Le backend émet un événement WebSocket que le client Electron capte
 */
export const addToPrintQueue = async (
  registrationId: string,
  eventId: string,
  userId: string,
  badgeUrl: string,
): Promise<PrintQueueJob> => {
  try {
    console.log('[PrintQueue] Adding job to EMS print queue:', {
      registrationId,
      eventId,
    });

    const response = await axiosClient.post<PrintQueueJob>('/print-queue/add', {
      registrationId,
      eventId,
      userId,
      badgeUrl,
    });

    console.log('[PrintQueue] Job created successfully:', response.data.id);
    return response.data;
  } catch (error: any) {
    console.error('[PrintQueue] Error adding to print queue:', error);

    if (error.response) {
      console.error('[PrintQueue] Response error:', {
        status: error.response.status,
        data: error.response.data,
      });
    }

    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Erreur lors de l\'ajout à la file d\'impression'
    );
  }
};

/**
 * Récupère l'historique des jobs d'impression
 */
export const getPrintQueueHistory = async (
  eventId?: string,
  limit: number = 50,
): Promise<PrintQueueJob[]> => {
  try {
    const params = new URLSearchParams();
    if (eventId) params.append('eventId', eventId);
    params.append('limit', limit.toString());

    const response = await axiosClient.get<PrintQueueJob[]>(
      `/print-queue/history?${params.toString()}`
    );

    return response.data;
  } catch (error: any) {
    console.error('[PrintQueue] Error fetching history:', error);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Erreur lors de la récupération de l\'historique'
    );
  }
};
