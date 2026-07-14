import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { AuthService } from '../../core/services/auth.service';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { SearchBarComponent } from '../../shared/components/search-bar/search-bar.component';
import { SectionHeaderComponent } from '../../shared/components/section-header/section-header.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EventCardComponent,
    BrandHeaderShellComponent,
    SearchBarComponent,
    SectionHeaderComponent,
  ],
  styleUrls: ['./home.page.scss'],
  templateUrl: './home.page.html',
})
export class HomePage {
  readonly data = inject(DesignDataService);
  readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly menu = inject(MenuController);

  readonly notificationRoute = computed(() =>
    this.auth.user()?.role === 'coach' ? '/app/coach/notifications' : '/app/notifications'
  );

  searchQuery = '';

  // General state
  greeting = '';

  // Coach Dashboard state
  coachProfileDismissed = signal(false);
  readonly coachPulseMetrics = [
    { icon: '📅', label: "Today's Sessions", value: '4', accent: '#8CF000' },
    { icon: '💰', label: 'Expected Earnings', value: '₹4,250', accent: '#FF7A00' },
    { icon: '⭐', label: 'New Reviews', value: '3', accent: '#F59E0B' },
    { icon: '👥', label: 'Booking Requests', value: '5', accent: '#38BDF8' },
  ];
  readonly coachSessions = [
    { id: 1, sport: 'Cricket', emoji: '🏏', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=300&fit=crop&auto=format', title: 'Elite Cricket Academy', team: 'Advanced Batch · 12 Students', venue: 'Phoenix Arena', time: '6:00 PM', type: 'Training', status: 'upcoming', startsIn: 'Starts in 45 min' },
    { id: 2, sport: 'Football', emoji: '⚽', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=300&fit=crop&auto=format', title: 'Football Skills Workshop', team: 'Junior Squad · 8 Students', venue: 'K.D. Singh Stadium', time: '7:30 PM', type: 'Skills', status: 'upcoming', startsIn: 'Starts in 2h 15m' },
    { id: 3, sport: 'Badminton', emoji: '🏸', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=300&fit=crop&auto=format', title: 'Individual Coaching', team: 'Priya Verma · 1 Student', venue: 'Sports Complex', time: '4:00 PM', type: 'One-on-One', status: 'completed', startsIn: null },
  ];
  readonly coachQuickActions = [
    { icon: 'add-outline', label: 'New Session', sub: 'Schedule a slot', color: '#8CF000', path: '/app/coach/create-session' },
    { icon: 'calendar-outline', label: 'Manage Schedule', sub: 'View your calendar', color: '#FF7A00', path: '/app/coach/schedule' },
    { icon: 'person-add-outline', label: 'Add Student', sub: 'Onboard a new player', color: '#38BDF8', path: '/app/coach/enroll-student' },
    { icon: 'analytics-outline', label: 'Evaluate Player', sub: 'Track progress', color: '#7C3AED', path: '/app/coach/evaluate' },
  ];
  readonly coachActivities = [
    { id: 1, icon: '✓', bg: '#F0FDF4', color: '#16A34A', text: 'Rahul completed Session #18', time: '20 min ago' },
    { id: 2, icon: '⭐', bg: '#FFFBEB', color: '#D97706', text: 'You received a 5-Star Review from Ananya', time: '1 hr ago' },
    { id: 3, icon: '🏆', bg: '#F5F3FF', color: '#7C3AED', text: 'Aarav won District Badminton Championship', time: '3 hrs ago' },
    { id: 4, icon: '💰', bg: '#F0FDF4', color: '#16A34A', text: '₹1,200 Payment Received', time: '5 hrs ago' },
    { id: 5, icon: '📅', bg: '#EFF6FF', color: '#3B82F6', text: 'Session Rescheduled — Priya moved to 7 PM', time: 'Yesterday' },
  ];
  readonly coachVenues = [
    { id: 1, name: 'Ekana Cricket Stadium', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=200&fit=crop&auto=format', distance: '2.1 km', slots: 3 },
    { id: 2, name: 'Phoenix Sports Hub', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=200&fit=crop&auto=format', distance: '3.8 km', slots: 5 },
    { id: 3, name: 'Sports Authority Complex', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&auto=format', distance: '4.5 km', slots: 2 },
  ];
  readonly coachCommunity = [
    { id: 1, title: 'Coach Workshop', sub: 'This Saturday · 4 PM', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=160&fit=crop&auto=format', tag: 'Workshop' },
    { id: 2, title: 'NIS Certification', sub: 'Registrations Open', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=300&h=160&fit=crop&auto=format', tag: 'Certification' },
    { id: 3, title: 'Sports Seminar', sub: 'Next Wed · Online', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=160&fit=crop&auto=format', tag: 'Seminar' },
  ];
  readonly coachReviews = [
    { name: 'Ananya Patel', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format', rating: 5, text: 'Excellent coaching session. My cricket technique improved dramatically in just 3 weeks.' },
    { name: 'Rahul Sharma', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', rating: 5, text: 'My batting improved significantly after just 5 sessions. Highly recommended!' },
  ];

  // Venue Dashboard state
  venueProfileDismissed = signal(false);
  readonly venuePulseMetrics = [
    { icon: '🏟️', label: "Today's Bookings", value: '8', accent: '#8CF000' },
    { icon: '💰', label: "Today's Revenue", value: '₹12,500', accent: '#FF7A00' },
    { icon: '📈', label: 'Occupancy Rate', value: '74%', accent: '#38BDF8' },
    { icon: '📩', label: 'Pending Requests', value: '3', accent: '#F59E0B' },
  ];
  readonly venueBookings = [
    { id: 1, name: 'Rahul Sharma', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', sport: 'Cricket', court: 'Court 1', time: '6:00 – 8:00 AM', amount: '₹2,400', status: 'Confirmed', type: 'player' },
    { id: 2, name: 'Coach Aryan Mehta', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', sport: 'Football', court: 'Court 2', time: '4:00 – 6:00 PM', amount: '₹3,000', status: 'Confirmed', type: 'coach' },
    { id: 3, name: 'Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', sport: 'Badminton', court: 'Court 3', time: '7:00 – 8:00 PM', amount: '₹800', status: 'Pending', type: 'player' },
  ];
  readonly venueCourts = [
    { name: 'Court 1', bookedCount: 8, totalCount: 16, slots: [true, true, true, false, false, false, false, true, true, true, true, false, false, true, true, false] },
    { name: 'Court 2', bookedCount: 6, totalCount: 16, slots: [true, true, false, false, false, false, true, true, true, false, false, false, true, true, false, false] },
    { name: 'Court 3', bookedCount: 7, totalCount: 16, slots: [false, false, false, true, true, false, false, false, false, true, true, true, false, false, true, true] },
  ];
  readonly slotHours = ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'];
  readonly venueCoachSessions = [
    { id: 1, name: 'Coach Aryan Mehta', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', sport: 'Football', time: '4:00 PM', students: 8, court: 'Court 2' },
    { id: 2, name: 'Coach Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', sport: 'Badminton', time: '6:00 PM', students: 4, court: 'Court 3' },
  ];
  readonly venueActivities = [
    { emoji: '✅', bg: '#F0FDF4', color: '#16A34A', text: 'Booking confirmed — Rahul Sharma, Cricket, Court 1', time: '10 min ago' },
    { emoji: '💰', bg: '#F0FDF4', color: '#16A34A', text: 'Payment received — ₹2,400 for cricket session', time: '12 min ago' },
    { emoji: '🤝', bg: '#EFF6FF', color: '#3B82F6', text: 'Coach partnership approved — Aryan Mehta', time: '1 hr ago' },
    { emoji: '❌', bg: '#FEF2F2', color: '#EF4444', text: 'Booking cancelled — Kabir Malhotra, Tennis', time: '2 hrs ago' },
    { emoji: '🎉', bg: '#F5F3FF', color: '#7C3AED', text: 'Weekend Football Tournament created', time: 'Yesterday' },
  ];
  readonly venueAiTips = [
    { emoji: '📉', text: 'Court 3 occupancy is 34% below average this week. Consider creating a discount offer.' },
    { emoji: '⚽', text: 'Evening football slots are fully booked. Consider opening additional sessions.' },
    { emoji: '📷', text: 'Add more venue photos to improve your search visibility by up to 40%.' },
    { emoji: '📈', text: 'Weekend demand is increasing. Review and update your weekend pricing.' },
  ];
  readonly venuePendingActions = [
    { label: 'Approve Booking', sub: 'Vikram Singh — Basketball, 8 PM', urgency: 'high' },
    { label: 'Respond to Coach', sub: 'Coach Deepika — partnership request', urgency: 'medium' },
    { label: 'Confirm Partnership', sub: 'Elite Cricket Academy', urgency: 'medium' },
    { label: 'Update Weekend Pricing', sub: 'Rates outdated since last month', urgency: 'low' },
  ];
  readonly venueChecklist = [
    { label: 'Venue Information', done: true },
    { label: 'Sports Offered', done: true },
    { label: 'Amenities', done: false },
    { label: 'Photos', done: false },
    { label: 'Pricing', done: false },
    { label: 'Verification', done: false },
  ];

  constructor() {
    const hour = new Date().getHours();
    this.greeting = hour < 12 ? 'Good Morning ☀️' : hour < 17 ? 'Good Afternoon 🌤️' : hour < 21 ? 'Good Evening 🌇' : 'Good Night 🌙';
    const role = this.auth.user()?.role;
    if (role === 'admin') {
      void this.router.navigateByUrl('/app/admin/dashboard', { replaceUrl: true });
    } else if (role === 'venue') {
      void this.router.navigateByUrl('/app/venue/dashboard', { replaceUrl: true });
    }
  }

  async openMenu() {
    await this.menu.open();
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  getStatusStyle(status: string) {
    if (status === 'upcoming') return { bg: '#FFF7ED', color: '#C2410C' };
    if (status === 'completed') return { bg: '#F3F4F6', color: '#6B7280' };
    if (status === 'Confirmed') return { bg: '#F0FDF4', color: '#16A34A' };
    if (status === 'Pending') return { bg: '#FFF7ED', color: '#C2410C' };
    return { bg: '#F3F4F6', color: '#6B7280' };
  }

  getUrgencyColor(urgency: string) {
    if (urgency === 'high') return '#EF4444';
    if (urgency === 'medium') return '#F59E0B';
    return '#9CA3AF';
  }
}
