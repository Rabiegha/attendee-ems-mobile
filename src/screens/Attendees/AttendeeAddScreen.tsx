/**
 * Écran d'ajout d'un participant
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { createRegistrationThunk } from '../../store/registrations.slice';
import { fetchEventAttendeeTypesThunk } from '../../store/events.slice';

interface AttendeeAddScreenProps {
  navigation: any;
  route: any;
}

export const AttendeeAddScreen: React.FC<AttendeeAddScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  const { eventId } = route.params || {};
  const { isCreating } = useAppSelector((state) => state.registrations);
  const { currentEventAttendeeTypes, isLoadingAttendeeTypes } = useAppSelector((state) => state.events);

  // États du formulaire
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '',
    job_title: '',
    country: 'FR',
  });
  const [attendanceType, setAttendanceType] = useState<'onsite' | 'online' | 'hybrid'>('onsite');
  const [selectedAttendeeTypeId, setSelectedAttendeeTypeId] = useState<string>('');

  // Charger les types d'attendee au montage
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventAttendeeTypesThunk(eventId));
    }
  }, [eventId, dispatch]);

  // Sélectionner automatiquement le premier type d'attendee si disponible
  useEffect(() => {
    if (currentEventAttendeeTypes.length > 0 && !selectedAttendeeTypeId) {
      setSelectedAttendeeTypeId(currentEventAttendeeTypes[0].id);
    }
  }, [currentEventAttendeeTypes, selectedAttendeeTypeId]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email) {
      Alert.alert('Erreur', 'L\'email est requis');
      return false;
    }
    if (!formData.first_name || !formData.last_name) {
      Alert.alert('Erreur', 'Le prénom et le nom sont requis');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    if (!eventId) {
      Alert.alert('Erreur', 'ID de l\'événement manquant');
      return;
    }

    try {
      const registrationData = {
        attendee: formData,
        attendance_type: attendanceType,
        event_attendee_type_id: selectedAttendeeTypeId || undefined,
        answers: {},
      };

      console.log('[AttendeeAddScreen] Submitting registration:', registrationData);
      await dispatch(createRegistrationThunk({ 
        eventId, 
        registrationData 
      })).unwrap();
      
      Alert.alert('Succès', 'Participant ajouté avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('[AttendeeAddScreen] Registration failed:', error);
      Alert.alert('Erreur', error.message || 'Erreur lors de l\'ajout du participant');
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']} // Inclure aussi le bas
    >
      <Header
        title="Ajouter un participant"
        onBack={() => navigation.goBack()}
      />
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 200 }} // Énorme padding pour éviter la nav bar
      >
        <View style={{ padding: theme.spacing.lg }}>
          <Card>

          {/* Prénom */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Prénom *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radius.md,
                  fontSize: theme.fontSize.base,
                },
              ]}
              value={formData.first_name}
              onChangeText={(value) => handleInputChange('first_name', value)}
              placeholder="Entrez le prénom"
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          {/* Nom */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Nom *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radius.md,
                  fontSize: theme.fontSize.base,
                },
              ]}
              value={formData.last_name}
              onChangeText={(value) => handleInputChange('last_name', value)}
              placeholder="Entrez le nom"
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          {/* Email */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Email *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radius.md,
                  fontSize: theme.fontSize.base,
                },
              ]}
              value={formData.email}
              onChangeText={(value) => handleInputChange('email', value)}
              placeholder="email@example.com"
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Téléphone */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Téléphone
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radius.md,
                  fontSize: theme.fontSize.base,
                },
              ]}
              value={formData.phone}
              onChangeText={(value) => handleInputChange('phone', value)}
              placeholder="+33 6 12 34 56 78"
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="phone-pad"
            />
          </View>

          {/* Entreprise */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Entreprise
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radius.md,
                  fontSize: theme.fontSize.base,
                },
              ]}
              value={formData.company}
              onChangeText={(value) => handleInputChange('company', value)}
              placeholder="Nom de l'entreprise"
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          {/* Poste */}
          <View style={{ marginBottom: theme.spacing.lg }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Poste
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.background,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radius.md,
                  fontSize: theme.fontSize.base,
                },
              ]}
              value={formData.job_title}
              onChangeText={(value) => handleInputChange('job_title', value)}
              placeholder="Titre du poste"
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          {/* Type de présence */}
          <View style={{ marginBottom: theme.spacing.md }}>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
                marginBottom: theme.spacing.xs,
              }}
            >
              Type de présence
            </Text>
            <View style={styles.pickerContainer}>
              <View style={[styles.picker, { 
                backgroundColor: theme.colors.background, 
                borderColor: theme.colors.border,
                borderRadius: theme.radius.md,
              }]}>
                {['onsite', 'online', 'hybrid'].map((type) => (
                  <Button
                    key={type}
                    title={type === 'onsite' ? 'Sur site' : type === 'online' ? 'En ligne' : 'Hybride'}
                    variant={attendanceType === type ? 'primary' : 'secondary'}
                    onPress={() => setAttendanceType(type as 'onsite' | 'online' | 'hybrid')}
                    style={{ marginHorizontal: theme.spacing.xs }}
                  />
                ))}
              </View>
            </View>
          </View>

          {/* Type de participant */}
          {isLoadingAttendeeTypes ? (
            <View style={{ marginBottom: theme.spacing.md }}>
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Types de participant
              </Text>
              <ActivityIndicator size="small" color="#007AFF" />
            </View>
          ) : currentEventAttendeeTypes.length > 0 ? (
            <View style={{ marginBottom: theme.spacing.md }}>
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: theme.colors.text.secondary,
                  marginBottom: theme.spacing.xs,
                }}
              >
                Type de participant
              </Text>
              <View style={styles.pickerContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {currentEventAttendeeTypes.map((type: any) => (
                    <Button
                      key={type.id}
                      title={type.attendeeType.name}
                      variant={selectedAttendeeTypeId === type.id ? 'primary' : 'secondary'}
                      onPress={() => setSelectedAttendeeTypeId(type.id)}
                      style={{ marginHorizontal: theme.spacing.xs }}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
          ) : null}

          {/* Bouton */}
          <Button
            title={isCreating ? "Ajout en cours..." : "Ajouter le participant"}
            onPress={handleSubmit}
            disabled={isCreating}
          />
        </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    height: 48,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  pickerContainer: {
    marginBottom: 8,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
});
