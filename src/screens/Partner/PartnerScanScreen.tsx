/**
 * PartnerScanScreen - Scanner QR Code pour les partenaires
 * Scanne le badge d'un participant → crée un PartnerScan via l'API
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createPartnerScanThunk, updatePartnerScanCommentThunk, clearPartnerScansError } from '../../store/partnerScans.slice';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';

type PartnerInnerTabsParamList = {
  PartnerScan: { eventId: string };
};

type PartnerScanRouteProp = RouteProp<PartnerInnerTabsParamList, 'PartnerScan'>;

export const PartnerScanScreen: React.FC<{ route?: any }> = ({ route: routeProp }) => {
  const route = useRoute<PartnerScanRouteProp>();
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { theme } = useTheme();
  const { t } = useTranslation();

  const eventId = route.params?.eventId || routeProp?.params?.eventId;
  const { isCreating, currentScan } = useAppSelector((state) => state.partnerScans);

  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'warning' | null>(null);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0))[0];

  // Post-scan state: afficher les données du contact scanné
  const [scanResult, setScanResult] = useState<{
    name: string;
    email: string;
    company?: string;
    jobTitle?: string;
  } | null>(null);
  const [comment, setComment] = useState('');
  const [showCommentInput, setShowCommentInput] = useState(false);

  // Refs pour cleanup des timeouts au démontage
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup tous les timeouts au démontage du composant
  useEffect(() => {
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  // Demander la permission caméra au montage
  useEffect(() => {
    const requestCameraPermission = async () => {
      try {
        if (!permission) {
          console.log('[PartnerScan] Requesting camera permission...');
          await requestPermission();
        }
      } catch (error) {
        console.error('[PartnerScan] Error requesting permission:', error);
      }
    };
    requestCameraPermission();
  }, [permission, requestPermission]);

  // Afficher feedback animé
  const showFeedback = (message: string, type: 'success' | 'error' | 'warning') => {
    setFeedbackMessage(message);
    setFeedbackType(type);

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

    // Masquer après 4 secondes (plus long pour lire les infos)
    if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    feedbackTimeoutRef.current = setTimeout(() => {
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
    }, 4000);
  };

  // Handler pour le scan du QR Code
  const handleBarCodeScanned = async (result: BarcodeScanningResult) => {
    if (scanned || isProcessing) {
      return;
    }

    setScanned(true);
    setIsProcessing(true);

    const data = result.data;
    console.log('[PartnerScan] QR Code scanned:', { data, eventId });

    // Vérifier que data est un UUID valide (registration_id)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(data)) {
      console.error('[PartnerScan] Invalid QR Code format:', data);
      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {
        console.warn('[PartnerScan] Haptics not available:', e);
      }
      showFeedback('QR Code invalide', 'error');
      setIsProcessing(false);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = setTimeout(() => resetScan(), 3000);
      return;
    }

    try {
      const scanResult = await dispatch(
        createPartnerScanThunk({
          event_id: eventId,
          registration_id: data,
          comment: '',
        })
      ).unwrap();

      console.log('[PartnerScan] Scan created:', scanResult.id);

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        console.warn('[PartnerScan] Haptics not available:', e);
      }

      const attendee = scanResult.attendee_data;
      const fullName = `${attendee?.first_name || ''} ${attendee?.last_name || ''}`.trim();

      // Afficher les infos du contact scanné
      setScanResult({
        name: fullName || 'Contact',
        email: attendee?.email || '',
        company: attendee?.company,
        jobTitle: attendee?.job_title,
      });
      setShowCommentInput(true);

      showFeedback(`✓ ${fullName} enregistré`, 'success');
    } catch (error: any) {
      console.error('[PartnerScan] Create scan failed:', error);

      try {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {
        console.warn('[PartnerScan] Haptics not available:', e);
      }

      // Le message est déjà traduit en français par le thunk
      let errorMessage = 'Erreur lors du scan';
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Déterminer le type de feedback (warning vs error)
      const isWarning = errorMessage.includes('déjà scanné') ||
        errorMessage.includes('non approuvée') ||
        errorMessage.includes('autre événement');

      if (isWarning) {
        showFeedback(`⚠️ ${errorMessage}`, 'warning');
      } else {
        showFeedback(`❌ ${errorMessage}`, 'error');
      }

      // Nettoyer l'erreur du store pour ne pas polluer la liste
      dispatch(clearPartnerScansError());

      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      resetTimeoutRef.current = setTimeout(() => resetScan(), 3000);
    } finally {
      setIsProcessing(false);
    }
  };

  // Réinitialiser pour un nouveau scan
  const resetScan = () => {
    console.log('[PartnerScan] Resetting scan state');
    setScanned(false);
    setIsProcessing(false);
    setScanResult(null);
    setComment('');
    setShowCommentInput(false);
  };

  // Gestion des permissions
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.brand[600]} />
        <Text style={[styles.loadingText, { color: theme.colors.text.primary }]}>
          Demande de permission caméra...
        </Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.warning[500]} />
        <Text style={[styles.errorText, { color: theme.colors.text.primary }]}>
          Accès à la caméra refusé
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.text.secondary }]}>
          Veuillez autoriser l'accès à la caméra dans les paramètres de votre téléphone.
        </Text>
        <TouchableOpacity
          style={[styles.permButton, { backgroundColor: theme.colors.brand[600] }]}
          onPress={() => requestPermission()}
        >
          <Text style={styles.permButtonText}>Demander à nouveau</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.permButton, { marginTop: 12, backgroundColor: theme.colors.neutral[500] }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.permButtonText}>Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Vue post-scan avec infos du contact
  if (showCommentInput && scanResult) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.container, { backgroundColor: theme.colors.background, alignItems: 'stretch' }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.postScanContainer}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          {/* Header success */}
          <View style={[styles.successBanner, { backgroundColor: theme.colors.success[500] }]}>
            <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
            <Text style={styles.successTitle}>Contact enregistré !</Text>
          </View>

          {/* Contact info card */}
          <View style={[styles.contactCard, { backgroundColor: theme.colors.surface, borderColor: theme.colors.border }]}>
            <View style={styles.contactHeader}>
              <View style={[styles.contactAvatar, { backgroundColor: theme.colors.brand[100] }]}>
                <Text style={[styles.contactInitials, { color: theme.colors.brand[600] }]}>
                  {scanResult.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={styles.contactInfo}>
                <Text style={[styles.contactName, { color: theme.colors.text.primary }]}>
                  {scanResult.name}
                </Text>
                <Text style={[styles.contactEmail, { color: theme.colors.text.secondary }]}>
                  {scanResult.email}
                </Text>
                {scanResult.company && (
                  <Text style={[styles.contactDetail, { color: theme.colors.text.secondary }]}>
                    🏢 {scanResult.company}
                  </Text>
                )}
                {scanResult.jobTitle && (
                  <Text style={[styles.contactDetail, { color: theme.colors.text.secondary }]}>
                    💼 {scanResult.jobTitle}
                  </Text>
                )}
              </View>
            </View>

            {/* Champ commentaire */}
            <View style={styles.commentSection}>
              <Text style={[styles.commentLabel, { color: theme.colors.text.primary }]}>
                Ajouter une note (optionnel)
              </Text>
              <TextInput
                style={[
                  styles.commentInput,
                  {
                    backgroundColor: theme.colors.background,
                    color: theme.colors.text.primary,
                    borderColor: theme.colors.border,
                  },
                ]}
                placeholder="Ex: Intéressé par le produit X, rappeler lundi..."
                placeholderTextColor={theme.colors.text.tertiary}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Boutons d'action */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.brand[600] }]}
              onPress={() => {
                // Si commentaire rempli, update le scan
                if (comment.trim() && currentScan) {
                  dispatch(
                    updatePartnerScanCommentThunk({
                      id: currentScan.id,
                      comment: comment.trim(),
                    })
                  );
                }
                resetScan();
              }}
            >
              <Ionicons name="scan" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Scanner un autre contact</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Interface de scan (caméra)
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
        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerBadge, { backgroundColor: theme.colors.brand[600] }]}>
            <Ionicons name="people" size={20} color="#FFFFFF" />
            <Text style={styles.headerBadgeText}>Mode Partenaire</Text>
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
            {isProcessing
              ? 'Enregistrement en cours...'
              : 'Scannez le badge d\'un participant'}
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
              {scanned ? 'Scanner à nouveau' : 'En attente de scan...'}
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
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  permButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  headerBadgeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    paddingBottom: 120,
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
  // Post-scan styles
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
  postScanContainer: {
    paddingBottom: 40,
  },
  successBanner: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  successTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  contactCard: {
    margin: 16,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  contactAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contactInitials: {
    fontSize: 20,
    fontWeight: '700',
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '700',
  },
  contactEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  contactDetail: {
    fontSize: 13,
    marginTop: 4,
  },
  commentSection: {
    marginTop: 20,
  },
  commentLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
  },
  actionButtons: {
    paddingHorizontal: 16,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

