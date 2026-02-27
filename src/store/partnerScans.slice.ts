/**
 * Redux slice pour les Partner Scans
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { partnerScansService } from '../api/backend/partnerScans.service';
import {
  PartnerScan,
  PartnerScansMeta,
  CreatePartnerScanDTO,
  ListPartnerScansParams,
} from '../types/partnerScan';

// ────────────────────────────────────────────────────────────────────────────
// State
// ────────────────────────────────────────────────────────────────────────────

interface PartnerScansState {
  scans: PartnerScan[];
  currentScan: PartnerScan | null;
  meta: PartnerScansMeta;
  isLoading: boolean;
  isCreating: boolean;
  error: string | null;
}

const initialState: PartnerScansState = {
  scans: [],
  currentScan: null,
  meta: { total: 0, page: 1, limit: 20, totalPages: 0 },
  isLoading: false,
  isCreating: false,
  error: null,
};

// ────────────────────────────────────────────────────────────────────────────
// Thunks
// ────────────────────────────────────────────────────────────────────────────

export const fetchPartnerScansThunk = createAsyncThunk(
  'partnerScans/fetchAll',
  async (params: ListPartnerScansParams, { rejectWithValue }) => {
    try {
      return await partnerScansService.listScans(params);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Erreur de chargement',
      );
    }
  },
);

/**
 * Traduit les messages d'erreur backend (anglais) en français
 */
function translatePartnerScanError(msg: string): string {
  if (msg.includes('already scanned') || msg.includes('duplicate')) {
    return 'Contact déjà scanné';
  }
  if (msg.includes('not found') || msg.includes('introuvable')) {
    return 'Inscription introuvable';
  }
  if (msg.includes('not approved') || msg.includes('not active')) {
    return 'Inscription non approuvée';
  }
  if (msg.includes('do not have access') || msg.includes('Forbidden') || msg.includes('forbidden')) {
    return 'Accès non autorisé à cet événement';
  }
  if (msg.includes('not match')) {
    return 'QR Code d\'un autre événement';
  }
  return 'Erreur lors du scan';
}

export const createPartnerScanThunk = createAsyncThunk(
  'partnerScans/create',
  async (data: CreatePartnerScanDTO, { rejectWithValue }) => {
    try {
      return await partnerScansService.createScan(data);
    } catch (error: any) {
      const rawMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        error.message ||
        'Erreur de création';
      const translated = translatePartnerScanError(rawMsg);

      // Extraire le scanId existant du message backend pour les doublons
      const scanIdMatch = rawMsg.match(/scan id:\s*([a-f0-9-]+)/i);
      if (scanIdMatch) {
        return rejectWithValue({
          message: translated,
          existingScanId: scanIdMatch[1],
          isDuplicate: true,
        });
      }

      return rejectWithValue(translated);
    }
  },
);

export const updatePartnerScanCommentThunk = createAsyncThunk(
  'partnerScans/updateComment',
  async ({ id, comment }: { id: string; comment: string }, { rejectWithValue }) => {
    try {
      return await partnerScansService.updateComment(id, comment);
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Erreur de mise à jour',
      );
    }
  },
);

export const deletePartnerScanThunk = createAsyncThunk(
  'partnerScans/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await partnerScansService.deleteScan(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.detail || error.message || 'Erreur de suppression',
      );
    }
  },
);

// ────────────────────────────────────────────────────────────────────────────
// Slice
// ────────────────────────────────────────────────────────────────────────────

const partnerScansSlice = createSlice({
  name: 'partnerScans',
  initialState,
  reducers: {
    clearPartnerScans: (state) => {
      state.scans = [];
      state.meta = initialState.meta;
      state.error = null;
    },
    clearPartnerScansError: (state) => {
      state.error = null;
    },
    setCurrentScan: (state, action: PayloadAction<PartnerScan | null>) => {
      state.currentScan = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch all
    builder
      .addCase(fetchPartnerScansThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPartnerScansThunk.fulfilled, (state, action) => {
        state.isLoading = false;
        state.scans = action.payload.data;
        state.meta = action.payload.meta;
      })
      .addCase(fetchPartnerScansThunk.rejected, (state, action) => {
        // Ignorer les requêtes annulées (remplacées par une plus récente)
        if (action.meta.aborted) return;
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create
    builder
      .addCase(createPartnerScanThunk.pending, (state) => {
        state.isCreating = true;
        state.error = null;
      })
      .addCase(createPartnerScanThunk.fulfilled, (state, action) => {
        state.isCreating = false;
        state.scans.unshift(action.payload);
        state.meta.total += 1;
        state.currentScan = action.payload;
      })
      .addCase(createPartnerScanThunk.rejected, (state, action) => {
        state.isCreating = false;
        const payload = action.payload;
        state.error = typeof payload === 'string'
          ? payload
          : (payload as any)?.message || 'Erreur de création';
      });

    // Update comment
    builder.addCase(updatePartnerScanCommentThunk.fulfilled, (state, action) => {
      const idx = state.scans.findIndex((s) => s.id === action.payload.id);
      if (idx !== -1) {
        state.scans[idx] = action.payload;
      }
      if (state.currentScan?.id === action.payload.id) {
        state.currentScan = action.payload;
      }
    });

    // Delete
    builder.addCase(deletePartnerScanThunk.fulfilled, (state, action) => {
      state.scans = state.scans.filter((s) => s.id !== action.payload);
      state.meta.total = Math.max(0, state.meta.total - 1);
      if (state.currentScan?.id === action.payload) {
        state.currentScan = null;
      }
    });
  },
});

export const { clearPartnerScans, clearPartnerScansError, setCurrentScan } = partnerScansSlice.actions;
export default partnerScansSlice.reducer;
