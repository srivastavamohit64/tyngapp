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
        padding: 44px 24px;
        color: var(--app-foreground-secondary);
      }

      .emoji {
        font-size: 48px;
        margin-bottom: 14px;
        width: 72px;
        height: 72px;
        display: grid;
        place-items: center;
        border-radius: var(--app-radius-lg);
        background: var(--app-surface-subtle);
        border: 1px solid var(--app-border-subtle);
      }

      h3 {
        margin: 0 0 8px;
        font-size: 18px;
        font-weight: 700;
        color: var(--app-foreground);
      }

      p {
        margin: 0 0 20px;
        font-size: 14px;
        color: var(--app-foreground-secondary);
        max-width: 280px;
        line-height: 1.5;
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
