import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [class.padded]="padded" [class.bordered]="bordered">
      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      .card {
        background: var(--app-surface);
        border: 1px solid var(--app-border-subtle);
        border-radius: var(--app-radius-card);
        box-shadow: var(--app-shadow-card);
        transition: transform var(--app-motion-fast) var(--app-motion-ease), box-shadow var(--app-motion-base) ease;
      }

      .card.padded {
        padding: 16px;
      }

      .card.bordered {
        border-color: var(--app-border);
        box-shadow: var(--app-shadow-xs);
      }
    `,
  ],
})
export class AppCardComponent {
  @Input() padded = true;
  @Input() bordered = false;
}
