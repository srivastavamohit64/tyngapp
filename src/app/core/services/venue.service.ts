import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, AuthUser } from '../models/api.model';
import { ApiService } from './api.service';

export interface VenueCourtCard {
  id: string;
  courtName: string;
  venueName: string;
  venueId: string;
  sport: string;
  image?: string | null;
  distance?: number | null;
  rating: number;
  ratingCount: number;
  pricePerHour: number;
  openTime: string;
  closeTime: string;
  amenities: string[];
  hasRentalGear: boolean;
  gamesPlayed: number;
  isIndoor: boolean;
  isOpenNow: boolean;
  status?: string;
  city?: string | null;
  address?: string | null;
}

export interface VenueCompletion {
  percent: number;
  ready: boolean;
  checklist: { id: string; label: string; done: boolean }[];
  missing: string[];
}

export interface VenueDashboardData {
  pulse: {
    todayBookings: number;
    todayRevenue: number;
    occupancyRate: number;
    pendingRequests: number;
    revenueGoalPct: number;
  };
  bookingPolicy?: {
    autoConfirm?: boolean;
    approvalTimeoutMinutes?: number;
    rejectionCount?: number;
    rejectionLimit?: number;
    isBookingBlocked?: boolean;
    bookingBlockedAt?: string | null;
    blockMessage?: string | null;
  };
  menu?: {
    profileName?: string;
    profilePercent?: number;
    courtsCount?: number;
    monthEarnings?: number;
    todayBookings?: number;
    upcomingBookings?: number;
    pendingBookings?: number;
    unreadChat?: number;
  };
  completion: VenueCompletion;
  todayBookings: {
    id: string;
    name: string;
    photo?: string | null;
    sport: string;
    court: string;
    time: string;
    amount: string;
    status: string;
    type: string;
  }[];
  courts: { id: string; name: string; slots: boolean[] }[];
  coachSessions: {
    id: string;
    name: string;
    photo?: string | null;
    sport: string;
    time: string;
    students: number;
    court: string;
  }[];
  activities: { emoji: string; bg: string; text: string; time: string }[];
  pendingActions: { label: string; sub: string; urgency: string; bookingId?: string; approvalDeadlineAt?: string | null }[];
  aiTips: { emoji: string; text: string }[];
}

export interface VenueEarningsData {
  period: 'today' | 'week' | 'month' | 'year';
  periodLabel: string;
  summary: {
    gross: number;
    net: number;
    changePct: number;
    today: number;
    week: number;
    month: number;
    year: number;
    walletBalance: number;
  };
  breakdown: {
    gross: number;
    platformFee: number;
    gstOnFee: number;
    discounts: number;
    refunds: number;
    net: number;
  };
  analytics: {
    todayBookings: number;
    weekBookings: number;
    monthBookings: number;
    yearBookings: number;
  };
  facilities: {
    id: string;
    name: string;
    emoji: string;
    revenue: number;
    bookings: number;
    occupancy: number;
    color: string;
  }[];
  trends: {
    revenue: number[];
    bookings: number[];
    labels: string[];
  };
  payouts: {
    id: string;
    month: string;
    period: string;
    gross: number;
    fee: number;
    gst: number;
    net: number;
    status: string;
    date: string;
  }[];
  transactions: {
    id: string;
    bookingId?: string;
    facility: string;
    name: string;
    date: string;
    amount: number;
    fee: number;
    gst: number;
    net: number;
    status: string;
  }[];
  aiTips: { emoji: string; text: string }[];
  updatedAt?: string;
}

