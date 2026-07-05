import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

type ChatFilter = 'all' | 'students' | 'teams' | 'community';

interface CoachChatItem {
  id: string;
  type: 'student' | 'team' | 'community';
  name: string;
  avatar?: string;
  sportEmoji?: string;
  sportImage?: string;
  avatarGradient?: string;
  lastMessage: string;
  lastSender?: string;
  lastTime: string;
  unread: number;
  members?: number;
  activeMembers?: number;
  isOnline?: boolean;
  isPinned?: boolean;
}

const COACH_CHATS: CoachChatItem[] = [
  {
    id: 'dm-1', type: 'student', name: 'Rahul Sharma',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop&auto=format',
    lastMessage: 'When is our next session? Can we do Thursday 6 PM?',
    lastTime: 'Just now', unread: 2, isOnline: true, isPinned: true,
  },
  {
    id: 'dm-2', type: 'student', name: 'Priya Verma',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&auto=format',
    lastMessage: "Thanks for today's session! My footwork improved a lot.",
    lastTime: '3:20 PM', unread: 0, isOnline: true,
  },
  {
    id: 'dm-3', type: 'student', name: 'Vikram Singh',
    avatar: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=120&h=120&fit=crop&auto=format',
    lastMessage: "Can we extend tomorrow's session by 30 minutes?",
    lastTime: 'Yesterday', unread: 1, isOnline: false,
  },
  {
    id: 'dm-4', type: 'student', name: 'Ananya Patel',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&auto=format',
    lastMessage: 'I booked Court 1 for Saturday morning. See you there!',
    lastTime: 'Yesterday', unread: 0, isOnline: false,
  },
  {
    id: 'team-1', type: 'team', name: 'Elite Cricket Academy', sportEmoji: '🏏',
    sportImage: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=120&h=120&fit=crop&auto=format',
    avatarGradient: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
    lastMessage: 'Everyone arrive 15 minutes early for warm-up drills.',
    lastSender: 'You', lastTime: '8:12 PM', unread: 3, members: 12, activeMembers: 5, isPinned: true,
  },
  {
    id: 'team-2', type: 'team', name: 'Sunday Football Batch', sportEmoji: '⚽',
    sportImage: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=120&h=120&fit=crop&auto=format',
    avatarGradient: 'linear-gradient(135deg,#EFF6FF,#DBEAFE)',
    lastMessage: 'See you all at Phoenix Arena at 6 PM on Sunday!',
    lastSender: 'You', lastTime: 'Yesterday', unread: 0, members: 8, activeMembers: 3,
  },
  {
    id: 'team-3', type: 'team', name: 'Morning Badminton Group', sportEmoji: '🏸',
    sportImage: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=120&h=120&fit=crop&auto=format',
    avatarGradient: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)',
    lastMessage: 'Court 2 is booked for next week. Good work everyone!',
    lastSender: 'Priya', lastTime: '5:30 PM', unread: 1, members: 6, activeMembers: 2,
  },
  {
    id: 'community-1', type: 'community', name: 'Football Coaches – Lucknow', sportEmoji: '⚽',
    avatarGradient: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)',
    lastMessage: 'Anyone available for a joint training session this weekend?',
    lastSender: 'Coach Aryan', lastTime: '2:15 PM', unread: 5, members: 24, activeMembers: 8,
  },
  {
    id: 'community-2', type: 'community', name: 'Badminton Coaches Hub', sportEmoji: '🏸',
    avatarGradient: 'linear-gradient(135deg,#F0F9FF,#E0F2FE)',
    lastMessage: 'New training drill videos uploaded. Check pinned messages.',
    lastSender: 'Coach Priya', lastTime: 'Yesterday', unread: 0, members: 18, activeMembers: 4,
  },
  {
    id: 'community-3', type: 'community', name: 'Elite Cricket Coaches', sportEmoji: '🏏',
    avatarGradient: 'linear-gradient(135deg,#F0FDF4,#DCFCE7)',
    lastMessage: "State selection trials are next month. Let's prepare together.",
    lastSender: 'Coach Raj', lastTime: '2 days ago', unread: 0, members: 31, activeMembers: 6,
  },
  {
    id: 'community-4', type: 'community', name: 'Sports Nutrition Discussion', sportEmoji: '🥗',
    avatarGradient: 'linear-gradient(135deg,#F5F3FF,#EDE9FE)',
    lastMessage: 'Post-session recovery nutrition tips thread is live!',
    lastSender: 'Coach Meena', lastTime: '3 days ago', unread: 2, members: 45, activeMembers: 12,
  },
];

