import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, inject, NgZone, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingRecord, DiscoverPlayer } from '../../core/models/api.model';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { GoogleMapsService } from '../../core/services/google-maps.service';
import { SocialService } from '../../core/services/social.service';
import {
  formatBookingDate,
  formatBookingTime,
  formatStartsIn,
  sportEmoji,
} from '../../core/utils/booking.utils';
import { FilterChip, FilterChipsComponent } from '../../shared/components/filter-chips/filter-chips.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';

type FilterType = 'all' | 'games' | 'players' | 'venues';

interface MapMarker {
  key: string;
  id: string;
  type: 'game' | 'player' | 'venue';
  position: google.maps.LatLngLiteral;
  sport?: string;
  emoji?: string;
  title: string;
  address?: string;
  status?: string;
  players?: string;
  count?: number;
  color: string;
  isLive?: boolean;
}

interface VenueApi {
  id: number | string;
  name: string;
  location?: string | null;
}

const LUCKNOW_CENTER: google.maps.LatLngLiteral = { lat: 26.8467, lng: 80.9462 };

const SPORT_COLORS: Record<string, string> = {
  football: '#2563EB',
  cricket: '#22C55E',
  basketball: '#F97316',
  tennis: '#EAB308',
  badminton: '#8B5CF6',
  volleyball: '#0EA5E9',
};

