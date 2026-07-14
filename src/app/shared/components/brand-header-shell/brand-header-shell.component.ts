import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { IonicModule, MenuController } from '@ionic/angular';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../header/header.component';

/**
 * Wraps page content with the Figma top bar on primary tab routes.
 */
@Component({
  selector: 'app-brand-header-shell',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent],
  template: `
    <app-header
      *ngIf="showBrand"
      [variant]="headerVariant"
      [venueName]="venueDisplayName"
      [venueGreeting]="venueGreetingText"
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

  get headerVariant(): 'brand' | 'venue' {
    return this.auth.user()?.role === 'venue' ? 'venue' : 'brand';
  }

  get venueDisplayName(): string {
    return this.auth.user()?.name?.trim() || 'Phoenix Arena';
  }

  get venueGreetingText(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }

  get resolvedNotificationRoute(): string {
    if (this.notificationRoute) return this.notificationRoute;
    const role = this.auth.user()?.role;
    if (role === 'coach') return '/app/coach/notifications';
    if (role === 'venue') return '/app/venue/notifications';
    return '/app/notifications';
  }

  get resolvedHomeRoute(): string {
    const role = this.auth.user()?.role;
    if (role === 'coach') return '/app/coach/dashboard';
    if (role === 'venue') return '/app/venue/dashboard';
    return '/app/home';
  }

  async openMenu() {
    await this.menu.open();
  }
}
