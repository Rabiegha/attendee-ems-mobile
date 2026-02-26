/**
 * Service API pour les Partner Scans
 */

import axiosClient from './axiosClient';
import {
  PartnerScan,
  PartnerScansResponse,
  CreatePartnerScanDTO,
  UpdatePartnerScanDTO,
  ListPartnerScansParams,
} from '../../types/partnerScan';

export const partnerScansService = {
  /**
   * Créer un scan (scanner un attendee)
   */
  async createScan(data: CreatePartnerScanDTO): Promise<PartnerScan> {
    const response = await axiosClient.post<PartnerScan>('/partner-scans', data);
    return response.data;
  },

  /**
   * Lister ses scans (paginé, filtrable)
   */
  async listScans(params: ListPartnerScansParams): Promise<PartnerScansResponse> {
    const response = await axiosClient.get<PartnerScansResponse>('/partner-scans', { params });
    return response.data;
  },

  /**
   * Détail d'un scan
   */
  async getScan(id: string): Promise<PartnerScan> {
    const response = await axiosClient.get<PartnerScan>(`/partner-scans/${id}`);
    return response.data;
  },

  /**
   * Modifier le commentaire d'un scan
   */
  async updateComment(id: string, comment: string): Promise<PartnerScan> {
    const response = await axiosClient.patch<PartnerScan>(`/partner-scans/${id}`, { comment });
    return response.data;
  },

  /**
   * Supprimer un scan
   */
  async deleteScan(id: string): Promise<{ success: boolean; id: string }> {
    const response = await axiosClient.delete<{ success: boolean; id: string }>(`/partner-scans/${id}`);
    return response.data;
  },

  /**
   * Exporter les scans en CSV
   */
  async exportCsv(eventId: string): Promise<string> {
    const response = await axiosClient.get<string>('/partner-scans/export', {
      params: { event_id: eventId },
      responseType: 'text',
    });
    return response.data;
  },
};
