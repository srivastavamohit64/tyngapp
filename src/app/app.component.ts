import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { filter } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';
import { AuthUser } from './core/models/api.model';
import { PlatformService } from './core/services/platform.service';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';
import { VenueService } from './core/services/venue.service';
import { CoachService } from './core/services/coach.service';
import { RealtimeService } from './core/services/realtime.service';
import { PushNotificationService } from './core/services/push-notification.service';
import { TabBadgeService } from './core/services/tab-badge.service';
import { ForegroundNotificationService } from './core/services/foreground-notification.service';

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
  private readonly coachService = inject(CoachService);
  private readonly realtime = inject(RealtimeService);
  private readonly pushNotifications = inject(PushNotificationService);
  private readonly tabBadges = inject(TabBadgeService);
  private readonly foregroundNotifications = inject(ForegroundNotificationService);

  showLogoutConfirm = false;
  private lastScrollPath = '';
  readonly coachScheduleCount = signal(0);

  private readonly venueMenuStats = signal<{
    profileName: string;
    profilePercent: number;
    courtsCount: number;
    monthEarnings: number;
    todayBookings: number;
    upcomingBookings: number;
    pendingBookings: number;
    unreadChat: number;
    checklist: { label: string; done: boolean }[];
  }>({
    profileName: '',
    profilePercent: 0,
    courtsCount: 0,
    monthEarnings: 0,
    todayBookings: 0,
    upcomingBookings: 0,
    pendingBookings: 0,
    unreadChat: 0,
    checklist: [],
  });

  readonly coachMenuItems: CoachMenuItem[] = [
    { label: 'Complete Profile', sub: 'Finish your coach profile', path: '/app/coach/complete-profile', icon: 'clipboard-outline' },
    { label: 'My Schedule', sub: 'Sessions & calendar', path: '/app/coach/schedule', icon: 'calendar-outline' },
    { label: 'Wallet', sub: 'Balance, top-up & history', path: '/app/wallet', icon: 'wallet-outline' },
    { label: 'Book Venue', sub: 'Discover & reserve venues', path: '/app/coach/book-venue', icon: 'location-outline' },
    { label: 'My Students', sub: 'Manage your students', path: '/app/coach/students', icon: 'people-outline' },
    { label: 'Coach Community', sub: 'Connect with active coaches', path: '/app/coach/community', icon: 'people-circle-outline' },
    { label: 'Earnings', sub: 'Revenue & payouts', path: '/app/coach/earnings', icon: 'cash-outline' },
    { label: 'Analytics', sub: 'Profile & booking stats', path: '/app/coach/insights', icon: 'bar-chart-outline' },
    { label: 'Settings', sub: 'Preferences & privacy', path: '/app/coach/settings', icon: 'settings-outline' },
  ];

  readonly venueMenuItems = computed<VenueMenuItem[]>(() => {
    const m = this.venueMenuStats();
    const earnings = `₹${Number(m.monthEarnings || 0).toLocaleString('en-IN')} this month`;
    const facilitiesSub = m.courtsCount > 0
      ? `${m.courtsCount} court${m.courtsCount === 1 ? '' : 's'}`
      : 'Courts & equipment';
    const profileSub = `${m.profileName || this.user()?.name?.trim() || 'Venue'} · ${m.profilePercent || this.user()?.profileCompletion || 0}%`;

    return [
      { label: 'Venue Profile', sub: profileSub, path: '/app/venue/profile', icon: 'business-outline' },
      { label: 'Facilities & Amenities', sub: facilitiesSub, path: '/app/venue/facilities', icon: 'cube-outline' },
      { label: 'Wallet', sub: 'Balance & top-up', path: '/app/wallet', icon: 'wallet-outline' },
      { label: 'Earnings', sub: earnings, path: '/app/venue/earnings', icon: 'cash-outline' },
      { label: 'Coaches', sub: 'Partner coaches', path: '/app/venue/facilities', icon: 'people-outline' },
      { label: 'Events', sub: 'Create & manage events', path: '/app/venue/events', icon: 'sparkles-outline' },
      { label: 'Analytics', sub: 'Occupancy & insights', path: '/app/venue/analytics', icon: 'bar-chart-outline' },
      { label: 'Settings', sub: 'Preferences & billing', path: '/app/venue/profile', icon: 'settings-outline' },
    ];
  });

  readonly venueChecklistPreview = computed(() => {
    const live = this.venueMenuStats().checklist
      .filter((item) => item.label.toLowerCase() !== 'amenities' && item.label.toLowerCase() !== 'verification')
      .slice(0, 4);
    if (live.length) return live;
    return [
      { label: 'Venue Information', done: false },
      { label: 'Sports Offered', done: false },
      { label: 'Photos', done: false },
      { label: 'Pricing', done: false },
    ];
  });

  ngOnInit(): void {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => this.resetPageScroll(event.urlAfterRedirects));
    void this.platform.init();
    void this.realtime.connect().then(() => {
      const userId = this.auth.user()?.id;
      if (userId) {
        void this.realtime.listenUserBookings(String(userId));
      }
    });
    this.foregroundNotifications.bindAppState();
    // Register FCM as soon as the native app boots (Firebase Console works without Laravel).
    // Token sync to the backend still requires an authenticated session.
    void this.pushNotifications.init().then(() => {
      if (this.auth.getToken()) {
        void this.pushNotifications.syncIfAuthenticated();
      }
    });
    if (this.auth.getToken()) {
      this.tabBadges.start();
      if (this.auth.user()?.role === 'coach') this.refreshCoachScheduleCount();
    }
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
    return u?.username ? `@${u.username}` : '@player';
  }

  coachSubtitle(): string {
    return this.user()?.sportsLabel || 'Coach';
  }

  venueDisplayName(): string {
    const user = this.user();
    return user?.displayName?.trim() || this.venueMenuStats().profileName || user?.name?.trim() || 'Venue';
  }

  venueLocation(): string {
    const raw = this.user()?.location?.trim() || '';
    if (!raw) return 'Add location';
    return this.shortVenueAddress(raw);
  }

  /** Area + city + pincode only (drops plus-codes, state, country, duplicates). */
  private shortVenueAddress(raw: string): string {
    const parts = raw
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);

    const seen = new Set<string>();
    const unique = parts.filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    let pincode = '';
    for (const part of unique) {
      const match = part.match(/\b(\d{6})\b/);
      if (match) {
        pincode = match[1];
        break;
      }
    }

    const states = new Set([
      'andhra pradesh', 'arunachal pradesh', 'assam', 'bihar', 'chhattisgarh', 'goa', 'gujarat',
      'haryana', 'himachal pradesh', 'jharkhand', 'karnataka', 'kerala', 'madhya pradesh',
      'maharashtra', 'manipur', 'meghalaya', 'mizoram', 'nagaland', 'odisha', 'punjab',
      'rajasthan', 'sikkim', 'tamil nadu', 'telangana', 'tripura', 'uttar pradesh',
      'uttarakhand', 'west bengal', 'delhi', 'nct of delhi', 'other',
    ]);

    const meaningful = unique
      .map((part) => part.replace(/\b\d{6}\b/g, '').replace(/\s+/g, ' ').trim())
      .filter((part) => {
        if (!part) return false;
        if (/^[A-Z0-9]{2,}\+[A-Z0-9]+$/i.test(part)) return false;
        if (/^india$/i.test(part)) return false;
        if (states.has(part.toLowerCase())) return false;
        return true;
      });

    const area = meaningful[0] || '';
    const city = meaningful.length > 1 ? meaningful[meaningful.length - 1] : '';
    const bits: string[] = [];
    if (area) bits.push(area);
    if (city && city.toLowerCase() !== area.toLowerCase()) bits.push(city);

    let result = bits.join(', ');
    if (pincode) {
      result = result ? `${result} ${pincode}` : pincode;
    }
    return result || 'Add location';
  }

  profileCompletion(): number {
    return this.venueMenuStats().profilePercent || this.user()?.profileCompletion || 0;
  }

  coachMenuBadge(item: CoachMenuItem): string | undefined {
    if (item.path !== '/app/coach/schedule') return item.badge;
    const count = this.coachScheduleCount();
    return count > 0 ? String(count) : undefined;
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
    const target = this.resolveVenueNavPath(path);
    void this.router.navigateByUrl(target);
  }

  /** Incomplete venue profiles open the wizard at the first missing step. */
  private resolveVenueNavPath(path: string): string {
    if (this.auth.user()?.role !== 'venue') return path;
    const bare = (path || '').split('?')[0];
    const incomplete = this.profileCompletion() < 100;
    if (!incomplete) return path;

    if (
      bare === '/app/venue/complete-profile'
      || bare === '/app/venue/profile'
    ) {
      return '/app/venue/complete-profile?resume=1';
    }
    return path;
  }

  private resetPageScroll(url: string): void {
    const path = (url || '').split('?')[0].split('#')[0];
    if (path === this.lastScrollPath) {
      return;
    }
    this.lastScrollPath = path;

    const run = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      document.querySelectorAll('ion-app ion-content').forEach((node) => {
        const content = node as HTMLElement & { scrollToTop?: (duration?: number) => Promise<void> };
        if (typeof content.scrollToTop === 'function') {
          void content.scrollToTop(0);
        }
        const inner = content.shadowRoot?.querySelector('.inner-scroll') as HTMLElement | null;
        if (inner) {
          inner.scrollTop = 0;
        }
      });
    };

    run();
    requestAnimationFrame(run);
    setTimeout(run, 50);
  }

  refreshProfile() {
    if (this.auth.getToken()) {
      this.auth.fetchMe().subscribe();
      if (this.auth.user()?.role === 'venue') {
        void this.refreshVenueMenu();
      }
      if (this.auth.user()?.role === 'coach') {
        this.refreshCoachScheduleCount();
      }
    }
  }

  private refreshCoachScheduleCount(): void {
    this.coachService.getSchedulingSessions().subscribe({
      next: (response) => {
        const now = new Date();
        const sessions = Array.isArray(response.data) ? response.data : [];
        const active = sessions.filter((session: any) => {
          const status = String(session?.status || '').toLowerCase();
          const startsAt = session?.starts_at ? new Date(session.starts_at) : null;
          return !['completed', 'cancelled', 'rejected', 'expired'].includes(status)
            && (!startsAt || !Number.isNaN(startsAt.getTime()))
            && (!startsAt || startsAt >= new Date(now.getFullYear(), now.getMonth(), now.getDate()));
        });
        this.coachScheduleCount.set(active.length);
      },
      error: () => this.coachScheduleCount.set(0),
    });
  }

  private async refreshVenueMenu() {
    try {
      const response = await firstValueFrom(this.venueService.getDashboard());
      const menu = response.data?.menu;
      if (!response.success || !menu) return;
      this.venueMenuStats.set({
        profileName: String(menu.profileName || ''),
        profilePercent: Number(menu.profilePercent || 0),
        courtsCount: Number(menu.courtsCount || 0),
        monthEarnings: Number(menu.monthEarnings || 0),
        todayBookings: Number(menu.todayBookings || 0),
        upcomingBookings: Number(menu.upcomingBookings || 0),
        pendingBookings: Number(menu.pendingBookings || 0),
        unreadChat: Number(menu.unreadChat || 0),
        checklist: (response.data?.completion?.checklist || [])
          .filter((item) => String(item.id || item.label || '').toLowerCase() !== 'amenities')
          .map((item) => ({
            label: String(item.label || ''),
            done: !!item.done,
          })),
      });
    } catch {
      // Keep previous menu stats if dashboard fails.
    }
  }

  async requestLogout() {
    await this.menu.close();
    this.showLogoutConfirm = true;
  }

  cancelLogout() {
    this.showLogoutConfirm = false;
  }

  get logoutConfirmMessage(): string {
    const role = this.auth.user()?.role;
    if (role === 'venue') return 'Your venue profile will be preserved.';
    if (role === 'coach') return 'Your sessions and profile data will be preserved.';
    return 'You can sign back in anytime with the same account.';
  }

  async logout() {
    this.showLogoutConfirm = false;
    await this.menu.close();
    this.auth.logout().subscribe();
  }
}
