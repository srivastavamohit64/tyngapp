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

  requestToJoin(coachId: number, payload: { sport?: string; goal?: string; message?: string }): Observable<ApiResponse<unknown>> {
    return this.api.post(`/coaches/${coachId}/student-requests`, payload);
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

  saveStudentEvaluation(id: number, payload: { rating: number; skill_ratings: Record<string, number> }): Observable<ApiResponse<any>> {
    return this.api.post(`/coach/students/${id}/evaluations`, payload);
  }

  addStudentNote(id: number, note: string): Observable<ApiResponse<any>> {
    return this.api.post(`/coach/students/${id}/notes`, { note });
  }

  getVenues(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>('/venues');
  }

  getCoachSessions(): Observable<ApiResponse<any>> {
    return this.api.get('/coach/sessions');
  }

  getSessionBatches(): Observable<ApiResponse<any[]>> {
    return this.api.get<any[]>('/coach/session-batches');
  }

  createSession(payload: Record<string, unknown>): Observable<ApiResponse<any>> {
    return this.api.post('/coach/sessions', payload);
  }
}
