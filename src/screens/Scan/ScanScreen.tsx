/**
 * ScanScreen - Screen pour scanner les QR Codes et effectuer le check-in
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { checkInRegistrationThunk, checkOutRegistrationThunk } from '../../store/registrations.slice';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { SessionsService } from '../../api/backend/sessions.service';
import { getBadgePdfBase64 } from '../../api/backend/badges.service';
import { sendPrintJob } from '../../api/printNode/printers.service';
import { PrintJob } from '../../printing/types';

const PRINT_ON_SCAN_KEY = '@print_settings:print_on_scan';

type RootStackParamList = {
  EventInner: { eventId: string };
  Scan: { eventId: string; sessionId?: string; sessionName?: string };
};

type ScanScreenRouteProp = RouteProp<RootStackParamList, 'Scan'>;
type ScanScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Scan'>;

interface ScanScreenProps {
  navigation: any;
  route?: any;
}

export const ScanScreen: React.FC<ScanScreenProps> = ({ navigation: navProp, route: routeProp }) => {
  const route = useRoute<ScanScreenRouteProp>();
  const navigation = useNavigation<ScanScreenNavigationProp>();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const eventId = route.params?.eventId || routeProp?.params?.eventId;
  const sessionId = route.params?.sessionId || routeProp?.params?.sessionId;
  const sessionName = route.params?.sessionName || routeProp?.params?.sessionName;

  const [permission, requestPermission] = useCameraPermissions();
  const [scanMode, setScanMode] = useState<'check-in' | 'check-out'>('check-in');
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0))[0];
  const [printOnScan, setPrintOnScan] = useState(false);

  // Récupérer le printer sélectionné depuis le store
  const selectedPrinter = useAppSelector((state) => state.printers.selectedPrinter);

  // Demander la permission caméra au montage
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        if (!permission) {
          console.log('[ScanScreen] Requesting camera permission...');
          await requestPermission();
        }
      } catch (error) {
        console.error('[ScanScreen] Error requesting permission:', error);
      }
    };
    
    requestCameraPermission();
  }, [permission, requestPermission]);

  // Charger la préférence d'impression au scan
  useEffect(() => {
    loadPrintOnScanPreference();
  }, []);

  const loadPrintOnScanPreference = async () => {
    try {
      const value = await AsyncStorage.getItem(PRINT_ON_SCAN_KEY);
      if (value !== null) {
        setPrintOnScan(value === 'true');
        console.log('[ScanScreen] Print on scan enabled:', value === 'true');
      }
    } catch (error) {
      console.error('[ScanScreen] Error loading print preference:', error);
    }
  };

  // Afficher feedback visuel
  const showFeedback = (message: string, type: 'success' | 'error' | 'warning') => {
    setFeedbackMessage(message);
    setFeedbackType(type);

    // Animation d'apparition
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Masquer après 3 secondes
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setFeedbackMessage(null);
        setFeedbackType(null);
      });
    }, 3000);
  };

  // Fonction pour imprimer le badge automatiquement
  const autoPrintBadge = async (registration: any) => {
    if (!printOnScan) {
      console.log('[ScanScreen] Auto-print disabled');
      return;
    }

    if (!selectedPrinter) {
      console.log('[ScanScreen] No printer selected, skipping auto-print');
      return;
    }

    try {
      console.log('[ScanScreen] Starting auto-print for registration:', registration.id);
      
      // Extraire le badge ID depuis l'URL
      const badgeUrl = registration.badge_pdf_url;
      if (!badgeUrl) {
        console.log('[ScanScreen] No badge URL, skipping auto-print');
        return;
      }

      const badgeIdMatch = badgeUrl.match(/\/badges\/([a-f0-9-]+)\//i);
      if (!badgeIdMatch) {
        console.error('[ScanScreen] Cannot extract badge ID from URL:', badgeUrl);
        return;
      }
      
      const badgeId = badgeIdMatch[1];
      console.log('[ScanScreen] Fetching badge PDF base64 for:', badgeId);
      
      const badgeBase64 = await getBadgePdfBase64(badgeId);
      console.log('[ScanScreen] Badge PDF fetched, length:', badgeBase64.length);

      const printJob: PrintJob = {
        printerId: selectedPrinter.id,
        title: `Badge - ${registration.attendee.first_name} ${registration.attendee.last_name}`,
        contentType: 'pdf_base64',
        content: badgeBase64,
        source: 'EMS Mobile App - Auto Print',
        options: {
          copies: 1,
          fitToPage: true,
        },
      };

      const printResult = await sendPrintJob(printJob);
      console.log('[ScanScreen] Auto-print successful:', printResult.id);
      
    } catch (error) {
      console.error('[ScanScreen] Auto-print failed:', error);
      // Ne pas afficher d'erreur à l'utilisateur pour ne pas perturber le flux de scan
    }
  };

  // Handler pour le scan du QR Code
  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || isProcessing) {
      console.log('[ScanScreen] Already processing, ignoring scan');
      return;
    }

    setScanned(true);
    setIsProcessing(true);

    const data = result.data;

    console.log('[ScanScreen] QR Code scanned:', {
      type: result.type,
      data,
      eventId,
      mode: scanMode,
    });

    // Vérifier que data est un UUID valide
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data)) {
      console.error('[ScanScreen] Invalid QR Code format:', data);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {
        console.warn('[ScanScreen] Haptics not available:', e);
      }
      showFeedback(t('scan.invalidQR'), 'error');
      setIsProcessing(false);
      setTimeout(() => resetScan(), 3000);
      return;
    }

    const registrationId = data;

    try {
      if (sessionId) {
        // --- MODE SESSION ---
        console.log(`[ScanScreen] Session ${scanMode} for session: ${sessionId}`);
        
        const result = await SessionsService.scanParticipant(eventId, sessionId, {
          registrationId,
          scanType: scanMode === 'check-in' ? 'IN' : 'OUT'
        });

        console.log('[ScanScreen] Session scan successful:', result);

        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          console.warn('[ScanScreen] Haptics not available:', e);
        }
        
        const attendee = result.registration?.attendee;
        const fullName = attendee ? `${attendee.first_name} ${attendee.last_name}` : 'Participant';
        const actionText = scanMode === 'check-in' ? 'Entrée confirmée' : 'Sortie confirmée';
        
        showFeedback(`✓ ${fullName} - ${actionText}`, 'success');
        setTimeout(() => resetScan(), 3000);

      } else if (scanMode === 'check-in') {
        // --- MODE EVENT CHECK-IN ---
        const result = await dispatch(
          checkInRegistrationThunk({
            registrationId,
            eventId,
          })
        ).unwrap();

        console.log('[ScanScreen] Check-in successful:', result);

        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          console.warn('[ScanScreen] Haptics not available:', e);
        }
        const fullName = `${result.attendee?.first_name} ${result.attendee?.last_name}`;
        showFeedback(`✓ ${fullName} - ${t('scan.checkInSuccess')}`, 'success');
        
        // Impression automatique si activée
        await autoPrintBadge(result);
        
        setTimeout(() => resetScan(), 3000);
      } else {
        // MODE CHECK-OUT
        const result = await dispatch(
          checkOutRegistrationThunk({
            registrationId,
            eventId,
          })
        ).unwrap();

        console.log('[ScanScreen] Check-out successful:', result);

        try {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {
          console.warn('[ScanScreen] Haptics not available:', e);
        }
        const fullName = `${result.attendee?.first_name} ${result.attendee?.last_name}`;
        showFeedback(`✓ ${fullName} - ${t('scan.checkOutSuccess')}`, 'success');
        setTimeout(() => resetScan(), 3000);
      }
    } catch (error: any) {
      console.error(`[ScanScreen] ${scanMode} failed:`, error);
      console.log('[ScanScreen] Error structure:', JSON.stringify(error, null, 2));

      // Vibration d'erreur
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {
        console.warn('[ScanScreen] Haptics not available:', e);
      }

      // Récupérer le message d'erreur depuis la réponse
      let errorMessage = scanMode === 'check-in' 
        ? 'Erreur lors du check-in'
        : 'Erreur lors du check-out';
      
      if (error?.detail) {
        errorMessage = error.detail;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      console.log('[ScanScreen] Parsed error message:', errorMessage);
      
      // Messages spécifiques selon le type d'erreur
      // Messages spécifiques session
      if (errorMessage.includes('Session is full')) {
        showFeedback('⛔ Session complète (Capacité atteinte)', 'error');
      } else if (errorMessage.includes('Access denied for this attendee type')) {
        showFeedback('⛔ Accès refusé : Type de participant non autorisé', 'error');
      } else if (errorMessage.includes('QR Code mismatch') || errorMessage.includes('pas pour cet événement') || errorMessage.includes('not match')) {
        showFeedback('⚠️ Ce QR Code est pour un autre événement', 'warning');
      } else if (errorMessage.includes('Already checked-in') || errorMessage.includes('déjà enregistré')) {
        showFeedback(t('scan.alreadyCheckedIn'), 'warning');
      } else if (errorMessage.includes('Already checked-out') || errorMessage.includes('déjà sorti')) {
        showFeedback(t('scan.alreadyCheckedOut'), 'warning');
      } else if (errorMessage.includes('not checked-in') || errorMessage.includes('pas encore enregistré')) {
        showFeedback(t('scan.notCheckedIn'), 'warning');
      } else if (errorMessage.includes('was refused') || errorMessage.includes('été refusé') || errorMessage.includes('refusée')) {
        showFeedback(t('scan.participantRefused'), 'error');
      } else if (errorMessage.includes('was cancelled') || errorMessage.includes('été annulé') || errorMessage.includes('annulée')) {
        showFeedback(t('scan.participantCancelled'), 'error');
      } else if (errorMessage.includes('not found') || errorMessage.includes('introuvable')) {
        showFeedback('❌ Inscription introuvable', 'error');
      } else {
        showFeedback(`❌ ${errorMessage}`, 'error');
      }

      setTimeout(() => resetScan(), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Réinitialiser pour permettre un nouveau scan
  const resetScan = () => {
    console.log('[ScanScreen] Resetting scan state');
    setScanned(false);
    setIsProcessing(false);
  };

  // Gestion des permissions
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.brand[600]} />
        <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>Demande de permission caméra...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.warning[500]} />
        <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>Accès à la caméra refusé</Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.text.secondary }]}>
          Veuillez autoriser l'accès à la caméra dans les paramètres de votre téléphone.
        </Text>
        <TouchableOpacity
          style={[styles.backButton, { backgroundColor: theme.colors.brand[600] }]}
          onPress={() => requestPermission()}
        >
          <Text style={styles.backButtonText}>Demander à nouveau</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.backButton, { marginTop: 12, backgroundColor: theme.colors.neutral[500] }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Interface de scan
  return (
    <View style={styles.container}>
      {permission?.granted && (
        <CameraView
          style={StyleSheet.absoluteFillObject}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        />
      )}

      {/* Overlay avec cadre de scan */}
      <View style={styles.overlay}>
        {/* Close Button - Position absolue pour ne pas gêner le centrage */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.header}>
          {/* Sélecteur de mode */}
          <View style={styles.modeSelectorContainer}>
            <Text style={styles.modeSelectorLabel}>{t('scan.modeSelector')}</Text>
            <View style={styles.modeButtons}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === 'check-in' && styles.modeButtonActive,
                  { backgroundColor: scanMode === 'check-in' ? theme.colors.brand[600] : theme.colors.neutral[700] },
                ]}
                onPress={() => setScanMode('check-in')}
                disabled={isProcessing}
              >
                <Ionicons
                  name="enter-outline"
                  size={28}
                  color={scanMode === 'check-in' ? '#FFFFFF' : theme.colors.neutral[400]}
                />
                <Text style={[
                  styles.modeButtonText,
                  { color: scanMode === 'check-in' ? '#FFFFFF' : theme.colors.neutral[400] }
                ]}>
                  {t('scan.checkInMode')}
                </Text>
                <Text style={[
                  styles.modeButtonDesc,
                  { color: scanMode === 'check-in' ? '#FFFFFF' : theme.colors.neutral[500] }
                ]}>
                  {t('scan.checkInDescription')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  scanMode === 'check-out' && styles.modeButtonActive,
                  { backgroundColor: scanMode === 'check-out' ? theme.colors.success[600] : theme.colors.neutral[700] },
                ]}
                onPress={() => setScanMode('check-out')}
                disabled={isProcessing}
              >
                <Ionicons
                  name="exit-outline"
                  size={28}
                  color={scanMode === 'check-out' ? '#FFFFFF' : theme.colors.neutral[400]}
                />
                <Text style={[
                  styles.modeButtonText,
                  { color: scanMode === 'check-out' ? '#FFFFFF' : theme.colors.neutral[400] }
                ]}>
                  {t('scan.checkOutMode')}
                </Text>
                <Text style={[
                  styles.modeButtonDesc,
                  { color: scanMode === 'check-out' ? '#FFFFFF' : theme.colors.neutral[500] }
                ]}>
                  {t('scan.checkOutDescription')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.scanAreaContainer}>
          <View style={styles.scanArea}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>

          <Text style={styles.instructionText}>
            {sessionName ? `Scanner pour : ${sessionName}` : (
              isProcessing
              ? 'Vérification en cours...'
              : 'Scannez le QR Code du participant'
            )}
          </Text>

          {isProcessing && (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}

          {/* Feedback Message Animé */}
          {feedbackMessage && (
            <Animated.View
              style={[
                styles.feedbackContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
                feedbackType === 'success' && styles.feedbackSuccess,
                feedbackType === 'error' && styles.feedbackError,
                feedbackType === 'warning' && styles.feedbackWarning,
              ]}
            >
              <Text style={styles.feedbackText}>{feedbackMessage}</Text>
            </Animated.View>
          )}
        </View>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.resetButton, !scanned && styles.resetButtonDisabled]}
            onPress={resetScan}
            disabled={!scanned || isProcessing}
          >
            <Text style={styles.resetButtonText}>
              {scanned ? 'Scanner à nouveau' : 'En attente...'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  backButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    paddingTop: 80,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
  },
  modeSelectorContainer: {
    width: '100%',
  },
  modeSelectorLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  modeButtonActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  modeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
  },
  modeButtonDesc: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scanAreaContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#FFFFFF',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 40,
    textAlign: 'center',
  },
  processingContainer: {
    marginTop: 24,
  },
  feedbackContainer: {
    position: 'absolute',
    top: '50%',
    left: '10%',
    right: '10%',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackSuccess: {
    backgroundColor: '#10B981',
  },
  feedbackError: {
    backgroundColor: '#EF4444',
  },
  feedbackWarning: {
    backgroundColor: '#F59E0B',
  },
  feedbackText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  footer: {
    paddingBottom: 60,
    paddingHorizontal: 20,
  },
  resetButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  resetButtonDisabled: {
    backgroundColor: '#4B5563',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
