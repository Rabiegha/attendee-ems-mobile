/**
 * Hook centralisé pour gérer le check-in et l'impression des badges
 * avec modales animées et gestion d'état unifiée
 */

import { useState, useCallback, useMemo } from 'react';
import { Registration } from '../types/attendee';
import { registrationsService } from '../api/backend/registrations.service';
import { sendPrintJob, PrintJob } from '../api/printNode/printers.service';
import { getBadgeHtml } from '../api/backend/badges.service';
import { useAppSelector, useAppDispatch } from '../store/hooks';
import { loadSelectedPrinterThunk } from '../store/printers.slice';
import { loadSelectedEmsPrinterThunk, fetchEmsPrintersThunk, clearSelectedEmsPrinterThunk } from '../store/emsPrinters.slice';
import { updateRegistration } from '../store/registrations.slice';
import { setPrintStatus } from '../store/printStatus.slice';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { debugPrinterStorage } from '../utils/printerDebug';
import { hapticSuccess, hapticError, hapticLight } from '../utils/haptics';
import axiosClient from '../api/backend/axiosClient';
import { getPrintMode } from '../printing/preferences/printMode';
import { addToPrintQueue, getEmsClientStatus } from '../api/backend/printQueue.service';

export type CheckInStatus = 'idle' | 'printing' | 'checkin' | 'undoing' | 'success' | 'error';

export interface UseCheckInResult {
  // État du processus
  status: CheckInStatus;
  currentAttendee: Registration | null;
  errorMessage: string | null;
  progress: number; // Pourcentage de progression (0-100)

  // Actions avec callbacks pour confirmation et toast
  printAndCheckIn: (registration: Registration, onSuccess?: (message: string) => void, onError?: (message: string) => void) => Promise<void>;
  printOnly: (registration: Registration, onSuccess?: (message: string) => void, onError?: (message: string) => void) => Promise<void>;
  checkInOnly: (registration: Registration, onSuccess?: (message: string) => void, onError?: (message: string) => void) => Promise<void>;
  undoCheckIn: (registration: Registration, onSuccess?: (message: string) => void, onError?: (message: string) => void) => Promise<void>;

  // Statistiques dynamiques (calculées en temps réel depuis Redux)
  stats: {
    total: number;
    checkedIn: number;
    percentage: number;
    isLoading: boolean;
  };
}

