import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { NavController } from '@ionic/angular';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { TabItem } from '../../shared/models/app.models';

/**
 * Bottom-tab switches must replace the current tab content in-place
 * (Ionic navigateRoot, no page animation). Detail routes still use
 * normal stack navigation.
 */
@Injectable({ providedIn: 'root' })
export class TabSwitchService {
  private readonly router = inject(Router);
  private readonly navCtrl = inject(NavController);

  readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => this.normalize(e.urlAfterRedirects)),
      startWith(this.normalize(this.router.url)),
    ),
    { initialValue: this.normalize(this.router.url) },
  );

  async openTab(route: string): Promise<void> {
    const target = this.normalize(route);
    const current = this.normalize(this.router.url);
    if (current === target) {
      return;
    }

    await this.navCtrl.navigateRoot(target, {
      animated: false,
      replaceUrl: true,
    });
  }

  isActive(tab: TabItem, tabs: TabItem[]): boolean {
    const url = this.url();
    const winner = this.activeTab(tabs, url);
    return !!winner && winner.route === tab.route;
  }

  activeTab(tabs: TabItem[], url = this.url()): TabItem | null {
    let best: { tab: TabItem; score: number } | null = null;
    for (const tab of tabs) {
      const score = this.matchScore(url, tab.route);
      if (score <= 0) continue;
      if (!best || score > best.score) {
        best = { tab, score };
      }
    }
    return best?.tab ?? null;
  }

  private matchScore(url: string, route: string): number {
    const candidates = this.aliases(route);
    let best = 0;
    for (const candidate of candidates) {
      if (url === candidate) {
        best = Math.max(best, 10_000 + candidate.length);
        continue;
      }
      if (url.startsWith(`${candidate}/`)) {
        best = Math.max(best, candidate.length);
      }
    }
    return best;
  }

  private aliases(route: string): string[] {
    const extra: Record<string, string[]> = {
      '/app/home': ['/app/coach/dashboard', '/app/venue/dashboard'],
      '/app/coach/dashboard': ['/app/home'],
      '/app/venue/dashboard': ['/app/home'],
      '/app/chat': ['/app/coach/chat'],
      '/app/coach/chat': ['/app/chat'],
      '/app/coach/schedule': ['/app/schedule'],
      '/app/schedule': ['/app/coach/schedule'],
    };
    return [route, ...(extra[route] || [])];
  }

  private normalize(url: string): string {
    return (url || '').split('?')[0].split('#')[0];
  }
}
