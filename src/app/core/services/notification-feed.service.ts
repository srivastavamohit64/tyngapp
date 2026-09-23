import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';

export type NotificationCategory =
  | 'all'
  | 'games'
  | 'friends'
  | 'messages'
  | 'venues'
  | 'events'
  | 'rewards'
  | 'bookings'
  | 'students'
  | 'coaching'
  | 'achievements'
  | 'payments';

export interface AppNotification {
  id: string;
  category: Exclude<NotificationCategory, 'all'>;
  group: 'today' | 'yesterday' | 'earlier';
  unread: boolean;
  timestamp: string;
  createdAt?: string;
  title: string;
  description: string;
  image?: string | null;
  avatar?: string | null;
  emoji?: string | null;
  gradient?: string | null;
  isAI?: boolean;
  isWide?: boolean;
  isReward?: boolean;
  isRefund?: boolean;
  isWeather?: boolean;
  spotsLeft?: number | null;
  discount?: number | null;
  messageCount?: number | null;
  xp?: number | null;
  primaryAction?: { label: string; style: 'green' | 'orange' | 'white' } | null;
  route?: string | null;
  module?: string | null;
  type?: string | null;
  action?: string | null;
  data?: {
    bookingId?: string | null;
    bookingRequestId?: string | null;
    walletTransactionId?: string | null;
    playerId?: string | null;
    sport?: string | null;
    amount?: number | string | null;
  };
}

interface NotificationListResponse {
  items: AppNotification[];
  unreadCount: number;
  meta: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class NotificationFeedService {
  private readonly api = inject(ApiService);

  readonly items = signal<AppNotification[]>([]);
  readonly unreadCount = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async load(category: NotificationCategory = 'all'): Promise<AppNotification[]> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const query = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : '';
      const res = await firstValueFrom(this.api.get<NotificationListResponse>(`/notifications${query}`));
      const items = res.data?.items ?? [];
      this.items.set(items);
      this.unreadCount.set(res.data?.unreadCount ?? items.filter((n) => n.unread).length);
      return items;
    } catch (e) {
      this.error.set('Unable to load notifications.');
      this.items.set([]);
      return [];
    } finally {
      this.loading.set(false);
    }
  }

  async markRead(id: string): Promise<void> {
    this.items.update((list) => list.map((n) => (n.id === id ? { ...n, unread: false } : n)));
    this.unreadCount.update((c) => Math.max(0, c - 1));
    try {
      await firstValueFrom(this.api.post(`/notifications/${id}/read`, {}));
    } catch {
      // Keep optimistic UI; next refresh will reconcile.
    }
  }

  async markAllRead(): Promise<void> {
    this.items.update((list) => list.map((n) => ({ ...n, unread: false })));
    this.unreadCount.set(0);
    try {
      await firstValueFrom(this.api.post('/notifications/read-all', {}));
    } catch {
      // Keep optimistic UI.
    }
  }

  async remove(id: string): Promise<void> {
    const existing = this.items().find((n) => n.id === id);
    this.items.update((list) => list.filter((n) => n.id !== id));
    if (existing?.unread) {
      this.unreadCount.update((c) => Math.max(0, c - 1));
    }
    try {
      await firstValueFrom(this.api.delete(`/notifications/${id}`));
    } catch {
      // Ignore delete failures for now.
    }
  }
}
