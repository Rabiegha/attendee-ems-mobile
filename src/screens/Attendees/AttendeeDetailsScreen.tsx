/**
 * Écran de détails d'un participant
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchAttendeeByIdThunk } from '../../store/attendees.slice';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface AttendeeDetailsScreenProps {
  route: any;
}

export const AttendeeDetailsScreen: React.FC<AttendeeDetailsScreenProps> = ({ route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { currentAttendee, isLoading } = useAppSelector((state) => state.attendees);

  const attendeeId = route.params?.attendeeId;

  useEffect(() => {
    if (attendeeId) {
      dispatch(fetchAttendeeByIdThunk(attendeeId));
    }
  }, [attendeeId]);

  if (isLoading || !currentAttendee) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.brand[600]} />
      </View>
    );
  }

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
              {currentAttendee.firstName[0]}
              {currentAttendee.lastName[0]}
            </Text>
          </View>
          <Text
            style={{
              fontSize: theme.fontSize.xl,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.text.primary,
            }}
          >
            {currentAttendee.firstName} {currentAttendee.lastName}
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
              {currentAttendee.email}
            </Text>
          </View>

          {currentAttendee.phone && (
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
                {currentAttendee.phone}
              </Text>
            </View>
          )}

          {currentAttendee.company && (
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
                {currentAttendee.company}
              </Text>
            </View>
          )}

          {currentAttendee.position && (
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
                {currentAttendee.position}
              </Text>
            </View>
          )}

          <View style={[styles.infoRow, { marginTop: theme.spacing.lg }]}>
            <Text style={{ color: theme.colors.text.secondary, fontSize: theme.fontSize.sm }}>
              {t('attendees.status')}
            </Text>
            <Text
              style={{
                color:
                  currentAttendee.status === 'checked-in'
                    ? theme.colors.success[600]
                    : theme.colors.text.primary,
                fontSize: theme.fontSize.base,
                marginTop: theme.spacing.xs,
                fontWeight: theme.fontWeight.medium,
              }}
            >
              {t(`attendees.${currentAttendee.status}`)}
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
    flexDirection: 'row' as const,
  },
  infoRow: {},
});
