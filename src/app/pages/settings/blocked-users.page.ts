import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { AlertController, IonicModule, ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { BlockedUser, SocialService } from '../../core/services/social.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

@Component({
  selector: 'app-blocked-users-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./settings.page.scss', './settings-subpage.scss'],
  styles: [`
    .bu-avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
      background: #f3f4f6;
      display: grid;
      place-items: center;
      font-size: 16px;
      font-weight: 900;
      color: #6b7280;
    }

    .bu-unblock {
      flex-shrink: 0;
      padding: 8px 14px;
      border: 1.5px solid #111827;
      border-radius: 12px;
      background: #fff;
      color: #111827;
      font-size: 12px;
      font-weight: 800;
    }

    .bu-unblock:disabled { opacity: 0.5; }

    .bu-note {
      margin: 0 4px;
      font-size: 12px;
      line-height: 1.5;
      color: #6b7280;
    }
  `],
  template: `
    <ion-content fullscreen>
      <main class="settings-page">
        <header class="settings-header">
          <button type="button" class="back-btn" (click)="back()" aria-label="Back">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1 class="settings-title">Blocked Users</h1>
          <span class="header-spacer"></span>
        </header>

        <section class="settings-list" *ngIf="loading()">
          <div class="sub-skel-row" *ngFor="let i of [1, 2, 3, 4]">
            <span class="sub-skel-avatar sub-shimmer"></span>
            <span class="sub-skel-copy"><span class="sub-shimmer"></span><span class="sub-shimmer"></span></span>
            <span class="sub-skel-toggle sub-shimmer"></span>
          </div>
        </section>

        <section class="settings-list" *ngIf="!loading() && error()">
          <div class="sub-empty">
            <ion-icon name="cloud-offline-outline"></ion-icon>
            <p class="sub-empty-title">Couldn't load blocked users</p>
            <p class="sub-empty-copy">{{ error() }}</p>
            <button type="button" class="sub-primary-btn" (click)="load()">Try again</button>
          </div>
        </section>

        <section class="settings-list" *ngIf="!loading() && !error()">
          <p class="bu-note">Blocked people can't message you, invite you to games or find you in search, and you won't see them either.</p>

          <div class="sub-empty" *ngIf="!users().length">
            <ion-icon name="ban-outline"></ion-icon>
            <p class="sub-empty-title">No blocked users</p>
            <p class="sub-empty-copy">You can block someone from their profile using the menu at the top.</p>
          </div>

          <div class="settings-row" *ngFor="let user of users(); trackBy: trackById">
            <img *ngIf="photo(user.profileImage) as src; else initials" class="bu-avatar" [src]="src" alt="" />
            <ng-template #initials><span class="bu-avatar">{{ (user.name || '?').charAt(0).toUpperCase() }}</span></ng-template>
            <div class="row-copy">
              <span class="row-label">{{ user.name }}</span>
              <span class="row-sub">@{{ user.username }}<ng-container *ngIf="user.blockedAt"> · Blocked {{ user.blockedAt | date: 'd MMM yyyy' }}</ng-container></span>
            </div>
            <button type="button" class="bu-unblock" [disabled]="busyId() === user.id" (click)="confirmUnblock(user)">
              {{ busyId() === user.id ? 'Unblocking…' : 'Unblock' }}
            </button>
          </div>
        </section>
      </main>
    </ion-content>
  `,
})
export class BlockedUsersPage implements OnInit {
  private readonly social = inject(SocialService);
  private readonly location = inject(Location);
  private readonly router = inject(Router);
  private readonly alerts = inject(AlertController);
  private readonly toast = inject(ToastController);

  readonly users = signal<BlockedUser[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly busyId = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.social.getBlockedUsers());
      this.users.set(res.data?.items ?? []);
    } catch {
      this.error.set('Check your connection and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  photo(url: string | null): string | null {
    return resolveMediaUrl(url);
  }

  trackById(_: number, user: BlockedUser): string {
    return user.id;
  }

  async confirmUnblock(user: BlockedUser): Promise<void> {
    const alert = await this.alerts.create({
      header: `Unblock ${user.name}?`,
      message: 'They will be able to find you, message you and invite you to games again.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Unblock', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;

    this.busyId.set(user.id);
    try {
      await firstValueFrom(this.social.unblockUser(user.id));
      this.users.update((items) => items.filter((item) => item.id !== user.id));
      await this.showToast(`${user.name} unblocked`);
    } catch {
      await this.showToast("Couldn't unblock. Please try again.");
    } finally {
      this.busyId.set(null);
    }
  }

  back(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/app/home');
  }

  private async showToast(message: string): Promise<void> {
    const toast = await this.toast.create({ message, duration: 2200, position: 'bottom' });
    await toast.present();
  }
}
