import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { PushNotificationSchema } from '@capacitor/push-notifications';
import { AuthService } from './auth.service';
import { TabBadgeService } from './tab-badge.service';

export type ForegroundNotificationKind =
  | 'chat_message'
  | 'game'
  | 'friend'
  | 'venue'
  | 'wallet'
  | 'system'
  | 'other';

export interface ForegroundNotificationPayload {
  id: string;
  title: string;
  body: string;
  emoji: string;
  kind: ForegroundNotificationKind;
  /** Raw FCM/data payload (string values). */
  data: Record<string, string>;
  receivedAt: number;
  /** Resolved in-app route for tap navigation. */
  route: string | null;
  chatId?: string | null;
  chatType?: string | null;
  bookingId?: string | null;
}

const AUTO_DISMISS_MS = 5500;
const LOG_PREFIX = '[TYNG ForegroundNotif]';

@Injectable({ providedIn: 'root' })
export class ForegroundNotificationService {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly tabBadges = inject(TabBadgeService);

  /** Currently visible in-app banner (null when hidden). */
  readonly current = signal<ForegroundNotificationPayload | null>(null);

  /** True when the native/web app is in the foreground. */
  readonly isAppActive = signal(true);

  private activeChatId: string | null = null;
  private dismissTimer: ReturnType<typeof setTimeout> | null = null;
  private appStateBound = false;
  private queue: ForegroundNotificationPayload[] = [];
  private showing = false;

  /**
   * Track Capacitor appStateChange so background pushes stay on the OS tray
   * and only foreground arrivals use the in-app banner.
   */
  bindAppState(): void {
    if (this.appStateBound || !Capacitor.isNativePlatform()) {
      return;
    }

    this.appStateBound = true;
    void App.addListener('appStateChange', ({ isActive }) => {
      this.isAppActive.set(!!isActive);
      console.info(`${LOG_PREFIX} appStateChange`, { isActive });
    });
  }

  /** Call from chat room ionViewWillEnter / route param updates. */
  setActiveChat(chatId: string | null | undefined): void {
    this.activeChatId = chatId ? String(chatId) : null;
  }

  /** Call from chat room ionViewWillLeave (only clears if still that chat). */
  clearActiveChat(chatId?: string | null): void {
    if (!chatId || this.activeChatId === String(chatId)) {
      this.activeChatId = null;
    }
  }

  getActiveChatId(): string | null {
    return this.activeChatId;
  }

  /**
   * Entry point for FCM `pushNotificationReceived` (app already open).
   * Shows an in-app banner unless suppressed (e.g. viewing that chat).
   */
  handleIncoming(notification: PushNotificationSchema): void {
    const payload = this.parseNotification(notification);

    if (this.shouldSuppress(payload)) {
      console.info(`${LOG_PREFIX} suppressed (active chat / duplicate UI)`, {
        chatId: payload.chatId,
        activeChatId: this.activeChatId,
        kind: payload.kind,
      });
      void this.tabBadges.refresh();
      return;
    }

    this.enqueue(payload);
    void this.tabBadges.refresh();
  }

  /** Programmatic show (tests / future local events). */
  show(payload: ForegroundNotificationPayload): void {
    if (this.shouldSuppress(payload)) {
      return;
    }
    this.enqueue(payload);
  }

  dismiss(): void {
    this.clearDismissTimer();
    this.current.set(null);
    this.showing = false;
    const next = this.queue.shift();
    if (next) {
      this.present(next);
    }
  }

  onBannerTap(): void {
    const payload = this.current();
    this.dismiss();
    if (payload) {
      this.navigateFromPayload(payload);
    }
  }

  /** Shared tap routing for foreground banner + background/terminated opens. */
  navigateFromPayload(payload: ForegroundNotificationPayload): void {
    const route = payload.route || this.resolveRoute(payload.data);
    if (route) {
      console.info(`${LOG_PREFIX} navigate`, { route, kind: payload.kind });
      void this.router.navigateByUrl(route);
      return;
    }

    const role = this.auth.user()?.role;
    void this.router.navigateByUrl(
      role === 'venue'
        ? '/app/venue/notifications'
        : role === 'coach'
          ? '/app/coach/notifications'
          : '/app/notifications',
    );
  }

  /** Navigate from a raw FCM schema (background / terminated tap). */
  navigateFromPush(notification: PushNotificationSchema): void {
    this.navigateFromPayload(this.parseNotification(notification));
  }

  parseNotification(notification: PushNotificationSchema): ForegroundNotificationPayload {
    const raw = (notification.data || {}) as Record<string, unknown>;
    const data: Record<string, string> = {};
    for (const [key, value] of Object.entries(raw)) {
      if (value == null) continue;
      data[key] = typeof value === 'string' ? value : String(value);
    }

    const title = String(notification.title || data['title'] || 'Notification').trim();
    const body = String(notification.body || data['body'] || data['message'] || '').trim();
    const kind = this.resolveKind(data);
    const chatId = this.pick(data, ['chatId', 'chat_id', 'conversationId', 'conversation_id']);
    const chatType = this.pick(data, ['chatType', 'chat_type']);
    const bookingId = this.pick(data, ['booking_id', 'bookingId', 'gameId', 'game_id']);

    return {
      id: String(notification.id || data['messageId'] || data['message_id'] || `${Date.now()}`),
      title,
      body,
      emoji: this.resolveEmoji(kind, data),
      kind,
      data,
      receivedAt: Date.now(),
      route: this.resolveRoute(data),
      chatId,
      chatType,
      bookingId,
    };
  }

