import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  template: `
    <div class="filter-row">
      <button
        type="button"
        *ngFor="let option of options"
        class="filter-option"
        [class.active]="selected === option"
        (click)="selectedChange.emit(option)"
      >
        {{ option | titlecase }}
      </button>
    </div>
  `,
  styles: [
    `
      .filter-row { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none; }
      .filter-row::-webkit-scrollbar { display: none; }
      .filter-option {
        min-height: 36px;
        padding: 8px 14px;
        flex: 0 0 auto;
        white-space: nowrap;
        border: 1px solid var(--app-border-subtle);
        border-radius: var(--app-radius-sm);
        background: var(--app-surface);
        color: var(--app-foreground-secondary);
        font-size: 14px;
        font-weight: 700;
        transition: transform var(--app-motion-fast) var(--app-motion-ease), background var(--app-motion-fast) ease, border-color var(--app-motion-fast) ease;
      }
      .filter-option.active { background: var(--app-primary); border-color: rgba(var(--app-primary-rgb), .5); color: var(--app-foreground); box-shadow: 0 3px 10px rgba(var(--app-primary-rgb), .2); }
      .filter-option:active { transform: scale(.97); }
    `,
  ],
})
export class FilterComponent {
  @Input() options: string[] = [];
  @Input() selected = '';
  @Output() selectedChange = new EventEmitter<string>();
}
