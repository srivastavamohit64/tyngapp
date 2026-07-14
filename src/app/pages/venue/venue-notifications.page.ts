import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

interface VenueNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  unread: boolean;
  emoji?: string;
}

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
          <span class="header-spacer"></span>
        </header>
        <div class="venue-notifications-list">
          <article *ngFor="let n of notifications" class="notif-card" [class.notif-card--unread]="n.unread">
            <div class="notif-icon">{{ n.emoji || '🔔' }}</div>
            <div class="notif-body">
              <h2>{{ n.title }}</h2>
              <p>{{ n.description }}</p>
              <time>{{ n.time }}</time>
            </div>
          </article>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .venue-notifications {
      min-height: 100%;
      background: #fafbfc;
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: calc(24px + env(safe-area-inset-bottom, 0px));
    }
    .venue-notifications-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 20px;
      background: #fff;
      border-bottom: 1px solid #f3f4f6;
      position: sticky;
      top: 0;
      z-index: 10;
    }
    .back-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      background: #f3f4f6;
      display: grid;
      place-items: center;
    }
    h1 {
      flex: 1;
      text-align: center;
      margin: 0;
      font-size: 17px;
      font-weight: 900;
      color: #111827;
    }
    .header-spacer { width: 40px; }
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
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
      border: 1.5px solid transparent;
    }
    .notif-card--unread {
      border-color: rgba(140,240,0,0.25);
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
  `],
})
export class VenueNotificationsPage {
  private readonly router = inject(Router);

  readonly notifications: VenueNotification[] = [
    { id: '1', title: 'New Booking Request', description: 'Vikram Singh requested Basketball Court 2 · 8:00 PM', time: '5 min ago', unread: true, emoji: '📅' },
    { id: '2', title: 'Payment Received', description: '₹2,400 received for Cricket session — Rahul Sharma', time: '12 min ago', unread: true, emoji: '💰' },
    { id: '3', title: 'Coach Partnership', description: 'Coach Deepika sent a partnership request', time: '1 hr ago', unread: false, emoji: '🤝' },
    { id: '4', title: 'Profile Tip', description: 'Add venue photos to improve search visibility by up to 40%', time: 'Yesterday', unread: false, emoji: '📷' },
  ];

  back() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }
}
