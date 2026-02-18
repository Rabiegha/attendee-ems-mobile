/**
 * Écran de liste des imprimantes EMS Client
 * 
 * Affiche les imprimantes exposées par le client Electron via le backend.
 * Permet de sélectionner l'imprimante cible pour le mode EMS Client.
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchEmsPrintersThunk,
  loadSelectedEmsPrinterThunk,
  selectEmsPrinterThunk,
  clearSelectedEmsPrinterThunk,
  clearEmsError,
} from '../../store/emsPrinters.slice';
import { EmsPrinter } from '../../api/backend/emsPrinters.service';
import { Header } from '../../components/ui/Header';
import { ProfileButton } from '../../components/ui/ProfileButton';
import { Ionicons } from '@expo/vector-icons';

interface EmsPrintersListScreenProps {
  navigation: any;
}

export const EmsPrintersListScreen: React.FC<EmsPrintersListScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const dispatch = useAppDispatch();

  const {
    printers,
    selectedPrinter,
    isLoading,
    error,
  } = useAppSelector((state) => state.emsPrinters);

  useEffect(() => {
    dispatch(loadSelectedEmsPrinterThunk());
    dispatch(fetchEmsPrintersThunk());
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error, [
        { text: 'OK', onPress: () => dispatch(clearEmsError()) },
      ]);
    }
  }, [error]);

  const handlePrinterPress = (printer: EmsPrinter) => {
    if (selectedPrinter?.name === printer.name) {
      dispatch(clearSelectedEmsPrinterThunk());
    } else {
      dispatch(selectEmsPrinterThunk(printer));
    }
  };

  const handleRefresh = () => {
    dispatch(fetchEmsPrintersThunk());
  };

  const getPrinterStatusInfo = (printer: EmsPrinter) => {
    switch (printer.status) {
      case 0:
        return { text: 'Prête', color: theme.colors.brand[600] };
      case 1:
        return { text: 'En pause', color: theme.colors.warning?.[600] || '#D97706' };
      case 2:
        return { text: 'Erreur', color: theme.colors.error?.[600] || '#DC2626' };
      default:
        return { text: `Status ${printer.status}`, color: theme.colors.neutral[500] };
    }
  };

  const renderPrinterItem = ({ item }: { item: EmsPrinter }) => {
    const isSelected = selectedPrinter?.name === item.name;
    const status = getPrinterStatusInfo(item);

    return (
      <TouchableOpacity
        style={[
          styles.printerItem,
          {
            backgroundColor: isSelected
              ? theme.colors.brand[50]
              : theme.colors.card,
            borderRadius: theme.radius.lg,
            marginBottom: theme.spacing.sm,
            borderWidth: isSelected ? 2 : 1,
            borderColor: isSelected
              ? theme.colors.brand[500]
              : theme.colors.neutral[300],
          },
        ]}
        onPress={() => handlePrinterPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.printerContent}>
          <View style={styles.printerHeader}>
            <View style={styles.printerIconContainer}>
              <Ionicons
                name="print-outline"
                size={24}
                color={isSelected ? theme.colors.brand[600] : theme.colors.neutral[600]}
              />
            </View>

            <View style={styles.printerInfo}>
              <Text
                style={{
                  fontSize: theme.fontSize.base,
                  fontWeight: theme.fontWeight.semibold,
                  color: isSelected
                    ? theme.colors.brand[700]
                    : theme.colors.text.primary,
                }}
              >
                {item.displayName || item.name}
              </Text>
            </View>

            {isSelected && (
              <View
                style={[
                  styles.selectedBadge,
                  {
                    backgroundColor: theme.colors.brand[600],
                    borderRadius: 999,
                  },
                ]}
              >
                <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              </View>
            )}
          </View>

          <View style={[styles.printerFooter, { marginTop: theme.spacing.sm }]}>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: status.color + '20',
                  borderRadius: theme.radius.sm,
                  paddingHorizontal: theme.spacing.xs,
                  paddingVertical: 2,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: theme.fontSize.xs,
                  color: status.color,
                  fontWeight: theme.fontWeight.medium,
                }}
              >
                {status.text}
              </Text>
            </View>

            {item.isDefault && (
              <View
                style={[
                  styles.statusBadge,
                  {
                    backgroundColor: theme.colors.neutral[100],
                    borderRadius: theme.radius.sm,
                    paddingHorizontal: theme.spacing.xs,
                    paddingVertical: 2,
                    marginLeft: 6,
                  },
                ]}
              >
                <Text
                  style={{
                    fontSize: theme.fontSize.xs,
                    color: theme.colors.neutral[600],
                  }}
                >
                  Par défaut
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="desktop-outline"
        size={48}
        color={theme.colors.neutral[400]}
      />
      <Text
        style={{
          fontSize: theme.fontSize.base,
          fontWeight: theme.fontWeight.medium,
          color: theme.colors.text.primary,
          marginTop: theme.spacing.md,
          textAlign: 'center',
        }}
      >
        Aucune imprimante disponible
      </Text>
      <Text
        style={{
          fontSize: theme.fontSize.sm,
          color: theme.colors.text.secondary,
          marginTop: theme.spacing.xs,
          textAlign: 'center',
          paddingHorizontal: theme.spacing.xl,
        }}
      >
        Ouvrez l'application EMS Print Client sur votre ordinateur et cochez les imprimantes à exposer.
      </Text>
    </View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      <Header
        title="Imprimantes EMS"
        onBack={() => navigation.goBack()}
        rightComponent={<ProfileButton />}
      />

      {isLoading && printers.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[600]} />
          <Text
            style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.text.secondary,
              marginTop: theme.spacing.md,
            }}
          >
            Chargement des imprimantes...
          </Text>
        </View>
      ) : (
        <FlatList
          data={printers}
          renderItem={renderPrinterItem}
          keyExtractor={(item) => item.name}
          contentContainerStyle={{
            padding: theme.spacing.lg,
            paddingBottom: 100,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={handleRefresh}
              tintColor={theme.colors.brand[600]}
            />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  printerItem: {
    overflow: 'hidden',
  },
  printerContent: {
    padding: 16,
  },
  printerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  printerIconContainer: {
    width: 32,
    marginRight: 12,
    alignItems: 'center',
  },
  printerInfo: {
    flex: 1,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  printerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 44,
  },
  statusBadge: {},
});
