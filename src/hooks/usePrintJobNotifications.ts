/**
 * Hook pour écouter les mises à jour de status des jobs d'impression
 * via WebSocket et mettre à jour le PrintStatusBanner en temps réel.
 * 
 * Écoute l'événement 'print-job:updated' émis par le backend
 * quand le EMS Print Client signale un changement de status.
 * 
 * Remplace l'ancienne approche par toasts avec un indicateur persistant.
 */

import { useEffect, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { socketService } from '../api/socket.service';
import { selectIsAuthenticated } from '../store/auth.slice';
import { useAppDispatch } from '../store/hooks';
import { setPrintStatus, PrintJobStatusType } from '../store/printStatus.slice';
import { hapticSuccess, hapticError, hapticLight } from '../utils/haptics';

interface PrintJobUpdate {
  id: string;
  status: 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED';
  printer_name?: string;
  error?: string;
  registration?: {
    id: string;
    attendee_first_name?: string;
    attendee_last_name?: string;
    first_name?: string;
    last_name?: string;
  };
}

export const usePrintJobNotifications = () => {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const dispatch = useAppDispatch();

  const handlePrintJobUpdated = useCallback((data: PrintJobUpdate) => {
    console.log('[PrintNotif] Print job updated:', data.id, '→', data.status);

    // Construire le nom de l'attendee
    const reg = data.registration;
    const name = reg
      ? `${reg.attendee_first_name || reg.first_name || ''} ${reg.attendee_last_name || reg.last_name || ''}`.trim()
      : '';

    // Haptics selon le statut
    switch (data.status) {
      case 'COMPLETED':
        hapticSuccess();
        break;
      case 'FAILED':
        hapticError();
        break;
      case 'PRINTING':
        hapticLight();
        break;
    }

    // Mettre à jour le slice Redux → PrintStatusBanner se met à jour
    dispatch(setPrintStatus({
      id: data.id,
      status: data.status as PrintJobStatusType,
      attendeeName: name,
      printerName: data.printer_name,
      error: data.error,
    }));
  }, [dispatch]);

  useEffect(() => {
    if (!isAuthenticated) return;

    console.log('[PrintNotif] Subscribing to print-job:updated');
    socketService.on('print-job:updated', handlePrintJobUpdated);

    return () => {
      console.log('[PrintNotif] Unsubscribing from print-job:updated');
      socketService.off('print-job:updated', handlePrintJobUpdated);
    };
  }, [isAuthenticated, handlePrintJobUpdated]);
};
