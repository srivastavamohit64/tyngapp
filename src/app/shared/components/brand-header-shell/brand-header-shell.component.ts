import { CommonModule, Location } from '@angular/common';
import { Component, computed, EventEmitter, inject, Input, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { IonicModule, MenuController } from '@ionic/angular';
import { filter, map, startWith } from 'rxjs/operators';
import { isMainTabRoute } from '../../../core/constants/layout-routes';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../header/header.component';

/**
 * Wraps page content with the Figma top bar. Main tab routes get the menu button,
 * wordmark and bell; every other page gets a back button with the page title centred.
 */
@Component({
  selector: 'app-brand-header-shell',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent],
  host: {
    '[class.has-brand-chrome]': 'showBrand',
    class: 'brand-header-shell',
  },
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
  template: `
    <app-header
      *ngIf="showBrand"
      [variant]="isMainTab() ? headerVariant : 'page'"
      [title]="title"
      [showBack]="!isMainTab()"
      [notificationRoute]="resolvedNotificationRoute"
      [homeRoute]="resolvedHomeRoute"
      (menuClick)="openMenu()"
      (back)="goBack()"
    ></app-header>
    <ng-content></ng-content>
  `,
})
export class BrandHeaderShellComponent {
  private readonly menu = inject(MenuController);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  @Input() showBrand = true;
  /** Centred in the top bar on pages that show the back button. */
  @Input() title = '';
  @Input() notificationRoute?: string;
  /** When bound, the header back button emits here instead of navigating back. */
  @Output() back = new EventEmitter<void>();

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );

  readonly isMainTab = computed(() => isMainTabRoute(this.url(), this.auth.user()?.role));

  get headerVariant(): 'brand' | 'venue' {
    return this.auth.user()?.role === 'venue' ? 'venue' : 'brand';
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

  goBack(): void {
    if (this.back.observed) {
      this.back.emit();
      return;
    }
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl(this.resolvedHomeRoute);
  }
}
