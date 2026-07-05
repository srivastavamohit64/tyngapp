import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

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
  host: { name: string; photo: string; level: number; tp: number; attendance: number; matchesHosted: number; isCaptain: boolean };
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
  equipment: string[];
  matchVibe: string[];
  budgetBreakdown: { venue: number; platform: number; equipment: number; refreshments: number };
}

const TYPE_MAP: Record<string, { emoji: string; bg: string; color: string }> = {
  'Competitive':  { emoji: '🏆', bg: '#FFF7ED', color: '#C2410C' },
  'Recreational': { emoji: '😊', bg: '#F0FDF4', color: '#16A34A' },
  'Practice':     { emoji: '💪', bg: '#EFF6FF', color: '#1D4ED8' },
  'Casual':       { emoji: '🎉', bg: '#F5F3FF', color: '#7C3AED' },
};

const DIFF_MAP: Record<string, string> = {
  'Beginner': '#22C55E', 'Intermediate': '#F59E0B', 'Advanced': '#EF4444',
};

const GAMES: GameData[] = [
  {
    id: '1', sport: 'Cricket', emoji: '🏏',
    venue: 'Ekana Cricket Stadium', address: 'Gomti Nagar Extension, Lucknow', distance: '4.5 km',
    date: 'Today', time: '7:00 PM', duration: '3 hours',
    image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=400&fit=crop&auto=format',
    host: { name: 'Vikram Singh', photo: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=120&h=120&fit=crop&auto=format', level: 28, tp: 1580, attendance: 96, matchesHosted: 34, isCaptain: true },
    playersJoined: 8, maxPlayers: 10, costPerPlayer: 450,
    gameType: 'Competitive', gameTypeEmoji: '🏆', gameTypeBg: '#FFF7ED', gameTypeColor: '#C2410C',
    difficulty: 'Advanced', difficultyColor: '#EF4444',
    weather: 'Clear ☀️',
    players: [
      { name: 'Arjun', photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&auto=format', skill: 'Expert', tp: 1250 },
      { name: 'Priya', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', skill: 'Advanced', tp: 980 },
      { name: 'Kabir', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', skill: 'Expert', tp: 1420 },
      { name: 'Rahul', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', skill: 'Expert', tp: 1100 },
    ],
    equipment: ['🏏 Bat', '🥎 Ball', '👟 Shoes', '🧤 Gloves', '🛡 Helmet', '💧 Water'],
    matchVibe: ['🏆 Serious Match', '📷 Photography', '☕ Coffee After'],
    budgetBreakdown: { venue: 300, platform: 50, equipment: 75, refreshments: 25 },
  },
  {
    id: '2', sport: 'Football', emoji: '⚽',
    venue: 'K.D. Singh Babu Stadium', address: 'Nehru Nagar, Lucknow', distance: '2.3 km',
    date: 'Today', time: '6:00 PM', duration: '90 min',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=400&fit=crop&auto=format',
    host: { name: 'Aryan Mehta', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=120&h=120&fit=crop&auto=format', level: 22, tp: 1120, attendance: 91, matchesHosted: 18, isCaptain: false },
    playersJoined: 14, maxPlayers: 22, costPerPlayer: 200,
    gameType: 'Casual', gameTypeEmoji: '🎉', gameTypeBg: '#F5F3FF', gameTypeColor: '#7C3AED',
    difficulty: 'Beginner', difficultyColor: '#22C55E',
    weather: 'Cloudy ⛅',
    players: [
      { name: 'Kabir', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', skill: 'Expert', tp: 1420 },
      { name: 'Vikram', photo: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=80&h=80&fit=crop&auto=format', skill: 'Expert', tp: 1580 },
    ],
    equipment: ['⚽ Ball', '👟 Shoes', '💧 Water'],
    matchVibe: ['😊 Chill Session', '🍕 Food After', '🎵 Music'],
    budgetBreakdown: { venue: 150, platform: 30, equipment: 0, refreshments: 20 },
  },
];

@Component({
  selector: 'app-game-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="gd-page" *ngIf="game">

        <!-- Hero Image -->
        <div class="gd-hero">
          <img [src]="game.image" [alt]="game.venue" class="hero-img" />
          <div class="hero-overlay"></div>

          <!-- Back + Actions -->
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

          <!-- Sport + Type badges on hero -->
          <div class="hero-badges">
            <span class="sport-pill">{{ game.emoji }} {{ game.sport }}</span>
            <span class="type-pill" [style.background]="game.gameTypeBg" [style.color]="game.gameTypeColor">
              {{ game.gameTypeEmoji }} {{ game.gameType }}
            </span>
          </div>
        </div>

        <!-- Content -->
        <div class="gd-content">

          <!-- Host + Summary -->
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

            <!-- Details grid -->
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

          <!-- Players Progress -->
          <div class="section-card">
            <div class="section-title">Players Joined</div>
            <div class="progress-header">
              <span class="progress-count">{{ game.playersJoined }}/{{ game.maxPlayers }}</span>
              <span class="spots-badge" *ngIf="getSpotsLeft() <= 3">{{ getSpotsLeft() }} spots left!</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" [style.width]="getPercent() + '%'"></div>
            </div>
            <!-- Player avatars -->
            <div class="player-avatars">
              <div *ngFor="let p of game.players" class="player-chip">
                <img [src]="p.photo" [alt]="p.name" class="player-avatar" />
                <span class="player-name">{{ p.name }}</span>
                <span class="player-tp">{{ p.tp | number }} TP</span>
              </div>
            </div>
          </div>

          <!-- Budget Breakdown -->
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
              <div class="budget-row">
                <span>Platform Fee</span>
                <span>₹{{ game.budgetBreakdown.platform }}</span>
              </div>
              <div class="budget-row" *ngIf="game.budgetBreakdown.equipment > 0">
                <span>Equipment <small class="opt-tag">Optional</small></span>
                <span>₹{{ game.budgetBreakdown.equipment }}</span>
              </div>
              <div class="budget-row" *ngIf="game.budgetBreakdown.refreshments > 0">
                <span>Refreshments <small class="opt-tag">Optional</small></span>
                <span>₹{{ game.budgetBreakdown.refreshments }}</span>
              </div>
            </div>
            <div class="budget-total">
              <span>Total per Player</span>
              <span class="total-amount">₹{{ getTotalCost() }}</span>
            </div>
          </div>

          <!-- Equipment -->
          <div class="section-card">
            <div class="section-title">Equipment</div>
            <div class="chips-wrap">
              <span *ngFor="let eq of game.equipment" class="chip-grey">{{ eq }}</span>
            </div>
          </div>

          <!-- Match Vibe -->
          <div class="section-card">
            <div class="section-title">Match Vibe</div>
            <div class="chips-wrap">
              <span *ngFor="let v of game.matchVibe" class="chip-orange">{{ v }}</span>
            </div>
          </div>

        </div>

        <!-- Sticky Bottom CTA -->
        <div class="gd-cta">
          <div class="cta-price">
            <div class="cta-amount">₹{{ game.costPerPlayer }}</div>
            <div class="cta-label">per player</div>
          </div>
          <button class="join-btn" (click)="joinMatch()">
            Join Game
          </button>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .gd-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .gd-hero {
      position: relative;
      height: 42vh;
      min-height: 260px;
      overflow: hidden;
      background: #111827;
    }

    .hero-img {
      width: 100%; height: 100%;
      object-fit: cover;
    }

    .hero-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to bottom, rgba(0,0,0,0.25), transparent 40%, #FAFBFC);
    }

    .hero-nav {
      position: absolute;
      top: 0; left: 0; right: 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 52px 20px 0;
    }

    .hero-btn {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: rgba(0,0,0,0.4);
      backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.2);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px;
      color: white;
      cursor: pointer;
    }

    .hero-badges {
      position: absolute;
      bottom: 40px; left: 20px;
      display: flex; gap: 8px;
    }

    .sport-pill {
      font-size: 12px;
      font-weight: 700;
      color: white;
      background: rgba(0,0,0,0.5);
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
      background: #FFFFFF;
      border-radius: 24px;
      padding: 20px;
      box-shadow: 0 1px 12px rgba(0,0,0,0.06);
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

    /* Host */
    .host-row {
      display: flex;
      align-items: center;
      gap: 14px;
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #F3F4F6;
    }

    .host-img-wrap {
      position: relative;
      flex-shrink: 0;
    }

    .host-img {
      width: 64px; height: 64px;
      border-radius: 18px;
      object-fit: cover;
    }

    .host-level {
      position: absolute;
      bottom: -6px; right: -6px;
      width: 28px; height: 28px;
      border-radius: 10px;
      background: linear-gradient(135deg, #8CF000, #A3E635);
      border: 2px solid white;
      display: flex; align-items: center; justify-content: center;
      font-size: 10px;
      font-weight: 900;
      color: #111827;
    }

    .host-info { flex: 1; min-width: 0; }

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
      color: #FF7A00;
      background: #FFF7ED;
      padding: 2px 8px;
      border-radius: 999px;
      text-transform: uppercase;
    }

    .host-stats {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: #9CA3AF;
      flex-wrap: wrap;
    }

    .tp-text { color: #FF7A00; font-weight: 700; }
    .dot { opacity: 0.5; }

    /* Detail grid */
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
      width: 28px; height: 28px;
      border-radius: 10px;
      background: #F3F4F6;
      display: flex; align-items: center; justify-content: center;
      font-size: 13px;
      color: #6B7280;
      flex-shrink: 0;
    }

    .detail-label {
      font-size: 10px;
      color: #9CA3AF;
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

    /* Progress */
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
      color: #EF4444;
      background: #FEF2F2;
      padding: 3px 10px;
      border-radius: 999px;
    }

    .progress-bar {
      height: 6px;
      background: #F3F4F6;
      border-radius: 999px;
      overflow: hidden;
      margin-bottom: 16px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #8CF000, #A3E635);
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
      border-bottom: 1px solid #F9FAFB;
    }

    .player-avatar {
      width: 36px; height: 36px;
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
      color: #FF7A00;
    }

    /* Budget */
    .budget-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 14px;
      padding-bottom: 14px;
      border-bottom: 1px solid #F3F4F6;
    }

    .budget-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
      color: #6B7280;
    }

    .opt-tag {
      font-size: 9px;
      font-weight: 600;
      background: #F3F4F6;
      color: #9CA3AF;
      padding: 1px 6px;
      border-radius: 999px;
      margin-left: 4px;
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

    /* Chips */
    .chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip-grey {
      font-size: 12px;
      font-weight: 600;
      background: #F3F4F6;
      color: #6B7280;
      padding: 6px 14px;
      border-radius: 999px;
    }

    .chip-orange {
      font-size: 12px;
      font-weight: 600;
      background: #FFF7ED;
      color: #C2410C;
      padding: 6px 14px;
      border-radius: 999px;
    }

    /* Sticky CTA */
    .gd-cta {
      position: sticky;
      bottom: 0;
      background: white;
      padding: 16px 20px 40px;
      box-shadow: 0 -2px 20px rgba(0,0,0,0.1);
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .cta-price { flex-shrink: 0; }
    .cta-amount { font-size: 22px; font-weight: 900; color: #111827; }
    .cta-label { font-size: 11px; color: #9CA3AF; }

    .join-btn {
      flex: 1;
      height: 50px;
      border-radius: 999px;
      background: linear-gradient(90deg, #8CF000, #A3E635);
      color: #111827;
      font-size: 16px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 16px rgba(140,240,0,0.35);
    }
  `]
})
export class GameDetailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  game: GameData | null = null;
  liked = false;
  budgetOpen = false;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id') || '1';
      this.game = GAMES.find(g => g.id === id) || GAMES[0];
    });
  }

  getSpotsLeft() {
    return this.game ? this.game.maxPlayers - this.game.playersJoined : 0;
  }

  getPercent() {
    if (!this.game) return 0;
    return Math.round((this.game.playersJoined / this.game.maxPlayers) * 100);
  }

  getTotalCost() {
    if (!this.game) return 0;
    const b = this.game.budgetBreakdown;
    return b.venue + b.platform + b.equipment + b.refreshments;
  }

  back() {
    this.router.navigateByUrl('/app/ongoing');
  }

  joinMatch() {
    this.router.navigateByUrl('/app/chat/team-1');
  }
}
