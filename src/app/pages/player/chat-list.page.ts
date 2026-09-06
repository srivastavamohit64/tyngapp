import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActionSheetController, IonicModule, NavController, RefresherCustomEvent, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { ChatService, ChatThread } from '../../core/services/chat.service';
import { TabBadgeService } from '../../core/services/tab-badge.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { FilterChip, FilterChipsComponent } from '../../shared/components/filter-chips/filter-chips.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { SkeletonListComponent } from '../../shared/components/skeleton';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BrandHeaderShellComponent, PageHeaderComponent, FilterChipsComponent, SkeletonListComponent],
  template: `
    <ion-content fullscreen class="has-tabs">
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-brand-header-shell>
      <main class="page-with-tab-bar min-h-full bg-[#FAFBFC] text-[#111827] flex flex-col">
        <app-page-header
          [title]="isCoach() ? 'Chat' : 'Chats'"
          titleSize="md"
          [badge]="totalUnread()"
          [showActions]="true"
          [hasSubContent]="true"
        >
          <div actions class="header-actions">
            <button type="button" class="icon-btn" (click)="toggleSearch()">
              <ion-icon [name]="searchOpen ? 'close-outline' : 'search-outline'"></ion-icon>
            </button>
          </div>

          <div *ngIf="searchOpen" class="search-bar">
            <ion-icon name="search-outline" class="search-icon"></ion-icon>
            <input
              type="text"
              placeholder="Search conversations…"
              [(ngModel)]="searchQuery"
              class="search-input"
            />
          </div>

          <app-filter-chips
            [chips]="filters()"
            [value]="activeTab"
            (valueChange)="activeTab = $event"
          ></app-filter-chips>
        </app-page-header>

        <div class="flex-1 bg-white">
          <div *ngIf="loading && threads().length === 0" class="px-4 pt-4">
            <app-skeleton-list [count]="6"></app-skeleton-list>
          </div>

          <div *ngIf="!loading && errorMessage" class="state-wrap">
            <p class="state-error">{{ errorMessage }}</p>
            <button type="button" class="cta-btn cta-btn--dark" (click)="startInbox()">Retry</button>
          </div>

          <ng-container *ngIf="(!loading || threads().length > 0) && !errorMessage">
            <div *ngIf="pinnedChats().length" class="pinned-block">
              <p class="section-label pinned-label">📌 PINNED</p>
              <div
                *ngFor="let chat of pinnedChats()"
                class="pinned-card cursor-pointer"
                (click)="onRowClick(chat)"
                (pointerdown)="onPressStart(chat)"
                (pointerup)="onPressEnd()"
                (pointerleave)="onPressEnd()"
                (contextmenu)="onContextMenu($event, chat)"
              >
                <ng-container *ngTemplateOutlet="chatRow; context: { $implicit: chat }"></ng-container>
              </div>
            </div>

            <div *ngIf="activeTab === 'all' || activeTab === 'team'">
              <div *ngIf="gameChats().length" class="section-header">
                <span class="section-label">Game Chats</span>
                <span class="section-count">{{ gameChats().length }}</span>
                <div class="section-line"></div>
              </div>

              <div
                *ngFor="let chat of gameChats(); let last = last"
                class="cursor-pointer"
                (click)="onRowClick(chat)"
                (pointerdown)="onPressStart(chat)"
                (pointerup)="onPressEnd()"
                (pointerleave)="onPressEnd()"
                (contextmenu)="onContextMenu($event, chat)"
              >
                <ng-container *ngTemplateOutlet="chatRow; context: { $implicit: chat }"></ng-container>
                <div *ngIf="!last" class="row-divider"></div>
              </div>
            </div>

            <div *ngIf="activeTab === 'all' || activeTab === 'direct'">
              <div *ngIf="privateChats().length" class="section-header">
                <span class="section-label">Direct Messages</span>
                <span class="section-count">{{ privateChats().length }}</span>
                <div class="section-line"></div>
              </div>

              <div
                *ngFor="let chat of privateChats(); let last = last"
                class="cursor-pointer"
                (click)="onRowClick(chat)"
                (pointerdown)="onPressStart(chat)"
                (pointerup)="onPressEnd()"
                (pointerleave)="onPressEnd()"
                (contextmenu)="onContextMenu($event, chat)"
              >
                <ng-container *ngTemplateOutlet="chatRow; context: { $implicit: chat }"></ng-container>
                <div *ngIf="!last" class="row-divider"></div>
              </div>
            </div>

            <ng-template #chatRow let-chat>
              <div class="chat-row">
                <div class="avatar-wrap">
                  <div
                    class="team-avatar"
                    [class.dm-avatar]="threadType(chat) === 'private'"
                    [style.background]="threadType(chat) === 'game' ? 'linear-gradient(135deg,#22C55E,#16A34A)' : '#f3f4f6'"
                  >
                    <img *ngIf="chat.avatar" [src]="chat.avatar" [alt]="chat.title" (error)="chat.avatar = null" />
                    <span *ngIf="!chat.avatar">{{ threadType(chat) === 'game' ? '⚽' : '👤' }}</span>
                  </div>
                  <span *ngIf="chat.pinned" class="pin-badge">📌</span>
                </div>
                <div class="chat-content">
                  <div class="chat-top">
                    <span class="chat-name" [class.chat-name--bold]="chat.unreadCount > 0">{{ chat.title }}</span>
                    <span class="chat-time" [class.chat-time--active]="chat.unreadCount > 0">{{ formatTime(chat.lastMessageAt) }}</span>
                  </div>
                  <div class="chat-bottom">
                    <p class="chat-preview" [class.chat-preview--bold]="chat.unreadCount > 0">
                      <span *ngIf="chat.lastSenderName && chat.lastSenderName !== 'You'" class="sender">{{ chat.lastSenderName }}: </span>
                      {{ chat.lastMessage || (threadType(chat) === 'game' ? 'No messages yet' : 'Say hello') }}
                    </p>
                    <div class="chat-meta">
                      <div *ngIf="threadType(chat) === 'game' && memberCount(chat)" class="members">
                        <ion-icon name="people-outline"></ion-icon>
                        <span>{{ memberCount(chat) }}</span>
                      </div>
                      <span *ngIf="chat.unreadCount > 0" class="unread-badge">{{ chat.unreadCount }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </ng-template>

            <div *ngIf="filteredThreads().length === 0" class="empty-state">
              <div class="empty-icon" aria-hidden="true">💬</div>
              <h2 class="empty-title">No conversations yet</h2>
              <p class="empty-copy">
                {{ activeTab === 'direct' ? 'Message a friend to start a private chat.' : 'Open a game chat or message a friend to get started.' }}
              </p>
              <button
                *ngIf="activeTab === 'direct' || activeTab === 'all'"
                type="button"
                class="cta-btn"
                (click)="openFriends()"
              >
                View My Friends
              </button>
            </div>
          </ng-container>

          <div style="height: 100px;"></div>
        </div>
      </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .header-actions {
        display: flex;
        gap: 8px;
      }
      .icon-btn {
        width: 36px;
        height: 36px;
        border-radius: 999px;
        border: none;
        background: rgba(255, 255, 255, 0.18);
        color: #fff;
        display: grid;
        place-items: center;
        font-size: 18px;
      }
      .search-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 10px;
        padding: 10px 12px;
        border-radius: 14px;
        background: rgba(255, 255, 255, 0.14);
      }
      .search-icon {
        color: rgba(255, 255, 255, 0.8);
        font-size: 16px;
      }
      .search-input {
        flex: 1;
        border: none;
        outline: none;
        background: transparent;
        color: #fff;
        font-size: 13px;
        font-weight: 600;
      }
      .search-input::placeholder {
        color: rgba(255, 255, 255, 0.65);
      }
      .section-header {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 16px 16px 8px;
      }
      .section-label {
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #9ca3af;
      }
      .section-count {
        font-size: 11px;
        font-weight: 800;
        color: #6b7280;
      }
      .section-line {
        flex: 1;
        height: 1px;
        background: #f3f4f6;
      }
      .pinned-block {
        padding: 8px 12px 4px;
      }
      .pinned-label {
        padding: 8px 4px 10px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #9ca3af;
      }
      .pinned-card {
        background: #f8fafc;
        border: 1px solid #eef2f7;
        border-radius: 18px;
        margin-bottom: 8px;
        overflow: hidden;
      }
      .pinned-card .chat-row {
        padding: 12px;
      }
      .chat-row {
        display: flex;
        gap: 12px;
        padding: 14px 16px;
        align-items: flex-start;
      }
      .avatar-wrap {
        position: relative;
        flex-shrink: 0;
      }
      .team-avatar {
        width: 52px;
        height: 52px;
        border-radius: 16px;
        display: grid;
        place-items: center;
        overflow: hidden;
        background: #f3f4f6;
      }
      .team-avatar img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .dm-avatar {
        border-radius: 50%;
      }
      .pin-badge {
        position: absolute;
        top: -4px;
        left: -4px;
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background: #ff7a00;
        border: 1px solid #fff;
        font-size: 8px;
        display: grid;
        place-items: center;
      }
      .chat-content {
        flex: 1;
        min-width: 0;
      }
      .chat-top {
        display: flex;
        justify-content: space-between;
        gap: 8px;
      }
      .chat-name {
        font-size: 14px;
        font-weight: 700;
        color: #111827;
      }
      .chat-name--bold {
        font-weight: 800;
      }
      .chat-time {
        font-size: 10px;
        font-weight: 700;
        color: #9ca3af;
        flex-shrink: 0;
      }
      .chat-time--active {
        color: var(--app-primary, #8cf000);
      }
      .chat-bottom {
        display: flex;
        justify-content: space-between;
        gap: 8px;
        margin-top: 4px;
      }
      .chat-preview {
        font-size: 12px;
        color: #6b7280;
        margin: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
      }
      .chat-preview--bold {
        color: #111827;
        font-weight: 600;
      }
      .sender {
        font-weight: 700;
      }
      .chat-meta {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .members {
        display: flex;
        align-items: center;
        gap: 2px;
        color: #9ca3af;
        font-size: 10px;
        font-weight: 700;
      }
      .unread-badge {
        min-width: 18px;
        height: 18px;
        padding: 0 5px;
        border-radius: 999px;
        background: var(--app-primary, #a3e635);
        color: #111827;
        font-size: 10px;
        font-weight: 800;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .row-divider {
        height: 1px;
        background: #f9fafb;
        margin: 0 16px;
      }
      .state-wrap,
      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 56px 28px 24px;
      }
      .state-error {
        margin: 0 0 14px;
        color: #ef4444;
        font-size: 13px;
        font-weight: 600;
      }
      .empty-icon {
        width: 64px;
        height: 64px;
        border-radius: 20px;
        background: #f3f4f6;
        display: grid;
        place-items: center;
        font-size: 28px;
        margin-bottom: 14px;
      }
      .empty-title {
        margin: 0;
        font-size: 16px;
        font-weight: 800;
        color: #0f172a;
        letter-spacing: -0.02em;
      }
      .empty-copy {
        margin: 8px 0 0;
        max-width: 260px;
        font-size: 13px;
        line-height: 1.45;
        color: #64748b;
        font-weight: 500;
      }
      .cta-btn {
        appearance: none;
        -webkit-appearance: none;
        margin-top: 18px;
        height: 42px;
        padding: 0 20px;
        border: none;
        border-radius: 999px;
        background: var(--app-primary, #a3e635);
        color: #111827;
        font-size: 13px;
        font-weight: 800;
        line-height: 42px;
        letter-spacing: 0;
        text-shadow: none;
        box-shadow: none;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        white-space: nowrap;
      }
      .cta-btn--dark {
        background: #111827;
        color: #fff;
      }
    `,
  ],
})
export class ChatListPage implements OnInit, OnDestroy, ViewWillEnter, ViewWillLeave {
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);
  private readonly auth = inject(AuthService);
  private readonly chat = inject(ChatService);
  private readonly tabBadges = inject(TabBadgeService);
  private readonly actionSheet = inject(ActionSheetController);

  activeTab = 'all';
  searchOpen = false;
  searchQuery = '';
  loading = true;
  errorMessage = '';
  private stopInbox: (() => void) | null = null;

  readonly threads = signal<ChatThread[]>([]);
  readonly isCoach = computed(() => this.auth.user()?.role === 'coach');
  readonly totalUnread = computed(() =>
    this.threads().reduce((sum, t) => sum + Number(t.unreadCount || 0), 0),
  );

  readonly filters = computed<FilterChip[]>(() => {
    const q = this.searchQuery.trim().toLowerCase();
    const matches = (t: ChatThread) =>
      !q ||
      (t.title || '').toLowerCase().includes(q) ||
      (t.lastMessage || '').toLowerCase().includes(q);
    const games = this.threads().filter((t) => this.threadType(t) === 'game' && matches(t)).length;
    const dms = this.threads().filter((t) => this.threadType(t) === 'private' && matches(t)).length;
    return [
      { id: 'all', label: 'All', count: games + dms },
      { id: 'team', label: 'Game Chats', count: games },
      { id: 'direct', label: 'Direct Messages', count: dms },
    ];
  });

  readonly filteredThreads = computed(() => {
    const q = this.searchQuery.trim().toLowerCase();
    let list = this.threads();
    if (this.activeTab === 'team') {
      list = list.filter((t) => this.threadType(t) === 'game');
    } else if (this.activeTab === 'direct') {
      list = list.filter((t) => this.threadType(t) === 'private');
    }
    if (q) {
      list = list.filter(
        (t) =>
          (t.title || '').toLowerCase().includes(q) ||
          (t.lastMessage || '').toLowerCase().includes(q),
      );
    }
    return list;
  });

  readonly gameChats = computed(() =>
    this.filteredThreads().filter((t) => this.threadType(t) === 'game' && !t.pinned),
  );
  readonly privateChats = computed(() =>
    this.filteredThreads().filter((t) => this.threadType(t) === 'private' && !t.pinned),
  );
  readonly pinnedChats = computed(() => this.filteredThreads().filter((t) => !!t.pinned));

  ngOnInit(): void {
    void this.startInbox();
  }

  ionViewWillEnter(): void {
    void this.startInbox();
  }

  ionViewWillLeave(): void {
    this.stopInbox?.();
    this.stopInbox = null;
    this.chat.stopInboxListening();
  }

  ngOnDestroy(): void {
    this.stopInbox?.();
    this.stopInbox = null;
    this.chat.stopInboxListening();
  }

  async refresh(event: RefresherCustomEvent): Promise<void> {
    await this.startInbox();
    await event.target.complete();
  }

  async startInbox(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';
    this.stopInbox?.();
    this.stopInbox = null;

    try {
      this.stopInbox = await this.chat.listenThreads((items) => {
        this.threads.set(items);
        this.loading = false;
        void this.tabBadges.refresh();
      });
      // If RTDB returns empty quickly, still clear loading after a short wait.
      setTimeout(() => {
        if (this.loading) this.loading = false;
      }, 2500);
    } catch {
      this.errorMessage = 'Unable to load chats from Firebase.';
      this.threads.set([]);
      this.loading = false;
    }
  }

  threadType(t: ChatThread): string {
    return String(t.type || t.chatType || '').toLowerCase();
  }

  memberCount(t: ChatThread): number {
    return (t.memberIds || []).length;
  }

  private pressTimer: ReturnType<typeof setTimeout> | null = null;
  private didLongPress = false;

  onPressStart(chat: ChatThread): void {
    this.didLongPress = false;
    this.clearPressTimer();
    this.pressTimer = setTimeout(() => {
      this.didLongPress = true;
      void this.openChatActions(chat);
    }, 480);
  }

  onPressEnd(): void {
    this.clearPressTimer();
  }

  onContextMenu(event: Event, chat: ChatThread): void {
    event.preventDefault();
    this.didLongPress = true;
    void this.openChatActions(chat);
  }

  onRowClick(chat: ChatThread): void {
    if (this.didLongPress) {
      this.didLongPress = false;
      return;
    }
    this.enterChat(chat.id);
  }

  async openChatActions(chat: ChatThread): Promise<void> {
    const sheet = await this.actionSheet.create({
      header: chat.title || 'Chat',
      buttons: [
        {
          text: chat.pinned ? 'Unpin chat' : 'Pin chat',
          icon: chat.pinned ? 'pin' : 'pin-outline',
          handler: () => {
            void this.togglePin(chat);
          },
        },
        {
          text: 'Open chat',
          icon: 'chatbubble-outline',
          handler: () => this.enterChat(chat.id),
        },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async togglePin(chat: ChatThread): Promise<void> {
    await this.chat.setPinned(chat.id, !chat.pinned);
  }

  private clearPressTimer(): void {
    if (this.pressTimer) {
      clearTimeout(this.pressTimer);
      this.pressTimer = null;
    }
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchQuery = '';
    }
  }

  enterChat(id: string): void {
    void this.navCtrl.navigateForward(`/app/chat/${encodeURIComponent(id)}`);
  }

  openFriends(): void {
    void this.router.navigateByUrl('/app/friends');
  }

  formatTime(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    const now = new Date();
    const sameDay =
      d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();
    if (sameDay) {
      return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
}
