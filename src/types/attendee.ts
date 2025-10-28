/**
 * Types pour les participants
 */

export interface Attendee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  category?: string;
  status: 'registered' | 'checked-in' | 'cancelled';
  checkedInAt?: string;
  eventId: string;
  createdAt: string;
  updatedAt: string;
  qrCode?: string;
  badgePrinted?: boolean;
  printedAt?: string;
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
  status?: 'registered' | 'checked-in' | 'cancelled';
}
