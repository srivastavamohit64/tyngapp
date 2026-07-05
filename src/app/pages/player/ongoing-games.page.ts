import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

interface Game {
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
  hostName: string;
  hostPhoto: string;
  isCaptain: boolean;
  playersJoined: number;
  maxPlayers: number;
  costPerPlayer: number;
  gameType: string;
  difficulty: string;
  weather: string;
  isIndoor: boolean;
}

const GAMES: Game[] = [
  {
    id: '1', sport: 'Cricket', emoji: '🏏',
    venue: 'Ekana Cricket Stadium', address: 'Gomti Nagar Extension, Lucknow', distance: '4.5 km',
    date: 'Today', time: '7:00 PM', duration: '3 hours',
    image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=400&fit=crop&auto=format',
    hostName: 'Vikram Singh', hostPhoto: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=120&h=120&fit=crop&auto=format',
    isCaptain: true, playersJoined: 8, maxPlayers: 10, costPerPlayer: 450,
    gameType: 'Competitive', difficulty: 'Advanced', weather: 'Clear ☀️', isIndoor: false,
  },
  {
    id: '2', sport: 'Football', emoji: '⚽',
    venue: 'K.D. Singh Babu Stadium', address: 'Nehru Nagar, Lucknow', distance: '2.3 km',
    date: 'Today', time: '6:00 PM', duration: '90 min',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=400&fit=crop&auto=format',
    hostName: 'Aryan Mehta', hostPhoto: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=120&h=120&fit=crop&auto=format',
    isCaptain: false, playersJoined: 14, maxPlayers: 22, costPerPlayer: 200,
    gameType: 'Casual', difficulty: 'Beginner', weather: 'Cloudy ⛅', isIndoor: false,
  },
  {
    id: '3', sport: 'Basketball', emoji: '🏀',
    venue: 'Sports Authority Complex', address: 'Gomti Nagar, Lucknow', distance: '3.8 km',
    date: 'Tomorrow', time: '8:00 PM', duration: '2 hours',
    image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=700&h=400&fit=crop&auto=format',
    hostName: 'Priya Verma', hostPhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop&auto=format',
    isCaptain: false, playersJoined: 6, maxPlayers: 10, costPerPlayer: 350,
    gameType: 'Recreational', difficulty: 'Intermediate', weather: 'Clear ☀️', isIndoor: true,
  },
  {
    id: '4', sport: 'Badminton', emoji: '🏸',
    venue: 'Phoenix Sports Hub', address: 'Aliganj, Lucknow', distance: '5.2 km',
    date: 'Today', time: '5:30 PM', duration: '90 min',
    image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=400&fit=crop&auto=format',
    hostName: 'Meena Krishnan', hostPhoto: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=120&h=120&fit=crop&auto=format',
    isCaptain: true, playersJoined: 3, maxPlayers: 4, costPerPlayer: 250,
    gameType: 'Practice', difficulty: 'Intermediate', weather: 'Indoor 🏢', isIndoor: true,
  },
];

const FILTERS = ['Today', 'Tomorrow', 'Nearby', 'Competitive', 'Recreational', 'Beginner', 'Intermediate', 'Advanced'];

const TYPE_COLORS: Record<string, { bg: string; color: string }> = {
  'Competitive':  { bg: '#FFF7ED', color: '#C2410C' },
  'Recreational': { bg: '#F0FDF4', color: '#16A34A' },
  'Practice':     { bg: '#EFF6FF', color: '#1D4ED8' },
  'Casual':       { bg: '#F5F3FF', color: '#7C3AED' },
};

const DIFF_COLORS: Record<string, string> = {
  'Beginner': '#22C55E', 'Intermediate': '#F59E0B', 'Advanced': '#EF4444',
};

