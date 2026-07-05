import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { FilterChip, FilterChipsComponent } from '../../shared/components/filter-chips/filter-chips.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-chat-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BrandHeaderShellComponent, PageHeaderComponent, FilterChipsComponent],
  template: `
    <ion-content fullscreen class="has-tabs">
      <app-brand-header-shell>
      <main class="page-with-tab-bar min-h-full bg-[#FAFBFC] text-[#111827] flex flex-col">
        <app-page-header
          title="Chats"
          titleSize="md"
          [badge]="7"
          [showActions]="true"
          [hasSubContent]="true"
        >
          <div actions class="header-actions">
            <button type="button" class="icon-btn" (click)="toggleSearch()">
              <ion-icon [name]="searchOpen ? 'close-outline' : 'search-outline'"></ion-icon>
            </button>
            <button type="button" class="icon-btn">
              <ion-icon name="create-outline"></ion-icon>
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
            [chips]="filters"
            [value]="activeTab"
            (valueChange)="activeTab = $event"
          ></app-filter-chips>
        </app-page-header>

        <div class="flex-1 bg-white">
          <div *ngIf="activeTab === 'all' || activeTab === 'team'" class="px-4 pt-4 pb-1">
            <div class="flex items-center gap-2 mb-2">
              <span class="text-[10px] font-black text-[#9CA3AF] uppercase tracking-widest">📌 Pinned</span>
            </div>
            <div
              (click)="enterChat('team-1')"
              class="bg-[#FAFBFC] rounded-3xl overflow-hidden mb-2 border border-[#F3F4F6] cursor-pointer"
            >
              <div class="chat-row">
                <div class="avatar-wrap">
                  <div class="team-avatar" style="background: linear-gradient(135deg,#22C55E,#16A34A);">
                    <span class="text-2xl">🏏</span>
                  </div>
                  <div class="pin-badge">📌</div>
                </div>
                <div class="chat-content">
                  <div class="chat-top">
                    <span class="chat-name chat-name--bold">Lucknow Cricket Club</span>
                    <span class="chat-time chat-time--active">8:12 PM</span>
                  </div>
                  <div class="chat-bottom">
                    <p class="chat-preview chat-preview--bold">
                      <span class="font-semibold">Vikram: </span>Everyone reach by 6:30 PM!
                    </p>
                    <div class="chat-meta">
                      <div class="members">
                        <ion-icon name="people-outline"></ion-icon>
                        <span>18</span>
                      </div>
                      <span class="unread-badge">3</span>
                    </div>
                  </div>
                  <div class="active-now">
                    <span class="dot"></span>
                    6 active now
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div *ngIf="activeTab === 'all' || activeTab === 'team'">
            <div *ngIf="activeTab === 'all'" class="section-header">
              <span class="section-label">Team Chats</span>
              <span class="section-count">4</span>
              <div class="section-line"></div>
            </div>

            <div
              *ngFor="let chat of teamChats; let last = last"
              (click)="enterChat(chat.id)"
              class="cursor-pointer"
            >
              <div class="chat-row">
                <div class="avatar-wrap">
                  <div class="team-avatar" [style.background]="chat.gradient">
                    <span class="text-2xl">{{ chat.avatar }}</span>
                  </div>
                </div>
                <div class="chat-content">
                  <div class="chat-top">
                    <span class="chat-name" [class.chat-name--bold]="chat.unread > 0">{{ chat.name }}</span>
                    <span class="chat-time" [class.chat-time--active]="chat.timeHighlight">{{ chat.time }}</span>
                  </div>
                  <div class="chat-bottom">
                    <p class="chat-preview" [class.chat-preview--bold]="chat.unread > 0">
                      <span class="font-semibold">{{ chat.senderName }}: </span>{{ chat.lastMessage }}
                    </p>
                    <div class="chat-meta">
                      <div class="members">
                        <ion-icon name="people-outline"></ion-icon>
                        <span>{{ chat.members }}</span>
                      </div>
                      <span *ngIf="chat.unread" class="unread-badge">{{ chat.unread }}</span>
                    </div>
                  </div>
                  <div class="active-now">
                    <span class="dot"></span>
                    {{ chat.activeCount }} active now
                  </div>
                </div>
              </div>
              <div *ngIf="!last" class="row-divider"></div>
            </div>
          </div>

          <div *ngIf="activeTab === 'all' || activeTab === 'direct'">
            <div *ngIf="activeTab === 'all'" class="section-header">
              <span class="section-label">Direct Messages</span>
              <span class="section-count">2</span>
              <div class="section-line"></div>
            </div>

            <div
              *ngFor="let chat of directMessages; let last = last"
              (click)="enterChat(chat.id)"
              class="cursor-pointer"
            >
              <div class="chat-row">
                <div class="avatar-wrap">
                  <div class="dm-avatar">{{ chat.avatar }}</div>
                </div>
                <div class="chat-content">
                  <div class="chat-top">
                    <span class="chat-name">{{ chat.name }}</span>
                    <span class="chat-time">{{ chat.time }}</span>
                  </div>
                  <div class="chat-bottom">
                    <p class="chat-preview">{{ chat.lastMessage }}</p>
                  </div>
                </div>
              </div>
              <div *ngIf="!last" class="row-divider"></div>
            </div>
          </div>

          <div class="h-36"></div>
        </div>
      </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .header-actions {
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .icon-btn {
        width: 36px;
        height: 36px;
        min-height: unset;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: transparent;
        color: #111827;
        font-size: 18px;
        padding: 0;
        border: none;
      }

      .icon-btn:active {
        background: #f3f4f6;
      }

      .search-bar {
        display: flex;
        align-items: center;
        gap: 8px;
        background: #f3f4f6;
        border-radius: 16px;
        padding: 0 16px;
        height: 40px;
        margin-bottom: 12px;
      }

      .search-icon {
        color: #9ca3af;
        font-size: 15px;
        flex-shrink: 0;
      }

      .search-input {
        flex: 1;
        background: transparent;
        border: none;
        outline: none;
        font-size: 14px;
        color: #111827;
        min-height: unset;
      }

      .search-input::placeholder {
        color: #9ca3af;
      }

      .section-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 16px 8px;
      }

      .section-label {
        font-size: 11px;
        font-weight: 900;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .section-count {
        font-size: 10px;
        font-weight: 700;
        color: #c4c9d4;
      }

      .section-line {
        flex: 1;
        height: 1px;
        background: #f3f4f6;
      }

      .chat-row {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        text-align: left;
      }

      .avatar-wrap {
        position: relative;
        flex-shrink: 0;
      }

      .team-avatar {
        width: 56px;
        height: 56px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
      }

      .dm-avatar {
        width: 56px;
        height: 56px;
        border-radius: 999px;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
      }

      .pin-badge {
        position: absolute;
        top: -4px;
        left: -4px;
        width: 14px;
        height: 14px;
        border-radius: 999px;
        background: #ff7a00;
        border: 1px solid #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 7px;
      }

      .chat-content {
        flex: 1;
        min-width: 0;
      }

      .chat-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 2px;
      }

      .chat-name {
        font-size: 15px;
        font-weight: 600;
        color: #111827;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .chat-name--bold {
        font-weight: 700;
      }

      .chat-time {
        font-size: 11px;
        color: #9ca3af;
        flex-shrink: 0;
        margin-left: 8px;
      }

      .chat-time--active {
        color: #8cf000;
        font-weight: 700;
      }

      .chat-bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .chat-preview {
        font-size: 13px;
        color: #9ca3af;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        flex: 1;
        margin: 0;
      }

      .chat-preview--bold {
        color: #111827;
        font-weight: 500;
      }

      .chat-meta {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }

      .members {
        display: flex;
        align-items: center;
        gap: 2px;
        color: #c4c9d4;
        font-size: 10px;
      }

      .members ion-icon {
        font-size: 11px;
      }

      .unread-badge {
        min-width: 20px;
        height: 20px;
        padding: 0 6px;
        border-radius: 999px;
        background: #8cf000;
        color: #111827;
        font-size: 10px;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .active-now {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 2px;
        font-size: 10px;
        color: #9ca3af;
      }

      .dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #8cf000;
      }

      .row-divider {
        height: 1px;
        background: #f9fafb;
        margin: 0 16px;
      }
    `,
  ],
})
export class ChatListPage {
  private readonly router = inject(Router);

