import { Component } from '@angular/core';
import { Router } from '@angular/router';

type MarkerType = 'all' | 'games' | 'players' | 'venues';

@Component({
  selector: 'app-live-map',
  templateUrl: './live-map.page.html',
  styleUrls: ['./player-shared.scss', './live-map.page.scss'],
  standalone: false,
})
export class LiveMapPage {
  activeFilter: MarkerType = 'all';
  markers = [
    { type: 'games', x: 42, y: 35, emoji: '⚽', title: 'K.D. Singh Babu Stadium', subtitle: 'Live Now · 10/11', color: '#2563EB' },
    { type: 'games', x: 68, y: 25, emoji: '🏏', title: 'Ekana Cricket Stadium', subtitle: 'Starting Soon · 18/22', color: '#22C55E' },
    { type: 'players', x: 48, y: 45, emoji: '8', title: 'Hazratganj Area', subtitle: '8 players available', color: '#38BDF8' },
    { type: 'venues', x: 25, y: 40, emoji: '🏟️', title: 'Phoenix Sports Hub', subtitle: '85% occupied', color: '#7C3AED' },
  ];
  selected = this.markers[0];

  constructor(private router: Router) {}

  back() {
    this.router.navigateByUrl('/app/player/home');
  }

  get filteredMarkers() {
    return this.activeFilter === 'all' ? this.markers : this.markers.filter((m) => m.type === this.activeFilter);
  }
}