@Component({
  selector: 'app-ongoing-games',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="ongoing-page">

        <!-- Header -->
        <div class="og-header">
          <button class="og-back" (click)="back()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1 class="og-title">Ongoing Games</h1>
          <button class="og-filter-btn">
            <ion-icon name="options-outline"></ion-icon>
          </button>
        </div>

        <!-- Search -->
        <div class="og-search-wrap">
          <div class="og-search">
            <ion-icon name="search-outline" class="search-icon"></ion-icon>
            <input type="text" placeholder="Search games, venues..." class="search-input" />
          </div>
        </div>

        <!-- Filter chips -->
        <div class="filter-scroll">
          <div class="filter-track">
            <button
              *ngFor="let f of filterOptions"
              class="filter-chip"
              [class.filter-chip-active]="activeFilter() === f"
              (click)="setFilter(f)"
            >{{ f }}</button>
          </div>
        </div>

        <!-- Live Map Banner -->
        <div class="live-map-banner">
          <div class="map-grid">
            <div class="map-dot" style="top:38%;left:40%;background:#22C55E;">🏏</div>
            <div class="map-dot" style="top:58%;left:22%;background:#3B82F6;">⚽</div>
            <div class="map-dot" style="top:48%;left:63%;background:#F97316;">🏀</div>
            <div class="map-dot" style="top:72%;left:52%;background:#8B5CF6;">🏸</div>
            <div class="map-dot" style="top:28%;left:76%;background:#EAB308;">🎾</div>
          </div>
          <div class="map-overlay">
            <div class="map-info">
              <div class="live-badge">
                <span class="live-dot"></span>
                <span>LIVE</span>
              </div>
              <div class="map-count">4 active games nearby</div>
              <div class="map-sub">Tap pins to join instantly</div>
            </div>
          </div>
        </div>

        <!-- Games count -->
        <div class="games-count-row">
          <span class="games-count">{{ games.length }} games found</span>
          <button class="sort-btn">
            <ion-icon name="swap-vertical-outline"></ion-icon>
            Sort
          </button>
        </div>

        <!-- Game Cards -->
        <div class="games-list">
          <div
            *ngFor="let game of games"
            class="game-card"
            (click)="viewGame(game.id)"
          >
            <!-- Hero image -->
            <div class="card-hero">
              <img [src]="game.image" [alt]="game.sport" class="card-img" />
              <div class="card-img-overlay"></div>

              <!-- Type + difficulty badges -->
              <div class="card-badges-top">
                <span class="type-badge"
                  [style.background]="getTypeStyle(game.gameType).bg"
                  [style.color]="getTypeStyle(game.gameType).color">
                  {{ game.gameType }}
                </span>
                <span class="diff-badge" [style.color]="getDiffColor(game.difficulty)">
                  {{ game.difficulty }}
                </span>
              </div>

              <!-- Distance -->
              <div class="distance-badge">
                <ion-icon name="location-outline" style="font-size:10px;"></ion-icon>
                {{ game.distance }}
              </div>

              <!-- Date/time bottom left -->
              <div class="time-badge">
                <span class="time-date">{{ game.date }}</span>
                <span class="time-sep">·</span>
                <ion-icon name="time-outline" style="font-size:10px;"></ion-icon>
                <span>{{ game.time }}</span>
              </div>

              <!-- Sport emoji bottom right -->
              <div class="sport-emoji-circle">{{ game.emoji }}</div>
            </div>

            <!-- Card body -->
            <div class="card-body">
              <!-- Venue -->
              <div class="venue-row">
                <div class="venue-info">
                  <div class="venue-name">{{ game.venue }}</div>
                  <div class="venue-addr">
                    <ion-icon name="location-outline" style="font-size:11px;color:#9CA3AF;"></ion-icon>
                    {{ game.address }}
                  </div>
                </div>
                <div class="price-box">
                  <div class="price-amt">₹{{ game.costPerPlayer }}</div>
                  <div class="price-label">per player</div>
                </div>
              </div>

              <!-- Host -->
              <div class="host-row">
                <img [src]="game.hostPhoto" [alt]="game.hostName" class="host-img" />
                <span class="host-name">{{ game.hostName }}</span>
                <span *ngIf="game.isCaptain" class="captain-badge">🛡 Captain</span>
                <span class="duration">{{ game.duration }}</span>
              </div>

              <!-- Players progress -->
              <div class="players-section">
                <div class="players-header">
                  <div class="players-count">
                    <ion-icon name="people-outline" style="font-size:12px;color:#6B7280;"></ion-icon>
                    <strong>{{ game.playersJoined }}/{{ game.maxPlayers }}</strong>
                    <span>players joined</span>
                  </div>
                  <span *ngIf="getSpotsLeft(game) <= 3" class="spots-badge">{{ getSpotsLeft(game) }} spots left!</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill" [style.width]="getPercent(game) + '%'" [style.background]="getProgressColor(game)"></div>
                </div>
              </div>

              <!-- Join button -->
              <button class="join-btn" (click)="viewGame(game.id)">
                Join Game · ₹{{ game.costPerPlayer }}
              </button>
            </div>
          </div>
        </div>

        <div style="height: 120px;"></div>
      </div>
    </ion-content>
  `,
  styles: [`
    .ongoing-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .og-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 52px 20px 16px;
      background: #FFFFFF;
    }

    .og-back, .og-filter-btn {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #F3F4F6;
      border: none;
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; cursor: pointer;
    }

    .og-title {
      font-size: 18px;
      font-weight: 800;
      color: #111827;
      margin: 0;
    }

    .og-search-wrap {
      padding: 12px 20px;
      background: #FFFFFF;
    }

    .og-search {
      position: relative;
      display: flex;
      align-items: center;
    }

    .search-icon {
      position: absolute;
      left: 14px;
      font-size: 18px;
      color: #9CA3AF;
    }

    .search-input {
      width: 100%;
      height: 46px;
      padding-left: 44px;
      padding-right: 16px;
      background: #F3F4F6;
      border: none;
      border-radius: 14px;
      font-size: 14px;
      color: #111827;
      outline: none;
    }

    .filter-scroll {
      overflow-x: auto;
      padding: 10px 20px 12px;
      background: #FFFFFF;
    }

    .filter-scroll::-webkit-scrollbar { display: none; }

    .filter-track {
      display: flex;
      gap: 8px;
      width: max-content;
    }

    .filter-chip {
      padding: 7px 16px;
      border-radius: 999px;
      border: 1.5px solid #E5E7EB;
      background: #FFFFFF;
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.15s;
    }

    .filter-chip-active {
      background: #111827;
      border-color: #111827;
      color: #FFFFFF;
    }

    /* Live Map Banner */
    .live-map-banner {
      margin: 16px;
      border-radius: 24px;
      overflow: hidden;
      position: relative;
      height: 180px;
      background: linear-gradient(135deg, #E8F5E9 0%, #E3F2FD 50%, #F3E5F5 100%);
    }

    .map-grid {
      position: absolute;
      inset: 0;
    }

    .map-dot {
      position: absolute;
      width: 36px; height: 36px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
      box-shadow: 0 3px 10px rgba(0,0,0,0.2);
      transform: translate(-50%, -50%);
      border: 2px solid white;
    }

    .map-overlay {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      padding: 16px;
      background: linear-gradient(to top, rgba(0,0,0,0.6), transparent);
    }

    .map-info { color: white; }

    .live-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.25);
      backdrop-filter: blur(4px);
      padding: 4px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.05em;
      margin-bottom: 4px;
    }

    .live-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #8CF000;
      animation: pulse 1.2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .map-count {
      font-size: 16px;
      font-weight: 800;
    }

    .map-sub {
      font-size: 11px;
      opacity: 0.8;
    }

    /* Games count row */
    .games-count-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 20px 10px;
    }

    .games-count {
      font-size: 12px;
      font-weight: 600;
      color: #9CA3AF;
    }

    .sort-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      font-weight: 700;
      color: #6B7280;
      background: none;
      border: none;
      cursor: pointer;
    }

    /* Games list */
    .games-list {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 0 16px;
    }

    .game-card {
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
      cursor: pointer;
    }

    .card-hero {
      position: relative;
      height: 160px;
      overflow: hidden;
      background: #E5E7EB;
    }

    .card-img {
      width: 100%; height: 100%;
      object-fit: cover;
    }

    .card-img-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.4), transparent);
    }

    .card-badges-top {
      position: absolute;
      top: 12px; left: 12px;
      display: flex; gap: 6px;
    }

    .type-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
    }

    .diff-badge {
      font-size: 10px;
      font-weight: 700;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(255,255,255,0.9);
    }

    .distance-badge {
      position: absolute;
      top: 12px; right: 12px;
      display: flex; align-items: center; gap: 3px;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 600;
      color: white;
    }

    .time-badge {
      position: absolute;
      bottom: 12px; left: 12px;
      display: flex; align-items: center; gap: 4px;
      background: rgba(0,0,0,0.5);
      backdrop-filter: blur(4px);
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      color: white;
    }

    .time-sep { opacity: 0.6; }

    .sport-emoji-circle {
      position: absolute;
      bottom: 12px; right: 12px;
      width: 32px; height: 32px;
      border-radius: 50%;
      background: rgba(255,255,255,0.9);
      display: flex; align-items: center; justify-content: center;
      font-size: 16px;
    }

    .card-body {
      padding: 14px 16px 16px;
    }

    .venue-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .venue-info { flex: 1; min-width: 0; margin-right: 8px; }

    .venue-name {
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .venue-addr {
      display: flex;
      align-items: center;
      gap: 2px;
      margin-top: 2px;
      font-size: 11px;
      color: #9CA3AF;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .price-box { text-align: right; flex-shrink: 0; }
    .price-amt { font-size: 17px; font-weight: 900; color: #111827; }
    .price-label { font-size: 10px; color: #9CA3AF; }

    .host-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 10px;
    }

    .host-img {
      width: 24px; height: 24px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    .host-name {
      font-size: 12px;
      font-weight: 600;
      color: #6B7280;
      flex: 1;
    }

    .captain-badge {
      font-size: 9px;
      font-weight: 700;
      color: #FF7A00;
      background: #FFF7ED;
      padding: 2px 8px;
      border-radius: 999px;
    }

    .duration {
      font-size: 11px;
      color: #6B7280;
      font-weight: 500;
    }

    .players-section { margin-bottom: 12px; }

    .players-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .players-count {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      color: #9CA3AF;
    }

    .players-count strong { color: #111827; font-weight: 700; }

    .spots-badge {
      font-size: 10px;
      font-weight: 700;
      color: #EF4444;
      background: #FEF2F2;
      padding: 2px 8px;
      border-radius: 999px;
    }

    .progress-bar {
      height: 5px;
      background: #F3F4F6;
      border-radius: 999px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 999px;
      transition: width 0.4s ease;
    }

    .join-btn {
      width: 100%;
      height: 46px;
      border-radius: 999px;
      background: linear-gradient(90deg, #8CF000, #A3E635);
      color: #111827;
      font-size: 14px;
      font-weight: 800;
      border: none;
      cursor: pointer;
      box-shadow: 0 3px 12px rgba(140,240,0,0.3);
    }
  `]
})
export class OngoingGamesPage {
  private readonly router = inject(Router);

  readonly filterOptions = FILTERS;
  readonly activeFilter = signal('Today');
  readonly games = GAMES;

  setFilter(f: string) { this.activeFilter.set(f); }

  getTypeStyle(type: string) {
    return TYPE_COLORS[type] || { bg: '#F3F4F6', color: '#6B7280' };
  }

  getDiffColor(diff: string) {
    return DIFF_COLORS[diff] || '#9CA3AF';
  }

  getSpotsLeft(game: Game) {
    return game.maxPlayers - game.playersJoined;
  }

  getPercent(game: Game) {
    return Math.round((game.playersJoined / game.maxPlayers) * 100);
  }

  getProgressColor(game: Game) {
    const pct = this.getPercent(game);
    if (pct >= 90) return '#EF4444';
    if (pct >= 70) return '#F59E0B';
    return '#8CF000';
  }

  back() {
    this.router.navigateByUrl('/app/home');
  }

  viewGame(id: string) {
    this.router.navigateByUrl(`/app/ongoing/${id}`);
  }
}
