import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { UiChromeService } from '../../core/services/ui-chrome.service';
import { VenueService } from '../../core/services/venue.service';
import { XpLeaderboard, XpService, XpSummary } from '../../core/services/xp.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

type LeaderboardMode = 'city' | 'friends' | 'sport' | 'venue';
type LeaderboardPeriod = 'week' | 'month' | 'season' | 'all_time';

interface BoardRow {
  rank: number;
  playerId: string;
  name: string;
  firstName: string;
  initials: string;
  avatar: string | null;
  xp: number;
  level: number;
  levelTitle: string;
  gamesPlayed: number;
  reliability: number | null;
  me: boolean;
}

interface RivalRow extends BoardRow {
  gap: string;
  gapTone: 'ahead' | 'behind' | 'tied' | 'me';
}

interface VenueOption {
  id: string;
  name: string;
}

const PODIUM_ACCENTS: Record<number, string> = { 1: '#F6C95D', 2: '#C8D0DA', 3: '#D79561' };

@Component({
  selector: 'app-leaderboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BrandHeaderShellComponent],
  styleUrls: ['./leaderboard.page.scss'],
  templateUrl: './leaderboard.page.html',
})
export class LeaderboardPage implements OnInit, OnDestroy {
  private readonly xp = inject(XpService);
  private readonly auth = inject(AuthService);
  private readonly venueService = inject(VenueService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastController);
  private readonly chrome = inject(UiChromeService);

  @ViewChild('rankCard') rankCard?: ElementRef<HTMLElement>;

  readonly modes: Array<{ id: LeaderboardMode; label: string }> = [
    { id: 'city', label: 'CITY' },
    { id: 'friends', label: 'FRIENDS' },
    { id: 'sport', label: 'SPORT' },
    { id: 'venue', label: 'VENUE' },
  ];

  readonly periods: Array<{ id: LeaderboardPeriod; label: string; phrase: string }> = [
    { id: 'week', label: 'THIS WEEK', phrase: 'this week' },
    { id: 'month', label: 'THIS MONTH', phrase: 'this month' },
    { id: 'season', label: 'SEASON', phrase: 'this season' },
    { id: 'all_time', label: 'ALL TIME', phrase: 'all time' },
  ];

  readonly sports = [
    { id: 'football', label: 'Football', icon: 'football-outline' },
    { id: 'badminton', label: 'Badminton', icon: 'pulse-outline' },
    { id: 'cricket', label: 'Cricket', icon: 'locate-outline' },
    { id: 'basketball', label: 'Basketball', icon: 'basketball-outline' },
    { id: 'tennis', label: 'Tennis', icon: 'tennisball-outline' },
  ];

  readonly xpPillars = [
    { title: 'PLAY', copy: 'Complete verified games.', icon: 'trophy-outline', color: '#16A34A' },
    { title: 'RELIABILITY', copy: 'Show up and be punctual.', icon: 'time-outline', color: '#2563EB' },
    { title: 'SPORTSMANSHIP', copy: 'Be someone people enjoy playing with.', icon: 'shield-checkmark-outline', color: '#7C3AED' },
    { title: 'COMMUNITY', copy: 'Create games and help the community grow.', icon: 'people-outline', color: '#FF7A00' },
    { title: 'CONSISTENCY', copy: 'Build streaks and complete challenges.', icon: 'flash-outline', color: '#D97706' },
  ];

  readonly seasonHonours = [
    { label: 'TOP 10', icon: 'medal-outline' },
    { label: 'CITY CHAMPION', icon: 'trophy-outline' },
    { label: 'MOST RELIABLE', icon: 'shield-checkmark-outline' },
    { label: 'GAME MAKER', icon: 'people-outline' },
  ];

  mode: LeaderboardMode = 'city';
  period: LeaderboardPeriod = 'month';
  sport = 'football';

  venues: VenueOption[] = [];
  selectedVenue: VenueOption | null = null;
  venuePickerOpen = false;

