import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';

/**
 * Reusable list-row skeletons using Ionic ion-skeleton-text.
 */
@Component({
  selector: 'app-skeleton-list',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="skel-list" [attr.aria-busy]="true" aria-label="Loading list">
      <div class="skel-row" *ngFor="let i of rows">
        <ion-skeleton-text animated class="skel-avatar" [style.--w]="avatarSize" [style.--h]="avatarSize"></ion-skeleton-text>
        <div class="skel-body">
          <ion-skeleton-text animated class="skel-line" style="width: 55%"></ion-skeleton-text>
          <ion-skeleton-text animated class="skel-line short" style="width: 38%"></ion-skeleton-text>
        </div>
        <ion-skeleton-text animated class="skel-trail" style="width: 18%"></ion-skeleton-text>
      </div>
    </div>
  `,
  styles: [
    `
      :host { display: block; }
      .skel-list { display: flex; flex-direction: column; gap: 10px; }
      .skel-row {
        display: flex; align-items: center; gap: 12px;
        padding: 12px; border-radius: 18px;
        background: #fff; border: 1px solid #eef0f3;
      }
      .skel-avatar {
        flex-shrink: 0; margin: 0;
        width: var(--w, 40px); height: var(--h, 40px);
        border-radius: 14px;
      }
      .skel-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
      .skel-line { height: 12px; border-radius: 999px; margin: 0; }
      .skel-line.short { height: 10px; }
      .skel-trail { height: 14px; border-radius: 999px; margin: 0; flex-shrink: 0; }
    `,
  ],
})
export class SkeletonListComponent {
  @Input() count = 4;
  @Input() avatarSize = '40px';

  get rows(): number[] {
    return Array.from({ length: Math.max(1, Math.min(this.count, 8)) }, (_, i) => i + 1);
  }
}
