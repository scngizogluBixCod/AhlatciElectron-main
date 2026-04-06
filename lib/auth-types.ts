/**
 * Auth ile ilgili API tipleri (Swagger uyumlu, admin ile aynı).
 */

export interface RoleDto {
  id: string;
  name: string;
  description?: string;
}

export interface UserResponseDto {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: RoleDto;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
}

export interface AuthResponseDto {
  user: UserResponseDto;
  canAccessAdminPanel: boolean;
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthOtpPendingDto {
  canAccessAdminPanel: boolean;
  requiresOtp: boolean;
  tempToken: string;
  sentTo?: string;
  expiresAt?: string;
  message?: string;
}
