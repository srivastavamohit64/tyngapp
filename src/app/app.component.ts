import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController, Platform } from '@ionic/angular';
import { PlatformService } from './core/services/platform.service';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';

interface CoachMenuItem {
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

  showLogoutConfirm = false;

  readonly coachMenuItems: CoachMenuItem[] = [
    { label: 'Complete Profile', sub: '40% completed', path: '/app/coach/complete-profile', icon: 'clipboard-outline' },
    { label: 'Personal Stats', sub: 'Health & fitness info', path: '/app/stats', icon: 'pulse-outline' },
    { label: 'My Schedule', sub: 'Sessions & calendar', path: '/app/coach/schedule', icon: 'calendar-outline', badge: '3' },
    { label: 'Chat', sub: 'Students & community', path: '/app/coach/chat', icon: 'chatbubbles-outline', badge: '7' },
    { label: 'Book Venue', sub: 'Discover & reserve venues', path: '/app/coach/book-venue', icon: 'location-outline' },
    { label: 'My Students', sub: '24 active students', path: '/app/coach/students', icon: 'people-outline' },
    { label: 'Earnings', sub: 'Revenue & payouts', path: '/app/coach/earnings', icon: 'wallet-outline' },
    { label: 'Analytics', sub: 'Profile & booking stats', path: '/app/coach/insights', icon: 'bar-chart-outline' },
    { label: 'Settings', sub: 'Preferences & privacy', path: '/app/coach/settings', icon: 'settings-outline' },
  ];

  ngOnInit(): void {
    void this.platform.init();
  }

  isAndroid(): boolean {
    return this.ionicPlatform.is('android');
  }

  getRoleEmoji(): string {
    const role = this.auth.user()?.role;
    if (role === 'coach') return '👨‍🏫';
    if (role === 'venue') return '🏟️';
    return '🏏';
  }

  async navigateTo(path: string) {
    this.showLogoutConfirm = false;
    await this.menu.close();
    void this.router.navigateByUrl(path);
  }

  async logout() {
    this.showLogoutConfirm = false;
    await this.menu.close();
    this.auth.logout();
    void this.router.navigateByUrl('/welcome');
  }
}
