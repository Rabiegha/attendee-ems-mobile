/**
 * Hook centralisé pour gérer le check-in et l'impression des badges
 * avec modales animées et gestion d'état unifiée
 */

import { useState, useCallback, useMemo } from 'react';
import { Registration } from '../types/attendee';
import { registrationsService } from '../api/backend/registrations.service';
import { sendPrintJob, PrintJob } from '../api/printNode/printers.service';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { loadSelectedPrinterThunk } from '../store/printers.slice';
import { updateRegistration } from '../store/registrations.slice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugPrinterStorage } from '../utils/printerDebug';

export type CheckInStatus = 'idle' | 'printing' | 'checkin' | 'undoing' | 'success' | 'error';

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
  undoCheckIn: (registration: Registration) => Promise<void>;
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

  const dispatch = useAppDispatch();

  // Récupérer l'imprimante sélectionnée depuis le store Redux
  const selectedPrinter = useAppSelector(state => state.printers.selectedPrinter);
  const printersState = useAppSelector(state => state.printers);

  // Debug logging pour l'état des imprimantes
  console.log('[useCheckIn] Printers state:', {
    selectedPrinter: selectedPrinter ? selectedPrinter.name : 'null',
    availablePrinters: printersState.printers.length,
    isLoading: printersState.isLoading,
    error: printersState.error
  });

  // Fonction pour s'assurer qu'une imprimante est chargée
  const ensurePrinterLoaded = useCallback(async () => {
    console.log('[useCheckIn] 🔍 Ensuring printer is loaded...');
    
    if (!selectedPrinter) {
      console.log('[useCheckIn] No printer in store, trying to load from AsyncStorage...');
      
      // Debug direct de AsyncStorage
      const debugResult = await debugPrinterStorage();
      
      try {
        // Essayer de charger depuis AsyncStorage via le thunk
        const result = await dispatch(loadSelectedPrinterThunk()).unwrap();
        console.log('[useCheckIn] ✅ Printer loaded via thunk:', result?.name || 'null');
        return result;
      } catch (error) {
        console.error('[useCheckIn] ❌ Failed to load printer via thunk:', error);
        
        // Fallback: utiliser le résultat du debug direct
        if (debugResult) {
          console.log('[useCheckIn] 🔄 Using fallback printer from direct storage read');
          return debugResult;
        }
        
        return null;
      }
    }
    
    console.log('[useCheckIn] ✅ Using printer from store:', selectedPrinter.name);
    return selectedPrinter;
  }, [selectedPrinter, dispatch]);

  // Fonction pour vérifier l'état de l'imprimante
  const checkPrinterStatus = useCallback(async () => {
    const printer = await ensurePrinterLoaded();
    
    if (!printer) {
      return {
        available: false,
        error: 'Aucune imprimante sélectionnée'
      };
    }

    // Vérifier l'état de l'imprimante
    if (printer.state !== 'online') {
      return {
        available: false,
        error: `Imprimante "${printer.name}" hors ligne`
      };
    }

    return {
      available: true,
      error: null
    };
  }, [ensurePrinterLoaded]);

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
      console.log('[useCheckIn] Stats received:', response);
      setStats({
        total: response.total || 0,
        checkedIn: response.checkedIn || 0,
        percentage: response.percentage || 0,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch event stats:', error);
      // En cas d'erreur, réinitialiser à des valeurs saines
      setStats({
        total: 0,
        checkedIn: 0,
        percentage: 0,
        isLoading: false,
      });
    }
  }, []);

  // Fonction utilitaire pour initialiser le modal
  const initializeModal = useCallback((attendee: Registration) => {
    setCurrentAttendee(attendee);
    setErrorMessage(null);
    setProgress(0);
    setIsModalVisible(true);
  }, []);



  // Fonction pour gérer l'impression seule
  const printOnly = useCallback(async (registration: Registration) => {
    console.log('[useCheckIn] 🖨️ Starting print process for:', {
      registrationId: registration.id,
      attendeeName: `${registration.attendee.first_name} ${registration.attendee.last_name}`,
      eventId: registration.event_id,
    });

    initializeModal(registration);
    setStatus('printing');
    setLastAction(() => () => printOnly(registration));

    try {
      // 1. Vérifier si une imprimante est sélectionnée ou essayer de la charger
      console.log('[useCheckIn] 🔍 Checking printer availability...');
      const printer = await ensurePrinterLoaded();
      
      if (!printer) {
        console.error('[useCheckIn] ❌ No printer available after loading attempt');
        throw new Error('Aucune imprimante sélectionnée. Veuillez configurer une imprimante dans les paramètres.');
      }

      console.log('[useCheckIn] 🖨️ Using printer:', printer.name);

      // 2. Vérifier si le badge PDF existe
      console.log('[useCheckIn] 📋 Checking badge availability...', {
        badgePdfUrl: registration.badge_pdf_url ? registration.badge_pdf_url.substring(0, 100) + '...' : null,
        badgeImageUrl: registration.badge_image_url ? registration.badge_image_url.substring(0, 100) + '...' : null,
      });

      let badgeUrl = registration.badge_pdf_url || registration.badge_image_url;
      
      // Si on a une URL de badge, vérifier qu'elle est accessible
      if (badgeUrl) {
        console.log('[useCheckIn] ✅ Badge URL found, testing accessibility...');
        try {
          const testResponse = await fetch(badgeUrl, { method: 'HEAD' });  // HEAD pour tester sans télécharger
          if (!testResponse.ok) {
            console.warn('[useCheckIn] ⚠️ Badge URL not accessible:', testResponse.status, testResponse.statusText);
            badgeUrl = null; // Forcer la régénération
          } else {
            console.log('[useCheckIn] ✅ Badge URL is accessible');
          }
        } catch (testError) {
          console.warn('[useCheckIn] ⚠️ Badge URL test failed:', testError);
          badgeUrl = null; // Forcer la régénération
        }
      }

      if (!badgeUrl) {
        console.log('[useCheckIn] ⚠️ No badge found, trying to refresh registration data...');
        setErrorMessage('Vérification du badge en cours...');
        
        try {
          // D'abord essayer de récupérer la registration mise à jour
          console.log('[useCheckIn] � Refreshing registration data...');
          const refreshedRegistration = await registrationsService.getRegistrationById(registration.event_id, registration.id);
          badgeUrl = refreshedRegistration.badge_pdf_url || refreshedRegistration.badge_image_url;
          
          if (badgeUrl) {
            console.log('[useCheckIn] ✅ Badge found after refresh:', badgeUrl.substring(0, 50) + '...');
          } else {
            // Si toujours pas de badge, essayer de le générer
            console.log('[useCheckIn] 📡 No badge after refresh, attempting generation...');
            setErrorMessage('Génération du badge en cours...');
            
            const updatedRegistration = await registrationsService.generateBadgeIfNeeded(registration.event_id, registration.id);
            badgeUrl = updatedRegistration.badge_pdf_url || updatedRegistration.badge_image_url;
            
            if (!badgeUrl) {
              console.error('[useCheckIn] ❌ Badge still not available after generation attempt');
              throw new Error('Badge non disponible. Veuillez réessayer ou contacter le support.');
            }
            
            console.log('[useCheckIn] ✅ Badge generated successfully:', badgeUrl.substring(0, 50) + '...');
          }
        } catch (generateError: any) {
          console.error('[useCheckIn] ❌ Badge retrieval/generation failed:', {
            error: generateError?.message || generateError,
            response: generateError?.response?.data,
            status: generateError?.response?.status
          });
          
          // Message d'erreur plus spécifique selon le type d'erreur
          let errorMessage = 'Erreur lors de la récupération du badge';
          if (generateError?.response?.status === 401) {
            errorMessage = 'Erreur d\'authentification. Veuillez vous reconnecter.';
          } else if (generateError?.response?.status === 404) {
            errorMessage = 'Registration non trouvée.';
          } else if (generateError?.response?.status >= 500) {
            // Vérifier si c'est le problème de template manquant
            const errorDetail = generateError?.response?.detail || '';
            if (errorDetail.includes('No badge template found')) {
              errorMessage = 'Template de badge manquant pour cet événement. Veuillez configurer un template dans l\'administration.';
            } else {
              errorMessage = 'Erreur serveur. Veuillez réessayer plus tard.';
            }
          }
          
          throw new Error(errorMessage);
        }
      }

      // 3. Télécharger le badge en base64
      console.log('[useCheckIn] � Downloading badge...');
      setProgress(20);
      
      const response = await fetch(badgeUrl);
      if (!response.ok) {
        throw new Error('Impossible de télécharger le badge');
      }
      
      const badgeBlob = await response.blob();
      const badgeBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(badgeBlob);
      });

      setProgress(50);

      // 4. Envoyer le job d'impression à PrintNode
      console.log('[useCheckIn] 🔄 Sending print job to PrintNode...');
      
      const printJob: PrintJob = {
        printerId: printer.id,
        title: `Badge - ${registration.attendee.first_name} ${registration.attendee.last_name}`,
        contentType: badgeUrl.includes('.pdf') ? 'pdf_base64' : 'png_base64',
        content: badgeBase64,
        source: 'EMS Mobile App',
        options: {
          copies: 1,
          fitToPage: true,
        }
      };

      const printResult = await sendPrintJob(printJob);
      console.log('[useCheckIn] ✅ Print job sent successfully:', printResult.id);

      setProgress(80);

      // 5. Marquer comme imprimé dans le backend
      console.log('[useCheckIn] 📡 Marking badge as printed in backend...');
      await registrationsService.markBadgePrinted(registration.event_id, registration.id);
      
      setProgress(100);
      setStatus('success');
      console.log('[useCheckIn] ✅ Print completed successfully for:', registration.attendee.first_name);

    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.message || 'Erreur lors de l\'impression du badge';
      setErrorMessage(errorMsg);
      console.error('[useCheckIn] ❌ Print failed:', {
        error: error.message,
        registrationId: registration.id,
        stack: error.stack,
      });
    }
  }, [initializeModal, ensurePrinterLoaded]);

  // Fonction pour gérer le check-in seul
  const checkInOnly = useCallback(async (registration: Registration) => {
    console.log('[useCheckIn] ✅ Starting check-in process for:', {
      registrationId: registration.id,
      attendeeName: `${registration.attendee.first_name} ${registration.attendee.last_name}`,
      eventId: registration.event_id,
      alreadyCheckedIn: !!registration.checked_in_at,
    });

    initializeModal(registration);
    setStatus('checkin');
    setLastAction(() => () => checkInOnly(registration));

    try {
      // Vérifier si déjà check-in
      if (registration.checked_in_at) {
        console.log('[useCheckIn] ⚠️ Already checked in at:', registration.checked_in_at);
        throw new Error('Cette personne est déjà enregistrée');
      }

      // Appeler l'API de check-in
      console.log('[useCheckIn] 📡 Calling check-in API...');
      const result = await registrationsService.checkIn(registration.id, registration.event_id);
      
      setStatus('success');
      console.log('[useCheckIn] ✅ Check-in completed successfully:', {
        attendeeName: registration.attendee.first_name,
        message: result.message,
      });

      // Mettre à jour la registration dans le store Redux
      if (result.registration) {
        console.log('[useCheckIn] 🔄 Updating registration in store...');
        dispatch(updateRegistration(result.registration));
      }
      
      // Rafraîchir les statistiques si on a un eventId
      if (registration.event_id) {
        console.log('[useCheckIn] 🔄 Refreshing stats...');
        await refreshStats(registration.event_id);
      }
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.message || 'Erreur lors du check-in';
      setErrorMessage(errorMsg);
      console.error('[useCheckIn] ❌ Check-in failed:', {
        error: error.message,
        registrationId: registration.id,
        response: error.response?.data,
        stack: error.stack,
      });
    }
  }, [initializeModal, refreshStats]);

  // Fonction pour annuler le check-in
  const undoCheckIn = useCallback(async (registration: Registration) => {
    console.log('[useCheckIn] ↩️ Starting undo check-in process for:', {
      registrationId: registration.id,
      attendeeName: `${registration.attendee.first_name} ${registration.attendee.last_name}`,
      eventId: registration.event_id,
      checkedInAt: registration.checked_in_at,
    });

    initializeModal(registration);
    setStatus('undoing');
    setLastAction(() => () => undoCheckIn(registration));

    try {
      // Vérifier si vraiment check-in
      if (!registration.checked_in_at && registration.status !== 'checked-in') {
        console.log('[useCheckIn] ⚠️ Not checked in, cannot undo');
        throw new Error('Cette personne n\'est pas encore enregistrée');
      }

      // Appeler l'API d'annulation du check-in
      console.log('[useCheckIn] 📡 Calling undo check-in API...');
      const result = await registrationsService.undoCheckIn(registration.id, registration.event_id);
      
      setStatus('success');
      console.log('[useCheckIn] ✅ Undo check-in completed successfully:', {
        attendeeName: registration.attendee.first_name,
        message: result.message,
      });

      // Mettre à jour la registration dans le store Redux
      if (result.registration) {
        console.log('[useCheckIn] 🔄 Updating registration in store after undo...');
        dispatch(updateRegistration(result.registration));
      }
      
      // Rafraîchir les statistiques si on a un eventId
      if (registration.event_id) {
        console.log('[useCheckIn] 🔄 Refreshing stats after undo...');
        await refreshStats(registration.event_id);
      }
    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.message || 'Erreur lors de l\'annulation du check-in';
      setErrorMessage(errorMsg);
      console.error('[useCheckIn] ❌ Undo check-in failed:', {
        error: error.message,
        registrationId: registration.id,
        response: error.response?.data,
        stack: error.stack,
      });
    }
  }, [initializeModal, refreshStats]);

  // Fonction principale : imprimer ET faire le check-in
  const printAndCheckIn = useCallback(async (registration: Registration) => {
    console.log('[useCheckIn] 🔄 Starting print and check-in process for:', {
      registrationId: registration.id,
      attendeeName: `${registration.attendee.first_name} ${registration.attendee.last_name}`,
      eventId: registration.event_id,
    });

    initializeModal(registration);
    setStatus('printing');
    setLastAction(() => () => printAndCheckIn(registration));

    try {
      // Vérifier si déjà check-in
      if (registration.checked_in_at) {
        console.log('[useCheckIn] ⚠️ Already checked in, printing only');
        await printOnly(registration);
        return;
      }

      // Vérifier l'imprimante
      console.log('[useCheckIn] 🔍 Checking printer availability for print and check-in...');
      const printer = await ensurePrinterLoaded();
      
      if (!printer) {
        throw new Error('Aucune imprimante sélectionnée. Veuillez configurer une imprimante dans les paramètres.');
      }

      // Étape 1: Impression (utiliser la même logique robuste que printOnly)
      console.log('[useCheckIn] 🖨️ Step 1: Printing badge...');
      let badgeUrl = registration.badge_pdf_url || registration.badge_image_url;

      // Vérifier l'accessibilité du badge existant
      if (badgeUrl) {
        console.log('[useCheckIn] ✅ Badge URL found, testing accessibility...');
        try {
          const testResponse = await fetch(badgeUrl, { method: 'HEAD' });
          if (!testResponse.ok) {
            console.warn('[useCheckIn] ⚠️ Badge URL not accessible:', testResponse.status);
            badgeUrl = null; // Forcer la régénération
          } else {
            console.log('[useCheckIn] ✅ Badge URL is accessible');
          }
        } catch (testError) {
          console.warn('[useCheckIn] ⚠️ Badge URL test failed:', testError);
          badgeUrl = null; // Forcer la régénération
        }
      }

      if (!badgeUrl) {
        console.log('[useCheckIn] ⚠️ No valid badge URL, initiating generation...');
        setErrorMessage('Génération du badge...');
        
        try {
          // Essayer de rafraîchir les données
          console.log('[useCheckIn] 🔄 Refreshing registration data...');
          const refreshedRegistration = await registrationsService.getRegistrationById(registration.event_id, registration.id);
          badgeUrl = refreshedRegistration.badge_pdf_url || refreshedRegistration.badge_image_url;
          
          if (!badgeUrl) {
            // Générer le badge
            console.log('[useCheckIn] 📡 Generating new badge...');
            setErrorMessage('Création du badge...');
            const updatedRegistration = await registrationsService.generateBadgeIfNeeded(registration.event_id, registration.id);
            badgeUrl = updatedRegistration.badge_pdf_url || updatedRegistration.badge_image_url;
            
            if (!badgeUrl) {
              throw new Error('Badge généré mais URL non disponible. Veuillez réessayer.');
            }
            
            console.log('[useCheckIn] ✅ Badge generated successfully');
          } else {
            console.log('[useCheckIn] ✅ Badge found after refresh');
          }
        } catch (generateError: any) {
          console.error('[useCheckIn] ❌ Badge generation failed:', generateError);
          const errorDetail = generateError?.response?.detail || generateError?.message || '';
          
          if (errorDetail.includes('No badge template found')) {
            throw new Error('Template de badge manquant. Configuration requise par l\'administrateur.');
          } else if (generateError?.response?.status === 401) {
            throw new Error('Session expirée. Veuillez vous reconnecter.');
          } else {
            throw new Error('Impossible de générer le badge: ' + (generateError?.message || 'Erreur inconnue'));
          }
        }
      }

      setProgress(20);
      console.log('[useCheckIn] 📥 Step 2: Downloading badge from:', badgeUrl.substring(0, 80) + '...');

      // Télécharger et imprimer le badge
      const response = await fetch(badgeUrl);
      if (!response.ok) {
        console.error('[useCheckIn] ❌ Badge download failed:', response.status, response.statusText);
        throw new Error(`Impossible de télécharger le badge (${response.status})`);
      }
      
      console.log('[useCheckIn] ✅ Badge downloaded successfully, converting to base64...');
      
      const badgeBlob = await response.blob();
      const badgeBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(badgeBlob);
      });

      setProgress(40);

      const printJob: PrintJob = {
        printerId: printer.id,
        title: `Badge - ${registration.attendee.first_name} ${registration.attendee.last_name}`,
        contentType: badgeUrl.includes('.pdf') ? 'pdf_base64' : 'png_base64',
        content: badgeBase64,
        source: 'EMS Mobile App',
        options: {
          copies: 1,
          fitToPage: true,
        }
      };

      console.log('[useCheckIn] 🖨️ Step 3: Sending print job to printer:', printer.name);
      const printResult = await sendPrintJob(printJob);
      console.log('[useCheckIn] ✅ Print job sent successfully:', printResult.id);
      setProgress(60);

      console.log('[useCheckIn] 📝 Step 4: Marking badge as printed in backend...');
      await registrationsService.markBadgePrinted(registration.event_id, registration.id);
      console.log('[useCheckIn] ✅ Badge marked as printed');
      setProgress(70);

      // Étape 2: Check-in
      console.log('[useCheckIn] ✅ Step 5: Processing check-in...');
      setStatus('checkin');
      
      const checkInResult = await registrationsService.checkIn(registration.id, registration.event_id);
      console.log('[useCheckIn] ✅ Check-in completed:', checkInResult.message);
      
      // Mettre à jour la registration dans le store Redux
      if (checkInResult.registration) {
        console.log('[useCheckIn] 🔄 Updating registration in store after print & check-in...');
        dispatch(updateRegistration(checkInResult.registration));
      }
      
      setProgress(90);
      
      // Rafraîchir les statistiques
      if (registration.event_id) {
        await refreshStats(registration.event_id);
      }

      setProgress(100);
      setStatus('success');
      console.log('[useCheckIn] ✅ Print and check-in completed successfully for:', registration.attendee.first_name);

    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.message || 'Erreur lors de l\'impression et du check-in';
      setErrorMessage(errorMsg);
      console.error('[useCheckIn] ❌ Print and check-in failed:', {
        error: error.message,
        registrationId: registration.id,
        stack: error.stack,
      });
    }
  }, [initializeModal, ensurePrinterLoaded, printOnly, refreshStats]);

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

  // Mémoriser l'objet retourné pour éviter les re-rendus
  return useMemo(() => ({
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
    undoCheckIn,
    closeModal,
    retryAction,

    // Statistiques
    stats,
    refreshStats,
  }), [
    status,
    isModalVisible,
    currentAttendee,
    errorMessage,
    progress,
    printAndCheckIn,
    printOnly,
    checkInOnly,
    undoCheckIn,
    closeModal,
    retryAction,
    stats,
    refreshStats,
  ]);
};