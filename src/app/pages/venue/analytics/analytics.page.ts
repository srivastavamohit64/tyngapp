import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController, IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { saveBlob } from '../../../core/services/venue-coach.service';
import { InsightReportType, VenueInsights, VenueInsightsService } from '../../../core/services/venue-insights.service';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageSkeletonComponent } from '../../../shared/components/skeleton';
import { apiErrorMessage, avatarColor, initials, shortMoney } from '../coaches/venue-coach.utils';

const G = '#8CF000';
const O = '#FF7A00';
const B = '#38BDF8';
const V = '#7C3AED';
const MUTED = '#F3F4F6';

const STAT_META: Record<string, { icon: string; color: string }> = {
  revenue: { icon: 'cash-outline', color: G },
  occupancy: { icon: 'pulse-outline', color: B },
  bookings: { icon: 'calendar-outline', color: O },
  members: { icon: 'people-outline', color: V },
  rating: { icon: 'star-outline', color: '#F59E0B' },
  coachSessions: { icon: 'school-outline', color: G },
};

const URGENCY_COLORS: Record<string, string> = { high: '#EF4444', medium: O, low: B, ok: G };
const URGENCY_ICONS: Record<string, string> = { high: 'alert-circle-outline', medium: 'time-outline', low: 'time-outline', ok: 'checkmark-circle-outline' };

interface LineChart {
  W: number;
  H: number;
  l: number;
  r: number;
  ticks: { y: number; label: string }[];
  labels: { x: number; label: string }[];
  hasData: boolean;
}

@Component({
  selector: 'app-venue-analytics-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageSkeletonComponent],
  templateUrl: './analytics.page.html',
  styleUrls: ['./analytics.page.scss'],
})
export class VenueAnalyticsPage implements OnInit {
  private readonly svc = inject(VenueInsightsService);
  private readonly router = inject(Router);
  private readonly sheetCtrl = inject(ActionSheetController);
  private readonly toastCtrl = inject(ToastController);

  readonly G = G;
  readonly O = O;
  readonly B = B;
  readonly statMeta = STAT_META;
  readonly urgencyColors = URGENCY_COLORS;
  readonly urgencyIcons = URGENCY_ICONS;
  readonly initials = initials;
  readonly avatarColor = avatarColor;
  readonly shortMoney = shortMoney;
  readonly reports: { type: InsightReportType; label: string; icon: string; color: string }[] = [
    { type: 'revenue', label: 'Revenue Report', icon: 'cash-outline', color: G },
    { type: 'occupancy', label: 'Occupancy Report', icon: 'pulse-outline', color: B },
    { type: 'coaches', label: 'Coach Report', icon: 'people-outline', color: O },
    { type: 'customers', label: 'Customer Report', icon: 'star-outline', color: V },
  ];
  readonly ringLength = 2 * Math.PI * 40;

  readonly data = signal<VenueInsights | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly revenueTab = signal<'monthly' | 'forecast'>('monthly');
  readonly occupancyTab = signal<'heatmap' | 'weekly'>('heatmap');
  readonly downloading = signal<InsightReportType | null>(null);

  readonly revenueChart = computed(() => {
    const rows = this.data()?.revenue.monthly ?? [];
    const values = rows.flatMap((r) => [r.revenue, r.average ?? 0]);
    const base = this.frame(rows.map((r) => r.label), Math.max(...values, 0), (v) => this.k(v));
    const revenue = rows.map((r, i) => [base.x(i), base.y(r.revenue)] as const);
    const average = rows.map((r, i) => (r.average === null ? null : ([base.x(i), base.y(r.average)] as const))).filter((p): p is readonly [number, number] => !!p);
    return {
      ...base.chart,
      hasData: rows.some((r) => r.revenue > 0),
      line: this.pts(revenue),
      area: revenue.length ? `${this.pts(revenue)} ${base.x(revenue.length - 1)},${base.bottom} ${base.x(0)},${base.bottom}` : '',
      average: this.pts(average),
      dots: revenue.map(([x, y]) => ({ x, y })),
    };
  });

  readonly forecastChart = computed(() => {
    const rows = this.data()?.revenue.forecast ?? [];
    const values = rows.map((r) => r.actual ?? r.forecast ?? 0);
    const base = this.frame(rows.map((r) => r.label), Math.max(...values, 0), (v) => this.k(v));
    const actual = rows.map((r, i) => (r.actual === null ? null : ([base.x(i), base.y(r.actual)] as const))).filter((p): p is readonly [number, number] => !!p);
    const lastActual = actual[actual.length - 1];
    const future = rows.map((r, i) => (r.forecast === null ? null : ([base.x(i), base.y(r.forecast)] as const))).filter((p): p is readonly [number, number] => !!p);
    return {
      ...base.chart,
      hasData: values.some((v) => v > 0),
      actual: this.pts(actual),
      forecast: this.pts(lastActual ? [lastActual, ...future] : future),
      actualDots: actual.map(([x, y]) => ({ x, y })),
      forecastDots: future.map(([x, y]) => ({ x, y })),
    };
  });

