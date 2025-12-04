export enum UserRole {
  VOTER = 'VOTER',
  ORGANIZER = 'ORGANIZER',
}

export type AuthState = 'SELECTION' | 'LOGIN' | 'DASHBOARD';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  name: string;
}