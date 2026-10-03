import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, CoachDashboard, CoachDirectoryResponse, CoachInsightsPayload, CoachInsightsPeriod } from '../models/api.model';
import { ApiService } from './api.service';
import type { CoachEmployment } from './venue-coach.service';

@Injectable({ providedIn: 'root' })
export class CoachService {
  private readonly api = inject(ApiService);

  getDashboard(): Observable<ApiResponse<CoachDashboard>> {
    return this.api.get<CoachDashboard>('/coach/dashboard');
  }

  getInsights(date: string, period: CoachInsightsPeriod): Observable<ApiResponse<CoachInsightsPayload>> {
    const params = new URLSearchParams({ date, period });
    return this.api.get(`/coach/insights?${params.toString()}`);
  }

  getEarnings(period: CoachEarningsPeriod = 'month'): Observable<ApiResponse<CoachEarningsPayload>> {
    return this.api.get<CoachEarningsPayload>(`/coach/earnings?period=${encodeURIComponent(period)}`);
  }

  getVenueCollaborations(): Observable<ApiResponse<CoachVenueCollaboration[]>> {
    return this.api.get<CoachVenueCollaboration[]>('/coach/venue-collaborations');
  }

  getVenueCollaboration(venueId: number | string): Observable<ApiResponse<CoachVenueCollaborationDetail>> {
    return this.api.get<CoachVenueCollaborationDetail>(`/coach/venue-collaborations/${encodeURIComponent(String(venueId))}`);
  }

  getTeams(): Observable<ApiResponse<CoachTeam[]>> {
    return this.api.get<CoachTeam[]>('/coach/teams');
  }

  completeSchedulingSession(id: string): Observable<ApiResponse<{ id: string; status: string }>> {
    return this.api.patch(`/coach/scheduling/sessions/${encodeURIComponent(id)}/status`, { status: 'completed' });
  }

