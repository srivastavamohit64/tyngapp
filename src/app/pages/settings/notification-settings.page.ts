import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { AccountSettingsService, NotificationSettings } from '../../core/services/account-settings.service';

const CATEGORY_ICONS: Record<string, string> = {
  bookings: 'calendar-outline',
  chat: 'chatbubble-ellipses-outline',
  social: 'people-outline',
  wallet: 'wallet-outline',
  xp: 'trophy-outline',
  coaching: 'school-outline',
  announcements: 'megaphone-outline',
};

@Component({
  selector: 'app-notification-settings-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./settings.page.scss', './settings-subpage.scss'],
  template: `
    <ion-content fullscreen>
      <main class="settings-page">
        <header class="settings-header">
          <button type="button" class="back-btn" (click)="back()" aria-label="Back">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1 class="settings-title">Notifications</h1>
          <span class="header-spacer"></span>
        </header>

        <section class="settings-list" *ngIf="loading()">
          <div class="sub-skel-row" *ngFor="let i of [1, 2, 3, 4, 5, 6]">
            <span class="sub-skel-icon sub-shimmer"></span>
            <span class="sub-skel-copy"><span class="sub-shimmer"></span><span class="sub-shimmer"></span></span>
            <span class="sub-skel-toggle sub-shimmer"></span>
          </div>
        </section>

        <section class="settings-list" *ngIf="!loading() && error()">
          <div class="sub-empty">
            <ion-icon name="cloud-offline-outline"></ion-icon>
            <p class="sub-empty-title">Couldn't load your settings</p>
            <p class="sub-empty-copy">{{ error() }}</p>
            <button type="button" class="sub-primary-btn" (click)="load()">Try again</button>
          </div>
        </section>

        <section class="settings-list" *ngIf="!loading() && settings() as s">
          <div class="settings-row sub-master" [class.sub-master--off]="!s.enabled">
            <div class="row-icon"><ion-icon [name]="s.enabled ? 'notifications-outline' : 'notifications-off-outline'"></ion-icon></div>
            <div class="row-copy">
              <span class="row-label">Allow notifications</span>
              <span class="row-sub">{{ s.enabled ? 'You will get alerts for the categories turned on below.' : 'You will not receive any TYNG notifications.' }}</span>
            </div>
            <ion-toggle class="sub-toggle" [checked]="s.enabled" [disabled]="saving() === 'enabled'" (ionChange)="setEnabled($event.detail.checked)" aria-label="Allow notifications"></ion-toggle>
          </div>

          <p class="sub-section-label">Notify me about</p>

          <div class="settings-row" *ngFor="let item of s.catalog" [class.sub-row--muted]="!s.enabled">
            <div class="row-icon"><ion-icon [name]="icon(item.key)"></ion-icon></div>
            <div class="row-copy">
              <span class="row-label">{{ item.label }}</span>
              <span class="row-sub">{{ item.description }}</span>
            </div>
            <ion-toggle
              class="sub-toggle"
              [checked]="s.categories[item.key] !== false"
              [disabled]="!s.enabled || saving() === item.key"
              (ionChange)="setCategory(item.key, $event.detail.checked)"
              [attr.aria-label]="item.label"
            ></ion-toggle>
          </div>
        </section>
      </main>
    </ion-content>
  `,
})
export class NotificationSettingsPage implements OnInit {
  private readonly api = inject(AccountSettingsService);
  private readonly location = inject(Location);
  private readonly toast = inject(ToastController);

  readonly settings = signal<NotificationSettings | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly saving = signal<string | null>(null);

  ngOnInit(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.getNotificationSettings());
      this.settings.set(res.data ?? null);
    } catch {
      this.error.set('Check your connection and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  icon(key: string): string {
    return CATEGORY_ICONS[key] ?? 'notifications-outline';
  }

  setEnabled(enabled: boolean): void {
    void this.save('enabled', { enabled }, (s) => ({ ...s, enabled }));
  }

  setCategory(key: string, value: boolean): void {
    void this.save(key, { categories: { [key]: value } }, (s) => ({ ...s, categories: { ...s.categories, [key]: value } }));
  }

  back(): void {
    this.location.back();
  }

  private async save(
    key: string,
    changes: { enabled?: boolean; categories?: Record<string, boolean> },
    apply: (s: NotificationSettings) => NotificationSettings,
  ): Promise<void> {
    const previous = this.settings();
    if (!previous) return;
    this.settings.set(apply(previous));
    this.saving.set(key);
    try {
      const res = await firstValueFrom(this.api.updateNotificationSettings(changes));
      if (res.data) this.settings.set(res.data);
    } catch {
      this.settings.set({ ...previous });
      const toast = await this.toast.create({ message: "Couldn't save. Please try again.", duration: 2200, position: 'bottom' });
      await toast.present();
    } finally {
      this.saving.set(null);
    }
  }
}
