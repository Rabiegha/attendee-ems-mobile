/**
 * Hook centralisé pour gérer le check-in et l'impression des badges
 * avec modales animées et gestion d'état unifiée
 */

import { useState, useCallback } from 'react';
import { Registration } from '../types/attendee';
import { registrationsService } from '../api/backend/registrations.service';

export type CheckInStatus = 'idle' | 'printing' | 'checkin' | 'success' | 'error';

export interface UseCheckInResult {
  // État du processus
  status: CheckInStatus;
  isModalVisible: boolean;
  currentAttendee: Registration | null;
  errorMessage: string | null;
  progress: number; // Pourcentage de progression (0-100)

  // Actions
  printAndCheckIn: (registration: Registration) => Promise<void>;
  printOnly: (registration: Registration) => Promise<void>;
  checkInOnly: (registration: Registration) => Promise<void>;
  closeModal: () => void;
  retryAction: () => Promise<void>;

  // Statistiques dynamiques
  stats: {
    total: number;
    checkedIn: number;
    percentage: number;
    isLoading: boolean;
  };
  refreshStats: (eventId: string) => Promise<void>;
}

export const useCheckIn = (): UseCheckInResult => {
  // État principal
  const [status, setStatus] = useState<CheckInStatus>('idle');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentAttendee, setCurrentAttendee] = useState<Registration | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [lastAction, setLastAction] = useState<(() => Promise<void>) | null>(null);

  // État des statistiques
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    percentage: 0,
    isLoading: false,
  });

  // Fonction pour mettre à jour les statistiques
  const refreshStats = useCallback(async (eventId: string) => {
    setStats(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await registrationsService.getEventStats(eventId);
      setStats({
        total: response.total,
        checkedIn: response.checkedIn,
        percentage: response.percentage,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch event stats:', error);
      setStats(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  // Fonction utilitaire pour initialiser le modal
  const initializeModal = useCallback((attendee: Registration) => {
    setCurrentAttendee(attendee);
    setErrorMessage(null);
    setProgress(0);
    setIsModalVisible(true);
  }, []);

  // Fonction utilitaire pour simuler le progrès d'impression
  const simulatePrintingProgress = useCallback(() => {
    return new Promise<void>((resolve) => {
      setProgress(0);
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            resolve();
            return 100;
          }
          return prev + 10;
        });
      }, 400); // 4 secondes total (400ms * 10 étapes)
    });
  }, []);

  // Fonction pour gérer l'impression seule
  const printOnly = useCallback(async (registration: Registration) => {
    initializeModal(registration);
    setStatus('printing');
    setLastAction(() => () => printOnly(registration));

    try {
      // Simuler l'impression avec progression
      await simulatePrintingProgress();
      
      // TODO: Appeler l'API d'impression réelle
      // await registrationApi.printBadge(registration.id);
      
      setStatus('success');
      console.log('Badge printed for:', registration.attendee.first_name);
    } catch (error) {
      setStatus('error');
      setErrorMessage('Erreur lors de l\'impression du badge');
      console.error('Print error:', error);
    }
  }, [initializeModal, simulatePrintingProgress]);

  // Fonction pour gérer le check-in seul
  const checkInOnly = useCallback(async (registration: Registration) => {
    initializeModal(registration);
    setStatus('checkin');
    setLastAction(() => () => checkInOnly(registration));

    try {
      // Appeler l'API de check-in
      await registrationsService.checkIn(registration.id, registration.event_id);
      
      setStatus('success');
      console.log('Checked in:', registration.attendee.first_name);
      
      // Rafraîchir les statistiques si on a un eventId
      if (registration.event_id) {
        await refreshStats(registration.event_id);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Erreur lors du check-in');
      console.error('Check-in error:', error);
    }
  }, [initializeModal, refreshStats]);

  // Fonction principale : imprimer ET faire le check-in
  const printAndCheckIn = useCallback(async (registration: Registration) => {
    initializeModal(registration);
    setStatus('printing');
    setLastAction(() => () => printAndCheckIn(registration));

    try {
      // Étape 1: Impression avec progression
      await simulatePrintingProgress();
      
      // TODO: Appeler l'API d'impression réelle
      // await registrationApi.printBadge(registration.id);
      
      // Étape 2: Check-in
      setStatus('checkin');
      setProgress(0);
      
      await registrationsService.checkIn(registration.id, registration.event_id);
      
      setStatus('success');
      setProgress(100);
      console.log('Printed and checked in:', registration.attendee.first_name);
      
      // Rafraîchir les statistiques
      if (registration.event_id) {
        await refreshStats(registration.event_id);
      }
    } catch (error) {
      setStatus('error');
      setErrorMessage('Erreur lors de l\'impression et du check-in');
      console.error('Print and check-in error:', error);
    }
  }, [initializeModal, simulatePrintingProgress, refreshStats]);

  // Fonction pour fermer le modal
  const closeModal = useCallback(() => {
    setIsModalVisible(false);
    setCurrentAttendee(null);
    setStatus('idle');
    setErrorMessage(null);
    setProgress(0);
    setLastAction(null);
  }, []);

  // Fonction pour retry la dernière action
  const retryAction = useCallback(async () => {
    if (lastAction && currentAttendee) {
      setErrorMessage(null);
      await lastAction();
    }
  }, [lastAction, currentAttendee]);

  return {
    // État
    status,
    isModalVisible,
    currentAttendee,
    errorMessage,
    progress,

    // Actions
    printAndCheckIn,
    printOnly,
    checkInOnly,
    closeModal,
    retryAction,

    // Statistiques
    stats,
    refreshStats,
  };
};