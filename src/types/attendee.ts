/**
 * Types pour les participants et registrations
 */

export interface Attendee {
  id: string;
  org_id: string;
  default_type_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  company: string | null;
  job_title: string | null;
  country: string | null;
  metadata: any;
  labels: string[];
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Registration {
  id: string;
  org_id: string;
  event_id: string;
  attendee_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'checked-in';
  attendance_type: 'onsite' | 'online';
  answers: {
    email: string;
    company?: string;
    jobTitle?: string;
    lastName: string;
    firstName: string;
    [key: string]: any;
  };
  event_attendee_type_id: string | null;
  badge_template_id: string | null;
  invited_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  updated_at: string;
  badge_pdf_url: string | null;
  badge_image_url: string | null;
  checked_in_at: string | null;
  checked_in_by: string | null;
  checkin_location: any | null;
  comment: string | null;
  attendee: Attendee;
  eventAttendeeType: any;
}

export interface RegistrationsResponse {
  data: Registration[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateAttendeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  category?: string;
  eventId: string;
}

export interface UpdateAttendeeDto extends Partial<CreateAttendeeDto> {
  status?: 'pending' | 'approved' | 'rejected' | 'checked-in';
}
