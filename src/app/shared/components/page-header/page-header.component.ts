import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

/**
 * Figma page header for tab sub-screens (My Bookings, Chats, etc.)
 * White sticky bar with title — no brand tyng bar.
 */
@Component({
  selector: 'app-page-header',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <header class="page-header">
      <div class="page-header-row" [class.with-actions]="showActions">
        <div class="title-wrap">
          <button
            *ngIf="showBack"
            type="button"
            class="back-btn"
            (click)="back.emit()"
          >
            <ion-icon name="chevron-back"></ion-icon>
          </button>
          <h1
            class="title"
            [class.title-md]="titleSize === 'md'"
            [class.title-spaced]="hasSubContent && !showActions"
          >{{ title }}</h1>
          <span *ngIf="badge" class="title-badge">{{ badge }}</span>
        </div>
        <div *ngIf="showActions" class="actions">
          <ng-content select="[actions]"></ng-content>
        </div>
      </div>
      <div *ngIf="hasSubContent" class="sub-content">
        <ng-content></ng-content>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-header {
        position: sticky;
        top: 0;
        z-index: 30;
        background: #ffffff;
        border-bottom: 1px solid #f3f4f6;
        padding-top: env(safe-area-inset-top, 0px);
      }

      .page-header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 20px 0;
      }

      .page-header-row.with-actions {
        padding-bottom: 12px;
      }

      .title-wrap {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .back-btn {
        width: 36px;
        height: 36px;
        min-height: unset;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: transparent;
        color: #111827;
        font-size: 22px;
        padding: 0;
        margin-left: -4px;
      }

      .back-btn:active {
        background: #f3f4f6;
      }

      .title {
        margin: 0;
        font-size: 26px;
        font-weight: 900;
        color: #111827;
        letter-spacing: -0.02em;
        line-height: 1.1;
      }

      .title.title-md {
        font-size: 24px;
      }

      .title.title-spaced {
        margin-bottom: 16px;
      }

      .title-badge {
        min-width: 22px;
        height: 22px;
        padding: 0 6px;
        border-radius: 999px;
        background: #ff7a00;
        color: #ffffff;
        font-size: 11px;
        font-weight: 900;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }

      .actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }

      .sub-content {
        padding: 0 20px 16px;
      }
    `,
  ],
})
export class PageHeaderComponent {
  @Input() title = '';
  /** lg = 26px (My Bookings), md = 24px (Chats) */
  @Input() titleSize: 'lg' | 'md' = 'lg';
  @Input() badge: number | null = null;
  @Input() showBack = false;
  @Input() showActions = false;
  @Input() hasSubContent = false;
  @Output() back = new EventEmitter<void>();
}
