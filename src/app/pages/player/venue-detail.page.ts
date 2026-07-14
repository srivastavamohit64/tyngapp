import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

export interface VenueDetail {
  id: number;
  courtName: string;
  venueName: string;
  sport: string;
  rating: number;
  reviewCount: number;
  pricePerHour: number;
  openTime: string;
  closeTime: string;
  address: string;
  images: string[];
  amenities: { icon: string; label: string }[];
  yearBuilt: number;
  area: string;
  surface: string;
  maxPlayers: number;
  rentalEquipment: { id: string; name: string; price: number; emoji: string }[];
  reviews: { name: string; photo: string; rating: number; text: string; date: string }[];
  offers: { title: string; desc: string; accent: string; expires: string }[];
}

export const VENUE_DATA: VenueDetail[] = [
  {
    id: 1,
    courtName: 'Main Ground — Premium Turf',
    venueName: 'BRSABV Ekana Cricket Stadium',
    sport: 'Cricket',
    rating: 4.8,
    reviewCount: 128,
    pricePerHour: 2500,
    openTime: '6:00 AM',
    closeTime: '10:00 PM',
    address: 'Ekana Sports City, Gomti Nagar Extension, Lucknow, UP 226010',
    images: [
      'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=800&h=520&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=520&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&h=520&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&h=520&fit=crop&auto=format',
    ],
    amenities: [
      { icon: 'car-outline',      label: 'Free Parking'     },
      { icon: 'flash-outline',    label: 'Floodlights'      },
      { icon: 'water-outline',    label: 'Washrooms'         },
      { icon: 'water-outline',    label: 'Drinking Water'   },
      { icon: 'shirt-outline',    label: 'Changing Rooms'   },
      { icon: 'cafe-outline',     label: 'Cafeteria'         },
    ],
    yearBuilt: 2017,
    area: '22,000 sq ft',
    surface: 'Natural Grass',
    maxPlayers: 22,
    rentalEquipment: [
      { id: 'bat',    name: 'Cricket Bat',    price: 150, emoji: '🏏' },
      { id: 'ball',   name: 'Cricket Ball',   price: 50,  emoji: '🥎' },
      { id: 'helmet', name: 'Helmet',         price: 100, emoji: '⛑️' },
      { id: 'gloves', name: 'Batting Gloves', price: 80,  emoji: '🧤' },
      { id: 'pads',   name: 'Batting Pads',   price: 120, emoji: '🛡️' },
      { id: 'shoes',  name: 'Sports Shoes',   price: 150, emoji: '👟' },
    ],
    reviews: [
      { name: 'Rahul Sharma', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', rating: 5, text: 'Incredible venue! Best cricket ground in Lucknow. Well maintained pitch and great floodlights. The staff is also very helpful.', date: '2 weeks ago' },
      { name: 'Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', rating: 4, text: 'Great facility, the changing rooms are clean and spacious. The cafeteria serves decent snacks. Perfect for weekend games.', date: '1 month ago' },
      { name: 'Vikram Singh', photo: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=80&h=80&fit=crop&auto=format', rating: 5, text: 'Top-class stadium. Loved the experience. The natural grass pitch plays beautifully. Will definitely book again!', date: '1 month ago' },
      { name: 'Ananya Patel', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format', rating: 4, text: 'Smooth booking process through TYNG. Venue was exactly as shown. Good value for the quality.', date: '2 months ago' },
    ],
    offers: [
      { title: '20% OFF Weekday Mornings', desc: 'Book before 10 AM Mon–Fri', accent: '#8CF000', expires: 'Ends 30 Jun' },
      { title: 'Buy 5 Hours, Get 1 Free', desc: 'Accumulate across any month', accent: '#FF7A00', expires: 'Ongoing' },
      { title: '₹500 OFF First Booking', desc: 'New users only', accent: '#38BDF8', expires: 'Limited time' },
    ],
  },
  {
    id: 2,
    courtName: 'Football Turf A',
    venueName: 'K.D. Singh Babu Stadium',
    sport: 'Football',
    rating: 4.6,
    reviewCount: 84,
    pricePerHour: 1500,
    openTime: '5:00 AM',
    closeTime: '11:00 PM',
    address: 'Nehru Nagar, Hazratganj, Lucknow, UP 226001',
    images: [
      'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=800&h=520&fit=crop&auto=format',
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=520&fit=crop&auto=format',
    ],
    amenities: [
      { icon: 'car-outline',      label: 'Parking'       },
      { icon: 'water-outline',    label: 'Washrooms'     },
      { icon: 'water-outline',    label: 'Drinking Water'},
    ],
    yearBuilt: 2009,
    area: '15,000 sq ft',
    surface: 'Artificial Turf',
    maxPlayers: 22,
    rentalEquipment: [
      { id: 'football', name: 'Football',   price: 80,  emoji: '⚽' },
      { id: 'shoes',    name: 'Turf Shoes', price: 120, emoji: '👟' },
      { id: 'gloves',   name: 'GK Gloves', price: 100, emoji: '🧤' },
    ],
    reviews: [
      { name: 'Aryan Mehta', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', rating: 5, text: 'Great turf, perfect for weekend matches. Booking was seamless.', date: '3 weeks ago' },
    ],
    offers: [
      { title: '15% OFF Weekends', desc: 'Saturday & Sunday all day', accent: '#8CF000', expires: 'Ongoing' },
    ],
  },
  {
    id: 3,
    courtName: 'Indoor Court A',
    venueName: 'Sports Authority Complex',
    sport: 'Basketball',
    rating: 4.5,
    reviewCount: 55,
    pricePerHour: 1200,
    openTime: '6:00 AM',
    closeTime: '9:00 PM',
    address: 'Gomti Nagar, Lucknow, UP 226010',
    images: [
      'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800&fit=crop',
      'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&fit=crop',
    ],
    amenities: [
      { icon: 'car-outline',      label: 'Parking'       },
      { icon: 'water-outline',    label: 'Washrooms'     },
      { icon: 'water-outline',    label: 'Drinking Water'},
    ],
    yearBuilt: 2012,
    area: '18,000 sq ft',
    surface: 'Hardcourt Wooden',
    maxPlayers: 15,
    rentalEquipment: [
      { id: 'basketball', name: 'Basketball', price: 100, emoji: '🏀' },
      { id: 'shoes',      name: 'Sports Shoes', price: 150, emoji: '👟' },
    ],
    reviews: [
      { name: 'Sameer Sen', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', rating: 5, text: 'Great indoor setup. Good quality wooden flooring.', date: '1 week ago' },
    ],
    offers: [
      { title: '10% off on first booking', desc: 'Welcome coupon', accent: '#8CF000', expires: 'Ongoing' },
    ],
  }
];

@Component({
  selector: 'app-venue-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <div class="min-h-screen bg-[#FAFBFC] pb-28 text-[#111827] text-left" *ngIf="venue">
        
        <!-- Image carousel -->
        <div class="relative bg-gray-900 h-[300px]">
          <div class="absolute inset-0">
            <img
              [src]="venue.images[currentImageIndex]"
              alt="venue"
              class="w-full h-full object-cover"
            />
            <div class="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50"></div>
          </div>

          <!-- Back -->
          <button
            (click)="back()"
            class="absolute top-12 left-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 outline-none"
          >
            <ion-icon name="chevron-back" class="text-white text-lg"></ion-icon>
          </button>

          <!-- Favourite -->
          <button
            (click)="favourited = !favourited"
            class="absolute top-12 right-4 z-10 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 outline-none"
          >
            <ion-icon
              name="heart"
              [class.text-red-500]="favourited"
              [class.text-white]="!favourited"
              class="text-lg"
            ></ion-icon>
          </button>

          <!-- Image counter -->
          <div class="absolute top-14 right-16 z-10 bg-black/50 backdrop-blur-sm px-2.5 py-1 rounded-full leading-none">
            <span class="text-white text-[11px] font-bold">{{ currentImageIndex + 1 }}/{{ venue.images.length }}</span>
          </div>

          <!-- Dots -->
          <div class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            <button
              *ngFor="let img of venue.images; let i = index"
              (click)="currentImageIndex = i"
              class="h-[6px] rounded-full border-none p-0 transition-all duration-200 outline-none"
              [style.width.px]="i === currentImageIndex ? 20 : 6"
              [style.backgroundColor]="i === currentImageIndex ? '#8CF000' : 'rgba(255,255,255,0.6)'"
            ></button>
          </div>
        </div>

        <!-- Hero info -->
        <div class="px-5 pt-5 pb-4 bg-white border-b border-[#F3F4F6]">
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1 min-w-0">
              <h1 class="text-[22px] font-black text-[#111827] leading-tight m-0">{{ venue.courtName }}</h1>
              <p class="text-[14px] text-[#6B7280] mt-1 m-0">{{ venue.venueName }}</p>
            </div>
            <div class="text-right ml-3 flex-shrink-0">
              <p class="text-[22px] font-black text-[#111827] m-0">₹{{ venue.pricePerHour.toLocaleString() }}</p>
              <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5 leading-none">per hour</p>
            </div>
          </div>

          <div class="flex items-center gap-4 mt-3">
            <div class="flex items-center gap-1.5 leading-none">
              <div class="flex gap-0.5">
                <ion-icon
                  *ngFor="let star of [1,2,3,4,5]"
                  name="star"
                  [style.color]="star <= Math.round(venue.rating) ? '#F59E0B' : '#E5E7EB'"
                  class="text-xs"
                ></ion-icon>
              </div>
              <span class="text-[13px] font-black text-[#111827]">{{ venue.rating }}</span>
              <span class="text-[12px] text-[#9CA3AF] font-bold">({{ venue.reviewCount }} reviews)</span>
            </div>
          </div>

          <div class="flex items-center gap-4 mt-3 flex-wrap">
            <div class="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
              <ion-icon name="time-outline" class="text-[#9CA3AF] text-sm"></ion-icon>
              <span class="font-bold">{{ venue.openTime }} – {{ venue.closeTime }}</span>
            </div>
            <div class="flex items-center gap-1.5 text-[12px] text-[#6B7280]">
              <ion-icon name="location-outline" class="text-[#9CA3AF] text-sm"></ion-icon>
              <span class="truncate max-w-[160px] font-bold">{{ venue.address.split(',')[0] }}</span>
            </div>
          </div>
        </div>

        <div class="px-5 pt-4 space-y-4">
          
          <!-- Info section -->
          <div class="bg-white rounded-[24px] px-5 py-5 border border-[#F3F4F6] shadow-sm">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Venue Information</p>

            <!-- Address -->
            <div class="flex items-start gap-3 mb-4 pb-4 border-b border-[#F3F4F6]">
              <div class="w-9 h-9 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                <ion-icon name="location-outline" class="text-[#6B7280] text-base"></ion-icon>
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider m-0 leading-none">Address</p>
                <p class="text-[13px] font-bold text-[#111827] leading-snug mt-1.5 m-0">{{ venue.address }}</p>
              </div>
            </div>

            <!-- Grid details -->
            <div class="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-[#F3F4F6]">
              <div *ngFor="let detail of [
                { icon: 'time-outline', label: 'Opens', val: venue.openTime },
                { icon: 'time-outline', label: 'Closes', val: venue.closeTime },
                { icon: 'calendar-outline', label: 'Year Built', val: venue.yearBuilt },
                { icon: 'resize-outline', label: 'Court Area', val: venue.area },
                { icon: 'layers-outline', label: 'Surface', val: venue.surface },
                { icon: 'people-outline', label: 'Max Players', val: venue.maxPlayers + ' players' }
              ]" class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  <ion-icon [name]="detail.icon" class="text-[#6B7280] text-sm"></ion-icon>
                </div>
                <div>
                  <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider m-0 leading-none">{{ detail.label }}</p>
                  <p class="text-[12px] font-bold text-[#111827] m-0 mt-1 leading-none">{{ detail.val }}</p>
                </div>
              </div>
            </div>

            <!-- Amenities -->
            <div>
              <p class="text-[11px] font-bold text-[#9CA3AF] uppercase tracking-wider mb-3 m-0">Amenities</p>
              <div class="flex flex-wrap gap-2">
                <div *ngFor="let a of venue.amenities" class="flex items-center gap-1.5 px-3.5 py-2 bg-[#F3F4F6] rounded-full leading-none">
                  <ion-icon [name]="a.icon" class="text-[#6B7280] text-xs"></ion-icon>
                  <span class="text-[11px] font-bold text-[#6B7280]">{{ a.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Rental Equipment -->
          <div class="bg-white rounded-[24px] px-5 py-5 border border-[#F3F4F6] shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0 leading-none">Rental Equipment</p>
              <span *ngIf="rentalTotal > 0" class="text-[13px] font-black text-[#8CF000]">₹{{ rentalTotal }} added</span>
            </div>

            <div class="space-y-3">
              <div *ngFor="let item of venue.rentalEquipment" class="flex items-center gap-3 py-3 border-b border-[#F9FAFB] last:border-0">
                <div class="w-10 h-10 rounded-2xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  {{ item.emoji }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-black text-[#111827] m-0">{{ item.name }}</p>
                  <p class="text-[12px] text-[#9CA3AF] m-0 mt-0.5">₹{{ item.price }} / session</p>
                </div>
                <div class="flex items-center gap-3 flex-shrink-0">
                  <button
                    (click)="dec(item.id)"
                    class="w-8 h-8 rounded-full flex items-center justify-center border border-[#E5E7EB] transition-all outline-none"
                    [style.backgroundColor]="(quantities[item.id] || 0) > 0 ? '#F3F4F6' : '#FAFBFC'"
                  >
                    <ion-icon name="remove-outline" class="text-[#6B7280] text-sm"></ion-icon>
                  </button>
                  <span class="w-5 text-center text-[15px] font-black text-[#111827]">{{ quantities[item.id] || 0 }}</span>
                  <button
                    (click)="inc(item.id)"
                    class="w-8 h-8 rounded-full flex items-center justify-center outline-none border-none"
                    style="background: linear-gradient(135deg,#8CF000,#A3E635); box-shadow: 0 2px 8px rgba(140,240,0,0.35);"
                  >
                    <ion-icon name="add-outline" class="text-[#111827] text-sm font-black"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Reviews -->
          <div class="bg-white rounded-[24px] px-5 py-5 border border-[#F3F4F6] shadow-sm">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0 leading-none">Player Reviews</p>
              <div class="flex items-center gap-1 leading-none">
                <ion-icon name="star" class="text-[#F59E0B] text-xs"></ion-icon>
                <span class="text-[14px] font-black text-[#111827]">{{ avgRating }}</span>
                <span class="text-[11px] text-[#9CA3AF] font-bold">· {{ venue.reviewCount }}</span>
              </div>
            </div>

            <div class="space-y-4">
              <div *ngFor="let r of venue.reviews" class="bg-[#FAFBFC] rounded-2xl p-4">
                <div class="flex items-center gap-3 mb-2.5">
                  <img [src]="r.photo" [alt]="r.name" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div class="flex-1">
                    <p class="text-[13px] font-black text-[#111827] m-0">{{ r.name }}</p>
                    <div class="flex items-center gap-2 mt-0.5 leading-none">
                      <div class="flex gap-0.5">
                        <ion-icon
                          *ngFor="let star of [1,2,3,4,5]"
                          name="star"
                          [style.color]="star <= r.rating ? '#F59E0B' : '#E5E7EB'"
                          class="text-[9px]"
                        ></ion-icon>
                      </div>
                      <span class="text-[10px] text-[#9CA3AF] font-bold">{{ r.date }}</span>
                    </div>
                  </div>
                </div>
                <p class="text-[13px] text-[#6B7280] leading-relaxed m-0">"{{ r.text }}"</p>
              </div>
            </div>
          </div>

          <!-- Special Offers -->
          <div>
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 px-1 m-0">Special Offers</p>
            <div class="space-y-3">
              <div
                *ngFor="let offer of venue.offers"
                class="flex items-center gap-4 bg-white rounded-[20px] px-4 py-4 relative overflow-hidden border"
                [style.borderColor]="offer.accent + '30'"
                style="box-shadow: 0 1px 10px rgba(0,0,0,0.07);"
              >
                <div class="absolute left-0 top-0 bottom-0 w-1 rounded-l-[20px]" [style.backgroundColor]="offer.accent"></div>
                <div
                  class="w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0"
                  [style.backgroundColor]="offer.accent + '18'"
                >
                  <ion-icon name="award-outline" [style.color]="offer.accent" class="text-xl"></ion-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-black text-[#111827] m-0">{{ offer.title }}</p>
                  <p class="text-[11px] text-[#9CA3AF] font-bold m-0 mt-0.5">{{ offer.desc }}</p>
                </div>
                <span
                  class="text-[9px] font-bold px-2 py-1 rounded-full flex-shrink-0"
                  [style.backgroundColor]="offer.accent + '15'"
                  [style.color]="offer.accent"
                >
                  {{ offer.expires }}
                </span>
              </div>
            </div>
          </div>

          <!-- Map -->
          <div class="bg-white rounded-[24px] px-5 py-5 border border-[#F3F4F6] shadow-sm">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-2 m-0">Location</p>
            <p class="text-[12px] text-[#9CA3AF] mb-3 m-0 font-bold">{{ venue.address }}</p>
            <div class="rounded-[18px] overflow-hidden mb-3 h-[180px] border border-[#E5E7EB]">
              <iframe
                [src]="mapUrl"
                class="w-full h-full border-0"
                loading="lazy"
                title="Venue map"
              ></iframe>
            </div>
            <button
              (click)="openDirections(venue.address)"
              class="w-full h-11 rounded-2xl flex items-center justify-center gap-2 text-[14px] font-black text-[#111827] border-none outline-none"
              style="background: linear-gradient(135deg,#8CF000 0%,#A3E635 100%); box-shadow: 0 3px 12px rgba(140,240,0,0.35);"
            >
              <ion-icon name="navigate-outline" class="text-base"></ion-icon>
              <span>Get Directions</span>
            </button>
          </div>

        </div>

        <!-- Sticky CTA -->
        <div
          class="fixed bottom-0 left-0 right-0 z-30 bg-white max-w-md mx-auto px-5 py-4 pb-8 border-t border-[#F3F4F6]"
          style="box-shadow: 0 -4px 24px rgba(0,0,0,0.09);"
        >
          <div class="flex items-center gap-4 mb-2">
            <div class="text-left">
              <p class="text-[11px] text-[#9CA3AF] m-0 font-bold">Starting from</p>
              <p class="text-[20px] font-black text-[#111827] m-0 leading-none mt-1">
                ₹{{ venue.pricePerHour.toLocaleString() }}
                <span class="text-[12px] font-bold text-[#9CA3AF]">/hr</span>
              </p>
            </div>
            <button
              (click)="continueBooking()"
              class="flex-1 h-14 rounded-2xl text-[16px] font-black text-white flex items-center justify-center gap-2 border-none outline-none active:scale-98 transition-all"
              style="background: linear-gradient(135deg,#FF7A00 0%,#FF9A40 100%); box-shadow: 0 4px 20px rgba(255,122,0,0.42);"
            >
              <span>Continue to Booking</span>
              <ion-icon name="chevron-forward-outline" class="text-base font-black"></ion-icon>
            </button>
          </div>
          <p class="text-center text-[10px] text-[#9CA3AF] m-0 font-semibold">
            Free cancellation up to 24 hours before your slot
          </p>
        </div>

      </div>
    </ion-content>
  `,
  styles: [
    `
      ion-icon {
        --ionicon-stroke-width: 48px;
      }
      .no-scrollbar {
        scrollbar-width: none;
      }
      .no-scrollbar::-webkit-scrollbar {
        display: none;
      }
    `
  ]
})
export class VenueDetailPage implements OnInit {
  readonly Math = Math;
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);

  venueId: number | null = null;
  venue: VenueDetail | null = null;
  currentImageIndex = 0;
  favourited = false;
  quantities: Record<string, number> = {};
  mapUrl: SafeResourceUrl | null = null;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.venueId = +idStr;
        this.venue = VENUE_DATA.find(v => v.id === this.venueId) || VENUE_DATA[0];
        if (this.venue) {
          this.mapUrl = this.sanitizer.bypassSecurityTrustResourceUrl(
            `https://maps.google.com/maps?q=${encodeURIComponent(this.venue.address)}&output=embed&z=15`
          );
        }
      }
    });
  }

  get rentalTotal(): number {
    if (!this.venue) return 0;
    return this.venue.rentalEquipment.reduce(
      (sum, item) => sum + (this.quantities[item.id] || 0) * item.price, 0
    );
  }

  get avgRating(): string {
    if (!this.venue || this.venue.reviews.length === 0) return '0.0';
    const sum = this.venue.reviews.reduce((s, r) => s + r.rating, 0);
    return (sum / this.venue.reviews.length).toFixed(1);
  }

  inc(itemId: string) {
    this.quantities[itemId] = (this.quantities[itemId] || 0) + 1;
  }

  dec(itemId: string) {
    this.quantities[itemId] = Math.max(0, (this.quantities[itemId] || 0) - 1);
  }

  back() {
    this.router.navigateByUrl('/app/venues');
  }

  openDirections(address: string) {
    window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}`);
  }

  continueBooking() {
    if (!this.venue) return;
    this.router.navigate([`/app/venue/${this.venue.id}/book`], {
      state: {
        venue: this.venue,
        rentalItems: this.quantities
      }
    });
  }
}
