import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-primary-button',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <button
      type="button"
      class="btn"
      [class.secondary]="variant === 'secondary'"
      [class.outline]="variant === 'outline'"
      [class.block]="block"
      [disabled]="disabled"
      (click)="pressed.emit($event)"
    >
      <ng-content></ng-content>
      <ion-icon *ngIf="icon" [name]="icon" class="btn-icon"></ion-icon>
    </button>
  `,
  styles: [
    `
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: var(--app-control-height-lg);
        padding: 0 20px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 700;
        background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-to) 100%);
        color: var(--app-button-contrast);
        box-shadow: 0 6px 18px rgba(var(--app-primary-rgb), 0.28);
        transition: transform var(--app-motion-fast) var(--app-motion-ease), box-shadow var(--app-motion-base) ease, filter var(--app-motion-fast) ease;
      }

      .btn.block {
        width: 100%;
      }

      .btn:active:not(:disabled) {
        transform: translateY(1px) scale(0.985);
        box-shadow: 0 2px 8px rgba(var(--app-primary-rgb), 0.24);
      }

      .btn:disabled {
        background: var(--app-muted);
        color: var(--app-foreground-muted);
        box-shadow: none;
      }

      .btn.secondary {
        background: linear-gradient(135deg, #ff7a00 0%, #ff9a40 100%);
        color: var(--app-foreground);
        box-shadow: 0 6px 18px rgba(var(--app-secondary-rgb), 0.27);
      }

      .btn.secondary:disabled {
        background: var(--app-muted);
        color: var(--app-foreground-muted);
        box-shadow: none;
      }

      .btn.outline {
        background: var(--app-surface);
        color: var(--app-foreground);
        border: 1.5px solid var(--app-border-strong);
        box-shadow: none;
      }

      .btn.outline:active:not(:disabled) {
        background: var(--app-surface-subtle);
      }

      .btn-icon {
        font-size: 18px;
      }
    `,
  ],
})
export class PrimaryButtonComponent {
  @Input() variant: 'primary' | 'secondary' | 'outline' = 'primary';
  @Input() block = true;
  @Input() disabled = false;
  @Input() icon = '';
  @Output() pressed = new EventEmitter<Event>();
}
