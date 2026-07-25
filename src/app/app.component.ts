import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthUser } from './core/models/api.model';
import { PlatformService } from './core/services/platform.service';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { VenueService } from './core/services/venue.service';

interface CoachMenuItem {
  label: string;
  sub: string;
  path: string;
  icon: string;
  badge?: string;
}

interface VenueMenuItem {
  label: string;
  sub: string;
  path: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly platform = inject(PlatformService);
  private readonly ionicPlatform = inject(Platform);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  private readonly menu = inject(MenuController);
  private readonly router = inject(Router);
  private readonly venueService = inject(VenueService);

  showLogoutConfirm = false;

  private readonly venueMenuStats = signal({
    profileName: '',
    profilePercent: 0,
    amenitiesCount: 0,
    courtsCount: 0,
    monthEarnings: 0,
    todayBookings: 0,
    upcomingBookings: 0,
    pendingBookings: 0,
    unreadChat: 0,
  });

  readonly coachMenuItems: CoachMenuItem[] = [
    { label: 'Complete Profile', sub: 'Finish your coach profile', path: '/app/coach/complete-profile', icon: 'clipboard-outline' },
    { label: 'Personal Stats', sub: 'Health & fitness info', path: '/app/stats', icon: 'pulse-outline' },
    { label: 'My Schedule', sub: 'Sessions & calendar', path: '/app/coach/schedule', icon: 'calendar-outline', badge: '3' },
    { label: 'Chat', sub: 'Students & community', path: '/app/coach/chat', icon: 'chatbubbles-outline', badge: '7' },
    { label: 'Book Venue', sub: 'Discover & reserve venues', path: '/app/coach/book-venue', icon: 'location-outline' },
    { label: 'My Students', sub: 'Manage your students', path: '/app/coach/students', icon: 'people-outline' },
    { label: 'Earnings', sub: 'Revenue & payouts', path: '/app/coach/earnings', icon: 'wallet-outline' },
    { label: 'Analytics', sub: 'Profile & booking stats', path: '/app/coach/insights', icon: 'bar-chart-outline' },
    { label: 'Settings', sub: 'Preferences & privacy', path: '/app/coach/settings', icon: 'settings-outline' },
  ];

  readonly venueMenuItems = computed<VenueMenuItem[]>(() => {
    const m = this.venueMenuStats();
    const earnings = `₹${Number(m.monthEarnings || 0).toLocaleString('en-IN')} this month`;
    const bookingsSub = m.todayBookings > 0
      ? `${m.todayBookings} today`
      : `${m.upcomingBookings} upcoming`;
    const amenitiesSub = m.courtsCount > 0 || m.amenitiesCount > 0
      ? `${m.courtsCount} courts · ${m.amenitiesCount} amenities`
      : 'Courts, parking & more';
    const profileSub = `${m.profileName || this.user()?.name?.trim() || 'Venue'} · ${m.profilePercent || this.user()?.profileCompletion || 0}%`;

    return [
      { label: 'Venue Profile', sub: profileSub, path: '/app/venue/profile', icon: 'business-outline' },
      { label: 'Amenities', sub: amenitiesSub, path: '/app/venue/facilities', icon: 'cube-outline' },
      { label: 'Earnings', sub: earnings, path: '/app/venue/earnings', icon: 'wallet-outline' },
      {
        label: 'Bookings',
        sub: bookingsSub,
        path: '/app/venue/bookings',
        icon: 'calendar-outline',
        badge: m.pendingBookings > 0 ? String(m.pendingBookings) : undefined,
      },
      {
        label: 'Chat',
        sub: 'Messages & enquiries',
        path: '/app/chat',
        icon: 'chatbubbles-outline',
        badge: m.unreadChat > 0 ? String(m.unreadChat) : undefined,
      },
      { label: 'Coaches', sub: 'Partner coaches', path: '/app/venue/facilities', icon: 'people-outline' },
      { label: 'Analytics', sub: 'Occupancy & insights', path: '/app/venue/analytics', icon: 'bar-chart-outline' },
      { label: 'Settings', sub: 'Preferences & billing', path: '/app/venue/profile', icon: 'settings-outline' },
    ];
  });

