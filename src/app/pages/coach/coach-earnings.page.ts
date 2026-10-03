import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CoachEarningsPayload, CoachEarningsPeriod, CoachEarningsSessionItem, CoachService } from '../../core/services/coach.service';
import { CoachEmployment, VenueCoachService } from '../../core/services/venue-coach.service';
import { SkeletonListComponent } from '../../shared/components/skeleton';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

@Component({
  selector: 'app-coach-earnings',
  standalone: true,
  imports: [CommonModule, IonicModule, SkeletonListComponent, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell title="Earnings">
      <button headerEnd type="button" class="header-button" aria-label="Open your schedule" (click)="go('/app/coach/schedule')">
        <ion-icon name="calendar-outline"></ion-icon>
      </button>
      <div class="earnings-page">
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
              <p class="summary-meta">
                {{ data()?.sessions || 0 }} completed session{{ data()?.sessions === 1 ? '' : 's' }} · {{ data()?.hours || 0 }}h coached
                <ng-container *ngIf="(data()?.average_per_session || 0) > 0"> · avg {{ currency(data()?.average_per_session || 0) }}</ng-container>
              </p>
            </ng-container>
            <ng-template #totalLoading><div class="loading-total"></div></ng-template>

            <div class="summary-stats">
              <div class="summary-stat">
                <ion-icon name="today-outline"></ion-icon>
                <strong *ngIf="!loading(); else statSkel">{{ currency(data()?.stats?.today || 0) }}</strong>
                <span>Today</span>
              </div>
              <div class="summary-stat">
                <ion-icon name="calendar-outline"></ion-icon>
                <strong *ngIf="!loading(); else statSkel">{{ currency(data()?.stats?.week || 0) }}</strong>
                <span>This Week</span>
              </div>
              <div class="summary-stat">
                <ion-icon name="wallet-outline"></ion-icon>
                <strong *ngIf="!loading(); else statSkel">{{ currency(data()?.wallet_balance || 0) }}</strong>
                <span>Wallet</span>
              </div>
            </div>
            <ng-template #statSkel><ion-skeleton-text animated class="stat-skel"></ion-skeleton-text></ng-template>
          </section>

          <section *ngIf="!loading() && (data()?.awaiting_completion?.sessions || 0) > 0" class="attention-card">
            <div class="attention-head">
              <div class="attention-icon"><ion-icon name="time-outline"></ion-icon></div>
              <div>
                <strong>{{ currency(data()?.awaiting_completion?.amount || 0) }} waiting to be counted</strong>
                <span>Mark {{ data()?.awaiting_completion?.sessions }} finished session{{ data()?.awaiting_completion?.sessions === 1 ? '' : 's' }} as completed to add {{ data()?.awaiting_completion?.sessions === 1 ? 'it' : 'them' }} to your earnings.</span>
              </div>
            </div>
            <button *ngFor="let session of data()?.awaiting_completion?.items; trackBy: trackSession" type="button" class="attention-row" (click)="openSession(session)">
              <span>{{ session.title || session.sport || 'Coaching session' }} · {{ session.starts_at | date:'d MMM, h:mm a' }}</span>
              <b>{{ currency(session.amount) }}</b>
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
          </section>

          <section class="content-card">
            <div class="section-title-row">
              <div><h2>Revenue Trend</h2><p>{{ data()?.range?.label || selectedPeriodLabel() }} · completed sessions</p></div>
              <b *ngIf="!loading()" class="trend-total">{{ currency(data()?.total || 0) }}</b>
            </div>
            <div *ngIf="loading()" class="chart-skeleton">
              <ion-skeleton-text *ngFor="let h of skeletonBars" animated [style.height.%]="h"></ion-skeleton-text>
            </div>
            <ng-container *ngIf="!loading()">
              <div class="chart" [class.dense]="chartPoints().length > 12" role="img" [attr.aria-label]="'Revenue trend for ' + (data()?.range?.label || '')">
                <div *ngFor="let point of chartPoints()" class="chart-col" [title]="point.label + ': ' + currency(point.amount)">
                  <div class="chart-bar-wrap">
                    <span class="chart-bar" [class.empty]="point.amount <= 0" [style.height.%]="barHeight(point.amount)"></span>
                  </div>
                  <small>{{ point.showLabel ? point.label : '' }}</small>
                </div>
              </div>
              <p *ngIf="(data()?.chart?.max || 0) <= 0" class="empty-copy">No completed sessions in this period yet.</p>
            </ng-container>
          </section>

          <section class="wallet-card">
            <div class="section-heading">
              <div class="section-icon"><ion-icon name="wallet-outline"></ion-icon></div>
              <h2>TYNG Wallet</h2>
            </div>
            <div class="wallet-balance">
              <span>Available Balance</span>
              <strong *ngIf="!loading(); else walletSkel">{{ currency(data()?.wallet_balance || 0) }}</strong>
              <ng-template #walletSkel><ion-skeleton-text animated class="wallet-skel"></ion-skeleton-text></ng-template>
              <p><i></i> Current wallet balance</p>
            </div>
            <div *ngIf="!loading() && (data()?.transactions?.length || 0) > 0" class="transactions">
              <p class="mini-title">Recent wallet activity</p>
              <div *ngFor="let tx of data()?.transactions" class="tx-row">
                <div class="tx-icon" [class.credit]="tx.is_credit"><ion-icon [name]="tx.is_credit ? 'arrow-down-outline' : 'arrow-up-outline'"></ion-icon></div>
                <div class="tx-copy">
                  <strong>{{ tx.description || tx.label }}</strong>
                  <span>{{ tx.created_at | date:'d MMM y' }}<ng-container *ngIf="tx.status !== 'completed'"> · {{ tx.status }}</ng-container></span>
                </div>
                <b [class.credit]="tx.is_credit">{{ tx.is_credit ? '+' : '−' }}{{ currency(tx.amount) }}</b>
              </div>
            </div>
            <div class="wallet-actions single">
              <button type="button" class="wallet-primary" (click)="go('/app/wallet')">
                <ion-icon name="wallet-outline"></ion-icon> Open Wallet
              </button>
            </div>
          </section>

          <section class="content-card">
            <div class="section-title-row">
              <div><h2>Earnings Breakdown</h2><p>Completed sessions by type and sport</p></div>
            </div>
            <app-skeleton-list *ngIf="loading()" [count]="3" avatarSize="0px"></app-skeleton-list>
            <div *ngIf="!loading() && data()?.breakdown?.length === 0" class="empty-copy">Completed sessions will appear here.</div>
            <ng-container *ngIf="!loading() && (data()?.breakdown?.length || 0) > 0">
              <div class="type-grid">
                <div *ngFor="let item of data()?.breakdown_by_type" class="type-tile">
                  <span>{{ item.label }}</span>
                  <strong>{{ currency(item.amount) }}</strong>
                  <small>{{ item.percentage }}% · {{ item.sessions }} session{{ item.sessions === 1 ? '' : 's' }}</small>
                </div>
              </div>
              <div *ngFor="let item of data()?.breakdown; trackBy: trackBreakdown" class="breakdown-row">
                <div class="breakdown-topline">
                  <div><strong>{{ item.label }}</strong><span>{{ item.sessions }} session{{ item.sessions === 1 ? '' : 's' }} · {{ item.percentage }}%</span></div>
                  <b>{{ currency(item.amount) }}</b>
                </div>
                <div class="progress-track"><span [style.width.%]="item.percentage"></span></div>
              </div>
            </ng-container>
          </section>

          <section class="content-card">
            <div class="section-title-row">
              <div><h2>Upcoming Earnings</h2><p>Confirmed sessions that will add to your earnings once completed</p></div>
              <b *ngIf="!loading()" class="trend-total">{{ currency(data()?.upcoming?.amount || 0) }}</b>
            </div>
            <app-skeleton-list *ngIf="loading()" [count]="2" avatarSize="36px"></app-skeleton-list>
            <ng-container *ngIf="!loading()">
              <div *ngIf="(data()?.upcoming?.sessions || 0) === 0" class="empty-copy">No confirmed upcoming sessions.</div>
              <button *ngFor="let session of data()?.upcoming?.items; trackBy: trackSession" type="button" class="session-row clickable" (click)="openSession(session)">
                <div class="session-icon upcoming"><ion-icon name="calendar-outline"></ion-icon></div>
                <div class="session-copy">
                  <strong>{{ session.title || session.sport || 'Coaching session' }}</strong>
                  <span>{{ session.starts_at | date:'EEE d MMM, h:mm a' }}<ng-container *ngIf="session.venue_name"> · {{ session.venue_name }}</ng-container></span>
                </div>
                <b class="session-amount">{{ currency(session.amount) }}</b>
              </button>
              <p *ngIf="(data()?.upcoming?.sessions || 0) > (data()?.upcoming?.items?.length || 0)" class="more-copy">
                +{{ (data()?.upcoming?.sessions || 0) - (data()?.upcoming?.items?.length || 0) }} more in your schedule
              </p>
              <p *ngIf="(data()?.pending_approval?.sessions || 0) > 0" class="pending-copy">
                <ion-icon name="hourglass-outline"></ion-icon>
                {{ data()?.pending_approval?.sessions }} session{{ data()?.pending_approval?.sessions === 1 ? '' : 's' }} ({{ currency(data()?.pending_approval?.amount || 0) }}) waiting for venue approval
              </p>
            </ng-container>
          </section>

          <section *ngIf="offers().length" class="content-card">
            <div class="section-title-row">
              <div><h2>Job Offers</h2><p>Venues that want you on their team</p></div>
            </div>
            <article *ngFor="let offer of offers()" class="venue-card">
              <div class="venue-media"><ion-icon name="briefcase-outline"></ion-icon></div>
              <div class="venue-copy">
                <div class="venue-title">
                  <strong>{{ offer.venueName || 'Venue' }}</strong>
                  <span class="status-pill">{{ offer.assignment.employmentLabel || 'Offer' }}</span>
                </div>
                <span class="venue-sub">{{ offer.assignment.facility || 'Coaching role' }}<ng-container *ngIf="offer.assignment.shiftLabel"> · {{ offer.assignment.shiftLabel }}</ng-container></span>
                <div class="venue-figures">
                  <span *ngIf="offer.assignment.monthlySalary"><b>{{ currency(offer.assignment.monthlySalary) }}</b> per month</span>
                  <span *ngIf="!offer.assignment.monthlySalary && offer.assignment.hourlyRate"><b>{{ currency(offer.assignment.hourlyRate) }}</b> per hour</span>
                  <span *ngIf="offer.assignment.workDaysLabel"><b>{{ offer.assignment.workDaysLabel }}</b></span>
                </div>
                <button type="button" class="venue-link" (click)="go('/app/coach/venue-collab/' + offer.venueId)">View offer <ion-icon name="chevron-forward-outline"></ion-icon></button>
              </div>
            </article>
          </section>

          <section class="content-card">
            <div class="section-title-row">
              <div><h2>Venue Collaborations</h2><p>Venues where you coach</p></div>
            </div>
            <app-skeleton-list *ngIf="loading()" [count]="2" avatarSize="52px"></app-skeleton-list>
            <ng-container *ngIf="!loading()">
              <div *ngIf="(data()?.venues?.length || 0) === 0" class="empty-copy">Book a venue for a session to start a collaboration.</div>
              <article *ngFor="let venue of data()?.venues" class="venue-card">
                <div class="venue-media">
                  <img *ngIf="venue.image; else venueFallback" [src]="venue.image" [alt]="venue.name" loading="lazy" />
                  <ng-template #venueFallback><ion-icon name="business-outline"></ion-icon></ng-template>
                </div>
                <div class="venue-copy">
                  <div class="venue-title">
                    <strong>{{ venue.name }}</strong>
                    <span class="status-pill" [class.muted]="venue.upcoming_sessions === 0">{{ venue.upcoming_sessions > 0 ? 'Active' : (venue.partnership_status || 'Past') }}</span>
                  </div>
                  <span class="venue-sub">{{ venue.sports.join(', ') || 'Coaching' }} · {{ venue.sessions }} session{{ venue.sessions === 1 ? '' : 's' }}</span>
                  <div class="venue-figures">
                    <span><b>{{ currency(venue.amount) }}</b> {{ selectedPeriodLabel().toLowerCase() }}</span>
                    <span><b>{{ venue.upcoming_sessions }}</b> upcoming</span>
                  </div>
                  <button type="button" class="venue-link" (click)="go('/app/coach/venue-collab/' + venue.venue_id)">View details <ion-icon name="chevron-forward-outline"></ion-icon></button>
                </div>
              </article>
            </ng-container>
          </section>

          <section *ngIf="loading() || (data()?.top_students?.length || 0) > 0" class="content-card">
            <div class="section-title-row">
              <div><h2>Top Students</h2><p>Share of completed-session earnings this period</p></div>
            </div>
            <app-skeleton-list *ngIf="loading()" [count]="3" avatarSize="36px"></app-skeleton-list>
            <ng-container *ngIf="!loading()">
              <button *ngFor="let student of data()?.top_students; let i = index" type="button" class="session-row clickable" (click)="go('/app/coach/student/' + student.id)">
                <div class="student-avatar">
                  <img *ngIf="student.photo; else initials" [src]="student.photo" [alt]="student.name" />
                  <ng-template #initials>{{ initialsOf(student.name) }}</ng-template>
                </div>
                <div class="session-copy">
                  <strong>{{ student.name }}</strong>
                  <span>{{ student.sessions }} completed session{{ student.sessions === 1 ? '' : 's' }}</span>
                </div>
                <b class="session-amount">{{ currency(student.amount) }}</b>
              </button>
            </ng-container>
          </section>

          <section class="content-card">
            <div class="section-title-row">
              <div><h2>Recent Sessions</h2><p>Your latest completed coaching sessions</p></div>
              <button type="button" class="view-all" (click)="go('/app/coach/schedule')">Schedule <ion-icon name="chevron-forward-outline"></ion-icon></button>
            </div>
            <app-skeleton-list *ngIf="loading()" [count]="3" avatarSize="36px"></app-skeleton-list>
            <div *ngIf="!loading() && data()?.recent_sessions?.length === 0" class="empty-copy">No completed sessions yet.</div>
            <ng-container *ngIf="!loading()">
            <button *ngFor="let session of data()?.recent_sessions; trackBy: trackSession" type="button" class="session-row clickable" (click)="openSession(session)">
              <div class="session-icon"><ion-icon name="checkmark-circle-outline"></ion-icon></div>
              <div class="session-copy">
                <strong>{{ session.title || session.sport || 'Coaching session' }}</strong>
                <span>{{ session.sport || 'Coaching' }}<ng-container *ngIf="session.student_name"> · {{ session.student_name }}</ng-container></span>
                <span *ngIf="session.date" class="session-date">{{ session.date | date:'d MMM y' }}</span>
              </div>
              <b class="session-amount">{{ currency(session.amount) }}</b>
            </button>
            </ng-container>
          </section>
        </main>
      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    :host { display:block; }
    .earnings-page { min-height:100%; padding-bottom:calc(120px + var(--safe-area-bottom, 0px)); background:#F7F9FC; color:#172033; }
    .header-button { display:grid; place-items:center; width:var(--app-header-btn-size); height:var(--app-header-btn-size); border:0; border-radius:15px; background:#F3F5F8; color:#172033; font-size:20px; }
    .period-grid { position:sticky; top:0; z-index:19; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:6px; padding:10px 14px; border-bottom:1px solid #EEF1F5; background:#fff; }
    .period-grid button { min-width:0; min-height:36px; padding:5px 3px; border:0; border-radius:12px; background:#F3F5F8; color:#687386; font-size:11px; font-weight:700; white-space:nowrap; }
    .period-grid button.selected { background:#69D900; color:#14210A; box-shadow:0 3px 10px #69d90030; }
    .earnings-content { display:grid; gap:16px; padding:16px 18px 0; }
    .summary-card { position:relative; overflow:hidden; padding:24px 20px 18px; border-radius:25px; background:linear-gradient(140deg,#111827 0%,#1D293B 100%); box-shadow:0 10px 28px #15264220; color:#fff; }
    .summary-orb { position:absolute; top:-48px; right:-40px; width:165px; height:165px; border-radius:50%; background:#69d90016; pointer-events:none; }
    .summary-label { position:relative; margin:0 0 4px; color:#78E100; font-size:11px; font-weight:850; letter-spacing:.09em; text-transform:uppercase; }
    .summary-total { position:relative; margin:0; font-size:clamp(36px,11vw,48px); line-height:1.05; font-weight:900; letter-spacing:-.04em; }
    .summary-change { position:relative; min-height:18px; margin:5px 0 2px; color:#ADB8C7; font-size:11px; }
    .summary-change.positive { color:#9BE859; }
    .summary-change.negative { color:#FDB4A8; }
    .summary-meta { position:relative; margin:0 0 18px; color:#8E9AAD; font-size:10px; }
    .stat-skel { display:block; width:64px; height:14px; margin:4px auto; border-radius:999px; --background:rgba(255,255,255,.16); }
    .wallet-skel { display:block; width:120px; height:26px; margin:6px 0; border-radius:9px; }
    .loading-total { width:190px; height:44px; margin:4px 0 5px; border-radius:9px; background:#ffffff16; animation:pulse 1s infinite alternate; }
    .summary-stats { position:relative; display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
    .summary-stat { display:flex; min-width:0; min-height:87px; flex-direction:column; align-items:center; justify-content:center; gap:3px; padding:9px 5px; border:1px solid #ffffff0d; border-radius:16px; background:#ffffff12; text-align:center; }
    .summary-stat ion-icon { color:#79E300; font-size:18px; }
    .summary-stat strong { max-width:100%; overflow:hidden; font-size:clamp(11px,3.2vw,14px); font-weight:850; text-overflow:ellipsis; white-space:nowrap; }
    .summary-stat span { color:#B7C0CE; font-size:9px; }
    .attention-card { padding:16px; border:1px solid #FFE1BF; border-radius:20px; background:#FFF8EF; }
    .attention-head { display:flex; gap:11px; align-items:flex-start; margin-bottom:8px; }
    .attention-icon { display:grid; flex:0 0 36px; place-items:center; width:36px; height:36px; border-radius:12px; background:#FFE9D1; color:#E06A00; font-size:19px; }
    .attention-head strong { display:block; font-size:12px; font-weight:850; }
    .attention-head span { display:block; margin-top:3px; color:#8A6A48; font-size:10px; line-height:1.4; }
    .attention-row { display:flex; width:100%; align-items:center; gap:8px; padding:10px 2px 2px; border:0; border-top:1px solid #FBE6CC; background:transparent; color:#172033; text-align:left; font-size:11px; }
    .attention-row span { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .attention-row ion-icon { color:#C2854A; }
    .trend-total { flex:0 0 auto; font-size:14px; font-weight:900; }
    .chart { display:flex; align-items:flex-end; gap:6px; height:150px; padding-top:6px; }
    .chart.dense { gap:2px; }
    .chart-col { display:flex; flex:1; min-width:0; height:100%; flex-direction:column; align-items:center; gap:6px; }
    .chart-bar-wrap { display:flex; flex:1; width:100%; align-items:flex-end; justify-content:center; }
    .chart-bar { display:block; width:100%; max-width:26px; min-height:4px; border-radius:7px 7px 3px 3px; background:linear-gradient(180deg,#83E521,#69D900); }
    .chart-bar.empty { background:#EEF1F5; }
    .chart-col small { height:12px; color:#97A1B0; font-size:9px; white-space:nowrap; }
    .chart-skeleton { display:flex; align-items:flex-end; gap:8px; height:150px; }
    .chart-skeleton ion-skeleton-text { flex:1; margin:0; border-radius:7px; }
    .wallet-card,.content-card { min-width:0; padding:19px; border:1px solid #E9EEF3; border-radius:23px; background:#fff; box-shadow:0 5px 20px #1526420c; }
    .section-heading { display:flex; align-items:center; gap:10px; margin-bottom:16px; }
    .section-icon { display:grid; place-items:center; width:40px; height:40px; border-radius:14px; background:#EFFADB; color:#55B900; font-size:20px; }
    .section-heading h2 { margin:0; font-size:13px; font-weight:850; letter-spacing:.06em; }
    .wallet-balance { display:flex; flex-direction:column; align-items:center; gap:5px; padding:17px 12px; border:1px solid #F0F2F5; border-radius:17px; background:#F8FAFC; }
    .wallet-balance>span { color:#8A94A6; font-size:12px; }
    .wallet-balance strong { max-width:100%; color:#172033; font-size:clamp(30px,9vw,38px); line-height:1.1; font-weight:900; letter-spacing:-.03em; overflow-wrap:anywhere; }
    .wallet-balance p { display:flex; align-items:center; gap:7px; margin:2px 0 0; color:#687386; font-size:11px; }
    .wallet-balance i { width:8px; height:8px; border-radius:50%; background:#69D900; }
    .transactions { margin-top:14px; }
    .mini-title { margin:0 0 4px; color:#8A94A6; font-size:10px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; }
    .tx-row { display:flex; align-items:center; gap:10px; padding:9px 0; border-top:1px solid #F0F2F5; }
    .tx-icon { display:grid; flex:0 0 30px; place-items:center; width:30px; height:30px; border-radius:10px; background:#FFF1F0; color:#D92D20; font-size:15px; }
    .tx-icon.credit { background:#EFFADB; color:#55B900; }
    .tx-copy { display:flex; min-width:0; flex:1; flex-direction:column; gap:2px; }
    .tx-copy strong { overflow:hidden; font-size:11px; text-overflow:ellipsis; white-space:nowrap; }
    .tx-copy span { color:#97A1B0; font-size:9px; text-transform:capitalize; }
    .tx-row b { font-size:11px; color:#D92D20; }
    .tx-row b.credit { color:#3F8F00; }
    .wallet-actions { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:14px; }
    .wallet-actions.single { grid-template-columns:1fr; }
    .wallet-actions button { min-width:0; min-height:46px; padding:8px 10px; border-radius:14px; font-size:12px; font-weight:750; }
    .wallet-primary { display:flex; align-items:center; justify-content:center; gap:6px; border:0; background:linear-gradient(135deg,#69D900,#83E521); color:#14210A; }
    .section-title-row { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:16px; }
    .section-title-row h2 { margin:0; font-size:13px; font-weight:850; }
    .section-title-row p { margin:4px 0 0; color:#9099A8; font-size:10px; }
    .view-all { display:flex; flex:0 0 auto; align-items:center; gap:2px; border:0; background:transparent; color:#4C9B00; font-size:11px; font-weight:800; }
    .type-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; margin-bottom:16px; }
    .type-tile { display:flex; flex-direction:column; gap:3px; padding:12px; border:1px solid #EEF1F5; border-radius:16px; background:#F8FAFC; }
    .type-tile span { color:#778296; font-size:10px; font-weight:700; }
    .type-tile strong { font-size:16px; font-weight:900; }
    .type-tile small { color:#4C9B00; font-size:10px; font-weight:700; }
    .breakdown-row + .breakdown-row { margin-top:15px; }
    .breakdown-topline { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:7px; }
    .breakdown-topline div { display:flex; min-width:0; flex-direction:column; gap:2px; }
    .breakdown-topline strong { overflow:hidden; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
    .breakdown-topline span { color:#9099A8; font-size:10px; }
    .breakdown-topline>b { flex:0 0 auto; font-size:12px; }
    .progress-track { height:6px; overflow:hidden; border-radius:9px; background:#F0F2F5; }
    .progress-track span { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#69D900,#93E648); }
    .session-row { display:flex; width:100%; align-items:center; gap:10px; padding:12px 0; border:0; border-top:1px solid #F0F2F5; background:transparent; color:inherit; text-align:left; }
    .session-row.clickable { cursor:pointer; }
    .session-icon { display:grid; flex:0 0 36px; place-items:center; width:36px; height:36px; border-radius:12px; background:#EFFADB; color:#55B900; font-size:19px; }
    .session-icon.upcoming { background:#EAF4FF; color:#1D6FD1; }
    .session-copy { display:flex; min-width:0; flex:1; flex-direction:column; gap:3px; }
    .session-copy strong { overflow:hidden; font-size:11px; text-overflow:ellipsis; white-space:nowrap; }
    .session-copy span { overflow:hidden; color:#778296; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
    .session-copy .session-date { color:#A0A8B5; font-size:9px; }
    .session-amount { flex:0 0 auto; font-size:11px; }
    .student-avatar { display:grid; flex:0 0 36px; place-items:center; width:36px; height:36px; overflow:hidden; border-radius:50%; background:#EFFADB; color:#3F8F00; font-size:12px; font-weight:850; }
    .student-avatar img { width:100%; height:100%; object-fit:cover; }
    .more-copy { margin:8px 0 0; color:#8B95A5; font-size:10px; text-align:center; }
    .pending-copy { display:flex; align-items:center; gap:6px; margin:10px 0 0; padding:9px 11px; border-radius:12px; background:#F8FAFC; color:#687386; font-size:10px; }
    .venue-card { display:flex; gap:12px; padding:12px 0; border-top:1px solid #F0F2F5; }
    .venue-card:first-of-type { border-top:0; padding-top:0; }
    .venue-media { display:grid; flex:0 0 64px; place-items:center; width:64px; height:64px; overflow:hidden; border-radius:16px; background:#F3F5F8; color:#97A1B0; font-size:24px; }
    .venue-media img { width:100%; height:100%; object-fit:cover; }
    .venue-copy { display:flex; min-width:0; flex:1; flex-direction:column; gap:4px; }
    .venue-title { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .venue-title strong { overflow:hidden; font-size:12px; text-overflow:ellipsis; white-space:nowrap; }
    .status-pill { flex:0 0 auto; padding:2px 8px; border-radius:999px; background:#EFFADB; color:#3F8F00; font-size:9px; font-weight:800; text-transform:capitalize; }
    .status-pill.muted { background:#F3F5F8; color:#687386; }
    .venue-sub { overflow:hidden; color:#778296; font-size:10px; text-overflow:ellipsis; white-space:nowrap; }
    .venue-figures { display:flex; gap:14px; color:#778296; font-size:10px; }
    .venue-figures b { color:#172033; }
    .venue-link { display:flex; align-self:flex-start; align-items:center; gap:2px; padding:0; border:0; background:transparent; color:#4C9B00; font-size:11px; font-weight:800; }
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
  private readonly venueCoach = inject(VenueCoachService);
  readonly offers = signal<CoachEmployment[]>([]);
  readonly selectedPeriod = signal<CoachEarningsPeriod>('month');
  readonly loading = signal(true);
  readonly error = signal('');
  readonly data = signal<CoachEarningsPayload | null>(null);
  readonly skeletonBars = [45, 70, 35, 85, 55, 65, 40];
  readonly periods: Array<{ key: CoachEarningsPeriod; label: string }> = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'This Week' },
    { key: 'month', label: 'This Month' },
    { key: 'year', label: 'This Year' },
  ];

  readonly chartPoints = computed(() => {
    const points = this.data()?.chart?.points || [];
    const step = points.length > 12 ? 5 : 1;
    return points.map((point, index) => ({
      ...point,
      showLabel: step === 1 || index === 0 || (index + 1) % step === 0,
    }));
  });

  ngOnInit(): void { this.load(); }

  ionViewWillEnter(): void {
    if (this.data()) this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.venueCoach.coachOffers().subscribe({
      next: (response) => this.offers.set(response.data || []),
      error: () => this.offers.set([]),
    });
    this.coach.getEarnings(this.selectedPeriod()).subscribe({
      next: (response) => { this.data.set(response.data || null); this.loading.set(false); },
      error: () => { this.error.set('Could not load your earnings. Please try again.'); this.loading.set(false); },
    });
  }

  selectPeriod(period: CoachEarningsPeriod): void {
    if (this.selectedPeriod() === period) return;
    this.selectedPeriod.set(period);
    this.load();
  }

  selectedPeriodLabel(): string { return this.periods.find((item) => item.key === this.selectedPeriod())?.label || 'This Month'; }

  changeText(): string {
    const data = this.data();
    const previous = data?.range?.previous_label || 'the previous period';
    const percent = data?.change_percent;
    if (percent === null || percent === undefined) {
      return (data?.total || 0) > 0 ? `Up from ₹0 ${previous}` : 'No completed sessions in this period yet';
    }
    if (percent === 0) return `Same as ${previous}`;
    return `${percent > 0 ? '+' : ''}${percent}% vs ${previous}`;
  }

  barHeight(amount: number): number {
    const max = this.data()?.chart?.max || 0;
    if (max <= 0 || amount <= 0) return 3;
    return Math.max(6, Math.round((amount / max) * 100));
  }

  initialsOf(name: string): string {
    return (name || '?').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
  }

  openSession(session: CoachEarningsSessionItem): void {
    void this.router.navigate(['/app/coach/session', session.id]);
  }

  currency(value: number): string { return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`; }
  trackBreakdown(_index: number, item: CoachEarningsPayload['breakdown'][number]): string { return item.label; }
  trackSession(_index: number, item: CoachEarningsSessionItem): string { return item.id; }
  go(path: string): void { void this.router.navigateByUrl(path); }
}
