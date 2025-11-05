/**
 * Service API PrintNode
 */

import printNodeApi from '../../config/printNodeApi';
import { handleApiError } from '../../utils/api/handleApiError';

export interface Printer {
  id: number;
  computer: {
    id: number;
    name: string;
  };
  name: string;
  description: string;
  capabilities: {
    bins: string[];
    collate: boolean;
    copies: number;
    color: boolean;
    dpis: string[];
    extent: number[][];
    medias: string[];
    nup: number[];
    papers: Record<string, number[]>;
    printrate: {
      rate: number;
      unit: string;
    };
    supports_custom_paper_size: boolean;
  };
  default: boolean;
  createTimestamp: string;
  state: string;
}

export interface PrintJob {
  printerId: number;
  title: string;
  contentType: string;
  content: string; // Base64 encoded content
  source: string;
  options?: {
    copies?: number;
    collate?: boolean;
    fitToPage?: boolean;
    paper?: string;
    dpi?: string;
    rotate?: number;
    pages?: string; // e.g., "1" pour la première page, "1-3" pour pages 1 à 3
  };
}

export interface PrintJobResponse {
  id: number;
  printer: {
    id: number;
    name: string;
  };
  title: string;
  state: string;
  createTimestamp: string;
}

// Get all printers
export const getNodePrinters = async (): Promise<Printer[]> => {
  try {
    const response = await printNodeApi.get<Printer[]>('/printers');
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch printers');
  }
};

// Get a specific printer
export const getNodePrinter = async (printerId: number): Promise<Printer> => {
  try {
    const response = await printNodeApi.get<Printer>(`/printers/${printerId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch printer');
  }
};

// Send print job
export const sendPrintJob = async (printJob: PrintJob): Promise<PrintJobResponse> => {
  try {
    const response = await printNodeApi.post<PrintJobResponse>('/printjobs', printJob);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to send print job');
  }
};

// Get print jobs
export const getPrintJobs = async (): Promise<PrintJobResponse[]> => {
  try {
    const response = await printNodeApi.get<PrintJobResponse[]>('/printjobs');
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch print jobs');
  }
};

// Get a specific print job
export const getPrintJob = async (printJobId: number): Promise<PrintJobResponse> => {
  try {
    const response = await printNodeApi.get<PrintJobResponse>(`/printjobs/${printJobId}`);
    return response.data;
  } catch (error) {
    throw handleApiError(error, 'Failed to fetch print job');
  }
};
