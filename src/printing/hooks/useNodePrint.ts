import { useCallback, useState } from 'react';
import { useAppSelector } from '../../store/hooks';
import { sendPrintJob } from '../../api/printNode/printers.service';
import { Registration } from '../../types/attendee';

/**
 * Télécharge un fichier et le convertit en Base64
 */
const downloadFileAsBase64 = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download file: ${response.status}`);
    }
    
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Retirer le préfixe "data:...;base64,"
        const base64Data = base64.split(',')[1] || base64;
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[useNodePrint] Error downloading file:', error);
    throw error;
  }
};

export const useNodePrint = () => {
  const selectedPrinter = useAppSelector((s) => s.printers.selectedPrinter);
  const [isPrinting, setIsPrinting] = useState(false);

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
        console.log('[useNodePrint] Downloading badge PDF from:', registration.badge_pdf_url);
        
        // Télécharger le PDF et le convertir en Base64
        const pdfBase64 = await downloadFileAsBase64(registration.badge_pdf_url);

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

  return { printBadge, isPrinting } as const;
};

export default useNodePrint;
