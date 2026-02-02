/**
 * Écran de détails d'un participant (registration)
 */

import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRegistrationByIdThunk, checkOutRegistrationThunk, undoCheckOutThunk } from '../../store/registrations.slice';
import { fetchEventStatsThunk, fetchEventAttendeeTypesThunk } from '../../store/events.slice';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import { useCheckIn } from '../../hooks/useCheckIn';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useToast } from '../../contexts/ToastContext';
import { registrationsService } from '../../api/backend/registrations.service';

interface AttendeeDetailsScreenProps {
  navigation: any;
  route: any;
}

export const AttendeeDetailsScreen: React.FC<AttendeeDetailsScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { currentRegistration, isLoading } = useAppSelector((state) => state.registrations);
  const { currentEvent, currentEventAttendeeTypes } = useAppSelector((state) => state.events);

  const registrationId = route.params?.registrationId;
  const eventId = route.params?.eventId || currentEvent?.id;
  const startInEditMode = route.params?.startInEditMode || false;

  const checkIn = useCheckIn();
  const toast = useToast();

  // État pour le mode édition
  const [isEditing, setIsEditing] = useState(startInEditMode);
  const [editedData, setEditedData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  // État pour le dialog de confirmation
  const [confirmDialog, setConfirmDialog] = useState<{
    visible: boolean;
    title: string;
    message: string;
    confirmText: string;
    confirmColor: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    onConfirm: () => void;
  }>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'Confirmer',
    confirmColor: theme.colors.brand[600],
    icon: 'checkmark-circle',
    iconColor: theme.colors.brand[600],
    onConfirm: () => {},
  });

  useEffect(() => {
    if (registrationId && eventId) {
      dispatch(fetchRegistrationByIdThunk({ eventId, registrationId }));
      dispatch(fetchEventAttendeeTypesThunk(eventId));
    }
  }, [registrationId, eventId]);

  // Initialiser les données éditées
  useEffect(() => {
    if (currentRegistration) {
      setEditedData({
        first_name: currentRegistration.attendee.first_name,
        last_name: currentRegistration.attendee.last_name,
        email: currentRegistration.attendee.email,
        phone: currentRegistration.attendee.phone || '',
        company: currentRegistration.attendee.company || '',
        job_title: currentRegistration.attendee.job_title || '',
        country: currentRegistration.attendee.country || '',
        comment: currentRegistration.comment || '',
        status: currentRegistration.status,
        event_attendee_type_id: currentRegistration.event_attendee_type_id,
      });
    }
  }, [currentRegistration]);

  // Écouter les événements du clavier
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  if (isLoading || !currentRegistration) {
    return (
      <SafeAreaView 
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        edges={['top', 'left', 'right']}
      >
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={theme.colors.brand[600]} />
        </View>
      </SafeAreaView>
    );
  }

  const attendee = currentRegistration.attendee;
  const isCheckedIn = currentRegistration.status === 'checked-in' || currentRegistration.checked_in_at;
  const isCheckedOut = currentRegistration.checked_out_at;

  const handlePrint = () => {
    setConfirmDialog({
      visible: true,
      title: 'Imprimer le badge',
      message: `Imprimer et enregistrer ${attendee.first_name} ${attendee.last_name} ?`,
      confirmText: 'Imprimer',
      confirmColor: theme.colors.neutral[950],
      icon: 'print',
      iconColor: theme.colors.neutral[700],
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        checkIn.printAndCheckIn(
          currentRegistration,
          (message) => {
            toast.success(message);
            if (eventId) {
              dispatch(fetchEventStatsThunk(eventId));
              dispatch(fetchRegistrationByIdThunk({ eventId, registrationId }));
            }
          },
          (message) => toast.error(message)
        );
      },
    });
  };

  const handleCheckIn = () => {
    setConfirmDialog({
      visible: true,
      title: 'Enregistrer',
      message: `Enregistrer ${attendee.first_name} ${attendee.last_name} comme présent(e) ?`,
      confirmText: 'Enregistrer',
      confirmColor: theme.colors.success[600],
      icon: 'checkmark-circle',
      iconColor: theme.colors.success[600],
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        checkIn.checkInOnly(
          currentRegistration,
          (message) => {
            toast.success(message);
            if (eventId) {
              dispatch(fetchEventStatsThunk(eventId));
              dispatch(fetchRegistrationByIdThunk({ eventId, registrationId }));
            }
          },
          (message) => toast.error(message)
        );
      },
    });
  };

  const handleUndoCheckIn = () => {
    setConfirmDialog({
      visible: true,
      title: 'Annuler l\'enregistrement',
      message: `Annuler l'enregistrement de ${attendee.first_name} ${attendee.last_name} ?`,
      confirmText: 'Confirmer',
      confirmColor: theme.colors.error[600],
      icon: 'arrow-undo',
      iconColor: theme.colors.error[600],
      onConfirm: () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        checkIn.undoCheckIn(
          currentRegistration,
          (message) => {
            toast.success(message);
            if (eventId) {
              dispatch(fetchEventStatsThunk(eventId));
              dispatch(fetchRegistrationByIdThunk({ eventId, registrationId }));
            }
          },
          (message) => toast.error(message)
        );
      },
    });
  };

  const handleCheckOut = () => {
    setConfirmDialog({
      visible: true,
      title: t('attendees.checkOut'),
      message: `${t('attendees.checkOut')} ${attendee.first_name} ${attendee.last_name} ?`,
      confirmText: t('attendees.checkOut'),
      confirmColor: theme.colors.brand[600],
      icon: 'exit-outline',
      iconColor: theme.colors.brand[600],
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        try {
          await dispatch(checkOutRegistrationThunk({
            registrationId: currentRegistration.id,
            eventId: eventId!,
          })).unwrap();
          toast.success(t('attendees.checkOutSuccess'));
          if (eventId) {
            dispatch(fetchRegistrationByIdThunk({ eventId, registrationId }));
          }
        } catch (error: any) {
          toast.error(error?.detail || error?.message || t('attendees.checkOutError'));
        }
      },
    });
  };

  const handleUndoCheckOut = () => {
    setConfirmDialog({
      visible: true,
      title: t('attendees.undoCheckOut'),
      message: `${t('attendees.undoCheckOut')} ${attendee.first_name} ${attendee.last_name} ?`,
      confirmText: t('common.confirm'),
      confirmColor: theme.colors.warning[600],
      icon: 'arrow-undo',
      iconColor: theme.colors.warning[600],
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, visible: false }));
        try {
          await dispatch(undoCheckOutThunk({
            registrationId: currentRegistration.id,
            eventId: eventId!,
          })).unwrap();
          toast.success('Check-out annulé');
          if (eventId) {
            dispatch(fetchRegistrationByIdThunk({ eventId, registrationId }));
          }
        } catch (error: any) {
          toast.error(error?.detail || error?.message || 'Erreur lors de l\'annulation');
        }
      },
    });
  };

  const handleSaveEdit = async () => {
    setIsSaving(true);
    try {
      await registrationsService.updateRegistration(currentRegistration.id, {
        attendee: {
          first_name: editedData.first_name,
          last_name: editedData.last_name,
          email: editedData.email,
          phone: editedData.phone,
          company: editedData.company,
          job_title: editedData.job_title,
          country: editedData.country,
        },
        comment: editedData.comment,
        status: editedData.status,
        event_attendee_type_id: editedData.event_attendee_type_id,
      });
      
      toast.success('Modifications enregistrées');
      setIsEditing(false);
      
      // Recharger les données
      if (eventId) {
        dispatch(fetchRegistrationByIdThunk({ eventId, registrationId }));
      }
    } catch (error: any) {
      console.error('Error saving registration:', error);
      toast.error(error?.response?.data?.message || 'Erreur lors de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    // Réinitialiser les données
    setEditedData({
      first_name: attendee.first_name,
      last_name: attendee.last_name,
      email: attendee.email,
      phone: attendee.phone || '',
      company: attendee.company || '',
      job_title: attendee.job_title || '',
      country: attendee.country || '',
      comment: currentRegistration.comment || '',
      status: currentRegistration.status,
      event_attendee_type_id: currentRegistration.event_attendee_type_id,
    });
    setIsEditing(false);
  };

  const getAttendeeTypeColor = () => {
    // Utiliser la couleur spécifique à l'événement (peut être personnalisée)
    return currentRegistration.eventAttendeeType?.text_color_hex ||
           currentRegistration.eventAttendeeType?.color_hex || 
           currentRegistration.eventAttendeeType?.attendeeType?.text_color_hex || 
           currentRegistration.eventAttendeeType?.attendeeType?.color_hex || 
           theme.colors.brand[600];
  };

  const getAttendeeTypeColorLight = () => {
    // Utiliser la couleur spécifique à l'événement (peut être personnalisée)
    const color = currentRegistration.eventAttendeeType?.color_hex ||
                  currentRegistration.eventAttendeeType?.attendeeType?.color_hex || 
                  theme.colors.brand[100];
    // Si la couleur est en format hex, ajouter de l'opacité
    if (color.startsWith('#')) {
      return color + '20'; // 20% d'opacité
    }
    return color;
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'checked-in':
        return 'Enregistré';
      case 'approved':
        return 'Approuvé';
      case 'awaiting':
        return 'En attente';
      case 'refused':
        return 'Refusé';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'checked-in':
        return theme.colors.success[600];
      case 'approved':
        return theme.colors.brand[600];
      case 'awaiting':
        return theme.colors.warning[600];
      case 'refused':
        return theme.colors.error[600];
      case 'cancelled':
        return theme.colors.error[600];
      default:
        return theme.colors.text.primary;
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Header
        title={isEditing ? 'Modifier le profil' : t('attendees.details')}
        onBack={() => navigation.goBack()}
        rightComponent={
          <TouchableOpacity onPress={() => isEditing ? handleCancelEdit() : setIsEditing(true)}>
            <Ionicons 
              name={isEditing ? 'close' : 'pencil'} 
              size={24} 
              color={theme.colors.text.primary} 
            />
          </TouchableOpacity>
        }
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={{ padding: theme.spacing.lg }}>
        {/* Avatar / Nom */}
        <Card style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: getAttendeeTypeColorLight(),
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize['2xl'],
                fontWeight: theme.fontWeight.bold,
                color: getAttendeeTypeColor(),
              }}
            >
              {attendee.first_name[0]}
              {attendee.last_name[0]}
            </Text>
          </View>
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}
          >
            {isEditing ? `${editedData.first_name} ${editedData.last_name}` : `${attendee.first_name} ${attendee.last_name}`}
          </Text>
        </Card>

        {/* Boutons d'action */}
        {!isEditing ? (
          <View style={[styles.actionsContainer, { marginTop: theme.spacing.md }]}>
            {/* Bouton Print */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: theme.colors.neutral[950],
                },
              ]}
              onPress={handlePrint}
            >
              <Ionicons name="print" size={24} color="#FFFFFF" />
              <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Print</Text>
            </TouchableOpacity>

            {/* Bouton Check-in / Undo Check-in */}
            {!isCheckedOut && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: isCheckedIn 
                      ? theme.colors.error[600] 
                      : theme.colors.success[600],
                  },
                ]}
                onPress={isCheckedIn ? handleUndoCheckIn : handleCheckIn}
              >
                <Ionicons 
                  name={isCheckedIn ? 'arrow-undo' : 'checkmark-circle'} 
                  size={24} 
                  color="#FFFFFF" 
                />
                <Text style={[styles.actionText, { color: '#FFFFFF' }]}>
                  {isCheckedIn ? 'Un check' : 'Check'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Bouton Check-out */}
            {isCheckedIn && !isCheckedOut && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: theme.colors.brand[600],
                  },
                ]}
                onPress={handleCheckOut}
              >
                <Ionicons name="exit-outline" size={24} color="#FFFFFF" />
                <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Out</Text>
              </TouchableOpacity>
            )}

            {/* Bouton Undo Check-out */}
            {isCheckedOut && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  {
                    backgroundColor: theme.colors.warning[600],
                  },
                ]}
                onPress={handleUndoCheckOut}
              >
                <Ionicons name="arrow-undo" size={24} color="#FFFFFF" />
                <Text style={[styles.actionText, { color: '#FFFFFF' }]}>Undo Out</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={[styles.actionsContainer, { marginTop: theme.spacing.md }]}>
            <Button
              title="Annuler"
              onPress={handleCancelEdit}
              variant="secondary"
              disabled={isSaving}
              style={{ flex: 1, marginRight: theme.spacing.sm }}
            />
            <Button
              title="Enregistrer"
              onPress={handleSaveEdit}
              loading={isSaving}
              disabled={isSaving}
              style={{ flex: 1, marginLeft: theme.spacing.sm }}
            />
          </View>
        )}

        {/* Informations */}
        <Card style={{ marginTop: theme.spacing.lg }}>
          {/* Prénom */}
          <View style={styles.infoRow}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              Prénom
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.xs,
                  },
                ]}
                value={editedData.first_name}
                onChangeText={(text) => setEditedData({ ...editedData, first_name: text })}
                placeholder="Prénom"
                placeholderTextColor={theme.colors.text.secondary}
              />
            ) : (
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.first_name}
              </Text>
            )}
          </View>

          {/* Nom */}
          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              Nom
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.xs,
                  },
                ]}
                value={editedData.last_name}
                onChangeText={(text) => setEditedData({ ...editedData, last_name: text })}
                placeholder="Nom"
                placeholderTextColor={theme.colors.text.secondary}
              />
            ) : (
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.last_name}
              </Text>
            )}
          </View>

          {/* Email */}
          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              {t('attendees.email')}
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.xs,
                  },
                ]}
                value={editedData.email}
                onChangeText={(text) => setEditedData({ ...editedData, email: text })}
                placeholder="Email"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.email}
              </Text>
            )}
          </View>

          {/* Téléphone */}
          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              {t('attendees.phone')}
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.xs,
                  },
                ]}
                value={editedData.phone}
                onChangeText={(text) => setEditedData({ ...editedData, phone: text })}
                placeholder="Téléphone"
                placeholderTextColor={theme.colors.text.secondary}
                keyboardType="phone-pad"
              />
            ) : attendee.phone ? (
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.phone}
              </Text>
            ) : null}
          </View>

          {/* Entreprise */}
          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              {t('attendees.company')}
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.xs,
                  },
                ]}
                value={editedData.company}
                onChangeText={(text) => setEditedData({ ...editedData, company: text })}
                placeholder="Entreprise"
                placeholderTextColor={theme.colors.text.secondary}
              />
            ) : attendee.company ? (
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.company}
              </Text>
            ) : null}
          </View>

          {/* Poste */}
          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              {t('attendees.position')}
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.xs,
                  },
                ]}
                value={editedData.job_title}
                onChangeText={(text) => setEditedData({ ...editedData, job_title: text })}
                placeholder="Poste"
                placeholderTextColor={theme.colors.text.secondary}
              />
            ) : attendee.job_title ? (
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.job_title}
              </Text>
            ) : null}
          </View>

          {/* Pays */}
          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              Pays
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.xs,
                  },
                ]}
                value={editedData.country}
                onChangeText={(text) => setEditedData({ ...editedData, country: text })}
                placeholder="Pays"
                placeholderTextColor={theme.colors.text.secondary}
              />
            ) : attendee.country ? (
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.country}
              </Text>
            ) : null}
          </View>

          {/* Commentaire */}
          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              Commentaire
            </Text>
            {isEditing ? (
              <TextInput
                style={[
                  styles.input,
                  {
                    color: theme.colors.text.primary,
                    backgroundColor: theme.colors.background,
                    borderColor: theme.colors.border,
                    borderWidth: 1,
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.sm,
                    marginTop: theme.spacing.xs,
                    minHeight: 80,
                  },
                ]}
                value={editedData.comment}
                onChangeText={(text) => setEditedData({ ...editedData, comment: text })}
                placeholder="Commentaire"
                placeholderTextColor={theme.colors.text.secondary}
                multiline
                numberOfLines={3}
              />
            ) : currentRegistration.comment ? (
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                  fontStyle: 'italic',
                }}
              >
                {currentRegistration.comment}
              </Text>
            ) : null}
          </View>

          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              {t('attendees.status')}
            </Text>
            {isEditing ? (
              <View style={{ marginTop: theme.spacing.xs, gap: 8 }}>
                {['approved', 'awaiting', 'refused', 'cancelled'].map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: theme.spacing.sm,
                      borderRadius: theme.radius.md,
                      borderWidth: 2,
                      borderColor: editedData.status === status ? getStatusColor(status) : theme.colors.border,
                      backgroundColor: editedData.status === status ? getStatusColor(status) + '20' : 'transparent',
                    }}
                    onPress={() => setEditedData({ ...editedData, status })}
                  >
                    <Ionicons
                      name={editedData.status === status ? 'radio-button-on' : 'radio-button-off'}
                      size={20}
                      color={editedData.status === status ? getStatusColor(status) : theme.colors.text.secondary}
                      style={{ marginRight: theme.spacing.sm }}
                    />
                    <Text
                      style={{
                        color: editedData.status === status ? getStatusColor(status) : theme.colors.text.primary,
                        fontSize: theme.fontSize.base,
                        fontWeight: editedData.status === status ? theme.fontWeight.medium : theme.fontWeight.normal,
                      }}
                    >
                      {getStatusLabel(status)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text
                style={{
                  color: getStatusColor(currentRegistration.status),
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                  fontWeight: theme.fontWeight.medium,
                }}
              >
                {getStatusLabel(currentRegistration.status)}
              </Text>
            )}
          </View>

          {/* Type de participant */}
          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              Type de participant
            </Text>
            {isEditing ? (
              <View style={{ marginTop: theme.spacing.xs, gap: 8 }}>
                {currentEventAttendeeTypes.map((eventAttendeeType) => {
                  const bgColor = eventAttendeeType.color_hex || eventAttendeeType.attendeeType.color_hex || theme.colors.neutral[200];
                  const textColor = eventAttendeeType.text_color_hex || eventAttendeeType.attendeeType.text_color_hex || theme.colors.text.primary;
                  
                  return (
                    <TouchableOpacity
                      key={eventAttendeeType.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        padding: theme.spacing.sm,
                        borderRadius: theme.radius.md,
                        borderWidth: 2,
                        borderColor: editedData.event_attendee_type_id === eventAttendeeType.id ? bgColor : theme.colors.border,
                        backgroundColor: editedData.event_attendee_type_id === eventAttendeeType.id ? bgColor + '20' : 'transparent',
                      }}
                      onPress={() => setEditedData({ ...editedData, event_attendee_type_id: eventAttendeeType.id })}
                    >
                      <Ionicons
                        name={editedData.event_attendee_type_id === eventAttendeeType.id ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={editedData.event_attendee_type_id === eventAttendeeType.id ? bgColor : theme.colors.text.secondary}
                        style={{ marginRight: theme.spacing.sm }}
                      />
                      <Text
                        style={{
                          color: editedData.event_attendee_type_id === eventAttendeeType.id ? textColor : theme.colors.text.primary,
                          fontSize: theme.fontSize.base,
                          fontWeight: editedData.event_attendee_type_id === eventAttendeeType.id ? theme.fontWeight.medium : theme.fontWeight.normal,
                        }}
                      >
                        {eventAttendeeType.attendeeType.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <Text
                style={{
                  color: getAttendeeTypeColor(),
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                  fontWeight: theme.fontWeight.medium,
                }}
              >
                {currentRegistration.eventAttendeeType?.attendeeType?.name || 'N/A'}
              </Text>
            )}
          </View>

          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              Type de participation
            </Text>
            <Text
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xs,
              }}
            >
              {currentRegistration.attendance_type === 'onsite' ? 'Sur place' : 'En ligne'}
            </Text>
          </View>
        </Card>
          </View>
        </ScrollView>

        {/* Bouton de sauvegarde fixe en mode édition */}
        {isEditing && (
          <View
            style={[
              styles.saveButtonContainer,
              {
                backgroundColor: theme.colors.background,
                borderTopColor: theme.colors.border,
                paddingBottom: keyboardVisible ? 12 : Math.max(insets.bottom, 16),
              },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.saveButton,
                {
                  backgroundColor: theme.colors.brand[600],
                  opacity: isSaving ? 0.6 : 1,
                },
              ]}
              onPress={handleSaveEdit}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                  <Text style={[styles.saveButtonText, { marginLeft: theme.spacing.sm }]}>
                    Enregistrer les modifications
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Dialog de confirmation pour les actions */}
      <ConfirmDialog
        visible={confirmDialog.visible}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        confirmColor={confirmDialog.confirmColor}
        icon={confirmDialog.icon}
        iconColor={confirmDialog.iconColor}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    minWidth: 80,
    height: 70,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  infoRow: {},
  input: {
    fontSize: 16,
  },
  saveButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  saveButton: {
    height: 56,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
