import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingRecord, FriendItem } from '../../core/models/api.model';
import { BookingService } from '../../core/services/booking.service';
import { SocialService } from '../../core/services/social.service';
import {
  bookingStatusTone,
  formatBookingDate,
  formatBookingTime,
  formatBookingTimeRange,
  formatDurationLabel,
  sportEmoji,
} from '../../core/utils/booking.utils';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-booking-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageHeaderComponent, TitleCasePipe],
  template: `
    <ion-content fullscreen>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-brand-header-shell [showBrand]="false">
        <main class="min-h-full bg-[#FAFBFC] text-[#111827] pb-[calc(96px+env(safe-area-inset-bottom,0px))]">
          <app-page-header title="Booking Details" [showBack]="true" (back)="goBack()"></app-page-header>

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
              <div class="hero-card">
                <div class="flex items-start justify-between gap-3">
                  <div class="flex items-center gap-3 min-w-0">
                    <span class="text-4xl">{{ sportEmoji(booking.sport) }}</span>
                    <div class="min-w-0">
                      <h2 class="text-[20px] font-black text-[#111827] m-0">{{ booking.sport | titlecase }} Booking</h2>
                      <p class="text-[13px] text-[#6B7280] mt-1 mb-0">{{ booking.venue.name || 'Venue TBD' }}</p>
                    </div>
                  </div>
                  <span class="status-badge" [style.background]="statusTone.bg" [style.color]="statusTone.text" [style.border-color]="statusTone.border">
                    {{ booking.bookingStatus | titlecase }}
                  </span>
                </div>

                <div class="grid grid-cols-2 gap-3 mt-4">
                  <div class="info-tile">
                    <span class="tile-label">Date</span>
                    <strong>{{ formatBookingDate(booking.bookingDate) }}</strong>
                  </div>
                  <div class="info-tile">
                    <span class="tile-label">Time</span>
                    <strong>{{ formatBookingTimeRange(booking.startTime, booking.endTime) }}</strong>
                  </div>
                  <div class="info-tile">
                    <span class="tile-label">Duration</span>
                    <strong>{{ formatDurationLabel(booking.durationMinutes) }}</strong>
                  </div>
                  <div class="info-tile">
                    <span class="tile-label">Players</span>
                    <strong>{{ booking.currentPlayers }}/{{ booking.totalPlayers }}</strong>
                  </div>
                </div>
              </div>

              <div class="detail-card">
                <h3>Venue</h3>
                <div class="detail-row"><span>Name</span><strong>{{ booking.venue.name || '—' }}</strong></div>
                <div class="detail-row"><span>Address</span><strong>{{ booking.venue.address || booking.venue.location || '—' }}</strong></div>
                <div class="detail-row"><span>Coordinates</span><strong>{{ coordinateLabel }}</strong></div>
              </div>

              <div class="detail-card">
                <h3>Host & Players</h3>
                <div class="detail-row"><span>Host</span><strong>{{ booking.host.name || '—' }}</strong></div>
                <div class="detail-row"><span>Pending Invitations</span><strong>{{ booking.pendingInvitations || 0 }}</strong></div>

                <div class="players-list">
                  <div class="player-row" *ngFor="let player of booking.players">
                    <div>
                      <strong>{{ player.user.name || 'Player' }}</strong>
                      <p>{{ player.role | titlecase }} · {{ player.status | titlecase }}</p>
                    </div>
                    <div class="text-right flex flex-col items-end gap-2">
                      <span>{{ player.user.phone || player.user.email || '—' }}</span>
                      <div class="flex gap-2" *ngIf="booking.isHost && player.role !== 'host'">
                        <button
                          class="btn btn-secondary"
                          [disabled]="actionLoading"
                          (click)="replacePlayer(player.user.id)"
                        >
                          Replace
                        </button>
                        <button
                          class="btn btn-secondary"
                          [disabled]="actionLoading"
                          (click)="removePlayer(player.user.id)"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  *ngIf="booking.isHost"
                  type="button"
                  class="btn btn-primary mt-3"
                  [disabled]="actionLoading"
                  (click)="openInviteFriends()"
                >
                  Add / Invite Player
                </button>
              </div>

              <div class="detail-card">
                <h3>Booking Info</h3>
                <div class="detail-row"><span>Price</span><strong>₹{{ booking.price || 0 }}</strong></div>
                <div class="detail-row"><span>Skill Level</span><strong>{{ booking.skillLevel || 'Open' }}</strong></div>
                <div class="detail-row"><span>Payment</span><strong>{{ booking.paymentStatus | titlecase }}</strong></div>
                <div class="detail-row"><span>Starts</span><strong>{{ formatBookingTime(booking.startTime) }}</strong></div>
              </div>

              <div class="detail-card">
                <h3>Rules</h3>
                <div *ngIf="booking.rules?.length; else noRules">
                  <div class="rule-item" *ngFor="let rule of booking.rules">• {{ rule }}</div>
                </div>
                <ng-template #noRules>
                  <p class="empty-copy">No venue rules have been added for this booking yet.</p>
                </ng-template>
              </div>

              <div class="action-bar" *ngIf="booking.canJoin || booking.canLeave || booking.canCancel || booking.canAcceptInvite || booking.canRejectInvite">
                <button *ngIf="booking.canJoin" type="button" class="btn btn-primary" [disabled]="actionLoading" (click)="joinBooking()">Join</button>
                <button *ngIf="booking.canAcceptInvite" type="button" class="btn btn-primary" [disabled]="actionLoading" (click)="acceptInvite()">Accept Invite</button>
                <button *ngIf="booking.canRejectInvite" type="button" class="btn btn-secondary" [disabled]="actionLoading" (click)="rejectInvite()">Reject Invite</button>
                <button *ngIf="booking.canLeave" type="button" class="btn btn-secondary" [disabled]="actionLoading" (click)="leaveBooking()">Leave</button>
                <button *ngIf="booking.canCancel" type="button" class="btn btn-danger" [disabled]="actionLoading" (click)="cancelBooking()">Cancel Booking</button>
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
export class BookingDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly social = inject(SocialService);
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);

  booking: BookingRecord | null = null;
  loading = true;
  actionLoading = false;
  errorMessage = '';

  ngOnInit(): void {
    void this.loadBooking();
  }

  get bookingId(): string {
    return this.route.snapshot.paramMap.get('id') || '';
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
    void this.router.navigateByUrl('/app/my-bookings');
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
