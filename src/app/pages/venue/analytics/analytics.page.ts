import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

interface RevenueStat {
  label: string;
  value: string;
  change: string;
  icon: string;
  accent: string;
}

interface TopCustomer {
  name: string;
  bookings: number;
  revenue: string;
}

interface PeakHour {
  time: string;
  bookings: number;
  percentage: number;
}

@Component({
  selector: 'app-venue-analytics-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="analytics-page pb-32 text-left">
        
        <!-- Header -->
        <div class="sticky-header flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
          <button (click)="goHome()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
          <p class="text-[17px] font-black text-[#111827] m-0">Revenue Analytics</p>
          <div class="w-10"></div>
        </div>

        <div class="px-5 pt-4 space-y-6">
          
          <!-- Revenue stats list -->
          <div>
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Revenue Overview</p>
            <div class="space-y-3">
              <div *ngFor="let stat of stats" class="bg-white p-4 rounded-2xl border border-slate-50 flex items-center justify-between shadow-sm">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-xl flex items-center justify-center"
                    [style.backgroundColor]="stat.accent + '15'">
                    <ion-icon [name]="stat.icon" [style.color]="stat.accent" class="text-xl font-bold"></ion-icon>
                  </div>
                  <div>
                    <p class="text-[#9CA3AF] text-[12px] font-bold uppercase m-0 leading-none mb-1.5">{{ stat.label }}</p>
                    <p class="text-[#111827] text-[22px] font-black m-0 leading-none">{{ stat.value }}</p>
                  </div>
                </div>
                <div class="bg-[#F0FDF4] text-[#16A34A] text-xs font-black px-2.5 py-1 rounded-full">
                  {{ stat.change }}
                </div>
              </div>
            </div>
          </div>

          <!-- Top Customers list -->
          <div>
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Top Customers</p>
            <div class="bg-white rounded-2xl border border-[#F3F4F6] overflow-hidden shadow-sm">
              <div *ngFor="let customer of topCustomers; let idx = index" class="p-4 flex items-center justify-between border-b border-[#F9FAFB] last:border-none">
                <div class="flex items-center gap-3">
                  <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#8CF000] to-[#A3E635] flex items-center justify-center text-[#111827] text-xs font-black shadow-sm">
                    {{ idx + 1 }}
                  </div>
                  <div>
                    <p class="text-[14px] font-bold text-[#111827] m-0">{{ customer.name }}</p>
                    <p class="text-[11px] text-[#9CA3AF] font-bold m-0 mt-0.5">{{ customer.bookings }} bookings</p>
                  </div>
                </div>
                <p class="text-[14px] font-black text-[#8CF000] m-0">{{ customer.revenue }}</p>
              </div>
            </div>
          </div>

          <!-- Peak Hours load bars -->
          <div>
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Peak Hours</p>
            <div class="space-y-3">
              <div *ngFor="let hour of peakHours" class="bg-white p-4 rounded-2xl border border-[#F3F4F6] shadow-sm text-left">
                <div class="flex items-center justify-between mb-2">
                  <span class="text-[13px] font-bold text-[#111827]">{{ hour.time }}</span>
                  <span class="text-[11px] text-[#9CA3AF] font-bold">{{ hour.bookings }} bookings</span>
                </div>
                <div class="h-2 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div class="h-full rounded-full"
                    [style.width.%]="hour.percentage"
                    style="background: linear-gradient(90deg, #8CF000, #A3E635);"></div>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .analytics-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }
  `]
})
export class VenueAnalyticsPage {
  private readonly router = inject(Router);

  readonly stats: RevenueStat[] = [
    { label: 'Today', value: '₹12,500', change: '+12%', icon: 'cash-outline', accent: '#8CF000' },
    { label: 'This Week', value: '₹68,000', change: '+8%', icon: 'calendar-outline', accent: '#FF7A00' },
    { label: 'This Month', value: '₹2,45,000', change: '+15%', icon: 'trending-up-outline', accent: '#38BDF8' },
  ];

  readonly topCustomers: TopCustomer[] = [
    { name: 'Elite Football Squad', bookings: 24, revenue: '₹48,000' },
    { name: 'Junior Cricket Team', bookings: 18, revenue: '₹36,000' },
    { name: 'Basketball Academy', bookings: 15, revenue: '₹30,000' },
  ];

  readonly peakHours: PeakHour[] = [
    { time: '6:00 PM - 8:00 PM', bookings: 45, percentage: 85 },
    { time: '4:00 PM - 6:00 PM', bookings: 38, percentage: 70 },
    { time: '6:00 AM - 8:00 AM', bookings: 32, percentage: 60 },
  ];

  goHome() {
    this.router.navigateByUrl('/app/home');
  }
}
