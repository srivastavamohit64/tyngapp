import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

interface VenueBooking {
  id: number;
  name: string;
  photo: string;
  sport: string;
  court: string;
  time: string;
  amount: string;
  status: string;
  type: string;
}

interface VenueCourt {
  name: string;
  slots: boolean[];
}

interface VenueQuickAction {
  emoji: string;
  label: string;
  sub: string;
  color: string;
  path: string;
}

@Component({
  selector: 'app-venue-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  templateUrl: './venue-dashboard.page.html',
  styleUrl: './venue-dashboard.page.scss',
})
export class VenueDashboardPage implements OnInit {
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  profileDismissed = signal(false);

  readonly pulseMetrics = [
    { emoji: '🏟️', label: "Today's Bookings", value: '8', accent: '#8CF000' },
    { emoji: '💰', label: "Today's Revenue", value: '₹12,500', accent: '#FF7A00' },
    { emoji: '📈', label: 'Occupancy Rate', value: '74%', accent: '#38BDF8' },
    { emoji: '📩', label: 'Pending Requests', value: '3', accent: '#F59E0B' },
  ];

  readonly checklist = [
    { label: 'Venue Information', done: true },
    { label: 'Sports Offered', done: true },
    { label: 'Amenities', done: false },
    { label: 'Photos', done: false },
    { label: 'Pricing', done: false },
    { label: 'Verification', done: false },
  ];

  readonly quickActions: VenueQuickAction[] = [
    { emoji: '⏰', label: 'Block Time Slot', sub: 'Maintenance or closure', color: '#38BDF8', path: '/app/venue/calendar' },
    { emoji: '🎉', label: 'Create Event', sub: 'Tournament or camp', color: '#FF7A00', path: '/app/venue/calendar' },
    { emoji: '🏟️', label: 'Manage Courts', sub: 'Courts & configuration', color: '#8CF000', path: '/app/venue/facilities' },
    { emoji: '🏷️', label: 'Create Offer', sub: 'Discounts & promotions', color: '#7C3AED', path: '/app/venue/analytics' },
  ];

  readonly bookings: VenueBooking[] = [
    { id: 1, name: 'Rahul Sharma', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', sport: 'Cricket', court: 'Court 1', time: '6:00 – 8:00 AM', amount: '₹2,400', status: 'Confirmed', type: 'player' },
    { id: 2, name: 'Coach Aryan Mehta', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', sport: 'Football', court: 'Court 2', time: '4:00 – 6:00 PM', amount: '₹3,000', status: 'Confirmed', type: 'coach' },
    { id: 3, name: 'Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', sport: 'Badminton', court: 'Court 3', time: '7:00 – 8:00 PM', amount: '₹800', status: 'Pending', type: 'player' },
  ];

  readonly courts: VenueCourt[] = [
    { name: 'Court 1', slots: [true, true, true, false, false, false, false, true, true, true, true, false, false, true, true, false] },
    { name: 'Court 2', slots: [true, true, false, false, false, false, true, true, true, false, false, false, true, true, false, false] },
    { name: 'Court 3', slots: [false, false, false, true, true, false, false, false, false, true, true, true, false, false, true, true] },
  ];

  readonly coachSessions = [
    { id: 1, name: 'Coach Aryan Mehta', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', sport: 'Football', time: '4:00 PM', students: 8, court: 'Court 2' },
    { id: 2, name: 'Coach Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', sport: 'Badminton', time: '6:00 PM', students: 4, court: 'Court 3' },
  ];

  readonly activities = [
    { emoji: '✅', bg: '#F0FDF4', text: 'Booking confirmed — Rahul Sharma, Cricket, Court 1', time: '10 min ago' },
    { emoji: '💰', bg: '#F0FDF4', text: 'Payment received — ₹2,400 for cricket session', time: '12 min ago' },
    { emoji: '🤝', bg: '#EFF6FF', text: 'Coach partnership approved — Aryan Mehta', time: '1 hr ago' },
    { emoji: '❌', bg: '#FEF2F2', text: 'Booking cancelled — Kabir Malhotra, Tennis', time: '2 hrs ago' },
    { emoji: '🎉', bg: '#F5F3FF', text: 'Weekend Football Tournament created', time: 'Yesterday' },
  ];

  readonly aiTips = [
    { emoji: '📉', text: 'Court 3 occupancy is 34% below average this week. Consider creating a discount offer.' },
    { emoji: '⚽', text: 'Evening football slots are fully booked. Consider opening additional sessions.' },
    { emoji: '📷', text: 'Add more venue photos to improve your search visibility by up to 40%.' },
    { emoji: '📈', text: 'Weekend demand is increasing. Review and update your weekend pricing.' },
  ];

  readonly pendingActions = [
    { label: 'Approve Booking', sub: 'Vikram Singh — Basketball, 8 PM', urgency: 'high' },
    { label: 'Respond to Coach', sub: 'Coach Deepika — partnership request', urgency: 'medium' },
    { label: 'Confirm Partnership', sub: 'Elite Cricket Academy', urgency: 'medium' },
    { label: 'Update Weekend Pricing', sub: 'Rates outdated since last month', urgency: 'low' },
  ];

  ngOnInit() {
    if (this.auth.user()?.role !== 'venue') {
      void this.router.navigateByUrl('/app/home', { replaceUrl: true });
    }
  }

  bookedCount(court: VenueCourt): number {
    return court.slots.filter(Boolean).length;
  }

  getStatusStyle(status: string) {
    const map: Record<string, { bg: string; color: string }> = {
      Confirmed: { bg: '#F0FDF4', color: '#16A34A' },
      Pending: { bg: '#FFF7ED', color: '#C2410C' },
      Cancelled: { bg: '#FEF2F2', color: '#DC2626' },
    };
    return map[status] ?? { bg: '#F3F4F6', color: '#6B7280' };
  }

  getUrgencyColor(urgency: string): string {
    if (urgency === 'high') return '#EF4444';
    if (urgency === 'medium') return '#F59E0B';
    return '#9CA3AF';
  }

  go(path: string) {
    void this.router.navigateByUrl(path);
  }
}
