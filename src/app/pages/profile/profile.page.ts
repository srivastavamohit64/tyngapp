import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, MenuController, ViewWillEnter } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { XpService, XpSummary } from '../../core/services/xp.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageHeaderComponent],
  styleUrls: ['./profile.page.scss'],
  templateUrl: './profile.page.html',
})
export class ProfilePage implements ViewWillEnter {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  private readonly menu = inject(MenuController);
  private readonly xpApi = inject(XpService);
  readonly xp = signal<XpSummary | null>(null);
  readonly badges = signal<Array<{ name: string; earned: boolean; category: string }>>([]);
  readonly challenges = signal<Array<{ name: string; current: number; threshold: number; rewardXp: number; completed: boolean }>>([]);

  readonly displayName = computed(() => this.auth.user()?.name?.trim() || 'Player');
  readonly initials = computed(() => this.displayName().charAt(0).toUpperCase());
  readonly profileImage = computed(() => this.auth.user()?.profileImage || null);
  readonly level = computed(() => this.xp()?.level ?? this.auth.user()?.level ?? 1);
  readonly levelTitle = computed(() => this.xp()?.levelTitle || this.auth.user()?.levelTitle || 'Rookie');
  readonly tpPoints = computed(() => this.auth.user()?.tpPoints ?? 0);
  readonly ratingLabel = computed(() => {
    const rating = this.xp()?.rating ?? this.auth.user()?.rating;
    return rating ? Number(rating).toFixed(1) : '—';
  });
  readonly xpProgress = computed(() => Math.min(100, Math.max(0, this.xp()?.xpProgressPct ?? this.auth.user()?.xpProgressPct ?? 0)));
  readonly xpLabel = computed(() => {
    const summary = this.xp();
    const user = this.auth.user();
    const current = summary?.lifetimeXp ?? user?.currentXp ?? 0;
    const next = summary?.nextLevelXp ?? user?.nextLevelXp ?? 0;
    return `${current.toLocaleString('en-IN')} / ${next.toLocaleString('en-IN')} XP`;
  });
  readonly sportsLabel = computed(() => this.auth.user()?.sportsLabel || this.formatSports(this.auth.user()?.sports));
  readonly locationLabel = computed(() => this.auth.user()?.location?.trim() || 'Set your location');
  readonly hasLocation = computed(() => !!this.auth.user()?.location?.trim());
  readonly experience = computed(() => this.auth.user()?.experience || 'Intermediate');

  readonly stats = computed(() => [
    { label: 'Games Played', value: String(this.xp()?.gamesPlayed ?? this.auth.user()?.gamesPlayed ?? 0), icon: 'disc-outline' },
    { label: 'Reliability', value: `${this.xp()?.reliabilityScore ?? this.auth.user()?.reliabilityScore ?? 100}/100`, icon: 'shield-checkmark-outline' },
    { label: 'Season XP', value: String(this.xp()?.seasonXp ?? this.auth.user()?.seasonXp ?? 0), icon: 'trophy-outline' },
  ]);

  readonly recentMatches: Array<{ sport: string; date: string; result: string; score: string }> = [];

  readonly coachAchievements = [
    { name: 'Elite Coach', icon: 'star-outline', color: '#FF7A00' },
    { name: 'Team Builder', icon: 'people-outline', color: 'var(--app-primary)' },
    { name: 'Season Winner', icon: 'trophy-outline', color: '#FF7A00' },
    { name: 'Development Expert', icon: 'ribbon-outline', color: '#2563EB' },
  ];

  readonly coachRecentSessions = [
    { team: 'Elite Football Squad', date: 'Apr 20, 2026', type: 'Training' },
    { team: 'Junior Cricket Team', date: 'Apr 18, 2026', type: 'Match Prep' },
    { team: 'Basketball Academy', date: 'Apr 15, 2026', type: 'Scrimmage' },
  ];

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

  ionViewWillEnter() {
    if (this.auth.getToken()) {
      this.auth.fetchMe().subscribe();
      this.xpApi.summary().subscribe((data) => this.xp.set(data));
      this.xpApi.badges().subscribe((items) => this.badges.set(items));
      this.xpApi.challenges().subscribe((items) => this.challenges.set(items));
    }
  }

  openXpHistory() {
    void this.router.navigateByUrl('/app/xp/history');
  }

  async openMenu() {
    await this.menu.open();
  }

  editProfile() {
    void this.router.navigateByUrl('/app/profile/edit');
  }

  openSettings() {
    void this.router.navigateByUrl('/app/settings');
  }

  onStatClick(label: string) {
    if (label === 'Bookings Today') {
      void this.router.navigateByUrl('/app/venue/bookings');
    } else if (label === 'Active Facilities') {
      void this.router.navigateByUrl('/app/venue/facilities');
    }
  }

  logout() {
    this.auth.logout().subscribe();
  }

  private formatSports(sports?: string[] | null): string {
    if (!sports?.length) return 'Player';
    return sports
      .slice(0, 2)
      .map((sport) => sport.replace(/\b\w/g, (c) => c.toUpperCase()))
      .join(' · ');
  }
}
