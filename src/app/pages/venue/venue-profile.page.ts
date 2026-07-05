import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface StatItem {
  label: string;
  value: string;
  icon: string;
}

interface HourItem {
  day: string;
  hours: string;
}

interface ReviewItem {
  customer: string;
  rating: number;
  comment: string;
  date: string;
}

@Component({
  selector: 'app-venue-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="venue-profile-page pb-32 text-left">
        
        <!-- Header -->
        <div class="sticky-header flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
          <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
          <p class="text-[17px] font-black text-[#111827] m-0">Venue Profile</p>
          <button (click)="completeProfile()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="settings-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
        </div>

        <div class="profile-hero bg-gradient-to-b from-[#8CF000]/10 to-transparent px-6 pt-6 pb-8 flex flex-col items-center text-center">
          <div class="w-24 h-24 rounded-full bg-gradient-to-br from-[#8CF000] to-[#A3E635] flex items-center justify-center text-5xl mb-4 shadow-sm border border-white">
            {{ venue.avatar }}
          </div>
          <h1 class="text-[24px] font-black text-[#111827] m-0 leading-none">{{ venue.name }}</h1>
          <div class="flex items-center gap-1.5 text-[#9CA3AF] text-sm mt-2 mb-3 font-semibold">
            <ion-icon name="location-outline" class="text-[#8CF000]"></ion-icon>
            <span>{{ venue.location }}</span>
          </div>
          <div class="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-50 shadow-sm">
            <ion-icon name="star" class="text-[#F59E0B] text-base"></ion-icon>
            <span class="text-[13px] font-bold text-[#111827]">{{ venue.rating }} <span class="text-[#9CA3AF]">({{ venue.reviews }} reviews)</span></span>
          </div>
        </div>

        <div class="px-5 space-y-6">
          <!-- Stats grid -->
          <div>
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Performance Stats</p>
            <div class="grid grid-cols-3 gap-3">
              <div *ngFor="let stat of stats" class="bg-white p-4 rounded-2xl border border-slate-50 text-center shadow-sm">
                <div class="w-8 h-8 rounded-xl bg-[#8CF000]/10 flex items-center justify-center mx-auto mb-2">
                  <ion-icon [name]="stat.icon" class="text-[#8CF000] text-base"></ion-icon>
                </div>
                <div class="text-[18px] font-black text-[#111827] mb-0.5 leading-none">{{ stat.value }}</div>
                <div class="text-[10px] text-[#9CA3AF] font-bold mt-1.5 uppercase leading-none">{{ stat.label }}</div>
              </div>
            </div>
          </div>

          <!-- Operating Hours -->
          <div>
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Operating Hours</p>
            <div class="bg-white rounded-2xl border border-[#F3F4F6] p-4 space-y-3 shadow-sm text-left">
              <div *ngFor="let schedule of operatingHours" class="flex items-center justify-between py-1 border-b border-[#F9FAFB] last:border-none">
                <span class="text-[#9CA3AF] font-semibold text-[13px]">{{ schedule.day }}</span>
                <span class="text-[#111827] font-bold text-[13px]">{{ schedule.hours }}</span>
              </div>
            </div>
          </div>

          <!-- Recent Reviews list -->
          <div>
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Recent Reviews</p>
            <div class="space-y-3">
              <div *ngFor="let review of recentReviews" class="bg-white p-4 rounded-2xl border border-[#F3F4F6] shadow-sm text-left">
                <div class="flex items-center justify-between mb-3 border-b border-slate-50 pb-2">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-gradient-to-br from-[#8CF000] to-[#A3E635] flex items-center justify-center text-sm shadow-sm">
                      👤
                    </div>
                    <span class="text-[14px] font-bold text-[#111827]">{{ review.customer }}</span>
                  </div>
                  <div class="flex items-center gap-1 font-bold text-[13px] text-[#111827]">
                    <ion-icon name="star" class="text-[#F59E0B]"></ion-icon>
                    <span>{{ review.rating }}</span>
                  </div>
                </div>
                <p class="text-[13px] text-[#6B7280] leading-relaxed mb-2 m-0 font-medium">"{{ review.comment }}"</p>
                <div class="text-[10px] text-[#9CA3AF] font-bold">{{ review.date }}</div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .venue-profile-page {
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
export class VenueProfilePage {
  private readonly router = inject(Router);

  readonly venue = {
    name: 'Phoenix Arena',
    avatar: '🏟️',
    location: 'Gomti Nagar, Lucknow',
    rating: 4.8,
    reviews: 342,
    established: '2018',
  };

  readonly stats: StatItem[] = [
    { label: 'Total Bookings', value: '2,450', icon: 'trending-up-outline' },
    { label: 'Active Courts', value: '3', icon: 'ribbon-outline' },
    { label: 'Monthly Rev', value: '₹2.45L', icon: 'cash-outline' },
  ];

  readonly operatingHours: HourItem[] = [
    { day: 'Monday - Friday', hours: '6:00 AM - 10:00 PM' },
    { day: 'Saturday - Sunday', hours: '5:00 AM - 11:00 PM' },
  ];

  readonly recentReviews: ReviewItem[] = [
    { customer: 'Rahul Sharma', rating: 5, comment: 'Excellent facilities and lighting!', date: '2 days ago' },
    { customer: 'Priya Singh', rating: 4, comment: 'Great court texture for tournament play', date: '5 days ago' },
  ];

  back() {
    this.router.navigateByUrl('/app/home');
  }

  completeProfile() {
    this.router.navigateByUrl('/app/venue-complete-profile');
  }
}
