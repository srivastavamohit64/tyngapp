import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { VenueEventRecord, VenueEventService, VenueEventsDashboard } from '../../../core/services/venue-event.service';
import { sportEmoji } from '../../../core/utils/booking.utils';

type EventsTab = 'home' | 'leagues' | 'rankings' | 'analytics';

@Component({
  selector: 'app-venue-events-hub',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true" class="ev-content">
      <div class="ev-page">
        <div class="ev-tabs">
          <button type="button" *ngFor="let t of tabs" class="ev-tab" [class.on]="tab() === t.id" (click)="tab.set(t.id)">{{ t.label }}</button>
        </div>

        <div *ngIf="loading()" class="muted">Loading events…</div>

        <ng-container *ngIf="!loading() && tab() === 'home'">
          <section class="hero">
            <div class="hero-top">
              <div>
                <p class="kicker">Events Dashboard</p>
                <h1>Your Sports Community Hub</h1>
              </div>
              <button type="button" class="mini-create" (click)="create()">+ Create Event</button>
            </div>
            <div class="hero-grid">
              <div *ngFor="let s of homeStats()"><span>{{ s.icon }}</span><div><p>{{ s.label }}</p><strong>{{ s.value }}</strong></div></div>
            </div>
          </section>

          <div class="sec-head">
            <h2>Event Types</h2>
            <button type="button" class="link" (click)="create()">Create →</button>
          </div>
          <div class="type-grid">
            <button type="button" class="type-card" *ngFor="let t of types" (click)="create(t.id)">
              <span class="orb" [style.background]="t.orb">{{ t.emoji }}</span>
              <strong>{{ t.title }}</strong>
              <p>{{ t.sub }}</p>
            </button>
          </div>
        </ng-container>

        <ng-container *ngIf="!loading() && tab() === 'leagues'">
          <div class="sec-head">
            <h2>Recurring Leagues</h2>
            <button type="button" class="mini-create" (click)="create('competition')">+ New League</button>
          </div>
          <article class="league" *ngFor="let l of leagues()">
            <div class="league-top">
              <span>{{ sportEmoji(l.sport) }}</span>
              <div>
                <h3>{{ l.name || 'Untitled league' }}</h3>
                <p>{{ titleCase(l.recurring) }} · {{ l.teamCount || l.maxParticipants }} teams</p>
              </div>
              <span class="active">Active</span>
            </div>
            <div class="prog">
              <span>Progress</span>
              <strong>{{ leaguePct(l) }}%</strong>
            </div>
            <div class="bar"><i [style.width.%]="leaguePct(l)"></i></div>
            <div class="league-meta">
              <div><span>Next Match</span><strong>{{ nextMatch(l) }}</strong></div>
              <div><span>Top Team</span><strong>🏆 TBD</strong></div>
            </div>
            <button type="button" class="table-btn" (click)="tab.set('rankings')">View League Table</button>
          </article>
          <button type="button" class="dashed" (click)="create('competition')">+ Create New League</button>
        </ng-container>

        <ng-container *ngIf="!loading() && tab() === 'rankings'">
          <h2 class="page-h">Rankings</h2>
          <div *ngIf="!events().length" class="muted">Publish a competition to see rankings.</div>
          <div class="rank" *ngFor="let e of events(); let i = index">
            <strong>{{ i + 1 }}</strong>
            <span>{{ sportEmoji(e.sport) }}</span>
            <div>
              <p>{{ e.name || 'Event' }}</p>
              <small>{{ e.registrations }} registrations · ₹{{ e.grossRevenue | number:'1.0-0' }}</small>
            </div>
          </div>
        </ng-container>

        <ng-container *ngIf="!loading() && tab() === 'analytics'">
          <h2 class="page-h">Event Analytics</h2>
          <div class="kpi">
            <div class="kpi-card" *ngFor="let k of kpis()">
              <p>{{ k.label }}</p>
              <strong>{{ k.value }}</strong>
              <span>{{ k.delta }}</span>
            </div>
          </div>
          <section class="card">
            <h3>Revenue by Event</h3>
            <div class="rev-row" *ngFor="let r of analytics()?.byEvent || []">
              <div class="rev-copy">
                <p>{{ r.name }}</p>
                <div class="bar"><i [style.width.%]="r.pct"></i></div>
              </div>
              <strong>₹{{ r.revenue | number:'1.0-0' }}</strong>
            </div>
            <p *ngIf="!(analytics()?.byEvent || []).length" class="muted">No published event revenue yet.</p>
          </section>
          <section class="card">
            <h3>Venue Achievements</h3>
            <div class="badges">
              <span>🏙️<br />Community</span>
              <span>🏆<br />Tournament</span>
              <span>📋<br />League</span>
              <span>⭐<br />Elite Host</span>
            </div>
          </section>
        </ng-container>
      </div>
    </ion-content>

    <div class="ev-foot">
      <button type="button" class="create" (click)="create()">+ Create Event</button>
      <button type="button" class="manage" (click)="tab.set('leagues')"><ion-icon name="bar-chart-outline"></ion-icon> Manage Events</button>
    </div>
    <button type="button" class="fab" (click)="create()">+</button>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .ev-content { --background: #F4F6F8; --padding-bottom: 0; }
    .ev-page { padding: 12px 16px calc(190px + env(safe-area-inset-bottom, 0px)); padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
    .ev-tabs { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 12px; scrollbar-width: none; }
    .ev-tab { flex: 0 0 auto; border: none; border-radius: 999px; padding: 8px 14px; background: #F3F4F6; font-weight: 800; font-size: 13px; color: #111827; }
    .ev-tab.on { background: #111827; color: #8cf000; box-shadow: inset 0 -2px 0 #8cf000; }
    .hero { background: #111827; color: #fff; border-radius: 22px; padding: 18px; }
    .hero-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
    .kicker { margin: 0; color: #9CA3AF; font-size: 12px; font-weight: 700; }
    .hero h1 { margin: 6px 0 14px; font-size: 22px; font-weight: 900; line-height: 1.2; }
    .mini-create { border: none; border-radius: 999px; background: #8cf000; color: #111827; font-weight: 800; height: 32px; padding: 0 10px; white-space: nowrap; }
    .hero-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .hero-grid > div { display: flex; gap: 8px; align-items: center; background: rgba(255,255,255,.06); border-radius: 12px; padding: 8px; }
    .hero-grid p { margin: 0; font-size: 11px; color: #9CA3AF; }
    .hero-grid strong { font-size: 16px; }
    .sec-head { display: flex; justify-content: space-between; align-items: center; margin: 18px 0 10px; }
    .sec-head h2, .page-h { margin: 8px 0 12px; font-size: 20px; font-weight: 900; color: #111827; }
    .link { border: none; background: none; color: #65a30d; font-weight: 800; }
    .type-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .type-card { text-align: left; border: none; background: #fff; border-radius: 18px; padding: 14px; box-shadow: 0 2px 12px rgba(17,24,39,.05); }
    .orb { width: 36px; height: 36px; border-radius: 50%; display: grid; place-items: center; font-size: 18px; margin-bottom: 8px; }
    .type-card strong { display: block; font-size: 14px; }
    .type-card p { margin: 4px 0 0; font-size: 11px; color: #6B7280; font-weight: 600; }
    .league, .card { background: #fff; border-radius: 18px; padding: 14px; margin-bottom: 12px; box-shadow: 0 2px 12px rgba(17,24,39,.05); }
    .league-top { display: flex; gap: 8px; align-items: flex-start; }
    .league-top h3 { margin: 0; font-size: 15px; }
    .league-top p { margin: 2px 0 0; font-size: 12px; color: #9CA3AF; }
    .active { margin-left: auto; background: #DCFCE7; color: #15803D; border-radius: 999px; padding: 3px 8px; font-size: 11px; font-weight: 800; }
    .prog { display: flex; justify-content: space-between; margin-top: 10px; font-size: 12px; font-weight: 700; }
    .bar { height: 8px; background: #F3F4F6; border-radius: 99px; overflow: hidden; margin: 6px 0 10px; }
    .bar i { display: block; height: 100%; background: #8cf000; }
    .league-meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .league-meta div { background: #F9FAFB; border-radius: 12px; padding: 8px; }
    .league-meta span { display: block; font-size: 11px; color: #9CA3AF; }
    .table-btn { width: 100%; margin-top: 10px; height: 42px; border: 1.5px solid #E5E7EB; border-radius: 12px; background: #fff; font-weight: 800; }
    .dashed { width: 100%; height: 52px; border: 1.5px dashed #D1D5DB; border-radius: 16px; background: transparent; font-weight: 800; color: #6B7280; }
    .rank { display: flex; gap: 10px; align-items: center; background: #fff; border-radius: 14px; padding: 12px; margin-bottom: 8px; }
    .kpi { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
    .kpi-card { background: #fff; border-radius: 16px; padding: 12px; }
    .kpi-card p { margin: 0; font-size: 12px; color: #6B7280; font-weight: 700; }
    .kpi-card strong { display: block; font-size: 20px; margin: 4px 0; }
    .kpi-card span { color: #16A34A; font-size: 12px; font-weight: 800; }
    .rev-row { display: flex; gap: 10px; align-items: center; padding: 8px 0; }
    .rev-copy { flex: 1; min-width: 0; }
    .rev-copy p { margin: 0 0 4px; font-weight: 800; font-size: 13px; }
    .card h3 { margin: 0 0 8px; font-size: 15px; }
    .badges { display: flex; justify-content: space-between; text-align: center; font-size: 11px; font-weight: 700; }
    .muted { color: #9CA3AF; font-weight: 700; padding: 12px 0; }
    .ev-foot {
      position: fixed; left: 0; right: 0; z-index: 20;
      bottom: calc(78px + env(safe-area-inset-bottom, 0px));
      display: flex; gap: 10px; padding: 12px 16px;
      background: #fff; border-top: 1px solid #F3F4F6;
    }
    .create, .manage {
      flex: 1; height: 50px; border: none; border-radius: 16px; font-weight: 900;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    }
    .create { background: #8cf000; color: #111827; }
    .manage { background: #111827; color: #fff; }
    .fab {
      position: fixed;
      right: 18px; bottom: calc(150px + env(safe-area-inset-bottom, 0px));
      width: 52px; height: 52px; border: none; border-radius: 50%; background: #8cf000;
      color: #111827; font-size: 28px; font-weight: 800; z-index: 21;
      box-shadow: 0 8px 20px rgba(140,240,0,.4);
    }
  `],
})
export class VenueEventsHubPage implements OnInit {
  private readonly eventsApi = inject(VenueEventService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly sportEmoji = sportEmoji;
  readonly tab = signal<EventsTab>('home');
  readonly loading = signal(true);
  readonly data = signal<VenueEventsDashboard | null>(null);

  readonly tabs: Array<{ id: EventsTab; label: string }> = [
    { id: 'home', label: 'Home' },
    { id: 'leagues', label: 'Leagues' },
    { id: 'rankings', label: 'Rankings' },
    { id: 'analytics', label: 'Analytics' },
  ];

  readonly types = [
    { id: 'community_game', emoji: '🟢', title: 'Community Game', sub: 'Grow your sports community.', orb: 'radial-gradient(circle at 30% 30%, #d9f99d, #22c55e)' },
    { id: 'hosted_match', emoji: '🔵', title: 'Hosted Match', sub: 'Subsidised play for your community.', orb: 'radial-gradient(circle at 30% 30%, #bfdbfe, #2563eb)' },
    { id: 'competition', emoji: '🏆', title: 'Competition', sub: 'Compete for prizes and rankings.', orb: '#FEF3C7' },
    { id: 'festival', emoji: '🎉', title: 'Festival', sub: 'Create unforgettable experiences.', orb: '#FFE4E6' },
  ];

  ngOnInit(): void {
    const q = this.route.snapshot.queryParamMap.get('tab') as EventsTab | null;
    if (q && this.tabs.some((t) => t.id === q)) this.tab.set(q);
    void this.load();
  }

  events(): VenueEventRecord[] {
    return this.data()?.events || [];
  }

  leagues(): VenueEventRecord[] {
    return this.data()?.leagues || [];
  }

  analytics() {
    return this.data()?.analytics || null;
  }

  homeStats() {
    const s = this.data()?.stats;
    return [
      { icon: '📅', label: 'Upcoming Events', value: String(s?.upcoming || 0) },
      { icon: '👥', label: 'Registrations', value: String(s?.registrations || 0) },
      { icon: '💰', label: 'Revenue', value: this.compact(s?.revenue || 0) },
      { icon: '🏆', label: 'Active Comps', value: String(s?.activeComps || 0) },
      { icon: '⭐', label: 'Avg Rating', value: `${s?.avgRating || 0}★` },
      { icon: '🎉', label: 'Events Hosted', value: String(s?.hosted || 0) },
    ];
  }

  kpis() {
    const a = this.analytics();
    return [
      { label: 'Total Revenue', value: `₹${(a?.totalRevenue || 0).toLocaleString('en-IN')}`, delta: '+24% vs last month' },
      { label: 'Registrations', value: String(a?.registrations || 0), delta: '+18% vs last month' },
      { label: 'Avg Rating', value: `${a?.avgRating || 0}★`, delta: '+0.2 vs last month' },
      { label: 'Repeat Visitors', value: `${a?.repeatVisitors || 0}%`, delta: '+11% vs last month' },
    ];
  }

  leaguePct(l: VenueEventRecord): number {
    return Math.min(100, Math.max(12, (l.registrations || 1) * 8));
  }

  nextMatch(l: VenueEventRecord): string {
    if (!l.eventDate) return 'TBD';
    const d = new Date(`${l.eventDate}T00:00:00`);
    return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  }

  titleCase(v?: string | null): string {
    return String(v || 'league').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  create(type?: string): void {
    void this.router.navigate(['/app/venue/events/create'], { queryParams: type ? { type } : {} });
  }

  private compact(n: number): string {
    if (n >= 1000) return `₹${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
    return `₹${n.toLocaleString('en-IN')}`;
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      const res = await firstValueFrom(this.eventsApi.dashboard());
      if (res.success && res.data) this.data.set(res.data);
    } finally {
      this.loading.set(false);
    }
  }
}
