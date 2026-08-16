import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ForegroundNotificationService } from '../../../core/services/foreground-notification.service';

@Component({
  selector: 'app-in-app-notification-banner',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div
      class="fg-notif-host"
      *ngIf="fg.current() as n"
      role="status"
      aria-live="polite"
    >
      <button
        type="button"
        class="fg-notif-card"
        (click)="fg.onBannerTap()"
      >
        <div class="fg-notif-accent"></div>
        <div class="fg-notif-icon" aria-hidden="true">
          <span>{{ n.emoji }}</span>
        </div>
        <div class="fg-notif-body">
          <div class="fg-notif-row">
            <div class="fg-notif-title">{{ n.title }}</div>
            <div class="fg-notif-time">Just now</div>
          </div>
          <div class="fg-notif-desc" *ngIf="n.body">{{ n.body }}</div>
        </div>
        <button
          type="button"
          class="fg-notif-close"
          aria-label="Dismiss notification"
          (click)="fg.dismiss(); $event.stopPropagation()"
        >
          <ion-icon name="close-outline"></ion-icon>
        </button>
      </button>
    </div>
  `,
  styles: [
    `
      .fg-notif-host {
        position: fixed;
        top: calc(12px + env(safe-area-inset-top, 0px));
        left: 12px;
        right: 12px;
        z-index: 100000;
        pointer-events: none;
        animation: fg-notif-in 280ms cubic-bezier(0.22, 1, 0.36, 1);
      }

      .fg-notif-card {
        pointer-events: auto;
        width: 100%;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        position: relative;
        text-align: left;
        border: 1.5px solid rgba(255, 122, 0, 0.22);
        border-radius: 18px;
        background: #fffcf8;
        box-shadow: 0 10px 36px rgba(17, 24, 39, 0.16);
        padding: 14px 40px 14px 14px;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }

      .fg-notif-accent {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        border-radius: 18px 0 0 18px;
        background: #ff7a00;
      }

      .fg-notif-icon {
        width: 44px;
        height: 44px;
        border-radius: 14px;
        background: #f3f4f6;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        font-size: 22px;
      }

      .fg-notif-body {
        flex: 1;
        min-width: 0;
      }

      .fg-notif-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        align-items: flex-start;
      }

      .fg-notif-title {
        font-size: 14px;
        font-weight: 800;
        color: #111827;
        line-height: 1.25;
      }

      .fg-notif-time {
        font-size: 10px;
        font-weight: 700;
        color: #9ca3af;
        flex-shrink: 0;
        padding-top: 2px;
      }

      .fg-notif-desc {
        margin-top: 4px;
        font-size: 12px;
        font-weight: 500;
        color: #6b7280;
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }

      .fg-notif-close {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 28px;
        height: 28px;
        border: none;
        border-radius: 999px;
        background: transparent;
        color: #9ca3af;
        display: grid;
        place-items: center;
        font-size: 18px;
        cursor: pointer;
        padding: 0;
      }

      @keyframes fg-notif-in {
        from {
          opacity: 0;
          transform: translateY(-16px) scale(0.98);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
    `,
  ],
})
export class InAppNotificationBannerComponent {
  readonly fg = inject(ForegroundNotificationService);
}
