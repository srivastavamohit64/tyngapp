import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DiscoverPlayer, SearchVenue } from '../../core/models/api.model';
import { BookingService } from '../../core/services/booking.service';
import { SocialService } from '../../core/services/social.service';
import { VenueService } from '../../core/services/venue.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { SkeletonListComponent } from '../../shared/components/skeleton';

type SearchTab = 'all' | 'venues' | 'players' | 'coaches';
type ResultKind = 'venue' | 'player' | 'coach';

interface SearchRow {
  kind: ResultKind;
  id: string;
  name: string;
  subtitle: string;
  image?: string | null;
  emoji: string;
  raw: SearchVenue | DiscoverPlayer;
}

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, SkeletonListComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <div class="search-page">
        <header class="sp-header">
          <button type="button" class="sp-back" (click)="back()" aria-label="Back">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <div class="sp-input-wrap">
            <ion-icon name="search-outline"></ion-icon>
            <input
              #queryInput
              type="search"
              [(ngModel)]="query"
              (ngModelChange)="onQueryChange($event)"
              placeholder="Search venues, players, coaches"
              autocomplete="off"
            />
            <button *ngIf="query.trim()" type="button" class="sp-clear" (click)="clearQuery()" aria-label="Clear">
              <ion-icon name="close-circle"></ion-icon>
            </button>
          </div>
        </header>

        <div class="sp-tabs-wrap">
          <div class="sp-tabs">
            <button
              type="button"
              class="sp-tab"
              *ngFor="let item of tabs"
              [class.is-active]="tab === item.id"
              (click)="setTab(item.id)"
            >
              {{ item.label }}
              <span *ngIf="countFor(item.id)">{{ countFor(item.id) }}</span>
            </button>
          </div>
        </div>

        <div class="sp-body">
          <div *ngIf="loading && visibleRows.length === 0" class="sp-skel">
            <app-skeleton-list [count]="6"></app-skeleton-list>
          </div>

          <div class="sp-empty" *ngIf="!loading && visibleRows.length === 0">
            <div class="sp-empty-icon">🔍</div>
            <p class="sp-empty-title">{{ query.trim() ? 'No matches' : 'Nothing to show yet' }}</p>
            <p class="sp-empty-sub">
              {{ query.trim()
                ? ('No results for “' + query.trim() + '”. Try another name.')
                : 'Venues, players and coaches will appear here.' }}
            </p>
          </div>

          <div class="sp-list" *ngIf="visibleRows.length">
            <button
              type="button"
              class="sp-row"
              *ngFor="let row of visibleRows"
              (click)="openRow(row)"
            >
              <img *ngIf="photo(row.image)" [src]="photo(row.image)" alt="" />
              <div *ngIf="!photo(row.image)" class="sp-avatar" [attr.data-kind]="row.kind">{{ row.emoji }}</div>
              <div class="sp-copy">
                <div class="sp-copy-top">
                  <strong>{{ row.name }}</strong>
                  <span class="sp-kind" [attr.data-kind]="row.kind">{{ kindLabel(row.kind) }}</span>
                </div>
                <small>{{ row.subtitle }}</small>
              </div>
              <ion-icon name="chevron-forward"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .search-page {
      min-height: 100%;
      background: linear-gradient(180deg, #ffffff 0%, #f7f8fa 140px, #fafbfc 100%);
      padding-bottom: 120px;
    }

    .sp-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: calc(12px + var(--app-chrome-top-inset, var(--safe-area-top))) 16px 10px;
      background: transparent;
    }

    .sp-back {
      width: 42px;
      height: 42px;
      border: none;
      border-radius: 50%;
      background: #f3f4f6;
      display: grid;
      place-items: center;
      font-size: 18px;
      color: #111827;
      flex-shrink: 0;
    }

    .sp-input-wrap {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 8px;
      background: #f3f4f6;
      border-radius: 999px;
      padding: 0 14px;
      height: 48px;
      box-shadow: inset 0 0 0 1px rgba(17, 24, 39, 0.04);
    }

    .sp-input-wrap ion-icon { color: #9ca3af; font-size: 18px; flex-shrink: 0; }

    .sp-input-wrap input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      min-height: unset;
      padding: 0;
      margin: 0;
      box-shadow: none;
    }

    .sp-input-wrap input::placeholder { color: #9ca3af; font-weight: 500; }

    .sp-clear {
      border: none;
      background: transparent;
      padding: 0;
      display: grid;
      place-items: center;
      color: #9ca3af;
      font-size: 18px;
    }

    .sp-tabs-wrap {
      padding: 4px 16px 12px;
      position: sticky;
      top: 0;
      z-index: 2;
      background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(250,251,252,0.92));
      backdrop-filter: blur(8px);
    }

    .sp-tabs {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      scrollbar-width: none;
      padding-bottom: 2px;
    }

    .sp-tabs::-webkit-scrollbar { display: none; }

    .sp-tab {
      flex-shrink: 0;
      border: none;
      border-radius: 999px;
      padding: 9px 14px;
      font-size: 13px;
      font-weight: 800;
      color: #6b7280;
      background: #ffffff;
      box-shadow: 0 1px 2px rgba(17, 24, 39, 0.04), inset 0 0 0 1px #eef0f3;
    }

    .sp-tab.is-active {
      background: #111827;
      color: #fff;
      box-shadow: 0 6px 16px rgba(17, 24, 39, 0.18);
    }

    .sp-tab span {
      margin-left: 6px;
      font-size: 11px;
      opacity: 0.8;
    }

    .sp-body { padding: 0 16px; }

    .sp-skel { padding-top: 8px; }

    .sp-hint {
      margin: 18px 4px 0;
      color: #9ca3af;
      font-size: 13px;
      font-weight: 600;
    }

    .sp-empty {
      margin-top: 48px;
      text-align: center;
      padding: 0 20px;
    }

    .sp-empty-icon {
      width: 64px;
      height: 64px;
      margin: 0 auto 12px;
      border-radius: 20px;
      background: #f3f4f6;
      display: grid;
      place-items: center;
      font-size: 28px;
    }

    .sp-empty-title {
      margin: 0;
      font-size: 16px;
      font-weight: 900;
      color: #111827;
    }

    .sp-empty-sub {
      margin: 6px 0 0;
      font-size: 13px;
      font-weight: 600;
      color: #9ca3af;
      line-height: 1.4;
    }

    .sp-list {
      padding: 4px 0 0;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .sp-row {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      text-align: left;
      background: #ffffff;
      border: none;
      border-radius: 20px;
      padding: 12px;
      box-shadow: 0 8px 20px rgba(17, 24, 39, 0.05);
      cursor: pointer;
    }

    .sp-row img, .sp-avatar {
      width: 52px;
      height: 52px;
      border-radius: 16px;
      object-fit: cover;
      flex-shrink: 0;
    }

    .sp-avatar {
      display: grid;
      place-items: center;
      font-size: 22px;
      background: #f3f4f6;
    }

    .sp-avatar[data-kind='venue'] { background: #ecfdf5; }
    .sp-avatar[data-kind='player'] { background: #eff6ff; }
    .sp-avatar[data-kind='coach'] { background: #fff7ed; }

    .sp-copy { flex: 1; min-width: 0; }

    .sp-copy-top {
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }

    .sp-copy strong {
      display: block;
      font-size: 14px;
      font-weight: 800;
      color: #111827;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }

    .sp-kind {
      flex-shrink: 0;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      padding: 3px 7px;
      border-radius: 999px;
      background: #f3f4f6;
      color: #6b7280;
    }

    .sp-kind[data-kind='venue'] { background: #dcfce7; color: #15803d; }
    .sp-kind[data-kind='player'] { background: #dbeafe; color: #1d4ed8; }
    .sp-kind[data-kind='coach'] { background: #ffedd5; color: #c2410c; }

    .sp-copy small {
      display: block;
      margin-top: 3px;
      color: #9ca3af;
      font-size: 12px;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .sp-row > ion-icon {
      color: #d1d5db;
      font-size: 16px;
      flex-shrink: 0;
    }
  `],
})
export class SearchPage implements OnInit, AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly social = inject(SocialService);
  private readonly venueService = inject(VenueService);

  @ViewChild('queryInput') queryInput?: ElementRef<HTMLInputElement>;

  readonly tabs: { id: SearchTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'venues', label: 'Venues' },
    { id: 'players', label: 'Players' },
    { id: 'coaches', label: 'Coaches' },
  ];

  query = '';
  tab: SearchTab = 'all';
  loading = false;
  venues: SearchVenue[] = [];
  players: DiscoverPlayer[] = [];
  coaches: DiscoverPlayer[] = [];

  private timer?: ReturnType<typeof setTimeout>;
  private requestId = 0;

  ngOnInit(): void {
    const initial = (this.route.snapshot.queryParamMap.get('q') || '').trim();
    this.query = initial;
    void this.runSearch(initial);
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.queryInput?.nativeElement.focus(), 80);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  get visibleRows(): SearchRow[] {
    const rows = this.buildRows();
    if (this.tab === 'all') return rows;
    const kind = this.tab === 'venues' ? 'venue' : this.tab === 'players' ? 'player' : 'coach';
    return rows.filter((row) => row.kind === kind);
  }

  countFor(tab: SearchTab): number {
    if (tab === 'all') return this.venues.length + this.players.length + this.coaches.length;
    if (tab === 'venues') return this.venues.length;
    if (tab === 'players') return this.players.length;
    return this.coaches.length;
  }

  setTab(tab: SearchTab): void {
    this.tab = tab;
  }

  onQueryChange(value: string): void {
    this.query = value ?? '';
    if (this.timer) clearTimeout(this.timer);
    this.loading = true;
    this.timer = setTimeout(() => void this.runSearch(this.query.trim()), 280);
  }

  clearQuery(): void {
    this.query = '';
    void this.runSearch('');
  }

  back(): void {
    void this.router.navigateByUrl('/app/home');
  }

  openRow(row: SearchRow): void {
    if (row.kind === 'venue') {
      void this.router.navigateByUrl(`/app/venue/${row.id}`);
      return;
    }
    if (row.kind === 'player') {
      void this.router.navigateByUrl(`/app/player/${row.id}`, { state: { player: row.raw } });
      return;
    }
    void this.router.navigateByUrl(`/app/coaches/${row.id}`);
  }

  photo(url?: string | null): string | null {
    return resolveMediaUrl(url);
  }

  kindLabel(kind: ResultKind): string {
    if (kind === 'venue') return 'Venue';
    if (kind === 'player') return 'Player';
    return 'Coach';
  }

  private sportsLabel(person: DiscoverPlayer): string {
    const sports = person.sports || person.preferredSports || [];
    return sports.slice(0, 2).join(', ') || person.skillLevel || 'Sports';
  }

  private buildRows(): SearchRow[] {
    const venues: SearchRow[] = this.venues.map((venue) => ({
      kind: 'venue' as const,
      id: String(venue.id),
      name: venue.name || 'Venue',
      subtitle: venue.city || venue.location || 'Venue',
      image: venue.profileImage,
      emoji: '🏟️',
      raw: venue,
    }));

    const players: SearchRow[] = this.players.map((player) => ({
      kind: 'player' as const,
      id: String(player.id),
      name: player.name || 'Player',
      subtitle: `${player.city || 'Player'} · ${this.sportsLabel(player)}`,
      image: player.profileImage,
      emoji: '👤',
      raw: player,
    }));

    const coaches: SearchRow[] = this.coaches.map((coach) => ({
      kind: 'coach' as const,
      id: String(coach.id),
      name: coach.name || 'Coach',
      subtitle: `${coach.city || 'Coach'} · ${this.sportsLabel(coach)}`,
      image: coach.profileImage,
      emoji: '🎓',
      raw: coach,
    }));

    return [...venues, ...players, ...coaches].sort((a, b) =>
      a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
    );
  }

  private sortByName<T extends { name?: string | null }>(items: T[]): T[] {
    return [...items].sort((a, b) =>
      String(a.name || '').localeCompare(String(b.name || ''), undefined, { sensitivity: 'base' }),
    );
  }

  private async runSearch(needle: string): Promise<void> {
    const id = ++this.requestId;
    this.loading = true;

    try {
      const response = await firstValueFrom(this.bookingService.search(needle, 50));
      if (id !== this.requestId) return;

      let venues = response.data?.venues || [];
      let players = response.data?.players || [];
      let coaches = response.data?.coaches || [];

      // Empty browse: enrich from directory endpoints when /search returns little.
      if (!needle) {
        const enriched = await this.loadDirectoryFallback(venues, players, coaches);
        venues = enriched.venues;
        players = enriched.players;
        coaches = enriched.coaches;
      }

      this.venues = this.sortByName(venues);
      this.players = this.sortByName(players);
      this.coaches = this.sortByName(coaches);
    } catch {
      if (id !== this.requestId) return;
      if (!needle) {
        try {
          const enriched = await this.loadDirectoryFallback([], [], []);
          this.venues = this.sortByName(enriched.venues);
          this.players = this.sortByName(enriched.players);
          this.coaches = this.sortByName(enriched.coaches);
        } catch {
          this.venues = [];
          this.players = [];
          this.coaches = [];
        }
      } else {
        this.venues = [];
        this.players = [];
        this.coaches = [];
      }
    } finally {
      if (id === this.requestId) this.loading = false;
    }
  }

  private async loadDirectoryFallback(
    venues: SearchVenue[],
    players: DiscoverPlayer[],
    coaches: DiscoverPlayer[],
  ): Promise<{ venues: SearchVenue[]; players: DiscoverPlayer[]; coaches: DiscoverPlayer[] }> {
    const [venueRes, discoverRes] = await Promise.all([
      firstValueFrom(this.venueService.getCourts()).catch(() => null),
      firstValueFrom(this.social.getDiscoverPlayers('per_page=40')).catch(() => null),
    ]);

    const courtCards = Array.isArray(venueRes?.data) ? venueRes!.data : [];
    const mappedVenues: SearchVenue[] = courtCards.map((court: any) => ({
      id: String(court.venueId || court.venue_id || court.id),
      name: String(court.venueName || court.venue_name || court.name || 'Venue'),
      city: court.city || null,
      location: court.location || court.address || null,
      profileImage: court.image || court.profileImage || null,
      sports: Array.isArray(court.sports) ? court.sports : undefined,
      rating: court.rating ?? null,
      price: court.pricePerHour ?? court.price ?? null,
    }));

    const discoverItems = Array.isArray(discoverRes?.data?.items) ? discoverRes!.data!.items : [];
    const mappedPlayers = discoverItems.filter((item) => {
      const role = String((item as any).role || 'player').toLowerCase();
      return role !== 'coach';
    });
    const mappedCoaches = discoverItems.filter((item) => {
      const role = String((item as any).role || '').toLowerCase();
      return role === 'coach';
    });

    return {
      venues: this.mergeById(venues, mappedVenues),
      players: this.mergeById(players, mappedPlayers.length ? mappedPlayers : discoverItems),
      coaches: this.mergeById(coaches, mappedCoaches),
    };
  }

  private mergeById<T extends { id: string | number }>(primary: T[], secondary: T[]): T[] {
    const map = new Map<string, T>();
    [...primary, ...secondary].forEach((item) => {
      const key = String(item.id);
      if (!key || map.has(key)) return;
      map.set(key, item);
    });
    return Array.from(map.values());
  }
}
