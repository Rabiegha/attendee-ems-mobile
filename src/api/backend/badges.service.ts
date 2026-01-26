import axiosClient from './axiosClient';

/**
 * Service API pour la gestion des badges
 */

export interface BadgePdfBase64Response {
  badgeId: string;
  base64: string;
  contentType: 'pdf_base64';
}

/**
 * Récupère le PDF d'un badge en base64
 * @param badgeId - ID du badge
 * @returns Le PDF encodé en base64
 */
export const getBadgePdfBase64 = async (badgeId: string): Promise<string> => {
  try {
    console.log('[BadgesService] Fetching PDF base64 for badge:', badgeId);
    
    const response = await axiosClient.get<BadgePdfBase64Response>(
      `/badge-generation/${badgeId}/pdf-base64`
    );

    console.log('[BadgesService] PDF base64 received:', {
      badgeId: response.data.badgeId,
      base64Length: response.data.base64?.length || 0,
      contentType: response.data.contentType,
    });

    if (!response.data.base64) {
      throw new Error('No base64 data in response');
    }

    return response.data.base64;
  } catch (error: any) {
    console.error('[BadgesService] Error fetching badge PDF:', error);
    
    if (error.response) {
      console.error('[BadgesService] Response error:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch badge PDF'
    );
  }
};
