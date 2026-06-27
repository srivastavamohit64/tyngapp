import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { TabItem } from '../../models/app.models';

@Component({
  selector: 'app-bottom-tab-navigation',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, RouterLinkActive],
  template: `
    <nav class="tab-bar">
      <div class="tab-bar-inner" [style.gridTemplateColumns]="'repeat(' + tabs.length + ', minmax(0, 1fr))'">
        <a
          *ngFor="let tab of tabs"
          [routerLink]="tab.route"
          routerLinkActive="is-active"
          [routerLinkActiveOptions]="{ exact: true }"
          class="tab-item"
        >
          <ion-icon [name]="tab.icon" class="tab-icon"></ion-icon>
          <span>{{ tab.label }}</span>
        </a>
      </div>
    </nav>
  `,
  styles: [
    `
      .tab-bar {
        position: fixed;
        inset-inline: 0;
        bottom: 0;
        z-index: 100;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: #111827;
        padding-top: 12px;
        padding-right: calc(16px + var(--safe-area-right));
        padding-bottom: calc(12px + var(--safe-area-bottom));
        padding-left: calc(16px + var(--safe-area-left));
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.35);
      }

      .tab-bar-inner {
        display: grid;
        gap: 4px;
        max-width: 28rem;
        margin: 0 auto;
      }

      .tab-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        min-height: 52px;
        border-radius: 12px;
        font-size: 13px;
        font-weight: 500;
        color: #64748b;
        text-decoration: none;
        transition: color 0.2s ease;
      }

      .tab-item.is-active {
        color: #2563eb;
      }

      .tab-icon {
        font-size: 24px;
      }
    `,
  ],
})
export class BottomTabNavigationComponent {
  @Input() tabs: TabItem[] = [];
}
