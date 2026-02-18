/**
 * Print mode preference management
 * 
 * Two modes:
 * - 'ems-client': Uses the EMS Print Client (Electron app via print queue backend)
 *   → Default mode. Jobs go to backend print queue, Electron client picks them up.
 * - 'printnode': Uses PrintNode cloud service (legacy)
 *   → Backup mode. Jobs go directly to PrintNode API from mobile.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type PrintMode = 'ems-client' | 'printnode';

const PRINT_MODE_KEY = '@print_settings:print_mode';

/**
 * Get the current print mode (defaults to 'ems-client')
 */
export const getPrintMode = async (): Promise<PrintMode> => {
  try {
    const value = await AsyncStorage.getItem(PRINT_MODE_KEY);
    if (value === 'printnode' || value === 'ems-client') {
      return value;
    }
    return 'ems-client'; // Default
  } catch (error) {
    console.error('[PrintMode] Error loading print mode:', error);
    return 'ems-client';
  }
};

/**
 * Set the print mode
 */
export const setPrintMode = async (mode: PrintMode): Promise<void> => {
  try {
    await AsyncStorage.setItem(PRINT_MODE_KEY, mode);
    console.log('[PrintMode] Saved print mode:', mode);
  } catch (error) {
    console.error('[PrintMode] Error saving print mode:', error);
  }
};
