import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  styleUrls: ['./profile.page.scss'],
  templateUrl: './profile.page.html',
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  private readonly menu = inject(MenuController);

  async openMenu() {
    await this.menu.open();
  }

  readonly stats = [
    { label: 'Games Played', value: '48', icon: 'disc-outline' },
    { label: 'Reliability', value: '95%', icon: 'shield-checkmark-outline' },
    { label: 'Win Rate', value: '62%', icon: 'trophy-outline' },
  ];

  readonly badges = [
    { name: 'Early Bird', icon: 'sunny-outline', color: 'text-amber-500' },
    { name: 'Team Player', icon: 'people-outline', color: 'text-primary' },
    { name: 'MVP', icon: 'ribbon-outline', color: 'text-accent' },
    { name: 'Streak Starter', icon: 'flame-outline', color: 'text-orange-500' },
  ];

  readonly recentMatches = [
    { sport: 'Cricket', date: 'Yesterday', result: 'Won', score: '142 vs 110' },
    { sport: 'Football', date: 'Apr 18, 2024', result: 'Lost', score: '3 - 4' },
    { sport: 'Cricket', date: 'Apr 12, 2024', result: 'Won', score: '88/2 vs 84/10' },
  ];

  readonly coachAchievements = [
    { name: 'Elite Coach', icon: 'star-outline', color: '#FF7A00' },
    { name: 'Team Builder', icon: 'people-outline', color: '#8CF000' },
    { name: 'Season Winner', icon: 'trophy-outline', color: '#FF7A00' },
    { name: 'Development Expert', icon: 'ribbon-outline', color: '#2563EB' },
  ];

  readonly coachRecentSessions = [
    { team: 'Elite Football Squad', date: 'Apr 20, 2026', type: 'Training' },
    { team: 'Junior Cricket Team', date: 'Apr 18, 2026', type: 'Match Prep' },
    { team: 'Basketball Academy', date: 'Apr 15, 2026', type: 'Scrimmage' },
  ];

  // Venue-specific items
  readonly venueProfileStats = [
    { label: 'Bookings Today', value: '8', icon: 'calendar-outline' },
    { label: 'Revenue Today', value: '₹12,500', icon: 'cash-outline' },
    { label: 'Active Facilities', value: '3/4', icon: 'business-outline' },
  ];

  readonly operatingHours = [
    { day: 'Monday - Friday', hours: '6:00 AM - 10:00 PM' },
    { day: 'Saturday - Sunday', hours: '5:00 AM - 11:00 PM' },
  ];

  readonly recentReviews = [
    { customer: 'Arjun Sharma', rating: '5.0', comment: 'Excellent turf, very well maintained. The lights are great for night matches.', date: '2 days ago' },
    { customer: 'Priya Verma', rating: '4.5', comment: 'Good amenities and parking space. Highly recommended.', date: '1 week ago' },
  ];

  getSpecialty(): string {
    return 'Head Coach • Football & Cricket';
  }

  getExperienceLabel(): string {
    return '8+ Years';
  }

  getCertificationLabel(): string {
    return 'A-License Certified';
  }

  onStatClick(label: string) {
    if (label === 'Bookings Today') {
      this.router.navigateByUrl('/app/venue/bookings');
    } else if (label === 'Active Facilities') {
      this.router.navigateByUrl('/app/venue/facilities');
    }
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
