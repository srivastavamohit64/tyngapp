import { UserRole } from '../../shared/models/app.models';

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T | null;
  errors: Record<string, string[]> | null;
}

export interface AuthUser {
  id: string;
  name: string;
  username?: string;
  email?: string | null;
  phone?: string | null;
  role: UserRole;
  isOnboarded: boolean;
  profileImage?: string | null;
  gender?: string | null;
  location?: string | null;
  level?: number;
  tpPoints?: number;
  currentXp?: number;
  nextLevelXp?: number;
  xpProgressPct?: number;
  xpToNextLevel?: number;
  percentileRank?: string | null;
  profileCompletion?: number;
  sportsLabel?: string;
  sports?: string[];
  experience?: string | null;
  focus?: string | null;
  availability?: string[];
  formats?: string[];
  personality?: string | null;
  venueType?: string | null;
}

export interface AuthTokenResponse {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  phone: string;
  email?: string;
  password: string;
  role: UserRole;
}

export interface LoginPayload {
  phone: string;
  password: string;
}

export interface UpdateProfilePayload {
  name?: string;
  email?: string | null;
  phone?: string;
  gender?: string | null;
  isOnboarded?: boolean;
  sports?: string[];
  experience?: string | null;
  focus?: string | null;
  availability?: string[];
  formats?: string[];
  personality?: string | null;
  venueType?: string | null;
  username?: string;
  location?: string | null;
}

export interface ChangePasswordPayload {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ForgotPasswordPayload {
  phone: string;
}

export interface ResetPasswordPayload {
  phone: string;
  otp: string;
  password: string;
  password_confirmation: string;
}
