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
  rating?: number | null;
  gamesPlayed?: number | null;
  profileCompletion?: number;
  sportsLabel?: string;
  sports?: string[];
  experience?: string | null;
  focus?: string | null;
  availability?: string[];
  formats?: string[];
  personality?: string | null;
  venueType?: string | null;
  venueProfileReady?: boolean;
  createdAt?: string | null;
  updatedAt?: string | null;
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
  rating?: number | null;
  image?: string | null;
  coverImage?: string | null;
  coordinates?: {
    lat: number | null;
    lng: number | null;
  } | null;
}

export interface BookingParticipant {
  id: string;
  role: string;
  status: string;
  amountPaid?: number;
  paymentStatus?: string | null;
  rating?: number | null;
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

export interface BookingSessionAttendance {
  userId: string;
  name: string;
  status: 'awaiting' | 'checked_in' | 'late' | 'absent' | string;
  source?: string | null;
  checkedInAt?: string | null;
}

export interface BookingSessionEvent {
  id: string;
  type: string;
  text: string;
  icon?: string | null;
  at?: string | null;
}

export interface BookingSession {
  status: 'idle' | 'live' | 'ended' | string;
  startedAt?: string | null;
  endedAt?: string | null;
  checkinToken?: string | null;
  checkinTokenExpiresAt?: string | null;
  checkedIn: number;
  totalPlayers: number;
  attendance: BookingSessionAttendance[];
  timeline: BookingSessionEvent[];
}

export interface BookingRecord {
  id: string;
  gameId: string;
  venueId: string;
  hostUserId: string;
  sport: string;
  title?: string | null;
  reference?: string | null;
  skillLevel?: string | null;
  teamSize?: string | null;
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
  paymentMethod?: string | null;
  walletAmount?: number;
  hostAmount?: number;
  playerShareAmount?: number;
  costPerPlayer?: number;
  refundAmount?: number;
  refundStatus?: string | null;
  approvalDeadlineAt?: string | null;
  captainContinuedAt?: string | null;
  cancellationReason?: string | null;
  couponCode?: string | null;
  couponDiscount?: number;
  rentalDetails?: Array<{
    id?: string;
    name?: string;
    qty?: number;
    price?: number;
    status?: 'pending' | 'prepared' | 'delivered';
  }> | null;
  amenityChecklist?: Array<{
    key: string;
    name: string;
    qty: number;
    status: 'pending' | 'prepared' | 'delivered';
    source?: string;
  }>;
  specialRequests?: Array<{ icon?: string; text: string }>;
  disputes?: Array<{
    id: string;
    message: string;
    status: string;
    author?: string | null;
    createdAt?: string | null;
  }>;
  hostReliability?: {
    trusted: boolean;
    attendanceRate: number;
    attendanceDetail: string;
    cancellationRate: number;
    cancellationDetail: string;
    lateRate: number;
    lateDetail: string;
    totalBookings: number;
    totalDetail: string;
    reliabilityPct: number;
  } | null;
  session?: BookingSession | null;
  canJoin: boolean;
  canLeave: boolean;
  canCancel: boolean;
  canApprove?: boolean;
  canReject?: boolean;
  canAcceptInvite?: boolean;
  canRejectInvite?: boolean;
  isHost: boolean;
  isVenue?: boolean;
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
  viewerRating?: number | null;
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

export interface HomeAd {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl?: string | null;
  sortOrder: number;
}

export interface AppThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  card: string;
  text_primary: string;
  text_secondary: string;
  button: string;
  success: string;
  warning: string;
  error: string;
}

export interface AppThemePayload {
  id?: number;
  name?: string;
  updated_at?: string | null;
  colors: AppThemeColors;
  branding?: Record<string, unknown>;
  meta?: Record<string, unknown>;
}
