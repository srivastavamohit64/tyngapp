import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InfiniteScrollCustomEvent, IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CoachDirectoryItem, CoachDirectoryResponse } from '../../core/models/api.model';
import { AuthService } from '../../core/services/auth.service';
import { CoachService } from '../../core/services/coach.service';
import { UiChromeService } from '../../core/services/ui-chrome.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

type CoachSort = 'recommended' | 'top' | 'nearest' | 'soonest' | 'price' | 'experience';
type FilterKey = 'sports' | 'session_types' | 'experience' | 'max_distance' | 'price' | 'availability' | 'min_rating' | 'languages';

interface CoachCard {
  id: number;
  name: string;
  initials: string;
  photo: string | null;
  sportLine: string;
  specialties: string;
  rating: number | null;
  reviewCount: number;
  experience: string | null;
  sessions: number;
  students: number;
  place: string | null;
  idVerified: boolean;
  certified: boolean;
  isNew: boolean;
  next: string | null;
  price: number | null;
  priceNote: string;
}

interface FilterGroup {
  key: FilterKey;
  title: string;
  multi: boolean;
  options: Array<{ value: string; label: string }>;
}

const SPORT_ICONS: Record<string, string> = {
  football: 'football-outline',
  cricket: 'locate-outline',
  badminton: 'pulse-outline',
  tennis: 'tennisball-outline',
  tabletennis: 'tennisball-outline',
  basketball: 'basketball-outline',
  swimming: 'water-outline',
  volleyball: 'baseball-outline',
  golf: 'golf-outline',
};

const SPORT_NAMES: Record<string, string> = { tabletennis: 'Table Tennis' };

const FORMAT_LABELS: Record<string, string> = {
  classes: 'Regular Classes',
  oneOnOne: 'One-on-One',
  flexible: 'Flexible Sessions',
};

const SORT_OPTIONS: Array<{ value: CoachSort; label: string }> = [
  { value: 'recommended', label: 'RECOMMENDED' },
  { value: 'top', label: 'TOP RATED' },
  { value: 'nearest', label: 'NEAREST' },
  { value: 'soonest', label: 'AVAILABLE SOONEST' },
  { value: 'price', label: 'PRICE LOW–HIGH' },
  { value: 'experience', label: 'MOST EXPERIENCED' },
];

