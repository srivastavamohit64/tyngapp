import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface SegmentOption {
  id: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-segment-control',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="segment-track">
      <div class="segment-pill" [ngStyle]="pillStyle"></div>
      <button
        type="button"
        *ngFor="let option of options; let i = index"
        class="segment-btn"
        [class.active]="value === option.id"
        (click)="select(option.id)"
      >
        {{ option.label }}
        <span
          *ngIf="option.count"
          class="seg-count"
          [class.seg-count--active]="value === option.id"
        >{{ option.count }}</span>
      </button>
    </div>
  `,
  styles: [
    `
      .segment-track {
        position: relative;
        display: flex;
        background: var(--app-muted);
        padding: 4px;
        border-radius: var(--app-radius-md);
      }

      .segment-pill {
        position: absolute;
        top: 4px;
        bottom: 4px;
        left: 4px;
        width: calc(50% - 4px);
        background: var(--app-surface);
        border-radius: var(--app-radius-sm);
        box-shadow: var(--app-shadow-sm);
        transition: transform var(--app-motion-slow) var(--app-motion-ease);
        pointer-events: none;
      }

      .segment-btn {
        flex: 1;
        position: relative;
        z-index: 1;
        padding: 10px 8px;
        background: transparent;
        border: none;
        font-size: 14px;
        font-weight: 700;
        color: var(--app-foreground-muted);
        min-height: unset;
        transition: color var(--app-motion-base) ease;
      }

      .segment-btn.active {
        color: var(--app-foreground);
      }

      .seg-count {
        margin-left: 4px;
        font-size: 9px;
        font-weight: 900;
        padding: 2px 6px;
        border-radius: 999px;
        background: var(--app-border);
        color: var(--app-foreground-muted);
      }

      .seg-count--active {
        background: var(--app-primary);
        color: var(--app-foreground);
      }
    `,
  ],
})
export class SegmentControlComponent {
  @Input() options: SegmentOption[] = [];
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  get pillStyle(): Record<string, string> {
    const count = this.options.length || 1;
    const index = Math.max(0, this.options.findIndex((o) => o.id === this.value));
    return {
      left: index === 0 ? '4px' : `${(100 / count) * index}%`,
      width: `calc(${100 / count}% - 4px)`,
    };
  }

  select(id: string) {
    this.value = id;
    this.valueChange.emit(id);
  }
}
