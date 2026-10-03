import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonModal, IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CoachDirectoryItem } from '../../../core/models/api.model';
import { CoachService } from '../../../core/services/coach.service';
import {
  VenueCoachCard,
  VenueCoachDetail,
  VenueCoachService,
  VenueCoachTeam,
  VenueCoachTerms,
  saveBlob,
} from '../../../core/services/venue-coach.service';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageSkeletonComponent } from '../../../shared/components/skeleton';
import { CoachTermsFormComponent, EMPLOYMENT_OPTIONS } from './coach-terms-form.component';
import { DUTY_META, PAYOUT_COLORS, apiErrorMessage, avatarColor, avatarTextColor, initials, money, shortMoney } from './venue-coach.utils';

type CoachTab = 'coaches' | 'find' | 'payroll' | 'performance';

interface OfferTarget {
  mode: 'offer' | 'approve';
  coachId: number;
  partnershipId?: number;
  name: string;
  photo: string | null;
  sub: string;
  sports: string[];
}

@Component({
  selector: 'app-venue-coaches-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BrandHeaderShellComponent, PageSkeletonComponent, CoachTermsFormComponent],
  templateUrl: './venue-coaches.page.html',
  styleUrls: ['./venue-coaches.shared.scss', './venue-coaches.page.scss'],
})
export class VenueCoachesPage implements OnInit {
  private readonly svc = inject(VenueCoachService);
  private readonly coachApi = inject(CoachService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly alertCtrl = inject(AlertController);
  private readonly toastCtrl = inject(ToastController);

  readonly tabs: { id: CoachTab; label: string; icon: string }[] = [
    { id: 'coaches', label: 'My Coaches', icon: '👨‍🏫' },
    { id: 'find', label: 'Find Coaches', icon: '🔍' },
    { id: 'payroll', label: 'Payroll', icon: '💰' },
    { id: 'performance', label: 'Performance', icon: '📊' },
  ];
  readonly employmentFilters = [{ value: 'all', label: 'All Types' }, ...EMPLOYMENT_OPTIONS];
  readonly duty = DUTY_META;
  readonly payoutColors = PAYOUT_COLORS;
  readonly color = avatarColor;
  readonly textColor = avatarTextColor;
  readonly initials = initials;
  readonly money = money;
  readonly shortMoney = shortMoney;

  readonly tab = signal<CoachTab>('coaches');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly team = signal<VenueCoachTeam | null>(null);
  readonly showSearch = signal(false);
  readonly search = signal('');
  readonly sportFilter = signal('All');
  readonly empFilter = signal('all');
  readonly busyId = signal<number | null>(null);

  readonly findItems = signal<CoachDirectoryItem[]>([]);
  readonly findLoading = signal(false);
  readonly findPage = signal(1);
  readonly findLastPage = signal(1);
  readonly findSports = signal<string[]>([]);
  readonly findSport = signal('All');
  readonly shortlistOnly = signal(false);
  readonly savingId = signal<number | null>(null);
  private findLoaded = false;
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly selectedId = signal<number | null>(null);
  readonly details = signal<Record<number, VenueCoachDetail>>({});
  readonly detailLoading = signal(false);

  readonly offerTarget = signal<OfferTarget | null>(null);
  offerTerms: VenueCoachTerms | null = null;
  offerError: string | null = null;
  offerMessage = '';
  readonly sending = signal(false);

  readonly teamSports = computed(() => {
    const set = new Set<string>();
    this.team()?.coaches.forEach((c) => c.sports.forEach((s) => set.add(s)));
    return ['All', ...Array.from(set).sort()];
  });

  readonly filteredCoaches = computed(() => {
    const q = this.search().trim().toLowerCase();
    const sport = this.sportFilter();
    const emp = this.empFilter();
    return (this.team()?.coaches ?? []).filter(
      (c) =>
        (sport === 'All' || c.sports.includes(sport)) &&
        (emp === 'all' || c.employmentType === emp) &&
        (!q || c.name.toLowerCase().includes(q) || c.sports.some((s) => s.toLowerCase().includes(q))),
    );
  });

  readonly visibleFind = computed(() => {
    const excluded = new Set(this.team()?.excludedCoachIds ?? []);
    return this.findItems().filter((c) => !excluded.has(c.id));
  });

  readonly selectedCard = computed(() => this.team()?.coaches.find((c) => c.id === this.selectedId()) ?? null);
  readonly selected = computed(() => {
    const id = this.selectedId();
    return id ? this.details()[id] ?? null : null;
  });

  readonly trendChart = computed(() => {
    const trend = this.selected()?.performance.trend ?? [];
    const W = 300, H = 160, l = 36, r = 8, t = 8, b = 24;
    const iW = W - l - r, iH = H - t - b;
    const scores = trend.map((d) => d.score).filter((s): s is number => s !== null);
    const min = Math.max(0, Math.floor((Math.min(...scores, 60) - 5) / 10) * 10);
    const max = 100;
    const px = (i: number) => l + (trend.length > 1 ? (i / (trend.length - 1)) * iW : iW / 2);
    const py = (v: number) => t + iH - ((v - min) / (max - min)) * iH;
    const pts = trend.map((d, i) => (d.score === null ? null : { x: px(i), y: py(d.score), label: d.label, score: d.score }));
    const drawn = pts.filter((p): p is { x: number; y: number; label: string; score: number } => p !== null);
    const line = drawn.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
    const area = drawn.length > 1 ? `${drawn[0].x.toFixed(1)},${t + iH} ${line} ${drawn[drawn.length - 1].x.toFixed(1)},${t + iH}` : '';
    const ticks = [min, Math.round((min + max) / 2), max].map((v) => ({ v, y: py(v) }));
    return { W, H, l, r, line, area, points: drawn, labels: trend.map((d, i) => ({ x: px(i), label: d.label })), ticks, hasData: drawn.length > 0 };
  });

  readonly barChart = computed(() => {
    const trend = this.selected()?.performance.trend ?? [];
    const W = 300, H = 140, l = 32, r = 8, t = 16, b = 24;
    const iW = W - l - r, iH = H - t - b;
    const maxV = Math.max(1, ...trend.map((d) => Math.max(d.sessions, d.students)));
    const barW = iW / Math.max(1, trend.length);
    const bW = barW * 0.34;
    const bars = trend.map((d, i) => {
      const x = l + i * barW;
      const sH = (d.sessions / maxV) * iH;
      const stH = (d.students / maxV) * iH;
      return { label: d.label, cx: x + barW / 2, sx: x + barW * 0.08, sy: t + iH - sH, sh: sH, tx: x + barW * 0.08 + bW + 2, ty: t + iH - stH, th: stH, bW };
    });
    const ticks = Array.from(new Set([0, Math.round(maxV / 2), maxV])).map((v) => ({ v, y: t + iH - (v / maxV) * iH }));
    return { W, H, l, r, bars, ticks, hasData: trend.some((d) => d.sessions > 0 || d.students > 0) };
  });

  readonly radarChart = computed(() => {
    const c = this.selected()?.performance.components;
    const data = [
      { label: 'Punctuality', value: c?.punctuality ?? null },
      { label: 'Attendance', value: c?.attendance ?? null },
      { label: 'Students', value: c?.students ?? null },
      { label: 'Rating', value: c?.rating ?? null },
      { label: 'Renewals', value: c?.renewals ?? null },
      { label: 'Response', value: c?.response ?? null },
    ];
    const W = 280, H = 220, cx = W / 2, cy = H / 2 - 4, rad = 76;
    const step = (2 * Math.PI) / data.length;
    const point = (i: number, radius: number) => {
      const a = -Math.PI / 2 + i * step;
      return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
    };
    const rings = [0.25, 0.5, 0.75, 1].map((ring) => data.map((_, i) => point(i, rad * ring)).map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' '));
    const axes = data.map((_, i) => point(i, rad));
    const dots = data.map((d, i) => point(i, rad * ((d.value ?? 0) / 100)));
    const path = dots.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ') + ' Z';
    const labels = data.map((d, i) => ({ ...point(i, rad + 20), text: d.value === null ? `${d.label} –` : d.label }));
    return { W, H, cx, cy, rings, axes, dots, path, labels, hasData: data.some((d) => d.value !== null) };
  });

