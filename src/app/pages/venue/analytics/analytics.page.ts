import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-venue-analytics-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./analytics.page.scss'],
  templateUrl: './analytics.page.html',
})
export class VenueAnalyticsPage {
  private readonly router = inject(Router);

  readonly stats = [
    { label: 'Today', value: '₹12,500', change: '+12%', icon: 'cash-outline' },
    { label: 'This Week', value: '₹68,000', change: '+8%', icon: 'calendar-outline' },
    { label: 'This Month', value: '₹2,45,000', change: '+15%', icon: 'trending-up-outline' },
  ];

  readonly topCustomers = [
    { name: 'Elite Football Squad', bookings: 24, revenue: '₹48,000' },
    { name: 'Junior Cricket Team', bookings: 18, revenue: '₹36,000' },
    { name: 'Basketball Academy', bookings: 15, revenue: '₹30,000' },
  ];

  readonly peakHours = [
    { time: '6:00 PM - 8:00 PM', bookings: 45, percentage: 85 },
    { time: '4:00 PM - 6:00 PM', bookings: 38, percentage: 70 },
    { time: '6:00 AM - 8:00 AM', bookings: 32, percentage: 60 },
  ];

  goHome() {
    this.router.navigateByUrl('/app/home');
  }
}
