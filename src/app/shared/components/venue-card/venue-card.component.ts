import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { RatingBadgeComponent } from '../rating-badge/rating-badge.component';

export interface VenueCardData {
  id: string;
  courtName: string;
  venueName: string;
  sport: string;
  image: string;
  distance: number;
  rating: number;
  ratingCount: number;
  pricePerHour: number;
  openTime: string;
  closeTime: string;
  amenities: string[];
  hasRentalGear: boolean;
  gamesPlayed: number;
  isIndoor: boolean;
  isOpenNow: boolean;
  venueDetailId: number;
}

@Component({
  selector: 'app-venue-card',
  standalone: true,
  imports: [CommonModule, IonicModule, RatingBadgeComponent],
  template: `
    <div class="venue-card-outer">
      <!-- Hero image -->
      <div class="card-hero">
        <img
          *ngIf="!imageFailed"
          [src]="data.image"
          [alt]="data.courtName"
          class="card-img"
          (error)="onImageError()"
        />
        <div *ngIf="imageFailed" class="card-image-fallback" aria-label="Venue photo unavailable">
          <ion-icon name="image-outline"></ion-icon>
          <span>Venue photo unavailable</span>
        </div>
        <div class="card-gradient"></div>

        <!-- Indoor/Outdoor badge + Open Now -->
        <div class="card-badges-left">
          <span class="badge-type">
            {{ data.isIndoor ? '🏢 Indoor' : '🌿 Outdoor' }}
          </span>
          <span *ngIf="data.isOpenNow" class="badge-status">
            Open Now
          </span>
        </div>

        <!-- Price -->
        <div class="card-price">
          <p class="price-val">₹{{ data.pricePerHour.toLocaleString() }}</p>
          <p class="price-lbl">per hour</p>
        </div>

        <!-- Court name overlay -->
        <div class="card-info-overlay">
          <p class="court-name">{{ data.courtName }}</p>
          <p class="venue-name">{{ data.venueName }}</p>
        </div>
      </div>

      <!-- Card body -->
      <div class="card-body">
        <!-- Rating + Distance + Timing row -->
        <div class="card-stats-row">
          <app-rating-badge [rating]="data.rating" [count]="data.ratingCount"></app-rating-badge>
          <div class="dot-separator"></div>
          <div class="stat-item">
            <ion-icon name="location-outline" class="stat-icon"></ion-icon>
            <span>{{ data.distance }} km</span>
          </div>
          <div class="dot-separator"></div>
          <div class="stat-item">
            <ion-icon name="time-outline" class="stat-icon"></ion-icon>
            <span>{{ data.openTime }} – {{ data.closeTime }}</span>
          </div>
        </div>

        <!-- Amenities icons -->
        <div class="card-amenities">
          <ng-container *ngFor="let am of data.amenities.slice(0, 5)">
            <div *ngIf="amenityMap[am]" class="amenity-chip">
              <ion-icon [name]="amenityMap[am].icon" class="amenity-icon"></ion-icon>
              <span>{{ amenityMap[am].label }}</span>
            </div>
          </ng-container>
          <span *ngIf="data.amenities.length > 5" class="amenities-more">+{{ data.amenities.length - 5 }}</span>
        </div>

        <!-- Stats + CTA row -->
        <div class="card-footer">
          <div class="footer-details">
            <!-- Rental gear -->
            <div class="detail-gear">
              <div
                class="gear-indicator"
                [style.backgroundColor]="data.hasRentalGear ? '#F0FDF4' : '#FEF2F2'"
              >
                <div class="gear-dot" [style.backgroundColor]="data.hasRentalGear ? '#22C55E' : '#EF4444'"></div>
              </div>
              <span class="gear-lbl" [style.color]="data.hasRentalGear ? '#16A34A' : '#9CA3AF'">
                {{ data.hasRentalGear ? 'Gear Available' : 'No Rental' }}
              </span>
            </div>

            <!-- Games played -->
            <div class="detail-games">
              <span class="games-val">{{ data.gamesPlayed }}</span>
              <span class="games-lbl">games</span>
            </div>
          </div>

          <!-- Book Now Button -->
          <button
            type="button"
            (click)="onBookClick()"
            class="book-btn"
          >
            Book Now
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .venue-card-outer {
        background: var(--app-surface);
        border-radius: var(--app-radius-lg);
        border: 1px solid var(--app-border-subtle);
        box-shadow: var(--app-shadow-card);
        overflow: hidden;
        text-align: left;
        transition: transform var(--app-motion-base) var(--app-motion-ease), box-shadow var(--app-motion-base) ease;
      }

      .card-hero {
        position: relative;
        height: 180px;
        background: var(--app-muted);
        overflow: hidden;
      }

      .card-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform var(--app-motion-slow) var(--app-motion-ease);
      }

      .card-image-fallback {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: rgba(255, 255, 255, 0.88);
        background: linear-gradient(145deg, #64748b, #334155);
        font-size: 12px;
        font-weight: 700;
      }

      .card-image-fallback ion-icon { font-size: 28px; }

      .venue-card-outer:hover .card-img {
        transform: scale(1.04);
      }

      .venue-card-outer:active {
        transform: scale(0.992);
        box-shadow: var(--app-shadow-sm);
      }

      .card-gradient {
        position: absolute;
        inset: 0;
        background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, transparent 100%);
        pointer-events: none;
      }

      .card-badges-left {
        position: absolute;
        top: 12px;
        left: 12px;
        display: flex;
        gap: 6px;
        z-index: 2;
      }

      .badge-type {
        font-size: 10px;
        font-weight: 700;
        color: #ffffff;
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        padding: 4px 10px;
        border-radius: 999px;
      }

      .badge-status {
        font-size: 10px;
        font-weight: 700;
        background: var(--app-primary);
        color: var(--app-foreground);
        padding: 4px 10px;
        border-radius: 999px;
      }

      .card-price {
        position: absolute;
        top: 12px;
        right: 12px;
        background: var(--app-surface);
        background: color-mix(in srgb, var(--app-surface) 95%, transparent);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        padding: 6px 10px;
        border-radius: var(--app-radius-sm);
        text-align: center;
        z-index: 2;
        box-shadow: var(--app-shadow-sm);
      }

      .price-val {
        font-size: 14px;
        font-weight: 900;
        color: var(--app-foreground);
        margin: 0;
        line-height: 1;
      }

      .price-lbl {
        font-size: 9px;
        color: var(--app-foreground-muted);
        margin: 2px 0 0;
        line-height: 1;
      }

      .card-info-overlay {
        position: absolute;
        bottom: 12px;
        left: 12px;
        right: 12px;
        z-index: 2;
      }

      .court-name {
        font-size: 16px;
        font-weight: 900;
        color: #ffffff;
        margin: 0;
        line-height: 1.2;
        text-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
      }

      .venue-name {
        font-size: 12px;
        font-weight: 500;
        color: rgba(255, 255, 255, 0.7);
        margin: 2px 0 0;
        line-height: 1.2;
      }

      .card-body {
        padding: 14px 16px 16px;
      }

      .card-stats-row {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
      }

      .dot-separator {
        width: 4px;
        height: 4px;
        border-radius: 50%;
        background: var(--app-border);
        flex-shrink: 0;
      }

      .stat-item {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: var(--app-foreground-muted);
        font-weight: 600;
        line-height: 1;
      }

      .stat-icon {
        font-size: 13px;
      }

      .card-amenities {
        display: flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 16px;
        flex-wrap: wrap;
      }

      .amenity-chip {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--app-muted);
        padding: 4px 10px;
        border-radius: 999px;
        line-height: 1;
      }

      .amenity-icon {
        font-size: 11px;
        color: var(--app-foreground-secondary);
      }

      .amenity-chip span {
        font-size: 9px;
        color: var(--app-foreground-secondary);
        font-weight: 700;
      }

      .amenities-more {
        font-size: 9px;
        color: var(--app-foreground-muted);
        font-weight: 700;
      }

      .card-footer {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      .footer-details {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .detail-gear {
        display: flex;
        align-items: center;
        gap: 6px;
        line-height: 1;
      }

      .gear-indicator {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .gear-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
      }

      .gear-lbl {
        font-size: 10px;
        font-weight: 900;
      }

      .detail-games {
        display: flex;
        align-items: center;
        gap: 4px;
        background: var(--app-muted);
        padding: 4px 10px;
        border-radius: 999px;
        line-height: 1;
      }

      .games-val {
        font-size: 10px;
        font-weight: 900;
        color: var(--app-foreground-secondary);
      }

      .games-lbl {
        font-size: 9px;
        color: var(--app-foreground-muted);
        font-weight: 700;
      }

      .book-btn {
        height: 40px;
        border-radius: var(--app-radius-md);
        padding: 0 16px;
        font-size: 13px;
        font-weight: 900;
        color: var(--app-foreground);
        border: none;
        background: linear-gradient(135deg, #ff7a00 0%, #ff9a40 100%);
        box-shadow: 0 4px 14px rgba(var(--app-secondary-rgb), 0.3);
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: transform var(--app-motion-fast) var(--app-motion-ease), box-shadow var(--app-motion-fast) ease;
        outline: none;
      }

      .book-btn:active {
        transform: translateY(1px) scale(0.98);
        box-shadow: 0 2px 8px rgba(var(--app-secondary-rgb), 0.24);
      }
    `,
  ],
})
export class VenueCardComponent implements OnChanges {
  @Input() data!: VenueCardData;
  @Output() book = new EventEmitter<void>();

  readonly amenityMap: Record<string, { icon: string; label: string }> = {
    parking: { icon: 'car-outline', label: 'Parking' },
    lights: { icon: 'flash-outline', label: 'Lights' },
    washrooms: { icon: 'water-outline', label: 'WC' },
    water: { icon: 'water-outline', label: 'Water' },
    cafeteria: { icon: 'cafe-outline', label: 'Café' },
    changing: { icon: 'shirt-outline', label: 'Changing' },
  };

  imageFailed = false;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data']) {
      this.imageFailed = false;
    }
  }

  onImageError(): void {
    this.imageFailed = true;
  }

  onBookClick() {
    this.book.emit();
  }
}