  readonly weeklyChart = computed(() => {
    const rows = this.data()?.occupancy.weekly ?? [];
    return this.bars(rows.map((r) => ({ label: r.day, value: r.rate, color: G, opacity: r.rate > 85 ? 1 : 0.75 })), 140, [0, 25, 50, 75, 100], '%');
  });

  readonly facilityChart = computed(() => {
    const rows = this.data()?.facilities ?? [];
    return this.bars(rows.map((f) => ({ label: f.name.length > 9 ? f.name.slice(0, 8) + '…' : f.name, value: f.occupancy, color: f.color, opacity: 0.85 })), 120, [0, 50, 100], '');
  });

  readonly trendChart = computed(() => {
    const rows = this.data()?.trends ?? [];
    const max = Math.max(...rows.flatMap((r) => [r.players, r.coaches, r.events]), 0);
    const base = this.frame(rows.map((r) => r.label), max, (v) => String(Math.round(v)), 160, 24);
    const line = (key: 'players' | 'coaches' | 'events') => this.pts(rows.map((r, i) => [base.x(i), base.y(r[key])] as const));
    return {
      ...base.chart,
      hasData: max > 0,
      lines: [
        { key: 'players', color: G, points: line('players') },
        { key: 'coaches', color: O, points: line('coaches') },
        { key: 'events', color: B, points: line('events') },
      ],
    };
  });

  readonly donut = computed(() => {
    const rows = this.data()?.sports ?? [];
    const total = rows.reduce((sum, r) => sum + r.count, 0);
    if (!total) return [];
    const cx = 65;
    const cy = 65;
    const outer = 58;
    const inner = 36;
    const gap = rows.length > 1 ? 0.04 : 0;
    let angle = -Math.PI / 2;
    return rows.map((r) => {
      const sweep = Math.min((r.count / total) * 2 * Math.PI - gap, 2 * Math.PI - 0.001);
      const p = (rad: number, ang: number) => `${(cx + rad * Math.cos(ang)).toFixed(2)} ${(cy + rad * Math.sin(ang)).toFixed(2)}`;
      const large = sweep > Math.PI ? 1 : 0;
      const d = `M ${p(outer, angle)} A ${outer} ${outer} 0 ${large} 1 ${p(outer, angle + sweep)} L ${p(inner, angle + sweep)} A ${inner} ${inner} 0 ${large} 0 ${p(inner, angle)} Z`;
      angle += sweep + gap;
      return { d, color: r.color, name: r.name };
    });
  });

  readonly maxSport = computed(() => Math.max(...(this.data()?.sports ?? []).map((s) => s.value), 1));

  ngOnInit(): void {
    void this.load();
  }

