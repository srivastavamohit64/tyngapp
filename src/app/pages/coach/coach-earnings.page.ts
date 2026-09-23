import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CoachService } from '../../core/services/coach.service';

type EarningsPeriod = 'today' | 'week' | 'month' | 'year';

interface CoachEarningsData {
  total: number;
  previous_total: number;
  change_percent: number | null;
  stats: { today: number; week: number; month: number };
  wallet_balance: number;
  breakdown: Array<{ label: string; sessions: number; amount: number; percentage: number }>;
  recent_sessions: Array<{
    id: number;
    title: string;
    sport: string | null;
    student_name: string | null;
    venue_name: string | null;
    date: string | null;
    amount: number;
  }>;
}

@Component({
  selector: 'app-coach-earnings',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <div class="earnings-page">
        <header class="sticky-header">
          <button type="button" class="header-button" aria-label="Back to dashboard" (click)="back()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1>Earnings</h1>
          <button type="button" class="header-button" aria-label="Open your schedule" (click)="go('/app/coach/schedule')">
            <ion-icon name="calendar-outline"></ion-icon>
          </button>
        </header>

        <nav class="period-grid" role="tablist" aria-label="Choose earnings period">
          <button *ngFor="let period of periods" type="button" role="tab"
            [attr.aria-selected]="selectedPeriod() === period.key"
            [class.selected]="selectedPeriod() === period.key"
            (click)="selectPeriod(period.key)">
            {{ period.label }}
          </button>
        </nav>

        <main class="earnings-content">
          <div *ngIf="error()" class="error-card" role="alert">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <span>{{ error() }}</span>
            <button type="button" (click)="load()">Try again</button>
          </div>

          <section class="summary-card" aria-label="Earnings summary">
            <div class="summary-orb"></div>
            <p class="summary-label">{{ selectedPeriodLabel() }}'s Earnings</p>
            <ng-container *ngIf="!loading(); else totalLoading">
              <p class="summary-total">{{ currency(data()?.total || 0) }}</p>
              <p class="summary-change" [class.positive]="(data()?.change_percent || 0) > 0" [class.negative]="(data()?.change_percent || 0) < 0">
                {{ changeText() }}
              </p>
            </ng-container>
            <ng-template #totalLoading><div class="loading-total"></div></ng-template>

            <div class="summary-stats">
              <div class="summary-stat">
                <ion-icon name="today-outline"></ion-icon>
                <strong>{{ currency(data()?.stats?.today || 0) }}</strong>
                <span>Today</span>
              </div>
              <div class="summary-stat">
                <ion-icon name="calendar-outline"></ion-icon>
                <strong>{{ currency(data()?.stats?.week || 0) }}</strong>
                <span>This Week</span>
              </div>
              <div class="summary-stat">
                <ion-icon name="wallet-outline"></ion-icon>
                <strong>{{ currency(data()?.wallet_balance || 0) }}</strong>
                <span>Wallet</span>
              </div>
            </div>
          </section>

          <section class="wallet-card">
            <div class="section-heading">
              <div class="section-icon"><ion-icon name="wallet-outline"></ion-icon></div>
              <h2>TYNG Wallet</h2>
            </div>
            <div class="wallet-balance">
              <span>Available Balance</span>
              <strong>{{ currency(data()?.wallet_balance || 0) }}</strong>
              <p><i></i> Current wallet balance</p>
            </div>
            <div class="wallet-actions">
              <button type="button" class="wallet-primary" (click)="go('/app/wallet')">
                <ion-icon name="wallet-outline"></ion-icon> Open Wallet
              </button>
              <button type="button" class="wallet-secondary" (click)="go('/app/coach/settings')">Manage Account</button>
            </div>
          </section>

          <section class="content-card">
            <div class="section-title-row">
              <div><h2>Earnings Breakdown</h2><p>Completed sessions by sport</p></div>
            </div>
            <div *ngIf="!loading() && data()?.breakdown?.length === 0" class="empty-copy">Completed sessions will appear here.</div>
            <div *ngFor="let item of data()?.breakdown; trackBy: trackBreakdown" class="breakdown-row">
              <div class="breakdown-topline">
                <div><strong>{{ item.label }}</strong><span>{{ item.sessions }} session{{ item.sessions === 1 ? '' : 's' }}</span></div>
                <b>{{ currency(item.amount) }}</b>
              </div>
              <div class="progress-track"><span [style.width.%]="item.percentage"></span></div>
            </div>
          </section>

          <section class="content-card">
            <div class="section-title-row">
              <div><h2>Recent Sessions</h2><p>Your latest completed coaching sessions</p></div>
              <button type="button" class="view-all" (click)="go('/app/coach/schedule')">Schedule <ion-icon name="chevron-forward-outline"></ion-icon></button>
            </div>
            <div *ngIf="!loading() && data()?.recent_sessions?.length === 0" class="empty-copy">No completed sessions yet.</div>
            <article *ngFor="let session of data()?.recent_sessions; trackBy: trackSession" class="session-row">
              <div class="session-icon"><ion-icon name="checkmark-circle-outline"></ion-icon></div>
              <div class="session-copy">
                <strong>{{ session.title || session.sport || 'Coaching session' }}</strong>
                <span>{{ session.sport || 'Coaching' }}<ng-container *ngIf="session.student_name"> · {{ session.student_name }}</ng-container></span>
                <span *ngIf="session.date" class="session-date">{{ session.date | date:'d MMM y' }}</span>
              </div>
              <b class="session-amount">{{ currency(session.amount) }}</b>
            </article>
          </section>
        </main>
      </div>
    </ion-content>
  `,
  styles: [`
    :host { display:block; }
    .earnings-page { min-height:100%; padding-bottom:calc(120px + var(--safe-area-bottom, 0px)); background:#F7F9FC; color:#172033; }
    .sticky-header { position:sticky; top:0; z-index:20; display:grid; grid-template-columns:42px 1fr 42px; align-items:center; min-height:62px; padding:0 16px; border-bottom:1px solid #EEF1F5; background:#fff; }
    .sticky-header h1 { margin:0; text-align:center; font-size:17px; font-weight:850; }
    .header-button { display:grid; place-items:center; width:42px; height:42px; border:0; border-radius:15px; background:#F3F5F8; color:#172033; font-size:20px; }
    .period-grid { position:sticky; top:62px; z-index:19; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; padding:10px 14px; border-bottom:1px solid #EEF1F5; background:#fff; }
    .period-grid button { min-width:0; min-height:36px; padding:5px 3px; border:0; border-radius:12px; background:#F3F5F8; color:#687386; font-size:11px; font-weight:700; white-space:nowrap; }
    .period-grid button.selected { background:#69D900; color:#14210A; box-shadow:0 3px 10px #69d90030; }
    .earnings-content { display:grid; gap:16px; padding:16px 18px 0; }
    .summary-card { position:relative; overflow:hidden; padding:24px 20px 18px; border-radius:25px; background:linear-gradient(140deg,#111827 0%,#1D293B 100%); box-shadow:0 10px 28px #15264220; color:#fff; }
    .summary-orb { position:absolute; top:-48px; right:-40px; width:165px; height:165px; border-radius:50%; background:#69d90016; pointer-events:none; }
    .summary-label { position:relative; margin:0 0 4px; color:#78E100; font-size:11px; font-weight:850; letter-spacing:.09em; text-transform:uppercase; }
    .summary-total { position:relative; margin:0; font-size:clamp(36px,11vw,48px); line-height:1.05; font-weight:900; letter-spacing:-.04em; }
    .summary-change { position:relative; min-height:18px; margin:5px 0 20px; color:#ADB8C7; font-size:11px; }
    .summary-change.positive { color:#9BE859; }
    .summary-change.negative { color:#FDB4A8; }
    .loading-total { width:190px; height:44px; margin:4px 0 5px; border-radius:9px; background:#ffffff16; animation:pulse 1s infinite alternate; }
    .summary-stats { position:relative; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
    .summary-stat { display:flex; min-width:0; min-height:87px; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:9px 5px; border:1px solid #ffffff0d; border-radius:16px; background:#ffffff12; text-align:center; }
    .summary-stat ion-icon { color:#79E300; font-size:18px; }
    .summary-stat strong { max-width:100%; overflow:hidden; font-size:clamp(11px,3.2vw,14px); font-weight:850; text-overflow:ellipsis; white-space:nowrap; }
    .summary-stat span { color:#B7C0CE; font-size:9px; }
    .wallet-card,.content-card { min-width:0; padding:19px; border:1px solid #E9EEF3; border-radius:23px; background:#fff; box-shadow:0 5px 20px #1526420c; }
    .section-heading { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
    .section-icon { display:grid; place-items:center; width:40px; height:40px; border-radius:14px; background:#EFFADB; color:#55B900; font-size:20px; }
    .section-heading h2 { margin:0; font-size:13px; font-weight:850; letter-spacing:.06em; }
    .wallet-balance { display:flex; flex-direction:column; align-items:center; gap:5px; padding:17px 12px; border:1px solid #F0F2F5; border-radius:17px; background:#F8FAFC; }
    .wallet-balance>span { color:#8A94A6; font-size:12px; }
    .wallet-balance strong { max-width:100%; color:#172033; font-size:clamp(30px,9vw,38px); line-height:1.1; font-weight:900; letter-spacing:-.03em; overflow-wrap:anywhere; }
    .wallet-balance p { display:flex; align-items:center; gap:7px; margin:2px 0 0; color:#687386; font-size:11px; }
    .wallet-balance i { width:8px; height:8px; border-radius:50%; background:#69D900; }
    .wallet-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px; }
    .wallet-actions button { min-width:0; min-height:46px; padding:8px 10px; border-radius:14px; font-size:12px; font-weight:750; }
    .wallet-primary { display:flex; align-items:center; justify-content:center; gap:6px; border:0; background:linear-gradient(135deg,#69D900,#83E521); color:#14210A; }
    .wallet-secondary { border:1px solid #D9DEE7; background:#fff; color:#5D687A; }
    .section-title-row { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:16px; }
    .section-title-row h2 { margin:0; font-size:13px; font-weight:850; }
    .section-title-row p { margin:4px 0 0; color:#9099A8; font-size:10px; }
    .view-all { display:flex; flex:0 0 auto; align-items:center; gap:2px; border:0; background:transparent; color:#4C9B00; font-size:11px; font-weight:800; }
    .breakdown-row + .breakdown-row { margin-top:15px; }
    .breakdown-topline { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:7px; }
    .breakdown-topline div { display:flex; min-width:0; flex-direction:column; gap:2px; }
    .breakdown-topline strong { overflow:hidden; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
    .breakdown-topline span { color:#9099A8; font-size:10px; }
    .breakdown-topline>b { flex:0 0 auto; font-size:12px; }
    .progress-track { height:6px; overflow:hidden; border-radius:9px; background:#F0F2F5; }
    .progress-track span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#69D900,#93E648); }
    .session-row { display:flex; align-items:center; gap:10px; padding:12px 0; border-top:1px solid #F0F2F5; }
    .session-icon { display:grid; flex:0 0 36px; place-items:center; width:36px; height:36px; border-radius:12px; background:#EFFADB; color:#55B900; font-size:19px; }
    .session-copy { display:flex; min-width:0; flex:1; flex-direction:column; gap:3px; }
    .session-copy strong { overflow:hidden; font-size:11px; text-overflow:ellipsis; white-space:nowrap; }
    .session-copy span { overflow:hidden; color:#778296; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
    .session-copy .session-date { color:#A0A8B5; font-size:9px; }
    .session-amount { flex:0 0 auto; font-size:11px; }
    .empty-copy { padding:14px 0 4px; color:#8B95A5; font-size:11px; text-align:center; }
    .error-card { display:flex; align-items:center; gap:8px; padding:12px; border-radius:14px; background:#FFF1F0; color:#B42318; font-size:11px; }
    .error-card span { flex:1; }
    .error-card button { border:0; background:transparent; color:#9F1C13; font-size:11px; font-weight:800; }
    @keyframes pulse { to { opacity:.45; } }
    @media (min-width:700px) { .earnings-content { max-width:720px; width:100%; margin:0 auto; padding-top:24px; } .period-grid { padding-right:max(14px,calc((100% - 720px)/2)); padding-left:max(14px,calc((100% - 720px)/2)); } }
  `],
})
export class CoachEarningsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly coach = inject(CoachService);
  readonly selectedPeriod = signal<EarningsPeriod>('month');
  readonly loading = signal(false);
  readonly error = signal('');
  readonly data = signal<CoachEarningsData | null>(null);
  readonly periods: Array<{ key: EarningsPeriod; label: string }> = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.coach.getEarnings(this.selectedPeriod()).subscribe({
      next: (response) => { this.data.set(response.data || null); this.loading.set(false); },
      error: () => { this.error.set('Could not load your earnings. Please try again.'); this.loading.set(false); },
    });
  }

  selectPeriod(period: EarningsPeriod): void {
    if (this.selectedPeriod() === period) return;
    this.selectedPeriod.set(period);
    this.load();
  }

  selectedPeriodLabel(): string { return this.periods.find((item) => item.key === this.selectedPeriod())?.label || 'This Month'; }

  changeText(): string {
    const percent = this.data()?.change_percent;
    if (percent === null || percent === undefined) return 'No earnings in the previous period';
    if (percent === 0) return 'Same as the previous period';
    return `${percent > 0 ? '+' : ''}${percent}% compared with the previous period`;
  }

  currency(value: number): string { return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }
  trackBreakdown(_index: number, item: CoachEarningsData['breakdown'][number]): string { return item.label; }
  trackSession(_index: number, item: CoachEarningsData['recent_sessions'][number]): number { return item.id; }
  back(): void { void this.router.navigateByUrl('/app/coach/dashboard'); }
  go(path: string): void { void this.router.navigateByUrl(path); }
}
