import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { DesignDataService } from '../../core/services/design-data.service';
import { AuthService } from '../../core/services/auth.service';
import { TabBadgeService } from '../../core/services/tab-badge.service';
import { UiChromeService } from '../../core/services/ui-chrome.service';
import { BottomTabNavigationComponent } from '../../shared/components/bottom-tab-navigation/bottom-tab-navigation.component';
import { TabItem } from '../../shared/models/app.models';

@Component({
  selector: 'app-tabs-page',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, BottomTabNavigationComponent],
  template: `
    <div class="tabs-shell">
      <ion-router-outlet></ion-router-outlet>
      <app-bottom-tab-navigation *ngIf="showTabs() && !chrome.overlayOpen()" [tabs]="tabs()"></app-bottom-tab-navigation>
    </div>
  `,
  styles: [
    `
      .tabs-shell {
        min-height: 100%;
        background: #fafbfc;
      }
    `,
  ],
})
export class TabsPage {
  private readonly data = inject(DesignDataService);
  private readonly auth = inject(AuthService);
  private readonly badges = inject(TabBadgeService);
  readonly chrome = inject(UiChromeService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  constructor() {
    this.badges.start();
  }

  readonly showTabs = computed(() => {
    const path = (this.url() || '').split('?')[0];
    const user = this.auth.user();
    if (!path) return true;

    // Hide on workflow / form pages (Figma AppLayout)
    if (path.startsWith('/app/game/create')) return false;
    if (path === '/app/wallet' || path.startsWith('/app/wallet/')) return false;
    if (path === '/app/venues' || path.startsWith('/app/venues/')) return false;
    if (path.startsWith('/app/map')) return false;
    if (path.includes('/complete-profile')) return false;
    if (path.includes('/enroll-student')) return false;
    if (path.includes('/create-session')) return false;
    if (path.includes('/venue-booking')) return false;
    if (path.includes('/book-venue')) return false;
    if (path.startsWith('/app/venue/events/create')) return false;
    if (/^\/app\/venue\/bookings\/[^/]+$/.test(path)) return false;
    if (/^\/app\/my-bookings\/[^/]+$/.test(path)) return false;
    if (/^\/app\/chat\/.+/.test(path)) return false;
    if (path.startsWith('/app/check-in')) return false;
    // Player venue detail / book / payment summary (e.g. /app/venue/14, /app/venue/14/book)
    if (/^\/app\/venue\/\d+(\/(book|summary))?$/.test(path)) return false;

    if (user?.role === 'coach') {
      const coachPrimary = [
        '/app/coach/dashboard',
        '/app/home',
        '/app/coach/students',
        '/app/coach/schedule',
        '/app/schedule',
      ];
      return coachPrimary.some((p) => path === p || path.startsWith(p + '/'));
    }
    if (user?.role === 'venue') {
      const venuePrimary = [
        '/app/venue/dashboard',
        '/app/home',
        '/app/venue/bookings',
        '/app/venue/events',
        '/app/venue/calendar',
        '/app/venue/facilities',
        '/app/venue/earnings',
        '/app/venue/analytics',
        '/app/venue/profile',
        '/app/chat',
      ];
      return venuePrimary.some((p) => path === p || path.startsWith(p + '/'));
    }
    if (user?.role === 'admin') {
      return path.startsWith('/app/admin');
    }
    return true;
  });

  readonly tabs = computed<TabItem[]>(() => {
    const user = this.auth.user();
    const bookingsBadge = this.badges.bookingsBadge();
    const chatBadge = this.badges.chatBadge();

    if (user?.role === 'coach') {
      return [
        { label: 'Home', icon: 'home-outline', route: '/app/coach/dashboard' },
        { label: 'My Students', icon: 'people-outline', route: '/app/coach/students' },
        { label: 'My Schedule', icon: 'calendar-outline', route: '/app/coach/schedule' },
        {
          label: 'Chat',
          icon: 'chatbubble-outline',
          route: '/app/chat',
          badge: chatBadge > 0 ? chatBadge : null,
        },
      ];
    }
    if (user?.role === 'venue') {
      return [
        { label: 'Home', icon: 'home-outline', route: '/app/venue/dashboard' },
        {
          label: 'Bookings',
          icon: 'calendar-outline',
          route: '/app/venue/bookings',
          badge: bookingsBadge > 0 ? bookingsBadge : null,
        },
        { label: 'Events', icon: 'sparkles-outline', route: '/app/venue/events' },
        {
          label: 'Chat',
          icon: 'chatbubble-outline',
          route: '/app/chat',
          badge: chatBadge > 0 ? chatBadge : null,
        },
      ];
    }
    if (user?.role === 'admin') {
      return [
        { label: 'Dashboard', icon: 'home-outline', route: '/app/admin/dashboard' },
        { label: 'Users', icon: 'people-outline', route: '/app/admin/users' },
        { label: 'Venues', icon: 'business-outline', route: '/app/admin/venues' },
        { label: 'Settings', icon: 'settings-outline', route: '/app/admin/settings' },
      ];
    }

    return this.data.tabs.map((tab) => {
      if (tab.route === '/app/my-bookings') {
        return { ...tab, badge: bookingsBadge > 0 ? bookingsBadge : null };
      }
      if (tab.route === '/app/chat') {
        return { ...tab, badge: chatBadge > 0 ? chatBadge : null };
      }
      return tab;
    });
  });
}
