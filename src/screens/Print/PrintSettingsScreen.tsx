/**
 * Écran des paramètres d'impression
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useTranslation } from 'react-i18next';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import Icons from '../../assets/icons';
import { Ionicons } from '@expo/vector-icons';

interface PrintSettingsScreenProps {
  navigation: any;
}

export const PrintSettingsScreen: React.FC<PrintSettingsScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const { t } = useTranslation();

  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [autoPrint, setAutoPrint] = useState(false);
  const [printQuality, setPrintQuality] = useState(100);

  const handleApply = () => {
    console.log('Applying settings:', { orientation, autoPrint, printQuality });
    // TODO: Save settings and navigate back
    navigation.goBack();
  };

  const getQualityLabel = () => {
    if (printQuality >= 80) return 'Très haute résolution';
    if (printQuality >= 60) return 'Haute résolution';
    if (printQuality >= 40) return 'Résolution moyenne';
    return 'Basse résolution';
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Header
        title="Paramètres d'impression"
        onBack={() => navigation.goBack()}
        rightComponent={<ProfileButton />}
      />

      <View style={[styles.content, { paddingHorizontal: theme.spacing.lg }]}>
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
          onPress={() => navigation.navigate('PrintersList')}
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

        {/* Orientation - Toggle */}
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
              marginBottom: theme.spacing.md,
            }}
          >
            Orientation
          </Text>
          
          <View style={styles.orientationContainer}>
            <TouchableOpacity
              style={[
                styles.orientationButton,
                {
                  borderRadius: theme.radius.lg,
                  backgroundColor: orientation === 'portrait' 
                    ? theme.colors.brand[50] 
                    : theme.colors.neutral[200],
                  borderWidth: 2,
                  borderColor: orientation === 'portrait' 
                    ? theme.colors.brand[500] 
                    : 'transparent',
                  marginRight: 6,
                },
              ]}
              onPress={() => setOrientation('portrait')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="document-text-outline" 
                size={40} 
                color={orientation === 'portrait' ? theme.colors.brand[600] : theme.colors.neutral[600]} 
              />
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: orientation === 'portrait' 
                    ? theme.colors.brand[600] 
                    : theme.colors.neutral[600],
                  marginTop: theme.spacing.xs,
                }}
              >
                Portrait
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.orientationButton,
                {
                  borderRadius: theme.radius.lg,
                  backgroundColor: orientation === 'landscape' 
                    ? theme.colors.brand[50] 
                    : theme.colors.neutral[200],
                  borderWidth: 2,
                  borderColor: orientation === 'landscape' 
                    ? theme.colors.brand[500] 
                    : 'transparent',
                  marginLeft: 6,
                },
              ]}
              onPress={() => setOrientation('landscape')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="document-text-outline" 
                size={40} 
                color={orientation === 'landscape' ? theme.colors.brand[600] : theme.colors.neutral[600]} 
              />
              <Text
                style={{
                  fontSize: theme.fontSize.sm,
                  color: orientation === 'landscape' 
                    ? theme.colors.brand[600] 
                    : theme.colors.neutral[600],
                  marginTop: theme.spacing.xs,
                }}
              >
                Paysage
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Auto Print - Switch */}
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
          <Text
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: theme.fontWeight.medium,
              color: theme.colors.text.primary,
            }}
          >
            Auto Print
          </Text>
          <Switch
            value={autoPrint}
            onValueChange={setAutoPrint}
            trackColor={{ 
              false: theme.colors.neutral[300], 
              true: theme.colors.brand[500] 
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={theme.colors.neutral[300]}
          />
        </View>

        {/* Qualité d'impression - Slider */}
        <View
          style={[
            styles.section,
            {
              backgroundColor: theme.colors.card,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.xl,
              padding: theme.spacing.lg,
            },
          ]}
        >
          <View style={styles.qualityHeader}>
            <Text
              style={{
                fontSize: theme.fontSize.base,
                fontWeight: theme.fontWeight.medium,
                color: theme.colors.text.primary,
              }}
            >
              Qualité d'impression: {printQuality}%
            </Text>
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: theme.colors.text.secondary,
              }}
            >
              {getQualityLabel()}
            </Text>
          </View>
          
          {/* Custom Slider */}
          <View style={styles.sliderContainer}>
            <View style={[styles.sliderTrack, { backgroundColor: theme.colors.neutral[300] }]}>
              <View 
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: `${printQuality}%`,
                  backgroundColor: theme.colors.brand[500],
                  borderRadius: 3,
                }} 
              />
            </View>
            <View style={styles.sliderMarks}>
              {[0, 25, 50, 75, 100].map((mark) => (
                <TouchableOpacity
                  key={mark}
                  style={[
                    styles.sliderMark,
                    {
                      backgroundColor: printQuality >= mark 
                        ? theme.colors.brand[600] 
                        : theme.colors.neutral[400],
                    },
                  ]}
                  onPress={() => setPrintQuality(mark)}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Bouton Appliquer */}
        <TouchableOpacity
          style={[
            styles.applyButton,
            {
              backgroundColor: theme.colors.brand[600],
              borderRadius: theme.radius.lg,
              paddingVertical: theme.spacing.lg,
            },
          ]}
          onPress={handleApply}
          activeOpacity={0.8}
        >
          <Text
            style={{
              fontSize: theme.fontSize.base,
              fontWeight: theme.fontWeight.semibold,
              color: '#FFFFFF',
              textAlign: 'center',
            }}
          >
            Appliquer
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
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
  orientationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orientationButton: {
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
  qualityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sliderContainer: {
    width: '100%',
    marginVertical: 8,
  },
  sliderTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  sliderMarks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderMark: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  applyButton: {
    // Styles dynamiques appliqués inline
  },
});
