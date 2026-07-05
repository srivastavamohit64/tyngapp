import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';

interface VenueType {
  id: string;
  label: string;
  emoji: string;
  image: string;
}

interface SportOption {
  id: string;
  label: string;
  emoji: string;
  image: string;
}

const VENUE_TYPES: VenueType[] = [
  { id: 'multi', label: 'Multi-Sports Complex', emoji: '🏟️', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop&auto=format' },
  { id: 'football', label: 'Football Turf', emoji: '⚽', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=400&fit=crop&auto=format' },
  { id: 'cricket', label: 'Cricket Academy', emoji: '🏏', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=400&fit=crop&auto=format' },
  { id: 'badminton', label: 'Badminton Arena', emoji: '🏸', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=400&fit=crop&auto=format' },
  { id: 'tennis', label: 'Tennis Club', emoji: '🎾', image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=300&h=400&fit=crop&auto=format' },
  { id: 'basketball', label: 'Basketball Court', emoji: '🏀', image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=300&h=400&fit=crop&auto=format' },
  { id: 'volleyball', label: 'Volleyball Court', emoji: '🏐', image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=300&h=400&fit=crop&auto=format' },
];

const SPORTS_OPTIONS: SportOption[] = [
  { id: 'cricket', label: 'Cricket', emoji: '🏏', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=400&fit=crop&auto=format' },
  { id: 'football', label: 'Football', emoji: '⚽', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=400&fit=crop&auto=format' },
  { id: 'badminton', label: 'Badminton', emoji: '🏸', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=400&fit=crop&auto=format' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾', image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=300&h=400&fit=crop&auto=format' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=300&h=400&fit=crop&auto=format' },
  { id: 'volleyball', label: 'Volleyball', emoji: '🏐', image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=300&h=400&fit=crop&auto=format' },
];

@Component({
  selector: 'app-venue-complete-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="complete-profile-page pb-36 text-left">
        <!-- Sticky Header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button (click)="handleBack()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[15px] font-black text-[#111827] m-0">Create Venue Profile</p>
              <p class="text-[11px] text-[#9CA3AF] m-0 font-bold">Step {{ step() }} of 4</p>
            </div>
            <button (click)="handleNext()" [disabled]="!canProceed() || step() === 1" class="w-10 h-10 flex items-center justify-center rounded-xl border-none transition-all"
              [style.backgroundColor]="canProceed() && step() > 1 ? '#8CF000' : '#F3F4F6'">
              <ion-icon name="chevron-forward-outline" [style.color]="canProceed() && step() > 1 ? '#111827' : '#C4C9D4'" class="text-xl"></ion-icon>
            </button>
          </div>

          <!-- Progress dots track -->
          <div class="flex justify-center items-center gap-1.5 pb-4 pt-2">
            <div *ngFor="let idx of [0, 1, 2, 3]" class="flex items-center">
              <div class="h-[7px] rounded-full transition-all duration-300"
                [style.width]="step() === (idx + 1) ? '20px' : '7px'"
                [style.backgroundColor]="step() > (idx + 1) ? '#FF7A00' : step() === (idx + 1) ? '#8CF000' : '#E5E7EB'">
              </div>
              <div *ngIf="idx < 3" class="w-3.5 h-[1.5px] mx-0.5"
                [style.backgroundColor]="step() > (idx + 1) ? '#FF7A00' : '#E5E7EB'">
              </div>
            </div>
          </div>
        </div>

        <!-- Step content -->
        <div class="step-content">
          <!-- STEP 1: WELCOME SCREEN -->
          <div *ngIf="step() === 1" class="flex flex-col">
            <div class="relative h-[40vh] min-h-[260px] overflow-hidden bg-gray-900">
              <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&auto=format" class="w-full h-full object-cover opacity-85" />
              <div class="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-[#FAFBFC]"></div>
              <div class="absolute top-5 left-5 bg-black/40 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 border border-white/5">
                <div class="w-2 h-2 rounded-full bg-[#8CF000]"></div>
                <span class="text-white text-[11px] font-bold">TYNG Venues</span>
              </div>
              <div class="absolute bottom-10 right-5 bg-[#8CF000] text-[#111827] text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg">
                🏟️ List your venue for free
              </div>
            </div>

            <div class="px-6 pt-6 text-left">
              <h1 class="text-[30px] font-black text-[#111827] tracking-tight leading-tight mb-3 m-0">
                Welcome to<br />TYNG Venues 🏟️
              </h1>
              <p class="text-[15px] text-[#9CA3AF] leading-relaxed mb-8 m-0 font-medium">
                List your sports facility, receive bookings, partner with coaches, and grow your business with TYNG.
              </p>

              <div class="flex flex-wrap gap-2 mb-8">
                <div *ngFor="let f of ['Receive instant bookings', 'Partner with coaches', 'Manage courts & slots']" class="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-full shadow-sm border border-slate-50">
                  <ion-icon name="checkmark-outline" class="text-[#8CF000] text-sm font-bold"></ion-icon>
                  <span class="text-[12px] font-bold text-[#6B7280]">{{ f }}</span>
                </div>
              </div>

              <button (click)="step.set(2)" class="w-full h-14 rounded-[24px] text-[16px] font-black text-[#111827] btn-green-gradient border-none">
                Let's Get Started →
              </button>
            </div>
          </div>

          <!-- STEP 2: CHOOSE VENUE TYPE -->
          <div *ngIf="step() === 2" class="px-5 pt-5">
            <h2 class="text-[22px] font-black text-[#111827] mb-1 m-0">What type of venue do you own?</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5 m-0 font-medium">Choose the category that best describes your sports facility.</p>

            <div class="grid grid-cols-3 gap-3">
              <button *ngFor="let vt of venueTypes" (click)="selectedType.set(vt.id)" class="relative rounded-[20px] overflow-hidden focus:outline-none p-0 border-none"
                [style.aspectRatio]="'3/4'"
                [style.border]="selectedType() === vt.id ? '2.5px solid #8CF000' : '2.5px solid transparent'"
                [style.boxShadow]="selectedType() === vt.id ? '0 0 0 3px rgba(140,240,0,0.20)' : 'none'">
                <img [src]="vt.image" class="absolute inset-0 w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent"></div>
                <div *ngIf="selectedType() === vt.id" class="absolute inset-0 bg-[rgba(140,240,0,0.15)]"></div>
                <div *ngIf="selectedType() === vt.id" class="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center">
                  <ion-icon name="checkmark-outline" class="text-[#111827] text-xs font-black"></ion-icon>
                </div>
                <p class="absolute bottom-2 left-2 right-2 text-white font-black text-[10px] leading-tight m-0 text-left">{{ vt.label }}</p>
              </button>
            </div>

            <button (click)="handleNext()" [disabled]="!selectedType()" class="mt-8 w-full h-13 rounded-[24px] text-[15px] font-black border-none transition-all"
              [style.background]="selectedType() ? 'linear-gradient(135deg,#8CF000,#A3E635)' : '#F3F4F6'"
              [style.color]="selectedType() ? '#111827' : '#C4C9D4'"
              [style.boxShadow]="selectedType() ? '0 4px 16px rgba(140,240,0,0.38)' : 'none'">
              Continue
            </button>
          </div>

          <!-- STEP 3: DETAILS FORM -->
          <div *ngIf="step() === 3" class="px-5 pt-5 pb-8 space-y-4">
            <h2 class="text-[22px] font-black text-[#111827] mb-1 m-0">Tell us about your venue</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5 m-0 font-medium">Basic details — you can add more later.</p>

            <div class="space-y-4">
              <!-- Name -->
              <div>
                <p class="text-[11px] font-black text-[#9CA3AF] uppercase tracking-wider mb-1.5 m-0">Venue Name <span class="text-red-500">*</span></p>
                <div class="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-2xl border-2 border-[#F3F4F6] focus-within:border-[#8CF000] focus-within:bg-white transition-all">
                  <ion-icon name="business-outline" class="text-[#9CA3AF] text-lg"></ion-icon>
                  <input [(ngModel)]="venueName" placeholder="Enter venue name" class="flex-grow bg-transparent text-[15px] text-[#111827] focus:outline-none min-h-0 border-none outline-none" />
                </div>
              </div>

              <!-- Owner -->
              <div>
                <p class="text-[11px] font-black text-[#9CA3AF] uppercase tracking-wider mb-1.5 m-0">Owner / Manager Name <span class="text-red-500">*</span></p>
                <div class="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-2xl border-2 border-[#F3F4F6] focus-within:border-[#8CF000] focus-within:bg-white transition-all">
                  <ion-icon name="person-outline" class="text-[#9CA3AF] text-lg"></ion-icon>
                  <input [(ngModel)]="ownerName" placeholder="Enter your name" class="flex-grow bg-transparent text-[15px] text-[#111827] focus:outline-none min-h-0 border-none outline-none" />
                </div>
              </div>

              <!-- Mobile -->
              <div>
                <p class="text-[11px] font-black text-[#9CA3AF] uppercase tracking-wider mb-1.5 m-0">Mobile Number <span class="text-red-500">*</span></p>
                <div class="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-2xl border-2 border-[#F3F4F6] focus-within:border-[#8CF000] focus-within:bg-white transition-all">
                  <ion-icon name="call-outline" class="text-[#9CA3AF] text-lg"></ion-icon>
                  <input [(ngModel)]="mobile" placeholder="Enter mobile number" type="tel" class="flex-grow bg-transparent text-[15px] text-[#111827] focus:outline-none min-h-0 border-none outline-none" />
                </div>
              </div>

              <!-- City -->
              <div>
                <p class="text-[11px] font-black text-[#9CA3AF] uppercase tracking-wider mb-1.5 m-0">City <span class="text-red-500">*</span></p>
                <div class="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-2xl border-2 border-[#F3F4F6] focus-within:border-[#8CF000] focus-within:bg-white transition-all">
                  <ion-icon name="location-outline" class="text-[#9CA3AF] text-lg"></ion-icon>
                  <input [(ngModel)]="city" placeholder="Enter city" class="flex-grow bg-transparent text-[15px] text-[#111827] focus:outline-none min-h-0 border-none outline-none" />
                </div>
              </div>

              <!-- Address -->
              <div>
                <p class="text-[11px] font-black text-[#9CA3AF] uppercase tracking-wider mb-1.5 m-0">Venue Address <span class="text-red-500">*</span></p>
                <div class="flex items-center gap-3 px-4 py-3 bg-[#F9FAFB] rounded-2xl border-2 border-[#F3F4F6] focus-within:border-[#8CF000] focus-within:bg-white transition-all">
                  <ion-icon name="map-outline" class="text-[#9CA3AF] text-lg"></ion-icon>
                  <input [(ngModel)]="address" placeholder="Enter full address with landmark" class="flex-grow bg-transparent text-[15px] text-[#111827] focus:outline-none min-h-0 border-none" />
                </div>
              </div>
            </div>

            <!-- Map frame view -->
            <div *ngIf="address.length > 8" class="mt-4 rounded-[18px] overflow-hidden border border-[#F3F4F6]" style="height: 150px;">
              <iframe [src]="getSafeMapUrl()" class="w-full h-full border-none" loading="lazy"></iframe>
            </div>

            <button (click)="handleNext()" [disabled]="!canProceed()" class="w-full h-13 rounded-[24px] text-[15px] font-black border-none transition-all"
              [style.background]="canProceed() ? 'linear-gradient(135deg,#8CF000,#A3E635)' : '#F3F4F6'"
              [style.color]="canProceed() ? '#111827' : '#C4C9D4'"
              [style.boxShadow]="canProceed() ? '0 4px 16px rgba(140,240,0,0.38)' : 'none'">
              Continue
            </button>
          </div>

          <!-- STEP 4: SPORTS OFFERED -->
          <div *ngIf="step() === 4" class="px-5 pt-5 pb-8">
            <h2 class="text-[22px] font-black text-[#111827] mb-1 m-0">Which sports can be played here?</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5 m-0 font-medium">Select all sports available at your venue <span *ngIf="selectedSports().length > 0" class="text-[#8CF000] font-black">· {{ selectedSports().length }} selected</span></p>

            <div class="grid grid-cols-3 gap-3 mb-8">
              <button *ngFor="let s of sportsOptions" (click)="toggleSport(s.id)" class="relative rounded-[20px] overflow-hidden focus:outline-none p-0 border-none"
                [style.aspectRatio]="'3/4'"
                [style.border]="isSportSelected(s.id) ? '2.5px solid #8CF000' : '2.5px solid transparent'"
                [style.boxShadow]="isSportSelected(s.id) ? '0 0 0 3px rgba(140,240,0,0.22)' : 'none'">
                <img [src]="s.image" class="absolute inset-0 w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/85 to-transparent"></div>
                <div *ngIf="isSportSelected(s.id)" class="absolute inset-0 bg-[rgba(140,240,0,0.15)]"></div>
                <div *ngIf="isSportSelected(s.id)" class="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center">
                  <ion-icon name="checkmark-outline" class="text-[#111827] text-xs font-black"></ion-icon>
                </div>
                <p class="absolute bottom-2 left-2 right-2 text-white font-black text-[10px] leading-tight m-0 text-left">{{ s.label }}</p>
              </button>
            </div>

            <button (click)="handleNext()" [disabled]="selectedSports().length === 0" class="w-full h-14 rounded-[24px] text-[16px] font-black border-none text-white transition-all btn-orange-gradient">
              Start Managing My Venue →
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .complete-profile-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000 0%, #A3E635 100%);
      box-shadow: 0 4px 20px rgba(140,240,0,0.40);
    }

    .btn-orange-gradient {
      background: linear-gradient(135deg, #FF7A00, #FF9A40);
      box-shadow: 0 4px 20px rgba(255,122,0,0.42);
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }
  `]
})
export class VenueCompleteProfilePage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  step = signal(1);

  // States
  selectedType = signal('');
  venueName = '';
  businessName = '';
  ownerName = '';
  mobile = '';
  email = '';
  city = '';
  address = '';

  selectedSports = signal<string[]>([]);

  readonly venueTypes = VENUE_TYPES;
  readonly sportsOptions = SPORTS_OPTIONS;

  canProceed = computed(() => {
    const s = this.step();
    if (s === 1) return true;
    if (s === 2) return this.selectedType() !== '';
    if (s === 3) return this.venueName.trim() !== '' && this.ownerName.trim() !== '' && this.mobile.trim().length >= 8 && this.city.trim() !== '' && this.address.trim() !== '';
    if (s === 4) return this.selectedSports().length > 0;
    return false;
  });

  toggleSport(id: string) {
    this.selectedSports.update(list => list.includes(id) ? list.filter(x => x !== id) : [...list, id]);
  }

  isSportSelected(id: string): boolean {
    return this.selectedSports().includes(id);
  }

  handleNext() {
    if (this.step() < 4) {
      this.step.update(s => s + 1);
    } else {
      // Done onboarding
      this.auth.completeOnboarding({ name: this.ownerName || 'Venue Owner' });
      this.router.navigateByUrl('/app/home');
    }
  }

  handleBack() {
    if (this.step() === 1) {
      this.router.navigateByUrl('/app/home');
    } else {
      this.step.update(s => s - 1);
    }
  }

  getSafeMapUrl(): SafeResourceUrl {
    const raw = `https://maps.google.com/maps?q=${encodeURIComponent(this.address + ', ' + this.city)}&output=embed&z=14`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(raw);
  }
}
