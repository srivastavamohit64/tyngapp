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

export type BookingStatus = 'pending' | 'confirmed' | 'full' | 'cancelled' | 'completed' | 'expired';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface BookingVenue {
  id: string;
  name?: string | null;
  location?: string | null;
  address?: string | null;
  coordinates?: {
    lat: number | null;
    lng: number | null;
  } | null;
}

export interface BookingParticipant {
  id: string;
  role: string;
  status: string;
  joinedAt?: string | null;
  user: AuthUser;
}

export interface BookingSlot {
  id: string;
  venueId: string;
  courtName?: string | null;
  date?: string | null;
  startTime: string;
  endTime: string;
  bookingId: string;
  status: string;
  bookedBy: string;
}

export interface BookingCalendarEvent {
  id: string;
  bookingId: string;
  venueId: string;
  hostUserId: string;
  date?: string | null;
  startTime: string;
  endTime: string;
  title: string;
  status: string;
  meta?: Record<string, unknown>;
}

export interface BookingRecord {
  id: string;
  gameId: string;
  venueId: string;
  hostUserId: string;
  sport: string;
  skillLevel?: string | null;
  bookingDate?: string | null;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  price: number;
  totalPlayers: number;
  currentPlayers: number;
  availableSlots: number;
  bookingStatus: BookingStatus;
  paymentStatus: PaymentStatus | string;
  canJoin: boolean;
  canLeave: boolean;
  canCancel: boolean;
  canAcceptInvite?: boolean;
  canRejectInvite?: boolean;
  isHost: boolean;
  isJoined: boolean;
  isInvited?: boolean;
  host: AuthUser;
  venue: BookingVenue;
  players: BookingParticipant[];
  acceptedPlayers?: BookingParticipant[];
  invitedPlayers?: BookingParticipant[];
  pendingInvitations?: number;
  slot?: BookingSlot | null;
  calendarEvent?: BookingCalendarEvent | null;
  createdAt?: string | null;
  updatedAt?: string | null;
  rules?: string[];
}

export interface MyBookingsResponse {
  upcoming: BookingRecord[];
  invited: BookingRecord[];
  past: BookingRecord[];
  cancelled: BookingRecord[];
  completed: BookingRecord[];
  counts: {
    upcoming: number;
    invited: number;
    past: number;
    cancelled: number;
    completed: number;
  };
}

export interface DiscoverPlayer {
  id: string;
  profileImage?: string | null;
  name: string;
  age?: number | null;
  gender?: string | null;
  sports: string[];
  skillLevel?: string | null;
  preferredPosition?: string | null;
  distance?: number | null;
  city?: string | null;
  rating?: number | null;
  gamesPlayed?: number | null;
  bio?: string | null;
  availability?: string[];
  preferredTime?: string | null;
  preferredSports?: string[];
  mutualFriends?: number;
  lastSeen?: string | null;
}

export interface DiscoverResponse {
  items: DiscoverPlayer[];
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

export interface FriendItem {
  id: string;
  profileImage?: string | null;
  name: string;
  sports: string[];
  skill?: string | null;
  city?: string | null;
  status?: string;
  online?: boolean;
  lastSeen?: string | null;
  bio?: string | null;
}
