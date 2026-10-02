import { CommonModule, Location } from '@angular/common';
import { Component, ViewChild, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  private readonly route = inject(ActivatedRoute);
  private readonly location = inject(Location);

  @ViewChild(PlayerProfileComponent) private playerProfile?: PlayerProfileComponent;

  readonly profileImage = computed(() => this.auth.user()?.profileImage || null);

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

  ionViewWillEnter() {
    if (this.auth.getToken() && this.auth.user()?.role === 'coach') {
      this.auth.fetchMe().subscribe();
    }
    this.playerProfile?.refresh();
  }

  goBack() {
    if (this.route.snapshot.queryParamMap.get('from') === 'complete-profile') {
      void this.router.navigateByUrl('/app/coach/dashboard', { replaceUrl: true });
      return;
    }
    this.location.back();
  }
}