  loading = true;
  rows: BoardRow[] = [];
  me: BoardRow | null = null;
  cityFallback = false;
  summary: XpSummary | null = null;
  weeklyTop: BoardRow | null = null;

  sheet: 'xp' | 'search' | 'share' | null = null;
  searchQuery = '';

  rankCardVisible = true;
  hasSeenRankCard = false;

  private requestId = 0;

  ngOnInit(): void {
    void this.loadSummary();
    void this.loadWeeklyTop();
    void this.reload();
  }

  get periodLabel(): string {
    return this.periods.find((p) => p.id === this.period)?.label ?? '';
  }

  get periodPhrase(): string {
    return this.periods.find((p) => p.id === this.period)?.phrase ?? '';
  }

  get periodSuffix(): string {
    return this.period === 'all_time' ? '' : ` ${this.periodPhrase}`;
  }

  get sportLabel(): string {
    return this.sports.find((s) => s.id === this.sport)?.label ?? 'Sport';
  }

  get userCity(): string {
    const location = (this.auth.user()?.location || '').trim();
    if (location.includes('>')) {
      return location.split('>').pop()?.trim() ?? '';
    }
    return location.split(',')[0].trim();
  }

  get scopeLabel(): string {
    switch (this.mode) {
      case 'city':
        return this.cityFallback ? 'All of TYNG' : this.userCity || 'Your city';
      case 'friends':
        return 'Your TYNG connections';
      case 'sport':
        return `${this.sportLabel} verified activity`;
      case 'venue':
        return this.selectedVenue?.name || 'Choose a venue';
    }
  }

  get rankPlaceLabel(): string {
    if (this.mode === 'city') return this.cityFallback ? 'ALL OF TYNG' : (this.userCity || 'Your city').toUpperCase();
    if (this.mode === 'friends') return 'AMONG FRIENDS';
    if (this.mode === 'sport') return this.sportLabel.toUpperCase();
    return (this.selectedVenue?.name || 'VENUE').toUpperCase();
  }

  get topThree(): BoardRow[] {
    return this.rows.slice(0, 3);
  }

  get podiumOrder(): BoardRow[] {
    const [first, second, third] = this.topThree;
    return [second, first, third].filter((row): row is BoardRow => !!row);
  }

  get rankingRows(): BoardRow[] {
    return this.rows.slice(3);
  }

  get rankingsTitle(): string {
    return this.mode === 'friends' ? `Friends ${this.periodPhrase}` : 'Rankings';
  }

  get playerAhead(): BoardRow | null {
    const rank = this.me?.rank;
    if (!rank || rank <= 1) return null;
    return this.rows.find((row) => row.rank === rank - 1) ?? null;
  }

  get xpToAhead(): number {
    const ahead = this.playerAhead;
    if (!ahead || !this.me) return 0;
    return Math.max(1, ahead.xp - this.me.xp);
  }

  get chaseProgressPct(): number {
    const ahead = this.playerAhead;
    if (!this.me) return 0;
    if (!ahead) return this.me.rank === 1 ? 100 : 0;
    if (ahead.xp <= 0) return 0;
    return Math.min(100, Math.max(4, Math.round((this.me.xp / ahead.xp) * 100)));
  }

  get rivals(): RivalRow[] {
    const me = this.me;
    if (!me?.rank) return [];
    const nearby = this.rows.filter((row) => !row.me && Math.abs(row.rank - me.rank) <= 2);
    const window = [...nearby, me].sort((a, b) => a.rank - b.rank);
    if (window.length < 2) return [];
    return window.map((row) => {
      if (row.me) return { ...row, gap: 'YOUR RANK', gapTone: 'me' as const };
      const diff = Math.abs(row.xp - me.xp);
      const ahead = row.rank < me.rank;
      return {
        ...row,
        gap: diff === 0 ? 'TIED' : `${ahead ? '+' : '−'}${diff.toLocaleString('en-IN')} XP`,
        gapTone: diff === 0 ? ('tied' as const) : ahead ? ('ahead' as const) : ('behind' as const),
      };
    });
  }

