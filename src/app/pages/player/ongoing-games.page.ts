import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { firstValueFrom, Subscription } from 'rxjs';
import { BookingRecord } from '../../core/models/api.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { LocationService } from '../../core/services/location.service';
import { RealtimeService } from '../../core/services/realtime.service';
import {
  formatBookingDate,
  formatBookingTime,
  formatDurationLabel,
  sportEmoji,
} from '../../core/utils/booking.utils';
import { PageSkeletonComponent } from '../../shared/components/skeleton';


interface Game {
  id: string;
  sport: string;
  emoji: string;
  venue: string;
  address: string;
  distance: string;
  date: string;
  bookingDate: string;
  time: string;
  duration: string;
  image: string;
  hostName: string;
  hostPhoto: string;
  isCaptain: boolean;
  playersJoined: number;
  maxPlayers: number;
  costPerPlayer: number;
  gameType: string;
  difficulty: string;
  weather: string;
  isIndoor: boolean;
  bookingStatus: string;
}

const FILTERS = ['All', 'Today', 'Tomorrow', 'Nearby'];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  Competitive: { bg: '#FFF7ED', color: '#C2410C' },
  Recreational: { bg: '#F0FDF4', color: '#16A34A' },
  Practice: { bg: '#EFF6FF', color: '#1D4ED8' },
  Casual: { bg: '#F5F3FF', color: '#7C3AED' },
};

const DIFF_COLORS: Record<string, string> = {
  Beginner: '#22C55E',
  Intermediate: '#F59E0B',
  Advanced: '#EF4444',
};

const SPORT_IMAGES: Record<string, string> = {
  cricket: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=400&fit=crop&auto=format',
  football: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=400&fit=crop&auto=format',
  basketball: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=700&h=400&fit=crop&auto=format',
  badminton: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=400&fit=crop&auto=format',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=700&h=400&fit=crop&auto=format',
};

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&auto=format';

