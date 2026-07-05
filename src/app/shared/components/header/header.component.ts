import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';

export type AppHeaderVariant = 'brand' | 'page';

/**
 * Figma TopBar — brand: hamburger | tyng. | bell
 * Page header — back | title | optional end slot
 */
@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <header class="app-header" [class.page-variant]="variant === 'page'">
      <div class="app-header-inner">
        <!-- Brand: menu -->
        <button
          *ngIf="variant === 'brand'"
          type="button"
          class="hdr-btn"
          aria-label="Open menu"
          (click)="onMenu()"
        >
          <span class="hamburger">
            <span class="bar bar-1"></span>
            <span class="bar bar-2"></span>
            <span class="bar bar-3"></span>
          </span>
        </button>

        <!-- Page: back -->
        <button
          *ngIf="variant === 'page' && showBack"
          type="button"
          class="hdr-btn"
          aria-label="Go back"
          (click)="onBack()"
        >
          <ion-icon name="chevron-back" class="back-icon"></ion-icon>
        </button>

        <div *ngIf="variant === 'page' && !showBack" class="hdr-spacer"></div>

        <!-- Brand wordmark (absolutely centered) -->
        <button
          *ngIf="variant === 'brand'"
          type="button"
          class="brand"
          (click)="goHome()"
        >
          tyng<span class="dot">.</span>
        </button>

        <!-- Page title (absolutely centered) -->
        <div *ngIf="variant === 'page'" class="title-block">
          <h1 class="title">{{ title }}</h1>
          <p *ngIf="subtitle" class="subtitle">{{ subtitle }}</p>
        </div>

        <!-- Brand: notifications -->
        <button
          *ngIf="variant === 'brand' && showNotifications"
          type="button"
          class="hdr-btn bell"
          aria-label="Notifications"
          (click)="goNotifications()"
        >
          <ion-icon name="notifications-outline" class="bell-icon"></ion-icon>
          <span *ngIf="hasNotification" class="badge-dot"></span>
        </button>

        <!-- Page: end actions or spacer -->
        <div *ngIf="variant === 'page'" class="end-slot">
          <ng-content></ng-content>
          <div *ngIf="!hasProjectedEnd" class="hdr-spacer"></div>
        </div>

        <div *ngIf="variant === 'brand' && !showNotifications" class="hdr-spacer"></div>
      </div>
    </header>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .app-header {
        position: sticky;
        top: 0;
        z-index: 40;
        background: rgba(255, 255, 255, 0.97);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border-bottom: 1px solid #f3f4f6;
        padding-top: env(safe-area-inset-top, 0px);
      }

      .app-header-inner {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: space-between;
        height: 56px;
        padding: 0 20px;
      }

      .hdr-btn {
        position: relative;
        z-index: 2;
        width: 40px;
        height: 40px;
        min-height: unset;
        min-width: 40px;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: transparent;
        color: #111827;
        padding: 0;
        margin: 0;
        flex-shrink: 0;
      }

      .hdr-btn:active {
        transform: scale(0.88);
      }

      .hamburger {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        justify-content: center;
        gap: 5px;
        width: 20px;
      }

      .bar {
        display: block;
        height: 2.5px;
        background: #111827;
        border-radius: 999px;
      }

      .bar-1 {
        width: 20px;
      }

      .bar-2 {
        width: 14px;
      }

      .bar-3 {
        width: 17px;
      }

      .brand {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: 1;
        font-size: 22px;
        font-weight: 900;
        letter-spacing: -0.04em;
        color: #111827;
        background: transparent;
        min-height: unset;
        padding: 0;
        line-height: 1;
      }

      .brand:active {
        transform: translate(-50%, -50%) scale(0.94);
      }

      .brand .dot {
        color: #8cf000;
      }

      .bell-icon {
        font-size: 21px;
        color: #111827;
      }

      .badge-dot {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 8px;
        height: 8px;
        background: #ff7a00;
        border-radius: 50%;
        border: 1.5px solid #ffffff;
      }

      .back-icon {
        font-size: 24px;
        color: #111827;
      }

      .title-block {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        max-width: calc(100% - 120px);
        z-index: 1;
        pointer-events: none;
      }

      .title {
        margin: 0;
        font-size: 17px;
        font-weight: 700;
        color: #111827;
        line-height: 1.2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .subtitle {
        margin: 2px 0 0;
        font-size: 12px;
        font-weight: 500;
        color: #9ca3af;
        line-height: 1;
      }

      .hdr-spacer {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
      }

      .end-slot {
        position: relative;
        z-index: 2;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        min-width: 40px;
      }

      .page-variant .app-header-inner {
        /* same metrics */
      }
    `,
  ],
})
export class HeaderComponent {
  private readonly router = inject(Router);
  private readonly menu = inject(MenuController);

  @Input() variant: AppHeaderVariant = 'brand';
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showBack = false;
  @Input() showNotifications = true;
  @Input() hasNotification = true;
  @Input() notificationRoute = '/app/notifications';
  @Input() homeRoute = '/app/home';
  /** When true, end slot has projected content (avoids double spacer). */
  @Input() hasProjectedEnd = false;

  @Output() menuClick = new EventEmitter<void>();
  @Output() back = new EventEmitter<void>();

  async onMenu() {
    this.menuClick.emit();
    try {
      await this.menu.open();
    } catch {
      /* menu may be absent on some pages */
    }
  }

  onBack() {
    if (this.back.observed) {
      this.back.emit();
      return;
    }
    void this.router.navigateByUrl(this.homeRoute);
  }

  goHome() {
    void this.router.navigateByUrl(this.homeRoute);
  }

  goNotifications() {
    void this.router.navigateByUrl(this.notificationRoute);
  }
}