  async load(silent = false): Promise<void> {
    if (!silent) this.loading.set(true);
    try {
      const res = await firstValueFrom(this.svc.insights());
      if (!res.data) throw new Error(res.message);
      this.data.set(res.data);
      this.error.set(null);
    } catch (e) {
      this.error.set(apiErrorMessage(e, 'Could not load your venue insights.'));
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.load(true);
    (event.target as HTMLIonRefresherElement).complete();
  }

  sparkline(series: number[]): { line: string; area: string } | null {
    if (series.length < 2 || series.every((v) => !v)) return null;
    const min = Math.min(...series);
    const range = Math.max(...series) - min || 1;
    const pts = series.map((v, i) => [(i / (series.length - 1)) * 100, 40 - ((v - min) / range) * 36] as const);
    const line = this.pts(pts);
    return { line, area: `${line} 100,44 0,44` };
  }

  heatStyle(value: number): { background: string; opacity: number } {
    const v = value / 100;
    if (v <= 0.4) return { background: MUTED, opacity: v > 0 ? 0.6 : 0.35 };
    return { background: v > 0.8 ? G : v > 0.6 ? O : B, opacity: 0.4 + v * 0.6 };
  }

  occupancyColor(value: number): string {
    return value >= 80 ? '#4d7c0f' : value >= 50 ? '#c2410c' : '#EF4444';
  }

  priorityStyle(priority: string): { background: string; color: string } {
    if (priority === 'high') return { background: `${O}30`, color: O };
    if (priority === 'medium') return { background: `${B}30`, color: B };
    return { background: `${G}20`, color: G };
  }

  openRoute(route: string): void {
    void this.router.navigateByUrl(route);
  }

  openCoach(c: VenueInsights['coaches'][number]): void {
    void this.router.navigate(c.id ? ['/app/venue/coaches', c.id] : ['/app/coaches', c.coachId], c.id ? { queryParams: { section: 'overview' } } : undefined);
  }

  async download(type: InsightReportType): Promise<void> {
    if (this.downloading()) return;
    this.downloading.set(type);
    try {
      const blob = await firstValueFrom(this.svc.report(type));
      saveBlob(blob, `${type}-report-${new Date().toISOString().slice(0, 10)}.csv`);
      await this.toast('Report downloaded.');
    } catch (e) {
      await this.toast(apiErrorMessage(e, 'Could not download the report.'));
    } finally {
      this.downloading.set(null);
    }
  }

  async chooseReport(): Promise<void> {
    const sheet = await this.sheetCtrl.create({
      header: 'Download report (CSV)',
      buttons: [...this.reports.map((r) => ({ text: r.label, data: r.type })), { text: 'Cancel', role: 'cancel' }],
    });
    await sheet.present();
    const { data, role } = await sheet.onDidDismiss();
    if (role !== 'cancel' && data) await this.download(data as InsightReportType);
  }

  async share(): Promise<void> {
    const d = this.data();
    if (!d) return;
    const stat = (key: string) => d.stats.find((s) => s.key === key);
    const lines = [
      `${d.venueName} — ${d.periodLabel} on TYNG`,
      d.health.score !== null ? `Health score: ${d.health.score}/100 (${d.health.label})` : null,
      d.ranking.rank ? `Rank #${d.ranking.rank} of ${d.ranking.total} venues in ${d.ranking.area}` : null,
      `Revenue: ${stat('revenue')?.display ?? '—'} · Bookings: ${stat('bookings')?.display ?? '—'} · Occupancy: ${stat('occupancy')?.display ?? '—'}`,
    ].filter(Boolean);
    const text = lines.join('\n');
    try {
      if (navigator.share) {
        await navigator.share({ title: `${d.venueName} insights`, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      await this.toast('Summary copied. Paste it anywhere to share.');
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') await this.toast('Sharing is not available on this device.');
    }
  }

  updatedLabel(value: string): string {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  // ── chart helpers ───────────────────────────────────────────
  private frame(labels: string[], max: number, fmt: (v: number) => string, H = 160, b = 20) {
    const W = 320;
    const pad = { t: 18, r: 10, b, l: 36 };
    const top = this.niceMax(max);
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const x = (i: number) => +(pad.l + (labels.length > 1 ? (i / (labels.length - 1)) * iW : iW / 2)).toFixed(1);
    const y = (v: number) => +(pad.t + iH - (Math.max(0, v) / top) * iH).toFixed(1);
    const chart: LineChart = {
      W,
      H,
      l: pad.l,
      r: pad.r,
      ticks: [0, top / 2, top].map((v) => ({ y: y(v), label: fmt(v) })),
      labels: labels.map((label, i) => ({ x: x(i), label })),
      hasData: max > 0,
    };
    return { chart, x, y, bottom: pad.t + iH };
  }

  private bars(rows: { label: string; value: number; color: string; opacity: number }[], H: number, ticks: number[], suffix: string) {
    const W = 320;
    const pad = { t: 8, r: 8, b: 20, l: 32 };
    const iW = W - pad.l - pad.r;
    const iH = H - pad.t - pad.b;
    const slot = rows.length ? iW / rows.length : iW;
    return {
      W,
      H,
      l: pad.l,
      r: pad.r,
      hasData: rows.some((r) => r.value > 0),
      ticks: ticks.map((v) => ({ y: pad.t + iH - (v / 100) * iH, label: `${v}${suffix}` })),
      bars: rows.map((r, i) => {
        const h = (Math.min(100, r.value) / 100) * iH;
        const x = pad.l + i * slot + slot * 0.15;
        return { x, y: pad.t + iH - h, w: slot * 0.7, h, cx: x + slot * 0.35, label: r.label, color: r.color, opacity: r.opacity };
      }),
    };
  }

  private niceMax(max: number): number {
    if (max <= 0) return 4;
    const exp = Math.pow(10, Math.floor(Math.log10(max)));
    const step = [1, 2, 2.5, 5, 10].find((s) => s * exp >= max) ?? 10;
    return step * exp;
  }

  private pts(points: readonly (readonly [number, number])[]): string {
    return points.map(([x, y]) => `${x},${y}`).join(' ');
  }

  private k(v: number): string {
    if (v >= 100000) return `${+(v / 100000).toFixed(1)}L`;
    if (v >= 1000) return `${+(v / 1000).toFixed(1)}K`;
    return String(Math.round(v));
  }

  private async toast(message: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2400, position: 'bottom' });
    await t.present();
  }
}
