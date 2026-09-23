import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="page">
        <header class="hero">
          <div class="hero-top">
            <div>
              <p class="eyebrow">Admin Panel</p>
              <h1>Tyng Dashboard</h1>
            </div>
            <button type="button" class="bell">
              <ion-icon name="notifications-outline"></ion-icon>
              <span class="dot"></span>
            </button>
          </div>

          <div class="stats">
            <div class="stat" *ngFor="let s of stats">
              <div class="stat-icon" [style.color]="s.color">
                <ion-icon [name]="s.icon"></ion-icon>
              </div>
              <p class="stat-value">{{ s.value }}</p>
              <p class="stat-label">{{ s.label }}</p>
              <p class="stat-change">{{ s.change }}</p>
            </div>
          </div>
        </header>

        <section class="section">
          <h3>Coach &amp; Venue Operations</h3>
          <p *ngIf="operationsLoading" class="text-sm text-slate-500">Loading live scheduling activity…</p>
          <p *ngIf="operationsError" class="text-sm text-red-600">{{ operationsError }}</p>
          <div *ngIf="operations as ops" class="bg-white rounded-2xl border border-slate-200 p-4">
            <div class="grid grid-cols-2 gap-3 mb-4">
              <div><p class="text-xl font-bold m-0">{{ ops.stats.pending_partnerships }}</p><p class="text-xs text-slate-500 m-0">Partnership requests</p></div>
              <div><p class="text-xl font-bold m-0">{{ ops.stats.pending_venue_approval }}</p><p class="text-xs text-slate-500 m-0">Sessions awaiting venue</p></div>
              <div><p class="text-xl font-bold m-0">{{ ops.stats.participants }}</p><p class="text-xs text-slate-500 m-0">Player invitations</p></div>
              <div><p class="text-xl font-bold m-0">₹{{ ops.stats.scheduled_value | number:'1.0-0' }}</p><p class="text-xs text-slate-500 m-0">Confirmed/completed listed value</p></div>
            </div>
            <p class="text-xs text-slate-500 mb-2">{{ ops.stats.coaches }} coaches · {{ ops.stats.venues }} venues · {{ ops.stats.players }} players · {{ ops.stats.sessions }} scheduled sessions</p>
            <h4 class="text-sm font-bold mt-4 mb-2">Partnership requests awaiting review</h4>
            <p *ngIf="!ops.pending_partnership_requests.length" class="text-sm text-slate-500">No venue partnership requests are waiting.</p>
            <div *ngFor="let request of ops.pending_partnership_requests" class="activity">
              <div><p class="act-action">{{ request.coach }}</p><p class="act-user">Partnering with {{ request.venue }}</p></div>
              <span class="act-time">Pending</span>
            </div>
            <p *ngIf="!ops.recent_sessions.length" class="text-sm text-slate-500 mb-0">No coaching sessions have been scheduled yet.</p>
            <div *ngFor="let item of ops.recent_sessions" class="activity">
              <div class="min-w-0"><p class="act-action truncate">{{ item.title }} · {{ item.sport }}</p><p class="act-user truncate">{{ item.coach }} at {{ item.venue }} · {{ item.players.join(', ') || 'No players added' }}</p></div>
              <span class="act-time">{{ item.status.replace('_', ' ') }}</span>
            </div>
          </div>
        </section>

        <section class="section">
          <h3>Quick Actions</h3>
          <div class="actions">
            <button type="button" class="action" *ngFor="let a of actions" (click)="go(a.path)">
              <div class="action-icon"><ion-icon [name]="a.icon"></ion-icon></div>
              <span>{{ a.label }}</span>
              <ion-icon name="chevron-forward" class="chevron"></ion-icon>
            </button>
          </div>
        </section>

        <section *ngIf="false" class="section">
          <h3>Alerts</h3>
          <div class="alert" *ngFor="let alert of alerts" [class.high]="alert.severity === 'high'">
            <ion-icon name="alert-circle-outline"></ion-icon>
            <div>
              <p class="alert-msg">{{ alert.message }}</p>
              <p class="alert-time">{{ alert.time }}</p>
            </div>
          </div>
        </section>

        <section *ngIf="false" class="section">
          <h3>Recent Activity</h3>
          <div class="activity" *ngFor="let item of activity">
            <div>
              <p class="act-action">{{ item.action }}</p>
              <p class="act-user">{{ item.user }}</p>
            </div>
            <span class="act-time">{{ item.time }}</span>
          </div>
        </section>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .page {
        min-height: 100%;
        background: #fafbfc;
        padding-bottom: calc(112px + var(--safe-area-bottom));
      }

      .hero {
        background: linear-gradient(180deg, rgba(var(--app-primary-rgb), 0.2), transparent);
        padding: calc(24px + var(--safe-area-top)) 24px 32px;
      }

      .hero-top {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 24px;
      }

      .eyebrow {
        margin: 0;
        font-size: 14px;
        color: #6b7280;
      }

      h1 {
        margin: 4px 0 0;
        font-size: 28px;
        font-weight: 700;
        color: #111827;
      }

      .bell {
        width: 40px;
        height: 40px;
        min-height: unset;
        border-radius: 50%;
        background: #fff;
        display: grid;
        place-items: center;
        position: relative;
        font-size: 20px;
        color: #111827;
      }

      .dot {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 8px;
        height: 8px;
        background: #38bdf8;
        border-radius: 50%;
      }

      .stats {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .stat {
        background: #fff;
        border-radius: 20px;
        padding: 16px;
        border: 1px solid #e5e7eb;
      }

      .stat-icon {
        font-size: 22px;
        margin-bottom: 8px;
      }

      .stat-value {
        margin: 0;
        font-size: 22px;
        font-weight: 800;
        color: #111827;
      }

      .stat-label {
        margin: 2px 0 0;
        font-size: 12px;
        color: #6b7280;
      }

      .stat-change {
        margin: 6px 0 0;
        font-size: 12px;
        font-weight: 700;
        color: var(--app-primary);
      }

      .section {
        padding: 0 24px 24px;
      }

      h3 {
        margin: 0 0 12px;
        font-size: 18px;
        font-weight: 600;
        color: #111827;
      }

      .actions {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .action {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 14px 16px;
        background: #fff;
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        text-align: left;
        min-height: unset;
        color: #111827;
        font-weight: 600;
      }

      .action-icon {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: rgba(var(--app-primary-rgb), 0.2);
        color: var(--app-primary);
        display: grid;
        place-items: center;
        font-size: 20px;
      }

      .chevron {
        margin-left: auto;
        color: #9ca3af;
      }

      .alert {
        display: flex;
        gap: 12px;
        padding: 14px;
        background: #fff;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        margin-bottom: 10px;
        color: #ff7a00;
        font-size: 20px;
      }

      .alert.high {
        border-color: rgba(239, 68, 68, 0.3);
        background: rgba(239, 68, 68, 0.04);
        color: #ef4444;
      }

      .alert-msg {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }

      .alert-time {
        margin: 4px 0 0;
        font-size: 12px;
        color: #9ca3af;
      }

      .activity {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #f3f4f6;
      }

      .act-action {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #111827;
      }

      .act-user {
        margin: 2px 0 0;
        font-size: 12px;
        color: #6b7280;
      }

      .act-time {
        font-size: 12px;
        color: #9ca3af;
      }
    `,
  ],
})
export class AdminDashboardPage implements OnInit {
  private readonly router = inject(Router);
  private readonly api = inject(ApiService);

  operationsLoading = true;
  operationsError = '';
  operations: any = null;

  readonly stats = [
    { label: 'Coaches', value: '—', change: 'Registered', icon: 'people-outline', color: 'var(--app-primary)', key: 'coaches' },
    { label: 'Venues', value: '—', change: 'Registered', icon: 'business-outline', color: '#FF7A00', key: 'venues' },
    { label: 'Coach sessions', value: '—', change: 'All statuses', icon: 'calendar-outline', color: '#38BDF8', key: 'sessions' },
    { label: 'Awaiting approval', value: '—', change: 'Venue review', icon: 'time-outline', color: 'var(--app-primary)', key: 'pending_venue_approval' },
  ];

  ngOnInit(): void {
    this.api.get<any>('/admin/coach-operations').subscribe({
      next: response => {
        const data = response.data;
        if (!response.success || !data) { this.operationsError = response.message || 'Unable to load coach operations.'; this.operationsLoading = false; return; }
        this.operations = data;
        this.stats.forEach(stat => stat.value = String(data.stats[stat.key] ?? 0));
        this.operationsLoading = false;
      },
      error: error => { this.operationsError = error?.error?.message || 'Coach operations could not be loaded.'; this.operationsLoading = false; },
    });
  }

  readonly oldStats = [
    { label: 'Total Users', value: '12,450', change: '+245', icon: 'people-outline', color: 'var(--app-primary)' },
    { label: 'Active Venues', value: '42', change: '+3', icon: 'business-outline', color: '#FF7A00' },
    { label: 'Monthly Revenue', value: '₹24.5L', change: '+18%', icon: 'cash-outline', color: '#38BDF8' },
    { label: 'Active Games', value: '185', change: '+12', icon: 'pulse-outline', color: 'var(--app-primary)' },
  ];

  readonly actions = [
    { label: 'Manage Users', icon: 'people-outline', path: '/app/admin/users' },
    { label: 'Manage Venues', icon: 'business-outline', path: '/app/admin/venues' },
    { label: 'Resolve Disputes', icon: 'alert-circle-outline', path: '/app/admin/disputes' },
    { label: 'View Revenue', icon: 'cash-outline', path: '/app/admin/revenue' },
    { label: 'Manage XP Rules', icon: 'flash-outline', path: '/app/admin/xp-rules' },
  ];

  readonly alerts = [
    { message: 'Payment dispute reported by user #12453', time: '5 min ago', severity: 'high' },
    { message: 'New venue registration pending approval', time: '1 hour ago', severity: 'medium' },
    { message: 'Suspicious activity detected on account #9821', time: '2 hours ago', severity: 'high' },
  ];

  readonly activity = [
    { action: 'New user registration', user: 'Rahul Sharma', time: '5 min ago' },
    { action: 'Venue approved', user: 'Phoenix Arena', time: '15 min ago' },
    { action: 'Dispute resolved', user: 'Case #4521', time: '1 hour ago' },
    { action: 'Payment processed', user: '₹25,000', time: '2 hours ago' },
  ];

  go(path: string) {
    void this.router.navigateByUrl(path);
  }
}
