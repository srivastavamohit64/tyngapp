import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { ApiService } from './api.service';

export type InsightReportType = 'revenue' | 'occupancy' | 'coaches' | 'customers';

export interface InsightStat {
  key: string;
  label: string;
  value: number | null;
  display: string;
  change: number | null;
  changeLabel?: string;
  up: boolean;
  series: number[];
  note?: string;
}

export interface VenueInsights {
  venueName: string;
  city: string | null;
  health: {
    score: number | null;
    label: string;
    grades: { label: string; grade: string | null }[];
    components: Record<string, number | null>;
    topPercent: number | null;
  };
  ranking: {
    area: string;
    rank: number | null;
    total: number;
    topPercent: number | null;
    rows: { label: string; rank: number | null; value: number | null; color: string }[];
    tip: string;
  };
  stats: InsightStat[];
  periodLabel: string;
  revenue: {
    monthly: { label: string; revenue: number; average: number | null }[];
    forecast: { label: string; actual: number | null; forecast: number | null }[];
  };
  occupancy: { hours: string[]; days: string[]; heatmap: number[][]; weekly: { day: string; rate: number }[]; weeks: number };
  facilities: { id: number; name: string; sport: string | null; status: string; bookings: number; revenue: number; occupancy: number; color: string }[];
  trends: { label: string; players: number; coaches: number; events: number }[];
  sports: { name: string; count: number; value: number; color: string }[];
  satisfaction: null | { value: number };
  coaches: { id: number | null; coachId: number; name: string; profileImage: string | null; sport: string | null; sessions: number; revenue: number; rating: number | null; score: number | null; partner: boolean }[];
  tips: { icon: string; priority: 'high' | 'medium' | 'low'; title: string; text: string; action: string; route: string }[];
  maintenance: { id: number; name: string; status: string; urgency: 'high' | 'medium' | 'low' | 'ok'; text: string }[];
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class VenueInsightsService {
  private readonly api = inject(ApiService);

  insights(): Observable<ApiResponse<VenueInsights>> {
    return this.api.get<VenueInsights>('/venue/insights');
  }

  report(type: InsightReportType): Observable<Blob> {
    return this.api.getBlob(`/venue/insights/reports/${type}`);
  }
}
