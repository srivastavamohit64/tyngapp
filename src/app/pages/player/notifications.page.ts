import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

type FilterId = 'all' | 'games' | 'friends' | 'messages' | 'venues' | 'events' | 'rewards';

interface Notif {
  id: string;
  category: Exclude<FilterId, 'all'>;
  group: 'today' | 'yesterday' | 'earlier';
  unread: boolean;
  timestamp: string;
  title: string;
  description: string;
  image?: string;
  avatar?: string;
  emoji?: string;
  gradient?: string;
  isAI?: boolean;
  isWide?: boolean;
  isReward?: boolean;
  isRefund?: boolean;
  isWeather?: boolean;
  spotsLeft?: number;
  discount?: number;
  messageCount?: number;
  xp?: number;
  primaryAction?: { label: string; style: 'green' | 'orange' | 'white' };
}

const NOTIFICATIONS: Notif[] = [
  // TODAY
  { id:'n1', category:'games', group:'today', unread:true, timestamp:'Just now',
    title:'4 football players nearby 🤖', description:'Looking for one more teammate. Starts in 45 minutes · 2.1 km away',
    isAI:true, emoji:'🤖', primaryAction:{label:'Join Now', style:'orange'} },
  { id:'n2', category:'games', group:'today', unread:true, timestamp:'2 hrs ago',
    title:'Your cricket match is confirmed! 🏏', description:'Lucknow Cricket Club · Today, 7:00 PM · Ekana Stadium · 12/12 players',
    image:'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=200&h=200&fit=crop&auto=format',
    primaryAction:{label:'View Match', style:'green'} },
  { id:'n3', category:'friends', group:'today', unread:true, timestamp:'3 hrs ago',
    title:'Rahul is looking for a Badminton partner', description:'Tonight · 2.3 km away · Gomti Nagar',
    avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
    primaryAction:{label:'Join Game', style:'orange'} },
  { id:'n4', category:'rewards', group:'today', unread:true, timestamp:'4 hrs ago',
    title:'You earned +250 TP Points! 🏆', description:'For completing 5 matches this week.',
    emoji:'🏆', isReward:true, xp:250,
    gradient:'linear-gradient(135deg,#111827 0%,#1F2937 100%)' },
  { id:'n5', category:'messages', group:'today', unread:true, timestamp:'5 hrs ago',
    title:'Lucknow Cricket Club', description:'"Match starts at 7 PM. Be there 30 min early for warm-up."',
    avatar:'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=100&h=100&fit=crop&auto=format',
    messageCount:5 },

  // YESTERDAY
  { id:'n6', category:'venues', group:'yesterday', unread:false, timestamp:'Yesterday, 3 PM',
    title:'20% OFF — PlayBox Sports Arena', description:'Available today · Book before 6 PM to redeem offer',
    image:'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&h=240&fit=crop&auto=format',
    isWide:true, discount:20, primaryAction:{label:'Book Now', style:'orange'} },
  { id:'n7', category:'games', group:'yesterday', unread:false, timestamp:'Yesterday, 2 PM',
    title:'3 new players joined your Football game ⚽', description:'Only 2 spots remaining. Invite more friends!',
    image:'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=200&h=200&fit=crop&auto=format',
    spotsLeft:2, primaryAction:{label:'View Game', style:'green'} },
  { id:'n8', category:'friends', group:'yesterday', unread:false, timestamp:'Yesterday, 11 AM',
    title:'Ananya just joined TYNG! 🎮', description:'You both play Badminton and Tennis. Start playing together!',
    avatar:'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&auto=format',
    primaryAction:{label:'Add Friend', style:'green'} },
  { id:'n9', category:'events', group:'yesterday', unread:false, timestamp:'Yesterday, 9 AM',
    title:'Weekend Football Tournament 🏆', description:'32 Teams · Prize Pool ₹50,000 · Lucknow · This Saturday',
    emoji:'🏆', isWide:true,
    gradient:'linear-gradient(135deg,#FF7A00 0%,#FF4500 100%)',
    primaryAction:{label:'Register Now', style:'white'} },
  { id:'n10', category:'rewards', group:'yesterday', unread:false, timestamp:'Yesterday, 8 AM',
    title:'Weekend Warrior Badge Unlocked! 🔥', description:'You played 3 matches this weekend. Keep it up!',
    emoji:'🔥', isReward:true,
    gradient:'linear-gradient(135deg,#FF7A00 0%,#FFC300 100%)' },

  // EARLIER
  { id:'n11', category:'games', group:'earlier', unread:false, timestamp:'Mon, 5 PM',
    title:'Basketball game cancelled 🏀', description:'Venue unavailable due to maintenance. Refund processed.',
    image:'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=200&h=200&fit=crop&auto=format',
    isRefund:true },
  { id:'n12', category:'venues', group:'earlier', unread:false, timestamp:'Mon, 2 PM',
    title:'New: Elite Padel Club', description:'Just opened · 1.4 km away · 4 courts available',
    image:'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=700&h=240&fit=crop&auto=format',
    isWide:true, primaryAction:{label:'Explore', style:'green'} },
  { id:'n13', category:'friends', group:'earlier', unread:false, timestamp:'Sun, 6 PM',
    title:'Aman reached Level 18! 🎮', description:'Your friend is climbing fast. Send them a high-five!',
    avatar:'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=100&h=100&fit=crop&auto=format',
    primaryAction:{label:'Congratulate 🎉', style:'green'} },
  { id:'n14', category:'messages', group:'earlier', unread:false, timestamp:'Sun, 4 PM',
    title:'Coach Rohan replied to your enquiry', description:'"I have Saturday morning slots available. Book now!"',
    avatar:'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&auto=format',
    primaryAction:{label:'View Reply', style:'orange'} },
];

