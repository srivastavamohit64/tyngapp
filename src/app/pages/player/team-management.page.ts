import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonicModule, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingRecord, FriendItem } from '../../core/models/api.model';
import { BookingService } from '../../core/services/booking.service';
import { SocialService } from '../../core/services/social.service';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <main class="safe-area-top page-with-tab-bar px-6 py-4 bg-background text-foreground">
        <header class="flex items-center justify-between mb-6">
          <button (click)="back()" class="h-10 w-10 grid place-items-center rounded-full bg-card border border-border">
            <ion-icon name="chevron-back-outline" class="text-xl"></ion-icon>
          </button>
          <h1 class="text-lg font-bold text-center flex-1">Friends</h1>
          <button (click)="loadFriends()" class="h-10 w-10 grid place-items-center rounded-full bg-card border border-border">
            <ion-icon name="refresh-outline" class="text-lg"></ion-icon>
          </button>
        </header>

        <div *ngIf="loading" class="space-y-3 mb-6">
          <div class="h-20 rounded-2xl bg-slate-100 animate-pulse" *ngFor="let row of [1,2,3]"></div>
        </div>

        <div *ngIf="!loading && errorMessage" class="text-center bg-white rounded-2xl border border-[#F3F4F6] p-5 mb-6">
          <p class="text-[13px] text-red-500">{{ errorMessage }}</p>
          <button class="mt-3 px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-bold" (click)="loadFriends()">Retry</button>
        </div>

        <div class="space-y-4 mb-8" *ngIf="!loading && !errorMessage && friends.length">
          <div *ngFor="let friend of friends" class="bg-card border border-border rounded-2xl p-4 flex gap-4 items-center">
            <div class="h-12 w-12 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center text-2xl shadow-sm">
              <img *ngIf="friend.profileImage" [src]="friend.profileImage" class="w-full h-full object-cover" />
              <span *ngIf="!friend.profileImage">👤</span>
            </div>

            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-sm text-slate-900 leading-tight truncate">{{ friend.name }}</h3>
              <p class="text-xs text-slate-400 mt-1 truncate">{{ friend.sports.join(', ') || 'Cricket' }} · {{ friend.skill || 'Intermediate' }}</p>
              <p class="text-[11px] text-slate-400 mt-0.5">{{ friend.city || 'City not shared' }} · {{ friend.online ? 'Online' : friend.lastSeen || 'Recently' }}</p>
            </div>

            <div class="flex flex-col gap-2">
              <button class="px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-200" (click)="viewProfile(friend)">View</button>
              <button class="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#8CF000] text-[#111827]" (click)="inviteToGame(friend)">Invite</button>
              <button class="px-3 py-1.5 rounded-lg text-[10px] font-bold bg-[#EF4444] text-white" (click)="removeFriend(friend)">Remove</button>
            </div>
          </div>
        </div>

        <div *ngIf="!loading && !errorMessage && !friends.length" class="text-center py-10">
          <div class="text-4xl">🤝</div>
          <p class="text-sm text-slate-500 mt-2">No friends yet. Swipe right on Discover to add players.</p>
          <button class="mt-4 px-5 py-2 rounded-full bg-[#8CF000] text-[#111827] text-sm font-bold" (click)="goDiscover()">Go to Discover</button>
        </div>
      </main>
    </ion-content>
  `,
})
export class TeamManagementPage implements OnInit {
  private readonly router = inject(Router);
  private readonly social = inject(SocialService);
  private readonly bookingService = inject(BookingService);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

  loading = true;
  errorMessage = '';
  friends: FriendItem[] = [];

  ngOnInit(): void {
    void this.loadFriends();
  }

  async loadFriends(event?: RefresherCustomEvent): Promise<void> {
    if (!event) this.loading = true;
    this.errorMessage = '';

    try {
      const response = await firstValueFrom(this.social.getFriends());
      if (response.success && response.data) {
        this.friends = response.data;
      } else {
        this.errorMessage = response.message || 'Failed to load friends.';
      }
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Unable to load friends right now.';
    } finally {
      this.loading = false;
      event?.target.complete();
    }
  }

  refresh(event: Event): void {
    void this.loadFriends(event as RefresherCustomEvent);
  }

  back() {
    void this.router.navigateByUrl('/app/home');
  }

  goDiscover() {
    void this.router.navigateByUrl('/app/discover');
  }

  viewProfile(friend: FriendItem) {
    void this.router.navigateByUrl('/app/profile');
  }

  async inviteToGame(friend: FriendItem): Promise<void> {
    try {
      const upcomingResponse = await firstValueFrom(this.bookingService.getUpcomingBookings());
      const hosted = (upcomingResponse.data || []).filter((booking) => booking.isHost);

      if (!hosted.length) {
        await this.presentToast('You do not have any hosted upcoming booking to invite players.', 'danger');
        return;
      }

      const alert = await this.alertCtrl.create({
        header: 'Invite to Game',
        message: `Choose one of your upcoming games for ${friend.name}.`,
        inputs: hosted.map((booking) => ({
          type: 'radio',
          label: `${booking.sport} · ${booking.bookingDate} ${booking.startTime}`,
          value: booking.id,
        })),
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Invite',
            handler: (bookingId: string) => {
              if (!bookingId) return;
              void this.sendInvite(bookingId, friend.id);
            },
          },
        ],
      });

      await alert.present();
    } catch (error: any) {
      await this.presentToast(error?.error?.message || 'Failed to load upcoming bookings.', 'danger');
    }
  }

  async removeFriend(friend: FriendItem): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Remove friend?',
      message: `Remove ${friend.name} from your friend list?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Remove',
          role: 'destructive',
          handler: () => {
            void this.removeFriendConfirmed(friend.id);
          },
        },
      ],
    });

    await alert.present();
  }

  private async sendInvite(bookingId: string, friendId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.bookingService.invitePlayers(bookingId, [friendId]));
      await this.presentToast(response.message || 'Invitation sent successfully.', 'success');
    } catch (error: any) {
      await this.presentToast(error?.error?.message || 'Failed to send invitation.', 'danger');
    }
  }

  private async removeFriendConfirmed(friendId: string): Promise<void> {
    try {
      const response = await firstValueFrom(this.social.removeFriend(friendId));
      await this.presentToast(response.message || 'Friend removed.', 'success');
      await this.loadFriends();
    } catch (error: any) {
      await this.presentToast(error?.error?.message || 'Failed to remove friend.', 'danger');
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