@Component({
  selector: 'app-coaches',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent],
  templateUrl: './coaches.page.html',
  styleUrls: ['./coaches.page.scss'],
})
export class CoachesPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly coachService = inject(CoachService);
  private readonly auth = inject(AuthService);
  private readonly chrome = inject(UiChromeService);

  query = '';
  sort: CoachSort = 'recommended';
  selected: Record<FilterKey, string[]> = this.emptyFilters();
  draft: Record<FilterKey, string[]> = this.emptyFilters();
  verifiedOnly = false;
  draftVerified = false;
  savedOnly = false;
  draftSaved = false;
  sheet: 'filters' | 'sort' | null = null;

  coaches: CoachCard[] = [];
  featured: CoachCard | null = null;
  facets: CoachDirectoryResponse['facets'] = { sports: [], sessionTypes: [], languages: [], experienceLevels: [], hasDistance: false };
  total = 0;
  page = 1;
  lastPage = 1;
  loading = true;
  error = '';
  invitations: any[] = [];

  private searchTimer?: ReturnType<typeof setTimeout>;
  private requestId = 0;

  ngOnInit(): void {
    void this.load();
    void this.loadFeatured();
  }

  ionViewWillEnter(): void {
    this.loadInvitations();
  }

  ionViewWillLeave(): void {
    this.closeSheet();
  }

  ngOnDestroy(): void {
    this.closeSheet();
    clearTimeout(this.searchTimer);
  }

  get sportChips(): Array<{ value: string; label: string; icon: string }> {
    return [
      { value: 'all', label: 'ALL', icon: 'barbell-outline' },
      ...this.facets.sports.map((sport) => ({
        value: sport,
        label: this.sportName(sport).toUpperCase(),
        icon: SPORT_ICONS[sport] ?? 'trophy-outline',
      })),
    ];
  }

  get activeSport(): string {
    return this.selected.sports.length === 1 ? this.selected.sports[0] : this.selected.sports.length ? '' : 'all';
  }

  get hasFilters(): boolean {
    return this.verifiedOnly || this.savedOnly || Object.values(this.selected).some((values) => values.length > 0);
  }

  get showFeatured(): boolean {
    return !!this.featured && !this.query.trim() && !this.hasFilters;
  }

  get sortOptions(): Array<{ value: CoachSort; label: string }> {
    return SORT_OPTIONS.filter((option) => option.value !== 'nearest' || this.facets.hasDistance);
  }

  get sortLabel(): string {
    return SORT_OPTIONS.find((option) => option.value === this.sort)?.label ?? 'RECOMMENDED';
  }

  get resultLabel(): string {
    if (this.loading) return 'Finding coaches…';
    return `${this.total} ${this.total === 1 ? 'coach matches' : 'coaches match'} your search`;
  }

  get filterGroups(): FilterGroup[] {
    const groups: FilterGroup[] = [];
    if (this.facets.sports.length) {
      groups.push({ key: 'sports', title: 'SPORT', multi: true, options: this.facets.sports.map((s) => ({ value: s, label: this.sportName(s) })) });
    }
    if (this.facets.sessionTypes.length) {
      groups.push({ key: 'session_types', title: 'SESSION TYPE', multi: true, options: this.facets.sessionTypes.map((t) => ({ value: t, label: t })) });
    }
    groups.push({
      key: 'experience',
      title: 'COACH EXPERIENCE',
      multi: true,
      options: [
        { value: 'rising', label: 'Rising • 0–3 yrs' },
        { value: 'experienced', label: 'Experienced • 4–10 yrs' },
        { value: 'elite', label: 'Elite • 10+ yrs' },
      ],
    });
    const me = this.auth.user();
    if (this.facets.hasDistance && me?.latitude != null && me?.longitude != null) {
      groups.push({
        key: 'max_distance',
        title: 'DISTANCE',
        multi: false,
        options: [
          { value: '2', label: 'Nearby' },
          { value: '5', label: '< 5 km' },
          { value: '10', label: '< 10 km' },
          { value: '20', label: '< 20 km' },
        ],
      });
    }
    groups.push(
      {
        key: 'price',
        title: 'PRICE',
        multi: true,
        options: [
          { value: 'under500', label: 'Under ₹500' },
          { value: '500-750', label: '₹500–₹750' },
          { value: '750-1000', label: '₹750–₹1,000' },
          { value: '1000plus', label: '₹1,000+' },
        ],
      },
      {
        key: 'availability',
        title: 'SESSION AVAILABILITY',
        multi: true,
        options: [
          { value: 'today', label: 'Today' },
          { value: 'tomorrow', label: 'Tomorrow' },
          { value: 'week', label: 'This Week' },
          { value: 'weekend', label: 'Weekend' },
        ],
      },
      { key: 'min_rating', title: 'RATING', multi: false, options: [{ value: '4', label: '4+' }, { value: '4.5', label: '4.5+' }] },
    );
    if (this.facets.languages.length) {
      groups.push({ key: 'languages', title: 'LANGUAGE', multi: true, options: this.facets.languages.map((l) => ({ value: l, label: l })) });
    }
    return groups;
  }

  async refresh(event: Event): Promise<void> {
    await Promise.all([this.load(), this.loadFeatured()]);
    this.loadInvitations();
    (event as RefresherCustomEvent).target.complete();
  }

  async loadMore(event: Event): Promise<void> {
    if (this.page < this.lastPage) await this.load(false);
    (event as InfiniteScrollCustomEvent).target.complete();
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.load(), 300);
  }

  selectSport(value: string): void {
    this.selected = { ...this.selected, sports: value === 'all' ? [] : [value] };
    void this.load();
  }

  openFilters(): void {
    this.draft = this.cloneFilters(this.selected);
    this.draftVerified = this.verifiedOnly;
    this.draftSaved = this.savedOnly;
    this.openSheet('filters');
  }

  openSort(): void {
    this.openSheet('sort');
  }

  isDraftSelected(key: FilterKey, value: string): boolean {
    return this.draft[key].includes(value);
  }

  toggleDraft(group: FilterGroup, value: string): void {
    const values = this.draft[group.key];
    this.draft[group.key] = values.includes(value)
      ? values.filter((v) => v !== value)
      : group.multi
        ? [...values, value]
        : [value];
  }

  clearDraft(): void {
    this.draft = this.emptyFilters();
    this.draftVerified = false;
    this.draftSaved = false;
  }

  applyFilters(): void {
    this.selected = this.cloneFilters(this.draft);
    this.verifiedOnly = this.draftVerified;
    this.savedOnly = this.draftSaved;
    this.closeSheet();
    void this.load();
  }

  clearAll(): void {
    this.query = '';
    this.selected = this.emptyFilters();
    this.verifiedOnly = false;
    this.savedOnly = false;
    void this.load();
  }

  chooseSort(value: CoachSort): void {
    this.sort = value;
    this.closeSheet();
    void this.load();
  }

  viewCoach(coach: CoachCard, book = false): void {
    void this.router.navigate(['/app/coaches', coach.id], book ? { queryParams: { book: 1 } } : {});
  }

  openInvitation(token: string): void {
    void this.router.navigateByUrl(`/app/coach-invite/${encodeURIComponent(token)}`);
  }

  photo(url?: string | null): string | null {
    return resolveMediaUrl(url);
  }

  closeSheet(): void {
    if (this.sheet) this.chrome.closeOverlay();
    this.sheet = null;
  }

  private openSheet(sheet: 'filters' | 'sort'): void {
    if (!this.sheet) this.chrome.openOverlay();
    this.sheet = sheet;
  }

  private loadInvitations(): void {
    this.coachService.getMyCoachInvitations().subscribe({
      next: (response) => {
        this.invitations = Array.isArray(response.data) ? response.data : [];
      },
      error: () => {
        this.invitations = [];
      },
    });
  }

  private async loadFeatured(): Promise<void> {
    const res = await firstValueFrom(this.coachService.listCoaches({ sort: 'recommended', per_page: 1 })).catch(() => null);
    const first = res?.data?.data?.[0];
    this.featured = first ? this.toCard(first) : null;
  }

  private async load(reset = true): Promise<void> {
    const requestId = ++this.requestId;
    if (reset) {
      this.loading = true;
      this.error = '';
    }
    const page = reset ? 1 : this.page + 1;
    try {
      const res = await firstValueFrom(this.coachService.listCoaches(this.buildQuery(page)));
      if (requestId !== this.requestId) return;
      if (!res.success || !res.data) {
        this.error = res.message || 'Unable to load coaches.';
        return;
      }
      const cards = res.data.data.map((item) => this.toCard(item));
      this.coaches = reset ? cards : [...this.coaches, ...cards];
      this.page = res.data.current_page;
      this.lastPage = res.data.last_page;
      this.total = res.data.total;
      if (res.data.facets) this.facets = res.data.facets;
    } catch (error: any) {
      if (requestId === this.requestId) this.error = error?.error?.message || 'Unable to load coaches. Please try again.';
    } finally {
      if (requestId === this.requestId) this.loading = false;
    }
  }

  private buildQuery(page: number): Record<string, string | number | boolean | undefined> {
    const join = (key: FilterKey) => this.selected[key].join(',') || undefined;
    return {
      page,
      per_page: 20,
      sort: this.sort,
      search: this.query.trim() || undefined,
      sports: join('sports'),
      session_types: join('session_types'),
      experience: join('experience'),
      max_distance: this.selected.max_distance[0],
      price: join('price'),
      availability: join('availability'),
      min_rating: this.selected.min_rating[0],
      languages: join('languages'),
      verified: this.verifiedOnly ? 1 : undefined,
      saved: this.savedOnly ? 1 : undefined,
    };
  }

  private toCard(item: CoachDirectoryItem): CoachCard {
    const name = (item.name || 'TYNG Coach').trim();
    const sports = (item.sports ?? []).map((sport) => this.sportName(sport));
    const specialties = item.sessionTypes?.length
      ? item.sessionTypes
      : (item.formats ?? []).map((format) => FORMAT_LABELS[format] ?? format);
    const place = item.distanceKm != null ? `${item.distanceKm} km away` : item.area;
    return {
      id: item.id,
      name,
      initials: name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join(''),
      photo: resolveMediaUrl(item.profileImage),
      sportLine: sports.slice(0, 2).join(' • ').toUpperCase() || 'MULTI-SPORT',
      specialties: specialties.join(' • '),
      rating: item.rating,
      reviewCount: item.reviewCount ?? 0,
      experience: item.experienceYears || item.experienceLabel,
      sessions: item.sessionsCompleted ?? 0,
      students: item.activeStudents ?? 0,
      place,
      idVerified: !!item.idVerified,
      certified: !!item.certified,
      isNew: !!item.isNew,
      next: this.nextLabel(item.nextAvailable),
      price: item.pricePerHour,
      priceNote: item.feesNegotiable ? 'NEGOTIABLE' : '',
    };
  }

  private nextLabel(next: CoachDirectoryItem['nextAvailable']): string | null {
    if (!next) return null;
    const [y, m, d] = next.date.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = Math.round((date.getTime() - today.getTime()) / 86_400_000);
    const day = days <= 0 ? 'Today' : days === 1 ? 'Tomorrow' : date.toLocaleDateString('en-IN', { weekday: 'long' });
    return `${day} • ${next.slot}`;
  }

  private sportName(sport: string): string {
    const key = String(sport).toLowerCase();
    return SPORT_NAMES[key] ?? key.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private emptyFilters(): Record<FilterKey, string[]> {
    return { sports: [], session_types: [], experience: [], max_distance: [], price: [], availability: [], min_rating: [], languages: [] };
  }

  private cloneFilters(source: Record<FilterKey, string[]>): Record<FilterKey, string[]> {
    const copy = this.emptyFilters();
    (Object.keys(copy) as FilterKey[]).forEach((key) => (copy[key] = [...source[key]]));
    return copy;
  }
}
