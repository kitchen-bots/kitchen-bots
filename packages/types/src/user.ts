export type UserRole = 'admin' | 'operations' | 'editor' | 'customer';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  fullName?: string;
  phone?: string;
  company?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}
