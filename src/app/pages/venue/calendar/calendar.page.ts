import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingCalendarEvent, BookingSlot } from '../../../core/models/api.model';
import { BookingService } from '../../../core/services/booking.service';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';

interface CalendarCellBooking {
  time: string;
  duration: number;
  customer: string;
  sport: string;
  status: string;
}

@Component({
  selector: 'app-venue-calendar-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell>
      <div class="calendar-page pb-32 text-left">
        
        <!-- Header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button (click)="goHome()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <p class="text-[17px] font-black text-[#111827] m-0">Calendar</p>
            <div class="w-10"></div>
          </div>

          <!-- Day Switcher switcher track -->
          <div class="flex items-center justify-between px-5 py-3 border-t border-[#F9FAFB]">
            <button (click)="prevDay()" class="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center border-none">
              <ion-icon name="chevron-back-outline" class="text-xs text-[#111827]"></ion-icon>
            </button>
            <div class="flex items-center gap-2 font-bold text-sm text-[#111827]">
              <ion-icon name="calendar-outline" class="text-[#8CF000] text-lg font-bold"></ion-icon>
              <span>{{ currentDay() }}</span>
            </div>
            <button (click)="nextDay()" class="w-8 h-8 rounded-full bg-[#F3F4F6] flex items-center justify-center border-none">
              <ion-icon name="chevron-forward-outline" class="text-xs text-[#111827]"></ion-icon>
            </button>
          </div>
        </div>

        <div class="px-5 pt-2" *ngIf="loading">
          <div class="text-xs text-[#9CA3AF] fw-bold">Loading live calendar...</div>
        </div>
        <div class="px-5 pt-2" *ngIf="!loading && errorMessage">
          <div class="text-xs text-danger fw-bold">{{ errorMessage }}</div>
        </div>

        <!-- Scrollable Grid view -->
        <div class="overflow-x-auto no-scrollbar">
          <div class="min-w-[800px] p-5">
            <div class="grid grid-cols-[100px_1fr] gap-2">
              
              <!-- Blank top corner -->
              <div></div>
              
              <!-- Courts Header Column rows -->
              <div class="grid grid-cols-3 gap-2">
                <div *ngFor="let court of courts" class="text-center p-2.5 bg-white rounded-xl border border-[#F3F4F6] shadow-sm">
                  <span class="text-xs font-black text-[#111827]">{{ court }}</span>
                </div>
              </div>

              <!-- Time row blocks -->
              <ng-container *ngFor="let time of timeSlots">
                <div class="flex items-center justify-end pr-3 text-xs text-[#9CA3AF] font-black uppercase tracking-wider">
                  {{ time }}
                </div>
                <div class="grid grid-cols-3 gap-2">
                  <div *ngFor="let court of courts" class="h-16 rounded-2xl border-2 transition-all relative"
                    [style.backgroundColor]="getBooking(court, time) ? 'rgba(140,240,0,0.12)' : 'white'"
                    [style.border]="getBooking(court, time) ? '2px solid #8CF000' : '2px solid #F3F4F6'"
                    [style.boxShadow]="getBooking(court, time) ? '0 2px 10px rgba(140,240,0,0.18)' : 'none'"
                    (click)="cellClicked(court, time)">
                    
                    <div *ngIf="getBooking(court, time) as booking" class="p-3.5 h-full flex flex-col justify-center text-left">
                      <p class="text-xs font-black text-[#111827] m-0 truncate">{{ booking.customer }}</p>
                      <p class="text-[10px] text-[#9CA3AF] font-bold mt-1 m-0">{{ booking.duration }}h Slot</p>
                    </div>

                    <div *ngIf="!getBooking(court, time)" class="h-full flex items-center justify-center opacity-50">
                      <ion-icon name="ellipse-outline" class="text-slate-200 text-sm"></ion-icon>
                    </div>
                  </div>
                </div>
              </ng-container>

            </div>
          </div>
        </div>

      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .calendar-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }
  `]
})
export class VenueCalendarPage implements OnInit {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);
  private readonly alertCtrl = inject(AlertController);

  currentDay = signal('Today');
  dayIndex = 0;
  loading = false;
  errorMessage = '';

  courts: string[] = ['Main Ground'];

  readonly timeSlots = [
    '6:00 AM',
    '8:00 AM',
    '10:00 AM',
    '12:00 PM',
    '2:00 PM',
    '4:00 PM',
    '6:00 PM',
    '8:00 PM',
  ];

  bookings: Record<string, CalendarCellBooking[]> = {};

  ngOnInit(): void {
    this.updateDayString();
    void this.loadCalendarData();
  }

  getBooking(court: string, time: string): CalendarCellBooking | null {
    return this.bookings[court]?.find((b) => b.time === time) ?? null;
  }

  prevDay() {
    this.dayIndex--;
    this.updateDayString();
    void this.loadCalendarData();
  }

  nextDay() {
    this.dayIndex++;
    this.updateDayString();
    void this.loadCalendarData();
  }

  private updateDayString() {
    const date = this.selectedDate();
    const base = new Date();
    const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    const label = diffDays === 0
      ? 'Today'
      : diffDays === 1
        ? 'Tomorrow'
        : diffDays === -1
          ? 'Yesterday'
          : new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(target);

    const display = new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(target);

    this.currentDay.set(`${label} - ${display}`);
  }

  async cellClicked(court: string, time: string) {
    const existing = this.getBooking(court, time);
    if (!existing) {
      return;
    }

    const alert = await this.alertCtrl.create({
      header: 'Booking Details',
      message: `${existing.customer}\n${existing.sport} · ${existing.time} · ${existing.duration}h\nStatus: ${existing.status}`,
      buttons: ['OK'],
    });

    await alert.present();
  }

  private selectedDate(): Date {
    const date = new Date();
    date.setDate(date.getDate() + this.dayIndex);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  private selectedDateIso(): string {
    const date = this.selectedDate();
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private async loadCalendarData(): Promise<void> {
    this.loading = true;
    this.errorMessage = '';

    try {
      const date = this.selectedDateIso();
      const [calendarResp, slotsResp] = await Promise.all([
        firstValueFrom(this.bookingService.getCalendar(`start_date=${date}&end_date=${date}`)),
        firstValueFrom(this.bookingService.getVenueSlots(`date=${date}`)),
      ]);

      const events = (calendarResp.data || []) as BookingCalendarEvent[];
      const slots = (slotsResp.data || []) as BookingSlot[];

      const bookingInfoById = new Map<string, { customer: string; sport: string; status: string }>();
      events.forEach((event) => {
        const meta = (event.meta || {}) as Record<string, unknown>;
        const hostName = typeof meta['hostName'] === 'string'
          ? String(meta['hostName'])
          : (event.title || 'Booked');
        const sport = typeof meta['sport'] === 'string'
          ? this.titleCase(String(meta['sport']))
          : 'Game';

        bookingInfoById.set(String(event.bookingId), {
          customer: hostName,
          sport,
          status: this.titleCase(event.status || 'confirmed'),
        });
      });

      const nextBookings: Record<string, CalendarCellBooking[]> = {};
      const courtNames = new Set<string>();

      slots.forEach((slot) => {
        const court = slot.courtName || 'Main Ground';
        courtNames.add(court);

        const info = bookingInfoById.get(String(slot.bookingId));
        const startLabel = this.timeLabel(slot.startTime);
        const duration = this.slotDurationHours(slot.startTime, slot.endTime);

        if (!nextBookings[court]) {
          nextBookings[court] = [];
        }

        nextBookings[court].push({
          time: startLabel,
          duration,
          customer: info?.customer || 'Booked Slot',
          sport: info?.sport || 'Game',
          status: info?.status || this.titleCase(slot.status || 'reserved'),
        });
      });

      this.bookings = nextBookings;
      this.courts = courtNames.size ? Array.from(courtNames) : ['Main Ground'];
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Failed to load calendar data.';
      this.bookings = {};
      this.courts = ['Main Ground'];
    } finally {
      this.loading = false;
    }
  }

  private timeLabel(time24?: string | null): string {
    if (!time24) return '—';
    const [h = '0', m = '0'] = time24.split(':');
    const date = new Date();
    date.setHours(Number(h), Number(m), 0, 0);
    return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }).format(date);
  }

  private slotDurationHours(start?: string | null, end?: string | null): number {
    if (!start || !end) return 1;
    const [sh = '0', sm = '0'] = start.split(':');
    const [eh = '0', em = '0'] = end.split(':');
    const startMin = Number(sh) * 60 + Number(sm);
    const endMin = Number(eh) * 60 + Number(em);
    const diff = Math.max(endMin - startMin, 60);
    return Math.max(1, Math.round(diff / 60));
  }

  private titleCase(value: string): string {
    return value
      .split(/[_\s-]+/)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  goHome() {
    this.router.navigateByUrl('/app/venue/dashboard');
  }
}
