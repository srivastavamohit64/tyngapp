import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

/**
 * Skeleton for a horizontal row of cards (games, venues, coaches, events).
 * Set `full` for a single full-width card.
 */
@Component({
  selector: 'app-card-row-skeleton',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="skel-row" [class.full]="full" aria-busy="true" [attr.aria-label]="label">
      <div class="skel-card" *ngFor="let i of cards" [style.--card-w]="cardWidth">
        <ion-skeleton-text *ngIf="mediaHeight !== '0'" animated class="skel-media" [style.--media-h]="mediaHeight"></ion-skeleton-text>
        <div class="skel-body">
          <ion-skeleton-text animated class="skel-line" style="width: 70%"></ion-skeleton-text>
          <ion-skeleton-text *ngFor="let l of extraLines; let last = last" animated class="skel-line short" [style.width]="last ? '40%' : '55%'"></ion-skeleton-text>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .skel-row {
        display: flex; gap: 12px; overflow: hidden;
        padding: 2px 0 6px;
      }
      .skel-card {
        flex: 0 0 var(--card-w, 240px);
        border-radius: 22px; overflow: hidden;
        background: #fff; border: 1px solid #eef0f3;
        box-shadow: 0 6px 18px rgba(17, 24, 39, 0.06);
      }
      .skel-row.full .skel-card { flex: 1 1 100%; }
      .skel-media {
        display: block; margin: 0; width: 100%;
        height: var(--media-h, 120px); border-radius: 0;
        --background: #eef0f3;
      }
      .skel-body { padding: 12px 14px 14px; display: flex; flex-direction: column; gap: 8px; }
      .skel-line { display: block; margin: 0; height: 12px; border-radius: 999px; }
      .skel-line.short { height: 10px; }
    `,
  ],
})
export class CardRowSkeletonComponent {
  @Input() count = 3;
  @Input() cardWidth = '240px';
  @Input() mediaHeight = '120px';
  @Input() lines = 3;
  @Input() full = false;
  @Input() label = 'Loading';

  get cards(): number[] {
    const n = this.full ? 1 : Math.max(1, Math.min(this.count, 6));
    return Array.from({ length: n }, (_, i) => i);
  }

  get extraLines(): number[] {
    return Array.from({ length: Math.max(0, this.lines - 1) }, (_, i) => i);
  }
}
