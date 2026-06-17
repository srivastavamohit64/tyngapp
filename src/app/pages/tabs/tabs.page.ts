import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { BottomTabNavigationComponent } from '../../shared/components/bottom-tab-navigation/bottom-tab-navigation.component';

@Component({
  selector: 'app-tabs-page',
  standalone: true,
  imports: [IonicModule, RouterModule, BottomTabNavigationComponent],
  template: `
    <div class="tabs-shell">
      <ion-router-outlet></ion-router-outlet>
      <app-bottom-tab-navigation [tabs]="data.tabs"></app-bottom-tab-navigation>
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
  readonly data = inject(DesignDataService);
}
