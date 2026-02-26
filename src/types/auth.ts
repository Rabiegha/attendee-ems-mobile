/**
 * Types pour l'authentification
 */

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Shape brute retournée par le backend (snake_case)
 */
export interface BackendUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  roles: string[];
  org_id: string | null;
  isPlatform: boolean;
  isRoot: boolean;
}

/**
 * Shape brute de la réponse login backend
 */
export interface BackendLoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: BackendUser;
  organization: Organization | null;
  mode: 'tenant' | 'platform';
  requiresOrgSelection: boolean;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: User;
  organization: Organization;
}

export interface RefreshTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}
