import { Component } from '@angular/core';

@Component({
  selector: 'app-player-discover',
  templateUrl: './player-discover.page.html',
  styleUrls: ['./player-shared.scss'],
  standalone: false,
})
export class PlayerDiscoverPage {
  selectedSkill = 'all';
  skills = ['all', 'beginner', 'intermediate', 'pro'];
  players = [
    { name: 'Rahul Sharma', avatar: '🏏', sport: 'Cricket', skill: 'Pro', rating: 4.8, reliability: 95, distance: '1.2 km', games: 127 },
    { name: 'Priya Singh', avatar: '⚽', sport: 'Football', skill: 'Intermediate', rating: 4.5, reliability: 88, distance: '2.5 km', games: 84 },
    { name: 'Amit Kumar', avatar: '🏀', sport: 'Basketball', skill: 'Pro', rating: 4.9, reliability: 97, distance: '0.8 km', games: 203 },
    { name: 'Sneha Verma', avatar: '🏸', sport: 'Badminton', skill: 'Intermediate', rating: 4.6, reliability: 92, distance: '3.1 km', games: 56 },
  ];
}
