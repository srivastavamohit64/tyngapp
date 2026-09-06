import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface XpLine {
  id: string;
  ruleCode: string;
  label: string;
  xpAmount: number;
  category: string;
}

export interface AdminXpRule {
  id: number;
  ruleCode: string;
  name: string;
  category: string;
  xpAmount: number;
  frequencyCap: number | null;
  frequencyPeriod: 'none' | 'once' | 'daily' | 'weekly' | 'per_booking';
  isEnabled: boolean;
  minSessionMinutes: number | null;
}

export interface XpSummary {
  lifetimeXp: number;
  seasonXp: number;
  level: number;
  levelTitle: string;
  nextLevelXp: number;
  xpToNextLevel: number;
  xpProgressPct: number;
  reliabilityScore: number;
  rating: number | null;
  gamesPlayed: number;
  rank: number | null;
  seasonRank: number | null;
  dna: { play: number; reliability: number; sportsmanship: number; community: number };
  season: { id: number; name: string; startsAt: string | null; endsAt: string | null } | null;
  nextLevel: { level: number; title: string; minimumXp: number } | null;
}

export interface XpBookingSummary {
  bookingId: string;
  previousXp: number;
  earnedXp: number;
  currentXp: number;
  previousLevel: number;
  currentLevel: number;
  levelTitle: string;
  levelUp: boolean;
  progressPct: number;
  xpToNextLevel: number;
  transactions: XpLine[];
}

export interface XpLeaderboard {
  period: string;
  scope: string;
  items: Array<{
    rank: number;
    playerId: string;
    name: string;
    username?: string;
    level: number;
    levelTitle?: string | null;
    xp: number;
    gamesPlayed: number;
  }>;
  me: {
    rank: number | null;
    playerId: string;
    name: string;
    level: number;
    levelTitle?: string | null;
    xp: number;
    gamesPlayed: number;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class XpService {
  private readonly api = inject(ApiService);

  summary(): Observable<XpSummary | null> {
    return this.api.get<XpSummary>('/xp/me').pipe(map((res) => res.data));
  }

  history(): Observable<XpLine[]> {
    return this.api.get<{ items: Array<XpLine & { createdAt?: string; sport?: string }> }>('/xp/history').pipe(
      map((res) => res.data?.items ?? []),
    );
  }

  badges(): Observable<Array<{ code: string; name: string; description?: string; category: string; earned: boolean }>> {
    return this.api.get<{ items: Array<{ code: string; name: string; description?: string; category: string; earned: boolean }> }>('/xp/badges').pipe(
      map((res) => res.data?.items ?? []),
    );
  }

  challenges(): Observable<Array<{ id: number; name: string; description?: string; threshold: number; current: number; rewardXp: number; completed: boolean }>> {
    return this.api
      .get<{ items: Array<{ id: number; name: string; description?: string; threshold: number; current: number; rewardXp: number; completed: boolean }> }>(
        '/xp/challenges',
      )
      .pipe(map((res) => res.data?.items ?? []));
  }

  leaderboard(period = 'all_time', sport?: string): Observable<XpLeaderboard | null> {
    const params = new URLSearchParams({ period, scope: 'global', limit: '20' });
    if (sport && sport !== 'all') {
      params.set('sport', sport);
    }
    return this.api.get<XpLeaderboard>(`/xp/leaderboard?${params.toString()}`).pipe(map((res) => res.data));
  }

  bookingSummary(bookingId: string | number): Observable<XpBookingSummary | null> {
    return this.api.get<XpBookingSummary>(`/xp/bookings/${bookingId}/summary`).pipe(map((res) => res.data));
  }

  adminRules(): Observable<AdminXpRule[]> {
    return this.api.get<AdminXpRule[]>('/admin/xp/rules').pipe(map((res) => res.data ?? []));
  }

  updateAdminRule(rule: AdminXpRule): Observable<AdminXpRule | null> {
    return this.api.patch<AdminXpRule>(`/admin/xp/rules/${rule.id}`, {
      xpAmount: rule.xpAmount,
      isEnabled: rule.isEnabled,
      frequencyCap: rule.frequencyCap,
      frequencyPeriod: rule.frequencyPeriod,
      minSessionMinutes: rule.minSessionMinutes,
    }).pipe(map((res) => res.data));
  }
}
