import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { IonicModule, MenuController } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../header/header.component';

/**
 * Wraps page content with the Figma brand top bar on primary tab routes.
 */
@Component({
  selector: 'app-brand-header-shell',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent],
  template: `
    <app-header
      *ngIf="showBrand"
      variant="brand"
      [notificationRoute]="resolvedNotificationRoute"
      [homeRoute]="resolvedHomeRoute"
      (menuClick)="openMenu()"
    ></app-header>
    <ng-content></ng-content>
  `,
})
export class BrandHeaderShellComponent {
  private readonly menu = inject(MenuController);
  private readonly auth = inject(AuthService);

  @Input() showBrand = true;
  @Input() notificationRoute?: string;

  get resolvedNotificationRoute(): string {
    if (this.notificationRoute) return this.notificationRoute;
    return this.auth.user()?.role === 'coach' ? '/app/coach/notifications' : '/app/notifications';
  }

  get resolvedHomeRoute(): string {
    const role = this.auth.user()?.role;
    if (role === 'coach') return '/app/coach/dashboard';
    if (role === 'venue') return '/app/home';
    return '/app/home';
  }

  async openMenu() {
    await this.menu.open();
  }
}
