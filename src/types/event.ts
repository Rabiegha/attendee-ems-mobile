/**
 * Types pour les événements
 */

export interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: 'upcoming' | 'ongoing' | 'past';
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  attendeesCount?: number;
  checkedInCount?: number;
}

export interface EventStats {
  totalAttendees: number;
  checkedIn: number;
  notCheckedIn: number;
  percentage: number;
}
