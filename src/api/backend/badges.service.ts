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

/**
 * Génère un badge pour une registration
 * @param eventId - ID de l'événement
 * @param registrationId - ID de la registration
 * @returns Les informations du badge généré
 */
export const generateBadge = async (eventId: string, registrationId: string): Promise<any> => {
  try {
    console.log('[BadgesService] Generating badge for registration:', registrationId);
    
    const response = await axiosClient.post(
      `/events/${eventId}/registrations/${registrationId}/generate-badge`
    );

    console.log('[BadgesService] Badge generated successfully:', response.data);

    return response.data;
  } catch (error: any) {
    console.error('[BadgesService] Error generating badge:', error);
    
    if (error.response) {
      console.error('[BadgesService] Response error:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to generate badge'
    );
  }
};

/**
 * Récupère le HTML d'un badge
 * BEAUCOUP PLUS RAPIDE que le PDF (pas de Puppeteer)
 * @param badgeId - ID du badge
 * @returns Le HTML complet du badge
 */
export const getBadgeHtml = async (badgeId: string): Promise<string> => {
  try {
    console.log('[BadgesService] Fetching HTML for badge:', badgeId);
    
    const response = await axiosClient.get<string>(
      `/badge-generation/${badgeId}/html`,
      {
        headers: {
          'Accept': 'text/html',
        },
      }
    );

    console.log('[BadgesService] HTML received:', {
      badgeId,
      htmlLength: response.data?.length || 0,
    });

    if (!response.data) {
      throw new Error('No HTML data in response');
    }

    return response.data;
  } catch (error: any) {
    console.error('[BadgesService] Error fetching badge HTML:', error);
    
    if (error.response) {
      console.error('[BadgesService] Response error:', {
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    throw new Error(
      error.response?.data?.message || 
      error.message || 
      'Failed to fetch badge HTML'
    );
  }
};
