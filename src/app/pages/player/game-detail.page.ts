import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingRecord } from '../../core/models/api.model';
import { BookingService } from '../../core/services/booking.service';
import { ChatService } from '../../core/services/chat.service';
import {
  formatBookingDate,
  formatBookingTime,
  formatDurationLabel,
  gameChatMemberIds,
  sportEmoji,
} from '../../core/utils/booking.utils';

interface GameData {
  id: string;
  sport: string;
  emoji: string;
  venue: string;
  address: string;
  distance: string;
  date: string;
  time: string;
  duration: string;
  image: string;
  host: {
    name: string;
    photo: string;
    level: number;
    tp: number;
    attendance: number;
    matchesHosted: number;
    isCaptain: boolean;
  };
  playersJoined: number;
  maxPlayers: number;
  costPerPlayer: number;
  gameType: string;
  gameTypeEmoji: string;
  gameTypeBg: string;
  gameTypeColor: string;
  difficulty: string;
  difficultyColor: string;
  weather: string;
  players: { name: string; photo: string; skill: string; tp: number }[];
  chatMemberIds: string[];
  chatTitle: string;
  equipment: string[];
  matchVibe: string[];
  budgetBreakdown: {
    venue: number;
    platform: number;
    equipment: number;
    refreshments: number;
    hostShare?: number;
    playerShare?: number;
  };
  canJoin: boolean;
  isHost: boolean;
  isJoined: boolean;
  ctaLabel: string;
}

const TYPE_MAP: Record<string, { emoji: string; bg: string; color: string }> = {
  Competitive: { emoji: '🏆', bg: '#FFF7ED', color: '#C2410C' },
  Recreational: { emoji: '😊', bg: '#F0FDF4', color: '#16A34A' },
  Practice: { emoji: '💪', bg: '#EFF6FF', color: '#1D4ED8' },
  Casual: { emoji: '🎉', bg: '#F5F3FF', color: '#7C3AED' },
};

const DIFF_MAP: Record<string, string> = {
  Beginner: '#22C55E',
  Intermediate: '#F59E0B',
  Advanced: '#EF4444',
};

