/**
 * Écran des paramètres d'impression
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import { Ionicons } from '@expo/vector-icons';
import { getPrintMode, setPrintMode, PrintMode } from '../../printing/preferences/printMode';

const PRINT_ON_SCAN_KEY = '@print_settings:print_on_scan';

interface PrintSettingsScreenProps {
  navigation: any;
}

export const PrintSettingsScreen: React.FC<PrintSettingsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [printOnScan, setPrintOnScan] = useState(false);
  const [currentPrintMode, setCurrentPrintMode] = useState<PrintMode>('ems-client');

  // Charger les préférences au montage
  useEffect(() => {
    loadPrintOnScanPreference();
    loadPrintModePreference();
  }, []);

  const loadPrintModePreference = async () => {
    try {
      const mode = await getPrintMode();
      setCurrentPrintMode(mode);
      console.log('[PrintSettings] Loaded print mode:', mode);
    } catch (error) {
      console.error('[PrintSettings] Error loading print mode:', error);
    }
  };

  const handlePrintModeChange = async (mode: PrintMode) => {
    try {
      await setPrintMode(mode);
      setCurrentPrintMode(mode);
      console.log('[PrintSettings] Saved print mode:', mode);
    } catch (error) {
      console.error('[PrintSettings] Error saving print mode:', error);
    }
  };

  const loadPrintOnScanPreference = async () => {
    try {
      const value = await AsyncStorage.getItem(PRINT_ON_SCAN_KEY);
      if (value !== null) {
        setPrintOnScan(value === 'true');
        console.log('[PrintSettings] Loaded printOnScan preference:', value);
      }
    } catch (error) {
      console.error('[PrintSettings] Error loading printOnScan preference:', error);
    }
  };

  const handlePrintOnScanToggle = async (value: boolean) => {
    try {
      await AsyncStorage.setItem(PRINT_ON_SCAN_KEY, value.toString());
      setPrintOnScan(value);
      console.log('[PrintSettings] Saved printOnScan preference:', value);
    } catch (error) {
      console.error('[PrintSettings] Error saving printOnScan preference:', error);
    }
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Header
        title="Paramètres"
        onBack={() => navigation.goBack()}
        rightComponent={<ProfileButton />}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content, 
          { paddingHorizontal: theme.spacing.lg, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Mode d'impression - Toggle */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.md,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.text.primary,
              marginBottom: 4,
            }}
          >
            Mode d'impression
          </Text>
          <Text
            style={{
              fontSize: theme.fontSize.xs,
              color: theme.colors.text.secondary,
              marginBottom: theme.spacing.md,
            }}
          >
            {currentPrintMode === 'ems-client'
              ? 'Les badges sont envoyés au client Electron pour impression locale'
              : 'Les badges sont envoyés directement via PrintNode (cloud)'}
          </Text>
          
          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  borderRadius: theme.radius.lg,
                  backgroundColor: currentPrintMode === 'ems-client' 
                    ? theme.colors.brand[50] 
                    : theme.colors.neutral[200],
                  borderWidth: 2,
                  borderColor: currentPrintMode === 'ems-client' 
                    ? theme.colors.brand[500] 
                    : 'transparent',
                  marginRight: 6,
                },
              ]}
              onPress={() => handlePrintModeChange('ems-client')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="desktop-outline" 
                size={32} 
                color={currentPrintMode === 'ems-client' ? theme.colors.brand[600] : theme.colors.neutral[600]} 
              />
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  color: currentPrintMode === 'ems-client' 
                    ? theme.colors.brand[600] 
                    : theme.colors.neutral[600],
                  marginTop: theme.spacing.xs,
                }}
              >
                EMS Client
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleButton,
                {
                  borderRadius: theme.radius.lg,
                  backgroundColor: currentPrintMode === 'printnode' 
                    ? theme.colors.brand[50] 
                    : theme.colors.neutral[200],
                  borderWidth: 2,
                  borderColor: currentPrintMode === 'printnode' 
                    ? theme.colors.brand[500] 
                    : 'transparent',
                  marginLeft: 6,
                },
              ]}
              onPress={() => handlePrintModeChange('printnode')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="cloud-outline" 
                size={32} 
                color={currentPrintMode === 'printnode' ? theme.colors.brand[600] : theme.colors.neutral[600]} 
              />
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  fontWeight: theme.fontWeight.medium,
                  color: currentPrintMode === 'printnode' 
                    ? theme.colors.brand[600] 
                    : theme.colors.neutral[600],
                  marginTop: theme.spacing.xs,
                }}
              >
                PrintNode
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Imprimantes - Navigation */}
        <TouchableOpacity
          style={[
            styles.menuItem,
            {
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.md,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
            },
          ]}
          onPress={() => navigation.navigate(
            currentPrintMode === 'printnode' ? 'PrintersList' : 'EmsPrintersList'
          )}
          activeOpacity={0.7}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.text.primary,
            }}
          >
            Imprimantes
          </Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text.secondary} />
        </TouchableOpacity>

        {/* Imprimer le badge au scan - Switch */}
        <View
          style={[
            styles.switchRow,
            {
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.md,
              paddingVertical: theme.spacing.md,
              paddingHorizontal: theme.spacing.lg,
            },
          ]}
        >
          <View style={{ flex: 1, marginRight: theme.spacing.md }}>
            <Text
              style={{
                fontSize: theme.fontSize.base,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.text.primary,
                marginBottom: 4,
              }}
            >
              Imprimer le badge au scan
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              Impression automatique lors du check-in par QR code
            </Text>
          </View>
          <Switch
            value={printOnScan}
            onValueChange={handlePrintOnScanToggle}
            trackColor={{ 
              false: theme.colors.neutral[300], 
              true: theme.colors.brand[500] 
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={theme.colors.neutral[300]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  section: {
    // Styles dynamiques appliqués inline
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  toggleButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
