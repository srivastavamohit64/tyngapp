import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { Subscription, firstValueFrom } from 'rxjs';
import { BookingRecord, MyBookingsResponse } from '../../core/models/api.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PlayerBookingCardComponent } from '../../shared/components/player-booking-card/player-booking-card.component';
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
    PlayerBookingCardComponent,
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

            <app-player-booking-card
              *ngFor="let booking of currentBookings"
              [booking]="booking"
              [nowTick]="nowTick"
              [segment]="activeSegment"
              [pendingNote]="booking.bookingStatus === 'pending' ? approvalCountdown(booking) : ''"
              (updated)="onBookingUpdated($event)"
              (viewDetails)="viewDetails($event)"
              (bookAgain)="bookAgain($event)"
            ></app-player-booking-card>
          </div>
        </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
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
        height: 280px;
        border-radius: 24px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;
      }

      @keyframes shimmer {
        0% { background-position: 100% 0; }
        100% { background-position: 0 0; }
      }
    `,
  ],
})
export class MyBookingsPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly auth = inject(AuthService);
  private readonly realtime = inject(RealtimeService);
  private readonly toastCtrl = inject(ToastController);

  activeSegment: 'upcoming' | 'past' = 'upcoming';
  loading = true;
  errorMessage = '';
  nowTick = Date.now();
  private timerId: number | null = null;
  private realtimeSub: Subscription | null = null;
  private silentReloadQueued = false;

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
    void this.bindRealtime();
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.realtimeSub?.unsubscribe();
  }

  ionViewWillEnter(): void {
    void this.loadBookings(undefined, true);
  }

  setSegment(value: string): void {
    if (value === 'upcoming' || value === 'past') {
      this.activeSegment = value;
    }
  }

  get segments(): SegmentOption[] {
    const upcoming = (this.bookings.counts.upcoming || 0) + (this.bookings.counts.invited || 0);
    const past = (this.bookings.counts.past || 0)
      + (this.bookings.counts.cancelled || 0)
      + (this.bookings.counts.completed || 0);
    return [
      { id: 'upcoming', label: `Upcoming (${upcoming})` },
      { id: 'past', label: `Past (${past})` },
    ];
  }

  get currentBookings(): BookingRecord[] {
    void this.nowTick;
    if (this.activeSegment === 'upcoming') {
      return [...(this.bookings.invited || []), ...(this.bookings.upcoming || [])];
    }
    const seen = new Set<string>();
    const list: BookingRecord[] = [];
    for (const booking of [...(this.bookings.past || []), ...(this.bookings.completed || []), ...(this.bookings.cancelled || [])]) {
      if (seen.has(String(booking.id))) continue;
      seen.add(String(booking.id));
      list.push(booking);
    }
    return list;
  }

  get emptyMessage(): string {
    if (this.activeSegment === 'past') {
      return 'Your finished, cancelled, and expired matches will appear here.';
    }
    return 'Create a new game or join an open booking to see it here.';
  }

  async loadBookings(event?: RefresherCustomEvent, silent = false): Promise<void> {
    if (!event && !silent) {
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

  bookAgain(booking: BookingRecord): void {
    if (booking.venueId) {
      void this.router.navigateByUrl(`/app/venue/${booking.venueId}/book`);
      return;
    }
    this.goCreateGame();
  }

  onBookingUpdated(booking: BookingRecord): void {
    this.patchLocalBooking(booking.id, booking);
    this.queueSilentReload();
  }

  approvalCountdown(booking: BookingRecord): string {
    void this.nowTick;
    const deadline = booking.approvalDeadlineAt;
    if (!deadline) {
      return 'Venue must approve within 10:00 or this booking will cancel automatically.';
    }
    const end = new Date(deadline).getTime();
    if (Number.isNaN(end)) {
      return 'Venue must approve within 10 minutes or this booking will cancel automatically.';
    }
    const remainingMs = end - this.nowTick;
    if (remainingMs <= 0) {
      return 'Approval window expired — refreshing…';
    }
    const totalSec = Math.ceil(remainingMs / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    const clock = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `Venue must approve within ${clock} or this booking will cancel automatically.`;
  }

  private async bindRealtime(): Promise<void> {
    try {
      await this.realtime.connect();
      this.realtimeSub = this.realtime.nearbyGames$.subscribe((event) => {
        this.handleRealtimeBooking(event.game, event.type === 'updated' ? event.action : 'created');
      });
    } catch {
      // Reverb optional — page still works via pull-to-refresh.
    }
  }

  private handleRealtimeBooking(game: BookingRecord, action: string): void {
    if (!game?.id) return;
    const userId = String(this.auth.user()?.id || '');
    if (!userId) return;

    const tracked = this.findLocalBooking(game.id);
    const isHost = String(game.hostUserId || '') === userId;
    if (!tracked && !isHost) return;

    // Instant optimistic status update (badge flips immediately).
    if (tracked) {
      this.patchLocalBooking(game.id, {
        bookingStatus: game.bookingStatus,
        paymentStatus: game.paymentStatus,
        approvalDeadlineAt: game.approvalDeadlineAt,
        currentPlayers: game.currentPlayers,
        availableSlots: game.availableSlots,
        canCancel: game.canCancel ?? tracked.canCancel,
        canJoin: game.canJoin ?? tracked.canJoin,
      });
    }

    if (action === 'approved') {
      void this.presentToast('Venue approved your booking', 'success');
    } else if (action === 'rejected') {
      void this.presentToast('Venue declined your booking', 'danger');
    } else if (action === 'cancelled') {
      void this.presentToast('Booking was cancelled', 'danger');
    }

    // Soft reload so lists/counts/permissions stay correct.
    this.queueSilentReload();
  }

  private findLocalBooking(id: string): BookingRecord | null {
    const buckets: (keyof Omit<MyBookingsResponse, 'counts'>)[] = [
      'upcoming',
      'invited',
      'past',
      'cancelled',
      'completed',
    ];
    for (const key of buckets) {
      const hit = (this.bookings[key] || []).find((b) => String(b.id) === String(id));
      if (hit) return hit;
    }
    return null;
  }

  private patchLocalBooking(id: string, patch: Partial<BookingRecord>): void {
    const buckets: (keyof Omit<MyBookingsResponse, 'counts'>)[] = [
      'upcoming',
      'invited',
      'past',
      'cancelled',
      'completed',
    ];
    let changed = false;
    const next: MyBookingsResponse = { ...this.bookings, counts: { ...this.bookings.counts } };
    for (const key of buckets) {
      const list = [...(this.bookings[key] || [])];
      const idx = list.findIndex((b) => String(b.id) === String(id));
      if (idx < 0) continue;
      list[idx] = { ...list[idx], ...patch };
      next[key] = list;
      changed = true;
    }
    if (changed) {
      this.bookings = next;
    }
  }

  private queueSilentReload(): void {
    if (this.silentReloadQueued) return;
    this.silentReloadQueued = true;
    window.setTimeout(() => {
      this.silentReloadQueued = false;
      void this.loadBookings(undefined, true);
    }, 250);
  }

  private startTimer(): void {
    if (this.timerId !== null) return;
    this.timerId = window.setInterval(() => {
      this.nowTick = Date.now();
    }, 15000);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
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
