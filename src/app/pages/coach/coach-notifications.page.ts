import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import {
  AppNotification,
  NotificationFeedService,
  NotificationCategory,
} from '../../core/services/notification-feed.service';
import { SkeletonListComponent } from '../../shared/components/skeleton';

type CoachNotif = AppNotification & {
  secondaryAction?: { label: string; style: 'red' };
};

const FILTERS = [
  { id: 'all', label: 'All', emoji: '🔔' },
  { id: 'messages', label: 'Messages', emoji: '💬' },
  { id: 'bookings', label: 'Bookings', emoji: '📅' },
  { id: 'students', label: 'Students', emoji: '🎓' },
  { id: 'venues', label: 'Venues', emoji: '🏟️' },
  { id: 'achievements', label: 'Achievements', emoji: '🥇' },
  { id: 'payments', label: 'Payments', emoji: '💰' },
];

@Component({
  selector: 'app-coach-notifications',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, SkeletonListComponent],
  template: `
    <ion-content [fullscreen]="true">
      <div class="notifications-page pb-28">
        <!-- Sticky Header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="notif-header flex items-center justify-between px-5 pb-3">
            <div class="flex items-center gap-3">
              <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-full bg-[#F3F4F6] border-none">
                <ion-icon name="chevron-back-outline" class="text-[#111827] text-xl"></ion-icon>
              </button>
              <div class="flex items-center gap-2">
                <h1 class="text-[18px] font-extrabold text-[#111827] tracking-tight m-0">Notifications</h1>
                <div *ngIf="totalUnread() > 0" class="min-w-[22px] h-[22px] rounded-full bg-[#FF7A00] flex items-center justify-center px-1.5">
                  <span class="text-[11px] font-black text-white">{{ totalUnread() }}</span>
                </div>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <button *ngIf="totalUnread() > 0" (click)="markAllRead()" class="hidden min-[390px]:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#F3F4F6] text-[12px] font-bold text-[#6B7280] border-none">
                <ion-icon name="checkmark-done-outline"></ion-icon>
                Mark all read
              </button>
              <button (click)="markAllRead()" [disabled]="totalUnread() === 0" class="w-10 h-10 flex items-center justify-center rounded-full bg-[#F3F4F6] border-none disabled:opacity-40">
                <ion-icon name="checkmark-done-outline" class="text-[#6B7280] text-lg"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Filter horizontal chips scroll -->
          <div class="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
            <button *ngFor="let f of filters" (click)="setFilter(f.id)" class="flex items-center gap-1.5 px-3.5 py-2 rounded-full whitespace-nowrap flex-shrink-0 text-[12px] font-bold transition-all border-none"
              [style.backgroundColor]="activeFilter() === f.id ? 'var(--app-primary)' : '#F3F4F6'"
              [style.color]="activeFilter() === f.id ? '#111827' : '#6B7280'">
              <span>{{ f.emoji }}</span>
              {{ f.label }}
              <span *ngIf="unreadCount(f.id) > 0" class="min-w-[16px] h-[16px] rounded-full text-[9px] font-black flex items-center justify-center px-1"
                [style.backgroundColor]="activeFilter() === f.id ? '#111827' : '#FF7A00'" style="color:white;">
                {{ unreadCount(f.id) }}
              </span>
            </button>
          </div>
        </div>

        <!-- Notification Feed List -->
        <div class="px-4 pt-4 text-left">
          <div *ngIf="loading() && filteredNotifs().length === 0">
            <app-skeleton-list [count]="6"></app-skeleton-list>
          </div>
          <div *ngIf="filteredNotifs().length === 0 && !loading()" class="py-20 flex flex-col items-center text-center px-8">
            <div class="text-6xl mb-3">🏆</div>
            <h3 class="text-[20px] font-black text-[#111827] mb-1">You're all caught up!</h3>
            <p class="text-[13px] text-[#6B7280] leading-relaxed mb-5">We'll notify you when students book sessions, message you, or important coaching updates become available.</p>
            <button (click)="go('/app/coach/dashboard')" class="h-11 px-6 rounded-full text-[13px] font-black btn-green-gradient text-[#111827] border-none">
              Go to Dashboard
            </button>
          </div>

          <!-- Group timelines (Today, Yesterday, Earlier) -->
          <div *ngFor="let group of getGroups(); let gi = index" class="mb-5">
            <div class="flex items-center gap-3 mb-4 mt-2">
              <span class="text-[12px] font-black text-[#111827] uppercase tracking-widest">{{ group.label }}</span>
              <div class="flex-1 h-px bg-[#F3F4F6]"></div>
              <span *ngIf="getGroupUnreadCount(group.items) > 0" class="text-[11px] font-semibold text-[#9CA3AF]">
                {{ getGroupUnreadCount(group.items) }} new
              </span>
            </div>

            <!-- List of cards -->
            <div class="space-y-2.5">
              <div *ngFor="let n of group.items; let ni = index" class="relative overflow-hidden rounded-[24px]">
                <!-- Unread indicator bar -->
                <div *ngIf="n.unread && !n.isAI && !n.isReward" class="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-[var(--app-primary)] z-10" style="box-shadow: 0 0 8px rgba(var(--app-primary-rgb),0.6);"></div>

                <!-- AI recommendation card -->
                <div *ngIf="n.isAI" class="rounded-[24px] p-4 relative overflow-hidden bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-primary-to)]">
                  <div class="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-8 translate-x-8"></div>
                  <div *ngIf="n.unread" class="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[#FF7A00]"></div>
                  <div class="flex items-start gap-3">
                    <div class="w-10 h-10 rounded-2xl bg-[#111827]/15 flex items-center justify-center flex-shrink-0">
                      <ion-icon name="sparkles-outline" class="text-[#111827] text-lg font-bold"></ion-icon>
                    </div>
                    <div class="flex-1">
                      <p class="text-[14px] font-black text-[#111827] leading-snug mb-0.5 m-0">{{ n.title }}</p>
                      <p class="text-[12px] text-[#111827]/70 leading-relaxed m-0 mt-1">{{ n.description }}</p>
                      <p class="text-[11px] text-[#111827]/50 mt-1 m-0">{{ n.timestamp }}</p>
                    </div>
                  </div>
                  <button *ngIf="n.primaryAction" (click)="handleNotifAction(n)" class="mt-3 w-full h-10 rounded-2xl text-[13px] font-black btn-orange-gradient text-white border-none shadow-md">
                    {{ n.primaryAction.label }}
                  </button>
                </div>

                <!-- Reward achievements card -->
                <div *ngIf="n.isReward" class="rounded-[24px] p-5 relative overflow-hidden" [style.background]="n.gradient">
                  <div class="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/10"></div>
                  <div *ngIf="n.unread" class="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-[var(--app-primary)]"></div>
                  <div class="relative flex items-center gap-4 mb-3">
                    <div class="text-[40px] leading-none">{{ n.emoji }}</div>
                    <div class="flex-1">
                      <p class="text-[16px] font-black text-white leading-snug m-0">{{ n.title }}</p>
                      <p class="text-[12px] text-white/60 mt-0.5 leading-relaxed m-0">{{ n.description }}</p>
                    </div>
                  </div>
                  <button *ngIf="n.primaryAction" (click)="handleNotifAction(n)" class="w-full h-10 rounded-2xl text-[13px] font-black text-[#111827] bg-white/20 hover:bg-white/30 border-none transition-colors">
                    {{ n.primaryAction.label }}
                  </button>
                </div>

                <!-- Wide banners (certified / venue) -->
                <div *ngIf="n.isWide" class="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100">
                  <div class="relative h-[130px] overflow-hidden bg-gray-200">
                    <img *ngIf="n.image" [src]="n.image" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    <div *ngIf="n.unread" class="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-[var(--app-primary)]"></div>
                  </div>
                  <div class="px-4 py-4">
                    <p class="text-[15px] font-bold text-[#111827] mb-1 leading-snug m-0">{{ n.title }}</p>
                    <p class="text-[12px] text-[#6B7280] leading-relaxed mb-1 m-0 mt-1">{{ n.description }}</p>
                    <p class="text-[11px] text-[#9CA3AF] m-0 font-medium">{{ n.timestamp }}</p>
                    <button *ngIf="n.primaryAction" (click)="handleNotifAction(n)" class="mt-3 w-full h-10 rounded-xl text-[13px] font-bold border-none"
                      [style.background]="n.primaryAction.style === 'orange' ? 'linear-gradient(135deg,#FF7A00,#FF9A40)' : n.primaryAction.style === 'white' ? 'white' : 'rgba(var(--app-primary-rgb),0.12)'"
                      [style.color]="n.primaryAction.style === 'orange' ? 'white' : '#111827'"
                      [style.border]="n.primaryAction.style === 'white' ? '2px solid #E5E7EB' : n.primaryAction.style === 'green' ? '2px solid rgba(var(--app-primary-rgb),0.35)' : 'none'">
                      {{ n.primaryAction.label }}
                    </button>
                  </div>
                </div>

                <!-- Standard alerts -->
                <div *ngIf="!n.isAI && !n.isReward && !n.isWide" class="bg-white rounded-[18px] px-4 py-3.5 shadow-sm border border-slate-100" [class.pl-6]="n.unread">
                  <div class="flex items-start gap-3">
                    <div class="relative flex-shrink-0">
                      <img *ngIf="n.avatar" [src]="n.avatar" class="w-12 h-12 rounded-full object-cover" />
                      <div *ngIf="!n.avatar" class="w-12 h-12 rounded-2xl bg-[#F3F4F6] flex items-center justify-center text-xl">
                        {{ n.emoji || '🔔' }}
                      </div>
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-start justify-between gap-1">
                        <p class="text-[14px] font-semibold text-[#111827] leading-snug flex-1 m-0">{{ n.title }}</p>
                        <div *ngIf="n.unread" class="w-2.5 h-2.5 rounded-full bg-[var(--app-primary)] flex-shrink-0 mt-1"></div>
                      </div>
                      <p class="text-[12px] text-[#6B7280] mt-1 leading-relaxed m-0">{{ n.description }}</p>
                      <p class="text-[10px] text-[#9CA3AF] mt-1.5 m-0 font-medium">{{ n.timestamp }}</p>
                    </div>
                  </div>
                  <!-- Actions inside standard card -->
                  <div *ngIf="n.primaryAction || n.secondaryAction" class="flex gap-2 mt-3 pl-[68px]">
                    <button *ngIf="n.secondaryAction" (click)="deleteNotif(n.id)" class="flex-grow h-9 rounded-xl text-[12px] font-bold text-[#EF4444] bg-[#FEF2F2] border border-[#FCA5A5]">
                      {{ n.secondaryAction.label }}
                    </button>
                    <button *ngIf="n.primaryAction" (click)="handleNotifAction(n)" class="flex-grow h-9 rounded-xl text-[12px] font-bold border-none"
                      [style.background]="n.primaryAction.style === 'orange' ? 'linear-gradient(135deg,#FF7A00,#FF9A40)' : n.primaryAction.style === 'white' ? 'white' : 'rgba(var(--app-primary-rgb),0.12)'"
                      [style.color]="n.primaryAction.style === 'orange' ? 'white' : '#111827'"
                      [style.border]="n.primaryAction.style === 'white' ? '2px solid #E5E7EB' : n.primaryAction.style === 'green' ? '2px solid rgba(var(--app-primary-rgb),0.35)' : 'none'">
                      {{ n.primaryAction.label }}
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>

          <p *ngIf="filteredNotifs().length > 0" class="text-center text-[11px] text-[#C4C9D4] pb-2 font-bold">
            💡 Tap filters to prioritize booking requests, messages, or achievements.
          </p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .notifications-page {
      background: #FAFBFC;
      min-height: 100%;
      font-family: var(--app-font-family);
    }

    .notif-header { padding-top: calc(12px + var(--app-chrome-top-inset, var(--safe-area-top))); }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      box-shadow: 0 4px 16px rgba(var(--app-primary-rgb),0.30);
    }

    .btn-orange-gradient {
      background: linear-gradient(135deg, #FF7A00, #FF9A40);
      box-shadow: 0 4px 16px rgba(255, 122, 0, 0.35);
    }

    @media (max-width: 359px) {
      .notifications-page .px-5 { padding-left: 16px; padding-right: 16px; }
      .notifications-page .px-4 { padding-left: 14px; padding-right: 14px; }
    }
  `]
})
export class CoachNotificationsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly feed = inject(NotificationFeedService);

  readonly items = this.feed.items;
  readonly loading = this.feed.loading;
  activeFilter = signal<string>('all');
  readonly filters = FILTERS;

  totalUnread = computed(() => this.items().filter((n) => n.unread).length);

  filteredNotifs = computed(() => {
    const f = this.activeFilter();
    const list = this.items() as CoachNotif[];
    if (f === 'all') return list;
    return list.filter((n) => n.category === f);
  });

  ngOnInit(): void {
    void this.reload();
  }

  setFilter(id: string) {
    this.activeFilter.set(id);
    void this.reload();
  }

  unreadCount(cat: string): number {
    const list = this.items();
    if (cat === 'all') return list.filter((n) => n.unread).length;
    return list.filter((n) => n.category === cat && n.unread).length;
  }

  getGroups() {
    const filtered = this.filteredNotifs();
    return [
      { id: 'today', label: 'Today', items: filtered.filter((n) => n.group === 'today') },
      { id: 'yesterday', label: 'Yesterday', items: filtered.filter((n) => n.group === 'yesterday') },
      { id: 'earlier', label: 'Earlier This Week', items: filtered.filter((n) => n.group === 'earlier') },
    ].filter((g) => g.items.length > 0);
  }

  getGroupUnreadCount(items: CoachNotif[]): number {
    return items.filter((n) => n.unread).length;
  }

  async markAllRead() {
    await this.feed.markAllRead();
  }

  async markRead(id: string) {
    await this.feed.markRead(id);
  }

  async deleteNotif(id: string) {
    await this.feed.remove(id);
  }

  async handleNotifAction(n: CoachNotif) {
    await this.markRead(n.id);
    if (n.title.toLowerCase().includes('student request')) {
      this.go('/app/coach/students');
      return;
    }
    if (n.route) {
      this.go(n.route);
      return;
    }
    if (n.primaryAction?.label === 'View Earnings') {
      this.go('/app/coach/earnings');
    } else if (n.primaryAction?.label === 'Complete Profile') {
      this.go('/app/coach/complete-profile');
    } else if (n.category === 'bookings') {
      this.go('/app/coach/schedule');
    } else if (n.category === 'payments') {
      this.go('/app/wallet');
    }
  }

  back() {
    void this.router.navigateByUrl('/app/coach/dashboard');
  }

  go(path: string) {
    void this.router.navigateByUrl(path);
  }

  private async reload() {
    const cat = this.activeFilter() as NotificationCategory;
    await this.feed.load(cat);
  }
}