  readonly breakdown = computed(() => {
    const c = this.selected()?.performance.components;
    return [
      { label: 'Student Satisfaction', value: c?.rating ?? null, color: '#8CF000' },
      { label: 'Attendance', value: c?.attendance ?? null, color: '#38BDF8' },
      { label: 'Punctuality', value: c?.punctuality ?? null, color: '#8CF000' },
      { label: 'Renewal Rate', value: c?.renewals ?? null, color: '#FF7A00' },
      { label: 'Response Time', value: c?.response ?? null, color: '#7C3AED' },
    ];
  });

  ngOnInit(): void {
    const tab = this.route.snapshot.queryParamMap.get('tab') as CoachTab | null;
    if (tab && this.tabs.some((t) => t.id === tab)) this.tab.set(tab);
    void this.load();
  }

  ionViewWillEnter(): void {
    if (this.team()) void this.load(true);
  }

  async load(silent = false): Promise<void> {
    if (!silent) this.loading.set(true);
    try {
      const res = await firstValueFrom(this.svc.team());
      if (!res.data) throw new Error(res.message);
      this.team.set(res.data);
      this.error.set(null);
      const coaches = res.data.coaches;
      if (!coaches.some((c) => c.id === this.selectedId())) this.selectedId.set(coaches[0]?.id ?? null);
      this.details.set({});
      this.onTabChange(this.tab());
    } catch (e) {
      this.error.set(this.message(e, 'Could not load your coaches.'));
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.load(true);
    if (this.tab() === 'find') await this.loadFind(true);
    (event.target as HTMLIonRefresherElement).complete();
  }

  setTab(tab: CoachTab): void {
    this.tab.set(tab);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { tab: tab === 'coaches' ? null : tab }, replaceUrl: true });
    this.onTabChange(tab);
  }

  private onTabChange(tab: CoachTab): void {
    if (tab === 'find' && !this.findLoaded) void this.loadFind(true);
    if ((tab === 'payroll' || tab === 'performance') && this.selectedId()) void this.loadDetail(this.selectedId()!);
  }

  toggleSearch(): void {
    this.showSearch.update((v) => !v);
    if (!this.showSearch() && this.search()) this.onSearch('');
    if (this.showSearch()) setTimeout(() => document.getElementById('vc-search')?.focus(), 50);
  }

  onSearch(value: string): void {
    this.search.set(value);
    if (this.tab() !== 'find') return;
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.loadFind(true), 350);
  }

  // ── Find coaches ────────────────────────────────────────────
  async loadFind(reset = false): Promise<void> {
    if (this.findLoading()) return;
    this.findLoading.set(true);
    const page = reset ? 1 : this.findPage() + 1;
    try {
      const res = await firstValueFrom(
        this.coachApi.listCoaches({
          page,
          per_page: 20,
          sort: 'top',
          search: this.search().trim() || undefined,
          sport: this.findSport() === 'All' ? undefined : this.findSport(),
          saved: this.shortlistOnly() || undefined,
        }),
      );
      const data = res.data;
      if (!data) return;
      this.findItems.set(reset ? data.data : [...this.findItems(), ...data.data]);
      this.findPage.set(data.current_page);
      this.findLastPage.set(data.last_page);
      if (data.facets?.sports?.length) this.findSports.set(['All', ...data.facets.sports]);
      this.findLoaded = true;
    } catch (e) {
      await this.toast(this.message(e, 'Could not load coaches.'));
    } finally {
      this.findLoading.set(false);
    }
  }

  setFindSport(sport: string): void {
    this.findSport.set(sport);
    void this.loadFind(true);
  }

  toggleShortlistFilter(): void {
    this.shortlistOnly.update((v) => !v);
    void this.loadFind(true);
  }

  async toggleShortlist(coach: CoachDirectoryItem): Promise<void> {
    this.savingId.set(coach.id);
    const next = !coach.isSaved;
    try {
      await firstValueFrom(next ? this.coachApi.saveCoach(coach.id) : this.coachApi.unsaveCoach(coach.id));
      this.findItems.update((items) =>
        items.map((c) => (c.id === coach.id ? { ...c, isSaved: next } : c)).filter((c) => !this.shortlistOnly() || c.isSaved),
      );
      await this.toast(next ? `${coach.name} added to your shortlist.` : `${coach.name} removed from your shortlist.`);
    } catch (e) {
      await this.toast(this.message(e, 'Could not update the shortlist.'));
    } finally {
      this.savingId.set(null);
    }
  }

  availability(coach: CoachDirectoryItem): { label: string; now: boolean } | null {
    const next = coach.nextAvailable;
    if (!next) return null;
    const today = new Date();
    const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (next.date === key) return { label: 'Available today', now: true };
    const date = new Date(`${next.date}T00:00:00`);
    return { label: `From ${date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`, now: false };
  }

  viewPublicProfile(coachId: number): void {
    void this.router.navigate(['/app/coaches', coachId]);
  }

  openProfile(card: VenueCoachCard): void {
    void this.router.navigate(['/app/venue/coaches', card.id]);
  }

  // ── Offers & requests ───────────────────────────────────────
  openOffer(coach: CoachDirectoryItem): void {
    this.resetOfferForm();
    this.offerTarget.set({
      mode: 'offer',
      coachId: coach.id,
      name: coach.name,
      photo: coach.profileImage,
      sub: [this.title(coach.sports[0]), coach.rating ? `★ ${coach.rating.toFixed(1)}` : null, coach.experienceLabel].filter(Boolean).join(' · '),
      sports: coach.sports,
    });
  }

  openApprove(card: VenueCoachCard): void {
    this.resetOfferForm();
    this.offerTarget.set({
      mode: 'approve',
      coachId: card.coachId,
      partnershipId: card.id,
      name: card.name,
      photo: card.profileImage,
      sub: [this.title(card.sport), card.rating ? `★ ${card.rating.toFixed(1)}` : null, card.experienceLabel].filter(Boolean).join(' · '),
      sports: card.sports,
    });
  }

  private resetOfferForm(): void {
    this.offerTerms = null;
    this.offerError = null;
    this.offerMessage = '';
  }

  onTerms(event: { terms: VenueCoachTerms; error: string | null }): void {
    this.offerTerms = event.terms;
    this.offerError = event.error;
  }

  async submitOffer(modal: IonModal): Promise<void> {
    const target = this.offerTarget();
    if (!target || !this.offerTerms || this.offerError) return;
    this.sending.set(true);
    const terms: VenueCoachTerms = { ...this.offerTerms, sports: target.sports.slice(0, 5) };
    try {
      if (target.mode === 'offer') {
        await firstValueFrom(this.svc.sendOffer(target.coachId, { ...terms, message: this.offerMessage.trim() || null }));
        this.findItems.update((items) => items.filter((c) => c.id !== target.coachId));
        await this.toast(`Job offer sent to ${target.name}.`);
      } else {
        await firstValueFrom(this.svc.approve(target.partnershipId!, terms));
        await this.toast(`${target.name} joined your team.`);
      }
      await modal.dismiss();
      await this.load(true);
      if (target.mode === 'offer') this.setTab('coaches');
    } catch (e) {
      await this.toast(this.message(e, 'Could not save. Please try again.'));
    } finally {
      this.sending.set(false);
    }
  }

  async withdraw(card: VenueCoachCard): Promise<void> {
    if (!(await this.confirm('Withdraw offer?', `${card.name} will no longer see this job offer.`, 'Withdraw'))) return;
    await this.run(card.id, () => firstValueFrom(this.svc.withdrawOffer(card.id)), 'Offer withdrawn.');
  }

  async decline(card: VenueCoachCard): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Decline request?',
      message: `${card.name} will be told you are not hiring right now.`,
      inputs: [{ name: 'reason', type: 'textarea', placeholder: 'Reason (optional)' }],
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Decline', role: 'confirm' }],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss();
    if (role !== 'confirm') return;
    await this.run(card.id, () => firstValueFrom(this.svc.decline(card.id, data?.values?.reason)), 'Request declined.');
  }

  private async run(id: number, action: () => Promise<unknown>, done: string): Promise<void> {
    this.busyId.set(id);
    try {
      await action();
      await this.toast(done);
      await this.load(true);
    } catch (e) {
      await this.toast(this.message(e, 'Something went wrong. Please try again.'));
    } finally {
      this.busyId.set(null);
    }
  }

  // ── Payroll & performance ───────────────────────────────────
  selectCoach(id: number): void {
    this.selectedId.set(id);
    void this.loadDetail(id);
  }

  async loadDetail(id: number, force = false): Promise<void> {
    if (!force && this.details()[id]) return;
    this.detailLoading.set(true);
    try {
      const res = await firstValueFrom(this.svc.detail(id));
      if (res.data) this.details.update((map) => ({ ...map, [id]: res.data! }));
    } catch (e) {
      await this.toast(this.message(e, 'Could not load coach details.'));
    } finally {
      this.detailLoading.set(false);
    }
  }

  async adjustPayroll(detail: VenueCoachDetail): Promise<void> {
    const p = detail.payroll.current;
    const alert = await this.alertCtrl.create({
      header: `Adjust ${p.periodLabel}`,
      message: 'Amounts in rupees. Base pay is worked out from the salary or hourly rate.',
      inputs: [
        { name: 'bonus', type: 'number', min: 0, value: p.bonus || '', placeholder: 'Bonus', attributes: { 'aria-label': 'Bonus' } },
        { name: 'incentive', type: 'number', min: 0, value: p.incentive || '', placeholder: 'Incentive', attributes: { 'aria-label': 'Incentive' } },
        { name: 'deduction', type: 'number', min: 0, value: p.deduction || '', placeholder: 'Deduction', attributes: { 'aria-label': 'Deduction' } },
        { name: 'note', type: 'text', value: p.note || '', placeholder: 'Note (optional)' },
      ],
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Save', role: 'confirm' }],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss();
    if (role !== 'confirm') return;
    const v = data?.values ?? {};
    await this.savePayroll(detail, {
      period: p.period,
      bonus: Number(v.bonus) || 0,
      incentive: Number(v.incentive) || 0,
      deduction: Number(v.deduction) || 0,
      note: (v.note || '').trim() || null,
    }, 'Payroll updated.');
  }

  async markPaid(detail: VenueCoachDetail): Promise<void> {
    const p = detail.payroll.current;
    if (!(await this.confirm('Mark as paid?', `Confirm you have paid ${money(p.net)} to ${detail.name} for ${p.periodLabel}. This month will then be locked.`, 'Mark paid'))) return;
    await this.savePayroll(detail, { period: p.period, status: 'paid' }, 'Payment recorded. The coach has been told.');
  }

  async markProcessing(detail: VenueCoachDetail): Promise<void> {
    await this.savePayroll(detail, { period: detail.payroll.current.period, status: 'processing' }, 'Marked as processing.');
  }

  private async savePayroll(detail: VenueCoachDetail, body: Parameters<VenueCoachService['savePayroll']>[1], done: string): Promise<void> {
    this.busyId.set(detail.id);
    try {
      const res = await firstValueFrom(this.svc.savePayroll(detail.id, body));
      if (res.data) this.details.update((map) => ({ ...map, [detail.id]: res.data! }));
      await this.toast(done);
    } catch (e) {
      await this.toast(this.message(e, 'Could not update payroll.'));
    } finally {
      this.busyId.set(null);
    }
  }

  async downloadInvoice(payoutId: number | null, invoiceNumber: string | null): Promise<void> {
    if (!payoutId) return;
    try {
      const blob = await firstValueFrom(this.svc.invoice(payoutId));
      saveBlob(blob, `${invoiceNumber || 'invoice-' + payoutId}.pdf`);
    } catch (e) {
      await this.toast(this.message(e, 'Could not download the invoice.'));
    }
  }

  // ── Helpers ─────────────────────────────────────────────────
  payLabel(c: { employmentType: string | null; monthlySalary: number | null; hourlyRate: number | null }): string {
    if (c.monthlySalary && (c.employmentType === 'monthly' || c.employmentType === 'contract' || !c.hourlyRate)) return shortMoney(c.monthlySalary);
    if (c.hourlyRate) return `${money(c.hourlyRate)}/hr`;
    return '—';
  }

  private title(value: string | null | undefined): string | null {
    return value ? value.replace(/\b\w/g, (ch) => ch.toUpperCase()) : null;
  }

  firstName(name: string): string {
    return name.split(' ')[0] || name;
  }

  pct(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : `${value}%`;
  }

  dateLabel(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  monthYear(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  ago(value: string | null): string {
    if (!value) return '';
    const mins = Math.max(0, Math.round((Date.now() - new Date(value).getTime()) / 60000));
    if (mins < 60) return `${mins || 1} min ago`;
    if (mins < 1440) return `${Math.round(mins / 60)} hr ago`;
    return `${Math.round(mins / 1440)} days ago`;
  }

  private async confirm(header: string, message: string, ok: string): Promise<boolean> {
    const alert = await this.alertCtrl.create({ header, message, buttons: [{ text: 'Cancel', role: 'cancel' }, { text: ok, role: 'confirm' }] });
    await alert.present();
    return (await alert.onDidDismiss()).role === 'confirm';
  }

  private async toast(message: string): Promise<void> {
    const t = await this.toastCtrl.create({ message, duration: 2400, position: 'bottom' });
    await t.present();
  }

  private message(e: unknown, fallback: string): string {
    return apiErrorMessage(e, fallback);
  }
}
