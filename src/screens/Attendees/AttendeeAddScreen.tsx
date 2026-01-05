/**
 * Écran d'ajout d'un participant avec formulaire dynamique
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
import { fetchEventAttendeeTypesThunk, fetchEventRegistrationFieldsThunk } from '../../store/events.slice';

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
  const { 
    currentEventAttendeeTypes, 
    currentEventRegistrationFields,
    isLoadingAttendeeTypes,
    isLoadingRegistrationFields 
  } = useAppSelector((state) => state.events);

  // États du formulaire dynamique
  const [formData, setFormData] = useState<Record<string, any>>({});

  // Charger les types d'attendee et les champs du formulaire au montage
  useEffect(() => {
    if (eventId) {
      dispatch(fetchEventAttendeeTypesThunk(eventId));
      dispatch(fetchEventRegistrationFieldsThunk(eventId));
    }
  }, [eventId, dispatch]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const validateForm = () => {
    // Valider les champs requis
    for (const field of currentEventRegistrationFields) {
      if (field.required && !formData[field.id]) {
        Alert.alert('Erreur', `Le champ "${field.label}" est requis`);
        return false;
      }
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
      // Préparer les données selon le mapping des champs (comme sur le web)
      const attendee: any = {};
      const registrationData: any = {};
      const answers: any = {};

      // Helper pour convertir camelCase en snake_case
      const toSnakeCase = (str: string) => {
        return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
      };

      currentEventRegistrationFields.forEach((field: any) => {
        const value = formData[field.id];
        if (!value && value !== false && value !== 0) return;

        if (field.attendeeField) {
          // Convertir de camelCase à snake_case pour le backend
          const backendFieldName = toSnakeCase(field.attendeeField);
          attendee[backendFieldName] = value;
        } else if (field.registrationField) {
          registrationData[field.registrationField] = value;
        } else if (field.storeInAnswers) {
          answers[field.key || field.id] = value;
        }
      });

      const payload = {
        attendee,
        attendance_type: registrationData.attendance_type || 'onsite',
        source: 'mobile_app',
        ...registrationData,
        answers: Object.keys(answers).length > 0 ? answers : undefined,
      };

      console.log('[AttendeeAddScreen] Submitting registration:', payload);
      await dispatch(createRegistrationThunk({ 
        eventId, 
        registrationData: payload 
      })).unwrap();
      
      Alert.alert('Succès', 'Participant ajouté avec succès', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error: any) {
      console.error('[AttendeeAddScreen] Error creating registration:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de l\'ajout du participant'
      );
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.id] || '';

    switch (field.type) {
      case 'textarea':
        return (
          <View key={field.id} style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              {field.label}
              {field.required && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            <TextInput
              style={[
                {
                  backgroundColor: theme.colors.background,
                  borderWidth: 1,
                  borderColor: theme.colors.border,
                  color: theme.colors.text.primary,
                  borderRadius: theme.radius.md,
                  fontSize: theme.fontSize.base,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.sm,
                },
                { height: 100, textAlignVertical: 'top', paddingTop: theme.spacing.sm }
              ]}
              value={value}
              onChangeText={(val) => handleInputChange(field.id, val)}
              placeholder={field.placeholder}
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              numberOfLines={4}
            />
          </View>
        );

      case 'select':
        return (
          <View key={field.id} style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              {field.label}
              {field.required && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: theme.spacing.xs }}
            >
              {field.options?.map((option: { value: string; label: string }, idx: number) => (
                <Button
                  key={idx}
                  title={option.label}
                  variant={value === option.value ? 'primary' : 'secondary'}
                  onPress={() => handleInputChange(field.id, option.value)}
                  style={{ marginRight: theme.spacing.xs }}
                />
              ))}
            </ScrollView>
          </View>
        );

      case 'attendee_type':
        return (
          <View key={field.id} style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              {field.label}
              {field.required && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            {isLoadingAttendeeTypes ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: theme.spacing.xs }}
              >
                {currentEventAttendeeTypes.map((type) => (
                  <Button
                    key={type.id}
                    title={type.attendeeType.name}
                    variant={value === type.id ? 'primary' : 'secondary'}
                    onPress={() => handleInputChange(field.id, type.id)}
                    style={{ marginRight: theme.spacing.xs }}
                  />
                ))}
              </ScrollView>
            )}
          </View>
        );

      case 'email':
        return (
          <View key={field.id} style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              {field.label}
              {field.required && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                color: theme.colors.text.primary,
                borderRadius: theme.radius.md,
                fontSize: theme.fontSize.base,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }}
              value={value}
              onChangeText={(val) => handleInputChange(field.id, val)}
              placeholder={field.placeholder}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        );

      case 'tel':
        return (
          <View key={field.id} style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              {field.label}
              {field.required && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                color: theme.colors.text.primary,
                borderRadius: theme.radius.md,
                fontSize: theme.fontSize.base,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }}
              value={value}
              onChangeText={(val) => handleInputChange(field.id, val)}
              placeholder={field.placeholder}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType="phone-pad"
            />
          </View>
        );

      default: // text, number, etc.
        return (
          <View key={field.id} style={{ marginBottom: theme.spacing.md }}>
            <Text style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.xs,
            }}>
              {field.label}
              {field.required && <Text style={{ color: '#EF4444' }}>*</Text>}
            </Text>
            <TextInput
              style={{
                backgroundColor: theme.colors.background,
                borderWidth: 1,
                borderColor: theme.colors.border,
                color: theme.colors.text.primary,
                borderRadius: theme.radius.md,
                fontSize: theme.fontSize.base,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.sm,
              }}
              value={value}
              onChangeText={(val) => handleInputChange(field.id, val)}
              placeholder={field.placeholder}
              placeholderTextColor={theme.colors.text.tertiary}
              keyboardType={field.type === 'number' ? 'numeric' : 'default'}
            />
          </View>
        );
    }
  };
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <Header
        title="Ajouter un participant"
        onBack={() => navigation.goBack()}
      />
      
      {isLoadingRegistrationFields ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: theme.spacing.md, color: theme.colors.text.secondary }}>
            Chargement du formulaire...
          </Text>
        </View>
      ) : (
        <ScrollView 
          style={{ flex: 1 }}
          contentContainerStyle={{ 
            padding: theme.spacing.lg,
            paddingBottom: 120,
          }}
        >
          <Card>
            {currentEventRegistrationFields.length === 0 ? (
              <Text style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
                Aucun champ de formulaire configuré pour cet événement
              </Text>
            ) : (
              currentEventRegistrationFields.map(renderField)
            )}
          </Card>

          <Button
            title={isCreating ? 'Ajout en cours...' : 'Ajouter le participant'}
            onPress={handleSubmit}
            disabled={isCreating}
            style={{ marginTop: theme.spacing.lg }}
          />
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});