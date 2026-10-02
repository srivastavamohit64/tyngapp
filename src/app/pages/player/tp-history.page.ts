import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { XpLine, XpService, XpSummary } from '../../core/services/xp.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageSkeletonComponent } from '../../shared/components/skeleton';

interface XpHistoryGroup {
  key: string;
  label: string;
  items: XpLine[];
}

@Component({
  selector: 'app-xp-history-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageHeaderComponent, PageSkeletonComponent],
  template: `
    <ion-content fullscreen>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content pullingText="Pull to refresh"></ion-refresher-content>
      </ion-refresher>

      <app-brand-header-shell [showBrand]="false">
        <main class="tp-history-page page-with-tab-bar">
          <app-page-header title="XP History" [showBack]="true" (back)="goBack()"></app-page-header>

          <div class="tp-content">
            <section class="tp-hero" *ngIf="summary() as total; else heroSkeleton">
              <span class="hero-orb hero-orb-one"></span>
              <span class="hero-orb hero-orb-two"></span>
              <div class="hero-topline">
                <span><ion-icon name="flash"></ion-icon> LIFETIME EXPERIENCE</span>
                <span class="level-pill">LEVEL {{ total.level }}</span>
              </div>
              <div class="hero-balance">{{ total.lifetimeXp | number:'1.0-0' }} <small>XP</small></div>
              <p>{{ total.levelTitle || 'Player' }} · {{ total.season?.name || 'All-time progression' }}</p>
              <div class="xp-progress-track"><span [style.width.%]="total.xpProgressPct"></span></div>
              <div class="hero-rate"><ion-icon name="trending-up-outline"></ion-icon>{{ total.xpToNextLevel | number:'1.0-0' }} XP to next level</div>
            </section>

            <ng-template #heroSkeleton>
              <app-page-skeleton variant="wallet" label="Loading your XP"></app-page-skeleton>
            </ng-template>

            <section class="tp-stat-grid" *ngIf="summary() as total">
              <article><span class="stat-icon earned"><ion-icon name="trending-up-outline"></ion-icon></span><small>This season</small><strong>{{ total.seasonXp | number:'1.0-0' }} XP</strong></article>
              <article><span class="stat-icon redeemed"><ion-icon name="tennisball-outline"></ion-icon></span><small>Games played</small><strong>{{ total.gamesPlayed | number:'1.0-0' }}</strong></article>
              <article><span class="stat-icon expiring"><ion-icon name="trophy-outline"></ion-icon></span><small>All-time rank</small><strong>{{ total.rank ? '#' + total.rank : '—' }}</strong></article>
            </section>

            <section class="history-section">
              <div class="history-heading">
                <div><h2>XP activity</h2><p>Your progression history and details</p></div>
                <span *ngIf="totalItems()">{{ totalItems() }} entries</span>
              </div>

              <div class="history-loading" *ngIf="loading() && !items().length">
                <div class="history-skeleton" *ngFor="let row of [1, 2, 3, 4]"><span></span><div><i></i><i></i></div><b></b></div>
              </div>

              <div class="history-error" *ngIf="!loading() && errorMessage() && !items().length">
                <span><ion-icon name="cloud-offline-outline"></ion-icon></span>
                <h3>Couldn’t load your XP history</h3><p>{{ errorMessage() }}</p>
                <button type="button" (click)="load(true)">Try again</button>
              </div>

              <div class="history-empty" *ngIf="!loading() && !errorMessage() && !items().length">
                <span><ion-icon name="sparkles-outline"></ion-icon></span>
                <h3>Your XP journey starts here</h3>
                <p>Complete verified games and TYNG activities to earn XP and progress through levels.</p>
                <button type="button" (click)="router.navigateByUrl('/app/home')">Explore games</button>
              </div>

              <ng-container *ngFor="let group of groupedItems()">
                <div class="date-divider"><span>{{ group.label }}</span><i></i></div>
                <article class="history-row" *ngFor="let item of group.items">
                  <span class="history-icon" [class.credit]="item.xpAmount >= 0" [class.debit]="item.xpAmount < 0"><ion-icon [name]="activityIcon(item)"></ion-icon></span>
                  <div class="history-copy">
                    <strong>{{ item.label || item.ruleCode || 'XP activity' }}</strong>
                    <p>{{ activityMeta(item) }}</p>
                    <small>{{ activityTime(item.createdAt) }}</small>
                  </div>
                  <div class="history-amount" [class.credit]="item.xpAmount >= 0" [class.debit]="item.xpAmount < 0">
                    <strong>{{ item.xpAmount > 0 ? '+' : '' }}{{ item.xpAmount | number:'1.0-0' }} XP</strong>
                    <span>{{ item.category || 'Progression' }}</span>
                  </div>
                </article>
              </ng-container>

              <button type="button" class="load-more" *ngIf="hasMore()" [disabled]="loadingMore()" (click)="loadMore()">
                <ion-spinner *ngIf="loadingMore()" name="crescent"></ion-spinner>
                <span>{{ loadingMore() ? 'Loading XP…' : 'Load earlier XP history' }}</span>
              </button>
              <p class="end-note" *ngIf="items().length && !hasMore()">You’re all caught up</p>
            </section>

            <section class="how-card">
              <span><ion-icon name="bulb-outline"></ion-icon></span>
              <div><strong>About XP</strong><p>XP tracks your TYNG progression. Earn it through verified games and activities to level up.</p></div>
            </section>
          </div>
        </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    :host { --tp-neon:#8cf000; --tp-ink:#0f1e17; --tp-muted:#6b7771; --tp-line:#e3e9e6; }
    .tp-history-page { min-height:100%; padding-bottom:calc(128px + var(--safe-area-bottom)); overflow-x:hidden; background:#f5f7f6; color:var(--tp-ink); }
    .tp-content { padding:18px 18px 28px; }
    .tp-hero { position:relative; min-height:210px; padding:21px; overflow:hidden; border-radius:27px; background:linear-gradient(145deg,#071b12 0%,#123a27 100%); color:#fff; box-shadow:0 17px 38px rgba(7,27,18,.18); }
    .hero-orb { position:absolute; border-radius:50%; pointer-events:none; }
    .hero-orb-one { top:-68px; right:-42px; width:190px; height:190px; border:1px solid rgba(140,240,0,.2); background:rgba(140,240,0,.08); }
    .hero-orb-two { right:76px; bottom:-77px; width:135px; height:135px; background:rgba(255,255,255,.055); }
    .hero-topline { position:relative; display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .hero-topline>span { display:flex; align-items:center; gap:6px; color:#b7c8bf; font-size:10px; font-weight:900; letter-spacing:.1em; }
    .hero-topline>span ion-icon { color:var(--tp-neon); font-size:16px; }
    .level-pill { padding:6px 9px; border:1px solid rgba(255,255,255,.12); border-radius:10px; background:rgba(255,255,255,.08); color:#d7e5dc!important; font-size:9px!important; letter-spacing:.06em; }
    .hero-topline button { display:flex; min-height:35px; padding:0 12px; align-items:center; gap:5px; border:1px solid rgba(255,255,255,.14); border-radius:12px; background:rgba(255,255,255,.08); color:#fff; font-size:12px; font-weight:800; }
    .hero-balance { position:relative; margin-top:24px; color:#fff; font-size:clamp(42px,13vw,57px); font-weight:950; letter-spacing:-.055em; line-height:.95; }
    .hero-balance small { color:var(--tp-neon); font-size:16px; font-weight:900; letter-spacing:0; }
    .tp-hero>p { position:relative; margin:9px 0 18px; color:#a9bbb1; font-size:12px; }
    .hero-rate { position:relative; display:inline-flex; padding:7px 10px; align-items:center; gap:6px; border-radius:10px; background:var(--tp-neon); color:var(--tp-ink); font-size:11px; font-weight:900; }
    .xp-progress-track { position:relative; height:7px; margin:0 0 12px; overflow:hidden; border-radius:999px; background:rgba(255,255,255,.16); }
    .xp-progress-track span { display:block; height:100%; border-radius:inherit; background:var(--tp-neon); transition:width .3s ease; }
    .tp-hero-loading { display:flex; align-items:center; justify-content:center; gap:10px; color:#c3d0c9; font-size:13px; font-weight:800; }
    .tp-hero-loading ion-spinner { color:var(--tp-neon); }
    .tp-stat-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:9px; margin:13px 0 28px; }
    .tp-stat-grid article { min-width:0; padding:13px 10px; border:1px solid var(--tp-line); border-radius:18px; background:#fff; box-shadow:0 3px 12px rgba(15,30,23,.035); }
    .stat-icon { display:grid; width:30px; height:30px; margin-bottom:10px; place-items:center; border-radius:10px; font-size:16px; }
    .stat-icon.earned { background:#efffda; color:#4c8b00; }.stat-icon.redeemed { background:#fff0e5; color:#d15b09; }.stat-icon.expiring { background:#fff7d6; color:#9a7000; }
    .tp-stat-grid small,.tp-stat-grid strong { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .tp-stat-grid small { color:var(--tp-muted); font-size:9px; font-weight:700; }.tp-stat-grid strong { margin-top:3px; color:var(--tp-ink); font-size:16px; font-weight:950; }
    .history-section { padding:18px 0 5px; border-radius:26px; background:#fff; box-shadow:0 7px 26px rgba(15,30,23,.06); }
    .history-heading { display:flex; padding:0 17px; align-items:flex-start; justify-content:space-between; gap:12px; }
    .history-heading h2 { margin:0; color:var(--tp-ink)!important; font-size:20px; font-weight:950; letter-spacing:-.025em; }.history-heading p { margin:3px 0 0; color:var(--tp-muted); font-size:11px; }
    .history-heading>span { padding:5px 8px; border-radius:8px; background:#f0f4f2; color:#607069; font-size:10px; font-weight:800; }
    .filter-tabs { display:grid; grid-template-columns:repeat(3,1fr); gap:5px; margin:16px 17px 17px; padding:4px; border-radius:14px; background:#f0f3f2; }
    .filter-tabs button { min-height:37px; padding:0 8px; border:0; border-radius:10px; background:transparent; color:#68756f; font-size:12px; font-weight:850; }.filter-tabs button.active { background:var(--tp-ink); color:#fff; box-shadow:0 3px 9px rgba(15,30,23,.16); }
    .date-divider { display:flex; padding:10px 17px 5px; align-items:center; gap:10px; }.date-divider span { flex:0 0 auto; color:#8a9590; font-size:10px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }.date-divider i { height:1px; flex:1; background:#edf0ef; }
    .history-row { display:flex; min-width:0; margin:0 10px; padding:13px 7px; align-items:center; gap:11px; border-bottom:1px solid #eff2f1; }
    .history-row:last-child { border-bottom:0; }.history-icon { display:grid; width:43px; height:43px; flex:0 0 43px; place-items:center; border-radius:14px; font-size:20px; }.history-icon.credit { background:#efffda; color:#4c8b00; }.history-icon.debit { background:#fff0e5; color:#d15b09; }
    .history-copy { min-width:0; flex:1; }.history-copy strong,.history-copy p,.history-copy small { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }.history-copy strong { color:var(--tp-ink); font-size:13px; font-weight:900; }.history-copy p { margin:3px 0 1px; color:#6f7c75; font-size:10px; }.history-copy small { color:#a0aaa5; font-size:9px; }
    .history-amount { flex:0 0 auto; text-align:right; }.history-amount strong,.history-amount span { display:block; }.history-amount strong { font-size:15px; font-weight:950; }.history-amount.credit strong { color:#4f9100; }.history-amount.debit strong { color:#d15b09; }.history-amount span { margin-top:2px; color:#929d97; font-size:8px; font-weight:700; }
    .load-more { display:flex; min-height:44px; margin:15px auto 8px; padding:0 17px; align-items:center; gap:8px; border:1px solid #dfe5e2; border-radius:14px; background:#fff; color:var(--tp-ink); font-size:12px; font-weight:900; }.load-more ion-spinner { width:17px; height:17px; }.end-note { margin:15px 0 10px; color:#9aa49f; font-size:10px; text-align:center; }
    .history-loading { padding:0 10px; }.history-skeleton { display:flex; padding:13px 7px; align-items:center; gap:11px; }.history-skeleton>span { width:43px; height:43px; flex:0 0 43px; border-radius:14px; background:#eef2f0; }.history-skeleton>div { flex:1; }.history-skeleton i,.history-skeleton b { display:block; border-radius:6px; background:#eef2f0; animation:pulse 1.2s ease-in-out infinite; }.history-skeleton i:first-child { width:70%; height:12px; }.history-skeleton i:last-child { width:48%; height:8px; margin-top:7px; }.history-skeleton b { width:47px; height:16px; } @keyframes pulse { 50% { opacity:.45; } }
    .history-empty,.history-error { display:flex; padding:30px 20px 34px; flex-direction:column; align-items:center; text-align:center; }.history-empty>span,.history-error>span { display:grid; width:58px; height:58px; margin-bottom:12px; place-items:center; border-radius:19px; background:#efffda; color:#4c8b00; font-size:28px; }.history-error>span { background:#fff0e5; color:#d15b09; }.history-empty h3,.history-error h3 { margin:0; color:var(--tp-ink)!important; font-size:16px; font-weight:950; }.history-empty p,.history-error p { max-width:245px; margin:6px 0 17px; color:var(--tp-muted); font-size:11px; line-height:1.5; }.history-empty button,.history-error button { min-height:42px; padding:0 17px; border:0; border-radius:13px; background:var(--tp-neon); color:var(--tp-ink); font-size:12px; font-weight:950; }
    .how-card { display:flex; margin-top:15px; padding:15px; align-items:flex-start; gap:12px; border:1px solid #dfe7e3; border-radius:20px; background:#edf5f1; }.how-card>span { display:grid; width:38px; height:38px; flex:0 0 38px; place-items:center; border-radius:12px; background:#fff; color:#4f9100; font-size:20px; }.how-card strong { display:block; font-size:13px; font-weight:900; }.how-card p { margin:3px 0 0; color:var(--tp-muted); font-size:10px; line-height:1.45; }
    @media (max-width:360px) { .tp-content { padding-inline:13px; }.tp-stat-grid { gap:6px; }.tp-stat-grid article { padding-inline:8px; }.history-row { gap:8px; }.history-icon { width:39px; height:39px; flex-basis:39px; } }
  `],
})
export class XpHistoryPage implements OnInit {
  readonly router = inject(Router);
  private readonly xp = inject(XpService);

