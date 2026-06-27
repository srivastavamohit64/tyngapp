import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-venue-calendar-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./calendar.page.scss'],
  templateUrl: './calendar.page.html',
})
export class VenueCalendarPage {
  private readonly router = inject(Router);

  readonly courts = ['Court 1', 'Court 2', 'Main Ground'];

  readonly timeSlots = [
    '6:00 AM',
    '8:00 AM',
    '10:00 AM',
    '12:00 PM',
    '2:00 PM',
    '4:00 PM',
    '6:00 PM',
    '8:00 PM',
  ];

  readonly bookings: Record<string, Array<{ time: string; duration: number; customer: string }>> = {
    'Court 1': [
      { time: '6:00 AM', duration: 2, customer: 'Rahul' },
      { time: '6:00 PM', duration: 1, customer: 'Priya' },
    ],
    'Court 2': [
      { time: '4:00 PM', duration: 2, customer: 'Elite Squad' }
    ],
    'Main Ground': [
      { time: '8:00 PM', duration: 2, customer: 'Cricket Team' }
    ],
  };

  getBooking(court: string, time: string) {
    return this.bookings[court]?.find((b) => b.time === time) || null;
  }

  goHome() {
    this.router.navigateByUrl('/app/home');
  }
}