const FILTERS: { id: FilterId; label: string; emoji: string }[] = [
  { id:'all',      label:'All',       emoji:'🔔' },
  { id:'games',    label:'Games',     emoji:'⚽' },
  { id:'friends',  label:'Friends',   emoji:'👥' },
  { id:'messages', label:'Messages',  emoji:'💬' },
  { id:'venues',   label:'Venues',    emoji:'🏟️' },
  { id:'events',   label:'Events',    emoji:'🏆' },
  { id:'rewards',  label:'Rewards',   emoji:'⭐' },
];

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <main class="notifications-page">

        <!-- Header -->
        <div class="notif-header">
          <button class="back-btn" (click)="back()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1 class="notif-title">Notifications</h1>
          <button class="mark-read-btn" (click)="markAllRead()">
            <ion-icon name="checkmark-done-outline"></ion-icon>
          </button>
        </div>

        <!-- Filter Chips -->
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

        <!-- Unread count -->
        <div class="unread-bar" *ngIf="unreadCount() > 0">
          <span class="unread-dot"></span>
          <span class="unread-text">{{ unreadCount() }} unread</span>
          <button class="clear-btn" (click)="markAllRead()">Mark all read</button>
        </div>

        <!-- Notification Groups -->
        <div class="notif-content">

          <!-- TODAY -->
          <ng-container *ngIf="todayNotifs().length > 0">
            <div class="group-label">Today</div>
            <div class="notif-list">
              <ng-container *ngFor="let n of todayNotifs()">
                <!-- AI Card -->
                <div *ngIf="n.isAI" class="ai-card">
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
                  <button *ngIf="n.primaryAction" class="action-btn-orange" (click)="navigateToOngoing()">{{ n.primaryAction.label }}</button>
                </div>

                <!-- Reward Card -->
                <div *ngIf="n.isReward && !n.isAI" class="reward-card" [style.background]="n.gradient || 'linear-gradient(135deg,#111827,#1F2937)'">
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

                <!-- Standard Card -->
                <div *ngIf="!n.isAI && !n.isReward && !n.isWide" class="std-card" [class.std-card-unread]="n.unread">
                  <div *ngIf="n.unread" class="std-unread-bar"></div>
                  <!-- Avatar or image -->
                  <div *ngIf="n.avatar" class="std-avatar">
                    <img [src]="n.avatar" [alt]="n.title" />
                    <div *ngIf="n.messageCount" class="msg-badge">{{ n.messageCount }}</div>
                  </div>
                  <div *ngIf="n.image && !n.avatar" class="std-img">
                    <img [src]="n.image" [alt]="n.title" />
                    <div *ngIf="n.spotsLeft" class="spots-badge">{{ n.spotsLeft }} spots left</div>
                  </div>
                  <div *ngIf="!n.avatar && !n.image" class="std-icon">
                    <span *ngIf="n.isWeather">🌧️</span>
                    <span *ngIf="n.isRefund">💰</span>
                    <span *ngIf="!n.isWeather && !n.isRefund">{{ n.emoji || '🔔' }}</span>
                  </div>
                  <!-- Content -->
                  <div class="std-body">
                    <div class="std-row">
                      <div class="std-title">{{ n.title }}</div>
                      <div class="std-time">{{ n.timestamp }}</div>
                    </div>
                    <div class="std-desc">{{ n.description }}</div>
                    <div *ngIf="n.isWeather" class="weather-tag">🌧️ Weather Alert</div>
                    <div *ngIf="n.isRefund" class="refund-tag">💰 Refund Processed</div>
                    <button *ngIf="n.primaryAction && n.primaryAction.style === 'green'" class="action-btn-green" (click)="handleAction(n)">{{ n.primaryAction.label }}</button>
                    <button *ngIf="n.primaryAction && n.primaryAction.style === 'orange'" class="action-btn-orange-sm" (click)="handleAction(n)">{{ n.primaryAction.label }}</button>
                  </div>
                </div>

                <!-- Wide Card -->
                <div *ngIf="n.isWide" class="wide-card">
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
                    <button *ngIf="n.primaryAction" [class]="'action-btn-' + n.primaryAction.style" (click)="handleAction(n)">{{ n.primaryAction.label }}</button>
                  </div>
                </div>

              </ng-container>
            </div>
          </ng-container>

          <!-- YESTERDAY -->
          <ng-container *ngIf="yesterdayNotifs().length > 0">
            <div class="group-label">Yesterday</div>
            <div class="notif-list">
              <ng-container *ngFor="let n of yesterdayNotifs()">
                <div *ngIf="n.isReward && !n.isAI" class="reward-card" [style.background]="n.gradient || 'linear-gradient(135deg,#111827,#1F2937)'">
                  <div class="reward-inner">
                    <div class="reward-emoji">{{ n.emoji }}</div>
                    <div>
                      <div class="reward-title">{{ n.title }}</div>
                      <div class="reward-desc">{{ n.description }}</div>
                    </div>
                  </div>
                </div>
                <div *ngIf="!n.isAI && !n.isReward && !n.isWide" class="std-card">
                  <div *ngIf="n.avatar" class="std-avatar"><img [src]="n.avatar" [alt]="n.title" /></div>
                  <div *ngIf="n.image && !n.avatar" class="std-img"><img [src]="n.image" [alt]="n.title" /><div *ngIf="n.spotsLeft" class="spots-badge">{{ n.spotsLeft }} spots left</div></div>
                  <div *ngIf="!n.avatar && !n.image" class="std-icon"><span>{{ n.emoji || '🔔' }}</span></div>
                  <div class="std-body">
                    <div class="std-row">
                      <div class="std-title">{{ n.title }}</div>
                      <div class="std-time">{{ n.timestamp }}</div>
                    </div>
                    <div class="std-desc">{{ n.description }}</div>
                    <button *ngIf="n.primaryAction && n.primaryAction.style === 'green'" class="action-btn-green" (click)="handleAction(n)">{{ n.primaryAction.label }}</button>
                    <button *ngIf="n.primaryAction && n.primaryAction.style === 'orange'" class="action-btn-orange-sm" (click)="handleAction(n)">{{ n.primaryAction.label }}</button>
                  </div>
                </div>
                <div *ngIf="n.isWide" class="wide-card">
                  <div *ngIf="n.image" class="wide-img"><img [src]="n.image" [alt]="n.title" /><div *ngIf="n.discount" class="discount-badge">{{ n.discount }}% OFF</div></div>
                  <div *ngIf="!n.image && n.gradient" class="wide-gradient" [style.background]="n.gradient"><div class="wide-emoji">{{ n.emoji }}</div></div>
                  <div class="wide-body">
                    <div class="std-row"><div class="std-title">{{ n.title }}</div><div class="std-time">{{ n.timestamp }}</div></div>
                    <div class="std-desc">{{ n.description }}</div>
                    <button *ngIf="n.primaryAction" class="action-btn-orange-sm" (click)="handleAction(n)">{{ n.primaryAction.label }}</button>
                  </div>
                </div>
              </ng-container>
            </div>
          </ng-container>

          <!-- EARLIER -->
          <ng-container *ngIf="earlierNotifs().length > 0">
            <div class="group-label">Earlier This Week</div>
            <div class="notif-list">
              <ng-container *ngFor="let n of earlierNotifs()">
                <div *ngIf="n.isReward && !n.isAI" class="reward-card" [style.background]="n.gradient || 'linear-gradient(135deg,#111827,#1F2937)'">
                  <div class="reward-inner">
                    <div class="reward-emoji">{{ n.emoji }}</div>
                    <div>
                      <div class="reward-title">{{ n.title }}</div>
                      <div class="reward-desc">{{ n.description }}</div>
                    </div>
                  </div>
                </div>
                <div *ngIf="!n.isAI && !n.isReward && !n.isWide" class="std-card">
                  <div *ngIf="n.avatar" class="std-avatar"><img [src]="n.avatar" [alt]="n.title" /></div>
                  <div *ngIf="n.image && !n.avatar" class="std-img"><img [src]="n.image" [alt]="n.title" /></div>
                  <div *ngIf="!n.avatar && !n.image" class="std-icon"><span>{{ n.isRefund ? '💰' : n.isWeather ? '🌧️' : (n.emoji || '🔔') }}</span></div>
                  <div class="std-body">
                    <div class="std-row"><div class="std-title">{{ n.title }}</div><div class="std-time">{{ n.timestamp }}</div></div>
                    <div class="std-desc">{{ n.description }}</div>
                    <div *ngIf="n.isRefund" class="refund-tag">💰 Refund Processed</div>
                    <button *ngIf="n.primaryAction && n.primaryAction.style === 'green'" class="action-btn-green" (click)="handleAction(n)">{{ n.primaryAction.label }}</button>
                    <button *ngIf="n.primaryAction && n.primaryAction.style === 'orange'" class="action-btn-orange-sm" (click)="handleAction(n)">{{ n.primaryAction.label }}</button>
                  </div>
                </div>
                <div *ngIf="n.isWide" class="wide-card">
                  <div *ngIf="n.image" class="wide-img"><img [src]="n.image" [alt]="n.title" /></div>
                  <div *ngIf="!n.image && n.gradient" class="wide-gradient" [style.background]="n.gradient"><div class="wide-emoji">{{ n.emoji }}</div></div>
                  <div class="wide-body">
                    <div class="std-row"><div class="std-title">{{ n.title }}</div><div class="std-time">{{ n.timestamp }}</div></div>
                    <div class="std-desc">{{ n.description }}</div>
                    <button *ngIf="n.primaryAction" class="action-btn-green" (click)="handleAction(n)">{{ n.primaryAction.label }}</button>
                  </div>
                </div>
              </ng-container>
            </div>
          </ng-container>

          <!-- Empty state -->
          <div *ngIf="filteredNotifs().length === 0" class="empty-state">
            <div class="empty-icon">🔔</div>
            <div class="empty-title">No notifications</div>
            <div class="empty-desc">You're all caught up!</div>
          </div>

          <div style="height: 120px;"></div>
        </div>

      </main>
    </ion-content>
  `,
  styles: [`
    .notifications-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 56px 20px 16px;
      background: #FFFFFF;
      border-bottom: 1px solid #F3F4F6;
    }

    .back-btn, .mark-read-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: #F3F4F6;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 18px;
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
      background: #FFFFFF;
      -webkit-overflow-scrolling: touch;
    }

    .filter-scroll::-webkit-scrollbar { display: none; }

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
      border: 1.5px solid #E5E7EB;
      background: #FFFFFF;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      white-space: nowrap;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .filter-chip-active {
      background: #111827;
      border-color: #111827;
      color: #FFFFFF;
    }

    .unread-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 20px;
      background: #F9FAFB;
    }

    .unread-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #FF7A00;
    }

    .unread-text {
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      flex: 1;
    }

    .clear-btn {
      font-size: 12px;
      font-weight: 700;
      color: #8CF000;
      background: none;
      border: none;
      cursor: pointer;
    }

    .notif-content {
      padding: 0 16px;
    }

    .group-label {
      font-size: 11px;
      font-weight: 700;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      padding: 16px 4px 8px;
    }

    .notif-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-bottom: 8px;
    }

    /* AI Card */
    .ai-card {
      border-radius: 28px;
      padding: 16px;
      background: linear-gradient(135deg, #8CF000 0%, #A3E635 100%);
      box-shadow: 0 4px 24px rgba(140,240,0,0.35);
      position: relative;
      overflow: hidden;
    }

    .ai-orb {
      position: absolute;
      top: 0; right: 0;
      width: 112px; height: 112px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      transform: translate(32px,-32px);
    }

    .unread-indicator {
      position: absolute;
      top: 16px; right: 16px;
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #FF7A00;
    }

    .ai-inner {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      position: relative;
    }

    .ai-icon {
      width: 40px; height: 40px;
      border-radius: 14px;
      background: rgba(17,24,39,0.15);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; flex-shrink: 0;
    }

    .ai-text { flex: 1; }
    .ai-title { font-size: 14px; font-weight: 800; color: #111827; line-height: 1.3; margin-bottom: 2px; }
    .ai-desc { font-size: 12px; color: rgba(17,24,39,0.7); line-height: 1.5; }
    .ai-time { font-size: 11px; color: rgba(17,24,39,0.5); margin-top: 4px; }

    /* Reward Card */
    .reward-card {
      border-radius: 28px;
      padding: 20px;
      position: relative;
      overflow: hidden;
    }

    .reward-orb {
      position: absolute;
      top: 0; right: 0;
      width: 128px; height: 128px;
      border-radius: 50%;
      background: rgba(255,255,255,0.1);
      transform: translate(40px,-40px);
    }

    .unread-dot-white {
      position: absolute;
      top: 16px; right: 16px;
      width: 10px; height: 10px;
      border-radius: 50%;
      background: #8CF000;
    }

    .reward-inner {
      display: flex;
      align-items: center;
      gap: 16px;
      position: relative;
    }

    .reward-emoji { font-size: 44px; line-height: 1; }
    .reward-title { font-size: 16px; font-weight: 800; color: #FFFFFF; line-height: 1.3; }
    .reward-desc { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }

    .xp-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: rgba(255,255,255,0.15);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      color: #FFFFFF;
      margin-top: 6px;
    }

    /* Standard Card */
    .std-card {
      background: #FFFFFF;
      border-radius: 24px;
      padding: 14px;
      display: flex;
      gap: 12px;
      align-items: flex-start;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
      position: relative;
      overflow: hidden;
      border: 1.5px solid transparent;
    }

    .std-card-unread {
      border-color: rgba(140,240,0,0.3);
    }

    .std-unread-bar {
      position: absolute;
      left: 0; top: 0; bottom: 0;
      width: 3px;
      background: #8CF000;
      border-radius: 0 2px 2px 0;
    }

    .std-avatar {
      width: 52px; height: 52px;
      border-radius: 50%;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
    }

    .std-avatar img {
      width: 100%; height: 100%;
      object-fit: cover;
    }

    .msg-badge {
      position: absolute;
      top: -2px; right: -2px;
      width: 18px; height: 18px;
      border-radius: 50%;
      background: #FF7A00;
      font-size: 10px;
      font-weight: 800;
      color: white;
      display: flex; align-items: center; justify-content: center;
      border: 2px solid white;
    }

    .std-img {
      width: 52px; height: 52px;
      border-radius: 14px;
      overflow: hidden;
      flex-shrink: 0;
      position: relative;
    }

    .std-img img { width: 100%; height: 100%; object-fit: cover; }

    .spots-badge {
      position: absolute;
      bottom: 2px; left: 2px; right: 2px;
      background: #FF7A00;
      color: white;
      font-size: 9px;
      font-weight: 800;
      text-align: center;
      border-radius: 4px;
      padding: 1px 0;
    }

    .std-icon {
      width: 52px; height: 52px;
      border-radius: 14px;
      background: #F3F4F6;
      display: flex; align-items: center; justify-content: center;
      font-size: 22px;
      flex-shrink: 0;
    }

    .std-body { flex: 1; min-width: 0; }

    .std-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 4px;
    }

    .std-title {
      font-size: 13px;
      font-weight: 700;
      color: #111827;
      line-height: 1.3;
      flex: 1;
    }

    .std-time {
      font-size: 10px;
      color: #9CA3AF;
      font-weight: 500;
      white-space: nowrap;
    }

    .std-desc {
      font-size: 12px;
      color: #6B7280;
      line-height: 1.5;
    }

    .weather-tag, .refund-tag {
      display: inline-block;
      margin-top: 6px;
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 999px;
      background: #FEF3C7;
      color: #D97706;
    }

    .refund-tag {
      background: #D1FAE5;
      color: #059669;
    }

    /* Wide Card */
    .wide-card {
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    }

    .wide-img {
      height: 140px;
      overflow: hidden;
      position: relative;
    }

    .wide-img img {
      width: 100%; height: 100%;
      object-fit: cover;
    }

    .discount-badge {
      position: absolute;
      top: 12px; left: 12px;
      background: #FF7A00;
      color: white;
      font-size: 12px;
      font-weight: 800;
      padding: 4px 12px;
      border-radius: 999px;
    }

    .wide-gradient {
      height: 140px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .wide-emoji { font-size: 44px; }

    .wide-body {
      padding: 14px;
    }

    /* Action Buttons */
    .action-btn-green {
      margin-top: 8px;
      padding: 8px 16px;
      border-radius: 999px;
      background: #8CF000;
      color: #111827;
      font-size: 12px;
      font-weight: 800;
      border: none;
      cursor: pointer;
    }

    .action-btn-orange {
      margin-top: 12px;
      width: 100%;
      height: 40px;
      border-radius: 20px;
      background: #FF7A00;
      color: white;
      font-size: 13px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(255,122,0,0.4);
    }

    .action-btn-orange-sm {
      margin-top: 8px;
      padding: 8px 16px;
      border-radius: 999px;
      background: #FF7A00;
      color: white;
      font-size: 12px;
      font-weight: 800;
      border: none;
      cursor: pointer;
    }

    .action-btn-white {
      margin-top: 8px;
      padding: 8px 16px;
      border-radius: 999px;
      background: white;
      color: #111827;
      font-size: 12px;
      font-weight: 800;
      border: none;
      cursor: pointer;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 60px 20px;
    }

    .empty-icon { font-size: 48px; margin-bottom: 12px; }
    .empty-title { font-size: 18px; font-weight: 800; color: #111827; margin-bottom: 6px; }
    .empty-desc { font-size: 14px; color: #9CA3AF; }
  `]
})
export class NotificationsPage {
  private readonly router = inject(Router);

  readonly filters = FILTERS;
  readonly activeFilter = signal<FilterId>('all');
  readonly notifications = signal<Notif[]>(NOTIFICATIONS);

  readonly filteredNotifs = () => {
    const f = this.activeFilter();
    if (f === 'all') return this.notifications();
    return this.notifications().filter(n => n.category === f);
  };

  readonly unreadCount = () => this.filteredNotifs().filter(n => n.unread).length;

  readonly todayNotifs = () => this.filteredNotifs().filter(n => n.group === 'today');
  readonly yesterdayNotifs = () => this.filteredNotifs().filter(n => n.group === 'yesterday');
  readonly earlierNotifs = () => this.filteredNotifs().filter(n => n.group === 'earlier');

  setFilter(id: FilterId) {
    this.activeFilter.set(id);
  }

  markAllRead() {
    this.notifications.update(list => list.map(n => ({ ...n, unread: false })));
  }

  back() {
    this.router.navigateByUrl('/app/home');
  }

  navigateToOngoing() {
    this.router.navigateByUrl('/app/ongoing');
  }

  handleAction(n: Notif) {
    if (n.category === 'games') this.router.navigateByUrl('/app/ongoing');
    else if (n.category === 'venues') this.router.navigateByUrl('/app/venues');
    else if (n.category === 'friends') this.router.navigateByUrl('/app/discover');
    else if (n.category === 'messages') this.router.navigateByUrl('/app/chat');
    else if (n.category === 'events') this.router.navigateByUrl('/app/ongoing');
    else this.router.navigateByUrl('/app/leaderboard');
  }
}
