import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';

interface BookingSlot {
  time: string;
  duration: number;
  customer: string;
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

                    <div *ngIf="!getBooking(court, time)" class="h-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <ion-icon name="add-outline" class="text-slate-300 text-lg"></ion-icon>
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
export class VenueCalendarPage {
  private readonly router = inject(Router);

  currentDay = signal('Today - April 22, 2026');
  dayIndex = 0;

  readonly courts = ['Court 1', 'Court 2', 'Main Ground'];

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

  bookings: Record<string, BookingSlot[]> = {
    'Court 1': [
      { time: '6:00 AM', duration: 2, customer: 'Rahul Sharma' },
      { time: '6:00 PM', duration: 1, customer: 'Priya Singh' },
    ],
    'Court 2': [
      { time: '4:00 PM', duration: 2, customer: 'Elite Squad' }
    ],
    'Main Ground': [
      { time: '8:00 PM', duration: 2, customer: 'Cricket Team' }
    ],
  };

  getBooking(court: string, time: string): BookingSlot | null {
    return this.bookings[court]?.find(b => b.time === time) ?? null;
  }

  prevDay() {
    this.dayIndex--;
    this.updateDayString();
  }

  nextDay() {
    this.dayIndex++;
    this.updateDayString();
  }

  private updateDayString() {
    if (this.dayIndex === 0) {
      this.currentDay.set('Today - April 22, 2026');
    } else if (this.dayIndex === -1) {
      this.currentDay.set('Yesterday - April 21, 2026');
    } else if (this.dayIndex === 1) {
      this.currentDay.set('Tomorrow - April 23, 2026');
    } else {
      this.currentDay.set(`April ${22 + this.dayIndex}, 2026`);
    }
  }

  cellClicked(court: string, time: string) {
    const existing = this.getBooking(court, time);
    if (existing) {
      alert(`Booking Details:\nCustomer: ${existing.customer}\nTime: ${existing.time}\nDuration: ${existing.duration}h`);
    } else {
      const customer = prompt(`Enter customer name to book ${court} at ${time}:`);
      if (customer && customer.trim()) {
        const slot: BookingSlot = {
          time,
          duration: 2,
          customer: customer.trim()
        };
        if (!this.bookings[court]) {
          this.bookings[court] = [];
        }
        this.bookings[court].push(slot);
      }
    }
  }

  goHome() {
    this.router.navigateByUrl('/app/home');
  }
}
