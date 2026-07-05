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
        min-height: 52px;
        padding: 0 20px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 700;
        background: linear-gradient(135deg, #8cf000 0%, #a3e635 100%);
        color: #111827;
        box-shadow: 0 4px 20px rgba(140, 240, 0, 0.35);
        transition: transform 0.12s ease, opacity 0.12s ease;
      }

      .btn.block {
        width: 100%;
      }

      .btn:active:not(:disabled) {
        transform: scale(0.97);
      }

      .btn:disabled {
        background: #f3f4f6;
        color: #9ca3af;
        box-shadow: none;
      }

      .btn.secondary {
        background: linear-gradient(135deg, #ff7a00 0%, #ff9a40 100%);
        color: #ffffff;
        box-shadow: 0 4px 20px rgba(255, 122, 0, 0.3);
      }

      .btn.secondary:disabled {
        background: #f3f4f6;
        color: #9ca3af;
        box-shadow: none;
      }

      .btn.outline {
        background: #ffffff;
        color: #111827;
        border: 1.5px solid #e5e7eb;
        box-shadow: none;
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
