import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  color?: string;
}

@Component({
  selector: 'app-quick-action-chips',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="quick-actions-row">
      <button
        type="button"
        *ngFor="let action of actions"
        class="quick-action-chip"
        [style.backgroundColor]="action.color || 'var(--app-muted)'"
        (click)="actionClick.emit(action)"
      >
        <span class="chip-icon" aria-hidden="true">{{ action.icon }}</span>
        <span class="chip-label">{{ action.label }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      .quick-actions-row {
        display: flex;
        gap: 8px;
        padding: 12px 16px 8px;
        overflow-x: auto;
        scrollbar-width: none;
      }

      .quick-actions-row::-webkit-scrollbar {
        display: none;
      }

      .quick-action-chip {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 38px;
        padding: 8px 14px;
        border-radius: var(--app-radius-md);
        border: 1px solid var(--app-border-subtle);
        background: var(--app-muted);
        color: var(--app-foreground-secondary);
        font-size: 12px;
        font-weight: 600;
        line-height: 1.25;
        white-space: nowrap;
        flex-shrink: 0;
        min-height: unset;
        min-width: unset;
        width: auto;
        max-width: none;
        overflow: visible;
        box-sizing: border-box;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
        transition: transform var(--app-motion-fast) var(--app-motion-ease), box-shadow var(--app-motion-fast) ease, border-color var(--app-motion-fast) ease;
      }

      .quick-action-chip:active {
        transform: translateY(1px) scale(0.98);
        box-shadow: var(--app-shadow-xs);
      }

      .chip-icon {
        flex-shrink: 0;
        font-size: 14px;
        line-height: 1;
      }

      .chip-label {
        flex-shrink: 0;
      }
    `,
  ],
})
export class QuickActionChipsComponent {
  @Input() actions: QuickAction[] = [];
  @Output() actionClick = new EventEmitter<QuickAction>();
}
