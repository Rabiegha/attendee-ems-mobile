/**
 * PartnerScanScreen - Scanner QR Code pour les partenaires
 * Scanne le badge d'un participant → crée un PartnerScan via l'API
 */

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { createPartnerScanThunk, updatePartnerScanCommentThunk, deletePartnerScanThunk, clearPartnerScansError } from '../../store/partnerScans.slice';
import { useTheme } from '../../theme/ThemeProvider';
import type { Theme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { ConfirmModal } from '../../components/modals/ConfirmModal';

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
  const styles = useMemo(() => createStyles(theme), [theme]);

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
  const [isFocused, setIsFocused] = useState(true);

  // État pour le modal "déjà scanné"
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateScanId, setDuplicateScanId] = useState<string | null>(null);

  // Réinitialiser l'état et la caméra quand l'écran reçoit/perd le focus (tabs)
  useFocusEffect(
    useCallback(() => {
      // Screen focused : activer la caméra
      setIsFocused(true);
      resetScan();

      return () => {
        // Screen blurred : désactiver la caméra pour libérer les ressources
        setIsFocused(false);
      };
    }, [])
  );

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
      let isDuplicate = false;
      let existingScanId: string | null = null;

      if (typeof error === 'object' && error !== null && error.isDuplicate) {
        errorMessage = error.message || 'Contact déjà scanné';
        isDuplicate = true;
        existingScanId = error.existingScanId || null;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      // Si doublon : afficher le modal avec option "Voir le contact"
      if (isDuplicate && existingScanId) {
        setDuplicateScanId(existingScanId);
        setShowDuplicateModal(true);
        setIsProcessing(false);
        dispatch(clearPartnerScansError());
        return;
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
    setShowDuplicateModal(false);
    setDuplicateScanId(null);
  };

  // Handler : fermer le modal "déjà scanné" et scanner à nouveau
  const handleDuplicateCancel = () => {
    setShowDuplicateModal(false);
    setDuplicateScanId(null);
    resetScan();
  };

  // Handler : naviguer vers le détail du contact déjà scanné
  const handleDuplicateViewContact = () => {
    const scanId = duplicateScanId;
    setShowDuplicateModal(false);
    setDuplicateScanId(null);
    resetScan();

    if (scanId && eventId) {
      // Naviguer vers l'onglet "Mes Contacts", puis pousser le détail
      const nav = navigation as any;
      nav.navigate('PartnerList', {
        screen: 'PartnerScanDetail',
        params: { scanId, eventId },
      });
    }
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
            <Ionicons name="checkmark-circle" size={40} color={theme.colors.text.inverse} />
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
            {/* Enregistrer et voir la liste */}
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.colors.success[500] }]}
              onPress={() => {
                if (comment.trim() && currentScan) {
                  dispatch(
                    updatePartnerScanCommentThunk({
                      id: currentScan.id,
                      comment: comment.trim(),
                    })
                  );
                }
                resetScan();
                navigation.goBack();
              }}
            >
              <Ionicons name="list" size={20} color={theme.colors.text.inverse} style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Enregistrer et voir mes contacts</Text>
            </TouchableOpacity>

            {/* Enregistrer et continuer de scanner */}
            <TouchableOpacity
              style={[styles.secondaryButton, { backgroundColor: theme.colors.brand[600] }]}
              onPress={() => {
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
              <Ionicons name="scan" size={20} color={theme.colors.text.inverse} style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Enregistrer et scanner un autre</Text>
            </TouchableOpacity>

            {/* Annuler le scan */}
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.colors.error[400] }]}
              onPress={() => {
                // Supprimer le scan créé
                if (currentScan) {
                  dispatch(deletePartnerScanThunk(currentScan.id));
                }
                resetScan();
              }}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.error[500]} style={{ marginRight: 8 }} />
              <Text style={[styles.cancelButtonText, { color: theme.colors.error[500] }]}>Annuler ce scan</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Interface de scan (caméra)
  return (
    <View style={styles.cameraContainer}>
      {permission?.granted && isFocused && (
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
          <Ionicons name="close" size={28} color={theme.colors.text.inverse} />
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.headerBadge, { backgroundColor: theme.colors.brand[600] }]}>
            <Ionicons name="people" size={20} color={theme.colors.text.inverse} />
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
              <ActivityIndicator size="large" color={theme.colors.text.inverse} />
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

      {/* Modal "Contact déjà scanné" */}
      <ConfirmModal
        visible={showDuplicateModal}
        icon="people-outline"
        title="Contact déjà scanné"
        message="Ce participant a déjà été scanné et ajouté à votre liste de contacts."
        confirmText="Voir le contact"
        cancelText="Annuler"
        confirmColor="primary"
        onConfirm={handleDuplicateViewContact}
        onCancel={handleDuplicateCancel}
      />
    </View>
  );
};

