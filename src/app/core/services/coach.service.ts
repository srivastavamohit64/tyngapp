import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, CoachDashboard } from '../models/api.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class CoachService {
  private readonly api = inject(ApiService);

  getDashboard(): Observable<ApiResponse<CoachDashboard>> {
    return this.api.get<CoachDashboard>('/coach/dashboard');
  }

  getEarnings(period: 'today' | 'week' | 'month' | 'year' = 'month'): Observable<ApiResponse<any>> {
    return this.api.get(`/coach/earnings?period=${encodeURIComponent(period)}`);
  }

  getCoaches(search = '', sport = ''): Observable<ApiResponse<any>> {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    if (sport && sport !== 'All') params.set('sport', sport);
    const query = params.toString();
    return this.api.get(`/coaches${query ? `?${query}` : ''}`);
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

  requestCoachingBooking(coachId: number, payload: { sport?: string; message: string }): Observable<ApiResponse<any>> {
    return this.api.post(`/coaches/${coachId}/booking-requests`, payload);
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

  getStudent(id: number): Observable<ApiResponse<any>> {
    return this.api.get(`/coach/students/${id}`);
  }

  updateStudent(id: number, payload: { training_focus?: string[]; notes?: string; status?: string }): Observable<ApiResponse<any>> {
    return this.api.patch(`/coach/students/${id}`, payload);
  }

  getEvaluations(studentId?: number): Observable<ApiResponse<any>> {
    const query = studentId ? `?student_id=${encodeURIComponent(studentId)}` : '';
    return this.api.get(`/coach/evaluations${query}`);
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

  getCoachBookingRequests(status: 'pending' | 'accepted' | 'declined' | 'all' = 'pending'): Observable<ApiResponse<any>> {
    return this.api.get(`/coach/booking-requests?status=${encodeURIComponent(status)}`);
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
  bio: string;
}

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
  bio: string;
}
