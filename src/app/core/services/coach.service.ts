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
}
