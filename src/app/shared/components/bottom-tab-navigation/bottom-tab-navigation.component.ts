import { CommonModule } from '@angular/common';
import { Component, Input, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TabSwitchService } from '../../../core/services/tab-switch.service';
import { TabItem } from '../../models/app.models';

@Component({
  selector: 'app-bottom-tab-navigation',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <nav class="tab-bar-outer">
      <div class="tab-bar-pill">
        <button
          type="button"
          *ngFor="let tab of tabs"
          class="tab-item"
          [class.is-active]="isActive(tab)"
          (click)="onTabClick(tab)"
        >
          <div class="tab-icon-wrap" [class.tab-icon-active]="isActive(tab)">
            <ion-icon [name]="tab.icon" class="tab-icon"></ion-icon>
            <span class="tab-badge" *ngIf="badgeValue(tab) > 0">
              {{ badgeValue(tab) > 9 ? '9+' : badgeValue(tab) }}
            </span>
          </div>
          <span class="tab-label" [class.tab-label-active]="isActive(tab)">{{ tab.label }}</span>
        </button>
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
        padding: 0 20px calc(var(--app-tab-bar-outer-pad, 20px) + var(--safe-area-bottom)) 20px;
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
        border: 1px solid rgba(17, 24, 39, 0.08);
        box-shadow:
          0 1px 0 rgba(255, 255, 255, 0.95) inset,
          0 0 0 1px rgba(var(--app-primary-rgb), 0.12),
          0 4px 12px rgba(17, 24, 39, 0.08),
          0 12px 36px rgba(17, 24, 39, 0.14),
          0 20px 48px rgba(var(--app-primary-rgb), 0.10);
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
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
        outline: none;
        color: inherit;
        font-family: inherit;
      }

      .tab-icon-wrap {
        position: relative;
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
        background: var(--app-primary);
        box-shadow: 0 2px 12px rgba(var(--app-primary-rgb), 0.40);
      }

      .tab-icon {
        font-size: 20px;
        color: #6B7280;
        transition: color 0.2s ease;
      }

      .tab-icon-wrap.tab-icon-active .tab-icon {
        color: #111827;
      }

      .tab-badge {
        position: absolute;
        top: 2px;
        right: 2px;
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 999px;
        background: #ef4444;
        color: #fff;
        font-size: 9px;
        font-weight: 800;
        line-height: 16px;
        text-align: center;
        box-shadow: 0 0 0 2px #fff;
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
  private readonly tabsService = inject(TabSwitchService);

  @Input() tabs: TabItem[] = [];

  onTabClick(tab: TabItem): void {
    void this.tabsService.openTab(tab.route);
  }

  isActive(tab: TabItem): boolean {
    return this.tabsService.isActive(tab, this.tabs);
  }

  badgeValue(tab: TabItem): number {
    const raw = tab.badge;
    if (raw === null || raw === undefined || raw === '') return 0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0;
  }
}
