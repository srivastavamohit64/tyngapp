import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BackNavigationService } from '../../core/services/back-navigation.service';
import { CoachService, CoachVenueCollaborationDetail, CoachVenueCollaborationSession } from '../../core/services/coach.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageSkeletonComponent } from '../../shared/components/skeleton';

@Component({
  selector: 'app-venue-collab-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageSkeletonComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-brand-header-shell title="Venue Collaboration" (back)="back()">
      <div class="collab-detail-page pb-12 text-left">
        <app-page-skeleton *ngIf="loading()" variant="detail" label="Loading venue collaboration"></app-page-skeleton>

        <div *ngIf="!loading() && error()" class="state-card">
          <ion-icon name="business-outline"></ion-icon>
          <p class="state-title">{{ error() }}</p>
          <button type="button" (click)="load()">Try again</button>
        </div>

        <div *ngIf="!loading() && data() as d" class="px-5 pt-4 space-y-4">
          <div class="section-card bg-white overflow-hidden border border-slate-50">
            <div class="relative h-[160px] overflow-hidden cover-fallback">
              <img *ngIf="d.image" [src]="d.image" [alt]="d.name" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <div class="absolute top-3 right-3">
                <span class="text-[11px] font-black px-2.5 py-1 rounded-full capitalize"
                  [style.backgroundColor]="statusStyle(d.status).bg" [style.color]="statusStyle(d.status).color">
                  {{ d.status }}
                </span>
              </div>
              <div class="absolute bottom-3 left-4 right-4">
                <p class="text-white font-black text-[18px] drop-shadow-md m-0 leading-tight">{{ d.name }}</p>
                <p *ngIf="d.sports.length || d.location" class="text-white/75 text-[12px] m-0 mt-1 font-bold capitalize truncate">
                  {{ d.sports.join(', ') }}<ng-container *ngIf="d.sports.length && d.location"> · </ng-container>{{ d.location }}
                </p>
              </div>
            </div>

            <div class="px-5 py-4">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] font-bold m-0 uppercase tracking-wider">Earned this month</p>
                  <p class="text-[26px] font-black text-[#111827] m-0">{{ money(d.earnings.this_month) }}</p>
                  <p class="text-[11px] text-[#6B7280] font-bold m-0">{{ money(d.earnings.total) }} earned in total</p>
                </div>
                <div class="text-right" *ngIf="d.schedule || d.rating !== null">
                  <p *ngIf="d.schedule" class="text-[12px] font-black text-[#111827] m-0">{{ d.schedule }}</p>
                  <p *ngIf="d.rating !== null" class="text-[11px] text-[#9CA3AF] m-0 font-bold mt-1">★ {{ d.rating }} venue rating</p>
                </div>
              </div>
              <div *ngIf="d.earnings.upcoming > 0" class="mt-3 rounded-2xl bg-[#FFF7ED] px-3.5 py-2.5 text-[12px] font-bold text-[#C2410C]">
                {{ money(d.earnings.upcoming) }} more from {{ d.stats.upcoming_sessions }} upcoming {{ d.stats.upcoming_sessions === 1 ? 'session' : 'sessions' }}
              </div>
            </div>
          </div>

          <div class="section-card p-5 bg-white">
            <p class="section-title">Partnership</p>
            <ng-container *ngIf="d.partnership as p; else noPartnership">
              <div class="grid grid-cols-2 gap-3">
                <div *ngFor="let item of partnershipRows(d)" class="info-tile">
                  <p class="info-label">{{ item.label }}</p>
                  <p class="info-value capitalize">{{ item.value }}</p>
                </div>
              </div>
            </ng-container>
            <ng-template #noPartnership>
              <p class="text-[13px] text-[#6B7280] m-0 leading-relaxed">
                You coach here by booking sessions directly. There is no formal partnership agreement with this venue yet.
                <ng-container *ngIf="d.first_session_at"> Your first session here was on {{ formatDate(d.first_session_at) }}.</ng-container>
              </p>
            </ng-template>
          </div>

          <div class="section-card p-5 bg-white">
            <p class="section-title">Session Summary</p>
            <div class="grid grid-cols-2 gap-3 mb-4">
              <div *ngFor="let s of sessionStats(d)" class="rounded-[20px] p-3.5 relative overflow-hidden border"
                [style.backgroundColor]="s.color + '10'" [style.borderColor]="s.color + '22'">
                <ion-icon [name]="s.icon" class="text-xl" [style.color]="s.color"></ion-icon>
                <p class="text-[20px] font-black text-[#111827] mt-1.5 leading-none m-0">{{ s.value }}</p>
                <p class="text-[10px] text-[#6B7280] mt-1 m-0 font-bold">{{ s.label }}</p>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="rate-tile">
                <p class="text-[22px] font-black text-[#22C55E] m-0">{{ d.stats.attendance_rate === null ? '—' : d.stats.attendance_rate + '%' }}</p>
                <p class="text-[10px] text-[#9CA3AF] mt-0.5 m-0 font-bold">Attendance rate</p>
              </div>
              <div class="rate-tile">
                <p class="text-[22px] font-black text-[#EF4444] m-0">{{ d.stats.cancellation_rate === null ? '—' : d.stats.cancellation_rate + '%' }}</p>
                <p class="text-[10px] text-[#9CA3AF] mt-0.5 m-0 font-bold">Cancellation rate</p>
              </div>
            </div>
            <p *ngIf="d.stats.awaiting_completion > 0" class="text-[12px] font-bold text-[#C2410C] mt-3 mb-0">
              {{ d.stats.awaiting_completion }} {{ d.stats.awaiting_completion === 1 ? 'session needs' : 'sessions need' }} to be marked as completed.
            </p>
            <p *ngIf="d.stats.pending_approval > 0" class="text-[12px] font-bold text-[#6B7280] mt-2 mb-0">
              {{ d.stats.pending_approval }} {{ d.stats.pending_approval === 1 ? 'request is' : 'requests are' }} waiting for venue approval.
            </p>
          </div>

          <div class="section-card p-5 bg-white">
            <div class="flex items-center justify-between mb-4">
              <p class="section-title mb-0">Earnings · last 6 months</p>
              <button type="button" class="link-btn" (click)="go('/app/coach/earnings')">Earnings<ion-icon name="chevron-forward-outline"></ion-icon></button>
            </div>
            <div class="month-chart" role="img" [attr.aria-label]="'Monthly earnings at ' + d.name">
              <div *ngFor="let m of d.earnings.monthly" class="month-col">
                <span class="month-amount">{{ m.amount > 0 ? compactMoney(m.amount) : '' }}</span>
                <div class="month-track"><div class="month-bar" [style.height.%]="barHeight(m.amount)"></div></div>
                <span class="month-label">{{ m.month }}</span>
              </div>
            </div>
            <p *ngIf="!hasMonthlyEarnings()" class="text-[12px] text-[#9CA3AF] font-bold text-center mt-3 mb-0">No completed sessions here in the last 6 months.</p>
          </div>

          <div class="section-card p-5 bg-white">
            <p class="section-title">Upcoming Sessions</p>
            <ng-container *ngTemplateOutlet="sessionList; context: { $implicit: d.upcoming, empty: 'No upcoming sessions at this venue.' }"></ng-container>
          </div>

          <div class="section-card p-5 bg-white">
            <p class="section-title">Recent Sessions</p>
            <ng-container *ngTemplateOutlet="sessionList; context: { $implicit: d.recent, empty: 'No past sessions at this venue yet.' }"></ng-container>
          </div>

          <div *ngIf="d.amenities.length || d.open_time || d.operating_days.length" class="section-card p-5 bg-white">
            <p class="section-title">Venue Details</p>
            <p *ngIf="d.open_time && d.close_time" class="text-[13px] font-bold text-[#111827] m-0">
              Open {{ formatClock(d.open_time) }} – {{ formatClock(d.close_time) }}
            </p>
            <p *ngIf="d.operating_days.length" class="text-[12px] text-[#6B7280] font-bold mt-1 mb-0 capitalize">{{ d.operating_days.join(' · ') }}</p>
            <div *ngIf="d.amenities.length" class="flex flex-wrap gap-1.5 mt-3">
              <span *ngFor="let a of d.amenities" class="amenity">{{ a }}</span>
            </div>
          </div>

          <div *ngIf="d.phone || d.manager_name || hasMapLocation(d)" class="section-card p-5 bg-white">
            <p class="section-title">Venue Contact</p>
            <p *ngIf="d.manager_name" class="text-[15px] font-black text-[#111827] m-0">{{ d.manager_name }}</p>
            <p *ngIf="d.phone" class="text-[12px] text-[#6B7280] font-bold mt-1 mb-0">{{ d.phone }}</p>
            <div class="grid gap-2 mt-4" [class.grid-cols-2]="d.phone && hasMapLocation(d)">
              <a *ngIf="d.phone" [href]="'tel:' + d.phone" class="contact-btn bg-[#F0FDF4] text-[#16A34A]">
                <ion-icon name="call-outline"></ion-icon><span>Call</span>
              </a>
              <a *ngIf="hasMapLocation(d)" [href]="mapUrl(d)" target="_blank" rel="noopener" class="contact-btn bg-[#EFF6FF] text-[#2563EB]">
                <ion-icon name="navigate-outline"></ion-icon><span>Directions</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <ng-template #sessionList let-items let-empty="empty">
        <p *ngIf="!items.length" class="text-[12px] text-[#9CA3AF] font-bold m-0">{{ empty }}</p>
        <button *ngFor="let s of items" type="button" class="session-row" (click)="openSession(s)">
          <div class="session-icon" [style.backgroundColor]="sessionStyle(s).bg" [style.color]="sessionStyle(s).color">
            <ion-icon [name]="sessionStyle(s).icon"></ion-icon>
          </div>
          <div class="flex-grow min-w-0 text-left">
            <p class="text-[13px] font-bold text-[#111827] m-0 truncate">{{ s.title }}</p>
            <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5 font-bold truncate">
              {{ formatDateTime(s.starts_at) }} · {{ s.students }} {{ s.students === 1 ? 'student' : 'students' }}<ng-container *ngIf="s.court"> · {{ s.court }}</ng-container>
            </p>
          </div>
          <div class="text-right flex-shrink-0">
            <p class="text-[13px] font-black text-[#111827] m-0">{{ money(s.amount) }}</p>
            <span class="text-[10px] font-bold" [style.color]="sessionStyle(s).color">{{ sessionStyle(s).label }}</span>
          </div>
        </button>
      </ng-template>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .collab-detail-page { background: #FAFBFC; min-height: 100%; }
    .section-card { border-radius: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
    .section-title { font-size: 12px; font-weight: 900; color: #111827; text-transform: uppercase; letter-spacing: 0.1em; margin: 0 0 16px; }
    .cover-fallback { background: linear-gradient(135deg, #1F2937, #111827); }
    .info-tile { background: #F9FAFB; border-radius: 16px; padding: 12px 14px; }
    .info-label { font-size: 10px; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 700; margin: 0 0 2px; }
    .info-value { font-size: 13px; font-weight: 900; color: #111827; margin: 0; line-height: 1.25; }
    .rate-tile { background: #F9FAFB; border-radius: 16px; padding: 12px 16px; text-align: center; }
    .link-btn { display: inline-flex; align-items: center; gap: 2px; background: transparent; border: 0; font-size: 12px; font-weight: 700; color: #16A34A; }
    .month-chart { display: grid; grid-template-columns: repeat(6, 1fr); gap: 8px; align-items: end; height: 150px; }
    .month-col { display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; min-width: 0; }
    .month-amount { font-size: 9px; font-weight: 800; color: #6B7280; min-height: 12px; white-space: nowrap; }
    .month-track { flex: 1; width: 100%; max-width: 28px; display: flex; align-items: flex-end; background: #F3F4F6; border-radius: 10px; overflow: hidden; }
    .month-bar { width: 100%; min-height: 3px; border-radius: 10px; background: linear-gradient(180deg, var(--app-primary), var(--app-primary-to)); }
    .month-label { font-size: 10px; font-weight: 800; color: #9CA3AF; }
    .session-row { width: 100%; display: flex; align-items: center; gap: 12px; padding: 12px 0; background: transparent; border: 0; border-bottom: 1px solid #F3F4F6; }
    .session-row:last-child { border-bottom: 0; }
    .session-icon { width: 40px; height: 40px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; }
    .amenity { font-size: 11px; font-weight: 700; color: #374151; background: #F3F4F6; border-radius: 999px; padding: 4px 10px; text-transform: capitalize; }
    .contact-btn { display: flex; align-items: center; justify-content: center; gap: 6px; height: 44px; border-radius: 16px; font-size: 13px; font-weight: 800; text-decoration: none; }
    .contact-btn ion-icon { font-size: 18px; }
    .state-card { margin: 40px 20px; padding: 28px 20px; border-radius: 24px; background: #fff; text-align: center; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
    .state-card ion-icon { font-size: 34px; color: #9CA3AF; }
    .state-title { font-size: 14px; font-weight: 700; color: #374151; margin: 10px 0 14px; }
    .state-card button { height: 40px; padding: 0 18px; border: 0; border-radius: 12px; background: var(--app-primary); color: #111827; font-weight: 800; }
  `]
})
export class VenueCollabDetailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly coach = inject(CoachService);
  readonly backNavigation = inject(BackNavigationService);

  readonly loading = signal(true);
  readonly error = signal('');
  readonly data = signal<CoachVenueCollaborationDetail | null>(null);
  private venueId = '';

  readonly monthlyMax = computed(() => Math.max(0, ...(this.data()?.earnings.monthly || []).map(m => m.amount)));
  readonly hasMonthlyEarnings = computed(() => this.monthlyMax() > 0);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.venueId = params.get('id') || '';
      this.load();
    });
  }

  load() {
    if (!this.venueId) {
      this.loading.set(false);
      this.error.set('This venue collaboration could not be found.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.coach.getVenueCollaboration(this.venueId).subscribe({
      next: response => {
        this.data.set(response.data ?? null);
        if (!response.data) this.error.set('This venue collaboration could not be found.');
        this.loading.set(false);
      },
      error: err => {
        this.data.set(null);
        this.error.set(err?.status === 404
          ? 'You have no sessions or partnership with this venue.'
          : 'This venue collaboration could not be loaded. Check your connection and try again.');
        this.loading.set(false);
      },
    });
  }

  partnershipRows(d: CoachVenueCollaborationDetail) {
    const p = d.partnership;
    if (!p) return [];
    return [
      { label: 'Status', value: p.status.replace(/_/g, ' ') },
      { label: 'Agreement', value: (p.agreement_type || 'Not specified').replace(/_/g, ' ') },
      { label: 'Venue rate', value: p.venue_rate !== null ? this.money(p.venue_rate) : 'Not set' },
      { label: 'Approval', value: (p.approval_policy || 'Not specified').replace(/_/g, ' ') },
      { label: 'Valid from', value: p.effective_from ? this.formatDate(p.effective_from) : (p.approved_at ? this.formatDate(p.approved_at) : '—') },
      { label: 'Valid until', value: p.effective_until ? this.formatDate(p.effective_until) : 'Open-ended' },
    ];
  }

  sessionStats(d: CoachVenueCollaborationDetail) {
    return [
      { icon: 'calendar-outline', label: 'Total sessions', value: String(d.stats.sessions), color: '#16A34A' },
      { icon: 'checkmark-done-outline', label: 'Completed', value: String(d.stats.completed_sessions), color: '#22C55E' },
      { icon: 'time-outline', label: 'Hours coached', value: `${d.stats.hours_coached}h`, color: '#0EA5E9' },
      { icon: 'people-outline', label: 'Students coached', value: String(d.stats.students), color: '#FF7A00' },
    ];
  }

  barHeight(amount: number): number {
    const max = this.monthlyMax();
    return max > 0 ? Math.max(4, Math.round((amount / max) * 100)) : 0;
  }

  sessionStyle(s: CoachVenueCollaborationSession) {
    switch (s.state) {
      case 'completed': return { label: 'Completed', icon: 'checkmark-circle-outline', bg: '#F0FDF4', color: '#16A34A' };
      case 'upcoming': return { label: 'Confirmed', icon: 'calendar-outline', bg: '#EFF6FF', color: '#2563EB' };
      case 'pending': return { label: 'Awaiting venue', icon: 'hourglass-outline', bg: '#FFFBEB', color: '#D97706' };
      case 'awaiting_completion': return { label: 'Needs completion', icon: 'alert-circle-outline', bg: '#FFF7ED', color: '#C2410C' };
      case 'cancelled': return { label: 'Cancelled', icon: 'close-circle-outline', bg: '#FEF2F2', color: '#DC2626' };
      case 'expired': return { label: 'Expired', icon: 'time-outline', bg: '#F3F4F6', color: '#6B7280' };
      default: return { label: s.status.replace(/_/g, ' '), icon: 'ellipse-outline', bg: '#F3F4F6', color: '#6B7280' };
    }
  }

  statusStyle(status: string) {
    const value = status.toLowerCase();
    if (value === 'active' || value === 'approved') return { bg: '#F0FDF4', color: '#16A34A' };
    if (value.includes('pending')) return { bg: '#FFF7ED', color: '#C2410C' };
    if (value.includes('reject') || value.includes('suspend') || value.includes('terminat')) return { bg: '#FEF2F2', color: '#DC2626' };
    return { bg: '#F3F4F6', color: '#6B7280' };
  }

  hasMapLocation(d: CoachVenueCollaborationDetail): boolean {
    return (d.latitude !== null && d.longitude !== null) || !!d.location;
  }

  mapUrl(d: CoachVenueCollaborationDetail): string {
    const query = d.latitude !== null && d.longitude !== null ? `${d.latitude},${d.longitude}` : `${d.name} ${d.location || ''}`.trim();
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  openSession(s: CoachVenueCollaborationSession) {
    this.go('/app/coach/session/' + encodeURIComponent(s.id));
  }

  money(value: number | null | undefined): string {
    return '₹' + Math.round(Number(value || 0)).toLocaleString('en-IN');
  }

  compactMoney(value: number): string {
    if (value >= 100000) return '₹' + (value / 100000).toFixed(1).replace(/\.0$/, '') + 'L';
    if (value >= 1000) return '₹' + (value / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    return '₹' + Math.round(value);
  }

  formatDate(value: string): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatDateTime(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true });
  }

  formatClock(value: string): string {
    if (/[ap]m/i.test(value)) return value.toUpperCase();
    const [h, m] = value.split(':').map(Number);
    if (Number.isNaN(h)) return value;
    const date = new Date();
    date.setHours(h, m || 0, 0, 0);
    return date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  back() {
    this.backNavigation.back('/app/coach/earnings');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }
}
