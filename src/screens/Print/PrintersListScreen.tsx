/**
 * Écran de liste des imprimantes PrintNode
 */

import React, { useEffect, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme/ThemeProvider';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchPrintersThunk,
  loadSelectedPrinterThunk,
  selectPrinterThunk,
  setSearchQuery,
  clearError,
} from '../../store/printers.slice';
import { Printer } from '../../api/printNode/printers.service';
import { SearchBar } from '../../components/ui/SearchBar';
import { Header } from '../../components/ui/Header';
import { Ionicons } from '@expo/vector-icons';

interface PrintersListScreenProps {
  navigation: any;
}

export const PrintersListScreen: React.FC<PrintersListScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const dispatch = useAppDispatch();
  
  const { 
    printers, 
    selectedPrinter, 
    isLoading, 
    error, 
    searchQuery 
  } = useAppSelector((state) => state.printers);

  useEffect(() => {
    // Charger l'imprimante sélectionnée depuis le stockage
    dispatch(loadSelectedPrinterThunk());
    // Charger la liste des imprimantes
    loadPrinters();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Erreur', error, [
        { text: 'OK', onPress: () => dispatch(clearError()) }
      ]);
    }
  }, [error]);

  const loadPrinters = () => {
    dispatch(fetchPrintersThunk());
  };

  const handlePrinterPress = (printer: Printer) => {
    dispatch(selectPrinterThunk(printer));
  };

  const handleSearch = (query: string) => {
    dispatch(setSearchQuery(query));
  };

  // Filtrer les imprimantes selon la recherche
  const filteredPrinters = useMemo(() => {
    if (!searchQuery.trim()) return printers;
    
    const query = searchQuery.toLowerCase();
    return printers.filter(
      (printer) =>
        printer.name.toLowerCase().includes(query) ||
        printer.computer.name.toLowerCase().includes(query) ||
        printer.description.toLowerCase().includes(query)
    );
  }, [printers, searchQuery]);

  const getPrinterIcon = (printer: Printer) => {
    if (printer.capabilities.color) {
      return 'color-palette-outline';
    }
    return 'print-outline';
  };

  const getPrinterStatus = (printer: Printer) => {
    switch (printer.state) {
      case 'online':
        return { text: 'En ligne', color: theme.colors.brand[600] };
      case 'offline':
        return { text: 'Hors ligne', color: theme.colors.neutral[500] };
      case 'error':
        return { text: 'Erreur', color: theme.colors.error[600] };
      default:
        return { text: printer.state, color: theme.colors.neutral[500] };
    }
  };

  const renderPrinterItem = ({ item }: { item: Printer }) => {
    const isSelected = selectedPrinter?.id === item.id;
    const status = getPrinterStatus(item);

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
          {/* Icône et info principale */}
          <View style={styles.printerHeader}>
            <View style={styles.printerIconContainer}>
              <Ionicons
                name={getPrinterIcon(item)}
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
                {item.name}
              </Text>
              
              {item.computer.name && (
                <Text
                  style={{
                    fontSize: theme.fontSize.sm,
                    color: isSelected 
                      ? theme.colors.brand[600] 
                      : theme.colors.text.secondary,
                    marginTop: 2,
                  }}
                >
                  {item.computer.name}
                </Text>
              )}
            </View>

            {/* Badge sélectionné */}
            {isSelected && (
              <View
                style={[
                  styles.selectedBadge,
                  {
                    backgroundColor: theme.colors.brand[600],
                    borderRadius: theme.radius.full,
                  },
                ]}
              >
                <Ionicons
                  name="checkmark"
                  size={16}
                  color="#FFFFFF"
                />
              </View>
            )}
          </View>

          {/* Description */}
          {item.description && (
            <Text
              style={{
                fontSize: theme.fontSize.sm,
                color: isSelected 
                  ? theme.colors.brand[600] 
                  : theme.colors.text.secondary,
                marginTop: theme.spacing.xs,
                marginLeft: 40, // Aligné avec le texte principal
              }}
            >
              {item.description}
            </Text>
          )}

          {/* Statut et capacités */}
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

            <View style={styles.capabilities}>
              {item.capabilities.color && (
                <View
                  style={[
                    styles.capabilityBadge,
                    {
                      backgroundColor: theme.colors.neutral[100],
                      borderRadius: theme.radius.sm,
                      paddingHorizontal: theme.spacing.xs,
                      paddingVertical: 2,
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.xs,
                      color: theme.colors.neutral[600],
                    }}
                  >
                    Couleur
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView 
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <Header
        title="Imprimantes"
        onBack={() => navigation.goBack()}
      />

      {/* Barre de recherche */}
      <View style={[styles.searchContainer, { paddingHorizontal: theme.spacing.lg }]}>
        <SearchBar
          placeholder="Rechercher une imprimante..."
          value={searchQuery}
          onChangeText={handleSearch}
        />
      </View>

      {/* Information sur l'imprimante sélectionnée */}
      {selectedPrinter && (
        <View
          style={[
            styles.selectedInfo,
            {
              backgroundColor: theme.colors.brand[50],
              marginHorizontal: theme.spacing.lg,
              padding: theme.spacing.md,
              borderRadius: theme.radius.lg,
              marginBottom: theme.spacing.md,
              borderWidth: 1,
              borderColor: theme.colors.brand[100],
            },
          ]}
        >
          <Text
            style={{
              fontSize: theme.fontSize.sm,
              color: theme.colors.brand[700],
              fontWeight: theme.fontWeight.medium,
            }}
          >
            Imprimante sélectionnée : {selectedPrinter.name}
          </Text>
        </View>
      )}

      {/* Liste des imprimantes */}
      {isLoading && printers.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.brand[600]} />
          <Text
            style={{
              fontSize: theme.fontSize.base,
              color: theme.colors.text.secondary,
              marginTop: theme.spacing.md,
            }}
          >
            Chargement des imprimantes...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPrinters}
          renderItem={renderPrinterItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ 
            padding: theme.spacing.lg,
            paddingTop: 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={loadPrinters}
              colors={[theme.colors.brand[600]]}
              tintColor={theme.colors.brand[600]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons
                name="print-outline"
                size={48}
                color={theme.colors.neutral[400]}
              />
              <Text
                style={{
                  fontSize: theme.fontSize.base,
                  color: theme.colors.text.secondary,
                  marginTop: theme.spacing.md,
                  textAlign: 'center',
                }}
              >
                {searchQuery.trim() 
                  ? 'Aucune imprimante trouvée'
                  : 'Aucune imprimante disponible'
                }
              </Text>
              {!searchQuery.trim() && (
                <TouchableOpacity
                  style={[
                    styles.retryButton,
                    {
                      backgroundColor: theme.colors.brand[600],
                      borderRadius: theme.radius.lg,
                      paddingVertical: theme.spacing.sm,
                      paddingHorizontal: theme.spacing.lg,
                      marginTop: theme.spacing.md,
                    },
                  ]}
                  onPress={loadPrinters}
                >
                  <Text
                    style={{
                      fontSize: theme.fontSize.sm,
                      color: '#FFFFFF',
                      fontWeight: theme.fontWeight.medium,
                    }}
                  >
                    Réessayer
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingVertical: 12,
  },
  selectedInfo: {
    // Styles dynamiques appliqués inline
  },
  printerItem: {
    padding: 16,
  },
  printerContent: {
    flex: 1,
  },
  printerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  printerIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  printerInfo: {
    flex: 1,
  },
  selectedBadge: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  printerFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginLeft: 40,
  },
  statusBadge: {
    // Styles dynamiques appliqués inline
  },
  capabilities: {
    flexDirection: 'row',
    gap: 6,
  },
  capabilityBadge: {
    // Styles dynamiques appliqués inline
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  retryButton: {
    // Styles dynamiques appliqués inline
  },
});