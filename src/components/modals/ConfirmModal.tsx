/**
 * Modale de confirmation pour les actions destructives
 */

import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../ui/Button';

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: 'danger' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
  icon?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmColor = 'danger',
  onConfirm,
  onCancel,
  icon = '⚠️',
}) => {
  const { theme } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={onCancel}
        />
        
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.xl,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icône */}
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>

          {/* Titre */}
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.xl,
                fontWeight: theme.fontWeight.bold,
              },
            ]}
          >
            {title}
          </Text>

          {/* Message */}
          <Text
            style={[
              styles.message,
              {
                color: theme.colors.text.secondary,
                fontSize: theme.fontSize.base,
              },
            ]}
          >
            {message}
          </Text>

          {/* Boutons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: theme.colors.neutral[100],
                  borderRadius: theme.radius.lg,
                },
              ]}
              onPress={onCancel}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: theme.colors.text.primary,
                    fontSize: theme.fontSize.base,
                    fontWeight: theme.fontWeight.semibold,
                  },
                ]}
              >
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: confirmColor === 'danger' 
                    ? theme.colors.error[500] 
                    : theme.colors.brand[600],
                  borderRadius: theme.radius.lg,
                },
              ]}
              onPress={onConfirm}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.buttonText,
                  {
                    color: '#FFFFFF',
                    fontSize: theme.fontSize.base,
                    fontWeight: theme.fontWeight.semibold,
                  },
                ]}
              >
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    width: '100%',
    maxWidth: 400,
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    fontSize: 48,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttons: {
    flexDirection: 'row',
    width: '100%',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  buttonText: {
    textAlign: 'center',
  },
});