@Component({
  selector: 'app-ongoing-games',
  standalone: true,
  imports: [CommonModule, IonicModule, PageSkeletonComponent],
  template: `
    <ion-content [fullscreen]="true">
      <div class="ongoing-page">

        <!-- Header -->
        <div class="og-header">
          <button class="og-back" (click)="back()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <div class="og-header-text">
            <h1 class="og-title">Ongoing Games</h1>
            <p class="og-location" *ngIf="locationLabel">Near {{ locationLabel }}</p>
          </div>
          <button class="og-filter-btn">
            <ion-icon name="options-outline"></ion-icon>
          </button>
        </div>

        <!-- Search -->
        <div class="og-search-wrap">
          <div class="og-search">
            <ion-icon name="search-outline" class="search-icon"></ion-icon>
            <input type="text" placeholder="Search games, venues..." class="search-input" />
          </div>
        </div>

        <!-- Filter chips -->
        <div class="filter-scroll">
          <div class="filter-track">
            <button
              *ngFor="let f of filterOptions"
              class="filter-chip"
              [class.filter-chip-active]="activeFilter() === f"
              (click)="setFilter(f)"
            >{{ f }}</button>
          </div>
        </div>

        <!-- Live Map Banner -->
        <div class="live-map-banner">
          <div #miniMapContainer class="mini-google-map" aria-label="Nearby games map"></div>
          <div class="map-overlay">
            <div class="map-info">
              <div class="live-badge">
                <span class="live-dot"></span>
                <span>LIVE</span>
              </div>
              <div class="map-count">{{ games.length }} active games nearby</div>
              <div class="map-sub">Tap a pin for game details</div>
              <button type="button" class="open-map-cta" (click)="openFullMap()">Open full map</button>
            </div>
          </div>
        </div>

        <!-- Games count -->
        <div class="games-count-row">
          <span class="games-count">{{ filteredGames.length }} games found</span>
          <button class="sort-btn">
            <ion-icon name="swap-vertical-outline"></ion-icon>
            Sort
          </button>
        </div>

        <div class="px-4 pt-2" *ngIf="loading && filteredGames.length === 0">
          <app-page-skeleton variant="cards" [count]="4" label="Loading games"></app-page-skeleton>
        </div>
        <div class="games-state" *ngIf="!loading && errorMessage">
          <p>{{ errorMessage }}</p>
          <button type="button" class="retry-btn" (click)="loadGames()">Retry</button>
        </div>
        <div class="games-state" *ngIf="!loading && !errorMessage && filteredGames.length === 0">
          {{ locationLabel
            ? 'No open games near ' + locationLabel + '. Create a game to invite others.'
            : 'Set your location on Home to see nearby games.' }}
        </div>

        <!-- Game Cards -->
        <div class="games-list">
          <div
            *ngFor="let game of filteredGames"
            class="game-card"
            (click)="viewGame(game.id)"
          >
            <!-- Hero image -->
            <div class="card-hero">
              <img [src]="game.image" [alt]="game.sport" class="card-img" />
              <div class="card-img-overlay"></div>

              <!-- Type + difficulty badges -->
              <div class="card-badges-top">
                <span class="type-badge"
                  [style.background]="getTypeStyle(game.gameType).bg"
                  [style.color]="getTypeStyle(game.gameType).color">
                  {{ game.gameType }}
                </span>
                <span class="diff-badge" [style.color]="getDiffColor(game.difficulty)">
                  {{ game.difficulty }}
                </span>
              </div>

              <!-- Distance -->
              <div class="distance-badge">
                <ion-icon name="location-outline" style="font-size:10px;"></ion-icon>
                {{ game.distance }}
              </div>

              <!-- Date/time bottom left -->
              <div class="time-badge">
                <span class="time-date">{{ game.date }}</span>
                <span class="time-sep">·</span>
                <ion-icon name="time-outline" style="font-size:10px;"></ion-icon>
                <span>{{ game.time }}</span>
              </div>
              <div *ngIf="game.bookingStatus === 'pending'" class="pending-badge">Awaiting venue</div>

              <!-- Sport emoji bottom right -->
              <div class="sport-emoji-circle">{{ game.emoji }}</div>
            </div>

            <!-- Card body -->
            <div class="card-body">
              <!-- Venue -->
              <div class="venue-row">
                <div class="venue-info">
                  <div class="venue-name">{{ game.venue }}</div>
                  <div class="venue-addr">
                    <ion-icon name="location-outline" style="font-size:11px;color:#9CA3AF;"></ion-icon>
                    {{ game.address }}
                  </div>
                </div>
                <div class="price-box">
                  <div class="price-amt">{{ game.costPerPlayer > 0 ? ('₹' + game.costPerPlayer) : 'Free' }}</div>
                  <div class="price-label">per player</div>
                </div>
              </div>

              <!-- Host -->
              <div class="host-row">
                <img [src]="game.hostPhoto" [alt]="game.hostName" class="host-img" />
                <span class="host-name">{{ game.hostName }}</span>
                <span *ngIf="game.isCaptain" class="captain-badge">🛡 Captain</span>
                <span class="duration">{{ game.duration }}</span>
              </div>

              <!-- Players progress -->
              <div class="players-section">
                <div class="players-header">
                  <div class="players-count">
                    <ion-icon name="people-outline" style="font-size:12px;color:#6B7280;"></ion-icon>
                    <strong>{{ game.playersJoined }}/{{ game.maxPlayers }}</strong>
                    <span>players joined</span>
                  </div>
                  <span *ngIf="getSpotsLeft(game) <= 3 && getSpotsLeft(game) > 0" class="spots-badge">{{ getSpotsLeft(game) }} spots left!</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width]="getPercent(game) + '%'" [style.background]="getProgressColor(game)"></div>
                </div>
              </div>

              <!-- Join button -->
              <button class="join-btn" (click)="viewGame(game.id)">
                {{ game.costPerPlayer > 0 ? ('Join Game · ₹' + game.costPerPlayer) : 'Join Game · Free' }}
              </button>
            </div>
          </div>
        </div>

        <div style="height: 120px;"></div>
      </div>
    </ion-content>
  `,
  styles: [`
    .ongoing-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .og-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: calc(16px + var(--app-chrome-top-inset, var(--safe-area-top))) 20px 16px;
      background: #FFFFFF;
    }

    .og-back, .og-filter-btn {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #F3F4F6;
      border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; cursor: pointer;
    }

    .og-header-text {
      flex: 1;
      text-align: center;
      min-width: 0;
      padding: 0 8px;
    }

    .og-title {
      font-size: 20px;
      font-weight: 900;
      color: #111827;
      margin: 0;
    }

    .og-location {
      margin: 2px 0 0;
      font-size: 11px;
      font-weight: 600;
      color: #6b7280;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .og-search-wrap {
      padding: 12px 20px;
      background: #FFFFFF;
    }

    .og-search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      font-size: 18px;
      color: #9CA3AF;
    }

    .search-input {
      width: 100%;
      height: 46px;
      padding-left: 44px;
      padding-right: 16px;
      background: #F3F4F6;
      border: none;
      border-radius: 14px;
      font-size: 14px;
      color: #111827;
      outline: none;
    }

    .filter-scroll {
      overflow-x: auto;
      padding: 10px 20px 12px;
      background: #FFFFFF;
    }

    .filter-scroll::-webkit-scrollbar { display: none; }

    .filter-track {
      display: flex;
      gap: 8px;
      width: max-content;
    }

    .filter-chip {
      padding: 7px 16px;
      border-radius: 999px;
      border: 1.5px solid #E5E7EB;
      background: #FFFFFF;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .filter-chip-active {
      background: #111827;
      border-color: #111827;
      color: #FFFFFF;
    }

    /* Live Map Banner */
    .live-map-banner {
      margin: 16px;
      border-radius: 24px;
      overflow: hidden;
      position: relative;
      height: 180px;
      background: #E8EEF5;
    }

    .mini-google-map {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .map-overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 16px;
      background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
      pointer-events: none;
      z-index: 2;
    }

    .map-info { color: white; }

    .open-map-cta {
      pointer-events: auto;
      margin-top: 8px;
      border: 0;
      border-radius: 999px;
      padding: 6px 12px;
      background: var(--app-primary);
      color: #111827;
      font-size: 11px;
      font-weight: 800;
      cursor: pointer;
    }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(4px);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .live-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: var(--app-primary);
      animation: pulse 1.2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .map-count {
      font-size: 16px;
      font-weight: 800;
    }

    .map-sub {
      font-size: 11px;
      opacity: 0.8;
    }

    /* Games count row */
    .games-count-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 20px 10px;
    }

    .games-count {
      font-size: 12px;
      font-weight: 600;
      color: #9CA3AF;
    }

    .sort-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 700;
      color: #6B7280;
      background: none;
      border: none;
      cursor: pointer;
    }

    /* Games list */
    .games-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 0 16px;
    }

    .game-card {
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
      cursor: pointer;
    }

    .card-hero {
      position: relative;
      height: 160px;
      overflow: hidden;
      background: #E5E7EB;
    }

    .card-img {
      width: 100%; height: 100%;
      object-fit: cover;
    }

    .card-img-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
    }

    .card-badges-top {
      position: absolute;
      top: 12px; left: 12px;
      display: flex; gap: 6px;
    }

    .type-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
    }

    .diff-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.9);
    }

    .distance-badge {
      position: absolute;
      top: 12px; right: 12px;
      display: flex; align-items: center; gap: 3px;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
      color: white;
    }

    .time-badge {
      position: absolute;
      bottom: 12px; left: 12px;
      display: flex; align-items: center; gap: 4px;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      color: white;
    }

    .time-sep { opacity: 0.6; }

    .pending-badge {
      position: absolute;
      top: 12px;
      left: 12px;
      background: #FFF7ED;
      color: #C2410C;
      border: 1px solid #FDBA74;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      z-index: 2;
    }

    .sport-emoji-circle {
      position: absolute;
      bottom: 12px; right: 12px;
      width: 32px; height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }

    .card-body {
      padding: 14px 16px 16px;
    }

    .venue-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .venue-info { flex: 1; min-width: 0; margin-right: 8px; }

    .venue-name {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .venue-addr {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-top: 2px;
      font-size: 11px;
      color: #9CA3AF;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .price-box { text-align: right; flex-shrink: 0; }
    .price-amt { font-size: 17px; font-weight: 900; color: #111827; }
    .price-label { font-size: 10px; color: #9CA3AF; }

    .host-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
    }

    .host-img {
      width: 24px; height: 24px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .host-name {
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      flex: 1;
    }

    .captain-badge {
      font-size: 9px;
      font-weight: 700;
      color: #FF7A00;
      background: #FFF7ED;
      padding: 2px 8px;
      border-radius: 999px;
    }

    .duration {
      font-size: 11px;
      color: #6B7280;
      font-weight: 500;
    }

    .players-section { margin-bottom: 12px; }

    .players-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .players-count {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #9CA3AF;
    }

    .players-count strong { color: #111827; font-weight: 700; }

    .spots-badge {
      font-size: 10px;
      font-weight: 700;
      color: #EF4444;
      background: #FEF2F2;
      padding: 2px 8px;
      border-radius: 999px;
    }

    .progress-bar {
      height: 5px;
      background: #F3F4F6;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.4s ease;
    }

    .join-btn {
      width: 100%;
      height: 46px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--app-primary), var(--app-primary-to));
      color: #111827;
      font-size: 14px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(var(--app-primary-rgb),0.3);
    }

    .games-state {
      margin: 0 20px 12px;
      padding: 16px;
      border-radius: 16px;
      background: #fff;
      border: 1px solid #f3f4f6;
      color: #6b7280;
      font-size: 13px;
      font-weight: 600;
      text-align: center;
    }

    .games-state .retry-btn {
      margin-top: 12px;
      border: none;
      border-radius: 12px;
      background: #111827;
      color: #fff;
      font-size: 12px;
      font-weight: 800;
      padding: 10px 16px;
      cursor: pointer;
    }
  `]
})
export class OngoingGamesPage implements OnInit, AfterViewInit, OnDestroy, ViewWillEnter {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly auth = inject(AuthService);
  private readonly googleMaps = inject(GoogleMapsService);
  private readonly locationService = inject(LocationService);
  private readonly realtime = inject(RealtimeService);
  private readonly zone = inject(NgZone);

