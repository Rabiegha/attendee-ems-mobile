/**
 * Modal réutilisable pour les actions de check-in avec animations
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import LottieView from 'lottie-react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Registration } from '../../types/attendee';
import { CheckInStatus } from '../../hooks/useCheckIn';

interface CheckInModalProps {
  visible: boolean;
  status: CheckInStatus;
  attendee: Registration | null;
  progress: number;
  errorMessage: string | null;
  onClose: () => void;
  onRetry?: () => void;
}

export const CheckInModal: React.FC<CheckInModalProps> = ({
  visible,
  status,
  attendee,
  progress,
  errorMessage,
  onClose,
  onRetry,
}) => {
  const { theme } = useTheme();

  if (!attendee) return null;

  const getModalContent = () => {
    switch (status) {
      case 'printing':
        return {
          title: 'Impression en cours...',
          subtitle: `Badge de ${attendee.attendee.first_name} ${attendee.attendee.last_name}`,
          showProgress: true,
        };

      case 'checkin':
        return {
          title: 'Check-in en cours...',
          subtitle: `Enregistrement de ${attendee.attendee.first_name} ${attendee.attendee.last_name}`,
          showProgress: false,
        };

      case 'undoing':
        return {
          title: 'Annulation en cours...',
          subtitle: `Annulation du check-in de ${attendee.attendee.first_name} ${attendee.attendee.last_name}`,
          showProgress: false,
        };

      case 'success':
        return {
          title: 'Succès !',
          subtitle: `${attendee.attendee.first_name} ${attendee.attendee.last_name} traité avec succès`,
          showProgress: false,
        };

      case 'error':
        return {
          title: 'Erreur',
          subtitle: errorMessage || 'Une erreur est survenue',
          showProgress: false,
        };

      default:
        return null;
    }
  };

  const content = getModalContent();
  if (!content) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.card }]}>
          {/* Header avec bouton fermer */}
          <View style={styles.modalHeader}>
            <Text
              style={[
                styles.modalTitle,
                { 
                  color: status === 'error' ? theme.colors.error[600] : theme.colors.text.primary,
                  fontSize: theme.fontSize.lg,
                  fontWeight: theme.fontWeight.bold,
                }
              ]}
            >
              {content.title}
            </Text>
            {status !== 'printing' && status !== 'checkin' && status !== 'undoing' && (
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Text style={[styles.closeButtonText, { color: theme.colors.text.secondary }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Animation */}
          <View style={[styles.animationSection, { backgroundColor: theme.colors.card }]}>
            {/* Forcer le remontage complet du composant pour chaque animation */}
            {status === 'printing' && (
              <View style={[styles.animationContainer, { backgroundColor: theme.colors.card }]}>
                <LottieView
                  source={require('../../assets/animations/Printing.json')}
                  autoPlay
                  loop={true}
                  style={[styles.animationView, { backgroundColor: theme.colors.card }]}
                  renderMode="AUTOMATIC"
                />
              </View>
            )}
            {status === 'checkin' && (
              <View style={[styles.animationContainer, { backgroundColor: theme.colors.card }]}>
                <LottieView
                  source={require('../../assets/animations/Accepted.json')}
                  autoPlay
                  loop={true}
                  style={[styles.animationView, { backgroundColor: theme.colors.card }]}
                  renderMode="AUTOMATIC"
                />
              </View>
            )}
            {status === 'undoing' && (
              <View style={[styles.animationContainer, { backgroundColor: theme.colors.card }]}>
                <LottieView
                  source={require('../../assets/animations/Error.json')}
                  autoPlay
                  loop={true}
                  style={[styles.animationView, { backgroundColor: theme.colors.card }]}
                  renderMode="AUTOMATIC"
                />
              </View>
            )}
            {status === 'success' && (
              <View style={[styles.animationContainer, { backgroundColor: theme.colors.card }]}>
                <LottieView
                  source={require('../../assets/animations/Accepted.json')}
                  autoPlay
                  loop={false}
                  style={[styles.animationView, { backgroundColor: theme.colors.card }]}
                  renderMode="AUTOMATIC"
                />
              </View>
            )}
            {status === 'error' && (
              <View style={[styles.animationContainer, { backgroundColor: theme.colors.card }]}>
                <LottieView
                  source={require('../../assets/animations/Rejected.json')}
                  autoPlay
                  loop={false}
                  style={[styles.animationView, { backgroundColor: theme.colors.card }]}
                  renderMode="AUTOMATIC"
                />
              </View>
            )}

            {/* Barre de progression pour l'impression */}
            {content.showProgress && (
              <View style={styles.progressContainer}>
                <View
                  style={[
                    styles.progressBarBackground,
                    { backgroundColor: theme.colors.neutral[200] }
                  ]}
                >
                  <View
                    style={[
                      styles.progressBarFill,
                      { 
                        width: `${progress}%`,
                        backgroundColor: theme.colors.brand[600],
                      }
                    ]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.colors.text.secondary }]}>
                  {progress}%
                </Text>
              </View>
            )}

            {/* Texte descriptif */}
            <Text style={[styles.statusText, { color: theme.colors.text.primary }]}>
              {content.subtitle}
            </Text>

            {/* Bouton retry pour les erreurs */}
            {status === 'error' && onRetry && (
              <TouchableOpacity
                style={[
                  styles.retryButton,
                  { backgroundColor: theme.colors.brand[600] }
                ]}
                onPress={onRetry}
              >
                <Text style={[styles.retryButtonText, { color: '#FFFFFF' }]}>
                  Réessayer
                </Text>
              </TouchableOpacity>
            )}

            {/* Bouton fermer pour succès */}
            {status === 'success' && (
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  { backgroundColor: theme.colors.success[600] }
                ]}
                onPress={onClose}
              >
                <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>
                  Continuer
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: Dimensions.get('window').width * 0.85,
    maxWidth: 400,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 0,
    top: -5,
    padding: 5,
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  animationSection: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  animationContainer: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  animationView: {
    width: 120,
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 16,
  },
  progressBarBackground: {
    height: 6,
    width: '100%',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    marginTop: 8,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    marginTop: 8,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});