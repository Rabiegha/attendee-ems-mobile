import { useCallback, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { sendPrintJob } from '../../api/printNode/printers.service';
import { getBadgePdfBase64 } from '../../api/backend/badges.service';
import { Registration } from '../../types/attendee';

/**
 * Extrait le badge ID depuis l'URL du badge
 * Format: /api/badges/{badgeId}/pdf
 */
const extractBadgeId = (badgePdfUrl: string): string | null => {
  try {
    const match = badgePdfUrl.match(/\/badges\/([a-f0-9-]+)\//i);
    return match ? match[1] : null;
  } catch (error) {
    console.error('[useNodePrint] Error extracting badge ID:', error);
    return null;
  }
};

export const useNodePrint = () => {
  const selectedPrinter = useAppSelector((s) => s.printers.selectedPrinter);
  const [isPrinting, setIsPrinting] = useState(false);

  /**
   * Imprime un badge en utilisant le PDF
   * Génère le PDF via Puppeteer (peut prendre 10-30 secondes)
   */
  const printBadge = useCallback(
    async (registration: Registration, options?: { copies?: number }) => {
      if (!selectedPrinter) {
        throw new Error('No printer selected');
      }

      if (!registration.badge_pdf_url) {
        throw new Error('No badge PDF available for this registration');
      }

      setIsPrinting(true);
      try {
        console.log('[useNodePrint] Getting badge PDF base64...');
        console.log('[useNodePrint] Badge PDF URL:', registration.badge_pdf_url);
        
        // Extraire le badge ID depuis l'URL
        const badgeId = extractBadgeId(registration.badge_pdf_url);
        
        if (!badgeId) {
          throw new Error('Could not extract badge ID from URL');
        }

        console.log('[useNodePrint] Badge ID:', badgeId);
        
        // Récupérer le PDF en base64 depuis le backend
        const pdfBase64 = await getBadgePdfBase64(badgeId);

        console.log('[useNodePrint] PDF base64 received:', pdfBase64.length, 'chars');
        console.log('[useNodePrint] Sending print job to PrintNode...');
        
        const job = await sendPrintJob({
          printerId: selectedPrinter.id,
          title: `Badge - ${registration.attendee.first_name} ${registration.attendee.last_name}`,
          contentType: 'pdf_base64',
          content: pdfBase64,
          source: 'mobile-app',
          options: {
            copies: options?.copies ?? 1,
            pages: '1', // Imprimer uniquement la première page
          },
        });

        console.log('[useNodePrint] Print job sent successfully:', job.id);
        setIsPrinting(false);
        return job;
      } catch (error) {
        console.error('[useNodePrint] Print job failed:', error);
        setIsPrinting(false);
        throw error;
      }
    },
    [selectedPrinter]
  );

  return { 
    printBadge, 
    isPrinting 
  } as const;
};

export default useNodePrint;
