import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface Venue {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  reviews: number;
  pricePerHour: number;
  sports: string[];
  sportEmojis: string[];
  image: string;
  slots: string[];
  amenities: string[];
  isCoachFriendly: boolean;
  isIndoor: boolean;
  capacity: number;
  isOpenNow: boolean;
}

const COACH_VENUES: Venue[] = [
  {
    id: 'cv1',
    name: 'Elite Sports Academy',
    address: 'Gomti Nagar Extension, Lucknow',
    distance: '2.1 km',
    rating: 4.9, reviews: 156,
    pricePerHour: 1500,
    sports: ['Cricket', 'Football', 'Badminton'],
    sportEmojis: ['🏏', '⚽', '🏸'],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&h=420&fit=crop&auto=format',
    slots: ['6 AM', '7 AM', '8 AM', '4 PM', '5 PM', '6 PM', '7 PM'],
    amenities: ['Parking', 'Floodlights', 'Washrooms', 'Equipment', 'Café', 'Changing Rooms', 'Water'],
    isCoachFriendly: true, isIndoor: false, capacity: 50,
    isOpenNow: true,
  },
  {
    id: 'cv2',
    name: 'Cricket Training Ground',
    address: 'Gomti Nagar Extension (Ekana), Lucknow',
    distance: '4.5 km',
    rating: 4.8, reviews: 128,
    pricePerHour: 2000,
    sports: ['Cricket'],
    sportEmojis: ['🏏'],
    image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=420&fit=crop&auto=format',
    slots: ['6 AM', '7 AM', '5 PM', '6 PM', '7 PM'],
    amenities: ['Parking', 'Floodlights', 'Washrooms', 'Equipment', 'Changing Rooms', 'Water'],
    isCoachFriendly: true, isIndoor: false, capacity: 30,
    isOpenNow: true,
  },
  {
    id: 'cv3',
    name: 'Phoenix Sports Hub',
    address: 'Aliganj, Lucknow',
    distance: '5.2 km',
    rating: 4.7, reviews: 94,
    pricePerHour: 1200,
    sports: ['Tennis', 'Badminton', 'Basketball'],
    sportEmojis: ['🎾', '🏸', '🏀'],
    image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=420&fit=crop&auto=format',
    slots: ['7 AM', '8 AM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM'],
    amenities: ['Parking', 'Floodlights', 'Washrooms', 'Equipment', 'AC Indoor', 'Water', 'Lockers'],
    isCoachFriendly: true, isIndoor: true, capacity: 20,
    isOpenNow: true,
  },
  {
    id: 'cv4',
    name: 'City Sports Complex',
    address: 'Hazratganj, Lucknow',
    distance: '3.8 km',
    rating: 4.5, reviews: 72,
    pricePerHour: 800,
    sports: ['Football', 'Basketball', 'Volleyball'],
    sportEmojis: ['⚽', '🏀', '🏐'],
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=420&fit=crop&auto=format',
    slots: ['6 AM', '7 AM', '8 AM', '5 PM', '6 PM', '7 PM'],
    amenities: ['Parking', 'Washrooms', 'Equipment', 'Water'],
    isCoachFriendly: false, isIndoor: false, capacity: 40,
    isOpenNow: false,
  },
];

const UPCOMING_BOOKINGS = [
  { id: 'ub1', venue: 'Elite Sports Academy', date: 'Today', time: '6:00 PM', students: 12, amount: 4500, status: 'Confirmed' },
  { id: 'ub2', venue: 'Cricket Training Ground', date: 'Thu 3 Jul', time: '7:00 AM', students: 8, amount: 6000, status: 'Upcoming' },
];

const FILTERS = [
  'All Sports', 'Nearby', 'Price: Low', 'Indoor', 'Outdoor',
  'Available Today', 'Floodlights', 'Parking', 'Equipment', 'AC Indoor',
];

