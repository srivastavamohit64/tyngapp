import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-venue-booking-summary',
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
          <h1 class="text-lg font-bold text-center flex-1">Booking Summary</h1>
          <div class="w-10"></div>
        </header>

        <!-- Booking details receipt -->
        <div class="bg-card border border-border rounded-2xl p-6 mb-6">
          <div class="border-b border-dashed border-border pb-4 mb-4">
            <span class="text-[10px] uppercase font-bold text-slate-400">Venue</span>
            <h2 class="text-base font-bold text-slate-900 mt-0.5">{{ venue.name }}</h2>
            <p class="text-xs text-slate-500">{{ venue.location }}</p>
          </div>

          <div class="space-y-4 border-b border-dashed border-border pb-4 mb-4">
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Date</span>
              <span class="font-bold text-slate-800">{{ bookingDate }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Court</span>
              <span class="font-bold text-slate-800">{{ bookingCourt }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-slate-400">Time Slot</span>
              <span class="font-bold text-slate-800">{{ bookingSlot }}</span>
            </div>
          </div>

          <div class="space-y-3">
            <div class="flex justify-between text-xs text-slate-500">
              <span>Court Rental (1 hr)</span>
              <span>₹{{ venue.price }}</span>
            </div>
            <div class="flex justify-between text-xs text-slate-500">
              <span>Convenience Fee</span>
              <span>₹50</span>
            </div>
            <div class="flex justify-between text-sm font-bold text-slate-900 border-t border-border pt-3 mt-1">
              <span>Total Amount</span>
              <span>₹{{ venue.price + 50 }}</span>
            </div>
          </div>
        </div>

        <!-- Payment Info Card -->
        <div class="bg-card border border-border rounded-2xl p-4 mb-8 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-lg bg-orange-100 text-[#FF7A00] flex items-center justify-center text-xl">
              💳
            </div>
            <div>
              <p class="text-xs font-bold text-slate-900">Google Pay / UPI</p>
              <p class="text-[10px] text-slate-400 mt-0.5">Primary Payment Method</p>
            </div>
          </div>
          <span class="text-xs font-bold text-primary">CHANGE</span>
        </div>

        <!-- Confirm CTA -->
        <div class="cta-box">
          <button (click)="confirmBooking()" class="w-full h-12 rounded-full bg-gradient-to-r from-[#8CF000] to-[#A3E635] text-[#111827] font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all">
            Confirm &amp; Pay ₹{{ venue.price + 50 }}
          </button>
        </div>

      </main>
    </ion-content>
  `,
  styles: [
    `
      button.bg-gradient-to-r {
        background: linear-gradient(to right, #8CF000, #A3E635) !important;
      }
      .border-dashed {
        border-style: dashed !important;
      }
    `
  ]
})
export class VenueBookingSummaryPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  venueId: number | null = null;
  venue: any = null;

  bookingDate = '';
  bookingCourt = '';
  bookingSlot = '';

  readonly venues = [
    { id: 1, name: 'BRSABV Ekana Cricket Stadium', location: 'Gomti Nagar Extension, Lucknow', price: 2500, emoji: '🏏' },
    { id: 2, name: 'K.D. Singh Babu Stadium', location: 'Nehru Nagar, Lucknow', price: 1500, emoji: '⚽' },
    { id: 3, name: 'Sports Authority Complex', location: 'Gomti Nagar, Lucknow', price: 1200, emoji: '🏀' }
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.venueId = +idStr;
        this.venue = this.venues.find(v => v.id === this.venueId) || this.venues[0];
      }
    });

    this.route.queryParams.subscribe(q => {
      this.bookingDate = q['date'] || '2026-07-06';
      this.bookingCourt = q['court'] || 'Court A';
      this.bookingSlot = q['slot'] || '07:00 PM';
    });
  }

  back() {
    this.router.navigateByUrl(`/app/venue/${this.venueId}/book`);
  }

  confirmBooking() {
    alert('Payment Successful! Court booking confirmed.');
    this.router.navigateByUrl('/app/home');
  }
}
