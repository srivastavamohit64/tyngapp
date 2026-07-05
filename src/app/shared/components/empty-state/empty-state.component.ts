import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { PrimaryButtonComponent } from '../primary-button/primary-button.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, PrimaryButtonComponent],
  template: `
    <div class="empty">
      <div class="emoji" *ngIf="emoji">{{ emoji }}</div>
      <h3>{{ title }}</h3>
      <p *ngIf="message">{{ message }}</p>
      <app-primary-button *ngIf="actionLabel" [block]="false" (pressed)="action.emit()">
        {{ actionLabel }}
      </app-primary-button>
    </div>
  `,
  styles: [
    `
      .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 48px 24px;
      }

      .emoji {
        font-size: 48px;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 700;
        color: #111827;
      }

      p {
        margin: 0 0 20px;
        font-size: 14px;
        color: #6b7280;
        max-width: 280px;
      }
    `,
  ],
})
export class EmptyStateComponent {
  @Input() emoji = '📭';
  @Input() title = 'Nothing here yet';
  @Input() message = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}
