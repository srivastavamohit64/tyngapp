import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sports-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="sport-badge">
      <span *ngIf="emoji">{{ emoji }}</span>
      {{ label }}
    </span>
  `,
  styles: [
    `
      .sport-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        border: 1px solid rgba(var(--app-primary-rgb), .34);
        border-radius: 999px;
        padding: 5px 10px;
        background: rgba(var(--app-primary-rgb), .12);
        color: var(--app-primary-ink);
        font-size: 12px;
        font-weight: 700;
        line-height: 1.2;
      }
    `,
  ],
})
export class SportsBadgeComponent {
  @Input() label = '';
  @Input() emoji = '';
}