const createStyles = (theme: Theme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.neutral[950],
      justifyContent: 'center',
      alignItems: 'center',
    },
    cameraContainer: {
      flex: 1,
      backgroundColor: theme.colors.neutral[950],
    },
    loadingText: {
      fontSize: theme.fontSize.base,
      marginTop: theme.spacing.lg,
    },
    errorText: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
      marginTop: theme.spacing.lg,
      textAlign: 'center',
    },
    errorSubtext: {
      fontSize: theme.fontSize.sm,
      marginTop: theme.spacing.sm,
      textAlign: 'center',
      paddingHorizontal: theme.spacing['3xl'],
    },
    permButton: {
      marginTop: theme.spacing['2xl'],
      paddingHorizontal: theme.spacing['2xl'],
      paddingVertical: theme.spacing.md,
      borderRadius: theme.radius.md,
    },
    permButtonText: {
      color: theme.colors.text.inverse,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.semibold,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    header: {
      paddingTop: 60,
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
    },
    headerBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
      paddingVertical: theme.spacing.sm,
      borderRadius: theme.radius['2xl'],
      gap: theme.spacing.sm,
    },
    headerBadgeText: {
      color: theme.colors.text.inverse,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.bold,
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
      borderColor: theme.colors.text.inverse,
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
      color: theme.colors.text.inverse,
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.semibold,
      marginTop: theme.spacing['5xl'],
      textAlign: 'center',
    },
    processingContainer: {
      marginTop: theme.spacing['2xl'],
    },
    feedbackContainer: {
      position: 'absolute',
      top: '50%',
      left: '10%',
      right: '10%',
      paddingVertical: theme.spacing.xl,
      paddingHorizontal: theme.spacing['2xl'],
      borderRadius: theme.radius.xl,
      alignItems: 'center',
      ...theme.shadows.lg,
    },
    feedbackSuccess: {
      backgroundColor: theme.colors.success[500],
    },
    feedbackError: {
      backgroundColor: theme.colors.error[500],
    },
    feedbackWarning: {
      backgroundColor: theme.colors.warning[500],
    },
    feedbackText: {
      color: theme.colors.text.inverse,
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
      textAlign: 'center',
    },
    footer: {
      paddingBottom: 120,
      paddingHorizontal: theme.spacing.xl,
    },
    resetButton: {
      backgroundColor: theme.colors.brand[500],
      paddingVertical: theme.spacing.lg,
      paddingHorizontal: theme.spacing['3xl'],
      borderRadius: theme.radius.md,
      alignItems: 'center',
    },
    resetButtonDisabled: {
      backgroundColor: theme.colors.neutral[600],
    },
    resetButtonText: {
      color: theme.colors.text.inverse,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.semibold,
    },
    // Post-scan styles
    closeButton: {
      position: 'absolute',
      top: 50,
      right: 20,
      width: 40,
      height: 40,
      borderRadius: theme.radius['2xl'],
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 10,
    },
    postScanContainer: {
      paddingBottom: theme.spacing['5xl'],
    },
    successBanner: {
      paddingVertical: theme.spacing['2xl'],
      paddingHorizontal: theme.spacing.xl,
      alignItems: 'center',
      gap: theme.spacing.sm,
    },
    successTitle: {
      color: theme.colors.text.inverse,
      fontSize: theme.fontSize['2xl'],
      fontWeight: theme.fontWeight.bold,
    },
    contactCard: {
      margin: theme.spacing.lg,
      borderRadius: theme.radius.xl,
      borderWidth: 1,
      padding: theme.spacing.xl,
    },
    contactHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.lg,
    },
    contactAvatar: {
      width: 56,
      height: 56,
      borderRadius: 28,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactInitials: {
      fontSize: theme.fontSize.xl,
      fontWeight: theme.fontWeight.bold,
    },
    contactInfo: {
      flex: 1,
    },
    contactName: {
      fontSize: theme.fontSize.lg,
      fontWeight: theme.fontWeight.bold,
    },
    contactEmail: {
      fontSize: theme.fontSize.sm,
      marginTop: 2,
    },
    contactDetail: {
      fontSize: 13,
      marginTop: theme.spacing.xs,
    },
    commentSection: {
      marginTop: theme.spacing.xl,
    },
    commentLabel: {
      fontSize: theme.fontSize.sm,
      fontWeight: theme.fontWeight.semibold,
      marginBottom: theme.spacing.sm,
    },
    commentInput: {
      borderWidth: 1,
      borderRadius: theme.radius.lg,
      padding: theme.spacing.md,
      fontSize: theme.fontSize.sm,
      minHeight: 80,
    },
    actionButtons: {
      paddingHorizontal: theme.spacing.lg,
      gap: theme.spacing.md,
    },
    primaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.radius.lg,
    },
    secondaryButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.radius.lg,
    },
    cancelButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.lg,
      borderRadius: theme.radius.lg,
      borderWidth: 1.5,
      backgroundColor: 'transparent',
    },
    cancelButtonText: {
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.semibold,
    },
    primaryButtonText: {
      color: theme.colors.text.inverse,
      fontSize: theme.fontSize.base,
      fontWeight: theme.fontWeight.semibold,
    },
  });