  getCoaches(search = '', sport = '', perPage = 20, sort = ''): Observable<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (sport && sport !== 'All') params.set('sport', sport);
    params.set('per_page', String(Math.max(1, Math.min(50, perPage))));
    if (sort) params.set('sort', sort);
    const query = params.toString();
    return this.api.get(`/coaches${query ? `?${query}` : ''}`);
  }

  listCoaches(query: Record<string, string | number | boolean | undefined>): Observable<ApiResponse<CoachDirectoryResponse>> {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) params.set(key, String(value));
    });
    const suffix = params.toString();
    return this.api.get<CoachDirectoryResponse>(`/coaches${suffix ? `?${suffix}` : ''}`);
  }

  getCoach(id: number): Observable<ApiResponse<any>> {
    return this.api.get(`/coaches/${id}`);
  }

  getMyCoachMedia(): Observable<ApiResponse<CoachGalleryItem[]>> {
    return this.api.get<CoachGalleryItem[]>('/coach/media');
  }

  uploadCoachMedia(category: CoachGalleryCategory, file: File): Observable<ApiResponse<CoachGalleryItem>> {
    const form = new FormData();
    form.append('category', category);
    form.append('file', file, file.name);
    return this.api.postForm<CoachGalleryItem>('/coach/media', form);
  }

  deleteCoachMedia(id: number): Observable<ApiResponse<unknown>> {
    return this.api.delete(`/coach/media/${encodeURIComponent(id)}`);
  }

  getMyCoachProfileDetails(): Observable<ApiResponse<CoachProfileDetails>> {
    return this.api.get<CoachProfileDetails>('/coach/profile-details');
  }

  saveMyCoachProfileDetails(details: CoachProfileDetailsPayload): Observable<ApiResponse<CoachProfileDetails>> {
    return this.api.put<CoachProfileDetails>('/coach/profile-details', details);
  }

  uploadCoachCover(file: File): Observable<ApiResponse<{ coverImage: string }>> {
    const form = new FormData();
    form.append('file', file, file.name);
    return this.api.postForm<{ coverImage: string }>('/coach/profile-cover', form);
  }

  deleteCoachCover(): Observable<ApiResponse<{ coverImage: null }>> {
    return this.api.delete<{ coverImage: null }>('/coach/profile-cover');
  }

  getMyCoachVerificationDocuments(): Observable<ApiResponse<CoachVerificationDocument[]>> {
    return this.api.get<CoachVerificationDocument[]>('/coach/verification-documents');
  }

  uploadCoachVerificationDocument(documentType: CoachVerificationDocumentType, file: File): Observable<ApiResponse<CoachVerificationDocument>> {
    const form = new FormData();
    form.append('document_type', documentType);
    form.append('file', file, file.name);
    return this.api.postForm<CoachVerificationDocument>('/coach/verification-documents', form);
  }

  getCoachVerificationDocumentBlob(id: number): Observable<Blob> {
    return this.api.getBlob(`/coach/verification-documents/${encodeURIComponent(id)}/download`);
  }

  deleteCoachVerificationDocument(id: number): Observable<ApiResponse<unknown>> {
    return this.api.delete(`/coach/verification-documents/${encodeURIComponent(id)}`);
  }

  requestToJoin(coachId: number, payload: { sport?: string; goal?: string; message?: string }): Observable<ApiResponse<unknown>> {
    return this.api.post(`/coaches/${coachId}/student-requests`, payload);
  }

  requestCoachingBooking(coachId: number, payload: {
    sport?: string;
    message: string;
    requested_date: string;
    requested_start_time: string;
    is_recurring: boolean;
    recurring_end_date?: string | null;
    session_offer?: string | null;
    duration_minutes?: number | null;
    quoted_price?: number | null;
  }): Observable<ApiResponse<any>> {
    return this.api.post(`/coaches/${coachId}/booking-requests`, payload);
  }

  submitCoachReview(
    coachId: number,
    payload: { rating: number; comment?: string } & Partial<Record<CoachReviewCategory, number | null>>,
  ): Observable<ApiResponse<any>> {
    return this.api.post(`/coaches/${coachId}/reviews`, payload);
  }

  saveCoach(coachId: number): Observable<ApiResponse<{ saved: boolean }>> {
    return this.api.post<{ saved: boolean }>(`/coaches/${coachId}/save`);
  }

  unsaveCoach(coachId: number): Observable<ApiResponse<{ saved: boolean }>> {
    return this.api.delete<{ saved: boolean }>(`/coaches/${coachId}/save`);
  }

  reportCoach(coachId: number, payload: { type: 'report' | 'safety'; reason: string; details?: string }): Observable<ApiResponse<unknown>> {
    return this.api.post(`/coaches/${coachId}/reports`, payload);
  }

  getMyCoachStudentRequests(): Observable<ApiResponse<any>> {
    return this.api.get('/player/coach-student-requests');
  }

  getStudentRequests(status = 'pending'): Observable<ApiResponse<any>> {
    return this.api.get(`/coach/student-requests?status=${encodeURIComponent(status)}`);
  }

  respondToStudentRequest(id: number, status: 'accepted' | 'declined'): Observable<ApiResponse<unknown>> {
    return this.api.patch(`/coach/student-requests/${id}`, { status });
  }

  getStudents(): Observable<ApiResponse<any>> {
    return this.api.get('/coach/students');
  }

  searchEnrollmentPlayers(query: string): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>(`/coach/enrollment/players?query=${encodeURIComponent(query.trim())}`);
  }

  enrollExistingStudent(studentId: number, notes?: string): Observable<ApiResponse<any>> {
    return this.api.post('/coach/students/enroll', { mode: 'existing', student_id: studentId, notes: notes?.trim() || null });
  }

  enrollManagedStudent(form: FormData): Observable<ApiResponse<any>> {
    if (!form.has('mode')) form.append('mode', 'managed');
    return this.api.postForm('/coach/students/enroll', form);
  }

  inviteStudent(payload: { name: string; phone: string; email?: string }): Observable<ApiResponse<any>> {
    return this.api.post('/coach/student-invitations', payload);
  }

  getStudentInvitations(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>('/coach/student-invitations');
  }

  resendStudentInvitation(id: number): Observable<ApiResponse<any>> {
    return this.api.post(`/coach/student-invitations/${id}/resend`, {});
  }

  cancelStudentInvitation(id: number): Observable<ApiResponse<any>> {
    return this.api.post(`/coach/student-invitations/${id}/cancel`, {});
  }

  getMyCoachInvitations(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>('/player/coach-invitations');
  }

  getCoachInvitation(token: string): Observable<ApiResponse<any>> {
    return this.api.get(`/player/coach-invitations/${encodeURIComponent(token)}`);
  }

  respondCoachInvitation(token: string, status: 'accepted' | 'declined'): Observable<ApiResponse<any>> {
    return this.api.post(`/player/coach-invitations/${encodeURIComponent(token)}/respond`, { status });
  }

  getStudent(id: number): Observable<ApiResponse<any>> {
    return this.api.get(`/coach/students/${id}`);
  }

  getStudentPreview(id: number): Observable<ApiResponse<any>> {
    return this.api.get(`/coach/students/${id}/preview`);
  }

  updateStudent(id: number, payload: { training_focus?: string[]; notes?: string; status?: string }): Observable<ApiResponse<any>> {
    return this.api.patch(`/coach/students/${id}`, payload);
  }

  getEvaluations(studentId?: number, page = 1): Observable<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (studentId) params.set('student_id', String(studentId));
    params.set('page', String(Math.max(1, page)));
    return this.api.get(`/coach/evaluations?${params.toString()}`);
  }

  saveStudentEvaluation(id: number, payload: { rating: number; skill_ratings: Record<string, number>; strengths?: string; areas_to_improve?: string; session_id?: number }): Observable<ApiResponse<any>> {
    return this.api.post(`/coach/students/${id}/evaluations`, payload);
  }

  addStudentNote(id: number, note: string): Observable<ApiResponse<any>> {
    return this.api.post(`/coach/students/${id}/notes`, { note });
  }

  getVenues(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>('/venues');
  }

  getSchedulingVenues(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>('/coach/scheduling/venues');
  }

  getVenueAvailability(venueId: number | string, courtId: number | string, date: string, durationMinutes = 60): Observable<ApiResponse<any>> {
    const params = new URLSearchParams({
      venue_id: String(venueId),
      court_id: String(courtId),
      date,
      duration_minutes: String(durationMinutes),
    });
    return this.api.get(`/coach/scheduling/availability?${params.toString()}`);
  }

  getSchedulingSessions(from?: string, to?: string): Observable<ApiResponse<any[]>> {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    const query = params.toString();
    return this.api.get<any[]>(`/coach/scheduling/sessions${query ? `?${query}` : ''}`);
  }

  getSchedulingSession(id: string): Observable<ApiResponse<any>> {
    return this.api.get(`/coach/scheduling/sessions/${encodeURIComponent(id)}`);
  }

  saveSchedulingSessionNotes(id: string, notes: string): Observable<ApiResponse<any>> {
    return this.api.patch(`/coach/scheduling/sessions/${encodeURIComponent(id)}/notes`, { notes });
  }

  saveSchedulingAttendance(id: string, playerId: number, status: 'present' | 'absent'): Observable<ApiResponse<any>> {
    return this.api.patch(`/coach/scheduling/sessions/${encodeURIComponent(id)}/attendance`, { player_id: playerId, status });
  }

  getCoachSessions(): Observable<ApiResponse<any>> {
    return this.api.get('/coach/sessions');
  }

  getCoachBookingRequests(status: 'pending' | 'accepted' | 'declined' | 'all' = 'pending', playerId?: number): Observable<ApiResponse<any>> {
    const player = playerId ? `&player_id=${playerId}` : '';
    return this.api.get(`/coach/booking-requests?status=${encodeURIComponent(status)}${player}`);
  }

  getMyCoachBookingRequests(coachId?: number): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>(`/player/coach-booking-requests${coachId ? `?coach_id=${coachId}` : ''}`);
  }

  respondToCoachBookingRequest(id: number, status: 'accepted' | 'declined'): Observable<ApiResponse<any>> {
    return this.api.post(`/coach/booking-requests/${id}/respond`, { status });
  }

  getSessionBatches(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>('/coach/session-batches');
  }

  createSession(payload: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.api.post('/coach/scheduling/sessions', payload);
  }
}