export interface VenueProfileUpdatePayload {
  name?: string;
  displayName?: string;
  venueName?: string;
  businessName?: string;
  ownerName?: string;
  phone?: string;
  email?: string | null;
  location?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  address?: string | null;
  landmark?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  operatingDays?: string[];
  amenities?: string[];
  gallery?: string[];
  rentalEquipment?: unknown[];
  verificationDocuments?: Record<string, {
    id?: string;
    name?: string;
    url?: string;
    mime?: string;
    uploadedAt?: string;
  }>;
  ownershipType?: string | null;
  gstNumber?: string | null;
  panNumber?: string | null;
  yearEstablished?: number | null;
  autoConfirm?: boolean;
  description?: string | null;
  sports?: string[];
  venueType?: string | null;
  courts?: Array<{
    id?: number | string;
    name: string;
    sport: string;
    isIndoor?: boolean;
    pricePerHour?: number;
    peakPrice?: number | null;
    weekendPrice?: number | null;
    hasRentalGear?: boolean;
    imageUrl?: string | null;
    image?: string | null;
    status?: string;
    surface?: string | null;
    maxPlayers?: number | null;
    sortOrder?: number;
    meta?: Record<string, unknown> | null;
  }>;
}

export interface SportsEquipmentItem {
  id: string;
  name: string;
  label: string;
  emoji: string;
  defaultPricePerHour: number;
  sortOrder?: number;
}

@Injectable({ providedIn: 'root' })
export class VenueService {
  private readonly api = inject(ApiService);

  getCourts(params?: { city?: string; sport?: string; q?: string }): Observable<ApiResponse<VenueCourtCard[]>> {
    const query = new URLSearchParams({ mode: 'courts' });
    if (params?.city) query.set('city', params.city);
    if (params?.sport && params.sport !== 'all') query.set('sport', params.sport);
    if (params?.q) query.set('q', params.q);
    return this.api.get<VenueCourtCard[]>(`/venues?${query.toString()}`);
  }

  getVenue(id: string | number): Observable<ApiResponse<Record<string, unknown>>> {
    return this.api.get(`/venues/${id}`);
  }

  getDashboard(): Observable<ApiResponse<VenueDashboardData>> {
    return this.api.get<VenueDashboardData>('/venue/dashboard');
  }

  getEarnings(period: 'today' | 'week' | 'month' | 'year' = 'month'): Observable<ApiResponse<VenueEarningsData>> {
    return this.api.get<VenueEarningsData>(`/venue/earnings?period=${period}`);
  }

  getMyProfile(): Observable<ApiResponse<Record<string, unknown>>> {
    return this.api.get('/venue/profile');
  }

  getEquipmentCatalog(): Observable<ApiResponse<SportsEquipmentItem[]>> {
    return this.api.get<SportsEquipmentItem[]>('/equipment');
  }

  updateMyProfile(payload: VenueProfileUpdatePayload): Observable<ApiResponse<{ venue: Record<string, unknown>; completion: VenueCompletion }>> {
    return this.api.put('/venue/profile', payload);
  }

  uploadGallery(files: File[]): Observable<ApiResponse<{
    uploaded: string[];
    gallery: string[];
    profileImage?: string | null;
    user?: AuthUser;
  }>> {
    const form = new FormData();
    files.forEach((file, index) => {
      form.append('photos[]', file, file.name || `venue-${Date.now()}-${index}.jpg`);
    });
    return this.api.postForm('/venue/gallery', form);
  }

  uploadDocument(docId: string, file: File): Observable<ApiResponse<{
    document: { id: string; name: string; url: string; mime?: string; uploadedAt?: string };
    verificationDocuments: Record<string, { id: string; name: string; url: string; mime?: string; uploadedAt?: string }>;
  }>> {
    const form = new FormData();
    form.append('docId', docId);
    form.append('document', file);
    return this.api.postForm('/venue/documents', form);
  }

  createCourt(payload: VenueProfileUpdatePayload['courts'] extends (infer C)[] | undefined ? C : never): Observable<ApiResponse<VenueCourtCard>> {
    return this.api.post<VenueCourtCard>('/venue/courts', payload);
  }

  updateCourt(id: number | string, payload: Partial<NonNullable<VenueProfileUpdatePayload['courts']>[number]>): Observable<ApiResponse<VenueCourtCard>> {
    return this.api.put<VenueCourtCard>(`/venue/courts/${id}`, payload);
  }
}