  readonly venueChecklistPreview = [
    { label: 'Venue Type', done: true },
    { label: 'Venue Details', done: true },
    { label: 'Sports Offered', done: true },
    { label: 'Amenities', done: false },
  ];

  ngOnInit(): void {
    void this.platform.init();
  }

  user(): AuthUser | null {
    return this.auth.user();
  }

  displayName(): string {
    return this.user()?.name?.trim() || 'TYNG User';
  }

  avatarUrl(): string | null {
    return this.user()?.profileImage || null;
  }

  userHandle(): string {
    const u = this.user();
    const handle = u?.username ? `@${u.username}` : '@player';
    const location = u?.location?.trim() || 'Add location';
    return `${handle} · ${location}`;
  }

  coachSubtitle(): string {
    return this.user()?.sportsLabel || 'Coach';
  }

  venueDisplayName(): string {
    return this.venueMenuStats().profileName || this.user()?.name?.trim() || 'Venue';
  }

  venueLocation(): string {
    return this.user()?.location?.trim() || 'Add location';
  }

  profileCompletion(): number {
    return this.venueMenuStats().profilePercent || this.user()?.profileCompletion || 0;
  }

  tpPoints(): string {
    return (this.user()?.tpPoints ?? 0).toLocaleString('en-IN');
  }

  level(): number {
    return this.user()?.level ?? 1;
  }

  xpLabel(): string {
    const u = this.user();
    return `${(u?.currentXp ?? 0).toLocaleString('en-IN')} / ${(u?.nextLevelXp ?? 500).toLocaleString('en-IN')} XP`;
  }

  xpProgressPct(): number {
    return this.user()?.xpProgressPct ?? 0;
  }

  xpToNextLabel(): string {
    const u = this.user();
    const remaining = u?.xpToNextLevel ?? 500;
    return `${remaining.toLocaleString('en-IN')} XP to Level ${this.level() + 1}`;
  }

  percentileLabel(): string | null {
    return this.user()?.percentileRank || null;
  }

  isAndroid(): boolean {
    return this.ionicPlatform.is('android');
  }

  getRoleEmoji(): string {
    const role = this.user()?.role;
    if (role === 'coach') return '👨‍🏫';
    if (role === 'venue') return '🏟️';
    return '🏏';
  }

  async navigateTo(path: string) {
    this.showLogoutConfirm = false;
    await this.menu.close();
    void this.router.navigateByUrl(path);
  }

  refreshProfile() {
    if (this.auth.getToken()) {
      this.auth.fetchMe().subscribe();
      if (this.auth.user()?.role === 'venue') {
        void this.refreshVenueMenu();
      }
    }
  }

  private async refreshVenueMenu() {
    try {
      const response = await firstValueFrom(this.venueService.getDashboard());
      const menu = response.data?.menu;
      if (!response.success || !menu) return;
      this.venueMenuStats.set({
        profileName: String(menu.profileName || ''),
        profilePercent: Number(menu.profilePercent || 0),
        amenitiesCount: Number(menu.amenitiesCount || 0),
        courtsCount: Number(menu.courtsCount || 0),
        monthEarnings: Number(menu.monthEarnings || 0),
        todayBookings: Number(menu.todayBookings || 0),
        upcomingBookings: Number(menu.upcomingBookings || 0),
        pendingBookings: Number(menu.pendingBookings || 0),
        unreadChat: Number(menu.unreadChat || 0),
      });
    } catch {
      // Keep previous menu stats if dashboard fails.
    }
  }

  async logout() {
    this.showLogoutConfirm = false;
    await this.menu.close();
    this.auth.logout().subscribe();
  }
}
