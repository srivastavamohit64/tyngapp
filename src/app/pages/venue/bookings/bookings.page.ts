import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-venue-bookings-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  styleUrls: ['./bookings.page.scss'],
  templateUrl: './bookings.page.html',
})
export class VenueBookingsPage {
  private readonly router = inject(Router);

  searchQuery = '';
  selectedFilter = 'all';

  readonly filters = ['all', 'confirmed', 'pending'];

  bookings = [
    {
      id: 1,
      date: 'Today',
      time: '4:00 PM - 6:00 PM',
      customer: 'Rahul Sharma',
      court: 'Court 2',
      status: 'confirmed',
      amount: '₹2,000',
      deposit: '₹500',
    },
    {
      id: 2,
      date: 'Today',
      time: '7:00 PM - 9:00 PM',
      customer: 'Junior Cricket Team',
      court: 'Main Ground',
      status: 'pending',
      amount: '₹3,500',
      deposit: '₹1,000',
    },
    {
      id: 3,
      date: 'Tomorrow',
      time: '6:00 AM - 8:00 AM',
      customer: 'Elite Football Squad',
      court: 'Main Ground',
      status: 'confirmed',
      amount: '₹3,000',
      deposit: '₹1,000',
    },
    {
      id: 4,
      date: 'Tomorrow',
      time: '6:00 PM - 7:00 PM',
      customer: 'Priya Singh',
      court: 'Court 1',
      status: 'pending',
      amount: '₹1,500',
      deposit: '₹400',
    },
  ];

  get filteredBookings() {
    return this.bookings.filter((booking) => {
      const matchesSearch =
        booking.customer.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        booking.court.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesFilter =
        this.selectedFilter === 'all' || booking.status === this.selectedFilter;
      return matchesSearch && matchesFilter;
    });
  }

  acceptBooking(id: number) {
    const booking = this.bookings.find((b) => b.id === id);
    if (booking) {
      booking.status = 'confirmed';
    }
  }

  declineBooking(id: number) {
    this.bookings = this.bookings.filter((b) => b.id !== id);
  }

  goHome() {
    this.router.navigateByUrl('/app/home');
  }
}