  activeTab = 'all';
  searchOpen = false;
  searchQuery = '';

  readonly filters: FilterChip[] = [
    { id: 'all', label: 'All', count: 7 },
    { id: 'team', label: 'Team Chats', count: 4 },
    { id: 'direct', label: 'Direct Messages', count: 2 },
  ];

  readonly teamChats = [
    {
      id: 'team-2',
      name: 'Sunday Football League',
      lastMessage: 'Need one more goalkeeper f...',
      senderName: 'Aryan',
      time: 'Yesterday',
      activeCount: 8,
      members: 22,
      unread: 0,
      avatar: '⚽',
      timeHighlight: false,
      gradient: 'linear-gradient(135deg,#3B82F6,#2563EB)',
    },
    {
      id: 'team-3',
      name: 'Morning Badminton Group',
      lastMessage: 'Court booked for tomorro...',
      senderName: 'Priya',
      time: '5:30 PM',
      activeCount: 4,
      members: 12,
      unread: 1,
      avatar: '🏸',
      timeHighlight: true,
      gradient: 'linear-gradient(135deg,#7C3AED,#6D28D9)',
    },
  ];

  readonly directMessages = [
    { id: 'dm-1', name: 'Priya Verma', lastMessage: 'Hey! Are you planning to play today?', time: '2 days ago', avatar: '👩‍🦰' },
    { id: 'dm-2', name: 'Arjun Sharma', lastMessage: 'Yes, looking forward to our batting prep.', time: '4 days ago', avatar: '👨' },
  ];

  toggleSearch() {
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchQuery = '';
    }
  }

  enterChat(id: string) {
    void this.router.navigateByUrl(`/app/chat/${id}`);
  }
}
