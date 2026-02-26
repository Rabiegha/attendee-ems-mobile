/**
 * Types pour les Partner Scans
 */

export interface PartnerScanAttendeeData {
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
  job_title?: string;
  phone?: string;
  country?: string;
  registration_id?: string;
  registration_status?: string;
}

export interface PartnerScan {
  id: string;
  org_id: string;
  event_id: string;
  scanned_by: string;
  registration_id: string | null;
  attendee_data: PartnerScanAttendeeData;
  comment: string | null;
  scanned_at: string;
  updated_at: string;
  scanner?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  registration?: {
    id: string;
    status: string;
  };
}

export interface CreatePartnerScanDTO {
  event_id: string;
  registration_id?: string;
  comment?: string;
}

export interface UpdatePartnerScanDTO {
  comment: string;
}

export interface ListPartnerScansParams {
  event_id: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PartnerScansMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PartnerScansResponse {
  data: PartnerScan[];
  meta: PartnerScansMeta;
}