const SPORT_IMAGES: Record<string, string> = {
  cricket: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=400&fit=crop&auto=format',
  football: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=400&fit=crop&auto=format',
  basketball: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=700&h=400&fit=crop&auto=format',
  badminton: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=400&fit=crop&auto=format',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=700&h=400&fit=crop&auto=format',
};

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&auto=format';

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="gd-page" *ngIf="loading">
        <div class="state-wrap">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Loading game…</p>
        </div>
      </div>

      <div class="gd-page" *ngIf="!loading && errorMessage">
        <div class="state-wrap">
          <h3>Couldn't load game</h3>
          <p>{{ errorMessage }}</p>
          <button type="button" class="retry-btn" (click)="reload()">Try again</button>
        </div>
      </div>

      <div class="gd-page" *ngIf="!loading && game">
        <div class="gd-hero">
          <img [src]="game.image" [alt]="game.venue" class="hero-img" />
          <div class="hero-overlay"></div>

          <div class="hero-nav">
            <button class="hero-btn" (click)="back()">
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
            <div style="display:flex;gap:8px;">
              <button class="hero-btn">
                <ion-icon name="share-social-outline"></ion-icon>
              </button>
              <button class="hero-btn" (click)="liked = !liked">
                <ion-icon [name]="liked ? 'heart' : 'heart-outline'" [style.color]="liked ? '#EF4444' : 'white'"></ion-icon>
              </button>
            </div>
          </div>

          <div class="hero-badges">
            <span class="sport-pill">{{ game.emoji }} {{ game.sport }}</span>
            <span class="type-pill" [style.background]="game.gameTypeBg" [style.color]="game.gameTypeColor">
              {{ game.gameTypeEmoji }} {{ game.gameType }}
            </span>
          </div>
        </div>

        <div class="gd-content">
          <div class="section-card">
            <div class="host-row">
              <div class="host-img-wrap">
                <img [src]="game.host.photo" [alt]="game.host.name" class="host-img" />
                <div class="host-level">{{ game.host.level }}</div>
              </div>
              <div class="host-info">
                <div class="host-name-row">
                  <span class="host-name">{{ game.host.name }}</span>
                  <span *ngIf="game.host.isCaptain" class="captain-pill">🛡 Trusted Captain</span>
                </div>
                <div class="host-stats">
                  <span class="tp-text">{{ game.host.tp | number }} TP</span>
                  <span class="dot">·</span>
                  <span>{{ game.host.attendance }}% attendance</span>
                  <span class="dot">·</span>
                  <span>{{ game.host.matchesHosted }} hosted</span>
                </div>
              </div>
            </div>

            <div class="detail-grid">
              <div class="detail-item">
                <div class="detail-icon"><ion-icon name="location-outline"></ion-icon></div>
                <div>
                  <div class="detail-label">Venue</div>
                  <div class="detail-val">{{ game.venue }}</div>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon"><ion-icon name="time-outline"></ion-icon></div>
                <div>
                  <div class="detail-label">Time</div>
                  <div class="detail-val">{{ game.date }} · {{ game.time }}</div>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon"><ion-icon name="people-outline"></ion-icon></div>
                <div>
                  <div class="detail-label">Players</div>
                  <div class="detail-val">{{ game.playersJoined }}/{{ game.maxPlayers }} joined</div>
                </div>
              </div>
              <div class="detail-item">
                <div class="detail-icon"><ion-icon name="hourglass-outline"></ion-icon></div>
                <div>
                  <div class="detail-label">Duration</div>
                  <div class="detail-val">{{ game.duration }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="section-card">
            <div class="section-title">Players Joined</div>
            <div class="progress-header">
              <span class="progress-count">{{ game.playersJoined }}/{{ game.maxPlayers }}</span>
              <span class="spots-badge" *ngIf="getSpotsLeft() <= 3 && getSpotsLeft() > 0">{{ getSpotsLeft() }} spots left!</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width]="getPercent() + '%'"></div>
            </div>
            <div class="player-avatars" *ngIf="game.players.length">
              <div *ngFor="let p of game.players" class="player-chip">
                <img [src]="p.photo" [alt]="p.name" class="player-avatar" />
                <span class="player-name">{{ p.name }}</span>
                <span class="player-tp">{{ p.tp | number }} TP</span>
              </div>
            </div>
          </div>

          <div class="section-card">
            <button class="section-title-btn" (click)="budgetOpen = !budgetOpen">
              <span class="section-title">Budget Breakdown</span>
              <ion-icon [name]="budgetOpen ? 'chevron-up-outline' : 'chevron-down-outline'" style="font-size:16px;color:#9CA3AF;"></ion-icon>
            </button>
            <div *ngIf="budgetOpen" class="budget-list">
              <div class="budget-row">
                <span>Venue Charges</span>
                <span>₹{{ game.budgetBreakdown.venue }}</span>
              </div>
              <div class="budget-row" *ngIf="game.budgetBreakdown.hostShare">
                <span>Host share (20%)</span>
                <span>₹{{ game.budgetBreakdown.hostShare }}</span>
              </div>
              <div class="budget-row" *ngIf="game.budgetBreakdown.playerShare">
                <span>Other players each</span>
                <span>₹{{ game.budgetBreakdown.playerShare }}</span>
              </div>
            </div>
            <div class="budget-total">
              <span>{{ game.isHost ? 'Your host share paid' : 'Your join fee' }}</span>
              <span class="total-amount">{{
                game.isHost
                  ? (game.budgetBreakdown.hostShare ? ('₹' + game.budgetBreakdown.hostShare) : '—')
                  : (game.costPerPlayer > 0 ? ('₹' + game.costPerPlayer) : 'Free')
              }}</span>
            </div>
          </div>

          <div class="section-card">
            <div class="section-title">Equipment</div>
            <div class="chips-wrap">
              <span *ngFor="let eq of game.equipment" class="chip-grey">{{ eq }}</span>
            </div>
          </div>

          <div class="section-card">
            <div class="section-title">Match Vibe</div>
            <div class="chips-wrap">
              <span *ngFor="let v of game.matchVibe" class="chip-orange">{{ v }}</span>
            </div>
          </div>
        </div>

        <div class="gd-cta">
          <div class="cta-price">
            <div class="cta-amount">{{ game.costPerPlayer > 0 ? ('₹' + game.costPerPlayer) : 'Free' }}</div>
            <div class="cta-label">per player</div>
          </div>
          <div class="cta-actions">
            <button
              *ngIf="game.isJoined || game.isHost"
              class="chat-btn"
              [disabled]="openingChat"
              (click)="openGameChat()"
            >
              {{ openingChat ? 'Opening…' : 'Chat' }}
            </button>
            <button
              class="join-btn"
              [disabled]="joining || (!game.canJoin && !game.isJoined && !game.isHost)"
              (click)="joinMatch()"
            >
              {{ joining ? 'Joining…' : game.ctaLabel }}
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .gd-page {
        background: #fafbfc;
        min-height: 100%;
      }

      .state-wrap {
        min-height: 70vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 24px;
        text-align: center;
        color: #6b7280;
      }

      .state-wrap h3 {
        margin: 0;
        color: #111827;
        font-size: 18px;
        font-weight: 800;
      }

      .retry-btn,
      .join-btn:disabled {
        opacity: 0.7;
      }

      .retry-btn {
        min-height: unset;
        margin-top: 8px;
        border-radius: 999px;
        padding: 10px 18px;
        background: var(--app-primary);
        color: #111827;
        font-weight: 700;
      }

      .gd-hero {
        position: relative;
        height: 42vh;
        min-height: 260px;
        overflow: hidden;
        background: #111827;
      }

      .hero-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.25), transparent 40%, #fafbfc);
      }

      .hero-nav {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 52px 20px 0;
      }

      .hero-btn {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        color: white;
        cursor: pointer;
      }

      .hero-badges {
        position: absolute;
        bottom: 40px;
        left: 20px;
        display: flex;
        gap: 8px;
      }

      .sport-pill {
        font-size: 12px;
        font-weight: 700;
        color: white;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        padding: 6px 14px;
        border-radius: 999px;
      }

      .type-pill {
        font-size: 12px;
        font-weight: 700;
        padding: 6px 14px;
        border-radius: 999px;
      }

      .gd-content {
        padding: 0 16px;
        margin-top: -8px;
        position: relative;
        z-index: 10;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .section-card {
        background: #ffffff;
        border-radius: 24px;
        padding: 20px;
        box-shadow: 0 1px 12px rgba(0, 0, 0, 0.06);
      }

      .section-title {
        font-size: 13px;
        font-weight: 800;
        color: #111827;
        text-transform: uppercase;
        letter-spacing: 0.1em;
        margin-bottom: 14px;
      }

      .section-title-btn {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: none;
        border: none;
        cursor: pointer;
        padding: 0;
      }

      .host-row {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;
        padding-bottom: 20px;
        border-bottom: 1px solid #f3f4f6;
      }

      .host-img-wrap {
        position: relative;
        flex-shrink: 0;
      }

      .host-img {
        width: 64px;
        height: 64px;
        border-radius: 18px;
        object-fit: cover;
      }

      .host-level {
        position: absolute;
        bottom: -6px;
        right: -6px;
        width: 28px;
        height: 28px;
        border-radius: 10px;
        background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
        border: 2px solid white;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 900;
        color: #111827;
      }

      .host-info {
        flex: 1;
        min-width: 0;
      }

      .host-name-row {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        margin-bottom: 4px;
      }

      .host-name {
        font-size: 16px;
        font-weight: 800;
        color: #111827;
      }

      .captain-pill {
        font-size: 9px;
        font-weight: 800;
        color: #ff7a00;
        background: #fff7ed;
        padding: 2px 8px;
        border-radius: 999px;
        text-transform: uppercase;
      }

      .host-stats {
        display: flex;
        align-items: center;
        gap: 4px;
        font-size: 11px;
        color: #9ca3af;
        flex-wrap: wrap;
      }

      .tp-text {
        color: #ff7a00;
        font-weight: 700;
      }
      .dot {
        opacity: 0.5;
      }

      .detail-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 14px;
      }

      .detail-item {
        display: flex;
        align-items: flex-start;
        gap: 8px;
      }

      .detail-icon {
        width: 28px;
        height: 28px;
        border-radius: 10px;
        background: #f3f4f6;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 13px;
        color: #6b7280;
        flex-shrink: 0;
      }

      .detail-label {
        font-size: 10px;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        margin-bottom: 1px;
      }

      .detail-val {
        font-size: 12px;
        font-weight: 600;
        color: #111827;
        line-height: 1.3;
      }

      .progress-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;
      }

      .progress-count {
        font-size: 18px;
        font-weight: 800;
        color: #111827;
      }

      .spots-badge {
        font-size: 10px;
        font-weight: 700;
        color: #ef4444;
        background: #fef2f2;
        padding: 3px 10px;
        border-radius: 999px;
      }

      .progress-bar {
        height: 6px;
        background: #f3f4f6;
        border-radius: 999px;
        overflow: hidden;
        margin-bottom: 16px;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--app-primary), var(--app-primary-to));
        border-radius: 999px;
      }

      .player-avatars {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .player-chip {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 6px 0;
        border-bottom: 1px solid #f9fafb;
      }

      .player-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        object-fit: cover;
      }

      .player-name {
        font-size: 13px;
        font-weight: 600;
        color: #111827;
        flex: 1;
      }

      .player-tp {
        font-size: 11px;
        font-weight: 700;
        color: #ff7a00;
      }

      .budget-list {
        display: flex;
        flex-direction: column;
        gap: 10px;
        margin-bottom: 14px;
        padding-bottom: 14px;
        border-bottom: 1px solid #f3f4f6;
      }

      .budget-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        color: #6b7280;
      }

      .budget-total {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding-top: 12px;
      }

      .budget-total span:first-child {
        font-size: 15px;
        font-weight: 800;
        color: #111827;
      }

      .total-amount {
        font-size: 20px;
        font-weight: 900;
        color: #111827;
      }

      .chips-wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chip-grey {
        font-size: 12px;
        font-weight: 600;
        background: #f3f4f6;
        color: #6b7280;
        padding: 6px 14px;
        border-radius: 999px;
      }

      .chip-orange {
        font-size: 12px;
        font-weight: 600;
        background: #fff7ed;
        color: #c2410c;
        padding: 6px 14px;
        border-radius: 999px;
      }

      .gd-cta {
        position: sticky;
        bottom: 0;
        background: white;
        padding: 16px 20px 40px;
        box-shadow: 0 -2px 20px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .cta-price {
        flex-shrink: 0;
      }
      .cta-amount {
        font-size: 22px;
        font-weight: 900;
        color: #111827;
      }
      .cta-label {
        font-size: 11px;
        color: #9ca3af;
      }

      .cta-actions {
        flex: 1;
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .chat-btn {
        height: 50px;
        padding: 0 16px;
        border-radius: 999px;
        background: #111827;
        color: #fff;
        font-size: 14px;
        font-weight: 800;
        border: none;
        cursor: pointer;
        flex-shrink: 0;
      }

      .join-btn {
        flex: 1;
        height: 50px;
        border-radius: 999px;
        background: linear-gradient(90deg, var(--app-primary), var(--app-primary-to));
        color: #111827;
        font-size: 16px;
        font-weight: 800;
        border: none;
        cursor: pointer;
        box-shadow: 0 4px 16px rgba(var(--app-primary-rgb), 0.35);
      }
    `,
  ],
})
export class GameDetailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);
  private readonly bookingService = inject(BookingService);
  private readonly chat = inject(ChatService);
  private readonly toastCtrl = inject(ToastController);

  game: GameData | null = null;
  liked = false;
  budgetOpen = false;
  loading = true;
  joining = false;
  openingChat = false;
  errorMessage = '';
  private bookingId = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      this.bookingId = params.get('id') || '';
      void this.loadGame();
    });
  }

  reload() {
    void this.loadGame();
  }

  getSpotsLeft() {
    return this.game ? this.game.maxPlayers - this.game.playersJoined : 0;
  }

  getPercent() {
    if (!this.game || !this.game.maxPlayers) return 0;
    return Math.round((this.game.playersJoined / this.game.maxPlayers) * 100);
  }

  back() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/app/home');
  }

  async openGameChat(): Promise<void> {
    if (!this.game || this.openingChat) return;
    this.openingChat = true;
    try {
      const res = await this.chat.openGame(this.game.id, {
        title: this.game.chatTitle,
        memberIds: this.game.chatMemberIds,
      });
      if (res.success && res.data?.id) {
        void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(res.data.id)}`);
        return;
      }
      const toast = await this.toastCtrl.create({
        message: res.message || 'Unable to open game chat.',
        duration: 2200,
        color: 'dark',
      });
      await toast.present();
    } catch {
      const toast = await this.toastCtrl.create({
        message: 'Unable to open game chat.',
        duration: 2200,
        color: 'dark',
      });
      await toast.present();
    } finally {
      this.openingChat = false;
    }
  }

  async joinMatch() {
    if (!this.game) return;

    if (this.game.isHost || this.game.isJoined) {
      void this.router.navigateByUrl(`/app/my-bookings/${this.game.id}`);
      return;
    }

    if (!this.game.canJoin || this.joining) return;

    this.joining = true;
    try {
      const response = await firstValueFrom(this.bookingService.joinBooking(this.game.id));
      if (response.success && response.data) {
        this.game = this.mapBooking(response.data);
        const toast = await this.toastCtrl.create({
          message: response.message || 'Joined game successfully!',
          duration: 2000,
          color: 'success',
          position: 'bottom',
        });
        await toast.present();
        void this.router.navigateByUrl(`/app/my-bookings/${response.data.id}`);
      } else {
        await this.showError(response.message || 'Unable to join this game.');
      }
    } catch (error: any) {
      await this.showError(error?.error?.message || 'Unable to join this game.');
    } finally {
      this.joining = false;
    }
  }

  private async loadGame() {
    if (!this.bookingId) {
      this.loading = false;
      this.errorMessage = 'Game not found.';
      this.game = null;
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    try {
      const response = await firstValueFrom(this.bookingService.getBooking(this.bookingId));
      if (response.success && response.data) {
        this.game = this.mapBooking(response.data);
      } else {
        this.game = null;
        this.errorMessage = response.message || 'Game not found.';
      }
    } catch (error: any) {
      this.game = null;
      this.errorMessage = error?.error?.message || 'Unable to load this game.';
    } finally {
      this.loading = false;
    }
  }

  private mapBooking(booking: BookingRecord): GameData {
    const sportKey = (booking.sport || '').toLowerCase();
    const sportName = (booking.sport || 'Game').replace(/\b\w/g, (c) => c.toUpperCase());
    const skill = booking.skillLevel
      ? booking.skillLevel.replace(/\b\w/g, (c) => c.toUpperCase())
      : 'Intermediate';
    const typeMeta = TYPE_MAP['Casual'];
    const price = Number(booking.price || 0);
    const players = (booking.acceptedPlayers || booking.players || [])
      .filter((p) => ['joined', 'host'].includes(p.status))
      .map((p) => ({
        name: p.user?.name || 'Player',
        photo: p.user?.profileImage || DEFAULT_PHOTO,
        skill: p.role === 'host' ? 'Host' : 'Player',
        tp: 1000,
      }));

    const chatMemberIds = gameChatMemberIds(booking);

    let ctaLabel = 'Join Game';
    if (booking.isHost) ctaLabel = 'Manage Booking';
    else if (booking.isJoined) ctaLabel = 'View Booking';
    else if (!booking.canJoin) {
      if (booking.bookingStatus === 'full') ctaLabel = 'Game Full';
      else if (booking.bookingStatus === 'pending') ctaLabel = 'Awaiting venue approval';
      else if (booking.bookingStatus === 'cancelled') ctaLabel = 'Cancelled';
      else if (booking.bookingStatus === 'expired') ctaLabel = 'Expired';
      else ctaLabel = 'Unavailable';
    }

    return {
      id: booking.id,
      sport: sportName,
      emoji: sportEmoji(booking.sport),
      venue: booking.venue?.name || 'Venue TBD',
      address: booking.venue?.location || booking.venue?.address || '',
      distance: booking.venue?.location || 'Nearby',
      date: formatBookingDate(booking.bookingDate),
      time: formatBookingTime(booking.startTime),
      duration: formatDurationLabel(booking.durationMinutes),
      image: SPORT_IMAGES[sportKey] || SPORT_IMAGES['cricket'],
      host: {
        name: booking.host?.name || 'Host',
        photo: booking.host?.profileImage || DEFAULT_PHOTO,
        level: 1,
        tp: 1000,
        attendance: 90,
        matchesHosted: 1,
        isCaptain: true,
      },
      playersJoined: booking.currentPlayers,
      maxPlayers: booking.totalPlayers,
      costPerPlayer: Number(booking.costPerPlayer || booking.playerShareAmount || 0),
      gameType: 'Casual',
      gameTypeEmoji: typeMeta.emoji,
      gameTypeBg: typeMeta.bg,
      gameTypeColor: typeMeta.color,
      difficulty: skill,
      difficultyColor: DIFF_MAP[skill] || DIFF_MAP['Intermediate'],
      weather: 'Clear ☀️',
      players,
      chatMemberIds: Array.from(chatMemberIds),
      chatTitle: `${sportName}${booking.bookingDate ? ' · ' + booking.bookingDate : ''}`,
      equipment: ['Bat', 'Ball', 'Shoes', 'Gloves', 'Helmet', 'Water'],
      matchVibe: ['Serious Match', 'Photography', 'Coffee After'],
      budgetBreakdown: {
        venue: price,
        platform: 0,
        equipment: 0,
        refreshments: 0,
        hostShare: Number(booking.hostAmount || 0),
        playerShare: Number(booking.playerShareAmount || booking.costPerPlayer || 0),
      },
      canJoin: !!booking.canJoin,
      isHost: !!booking.isHost,
      isJoined: !!booking.isJoined,
      ctaLabel,
    };
  }

  private async showError(message: string) {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2800,
      color: 'danger',
      position: 'bottom',
    });
    await toast.present();
  }
}