@Component({
  selector: 'app-coach-book-venue',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="book-venue-page pb-32">
        <!-- Sticky Header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <p class="text-[17px] font-black text-[#111827] m-0">Book Venue</p>
            <div class="flex gap-1.5">
              <button (click)="searchOpen.set(!searchOpen())" class="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
                <ion-icon [name]="searchOpen() ? 'close-outline' : 'search-outline'" class="text-[#111827] text-lg"></ion-icon>
              </button>
              <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
                <ion-icon name="options-outline" class="text-[#111827] text-lg"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Search input box -->
          <div *ngIf="searchOpen()" class="px-5 pb-3">
            <div class="flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-4 h-11 border border-slate-100 shadow-sm">
              <ion-icon name="search-outline" class="text-[#9CA3AF] text-sm"></ion-icon>
              <input [(ngModel)]="searchQ" placeholder="Search venues, turfs or academies..." class="flex-1 bg-transparent text-[14px] text-[#111827] focus:outline-none min-h-0 border-none" />
            </div>
          </div>

          <!-- Filters Chips track -->
          <div class="flex gap-2 px-5 pb-4 pt-2 overflow-x-auto no-scrollbar">
            <button *ngFor="let f of filterOptions" (click)="selectedFilter.set(f)" class="flex-shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold border-none transition-all"
              [style.backgroundColor]="selectedFilter() === f ? '#8CF000' : '#F3F4F6'"
              [style.color]="selectedFilter() === f ? '#111827' : '#6B7280'">
              {{ f }}
            </button>
          </div>
        </div>

        <div class="px-5 pt-4 space-y-5">
          <!-- Results Count -->
          <div class="flex items-center justify-between px-1">
            <p class="text-[13px] font-bold text-[#6B7280] m-0">{{ filteredVenues().length }} venues in Lucknow</p>
            <button *ngIf="selectedFilter() !== 'All Sports'" (click)="selectedFilter.set('All Sports')" class="text-[12px] font-bold text-[#EF4444] bg-transparent border-none">Clear</button>
          </div>

          <!-- List of Venues -->
          <div *ngIf="filteredVenues().length === 0" class="py-16 text-center">
            <div class="text-5xl mb-3">🏟️</div>
            <p class="text-[16px] font-bold text-[#111827] mb-1 m-0">No venues found</p>
            <p class="text-[13px] text-[#9CA3AF] m-0 font-medium">Try adjusting your filters</p>
          </div>

          <div *ngFor="let v of filteredVenues()" class="section-card bg-white overflow-hidden shadow-sm border border-slate-100 text-left">
            <!-- image cover -->
            <div class="relative h-[160px] overflow-hidden bg-gray-200">
              <img [src]="v.image" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent"></div>

              <!-- Top badges -->
              <div class="absolute top-3 left-3 flex gap-1.5">
                <span *ngIf="v.isOpenNow" class="text-[10px] font-bold bg-[#8CF000] text-[#111827] px-2.5 py-1 rounded-full shadow-sm">Open Now</span>
                <span *ngIf="v.isCoachFriendly" class="text-[10px] font-bold bg-[#FF7A00] text-white px-2.5 py-1 rounded-full shadow-sm">Coach Friendly 🏋️</span>
              </div>

              <!-- Pricing pill -->
              <div class="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1.5 rounded-xl text-center border border-slate-100 shadow-sm">
                <p class="text-[13px] font-black text-[#111827] m-0 leading-none">₹{{ v.pricePerHour.toLocaleString() }}</p>
                <p class="text-[9px] text-[#9CA3AF] m-0 font-bold mt-0.5">per hour</p>
              </div>

              <!-- Title -->
              <div class="absolute bottom-3 left-3 right-3">
                <div class="flex items-center gap-1.5 mb-1">
                  <span *ngFor="let emoji of v.sportEmojis" class="text-lg leading-none">{{ emoji }}</span>
                </div>
                <p class="text-white font-black text-[15px] m-0 drop-shadow-md leading-none">{{ v.name }}</p>
              </div>
            </div>

            <!-- body details -->
            <div class="px-4 pt-3.5 pb-4">
              <div class="flex items-center gap-3 mb-2 flex-wrap">
                <div class="flex items-center gap-1 text-[11px] font-bold text-[#111827]">
                  <ion-icon name="star" class="text-[#F59E0B]"></ion-icon>
                  <span>{{ v.rating }}</span>
                  <span class="text-[#9CA3AF]">({{ v.reviews }})</span>
                </div>
                <div class="w-1 h-1 rounded-full bg-[#E5E7EB]"></div>
                <div class="flex items-center gap-1 text-[11px] text-[#9CA3AF] font-bold">
                  <ion-icon name="location-outline"></ion-icon>
                  <span>{{ v.address.split(',')[0] }}</span>
                </div>
                <div class="w-1 h-1 rounded-full bg-[#E5E7EB]"></div>
                <span class="text-[11px] text-[#9CA3AF] font-bold">{{ v.distance }}</span>
              </div>

              <!-- Amenities chips -->
              <div class="flex gap-1.5 overflow-x-auto no-scrollbar mb-3 pb-0.5">
                <div *ngFor="let a of v.amenities.slice(0, 5)" class="flex items-center gap-1 bg-[#F3F4F6] px-2.5 py-1 rounded-full flex-shrink-0">
                  <ion-icon [name]="getAmenityIcon(a)" class="text-[#6B7280] text-[10px]"></ion-icon>
                  <span class="text-[9px] text-[#6B7280] font-bold">{{ a }}</span>
                </div>
                <span *ngIf="v.amenities.length > 5" class="text-[10px] text-[#9CA3AF] font-bold align-middle self-center">+{{ v.amenities.length - 5 }}</span>
              </div>

              <!-- Available slots row -->
              <div class="flex items-center gap-2 mb-3 text-[11px] text-[#9CA3AF] font-bold">
                <ion-icon name="time-outline" class="text-sm"></ion-icon>
                <span>{{ v.slots.slice(0, 4).join(' · ') }}</span>
                <span *ngIf="v.slots.length > 4" class="text-[#8CF000] font-black">+{{ v.slots.length - 4 }}</span>
              </div>

              <div class="flex items-center gap-2 border-t border-slate-50 pt-3 mt-1">
                <div class="flex items-center gap-1 text-[11px] text-[#9CA3AF] font-bold">
                  <ion-icon name="people-outline" class="text-sm"></ion-icon>Up to {{ v.capacity }} students
                </div>
                <div class="flex-1"></div>
                <button (click)="bookVenue(v)" class="px-5 py-2.5 rounded-2xl text-[13px] font-black btn-green-gradient text-[#111827] border-none">
                  Book Venue
                </button>
              </div>
            </div>
          </div>

          <!-- Upcoming Reservations list -->
          <div class="pt-4 text-left">
            <p class="text-[14px] font-black text-[#111827] mb-3 m-0">Upcoming Venue Reservations</p>
            <div class="space-y-3">
              <div *ngFor="let b of upcomingBookings" class="bg-white rounded-[20px] p-4 shadow-sm border border-slate-100">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <p class="text-[14px] font-bold text-[#111827] m-0">{{ b.venue }}</p>
                    <p class="text-[12px] text-[#9CA3AF] m-0 mt-0.5">{{ b.date }} · {{ b.time }} · {{ b.students }} students</p>
                  </div>
                  <div class="text-right">
                    <p class="text-[14px] font-black text-[#111827] m-0">₹{{ b.amount.toLocaleString() }}</p>
                    <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      [style.backgroundColor]="b.status === 'Confirmed' ? '#F0FDF4' : '#EFF6FF'"
                      [style.color]="b.status === 'Confirmed' ? '#16A34A' : '#1D4ED8'">{{ b.status }}</span>
                  </div>
                </div>
                <div class="flex gap-2">
                  <button class="flex-grow py-2 rounded-xl bg-[#F9FAFB] text-[12px] font-bold text-[#6B7280] border border-[#F3F4F6]">View Details</button>
                  <button class="flex-grow py-2 rounded-xl bg-[#FEF2F2] text-[12px] font-bold text-[#DC2626] border border-[#FCA5A5]">Cancel</button>
                  <button (click)="go('/app/chat')" class="flex-grow py-2 rounded-xl text-[12px] font-bold text-[#111827] bg-[#8CF000]/12 border border-[#8CF000]/30 border-2">Chat</button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .book-venue-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .section-card {
      border-radius: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000, #A3E635);
      box-shadow: 0 4px 16px rgba(140,240,0,0.30);
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }
  `]
})
export class CoachBookVenuePage {
  private readonly router = inject(Router);

  searchOpen = signal(false);
  searchQ = '';
  selectedFilter = signal('All Sports');

  readonly filterOptions = FILTERS;
  readonly upcomingBookings = UPCOMING_BOOKINGS;

  filteredVenues = computed(() => {
    const q = this.searchQ.toLowerCase().trim();
    const filter = this.selectedFilter();

    let result = COACH_VENUES;

    if (q) {
      result = result.filter(v => v.name.toLowerCase().includes(q) || v.address.toLowerCase().includes(q));
    }

    if (filter === 'Indoor') result = result.filter(v => v.isIndoor);
    else if (filter === 'Outdoor') result = result.filter(v => !v.isIndoor);
    else if (filter === 'Available Today') result = result.filter(v => v.isOpenNow);
    else if (filter === 'Nearby') result = [...result].sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    else if (filter === 'Price: Low') result = [...result].sort((a, b) => a.pricePerHour - b.pricePerHour);
    else if (filter === 'Floodlights') result = result.filter(v => v.amenities.includes('Floodlights'));
    else if (filter === 'Parking') result = result.filter(v => v.amenities.includes('Parking'));
    else if (filter === 'Equipment') result = result.filter(v => v.amenities.includes('Equipment'));
    else if (filter === 'AC Indoor') result = result.filter(v => v.amenities.includes('AC Indoor'));

    return result;
  });

  back() {
    this.router.navigateByUrl('/app/home');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  bookVenue(v: Venue) {
    this.router.navigate(['/app/coach/venue-booking'], { state: { venue: v } });
  }

  getAmenityIcon(a: string): string {
    const icons: Record<string, string> = {
      Parking: 'car-outline',
      Floodlights: 'flash-outline',
      Washrooms: 'water-outline',
      Café: 'cafe-outline',
      Equipment: 'cube-outline',
      'Changing Rooms': 'shirt-outline',
      Water: 'water-outline',
      'AC Indoor': 'snow-outline',
      Lockers: 'lock-closed-outline'
    };
    return icons[a] || 'cube-outline';
  }
}
