/**
 * Écran d'ajout d'un participant avec formulaire dynamique
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';

import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import { createRegistrationThunk } from '../../store/registrations.slice';
import { fetchEventAttendeeTypesThunk, fetchEventRegistrationFieldsThunk } from '../../store/events.slice';
import { loadSelectedPrinterThunk } from '../../store/printers.slice';
import { useToast } from '../../contexts/ToastContext';
import { hapticSuccess, hapticError } from '../../utils/haptics';
import { useNodePrint } from '../../printing/hooks/useNodePrint';
import { generateBadge } from '../../api/backend/badges.service';
import { Registration } from '../../types/attendee';

interface AttendeeAddScreenProps {
  navigation: any;
  route: any;
}

export const AttendeeAddScreen: React.FC<AttendeeAddScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const toast = useToast();
  const { printBadge, isPrinting } = useNodePrint();
  
  const { eventId } = route.params || {};
  const { isCreating } = useAppSelector((state) => state.registrations);
  const selectedPrinter = useAppSelector((state) => state.printers.selectedPrinter);
  const { 
    currentEventAttendeeTypes, 
    currentEventRegistrationFields,
    isLoadingAttendeeTypes,
    isLoadingRegistrationFields 
  } = useAppSelector((state) => state.events);

  // États du formulaire dynamique
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [lastFieldsUpdate, setLastFieldsUpdate] = useState<number>(0);
  const [isPrinterLoaded, setIsPrinterLoaded] = useState(false);
  
  // État pour la navigation en 2 étapes
  const [currentStep, setCurrentStep] = useState<1 | 2>(1); // 1 = sélection type, 2 = formulaire
  const [selectedAttendeeTypeId, setSelectedAttendeeTypeId] = useState<string | null>(null);

  // Fonction pour charger/recharger les données
  const loadFormData = useCallback(async () => {
    if (eventId) {
      console.log('[AttendeeAddScreen] Loading form data for event:', eventId);
      await Promise.all([
        dispatch(fetchEventAttendeeTypesThunk(eventId)),
        dispatch(fetchEventRegistrationFieldsThunk(eventId))
      ]);
      // Forcer un re-render en mettant à jour le timestamp
      setLastFieldsUpdate(Date.now());
    }
  }, [eventId, dispatch]);

  // Charger l'imprimante sélectionnée au montage
  useEffect(() => {
    const loadPrinter = async () => {
      await dispatch(loadSelectedPrinterThunk());
      setIsPrinterLoaded(true);
    };
    loadPrinter();
  }, [dispatch]);

  // Charger les types d'attendee et les champs du formulaire au montage
  useEffect(() => {
    loadFormData();
  }, [loadFormData]);

  // Recharger à chaque fois que l'écran devient actif (pour voir les modifications)
  useFocusEffect(
    useCallback(() => {
      console.log('[AttendeeAddScreen] Screen focused - reloading form data');
      loadFormData();
    }, [loadFormData])
  );

  // Réinitialiser le formulaire quand les champs changent
  useEffect(() => {
    console.log('[AttendeeAddScreen] Fields updated, resetting form. Fields count:', currentEventRegistrationFields.length);
    // Garder seulement les valeurs des champs qui existent toujours
    const newFormData: Record<string, any> = {};
    currentEventRegistrationFields.forEach(field => {
      if (formData[field.id] !== undefined) {
        newFormData[field.id] = formData[field.id];
      }
    });
    setFormData(newFormData);
  }, [currentEventRegistrationFields.length, lastFieldsUpdate]); // Dépendre du nombre de champs et du timestamp

  // Pull-to-refresh handler
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    console.log('[AttendeeAddScreen] Pull-to-refresh triggered');
    await loadFormData();
    setRefreshing(false);
  }, [loadFormData]);

  const handleInputChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
  };

  const validateForm = () => {
    // Valider les champs requis
    for (const field of currentEventRegistrationFields) {
      if (field.required && !formData[field.id]) {
        hapticError();
        toast.error(`Le champ "${field.label}" est requis`);
        return false;
      }
    }
    return true;
  };

  // Fonction pour réinitialiser le formulaire
  const resetForm = () => {
    setFormData({});
    setSelectedAttendeeTypeId(null);
    setCurrentStep(1);
  };

  const handleSubmit = async (shouldPrint: boolean = false) => {
    if (!validateForm()) return;
    if (!eventId) {
      hapticError();
      toast.error('ID de l\'événement manquant');
      return;
    }
    if (!selectedAttendeeTypeId) {
      hapticError();
      toast.error('Type de participant non sélectionné');
      return;
    }
    
    // Vérifier l'imprimante si on veut imprimer
    if (shouldPrint && !selectedPrinter) {
      hapticError();
      toast.error('Aucune imprimante sélectionnée');
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
        event_attendee_type_id: selectedAttendeeTypeId, // Ajouter le type sélectionné
        attendance_type: registrationData.attendance_type || 'onsite',
        source: 'mobile_app',
        ...registrationData,
        answers: Object.keys(answers).length > 0 ? answers : undefined,
      };

      console.log('[AttendeeAddScreen] Submitting registration:', payload);
      const result = await dispatch(createRegistrationThunk({ 
        eventId, 
        registrationData: payload 
      })).unwrap();
      
      // Succès - Feedback avec haptic et toast
      hapticSuccess();
      toast.success('✓ Participant ajouté avec succès');
      
      // Si l'impression est demandée, générer le badge puis imprimer
      if (shouldPrint && result) {
        console.log('[AttendeeAddScreen] Generating and printing badge for registration:', result.id);
        try {
          // 1. Générer le badge
          toast.info('🎨 Génération du badge...');
          const badge = await generateBadge(eventId, result.id);
          console.log('[AttendeeAddScreen] Badge generated - Full object:', JSON.stringify(badge, null, 2));
          
          // 2. Attendre 3 secondes pour que Puppeteer génère le PDF
          console.log('[AttendeeAddScreen] Waiting 3 seconds for PDF generation...');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          // 3. Construire l'URL du badge avec le bon ID
          // Essayer différentes propriétés possibles
          const badgeId = badge?.id || badge?.badgeId || badge?.badge?.id || badge?.data?.id;
          console.log('[AttendeeAddScreen] Extracted badge ID:', badgeId);
          
          if (!badgeId) {
            throw new Error('Badge ID not found in response. Check badge object structure.');
          }
          
          const updatedResult = { 
            ...result, 
            badge_pdf_url: `/api/badges/${badgeId}/pdf` 
          };
          
          // 4. Imprimer le badge
          console.log('[AttendeeAddScreen] Printing badge with URL:', updatedResult.badge_pdf_url);
          await printBadge(updatedResult as Registration);
          toast.success('🖨️ Badge envoyé à l\'impression');
        } catch (printError: any) {
          console.error('[AttendeeAddScreen] Print error:', printError);
          hapticError();
          toast.error(printError.message || 'Erreur lors de l\'impression du badge');
        }
      }
      
      // Réinitialiser complètement le formulaire
      resetForm();
      
      // Naviguer vers la liste des participants
      navigation.navigate('Dashboard', {
        screen: 'AttendeesList',
        params: { eventId }
      });
      
    } catch (error: any) {
      console.error('[AttendeeAddScreen] Error creating registration:', error);
      hapticError();
      toast.error(
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
        // Ce champ ne doit plus apparaître dans le formulaire, car le type est sélectionné en étape 1
        return null;

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

  // Vue Étape 1 : Sélection du type d'attendee
  const renderStep1 = () => {
    return (
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          padding: theme.spacing.lg,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand[600]}
            colors={[theme.colors.brand[600]]}
          />
        }
      >
        <Card>
          <Text style={{
            fontSize: theme.fontSize.xl,
            fontWeight: '600',
            color: theme.colors.text.primary,
            marginBottom: theme.spacing.lg,
          }}>
            Choisir le type
          </Text>

          {isLoadingAttendeeTypes ? (
            <ActivityIndicator size="large" color={theme.colors.brand[600]} />
          ) : currentEventAttendeeTypes.length === 0 ? (
            <Text style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
              Aucun type de participant configuré pour cet événement
            </Text>
          ) : (
            <View style={{ gap: theme.spacing.md }}>
              {currentEventAttendeeTypes.map((type) => {
                const bgColor = type.color_hex || type.attendeeType.color_hex || theme.colors.neutral[200];
                
                return (
                  <Button
                    key={type.id}
                    title={type.attendeeType.name}
                    onPress={() => {
                      setSelectedAttendeeTypeId(type.id);
                      setCurrentStep(2); // Passer directement au formulaire
                    }}
                    variant="secondary"
                    style={{
                      borderWidth: 2,
                      borderColor: bgColor,
                      height: 70, // Remplacer minHeight par height pour éviter les conflits
                    }}
                    textStyle={{
                      fontSize: theme.fontSize.xl,
                      fontWeight: '600',
                    }}
                  />
                );
              })}
            </View>
          )}
        </Card>
      </ScrollView>
    );
  };

  // Vue Étape 2 : Formulaire
  const renderStep2 = () => {
    const selectedType = currentEventAttendeeTypes.find(t => t.id === selectedAttendeeTypeId);
    
    return (
      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          padding: theme.spacing.lg,
          paddingBottom: 120,
        }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.colors.brand[600]}
            colors={[theme.colors.brand[600]]}
          />
        }
      >
        {/* Indicateur du type sélectionné */}
        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text style={{
            fontSize: theme.fontSize.sm,
            color: theme.colors.text.secondary,
            marginBottom: theme.spacing.xs,
          }}>
            Type :
          </Text>
          <Text style={{
            fontSize: theme.fontSize.lg,
            fontWeight: '600',
            color: theme.colors.text.primary,
          }}>
            {selectedType?.attendeeType.name}
          </Text>
        </Card>

        <Card>
          {currentEventRegistrationFields.length === 0 ? (
            <Text style={{ color: theme.colors.text.secondary, textAlign: 'center' }}>
              Aucun champ de formulaire configuré pour cet événement
            </Text>
          ) : (
            currentEventRegistrationFields.map(renderField)
          )}
        </Card>

        {/* Boutons d'action */}
        <View style={{ marginTop: theme.spacing.lg, gap: theme.spacing.md }}>
          <Button
            title={isCreating ? 'Ajout en cours...' : 'Ajouter le participant'}
            onPress={() => handleSubmit(false)}
            disabled={isCreating || isPrinting}
            variant="primary"
          />
          
          <Button
            title={isPrinting ? '🖨️ Impression...' : isCreating ? 'Ajout en cours...' : '🖨️ Ajouter et imprimer'}
            onPress={() => handleSubmit(true)}
            disabled={isCreating || isPrinting || !selectedPrinter || !isPrinterLoaded}
            variant="secondary"
            style={{
              opacity: (selectedPrinter && isPrinterLoaded) ? 1 : 0.6,
            }}
          />
          
          {isPrinterLoaded && !selectedPrinter && (
            <Text style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.tertiary,
              textAlign: 'center',
              fontStyle: 'italic',
            }}>
              Configurez une imprimante dans les paramètres pour imprimer
            </Text>
          )}
          
          <Button
            title="Annuler"
            onPress={() => {
              resetForm();
              navigation.goBack();
            }}
            disabled={isCreating || isPrinting}
            variant="ghost"
          />
        </View>
      </ScrollView>
    );
  };
  
  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <Header
        title={currentStep === 1 ? "Sélectionner le type" : "Remplir le formulaire"}
        onBack={() => {
          if (currentStep === 2) {
            // Si on est à l'étape 2, revenir à l'étape 1
            setCurrentStep(1);
          } else {
            // Sinon, retour à l'écran précédent
            navigation.goBack();
          }
        }}
        rightComponent={<ProfileButton />}
      />
      
      {isLoadingRegistrationFields || isLoadingAttendeeTypes ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: theme.spacing.md, color: theme.colors.text.secondary }}>
            Chargement...
          </Text>
        </View>
      ) : (
        currentStep === 1 ? renderStep1() : renderStep2()
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});