export type CoachEarningsPeriod = 'today' | 'week' | 'month' | 'year';

export interface CoachEarningsSessionItem {
  id: string;
  source: 'scheduling' | 'legacy';
  title: string;
  sport: string | null;
  status: string;
  state: 'upcoming' | 'awaiting_completion' | 'completed' | 'pending' | 'cancelled' | 'expired';
  student_name: string | null;
  students_count: number;
  venue_name: string | null;
  date: string;
  starts_at: string;
  ends_at: string | null;
  amount: number;
}

export interface CoachEarningsBreakdownItem {
  label: string;
  sessions: number;
  amount: number;
  percentage: number;
}

export interface CoachEarningsPayload {
  period: CoachEarningsPeriod;
  range: { from: string; to: string; label: string; previous_label: string };
  total: number;
  previous_total: number;
  change_percent: number | null;
  sessions: number;
  previous_sessions: number;
  hours: number;
  average_per_session: number;
  lifetime_total: number;
  stats: { today: number; week: number; month: number; year: number };
  wallet_balance: number;
  currency: string;
  chart: { granularity: 'hour' | 'day' | 'month'; max: number; points: { label: string; from: string; to: string; amount: number; sessions: number }[] };
  breakdown: CoachEarningsBreakdownItem[];
  breakdown_by_type: CoachEarningsBreakdownItem[];
  upcoming: { amount: number; sessions: number; items: CoachEarningsSessionItem[] };
  awaiting_completion: { amount: number; sessions: number; items: CoachEarningsSessionItem[] };
  pending_approval: { amount: number; sessions: number };
  venues: {
    venue_id: number;
    name: string;
    location: string | null;
    image: string | null;
    sports: string[];
    partnership_status: string | null;
    sessions: number;
    completed_sessions: number;
    upcoming_sessions: number;
    amount: number;
    lifetime_amount: number;
    next_session_at: string | null;
    last_session_at: string;
  }[];
  top_students: { id: number; name: string; photo: string | null; sessions: number; amount: number }[];
  recent_sessions: CoachEarningsSessionItem[];
  transactions: { id: number; type: string; label: string; description: string | null; amount: number; is_credit: boolean; status: string; created_at: string | null }[];
}

