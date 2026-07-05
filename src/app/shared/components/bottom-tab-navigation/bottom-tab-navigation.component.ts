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
    <!-- Floating pill nav matching Figma BottomNav.tsx exactly -->
    <nav class="tab-bar-outer">
      <div class="tab-bar-pill">
        <a
          *ngFor="let tab of tabs"
          [routerLink]="tab.route"
          routerLinkActive="is-active"
          [routerLinkActiveOptions]="{ exact: false }"
          class="tab-item"
          #rla="routerLinkActive"
        >
          <!-- Icon container - filled lime green circle when active -->
          <div class="tab-icon-wrap" [class.tab-icon-active]="rla.isActive">
            <ion-icon [name]="tab.icon" class="tab-icon"></ion-icon>
          </div>
          <!-- Label -->
          <span class="tab-label" [class.tab-label-active]="rla.isActive">{{ tab.label }}</span>
        </a>
      </div>
    </nav>
  `,
  styles: [
    `
      .tab-bar-outer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
        padding: 0 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px;
        pointer-events: none;
      }

      .tab-bar-pill {
        background: #ffffff;
        display: flex;
        align-items: center;
        justify-content: space-around;
        padding: 0 12px;
        height: 72px;
        border-radius: 40px;
        box-shadow: 0 -1px 0 rgba(0,0,0,0.03), 0 8px 32px rgba(0,0,0,0.11), 0 2px 8px rgba(0,0,0,0.06);
        pointer-events: auto;
        max-width: 440px;
        margin: 0 auto;
      }

      .tab-item {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 5px;
        min-width: 64px;
        text-decoration: none;
        cursor: pointer;
        outline: none;
      }

      .tab-icon-wrap {
        width: 44px;
        height: 44px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: transparent;
        transition: background 0.2s ease, box-shadow 0.2s ease;
      }

      .tab-icon-wrap.tab-icon-active {
        background: #8CF000;
        box-shadow: 0 2px 12px rgba(140, 240, 0, 0.40);
      }

      .tab-icon {
        font-size: 20px;
        color: #6B7280;
        transition: color 0.2s ease;
      }

      .tab-icon-wrap.tab-icon-active .tab-icon {
        color: #111827;
      }

      .tab-label {
        font-size: 10px;
        font-weight: 600;
        color: #9CA3AF;
        white-space: nowrap;
        transition: color 0.2s ease, font-weight 0.2s ease;
        line-height: 1;
      }

      .tab-label.tab-label-active {
        color: #111827;
        font-weight: 700;
      }
    `,
  ],
})
export class BottomTabNavigationComponent {
  @Input() tabs: TabItem[] = [];
}
