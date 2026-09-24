import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import {
  CoachInsightMetric,
  CoachInsightsPayload,
  CoachInsightsPeriod,
} from '../../core/models/api.model';
import { CoachService } from '../../core/services/coach.service';

type ColouredMetric = CoachInsightMetric & { color: string };

@Component({
  selector: 'app-coach-insights',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true" class="insights-content-shell">
      <main class="insights-page">
        <header class="insights-header">
          <button type="button" class="icon-button" (click)="back()" aria-label="Back to coach dashboard">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <div class="header-copy">
            <h1>Coach Insights</h1>
            <p>{{ rangeLabel() }}</p>
          </div>
          <button type="button" class="icon-button" (click)="openCalendar()" aria-label="Choose insights date">
            <ion-icon name="calendar-outline"></ion-icon>
          </button>
        </header>

        <nav class="period-tabs" role="tablist" aria-label="Insights period">
          <button
            *ngFor="let option of periodOptions"
            type="button"
            role="tab"
            class="period-chip"
            [class.active]="selectedPeriod() === option.value"
            [attr.aria-selected]="selectedPeriod() === option.value"
            (click)="selectPeriod(option.value)">
            {{ option.label }}
          </button>
        </nav>

        <div *ngIf="loading()" class="status-strip" aria-live="polite">
          <ion-spinner name="crescent"></ion-spinner>
          <span>Refreshing insights…</span>
        </div>
        <div *ngIf="error()" class="status-strip error" role="alert">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <span>{{ error() }}</span>
          <button type="button" (click)="loadInsights()">Retry</button>
        </div>

        <section class="page-body" [class.is-loading]="loading()">
          <article class="growth-card">
            <div class="growth-card__top">
              <div class="score-ring" [style.--score]="growthIndex()">
                <svg viewBox="0 0 100 100" aria-hidden="true">
                  <circle class="score-ring__track" cx="50" cy="50" r="42"></circle>
                  <circle class="score-ring__value" cx="50" cy="50" r="42"
                    [attr.stroke-dashoffset]="263.89 - (263.89 * growthIndex() / 100)"></circle>
                </svg>
                <div><strong>{{ growthIndex() }}</strong><span>/100</span></div>
              </div>
              <div class="growth-copy">
                <p class="eyebrow">Coach growth index</p>
                <div class="rating-stars" [attr.aria-label]="rating() + ' out of 5 stars'">
                  <ion-icon *ngFor="let star of stars" name="star" [class.dim]="star > rating()"></ion-icon>
                </div>
                <h2>{{ coachLevel() }}</h2>
                <p>{{ growthSummary() }}</p>
              </div>
            </div>
            <div class="quick-grid">
              <div *ngFor="let item of quickStats()" class="quick-stat">
                <ion-icon [name]="quickIcon(item.icon)"></ion-icon>
                <strong>{{ item.value }}</strong>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </article>

          <section class="section-block">
            <div class="section-title outside">
              <div><h2>Performance overview</h2><p>Compared with the previous period</p></div>
              <span>{{ rangeLabel() }}</span>
            </div>
            <div class="performance-grid">
              <article *ngFor="let metric of performanceMetrics()" class="metric-card">
                <div class="metric-card__head">
                  <span class="metric-icon" [style.background]="metric.color + '18'">
                    <ion-icon [name]="performanceIcon(metric.id)" [style.color]="metric.color"></ion-icon>
                  </span>
                  <span class="trend" [class.negative]="!metric.positive">{{ metric.change }}</span>
                </div>
                <strong class="metric-value">{{ metric.value }}</strong>
                <span class="metric-label">{{ metric.label }}</span>
                <svg class="sparkline" viewBox="0 0 120 32" preserveAspectRatio="none" aria-hidden="true">
                  <polyline [attr.points]="sparklinePoints(metric.id)" fill="none" [attr.stroke]="metric.color" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
                </svg>
              </article>
            </div>
          </section>

          <article class="content-card">
            <div class="section-title"><div><h2>Business performance</h2><p>Real activity and completed-session earnings</p></div></div>
            <div class="business-list">
              <div *ngFor="let item of businessMetrics()" class="business-row">
                <span class="business-icon" [style.background]="item.color + '18'">
                  <ion-icon [name]="businessIcon(item.id)" [style.color]="item.color"></ion-icon>
                </span>
                <div class="business-copy">
                  <div><span>{{ item.label }}</span><strong [style.color]="item.color">{{ item.value }}</strong></div>
                  <div class="progress-track"><span [style.width]="clampPercent(item.pct) + '%'" [style.background]="item.color"></span></div>
                  <small>{{ item.sub }}</small>
                </div>
              </div>
            </div>
          </article>

          <article class="content-card">
            <div class="section-title"><div><h2>Student growth</h2><p>Progress measured from coach evaluations</p></div></div>
            <div class="growth-metrics">
              <div *ngFor="let item of studentGrowthCards()" class="growth-metric" [style.--accent]="item.color">
                <span><ion-icon [name]="item.icon"></ion-icon></span>
                <strong>{{ item.value }}</strong>
                <small>{{ item.label }}</small>
              </div>
            </div>
            <div class="wide-progress">
              <div><strong>Students improved this period</strong><span>{{ studentGrowth().improvedStudents }} / {{ studentGrowth().evaluatedStudents }}</span></div>
              <div class="progress-track"><span [style.width]="studentGrowthProgress() + '%'"></span></div>
            </div>
            <div *ngIf="studentHighlights().length; else noHighlights" class="highlight-list">
              <div *ngFor="let item of studentHighlights()" class="highlight-row">
                <span class="highlight-icon"><ion-icon [name]="item.icon + '-outline'"></ion-icon></span>
                <div><small>{{ item.label }}</small><strong>{{ item.name }}</strong><p>{{ item.sub }}</p></div>
                <ion-icon class="highlight-badge" [name]="item.badgeIcon + '-outline'"></ion-icon>
              </div>
            </div>
            <ng-template #noHighlights><p class="empty-copy">Complete at least two evaluations for a student to unlock improvement highlights.</p></ng-template>
          </article>

          <article class="content-card">
            <div class="section-title"><div><h2>Student retention</h2><p>How consistently students stay engaged</p></div></div>
            <div class="retention-grid">
              <div *ngFor="let item of retentionCards()" class="retention-item">
                <div class="mini-ring" [style.--accent]="item.color" [style.--ring-progress]="clampPercent(item.pct)">
                  <svg viewBox="0 0 60 60" aria-hidden="true">
                    <circle class="mini-ring__track" cx="30" cy="30" r="24"></circle>
                    <circle class="mini-ring__value" cx="30" cy="30" r="24" [attr.stroke-dashoffset]="150.8 - (150.8 * clampPercent(item.pct) / 100)"></circle>
                  </svg>
                  <strong>{{ clampPercent(item.pct) }}%</strong>
                </div>
                <span>{{ item.label }}</span>
              </div>
            </div>
            <div class="retention-summary">
              <div *ngFor="let item of retentionSummary()">
                <strong [style.color]="item.color">{{ item.value }}</strong>
                <span>{{ item.label }}</span>
              </div>
            </div>
          </article>

          <article class="content-card">
            <div class="section-title"><div><h2>Review highlights</h2><p>Published feedback in this period</p></div></div>
            <div *ngIf="reviewTags().length" class="review-tags">
              <span *ngFor="let tag of reviewTags()">{{ tag.label }} <b>{{ tag.count }}</b></span>
            </div>
            <div class="review-summary"><ion-icon name="chatbubble-ellipses-outline"></ion-icon><p>{{ reviewSummary() }}</p></div>
          </article>

          <article class="content-card">
            <div class="section-title"><div><h2>Booking journey</h2><p>From profile views to returning students</p></div></div>
            <div class="funnel-list">
              <div *ngFor="let step of funnelSteps()" class="funnel-row">
                <div><strong>{{ step.label }}</strong><b>{{ step.value }}</b></div>
                <div class="funnel-track"><span [style.width]="clampPercent(step.pct) + '%'"></span><em>{{ clampPercent(step.pct) }}%</em></div>
                <small *ngIf="step.conversionTo">{{ step.conversionTo }} conversion to next step</small>
              </div>
            </div>
          </article>

          <button type="button" class="coach-tip" (click)="go('/app/profile/edit')">
            <span>Coach tip</span>
            <strong>Keep your profile fresh</strong>
            <p>Refresh coaching details, availability and achievements so more players can find you.</p>
            <b>Edit profile <ion-icon name="arrow-forward-outline"></ion-icon></b>
          </button>
        </section>
      </main>

      <ion-modal class="calendar-modal" [isOpen]="calendarOpen()" [initialBreakpoint]="0.72" [breakpoints]="[0, 0.72, 1]" (didDismiss)="closeCalendar()">
        <ng-template>
          <section class="calendar-sheet">
            <div class="calendar-sheet__head">
              <div><span>Insights date</span><h2>Choose a day</h2></div>
              <button type="button" (click)="closeCalendar()" aria-label="Close calendar"><ion-icon name="close-outline"></ion-icon></button>
            </div>
            <ion-datetime presentation="date" [value]="selectedDate()" [max]="today" (ionChange)="selectDate($event.detail.value)"></ion-datetime>
            <p>The selected date anchors the active reporting period.</p>
          </section>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    :host { --ink:#101828; --muted:#7d8aa5; --line:#e9edf2; --surface:#fff; --lime:var(--app-primary,#7cf000); display:block; }
    .insights-content-shell { --background:#f6f8fa; }
    .insights-page { min-height:100%; background:#f6f8fa; color:var(--ink); padding-bottom:calc(96px + env(safe-area-inset-bottom)); }
    .insights-header { position:sticky; top:0; z-index:30; height:64px; padding:0 16px; display:grid; grid-template-columns:44px minmax(0,1fr) 44px; align-items:center; background:rgba(255,255,255,.96); border-bottom:1px solid var(--line); backdrop-filter:blur(14px); }
    .icon-button { width:42px; height:42px; border:0; border-radius:14px; display:grid; place-items:center; color:var(--ink); background:#f2f4f7; font-size:21px; }
    .header-copy { min-width:0; text-align:center; padding:0 8px; }
    .header-copy h1 { margin:0; font-size:17px; line-height:1.15; font-weight:900; }
    .header-copy p { margin:3px 0 0; color:var(--muted); font-size:10px; line-height:1.2; font-weight:650; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .period-tabs { position:sticky; top:64px; z-index:25; display:flex; gap:8px; padding:10px 16px 12px; overflow-x:auto; background:#fff; border-bottom:1px solid var(--line); scrollbar-width:none; }
    .period-tabs::-webkit-scrollbar { display:none; }
    .period-chip { flex:0 0 auto; min-height:36px; padding:0 14px; border:1px solid transparent; border-radius:999px; background:#f1f3f6; color:#667085; font-size:12px; line-height:1; font-weight:800; white-space:nowrap; }
    .period-chip.active { background:var(--lime); color:#101828; box-shadow:0 5px 14px rgba(116,230,0,.22); }
    .status-strip { max-width:680px; margin:10px 16px 0; padding:10px 12px; border:1px solid var(--line); border-radius:14px; display:flex; align-items:center; gap:9px; background:#fff; color:#667085; font-size:12px; font-weight:750; }
    .status-strip ion-spinner { width:17px; height:17px; color:var(--lime); }
    .status-strip.error { color:#b42318; background:#fff6f5; border-color:#ffd5d1; }
    .status-strip button { margin-left:auto; border:0; border-radius:999px; padding:6px 10px; color:#b42318; background:#fff; font-weight:850; }
    .page-body { max-width:680px; margin:0 auto; padding:16px; display:grid; gap:16px; transition:opacity .18s ease; }
    .page-body.is-loading { opacity:.68; }
    .growth-card { position:relative; overflow:hidden; padding:20px; border-radius:24px; color:#fff; background:linear-gradient(145deg,#111827,#1f2937); box-shadow:0 12px 28px rgba(15,23,42,.18); }
    .growth-card::after { content:""; position:absolute; width:150px; height:150px; right:-48px; top:-54px; border-radius:50%; background:rgba(116,230,0,.11); }
    .growth-card__top { position:relative; z-index:1; display:grid; grid-template-columns:92px minmax(0,1fr); gap:16px; align-items:center; }
    .score-ring { width:92px; height:92px; position:relative; display:grid; place-items:center; }
    .score-ring svg { position:absolute; inset:0; transform:rotate(-90deg); }
    .score-ring circle { fill:none; stroke-width:7; }
    .score-ring__track { stroke:rgba(255,255,255,.10); }
    .score-ring__value { stroke:var(--lime); stroke-dasharray:263.89; stroke-linecap:round; transition:stroke-dashoffset .35s ease; }
    .score-ring div { text-align:center; display:grid; }
    .score-ring strong { font-size:27px; line-height:1; font-weight:950; font-variant-numeric:tabular-nums; }
    .score-ring span { margin-top:4px; color:rgba(255,255,255,.52); font-size:10px; }
    .growth-copy { min-width:0; }
    .growth-copy .eyebrow { margin:0 0 5px; color:var(--lime); font-size:10px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .rating-stars { display:flex; gap:2px; margin-bottom:4px; color:#fbbf24; font-size:14px; }
    .rating-stars .dim { opacity:.25; }
    .growth-copy h2 { margin:0; font-size:18px; line-height:1.2; font-weight:900; }
    .growth-copy > p:last-child { margin:4px 0 0; color:rgba(255,255,255,.58); font-size:11px; line-height:1.4; }
    .quick-grid { position:relative; z-index:1; margin-top:18px; padding-top:16px; border-top:1px solid rgba(255,255,255,.10); display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:5px; }
    .quick-stat { min-width:0; display:flex; flex-direction:column; align-items:center; text-align:center; }
    .quick-stat ion-icon { color:rgba(255,255,255,.82); font-size:18px; }
    .quick-stat strong { max-width:100%; margin-top:5px; font-size:15px; line-height:1.1; font-weight:900; font-variant-numeric:tabular-nums; overflow:hidden; text-overflow:ellipsis; }
    .quick-stat span { margin-top:3px; color:rgba(255,255,255,.46); font-size:9px; line-height:1.15; }
    .section-block { min-width:0; }
    .section-title { min-width:0; display:flex; justify-content:space-between; align-items:flex-start; gap:10px; margin-bottom:16px; }
    .section-title.outside { margin:1px 2px 12px; }
    .section-title h2 { margin:0; color:var(--ink); font-size:14px; line-height:1.2; font-weight:900; letter-spacing:.055em; text-transform:uppercase; }
    .section-title p { margin:4px 0 0; color:#8b98b2; font-size:10px; line-height:1.35; font-weight:600; }
    .section-title > span { flex:0 0 auto; max-width:46%; padding:6px 9px; border-radius:999px; color:#4e6500; background:#effbdc; font-size:9px; font-weight:800; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .performance-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .metric-card,.content-card { min-width:0; background:#fff; border:1px solid var(--line); box-shadow:0 6px 18px rgba(15,23,42,.045); }
    .metric-card { min-height:152px; padding:14px; border-radius:18px; display:flex; flex-direction:column; overflow:hidden; }
    .metric-card__head { display:flex; align-items:center; justify-content:space-between; gap:6px; }
    .metric-icon { width:34px; height:34px; flex:0 0 auto; border-radius:11px; display:grid; place-items:center; font-size:17px; }
    .trend { max-width:68%; padding:4px 7px; border-radius:999px; color:#16803a; background:#effcf3; font-size:9px; line-height:1.15; font-weight:850; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .trend.negative { color:#b42318; background:#fff1f0; }
    .metric-value { margin-top:11px; color:var(--ink); font-size:22px; line-height:1; font-weight:950; font-variant-numeric:tabular-nums; }
    .metric-label { min-height:24px; margin-top:5px; color:#8b98b2; font-size:10px; line-height:1.25; font-weight:700; }
    .sparkline { width:100%; height:27px; margin-top:auto; overflow:visible; }
    .content-card { padding:18px; border-radius:22px; }
    .business-list { display:grid; gap:16px; }
    .business-row { min-width:0; display:grid; grid-template-columns:38px minmax(0,1fr); gap:11px; align-items:center; }
    .business-icon { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; font-size:18px; }
    .business-copy { min-width:0; }
    .business-copy > div:first-child { display:flex; align-items:baseline; justify-content:space-between; gap:8px; }
    .business-copy span { min-width:0; color:#344054; font-size:11px; line-height:1.25; font-weight:750; }
    .business-copy strong { flex:0 0 auto; max-width:48%; font-size:13px; line-height:1.2; font-weight:900; text-align:right; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .business-copy small { display:block; margin-top:4px; color:#98a2b3; font-size:9px; line-height:1.25; }
    .progress-track { height:7px; margin-top:6px; overflow:hidden; border-radius:999px; background:#edf0f3; }
    .progress-track span { display:block; height:100%; border-radius:inherit; background:var(--lime); transition:width .3s ease; }
    .growth-metrics { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
    .growth-metric { min-width:0; min-height:128px; padding:13px 8px; border:1px solid #e8edf1; border-radius:18px; background:#f8fafb; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; }
    .growth-metric > span { width:34px; height:34px; border-radius:11px; display:grid; place-items:center; color:var(--accent); background:#fff; font-size:19px; }
    .growth-metric strong { max-width:100%; margin-top:8px; font-size:17px; line-height:1.1; font-weight:950; font-variant-numeric:tabular-nums; overflow:hidden; text-overflow:ellipsis; }
    .growth-metric small { margin-top:6px; color:#8190aa; font-size:9px; line-height:1.25; font-weight:650; overflow-wrap:anywhere; }
    .wide-progress { margin-top:14px; padding:15px; border:1px solid #edf0f3; border-radius:17px; background:#f8fafb; }
    .wide-progress > div:first-child { display:flex; align-items:center; justify-content:space-between; gap:8px; }
    .wide-progress strong { font-size:11px; line-height:1.3; }
    .wide-progress > div > span { flex:0 0 auto; color:#64d500; font-size:12px; font-weight:900; }
    .highlight-list { display:grid; gap:10px; margin-top:12px; }
    .highlight-row { min-width:0; display:grid; grid-template-columns:38px minmax(0,1fr) 24px; gap:10px; align-items:center; padding:13px; border:1px solid #edf0f3; border-radius:17px; background:#f8fafb; }
    .highlight-icon { width:38px; height:38px; border-radius:12px; display:grid; place-items:center; color:#f59e0b; background:#fff8e6; font-size:20px; }
    .highlight-row > div { min-width:0; }
    .highlight-row small { display:block; color:#98a2b3; font-size:9px; line-height:1.2; font-weight:850; letter-spacing:.05em; text-transform:uppercase; }
    .highlight-row strong { display:block; margin-top:2px; font-size:12px; line-height:1.3; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .highlight-row p { margin:2px 0 0; color:#8290a9; font-size:9px; line-height:1.3; }
    .highlight-badge { color:#ff7a00; font-size:22px; }
    .empty-copy { margin:13px 0 0; padding:14px; border-radius:15px; color:#7d8aa5; background:#f8fafb; font-size:10px; line-height:1.45; text-align:center; }
    .retention-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; }
    .retention-item { min-width:0; display:flex; flex-direction:column; align-items:center; text-align:center; }
    .mini-ring { width:58px; height:58px; position:relative; display:grid; place-items:center; }
    .mini-ring svg { position:absolute; inset:0; transform:rotate(-90deg); }
    .mini-ring circle { fill:none; stroke-width:5; }
    .mini-ring__track { stroke:#edf0f3; }
    .mini-ring__value { stroke:var(--accent); stroke-dasharray:150.8; stroke-linecap:round; }
    .mini-ring strong { font-size:10px; font-weight:950; font-variant-numeric:tabular-nums; }
    .retention-item > span { margin-top:7px; color:#7d8aa5; font-size:8.5px; line-height:1.25; font-weight:700; overflow-wrap:anywhere; }
    .retention-summary { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:16px; }
    .retention-summary > div { min-width:0; padding:14px; border:1px solid #edf0f3; border-radius:17px; background:#f8fafb; }
    .retention-summary strong { display:block; font-size:16px; line-height:1.15; font-weight:950; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .retention-summary span { display:block; margin-top:5px; color:#8b98b2; font-size:9px; line-height:1.25; font-weight:700; }
    .review-tags { display:flex; flex-wrap:wrap; gap:7px; margin-bottom:12px; }
    .review-tags span { padding:6px 10px; border:1px solid #e8edf1; border-radius:999px; background:#f8fafb; font-size:10px; font-weight:750; }
    .review-tags b { color:#6bcf00; }
    .review-summary { display:grid; grid-template-columns:32px minmax(0,1fr); gap:10px; align-items:start; padding:14px; border:1px solid #def4c5; border-radius:16px; background:#f5fde9; }
    .review-summary ion-icon { color:#62c700; font-size:22px; }
    .review-summary p { margin:0; color:#667085; font-size:10px; line-height:1.45; }
    .funnel-list { display:grid; gap:15px; }
    .funnel-row > div:first-child { display:flex; justify-content:space-between; gap:10px; }
    .funnel-row strong,.funnel-row b { font-size:11px; line-height:1.3; }
    .funnel-row b { font-weight:950; font-variant-numeric:tabular-nums; }
    .funnel-track { display:grid; grid-template-columns:minmax(0,1fr) 38px; align-items:center; gap:9px; margin-top:7px; }
    .funnel-track::before { content:""; grid-column:1; grid-row:1; height:10px; border-radius:999px; background:#edf0f3; }
    .funnel-track span { grid-column:1; grid-row:1; height:10px; min-width:0; border-radius:999px; background:linear-gradient(90deg,#68dc00,#92f337); }
    .funnel-track em { grid-column:2; grid-row:1; color:#63d400; font-size:10px; font-style:normal; font-weight:900; text-align:right; }
    .funnel-row small { display:block; margin:5px 47px 0 0; color:#98a2b3; font-size:9px; line-height:1.25; text-align:right; }
    .coach-tip { width:100%; min-height:150px; padding:20px; border:0; border-radius:22px; color:#fff; background:linear-gradient(135deg,#ff7200,#ff9c46); box-shadow:0 8px 22px rgba(255,114,0,.24); text-align:left; overflow:hidden; }
    .coach-tip > span { display:block; color:rgba(255,255,255,.72); font-size:9px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .coach-tip > strong { display:block; margin-top:6px; font-size:17px; line-height:1.2; font-weight:900; }
    .coach-tip p { max-width:440px; margin:7px 0 0; color:rgba(255,255,255,.82); font-size:11px; line-height:1.45; }
    .coach-tip b { display:flex; align-items:center; gap:6px; margin-top:14px; font-size:12px; }
    .calendar-sheet { padding:18px 18px 24px; color:var(--ink); background:#fff; }
    .calendar-sheet__head { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
    .calendar-sheet__head span { color:#98a2b3; font-size:9px; font-weight:900; letter-spacing:.08em; text-transform:uppercase; }
    .calendar-sheet__head h2 { margin:3px 0 0; font-size:20px; }
    .calendar-sheet__head button { width:40px; height:40px; border:0; border-radius:14px; display:grid; place-items:center; background:#f2f4f7; font-size:21px; }
    .calendar-sheet ion-datetime { width:100%; --background:#fff; --ion-color-primary:var(--lime); }
    .calendar-sheet > p { margin:8px 0 0; color:#7d8aa5; font-size:10px; line-height:1.4; text-align:center; }
    @media (min-width:700px) { .insights-header,.period-tabs { max-width:680px; margin-left:auto; margin-right:auto; } .status-strip { margin-left:auto; margin-right:auto; } }
    @media (max-width:359px) {
      .page-body { padding:12px; gap:13px; }
      .growth-card,.content-card { padding:15px; }
      .growth-card__top { grid-template-columns:78px minmax(0,1fr); gap:12px; }
      .score-ring { width:78px; height:78px; }
      .quick-stat strong { font-size:13px; }
      .growth-metrics { gap:6px; }
      .growth-metric { min-height:116px; padding:10px 5px; }
      .growth-metric strong { font-size:15px; }
      .retention-grid { grid-template-columns:repeat(2,minmax(0,1fr)); row-gap:14px; }
      .metric-card { padding:12px; }
    }
  `],
})
export class CoachInsightsPage {
  private readonly router = inject(Router);
  private readonly coach = inject(CoachService);

  readonly today = this.dateKey(new Date());
  readonly stars = [1, 2, 3, 4, 5];
  readonly periodOptions: Array<{ label: string; value: CoachInsightsPeriod }> = [
    { label: 'Last 7 Days', value: 'last_7_days' },
    { label: 'Last 30 Days', value: 'last_30_days' },
    { label: 'This Month', value: 'this_month' },
    { label: 'This Year', value: 'this_year' },
  ];

  readonly selectedPeriod = signal<CoachInsightsPeriod>('last_30_days');
  readonly selectedDate = signal(this.today);
  readonly calendarOpen = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly data = signal<CoachInsightsPayload | null>(null);

  readonly growthIndex = computed(() => this.clampPercent(this.data()?.growth.index ?? 0));
  readonly coachLevel = computed(() => this.data()?.growth.level ?? 'Getting Started');
  readonly growthSummary = computed(() => this.data()?.growth.summary ?? 'Loading activity…');
  readonly rangeLabel = computed(() => this.data()?.range.label ?? this.formatDate(this.selectedDate()));
  readonly rating = computed(() => {
    const value = this.data()?.quickStats.find(item => item.label.toLowerCase().includes('rating'))?.value;
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
  });
  readonly quickStats = computed(() => this.data()?.quickStats ?? []);
  readonly performanceMetrics = computed<ColouredMetric[]>(() => (this.data()?.performance ?? []).map(item => ({ ...item, color: this.metricColor(item.id) })));
  readonly businessMetrics = computed(() => this.data()?.businessMetrics ?? []);
  readonly studentGrowth = computed(() => this.data()?.studentGrowth ?? { activeStudents: 0, evaluatedStudents: 0, improvedStudents: 0, averageImprovement: 0 });
  readonly studentGrowthCards = computed(() => {
    const growth = this.studentGrowth();
    const improvement = `${growth.averageImprovement > 0 ? '+' : ''}${growth.averageImprovement}`;
    return [
      { icon: 'people-outline', label: 'Active students', value: String(growth.activeStudents), color: '#F59E0B' },
      { icon: 'trending-up-outline', label: 'Students improved', value: `${growth.improvedStudents}/${growth.evaluatedStudents}`, color: '#22C55E' },
      { icon: 'analytics-outline', label: 'Avg improvement', value: `${improvement} pts`, color: '#7C3AED' },
    ];
  });
  readonly studentGrowthProgress = computed(() => {
    const growth = this.studentGrowth();
    return growth.evaluatedStudents ? this.clampPercent((growth.improvedStudents / growth.evaluatedStudents) * 100) : 0;
  });
  readonly studentHighlights = computed(() => this.data()?.studentHighlights ?? []);
  readonly retentionCards = computed(() => {
    const retention = this.data()?.retention;
    return [
      { label: 'Repeat rate', pct: retention?.repeatRate ?? 0, color: '#74E600' },
      { label: 'Renewals', pct: retention?.renewalRate ?? 0, color: '#FF7A00' },
      { label: 'Satisfaction', pct: retention?.satisfaction ?? 0, color: '#38BDF8' },
      { label: 'Evaluation', pct: retention?.evaluationCoverage ?? 0, color: '#7C3AED' },
    ];
  });
  readonly retentionSummary = computed(() => [
    { label: 'Avg coaching duration', value: this.data()?.retention.duration ?? '—', color: '#65D800' },
    { label: 'Returning students', value: `${this.data()?.retention.returningStudents ?? 0} in period`, color: '#FF7A00' },
  ]);
  readonly reviewTags = computed(() => this.data()?.reviewTags ?? []);
  readonly reviewSummary = computed(() => this.data()?.reviewSummary ?? 'No published reviews in this period.');
  readonly funnelSteps = computed(() => this.data()?.funnel ?? []);

  ionViewWillEnter(): void { this.loadInsights(); }

  selectPeriod(period: CoachInsightsPeriod): void {
    if (this.selectedPeriod() === period) return;
    this.selectedPeriod.set(period);
    this.loadInsights();
  }

  openCalendar(): void { this.calendarOpen.set(true); }
  closeCalendar(): void { this.calendarOpen.set(false); }

  selectDate(value: string | string[] | null | undefined): void {
    const next = Array.isArray(value) ? value[0] : value;
    if (!next) return;
    this.selectedDate.set(String(next).slice(0, 10));
    this.closeCalendar();
    this.loadInsights();
  }

  loadInsights(): void {
    this.loading.set(true);
    this.error.set('');
    this.coach.getInsights(this.selectedDate(), this.selectedPeriod()).subscribe({
      next: response => {
        if (!response.data) {
          this.error.set('No insight data was returned.');
        } else {
          this.data.set(response.data);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Insights could not be loaded for this period.');
        this.loading.set(false);
      },
    });
  }

  back(): void { this.router.navigateByUrl('/app/coach/dashboard'); }
  go(path: string): void { this.router.navigateByUrl(path); }

  quickIcon(icon: string): string {
    return ({ star: 'star-outline', people: 'people-outline', flash: 'flash-outline', cash: 'wallet-outline' } as Record<string, string>)[icon] || 'analytics-outline';
  }

  performanceIcon(id: string): string {
    return ({ views: 'eye-outline', bookings: 'calendar-outline', acceptance: 'checkmark-circle-outline', completion: 'trophy-outline', repeat: 'refresh-outline', rating: 'star-outline' } as Record<string, string>)[id] || 'analytics-outline';
  }

  businessIcon(id: string): string {
    return ({ earnings: 'wallet-outline', average_price: 'cash-outline', sessions: 'fitness-outline', students: 'people-outline', completion: 'checkmark-done-outline', requests: 'mail-unread-outline' } as Record<string, string>)[id] || 'analytics-outline';
  }

  sparklinePoints(id: string): string {
    const values = this.data()?.sparklines[id] ?? [0];
    if (values.length < 2) return '0,16 120,16';
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    return values.map((value, index) => `${(index / (values.length - 1)) * 120},${29 - ((value - min) / range) * 26}`).join(' ');
  }

  clampPercent(value: number): number { return Math.max(0, Math.min(100, Math.round(Number(value) || 0))); }

  private metricColor(id: string): string {
    return ({ views: '#74E600', bookings: '#FF7A00', acceptance: '#38BDF8', completion: '#22C55E', repeat: '#7C3AED', rating: '#F59E0B' } as Record<string, string>)[id] || '#667085';
  }

  private dateKey(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(value: string): string {
    return new Date(`${value}T12:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
