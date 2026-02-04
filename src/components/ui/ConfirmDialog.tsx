/**
 * ConfirmDialog - Dialog de confirmation simple et élégant
 */

import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { Ionicons } from '@expo/vector-icons';

interface ConfirmDialogProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  visible,
  title,
  message,
  confirmText = 'Confirmer',
  cancelText = 'Annuler',
  confirmColor,
  icon,
  iconColor,
  onConfirm,
  onCancel,
}) => {
  const { theme } = useTheme();
  const defaultConfirmColor = confirmColor || theme.colors.brand[600];
  
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable style={[styles.overlay, { padding: theme.spacing.lg }]} onPress={onCancel}>
        <Pressable 
          style={[
            styles.dialog, 
            { 
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.xl,
              padding: theme.spacing.xl,
            }
          ]} 
          onPress={(e) => e.stopPropagation()}
        >
          {/* Icône */}
          {icon && (
            <View style={[styles.iconContainer, { marginBottom: theme.spacing.md }]}>
              <Ionicons 
                name={icon} 
                size={48} 
                color={iconColor || defaultConfirmColor} 
              />
            </View>
          )}

          {/* Titre */}
          <Text style={[
            styles.title,
            {
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.bold as any,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.sm,
            }
          ]}>
            {title}
          </Text>

          {/* Message */}
          <Text style={[
            styles.message,
            {
              fontSize: theme.fontSize.base,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xl,
            }
          ]}>
            {message}
          </Text>

          {/* Boutons */}
          <View style={[styles.buttonContainer, { gap: theme.spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.button, 
                styles.cancelButton,
                {
                  paddingVertical: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colors.cardHover,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                }
              ]}
              onPress={onCancel}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.cancelButtonText,
                {
                  fontSize: theme.fontSize.base,
                  fontWeight: theme.fontWeight.semibold as any,
                  color: theme.colors.text.primary,
                }
              ]}>
                {cancelText}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button, 
                styles.confirmButton, 
                { 
                  backgroundColor: defaultConfirmColor,
                  paddingVertical: theme.spacing.md,
                  borderRadius: theme.radius.lg,
                }
              ]}
              onPress={onConfirm}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.confirmButtonText,
                {
                  fontSize: theme.fontSize.base,
                  fontWeight: theme.fontWeight.semibold as any,
                  color: theme.colors.text.inverse,
                }
              ]}>
                {confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
  },
  message: {
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    // Styles dynamiques appliqués via props
  },
  cancelButtonText: {
    // Styles dynamiques appliqués via props
  },
  confirmButton: {
    // Styles dynamiques appliqués via props
  },
  confirmButtonText: {
    // Styles dynamiques appliqués via props
  },
});
