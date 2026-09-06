import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { SkeletonListComponent } from './skeleton-list.component';

export type PageSkeletonVariant =
  | 'wallet'
  | 'dashboard'
  | 'list'
  | 'cards'
  | 'profile'
  | 'detail'
  | 'notifications'
  | 'chat';

/**
 * Page-level Ionic skeleton that mirrors common TYNG layouts.
 * Keep the real page header outside this component whenever possible.
 */
@Component({
  selector: 'app-page-skeleton',
  standalone: true,
  imports: [CommonModule, IonicModule, SkeletonListComponent],
  template: `
    <div class="page-skel" [attr.data-variant]="variant" aria-busy="true" [attr.aria-label]="label">
      <ng-container [ngSwitch]="variant">
        <ng-container *ngSwitchCase="'wallet'">
          <div class="dark-card">
            <ion-skeleton-text animated class="line" style="width: 28%"></ion-skeleton-text>
            <ion-skeleton-text animated class="hero" style="width: 42%"></ion-skeleton-text>
            <div class="stat-grid three">
              <ion-skeleton-text animated class="stat" *ngFor="let i of [1,2,3]"></ion-skeleton-text>
            </div>
            <ion-skeleton-text animated class="btn"></ion-skeleton-text>
          </div>
          <div class="dark-card warm">
            <ion-skeleton-text animated class="line" style="width: 34%"></ion-skeleton-text>
            <ion-skeleton-text animated class="hero" style="width: 48%"></ion-skeleton-text>
            <div class="stat-grid two">
              <ion-skeleton-text animated class="stat" *ngFor="let i of [1,2]"></ion-skeleton-text>
            </div>
          </div>
          <div class="dark-card warm">
            <ion-skeleton-text animated class="line" style="width: 30%"></ion-skeleton-text>
            <ion-skeleton-text animated class="hero sm" style="width: 26%"></ion-skeleton-text>
            <div class="stat-grid two">
              <ion-skeleton-text animated class="stat tall" *ngFor="let i of [1,2]"></ion-skeleton-text>
            </div>
          </div>
        </ng-container>

        <ng-container *ngSwitchCase="'dashboard'">
          <div class="dark-card">
            <ion-skeleton-text animated class="line" style="width: 30%"></ion-skeleton-text>
            <div class="stat-grid two">
              <ion-skeleton-text animated class="stat tall" *ngFor="let i of [1,2,3,4]"></ion-skeleton-text>
            </div>
            <ion-skeleton-text animated class="bar"></ion-skeleton-text>
          </div>
          <div class="stat-grid two">
            <ion-skeleton-text animated class="card-block" *ngFor="let i of [1,2,3,4]"></ion-skeleton-text>
          </div>
          <app-skeleton-list [count]="3"></app-skeleton-list>
        </ng-container>

        <ng-container *ngSwitchCase="'cards'">
          <div class="stat-grid two">
            <ion-skeleton-text animated class="card-block" *ngFor="let i of cardRows"></ion-skeleton-text>
          </div>
        </ng-container>

        <ng-container *ngSwitchCase="'profile'">
          <div class="profile-head">
            <ion-skeleton-text animated class="avatar-lg"></ion-skeleton-text>
            <div class="profile-meta">
              <ion-skeleton-text animated class="line" style="width: 50%"></ion-skeleton-text>
              <ion-skeleton-text animated class="line short" style="width: 35%"></ion-skeleton-text>
            </div>
          </div>
          <ion-skeleton-text animated class="card-block flat" *ngFor="let i of [1,2,3]"></ion-skeleton-text>
        </ng-container>

        <ng-container *ngSwitchCase="'detail'">
          <ion-skeleton-text animated class="hero-banner"></ion-skeleton-text>
          <div class="pad">
            <ion-skeleton-text animated class="line" style="width: 55%"></ion-skeleton-text>
            <ion-skeleton-text animated class="line short" style="width: 40%"></ion-skeleton-text>
            <ion-skeleton-text animated class="card-block flat"></ion-skeleton-text>
            <ion-skeleton-text animated class="card-block flat"></ion-skeleton-text>
          </div>
        </ng-container>

        <ng-container *ngSwitchCase="'notifications'">
          <div class="chip-row">
            <ion-skeleton-text animated class="chip" *ngFor="let i of [1,2,3,4]"></ion-skeleton-text>
          </div>
          <app-skeleton-list [count]="count"></app-skeleton-list>
        </ng-container>

        <ng-container *ngSwitchCase="'chat'">
          <div class="chat-bubbles">
            <ion-skeleton-text animated class="bubble left"></ion-skeleton-text>
            <ion-skeleton-text animated class="bubble right"></ion-skeleton-text>
            <ion-skeleton-text animated class="bubble left short"></ion-skeleton-text>
            <ion-skeleton-text animated class="bubble right"></ion-skeleton-text>
          </div>
        </ng-container>

        <ng-container *ngSwitchDefault>
          <app-skeleton-list [count]="count"></app-skeleton-list>
        </ng-container>
      </ng-container>
    </div>
  `,
  styles: [
    `
      :host { display: block; width: 100%; }
      .page-skel {
        display: flex; flex-direction: column; gap: 14px;
        padding: 8px 0 16px;
      }
      .dark-card {
        border-radius: 24px; padding: 16px;
        background: linear-gradient(160deg, #111827 0%, #1e293b 70%);
      }
      .dark-card.warm {
        background: linear-gradient(135deg, #111827 0%, #1f2937 55%, #7c2d12 145%);
      }
      .line, .hero, .btn, .bar, .stat, .card-block, .avatar-lg, .hero-banner, .chip, .bubble {
        display: block; margin: 0; border-radius: 999px;
      }
      .line { height: 12px; margin-bottom: 10px; --background: rgba(255,255,255,.14); }
      .line.short { height: 10px; margin-bottom: 0; }
      .hero { height: 28px; margin: 4px 0 14px; --background: rgba(255,255,255,.18); }
      .hero.sm { height: 22px; }
      .btn { height: 44px; border-radius: 12px; margin-top: 10px; --background: rgba(255,255,255,.12); }
      .bar { height: 8px; margin-top: 12px; --background: rgba(255,255,255,.12); }
      .stat-grid { display: grid; gap: 8px; }
      .stat-grid.two { grid-template-columns: 1fr 1fr; }
      .stat-grid.three { grid-template-columns: 1fr 1fr 1fr; }
      .stat {
        height: 54px; border-radius: 12px; margin: 0;
        --background: rgba(255,255,255,.08);
      }
      .stat.tall { height: 78px; border-radius: 16px; }
      .card-block {
        height: 96px; border-radius: 18px; margin: 0;
        --background: #eef0f3;
      }
      .card-block.flat {
        height: 72px; margin-bottom: 10px; --background: #eef0f3;
      }
      .profile-head {
        display: flex; align-items: center; gap: 14px;
        padding: 8px 0 6px;
      }
      .avatar-lg {
        width: 72px; height: 72px; border-radius: 24px; flex-shrink: 0;
        --background: #e5e7eb;
      }
      .profile-meta { flex: 1; display: flex; flex-direction: column; gap: 10px; }
      .profile-meta .line { --background: #e5e7eb; margin: 0; }
      .hero-banner {
        width: 100%; height: 210px; border-radius: 0;
        --background: #e5e7eb;
      }
      .pad { padding: 16px; display: flex; flex-direction: column; gap: 10px; }
      .pad .line { --background: #e5e7eb; margin: 0; }
      .chip-row { display: flex; gap: 8px; overflow: hidden; padding: 0 0 4px; }
      .chip { width: 84px; height: 34px; border-radius: 999px; flex-shrink: 0; --background: #e5e7eb; }
      .chat-bubbles { display: flex; flex-direction: column; gap: 12px; padding: 8px 0; }
      .bubble {
        width: 68%; height: 54px; border-radius: 18px;
        --background: #e5e7eb;
      }
      .bubble.left { align-self: flex-start; }
      .bubble.right { align-self: flex-end; width: 58%; }
      .bubble.short { width: 46%; height: 40px; }

      .page-skel[data-variant='list'] ,
      .page-skel[data-variant='notifications'] ,
      .page-skel[data-variant='cards'] ,
      .page-skel[data-variant='profile'] ,
      .page-skel[data-variant='detail'] ,
      .page-skel[data-variant='chat'] {
        padding-left: 0;
        padding-right: 0;
      }
    `,
  ],
})
export class PageSkeletonComponent {
  @Input() variant: PageSkeletonVariant = 'list';
  @Input() count = 4;
  @Input() label = 'Loading content';

  get cardRows(): number[] {
    const n = Math.max(2, Math.min(this.count, 6));
    return Array.from({ length: n }, (_, i) => i + 1);
  }
}
