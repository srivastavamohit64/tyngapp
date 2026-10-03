import { CommonModule } from '@angular/common';
import { Component, ViewChild, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { CoachDashboard } from '../../core/models/api.model';
import { CoachEarningsSessionItem, CoachProfileDetails, CoachService } from '../../core/services/coach.service';
import { ActivatedRoute, Router } from '@angular/router';
import { BackNavigationService } from '../../core/services/back-navigation.service';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PlayerProfileComponent } from './player-profile/player-profile.component';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PlayerProfileComponent],
  styleUrls: ['./profile.page.scss'],
  templateUrl: './profile.page.html',
})
export class ProfilePage implements ViewWillEnter {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  readonly backNavigation = inject(BackNavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly coach = inject(CoachService);

  @ViewChild(PlayerProfileComponent) private playerProfile?: PlayerProfileComponent;

  readonly profileImage = computed(() => this.auth.user()?.profileImage || null);

  readonly achievementIcons = [
    { icon: 'star-outline', color: '#FF7A00' },
    { icon: 'people-outline', color: 'var(--app-primary)' },
    { icon: 'trophy-outline', color: '#FF7A00' },
    { icon: 'ribbon-outline', color: '#2563EB' },
  ];

  readonly coachLoading = signal(true);
  readonly coachDetails = signal<CoachProfileDetails | null>(null);
  readonly coachDashboard = signal<CoachDashboard | null>(null);
  readonly coachSessions = signal<CoachEarningsSessionItem[]>([]);

  readonly coachSportsLabel = computed(() => {
    const user = this.auth.user();
    return user?.sportsLabel || (user?.sports || []).join(' & ');
  });
  readonly coachAchievements = computed(() => this.coachDetails()?.achievements || []);
  readonly coachExperience = computed(() => {
    const details = this.coachDetails();
    if (details?.experienceYears) return `${details.experienceYears} ${details.experienceYears === 1 ? 'year' : 'years'}`;
    const levels: Record<string, string> = { rising: '0–3 years', experienced: '4–10 years', elite: '10+ years' };
    const level = this.auth.user()?.experience || '';
    return details?.experienceSummary || levels[level] || level || 'Not added';
  });
  readonly coachSpecialities = computed(() => {
    const details = this.coachDetails();
    const values = details?.specialities?.length ? details.specialities : details?.coachingLevels || [];
    return values.length ? values.slice(0, 2).join(', ') : 'Not added';
  });
  readonly coachStats = computed(() => {
    const stats = this.coachDashboard()?.stats;
    return [
      { icon: 'people-outline', label: 'Active Students', value: String(stats?.students ?? 0), path: '/app/coach/students' },
      { icon: 'checkmark-done-outline', label: 'Sessions Done', value: String(stats?.completedSessions ?? 0), path: '/app/coach/earnings' },
      { icon: 'calendar-outline', label: 'Upcoming', value: String(stats?.upcomingSessions ?? 0), path: '/app/coach/schedule' },
    ];
  });

  ionViewWillEnter() {
    if (this.auth.getToken() && this.auth.user()?.role === 'coach') {
      this.auth.fetchMe().subscribe();
      this.loadCoachProfile();
    }
    this.playerProfile?.refresh();
  }

  private loadCoachProfile() {
    this.coachLoading.set(true);
    forkJoin({
      details: this.coach.getMyCoachProfileDetails().pipe(catchError(() => of(null))),
      dashboard: this.coach.getDashboard().pipe(catchError(() => of(null))),
      earnings: this.coach.getEarnings('year').pipe(catchError(() => of(null))),
    }).subscribe(({ details, dashboard, earnings }) => {
      this.coachDetails.set(details?.data ?? null);
      this.coachDashboard.set(dashboard?.data ?? null);
      const data = earnings?.data;
      const items = data ? [...data.awaiting_completion.items, ...data.upcoming.items, ...data.recent_sessions] : [];
      this.coachSessions.set(items.filter((item, index) => items.findIndex(other => other.id === item.id) === index).slice(0, 5));
      this.coachLoading.set(false);
    });
  }

  sessionStateLabel(state: string): string {
    const labels: Record<string, string> = {
      upcoming: 'Upcoming', awaiting_completion: 'Needs completion', completed: 'Completed',
      pending: 'Awaiting venue', cancelled: 'Cancelled', expired: 'Expired',
    };
    return labels[state] || state;
  }

  goBack() {
    if (this.route.snapshot.queryParamMap.get('from') === 'complete-profile') {
      void this.router.navigateByUrl('/app/coach/dashboard', { replaceUrl: true });
      return;
    }
    this.backNavigation.back(this.auth.user()?.role === 'coach' ? '/app/coach/dashboard' : '/app/home');
  }
}
