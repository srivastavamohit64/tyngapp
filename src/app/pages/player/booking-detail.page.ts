import { CommonModule, Location, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule, RefresherCustomEvent, ToastController, ViewWillEnter } from '@ionic/angular';
import { Subscription, firstValueFrom } from 'rxjs';
import { BookingParticipant, BookingRecord, FriendItem } from '../../core/models/api.model';
import { BookingService } from '../../core/services/booking.service';
import { ChatService } from '../../core/services/chat.service';
import { AuthService } from '../../core/services/auth.service';
import { SocialService } from '../../core/services/social.service';
import {
  bookingStatusTone,
  formatBookingDate,
  formatBookingTime,
  formatBookingTimeRange,
  formatDurationLabel,
  gameChatMemberIds,
  sportEmoji,
} from '../../core/utils/booking.utils';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PlayerBookingCardComponent } from '../../shared/components/player-booking-card/player-booking-card.component';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageHeaderComponent, TitleCasePipe, PlayerBookingCardComponent],
  template: `
    <ion-content fullscreen>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-brand-header-shell [showBrand]="false">
        <main class="min-h-full bg-[#FAFBFC] text-[#111827] pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
          <app-page-header title="My Bookings" [showBack]="true" (back)="goBack()"></app-page-header>

          <div class="px-4 py-4 space-y-4" *ngIf="loading">
            <div class="skeleton-card"></div>
            <div class="skeleton-card small"></div>
          </div>

          <div class="px-4 py-4" *ngIf="!loading && errorMessage">
            <div class="state-card">
              <div class="state-icon">⚠️</div>
              <h3>Couldn’t load booking</h3>
              <p>{{ errorMessage }}</p>
              <button type="button" class="state-btn" (click)="loadBooking()">Retry</button>
            </div>
          </div>

          <ng-container *ngIf="!loading && booking">
            <div class="px-4 py-4 space-y-4">
              <app-player-booking-card
                [booking]="booking"
                [nowTick]="nowTick"
                variant="detail"
                [segment]="detailSegment"
                [pendingNote]="booking.bookingStatus === 'pending' ? 'Venue approval is still pending for this booking.' : ''"
                (updated)="booking = $event"
                (bookAgain)="bookAgain($event)"
              ></app-player-booking-card>

              <div class="detail-card" *ngIf="booking.session?.status === 'live' || booking.session?.status === 'ended'">
                <h3>Attendance</h3>
                <div class="detail-row"><span>Status</span><strong>{{ booking.session?.status === 'live' ? 'Live' : 'Ended' }}</strong></div>
                <div class="detail-row"><span>Checked in</span><strong>{{ booking.session?.checkedIn || 0 }}/{{ booking.session?.totalPlayers || booking.currentPlayers }}</strong></div>
                <div class="player-row" *ngFor="let row of booking.session?.attendance || []">
                  <div>
                    <strong>{{ row.name }}</strong>
                    <p>{{ row.status === 'checked_in' ? 'Checked In' : (row.status === 'late' ? 'Late' : (row.status === 'absent' ? 'Absent' : 'Awaiting')) }}</p>
                  </div>
                </div>
              </div>

              <div class="detail-card">
                <h3>Players</h3>
                <div class="players-list" *ngIf="joinedPlayers.length; else noPlayers">
                  <div class="player-row" *ngFor="let player of joinedPlayers">
                    <div>
                      <strong>{{ player.user?.name || 'Player' }}</strong>
                      <p>{{ player.role | titlecase }} · {{ player.status | titlecase }}</p>
                    </div>
                    <div class="text-right flex flex-col items-end gap-2">
                      <span>{{ player.user?.phone || player.user?.email || '—' }}</span>
                      <div class="flex gap-2" *ngIf="booking.isHost && player.role !== 'host'">
                        <button class="btn btn-secondary" [disabled]="actionLoading" (click)="replacePlayer(player.user.id)">Replace</button>
                        <button class="btn btn-secondary" [disabled]="actionLoading" (click)="removePlayer(player.user.id)">Remove</button>
                      </div>
                    </div>
                  </div>
                </div>
                <ng-template #noPlayers>
                  <p class="empty-copy">No players have joined yet.</p>
                </ng-template>

                <div class="invited-block" *ngIf="invitedPlayers.length">
                  <p class="invited-label">Invited</p>
                  <div class="player-row" *ngFor="let player of invitedPlayers">
                    <div>
                      <strong>{{ player.user?.name || 'Player' }}</strong>
                      <p>Invited</p>
                    </div>
                    <span>{{ player.user?.phone || player.user?.email || '—' }}</span>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
        </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .hero-card,
      .detail-card,
      .state-card {
        background: #fff;
        border-radius: 24px;
        border: 1px solid #f3f4f6;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
      }

      .hero-card,
      .detail-card {
        padding: 18px;
      }

      .status-badge {
        border: 1px solid transparent;
        padding: 6px 10px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 800;
        line-height: 1;
      }

      .info-tile {
        background: #fafbfc;
        border: 1px solid #f3f4f6;
        border-radius: 18px;
        padding: 12px;
      }

      .tile-label,
      .detail-row span {
        display: block;
        color: #9ca3af;
        font-size: 11px;
        font-weight: 700;
        margin-bottom: 4px;
      }

      .info-tile strong,
      .detail-row strong {
        color: #111827;
        font-size: 14px;
        font-weight: 800;
      }

      .detail-card h3 {
        margin: 0 0 14px;
        font-size: 16px;
        font-weight: 900;
        color: #111827;
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        gap: 12px;
        padding: 10px 0;
        border-bottom: 1px solid #f3f4f6;
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .detail-row span {
        margin-bottom: 0;
      }

      .detail-row strong {
        text-align: right;
        max-width: 60%;
      }

      .players-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-top: 8px;
      }

      .invited-block {
        margin-top: 14px;
      }

      .invited-label {
        margin: 0 0 8px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #9ca3af;
      }

      .player-row {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        padding: 12px 14px;
        border-radius: 18px;
        background: #fafbfc;
        border: 1px solid #f3f4f6;
      }

      .player-row strong {
        display: block;
        font-size: 13px;
        color: #111827;
      }

      .player-row p,
      .player-row span,
      .empty-copy,
      .state-card p {
        margin: 4px 0 0;
        color: #6b7280;
        font-size: 12px;
      }

      .rule-item {
        padding: 10px 0;
        color: #374151;
        font-size: 13px;
        border-bottom: 1px solid #f3f4f6;
      }

      .rule-item:last-child {
        border-bottom: none;
      }

      .action-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .btn,
      .state-btn {
        min-height: unset;
        border-radius: 16px;
        padding: 12px 16px;
        font-size: 12px;
        font-weight: 800;
      }

      .btn-primary {
        background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
        color: #111827;
        box-shadow: 0 2px 8px rgba(var(--app-primary-rgb), 0.28);
      }

      .btn-chat {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: #111827;
        color: #fff;
        width: 100%;
      }

      .action-bar .btn-chat {
        width: auto;
        flex: 1;
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
        padding: 28px 20px;
        text-align: center;
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

      .state-btn {
        margin-top: 16px;
        background: #111827;
        color: #fff;
      }

      .skeleton-card {
        height: 220px;
        border-radius: 24px;
        background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
        background-size: 400% 100%;
        animation: shimmer 1.4s ease infinite;
      }

      .skeleton-card.small {
        height: 160px;
      }

      @keyframes shimmer {
        0% { background-position: 100% 0; }
        100% { background-position: 0 0; }
      }
    `,
  ],
})
export class BookingDetailPage implements OnInit, OnDestroy, ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly bookingService = inject(BookingService);
  private readonly chat = inject(ChatService);
  private readonly auth = inject(AuthService);
  private readonly social = inject(SocialService);
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);

  booking: BookingRecord | null = null;
  loading = true;
  actionLoading = false;
  openingChat = false;
  errorMessage = '';
  nowTick = Date.now();
  private paramSub: Subscription | null = null;
  private timerId: number | null = null;

  ngOnInit(): void {
    this.timerId = window.setInterval(() => {
      this.nowTick = Date.now();
    }, 15000);
    this.paramSub = this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        void this.loadBooking();
      }
    });
  }

  ionViewWillEnter(): void {
    // Ionic caches pages — always refresh so newly joined players appear.
    if (this.bookingId) {
      void this.loadBooking();
    }
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  get detailSegment(): 'upcoming' | 'past' {
    const status = String(this.booking?.bookingStatus || '').toLowerCase();
    return ['cancelled', 'completed', 'expired'].includes(status) ? 'past' : 'upcoming';
  }

  get bookingId(): string {
    return this.route.snapshot.paramMap.get('id') || '';
  }

  get joinedPlayers(): BookingParticipant[] {
    const list = this.booking?.acceptedPlayers?.length
      ? this.booking.acceptedPlayers
      : (this.booking?.players || []).filter((p) =>
          ['joined', 'host'].includes(String(p.status || '').toLowerCase()),
        );
    return list || [];
  }

  get invitedPlayers(): BookingParticipant[] {
    const list = this.booking?.invitedPlayers?.length
      ? this.booking.invitedPlayers
      : (this.booking?.players || []).filter((p) => String(p.status || '').toLowerCase() === 'invited');
    return list || [];
  }

  /** Captain, joined player, or venue can open the shared game chat. */
  get canOpenGameChat(): boolean {
    if (!this.booking) return false;
    return !!(this.booking.isHost || this.booking.isJoined || this.booking.isVenue);
  }

  get canScanCheckIn(): boolean {
    const booking = this.booking;
    if (!booking || booking.session?.status !== 'live') return false;
    if (!(booking.isHost || booking.isJoined)) return false;
    const uid = String(this.auth.user()?.id || '');
    const mine = (booking.session?.attendance || []).find((row) => String(row.userId) === uid);
    return !mine || mine.status === 'awaiting';
  }

  openCheckIn(): void {
    const id = this.booking?.id;
    if (!id) return;
    void this.router.navigate(['/app/check-in'], { queryParams: { b: id } });
  }

  get statusTone() {
    return bookingStatusTone(this.booking?.bookingStatus || 'pending');
  }

  get coordinateLabel(): string {
    const lat = this.booking?.venue.coordinates?.lat;
    const lng = this.booking?.venue.coordinates?.lng;
    if (lat == null || lng == null) return 'Not available';
    return `${lat}, ${lng}`;
  }

  sportEmoji = sportEmoji;
  formatBookingDate = formatBookingDate;
  formatBookingTime = formatBookingTime;
  formatBookingTimeRange = formatBookingTimeRange;
  formatDurationLabel = formatDurationLabel;

  async loadBooking(event?: RefresherCustomEvent): Promise<void> {
    if (!event) this.loading = true;
    this.errorMessage = '';

    try {
      const response = await firstValueFrom(this.bookingService.getBooking(this.bookingId));
      if (response.success && response.data) {
        this.booking = response.data;
      } else {
        this.errorMessage = response.message || 'Failed to load booking details.';
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Unable to load booking details right now.';
    } finally {
      this.loading = false;
      event?.target.complete();
    }
  }

  refresh(event: Event): void {
    void this.loadBooking(event as RefresherCustomEvent);
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/app/my-bookings');
  }

  bookAgain(booking: BookingRecord): void {
    if (booking.venueId) {
      void this.router.navigateByUrl(`/app/venue/${booking.venueId}/book`);
      return;
    }
    void this.router.navigateByUrl('/app/game/create');
  }

  async openGameChat(): Promise<void> {
    if (!this.booking || this.openingChat || !this.canOpenGameChat) return;
    this.openingChat = true;
    try {
      const memberIds = gameChatMemberIds(this.booking);
      const res = await this.chat.openGame(this.booking.id, {
        title: `${this.booking.sport}${this.booking.bookingDate ? ' · ' + this.booking.bookingDate : ''}`,
        memberIds,
      });
      if (res.success && res.data?.id) {
        void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(res.data.id)}`);
        return;
      }
      await this.presentToast(res.message || 'Unable to open game chat.', 'danger');
    } catch (error: any) {
      await this.presentToast(error?.message || 'Unable to open game chat.', 'danger');
    } finally {
      this.openingChat = false;
    }
  }

  async joinBooking(): Promise<void> {
    if (!this.booking) return;
    await this.runAction(async () => {
      const response = await firstValueFrom(this.bookingService.joinBooking(this.booking!.id));
      return response.message || 'Joined booking successfully.';
    });
  }

  async leaveBooking(): Promise<void> {
    if (!this.booking) return;
    await this.runAction(async () => {
      const response = await firstValueFrom(this.bookingService.leaveBooking(this.booking!.id));
      return response.message || 'Left booking successfully.';
    });
  }

  async acceptInvite(): Promise<void> {
    if (!this.booking) return;
    await this.runAction(async () => {
      const response = await firstValueFrom(this.bookingService.acceptInvite(this.booking!.id));
      return response.message || 'Invite accepted successfully.';
    });
  }

  async rejectInvite(): Promise<void> {
    if (!this.booking) return;
    await this.runAction(async () => {
      const response = await firstValueFrom(this.bookingService.rejectInvite(this.booking!.id));
      return response.message || 'Invite rejected successfully.';
    });
  }

  async openInviteFriends(): Promise<void> {
    if (!this.booking) return;

    try {
      const response = await firstValueFrom(this.social.getFriends());
      const friends = response.data || [];

      if (!friends.length) {
        await this.presentToast('No friends available to invite.', 'danger');
        return;
      }

      const alert = await this.alertCtrl.create({
        header: 'Invite Friends',
        message: 'Select friends to invite to this booking.',
        inputs: friends.map((friend: FriendItem) => ({
          type: 'checkbox',
          label: `${friend.name} · ${friend.skill || 'Intermediate'} · ${friend.city || 'City not shared'}`,
          value: friend.id,
        })),
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Invite',
            handler: (selected: string[]) => {
              if (!selected?.length) return;
              void this.runAction(async () => {
                const inviteResponse = await firstValueFrom(this.bookingService.invitePlayers(this.booking!.id, selected));
                return inviteResponse.message || 'Players invited successfully.';
              });
            },
          },
        ],
      });

      await alert.present();
    } catch (error: any) {
      await this.presentToast(error?.error?.message || 'Failed to load friend list.', 'danger');
    }
  }

  async replacePlayer(currentPlayerId: string): Promise<void> {
    if (!this.booking) return;

    try {
      const response = await firstValueFrom(this.social.getFriends());
      const friends = (response.data || []).filter((friend) => friend.id !== currentPlayerId);
      if (!friends.length) {
        await this.presentToast('No friend available for replacement.', 'danger');
        return;
      }

      const alert = await this.alertCtrl.create({
        header: 'Replace Player',
        message: 'Select a friend to replace this player.',
        inputs: friends.map((friend) => ({
          type: 'radio',
          label: `${friend.name} · ${friend.skill || 'Intermediate'} · ${friend.city || 'City not shared'}`,
          value: friend.id,
        })),
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Replace',
            handler: (replacementPlayerId: string) => {
              if (!replacementPlayerId) return;
              void this.runAction(async () => {
                const updateResponse = await firstValueFrom(
                  this.bookingService.updateBookingPlayer(this.booking!.id, currentPlayerId, {
                    replacement_player_id: replacementPlayerId,
                  })
                );
                return updateResponse.message || 'Player replaced successfully.';
              });
            },
          },
        ],
      });

      await alert.present();
    } catch (error: any) {
      await this.presentToast(error?.error?.message || 'Failed to load friend list.', 'danger');
    }
  }

  async removePlayer(playerId: string): Promise<void> {
    if (!this.booking) return;

    const alert = await this.alertCtrl.create({
      header: 'Remove player?',
      message: 'This will remove the player from this booking.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            void this.runAction(async () => {
              const response = await firstValueFrom(this.bookingService.removeBookingPlayer(this.booking!.id, playerId));
              return response.message || 'Player removed successfully.';
            });
          },
        },
      ],
    });

    await alert.present();
  }

  async cancelBooking(): Promise<void> {
    if (!this.booking) return;

    const alert = await this.alertCtrl.create({
      header: 'Cancel booking?',
      message: 'This will cancel the booking and release the reserved venue slot.',
      buttons: [
        { text: 'Keep Booking', role: 'cancel' },
        {
          text: 'Cancel Booking',
          role: 'destructive',
          handler: () => {
            void this.runAction(async () => {
              const response = await firstValueFrom(this.bookingService.cancelBooking(this.booking!.id));
              return response.message || 'Booking cancelled successfully.';
            });
          },
        },
      ],
    });

    await alert.present();
  }

  private async runAction(action: () => Promise<string>): Promise<void> {
    if (this.actionLoading) return;
    this.actionLoading = true;

    try {
      const message = await action();
      await this.presentToast(message, 'success');
      await this.loadBooking();
    } catch (error: any) {
      await this.presentToast(error?.error?.message || 'Action failed. Please try again.', 'danger');
    } finally {
      this.actionLoading = false;
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
