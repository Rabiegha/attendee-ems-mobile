/**
 * Utilitaire pour tester et déboguer le système d'imprimantes
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export const debugPrinterStorage = async () => {
  try {
    console.log('[PrinterDebug] 🔍 Checking AsyncStorage for printer...');
    
    const savedPrinter = await AsyncStorage.getItem('@selectedPrinter');
    
    if (savedPrinter) {
      const printer = JSON.parse(savedPrinter);
      console.log('[PrinterDebug] ✅ Found saved printer:', {
        id: printer.id,
        name: printer.name,
        state: printer.state,
        computer: printer.computer?.name
      });
      return printer;
    } else {
      console.log('[PrinterDebug] ❌ No printer found in AsyncStorage');
      return null;
    }
  } catch (error) {
    console.error('[PrinterDebug] ❌ Error reading printer from storage:', error);
    return null;
  }
};

export const savePrinterForDebug = async (printer: any) => {
  try {
    await AsyncStorage.setItem('@selectedPrinter', JSON.stringify(printer));
    console.log('[PrinterDebug] ✅ Printer saved for debug:', printer.name);
  } catch (error) {
    console.error('[PrinterDebug] ❌ Error saving printer:', error);
  }
};

export const clearPrinterStorage = async () => {
  try {
    await AsyncStorage.removeItem('@selectedPrinter');
    console.log('[PrinterDebug] ✅ Printer storage cleared');
  } catch (error) {
    console.error('[PrinterDebug] ❌ Error clearing printer storage:', error);
  }
};