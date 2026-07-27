import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingCalendarEvent } from '../../../core/models/api.model';
import { BookingService } from '../../../core/services/booking.service';
import { VenueService } from '../../../core/services/venue.service';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';

interface CalendarCourt {
  name: string;
  sport: string;
}

interface DayCell {
  date: Date | null;
  iso: string | null;
  dayNum: number | null;
  inMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  dotCount: number;
}

interface CalendarBookingItem {
  id: string;
  dateIso: string;
  dayLabel: string;
  timeRange: string;
  customer: string;
  sport: string;
  court: string;
  status: string;
}

@Component({
  selector: 'app-venue-calendar-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell>
      <div class="cal-page">
        <header class="cal-header">
          <button type="button" class="icon-btn" (click)="goHome()" aria-label="Back">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1>Calendar</h1>
          <button type="button" class="icon-btn" (click)="loadMonth()" aria-label="Refresh">
            <ion-icon name="refresh-outline"></ion-icon>
          </button>
        </header>

        <section class="month-card">
          <div class="month-nav">
            <button type="button" class="nav-arrow" (click)="prevMonth()" aria-label="Previous month">
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
            <p class="month-label">{{ monthLabel() }}</p>
            <button type="button" class="nav-arrow" (click)="nextMonth()" aria-label="Next month">
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
          </div>

          <div class="weekday-row">
            <span *ngFor="let d of weekDays">{{ d }}</span>
          </div>

          <div class="day-grid">
            <button
              type="button"
              class="day-cell"
              *ngFor="let cell of monthCells(); trackBy: trackCell"
              [class.empty]="!cell.inMonth"
              [class.today]="cell.isToday"
              [class.selected]="cell.isSelected"
              [disabled]="!cell.inMonth"
              (click)="selectDay(cell)"
            >
              <span class="day-num" *ngIf="cell.dayNum !== null">{{ cell.dayNum }}</span>
              <span class="day-dots" *ngIf="cell.dotCount > 0">
                <i *ngFor="let _ of dotArray(cell.dotCount)"></i>
              </span>
            </button>
          </div>
        </section>

        <section class="stats-row" *ngIf="!loading()">
          <div class="stat">
            <p class="stat__num">{{ selectedDayCount() }}</p>
            <p class="stat__label">Day Bookings</p>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <p class="stat__num">{{ monthBookingCount() }}</p>
            <p class="stat__label">This Month</p>
          </div>
          <div class="stat-divider"></div>
          <div class="stat">
            <p class="stat__num">{{ courts().length }}</p>
            <p class="stat__label">Courts</p>
          </div>
        </section>

        <div class="court-filter" *ngIf="courts().length">
          <button
            type="button"
            class="filter-chip"
            [class.active]="selectedCourt() === 'all'"
            (click)="selectedCourt.set('all')"
          >All courts</button>
          <button
            type="button"
            class="filter-chip"
            *ngFor="let court of courts()"
            [class.active]="selectedCourt() === court.name"
            (click)="selectedCourt.set(court.name)"
          >{{ court.name }}</button>
        </div>

        <p *ngIf="loading()" class="status">Loading calendar…</p>
        <p *ngIf="!loading() && errorMessage()" class="status error">{{ errorMessage() }}</p>

        <section class="events">
          <div class="events-head">
            <p>Upcoming events</p>
            <span></span>
          </div>

          <div *ngIf="!loading() && selectedDayEvents().length === 0" class="empty">
            No bookings on {{ selectedDayLabel() }}
          </div>

          <article class="event-card" *ngFor="let event of selectedDayEvents()">
            <div class="event-top">
              <span class="event-tag">{{ event.sport }}</span>
              <span class="event-status" [attr.data-status]="event.status.toLowerCase()">{{ event.status }}</span>
            </div>
            <div class="event-body">
              <div class="event-when">
                <p class="event-date">{{ event.dayLabel }}</p>
                <p class="event-time">{{ event.timeRange }}</p>
              </div>
              <div class="event-info">
                <p class="event-title">{{ event.customer }}</p>
                <p class="event-place">{{ event.court }}</p>
              </div>
            </div>
          </article>
        </section>
      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .cal-page {
      min-height: 100%;
      background: #FAFBFC;
      padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px));
    }

    .cal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px 4px;
      background: #fff;
    }

    .cal-header h1 {
      margin: 0;
      font-size: 17px;
      font-weight: 900;
      color: #111827;
    }

    .icon-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      background: #F3F4F6;
      display: grid;
      place-items: center;
      color: #111827;
      font-size: 18px;
    }

    .month-card {
      background: #fff;
      padding: 8px 16px 18px;
      border-bottom: 1px solid #F3F4F6;
    }

    .month-nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }

    .month-label {
      margin: 0;
      font-size: 16px;
      font-weight: 800;
      color: #111827;
    }

    .nav-arrow {
      width: 34px;
      height: 34px;
      border: none;
      border-radius: 999px;
      background: #F3F4F6;
      display: grid;
      place-items: center;
      color: #111827;
    }

    .weekday-row {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      margin-bottom: 6px;
    }

    .weekday-row span {
      text-align: center;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.04em;
      color: #9CA3AF;
      text-transform: uppercase;
      padding: 4px 0;
    }

    .day-grid {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px 0;
    }

    .day-cell {
      appearance: none;
      border: none;
      background: transparent;
      min-height: 46px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      padding: 4px 0 6px;
      gap: 4px;
    }

    .day-cell.empty {
      visibility: hidden;
    }

    .day-num {
      width: 30px;
      height: 30px;
      border-radius: 999px;
      display: grid;
      place-items: center;
      font-size: 14px;
      font-weight: 700;
      color: #374151;
    }

    .day-cell.today .day-num {
      color: #111827;
      font-weight: 900;
    }

    .day-cell.selected .day-num {
      background: var(--app-primary);
      color: #111827;
      font-weight: 900;
    }

    .day-dots {
      display: flex;
      gap: 3px;
      min-height: 6px;
    }

    .day-dots i {
      width: 5px;
      height: 5px;
      border-radius: 999px;
      background: #FF7A00;
      display: block;
    }

    .stats-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr auto 1fr;
      align-items: center;
      background: #fff;
      padding: 16px 8px;
      border-bottom: 1px solid #F3F4F6;
    }

    .stat {
      text-align: center;
    }

    .stat__num {
      margin: 0;
      font-size: 22px;
      font-weight: 900;
      color: #111827;
      line-height: 1.1;
    }

    .stat__label {
      margin: 4px 0 0;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: #9CA3AF;
    }

    .stat-divider {
      width: 1px;
      height: 34px;
      background: #E5E7EB;
    }

    .court-filter {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding: 12px 16px 4px;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
    }

    .court-filter::-webkit-scrollbar { display: none; }

    .filter-chip {
      flex: 0 0 auto;
      border: 1.5px solid #E5E7EB;
      background: #fff;
      border-radius: 999px;
      padding: 8px 12px;
      font-size: 12px;
      font-weight: 800;
      color: #6B7280;
      white-space: nowrap;
    }

    .filter-chip.active {
      background: rgba(var(--app-primary-rgb), 0.18);
      border-color: var(--app-primary);
      color: #111827;
    }

    .status {
      margin: 12px 16px 0;
      font-size: 12px;
      font-weight: 700;
      color: #9CA3AF;
    }

    .status.error { color: #DC2626; }

    .events {
      padding: 8px 16px 24px;
    }

    .events-head {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 10px 0 14px;
    }

    .events-head p {
      margin: 0;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #9CA3AF;
      white-space: nowrap;
    }

    .events-head span {
      flex: 1;
      height: 1px;
      background: #E5E7EB;
    }

    .empty {
      text-align: center;
      padding: 28px 12px;
      font-size: 13px;
      font-weight: 700;
      color: #9CA3AF;
    }

    .event-card {
      background: #fff;
      border: 1px solid #F3F4F6;
      border-radius: 18px;
      padding: 14px;
      margin-bottom: 10px;
    }

    .event-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      margin-bottom: 10px;
    }

    .event-tag {
      display: inline-flex;
      padding: 4px 10px;
      border-radius: 999px;
      background: rgba(var(--app-primary-rgb), 0.2);
      color: #166534;
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .event-status {
      font-size: 10px;
      font-weight: 800;
      text-transform: uppercase;
      color: #16A34A;
    }

    .event-status[data-status='pending'] { color: #C2410C; }
    .event-status[data-status='cancelled'] { color: #DC2626; }

    .event-body {
      display: grid;
      grid-template-columns: 92px 1fr;
      gap: 12px;
      align-items: start;
    }

    .event-date {
      margin: 0;
      font-size: 12px;
      font-weight: 800;
      color: #6B7280;
    }

    .event-time {
      margin: 4px 0 0;
      font-size: 11px;
      font-weight: 700;
      color: #9CA3AF;
    }

    .event-title {
      margin: 0;
      font-size: 14px;
      font-weight: 900;
      color: #111827;
      line-height: 1.3;
    }

    .event-place {
      margin: 4px 0 0;
      font-size: 12px;
      font-weight: 700;
      color: #9CA3AF;
    }
  `],
})
export class VenueCalendarPage implements OnInit {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly venueService = inject(VenueService);

  readonly weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  viewMonth = signal(this.startOfMonth(new Date()));
  selectedDate = signal(this.toIso(new Date()));
  selectedCourt = signal<string>('all');
  loading = signal(false);
  errorMessage = signal('');
  courts = signal<CalendarCourt[]>([]);
  monthEvents = signal<CalendarBookingItem[]>([]);

  monthLabel = computed(() =>
    new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(this.viewMonth()),
  );

  monthCells = computed(() => this.buildMonthCells(this.viewMonth(), this.selectedDate(), this.monthEvents()));

  monthBookingCount = computed(() => this.monthEvents().length);

  selectedDayCount = computed(() =>
    this.monthEvents().filter((e) => e.dateIso === this.selectedDate()).length,
  );

  selectedDayEvents = computed(() => {
    const day = this.selectedDate();
    const court = this.selectedCourt();
    return this.monthEvents()
      .filter((e) => e.dateIso === day)
      .filter((e) => court === 'all' || e.court === court)
      .sort((a, b) => a.timeRange.localeCompare(b.timeRange));
  });

  ngOnInit(): void {
    void this.loadMonth();
  }

  trackCell(_: number, cell: DayCell) {
    return cell.iso || `empty-${_}`;
  }

  dotArray(count: number): number[] {
    return Array.from({ length: Math.min(count, 3) }, (_, i) => i);
  }

  selectedDayLabel(): string {
    const d = new Date(`${this.selectedDate()}T00:00:00`);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  }

  prevMonth() {
    const d = new Date(this.viewMonth());
    d.setMonth(d.getMonth() - 1);
    this.viewMonth.set(this.startOfMonth(d));
    void this.loadMonth();
  }

  nextMonth() {
    const d = new Date(this.viewMonth());
    d.setMonth(d.getMonth() + 1);
    this.viewMonth.set(this.startOfMonth(d));
    void this.loadMonth();
  }

  selectDay(cell: DayCell) {
    if (!cell.iso || !cell.inMonth) return;
    this.selectedDate.set(cell.iso);
  }

  goHome() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }

  async loadMonth() {
    this.loading.set(true);
    this.errorMessage.set('');

    try {
      const month = this.viewMonth();
      const start = this.toIso(month);
      const endDate = new Date(month.getFullYear(), month.getMonth() + 1, 0);
      const end = this.toIso(endDate);

      const [profileResp, calendarResp] = await Promise.all([
        firstValueFrom(this.venueService.getMyProfile()),
        firstValueFrom(this.bookingService.getCalendar(`start_date=${start}&end_date=${end}`)),
      ]);

      const profileCourts = Array.isArray((profileResp.data as any)?.['courts'])
        ? ((profileResp.data as any)['courts'] as any[])
        : [];

      const courts: CalendarCourt[] = profileCourts.length
        ? profileCourts.map((c) => ({
            name: String(c.courtName || c.name || 'Court'),
            sport: this.titleCase(String(c.sport || 'Sport')),
          }))
        : [{ name: 'Main Ground', sport: 'Multi' }];
      this.courts.set(courts);

      const events = (calendarResp.data || []) as BookingCalendarEvent[];
      const mapped = events.map((event) => {
        const meta = (event.meta || {}) as Record<string, unknown>;
        const sport = typeof meta['sport'] === 'string' ? this.titleCase(String(meta['sport'])) : 'Game';
        const courtName = typeof meta['courtName'] === 'string' ? String(meta['courtName']) : null;
        const court = this.resolveCourtName(courts, courtName, sport);
        const dateIso = String(event.date || start);
        const day = new Date(`${dateIso}T00:00:00`);

        return {
          id: String(event.bookingId || event.id),
          dateIso,
          dayLabel: new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long' }).format(day),
          timeRange: `${this.timeLabel(event.startTime)} - ${this.timeLabel(event.endTime)}`,
          customer: typeof meta['hostName'] === 'string' ? String(meta['hostName']) : (event.title || 'Booking'),
          sport,
          court,
          status: this.titleCase(event.status || 'confirmed'),
        } satisfies CalendarBookingItem;
      });

      this.monthEvents.set(mapped);

      // Keep selected day inside current month when navigating months
      const selected = new Date(`${this.selectedDate()}T00:00:00`);
      if (selected.getMonth() !== month.getMonth() || selected.getFullYear() !== month.getFullYear()) {
        const today = new Date();
        if (today.getMonth() === month.getMonth() && today.getFullYear() === month.getFullYear()) {
          this.selectedDate.set(this.toIso(today));
        } else {
          this.selectedDate.set(start);
        }
      }
    } catch (error: any) {
      this.errorMessage.set(error?.error?.message || 'Unable to load calendar.');
      this.monthEvents.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private buildMonthCells(
    month: Date,
    selectedIso: string,
    events: CalendarBookingItem[],
  ): DayCell[] {
    const year = month.getFullYear();
    const mon = month.getMonth();
    const first = new Date(year, mon, 1);
    const daysInMonth = new Date(year, mon + 1, 0).getDate();
    // Monday-first: JS getDay() Sun=0..Sat=6 → Mon=0
    const startOffset = (first.getDay() + 6) % 7;
    const todayIso = this.toIso(new Date());

    const counts = new Map<string, number>();
    events.forEach((e) => counts.set(e.dateIso, (counts.get(e.dateIso) || 0) + 1));

    const cells: DayCell[] = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ date: null, iso: null, dayNum: null, inMonth: false, isToday: false, isSelected: false, dotCount: 0 });
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, mon, day);
      const iso = this.toIso(date);
      cells.push({
        date,
        iso,
        dayNum: day,
        inMonth: true,
        isToday: iso === todayIso,
        isSelected: iso === selectedIso,
        dotCount: counts.get(iso) || 0,
      });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ date: null, iso: null, dayNum: null, inMonth: false, isToday: false, isSelected: false, dotCount: 0 });
    }
    return cells;
  }

  private resolveCourtName(courts: CalendarCourt[], preferred?: string | null, sport?: string | null): string {
    if (preferred) {
      const exact = courts.find((c) => c.name.toLowerCase() === preferred.toLowerCase());
      if (exact) return exact.name;
    }
    if (sport) {
      const bySport = courts.find((c) => c.sport.toLowerCase() === sport.toLowerCase());
      if (bySport) return bySport.name;
    }
    return courts[0]?.name || 'Main Ground';
  }

  private startOfMonth(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), 1);
  }

  private toIso(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private timeLabel(time24?: string | null): string {
    if (!time24) return '—';
    if (/am|pm/i.test(time24)) return time24.replace(/\s+/g, '').toLowerCase();
    const [h = '0', m = '00'] = time24.split(':');
    const date = new Date();
    date.setHours(Number(h), Number(m), 0, 0);
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date).replace(/\s+/g, '').toLowerCase();
  }

  private titleCase(value: string): string {
    return value
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }
}
