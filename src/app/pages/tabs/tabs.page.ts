import { Component, inject, computed } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { AuthService } from '../../core/services/auth.service';
import { BottomTabNavigationComponent } from '../../shared/components/bottom-tab-navigation/bottom-tab-navigation.component';
import { TabItem } from '../../shared/models/app.models';

@Component({
  selector: 'app-tabs-page',
  standalone: true,
  imports: [IonicModule, RouterModule, BottomTabNavigationComponent],
  template: `
    <div class="tabs-shell">
      <ion-router-outlet></ion-router-outlet>
      <app-bottom-tab-navigation [tabs]="tabs()"></app-bottom-tab-navigation>
    </div>
  `,
  styles: [
    `
      .tabs-shell {
        min-height: 100vh;
        background: #0a0f1c;
      }
    `,
  ],
})
export class TabsPage {
  private readonly data = inject(DesignDataService);
  private readonly auth = inject(AuthService);

  readonly tabs = computed<TabItem[]>(() => {
    const user = this.auth.user();
    if (user?.role === 'coach') {
      return [
        { label: 'Home', icon: 'home-outline', route: '/app/home' },
        { label: 'Teams', icon: 'people-outline', route: '/app/teams' },
        { label: 'Schedule', icon: 'calendar-outline', route: '/app/schedule' },
        { label: 'Profile', icon: 'person-outline', route: '/app/profile' },
      ];
    }
    if (user?.role === 'venue') {
      return [
        { label: 'Home', icon: 'home-outline', route: '/app/home' },
        { label: 'Calendar', icon: 'calendar-outline', route: '/app/venue/calendar' },
        { label: 'Analytics', icon: 'trending-up-outline', route: '/app/venue/analytics' },
        { label: 'Profile', icon: 'person-outline', route: '/app/profile' },
      ];
    }
    return this.data.tabs;
  });
}
