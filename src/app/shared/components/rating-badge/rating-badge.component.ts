import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-rating-badge',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="rating-badge" [class.rating-badge--pill]="pill">
      <ion-icon name="star" class="star-icon"></ion-icon>
      <span class="rating-val">{{ rating }}</span>
      <span *ngIf="count !== null" class="rating-count">({{ count }})</span>
    </div>
  `,
  styles: [
    `
      .rating-badge {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        line-height: 1;
      }

      .rating-badge--pill {
        background: var(--app-surface);
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid var(--app-border-subtle);
        box-shadow: var(--app-shadow-xs);
      }

      .star-icon {
        color: #f59e0b;
        font-size: 13px;
      }

      .rating-badge--pill .star-icon {
        font-size: 15px;
      }

      .rating-val {
        font-size: 13px;
        font-weight: 700;
        color: var(--app-foreground);
      }

      .rating-count {
        font-size: 11px;
        color: var(--app-foreground-muted);
        font-weight: 500;
      }
    `,
  ],
})
export class RatingBadgeComponent {
  @Input() rating: number = 0.0;
  @Input() count: number | null = null;
  @Input() pill: boolean = false;
}
