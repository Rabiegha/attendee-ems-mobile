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
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'OFFLINE';
  printer_name: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
}

export interface EmsClientStatus {
  connected: boolean;
  clientCount: number;
}

/**
 * Vérifie si le EMS Print Client est connecté au backend
 */
export const getEmsClientStatus = async (): Promise<EmsClientStatus> => {
  try {
    const response = await axiosClient.get<EmsClientStatus>('/print-queue/client-status');
    console.log('[PrintQueue] EMS Client status:', response.data);
    return response.data;
  } catch (error: any) {
    console.warn('[PrintQueue] Could not check EMS Client status:', error.message);
    // If we can't reach the backend at all, assume offline
    return { connected: false, clientCount: 0 };
  }
};

/**
 * Ajoute un job à la file d'impression EMS
 * Le backend émet un événement WebSocket que le client Electron capte
 */
export const addToPrintQueue = async (
  registrationId: string,
  eventId: string,
  userId: string,
  badgeUrl: string,
  printerName?: string,
  status?: 'PENDING' | 'OFFLINE',
): Promise<PrintQueueJob> => {
  try {
    console.log('[PrintQueue] Adding job to EMS print queue:', {
      registrationId,
      eventId,
      printerName: printerName || '(default)',
      status: status || 'PENDING',
    });

    const body: Record<string, string> = {
      registrationId,
      eventId,
      userId,
      badgeUrl,
    };
    if (printerName) {
      body.printerName = printerName;
    }
    if (status) {
      body.status = status;
    }

    const response = await axiosClient.post<PrintQueueJob>('/print-queue/add', body);

    console.log('[PrintQueue] Job created successfully:', response.data.id, '| printer_name in response:', response.data.printer_name || 'NULL');
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
