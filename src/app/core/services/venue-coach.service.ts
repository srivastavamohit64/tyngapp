import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { ApiService } from './api.service';

export type EmploymentType = 'monthly' | 'hourly' | 'contract' | 'freelance';
export type DutyStatus = 'available' | 'on_duty' | 'leave' | string;
export type AttendanceStatus = 'present' | 'late' | 'half_day' | 'absent' | 'leave';
export type PayoutStatus = 'pending' | 'processing' | 'paid';

export interface VenueCoachCard {
  id: number;
  coachId: number;
  name: string;
  username: string | null;
  profileImage: string | null;
  sport: string | null;
  sports: string[];
  experienceYears: number | null;
  experienceLabel: string | null;
  rating: number | null;
  reviewCount: number;
  verified: boolean;
  status: 'active' | 'offered' | 'pending' | 'terminated' | string;
  dutyStatus: DutyStatus;
  employmentType: EmploymentType | null;
  employmentLabel: string | null;
  monthlySalary: number | null;
  hourlyRate: number | null;
  attendancePct: number | null;
  sessions: number;
  students: number;
  facility: string | null;
  workDays: string[];
  workDaysLabel: string | null;
  shiftLabel: string | null;
  score: number | null;
  message: string | null;
  offeredAt: string | null;
  requestedAt: string | null;
  contractEnd: string | null;
}

export interface VenueCourtOption {
  id: number;
  name: string;
  sport: string | null;
}

export interface VenueCoachTeam {
  summary: { total: number; onDuty: number; available: number; onLeave: number; offers: number; requests: number };
  coaches: VenueCoachCard[];
  offers: VenueCoachCard[];
  requests: VenueCoachCard[];
  excludedCoachIds: number[];
  courts: VenueCourtOption[];
}

export interface VenueCoachAssignment {
  courtId: number | null;
  facility: string | null;
  facilityLabel: string | null;
  workDays: string[];
  workDaysLabel: string | null;
  shiftStart: string | null;
  shiftEnd: string | null;
  shiftLabel: string | null;
  employmentType: EmploymentType | null;
  employmentLabel: string | null;
  monthlySalary: number | null;
  hourlyRate: number | null;
  sports: string[];
  startDate: string | null;
  endDate: string | null;
  noticeDays: number | null;
}

export interface VenueCoachContract {
  status: 'active' | 'ending_soon' | 'expired' | 'terminated' | string;
  start: string | null;
  end: string | null;
  noticeDays: number | null;
  employmentType: EmploymentType | null;
  employmentLabel: string | null;
  terminatedAt: string | null;
  terminationReason: string | null;
}

export interface VenueCoachAttendanceDay {
  date: string;
  status: AttendanceStatus | null;
  checkIn: string | null;
  checkOut: string | null;
  workedMinutes: number;
  note?: string | null;
}

export interface VenueCoachAttendance {
  today: VenueCoachAttendanceDay & { isWorkDay: boolean };
  month: { label: string; present: number; late: number; half: number; absent: number; leave: number; hours: number; overtimeHours: number; ratePct: number | null };
  recent: VenueCoachAttendanceDay[];
}

export interface VenueCoachPayout {
  id: number | null;
  period: string;
  periodLabel: string;
  base: number;
  bonus: number;
  incentive: number;
  deduction: number;
  net: number;
  hours: number;
  status: PayoutStatus;
  paidAt: string | null;
  invoiceNumber: string | null;
  note: string | null;
}

export interface VenueCoachScheduleDay {
  date: string;
  day: string;
  isToday: boolean;
  isWorkDay: boolean;
  shiftLabel: string | null;
  attendance: AttendanceStatus | null;
  sessions: { id: number; title: string; status: string; start: string; end: string; court: string | null }[];
}

export interface VenueCoachPerformance {
  score: number | null;
  components: { attendance: number | null; punctuality: number | null; rating: number | null; renewals: number | null; response: number | null; students: number | null };
  trend: { month: string; label: string; score: number | null; sessions: number; students: number }[];
  attendancePct: number | null;
  sessions: number;
  students: number;
  rating: number | null;
  response: { label: string | null; averageMinutes: number | null; within24Pct: number | null };
  partnerSince: string | null;
}

