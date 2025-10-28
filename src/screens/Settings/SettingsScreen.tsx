/**
 * Écran des paramètres
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { logoutThunk } from '../../store/auth.slice';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export const SettingsScreen: React.FC = () => {
  const { theme, themeMode, setThemeMode } = useTheme();
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);

  const handleLogout = async () => {
    await dispatch(logoutThunk());
  };

  const themeModes: Array<{ value: 'system' | 'light' | 'dark'; label: string }> = [
    { value: 'system', label: t('settings.system') },
    { value: 'light', label: t('settings.light') },
    { value: 'dark', label: t('settings.dark') },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={{ padding: theme.spacing.lg }}>
        {/* Compte */}
        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text
            style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md,
            }}
          >
            {t('settings.account')}
          </Text>
          {user && (
            <View>
              <Text style={{ color: theme.colors.text.primary, fontSize: theme.fontSize.base }}>
                {user.firstName} {user.lastName}
              </Text>
              <Text
                style={{
                  color: theme.colors.text.secondary,
                  fontSize: theme.fontSize.sm,
                  marginTop: theme.spacing.xs,
                }}
              >
                {user.email}
              </Text>
            </View>
          )}
        </Card>

        {/* Thème */}
        <Card style={{ marginBottom: theme.spacing.lg }}>
          <Text
            style={{
              fontSize: theme.fontSize.lg,
              fontWeight: theme.fontWeight.semibold,
              color: theme.colors.text.primary,
              marginBottom: theme.spacing.md,
            }}
          >
            {t('settings.theme')}
          </Text>
          <View style={styles.themeModes}>
            {themeModes.map((mode) => (
              <TouchableOpacity
                key={mode.value}
                style={[
                  styles.themeOption,
                  {
                    backgroundColor:
                      themeMode === mode.value ? theme.colors.brand[100] : theme.colors.neutral[100],
                    borderRadius: theme.radius.md,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
                onPress={() => setThemeMode(mode.value)}
              >
                <Text
                  style={{
                    color: themeMode === mode.value ? theme.colors.brand[600] : theme.colors.text.primary,
                    fontWeight: themeMode === mode.value ? theme.fontWeight.semibold : theme.fontWeight.normal,
                  }}
                >
                  {mode.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Card>

        {/* Déconnexion */}
        <Button title={t('auth.logout')} onPress={handleLogout} variant="destructive" />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  themeModes: {},
  themeOption: {},
});
