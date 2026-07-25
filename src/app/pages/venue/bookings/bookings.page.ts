import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingRecord } from '../../../core/models/api.model';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';
import { formatBookingDate, formatBookingTimeRange } from '../../../core/utils/booking.utils';

interface BookingItem {
  id: string;
  date: string;
  time: string;
  customer: string;
  customerPhone: string;
  customerEmail: string;
  court: string;
  sport: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  amount: string;
  durationLabel: string;
  paymentMethodLabel: string;
  paymentStatusLabel: string;
  couponLabel: string | null;
  rentals: Array<{ name: string; qty: number; lineTotal: string }>;
  raw: BookingRecord;
}

@Component({
  selector: 'app-venue-bookings-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell>
      <div class="bookings-page">
        <header class="page-header">
          <div class="page-header__row">
            <button type="button" class="icon-btn" (click)="goHome()" aria-label="Back">
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
            <h1>Bookings</h1>
            <button type="button" class="icon-btn" (click)="loadBookings()" aria-label="Refresh">
              <ion-icon name="refresh-outline"></ion-icon>
            </button>
          </div>

          <div class="search-wrap">
            <ion-icon name="search-outline"></ion-icon>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search bookings..." />
          </div>

          <div class="filter-row">
            <button
              type="button"
              class="filter-chip"
              *ngFor="let filter of filters"
              [class.active]="selectedFilter() === filter"
              (click)="selectedFilter.set(filter)"
            >
              {{ filter }}
            </button>
          </div>
        </header>

        <main class="page-body">
          <p *ngIf="loading()" class="status">Loading bookings…</p>
          <div *ngIf="!loading() && errorMessage()" class="error-box">{{ errorMessage() }}</div>

          <article class="booking-card" *ngFor="let booking of filteredBookings()">
            <div class="booking-card__top">
              <div class="booking-card__meta">
                <span><ion-icon name="calendar-outline"></ion-icon>{{ booking.date }}</span>
                <span><ion-icon name="time-outline"></ion-icon>{{ booking.time }}</span>
              </div>
              <p class="booking-card__amount">{{ booking.amount }}</p>
            </div>

            <div class="booking-card__main">
              <div class="booking-card__who">
                <p class="booking-card__name">{{ booking.customer }}</p>
                <p class="booking-card__court">{{ booking.court }} · {{ booking.sport }}</p>
                <p class="booking-card__contact" *ngIf="booking.customerPhone || booking.customerEmail">
                  <span *ngIf="booking.customerPhone"><ion-icon name="call-outline"></ion-icon>{{ booking.customerPhone }}</span>
                  <span *ngIf="booking.customerEmail"><ion-icon name="mail-outline"></ion-icon>{{ booking.customerEmail }}</span>
                </p>
              </div>
              <span class="status-badge" [attr.data-status]="booking.status">
                <ion-icon [name]="booking.status === 'confirmed' || booking.status === 'completed' ? 'checkmark-circle-outline' : 'time-outline'"></ion-icon>
                {{ booking.status }}
              </span>
            </div>

            <div class="detail-grid">
              <div class="detail-box">
                <p class="detail-box__label">Duration</p>
                <p class="detail-box__value">{{ booking.durationLabel }}</p>
              </div>
              <div class="detail-box">
                <p class="detail-box__label">Payment</p>
                <p class="detail-box__value">{{ booking.paymentMethodLabel }}</p>
                <p class="detail-box__sub">{{ booking.paymentStatusLabel }}</p>
              </div>
            </div>

            <div class="detail-box detail-box--full" *ngIf="booking.couponLabel">
              <p class="detail-box__label">Coupon</p>
              <p class="detail-box__value detail-box__value--green">{{ booking.couponLabel }}</p>
            </div>

            <div class="kit-box" *ngIf="booking.rentals.length">
              <p class="detail-box__label">Rental kit / equipment</p>
              <div class="kit-row" *ngFor="let item of booking.rentals">
                <span class="kit-name">{{ item.name }} × {{ item.qty }}</span>
                <strong>{{ item.lineTotal }}</strong>
              </div>
            </div>

            <div class="kit-box kit-box--empty" *ngIf="!booking.rentals.length">
              <p class="detail-box__label">Rental kit / equipment</p>
              <p class="detail-box__sub">No rental items selected</p>
            </div>

            <div class="booking-card__actions" *ngIf="booking.status === 'pending'">
              <button type="button" class="btn-accept" (click)="acceptBooking(booking.id)">Accept</button>
              <button type="button" class="btn-decline" (click)="declineBooking(booking.id)">Decline</button>
            </div>
          </article>

          <div *ngIf="!loading() && filteredBookings().length === 0" class="empty-state">
            <div class="empty-state__icon">
              <ion-icon name="calendar-clear-outline"></ion-icon>
            </div>
            <p class="empty-state__title">No venue bookings found</p>
            <p class="empty-state__text">Bookings made for your courts will appear here.</p>
          </div>
        </main>
      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    :host {
      display: block;
    }

    .bookings-page {
      min-height: 100%;
      background: #FAFBFC;
      padding-bottom: 120px;
    }

    .page-header {
      position: sticky;
      top: 0;
      z-index: 20;
      background: #fff;
      border-bottom: 1px solid #F3F4F6;
      padding: 8px 16px 12px;
    }

    .page-header__row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 48px;
      margin-bottom: 10px;
    }

    .page-header h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 900;
      color: #111827;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      background: #F3F4F6;
      color: #111827;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      flex-shrink: 0;
    }

    .icon-btn ion-icon {
      font-size: 18px;
    }

    .search-wrap {
      position: relative;
      margin-bottom: 12px;
    }

    .search-wrap ion-icon {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 18px;
      color: #9CA3AF;
      pointer-events: none;
    }

    .search-wrap input {
      width: 100%;
      height: 44px;
      border: 1.5px solid #E5E7EB;
      border-radius: 14px;
      background: #F9FAFB;
      padding: 0 14px 0 42px;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      outline: none;
      box-sizing: border-box;
    }

    .search-wrap input:focus {
      border-color: #8CF000;
      background: #fff;
    }

    .filter-row {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 2px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }

    .filter-row::-webkit-scrollbar {
      display: none;
    }

    .filter-chip {
      flex: 0 0 auto;
      height: 36px;
      min-width: auto;
      padding: 0 14px;
      border: 1.5px solid #E5E7EB;
      border-radius: 999px;
      background: #F3F4F6;
      color: #6B7280;
      font-size: 12px;
      font-weight: 800;
      text-transform: capitalize;
      letter-spacing: 0;
      white-space: nowrap;
      line-height: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .filter-chip.active {
      background: #8CF000;
      border-color: #8CF000;
      color: #111827;
    }

    .page-body {
      padding: 16px;
    }

    .status {
      margin: 0;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      color: #9CA3AF;
      padding: 24px 0;
    }

    .error-box {
      margin-bottom: 12px;
      border-radius: 16px;
      background: #FEF2F2;
      border: 1px solid #FECACA;
      padding: 12px 14px;
      font-size: 13px;
      font-weight: 700;
      color: #DC2626;
    }

    .booking-card {
      background: #fff;
      border: 1px solid #F3F4F6;
      border-radius: 20px;
      padding: 16px;
      margin-bottom: 12px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
    }

    .booking-card__top {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 10px;
    }

    .booking-card__meta {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      font-size: 11px;
      font-weight: 700;
      color: #9CA3AF;
    }

    .booking-card__meta span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .booking-card__meta ion-icon {
      font-size: 12px;
    }

    .booking-card__amount {
      margin: 0;
      font-size: 15px;
      font-weight: 900;
      color: #111827;
      flex-shrink: 0;
    }

    .booking-card__main {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 12px;
    }

    .booking-card__name {
      margin: 0;
      font-size: 15px;
      font-weight: 900;
      color: #111827;
    }

    .booking-card__court {
      margin: 4px 0 0;
      font-size: 12px;
      font-weight: 700;
      color: #9CA3AF;
    }

    .status-badge {
      flex-shrink: 0;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 5px 10px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      background: #F0FDF4;
      color: #16A34A;
    }

    .status-badge ion-icon {
      font-size: 12px;
    }

    .status-badge[data-status='pending'] {
      background: #FFF7ED;
      color: #C2410C;
    }

    .status-badge[data-status='cancelled'] {
      background: #FEF2F2;
      color: #DC2626;
    }

    .status-badge[data-status='completed'] {
      background: #EFF6FF;
      color: #2563EB;
    }

    .payment-box {
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
      padding: 10px 12px;
    }

    .payment-box__label {
      margin: 0 0 2px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #9CA3AF;
    }

    .payment-box__value {
      margin: 0;
      font-size: 13px;
      font-weight: 900;
      color: #111827;
    }

    .booking-card__contact {
      margin: 6px 0 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      font-size: 11px;
      font-weight: 700;
      color: #6B7280;
    }

    .booking-card__contact span {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .booking-card__contact ion-icon {
      font-size: 12px;
      color: #9CA3AF;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
      margin-bottom: 8px;
    }

    .detail-box {
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
      padding: 10px 12px;
    }

    .detail-box--full {
      margin-bottom: 8px;
    }

    .detail-box__label {
      margin: 0 0 4px;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      color: #9CA3AF;
    }

    .detail-box__value {
      margin: 0;
      font-size: 13px;
      font-weight: 900;
      color: #111827;
    }

    .detail-box__value--green {
      color: #16A34A;
    }

    .detail-box__sub {
      margin: 3px 0 0;
      font-size: 11px;
      font-weight: 700;
      color: #9CA3AF;
    }

    .kit-box {
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      border-radius: 12px;
      padding: 10px 12px;
      margin-bottom: 4px;
    }

    .kit-box--empty .detail-box__sub {
      margin-top: 2px;
    }

    .kit-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding-top: 6px;
    }

    .kit-name {
      font-size: 13px;
      font-weight: 700;
      color: #374151;
    }

    .kit-row strong {
      font-size: 13px;
      font-weight: 900;
      color: #111827;
    }

    .booking-card__actions {
      display: flex;
      gap: 8px;
      margin-top: 12px;
    }

    .btn-accept,
    .btn-decline {
      height: 40px;
      border: none;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 900;
      padding: 0 16px;
    }

    .btn-accept {
      flex: 1;
      background: linear-gradient(135deg, #8CF000, #A3E635);
      color: #111827;
      box-shadow: 0 4px 12px rgba(140, 240, 0, 0.28);
    }

    .btn-decline {
      background: #F3F4F6;
      color: #6B7280;
    }

    .empty-state {
      text-align: center;
      padding: 48px 16px;
    }

    .empty-state__icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 14px;
      border-radius: 20px;
      background: #F3F4F6;
      display: grid;
      place-items: center;
      color: #9CA3AF;
      font-size: 34px;
    }

    .empty-state__title {
      margin: 0;
      font-size: 15px;
      font-weight: 900;
      color: #111827;
    }

    .empty-state__text {
      margin: 6px 0 0;
      font-size: 12px;
      font-weight: 600;
      color: #9CA3AF;
    }
  `],
})
export class VenueBookingsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);

  searchQuery = '';
  selectedFilter = signal('all');
  loading = signal(false);
  errorMessage = signal('');
  bookings = signal<BookingItem[]>([]);

  readonly filters = ['all', 'confirmed', 'pending', 'completed', 'cancelled'];

  filteredBookings = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    return this.bookings().filter((b) => {
      const matchesSearch = !q
        || b.customer.toLowerCase().includes(q)
        || b.court.toLowerCase().includes(q)
        || b.sport.toLowerCase().includes(q);
      const matchesFilter = this.selectedFilter() === 'all' || b.status === this.selectedFilter();
      return matchesSearch && matchesFilter;
    });
  });

  ngOnInit() {
    void this.loadBookings();
  }

  async loadBookings() {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.bookingService.getMyBookings());
      if (!response.success || !response.data) {
        this.errorMessage.set(response.message || 'Unable to load bookings.');
        this.bookings.set([]);
        return;
      }

      const all = [
        ...(response.data.upcoming || []),
        ...(response.data.past || []),
        ...(response.data.cancelled || []),
        ...(response.data.completed || []),
      ];

      const venueBookings = all
        .map((b) => this.mapBooking(b))
        .sort((a, b) => String(b.raw.bookingDate || '').localeCompare(String(a.raw.bookingDate || ''))
          || String(b.raw.startTime || '').localeCompare(String(a.raw.startTime || '')));

      this.bookings.set(venueBookings);
    } catch (error: any) {
      this.errorMessage.set(error?.error?.message || String(error) || 'Unable to load bookings.');
      this.bookings.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async acceptBooking(id: string) {
    const item = this.bookings().find((b) => b.id === id);
    if (!item) return;
    try {
      await firstValueFrom(this.bookingService.updateBooking({
        booking_id: id,
        sport: item.raw.sport,
        venue_id: item.raw.venueId,
        date: item.raw.bookingDate,
        time: this.toAmPm(item.raw.startTime),
        team_size: item.raw.teamSize || String(item.raw.totalPlayers || 2),
      }));
      await this.loadBookings();
    } catch (error: any) {
      this.errorMessage.set(error?.error?.message || 'Unable to accept booking.');
    }
  }

  async declineBooking(id: string) {
    try {
      await firstValueFrom(this.bookingService.cancelBooking(id));
      await this.loadBookings();
    } catch (error: any) {
      this.errorMessage.set(error?.error?.message || 'Unable to decline booking.');
    }
  }

  goHome() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }

  private mapBooking(booking: BookingRecord): BookingItem {
    const status = this.normalizeStatus(booking.bookingStatus);
    const court = booking.slot?.courtName
      || (booking.calendarEvent?.meta?.['courtName'] as string)
      || 'Court';
    const hours = Math.max(1, Math.round((Number(booking.durationMinutes) || 60) / 60));
    const rentals = (Array.isArray(booking.rentalDetails) ? booking.rentalDetails : [])
      .filter((item) => Number(item?.qty || 0) > 0)
      .map((item) => {
        const qty = Number(item.qty || 0);
        const price = Number(item.price || 0);
        return {
          name: String(item.name || 'Equipment'),
          qty,
          lineTotal: `₹${(qty * price).toLocaleString('en-IN')}`,
        };
      });

    const method = String(booking.paymentMethod || '').toLowerCase();
    const payment = String(booking.paymentStatus || 'pending').toLowerCase();

    return {
      id: booking.id,
      date: formatBookingDate(booking.bookingDate),
      time: formatBookingTimeRange(booking.startTime, booking.endTime).replace(' · ', ' - '),
      customer: booking.host?.name || 'Player',
      customerPhone: String(booking.host?.phone || ''),
      customerEmail: String(booking.host?.email || ''),
      court,
      sport: this.titleCase(booking.sport || 'Sport'),
      status,
      amount: `₹${Number(booking.price || 0).toLocaleString('en-IN')}`,
      durationLabel: hours === 1 ? '1 hour' : `${hours} hours`,
      paymentMethodLabel: method === 'at_venue'
        ? 'Pay at venue'
        : method === 'online'
          ? 'Paid online'
          : 'Not specified',
      paymentStatusLabel: this.formatPaymentStatus(payment),
      couponLabel: booking.couponCode
        ? `${booking.couponCode}${booking.couponDiscount ? ` (−₹${Number(booking.couponDiscount).toLocaleString('en-IN')})` : ''}`
        : null,
      rentals,
      raw: booking,
    };
  }

  private formatPaymentStatus(status: string): string {
    if (status === 'paid' || status === 'completed') return 'Payment received';
    if (status === 'pay_at_venue') return 'Collect on arrival';
    if (status === 'pending') return 'Payment pending';
    return this.titleCase(status.replace(/_/g, ' '));
  }

  private normalizeStatus(status?: string | null): BookingItem['status'] {
    const value = String(status || '').toLowerCase();
    if (value === 'pending') return 'pending';
    if (value === 'cancelled' || value === 'expired') return 'cancelled';
    if (value === 'completed') return 'completed';
    return 'confirmed';
  }

  private toAmPm(time24?: string | null): string {
    if (!time24) return '6:00 AM';
    if (/am|pm/i.test(time24)) return time24;
    const [h = '0', m = '00'] = time24.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${suffix}`;
  }

  private titleCase(value: string): string {
    return value.replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
