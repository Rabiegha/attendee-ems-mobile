/**
 * Écran d'ajout d'un participant
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Header } from '../../components/ui/Header';

interface AttendeeAddScreenProps {
  navigation: any;
  route: any;
}

export const AttendeeAddScreen: React.FC<AttendeeAddScreenProps> = ({ navigation, route }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  const handleSubmit = () => {
    // TODO: Implement add attendee logic
    console.log('Add attendee:', { firstName, lastName, email, phone, company, jobTitle });
    navigation.goBack();
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Header
        title="Ajouter un participant"
        onBack={() => navigation.goBack()}
      />
      <ScrollView style={{ flex: 1 }}>
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
              value={firstName}
              onChangeText={setFirstName}
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
              value={lastName}
              onChangeText={setLastName}
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
              value={email}
              onChangeText={setEmail}
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
              value={phone}
              onChangeText={setPhone}
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
              value={company}
              onChangeText={setCompany}
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
              value={jobTitle}
              onChangeText={setJobTitle}
              placeholder="Titre du poste"
              placeholderTextColor={theme.colors.text.tertiary}
            />
          </View>

          {/* Bouton */}
          <Button
            title="Ajouter le participant"
            onPress={handleSubmit}
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
    paddingHorizontal: 12,
  },
});
