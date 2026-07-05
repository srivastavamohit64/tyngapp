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
        padding: 8px 16px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
        flex-shrink: 0;
        background: #f3f4f6;
        color: #6b7280;
        border: none;
        min-height: unset;
        transition: background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;
      }

      .chip.active {
        background: #8cf000;
        color: #111827;
        box-shadow: 0 2px 8px rgba(140, 240, 0, 0.3);
      }

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
        background: #ff7a00;
        color: #ffffff;
      }

      .badge.badge-active {
        background: #111827;
        color: #ffffff;
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
