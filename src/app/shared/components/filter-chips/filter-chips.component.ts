import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface FilterChip {
  id: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-filter-chips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chips-row">
      <button
        type="button"
        *ngFor="let chip of chips"
        class="chip"
        [class.active]="value === chip.id"
        (click)="select(chip.id)"
      >
        {{ chip.label }}
        <span *ngIf="chip.count" class="badge" [class.badge-active]="value === chip.id">
          {{ chip.count }}
        </span>
      </button>
    </div>
  `,
  styles: [
    `
      .chips-row {
        display: flex;
        gap: 8px;
        overflow-x: auto;
        padding-bottom: 4px;
        scrollbar-width: none;
      }

      .chips-row::-webkit-scrollbar {
        display: none;
      }

      .chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 36px;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
        background: var(--app-muted);
        color: var(--app-foreground-secondary);
        border: 1px solid transparent;
        min-height: unset;
        transition: background var(--app-motion-fast) ease, color var(--app-motion-fast) ease, border-color var(--app-motion-fast) ease, box-shadow var(--app-motion-fast) ease, transform var(--app-motion-fast) var(--app-motion-ease);
      }

      .chip.active {
        background: var(--app-primary);
        color: var(--app-foreground);
        border-color: rgba(var(--app-primary-rgb), 0.5);
        box-shadow: 0 3px 10px rgba(var(--app-primary-rgb), 0.25);
      }

      .chip:active { transform: scale(0.97); }

      .badge {
        min-width: 16px;
        height: 16px;
        padding: 0 4px;
        border-radius: 999px;
        font-size: 9px;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--app-secondary);
        color: var(--app-foreground);
      }

      .badge.badge-active {
        background: var(--app-foreground);
        color: var(--app-surface);
      }
    `,
  ],
})
export class FilterChipsComponent {
  @Input() chips: FilterChip[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  select(id: string) {
    this.value = id;
    this.valueChange.emit(id);
  }
}
