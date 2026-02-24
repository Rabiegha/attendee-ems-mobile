/**
 * Slice Redux pour la gestion des imprimantes EMS Client
 * 
 * Gère les imprimantes exposées par le client Electron via le backend.
 * Séparé du printers.slice qui gère les imprimantes PrintNode.
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getEmsPrinters, EmsPrinter, getEmsPrinterUniqueKey } from '../api/backend/emsPrinters.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_EMS_PRINTER_KEY = '@selectedEmsPrinter';

export interface EmsPrintersState {
  printers: EmsPrinter[];
  selectedPrinter: EmsPrinter | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: EmsPrintersState = {
  printers: [],
  selectedPrinter: null,
  isLoading: false,
  error: null,
};

// Thunk pour récupérer les imprimantes EMS depuis le backend
export const fetchEmsPrintersThunk = createAsyncThunk(
  'emsPrinters/fetchPrinters',
  async (_, { rejectWithValue }) => {
    try {
      const printers = await getEmsPrinters();
      return printers;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erreur lors du chargement des imprimantes EMS');
    }
  }
);

// Thunk pour charger l'imprimante EMS sélectionnée depuis AsyncStorage
export const loadSelectedEmsPrinterThunk = createAsyncThunk(
  'emsPrinters/loadSelectedPrinter',
  async (_, { rejectWithValue }) => {
    try {
      const saved = await AsyncStorage.getItem(SELECTED_EMS_PRINTER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (error) {
      return rejectWithValue('Erreur lors du chargement de l\'imprimante EMS sélectionnée');
    }
  }
);

// Thunk pour sélectionner une imprimante EMS
export const selectEmsPrinterThunk = createAsyncThunk(
  'emsPrinters/selectPrinter',
  async (printer: EmsPrinter, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem(SELECTED_EMS_PRINTER_KEY, JSON.stringify(printer));
      return printer;
    } catch (error) {
      return rejectWithValue('Erreur lors de la sauvegarde de l\'imprimante EMS');
    }
  }
);

// Thunk pour désélectionner l'imprimante EMS
export const clearSelectedEmsPrinterThunk = createAsyncThunk(
  'emsPrinters/clearSelectedPrinter',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem(SELECTED_EMS_PRINTER_KEY);
      return null;
    } catch (error) {
      return rejectWithValue('Erreur lors de la désélection de l\'imprimante EMS');
    }
  }
);

const emsPrintersSlice = createSlice({
  name: 'emsPrinters',
  initialState,
  reducers: {
    clearEmsError: (state) => {
      state.error = null;
    },
    /**
     * Met à jour la liste des imprimantes (via WebSocket) et invalide
     * la sélection si l'imprimante choisie n'est plus dans la liste.
     */
    setPrintersAndValidateSelection: (state, action: PayloadAction<EmsPrinter[]>) => {
      state.printers = action.payload;
      if (state.selectedPrinter) {
        const selectedKey = getEmsPrinterUniqueKey(state.selectedPrinter);
        const stillExists = action.payload.some(p => getEmsPrinterUniqueKey(p) === selectedKey);
        if (!stillExists) {
          console.log(`[emsPrinters] Selected printer "${selectedKey}" no longer exposed — clearing selection`);
          state.selectedPrinter = null;
          AsyncStorage.removeItem(SELECTED_EMS_PRINTER_KEY).catch(() => {});
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch EMS printers
      .addCase(fetchEmsPrintersThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmsPrintersThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.printers = action.payload;
        state.error = null;
        // Invalider la sélection si l'imprimante n'est plus exposée
        if (state.selectedPrinter) {
          const selectedKey = getEmsPrinterUniqueKey(state.selectedPrinter);
          const stillExists = action.payload.some(p => getEmsPrinterUniqueKey(p) === selectedKey);
          if (!stillExists) {
            console.log(`[emsPrinters] Selected printer "${selectedKey}" no longer in list — clearing`);
            state.selectedPrinter = null;
            AsyncStorage.removeItem(SELECTED_EMS_PRINTER_KEY).catch(() => {});
          }
        }
      })
      .addCase(fetchEmsPrintersThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load selected EMS printer
      .addCase(loadSelectedEmsPrinterThunk.fulfilled, (state, action) => {
        state.selectedPrinter = action.payload;
      })
      // Select EMS printer
      .addCase(selectEmsPrinterThunk.fulfilled, (state, action) => {
        state.selectedPrinter = action.payload;
      })
      .addCase(selectEmsPrinterThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Clear selected EMS printer
      .addCase(clearSelectedEmsPrinterThunk.fulfilled, (state) => {
        state.selectedPrinter = null;
      })
      .addCase(clearSelectedEmsPrinterThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { clearEmsError, setPrintersAndValidateSelection } = emsPrintersSlice.actions;
export default emsPrintersSlice.reducer;
