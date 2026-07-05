import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-venue-detail',
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
          <h1 class="text-lg font-bold text-center flex-1">Venue Details</h1>
          <div class="w-10"></div>
        </header>

        <!-- Image Banner -->
        <div class="relative h-48 w-full rounded-2xl overflow-hidden mb-6">
          <img [src]="venue.image" alt="Venue Cover" class="h-full w-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
          <div class="absolute bottom-4 left-4 right-4 text-white">
            <span class="bg-[#8CF000] text-[#111827] text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded">
              {{ venue.emoji }} {{ venue.sports.join(', ') }}
            </span>
            <h2 class="text-lg font-bold mt-1 text-white">{{ venue.name }}</h2>
          </div>
        </div>

        <!-- Venue Overview -->
        <div class="grid grid-cols-3 gap-3 mb-6">
          <div class="bg-card border border-border rounded-xl p-3 text-center">
            <p class="text-[10px] text-slate-400 font-bold uppercase">Rating</p>
            <p class="text-sm font-bold text-slate-900 mt-1 flex items-center justify-center gap-0.5">
              <ion-icon name="star" class="text-orange-400"></ion-icon> {{ venue.rating }}
            </p>
          </div>
          <div class="bg-card border border-border rounded-xl p-3 text-center">
            <p class="text-[10px] text-slate-400 font-bold uppercase">Distance</p>
            <p class="text-sm font-bold text-slate-900 mt-1">{{ venue.distance }}</p>
          </div>
          <div class="bg-card border border-border rounded-xl p-3 text-center">
            <p class="text-[10px] text-slate-400 font-bold uppercase">Starting Price</p>
            <p class="text-sm font-bold text-slate-900 mt-1">₹{{ venue.price }}/hr</p>
          </div>
        </div>

        <!-- Location info -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-slate-900 mb-2">Location</h3>
          <p class="text-sm text-slate-600 flex items-center gap-1.5">
            <ion-icon name="location-outline" class="text-slate-400"></ion-icon>
            {{ venue.location }}
          </p>
        </div>

        <!-- Amenities -->
        <div class="mb-6">
          <h3 class="text-sm font-bold text-slate-900 mb-2">Amenities</h3>
          <div class="flex flex-wrap gap-2">
            <span *ngFor="let am of venue.amenities" class="px-3.5 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-slate-800">
              {{ am }}
            </span>
          </div>
        </div>

        <!-- Book Now CTA -->
        <div class="cta-box mt-8">
          <button (click)="bookVenue()" class="w-full h-12 rounded-full bg-gradient-to-r from-[#8CF000] to-[#A3E635] text-[#111827] font-bold shadow-md active:scale-[0.99] transition-all">
            Book Court Now
          </button>
        </div>

      </main>
    </ion-content>
  `,
  styles: [
    `
      ion-icon[name="star"] {
        color: #FF7A00;
      }
      button.bg-gradient-to-r {
        background: linear-gradient(to right, #8CF000, #A3E635) !important;
      }
    `
  ]
})
export class VenueDetailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  venueId: number | null = null;
  venue: any = null;

  readonly venues = [
    { id: 1, name: 'BRSABV Ekana Cricket Stadium', location: 'Gomti Nagar Extension, Lucknow', distance: '4.5 km', price: 2500, rating: 4.8, emoji: '🏏', sports: ['Cricket'], image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=800&fit=crop', amenities: ['Free Parking', 'Floodlights', 'Changing Rooms', 'Drinking Water'] },
    { id: 2, name: 'K.D. Singh Babu Stadium', location: 'Nehru Nagar, Lucknow', distance: '2.3 km', price: 1500, rating: 4.6, emoji: '⚽', sports: ['Football', 'Cricket'], image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&fit=crop', amenities: ['Washroom', 'Coaching Available', 'Spectator Stand'] },
    { id: 3, name: 'Sports Authority Complex', location: 'Gomti Nagar, Lucknow', distance: '3.8 km', price: 1200, rating: 4.5, emoji: '🏀', sports: ['Basketball', 'Badminton'], image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&fit=crop', amenities: ['Indoor Court', 'Lockers', 'First Aid'] }
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
    this.router.navigateByUrl('/app/venues');
  }

  bookVenue() {
    this.router.navigateByUrl(`/app/venue/${this.venueId}/book`);
  }
}
