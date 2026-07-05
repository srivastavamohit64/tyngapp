import { CommonModule } from '@angular/common';
import { Component, inject, computed } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { DesignDataService } from '../../core/services/design-data.service';
import { AuthService } from '../../core/services/auth.service';
import { BottomTabNavigationComponent } from '../../shared/components/bottom-tab-navigation/bottom-tab-navigation.component';
import { TabItem } from '../../shared/models/app.models';

@Component({
  selector: 'app-tabs-page',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule, BottomTabNavigationComponent],
  template: `
    <div class="tabs-shell">
      <ion-router-outlet></ion-router-outlet>
      <app-bottom-tab-navigation *ngIf="showTabs()" [tabs]="tabs()"></app-bottom-tab-navigation>
    </div>
  `,
  styles: [
    `
      .tabs-shell {
        min-height: 100vh;
        background: #fafbfc;
      }
    `,
  ],
})
export class TabsPage {
  private readonly data = inject(DesignDataService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly showTabs = computed(() => {
    const path = this.url();
    const user = this.auth.user();
    if (!path) return true;

    // Hide on workflow / form pages (Figma AppLayout)
    if (path.startsWith('/app/game/create')) return false;
    if (path.startsWith('/app/map')) return false;
    if (path.includes('/complete-profile')) return false;
    if (path.includes('/enroll-student')) return false;
    if (path.includes('/create-session')) return false;
    if (path.includes('/venue-booking')) return false;
    if (path.includes('/book-venue')) return false;

    if (user?.role === 'coach') {
      const coachPrimary = ['/app/home', '/app/teams', '/app/coach/students', '/app/schedule', '/app/chat', '/app/profile'];
      return coachPrimary.some((p) => path === p || path.startsWith(p + '/'));
    }
    if (user?.role === 'venue') {
      const venuePrimary = ['/app/home', '/app/venue/bookings', '/app/venue/calendar', '/app/chat', '/app/profile'];
      return venuePrimary.some((p) => path === p || path.startsWith(p + '/'));
    }
    if (user?.role === 'admin') {
      return path.startsWith('/app/admin');
    }
    return true;
  });

  readonly tabs = computed<TabItem[]>(() => {
    const user = this.auth.user();
    if (user?.role === 'coach') {
      return [
        { label: 'Home', icon: 'home-outline', route: '/app/home' },
        { label: 'Students', icon: 'people-outline', route: '/app/coach/students' },
        { label: 'Schedule', icon: 'calendar-outline', route: '/app/schedule' },
        { label: 'Chat', icon: 'chatbubble-outline', route: '/app/chat' },
      ];
    }
    if (user?.role === 'venue') {
      return [
        { label: 'Home', icon: 'home-outline', route: '/app/home' },
        { label: 'Bookings', icon: 'calendar-outline', route: '/app/venue/bookings' },
        { label: 'Calendar', icon: 'calendar-number-outline', route: '/app/venue/calendar' },
        { label: 'Chat', icon: 'chatbubble-outline', route: '/app/chat' },
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
    return this.data.tabs;
  });
}
