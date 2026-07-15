import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonicModule, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingRecord, MyBookingsResponse } from '../../core/models/api.model';
import { BookingService } from '../../core/services/booking.service';
import {
  bookingStatusTone,
  formatBookingDate,
  formatBookingTimeRange,
  formatDurationLabel,
  formatStartsIn,
  sportEmoji,
} from '../../core/utils/booking.utils';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SegmentControlComponent, SegmentOption } from '../../shared/components/segment-control/segment-control.component';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    BrandHeaderShellComponent,
    PageHeaderComponent,
    SegmentControlComponent,
    TitleCasePipe,
  ],
  template: `
    <ion-content fullscreen class="has-tabs">
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-brand-header-shell>
        <main class="page-with-tab-bar min-h-full bg-[#FAFBFC] text-[#111827] pb-[calc(112px+env(safe-area-inset-bottom,0px))]">
          <app-page-header title="My Bookings" [hasSubContent]="true">
            <app-segment-control
              [options]="segments"
              [value]="activeSegment"
              (valueChange)="setSegment($event)"
            ></app-segment-control>
          </app-page-header>

          <div class="px-4 pt-4 space-y-4">
            <ng-container *ngIf="loading">
              <div *ngFor="let item of [1, 2]" class="skeleton-card"></div>
            </ng-container>

            <ng-container *ngIf="!loading && errorMessage && currentBookings.length === 0">
              <div class="state-card">
                <div class="state-icon">⚠️</div>
                <h3>Couldn’t load bookings</h3>
                <p>{{ errorMessage }}</p>
                <button type="button" class="state-btn" (click)="loadBookings()">Retry</button>
              </div>
            </ng-container>

            <ng-container *ngIf="!loading && !errorMessage && currentBookings.length === 0">
              <div class="state-card">
                <div class="state-icon">📅</div>
                <h3>No {{ activeSegment }} bookings</h3>
                <p>{{ emptyMessage }}</p>
                <button type="button" class="state-btn" (click)="goCreateGame()">Create Booking</button>
              </div>
            </ng-container>

            <ng-container *ngFor="let booking of currentBookings">
              <div
                class="bg-white overflow-hidden rounded-3xl booking-card"
                [style.border-left]="'4px solid ' + statusTone(booking).text"
              >
                <div class="px-4 pt-4 pb-3">
                  <div class="flex items-start justify-between gap-3 mb-3">
                    <div class="flex items-center gap-3 min-w-0">
                      <span class="text-3xl flex-shrink-0">{{ sportEmoji(booking.sport) }}</span>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="text-[15px] font-black text-[#111827] truncate">{{ booking.sport | titlecase }} Booking</span>
                          <span *ngIf="booking.isHost" class="tag tag-host">Host</span>
                          <span *ngIf="!booking.isHost && booking.isInvited" class="tag tag-invited">Invited</span>
                          <span *ngIf="!booking.isHost && !booking.isInvited && booking.isJoined" class="tag tag-joined">Joined</span>
                        </div>
                        <p class="text-[12px] text-[#9CA3AF] mt-1 flex items-center gap-1 truncate">
                          <ion-icon name="location-outline" class="text-[11px]"></ion-icon>
                          {{ booking.venue.name || 'Venue TBD' }}
                        </p>
                      </div>
                    </div>

                    <span
                      class="status-badge"
                      [style.background]="statusTone(booking).bg"
                      [style.color]="statusTone(booking).text"
                      [style.border-color]="statusTone(booking).border"
                    >
                      {{ booking.bookingStatus | titlecase }}
                    </span>
                  </div>

                  <div class="flex items-center gap-3 flex-wrap">
                    <div class="meta-chip">
                      <ion-icon name="calendar-outline"></ion-icon>
                      {{ formatBookingDate(booking.bookingDate) }}
                    </div>
                    <div class="meta-chip">
                      <ion-icon name="time-outline"></ion-icon>
                      {{ formatBookingTimeRange(booking.startTime, booking.endTime) }}
                    </div>
                    <span *ngIf="formatStartsIn(booking)" class="meta-pill">
                      <span class="h-1.5 w-1.5 rounded-full bg-[#FF7A00]"></span>
                      {{ formatStartsIn(booking) }}
                    </span>
                  </div>
                </div>

                <div class="px-4 pb-3">
                  <div class="bg-[#FAFBFC] border border-[#F3F4F6] rounded-2xl p-3.5 grid grid-cols-2 gap-3">
                    <div>
                      <p class="metric-label">Players</p>
                      <p class="metric-value">{{ booking.currentPlayers }}/{{ booking.totalPlayers }}</p>
                      <p class="metric-sub">{{ booking.availableSlots }} seats left</p>
                    </div>
                    <div>
                      <p class="metric-label">Host</p>
                      <p class="metric-value">{{ booking.host.name || '—' }}</p>
                    </div>
                    <div>
                      <p class="metric-label">Duration</p>
                      <p class="metric-value">{{ formatDurationLabel(booking.durationMinutes) }}</p>
                    </div>
                    <div>
                      <p class="metric-label">Payment</p>
                      <p class="metric-value">{{ booking.paymentStatus | titlecase }}</p>
                    </div>
                  </div>
                </div>

                <div class="px-4 pb-4 action-row">
                  <button type="button" class="btn btn-secondary" (click)="viewDetails(booking)">View Details</button>
                  <button
                    *ngIf="booking.canJoin"
                    type="button"
                    class="btn btn-primary"
                    [disabled]="isBusy(booking.id)"
                    (click)="joinBooking(booking)"
                  >
                    Join
                  </button>
                  <button
                    *ngIf="booking.canAcceptInvite"
                    type="button"
                    class="btn btn-primary"
                    [disabled]="isBusy(booking.id)"
                    (click)="acceptInvite(booking)"
                  >
                    Accept Invite
                  </button>
                  <button
                    *ngIf="booking.canRejectInvite"
                    type="button"
                    class="btn btn-secondary"
                    [disabled]="isBusy(booking.id)"
                    (click)="rejectInvite(booking)"
                  >
                    Reject Invite
                  </button>
                  <button
                    *ngIf="booking.canLeave"
                    type="button"
                    class="btn btn-secondary"
                    [disabled]="isBusy(booking.id)"
                    (click)="leaveBooking(booking)"
                  >
                    Leave
                  </button>
                  <button
                    *ngIf="booking.canCancel"
                    type="button"
                    class="btn btn-danger"
                    [disabled]="isBusy(booking.id)"
                    (click)="cancelBooking(booking)"
                  >
                    Cancel Booking
                  </button>
                </div>
              </div>
            </ng-container>
          </div>
        </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .booking-card {
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.08);
      }

      .status-badge {
        border: 1px solid transparent;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        line-height: 1;
        flex-shrink: 0;
      }

      .tag {
        padding: 2px 8px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
      }

      .tag-host {
        background: rgba(140, 240, 0, 0.15);
        color: #166534;
      }

      .tag-joined {
        background: rgba(251, 191, 36, 0.15);
        color: #b45309;
      }

      .tag-invited {
        background: rgba(59, 130, 246, 0.15);
        color: #1d4ed8;
      }

      .meta-chip {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: #6b7280;
        font-size: 11px;
        font-weight: 700;
      }

      .meta-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 4px 8px;
        border-radius: 999px;
        background: #fff7ed;
        color: #ff7a00;
        font-size: 10px;
        font-weight: 800;
      }

      .metric-label {
        font-size: 10px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        margin: 0 0 4px;
      }

      .metric-value {
        font-size: 13px;
        color: #111827;
        font-weight: 800;
        margin: 0;
      }

      .metric-sub {
        font-size: 10px;
        color: #ff7a00;
        font-weight: 700;
        margin: 4px 0 0;
      }

      .action-row {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .btn {
        min-height: unset;
        border-radius: 16px;
        padding: 12px 14px;
        font-size: 12px;
        font-weight: 800;
        transition: transform 160ms ease, box-shadow 160ms ease, opacity 160ms ease;
      }

      .btn:active {
        transform: scale(0.98);
      }

      .btn-primary {
        background: linear-gradient(135deg, #8cf000, #a3e635);
        color: #111827;
        box-shadow: 0 2px 8px rgba(140, 240, 0, 0.28);
      }

      .btn-secondary {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        color: #374151;
      }

      .btn-danger {
        background: #ef4444;
        color: #fff;
      }

      .state-card {
        background: #fff;
        border-radius: 24px;
        padding: 28px 20px;
        text-align: center;
        border: 1px solid #f3f4f6;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
      }

      .state-icon {
        font-size: 34px;
        margin-bottom: 10px;
      }

      .state-card h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 900;
        color: #111827;
      }

      .state-card p {
        margin: 8px 0 0;
        color: #6b7280;
        font-size: 13px;
        line-height: 1.5;
      }

      .state-btn {
        margin-top: 16px;
        min-height: unset;
        border-radius: 999px;
        padding: 12px 18px;
        background: #111827;
        color: #fff;
        font-size: 12px;
        font-weight: 800;
      }

      .skeleton-card {
        height: 220px;
        border-radius: 24px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;
      }

      @keyframes shimmer {
        0% {
          background-position: 100% 0;
        }
        100% {
          background-position: 0 0;
        }
      }
    `,
  ],
})
export class MyBookingsPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);

  activeSegment: keyof Omit<MyBookingsResponse, 'counts'> = 'upcoming';
  loading = true;
  errorMessage = '';
  busyIds = new Set<string>();
  nowTick = Date.now();
  private timerId: number | null = null;

  bookings: MyBookingsResponse = {
    upcoming: [],
    invited: [],
    past: [],
    cancelled: [],
    completed: [],
    counts: {
      upcoming: 0,
      invited: 0,
      past: 0,
      cancelled: 0,
      completed: 0,
    },
  };

  ngOnInit(): void {
    void this.loadBookings();
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  ionViewWillEnter(): void {
    void this.loadBookings();
  }

  setSegment(value: string): void {
    if (value === 'upcoming' || value === 'past' || value === 'cancelled' || value === 'completed') {
      this.activeSegment = value;
    }
  }

  get segments(): SegmentOption[] {
    return [
      { id: 'upcoming', label: 'Upcoming', count: (this.bookings.counts.upcoming || 0) + (this.bookings.counts.invited || 0) },
      { id: 'past', label: 'Past', count: this.bookings.counts.past },
      { id: 'cancelled', label: 'Cancelled', count: this.bookings.counts.cancelled },
      { id: 'completed', label: 'Completed', count: this.bookings.counts.completed },
    ];
  }

  get currentBookings(): BookingRecord[] {
    if (this.activeSegment === 'upcoming') {
      return [...(this.bookings.invited || []), ...(this.bookings.upcoming || [])];
    }

    return this.bookings[this.activeSegment] ?? [];
  }

  get emptyMessage(): string {
    switch (this.activeSegment) {
      case 'past':
        return 'Your finished and expired matches will appear here.';
      case 'cancelled':
        return 'Cancelled bookings will show up here for reference.';
      case 'completed':
        return 'Completed matches will appear here once they are marked done.';
      default:
        return 'Create a new game or join an open booking to see it here.';
    }
  }

  async loadBookings(event?: RefresherCustomEvent): Promise<void> {
    if (!event) {
      this.loading = true;
    }
    this.errorMessage = '';

    try {
      const response = await firstValueFrom(this.bookingService.getMyBookings());
      if (response.success && response.data) {
        this.bookings = response.data;
      } else {
        this.errorMessage = response.message || 'Failed to fetch bookings.';
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Unable to load your bookings right now.';
    } finally {
      this.loading = false;
      event?.target.complete();
    }
  }

  refresh(event: Event): void {
    void this.loadBookings(event as RefresherCustomEvent);
  }

  goCreateGame(): void {
    void this.router.navigateByUrl('/app/game/create');
  }

  viewDetails(booking: BookingRecord): void {
    void this.router.navigateByUrl(`/app/my-bookings/${booking.id}`);
  }

  isBusy(id: string): boolean {
    return this.busyIds.has(id);
  }

  async joinBooking(booking: BookingRecord): Promise<void> {
    await this.runBookingAction(booking.id, async () => {
      const response = await firstValueFrom(this.bookingService.joinBooking(booking.id));
      return response.message || 'Joined booking successfully.';
    });
  }

  async acceptInvite(booking: BookingRecord): Promise<void> {
    await this.runBookingAction(booking.id, async () => {
      const response = await firstValueFrom(this.bookingService.acceptInvite(booking.id));
      return response.message || 'Invite accepted successfully.';
    });
  }

  async rejectInvite(booking: BookingRecord): Promise<void> {
    await this.runBookingAction(booking.id, async () => {
      const response = await firstValueFrom(this.bookingService.rejectInvite(booking.id));
      return response.message || 'Invite rejected successfully.';
    });
  }

  async leaveBooking(booking: BookingRecord): Promise<void> {
    await this.runBookingAction(booking.id, async () => {
      const response = await firstValueFrom(this.bookingService.leaveBooking(booking.id));
      return response.message || 'Left booking successfully.';
    });
  }

  async cancelBooking(booking: BookingRecord): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Cancel booking?',
      message: 'This will release the venue slot and cancel the match for all players.',
      buttons: [
        { text: 'Keep Booking', role: 'cancel' },
        {
          text: 'Cancel Booking',
          role: 'destructive',
          handler: () => {
            void this.runBookingAction(booking.id, async () => {
              const response = await firstValueFrom(this.bookingService.cancelBooking(booking.id));
              return response.message || 'Booking cancelled successfully.';
            });
          },
        },
      ],
    });

    await alert.present();
  }

  sportEmoji = sportEmoji;
  formatBookingDate = formatBookingDate;
  formatBookingTimeRange = formatBookingTimeRange;
  formatDurationLabel = formatDurationLabel;

  formatStartsIn(booking: BookingRecord): string | null {
    return this.formatStartsInWithNow(booking, this.nowTick);
  }

  private formatStartsInWithNow(booking: BookingRecord, now: number): string | null {
    if (!booking.bookingDate || !booking.startTime) return null;
    const [hours = '0', minutes = '0'] = booking.startTime.split(':');
    const start = new Date(`${booking.bookingDate}T00:00:00`);
    if (Number.isNaN(start.getTime())) return null;
    start.setHours(Number(hours), Number(minutes), 0, 0);
    const diff = start.getTime() - now;
    if (diff <= 0) return null;
    const totalMinutes = Math.floor(diff / 60000);
    const hoursLeft = Math.floor(totalMinutes / 60);
    const minutesLeft = totalMinutes % 60;
    if (hoursLeft <= 0) return `Starts in ${minutesLeft}m`;
    return `Starts in ${hoursLeft}h ${minutesLeft}m`;
  }

  private startTimer(): void {
    if (this.timerId !== null) return;
    this.timerId = window.setInterval(() => {
      this.nowTick = Date.now();
    }, 60000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  statusTone(booking: BookingRecord) {
    return bookingStatusTone(booking.bookingStatus);
  }

  private async runBookingAction(id: string, action: () => Promise<string>): Promise<void> {
    if (this.busyIds.has(id)) return;
    this.busyIds.add(id);

    try {
      const message = await action();
      await this.presentToast(message, 'success');
      await this.loadBookings();
    } catch (error: any) {
      await this.presentToast(error?.error?.message || 'Action failed. Please try again.', 'danger');
    } finally {
      this.busyIds.delete(id);
    }
  }

  private async presentToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2200,
      color,
      position: 'bottom',
    });

    await toast.present();
  }
}
