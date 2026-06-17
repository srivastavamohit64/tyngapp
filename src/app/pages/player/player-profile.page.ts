import { Component } from '@angular/core';

@Component({
  selector: 'app-player-profile',
  templateUrl: './player-profile.page.html',
  styleUrls: ['./player-shared.scss'],
  standalone: false,
})
export class PlayerProfilePage {
  user = { name: 'Rahul Sharma', avatar: '🏏', location: 'Lucknow', memberSince: 'Jan 2024', rating: 4.8, level: 12, xp: 8450, xpToNext: 10000, reliability: 95 };
  stats = [
    { label: 'Games Played', value: '127', icon: 'trophy-outline' },
    { label: 'Win Rate', value: '68%', icon: 'trending-up-outline' },
    { label: 'This Month', value: '14', icon: 'calendar-outline' },
  ];
  badges = [
    { name: 'Trusted Player', icon: 'shield-checkmark-outline', color: 'secondary' },
    { name: 'Top Scorer', icon: 'flash-outline', color: 'warning' },
    { name: 'Early Bird', icon: 'star-outline', color: 'primary' },
    { name: 'Team Captain', icon: 'ribbon-outline', color: 'warning' },
  ];
  matches = [
    { sport: 'Football', date: 'Apr 20, 2026', result: 'Won', score: '3-2' },
    { sport: 'Cricket', date: 'Apr 18, 2026', result: 'Lost', score: '145-156' },
    { sport: 'Basketball', date: 'Apr 15, 2026', result: 'Won', score: '78-65' },
  ];

  get progress() {
    return (this.user.xp / this.user.xpToNext) * 100;
  }
}