  @ViewChild('miniMapContainer') miniMapContainer?: ElementRef<HTMLDivElement>;

  readonly filterOptions = FILTERS;
  readonly activeFilter = signal('All');
  games: Game[] = [];
  loading = true;
  errorMessage = '';
  locationLabel = '';

  private bookings: BookingRecord[] = [];
  private realtimeSub?: Subscription;
  private miniMap?: google.maps.Map;
  private readonly miniMarkers: google.maps.Marker[] = [];
  private readonly miniListeners: google.maps.MapsEventListener[] = [];
  private readonly lucknowCenter: google.maps.LatLngLiteral = { lat: 26.8467, lng: 80.9462 };

  ngOnInit() {
    this.listenForRealtimeGames();
  }

  ionViewWillEnter() {
    void this.loadGames();
  }

  ngAfterViewInit() {
    // Map is initialized after bookings load.
  }

  ngOnDestroy() {
    this.realtimeSub?.unsubscribe();
    this.clearMiniMarkers();
  }

  private listenForRealtimeGames() {
    void this.realtime.connect();
    this.realtimeSub = this.realtime.nearbyGames$.subscribe((event) => {
      const booking = event.game;
      const index = this.bookings.findIndex((item) => item.id === booking.id);
      if (index >= 0) {
        this.bookings = [
          ...this.bookings.slice(0, index),
          booking,
          ...this.bookings.slice(index + 1),
        ];
      } else if (event.type === 'created') {
        if (!this.bookingMatchesHomeLocation(booking)) return;
        this.bookings = [booking, ...this.bookings];
      } else {
        return;
      }
      this.games = this.bookings.map((item) => this.mapGame(item));
      this.errorMessage = '';
      void this.renderMiniMap();
    });
  }

