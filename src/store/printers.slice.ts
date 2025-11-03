/**
 * Slice Redux pour la gestion des imprimantes PrintNode
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getNodePrinters, Printer } from '../api/printNode/printers.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SELECTED_PRINTER_KEY = '@selectedPrinter';

export interface PrintersState {
  printers: Printer[];
  selectedPrinter: Printer | null;
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
}

const initialState: PrintersState = {
  printers: [],
  selectedPrinter: null,
  isLoading: false,
  error: null,
  searchQuery: '',
};

// Thunk pour récupérer les imprimantes
export const fetchPrintersThunk = createAsyncThunk(
  'printers/fetchPrinters',
  async (_, { rejectWithValue }) => {
    try {
      const printers = await getNodePrinters();
      return printers;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Erreur lors du chargement des imprimantes');
    }
  }
);

// Thunk pour charger l'imprimante sélectionnée depuis le stockage
export const loadSelectedPrinterThunk = createAsyncThunk(
  'printers/loadSelectedPrinter',
  async (_, { rejectWithValue }) => {
    try {
      const savedPrinter = await AsyncStorage.getItem(SELECTED_PRINTER_KEY);
      return savedPrinter ? JSON.parse(savedPrinter) : null;
    } catch (error) {
      return rejectWithValue('Erreur lors du chargement de l\'imprimante sélectionnée');
    }
  }
);

// Thunk pour sauvegarder l'imprimante sélectionnée
export const selectPrinterThunk = createAsyncThunk(
  'printers/selectPrinter',
  async (printer: Printer, { rejectWithValue }) => {
    try {
      await AsyncStorage.setItem(SELECTED_PRINTER_KEY, JSON.stringify(printer));
      return printer;
    } catch (error) {
      return rejectWithValue('Erreur lors de la sauvegarde de l\'imprimante');
    }
  }
);

// Thunk pour désélectionner l'imprimante
export const clearSelectedPrinterThunk = createAsyncThunk(
  'printers/clearSelectedPrinter',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem(SELECTED_PRINTER_KEY);
      return null;
    } catch (error) {
      return rejectWithValue('Erreur lors de la désélection de l\'imprimante');
    }
  }
);

const printersSlice = createSlice({
  name: 'printers',
  initialState,
  reducers: {
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch printers
      .addCase(fetchPrintersThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPrintersThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.printers = action.payload;
        state.error = null;
      })
      .addCase(fetchPrintersThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Load selected printer
      .addCase(loadSelectedPrinterThunk.fulfilled, (state, action) => {
        state.selectedPrinter = action.payload;
      })
      // Select printer
      .addCase(selectPrinterThunk.fulfilled, (state, action) => {
        state.selectedPrinter = action.payload;
      })
      .addCase(selectPrinterThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Clear selected printer
      .addCase(clearSelectedPrinterThunk.fulfilled, (state) => {
        state.selectedPrinter = null;
      })
      .addCase(clearSelectedPrinterThunk.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { setSearchQuery, clearError } = printersSlice.actions;
export default printersSlice.reducer;