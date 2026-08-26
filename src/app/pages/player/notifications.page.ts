import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import {
  AppNotification,
  NotificationFeedService,
  NotificationCategory,
} from '../../core/services/notification-feed.service';

type FilterId = 'all' | 'games' | 'friends' | 'messages' | 'venues' | 'events' | 'rewards';
type Notif = AppNotification;

const FILTERS: { id: FilterId; label: string; emoji: string }[] = [
  { id: 'all', label: 'All', emoji: '🔔' },
  { id: 'games', label: 'Games', emoji: '⚽' },
  { id: 'friends', label: 'Friends', emoji: '👥' },
  { id: 'messages', label: 'Messages', emoji: '💬' },
  { id: 'venues', label: 'Venues', emoji: '🏟️' },
  { id: 'events', label: 'Events', emoji: '🏆' },
  { id: 'rewards', label: 'Rewards', emoji: '⭐' },
];

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <main class="notifications-page">
        <div class="notif-header">
          <button class="back-btn" (click)="back()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1 class="notif-title">Notifications</h1>
          <button class="mark-read-btn" (click)="markAllRead()" [disabled]="unreadCount() === 0">
            <ion-icon name="checkmark-done-outline"></ion-icon>
          </button>
        </div>

        <div class="filter-scroll">
          <div class="filter-track">
            <button
              *ngFor="let f of filters"
              class="filter-chip"
              [class.filter-chip-active]="activeFilter() === f.id"
              (click)="setFilter(f.id)"
            >
              <span>{{ f.emoji }}</span>
              <span>{{ f.label }}</span>
            </button>
          </div>
        </div>

        <div class="unread-bar" *ngIf="unreadCount() > 0">
          <span class="unread-dot"></span>
          <span class="unread-text">{{ unreadCount() }} unread</span>
          <button class="clear-btn" (click)="markAllRead()">Mark all read</button>
        </div>

        <div class="loading-bar" *ngIf="loading()">Loading notifications…</div>
        <div class="error-bar" *ngIf="error()">{{ error() }}</div>

        <div class="notif-content">
          <ng-container *ngIf="todayNotifs().length > 0">
            <div class="group-label">Today</div>
            <div class="notif-list">
              <ng-container *ngFor="let n of todayNotifs()">
                <ng-container *ngTemplateOutlet="cardTpl; context: { $implicit: n }"></ng-container>
              </ng-container>
            </div>
          </ng-container>

          <ng-container *ngIf="yesterdayNotifs().length > 0">
            <div class="group-label">Yesterday</div>
            <div class="notif-list">
              <ng-container *ngFor="let n of yesterdayNotifs()">
                <ng-container *ngTemplateOutlet="cardTpl; context: { $implicit: n }"></ng-container>
              </ng-container>
            </div>
          </ng-container>

          <ng-container *ngIf="earlierNotifs().length > 0">
            <div class="group-label">Earlier This Week</div>
            <div class="notif-list">
              <ng-container *ngFor="let n of earlierNotifs()">
                <ng-container *ngTemplateOutlet="cardTpl; context: { $implicit: n }"></ng-container>
              </ng-container>
            </div>
          </ng-container>

          <div *ngIf="!loading() && filteredNotifs().length === 0" class="empty-state">
            <div class="empty-icon">🔔</div>
            <div class="empty-title">No notifications</div>
            <div class="empty-desc">You're all caught up!</div>
          </div>

          <div style="height: 120px;"></div>
        </div>
      </main>

      <ng-template #cardTpl let-n>
        <div *ngIf="n.isAI" class="ai-card" (click)="openNotif(n)">
          <div class="ai-orb"></div>
          <div *ngIf="n.unread" class="unread-indicator"></div>
          <div class="ai-inner">
            <div class="ai-icon">✨</div>
            <div class="ai-text">
              <div class="ai-title">{{ n.title }}</div>
              <div class="ai-desc">{{ n.description }}</div>
              <div class="ai-time">{{ n.timestamp }}</div>
            </div>
          </div>
          <button *ngIf="n.primaryAction" class="action-btn-orange" (click)="handleAction(n); $event.stopPropagation()">
            {{ n.primaryAction.label }}
          </button>
        </div>

        <div
          *ngIf="n.isReward && !n.isAI"
          class="reward-card"
          [style.background]="n.gradient || 'linear-gradient(135deg,#111827,#1F2937)'"
          (click)="openNotif(n)"
        >
          <div class="reward-orb"></div>
          <div *ngIf="n.unread" class="unread-dot-white"></div>
          <div class="reward-inner">
            <div class="reward-emoji">{{ n.emoji }}</div>
            <div>
              <div class="reward-title">{{ n.title }}</div>
              <div class="reward-desc">{{ n.description }}</div>
              <div *ngIf="n.xp" class="xp-badge">⚡ +{{ n.xp }} TP</div>
            </div>
          </div>
        </div>

        <div
          *ngIf="!n.isAI && !n.isReward && !n.isWide"
          class="std-card"
          [class.std-card-unread]="n.unread"
          (click)="openNotif(n)"
        >
          <div *ngIf="n.unread" class="std-unread-bar"></div>
          <div *ngIf="n.avatar" class="std-avatar">
            <img [src]="n.avatar" [alt]="n.title" />
            <div *ngIf="n.messageCount" class="msg-badge">{{ n.messageCount }}</div>
          </div>
          <div *ngIf="n.image && !n.avatar" class="std-img">
            <img [src]="n.image" [alt]="n.title" />
            <div *ngIf="n.spotsLeft" class="spots-badge">{{ n.spotsLeft }} spots left</div>
          </div>
          <div *ngIf="!n.avatar && !n.image" class="std-icon">
            <span>{{ n.isRefund ? '💰' : n.isWeather ? '🌧️' : (n.emoji || '🔔') }}</span>
          </div>
          <div class="std-body">
            <div class="std-row">
              <div class="std-title">{{ n.title }}</div>
              <div class="std-time">{{ n.timestamp }}</div>
            </div>
            <div class="std-desc">{{ n.description }}</div>
            <div *ngIf="n.isRefund" class="refund-tag">💰 Refund Processed</div>
            <button
              *ngIf="n.primaryAction && n.primaryAction.style === 'green'"
              class="action-btn-green"
              (click)="handleAction(n); $event.stopPropagation()"
            >
              {{ n.primaryAction.label }}
            </button>
            <button
              *ngIf="n.primaryAction && n.primaryAction.style === 'orange'"
              class="action-btn-orange-sm"
              (click)="handleAction(n); $event.stopPropagation()"
            >
              {{ n.primaryAction.label }}
            </button>
          </div>
        </div>

        <div *ngIf="n.isWide" class="wide-card" (click)="openNotif(n)">
          <div *ngIf="n.image" class="wide-img">
            <img [src]="n.image" [alt]="n.title" />
            <div *ngIf="n.discount" class="discount-badge">{{ n.discount }}% OFF</div>
          </div>
          <div *ngIf="!n.image && n.gradient" class="wide-gradient" [style.background]="n.gradient">
            <div class="wide-emoji">{{ n.emoji }}</div>
          </div>
          <div class="wide-body">
            <div class="std-row">
              <div class="std-title">{{ n.title }}</div>
              <div class="std-time">{{ n.timestamp }}</div>
            </div>
            <div class="std-desc">{{ n.description }}</div>
            <button
              *ngIf="n.primaryAction"
              [class]="'action-btn-' + n.primaryAction.style"
              (click)="handleAction(n); $event.stopPropagation()"
            >
              {{ n.primaryAction.label }}
            </button>
          </div>
        </div>
      </ng-template>
    </ion-content>
  `,
  styles: [
    `
      .notifications-page {
        background: #fafbfc;
        min-height: 100%;
      }
      .notif-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: calc(16px + var(--app-chrome-top-inset, var(--safe-area-top))) 20px 16px;
        background: #ffffff;
        border-bottom: 1px solid #f3f4f6;
      }
      .back-btn,
      .mark-read-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #f3f4f6;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        font-size: 18px;
      }
      .mark-read-btn:disabled {
        opacity: 0.45;
      }
      .notif-title {
        font-size: 18px;
        font-weight: 800;
        color: #111827;
        margin: 0;
      }
      .filter-scroll {
        overflow-x: auto;
        padding: 12px 20px;
        background: #ffffff;
        -webkit-overflow-scrolling: touch;
      }
      .filter-scroll::-webkit-scrollbar {
        display: none;
      }
      .filter-track {
        display: flex;
        gap: 8px;
        width: max-content;
      }
      .filter-chip {
        display: flex;
        align-items: center;
        gap: 5px;
        padding: 7px 14px;
        border-radius: 999px;
        border: 1.5px solid #e5e7eb;
        background: #ffffff;
        font-size: 12px;
        font-weight: 600;
        color: #6b7280;
        white-space: nowrap;
        cursor: pointer;
      }
      .filter-chip-active {
        background: #111827;
        border-color: #111827;
        color: #ffffff;
      }
      .unread-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 20px;
        background: #fff7ed;
      }
      .unread-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff7a00;
      }
      .unread-text {
        flex: 1;
        font-size: 12px;
        font-weight: 700;
        color: #c2410c;
      }
      .clear-btn {
        border: none;
        background: transparent;
        color: #ff7a00;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
      }
      .loading-bar,
      .error-bar {
        padding: 10px 20px;
        font-size: 12px;
        font-weight: 600;
      }
      .loading-bar {
        color: #6b7280;
      }
      .error-bar {
        color: #dc2626;
        background: #fef2f2;
      }
      .notif-content {
        padding: 8px 16px 0;
      }
      .group-label {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #9ca3af;
        margin: 16px 4px 10px;
      }
      .notif-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .ai-card,
      .reward-card,
      .std-card,
      .wide-card {
        position: relative;
        border-radius: 20px;
        overflow: hidden;
        cursor: pointer;
      }
      .ai-card {
        background: linear-gradient(135deg, #fff7ed, #ffedd5);
        border: 1.5px solid #fdba74;
        padding: 16px;
      }
      .ai-orb {
        position: absolute;
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background: rgba(255, 122, 0, 0.15);
        top: -20px;
        right: -10px;
      }
      .unread-indicator,
      .unread-dot-white {
        position: absolute;
        top: 12px;
        right: 12px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #ff7a00;
      }
      .unread-dot-white {
        background: #8cf000;
      }
      .ai-inner {
        display: flex;
        gap: 12px;
        margin-bottom: 12px;
      }
      .ai-title {
        font-size: 14px;
        font-weight: 800;
        color: #111827;
      }
      .ai-desc {
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
        line-height: 1.4;
      }
      .ai-time {
        font-size: 10px;
        color: #9ca3af;
        margin-top: 6px;
        font-weight: 600;
      }
      .reward-card {
        padding: 16px;
        color: #fff;
      }
      .reward-orb {
        position: absolute;
        width: 90px;
        height: 90px;
        border-radius: 50%;
        background: rgba(140, 240, 0, 0.15);
        top: -24px;
        right: -16px;
      }
      .reward-inner {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        position: relative;
      }
      .reward-emoji {
        font-size: 28px;
      }
      .reward-title {
        font-size: 14px;
        font-weight: 800;
      }
      .reward-desc {
        font-size: 12px;
        opacity: 0.8;
        margin-top: 4px;
        line-height: 1.4;
      }
      .xp-badge {
        display: inline-flex;
        margin-top: 8px;
        padding: 4px 8px;
        border-radius: 999px;
        background: rgba(140, 240, 0, 0.2);
        color: #8cf000;
        font-size: 11px;
        font-weight: 800;
      }
      .std-card {
        display: flex;
        gap: 12px;
        background: #fff;
        padding: 14px;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
        border: 1.5px solid transparent;
      }
      .std-card-unread {
        border-color: rgba(255, 122, 0, 0.25);
        background: #fffcf8;
      }
      .std-unread-bar {
        position: absolute;
        left: 0;
        top: 0;
        bottom: 0;
        width: 3px;
        background: #ff7a00;
      }
      .std-avatar,
      .std-img,
      .std-icon {
        width: 48px;
        height: 48px;
        border-radius: 14px;
        overflow: hidden;
        flex-shrink: 0;
        position: relative;
        background: #f3f4f6;
        display: grid;
        place-items: center;
      }
      .std-avatar img,
      .std-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .msg-badge,
      .spots-badge {
        position: absolute;
        bottom: -4px;
        right: -4px;
        min-width: 18px;
        height: 18px;
        border-radius: 999px;
        background: #111827;
        color: #fff;
        font-size: 9px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 4px;
      }
      .spots-badge {
        background: #ff7a00;
        width: auto;
        padding: 0 6px;
      }
      .std-body {
        flex: 1;
        min-width: 0;
      }
      .std-row {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      .std-title {
        font-size: 13px;
        font-weight: 800;
        color: #111827;
      }
      .std-time {
        font-size: 10px;
        color: #9ca3af;
        font-weight: 600;
        white-space: nowrap;
      }
      .std-desc {
        font-size: 12px;
        color: #6b7280;
        margin-top: 4px;
        line-height: 1.4;
      }
      .refund-tag {
        display: inline-flex;
        margin-top: 8px;
        padding: 4px 8px;
        border-radius: 999px;
        background: #f3f4f6;
        font-size: 10px;
        font-weight: 700;
        color: #4b5563;
      }
      .wide-card {
        background: #fff;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
      }
      .wide-img {
        position: relative;
        height: 120px;
        overflow: hidden;
      }
      .wide-img img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .discount-badge {
        position: absolute;
        top: 10px;
        left: 10px;
        background: #ff7a00;
        color: #fff;
        font-size: 11px;
        font-weight: 900;
        padding: 4px 8px;
        border-radius: 999px;
      }
      .wide-gradient {
        height: 100px;
        display: grid;
        place-items: center;
      }
      .wide-emoji {
        font-size: 36px;
      }
      .wide-body {
        padding: 14px;
      }
      .action-btn-green,
      .action-btn-orange,
      .action-btn-orange-sm,
      .action-btn-white {
        margin-top: 10px;
        border: none;
        border-radius: 12px;
        padding: 10px 14px;
        font-size: 12px;
        font-weight: 800;
        cursor: pointer;
      }
      .action-btn-green {
        background: linear-gradient(135deg, #8cf000, #a3e635);
        color: #111827;
      }
      .action-btn-orange,
      .action-btn-orange-sm {
        background: linear-gradient(135deg, #ff7a00, #ff9a40);
        color: #fff;
        width: 100%;
      }
      .action-btn-orange-sm {
        width: auto;
      }
      .action-btn-white {
        background: #fff;
        color: #111827;
      }
      .empty-state {
        text-align: center;
        padding: 64px 24px;
      }
      .empty-icon {
        font-size: 48px;
        margin-bottom: 12px;
      }
      .empty-title {
        font-size: 18px;
        font-weight: 800;
        color: #111827;
        margin-bottom: 6px;
      }
      .empty-desc {
        font-size: 14px;
        color: #9ca3af;
      }
    `,
  ],
})
export class NotificationsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly feed = inject(NotificationFeedService);

  readonly filters = FILTERS;
  readonly activeFilter = signal<FilterId>('all');
  readonly loading = this.feed.loading;
  readonly error = this.feed.error;
  readonly notifications = this.feed.items;

  readonly filteredNotifs = computed(() => {
    const f = this.activeFilter();
    const list = this.notifications();
    if (f === 'all') return list;
    return list.filter((n) => n.category === f);
  });

  readonly unreadCount = computed(() => this.filteredNotifs().filter((n) => n.unread).length);
  readonly todayNotifs = computed(() => this.filteredNotifs().filter((n) => n.group === 'today'));
  readonly yesterdayNotifs = computed(() => this.filteredNotifs().filter((n) => n.group === 'yesterday'));
  readonly earlierNotifs = computed(() => this.filteredNotifs().filter((n) => n.group === 'earlier'));

  ngOnInit(): void {
    void this.reload();
  }

  setFilter(id: FilterId) {
    this.activeFilter.set(id);
    void this.reload();
  }

  async markAllRead() {
    await this.feed.markAllRead();
  }

  back() {
    void this.router.navigateByUrl('/app/home');
  }

  async openNotif(n: Notif) {
    if (n.unread) {
      await this.feed.markRead(n.id);
    }
    await this.handleAction(n);
  }

  async handleAction(n: Notif) {
    if (n.unread) {
      await this.feed.markRead(n.id);
    }
    if (n.route) {
      void this.router.navigateByUrl(n.route);
      return;
    }
    if (n.category === 'games') void this.router.navigateByUrl('/app/ongoing');
    else if (n.category === 'venues') void this.router.navigateByUrl('/app/venues');
    else if (n.category === 'friends') void this.router.navigateByUrl('/app/discover');
    else if (n.category === 'messages') void this.router.navigateByUrl('/app/chat');
    else if (n.category === 'events') void this.router.navigateByUrl('/app/ongoing');
    else if (n.category === 'rewards') void this.router.navigateByUrl('/app/wallet');
    else void this.router.navigateByUrl('/app/home');
  }

  private async reload() {
    await this.feed.load(this.activeFilter() as NotificationCategory);
  }
}
