import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-game',
  templateUrl: './create-game.page.html',
  styleUrls: ['./player-shared.scss', './create-game.page.scss'],
  standalone: false,
})
export class CreateGamePage {
  currentStep = 1;
  steps = [
    { id: 1, name: 'Sport', icon: 'trophy-outline' },
    { id: 2, name: 'Venue', icon: 'location-outline' },
    { id: 3, name: 'Date', icon: 'calendar-outline' },
    { id: 4, name: 'Team', icon: 'people-outline' },
    { id: 5, name: 'Confirm', icon: 'checkmark-circle-outline' },
  ];
  selectedSport = '';
  selectedVenue = '';
  selectedDate = '';
  selectedTime = '';
  selectedTeamSize = '';

  sports = [
    { id: 'cricket', name: 'Cricket', emoji: '🏏', players: '11v11' },
    { id: 'football', name: 'Football', emoji: '⚽', players: '11v11' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', players: '5v5' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾', players: '1v1 or 2v2' },
    { id: 'badminton', name: 'Badminton', emoji: '🏸', players: '1v1 or 2v2' },
    { id: 'volleyball', name: 'Volleyball', emoji: '🏐', players: '6v6' },
  ];
  venues = [
    { id: '1', name: 'BRSABV Ekana Cricket Stadium', location: 'Gomti Nagar Extension', distance: '4.5 km', price: 2500 },
    { id: '2', name: 'K.D. Singh Babu Stadium', location: 'Nehru Nagar', distance: '2.3 km', price: 1500 },
    { id: '3', name: 'Sports Authority Complex', location: 'Gomti Nagar', distance: '3.8 km', price: 1200 },
  ];
  dates = ['Today', 'Tomorrow', 'Fri', 'Sat', 'Sun'];
  times = ['6:00 AM', '7:00 AM', '6:00 PM', '7:00 PM', '8:00 PM'];
  teamSizes = ['5v5', '7v7', '11v11', 'Custom'];

  constructor(private router: Router) {}

  get activeStepName() {
    return this.steps[this.currentStep - 1]?.name;
  }

  back() {
    if (this.currentStep === 1) {
      this.router.navigateByUrl('/app/player/home');
      return;
    }
    this.currentStep--;
  }

  next() {
    if (this.currentStep < this.steps.length && this.canProceed()) {
      this.currentStep++;
    } else if (this.currentStep === this.steps.length) {
      this.router.navigateByUrl('/app/player/home');
    }
  }

  canProceed() {
    if (this.currentStep === 1) return !!this.selectedSport;
    if (this.currentStep === 2) return !!this.selectedVenue;
    if (this.currentStep === 3) return !!this.selectedDate && !!this.selectedTime;
    if (this.currentStep === 4) return !!this.selectedTeamSize;
    return true;
  }

  selectSport(id: string) {
    this.selectedSport = id;
    setTimeout(() => this.next(), 200);
  }
}