@Component({
  selector: 'app-live-map',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FilterChipsComponent, PrimaryButtonComponent],
  template: `
    <ion-content fullscreen>
      <div class="map-page page-safe-bottom">
        <app-header
          variant="page"
          title="Live Sports Map"
          [subtitle]="mapSubtitle"
          [showBack]="true"
          [hasProjectedEnd]="true"
          (back)="back()"
        >
          <button type="button" class="layers-btn" (click)="toggleMapType()" aria-label="Change map type">
            <ion-icon name="layers-outline"></ion-icon>
          </button>
        </app-header>

        <app-filter-chips
          class="filters"
          [chips]="mapFilters"
          [value]="activeFilter"
          (valueChange)="setMapFilter($event)"
        ></app-filter-chips>

        <div class="map-wrap">
          <div class="map-surface">
            <div #mapContainer class="google-map" aria-label="Live sports locations nearby"></div>
            <div class="map-state" *ngIf="mapLoading || dataLoading">
              <ion-spinner name="crescent"></ion-spinner>
              <span>{{ mapLoading ? 'Loading map…' : 'Finding nearby games…' }}</span>
            </div>
            <div class="map-state map-error" *ngIf="mapError">
              <ion-icon name="map-outline"></ion-icon>
              <strong>Map unavailable</strong>
              <span>{{ mapError }}</span>
              <button type="button" (click)="reload()">Try again</button>
            </div>
            <div class="map-empty" *ngIf="!mapLoading && !dataLoading && !mapError && filteredMarkers.length === 0">
              No {{ emptyLabel }} nearby yet.
            </div>
          </div>
        </div>

        <div class="detail-card" *ngIf="selected">
          <div class="detail-top">
            <div>
              <div class="detail-type">{{ selected.type === 'game' ? (selected.sport || 'Game') : selected.type }}</div>
              <h3>{{ selected.title }}</h3>
              <p>{{ selected.address }}</p>
            </div>
            <button type="button" class="close-btn" (click)="selected = null">
              <ion-icon name="close"></ion-icon>
            </button>
          </div>
          <div class="detail-meta" *ngIf="selected.status || selected.players || selected.count">
            <span *ngIf="selected.status" class="status" [class.live]="selected.isLive">
              {{ selected.status }}
            </span>
            <span *ngIf="selected.players">{{ selected.players }}</span>
            <span *ngIf="selected.count">{{ selected.count }} players</span>
          </div>
          <app-primary-button (pressed)="viewDetails()">
            {{ selected.type === 'game' ? 'View Game' : selected.type === 'venue' ? 'View Venue' : 'View Player' }}
          </app-primary-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .map-page {
        min-height: 100%;
        background: #fafbfc;
      }

      .layers-btn,
      .close-btn {
        width: 40px;
        height: 40px;
        min-height: unset;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: rgba(140, 240, 0, 0.2);
        color: #111827;
        font-size: 20px;
        padding: 0;
      }

      .close-btn {
        background: #f3f4f6;
        color: #6b7280;
      }

      .filters {
        display: flex;
        gap: 8px;
        padding: 16px 20px;
        overflow-x: auto;
        background: #fafbfc;
        border-bottom: 1px solid #e5e7eb;
      }

      .map-wrap {
        padding: 24px;
      }

      .map-surface {
        position: relative;
        width: 100%;
        height: calc(100vh - 280px);
        min-height: 360px;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        overflow: hidden;
        background: #f3f4f6;
      }

      .google-map {
        width: 100%;
        height: 100%;
      }

      .map-state,
      .map-empty {
        position: absolute;
        inset: 0;
        z-index: 3;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        background: rgba(250, 251, 252, 0.9);
        color: #6b7280;
        font-size: 14px;
        pointer-events: none;
      }

      .map-state {
        pointer-events: auto;
      }

      .map-empty {
        align-items: flex-end;
        padding-bottom: 20px;
        background: transparent;
        text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
        font-weight: 600;
      }

      .map-error {
        flex-direction: column;
        padding: 24px;
        text-align: center;
      }

      .map-error ion-icon {
        font-size: 34px;
        color: #9ca3af;
      }

      .map-error strong {
        color: #111827;
        font-size: 16px;
      }

      .map-error span {
        max-width: 270px;
        font-size: 12px;
      }

      .map-error button {
        min-height: unset;
        padding: 10px 18px;
        border-radius: 999px;
        background: #8cf000;
        color: #111827;
        font-size: 13px;
        font-weight: 700;
        pointer-events: auto;
      }

      .detail-card {
        margin: 0 24px 24px;
        background: #fff;
        border-radius: 20px;
        padding: 20px;
        border: 1px solid #e5e7eb;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      }

      .detail-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }

      .detail-type {
        text-transform: capitalize;
        font-size: 12px;
        font-weight: 700;
        color: #8cf000;
        margin-bottom: 4px;
      }

      .detail-top h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .detail-top p {
        margin: 4px 0 0;
        font-size: 14px;
        color: #6b7280;
      }

      .detail-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
        font-size: 13px;
        color: #6b7280;
      }

      .status {
        padding: 4px 10px;
        border-radius: 999px;
        background: #f3f4f6;
        font-weight: 600;
      }

      .status.live {
        background: rgba(140, 240, 0, 0.2);
        color: #111827;
      }
    `,
  ],
})
export class LiveMapPage implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly googleMaps = inject(GoogleMapsService);
  private readonly bookingService = inject(BookingService);
  private readonly social = inject(SocialService);
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly zone = inject(NgZone);

  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  activeFilter: FilterType = 'all';
  selected: MapMarker | null = null;
  mapLoading = true;
  dataLoading = false;
  mapError = '';
  mapSubtitle = 'Nearby';
  markers: MapMarker[] = [];

  private map?: google.maps.Map;
  private mapType: 'roadmap' | 'satellite' = 'roadmap';
  private mapCenter = LUCKNOW_CENTER;
  private readonly googleMarkers = new Map<string, google.maps.Marker>();
  private readonly markerListeners: google.maps.MapsEventListener[] = [];

  readonly mapFilters: FilterChip[] = [
    { id: 'all', label: 'All' },
    { id: 'games', label: 'Live Games' },
    { id: 'players', label: 'Players' },
    { id: 'venues', label: 'Venues' },
  ];

  get filteredMarkers() {
    if (this.activeFilter === 'all') return this.markers;
    if (this.activeFilter === 'games') return this.markers.filter((m) => m.type === 'game');
    if (this.activeFilter === 'players') return this.markers.filter((m) => m.type === 'player');
    return this.markers.filter((m) => m.type === 'venue');
  }

  get emptyLabel() {
    if (this.activeFilter === 'games') return 'upcoming games';
    if (this.activeFilter === 'players') return 'players';
    if (this.activeFilter === 'venues') return 'venues';
    return 'games, players, or venues';
  }

  ngAfterViewInit() {
    void this.reload();
  }

  ngOnDestroy() {
    this.clearGoogleMarkers();
  }

  async reload() {
    await this.initializeMap();
    await this.loadMapData();
  }

  async initializeMap() {
    const container = this.mapContainer?.nativeElement;
    if (!container) return;

    this.mapLoading = true;
    this.mapError = '';

    try {
      await this.googleMaps.load();

      const userLocation = (this.auth.user()?.location || '').trim();
      if (userLocation) {
        const center = await this.googleMaps.geocode(userLocation, LUCKNOW_CENTER);
        if (center) this.mapCenter = center;
        this.mapSubtitle = this.cityLabel(userLocation);
      } else {
        this.mapSubtitle = 'Lucknow';
      }

      this.clearGoogleMarkers();
      this.map = new google.maps.Map(container, {
        center: this.mapCenter,
        zoom: 12,
        mapTypeId: this.mapType,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
        gestureHandling: 'greedy',
      });
    } catch (error) {
      console.error('Failed to load Google Maps', error);
      this.mapError = 'Check the Google Maps API key and make sure Maps JavaScript API is enabled.';
    } finally {
      this.mapLoading = false;
    }
  }

  async loadMapData() {
    if (!this.map || this.mapError) return;

    this.dataLoading = true;
    this.selected = null;

    try {
      const userLocation = (this.auth.user()?.location || '').trim();
      const [gamesRes, venuesRes, playersRes] = await Promise.all([
        firstValueFrom(
          this.bookingService.getNearbyGames(50, {
            matchLocation: !!userLocation,
            location: userLocation || undefined,
          }),
        ),
        firstValueFrom(this.api.get<VenueApi[]>('/venues')),
        firstValueFrom(this.social.getDiscoverPlayers('per_page=40')),
      ]);

      let bookings = gamesRes.success && Array.isArray(gamesRes.data) ? gamesRes.data : [];
      if (userLocation && bookings.length === 0) {
        const fallback = await firstValueFrom(this.bookingService.getNearbyGames(50));
        bookings = fallback.success && Array.isArray(fallback.data) ? fallback.data : [];
      }
      const venues = venuesRes.success && Array.isArray(venuesRes.data) ? venuesRes.data : [];
      const players =
        playersRes.success && playersRes.data?.items ? playersRes.data.items : [];

      const nextMarkers: MapMarker[] = [];
      nextMarkers.push(...(await this.buildGameMarkers(bookings)));
      nextMarkers.push(...(await this.buildVenueMarkers(venues, bookings)));
      nextMarkers.push(...(await this.buildPlayerMarkers(players, userLocation)));

      this.markers = nextMarkers;
      this.clearGoogleMarkers();
      this.markers.forEach((marker) => this.addGoogleMarker(marker));
      this.updateMarkerVisibility();
      this.fitVisibleMarkers();
    } catch (error) {
      console.error('Failed to load map data', error);
      this.markers = [];
      this.clearGoogleMarkers();
    } finally {
      this.dataLoading = false;
    }
  }

  setMapFilter(value: string) {
    this.activeFilter = value as FilterType;
    this.selected = null;
    this.updateMarkerVisibility();
    this.fitVisibleMarkers();
  }

  toggleMapType() {
    if (!this.map) return;
    this.mapType = this.mapType === 'roadmap' ? 'satellite' : 'roadmap';
    this.map.setMapTypeId(this.mapType);
  }

  back() {
    void this.router.navigateByUrl('/app/home');
  }

  viewDetails() {
    if (!this.selected) return;
    if (this.selected.type === 'game') {
      void this.router.navigateByUrl(`/app/game/${this.selected.id}`);
    } else if (this.selected.type === 'venue') {
      void this.router.navigateByUrl(`/app/venue/${this.selected.id}`);
    } else {
      void this.router.navigateByUrl(`/app/player/${this.selected.id}`);
    }
  }

  private async buildGameMarkers(bookings: BookingRecord[]): Promise<MapMarker[]> {
    const grouped = new Map<string, BookingRecord[]>();
    for (const booking of bookings) {
      const placeKey = this.venueQuery(booking);
      if (!placeKey) continue;
      const list = grouped.get(placeKey) || [];
      list.push(booking);
      grouped.set(placeKey, list);
    }

    const markers: MapMarker[] = [];
    for (const [placeKey, list] of grouped.entries()) {
      const base = await this.googleMaps.geocode(placeKey, this.mapCenter);
      if (!base) continue;

      list.forEach((booking, index) => {
        const live = this.isLiveNow(booking);
        const startsIn = formatStartsIn(booking.bookingDate, booking.startTime);
        markers.push({
          key: `game-${booking.id}`,
          id: booking.id,
          type: 'game',
          position: this.offsetPosition(base, index, list.length),
          sport: booking.sport,
          emoji: sportEmoji(booking.sport),
          title: booking.venue?.name || `${booking.sport || 'Game'} match`,
          address: booking.venue?.location || booking.venue?.address || placeKey,
          status: live
            ? 'Live Now'
            : startsIn || `${formatBookingDate(booking.bookingDate)} · ${formatBookingTime(booking.startTime)}`,
          players: `${booking.currentPlayers}/${booking.totalPlayers} players`,
          color: this.sportColor(booking.sport),
          isLive: live,
        });
      });
    }
    return markers;
  }

  private async buildVenueMarkers(venues: VenueApi[], bookings: BookingRecord[]): Promise<MapMarker[]> {
    const venueIdsWithGames = new Set(bookings.map((b) => String(b.venueId || b.venue?.id || '')));
    const markers: MapMarker[] = [];

    for (const venue of venues) {
      const query = [venue.name, venue.location].filter(Boolean).join(', ');
      if (!query) continue;
      const position = await this.googleMaps.geocode(query, this.mapCenter);
      if (!position) continue;

      const hasGames = venueIdsWithGames.has(String(venue.id));
      markers.push({
        key: `venue-${venue.id}`,
        id: String(venue.id),
        type: 'venue',
        position,
        emoji: '🏟️',
        title: venue.name,
        address: venue.location || undefined,
        status: hasGames ? 'Upcoming games' : 'Venue',
        color: '#7C3AED',
      });
    }
    return markers;
  }

  private async buildPlayerMarkers(players: DiscoverPlayer[], userLocation: string): Promise<MapMarker[]> {
    const tokens = this.locationTokens(userLocation);
    const nearbyPlayers = players.filter((player) => {
      if (!player.city || player.city === 'City not shared') return false;
      if (!tokens.length) return true;
      const hay = player.city.toLowerCase();
      return tokens.some((token) => hay.includes(token));
    });

    const byPlace = new Map<string, DiscoverPlayer[]>();
    for (const player of nearbyPlayers) {
      const place = (player.city || '').trim();
      if (!place) continue;
      const list = byPlace.get(place) || [];
      list.push(player);
      byPlace.set(place, list);
    }

    const markers: MapMarker[] = [];
    for (const [place, list] of byPlace.entries()) {
      const position = await this.googleMaps.geocode(place, this.mapCenter);
      if (!position) continue;

      if (list.length === 1) {
        const player = list[0];
        markers.push({
          key: `player-${player.id}`,
          id: player.id,
          type: 'player',
          position,
          emoji: '👤',
          title: player.name,
          address: player.city || place,
          status: player.skillLevel || undefined,
          color: '#38BDF8',
          count: 1,
        });
      } else {
        markers.push({
          key: `players-${place}`,
          id: list[0].id,
          type: 'player',
          position,
          title: this.cityLabel(place),
          address: `${list.length} players nearby`,
          color: '#38BDF8',
          count: list.length,
        });
      }
    }
    return markers;
  }

  private addGoogleMarker(item: MapMarker) {
    if (!this.map) return;

    const labelText =
      item.type === 'player' && item.count && item.count > 1
        ? String(item.count)
        : item.emoji || '•';

    const marker = new google.maps.Marker({
      map: this.map,
      position: item.position,
      title: item.title,
      label: {
        text: labelText,
        color: '#ffffff',
        fontSize: item.type === 'player' && (item.count || 0) > 1 ? '15px' : '17px',
        fontWeight: '700',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: item.color,
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeOpacity: 1,
        strokeWeight: item.isLive ? 3 : 2,
        scale: item.isLive ? 25 : 22,
      },
      zIndex: item.type === 'game' ? (item.isLive ? 4 : 3) : item.type === 'player' ? 2 : 1,
    });

    const listener = marker.addListener('click', () => {
      this.zone.run(() => {
        this.selected = item;
        this.map?.panTo(item.position);
      });
    });

    this.googleMarkers.set(item.key, marker);
    this.markerListeners.push(listener);
  }

  private updateMarkerVisibility() {
    const visibleKeys = new Set(this.filteredMarkers.map((marker) => marker.key));
    this.googleMarkers.forEach((marker, key) => marker.setVisible(visibleKeys.has(key)));
  }

  private fitVisibleMarkers() {
    if (!this.map) return;
    if (this.filteredMarkers.length === 0) {
      this.map.setCenter(this.mapCenter);
      this.map.setZoom(12);
      return;
    }
    if (this.filteredMarkers.length === 1) {
      this.map.setCenter(this.filteredMarkers[0].position);
      this.map.setZoom(14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    this.filteredMarkers.forEach((marker) => bounds.extend(marker.position));
    this.map.fitBounds(bounds, 44);
  }

  private clearGoogleMarkers() {
    this.markerListeners.splice(0).forEach((listener) => listener.remove());
    this.googleMarkers.forEach((marker) => marker.setMap(null));
    this.googleMarkers.clear();
  }

  private venueQuery(booking: BookingRecord): string {
    return [booking.venue?.name, booking.venue?.location || booking.venue?.address]
      .filter(Boolean)
      .join(', ')
      .trim();
  }

  private sportColor(sport?: string | null): string {
    if (!sport) return '#111827';
    return SPORT_COLORS[sport.toLowerCase()] || '#111827';
  }

  private isLiveNow(booking: BookingRecord): boolean {
    if (!booking.bookingDate || !booking.startTime || !booking.endTime) return false;
    const start = new Date(`${booking.bookingDate}T${booking.startTime}`);
    const end = new Date(`${booking.bookingDate}T${booking.endTime}`);
    const now = Date.now();
    return now >= start.getTime() && now <= end.getTime();
  }

  private offsetPosition(
    base: google.maps.LatLngLiteral,
    index: number,
    total: number,
  ): google.maps.LatLngLiteral {
    if (total <= 1) return base;
    const angle = (2 * Math.PI * index) / total;
    const delta = 0.0009;
    return {
      lat: base.lat + Math.cos(angle) * delta,
      lng: base.lng + Math.sin(angle) * delta,
    };
  }

  private locationTokens(location: string): string[] {
    return location
      .split(/[>,\-\/|]+/)
      .map((part) => part.trim().toLowerCase())
      .filter((part) => part.length >= 3);
  }

  private cityLabel(location: string): string {
    return location.split(/[>,\-\/|]+/)[0]?.trim() || location;
  }
}
