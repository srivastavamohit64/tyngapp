import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SportTab {
  id: string;
  label: string;
}

/** Leaderboard sport tabs — rounded-lg pills per Figma LeaderboardScreen. */
@Component({
  selector: 'app-sport-tabs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="sport-tabs">
      <button
        type="button"
        *ngFor="let tab of tabs"
        class="sport-tab"
        [class.active]="value === tab.id"
        (click)="select(tab.id)"
      >
        {{ tab.label }}
      </button>
    </div>
  `,
  styles: [
    `
      .sport-tabs {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: none;
      }

      .sport-tabs::-webkit-scrollbar {
        display: none;
      }

      .sport-tab {
        min-height: 36px;
        padding: 8px 14px;
        border-radius: var(--app-radius-sm);
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        flex-shrink: 0;
        background: var(--app-surface);
        color: var(--app-foreground-secondary);
        border: 1px solid var(--app-border-subtle);
        min-height: unset;
        transition: background var(--app-motion-fast) ease, color var(--app-motion-fast) ease, border-color var(--app-motion-fast) ease, transform var(--app-motion-fast) var(--app-motion-ease);
      }

      .sport-tab.active {
        background: var(--app-primary);
        color: var(--app-foreground);
        border-color: rgba(var(--app-primary-rgb), 0.5);
        box-shadow: 0 3px 10px rgba(var(--app-primary-rgb), 0.2);
      }

      .sport-tab:active { transform: scale(0.97); }
    `,
  ],
})
export class SportTabsComponent {
  @Input() tabs: SportTab[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  select(id: string) {
    this.value = id;
    this.valueChange.emit(id);
  }
}
