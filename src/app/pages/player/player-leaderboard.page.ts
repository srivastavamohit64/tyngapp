import { Component } from '@angular/core';

@Component({
  selector: 'app-player-leaderboard',
  templateUrl: './player-leaderboard.page.html',
  styleUrls: ['./player-shared.scss'],
  standalone: false,
})
export class PlayerLeaderboardPage {
  selectedSport = 'all';
  sports = ['all', 'football', 'cricket', 'basketball', 'badminton'];
  players = [
    { rank: 1, name: 'Amit Kumar', avatar: '🏀', points: 9850, games: 203, wins: 72, badge: 'Champion' },
    { rank: 2, name: 'Rahul Sharma', avatar: '🏏', points: 8450, games: 127, wins: 68, badge: 'Pro' },
    { rank: 3, name: 'Priya Singh', avatar: '⚽', points: 7920, games: 145, wins: 65, badge: 'Elite' },
    { rank: 4, name: 'Sneha Verma', avatar: '🏸', points: 7450, games: 112, wins: 71, badge: 'Expert' },
    { rank: 5, name: 'Vikram Patel', avatar: '⚡', points: 7100, games: 98, wins: 69, badge: 'Expert' },
  ];
}