  private shouldSuppress(payload: ForegroundNotificationPayload): boolean {
    if (payload.kind !== 'chat_message') {
      return false;
    }

    const incoming = payload.chatId;
    if (!incoming || !this.activeChatId) {
      return false;
    }

    return this.normalizeChatId(incoming) === this.normalizeChatId(this.activeChatId);
  }

  private normalizeChatId(id: string): string {
    return String(id).trim().toLowerCase();
  }

  private enqueue(payload: ForegroundNotificationPayload): void {
    if (this.showing) {
      // Prefer the newest notification; keep one pending after current.
      this.queue = [payload];
      return;
    }
    this.present(payload);
  }

  private present(payload: ForegroundNotificationPayload): void {
    this.showing = true;
    this.current.set(payload);
    this.clearDismissTimer();
    this.dismissTimer = setTimeout(() => this.dismiss(), AUTO_DISMISS_MS);
    console.info(`${LOG_PREFIX} show banner`, {
      kind: payload.kind,
      title: payload.title,
      route: payload.route,
    });
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer) {
      clearTimeout(this.dismissTimer);
      this.dismissTimer = null;
    }
  }

  private resolveKind(data: Record<string, string>): ForegroundNotificationKind {
    const type = (data['type'] || '').toLowerCase();
    const action = (data['action'] || '').toLowerCase();
    const module = (data['module'] || '').toLowerCase();

    if (
      type === 'chat_message' ||
      type === 'chat' ||
      module === 'chat' ||
      module === 'message' ||
      action === 'chat_message' ||
      action === 'new_message'
    ) {
      return 'chat_message';
    }

    if (action === 'wallet_credit' || module === 'wallet' || type === 'wallet') {
      return 'wallet';
    }

    if (
      action === 'friend_added' ||
      action === 'friend_matched' ||
      module === 'social' ||
      module === 'friend' ||
      type === 'social'
    ) {
      return 'friend';
    }

    if (
      action === 'pending_approval' ||
      module === 'venue' ||
      type === 'venue'
    ) {
      return 'venue';
    }

    if (
      [
        'open_game',
        'created',
        'approved',
        'joined',
        'left',
        'cancelled',
        'rejected',
        'invited',
        'accepted',
        'declined',
        'removed',
        'approval_timeout',
      ].includes(action) ||
      module === 'booking' ||
      module === 'booking_invite' ||
      type === 'booking' ||
      type === 'game'
    ) {
      return 'game';
    }

    if (module === 'admin' || type === 'admin_custom' || type === 'system') {
      return 'system';
    }

    return 'other';
  }

  private resolveEmoji(kind: ForegroundNotificationKind, data: Record<string, string>): string {
    const action = (data['action'] || '').toLowerCase();
    if (data['emoji']) return data['emoji'];

    if (kind === 'chat_message') return '💬';
    if (kind === 'wallet') return '💰';
    if (kind === 'friend') return '🤝';
    if (kind === 'venue') return '🏟️';
    if (kind === 'system') return '🔔';

    if (action === 'open_game') return '⚽';
    if (action === 'invited') return '📨';
    if (['joined', 'accepted'].includes(action)) return '🙌';
    if (['approved', 'created'].includes(action)) return '✅';
    if (['rejected', 'cancelled', 'approval_timeout'].includes(action)) return '❌';
    if (['removed', 'left'].includes(action)) return '👋';
    if (kind === 'game') return '⚽';

    return '🔔';
  }

  resolveRoute(data: Record<string, string>): string | null {
    const explicit = this.pick(data, ['route', 'deep_link', 'deepLink', 'url']);
    if (explicit && explicit.startsWith('/')) {
      return explicit;
    }

    const action = (data['action'] || '').toLowerCase();
    const type = (data['type'] || '').toLowerCase();
    const module = (data['module'] || '').toLowerCase();
    const role = this.auth.user()?.role;
    const bookingId = this.pick(data, ['booking_id', 'bookingId', 'gameId', 'game_id']);
    const chatId = this.pick(data, ['chatId', 'chat_id', 'conversationId', 'conversation_id']);
    const playerId = this.pick(data, ['playerId', 'player_id', 'senderId', 'sender_id', 'userId', 'user_id']);

    if (
      type === 'chat_message' ||
      type === 'chat' ||
      module === 'chat' ||
      module === 'message' ||
      action === 'chat_message' ||
      action === 'new_message'
    ) {
      if (chatId) {
        return `/app/chat/${encodeURIComponent(chatId)}`;
      }
      return role === 'coach' ? '/app/coach/chat' : '/app/chat';
    }

    if (action === 'wallet_credit' || module === 'wallet') {
      return '/app/wallet';
    }

    if (action === 'friend_added' || action === 'friend_matched') {
      if (playerId) {
        return `/app/discover`;
      }
      return '/app/discover';
    }

    if (action === 'pending_approval' || action === 'created') {
      if (role === 'venue') {
        return '/app/venue/bookings';
      }
    }

    if (action === 'open_game' && bookingId) {
      return `/app/game/${bookingId}`;
    }

    if (bookingId) {
      if (role === 'venue') {
        return '/app/venue/bookings';
      }
      if (role === 'coach') {
        return '/app/coach/schedule';
      }
      return `/app/my-bookings/${bookingId}`;
    }

    return null;
  }

  private pick(data: Record<string, string>, keys: string[]): string | null {
    for (const key of keys) {
      const value = data[key];
      if (value != null && String(value).trim() !== '') {
        return String(value);
      }
    }
    return null;
  }
}
