/**
 * Slice Redux pour le suivi du statut d'impression en temps réel.
 * 
 * Remplace les toasts par un indicateur persistant qui transite
 * entre les états : SENDING → PRINTING → COMPLETED / FAILED
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from './index';

export type PrintJobStatusType = 'SENDING' | 'PENDING' | 'PRINTING' | 'COMPLETED' | 'FAILED' | 'CLIENT_OFFLINE';

export interface PrintStatusJob {
  id?: string;
  status: PrintJobStatusType;
  attendeeName: string;
  printerName?: string;
  error?: string;
  timestamp: number;
}

interface PrintStatusState {
  currentJob: PrintStatusJob | null;
}

const initialState: PrintStatusState = {
  currentJob: null,
};

const printStatusSlice = createSlice({
  name: 'printStatus',
  initialState,
  reducers: {
    setPrintStatus(state, action: PayloadAction<Omit<PrintStatusJob, 'timestamp'>>) {
      state.currentJob = {
        ...action.payload,
        timestamp: Date.now(),
      };
    },
    updatePrintStatus(state, action: PayloadAction<{ status: PrintJobStatusType; printerName?: string; error?: string }>) {
      if (state.currentJob) {
        state.currentJob.status = action.payload.status;
        if (action.payload.printerName) {
          state.currentJob.printerName = action.payload.printerName;
        }
        if (action.payload.error) {
          state.currentJob.error = action.payload.error;
        }
        state.currentJob.timestamp = Date.now();
      }
    },
    clearPrintStatus(state) {
      state.currentJob = null;
    },
  },
});

export const { setPrintStatus, updatePrintStatus, clearPrintStatus } = printStatusSlice.actions;

export const selectPrintStatus = (state: RootState) => state.printStatus.currentJob;

export default printStatusSlice.reducer;
