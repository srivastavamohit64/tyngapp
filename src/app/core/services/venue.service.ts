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
  openTime?: string;
  closeTime?: string;
  slotIntervalMinutes?: 15 | 30;
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

export interface VenueCoachingSession {
  id: number;
  source: 'scheduling';
  title: string;
  sport: string;
  coach?: { id?: number | null; name?: string | null; photo?: string | null } | null;
  venue?: string | null;
  venue_location?: string | null;
  court?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  status: 'pending_venue_approval' | 'confirmed' | 'completed' | 'cancelled' | 'expired' | string;
  capacity: number;
  price: number;
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
  courts: { id: string; name: string; status?: string; slots: boolean[] }[];
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
  slotIntervalMinutes?: 15 | 30;
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

  getCoachScheduleSessions(): Observable<ApiResponse<VenueCoachingSession[]>> {
    return this.api.get<VenueCoachingSession[]>('/venue/coach-schedule-sessions');
  }

  approveCoachScheduleSession(id: number | string): Observable<ApiResponse<VenueCoachingSession>> {
    return this.api.post<VenueCoachingSession>(`/venue/coach-schedule-sessions/${encodeURIComponent(id)}/approve`, {});
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

  uploadGallery(files: File[], opts?: { asCover?: boolean; courtId?: string | number }): Observable<ApiResponse<{
    uploaded: string[];
    gallery: string[];
    courtImage?: string | null;
    profileImage?: string | null;
    user?: AuthUser;
  }>> {
    const form = new FormData();
    files.forEach((file, index) => {
      form.append('photos[]', file, file.name || `venue-${Date.now()}-${index}.jpg`);
    });
    if (opts?.asCover) form.append('asCover', '1');
    if (opts?.courtId) form.append('courtId', String(opts.courtId));
    return this.api.postForm('/venue/gallery', form);
  }

  uploadDocument(docId: string, file: File): Observable<ApiResponse<{
    document: { id: string; name: string; url: string; mime?: string; uploadedAt?: string };
    verificationDocuments: Record<string, { id: string; name: string; url: string; mime?: string; uploadedAt?: string }>;
    editableDocuments?: string[];
  }>> {
    const form = new FormData();
    form.append('docId', docId);
    form.append('document', file);
    return this.api.postForm('/venue/documents', form);
  }

  submitForApproval(): Observable<ApiResponse<{
    accountStatus: string;
    submittedForApprovalAt?: string | null;
    user?: AuthUser;
  }>> {
    return this.api.post('/venue/submit-for-approval', {});
  }

  submitDocuments(): Observable<ApiResponse<{
    documentsStatus: string;
    documentsSubmittedAt?: string | null;
    user?: AuthUser;
  }>> {
    return this.api.post('/venue/submit-documents', {});
  }

  getDocumentEditRequests(): Observable<ApiResponse<{
    requests: Array<{
      id: number;
      docId: string;
      docLabel?: string;
      status: string;
      reason?: string | null;
      adminNote?: string | null;
      createdAt?: string;
      reviewedAt?: string | null;
    }>;
    editableDocuments: string[];
    requiredDocuments: Array<{ id: string; label: string; required: boolean }>;
  }>> {
    return this.api.get('/venue/document-edit-requests');
  }

  requestDocumentEdit(
    docIdOrIds: string | string[],
    reason?: string,
  ): Observable<ApiResponse<{
    request: {
      id: number;
      docId: string;
      docLabel?: string;
      status: string;
      reason?: string | null;
      createdAt?: string;
    };
    requests?: Array<{
      id: number;
      docId: string;
      docLabel?: string;
      status: string;
      reason?: string | null;
      createdAt?: string;
    }>;
    skipped?: Array<{ docId: string; message: string }>;
  }>> {
    const ids = (Array.isArray(docIdOrIds) ? docIdOrIds : [docIdOrIds])
      .map((id) => String(id || '').trim())
      .filter(Boolean);
    const payload: Record<string, unknown> = {
      reason: reason || null,
    };
    if (ids.length === 1) {
      payload['docId'] = ids[0];
    } else {
      payload['docIds'] = ids;
    }
    return this.api.post('/venue/document-edit-requests', payload);
  }

  createCourt(payload: VenueProfileUpdatePayload['courts'] extends (infer C)[] | undefined ? C : never): Observable<ApiResponse<VenueCourtCard>> {
    return this.api.post<VenueCourtCard>('/venue/courts', payload);
  }

  updateCourt(id: number | string, payload: Partial<NonNullable<VenueProfileUpdatePayload['courts']>[number]>): Observable<ApiResponse<VenueCourtCard>> {
    return this.api.put<VenueCourtCard>(`/venue/courts/${id}`, payload);
  }
}