  get filteredGames() {
    const filter = this.activeFilter();
    if (filter === 'All' || filter === 'Nearby') return this.games;

    const today = this.localDateKey(new Date());
    const tomorrowDate = new Date();
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrow = this.localDateKey(tomorrowDate);

    return this.games.filter((game) => {
      const key = this.bookingDateKey(game.bookingDate);
      if (filter === 'Today') return key === today;
      if (filter === 'Tomorrow') return key === tomorrow;
      return true;
    });
  }

  private localDateKey(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private bookingDateKey(value?: string | null): string {
    if (!value) return '';
    // Handles "2026-08-10", "2026-08-10 00:00:00", ISO strings.
    const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return this.localDateKey(parsed);
  }

  setFilter(f: string) {
    this.activeFilter.set(f);
  }

  getTypeStyle(type: string) {
    return TYPE_COLORS[type] || { bg: '#F3F4F6', color: '#6B7280' };
  }

  getDiffColor(diff: string) {
    return DIFF_COLORS[diff] || '#9CA3AF';
  }

  getSpotsLeft(game: Game) {
    return game.maxPlayers - game.playersJoined;
  }

  getPercent(game: Game) {
    if (!game.maxPlayers) return 0;
    return Math.round((game.playersJoined / game.maxPlayers) * 100);
  }

  getProgressColor(game: Game) {
    const pct = this.getPercent(game);
    if (pct >= 90) return '#EF4444';
    if (pct >= 70) return '#F59E0B';
    return 'var(--app-primary)';
  }

  back() {
    void this.router.navigateByUrl('/app/home');
  }

  openFullMap() {
    void this.router.navigateByUrl('/app/map');
  }

  viewGame(id: string) {
    void this.router.navigateByUrl(`/app/game/${id}`);
  }

  async loadGames() {
    this.loading = true;
    this.errorMessage = '';
    const nearby = this.locationService.nearbyLocationQuery(this.auth.user()?.location);
    this.locationLabel = nearby.label;

    try {
      let response = await firstValueFrom(
        this.bookingService.getNearbyGames(50, {
          matchLocation: !!nearby.query,
          location: nearby.query || undefined,
        }),
      );

      if (
        nearby.query &&
        nearby.city &&
        nearby.query.toLowerCase() !== nearby.city.toLowerCase() &&
        response.success &&
        Array.isArray(response.data) &&
        response.data.length === 0
      ) {
        response = await firstValueFrom(
          this.bookingService.getNearbyGames(50, {
            matchLocation: true,
            location: nearby.city,
          }),
        );
      }

      if (response.success && Array.isArray(response.data)) {
        this.bookings = response.data;
        this.games = response.data.map((booking) => this.mapGame(booking));
      } else {
        this.bookings = [];
        this.games = [];
        this.errorMessage = response.message || 'Unable to load games.';
      }
    } catch (error: any) {
      this.bookings = [];
      this.games = [];
      this.errorMessage = error?.error?.message || 'Unable to load games.';
    } finally {
      this.loading = false;
      void this.renderMiniMap();
    }
  }

  private bookingMatchesHomeLocation(booking: BookingRecord): boolean {
    const nearby = this.locationService.nearbyLocationQuery(this.auth.user()?.location);
    const haystack = [
      booking.venue?.location,
      booking.venue?.address,
      booking.venue?.name,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    if (!haystack) return false;

    const tokens = [nearby.city, nearby.postalArea, nearby.query]
      .filter((token): token is string => !!token && token.trim().length >= 3)
      .map((token) => token.toLowerCase());

    if (tokens.length === 0) return true;
    return tokens.some((token) => haystack.includes(token));
  }

  private async renderMiniMap() {
    const container = this.miniMapContainer?.nativeElement;
    if (!container) return;

    try {
      await this.googleMaps.load();
      const centerLoc = this.locationService.nearbyLocationQuery(this.auth.user()?.location);
      let center = this.lucknowCenter;
      if (centerLoc.latitude && centerLoc.longitude) {
        center = { lat: centerLoc.latitude, lng: centerLoc.longitude };
      } else if (centerLoc.query) {
        const geocoded = await this.googleMaps.geocode(centerLoc.query, this.lucknowCenter);
        if (geocoded) center = geocoded;
      }

      this.clearMiniMarkers();
      this.miniMap = new google.maps.Map(container, this.googleMaps.baseMapOptions({
        center,
        zoom: 12,
        disableDefaultUI: true,
        gestureHandling: 'greedy',
        keyboardShortcuts: false,
        clickableIcons: false,
        draggable: false,
        scrollwheel: false,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      }));

      const positions: google.maps.LatLngLiteral[] = [];
      for (const booking of this.bookings) {
        const query = [booking.venue?.name, booking.venue?.location || booking.venue?.address]
          .filter(Boolean)
          .join(', ')
          .trim();
        if (!query) continue;
        const position = await this.googleMaps.geocode(query, center);
        if (!position) continue;
        positions.push(position);

        const marker = new google.maps.Marker({
          map: this.miniMap,
          position,
          title: booking.venue?.name || booking.sport,
          label: {
            text: sportEmoji(booking.sport),
            color: '#ffffff',
            fontSize: '14px',
            fontWeight: '700',
          },
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: this.sportColor(booking.sport),
            fillOpacity: 1,
            strokeColor: '#ffffff',
            strokeWeight: 2,
            scale: 18,
          },
        });

        const listener = marker.addListener('click', () => {
          this.zone.run(() => this.viewGame(booking.id));
        });
        this.miniMarkers.push(marker);
        this.miniListeners.push(listener);
      }

      if (positions.length === 1) {
        this.miniMap.setCenter(positions[0]);
        this.miniMap.setZoom(13);
      } else if (positions.length > 1) {
        const bounds = new google.maps.LatLngBounds();
        positions.forEach((pos) => bounds.extend(pos));
        this.miniMap.fitBounds(bounds, 28);
      }
    } catch (error) {
      console.error('Failed to render ongoing games map', error);
    }
  }

  private clearMiniMarkers() {
    this.miniListeners.splice(0).forEach((listener) => listener.remove());
    this.miniMarkers.splice(0).forEach((marker) => marker.setMap(null));
  }

  private sportColor(sport?: string | null): string {
    const key = (sport || '').toLowerCase();
    if (key === 'football') return '#2563EB';
    if (key === 'cricket') return '#22C55E';
    if (key === 'basketball') return '#F97316';
    if (key === 'tennis') return '#EAB308';
    if (key === 'badminton') return '#8B5CF6';
    return '#111827';
  }

  private mapGame(booking: BookingRecord): Game {
    const sportKey = (booking.sport || '').toLowerCase();
    const sport = (booking.sport || 'Game').replace(/\b\w/g, (c) => c.toUpperCase());
    const skill = booking.skillLevel
      ? booking.skillLevel.replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Intermediate';

    return {
      id: booking.id,
      sport,
      emoji: sportEmoji(booking.sport),
      venue: booking.venue?.name || 'Venue TBD',
      address: booking.venue?.location || booking.venue?.address || '',
      distance: booking.venue?.location || 'Nearby',
      date: formatBookingDate(booking.bookingDate),
      bookingDate: String(booking.bookingDate || ''),
      time: formatBookingTime(booking.startTime),
      duration: formatDurationLabel(booking.durationMinutes),
      image: SPORT_IMAGES[sportKey] || SPORT_IMAGES['cricket'],
      hostName: booking.host?.name || 'Host',
      hostPhoto: booking.host?.profileImage || DEFAULT_PHOTO,
      isCaptain: true,
      playersJoined: Number(booking.currentPlayers || 0),
      maxPlayers: Number(booking.totalPlayers || 0),
      costPerPlayer: Number(booking.playerShareAmount || booking.price || 0),
      gameType: 'Casual',
      difficulty: skill,
      weather: 'Clear',
      isIndoor: false,
      bookingStatus: String(booking.bookingStatus || ''),
    };
  }
}
