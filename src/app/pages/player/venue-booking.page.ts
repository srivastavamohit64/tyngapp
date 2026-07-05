import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-venue-booking',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-top page-with-tab-bar px-6 py-4 bg-background text-foreground" *ngIf="venue">
        
        <!-- Header -->
        <header class="flex items-center justify-between mb-6">
          <button (click)="back()" class="h-10 w-10 grid place-items-center rounded-full bg-card border border-border">
            <ion-icon name="chevron-back-outline" class="text-xl"></ion-icon>
          </button>
          <h1 class="text-lg font-bold text-center flex-1">Book Court</h1>
          <div class="w-10"></div>
        </header>

        <!-- Selected Venue summary -->
        <div class="bg-card border border-border rounded-2xl p-4 mb-6 flex gap-3 items-center">
          <div class="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shadow-sm">
            {{ venue.emoji }}
          </div>
          <div>
            <h2 class="text-base font-bold text-slate-900 leading-tight">{{ venue.name }}</h2>
            <p class="text-xs text-slate-400 mt-0.5">{{ venue.location }}</p>
          </div>
        </div>

        <!-- 1. Select Date -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-slate-900 mb-3">Select Date</h3>
          <div class="flex gap-2.5 overflow-x-auto pb-2">
            <button 
              *ngFor="let date of dates" 
              class="date-btn flex flex-col items-center justify-center h-20 w-14 rounded-xl border border-border bg-card transition-all"
              [class.active]="selectedDate === date.val"
              (click)="selectedDate = date.val"
            >
              <span class="text-[10px] uppercase font-bold text-slate-400">{{ date.day }}</span>
              <span class="text-lg font-black text-slate-800 mt-1">{{ date.num }}</span>
            </button>
          </div>
        </div>

        <!-- 2. Select Court -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-slate-900 mb-3">Select Court</h3>
          <div class="flex flex-col gap-2">
            <button 
              *ngFor="let court of courts" 
              class="court-btn flex justify-between items-center px-4 py-3.5 rounded-xl border border-border bg-card transition-all text-left"
              [class.active]="selectedCourt === court"
              (click)="selectedCourt = court"
            >
              <span class="text-sm font-bold text-slate-800">{{ court }}</span>
              <ion-icon *ngIf="selectedCourt === court" name="checkmark-circle" class="text-xl text-primary"></ion-icon>
            </button>
          </div>
        </div>

        <!-- 3. Select Time Slot -->
        <div class="mb-8">
          <h3 class="text-sm font-bold text-slate-900 mb-3">Select Time Slot</h3>
          <div class="grid grid-cols-3 gap-2">
            <button 
              *ngFor="let slot of slots" 
              class="slot-btn h-12 rounded-xl border border-border bg-card text-xs font-bold text-slate-800 flex items-center justify-center transition-all"
              [class.active]="selectedSlot === slot"
              (click)="selectedSlot = slot"
            >
              {{ slot }}
            </button>
          </div>
        </div>

        <!-- Proceed CTA -->
        <div class="cta-box">
          <button 
            [disabled]="!selectedDate || !selectedCourt || !selectedSlot" 
            (click)="proceedToSummary()" 
            class="w-full h-12 rounded-full bg-gradient-to-r from-[#8CF000] to-[#A3E635] text-[#111827] font-bold shadow-md disabled:bg-none disabled:bg-[#F3F4F6] disabled:text-[#9CA3AF] disabled:opacity-100 disabled:cursor-not-allowed transition-all"
          >
            Review &amp; Pay
          </button>
        </div>

      </main>
    </ion-content>
  `,
  styles: [
    `
      .date-btn.active, .court-btn.active, .slot-btn.active {
        border-color: #8CF000 !important;
        background: rgba(140, 240, 0, 0.08) !important;
      }
      .date-btn.active span {
        color: #111827 !important;
      }
      .court-btn.active span, .slot-btn.active {
        color: #111827 !important;
      }
      button.bg-gradient-to-r {
        background: linear-gradient(to right, #8CF000, #A3E635) !important;
      }
    `
  ]
})
export class VenueBookingPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  venueId: number | null = null;
  venue: any = null;

  selectedDate = '';
  selectedCourt = '';
  selectedSlot = '';

  readonly dates = [
    { day: 'Mon', num: '06', val: '2026-07-06' },
    { day: 'Tue', num: '07', val: '2026-07-07' },
    { day: 'Wed', num: '08', val: '2026-07-08' },
    { day: 'Thu', num: '09', val: '2026-07-09' },
    { day: 'Fri', num: '10', val: '2026-07-10' },
    { day: 'Sat', num: '11', val: '2026-07-11' }
  ];

  readonly courts = ['Court A (Premium Hardcourt)', 'Court B (Clay Court)', 'Court C (Indoor Synthetic)'];

  readonly slots = [
    '06:00 AM', '07:00 AM', '08:00 AM',
    '04:00 PM', '05:00 PM', '06:00 PM',
    '07:00 PM', '08:00 PM', '09:00 PM'
  ];

  readonly venues = [
    { id: 1, name: 'BRSABV Ekana Cricket Stadium', location: 'Gomti Nagar Extension, Lucknow', distance: '4.5 km', price: 2500, rating: 4.8, emoji: '🏏', sports: ['Cricket'] },
    { id: 2, name: 'K.D. Singh Babu Stadium', location: 'Nehru Nagar, Lucknow', distance: '2.3 km', price: 1500, rating: 4.6, emoji: '⚽', sports: ['Football', 'Cricket'] },
    { id: 3, name: 'Sports Authority Complex', location: 'Gomti Nagar, Lucknow', distance: '3.8 km', price: 1200, rating: 4.5, emoji: '🏀', sports: ['Basketball', 'Badminton'] }
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.venueId = +idStr;
        this.venue = this.venues.find(v => v.id === this.venueId) || this.venues[0];
      }
    });
  }

  back() {
    this.router.navigateByUrl(`/app/venue/${this.venueId}`);
  }

  proceedToSummary() {
    this.router.navigate([`/app/venue/${this.venueId}/summary`], {
      queryParams: {
        date: this.selectedDate,
        court: this.selectedCourt,
        slot: this.selectedSlot
      }
    });
  }
}
