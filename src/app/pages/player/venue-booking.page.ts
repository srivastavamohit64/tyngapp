import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VENUE_DATA, type VenueDetail } from './venue-detail.page';

interface DateItem {
  idx: number;
  dayShort: string;
  dateNum: number;
  monthShort: string;
  fullLabel: string;
}

@Component({
  selector: 'app-venue-booking',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen class="book-content">
      <div class="book-page" *ngIf="venue">
        <header class="book-header">
          <button type="button" class="icon-btn" (click)="back()" aria-label="Back">
            <ion-icon name="chevron-back"></ion-icon>
          </button>
          <div class="book-header-copy">
            <h1>Select Date & Time</h1>
            <p>{{ venue.venueName }}</p>
          </div>
          <div class="icon-btn icon-btn--ghost"></div>
        </header>

        <div class="book-body">
          <section class="venue-card">
            <div class="venue-thumb">
              <img [src]="venue.images[0]" [alt]="venue.courtName" />
            </div>
            <div class="venue-meta">
              <h2>{{ venue.courtName }}</h2>
              <p class="venue-name">{{ venue.venueName }}</p>
              <div class="venue-loc">
                <ion-icon name="location-outline"></ion-icon>
                <span>{{ venue.address.split(',')[1]?.trim() || venue.address }}</span>
              </div>
            </div>
            <div class="venue-price">
              <strong>₹{{ venue.pricePerHour.toLocaleString() }}</strong>
              <span>per hour</span>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <h3>Select date</h3>
            </div>
            <div class="date-row no-scrollbar">
              <button
                type="button"
                *ngFor="let date of dates"
                class="date-chip"
                [class.is-active]="selectedDateIdx === date.idx"
                (click)="selectDate(date.idx)"
              >
                <span class="date-day">{{ date.dayShort }}</span>
                <span class="date-num">{{ date.dateNum }}</span>
                <span class="date-mon">{{ date.monthShort }}</span>
              </button>
            </div>
          </section>

          <section class="section">
            <div class="section-head">
              <h3>Available slots</h3>
              <p>{{ availableCount }} open · consecutive hours</p>
            </div>

            <div class="slot-grid">
              <button
                type="button"
                *ngFor="let slot of allSlots"
                class="slot-chip"
                [class.is-booked]="isSlotUnavailable(slot)"
                [class.is-selected]="isSlotSelected(slot)"
                [disabled]="isSlotUnavailable(slot)"
                (click)="toggleSlot(slot)"
              >
                <span class="slot-time">{{ formatSlotLabel(slot) }}</span>
                <span class="slot-status" *ngIf="isSlotUnavailable(slot)">Booked</span>
                <span class="slot-check" *ngIf="isSlotSelected(slot)">
                  <ion-icon name="checkmark"></ion-icon>
                </span>
              </button>
            </div>

            <div class="slot-legend">
              <div class="legend-item">
                <span class="swatch swatch--selected"></span>
                <span>Selected</span>
              </div>
              <div class="legend-item">
                <span class="swatch swatch--available"></span>
                <span>Available</span>
              </div>
              <div class="legend-item">
                <span class="swatch swatch--booked"></span>
                <span>Booked</span>
              </div>
            </div>
          </section>

          <section class="summary-card" *ngIf="hours > 0">
            <p class="summary-kicker">Booking summary</p>
            <div class="summary-grid">
              <div class="summary-item">
                <ion-icon name="calendar-outline"></ion-icon>
                <div>
                  <span>Date</span>
                  <strong>{{ selectedDateLabel }}</strong>
                </div>
              </div>
              <div class="summary-item">
                <ion-icon name="time-outline"></ion-icon>
                <div>
                  <span>Start</span>
                  <strong>{{ startSlot }}</strong>
                </div>
              </div>
              <div class="summary-item">
                <ion-icon name="hourglass-outline"></ion-icon>
                <div>
                  <span>Duration</span>
                  <strong>{{ formatDuration(hours) }}</strong>
                </div>
              </div>
              <div class="summary-item">
                <ion-icon name="flag-outline"></ion-icon>
                <div>
                  <span>Ends at</span>
                  <strong>{{ endTime }}</strong>
                </div>
              </div>
            </div>
            <div class="summary-court">
              <ion-icon name="basketball-outline"></ion-icon>
              <span>{{ venue.courtName }}</span>
            </div>
            <div class="summary-costs">
              <div class="cost-row">
                <span>Court ({{ hours }}h × ₹{{ venue.pricePerHour.toLocaleString() }})</span>
                <strong>₹{{ totalCost.toLocaleString() }}</strong>
              </div>
              <div class="cost-row" *ngIf="rentalCost > 0">
                <span>Rental equipment</span>
                <strong>₹{{ rentalCost.toLocaleString() }}</strong>
              </div>
              <div class="cost-row cost-row--total">
                <span>Total</span>
                <strong>₹{{ grandTotal.toLocaleString() }}</strong>
              </div>
            </div>
          </section>

          <div class="duration-pill" *ngIf="hours > 0">
            <ion-icon name="time-outline"></ion-icon>
            <span>{{ formatDuration(hours) }} booked</span>
            <strong>{{ startSlot }} – {{ endTime }}</strong>
          </div>
        </div>
      </div>
    </ion-content>

    <ion-footer *ngIf="venue" class="book-footer ion-no-border">
      <div class="book-cta">
        <button
          type="button"
          class="cta-btn"
          [class.is-ready]="hours > 0"
          [disabled]="hours === 0"
          (click)="continueToSummary()"
        >
          <ng-container *ngIf="hours > 0; else idleLabel">
            <span>Continue · ₹{{ grandTotal.toLocaleString() }}</span>
            <ion-icon name="arrow-forward"></ion-icon>
          </ng-container>
          <ng-template #idleLabel>
            <span>Select at least one slot</span>
          </ng-template>
        </button>
        <p class="cta-hint" *ngIf="hours > 0">Free cancellation up to 24 hours before your slot</p>
      </div>
    </ion-footer>
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        height: 100%;
      }

      .book-content {
        --background: #f4f6f8;
      }

      .no-scrollbar {
        scrollbar-width: none;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }

      .book-page {
        min-height: 100%;
        background: #f4f6f8;
        color: #111827;
        text-align: left;
      }

      .book-header {
        position: sticky;
        top: 0;
        z-index: 20;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 10px 16px;
        background: rgba(255, 255, 255, 0.96);
        border-bottom: 1px solid #eef0f3;
        backdrop-filter: blur(8px);
      }

      .book-header-copy {
        text-align: center;
        min-width: 0;
      }

      .book-header-copy h1 {
        margin: 0;
        font-size: 15px;
        font-weight: 900;
        letter-spacing: -0.02em;
      }

      .book-header-copy p {
        margin: 2px 0 0;
        font-size: 11px;
        font-weight: 700;
        color: #9ca3af;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .icon-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 14px;
        background: #f3f4f6;
        color: #111827;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }

      .icon-btn ion-icon {
        font-size: 20px;
      }

      .icon-btn--ghost {
        background: transparent;
        pointer-events: none;
      }

      .book-body {
        padding: 16px 16px 28px;
        display: flex;
        flex-direction: column;
        gap: 20px;
      }

      .venue-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #fff;
        border: 1px solid #eef0f3;
        border-radius: 22px;
        box-shadow: 0 8px 24px rgba(17, 24, 39, 0.04);
      }

      .venue-thumb {
        width: 68px;
        height: 68px;
        border-radius: 16px;
        overflow: hidden;
        flex-shrink: 0;
        background: #e5e7eb;
      }

      .venue-thumb img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .venue-meta {
        min-width: 0;
        flex: 1;
      }

      .venue-meta h2 {
        margin: 0;
        font-size: 15px;
        font-weight: 900;
        line-height: 1.2;
      }

      .venue-name {
        margin: 4px 0 0;
        font-size: 12px;
        font-weight: 700;
        color: #9ca3af;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .venue-loc {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 6px;
        color: #9ca3af;
        font-size: 11px;
        font-weight: 700;
      }

      .venue-loc ion-icon {
        font-size: 12px;
      }

      .venue-price {
        text-align: right;
        flex-shrink: 0;
      }

      .venue-price strong {
        display: block;
        font-size: 17px;
        font-weight: 900;
        line-height: 1;
      }

      .venue-price span {
        display: block;
        margin-top: 4px;
        font-size: 10px;
        font-weight: 700;
        color: #9ca3af;
      }

      .section-head {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
      }

      .section-head h3 {
        margin: 0;
        font-size: 12px;
        font-weight: 900;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #111827;
      }

      .section-head p {
        margin: 0;
        font-size: 11px;
        font-weight: 700;
        color: #9ca3af;
        white-space: nowrap;
      }

      .date-row {
        display: flex;
        gap: 10px;
        overflow-x: auto;
        padding-bottom: 2px;
      }

      .date-chip {
        min-width: 64px;
        padding: 12px 10px;
        border-radius: 18px;
        border: 1.5px solid #e8eaee;
        background: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
      }

      .date-chip.is-active {
        border-color: var(--app-primary);
        background: rgba(var(--app-primary-rgb), 0.12);
        box-shadow: 0 4px 14px rgba(var(--app-primary-rgb), 0.22);
      }

      .date-day {
        font-size: 10px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        color: #9ca3af;
      }

      .date-chip.is-active .date-day {
        color: #65a30d;
      }

      .date-num {
        font-size: 20px;
        font-weight: 900;
        line-height: 1;
        color: #6b7280;
      }

      .date-chip.is-active .date-num {
        color: #111827;
      }

      .date-mon {
        font-size: 10px;
        font-weight: 700;
        color: #c4c9d4;
      }

      .date-chip.is-active .date-mon {
        color: #9ca3af;
      }

      .slot-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .slot-chip {
        position: relative;
        min-height: 58px;
        padding: 12px 8px;
        border-radius: 16px;
        border: 1.5px solid #e8eaee;
        background: #fff;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        box-shadow: 0 1px 3px rgba(17, 24, 39, 0.04);
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      }

      .slot-chip:active:not(:disabled) {
        transform: scale(0.97);
      }

      .slot-time {
        font-size: 13px;
        font-weight: 800;
        line-height: 1.1;
        color: #374151;
      }

      .slot-status {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #9ca3af;
      }

      .slot-check {
        position: absolute;
        top: 6px;
        right: 6px;
        width: 18px;
        height: 18px;
        border-radius: 999px;
        background: #111827;
        color: var(--app-primary);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .slot-check ion-icon {
        font-size: 11px;
        font-weight: 900;
      }

      .slot-chip.is-selected {
        background: var(--app-primary);
        border-color: var(--app-primary);
        box-shadow: 0 6px 16px rgba(var(--app-primary-rgb), 0.28);
      }

      .slot-chip.is-selected .slot-time {
        color: #111827;
      }

      .slot-chip.is-booked {
        background: #f3f4f6;
        border-color: #eceff3;
        box-shadow: none;
        opacity: 1;
      }

      .slot-chip.is-booked .slot-time {
        color: #b0b6c0;
        text-decoration: line-through;
        text-decoration-thickness: 1px;
      }

      .slot-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        margin-top: 14px;
        padding-top: 2px;
      }

      .legend-item {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 11px;
        font-weight: 700;
        color: #9ca3af;
      }

      .swatch {
        width: 12px;
        height: 12px;
        border-radius: 4px;
        flex-shrink: 0;
      }

      .swatch--selected {
        background: var(--app-primary);
      }

      .swatch--available {
        background: #fff;
        border: 1.5px solid #d1d5db;
      }

      .swatch--booked {
        background: #e5e7eb;
      }

      .summary-card {
        border-radius: 24px;
        padding: 18px;
        color: #fff;
        background: linear-gradient(145deg, #111827 0%, #1f2937 100%);
        box-shadow: 0 16px 32px rgba(17, 24, 39, 0.18);
      }

      .summary-kicker {
        margin: 0 0 14px;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.1em;
        text-transform: uppercase;
        color: var(--app-primary);
      }

      .summary-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
        margin-bottom: 14px;
      }

      .summary-item {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      .summary-item ion-icon {
        font-size: 18px;
        color: var(--app-primary);
        margin-top: 2px;
      }

      .summary-item span {
        display: block;
        font-size: 10px;
        font-weight: 700;
        color: rgba(255, 255, 255, 0.45);
      }

      .summary-item strong {
        display: block;
        margin-top: 4px;
        font-size: 13px;
        font-weight: 900;
        line-height: 1.2;
      }

      .summary-court {
        display: flex;
        align-items: center;
        gap: 8px;
        padding-bottom: 14px;
        margin-bottom: 14px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        color: rgba(255, 255, 255, 0.65);
        font-size: 12px;
        font-weight: 700;
      }

      .summary-costs {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .cost-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        font-size: 12px;
        color: rgba(255, 255, 255, 0.55);
      }

      .cost-row strong {
        color: #fff;
        font-weight: 800;
      }

      .cost-row--total {
        padding-top: 10px;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        font-size: 14px;
        font-weight: 900;
        color: #fff;
      }

      .cost-row--total strong {
        font-size: 18px;
        color: var(--app-primary);
      }

      .duration-pill {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 12px 14px;
        border-radius: 16px;
        background: rgba(var(--app-primary-rgb), 0.1);
        border: 1px solid rgba(var(--app-primary-rgb), 0.28);
        font-size: 13px;
        font-weight: 800;
        color: #111827;
      }

      .duration-pill ion-icon {
        color: #65a30d;
        font-size: 16px;
      }

      .duration-pill strong {
        margin-left: auto;
        font-size: 12px;
        font-weight: 800;
        color: #6b7280;
      }

      .book-footer {
        background: #fff;
        box-shadow: 0 -8px 28px rgba(17, 24, 39, 0.08);
      }

      .book-cta {
        max-width: 28rem;
        margin: 0 auto;
        padding: 12px 16px calc(18px + env(safe-area-inset-bottom, 0px));
      }

      .cta-btn {
        width: 100%;
        height: 54px;
        border: none;
        border-radius: 18px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-size: 15px;
        font-weight: 900;
        background: #eef0f3;
        color: #b0b6c0;
        transition: transform 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;
      }

      .cta-btn.is-ready {
        background: linear-gradient(135deg, #ff7a00 0%, #ff9a40 100%);
        color: #fff;
        box-shadow: 0 8px 22px rgba(255, 122, 0, 0.35);
      }

      .cta-btn.is-ready:active {
        transform: scale(0.98);
      }

      .cta-btn ion-icon {
        font-size: 16px;
      }

      .cta-hint {
        margin: 8px 0 0;
        text-align: center;
        font-size: 10px;
        font-weight: 700;
        color: #9ca3af;
      }
    `,
  ],
})
export class VenueBookingPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  venueId: number | null = null;
  venue: VenueDetail | null = null;
  rentalItems: Record<string, number> = {};

  dates: DateItem[] = [];
  selectedDateIdx = 0;
  selectedSlots: string[] = [];

  readonly allSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
  ];

  readonly unavailableMock: Record<number, string[]> = {
    0: ['8:00 AM', '9:00 AM', '2:00 PM'],
    1: ['11:00 AM', '7:00 PM', '8:00 PM'],
    2: ['6:00 AM', '1:00 PM'],
    3: ['10:00 AM', '4:00 PM', '5:00 PM'],
  };

  ngOnInit() {
    this.dates = this.buildDates();

    this.route.paramMap.subscribe((params) => {
      const idStr = params.get('id');
      if (idStr) {
        this.venueId = +idStr;

        const nav = this.router.getCurrentNavigation();
        if (nav?.extras.state) {
          this.venue = nav.extras.state['venue'] as VenueDetail;
          this.rentalItems = (nav.extras.state['rentalItems'] || {}) as Record<string, number>;
        }

        if (!this.venue) {
          this.venue = VENUE_DATA.find((v) => v.id === this.venueId) || VENUE_DATA[0];
          this.rentalItems = {};
        }
      }
    });
  }

  buildDates(): DateItem[] {
    const today = new Date();
    const list: DateItem[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push({
        idx: i,
        dayShort: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: d.getDate(),
        monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel:
          i === 0
            ? 'Today'
            : i === 1
              ? 'Tomorrow'
              : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' }),
      });
    }
    return list;
  }

  get unavailable(): string[] {
    return this.unavailableMock[this.selectedDateIdx] || [];
  }

  get availableCount(): number {
    return this.allSlots.length - this.unavailable.length;
  }

  isSlotUnavailable(slot: string): boolean {
    return this.unavailable.includes(slot);
  }

  isSlotSelected(slot: string): boolean {
    return this.selectedSlots.includes(slot);
  }

  formatSlotLabel(slot: string): string {
    return slot.replace(':00', '');
  }

  selectDate(idx: number) {
    this.selectedDateIdx = idx;
    this.selectedSlots = [];
  }

  toggleSlot(slot: string) {
    if (this.isSlotUnavailable(slot)) return;

    const idx = this.allSlots.indexOf(slot);
    if (idx < 0) return;

    if (this.selectedSlots.includes(slot)) {
      const selectedIdx = this.sortedIndexes;
      const min = selectedIdx[0];
      const max = selectedIdx[selectedIdx.length - 1];
      if (idx === min || idx === max) {
        this.selectedSlots = this.selectedSlots.filter((s) => s !== slot);
      } else {
        this.selectedSlots = this.allSlots.slice(min, idx + 1).filter((s) => !this.isSlotUnavailable(s));
      }
      return;
    }

    if (!this.selectedSlots.length) {
      this.selectedSlots = [slot];
      return;
    }

    const selectedIdx = this.sortedIndexes;
    const min = selectedIdx[0];
    const max = selectedIdx[selectedIdx.length - 1];

    // Extend or rebuild a contiguous block between the current range and the tapped slot.
    const from = Math.min(min, idx);
    const to = Math.max(max, idx);
    const range = this.allSlots.slice(from, to + 1);
    if (range.some((s) => this.isSlotUnavailable(s))) {
      this.selectedSlots = [slot];
      return;
    }
    this.selectedSlots = range;
  }

  private get sortedIndexes(): number[] {
    return this.selectedSlots
      .map((s) => this.allSlots.indexOf(s))
      .filter((i) => i >= 0)
      .sort((a, b) => a - b);
  }

  get sortedSlots(): string[] {
    return [...this.selectedSlots].sort(
      (a, b) => this.allSlots.indexOf(a) - this.allSlots.indexOf(b),
    );
  }

  get selectedDateLabel(): string {
    return this.dates[this.selectedDateIdx]?.fullLabel || '';
  }

  get startSlot(): string {
    return this.sortedSlots[0] || '';
  }

  get hours(): number {
    return this.selectedSlots.length;
  }

  get totalCost(): number {
    if (!this.venue) return 0;
    return this.hours * this.venue.pricePerHour;
  }

  get rentalCost(): number {
    if (!this.venue) return 0;
    return Object.entries(this.rentalItems).reduce((sum, [itemId, qty]) => {
      const item = this.venue?.rentalEquipment.find((e) => e.id === itemId);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }

  get grandTotal(): number {
    return this.totalCost + this.rentalCost;
  }

  get endTime(): string {
    if (this.hours === 0 || !this.startSlot) return '';
    const [hm, ampm] = this.startSlot.split(' ');
    const [h, m] = hm.split(':').map(Number);
    let total =
      (ampm === 'PM' && h !== 12 ? h + 12 : h === 12 && ampm === 'AM' ? 0 : h) * 60 +
      m +
      this.hours * 60;
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    const endAmpm = endH >= 12 ? 'PM' : 'AM';
    const displayH = endH > 12 ? endH - 12 : endH === 0 ? 12 : endH;
    return `${displayH}:${endM.toString().padStart(2, '0')} ${endAmpm}`;
  }

  formatDuration(count: number): string {
    if (count === 0) return '';
    if (count === 1) return '1 hour';
    return `${count} hours`;
  }

  back() {
    this.router.navigateByUrl(`/app/venue/${this.venueId}`);
  }

  continueToSummary() {
    if (this.hours === 0 || !this.venue) return;
    const bookingDate = this.resolveBookingDateIso(this.selectedDateIdx);
    this.router.navigate([`/app/venue/${this.venueId}/summary`], {
      state: {
        venue: this.venue,
        selectedDate: this.selectedDateLabel,
        bookingDate,
        selectedSlots: this.sortedSlots,
        rentalItems: this.rentalItems,
      },
    });
  }

  private resolveBookingDateIso(idx: number): string {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + idx);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