  get searchResults(): BoardRow[] {
    const query = this.searchQuery.trim().toLowerCase();
    const pool = this.me && !this.rows.some((row) => row.me) ? [...this.rows, this.me] : this.rows;
    if (!query) return pool.slice(0, 5);
    return pool.filter((row) => row.name.toLowerCase().includes(query)).slice(0, 8);
  }

  get seasonDates(): string {
    const season = this.summary?.season;
    if (!season?.startsAt || !season?.endsAt) return '';
    const fmt = (value: string) =>
      new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
    return `${fmt(season.startsAt)} – ${fmt(season.endsAt)}`;
  }

  get seasonDaysLeft(): number | null {
    const endsAt = this.summary?.season?.endsAt;
    if (!endsAt) return null;
    const diff = new Date(endsAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / 86_400_000));
  }

  get myName(): string {
    return this.auth.user()?.name || this.me?.name || 'TYNG Player';
  }

  readonly trackPlayer = (_: number, row: BoardRow) => row.playerId;

  podiumAccent(rank: number): string {
    return PODIUM_ACCENTS[rank] ?? '#C8D0DA';
  }

  selectMode(mode: LeaderboardMode): void {
    if (this.mode === mode) return;
    this.mode = mode;
    if (mode === 'venue') {
      void this.ensureVenues();
    }
    void this.reload();
  }

  selectPeriod(period: LeaderboardPeriod): void {
    if (this.period === period) return;
    this.period = period;
    void this.reload();
  }

  selectSport(sport: string): void {
    if (this.sport === sport) return;
    this.sport = sport;
    void this.reload();
  }

  selectVenue(venue: VenueOption): void {
    this.venuePickerOpen = false;
    if (this.selectedVenue?.id === venue.id) return;
    this.selectedVenue = venue;
    void this.reload();
  }

  openSheet(sheet: 'xp' | 'search' | 'share'): void {
    if (!this.sheet) this.chrome.openOverlay();
    this.sheet = sheet;
  }

  closeSheet(): void {
    if (this.sheet) this.chrome.closeOverlay();
    this.sheet = null;
  }

  ionViewWillLeave(): void {
    this.closeSheet();
  }

  ngOnDestroy(): void {
    this.closeSheet();
  }

  openPlayer(row: BoardRow): void {
    this.closeSheet();
    void this.router.navigateByUrl(row.me ? '/app/profile' : `/app/player/${row.playerId}`);
  }

  openXpHistory(): void {
    this.closeSheet();
    void this.router.navigateByUrl('/app/xp/history');
  }

  findGame(): void {
    void this.router.navigateByUrl('/app/ongoing');
  }

  scrollToRankCard(): void {
    this.rankCard?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  onContentScroll(): void {
    const element = this.rankCard?.nativeElement;
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const visible = rect.bottom > 90 && rect.top < window.innerHeight - 90;
    this.rankCardVisible = visible;
    if (visible) this.hasSeenRankCard = true;
  }

  async shareRank(): Promise<void> {
    const rank = this.me?.rank ? `#${this.me.rank}` : 'on the board';
    const text = `I'm ${rank} on the TYNG ${this.rankPlaceLabel.toLowerCase()} leaderboard${this.periodSuffix} with ${(this.me?.xp ?? 0).toLocaleString('en-IN')} verified XP.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'My TYNG rank', text });
      } else {
        await navigator.clipboard.writeText(text);
        await this.showToast('Rank copied to clipboard.');
      }
      this.closeSheet();
    } catch {
      // The native share sheet was dismissed.
    }
  }

  private async reload(): Promise<void> {
    const requestId = ++this.requestId;
    if (this.mode === 'venue' && !this.selectedVenue) {
      await this.ensureVenues();
      if (requestId !== this.requestId) return;
      if (!this.selectedVenue) {
        this.rows = [];
        this.me = null;
        this.loading = false;
        return;
      }
    }

    this.loading = true;
    let board = await firstValueFrom(
      this.xp.leaderboard(this.period, this.mode === 'sport' ? this.sport : undefined, {
        scope: this.mode === 'city' ? 'city' : this.mode === 'friends' ? 'friends' : 'global',
        city: this.mode === 'city' ? this.userCity || undefined : undefined,
        venueId: this.mode === 'venue' ? this.selectedVenue?.id : undefined,
        limit: 50,
      }),
    ).catch(() => null);
    this.cityFallback = false;
    if (this.mode === 'city' && !board?.items?.length) {
      const global = await firstValueFrom(this.xp.leaderboard(this.period, undefined, { limit: 50 })).catch(() => null);
      if (global?.items?.length) {
        board = global;
        this.cityFallback = true;
      }
    }
    if (requestId !== this.requestId) return;
    this.applyBoard(board);
    this.loading = false;
    setTimeout(() => this.onContentScroll());
  }

  private applyBoard(board: XpLeaderboard | null): void {
    const myId = board?.me?.playerId ?? this.auth.user()?.id ?? '';
    this.rows = (board?.items ?? []).map((item) =>
      this.toRow(item, item.playerId === myId),
    );
    const meInList = this.rows.find((row) => row.me);
    if (meInList) {
      this.me = meInList;
    } else if (board?.me?.rank) {
      this.me = this.toRow(
        { ...board.me, rank: board.me.rank, avatar: this.auth.user()?.profileImage ?? null },
        true,
      );
    } else {
      this.me = null;
    }
  }

  private toRow(
    item: XpLeaderboard['items'][number] | (NonNullable<XpLeaderboard['me']> & { rank: number; avatar?: string | null }),
    me: boolean,
  ): BoardRow {
    const name = (item.name || 'TYNG Player').trim();
    const raw = item as { avatar?: string | null; profileImage?: string | null };
    const avatar = raw.avatar || raw.profileImage || (me ? this.auth.user()?.profileImage : null);
    return {
      rank: Number(item.rank || 0),
      playerId: String(item.playerId),
      name,
      firstName: name.split(/\s+/)[0],
      initials: name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join(''),
      avatar: resolveMediaUrl(avatar ?? null),
      xp: Number(item.xp || 0),
      level: Number(item.level || 1),
      levelTitle: item.levelTitle || 'Player',
      gamesPlayed: Number(item.gamesPlayed || 0),
      reliability: item.reliabilityScore ?? null,
      me,
    };
  }

  private async loadSummary(): Promise<void> {
    this.summary = await firstValueFrom(this.xp.summary()).catch(() => null);
  }

  private async loadWeeklyTop(): Promise<void> {
    const board = await firstValueFrom(this.xp.leaderboard('week', undefined, { limit: 5 })).catch(() => null);
    const top = board?.items?.[0];
    this.weeklyTop = top && top.xp > 0 ? this.toRow(top, top.playerId === board?.me?.playerId) : null;
  }

  private async ensureVenues(): Promise<void> {
    if (this.venues.length) return;
    const city = this.userCity || undefined;
    const fetchCourts = (params?: { city?: string }) =>
      firstValueFrom(this.venueService.getCourts(params)).then((res) => res?.data ?? []).catch(() => []);
    let courts = await fetchCourts(city ? { city } : undefined);
    if (!courts.length && city) {
      courts = await fetchCourts();
    }
    const seen = new Map<string, VenueOption>();
    for (const court of courts) {
      if (court.venueId && !seen.has(court.venueId)) {
        seen.set(court.venueId, { id: court.venueId, name: court.venueName || court.courtName });
      }
    }
    this.venues = [...seen.values()];
    if (!this.selectedVenue && this.venues.length) {
      this.selectedVenue = this.venues[0];
    }
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toast.create({ message, duration: 1800, position: 'bottom' });
    await toast.present();
  }
}