export interface CoachVenuePartnershipInfo {
  id: number;
  status: string;
  agreement_type: string | null;
  approval_policy: string | null;
  sports: string[];
  venue_rate: number | null;
  effective_from: string | null;
  effective_until: string | null;
  approved_at: string | null;
  requested_at: string | null;
}

export interface CoachVenueCollaboration {
  venue_id: number;
  name: string;
  location: string | null;
  image: string | null;
  partnership: CoachVenuePartnershipInfo | null;
  status: string;
  sports: string[];
  this_month_earnings: number;
  total_earnings: number;
  sessions: number;
  completed_sessions: number;
  upcoming_sessions: number;
  next_session: { id: string; title: string; starts_at: string } | null;
  schedule: string | null;
}

export interface CoachVenueCollaborationSession {
  id: string;
  title: string;
  sport: string | null;
  court: string | null;
  status: string;
  state: string;
  starts_at: string;
  ends_at: string | null;
  minutes: number;
  students: number;
  student_names: string[];
  amount: number;
}

export interface CoachVenueCollaborationDetail {
  employment?: CoachEmployment | null;
  venue_id: number;
  name: string;
  location: string | null;
  image: string | null;
  phone: string | null;
  manager_name: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  open_time: string | null;
  close_time: string | null;
  operating_days: string[];
  amenities: string[];
  rating: number | null;
  partnership: CoachVenuePartnershipInfo | null;
  status: string;
  sports: string[];
  first_session_at: string | null;
  schedule: string | null;
  stats: {
    sessions: number;
    completed_sessions: number;
    upcoming_sessions: number;
    awaiting_completion: number;
    pending_approval: number;
    cancelled_sessions: number;
    hours_coached: number;
    upcoming_hours: number;
    students: number;
    attendance_rate: number | null;
    cancellation_rate: number | null;
  };
  earnings: { this_month: number; total: number; upcoming: number; monthly: { month: string; year: number; amount: number; sessions: number }[] };
  upcoming: CoachVenueCollaborationSession[];
  recent: CoachVenueCollaborationSession[];
}

