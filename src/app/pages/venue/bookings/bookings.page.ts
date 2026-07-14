import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';

interface BookingItem {
  id: number;
  date: string;
  time: string;
  customer: string;
  court: string;
  status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  amount: string;
  deposit: string;
}

@Component({
  selector: 'app-venue-bookings-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell>
      <div class="bookings-page pb-36 text-left">
        
        <!-- Header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <div class="flex items-center gap-3">
              <button (click)="goHome()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
                <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
              </button>
              <p class="text-[17px] font-black text-[#111827] m-0">Bookings</p>
            </div>
            <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="funnel-outline" class="text-lg text-[#111827]"></ion-icon>
            </button>
          </div>

          <!-- Search input box -->
          <div class="px-5 pb-3 pt-2 relative">
            <ion-icon name="search-outline" class="absolute left-9 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></ion-icon>
            <input type="text" [(ngModel)]="searchQuery" placeholder="Search bookings..." class="search-input" />
          </div>

          <!-- Filters Segment chips row -->
          <div class="flex gap-2 px-5 pb-3 overflow-x-auto no-scrollbar">
            <button *ngFor="let filter of filters" (click)="selectedFilter.set(filter)" class="px-4 py-2 rounded-xl text-xs font-black border-none whitespace-nowrap uppercase tracking-wider transition-all"
              [style.backgroundColor]="selectedFilter() === filter ? '#8CF000' : '#F3F4F6'"
              [style.color]="selectedFilter() === filter ? '#111827' : '#9CA3AF'">
              {{ filter }}
            </button>
          </div>
        </div>

        <!-- Bookings list -->
        <div class="px-5 pt-4 space-y-4">
          <div *ngFor="let booking of filteredBookings()" class="bg-white p-5 rounded-[24px] border border-[#F3F4F6] shadow-sm text-left">
            <div class="flex items-start justify-between mb-3.5">
              <div class="flex-grow">
                <div class="flex items-center gap-2 mb-2">
                  <ion-icon name="calendar-outline" class="text-slate-400 text-xs"></ion-icon>
                  <span class="text-[11px] text-[#9CA3AF] font-bold">{{ booking.date }}</span>
                  <ion-icon name="time-outline" class="text-slate-400 text-xs ml-1.5"></ion-icon>
                  <span class="text-[11px] text-[#9CA3AF] font-bold">{{ booking.time }}</span>
                </div>
                <p class="text-[15px] font-black text-[#111827] m-0">{{ booking.customer }}</p>
                <p class="text-xs text-[#9CA3AF] m-0 mt-0.5 font-bold">{{ booking.court }}</p>
              </div>
              <div class="text-right flex-shrink-0">
                <p class="text-[15px] font-black text-[#111827] m-0 mb-2">{{ booking.amount }}</p>
                
                <span class="rounded-full px-2.5 py-1 text-[10px] font-black inline-flex items-center gap-1 uppercase tracking-wider"
                  [style.backgroundColor]="getStatusStyle(booking.status).bg"
                  [style.color]="getStatusStyle(booking.status).color">
                  <ion-icon [name]="booking.status === 'confirmed' ? 'checkmark-circle-outline' : 'time-outline'" class="text-[11px]"></ion-icon>
                  {{ booking.status }}
                </span>
              </div>
            </div>

            <!-- Deposit card info -->
            <div class="bg-[#F9FAFB] p-3 rounded-xl mb-4 border border-[#F3F4F6]">
              <p class="text-[10px] font-bold text-[#9CA3AF] uppercase tracking-wider m-0 mb-0.5">Deposit Received</p>
              <p class="text-[13px] font-black text-[#111827] m-0">{{ booking.deposit }}</p>
            </div>

            <!-- Accept/Decline button rows for pending bookings -->
            <div *ngIf="booking.status === 'pending'" class="flex gap-2">
              <button (click)="acceptBooking(booking.id)" class="flex-1 h-10 rounded-xl font-black text-xs btn-green-gradient border-none">
                Accept
              </button>
              <button (click)="declineBooking(booking.id)" class="px-4 h-10 rounded-xl font-bold text-xs bg-[#F3F4F6] text-[#6B7280] border-none">
                Decline
              </button>
            </div>
          </div>

          <!-- Empty state list placeholder -->
          <div *ngIf="filteredBookings().length === 0" class="text-center py-16 text-slate-400">
            <ion-icon name="calendar-clear-outline" class="text-5xl mb-3 text-slate-300"></ion-icon>
            <p class="text-sm font-semibold m-0">No bookings found matching filter</p>
          </div>
        </div>

      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .bookings-page {
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

    .search-input {
      width: 100%;
      height: 44px;
      padding: 0 16px 0 38px;
      border-radius: 14px;
      border: 2px solid #F3F4F6;
      background: #F9FAFB;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      outline: none;
      box-sizing: border-box;

      &:focus {
        border-color: #8CF000;
        background: white;
      }
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000, #A3E635);
      box-shadow: 0 4px 12px rgba(140,240,0,0.30);
      color: #111827;
    }
  `]
})
export class VenueBookingsPage {
  private readonly router = inject(Router);

  searchQuery = '';
  selectedFilter = signal('all');

  readonly filters = ['all', 'confirmed', 'pending', 'completed', 'cancelled'];

  bookings = signal<BookingItem[]>([
    {
      id: 1,
      date: 'Today',
      time: '4:00 PM - 6:00 PM',
      customer: 'Rahul Sharma',
      court: 'Court 2',
      status: 'confirmed',
      amount: '₹2,000',
      deposit: '₹500',
    },
    {
      id: 2,
      date: 'Today',
      time: '7:00 PM - 9:00 PM',
      customer: 'Junior Cricket Team',
      court: 'Main Ground',
      status: 'pending',
      amount: '₹3,500',
      deposit: '₹1,000',
    },
    {
      id: 3,
      date: 'Tomorrow',
      time: '6:00 AM - 8:00 AM',
      customer: 'Elite Football Squad',
      court: 'Main Ground',
      status: 'confirmed',
      amount: '₹3,000',
      deposit: '₹1,000',
    },
    {
      id: 4,
      date: 'Tomorrow',
      time: '6:00 PM - 7:00 PM',
      customer: 'Priya Singh',
      court: 'Court 1',
      status: 'pending',
      amount: '₹1,500',
      deposit: '₹400',
    },
  ]);

  filteredBookings = computed(() => {
    return this.bookings().filter(b => {
      const matchesSearch = b.customer.toLowerCase().includes(this.searchQuery.toLowerCase()) || b.court.toLowerCase().includes(this.searchQuery.toLowerCase());
      const matchesFilter = this.selectedFilter() === 'all' || b.status === this.selectedFilter();
      return matchesSearch && matchesFilter;
    });
  });

  acceptBooking(id: number) {
    this.bookings.update(list => list.map(b => b.id === id ? { ...b, status: 'confirmed' } : b));
  }

  declineBooking(id: number) {
    this.bookings.update(list => list.map(b => b.id === id ? { ...b, status: 'cancelled' } : b));
  }

  getStatusStyle(status: string) {
    if (status === 'confirmed' || status === 'completed') return { bg: '#F0FDF4', color: '#16A34A' };
    if (status === 'pending') return { bg: '#FFF7ED', color: '#C2410C' };
    return { bg: '#FEF2F2', color: '#DC2626' }; // Cancelled
  }

  goHome() {
    this.router.navigateByUrl('/app/venue/dashboard');
  }
}
