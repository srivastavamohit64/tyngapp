import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { AuthService } from '../../core/services/auth.service';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';
import { SearchComponent } from '../../shared/components/search/search.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, IonicModule, EventCardComponent, SearchComponent],
  styleUrls: ['./home.page.scss'],
  templateUrl: './home.page.html',
})
export class HomePage {
  readonly data = inject(DesignDataService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly menu = inject(MenuController);

  async openMenu() {
    await this.menu.open();
  }

  readonly upcomingSessions = [
    { id: 1, team: 'Elite Football Squad', time: 'Today, 4:00 PM', venue: 'Phoenix Arena', attendees: '10/11', type: 'Training' },
    { id: 2, team: 'Junior Cricket Team', time: 'Tomorrow, 6:00 AM', venue: 'Green Park Stadium', attendees: '18/22', type: 'Match Prep' },
    { id: 3, team: 'Basketball Academy', time: 'Tomorrow, 5:00 PM', venue: 'City Sports Complex', attendees: '8/10', type: 'Scrimmage' },
  ];

  readonly recentActivity = [
    { player: 'Rahul Sharma', action: 'Completed skill assessment', time: '2h ago' },
    { player: 'Priya Singh', action: 'Joined Elite Football Squad', time: '4h ago' },
    { player: 'Amit Kumar', action: 'Achievement unlocked: MVP', time: '6h ago' },
  ];

  readonly venueStats = [
    { label: "Today's Bookings", value: 8, icon: 'calendar-outline', color: 'text-primary' },
    { label: "Today's Revenue", value: '₹12,500', icon: 'cash-outline', color: 'text-secondary' },
    { label: 'Occupancy', value: '75%', icon: 'trending-up-outline', color: 'text-accent' },
  ];

  todayBookings = [
    { id: 1, time: '6:00 AM - 7:00 AM', customer: 'Elite Football Squad', court: 'Court 1', status: 'completed', amount: '₹1,200' },
    { id: 2, time: '4:00 PM - 6:00 PM', customer: 'Rahul Sharma', court: 'Court 2', status: 'confirmed', amount: '₹2,000' },
    { id: 3, time: '7:00 PM - 9:00 PM', customer: 'Junior Cricket Team', court: 'Main Ground', status: 'pending', amount: '₹3,500' },
  ];

  pendingRequests = [
    { id: 1, customer: 'Priya Singh', time: 'Tomorrow 6:00 PM', court: 'Court 1' },
    { id: 2, customer: 'Basketball Academy', time: 'Apr 25, 5:00 PM', court: 'Main Ground' },
  ];

  acceptRequest(id: number) {
    this.pendingRequests = this.pendingRequests.filter((r) => r.id !== id);
  }

  declineRequest(id: number) {
    this.pendingRequests = this.pendingRequests.filter((r) => r.id !== id);
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }
}