@Component({
  selector: 'app-coach-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true" class="coach-chat-page">
      <div class="chat-shell">
        <div class="chat-header">
          <div class="chat-header-row">
            <div class="chat-header-left">
              <button type="button" class="icon-btn" (click)="back()">
                <ion-icon name="chevron-back-outline"></ion-icon>
              </button>
              <div class="title-wrap">
                <h1>Chat</h1>
                <span *ngIf="totalUnread() > 0" class="title-badge">{{ totalUnread() }}</span>
              </div>
            </div>
            <div class="chat-header-actions">
              <button type="button" class="icon-btn" (click)="toggleSearch()">
                <ion-icon [name]="searchOpen() ? 'close-outline' : 'search-outline'"></ion-icon>
              </button>
              <button type="button" class="icon-btn">
                <ion-icon name="create-outline"></ion-icon>
              </button>
            </div>
          </div>

          <div *ngIf="searchOpen()" class="search-row">
            <ion-icon name="search-outline"></ion-icon>
            <input [(ngModel)]="searchQ" placeholder="Search conversations…" />
          </div>

          <div class="filter-row">
            <button *ngFor="let f of filters" type="button" class="filter-chip"
              [class.filter-chip--active]="activeFilter() === f.id"
              (click)="activeFilter.set(f.id)">
              {{ f.label }}
              <span *ngIf="filterCount(f.id) > 0" class="filter-count">{{ filterCount(f.id) }}</span>
            </button>
          </div>
        </div>

        <div class="chat-list bg-white flex-1">
          <ng-container *ngIf="activeFilter() === 'all' || activeFilter() === 'students'">
            <div *ngIf="pinnedChats().length" class="pinned-block">
              <p class="section-label">★ PINNED</p>
              <button *ngFor="let chat of pinnedChats()" type="button" class="chat-row" (click)="openChat(chat.id)">
                <ng-container *ngTemplateOutlet="chatRow; context: { $implicit: chat }"></ng-container>
              </button>
            </div>

            <div *ngIf="studentChats().length && showSection('students')" class="section-block">
              <div class="section-header">
                <span>STUDENT CHATS</span>
                <span class="section-count">{{ studentChats().length }}</span>
                <div class="section-line"></div>
              </div>
              <button *ngFor="let chat of studentChats(); let last = last" type="button" class="chat-row" (click)="openChat(chat.id)">
                <ng-container *ngTemplateOutlet="chatRow; context: { $implicit: chat }"></ng-container>
                <div *ngIf="!last" class="row-divider"></div>
              </button>
            </div>
          </ng-container>

          <div *ngIf="teamChats().length && showSection('teams')" class="section-block">
            <div class="section-header">
              <span>TEAM CHATS</span>
              <span class="section-count">{{ teamChats().length }}</span>
              <div class="section-line"></div>
            </div>
            <button *ngFor="let chat of teamChats(); let last = last" type="button" class="chat-row" (click)="openChat(chat.id)">
              <ng-container *ngTemplateOutlet="chatRow; context: { $implicit: chat }"></ng-container>
              <div *ngIf="!last" class="row-divider"></div>
            </button>
          </div>

          <div *ngIf="communityChats().length && showSection('community')" class="section-block">
            <div class="section-header">
              <span>COACH COMMUNITY</span>
              <span class="section-count">{{ communityChats().length }}</span>
              <div class="section-line"></div>
            </div>
            <button *ngFor="let chat of communityChats(); let last = last" type="button" class="chat-row" (click)="openChat(chat.id)">
              <ng-container *ngTemplateOutlet="chatRow; context: { $implicit: chat }"></ng-container>
              <div *ngIf="!last" class="row-divider"></div>
            </button>
          </div>
        </div>
      </div>

      <ng-template #chatRow let-chat>
        <div class="avatar-wrap">
          <div *ngIf="isGroup(chat); else dmAvatar" class="group-avatar" [style.background]="chat.avatarGradient">
            <img *ngIf="chat.sportImage" [src]="chat.sportImage" [alt]="chat.name" />
            <span *ngIf="!chat.sportImage">{{ chat.sportEmoji }}</span>
          </div>
          <ng-template #dmAvatar>
            <img [src]="chat.avatar" [alt]="chat.name" class="dm-avatar" />
          </ng-template>
          <span *ngIf="chat.isOnline" class="online-dot"></span>
          <span *ngIf="chat.isPinned" class="pin-badge">📌</span>
        </div>
        <div class="chat-content">
          <div class="chat-top">
            <span class="chat-name" [class.chat-name--bold]="chat.unread > 0">{{ chat.name }}</span>
            <span class="chat-time" [class.chat-time--active]="chat.unread > 0">{{ chat.lastTime }}</span>
          </div>
          <div class="chat-bottom">
            <p class="chat-preview" [class.chat-preview--bold]="chat.unread > 0">
              <span *ngIf="chat.lastSender && chat.lastSender !== 'You'" class="sender">{{ chat.lastSender }}: </span>
              <ion-icon *ngIf="chat.lastSender === 'You'" name="checkmark-done-outline" class="read-icon"></ion-icon>
              {{ chat.lastMessage }}
            </p>
            <div class="chat-meta">
              <div *ngIf="isGroup(chat) && chat.members" class="members">
                <ion-icon name="people-outline"></ion-icon>
                <span>{{ chat.members }}</span>
              </div>
              <span *ngIf="chat.unread > 0" class="unread-badge">{{ chat.unread }}</span>
            </div>
          </div>
          <div *ngIf="isGroup(chat) && chat.activeMembers" class="active-now">
            <span class="dot"></span>
            {{ chat.activeMembers }} active now
          </div>
        </div>
      </ng-template>
    </ion-content>
  `,
  styles: [`
    .coach-chat-page { --background: #FAFBFC; }
    .chat-shell { min-height: 100%; display: flex; flex-direction: column; background: #FAFBFC; }
    .chat-header { position: sticky; top: 0; z-index: 30; background: #fff; border-bottom: 1px solid #F3F4F6; padding-top: env(safe-area-inset-top, 0px); }
    .chat-header-row { display: flex; align-items: center; justify-content: space-between; padding: 20px 20px 12px; }
    .chat-header-left { display: flex; align-items: center; gap: 12px; }
    .title-wrap { display: flex; align-items: center; gap: 8px; }
    .title-wrap h1 { margin: 0; font-size: 24px; font-weight: 900; color: #111827; letter-spacing: -0.02em; }
    .title-badge { min-width: 22px; height: 22px; border-radius: 999px; background: #FF7A00; color: #fff; font-size: 11px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; }
    .chat-header-actions { display: flex; gap: 4px; }
    .icon-btn { width: 36px; height: 36px; border: none; border-radius: 12px; background: transparent; color: #111827; font-size: 18px; display: grid; place-items: center; }
    .search-row { display: flex; align-items: center; gap: 8px; margin: 0 16px 12px; background: #F3F4F6; border-radius: 16px; padding: 0 16px; height: 40px; }
    .search-row ion-icon { color: #9CA3AF; font-size: 15px; }
    .search-row input { flex: 1; border: none; background: transparent; outline: none; font-size: 14px; color: #111827; min-height: unset; }
    .filter-row { display: flex; gap: 8px; overflow-x: auto; padding: 0 16px 16px; scrollbar-width: none; }
    .filter-chip { flex-shrink: 0; border: none; border-radius: 999px; padding: 8px 14px; font-size: 12px; font-weight: 700; background: #F3F4F6; color: #6B7280; display: inline-flex; align-items: center; gap: 6px; }
    .filter-chip--active { background: #8CF000; color: #111827; box-shadow: 0 2px 8px rgba(140,240,0,0.30); }
    .filter-count { min-width: 18px; height: 18px; border-radius: 999px; background: #111827; color: #fff; font-size: 9px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; padding: 0 4px; }
    .filter-chip--active .filter-count { background: #111827; color: #fff; }
    .pinned-block { padding-top: 8px; }
    .section-label { margin: 0; padding: 12px 16px 8px; font-size: 10px; font-weight: 900; color: #9CA3AF; letter-spacing: 0.12em; }
    .section-header { display: flex; align-items: center; gap: 12px; padding: 20px 16px 8px; }
    .section-header span:first-child { font-size: 11px; font-weight: 900; color: #9CA3AF; letter-spacing: 0.1em; }
    .section-count { font-size: 10px; font-weight: 700; color: #C4C9D4; }
    .section-line { flex: 1; height: 1px; background: #F3F4F6; }
    .chat-row { width: 100%; border: none; background: transparent; display: flex; align-items: center; gap: 14px; padding: 14px 16px; text-align: left; }
    .avatar-wrap { position: relative; flex-shrink: 0; }
    .group-avatar, .dm-avatar { width: 56px; height: 56px; border-radius: 16px; overflow: hidden; object-fit: cover; display: flex; align-items: center; justify-content: center; font-size: 24px; }
    .dm-avatar { border-radius: 50%; }
    .group-avatar img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; }
    .online-dot { position: absolute; bottom: 2px; right: 2px; width: 13px; height: 13px; border-radius: 50%; background: #8CF000; border: 2px solid #fff; }
    .pin-badge { position: absolute; top: -4px; left: -4px; width: 14px; height: 14px; border-radius: 50%; background: #FF7A00; border: 1px solid #fff; font-size: 7px; display: grid; place-items: center; }
    .chat-content { flex: 1; min-width: 0; }
    .chat-top, .chat-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .chat-name { font-size: 15px; font-weight: 600; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .chat-name--bold { font-weight: 700; }
    .chat-time { font-size: 11px; color: #9CA3AF; flex-shrink: 0; }
    .chat-time--active { color: #8CF000; font-weight: 700; }
    .chat-preview { margin: 2px 0 0; font-size: 13px; color: #9CA3AF; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
    .chat-preview--bold { color: #111827; font-weight: 500; }
    .sender { font-weight: 600; }
    .read-icon { font-size: 13px; vertical-align: middle; margin-right: 2px; color: #9CA3AF; }
    .chat-meta { display: flex; align-items: center; gap: 6px; flex-shrink: 0; }
    .members { display: flex; align-items: center; gap: 2px; color: #C4C9D4; font-size: 10px; }
    .unread-badge { min-width: 20px; height: 20px; border-radius: 999px; background: #8CF000; color: #111827; font-size: 10px; font-weight: 900; display: inline-flex; align-items: center; justify-content: center; padding: 0 6px; }
    .active-now { display: flex; align-items: center; gap: 4px; margin-top: 2px; font-size: 10px; color: #9CA3AF; }
    .active-now .dot { width: 6px; height: 6px; border-radius: 50%; background: #8CF000; }
    .row-divider { height: 1px; background: #F9FAFB; margin: 0 16px; }
  `],
})
export class CoachChatPage {
  private readonly router = inject(Router);

  searchQ = '';
  searchOpen = signal(false);
  activeFilter = signal<ChatFilter>('all');

  readonly filters = [
    { id: 'all' as ChatFilter, label: 'All' },
    { id: 'students' as ChatFilter, label: 'Student Chats' },
    { id: 'teams' as ChatFilter, label: 'Team Chats' },
    { id: 'community' as ChatFilter, label: 'Coach Community' },
  ];

  readonly filtered = computed(() => {
    let result = COACH_CHATS;
    const filter = this.activeFilter();
    const q = this.searchQ.toLowerCase().trim();
    if (filter !== 'all') {
      const type = filter === 'students' ? 'student' : filter === 'teams' ? 'team' : 'community';
      result = result.filter((c) => c.type === type);
    }
    if (q) result = result.filter((c) => c.name.toLowerCase().includes(q));
    return result;
  });

  readonly pinnedChats = computed(() => this.filtered().filter((c) => c.isPinned));
  readonly studentChats = computed(() => this.filtered().filter((c) => c.type === 'student' && !c.isPinned));
  readonly teamChats = computed(() => this.filtered().filter((c) => c.type === 'team' && !c.isPinned));
  readonly communityChats = computed(() => this.filtered().filter((c) => c.type === 'community'));

  totalUnread = computed(() => COACH_CHATS.reduce((sum, c) => sum + c.unread, 0));

  filterCount(id: ChatFilter): number {
    if (id === 'all') return this.totalUnread();
    const type = id === 'students' ? 'student' : id === 'teams' ? 'team' : 'community';
    return COACH_CHATS.filter((c) => c.type === type).reduce((sum, c) => sum + c.unread, 0);
  }

  showSection(section: 'students' | 'teams' | 'community'): boolean {
    const filter = this.activeFilter();
    return filter === 'all' || filter === section || (section === 'students' && filter === 'students');
  }

  isGroup(chat: CoachChatItem): boolean {
    return chat.type === 'team' || chat.type === 'community';
  }

  toggleSearch() {
    this.searchOpen.update((v) => !v);
    if (!this.searchOpen()) this.searchQ = '';
  }

  back() {
    void this.router.navigateByUrl('/app/coach/dashboard');
  }

  openChat(id: string) {
    void this.router.navigateByUrl(`/app/chat/${id}`);
  }
}