export interface CoachTeam {
  id: string;
  name: string;
  sport: string | null;
  players: number;
  members: { id: number; name: string; photo: string | null }[];
  avg_age: number | null;
  sessions: number;
  completed_sessions: number;
  attendance_rate: number | null;
  venue_name: string | null;
  status: 'active' | 'inactive';
  next_session: { id: string; title: string; venue: string | null; status: string; starts_at: string } | null;
  last_session_at: string;
}

export type CoachGalleryCategory = 'profile_photo' | 'training_photo' | 'video' | 'certificate';
export interface CoachGalleryItem {
  id: number;
  category: CoachGalleryCategory;
  url: string;
  name: string | null;
  mimeType: string;
  sizeBytes: number;
  createdAt: string | null;
}

export type CoachVerificationDocumentType = 'government_id' | 'coaching_certificate' | 'professional_profile_photo';
export interface CoachVerificationDocument {
  id: number;
  documentType: CoachVerificationDocumentType;
  name: string | null;
  mimeType: string;
  sizeBytes: number;
  status: 'submitted' | 'approved' | 'rejected';
  createdAt: string | null;
}

export interface CoachProfileDetails {
  coverImage: string | null;
  languages: string[];
  coachingLocations: string[];
  serviceRadius: string;
  sessionTypes: string[];
  equipment: string[];
  trialEnabled: boolean | null;
  trialType: string;
  travelMode: string;
  weeklyAvailability: Record<string, string[]>;
  feeOptions: Record<string, string | number>;
  feesNegotiable: boolean;
  achievements: string[];
  specialities: string[];
  coachingLevels: string[];
  coachingHistory: CoachHistoryEntry[];
  experienceYears: number | null;
  experienceSummary: string;
  sportExperience: CoachSportExperience[];
  sessionOffers: CoachSessionOffer[];
  bio: string;
}

export interface CoachHistoryEntry {
  place: string;
  role: string;
  period: string;
}

export interface CoachSportExperience {
  sport: string;
  years: number | null;
  focus: string;
}

export type CoachOfferType = 'individual' | 'group' | 'monthly' | 'trial' | 'online' | 'other';

export interface CoachSessionOffer {
  name: string;
  type: CoachOfferType;
  durationMinutes: number | null;
  price: number | null;
  perPlayer: boolean;
  description: string;
}

export type CoachReviewCategory = 'quality_rating' | 'communication_rating' | 'punctuality_rating' | 'professionalism_rating' | 'value_rating';

export const COACH_REVIEW_CATEGORIES: Array<{ key: CoachReviewCategory; label: string }> = [
  { key: 'quality_rating', label: 'Coaching Quality' },
  { key: 'communication_rating', label: 'Communication' },
  { key: 'punctuality_rating', label: 'Punctuality' },
  { key: 'professionalism_rating', label: 'Professionalism' },
  { key: 'value_rating', label: 'Value' },
];

export interface CoachProfileDetailsPayload {
  languages: string[];
  coaching_locations: string[];
  service_radius: string;
  session_types: string[];
  equipment: string[];
  trial_enabled: boolean | null;
  trial_type: string;
  travel_mode: string;
  weekly_availability: Record<string, string[]>;
  fee_options: Record<string, string | number>;
  fees_negotiable: boolean;
  achievements: string[];
  specialities?: string[];
  coaching_levels?: string[];
  coaching_history?: CoachHistoryEntry[];
  experience_years?: number | null;
  experience_summary?: string;
  sport_experience?: CoachSportExperience[];
  session_offers?: Array<{
    name: string;
    type: CoachOfferType;
    duration_minutes: number | null;
    price: number | null;
    per_player: boolean;
    description: string;
  }>;
  bio: string;
}