export interface VenueCoachDetail extends VenueCoachCard {
  phone: string | null;
  email: string | null;
  bio: string | null;
  languages: string[];
  city: string | null;
  partnerSince: string | null;
  onTyngSince: string | null;
  response: { label: string | null; averageMinutes: number | null; within24Pct: number | null };
  certificates: string[];
  assignment: VenueCoachAssignment;
  schedule: VenueCoachScheduleDay[];
  attendance: VenueCoachAttendance;
  payroll: { current: VenueCoachPayout; history: VenueCoachPayout[] };
  documents: { id: number; type: string; label: string; name: string | null; mimeType: string | null; status: string; uploadedAt: string | null }[];
  contract: VenueCoachContract;
  performance: VenueCoachPerformance;
  courts: VenueCourtOption[];
}

export interface VenueCoachTerms {
  employment_type: EmploymentType;
  monthly_salary?: number | null;
  hourly_rate?: number | null;
  venue_court_id?: number | null;
  facility_label?: string | null;
  work_days?: string[];
  shift_start?: string | null;
  shift_end?: string | null;
  start_date: string;
  end_date?: string | null;
  notice_days?: number | null;
  sports?: string[];
}

export interface CoachEmployment {
  partnershipId: number;
  status: string;
  initiatedBy: string;
  venueId: number;
  venueName: string | null;
  message: string | null;
  offeredAt: string | null;
  assignment: VenueCoachAssignment;
  contract: VenueCoachContract;
  attendance: VenueCoachAttendance | null;
  payouts: VenueCoachPayout[];
}

@Injectable({ providedIn: 'root' })
export class VenueCoachService {
  private readonly api = inject(ApiService);

  team(): Observable<ApiResponse<VenueCoachTeam>> {
    return this.api.get<VenueCoachTeam>('/venue/coaches');
  }

  detail(id: number): Observable<ApiResponse<VenueCoachDetail>> {
    return this.api.get<VenueCoachDetail>(`/venue/coaches/${id}`);
  }

  sendOffer(coachId: number, terms: VenueCoachTerms & { message?: string | null }): Observable<ApiResponse<VenueCoachDetail>> {
    return this.api.post<VenueCoachDetail>('/venue/coaches/offers', { coach_id: coachId, ...terms });
  }

  withdrawOffer(id: number): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/venue/coaches/${id}/offer`);
  }

  approve(id: number, terms?: VenueCoachTerms): Observable<ApiResponse<VenueCoachDetail>> {
    return this.api.post<VenueCoachDetail>(`/venue/coaches/${id}/approve`, terms ?? {});
  }

  decline(id: number, reason?: string): Observable<ApiResponse<null>> {
    return this.api.post<null>(`/venue/coaches/${id}/decline`, { reason: reason || null });
  }

  updateAssignment(id: number, terms: VenueCoachTerms): Observable<ApiResponse<VenueCoachDetail>> {
    return this.api.put<VenueCoachDetail>(`/venue/coaches/${id}/assignment`, terms);
  }

  contract(id: number, action: 'renew' | 'extend' | 'terminate', extra: { months?: number; reason?: string } = {}): Observable<ApiResponse<VenueCoachDetail>> {
    return this.api.post<VenueCoachDetail>(`/venue/coaches/${id}/contract`, { action, ...extra });
  }

  attendance(id: number, action: 'check_in' | 'check_out' | 'mark', status?: AttendanceStatus, date?: string): Observable<ApiResponse<VenueCoachDetail>> {
    return this.api.post<VenueCoachDetail>(`/venue/coaches/${id}/attendance`, { action, status: status ?? null, date: date ?? null });
  }

  savePayroll(id: number, body: { period?: string; bonus?: number; incentive?: number; deduction?: number; status?: PayoutStatus; note?: string | null }): Observable<ApiResponse<VenueCoachDetail>> {
    return this.api.post<VenueCoachDetail>(`/venue/coaches/${id}/payroll`, body);
  }

  document(id: number, documentId: number): Observable<Blob> {
    return this.api.getBlob(`/venue/coaches/${id}/documents/${documentId}`);
  }

  invoice(payoutId: number): Observable<Blob> {
    return this.api.getBlob(`/coach-payouts/${payoutId}/invoice`);
  }

  coachOffers(): Observable<ApiResponse<CoachEmployment[]>> {
    return this.api.get<CoachEmployment[]>('/coach/venue-offers');
  }

  respondToOffer(id: number, action: 'accept' | 'decline'): Observable<ApiResponse<CoachEmployment>> {
    return this.api.post<CoachEmployment>(`/coach/venue-offers/${id}/respond`, { action });
  }
}

export function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function openBlob(blob: Blob): void {
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
