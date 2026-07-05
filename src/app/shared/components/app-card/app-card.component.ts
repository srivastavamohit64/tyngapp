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
        background: #ffffff;
        border-radius: 20px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
      }

      .card.padded {
        padding: 16px;
      }

      .card.bordered {
        border: 1px solid #e5e7eb;
        box-shadow: none;
      }
    `,
  ],
})
export class AppCardComponent {
  @Input() padded = true;
  @Input() bordered = false;
}