export const useCheckIn = (): UseCheckInResult => {
  // État principal
  const [status, setStatus] = useState<CheckInStatus>('idle');
  const [currentAttendee, setCurrentAttendee] = useState<Registration | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const dispatch = useAppDispatch();

  // Récupérer l'utilisateur connecté depuis le store Redux
  const user = useAppSelector(state => state.auth.user);

  // Récupérer l'imprimante sélectionnée depuis le store Redux
  const selectedPrinter = useAppSelector(state => state.printers.selectedPrinter);
  const printersState = useAppSelector(state => state.printers);
  const selectedEmsPrinter = useAppSelector(state => state.emsPrinters.selectedPrinter);

  // Récupérer les registrations depuis Redux pour calculer les stats en temps réel
  const registrations = useAppSelector(state => state.registrations.registrations);
  const paginationTotal = useAppSelector(state => state.registrations.pagination.total);
  const currentEventStats = useAppSelector(state => state.events.currentEventStats);

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

  // Fonction pour s'assurer qu'une imprimante EMS est chargée
  const ensureEmsPrinterLoaded = useCallback(async () => {
    console.log('[useCheckIn] 🔍 Ensuring EMS printer is loaded...');
    
    if (selectedEmsPrinter) {
      console.log('[useCheckIn] ✅ Using EMS printer from store:', selectedEmsPrinter.name);
      return selectedEmsPrinter;
    }

    console.log('[useCheckIn] No EMS printer in store, loading from AsyncStorage...');
    try {
      const result = await dispatch(loadSelectedEmsPrinterThunk()).unwrap();
      console.log('[useCheckIn] ✅ EMS printer loaded:', result?.name || 'null');
      return result;
    } catch (error) {
      console.error('[useCheckIn] ❌ Failed to load EMS printer:', error);
      return null;
    }
  }, [selectedEmsPrinter, dispatch]);

  // Valider que l'imprimante EMS sélectionnée est toujours exposée par le client
  const validateEmsPrinter = useCallback(async (printer: { name: string }) => {
    console.log('[useCheckIn] 🔍 Validating EMS printer is still exposed:', printer.name);
    try {
      const printers = await dispatch(fetchEmsPrintersThunk()).unwrap();
      const stillExists = printers.some((p: { name: string }) => p.name === printer.name);
      if (!stillExists) {
        console.log('[useCheckIn] ❌ Printer no longer exposed:', printer.name);
        await dispatch(clearSelectedEmsPrinterThunk()).unwrap();
        return false;
      }
      console.log('[useCheckIn] ✅ Printer still exposed:', printer.name);
      return true;
    } catch (error) {
      console.warn('[useCheckIn] ⚠️ Could not validate printer, proceeding anyway:', error);
      return true; // En cas d'erreur réseau, on laisse passer
    }
  }, [dispatch]);

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

  // Calculer les statistiques depuis l'API (currentEventStats) ou fallback sur calcul local
  const stats = useMemo(() => {
    // Si les stats API sont disponibles, les utiliser (données exactes)
    if (currentEventStats) {
      console.log('[useCheckIn] Using API stats:', currentEventStats);
      return {
        total: currentEventStats.totalRegistrations,
        checkedIn: currentEventStats.checkedIn,
        percentage: currentEventStats.checkedInPercentage,
        isLoading: false,
      };
    }

    // Fallback: calculer depuis les registrations paginées (moins précis)
    const total = paginationTotal || registrations.length;
    const checkedIn = registrations.filter(reg => reg.checked_in_at !== null).length;
    const percentage = total > 0 ? Math.round((checkedIn / total) * 100) : 0;

    console.log('[useCheckIn] Using calculated stats (fallback):', {
      total,
      checkedIn,
      percentage,
      registrationsCount: registrations.length,
    });

    return {
      total,
      checkedIn,
      percentage,
      isLoading: false,
    };
  }, [currentEventStats, registrations, paginationTotal]);

  // Fonction utilitaire pour initialiser l'état
  const initializeState = useCallback((attendee: Registration) => {
    setCurrentAttendee(attendee);
    setErrorMessage(null);
    setProgress(0);
  }, []);



  // Fonction pour gérer l'impression seule
  const printOnly = useCallback(async (
    registration: Registration,
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ) => {
    console.log('[useCheckIn] 🖨️ Starting print process for:', {
      registrationId: registration.id,
      attendeeName: `${registration.attendee.first_name} ${registration.attendee.last_name}`,
      eventId: registration.event_id,
    });

    initializeState(registration);
    setStatus('printing');

    try {
      // 1. Vérifier le mode d'impression pour savoir si on a besoin d'une imprimante PrintNode
      const currentPrintMode = await getPrintMode();
      let printer: any = null;
      
      if (currentPrintMode === 'printnode') {
        // En mode PrintNode, on a besoin d'une imprimante sélectionnée
        console.log('[useCheckIn] 🔍 PrintNode mode: checking printer availability...');
        printer = await ensurePrinterLoaded();
        
        if (!printer) {
          console.error('[useCheckIn] ❌ No printer available after loading attempt');
          throw new Error('Aucune imprimante sélectionnée. Veuillez configurer une imprimante dans les paramètres.');
        }
        console.log('[useCheckIn] 🖨️ Using PrintNode printer:', printer.name);
      } else {
        console.log('[useCheckIn] 📡 EMS Client mode: printer managed by Electron client');
      }

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

      // 3. Déterminer le mode d'impression
      const printMode = await getPrintMode();
      console.log('[useCheckIn] 🔀 Print mode:', printMode);
      setProgress(20);

      if (printMode === 'ems-client') {
        // === MODE EMS PRINT CLIENT ===
        // Envoyer le job à la file d'impression backend → Electron client
        console.log('[useCheckIn] 📤 Sending to EMS Print Queue...');
        
        if (!user?.id) {
          throw new Error('Utilisateur non connecté. Veuillez vous reconnecter.');
        }

        const emsPrinter = await ensureEmsPrinterLoaded();
        
        // Bloquer si aucune imprimante n'est sélectionnée
        if (!emsPrinter) {
          throw new Error('Aucune imprimante sélectionnée. Allez dans Paramètres > Imprimantes pour en choisir une.');
        }

        // Vérifier que l'imprimante est toujours exposée par EMS Client
        const isStillValid = await validateEmsPrinter(emsPrinter);
        if (!isStillValid) {
          throw new Error(`L'imprimante "${emsPrinter.displayName || emsPrinter.name}" n'est plus disponible. Veuillez en sélectionner une autre dans Paramètres > Imprimantes.`);
        }

        const attendeeName = `${registration.attendee.first_name} ${registration.attendee.last_name}`;
        
        // Vérifier si EMS Client est connecté avant d'envoyer
        const clientStatus = await getEmsClientStatus();
        const isClientOnline = clientStatus.connected;
        
        // Afficher le statut approprié via le PrintStatusBanner
        dispatch(setPrintStatus({
          status: isClientOnline ? 'SENDING' : 'CLIENT_OFFLINE',
          attendeeName,
          printerName: emsPrinter.name,
        }));

        const queueJob = await addToPrintQueue(
          registration.id,
          registration.event_id,
          user.id,
          badgeUrl,
          emsPrinter.name,
          isClientOnline ? undefined : 'OFFLINE',
        );
        console.log('[useCheckIn] ✅ Job added to EMS print queue:', queueJob.id, 'printer:', emsPrinter.name, isClientOnline ? '(client online)' : '(client OFFLINE - will retry on reconnect)');
        setProgress(80);

        // Marquer comme imprimé dans le backend
        console.log('[useCheckIn] 📡 Marking badge as printed in backend...');
        await registrationsService.markBadgePrinted(registration.event_id, registration.id);

      } else {
        // === MODE PRINTNODE (legacy backup) ===
        // Récupérer le HTML du badge et envoyer directement à PrintNode
        console.log('[useCheckIn] 📥 Step 2: Getting badge HTML from API...');
        console.log('[useCheckIn] Badge URL:', badgeUrl.substring(0, 100) + '...');
        
        // Extraire le badge ID depuis l'URL
        const badgeIdMatch = badgeUrl.match(/\/badges\/([a-f0-9-]+)\//i);
        if (!badgeIdMatch) {
          throw new Error('Impossible d\'extraire l\'ID du badge depuis l\'URL');
        }
        const badgeId = badgeIdMatch[1];
        console.log('[useCheckIn] Badge ID extracted:', badgeId);
        
        // Récupérer le HTML du badge via la nouvelle API (RAPIDE!)
        const startTime = Date.now();
        console.log('[useCheckIn] ⚡ Fetching badge HTML (FAST MODE) from /badge-generation/:id/html...');
        const badgeHtml = await getBadgeHtml(badgeId);
        const fetchTime = Date.now() - startTime;
        console.log(`[useCheckIn] ⚡ HTML received in ${fetchTime}ms, length:`, badgeHtml.length);

        setProgress(50);

        // Envoyer le job d'impression à PrintNode avec HTML
        console.log('[useCheckIn] 🔄 Sending print job to PrintNode (HTML mode)...');
        
        const printJob: PrintJob = {
          printerId: printer.id,
          title: `Badge - ${registration.attendee.first_name} ${registration.attendee.last_name}`,
          contentType: 'raw_html',
          content: badgeHtml,
          source: 'EMS Mobile App (HTML)',
          options: {
            copies: 1,
          }
        };

        console.log('[useCheckIn] 📤 Calling sendPrintJob...');
        const printStartTime = Date.now();
        const printResult = await sendPrintJob(printJob);
        const totalTime = Date.now() - startTime;
        console.log(`[useCheckIn] ✅ Print job sent successfully in ${totalTime}ms:`, printResult);

        setProgress(80);

        // Marquer comme imprimé dans le backend
        console.log('[useCheckIn] 📡 Marking badge as printed in backend...');
        await registrationsService.markBadgePrinted(registration.event_id, registration.id);
      }
      
      setProgress(100);
      setStatus('success');
      console.log('[useCheckIn] ✅ Print completed successfully for:', registration.attendee.first_name);
      
      if (printMode === 'ems-client') {
        // En mode EMS, le PrintStatusBanner gère le feedback via WebSocket
        // Pas de haptic ici, le hook usePrintJobNotifications s'en charge
        console.log('[useCheckIn] 📤 EMS mode: status banner will show real-time feedback');
      } else {
        // En mode PrintNode, le job est envoyé directement → feedback immédiat
        hapticSuccess();
        if (onSuccess) {
          onSuccess(`Badge imprimé pour ${registration.attendee.first_name} ${registration.attendee.last_name}`);
        }
      }

    } catch (error: any) {
      setStatus('error');
      hapticError();
      const errorMsg = error.message || 'Erreur lors de l\'impression du badge';
      setErrorMessage(errorMsg);
      console.error('[useCheckIn] ❌ Print failed:', error);
      console.error('[useCheckIn] ❌ Error details:', {
        message: error?.message || 'No message',
        name: error?.name || 'No name',
        stack: error?.stack || 'No stack',
        registrationId: registration.id,
        fullError: JSON.stringify(error, null, 2),
      });
      
      if (onError) {
        onError(errorMsg);
      }
    }
  }, [initializeState, ensurePrinterLoaded]);

  // Fonction pour gérer le check-in seul
  const checkInOnly = useCallback(async (
    registration: Registration,
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ) => {
    console.log('[useCheckIn] ✅ Starting check-in process for:', {
      registrationId: registration.id,
      attendeeName: `${registration.attendee.first_name} ${registration.attendee.last_name}`,
      eventId: registration.event_id,
      alreadyCheckedIn: !!registration.checked_in_at,
    });

    initializeState(registration);
    setStatus('checkin');

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
      hapticSuccess();
      console.log('[useCheckIn] ✅ Check-in completed successfully:', {
        attendeeName: registration.attendee.first_name,
        message: result.message,
      });

      // Mettre à jour la registration dans le store Redux
      if (result.registration) {
        console.log('[useCheckIn] 🔄 Updating registration in store...');
        dispatch(updateRegistration(result.registration));
      }
      
      // Note: Les stats sont calculées automatiquement depuis Redux (useMemo)
      
      if (onSuccess) {
        onSuccess(`${registration.attendee.first_name} ${registration.attendee.last_name} enregistré(e)`);
      }
    } catch (error: any) {
      setStatus('error');
      hapticError();
      
      // Extraire le message d'erreur du backend
      let errorMsg = 'Erreur lors du check-in';
      
      if (error?.response?.data?.detail) {
        // Message du backend
        const detail = error.response.data.detail;
        
        // Traduire les messages en français
        if (detail.includes('refused')) {
          errorMsg = 'Cette inscription a été refusée. Veuillez contacter un administrateur.';
        } else if (detail.includes('cancelled')) {
          errorMsg = 'Cette inscription a été annulée.';
        } else if (detail.includes('Already checked-in')) {
          errorMsg = 'Cette personne est déjà enregistrée.';
        } else if (detail.includes('disabled')) {
          errorMsg = 'Le check-in est désactivé pour cet événement.';
        } else {
          errorMsg = detail;
        }
      } else if (error?.message) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      console.error('[useCheckIn] ❌ Check-in failed:', {
        error: error.message,
        registrationId: registration.id,
        response: error.response?.data,
        stack: error.stack,
      });
      
      if (onError) {
        onError(errorMsg);
      }
    }
  }, [initializeState, dispatch]);

  // Fonction pour annuler le check-in
  const undoCheckIn = useCallback(async (
    registration: Registration,
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ) => {
    console.log('[useCheckIn] ↩️ Starting undo check-in process for:', {
      registrationId: registration.id,
      attendeeName: `${registration.attendee.first_name} ${registration.attendee.last_name}`,
      eventId: registration.event_id,
      checkedInAt: registration.checked_in_at,
    });

    initializeState(registration);
    setStatus('undoing');

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
      hapticSuccess();
      console.log('[useCheckIn] ✅ Undo check-in completed successfully:', {
        attendeeName: registration.attendee.first_name,
        message: result.message,
      });

      // Mettre à jour la registration dans le store Redux
      if (result.registration) {
        console.log('[useCheckIn] 🔄 Updating registration in store after undo...');
        dispatch(updateRegistration(result.registration));
      }
      
      // Note: Les stats sont calculées automatiquement depuis Redux (useMemo)
      
      if (onSuccess) {
        onSuccess(`Check-in annulé pour ${registration.attendee.first_name} ${registration.attendee.last_name}`);
      }
    } catch (error: any) {
      setStatus('error');
      hapticError();
      const errorMsg = error.message || 'Erreur lors de l\'annulation du check-in';
      setErrorMessage(errorMsg);
      console.error('[useCheckIn] ❌ Undo check-in failed:', {
        error: error.message,
        registrationId: registration.id,
        response: error.response?.data,
        stack: error.stack,
      });
      
      if (onError) {
        onError(errorMsg);
      }
    }
  }, [initializeState, dispatch]);

  // Fonction principale : imprimer ET faire le check-in
  const printAndCheckIn = useCallback(async (
    registration: Registration,
    onSuccess?: (message: string) => void,
    onError?: (message: string) => void
  ) => {
    console.log('[useCheckIn] 🔄 Starting print and check-in process for:', {
      registrationId: registration.id,
      attendeeName: `${registration.attendee.first_name} ${registration.attendee.last_name}`,
      eventId: registration.event_id,
    });

    initializeState(registration);
    setStatus('printing');

    try {
      // Vérifier si déjà check-in
      if (registration.checked_in_at) {
        console.log('[useCheckIn] ⚠️ Already checked in, printing only');
        await printOnly(registration, onSuccess, onError);
        return;
      }

      // Vérifier le mode d'impression et l'imprimante si nécessaire
      const printMode = await getPrintMode();
      let printer: any = null;
      
      if (printMode === 'printnode') {
        console.log('[useCheckIn] 🔍 PrintNode mode: checking printer availability...');
        printer = await ensurePrinterLoaded();
        if (!printer) {
          throw new Error('Aucune imprimante sélectionnée. Veuillez configurer une imprimante dans les paramètres.');
        }
      } else {
        console.log('[useCheckIn] 📡 EMS Client mode: printer managed by Electron client');
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

      if (printMode === 'ems-client') {
        // === MODE EMS PRINT CLIENT ===
        console.log('[useCheckIn] 📤 Sending to EMS Print Queue...');
        
        if (!user?.id) {
          throw new Error('Utilisateur non connecté. Veuillez vous reconnecter.');
        }

        const emsPrinter = await ensureEmsPrinterLoaded();
        
        // Bloquer si aucune imprimante n'est sélectionnée
        if (!emsPrinter) {
          throw new Error('Aucune imprimante sélectionnée. Allez dans Paramètres > Imprimantes pour en choisir une.');
        }

        // Vérifier que l'imprimante est toujours exposée par EMS Client
        const isStillValid = await validateEmsPrinter(emsPrinter);
        if (!isStillValid) {
          throw new Error(`L'imprimante "${emsPrinter.displayName || emsPrinter.name}" n'est plus disponible. Veuillez en sélectionner une autre dans Paramètres > Imprimantes.`);
        }

        const attendeeName = `${registration.attendee.first_name} ${registration.attendee.last_name}`;
        
        // Vérifier si EMS Client est connecté avant d'envoyer
        const clientStatus = await getEmsClientStatus();
        const isClientOnline = clientStatus.connected;
        
        // Afficher le statut approprié via le PrintStatusBanner
        dispatch(setPrintStatus({
          status: isClientOnline ? 'SENDING' : 'CLIENT_OFFLINE',
          attendeeName,
          printerName: emsPrinter.name,
        }));

        const queueJob = await addToPrintQueue(
          registration.id,
          registration.event_id,
          user.id,
          badgeUrl,
          emsPrinter.name,
          isClientOnline ? undefined : 'OFFLINE',
        );
        console.log('[useCheckIn] ✅ Job added to EMS print queue:', queueJob.id, 'printer:', emsPrinter.name, isClientOnline ? '(client online)' : '(client OFFLINE - will retry on reconnect)');
        setProgress(50);

        console.log('[useCheckIn] 📝 Marking badge as printed in backend...');
        await registrationsService.markBadgePrinted(registration.event_id, registration.id);
        console.log('[useCheckIn] ✅ Badge marked as printed');
        setProgress(60);
      } else {
        // === MODE PRINTNODE ===
        console.log('[useCheckIn] 📥 Step 2: Getting badge HTML (FAST MODE)...');
        console.log('[useCheckIn] Badge URL:', badgeUrl.substring(0, 80) + '...');

        const badgeIdMatch = badgeUrl.match(/\/badges\/([a-f0-9-]+)\//i);
        if (!badgeIdMatch) {
          throw new Error('Impossible d\'extraire l\'ID du badge depuis l\'URL');
        }
        const badgeId = badgeIdMatch[1];
        console.log('[useCheckIn] Badge ID extracted:', badgeId);
        
        const startTime = Date.now();
        console.log('[useCheckIn] ⚡ Fetching HTML from /badge-generation/:id/html...');
        const badgeHtml = await getBadgeHtml(badgeId);
        const fetchTime = Date.now() - startTime;
        console.log(`[useCheckIn] ⚡ HTML received in ${fetchTime}ms, length:`, badgeHtml.length);

        setProgress(40);

        const printJob: PrintJob = {
          printerId: printer.id,
          title: `Badge - ${registration.attendee.first_name} ${registration.attendee.last_name}`,
          contentType: 'raw_html',
          content: badgeHtml,
          source: 'EMS Mobile App (HTML)',
          options: {
            copies: 1,
          }
        };

        console.log('[useCheckIn] 🖨️ Step 3: Sending print job to printer (HTML mode):', printer.name);
        const printStartTime = Date.now();
        const printResult = await sendPrintJob(printJob);
        const totalTime = Date.now() - startTime;
        console.log(`[useCheckIn] ✅ Print job sent successfully in ${totalTime}ms:`, printResult.id);
        setProgress(60);

        console.log('[useCheckIn] 📝 Step 4: Marking badge as printed in backend...');
        await registrationsService.markBadgePrinted(registration.event_id, registration.id);
        console.log('[useCheckIn] ✅ Badge marked as printed');
        setProgress(60);
      }

      // Étape 2: Check-in
      console.log('[useCheckIn] ✅ Processing check-in...');
      setStatus('checkin');
      setProgress(70);
      
      const checkInResult = await registrationsService.checkIn(registration.id, registration.event_id);
      console.log('[useCheckIn] ✅ Check-in completed:', checkInResult.message);
      
      // Mettre à jour la registration dans le store Redux
      if (checkInResult.registration) {
        console.log('[useCheckIn] 🔄 Updating registration in store after print & check-in...');
        dispatch(updateRegistration(checkInResult.registration));
      }
      
      setProgress(90);
      
      // Note: Les stats sont calculées automatiquement depuis Redux (useMemo)

      setProgress(100);
      setStatus('success');
      console.log('[useCheckIn] ✅ Print and check-in completed successfully for:', registration.attendee.first_name);
      
      if (printMode === 'ems-client') {
        // En mode EMS, le check-in est confirmé mais l'impression est async
        // Le PrintStatusBanner gère le feedback de l'impression via WebSocket
        hapticSuccess();
        if (onSuccess) {
          onSuccess(`${registration.attendee.first_name} ${registration.attendee.last_name} enregistré(e)`);
        }
      } else {
        // En mode PrintNode, tout est terminé
        if (onSuccess) {
          onSuccess(`${registration.attendee.first_name} ${registration.attendee.last_name} enregistré(e) et badge imprimé`);
        }
      }

    } catch (error: any) {
      setStatus('error');
      const errorMsg = error.message || 'Erreur lors de l\'impression et du check-in';
      setErrorMessage(errorMsg);
      console.error('[useCheckIn] ❌ Print and check-in failed:', {
        error: error.message,
        registrationId: registration.id,
        stack: error.stack,
      });
      
      if (onError) {
        onError(errorMsg);
      }
    }
  }, [initializeState, ensurePrinterLoaded, printOnly, dispatch]);

  // Mémoriser l'objet retourné pour éviter les re-rendus
  return useMemo(() => ({
    // État
    status,
    currentAttendee,
    errorMessage,
    progress,

    // Actions
    printAndCheckIn,
    printOnly,
    checkInOnly,
    undoCheckIn,

    // Statistiques (calculées automatiquement depuis Redux)
    stats,
  }), [
    status,
    currentAttendee,
    errorMessage,
    progress,
    printAndCheckIn,
    printOnly,
    checkInOnly,
    undoCheckIn,
    stats,
  ]);
};