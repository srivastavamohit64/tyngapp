import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, RefresherCustomEvent } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  TpHistoryFilter,
  TpPointHistoryItem,
  TpPointHistorySummary,
  WalletService,
} from '../../core/services/wallet.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

interface TpHistoryGroup {
  key: string;
  label: string;
  items: TpPointHistoryItem[];
}

@Component({
  selector: 'app-tp-history-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageHeaderComponent],
  template: `
    <ion-content fullscreen>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content pullingText="Pull to refresh"></ion-refresher-content>
      </ion-refresher>

      <app-brand-header-shell [showBrand]="false">
        <main class="tp-history-page page-with-tab-bar">
          <app-page-header title="TP Points" [showBack]="true" [showActions]="true" (back)="goBack()">
            <button actions type="button" class="wallet-shortcut" aria-label="Open wallet" (click)="openWallet()">
              <ion-icon name="wallet-outline"></ion-icon>
            </button>
          </app-page-header>

          <div class="tp-content">
            <section class="tp-hero" *ngIf="summary() as total; else heroSkeleton">
              <span class="hero-orb hero-orb-one"></span>
              <span class="hero-orb hero-orb-two"></span>
              <div class="hero-topline">
                <span><ion-icon name="flash"></ion-icon> AVAILABLE BALANCE</span>
                <button type="button" (click)="openWallet()">Convert <ion-icon name="arrow-forward"></ion-icon></button>
              </div>
              <div class="hero-balance">{{ total.points | number:'1.0-0' }} <small>TP</small></div>
              <p>Worth approximately ₹{{ total.valueInr | number:'1.2-2' }}</p>
              <div class="hero-rate"><ion-icon name="swap-horizontal-outline"></ion-icon>{{ total.pointsPerRupee }} TP = ₹1</div>
            </section>

            <ng-template #heroSkeleton>
              <section class="tp-hero tp-hero-loading"><ion-spinner name="crescent"></ion-spinner><span>Loading your points…</span></section>
            </ng-template>

            <section class="tp-stat-grid" *ngIf="summary() as total">
              <article><span class="stat-icon earned"><ion-icon name="trending-up-outline"></ion-icon></span><small>Lifetime earned</small><strong>+{{ total.earned | number:'1.0-0' }}</strong></article>
              <article><span class="stat-icon redeemed"><ion-icon name="wallet-outline"></ion-icon></span><small>Redeemed</small><strong>{{ total.redeemed | number:'1.0-0' }}</strong></article>
              <article><span class="stat-icon expiring"><ion-icon name="time-outline"></ion-icon></span><small>Expiring soon</small><strong>{{ total.expiring | number:'1.0-0' }}</strong></article>
            </section>

            <section class="history-section">
              <div class="history-heading">
                <div><h2>Points activity</h2><p>Your complete TP passbook</p></div>
                <span *ngIf="totalItems()">{{ totalItems() }} entries</span>
              </div>

              <div class="filter-tabs" role="tablist" aria-label="Filter TP history">
                <button type="button" *ngFor="let option of filters" role="tab" [attr.aria-selected]="activeFilter() === option.id" [class.active]="activeFilter() === option.id" (click)="selectFilter(option.id)">{{ option.label }}</button>
              </div>

              <div class="history-loading" *ngIf="loading() && !items().length">
                <div class="history-skeleton" *ngFor="let row of [1, 2, 3, 4]"><span></span><div><i></i><i></i></div><b></b></div>
              </div>

              <div class="history-error" *ngIf="!loading() && errorMessage() && !items().length">
                <span><ion-icon name="cloud-offline-outline"></ion-icon></span>
                <h3>Couldn’t load your points</h3><p>{{ errorMessage() }}</p>
                <button type="button" (click)="load(true)">Try again</button>
              </div>

              <div class="history-empty" *ngIf="!loading() && !errorMessage() && !items().length">
                <span><ion-icon name="sparkles-outline"></ion-icon></span>
                <h3>{{ activeFilter() === 'all' ? 'Your TP journey starts here' : 'No matching activity yet' }}</h3>
                <p>Play verified games and complete rewards to earn TP points.</p>
                <button type="button" (click)="router.navigateByUrl('/app/home')">Explore games</button>
              </div>

              <ng-container *ngFor="let group of groupedItems()">
                <div class="date-divider"><span>{{ group.label }}</span><i></i></div>
                <article class="history-row" *ngFor="let item of group.items">
                  <span class="history-icon" [class.credit]="item.isCredit" [class.debit]="!item.isCredit"><ion-icon [name]="activityIcon(item)"></ion-icon></span>
                  <div class="history-copy">
                    <strong>{{ activityTitle(item) }}</strong>
                    <p>{{ activityMeta(item) }}</p>
                    <small>{{ activityTime(item.createdAt) }}</small>
                  </div>
                  <div class="history-amount" [class.credit]="item.isCredit" [class.debit]="!item.isCredit">
                    <strong>{{ item.isCredit ? '+' : '−' }}{{ item.points | number:'1.0-0' }}</strong>
                    <span>Balance {{ item.balanceAfter | number:'1.0-0' }}</span>
                  </div>
                </article>
              </ng-container>

              <button type="button" class="load-more" *ngIf="hasMore()" [disabled]="loadingMore()" (click)="loadMore()">
                <ion-spinner *ngIf="loadingMore()" name="crescent"></ion-spinner>
                <span>{{ loadingMore() ? 'Loading activity…' : 'Load earlier activity' }}</span>
              </button>
              <p class="end-note" *ngIf="items().length && !hasMore()">You’re all caught up</p>
            </section>

            <section class="how-card">
              <span><ion-icon name="bulb-outline"></ion-icon></span>
              <div><strong>How TP works</strong><p>Earn points through TYNG activities, then convert eligible TP into wallet balance.</p></div>
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
    .wallet-shortcut { display:grid; width:40px; height:40px; min-height:unset; padding:0; place-items:center; border:1px solid #e4eae7; border-radius:13px; background:#fff; color:var(--tp-ink); }
    .wallet-shortcut ion-icon { font-size:21px; }
    .tp-hero { position:relative; min-height:210px; padding:21px; overflow:hidden; border-radius:27px; background:linear-gradient(145deg,#071b12 0%,#123a27 100%); color:#fff; box-shadow:0 17px 38px rgba(7,27,18,.18); }
    .hero-orb { position:absolute; border-radius:50%; pointer-events:none; }
    .hero-orb-one { top:-68px; right:-42px; width:190px; height:190px; border:1px solid rgba(140,240,0,.2); background:rgba(140,240,0,.08); }
    .hero-orb-two { right:76px; bottom:-77px; width:135px; height:135px; background:rgba(255,255,255,.055); }
    .hero-topline { position:relative; display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .hero-topline>span { display:flex; align-items:center; gap:6px; color:#b7c8bf; font-size:10px; font-weight:900; letter-spacing:.1em; }
    .hero-topline>span ion-icon { color:var(--tp-neon); font-size:16px; }
    .hero-topline button { display:flex; min-height:35px; padding:0 12px; align-items:center; gap:5px; border:1px solid rgba(255,255,255,.14); border-radius:12px; background:rgba(255,255,255,.08); color:#fff; font-size:12px; font-weight:800; }
    .hero-balance { position:relative; margin-top:24px; color:#fff; font-size:clamp(42px,13vw,57px); font-weight:950; letter-spacing:-.055em; line-height:.95; }
    .hero-balance small { color:var(--tp-neon); font-size:16px; font-weight:900; letter-spacing:0; }
    .tp-hero>p { position:relative; margin:9px 0 18px; color:#a9bbb1; font-size:12px; }
    .hero-rate { position:relative; display:inline-flex; padding:7px 10px; align-items:center; gap:6px; border-radius:10px; background:var(--tp-neon); color:var(--tp-ink); font-size:11px; font-weight:900; }
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
export class TpHistoryPage implements OnInit {
  readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly wallet = inject(WalletService);

  readonly filters: Array<{ id: TpHistoryFilter; label: string }> = [
    { id: 'all', label: 'All' },
    { id: 'earned', label: 'Earned' },
    { id: 'redeemed', label: 'Redeemed' },
  ];
  readonly activeFilter = signal<TpHistoryFilter>('all');
  readonly summary = signal<TpPointHistorySummary | null>(null);
  readonly items = signal<TpPointHistoryItem[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly errorMessage = signal('');
  readonly totalItems = signal(0);
  private currentPage = 1;
  private lastPage = 1;
  private requestVersion = 0;

  readonly hasMore = computed(() => this.currentPage < this.lastPage);
  readonly groupedItems = computed<TpHistoryGroup[]>(() => {
    const groups = new Map<string, TpHistoryGroup>();
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
      const response = await firstValueFrom(this.wallet.getTpHistory(page, this.activeFilter()));
      if (version !== this.requestVersion) return;
      const data = response.data;
      if (!response.success || !data) throw new Error(response.message || 'Unable to load TP history.');
      this.summary.set(data.summary);
      this.items.set(reset ? data.items : [...this.items(), ...data.items]);
      this.currentPage = data.pagination.currentPage;
      this.lastPage = data.pagination.lastPage;
      this.totalItems.set(data.pagination.total);
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

  selectFilter(filter: TpHistoryFilter): void {
    if (filter === this.activeFilter()) return;
    this.activeFilter.set(filter);
    this.items.set([]);
    void this.load(true);
  }

  loadMore(): void { if (!this.loadingMore() && this.hasMore()) void this.load(false); }

  async refresh(event: RefresherCustomEvent): Promise<void> {
    await this.load(true);
    event.target.complete();
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/app/home');
  }

  openWallet(): void { void this.router.navigateByUrl('/app/wallet'); }

  activityIcon(item: TpPointHistoryItem): string {
    if (!item.isCredit) return 'wallet-outline';
    if (item.type === 'adjust') return 'options-outline';
    return 'sparkles-outline';
  }

  activityTitle(item: TpPointHistoryItem): string {
    const description = String(item.description || '').trim();
    if (description) return description;
    if (item.type === 'redeem') return 'Converted TP to wallet';
    if (item.type === 'adjust') return 'Points adjustment';
    return 'TP points earned';
  }

  activityMeta(item: TpPointHistoryItem): string {
    if (item.rupees && item.rupees > 0) return `₹${item.rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} added to wallet`;
    return item.isCredit ? 'Added to your TP balance' : 'Redeemed from your TP balance';
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
