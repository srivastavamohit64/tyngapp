import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { IonicModule, MenuController } from '@ionic/angular';
import { XpLeaderboard, XpService } from '../../core/services/xp.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { SportTab, SportTabsComponent } from '../../shared/components/sport-tabs/sport-tabs.component';

interface LeaderboardPlayer {
  rank: number;
  name: string;
  avatar: string;
  points: number;
  gamesPlayed: number;
  winRate: number;
  badge: string;
  sport: string;
}

@Component({
  selector: 'app-leaderboard-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, SportTabsComponent],
  styleUrls: ['./leaderboard.page.scss'],
  templateUrl: './leaderboard.page.html',
})
export class LeaderboardPage implements OnInit {
  private readonly menu = inject(MenuController);
  private readonly xp = inject(XpService);
  selectedSport = 'all';
  selectedPeriod: 'all_time' | 'week' | 'month' | 'season' = 'all_time';
  readonly me = signal<XpLeaderboard['me'] | null>(null);

  async openMenu() {
    await this.menu.open();
  }

  readonly sports = ['all', 'football', 'cricket', 'basketball', 'badminton'];

  readonly sportTabs: SportTab[] = this.sports.map((s) => ({
    id: s,
    label: s.charAt(0).toUpperCase() + s.slice(1),
  }));

  leaderboard: LeaderboardPlayer[] = [];

  ngOnInit(): void {
    this.reload();
  }

  get filteredLeaderboard(): LeaderboardPlayer[] {
    return this.leaderboard;
  }

  get topThree(): LeaderboardPlayer[] {
    return this.filteredLeaderboard.slice(0, 3);
  }

  get listPlayers(): LeaderboardPlayer[] {
    return this.filteredLeaderboard.slice(3);
  }

  selectSport(sport: string) {
    this.selectedSport = sport;
    this.reload();
  }

  private reload(): void {
    this.xp.leaderboard(this.selectedPeriod, this.selectedSport).subscribe((board) => {
      if (!board) {
        this.leaderboard = [];
        this.me.set(null);
        return;
      }
      this.me.set(board.me);
      this.leaderboard = board.items.map((row) => ({
        rank: row.rank,
        name: row.name,
        avatar: '⚡',
        points: row.xp,
        gamesPlayed: row.gamesPlayed,
        winRate: 0,
        badge: row.levelTitle || `L${row.level}`,
        sport: this.selectedSport,
      }));
    });
  }
}
