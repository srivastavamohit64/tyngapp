import { Component } from '@angular/core';

@Component({
  selector: 'app-player-venues',
  templateUrl: './player-venues.page.html',
  styleUrls: ['./player-shared.scss'],
  standalone: false,
})
export class PlayerVenuesPage {
  venues = [
    { name: 'BRSABV Ekana Cricket Stadium', location: 'Gomti Nagar Extension', distance: '4.5 km', price: 2500, rating: 4.8, emoji: '🏏', sports: ['Cricket'] },
    { name: 'K.D. Singh Babu Stadium', location: 'Nehru Nagar', distance: '2.3 km', price: 1500, rating: 4.6, emoji: '⚽', sports: ['Football', 'Cricket'] },
    { name: 'Sports Authority Complex', location: 'Gomti Nagar', distance: '3.8 km', price: 1200, rating: 4.5, emoji: '🏀', sports: ['Basketball', 'Badminton'] },
    { name: 'Phoenix Sports Hub', location: 'Aliganj', distance: '5.2 km', price: 1800, rating: 4.7, emoji: '🎾', sports: ['Tennis', 'Badminton'] },
  ];
}
