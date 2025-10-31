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
  stats?: EventStats;
}

export interface EventStats {
  totalRegistrations: number;
  checkedIn: number;
  approved: number;
  pending: number;
  cancelled: number;
  checkedInPercentage: number;
}
