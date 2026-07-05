import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FilterChip, FilterChipsComponent } from '../../shared/components/filter-chips/filter-chips.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';

type FilterType = 'all' | 'games' | 'players' | 'venues';

interface MapMarker {
  id: number;
  type: 'game' | 'player' | 'venue';
  x: number;
  y: number;
  sport?: string;
  emoji?: string;
  title: string;
  address?: string;
  status?: string;
  players?: string;
  count?: number;
  occupancy?: number;
  color: string;
  isLive?: boolean;
}

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
          subtitle="Lucknow"
          [showBack]="true"
          [hasProjectedEnd]="true"
          (back)="back()"
        >
          <button type="button" class="layers-btn">
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
            <img
              class="map-bg"
              src="https://images.unsplash.com/photo-1620662892011-f5c2d523fae2?w=1080&fit=crop&auto=format"
              alt="City map"
            />
            <div class="map-overlay"></div>

            <button
              type="button"
              *ngFor="let m of filteredMarkers"
              class="marker"
              [class.live]="m.isLive"
              [style.left.%]="m.x"
              [style.top.%]="m.y"
              [style.background]="m.color"
              (click)="selected = m"
            >
              <span *ngIf="m.emoji">{{ m.emoji }}</span>
              <span *ngIf="m.count">{{ m.count }}</span>
              <span *ngIf="m.type === 'venue'">🏟️</span>
            </button>
          </div>
        </div>

        <div class="detail-card" *ngIf="selected">
          <div class="detail-top">
            <div>
              <h3>{{ selected.title }}</h3>
              <p>{{ selected.address }}</p>
            </div>
            <button type="button" class="close-btn" (click)="selected = null">
              <ion-icon name="close"></ion-icon>
            </button>
          </div>
          <div class="detail-meta" *ngIf="selected.status || selected.players">
            <span *ngIf="selected.status" class="status" [class.live]="selected.isLive">
              {{ selected.status }}
            </span>
            <span *ngIf="selected.players">{{ selected.players }}</span>
            <span *ngIf="selected.occupancy">{{ selected.occupancy }}% occupied</span>
          </div>
          <app-primary-button (pressed)="viewDetails()">View Details</app-primary-button>
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

      .chip {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        white-space: nowrap;
        background: #fff;
        border: 1px solid #e5e7eb;
        color: #6b7280;
        min-height: unset;
      }

      .chip.active {
        background: #8cf000;
        color: #111827;
        border-color: #8cf000;
        font-weight: 600;
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

      .map-bg {
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.6;
      }

      .map-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(17, 24, 39, 0.2), transparent, rgba(17, 24, 39, 0.2));
      }

      .marker {
        position: absolute;
        transform: translate(-50%, -50%);
        width: 48px;
        height: 48px;
        border-radius: 50%;
        border: 2px solid #fff;
        display: grid;
        place-items: center;
        font-size: 18px;
        color: #fff;
        font-weight: 700;
        min-height: unset;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 2;
      }

      .marker.live {
        animation: pulse 1.5s ease-in-out infinite;
      }

      @keyframes pulse {
        0%,
        100% {
          transform: translate(-50%, -50%) scale(1);
        }
        50% {
          transform: translate(-50%, -58%) scale(1.05);
        }
      }

      .detail-card {
        margin: 0 24px;
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
export class LiveMapPage {
  private readonly router = inject(Router);

  activeFilter: FilterType = 'all';
  selected: MapMarker | null = null;

  readonly mapFilters: FilterChip[] = [
    { id: 'all', label: 'All' },
    { id: 'games', label: 'Live Games' },
    { id: 'players', label: 'Players' },
    { id: 'venues', label: 'Venues' },
  ];

  readonly markers: MapMarker[] = [
    { id: 1, type: 'game', x: 42, y: 35, sport: 'Football', emoji: '⚽', title: 'K.D. Singh Babu Stadium', address: 'Nehru Nagar, Lucknow', status: 'Live Now', players: '10/11', color: '#2563EB', isLive: true },
    { id: 2, type: 'game', x: 68, y: 25, sport: 'Cricket', emoji: '🏏', title: 'BRSABV Ekana Cricket Stadium', address: 'Gomti Nagar Extension', status: 'Starting Soon', players: '18/22', color: '#22C55E', isLive: false },
    { id: 3, type: 'game', x: 55, y: 60, sport: 'Basketball', emoji: '🏀', title: 'Sports Authority Complex', address: 'Gomti Nagar', status: 'Live Now', players: '8/10', color: '#F97316', isLive: true },
    { id: 4, type: 'game', x: 28, y: 72, sport: 'Tennis', emoji: '🎾', title: 'KGMU Tennis Courts', address: 'Shah Mina Road', status: 'In 30 min', players: '3/4', color: '#22C55E', isLive: false },
    { id: 5, type: 'player', x: 48, y: 45, count: 8, color: '#38BDF8', title: 'Hazratganj Area', address: '8 players available' },
    { id: 6, type: 'player', x: 35, y: 58, count: 5, color: '#38BDF8', title: 'Alambagh Area', address: '5 players available' },
    { id: 7, type: 'player', x: 72, y: 50, count: 12, color: '#38BDF8', title: 'Gomti Nagar', address: '12 players available' },
    { id: 8, type: 'venue', x: 25, y: 40, title: 'Phoenix Sports Hub', address: 'Aliganj', occupancy: 85, color: '#7C3AED' },
    { id: 9, type: 'venue', x: 62, y: 38, title: 'Elite Sports Arena', address: 'Indira Nagar', occupancy: 45, color: '#7C3AED' },
    { id: 10, type: 'venue', x: 78, y: 65, title: 'PlayZone Sports Complex', address: 'Gomti Nagar', occupancy: 90, color: '#7C3AED' },
  ];

  get filteredMarkers() {
    if (this.activeFilter === 'all') return this.markers;
    if (this.activeFilter === 'games') return this.markers.filter((m) => m.type === 'game');
    if (this.activeFilter === 'players') return this.markers.filter((m) => m.type === 'player');
    return this.markers.filter((m) => m.type === 'venue');
  }

  setMapFilter(value: string) {
    this.activeFilter = value as FilterType;
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
      void this.router.navigateByUrl('/app/discover');
    }
  }
}
