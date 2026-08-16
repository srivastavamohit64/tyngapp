import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, NavController, ToastController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { Subscription, firstValueFrom } from 'rxjs';
import { BookingRecord } from '../../core/models/api.model';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { ChatMessage, ChatService, ChatThread, ChatTypingUser } from '../../core/services/chat.service';
import { ForegroundNotificationService } from '../../core/services/foreground-notification.service';
import { TabBadgeService } from '../../core/services/tab-badge.service';
import { formatBookingDate, formatBookingTime, sportEmoji } from '../../core/utils/booking.utils';

interface GameChatDetails {
  bookingId: string;
  title: string;
  emoji: string;
  venue: string;
  time: string;
  players: string;
  payment: string;
  rating: string;
  sport: string;
  isHost: boolean;
}

@Component({
  selector: 'app-chat-room',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-top flex flex-col min-h-full bg-white text-slate-800 select-none">
        <header class="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-20">
          <div class="flex items-center gap-2 min-w-0">
            <button (click)="back()" class="h-10 w-10 grid place-items-center rounded-full bg-transparent text-slate-800">
              <ion-icon name="chevron-back-outline" class="text-2xl"></ion-icon>
            </button>
            <div class="h-10 w-10 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center border border-slate-100 text-xl flex-shrink-0">
              <img *ngIf="thread?.avatar" [src]="thread?.avatar" class="w-full h-full object-cover" alt="" (error)="onAvatarError()" />
              <span *ngIf="!thread?.avatar">{{ isGameChat ? '⚽' : '💬' }}</span>
            </div>
            <div class="min-w-0">
              <h1 class="text-sm font-extrabold text-slate-900 leading-tight truncate">
                {{ thread?.title || 'Chat' }}
              </h1>
              <p
                class="text-[10px] font-bold mt-0.5"
                [class.typing-status]="!!typingLabel"
                [class.text-slate-400]="!typingLabel"
              >
                {{ typingLabel || (isGameChat ? 'Game chat' : 'Direct message') }}
              </p>
            </div>
          </div>
          <button
            type="button"
            class="pin-btn"
            [class.pin-btn--on]="thread?.pinned"
            [disabled]="pinning"
            (click)="togglePin()"
            [attr.aria-label]="thread?.pinned ? 'Unpin chat' : 'Pin chat'"
          >
            <ion-icon [name]="thread?.pinned ? 'pin' : 'pin-outline'"></ion-icon>
          </button>
        </header>

        <div *ngIf="isGameChat && gameDetails" class="game-card-wrap">
          <button type="button" class="game-card" (click)="gameCardOpen = !gameCardOpen">
            <div class="game-card-head">
              <span class="game-pin">📌</span>
              <div class="game-card-title">
                {{ gameDetails.emoji }} {{ gameDetails.title }}
              </div>
              <ion-icon [name]="gameCardOpen ? 'chevron-up-outline' : 'chevron-down-outline'" class="game-chevron"></ion-icon>
            </div>
            <div *ngIf="gameCardOpen" class="game-grid">
              <div class="game-cell">
                <span class="game-label">VENUE</span>
                <span class="game-val"><ion-icon name="location-outline"></ion-icon>{{ gameDetails.venue }}</span>
              </div>
              <div class="game-cell">
                <span class="game-label">TIME</span>
                <span class="game-val"><ion-icon name="time-outline"></ion-icon>{{ gameDetails.time }}</span>
              </div>
              <div class="game-cell">
                <span class="game-label">PLAYERS</span>
                <span class="game-val"><ion-icon name="people-outline"></ion-icon>{{ gameDetails.players }}</span>
              </div>
              <div class="game-cell">
                <span class="game-label">PAYMENT</span>
                <span class="game-val"><ion-icon name="wallet-outline"></ion-icon>{{ gameDetails.payment }}</span>
              </div>
              <div class="game-cell">
                <span class="game-label">RATING</span>
                <span class="game-val"><ion-icon name="star-outline"></ion-icon>{{ gameDetails.rating }}</span>
              </div>
              <div class="game-cell">
                <span class="game-label">SPORT</span>
                <span class="game-val">{{ gameDetails.emoji }} {{ gameDetails.sport }}</span>
              </div>
            </div>
          </button>
        </div>

        <div *ngIf="loading" class="flex-1 grid place-items-center text-sm text-slate-400 font-semibold">
          Loading messages…
        </div>

        <div *ngIf="!loading && errorMessage" class="flex-1 grid place-items-center px-6 text-center">
          <p class="text-sm text-red-500 font-semibold">{{ errorMessage }}</p>
          <button class="mt-3 px-4 py-2 rounded-xl bg-[#111827] text-white text-xs font-bold" (click)="reload()">
            Retry
          </button>
        </div>

        <div *ngIf="!loading && !errorMessage" class="flex-1 overflow-y-auto px-4 py-4 space-y-3" #scrollArea>
          <div *ngIf="messages.length === 0" class="text-center text-xs text-slate-400 py-10 font-semibold">
            No messages yet. Say hello!
          </div>

          <div
            *ngFor="let m of messages"
            class="flex"
            [class.justify-end]="m.isSelf"
            [class.justify-start]="!m.isSelf"
          >
            <div
              class="max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm"
              [class.self-bubble]="m.isSelf"
              [class.other-bubble]="!m.isSelf"
            >
              <div *ngIf="!m.isSelf" class="text-[10px] font-bold text-slate-500 mb-1">{{ m.senderName || 'Player' }}</div>
              <div class="text-[13px] leading-snug whitespace-pre-wrap break-words">{{ m.text }}</div>
              <div class="text-[9px] font-bold mt-1 opacity-60 text-right">{{ formatTime(m.createdAt) }}</div>
            </div>
          </div>

          <div *ngIf="typingUsers.length" class="flex justify-start">
            <div class="max-w-[78%] rounded-2xl px-3.5 py-2.5 shadow-sm other-bubble typing-bubble">
              <div *ngIf="isGameChat && typingUsers[0]?.name" class="text-[10px] font-bold text-slate-500 mb-1">
                {{ typingUsers[0].name }}
              </div>
              <div class="typing-dots">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="isGameChat && gameDetails" class="quick-actions">
          <button type="button" class="quick-btn" (click)="openGamePage()">
            <ion-icon name="location-outline"></ion-icon>
            Share Venue
          </button>
          <button type="button" class="quick-btn" (click)="openInvite()">
            <ion-icon name="globe-outline"></ion-icon>
            Invite to Game
          </button>
          <button type="button" class="quick-btn" (click)="openGamePage()">
            <ion-icon name="calendar-outline"></ion-icon>
            Schedule
          </button>
        </div>

        <div class="border-t border-slate-100 px-3 py-2 pb-[calc(12px+env(safe-area-inset-bottom))] bg-white flex items-end gap-2">
          <textarea
            [(ngModel)]="newMessageText"
            rows="1"
            placeholder="Type a message…"
            class="flex-1 resize-none border border-slate-200 rounded-2xl px-3 py-2.5 text-sm outline-none max-h-28"
            (keydown.enter)="onEnter($event)"
            (ngModelChange)="onComposerChange()"
            (blur)="clearLocalTyping()"
          ></textarea>
          <button
            class="h-11 w-11 rounded-full bg-[#111827] text-white grid place-items-center disabled:opacity-40"
            [disabled]="sending || !newMessageText.trim()"
            (click)="sendMessage()"
          >
            <ion-icon name="send" class="text-lg"></ion-icon>
          </button>
        </div>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .self-bubble {
        background: var(--app-primary, #a3e635);
        color: #111827;
        border-bottom-right-radius: 6px;
      }
      .other-bubble {
        background: #f3f4f6;
        color: #111827;
        border-bottom-left-radius: 6px;
      }
      .pin-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 999px;
        background: #f3f4f6;
        color: #111827;
        display: grid;
        place-items: center;
        font-size: 18px;
        flex-shrink: 0;
      }
      .pin-btn--on {
        background: #111827;
        color: #fff;
      }
      .game-card-wrap {
        padding: 10px 12px 0;
        background: #fff;
        position: sticky;
        top: 61px;
        z-index: 15;
      }
      .game-card {
        width: 100%;
        text-align: left;
        border: none;
        border-radius: 16px;
        background: #f4f6f8;
        padding: 12px 14px;
      }
      .game-card-head {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .game-pin {
        width: 22px;
        height: 22px;
        border-radius: 999px;
        background: #111827;
        color: #fff;
        font-size: 11px;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }
      .game-card-title {
        flex: 1;
        min-width: 0;
        font-size: 13px;
        font-weight: 800;
        color: #111827;
      }
      .game-chevron {
        color: #9ca3af;
        font-size: 16px;
      }
      .game-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px 12px;
        margin-top: 12px;
      }
      .game-label {
        display: block;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.08em;
        color: #9ca3af;
        margin-bottom: 3px;
      }
      .game-val {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 12px;
        font-weight: 700;
        color: #111827;
      }
      .game-val ion-icon {
        font-size: 13px;
        color: #6b7280;
      }
      .quick-actions {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding: 8px 12px 0;
        scrollbar-width: none;
      }
      .quick-btn {
        flex-shrink: 0;
        border: none;
        border-radius: 999px;
        background: #f3f4f6;
        color: #111827;
        font-size: 12px;
        font-weight: 700;
        padding: 8px 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .typing-status { color: #65a30d; }
      .typing-bubble {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        min-height: 36px;
      }
      .typing-dots {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        height: 16px;
      }
      .typing-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #9ca3af;
        animation: typing-bounce 1.1s infinite ease-in-out;
      }
      .typing-dot:nth-child(2) { animation-delay: 0.15s; }
      .typing-dot:nth-child(3) { animation-delay: 0.3s; }
      @keyframes typing-bounce {
        0%, 60%, 100% { transform: translateY(0); opacity: .45; }
        30% { transform: translateY(-4px); opacity: 1; }
      }
    `,
  ],
})
export class ChatRoomPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly route = inject(ActivatedRoute);
  private readonly chat = inject(ChatService);
  private readonly auth = inject(AuthService);
  private readonly bookings = inject(BookingService);
  private readonly foregroundNotifications = inject(ForegroundNotificationService);
  private readonly tabBadges = inject(TabBadgeService);
  private readonly toastCtrl = inject(ToastController);

  chatId: string | null = null;
  thread: ChatThread | null = null;
  messages: ChatMessage[] = [];
  newMessageText = '';
  loading = true;
  sending = false;
  pinning = false;
  errorMessage = '';
  gameCardOpen = true;
  gameDetails: GameChatDetails | null = null;
  typingUsers: ChatTypingUser[] = [];

  private paramSub: Subscription | null = null;
  private stopListen: (() => void) | null = null;
  private stopTypingListen: (() => void) | null = null;
  private typingIdleTimer: ReturnType<typeof setTimeout> | null = null;
  private lastTypingWrite = 0;
  private locallyTyping = false;

  get isGameChat(): boolean {
    const type = String(this.thread?.type || this.thread?.chatType || this.chatId || '').toLowerCase();
    return type === 'game' || type.startsWith('game_');
  }

  get typingLabel(): string {
    if (!this.typingUsers.length) return '';
    if (!this.isGameChat) return 'typing…';
    const names = this.typingUsers.map((u) => u.name || 'Player');
    if (names.length === 1) return `${names[0]} is typing…`;
    if (names.length === 2) return `${names[0]} and ${names[1]} are typing…`;
    return 'Several people are typing…';
  }

  ngOnInit(): void {
    this.paramSub = this.route.paramMap.subscribe((params) => {
      this.chatId = params.get('id');
      this.foregroundNotifications.setActiveChat(this.chatId);
      void this.reload();
    });
  }

  ionViewWillEnter(): void {
    this.foregroundNotifications.setActiveChat(this.chatId || this.route.snapshot.paramMap.get('id'));
  }

  ionViewWillLeave(): void {
    this.foregroundNotifications.clearActiveChat(this.chatId);
    this.teardownRealtime();
  }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.foregroundNotifications.clearActiveChat(this.chatId);
    this.teardownRealtime();
  }

  async reload(): Promise<void> {
    if (!this.chatId) {
      this.errorMessage = 'Missing chat id.';
      this.loading = false;
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.teardownRealtime();

    try {
      const threadRes = await this.chat.getThread(this.chatId);
      if (!threadRes.success || !threadRes.data) {
        this.errorMessage = threadRes.message || 'Chat not found.';
        this.loading = false;
        return;
      }

      this.thread = threadRes.data;
      const userId = String(this.auth.user()?.id || '');

      this.messages = await this.chat.fetchMessagesOnce(this.chatId, userId);
      this.stopListen = await this.chat.listenMessages(this.chatId, userId, (live) => {
        const pending = this.messages.filter((m) => String(m.id).startsWith('local-'));
        const liveTexts = new Set(live.filter((m) => m.isSelf).map((m) => m.text));
        const stillPending = pending.filter((m) => !liveTexts.has(m.text));
        this.messages = [...live, ...stillPending];
      });
      this.stopTypingListen = await this.chat.listenTyping(this.chatId, userId, (people) => {
        this.typingUsers = people;
      });

      await this.chat.markRead(this.chatId);
      void this.tabBadges.refresh();
      void this.loadGameDetails();
    } catch {
      this.errorMessage = 'Unable to open this chat.';
    } finally {
      this.loading = false;
    }
  }

  async togglePin(): Promise<void> {
    if (!this.chatId || !this.thread || this.pinning) return;
    this.pinning = true;
    const next = !this.thread.pinned;
    const res = await this.chat.setPinned(this.chatId, next);
    if (res.success) {
      this.thread = { ...this.thread, pinned: next };
      const toast = await this.toastCtrl.create({
        message: next ? 'Chat pinned' : 'Chat unpinned',
        duration: 1400,
        color: 'dark',
      });
      await toast.present();
    }
    this.pinning = false;
  }

  openGamePage(): void {
    const id = this.gameDetails?.bookingId;
    if (!id) return;
    void this.router.navigateByUrl(`/app/game/${encodeURIComponent(id)}`);
  }

  openInvite(): void {
    const id = this.gameDetails?.bookingId;
    if (!id) return;
    void this.router.navigateByUrl(`/app/my-bookings/${encodeURIComponent(id)}`);
  }

  onEnter(event: Event): void {
    const ke = event as KeyboardEvent;
    if (!ke.shiftKey) {
      ke.preventDefault();
      void this.sendMessage();
    }
  }

  onComposerChange(): void {
    if (this.newMessageText.trim()) {
      this.bumpTyping();
      return;
    }
    this.clearLocalTyping();
  }

  clearLocalTyping(): void {
    if (this.typingIdleTimer) {
      clearTimeout(this.typingIdleTimer);
      this.typingIdleTimer = null;
    }
    if (!this.locallyTyping || !this.chatId) {
      this.locallyTyping = false;
      return;
    }
    this.locallyTyping = false;
    void this.chat.setTyping(this.chatId, false);
  }

  private bumpTyping(): void {
    if (!this.chatId) return;
    const now = Date.now();
    if (!this.locallyTyping || now - this.lastTypingWrite > 2000) {
      this.locallyTyping = true;
      this.lastTypingWrite = now;
      void this.chat.setTyping(this.chatId, true);
    }
    if (this.typingIdleTimer) clearTimeout(this.typingIdleTimer);
    this.typingIdleTimer = setTimeout(() => this.clearLocalTyping(), 2500);
  }

  async sendMessage(): Promise<void> {
    const text = this.newMessageText.trim();
    if (!text || !this.chatId || this.sending) return;

    this.clearLocalTyping();
    this.sending = true;
    const optimistic: ChatMessage = {
      id: `local-${Date.now()}`,
      chatId: this.chatId,
      text,
      senderId: String(this.auth.user()?.id || ''),
      senderName: this.auth.user()?.name || 'You',
      createdAt: new Date().toISOString(),
      isSelf: true,
    };
    this.messages = [...this.messages, optimistic];
    this.newMessageText = '';

    try {
      const res = await this.chat.sendMessage(this.chatId, text);
      if (!res.success) {
        this.messages = this.messages.filter((m) => m.id !== optimistic.id);
        this.newMessageText = text;
      }
    } catch {
      this.messages = this.messages.filter((m) => m.id !== optimistic.id);
      this.newMessageText = text;
    } finally {
      this.sending = false;
    }
  }

  back(): void {
    this.navCtrl.back();
  }

  onAvatarError(): void {
    if (this.thread) {
      this.thread = { ...this.thread, avatar: null };
    }
  }

  formatTime(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  private async loadGameDetails(): Promise<void> {
    if (!this.isGameChat) {
      this.gameDetails = null;
      return;
    }

    const bookingId = String(
      this.thread?.gameId || this.thread?.bookingId || String(this.chatId || '').replace(/^game_/, ''),
    );
    if (!bookingId) {
      this.gameDetails = null;
      return;
    }

    try {
      const res = await firstValueFrom(this.bookings.getBooking(bookingId));
      if (!res.success || !res.data) {
        this.gameDetails = null;
        return;
      }
      this.gameDetails = this.mapGameDetails(res.data);
    } catch {
      this.gameDetails = null;
    }
  }

  private mapGameDetails(booking: BookingRecord): GameChatDetails {
    const sport = (booking.sport || 'Game').replace(/\b\w/g, (c) => c.toUpperCase());
    const venue = booking.venue?.name || 'Venue TBD';
    const amount = Number(booking.costPerPlayer || booking.playerShareAmount || booking.walletAmount || 0);
    const paid = String(booking.paymentStatus || '').toLowerCase() === 'paid';
    const payment = amount > 0
      ? (paid ? `₹${amount} paid ✓` : `₹${amount}`)
      : (paid ? 'Paid ✓' : '—');
    const rating = booking.venue?.rating
      ? `${venue} · ${Number(booking.venue.rating).toFixed(1)} ⭐`
      : venue;

    const dateLabel = formatBookingDate(booking.bookingDate);
    const matchTitle = dateLabel.startsWith('Today')
      ? `Today's Match · ${venue}`
      : `${sport} · ${venue}`;

    return {
      bookingId: String(booking.id),
      title: matchTitle,
      emoji: sportEmoji(booking.sport),
      venue,
      time: `${formatBookingTime(booking.startTime)} · ${formatBookingDate(booking.bookingDate)}`,
      players: `${booking.currentPlayers}/${booking.totalPlayers} confirmed`,
      payment,
      rating,
      sport,
      isHost: !!booking.isHost,
    };
  }

  private teardownRealtime(): void {
    this.clearLocalTyping();
    this.stopListen?.();
    this.stopListen = null;
    this.stopTypingListen?.();
    this.stopTypingListen = null;
    this.typingUsers = [];
    this.chat.stopMessageListening();
    this.chat.stopTypingListening();
  }
}
