/**
 * Constantes et helpers pour les préférences d'impression
 */

export const PRINT_ON_SCAN_KEY = '@print_settings:print_on_scan';

/**
 * Récupère la préférence "Imprimer au scan" depuis AsyncStorage
 */
export const getPrintOnScanPreference = async (): Promise<boolean> => {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  try {
    const value = await AsyncStorage.getItem(PRINT_ON_SCAN_KEY);
    return value === 'true';
  } catch (error) {
    console.error('[PrintPreferences] Error loading print on scan preference:', error);
    return false;
  }
};

/**
 * Définit la préférence "Imprimer au scan" dans AsyncStorage
 */
export const setPrintOnScanPreference = async (enabled: boolean): Promise<void> => {
  const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
  try {
    await AsyncStorage.setItem(PRINT_ON_SCAN_KEY, enabled.toString());
    console.log('[PrintPreferences] Print on scan preference saved:', enabled);
  } catch (error) {
    console.error('[PrintPreferences] Error saving print on scan preference:', error);
  }
};
