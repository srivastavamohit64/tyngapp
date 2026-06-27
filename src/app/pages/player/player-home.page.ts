import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-player-home',
  templateUrl: './player-home.page.html',
  styleUrls: ['./player-shared.scss', './player-home.page.scss'],
  standalone: false,
})
export class PlayerHomePage {
  upcomingGames = [
    { id: 1, sport: 'Football', time: '7:00 PM Today', location: 'Phoenix Arena', distance: '2.3 km', players: '8/11', status: 'filling' },
    { id: 2, sport: 'Cricket', time: 'Tomorrow 6:00 AM', location: 'Green Park Stadium', distance: '4.1 km', players: '18/22', status: 'almost-full' },
    { id: 3, sport: 'Basketball', time: 'Tomorrow 8:00 PM', location: 'City Sports Complex', distance: '1.8 km', players: '6/10', status: 'filling' },
  ];

  constructor(private router: Router) {}

  go(path: string) {
    this.router.navigateByUrl(path);
  }
}
