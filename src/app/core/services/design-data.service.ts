import { Injectable } from '@angular/core';
import { ChatMessage, EventGame, Player, Sport, TabItem, Venue } from '../../shared/models/app.models';

@Injectable({ providedIn: 'root' })
export class DesignDataService {
  readonly sports: Sport[] = [
    { id: 'cricket', name: 'Cricket', emoji: '🏏', players: '11v11' },
    { id: 'football', name: 'Football', emoji: '⚽', players: '11v11' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', players: '5v5' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾', players: '1v1 or 2v2' },
    { id: 'badminton', name: 'Badminton', emoji: '🏸', players: '1v1 or 2v2' },
    { id: 'volleyball', name: 'Volleyball', emoji: '🏐', players: '6v6' },
  ];

  readonly tabs: TabItem[] = [
    { label: 'Home', icon: 'home-outline', route: '/app/home' },
    { label: 'Players', icon: 'people-outline', route: '/app/discover' },
    { label: 'Venues', icon: 'business-outline', route: '/app/venues' },
    { label: 'Leaderboard', icon: 'trophy-outline', route: '/app/leaderboard' },
    { label: 'Profile', icon: 'person-outline', route: '/app/profile' },
  ];

  readonly games: EventGame[] = [
    { id: 1, sport: 'Football', time: '7:00 PM Today', location: 'Phoenix Arena', distance: '2.3 km', players: '8/11', status: 'filling' },
    { id: 2, sport: 'Cricket', time: 'Tomorrow 6:00 AM', location: 'Green Park Stadium', distance: '4.1 km', players: '18/22', status: 'almost-full' },
    { id: 3, sport: 'Basketball', time: 'Tomorrow 8:00 PM', location: 'City Sports Complex', distance: '1.8 km', players: '6/10', status: 'filling' },
  ];

  readonly players: Player[] = [
    { id: 1, name: 'Rahul Sharma', avatar: '🏏', sport: 'Cricket', skill: 'Pro', rating: 4.8, reliability: 95, distance: '1.2 km', gamesPlayed: 127, badges: ['Trusted Player', 'Top Scorer'] },
    { id: 2, name: 'Priya Singh', avatar: '⚽', sport: 'Football', skill: 'Intermediate', rating: 4.5, reliability: 88, distance: '2.5 km', gamesPlayed: 84, badges: ['Early Bird', 'Team Captain'] },
    { id: 3, name: 'Amit Kumar', avatar: '🏀', sport: 'Basketball', skill: 'Pro', rating: 4.9, reliability: 97, distance: '0.8 km', gamesPlayed: 203, badges: ['Trusted Player', 'MVP'] },
    { id: 4, name: 'Sneha Verma', avatar: '🏸', sport: 'Badminton', skill: 'Intermediate', rating: 4.6, reliability: 92, distance: '3.1 km', gamesPlayed: 56, badges: ['Reliable Captain'] },
  ];

  readonly venues: Venue[] = [
    { id: 1, name: 'BRSABV Ekana Cricket Stadium', location: 'Gomti Nagar Extension', distance: '4.5 km', price: 2500, rating: 4.8, emoji: '🏏', sports: ['Cricket'] },
    { id: 2, name: 'K.D. Singh Babu Stadium', location: 'Nehru Nagar', distance: '2.3 km', price: 1500, rating: 4.6, emoji: '⚽', sports: ['Football', 'Cricket'] },
    { id: 3, name: 'Sports Authority Complex', location: 'Gomti Nagar', distance: '3.8 km', price: 1200, rating: 4.5, emoji: '🏀', sports: ['Basketball', 'Badminton'] },
    { id: 4, name: 'Phoenix Sports Hub', location: 'Aliganj', distance: '5.2 km', price: 1800, rating: 4.7, emoji: '🎾', sports: ['Tennis', 'Badminton'] },
  ];

  readonly messages: ChatMessage[] = [
    { id: 1, type: 'system', text: 'Game confirmed for Today, 7:00 PM at Phoenix Arena', time: '10:30 AM' },
    { id: 2, sender: 'Rahul Sharma', avatar: '🏏', text: 'Hey everyone! Ready for the game tonight?', time: '11:15 AM' },
    { id: 3, sender: 'Priya Singh', avatar: '⚽', text: 'Yes! Can someone pick up the extra balls?', time: '11:18 AM' },
    { id: 4, sender: 'You', avatar: '👤', text: 'I can bring them', time: '11:20 AM', isSelf: true },
  ];
}
