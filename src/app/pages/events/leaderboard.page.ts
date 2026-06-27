import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';

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
  imports: [CommonModule, IonicModule],
  styleUrls: ['./leaderboard.page.scss'],
  templateUrl: './leaderboard.page.html',
})
export class LeaderboardPage {
  selectedSport = 'all';

  readonly sports = ['all', 'football', 'cricket', 'basketball', 'badminton'];

  readonly leaderboard: LeaderboardPlayer[] = [
    {
      rank: 1,
      name: 'Amit Kumar',
      avatar: '🏀',
      points: 9850,
      gamesPlayed: 203,
      winRate: 72,
      badge: 'Champion',
      sport: 'basketball',
    },
    {
      rank: 2,
      name: 'Rahul Sharma',
      avatar: '🏏',
      points: 8450,
      gamesPlayed: 127,
      winRate: 68,
      badge: 'Pro',
      sport: 'cricket',
    },
    {
      rank: 3,
      name: 'Priya Singh',
      avatar: '⚽',
      points: 7920,
      gamesPlayed: 145,
      winRate: 65,
      badge: 'Elite',
      sport: 'football',
    },
    {
      rank: 4,
      name: 'Sneha Verma',
      avatar: '🏸',
      points: 7450,
      gamesPlayed: 112,
      winRate: 71,
      badge: 'Expert',
      sport: 'badminton',
    },
    {
      rank: 5,
      name: 'Vikram Patel',
      avatar: '⚡',
      points: 7100,
      gamesPlayed: 98,
      winRate: 69,
      badge: 'Expert',
      sport: 'cricket',
    },
    {
      rank: 6,
      name: 'Anjali Gupta',
      avatar: '🎯',
      points: 6850,
      gamesPlayed: 89,
      winRate: 64,
      badge: 'Advanced',
      sport: 'football',
    },
    {
      rank: 7,
      name: 'Karan Mehta',
      avatar: '🏆',
      points: 6500,
      gamesPlayed: 76,
      winRate: 67,
      badge: 'Advanced',
      sport: 'badminton',
    },
  ];

  get filteredLeaderboard(): LeaderboardPlayer[] {
    if (this.selectedSport === 'all') {
      return this.leaderboard;
    }
    const filtered = this.leaderboard.filter((player) => player.sport === this.selectedSport);
    // Recalculate rank positions dynamically based on filtered points
    return filtered
      .sort((a, b) => b.points - a.points)
      .map((player, idx) => ({
        ...player,
        rank: idx + 1,
      }));
  }

  get topThree(): LeaderboardPlayer[] {
    return this.filteredLeaderboard.slice(0, 3);
  }

  get listPlayers(): LeaderboardPlayer[] {
    return this.filteredLeaderboard.slice(3);
  }

  selectSport(sport: string) {
    this.selectedSport = sport;
  }
}
