import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { VENUE_DATA, type VenueDetail } from './venue-detail.page';

interface DateItem {
  idx: number;
  dayShort: string;
  dateNum: number;
  monthShort: string;
  fullLabel: string;
}

@Component({
  selector: 'app-venue-booking',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <div class="min-h-screen bg-[#FAFBFC] pb-36 text-[#111827] text-left" *ngIf="venue">
        
        <!-- Header -->
        <div class="sticky top-0 z-30 bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button
              (click)="back()"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none outline-none"
            >
              <ion-icon name="chevron-back" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[15px] font-black text-[#111827] m-0">Select Date & Time</p>
              <p class="text-[11px] text-[#9CA3AF] m-0 font-bold mt-0.5">{{ venue.venueName }}</p>
            </div>
            <div class="w-10"></div>
          </div>
        </div>

        <div class="px-5 pt-4 space-y-5">
          
          <!-- Venue summary -->
          <div class="bg-white rounded-[24px] p-4 flex items-center gap-4 border border-[#F3F4F6] shadow-sm">
            <div class="w-[72px] h-[72px] rounded-2xl overflow-hidden bg-gray-200 flex-shrink-0">
              <img [src]="venue.images[0]" [alt]="venue.courtName" class="w-full h-full object-cover" />
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-[15px] font-black text-[#111827] leading-tight m-0">{{ venue.courtName }}</p>
              <p class="text-[12px] text-[#9CA3AF] truncate m-0 mt-1 font-bold">{{ venue.venueName }}</p>
              <div class="flex items-center gap-3 mt-1.5 leading-none">
                <div class="flex items-center gap-1">
                  <ion-icon name="location-outline" class="text-[#9CA3AF] text-xs"></ion-icon>
                  <span class="text-[11px] text-[#9CA3AF] font-bold">{{ venue.address.split(',')[1]?.trim() }}</span>
                </div>
              </div>
            </div>
            <div class="text-right flex-shrink-0">
              <p class="text-[18px] font-black text-[#111827] m-0">₹{{ venue.pricePerHour.toLocaleString() }}</p>
              <p class="text-[10px] text-[#9CA3AF] m-0 mt-0.5 leading-none font-bold">per hour</p>
            </div>
          </div>

          <!-- Date picker -->
          <div>
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Select Date</p>
            <div class="flex gap-2.5 overflow-x-auto pb-1 no-scrollbar">
              <button
                *ngFor="let date of dates"
                (click)="selectDate(date.idx)"
                class="flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl transition-all border-none outline-none"
                [style.backgroundColor]="selectedDateIdx === date.idx ? 'rgba(140,240,0,0.12)' : 'white'"
                [style.border]="selectedDateIdx === date.idx ? '2px solid #8CF000' : '2px solid #F3F4F6'"
                [style.boxShadow]="selectedDateIdx === date.idx ? '0 2px 12px rgba(140,240,0,0.22)' : '0 1px 4px rgba(0,0,0,0.06)'"
                style="min-width: 58px;"
              >
                <span
                  class="text-[9px] font-bold uppercase tracking-wider leading-none"
                  [style.color]="selectedDateIdx === date.idx ? '#8CF000' : '#9CA3AF'"
                >
                  {{ date.dayShort }}
                </span>
                <span
                  class="text-[18px] font-black mt-1 leading-none"
                  [style.color]="selectedDateIdx === date.idx ? '#111827' : '#6B7280'"
                >
                  {{ date.dateNum }}
                </span>
                <span
                  class="text-[9px] font-bold mt-1 leading-none"
                  [style.color]="selectedDateIdx === date.idx ? '#9CA3AF' : '#C4C9D4'"
                >
                  {{ date.monthShort }}
                </span>
                <div *ngIf="selectedDateIdx === date.idx" class="w-1.5 h-1.5 rounded-full bg-[#8CF000] mt-1.5"></div>
              </button>
            </div>
          </div>

          <!-- Time slots grid -->
          <div>
            <div class="flex items-center justify-between mb-3 text-left">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0 leading-none">Available Slots</p>
              <p class="text-[11px] text-[#9CA3AF] m-0 font-bold leading-none">
                {{ allSlots.length - unavailable.length }} available · tap to select
              </p>
            </div>

            <div class="grid grid-cols-3 gap-2.5">
              <button
                *ngFor="let slot of allSlots"
                [disabled]="isSlotUnavailable(slot)"
                (click)="toggleSlot(slot)"
                class="py-3 px-2 rounded-2xl text-center transition-all relative border border-[#F3F4F6] outline-none"
                [style.backgroundColor]="isSlotUnavailable(slot) ? '#F9FAFB' : selectedSlots.includes(slot) ? '#8CF000' : 'white'"
                [style.border]="isSlotUnavailable(slot) ? '1.5px solid #F3F4F6' : selectedSlots.includes(slot) ? '1.5px solid #8CF000' : '1.5px solid #F3F4F6'"
                [style.opacity]="isSlotUnavailable(slot) ? 0.45 : 1"
                [style.boxShadow]="selectedSlots.includes(slot) ? '0 2px 10px rgba(140,240,0,0.32)' : '0 1px 4px rgba(0,0,0,0.05)'"
              >
                <p
                  class="text-[12px] font-bold m-0 leading-none"
                  [style.color]="isSlotUnavailable(slot) ? '#C4C9D4' : selectedSlots.includes(slot) ? '#111827' : '#6B7280'"
                >
                  {{ slot }}
                </p>
                <p *ngIf="isSlotUnavailable(slot)" class="text-[9px] text-[#C4C9D4] mt-1 font-bold m-0 leading-none">Booked</p>
                
                <div
                  *ngIf="selectedSlots.includes(slot)"
                  class="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-[#111827] flex items-center justify-center"
                >
                  <ion-icon name="checkmark" class="text-[#8CF000] text-[10px] font-black"></ion-icon>
                </div>
              </button>
            </div>

            <!-- Legend -->
            <div class="flex items-center gap-4 mt-3.5 leading-none">
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-[#8CF000]"></div>
                <span class="text-[10px] text-[#9CA3AF] font-bold">Selected</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-white border border-[#E5E7EB]"></div>
                <span class="text-[10px] text-[#9CA3AF] font-bold">Available</span>
              </div>
              <div class="flex items-center gap-1.5">
                <div class="w-3 h-3 rounded bg-[#F3F4F6]" style="opacity: 0.45;"></div>
                <span class="text-[10px] text-[#9CA3AF] font-bold">Booked</span>
              </div>
            </div>
          </div>

          <!-- Booking summary (conditionally shown) -->
          <div
            *ngIf="hours > 0"
            class="rounded-[24px] p-5 text-left border border-slate-900 shadow-xl"
            style="background: linear-gradient(135deg,#111827 0%,#1F2937 100%);"
          >
            <p class="text-[11px] font-black text-[#8CF000] uppercase tracking-widest mb-4 m-0 leading-none">Booking Summary</p>

            <div class="grid grid-cols-2 gap-3 mb-4">
              <div class="flex items-center gap-2.5">
                <span class="text-xl leading-none">📅</span>
                <div>
                  <p class="text-[10px] text-white/40 m-0 leading-none">Date</p>
                  <p class="text-[13px] font-black text-white m-0 mt-1 leading-none">{{ selectedDateLabel }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="text-xl leading-none">⏰</span>
                <div>
                  <p class="text-[10px] text-white/40 m-0 leading-none">Start Time</p>
                  <p class="text-[13px] font-black text-white m-0 mt-1 leading-none">{{ startSlot }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="text-xl leading-none">⏱</span>
                <div>
                  <p class="text-[10px] text-white/40 m-0 leading-none">Duration</p>
                  <p class="text-[13px] font-black text-white m-0 mt-1 leading-none">{{ formatDuration(hours) }}</p>
                </div>
              </div>
              <div class="flex items-center gap-2.5">
                <span class="text-xl leading-none">🏁</span>
                <div>
                  <p class="text-[10px] text-white/40 m-0 leading-none">Ends At</p>
                  <p class="text-[13px] font-black text-white m-0 mt-1 leading-none">{{ endTime }}</p>
                </div>
              </div>
            </div>

            <!-- Court -->
            <div class="flex items-center gap-2 mb-4 pb-4 border-b border-white/10 leading-none">
              <ion-icon name="location-outline" class="text-white/40 text-xs"></ion-icon>
              <p class="text-[12px] text-white/60 truncate m-0">{{ venue.courtName }}</p>
            </div>

            <!-- Cost breakdown -->
            <div class="space-y-2">
              <div class="flex justify-between leading-none text-left">
                <span class="text-[12px] text-white/50">Court ({{ hours }}h × ₹{{ venue.pricePerHour.toLocaleString() }})</span>
                <span class="text-[12px] font-bold text-white">₹{{ totalCost.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between leading-none text-left" *ngIf="rentalCost > 0">
                <span class="text-[12px] text-white/50">Rental Equipment</span>
                <span class="text-[12px] font-bold text-white">₹{{ rentalCost.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between pt-2.5 border-t border-white/10 leading-none text-left">
                <span class="text-[14px] font-black text-white">Total</span>
                <span class="text-[18px] font-black text-[#8CF000]">₹{{ grandTotal.toLocaleString() }}</span>
              </div>
            </div>
          </div>

          <!-- Duration bar when slots selected -->
          <div
            *ngIf="hours > 0"
            class="flex items-center justify-between bg-[#8CF000]/10 rounded-2xl px-4 py-3 border border-[#8CF000]/25 text-left leading-none"
          >
            <div class="flex items-center gap-2">
              <ion-icon name="time-outline" class="text-[#8CF000] text-sm"></ion-icon>
              <span class="text-[13px] font-black text-[#111827]">{{ formatDuration(hours) }} booked</span>
            </div>
            <span class="text-[12px] text-[#6B7280] font-bold">{{ startSlot }} – {{ endTime }}</span>
          </div>
        </div>

        <!-- Sticky Continue CTA -->
        <div
          class="fixed bottom-0 left-0 right-0 z-30 bg-white max-w-md mx-auto px-5 py-4 pb-8 border-t border-[#F3F4F6]"
          style="box-shadow: 0 -4px 24px rgba(0,0,0,0.09);"
        >
          <button
            [disabled]="hours === 0"
            (click)="continueToSummary()"
            class="w-full h-14 rounded-2xl text-[16px] font-black flex items-center justify-center gap-2 border-none outline-none transition-all duration-200"
            [style.background]="hours > 0 ? 'linear-gradient(135deg,#FF7A00 0%,#FF9A40 100%)' : '#F3F4F6'"
            [style.color]="hours > 0 ? 'white' : '#C4C9D4'"
            [style.boxShadow]="hours > 0 ? '0 4px 20px rgba(255,122,0,0.42)' : 'none'"
          >
            <ng-container *ngIf="hours > 0; else selectLabel">
              <span>Continue · ₹{{ grandTotal.toLocaleString() }}</span>
              <ion-icon name="chevron-forward-outline" class="text-base font-black"></ion-icon>
            </ng-container>
            <ng-template #selectLabel>
              <span>Select at least one slot</span>
            </ng-template>
          </button>
          <p class="text-center text-[10px] text-[#9CA3AF] m-0 mt-2 font-semibold" *ngIf="hours > 0">
            Free cancellation up to 24 hours before your slot
          </p>
        </div>

      </div>
    </ion-content>
  `,
  styles: [
    `
      .no-scrollbar {
        scrollbar-width: none;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `
  ]
})
export class VenueBookingPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  venueId: number | null = null;
  venue: VenueDetail | null = null;
  rentalItems: Record<string, number> = {};

  dates: DateItem[] = [];
  selectedDateIdx = 0;
  selectedSlots: string[] = [];

  readonly allSlots = [
    '6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
    '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM',
  ];

  readonly unavailableMock: Record<number, string[]> = {
    0: ['8:00 AM', '9:00 AM', '2:00 PM'],
    1: ['11:00 AM', '7:00 PM', '8:00 PM'],
    2: ['6:00 AM', '1:00 PM'],
    3: ['10:00 AM', '4:00 PM', '5:00 PM'],
  };

  ngOnInit() {
    this.dates = this.buildDates();

    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.venueId = +idStr;
        
        // Recover state from router navigation if passed
        const nav = this.router.getCurrentNavigation();
        if (nav?.extras.state) {
          this.venue = nav.extras.state['venue'] as VenueDetail;
          this.rentalItems = (nav.extras.state['rentalItems'] || {}) as Record<string, number>;
        }

        // Fallback if refreshed or direct link
        if (!this.venue) {
          this.venue = VENUE_DATA.find(v => v.id === this.venueId) || VENUE_DATA[0];
          this.rentalItems = {};
        }
      }
    });
  }

  buildDates(): DateItem[] {
    const today = new Date();
    const list: DateItem[] = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      list.push({
        idx: i,
        dayShort: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : d.toLocaleDateString('en-US', { weekday: 'short' }),
        dateNum: d.getDate(),
        monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
      });
    }
    return list;
  }

  get unavailable(): string[] {
    return this.unavailableMock[this.selectedDateIdx] || [];
  }

  isSlotUnavailable(slot: string): boolean {
    return this.unavailable.includes(slot);
  }

  selectDate(idx: number) {
    this.selectedDateIdx = idx;
    this.selectedSlots = [];
  }

  toggleSlot(slot: string) {
    if (this.selectedSlots.includes(slot)) {
      this.selectedSlots = this.selectedSlots.filter(s => s !== slot);
    } else {
      this.selectedSlots = [...this.selectedSlots, slot];
    }
  }

  get sortedSlots(): string[] {
    return [...this.selectedSlots].sort((a, b) => this.allSlots.indexOf(a) - this.allSlots.indexOf(b));
  }

  get selectedDateLabel(): string {
    return this.dates[this.selectedDateIdx]?.fullLabel || '';
  }

  get startSlot(): string {
    return this.sortedSlots[0] || '';
  }

  get hours(): number {
    return this.selectedSlots.length;
  }

  get totalCost(): number {
    if (!this.venue) return 0;
    return this.hours * this.venue.pricePerHour;
  }

  get rentalCost(): number {
    if (!this.venue) return 0;
    return Object.entries(this.rentalItems).reduce((sum, [itemId, qty]) => {
      const item = this.venue?.rentalEquipment.find(e => e.id === itemId);
      return sum + (item ? item.price * qty : 0);
    }, 0);
  }

  get grandTotal(): number {
    return this.totalCost + this.rentalCost;
  }

  get endTime(): string {
    if (this.hours === 0 || !this.startSlot) return '';
    const [hm, ampm] = this.startSlot.split(' ');
    const [h, m] = hm.split(':').map(Number);
    let total = (ampm === 'PM' && h !== 12 ? h + 12 : h === 12 && ampm === 'AM' ? 0 : h) * 60 + m + this.hours * 60;
    const endH = Math.floor(total / 60) % 24;
    const endM = total % 60;
    const endAmpm = endH >= 12 ? 'PM' : 'AM';
    const displayH = endH > 12 ? endH - 12 : endH === 0 ? 12 : endH;
    return `${displayH}:${endM.toString().padStart(2, '0')} ${endAmpm}`;
  }

  formatDuration(count: number): string {
    if (count === 0) return '';
    if (count === 1) return '1 hour';
    return `${count} hours`;
  }

  back() {
    this.router.navigateByUrl(`/app/venue/${this.venueId}`);
  }

  continueToSummary() {
    if (this.hours === 0 || !this.venue) return;
    this.router.navigate([`/app/venue/${this.venueId}/summary`], {
      state: {
        venue: this.venue,
        selectedDate: this.selectedDateLabel,
        selectedSlots: this.sortedSlots,
        rentalItems: this.rentalItems,
      }
    });
  }
}
