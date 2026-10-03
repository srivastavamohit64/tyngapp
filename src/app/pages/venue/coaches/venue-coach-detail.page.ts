import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, IonModal, IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ChatService } from '../../../core/services/chat.service';
import {
  AttendanceStatus,
  VenueCoachDetail,
  VenueCoachService,
  VenueCoachTerms,
  openBlob,
  saveBlob,
} from '../../../core/services/venue-coach.service';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';
import { QrCodeComponent } from '../../../shared/components/qr/qr-code.component';
import { QrScannerComponent } from '../../../shared/components/qr/qr-scanner.component';
import { PageSkeletonComponent } from '../../../shared/components/skeleton';
import { CoachTermsFormComponent } from './coach-terms-form.component';
import { DUTY_META, PAYOUT_COLORS, apiErrorMessage, avatarColor, avatarTextColor, initials, money, shortMoney } from './venue-coach.utils';

type Section = 'overview' | 'schedule' | 'attendance' | 'payroll' | 'documents' | 'contract';

const ATTENDANCE_META: Record<string, { label: string; color: string }> = {
  present: { label: 'Present', color: '#8CF000' },
  late: { label: 'Late', color: '#FF7A00' },
  half_day: { label: 'Half day', color: '#7C3AED' },
  absent: { label: 'Absent', color: '#EF4444' },
  leave: { label: 'Leave', color: '#38BDF8' },
};

const RATING_WORDS: Record<number, string> = { 5: 'Excellent', 4: 'Good', 3: 'Okay', 2: 'Poor', 1: 'Very poor' };

const CONTRACT_META: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#4d7c0f' },
  ending_soon: { label: 'Ending soon', color: '#c2410c' },
  expired: { label: 'Expired', color: '#dc2626' },
  terminated: { label: 'Terminated', color: '#dc2626' },
  offered: { label: 'Offer sent', color: '#0284c7' },
  pending: { label: 'Requested', color: '#c2410c' },
};