  readonly summary = signal<XpSummary | null>(null);
  readonly items = signal<XpLine[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly errorMessage = signal('');
  readonly totalItems = signal(0);
  private currentPage = 1;
  private lastPage = 1;
  private requestVersion = 0;

  readonly hasMore = computed(() => this.currentPage < this.lastPage);
  readonly groupedItems = computed<XpHistoryGroup[]>(() => {
    const groups = new Map<string, XpHistoryGroup>();
    for (const item of this.items()) {
      const date = item.createdAt ? new Date(item.createdAt) : null;
      const key = date && !Number.isNaN(date.getTime()) ? this.dateKey(date) : 'recent';
      if (!groups.has(key)) groups.set(key, { key, label: date ? this.dateLabel(date) : 'Recent', items: [] });
      groups.get(key)!.items.push(item);
    }
    return Array.from(groups.values());
  });

  ngOnInit(): void { void this.load(true); }

  async load(reset = true): Promise<void> {
    const version = ++this.requestVersion;
    if (reset) {
      this.loading.set(true);
      this.errorMessage.set('');
      this.currentPage = 1;
    } else {
      this.loadingMore.set(true);
    }
    try {
      const page = reset ? 1 : this.currentPage + 1;
      const [response, summary] = await Promise.all([
        firstValueFrom(this.xp.historyPage(page)),
        reset || !this.summary() ? firstValueFrom(this.xp.summary()) : Promise.resolve(this.summary()),
      ]);
      if (version !== this.requestVersion) return;
      if (!summary) throw new Error('Unable to load your XP summary. Please try again.');
      this.summary.set(summary);
      this.items.set(reset ? response.items : [...this.items(), ...response.items]);
      this.currentPage = response.currentPage;
      this.lastPage = response.lastPage;
      this.totalItems.set(response.total);
    } catch (error: any) {
      if (version !== this.requestVersion) return;
      this.errorMessage.set(error?.error?.message || error?.message || 'Please check your connection and try again.');
      if (reset) this.items.set([]);
    } finally {
      if (version === this.requestVersion) {
        this.loading.set(false);
        this.loadingMore.set(false);
      }
    }
  }

  loadMore(): void { if (!this.loadingMore() && this.hasMore()) void this.load(false); }

  async refresh(event: RefresherCustomEvent): Promise<void> {
    await this.load(true);
    event.target.complete();
  }

  goBack(): void {
    void this.router.navigateByUrl('/app/profile');
  }

  activityIcon(item: XpLine): string {
    return item.xpAmount < 0 ? 'remove-circle-outline' : 'sparkles-outline';
  }

  activityMeta(item: XpLine): string {
    return [item.category || 'Progression', item.sport].filter(Boolean).join(' · ');
  }

  activityTime(value?: string | null): string {
    if (!value) return 'Time unavailable';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Time unavailable';
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }

  private dateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }

  private dateLabel(date: Date): string {
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const days = Math.round((startToday - startDate) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' });
  }
}
