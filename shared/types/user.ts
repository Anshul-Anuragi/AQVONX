export interface User {
  id: string;
  email: string;
  fullName?: string | null;
  isActive: boolean;
  isBanned: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  user: User;
  token: string;
  expiresAt: string;
}

