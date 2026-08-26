import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AppNotification, NotificationFeedService } from '../../core/services/notification-feed.service';

@Component({
  selector: 'app-venue-notifications',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="venue-notifications">
        <header class="venue-notifications-header">
          <button type="button" class="back-btn" (click)="back()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1>Notifications</h1>
          <button
            type="button"
            class="mark-btn"
            (click)="markAllRead()"
            [disabled]="unreadCount() === 0"
            aria-label="Mark all read"
          >
            <ion-icon name="checkmark-done-outline"></ion-icon>
          </button>
        </header>

        <div class="loading" *ngIf="loading()">Loading…</div>
        <div class="error" *ngIf="error()">{{ error() }}</div>

        <div class="venue-notifications-list" *ngIf="!loading()">
          <article
            *ngFor="let n of notifications()"
            class="notif-card"
            [class.notif-card--unread]="n.unread"
            (click)="open(n)"
          >
            <div class="notif-icon">{{ n.emoji || '🔔' }}</div>
            <div class="notif-body">
              <h2>{{ n.title }}</h2>
              <p>{{ n.description }}</p>
              <time>{{ n.timestamp }}</time>
            </div>
          </article>

          <div class="empty" *ngIf="notifications().length === 0">
            <div class="empty-icon">🔔</div>
            <p>No notifications yet</p>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .venue-notifications {
        min-height: 100%;
        background: #fafbfc;
        padding-bottom: calc(24px + var(--safe-area-bottom));
      }
      .venue-notifications-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 20px;
        padding-top: calc(12px + var(--app-chrome-top-inset, var(--safe-area-top)));
        background: #fff;
        border-bottom: 1px solid #f3f4f6;
        position: sticky;
        top: 0;
        z-index: 10;
      }
      .back-btn,
      .mark-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 12px;
        background: #f3f4f6;
        display: grid;
        place-items: center;
      }
      .mark-btn:disabled {
        opacity: 0.4;
      }
      h1 {
        flex: 1;
        text-align: center;
        margin: 0;
        font-size: 17px;
        font-weight: 900;
        color: #111827;
      }
      .loading,
      .error {
        padding: 12px 20px;
        font-size: 12px;
        font-weight: 600;
      }
      .error {
        color: #dc2626;
      }
      .venue-notifications-list {
        padding: 16px 20px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .notif-card {
        display: flex;
        gap: 12px;
        background: #fff;
        border-radius: 20px;
        padding: 16px;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
        border: 1.5px solid transparent;
        cursor: pointer;
      }
      .notif-card--unread {
        border-color: rgba(var(--app-primary-rgb), 0.25);
      }
      .notif-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #f3f4f6;
        display: grid;
        place-items: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .notif-body h2 {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 800;
        color: #111827;
      }
      .notif-body p {
        margin: 0 0 6px;
        font-size: 12px;
        color: #6b7280;
        line-height: 1.45;
      }
      .notif-body time {
        font-size: 10px;
        color: #9ca3af;
        font-weight: 600;
      }
      .empty {
        text-align: center;
        padding: 48px 16px;
        color: #9ca3af;
      }
      .empty-icon {
        font-size: 40px;
        margin-bottom: 8px;
      }
    `,
  ],
})
export class VenueNotificationsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly feed = inject(NotificationFeedService);

  readonly notifications = this.feed.items;
  readonly loading = this.feed.loading;
  readonly error = this.feed.error;
  readonly unreadCount = computed(() => this.notifications().filter((n) => n.unread).length);

  ngOnInit(): void {
    void this.feed.load('all');
  }

  async markAllRead() {
    await this.feed.markAllRead();
  }

  async open(n: AppNotification) {
    if (n.unread) {
      await this.feed.markRead(n.id);
    }
    void this.router.navigateByUrl(n.route || '/app/venue/bookings');
  }

  back() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }
}
