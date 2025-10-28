/**
 * Écran de détails d'un participant (registration)
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchRegistrationByIdThunk } from '../../store/registrations.slice';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface AttendeeDetailsScreenProps {
  route: any;
}

export const AttendeeDetailsScreen: React.FC<AttendeeDetailsScreenProps> = ({ route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentRegistration, isLoading } = useAppSelector((state) => state.registrations);
  const { currentEvent } = useAppSelector((state) => state.events);

  const registrationId = route.params?.registrationId;
  const eventId = route.params?.eventId || currentEvent?.id;

  useEffect(() => {
    if (registrationId && eventId) {
      dispatch(fetchRegistrationByIdThunk({ eventId, registrationId }));
    }
  }, [registrationId, eventId]);

  if (isLoading || !currentRegistration) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.brand[600]} />
      </View>
    );
  }

  const attendee = currentRegistration.attendee;

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'checked-in':
        return 'Enregistré';
      case 'approved':
        return 'Approuvé';
      case 'pending':
        return 'En attente';
      case 'rejected':
        return 'Refusé';
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
      case 'pending':
        return theme.colors.warning[600];
      case 'rejected':
        return theme.colors.error[600];
      default:
        return theme.colors.text.primary;
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ padding: theme.spacing.lg }}>
        {/* Avatar / Nom */}
        <Card style={{ alignItems: 'center', marginBottom: theme.spacing.lg }}>
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: theme.colors.brand[100],
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: theme.spacing.md,
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSize['2xl'],
                fontWeight: theme.fontWeight.bold,
                color: theme.colors.brand[600],
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
            {attendee.first_name} {attendee.last_name}
          </Text>
        </Card>

        {/* Boutons d'action */}
        <View style={styles.actionsContainer}>
          <Button
            title={t('attendees.print')}
            onPress={() => {}}
            variant="secondary"
            style={{ flex: 1, marginRight: theme.spacing.sm }}
          />
          <Button
            title={t('attendees.checkIn')}
            onPress={() => {}}
            style={{ flex: 1, marginLeft: theme.spacing.sm }}
          />
        </View>

        {/* Informations */}
        <Card style={{ marginTop: theme.spacing.lg }}>
          <View style={styles.infoRow}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              {t('attendees.email')}
            </Text>
            <Text
              style={{
                color: theme.colors.text.primary,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xs,
              }}
            >
              {attendee.email}
            </Text>
          </View>

          {attendee.phone && (
            <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
                {t('attendees.phone')}
              </Text>
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.phone}
              </Text>
            </View>
          )}

          {attendee.company && (
            <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
                {t('attendees.company')}
              </Text>
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.company}
              </Text>
            </View>
          )}

          {attendee.job_title && (
            <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
                {t('attendees.position')}
              </Text>
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.job_title}
              </Text>
            </View>
          )}

          {attendee.country && (
            <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
              <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
                Pays
              </Text>
              <Text
                style={{
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.xs,
                }}
              >
                {attendee.country}
              </Text>
            </View>
          )}

          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              {t('attendees.status')}
            </Text>
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  actionsContainer: {
    flexDirection: 'row',
  },
  infoRow: {},
});