@Component({
  selector: 'app-venue-coach-detail-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageSkeletonComponent, CoachTermsFormComponent, QrCodeComponent, QrScannerComponent],
  templateUrl: './venue-coach-detail.page.html',
  styleUrls: ['./venue-coaches.shared.scss', './venue-coach-detail.page.scss'],
})
export class VenueCoachDetailPage implements OnInit {
  private readonly svc = inject(VenueCoachService);
  private readonly chat = inject(ChatService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly alertCtrl = inject(AlertController);
  private readonly sheetCtrl = inject(ActionSheetController);
  private readonly toastCtrl = inject(ToastController);

  readonly sections: Section[] = ['overview', 'schedule', 'attendance', 'payroll', 'documents', 'contract'];
  readonly duty = DUTY_META;
  readonly att = ATTENDANCE_META;
  readonly contractMeta = CONTRACT_META;
  readonly payoutColors = PAYOUT_COLORS;
  readonly color = avatarColor;
  readonly initials = initials;
  readonly money = money;

  readonly id = Number(this.route.snapshot.paramMap.get('id'));
  readonly coach = signal<VenueCoachDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly section = signal<Section>('overview');
  readonly busy = signal(false);
  readonly editOpen = signal(false);
  readonly scanOpen = signal(false);
  editTerms: VenueCoachTerms | null = null;
  editError: string | null = null;

  readonly isActive = computed(() => this.coach()?.status === 'active');
  readonly accent = computed(() => avatarColor(this.coach()?.coachId ?? 0));
  readonly accentText = computed(() => avatarTextColor(this.coach()?.coachId ?? 0));

  ngOnInit(): void {
    const section = this.route.snapshot.queryParamMap.get('section') as Section | null;
    if (section && this.sections.includes(section)) this.section.set(section);
    void this.load();
  }

  async load(silent = false): Promise<void> {
    if (!silent) this.loading.set(true);
    try {
      const res = await firstValueFrom(this.svc.detail(this.id));
      if (!res.data) throw new Error(res.message);
      this.coach.set(res.data);
      this.error.set(null);
    } catch (e) {
      this.error.set(this.message(e, 'Could not load this coach.'));
    } finally {
      this.loading.set(false);
    }
  }

  async refresh(event: CustomEvent): Promise<void> {
    await this.load(true);
    (event.target as HTMLIonRefresherElement).complete();
  }

  setSection(s: Section): void {
    this.section.set(s);
    void this.router.navigate([], { relativeTo: this.route, queryParams: { section: s === 'overview' ? null : s }, replaceUrl: true });
  }

  // ── Contact ───────────────────────────────────────────────
  call(c: VenueCoachDetail): void {
    if (c.phone) window.location.href = `tel:${c.phone.replace(/[^\d+]/g, '')}`;
  }

  async openChat(c: VenueCoachDetail): Promise<void> {
    const res = await this.chat.openPrivate({ id: c.coachId, name: c.name, avatar: c.profileImage ?? null });
    if (res.success && res.data?.id) {
      await this.router.navigateByUrl(`/app/chat/${encodeURIComponent(res.data.id)}`);
      return;
    }
    await this.toast(res.message || 'Unable to open chat.');
  }

  viewPublicProfile(c: VenueCoachDetail): void {
    void this.router.navigate(['/app/coaches', c.coachId]);
  }

  // ── Offer / request state ─────────────────────────────────
  async withdraw(c: VenueCoachDetail): Promise<void> {
    if (!(await this.confirm('Withdraw offer?', `${c.name} will no longer see this job offer.`, 'Withdraw'))) return;
    await this.act(() => firstValueFrom(this.svc.withdrawOffer(c.id)), 'Offer withdrawn.', true);
  }

  async approve(c: VenueCoachDetail): Promise<void> {
    await this.act(() => firstValueFrom(this.svc.approve(c.id)), `${c.name} joined your team.`);
  }

  async decline(c: VenueCoachDetail): Promise<void> {
    if (!(await this.confirm('Decline request?', `${c.name} will be told you are not hiring right now.`, 'Decline'))) return;
    await this.act(() => firstValueFrom(this.svc.decline(c.id)), 'Request declined.', true);
  }

  // ── Assignment ────────────────────────────────────────────
  openEdit(): void {
    this.editTerms = null;
    this.editError = null;
    this.editOpen.set(true);
  }

  onTerms(event: { terms: VenueCoachTerms; error: string | null }): void {
    this.editTerms = event.terms;
    this.editError = event.error;
  }

  async saveAssignment(modal: IonModal): Promise<void> {
    const c = this.coach();
    if (!c || !this.editTerms || this.editError) return;
    const ok = await this.act(() => firstValueFrom(this.svc.updateAssignment(c.id, { ...this.editTerms!, sports: c.assignment.sports })), 'Work details saved.');
    if (ok) await modal.dismiss();
  }

  // ── Attendance ────────────────────────────────────────────
  async checkIn(c: VenueCoachDetail): Promise<void> {
    await this.act(() => firstValueFrom(this.svc.attendance(c.id, 'check_in')), `${c.name} checked in.`);
  }

  async checkOut(c: VenueCoachDetail): Promise<void> {
    await this.act(() => firstValueFrom(this.svc.attendance(c.id, 'check_out')), `${c.name} checked out.`);
  }

  async markDay(c: VenueCoachDetail): Promise<void> {
    const sheet = await this.sheetCtrl.create({
      header: 'Mark today as',
      buttons: [
        ...(['present', 'late', 'half_day', 'absent', 'leave'] as AttendanceStatus[]).map((status) => ({
          text: ATTENDANCE_META[status].label,
          data: status,
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data, role } = await sheet.onDidDismiss();
    if (role === 'cancel' || !data) return;
    await this.act(() => firstValueFrom(this.svc.attendance(c.id, 'mark', data as AttendanceStatus)), 'Attendance saved.');
  }

  async onScanned(code: string, modal: IonModal): Promise<void> {
    if (this.busy()) return;
    this.busy.set(true);
    try {
      const res = await firstValueFrom(this.svc.scan(code));
      await modal.dismiss();
      await this.toast(res.message || 'Attendance saved.');
      if (res.data?.coach && res.data.coach.id === this.id) this.coach.set(res.data.coach);
    } catch (e) {
      await this.toast(this.message(e, 'Could not read this code.'));
    } finally {
      this.busy.set(false);
    }
  }

  // ── Venue rating ──────────────────────────────────────────
  async rate(c: VenueCoachDetail): Promise<void> {
    const current = c.venueRating.value || 5;
    const alert = await this.alertCtrl.create({
      header: `Rate ${c.name.split(' ')[0]}`,
      message: 'How happy is your venue with this coach? Only you can see this rating.',
      inputs: [5, 4, 3, 2, 1].map((n) => ({ type: 'radio' as const, label: `${this.stars(n)}  ${RATING_WORDS[n]}`, value: n, checked: n === current })),
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Next', role: 'confirm' }],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss();
    if (role !== 'confirm' || !data?.values) return;
    const rating = Number(data.values);
    const noteAlert = await this.alertCtrl.create({
      header: 'Add a note',
      message: 'Optional. Only your venue team can see it.',
      inputs: [{ name: 'note', type: 'textarea', value: c.venueRating.note || '', placeholder: 'e.g. Always on time, great with kids', attributes: { maxlength: 255 } }],
      buttons: [{ text: 'Skip', role: 'skip' }, { text: 'Save', role: 'confirm' }],
    });
    await noteAlert.present();
    const noteRes = await noteAlert.onDidDismiss();
    if (noteRes.role === 'backdrop') return;
    const note = noteRes.role === 'confirm' ? (noteRes.data?.values?.note || '').trim() || null : c.venueRating.note;
    await this.act(() => firstValueFrom(this.svc.rate(c.id, rating, note)), 'Rating saved.');
  }

  stars(n: number): string {
    return '★'.repeat(n) + '☆'.repeat(Math.max(0, 5 - n));
  }

  // ── Payroll ───────────────────────────────────────────────
  async adjustPayroll(c: VenueCoachDetail): Promise<void> {
    const p = c.payroll.current;
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
    await this.act(
      () => firstValueFrom(this.svc.savePayroll(c.id, {
        period: p.period,
        bonus: Number(v.bonus) || 0,
        incentive: Number(v.incentive) || 0,
        deduction: Number(v.deduction) || 0,
        note: (v.note || '').trim() || null,
      })),
      'Payroll updated.',
    );
  }

  async markPaid(c: VenueCoachDetail): Promise<void> {
    const p = c.payroll.current;
    if (!(await this.confirm('Mark as paid?', `Confirm you have paid ${money(p.net)} to ${c.name} for ${p.periodLabel}. This month will then be locked.`, 'Mark paid'))) return;
    await this.act(() => firstValueFrom(this.svc.savePayroll(c.id, { period: p.period, status: 'paid' })), 'Payment recorded. The coach has been told.');
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

  // ── Documents ─────────────────────────────────────────────
  async openDocument(c: VenueCoachDetail, docId: number): Promise<void> {
    try {
      openBlob(await firstValueFrom(this.svc.document(c.id, docId)));
    } catch (e) {
      await this.toast(this.message(e, 'Could not open this document.'));
    }
  }

  // ── Contract ──────────────────────────────────────────────
  async renew(c: VenueCoachDetail): Promise<void> {
    if (!(await this.confirm('Renew contract?', 'The contract restarts for the same length when the current one ends. The coach will be told.', 'Renew'))) return;
    await this.act(() => firstValueFrom(this.svc.contract(c.id, 'renew')), 'Contract renewed.');
  }

  async extend(c: VenueCoachDetail): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Extend contract',
      message: 'How many months should be added to the end date?',
      inputs: [1, 3, 6, 12].map((m) => ({ type: 'radio' as const, label: `${m} month${m > 1 ? 's' : ''}`, value: m, checked: m === 3 })),
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'Extend', role: 'confirm' }],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss();
    if (role !== 'confirm') return;
    await this.act(() => firstValueFrom(this.svc.contract(c.id, 'extend', { months: Number(data?.values) || 3 })), 'Contract extended.');
  }

  async terminate(c: VenueCoachDetail): Promise<void> {
    const notice = c.contract.noticeDays ? ` Their last day will be in ${c.contract.noticeDays} days (notice period).` : '';
    const alert = await this.alertCtrl.create({
      header: 'End contract?',
      message: `${c.name} will be removed from your team.${notice}`,
      inputs: [{ name: 'reason', type: 'textarea', placeholder: 'Reason (shared with the coach)' }],
      buttons: [{ text: 'Cancel', role: 'cancel' }, { text: 'End contract', role: 'confirm', cssClass: 'alert-danger' }],
    });
    await alert.present();
    const { role, data } = await alert.onDidDismiss();
    if (role !== 'confirm') return;
    await this.act(() => firstValueFrom(this.svc.contract(c.id, 'terminate', { reason: (data?.values?.reason || '').trim() || undefined })), 'Contract ended.');
  }

  // ── Helpers ───────────────────────────────────────────────
  private async act(action: () => Promise<{ data?: unknown } | unknown>, done: string, leave = false): Promise<boolean> {
    this.busy.set(true);
    try {
      const res = (await action()) as { data?: VenueCoachDetail | null } | undefined;
      await this.toast(done);
      if (leave) {
        await this.router.navigateByUrl('/app/venue/coaches', { replaceUrl: true });
        return true;
      }
      if (res?.data && typeof res.data === 'object' && 'assignment' in res.data) this.coach.set(res.data);
      else await this.load(true);
      return true;
    } catch (e) {
      await this.toast(this.message(e, 'Something went wrong. Please try again.'));
      return false;
    } finally {
      this.busy.set(false);
    }
  }

  payLabel(c: VenueCoachDetail): string {
    const a = c.assignment;
    if (a.monthlySalary && (a.employmentType === 'monthly' || a.employmentType === 'contract' || !a.hourlyRate)) return `${money(a.monthlySalary)}/mo`;
    if (a.hourlyRate) return `${money(a.hourlyRate)}/hr`;
    return '—';
  }

  shortPay(c: VenueCoachDetail): string {
    return c.assignment.monthlySalary ? shortMoney(c.assignment.monthlySalary) : c.assignment.hourlyRate ? `${money(c.assignment.hourlyRate)}/hr` : '—';
  }

  time(value: string | null): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });
  }

  hours(minutes: number | null | undefined): string {
    const m = Math.max(0, Number(minutes) || 0);
    return `${Math.floor(m / 60)}h ${String(m % 60).padStart(2, '0')}m`;
  }

  dateLabel(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value.length === 10 ? `${value}T00:00:00` : value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  dayLabel(value: string): string {
    const d = new Date(`${value}T00:00:00`);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  monthYear(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  pct(value: number | null | undefined): string {
    return value === null || value === undefined ? '—' : `${value}%`;
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
