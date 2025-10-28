/**
 * Écran de connexion
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { loginThunk } from '../../store/auth.slice';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export const LoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = 'L\'e-mail est requis';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'E-mail invalide';
    }

    if (!password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    try {
      await dispatch(loginThunk({ email, password })).unwrap();
      // Navigation sera gérée automatiquement par le navigator
    } catch (err: any) {
      Alert.alert('Erreur', err || t('auth.loginError'));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' as const : 'height' as const}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo / Titre */}
          <View style={styles.header}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.text.primary,
                  fontSize: theme.fontSize['3xl'],
                  fontWeight: theme.fontWeight.bold,
                },
              ]}
            >
              Attendee EMS
            </Text>
            <Text
              style={[
                styles.subtitle,
                {
                  color: theme.colors.text.secondary,
                  fontSize: theme.fontSize.base,
                  marginTop: theme.spacing.sm,
                },
              ]}
            >
              {t('auth.login')}
            </Text>
          </View>

          {/* Formulaire */}
          <View style={styles.form}>
            <Input
              label={t('auth.email')}
              value={email}
              onChangeText={setEmail}
              placeholder="exemple@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label={t('auth.password')}
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={true}
              autoCapitalize="none"
              error={errors.password}
            />

            {error && (
              <Text
                style={{
                  color: theme.colors.error[500],
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.spacing.md,
                  textAlign: 'center',
                }}
              >
                {error}
              </Text>
            )}

            <Button
              title={t('auth.login')}
              onPress={handleLogin}
              loading={isLoading}
              size="lg"
              style={{ marginTop: theme.spacing.lg }}
            />
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center' as const,
  },
  content: {
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center' as const,
    marginBottom: 48,
  },
  title: {
    textAlign: 'center' as const,
  },
  subtitle: {
    textAlign: 'center' as const,
  },
  form: {
    width: '100%',
  },
});
