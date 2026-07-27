import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { VenueDashboardData, VenueService } from '../../core/services/venue.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

interface VenueBooking {
  id: string | number;
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

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&auto=format';

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
  private readonly venueService = inject(VenueService);

  profileDismissed = signal(false);
  loading = signal(true);
  errorMessage = signal('');

  pulseMetrics = [
    { emoji: '🏟️', label: "Today's Bookings", value: '0', accent: 'var(--app-primary)' },
    { emoji: '💰', label: "Today's Revenue", value: '₹0', accent: '#FF7A00' },
    { emoji: '📈', label: 'Occupancy Rate', value: '0%', accent: '#38BDF8' },
    { emoji: '📩', label: 'Pending Requests', value: '0', accent: '#F59E0B' },
  ];

  checklist: { id?: string; label: string; done: boolean }[] = [];
  completionPercent = 0;
  revenueGoalPct = 0;

  readonly quickActions: VenueQuickAction[] = [
    { emoji: '⏰', label: 'Block Time Slot', sub: 'Maintenance or closure', color: '#38BDF8', path: '/app/venue/calendar' },
    { emoji: '🎉', label: 'Create Event', sub: 'Tournament or camp', color: '#FF7A00', path: '/app/venue/calendar' },
    { emoji: '🏟️', label: 'Manage Courts', sub: 'Courts & configuration', color: 'var(--app-primary)', path: '/app/venue/facilities' },
    { emoji: '🏷️', label: 'Create Offer', sub: 'Discounts & promotions', color: '#7C3AED', path: '/app/venue/analytics' },
  ];

  bookings: VenueBooking[] = [];
  courts: VenueCourt[] = [];
  coachSessions: { id: string | number; name: string; photo: string; sport: string; time: string; students: number; court: string }[] = [];
  activities: { emoji: string; bg: string; text: string; time: string }[] = [];
  aiTips: { emoji: string; text: string }[] = [];
  pendingActions: { label: string; sub: string; urgency: string }[] = [];
  bookingBlockMessage = signal<string | null>(null);

  async ngOnInit() {
    if (this.auth.user()?.role !== 'venue') {
      void this.router.navigateByUrl('/app/home', { replaceUrl: true });
      return;
    }

    try {
      await firstValueFrom(this.auth.fetchMe());
    } catch {
      // Keep cached user if /me fails.
    }

    // Do not hard-redirect on venueProfileReady=false — older APIs still
    // flag optional Amenities/Verification. Dashboard shows a completion card instead.
    await this.loadDashboard();
  }

  async loadDashboard() {
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const response = await firstValueFrom(this.venueService.getDashboard());
      if (!response.success || !response.data) {
        this.errorMessage.set(response.message || 'Unable to load dashboard.');
        return;
      }
      this.applyDashboard(response.data);

      if (!response.data.completion?.ready) {
        // Soft gate: keep dashboard visible but force completion card open.
        this.profileDismissed.set(false);
      }
    } catch (error: any) {
      this.errorMessage.set(error?.error?.message || 'Unable to load dashboard.');
    } finally {
      this.loading.set(false);
    }
  }

  private applyDashboard(data: VenueDashboardData) {
    this.pulseMetrics = [
      { emoji: '🏟️', label: "Today's Bookings", value: String(data.pulse.todayBookings || 0), accent: 'var(--app-primary)' },
      { emoji: '💰', label: "Today's Revenue", value: `₹${Number(data.pulse.todayRevenue || 0).toLocaleString('en-IN')}`, accent: '#FF7A00' },
      { emoji: '📈', label: 'Occupancy Rate', value: `${data.pulse.occupancyRate || 0}%`, accent: '#38BDF8' },
      { emoji: '📩', label: 'Pending Requests', value: String(data.pulse.pendingRequests || 0), accent: '#F59E0B' },
    ];
    this.revenueGoalPct = data.pulse.revenueGoalPct || 0;
    this.completionPercent = data.completion?.percent || 0;
    this.checklist = (data.completion?.checklist || [])
      .filter((item) => String(item.id || item.label || '').toLowerCase() !== 'amenities'
        && String(item.label || '').toLowerCase() !== 'amenities')
      .map((item) => ({
        id: item.id,
        label: item.label,
        done: !!item.done,
      }));
    this.bookings = (data.todayBookings || []).map((b) => ({
      ...b,
      photo: b.photo || DEFAULT_PHOTO,
    }));
    this.courts = data.courts || [];
    this.coachSessions = (data.coachSessions || []).map((s) => ({
      ...s,
      photo: s.photo || DEFAULT_PHOTO,
    }));
    this.activities = data.activities || [];
    this.aiTips = data.aiTips || [];
    this.pendingActions = data.pendingActions || [];
    this.bookingBlockMessage.set(
      data.bookingPolicy?.isBookingBlocked
        ? (data.bookingPolicy.blockMessage
          || 'Please contact admin. You have exceeded your cancellation limit so you are temporarily blocked from the admin side.')
        : null,
    );
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

  hasPendingVerification(): boolean {
    return this.checklist.some((item) => {
      const key = String(item.id || item.label || '').toLowerCase();
      return key.includes('verification') && !item.done;
    });
  }

  completionCtaPath(): string {
    if (this.completionPercent >= 100) {
      return '/app/venue/profile';
    }
    return '/app/venue/complete-profile';
  }
}
