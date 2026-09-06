import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonicModule, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { FriendItem } from '../../core/models/api.model';
import { ChatService } from '../../core/services/chat.service';
import { SocialService } from '../../core/services/social.service';
import { SkeletonListComponent } from '../../shared/components/skeleton';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, IonicModule, SkeletonListComponent],
  template: `
    <ion-content fullscreen class="has-tabs">
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <main class="page-with-tab-bar friends-page">
        <header class="friends-header">
          <button type="button" class="icon-btn" (click)="back()" aria-label="Back">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <div class="header-titles">
            <h1>My Friends</h1>
            <p *ngIf="!loading && !errorMessage">{{ friends.length }} {{ friends.length === 1 ? 'friend' : 'friends' }}</p>
          </div>
          <button type="button" class="icon-btn" (click)="loadFriends()" aria-label="Refresh">
            <ion-icon name="refresh-outline"></ion-icon>
          </button>
        </header>

        <div *ngIf="loading && friends.length === 0" class="state-block">
          <app-skeleton-list [count]="5"></app-skeleton-list>
        </div>

        <div *ngIf="!loading && errorMessage && friends.length === 0" class="state-block state-block--center">
          <p class="error-text">{{ errorMessage }}</p>
          <button type="button" class="btn-primary" (click)="loadFriends()">Retry</button>
        </div>

        <div *ngIf="friends.length" class="friends-list">
          <article *ngFor="let friend of friends; let last = last" class="friend-row" [class.friend-row--last]="last">
            <div class="avatar" [class.avatar--online]="friend.online">
              <img *ngIf="friend.profileImage" [src]="friend.profileImage" [alt]="friend.name" />
              <span *ngIf="!friend.profileImage" class="avatar-fallback">{{ initials(friend.name) }}</span>
            </div>

            <div class="friend-info">
              <div class="friend-top">
                <h2>{{ friend.name }}</h2>
                <span *ngIf="friend.online" class="online-pill">Online</span>
              </div>
              <p class="friend-meta">
                {{ (friend.sports?.length ? friend.sports.join(', ') : 'Sports not set') }}
                <ng-container *ngIf="friend.skill"> · {{ friend.skill }}</ng-container>
              </p>
              <p class="friend-sub">
                {{ friend.city || 'City not shared' }}
                <ng-container *ngIf="!friend.online && friend.lastSeen"> · {{ friend.lastSeen }}</ng-container>
              </p>
            </div>

            <div class="friend-actions">
              <button type="button" class="btn-message" (click)="messageFriend(friend)">
                <ion-icon name="chatbubble-ellipses-outline"></ion-icon>
                <span>Message</span>
              </button>
              <button type="button" class="btn-icon-danger" (click)="removeFriend(friend)" aria-label="Remove friend">
                <ion-icon name="person-remove-outline"></ion-icon>
              </button>
            </div>
          </article>
        </div>

        <div *ngIf="!loading && !errorMessage && !friends.length" class="state-block state-block--center empty">
          <div class="empty-icon">🤝</div>
          <h2>No friends yet</h2>
          <p>Find players on Discover and add them to start messaging.</p>
          <button type="button" class="btn-primary" (click)="goDiscover()">Go to Discover</button>
        </div>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .friends-page {
        min-height: 100%;
        background: #fafbfc;
        color: #111827;
      }

      .friends-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: calc(16px + var(--app-chrome-top-inset, var(--safe-area-top))) 16px 12px;
        background: #fff;
        border-bottom: 1px solid #f1f5f9;
        position: sticky;
        top: 0;
        z-index: 10;
      }

      .header-titles {
        flex: 1;
        min-width: 0;
        text-align: center;
      }

      .header-titles h1 {
        margin: 0;
        font-size: 18px;
        font-weight: 800;
        letter-spacing: -0.02em;
      }

      .header-titles p {
        margin: 2px 0 0;
        font-size: 11px;
        font-weight: 600;
        color: #94a3b8;
      }

      .icon-btn {
        height: 40px;
        width: 40px;
        border-radius: 999px;
        border: 1px solid #e5e7eb;
        background: #fff;
        display: grid;
        place-items: center;
        color: #111827;
        flex-shrink: 0;
      }

      .icon-btn ion-icon {
        font-size: 20px;
      }

      .friends-list {
        background: #fff;
      }

      .friend-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 16px;
        border-bottom: 1px solid #f1f5f9;
      }

      .friend-row--last {
        border-bottom: none;
      }

      .avatar {
        position: relative;
        height: 48px;
        width: 48px;
        border-radius: 14px;
        overflow: hidden;
        background: #eef2ff;
        flex-shrink: 0;
        display: grid;
        place-items: center;
      }

      .avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .avatar-fallback {
        font-size: 14px;
        font-weight: 800;
        color: #4338ca;
        text-transform: uppercase;
      }

      .avatar--online::after {
        content: '';
        position: absolute;
        right: 3px;
        bottom: 3px;
        width: 9px;
        height: 9px;
        border-radius: 999px;
        background: #22c55e;
        border: 2px solid #fff;
      }

      .friend-info {
        flex: 1;
        min-width: 0;
      }

      .friend-top {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .friend-top h2 {
        margin: 0;
        font-size: 14px;
        font-weight: 800;
        color: #0f172a;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .online-pill {
        flex-shrink: 0;
        font-size: 10px;
        font-weight: 700;
        color: #15803d;
        background: #dcfce7;
        padding: 2px 7px;
        border-radius: 999px;
      }

      .friend-meta,
      .friend-sub {
        margin: 3px 0 0;
        font-size: 12px;
        color: #64748b;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .friend-sub {
        font-size: 11px;
        color: #94a3b8;
      }

      .friend-actions {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-shrink: 0;
      }

      .btn-message {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        height: 34px;
        padding: 0 12px;
        border: none;
        border-radius: 999px;
        background: #111827;
        color: #fff;
        font-size: 12px;
        font-weight: 700;
        line-height: 1;
        white-space: nowrap;
      }

      .btn-message ion-icon {
        font-size: 15px;
      }

      .btn-icon-danger {
        height: 34px;
        width: 34px;
        border-radius: 999px;
        border: 1px solid #fecaca;
        background: #fff;
        color: #dc2626;
        display: grid;
        place-items: center;
      }

      .btn-icon-danger ion-icon {
        font-size: 16px;
      }

      .state-block {
        padding: 20px 16px;
      }

      .state-block--center {
        text-align: center;
        padding-top: 48px;
      }

      .error-text {
        margin: 0 0 12px;
        color: #ef4444;
        font-size: 13px;
        font-weight: 600;
      }

      .empty-icon {
        font-size: 40px;
        margin-bottom: 8px;
      }

      .empty h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 800;
      }

      .empty p {
        margin: 8px auto 16px;
        max-width: 260px;
        font-size: 13px;
        color: #64748b;
        line-height: 1.45;
      }

      .btn-primary {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        height: 40px;
        padding: 0 18px;
        border: none;
        border-radius: 999px;
        background: var(--app-primary, #a3e635);
        color: #111827;
        font-size: 13px;
        font-weight: 800;
      }
    `,
  ],
})
export class TeamManagementPage implements OnInit {
  private readonly router = inject(Router);
  private readonly social = inject(SocialService);
  private readonly chat = inject(ChatService);
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

  initials(name: string): string {
    const parts = String(name || '')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
    if (!parts.length) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2);
    return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase();
  }

  back() {
    void this.router.navigateByUrl('/app/home');
  }

  goDiscover() {
    void this.router.navigateByUrl('/app/discover');
  }

  async messageFriend(friend: FriendItem): Promise<void> {
    try {
      const res = await this.chat.openPrivate({
        id: friend.id,
        name: friend.name,
        avatar: friend.profileImage ?? null,
      });
      if (res.success && res.data?.id) {
        void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(res.data.id)}`);
        return;
      }
      await this.presentToast(res.message || 'Unable to open chat.', 'danger');
    } catch (error: any) {
      await this.presentToast(error?.message || 'Unable to open chat.', 'danger');
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
