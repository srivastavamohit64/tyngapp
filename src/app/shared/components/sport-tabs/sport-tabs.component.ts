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
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: 600;
        white-space: nowrap;
        flex-shrink: 0;
        background: #ffffff;
        color: #6b7280;
        border: none;
        min-height: unset;
        transition: background 0.15s ease, color 0.15s ease;
      }

      .sport-tab.active {
        background: #8cf000;
        color: #111827;
      }
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
