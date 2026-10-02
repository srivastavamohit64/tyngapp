import { CommonModule, Location } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { XpService } from '../../core/services/xp.service';
import { BadgeCatalog, BadgeItem, badgeVisual } from '../../shared/badge-visuals';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
type BadgeFilter = 'all' | 'earned' | 'locked';

@Component({
  selector: 'app-badges-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  template: `
    <ion-content fullscreen>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content pullingText="Pull to refresh"></ion-refresher-content>
      </ion-refresher>

      <app-brand-header-shell title="Badges" (back)="goBack()">
        <main class="badges-page">
          <div class="badges-content">
            <section class="badges-hero" *ngIf="catalog() as c; else heroSkel">
              <div class="hero-top">
                <div>
                  <p class="hero-eyebrow">{{ c.audience === 'coach' ? 'COACH BADGES' : 'PLAYER BADGES' }}</p>
                  <p class="hero-count">{{ c.earned }} <small>/ {{ c.total }}</small></p>
                  <p class="hero-sub">badges unlocked<ng-container *ngIf="c.secret"> · {{ c.secret }} secret still hidden</ng-container></p>
                </div>
                <span class="hero-medal"><ion-icon name="ribbon"></ion-icon></span>
              </div>
              <div class="hero-track"><span [style.width.%]="overallPct()"></span></div>
              <div class="hero-next" *ngIf="c.next as next">
                <span class="next-label">Closest next</span>
                <strong>{{ next.name }}</strong>
                <span class="next-progress">{{ next.current }} / {{ next.threshold }}</span>
              </div>
            </section>
            <ng-template #heroSkel>
              <section class="badges-hero badges-hero--skel" aria-busy="true" aria-label="Loading badges">
                <ion-skeleton-text animated class="skel-line skel-line--short"></ion-skeleton-text>
                <ion-skeleton-text animated class="skel-line skel-line--big"></ion-skeleton-text>
                <ion-skeleton-text animated class="skel-line"></ion-skeleton-text>
              </section>
            </ng-template>

            <section class="how-card">
              <ion-icon name="information-circle-outline"></ion-icon>
              <p>{{ howText() }}</p>
            </section>

            <nav class="filter-row" role="tablist" aria-label="Filter badges">
              <button *ngFor="let f of filters" type="button" role="tab" class="filter-chip"
                [class.active]="filter() === f.value" [attr.aria-selected]="filter() === f.value"
                (click)="filter.set(f.value)">
                {{ f.label }}<span *ngIf="catalog()"> {{ countFor(f.value) }}</span>
              </button>
            </nav>

            <div class="badge-grid" *ngIf="catalog(); else gridSkel">
              <article class="badge-card" *ngFor="let badge of visibleBadges(); trackBy: trackCode" [class.locked]="!badge.earned">
                <span class="badge-medal" [style.background]="visual(badge).bg" [style.color]="visual(badge).color">
                  <span class="badge-ring"></span>
                  <ion-icon [name]="visual(badge).icon"></ion-icon>
                  <span class="badge-lock" *ngIf="!badge.earned"><ion-icon name="lock-closed"></ion-icon></span>
                </span>
                <p class="badge-title">{{ badge.name | uppercase }}</p>
                <p class="badge-desc">{{ badge.description }}</p>
                <p class="badge-earned" *ngIf="badge.earned">Earned {{ badge.earnedAt | date: 'd MMM yyyy' }}</p>
                <div class="badge-progress" *ngIf="!badge.earned">
                  <div class="badge-track"><span [style.width.%]="badge.progressPct || 0"></span></div>
                  <p class="badge-count">{{ badge.current || 0 }} / {{ badge.threshold }}</p>
                  <p class="badge-hint" *ngIf="badge.hint">{{ badge.hint }}</p>
                </div>
              </article>

              <article class="badge-card secret-card" *ngIf="filter() !== 'earned' && (catalog()?.secret ?? 0) > 0">
                <span class="badge-medal secret-medal"><ion-icon name="help"></ion-icon></span>
                <p class="badge-title">{{ catalog()?.secret }} SECRET {{ catalog()?.secret === 1 ? 'BADGE' : 'BADGES' }}</p>
                <p class="badge-desc">Keep going. These reveal themselves once you unlock them.</p>
              </article>

              <p class="empty-note" *ngIf="!visibleBadges().length && filter() === 'earned'">No badges unlocked yet. Your first one is closer than you think.</p>
              <p class="empty-note" *ngIf="!catalog()?.items?.length">Badges are not available for this account type.</p>
            </div>
            <ng-template #gridSkel>
              <div class="badge-grid" *ngIf="!error(); else errorTpl">
                <article class="badge-card" *ngFor="let i of [1, 2, 3, 4]">
                  <ion-skeleton-text animated class="skel-medal"></ion-skeleton-text>
                  <ion-skeleton-text animated class="skel-line skel-line--short skel-center"></ion-skeleton-text>
                  <ion-skeleton-text animated class="skel-line skel-center"></ion-skeleton-text>
                </article>
              </div>
            </ng-template>
            <ng-template #errorTpl>
              <div class="error-box" role="alert">
                <p>{{ error() }}</p>
                <button type="button" (click)="load()">Try again</button>
              </div>
            </ng-template>
          </div>
        </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .badges-page { min-height: 100%; background: #f8fafc; padding-bottom: 32px; }
    .badges-content { padding: 14px 18px 24px; display: flex; flex-direction: column; gap: 14px; }

    .badges-hero {
      position: relative; overflow: hidden; padding: 20px; border-radius: 26px;
      background: #111827; color: #fff; box-shadow: 0 8px 28px rgba(17, 24, 39, 0.2);
    }
    .hero-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .hero-eyebrow { margin: 0; color: #8cf000; font-size: 10px; font-weight: 900; letter-spacing: .08em; }
    .hero-count { margin: 6px 0 0; font-size: 38px; font-weight: 900; line-height: 1; }
    .hero-count small { font-size: 18px; color: rgba(255,255,255,.6); }
    .hero-sub { margin: 4px 0 0; color: rgba(255,255,255,.7); font-size: 12px; }
    .hero-medal {
      display: grid; place-items: center; width: 54px; height: 54px; border-radius: 50%;
      background: rgba(140, 240, 0, .16); color: #8cf000; font-size: 26px;
    }
    .hero-track { margin-top: 16px; height: 6px; border-radius: 999px; background: rgba(255,255,255,.14); overflow: hidden; }
    .hero-track span { display: block; height: 100%; border-radius: inherit; background: #8cf000; }
    .hero-next {
      margin-top: 14px; display: flex; align-items: center; gap: 8px; padding: 10px 12px;
      border-radius: 16px; background: rgba(255,255,255,.08); font-size: 12px;
    }
    .next-label { color: rgba(255,255,255,.6); }
    .hero-next strong { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .next-progress { color: #8cf000; font-weight: 900; }
    .badges-hero--skel { display: flex; flex-direction: column; gap: 10px; }
    .badges-hero--skel ion-skeleton-text { --background-rgb: 255, 255, 255; }

    .how-card {
      display: flex; gap: 10px; align-items: flex-start; padding: 12px 14px; border-radius: 18px;
      background: #fff; border: 1px solid #eef0f3; color: #6b7280; font-size: 12px; line-height: 1.45;
    }
    .how-card ion-icon { flex: 0 0 auto; margin-top: 1px; font-size: 18px; color: #16a34a; }
    .how-card p { margin: 0; }

    .filter-row { display: flex; gap: 8px; }
    .filter-chip {
      padding: 8px 14px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff;
      color: #374151; font-size: 12px; font-weight: 800;
    }
    .filter-chip.active { background: #111827; border-color: #111827; color: #fff; }

    .badge-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .badge-card {
      padding: 16px 12px; border: 1px solid #f0f1f3; border-radius: 24px; background: #fff;
      box-shadow: 0 5px 18px rgba(17, 24, 39, 0.07); text-align: center;
    }
    .badge-card.locked .badge-medal { filter: grayscale(1); opacity: .55; }
    .badge-medal {
      position: relative; display: grid; place-items: center; width: 58px; height: 58px; margin: 0 auto 12px;
      border: 5px solid #fff; border-radius: 50%; box-shadow: 0 4px 15px rgba(17, 24, 39, 0.12); font-size: 23px;
    }
    .badge-ring { position: absolute; inset: 4px; border: 1px solid currentColor; border-radius: 50%; opacity: .2; }
    .badge-lock {
      position: absolute; right: -6px; bottom: -6px; display: grid; place-items: center; width: 20px; height: 20px;
      border: 2px solid #fff; border-radius: 50%; background: #111827; color: #fff; font-size: 10px;
    }
    .badge-title { margin: 0; color: #111827; font-size: 11px; font-weight: 900; }
    .badge-desc { margin: 4px 0 0; color: #9ca3af; font-size: 10px; line-height: 1.35; }
    .badge-earned { margin: 6px 0 0; color: #16a34a; font-size: 10px; font-weight: 800; }
    .badge-progress { margin-top: 8px; }
    .badge-track { height: 5px; border-radius: 999px; background: #e5e7eb; overflow: hidden; }
    .badge-track span { display: block; height: 100%; border-radius: inherit; background: #8cf000; }
    .badge-count { margin: 4px 0 0; color: #111827; font-size: 10px; font-weight: 900; }
    .badge-hint { margin: 2px 0 0; color: #b45309; font-size: 9px; line-height: 1.3; }
    .secret-card { border-style: dashed; background: #fafafa; }
    .secret-medal { background: #111827; color: #8cf000; }
    .empty-note { grid-column: 1 / -1; margin: 8px 0; color: #6b7280; font-size: 13px; text-align: center; }

    .skel-line { display: block; height: 12px; width: 80%; margin: 0; border-radius: 999px; }
    .skel-line--short { width: 45%; }
    .skel-line--big { height: 34px; width: 35%; }
    .skel-center { margin: 8px auto 0; }
    .skel-medal { display: block; width: 58px; height: 58px; margin: 0 auto 6px; border-radius: 50%; }

    .error-box { padding: 18px; border-radius: 20px; background: #fff; text-align: center; color: #6b7280; font-size: 13px; }
    .error-box button {
      margin-top: 8px; padding: 8px 16px; border: 0; border-radius: 999px; background: #111827; color: #fff; font-weight: 800;
    }
  `],
})
export class BadgesPage {
  private readonly xp = inject(XpService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly location = inject(Location);

  readonly catalog = signal<BadgeCatalog | null>(null);
  readonly error = signal('');
  readonly filter = signal<BadgeFilter>('all');
  readonly filters: Array<{ value: BadgeFilter; label: string }> = [
    { value: 'all', label: 'All' },
    { value: 'earned', label: 'Earned' },
    { value: 'locked', label: 'Locked' },
  ];

  readonly visibleBadges = computed<BadgeItem[]>(() => {
    const items = this.catalog()?.items ?? [];
    const sorted = [...items.filter((b) => b.earned), ...items.filter((b) => !b.earned).sort((a, b) => (b.progressPct ?? 0) - (a.progressPct ?? 0))];
    const f = this.filter();
    return f === 'all' ? sorted : sorted.filter((b) => (f === 'earned' ? b.earned : !b.earned));
  });

  readonly overallPct = computed(() => {
    const c = this.catalog();
    return c && c.total > 0 ? Math.round((c.earned / c.total) * 100) : 0;
  });

  readonly howText = computed(() =>
    this.catalog()?.audience === 'coach' || this.auth.user()?.role === 'coach'
      ? 'Badges unlock automatically as you complete sessions, grow your student list, write evaluations and collect good reviews.'
      : 'Badges unlock automatically after verified games: turn up on time, host games, play new sports and venues, and get good ratings from other players.',
  );

  ionViewWillEnter(): void {
    void this.load();
  }

  async load(): Promise<void> {
    this.error.set('');
    try {
      const data = await firstValueFrom(this.xp.badgeCatalog());
      this.catalog.set(data ?? { audience: null, items: [], earned: 0, locked: 0, secret: 0, total: 0, next: null });
    } catch {
      if (!this.catalog()) this.error.set('Couldn’t load your badges. Check your connection and try again.');
    }
  }

  async refresh(event: RefresherCustomEvent): Promise<void> {
    await this.load();
    await event.target.complete();
  }

  countFor(filter: BadgeFilter): number {
    const c = this.catalog();
    if (!c) return 0;
    if (filter === 'earned') return c.earned;
    if (filter === 'locked') return c.items.filter((b) => !b.earned).length + c.secret;
    return c.items.length + c.secret;
  }

  visual(badge: BadgeItem) {
    return badgeVisual(badge);
  }

  trackCode(_: number, badge: BadgeItem): string {
    return badge.code;
  }

  goBack(): void {
    if (window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl(this.auth.user()?.role === 'coach' ? '/app/coach/dashboard' : '/app/profile');
  }
}
