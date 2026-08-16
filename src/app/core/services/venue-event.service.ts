import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { ApiService } from './api.service';

export interface VenueEventRecord {
  id: string;
  type: string;
  name?: string | null;
  sport?: string | null;
  facility?: string | null;
  eventDate?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  maxParticipants: number;
  minParticipants: number;
  recurring: string;
  entryFee: number;
  venueCost: number;
  tournamentFormat?: string | null;
  teamCount?: number | null;
  prizePool: number;
  registrations: number;
  rating: number;
  status: string;
  grossRevenue: number;
  estimatedProfit: number;
  sponsors?: Array<{ name: string; package?: string }>;
}

export interface VenueEventsDashboard {
  stats: {
    upcoming: number;
    registrations: number;
    revenue: number;
    activeComps: number;
    avgRating: number;
    hosted: number;
  };
  events: VenueEventRecord[];
  leagues: VenueEventRecord[];
  analytics: {
    totalRevenue: number;
    registrations: number;
    avgRating: number;
    repeatVisitors: number;
    byEvent: Array<{ id: string; name: string; revenue: number; pct: number }>;
  };
}

export type VenueEventDraft = Record<string, unknown>;

@Injectable({ providedIn: 'root' })
export class VenueEventService {
  private readonly api = inject(ApiService);

  dashboard(): Observable<ApiResponse<VenueEventsDashboard>> {
    return this.api.get<VenueEventsDashboard>('/venue/events');
  }

  publish(payload: VenueEventDraft): Observable<ApiResponse<VenueEventRecord>> {
    return this.api.post<VenueEventRecord>('/venue/events', payload);
  }
}
