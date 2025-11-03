/**
 * Composant de debug pour tester l'état des imprimantes
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useAppSelector, useAppDispatch } from '../../store/hooks';
import { loadSelectedPrinterThunk, fetchPrintersThunk } from '../../store/printers.slice';
import { debugPrinterStorage, clearPrinterStorage } from '../../utils/printerDebug';

export const PrinterDebugComponent: React.FC = () => {
  const dispatch = useAppDispatch();
  const printersState = useAppSelector(state => state.printers);

  useEffect(() => {
    // Charger automatiquement l'imprimante au démarrage
    dispatch(loadSelectedPrinterThunk());
  }, [dispatch]);

  const handleTestStorage = async () => {
    const result = await debugPrinterStorage();
    Alert.alert(
      'Test AsyncStorage', 
      result 
        ? `Imprimante trouvée: ${result.name}` 
        : 'Aucune imprimante dans le stockage'
    );
  };

  const handleLoadPrinters = async () => {
    try {
      await dispatch(fetchPrintersThunk()).unwrap();
      Alert.alert('Succès', 'Imprimantes chargées depuis PrintNode');
    } catch (error: any) {
      Alert.alert('Erreur', `Impossible de charger les imprimantes: ${error.message}`);
    }
  };

  const handleClearStorage = async () => {
    await clearPrinterStorage();
    Alert.alert('Succès', 'Stockage des imprimantes effacé');
  };

  return (
    <View style={{ padding: 20, backgroundColor: '#f0f0f0', margin: 10, borderRadius: 8 }}>
      <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 10 }}>
        🔧 Debug Imprimantes
      </Text>
      
      <Text style={{ marginBottom: 5 }}>
        État: {printersState.isLoading ? 'Chargement...' : 'Prêt'}
      </Text>
      
      <Text style={{ marginBottom: 5 }}>
        Imprimante sélectionnée: {printersState.selectedPrinter?.name || 'Aucune'}
      </Text>
      
      <Text style={{ marginBottom: 5 }}>
        Imprimantes disponibles: {printersState.printers.length}
      </Text>
      
      {printersState.error && (
        <Text style={{ color: 'red', marginBottom: 5 }}>
          Erreur: {printersState.error}
        </Text>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 }}>
        <TouchableOpacity 
          onPress={handleTestStorage}
          style={{ backgroundColor: '#007AFF', padding: 8, margin: 2, borderRadius: 4 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Test Storage</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleLoadPrinters}
          style={{ backgroundColor: '#34C759', padding: 8, margin: 2, borderRadius: 4 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Charger PrintNode</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={handleClearStorage}
          style={{ backgroundColor: '#FF3B30', padding: 8, margin: 2, borderRadius: 4 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Effacer Storage</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default PrinterDebugComponent;