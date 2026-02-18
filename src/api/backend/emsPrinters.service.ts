/**
 * Service API pour récupérer les imprimantes exposées par le EMS Print Client
 * 
 * Le client Electron enregistre ses imprimantes cochées dans le backend.
 * Ce service permet à l'app mobile de les récupérer pour la sélection.
 */

import axiosClient from './axiosClient';

export interface EmsPrinter {
  name: string;
  displayName: string;
  status: number; // 0=ready, 1=paused, 2=error
  isDefault: boolean;
}

/**
 * Récupérer les imprimantes exposées par le(s) EMS Print Client(s)
 */
export const getEmsPrinters = async (): Promise<EmsPrinter[]> => {
  try {
    console.log('[EmsPrinters] Fetching exposed printers from backend...');
    const response = await axiosClient.get<EmsPrinter[]>('/print-queue/printers');
    console.log('[EmsPrinters] Got', response.data.length, 'printer(s)');
    return response.data;
  } catch (error: any) {
    console.error('[EmsPrinters] Error fetching printers:', error.message);
    throw new Error(
      error.response?.data?.message ||
      error.message ||
      'Erreur lors de la récupération des imprimantes EMS'
    );
  }
};
