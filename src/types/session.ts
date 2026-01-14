export interface Session {
  id: string;
  org_id: string;
  event_id: string;
  name: string;
  description?: string;
  start_at: string;
  end_at: string;
  location?: string;
  capacity?: number;
  allowedAttendeeTypes: string[]; // List of event_attendee_type_ids
  created_at: string;
  updated_at: string;
  _count?: {
    scans: number;
  };
}

export interface SessionScanMetadata {
  registrationId: string;
  scanType: 'IN' | 'OUT';
}
