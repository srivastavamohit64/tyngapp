import { Injectable, inject } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationExtras, NavigationStart, Router } from '@angular/router';
import { NavController } from '@ionic/angular';

/**
 * Back buttons return to the screen the user came from. The fallback route is only
 * used when there is no earlier in-app screen (for example the app was opened on a deep link).
 */
@Injectable({ providedIn: 'root' })
export class BackNavigationService {
  private readonly router = inject(Router);
  private readonly nav = inject(NavController);

  /** In-app history entries behind the current screen. */
  private depth = 0;
  private started = false;
  private pendingPop = false;
  private pendingKeepsEntry = false;

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        const extras = this.router.getCurrentNavigation()?.extras;
        this.pendingPop = event.navigationTrigger === 'popstate';
        this.pendingKeepsEntry = !!extras?.replaceUrl || !!extras?.skipLocationChange;
        return;
      }
      if (event instanceof NavigationEnd) {
        if (!this.started) {
          this.started = true;
        } else if (this.pendingPop) {
          this.depth = Math.max(0, this.depth - 1);
        } else if (!this.pendingKeepsEntry) {
          this.depth += 1;
        }
        this.pendingPop = false;
        this.pendingKeepsEntry = false;
        return;
      }
      if (event instanceof NavigationCancel || event instanceof NavigationError) {
        this.pendingPop = false;
        this.pendingKeepsEntry = false;
      }
    });
  }

  canGoBack(): boolean {
    return this.depth > 0;
  }

  back(fallback: string, extras?: NavigationExtras): void {
    if (this.canGoBack()) {
      this.nav.back();
      return;
    }
    void this.nav.navigateBack(fallback, extras);
  }
}
