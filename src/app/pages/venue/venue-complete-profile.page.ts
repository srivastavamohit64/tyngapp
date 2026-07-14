import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SafeResourceUrl, DomSanitizer } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LocationFieldComponent } from '../../shared/components/location-field/location-field.component';

interface MaintFacility {
  id: string;
  name: string;
  sport: string;
  emoji: string;
  indoor: boolean;
  court: string;
  status: string;
  photo: string;
}

const OWNERSHIP_TYPES = ['Private', 'Academy', 'Corporate', 'Government', 'School', 'Society', 'Other'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATES = ['Uttar Pradesh', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Other'];

const VENUE_AMENITIES = [
  'Parking', 'Reception', 'Waiting Lounge', 'Washrooms', 'Accessible Washrooms',
  'Changing Rooms', 'Showers', 'Lockers', 'First Aid Room', 'Medical Assistance',
  'Water Dispenser', 'Cafeteria', 'Pro Shop', 'Wi-Fi', 'EV Charging',
  'Power Backup', 'Wheelchair Access', 'Spectator Seating', 'CCTV', 'Security',
  "Children's Play Area",
];

const EQUIPMENT_LIST = [
  { id: 'football', label: 'Footballs', emoji: '⚽' },
  { id: 'basketball', label: 'Basketballs', emoji: '🏀' },
  { id: 'cricket', label: 'Cricket Kit', emoji: '🏏' },
  { id: 'helmet', label: 'Helmets', emoji: '⛑️' },
  { id: 'bat', label: 'Bats', emoji: '🏏' },
  { id: 'stumps', label: 'Stumps', emoji: '🏏' },
  { id: 'racquets', label: 'Racquets', emoji: '🎾' },
  { id: 'shuttle', label: 'Shuttle Tubes', emoji: '🏸' },
  { id: 'cones', label: 'Training Cones', emoji: '🔺' },
  { id: 'fitness', label: 'Fitness Equipment', emoji: '💪' },
  { id: 'boards', label: 'Swimming Boards', emoji: '🏊' },
  { id: 'jackets', label: 'Life Jackets', emoji: '🦺' },
];

const VERIFICATION_DOCS = [
  { id: 'biz', label: 'Business Registration', required: true },
  { id: 'gst', label: 'GST Certificate', required: true },
  { id: 'pan', label: 'PAN Card', required: true },
  { id: 'cheque', label: 'Cancelled Cheque', required: true },
  { id: 'bank', label: 'Bank Details', required: true },
  { id: 'id', label: 'Owner Government ID', required: true },
  { id: 'licence', label: 'Venue Licence', required: false },
  { id: 'insurance', label: 'Insurance', required: false },
];

const MOCK_FACILITIES: MaintFacility[] = [
  { id: 'f1', name: 'Football Turf A', sport: 'Football', emoji: '⚽', indoor: false, court: '1', status: 'Open', photo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=200&fit=crop&auto=format' },
  { id: 'f2', name: 'Basketball Court', sport: 'Basketball', emoji: '🏀', indoor: true, court: '1', status: 'Open', photo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop&auto=format' },
  { id: 'f3', name: 'Badminton Court 1', sport: 'Badminton', emoji: '🏸', indoor: true, court: '1', status: 'Open', photo: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=200&fit=crop&auto=format' },
  { id: 'f4', name: 'Cricket Nets', sport: 'Cricket', emoji: '🏏', indoor: false, court: '1', status: 'Maintenance', photo: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=200&fit=crop&auto=format' },
];

const TOTAL_STEPS = 10;

@Component({
  selector: 'app-venue-complete-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, LocationFieldComponent],
  template: `
    <ion-content [fullscreen]="true">
      <!-- SUCCESS SCREEN -->
      <div *ngIf="isSuccess()" class="success-screen flex flex-col items-center justify-center px-6 text-center pb-12">
        <div class="w-28 h-28 rounded-full bg-[#8CF000] flex items-center justify-center mx-auto mb-5 shadow-lg"
          style="box-shadow: 0 8px 36px rgba(140,240,0,0.45);">
          <ion-icon name="checkmark-outline" class="text-5xl text-[#111827] font-black"></ion-icon>
        </div>
        <h1 class="text-[28px] font-black text-[#111827] mb-2 m-0 leading-none">Your Venue is Live! 🎉</h1>
        <p class="text-[14px] text-[#9CA3AF] mb-6 font-bold">Phoenix Arena is now active on TYNG.</p>

        <div class="w-full max-w-sm bg-white rounded-[24px] p-5 mb-6 text-left border border-[#F3F4F6] shadow-sm">
          <div *ngFor="let item of ['Venue Published', 'Search Listing Active', 'Online Booking Enabled', 'Payments Activated', 'QR Entry Enabled', 'Analytics Started']"
            class="flex items-center gap-3 py-2.5 border-b border-[#F9FAFB] last:border-0">
            <div class="w-5 h-5 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
              <ion-icon name="checkmark-outline" class="text-xs text-[#111827] font-black"></ion-icon>
            </div>
            <span class="text-[13px] font-black text-[#111827]">{{ item }}</span>
          </div>
        </div>

        <div class="w-full max-w-sm space-y-3">
          <button (click)="finish()" class="w-full h-14 rounded-[24px] text-[16px] font-black text-white border-none shadow-md btn-orange-gradient">
            Go to Dashboard
          </button>
          <div class="grid grid-cols-2 gap-3">
            <button class="h-11 rounded-2xl bg-white text-[13px] font-bold text-[#6B7280] border border-[#E5E7EB]">
              Preview Venue
            </button>
            <button class="h-11 rounded-2xl bg-white text-[13px] font-bold text-[#6B7280] border border-[#E5E7EB] flex items-center justify-center gap-1">
              <ion-icon name="share-social-outline" class="text-sm"></ion-icon>Share
            </button>
          </div>
        </div>
      </div>

      <!-- MAIN 10 STEP FLOW -->
      <div *ngIf="!isSuccess()" class="complete-profile-page pb-32 text-left">
        <!-- Sticky Header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button (click)="handleBack()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[14px] font-black text-[#111827] m-0 leading-none">Complete Venue Profile</p>
              <p class="text-[11px] text-[#9CA3AF] m-0 font-bold mt-1">Step {{ step() }} of {{ totalSteps }}</p>
            </div>
            <button (click)="exit()" class="px-3 py-2 rounded-xl bg-[#F3F4F6] text-[11px] font-black text-[#6B7280] border-none">
              Save & Exit
            </button>
          </div>

          <!-- Progress dots indicator -->
          <div class="flex items-center justify-center gap-0.5 pb-4 pt-2">
            <div *ngFor="let s of stepNumbers" class="flex items-center">
              <div class="h-1.5 rounded-full transition-all duration-200"
                [style.width]="step() === s ? '16px' : '6px'"
                [style.backgroundColor]="step() > s ? '#FF7A00' : step() === s ? '#8CF000' : '#E5E7EB'">
              </div>
              <div *ngIf="s < totalSteps" class="w-1 h-px mx-0.5"
                [style.backgroundColor]="step() > s ? '#FF7A00' : '#E5E7EB'">
              </div>
            </div>
          </div>
        </div>

        <div class="px-5 pt-5">
          <!-- STEP 1: BUSINESS INFORMATION -->
          <div *ngIf="step() === 1" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Business Information</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Legal and contact details for your venue</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Business Registration Name *</p>
                <input [(ngModel)]="bizName" placeholder="Legal company name" class="form-input" />
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Venue Display Name *</p>
                <input [(ngModel)]="venueName" placeholder="Name shown to players" class="form-input" />
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Owner / Manager Name *</p>
                <input [(ngModel)]="ownerName" placeholder="Full name" class="form-input" />
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Mobile Number *</p>
                <input [(ngModel)]="mobile" placeholder="+91 XXXXX XXXXX" type="tel" class="form-input" />
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Email Address *</p>
                <input [(ngModel)]="email" placeholder="contact@venue.in" type="email" class="form-input" />
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Website</p>
                <input [(ngModel)]="website" placeholder="Optional" class="form-input" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">GST Number</p>
                  <input [(ngModel)]="gstNo" placeholder="Optional" class="form-input" />
                </div>
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">PAN</p>
                  <input [(ngModel)]="panNo" placeholder="Optional" class="form-input" />
                </div>
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Year Established</p>
                <input [(ngModel)]="yearEst" placeholder="e.g. 2018" type="number" class="form-input" />
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Ownership Type *</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <button *ngFor="let opt of ownershipTypes" (click)="ownership.set(opt)"
                    class="px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border-none"
                    [style.backgroundColor]="ownership() === opt ? 'rgba(140,240,0,0.14)' : '#F3F4F6'"
                    [style.color]="ownership() === opt ? '#111827' : '#6B7280'"
                    [style.border]="ownership() === opt ? '1.5px solid #8CF000' : '1.5px solid transparent'">
                    {{ opt }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2: VENUE INFORMATION -->
          <div *ngIf="step() === 2" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Venue Information</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Location and operating hours</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div class="complete-profile-address-field-wrap">
                <app-location-field label="Full Address *" placeholder="Street address" [(ngModel)]="address"></app-location-field>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">City *</p>
                  <input [(ngModel)]="city" placeholder="Lucknow" class="form-input" />
                </div>
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Pincode *</p>
                  <input [(ngModel)]="pincode" placeholder="226024" type="number" class="form-input" />
                </div>
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">State *</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <button *ngFor="let state of states" (click)="stateVal.set(state)"
                    class="px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border-none"
                    [style.backgroundColor]="stateVal() === state ? 'rgba(140,240,0,0.14)' : '#F3F4F6'"
                    [style.color]="stateVal() === state ? '#111827' : '#6B7280'"
                    [style.border]="stateVal() === state ? '1.5px solid #8CF000' : '1.5px solid transparent'">
                    {{ state }}
                  </button>
                </div>
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Landmark</p>
                <input [(ngModel)]="landmark" placeholder="Near landmark" class="form-input" />
              </div>
              <div>
                <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Operating Days</p>
                <div class="flex flex-wrap gap-2 mt-2">
                  <button *ngFor="let day of days" (click)="toggleDay(day)"
                    class="px-3 py-1.5 rounded-full text-[12px] font-bold transition-all border-none"
                    [style.backgroundColor]="isDaySelected(day) ? 'rgba(140,240,0,0.14)' : '#F3F4F6'"
                    [style.color]="isDaySelected(day) ? '#111827' : '#6B7280'"
                    [style.border]="isDaySelected(day) ? '1.5px solid #8CF000' : '1.5px solid transparent'">
                    {{ day }}
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Opening Time</p>
                  <input type="time" [(ngModel)]="openTime" class="form-input" />
                </div>
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Closing Time</p>
                  <input type="time" [(ngModel)]="closeTime" class="form-input" />
                </div>
              </div>
              <!-- Maps iframe preview -->
              <div *ngIf="address.length > 5" class="rounded-[18px] overflow-hidden" style="height: 150px;">
                <iframe [src]="getSafeMapUrl()" class="w-full h-full border-0" loading="lazy"></iframe>
              </div>
            </div>
          </div>

          <!-- STEP 3: FACILITIES -->
          <div *ngIf="step() === 3" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Facilities</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Manage every playable area at your venue</p>
            </div>
            <div class="space-y-3">
              <div *ngFor="let f of facilities(); let idx = index" class="bg-white rounded-[22px] overflow-hidden border border-[#F3F4F6] shadow-sm text-left">
                <div class="relative h-[100px] bg-slate-200">
                  <img [src]="f.photo" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <span class="absolute top-2.5 right-2.5 text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                    [style.backgroundColor]="f.status === 'Open' ? '#F0FDF4' : '#FEF2F2'"
                    [style.color]="f.status === 'Open' ? '#16A34A' : '#DC2626'">
                    {{ f.status }}
                  </span>
                  <div class="absolute bottom-2.5 left-3">
                    <span class="text-lg">{{ f.emoji }}</span>
                    <p class="text-white font-black text-[14px] m-0 mt-0.5">{{ f.name }}</p>
                    <p class="text-white/60 text-[10px] m-0 mt-0.5 font-bold">{{ f.sport }} · {{ f.indoor ? 'Indoor' : 'Outdoor' }} · Court {{ f.court }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 4: PRICING -->
          <div *ngIf="step() === 4" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Hourly Pricing</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Configure booking prices for Football Turf A</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Standard Price (₹) *</p>
                  <input type="number" [(ngModel)]="hourlyPrice" class="form-input" />
                </div>
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Peak Hours Price (₹) *</p>
                  <input type="number" [(ngModel)]="peakPrice" class="form-input" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Weekend Price (₹) *</p>
                  <input type="number" [(ngModel)]="weekendPrice" class="form-input" />
                </div>
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Cancellation Fee (₹) *</p>
                  <input type="number" [(ngModel)]="cancelFee" class="form-input" />
                </div>
              </div>
              <div class="border-t border-[#F3F4F6] pt-4 mt-2">
                <p class="text-[12px] font-black text-[#111827] uppercase tracking-wider mb-3 m-0">Partner Discounts (%)</p>
                <div class="grid grid-cols-3 gap-2">
                  <div>
                    <p class="text-[9px] text-[#9CA3AF] uppercase tracking-wider font-bold mb-1.5 m-0">Coaches</p>
                    <input type="number" [(ngModel)]="coachDisc" class="form-input" />
                  </div>
                  <div>
                    <p class="text-[9px] text-[#9CA3AF] uppercase tracking-wider font-bold mb-1.5 m-0">Academies</p>
                    <input type="number" [(ngModel)]="academyDisc" class="form-input" />
                  </div>
                  <div>
                    <p class="text-[9px] text-[#9CA3AF] uppercase tracking-wider font-bold mb-1.5 m-0">Corporate</p>
                    <input type="number" [(ngModel)]="corpDisc" class="form-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 5: AMENITIES -->
          <div *ngIf="step() === 5" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Amenities</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Select amenities available at your venue</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 border border-[#F3F4F6] shadow-sm">
              <div class="flex flex-wrap gap-2">
                <button *ngFor="let am of venueAmenities" (click)="toggleAmenity(am)"
                  class="px-3 py-2 rounded-full text-[12px] font-bold transition-all border-none"
                  [style.backgroundColor]="isAmenitySelected(am) ? 'rgba(140,240,0,0.14)' : '#F3F4F6'"
                  [style.color]="isAmenitySelected(am) ? '#111827' : '#6B7280'"
                  [style.border]="isAmenitySelected(am) ? '1.5px solid #8CF000' : '1.5px solid transparent'">
                  <ion-icon *ngIf="isAmenitySelected(am)" name="checkmark-outline" class="mr-1 inline align-middle text-[10px] font-black"></ion-icon>
                  {{ am }}
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 6: EQUIPMENT -->
          <div *ngIf="step() === 6" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Sports Equipment</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Manage rentals and quantities</p>
            </div>
            <div class="space-y-3">
              <div *ngFor="let eq of equipmentList" class="bg-white p-4 rounded-[22px] border border-[#F3F4F6] shadow-sm flex items-center justify-between text-left">
                <div class="flex items-center gap-3">
                  <span class="text-2xl">{{ eq.emoji }}</span>
                  <div>
                    <p class="text-[14px] font-black text-[#111827] m-0">{{ eq.label }}</p>
                    <p class="text-[10px] text-[#9CA3AF] m-0 font-bold mt-0.5">Rental: ₹{{ getEquipPrice(eq.id) }}/hr</p>
                  </div>
                </div>
                <!-- Counter & Price edit -->
                <div class="flex items-center gap-3">
                  <div class="flex items-center gap-2 bg-[#F3F4F6] rounded-xl px-2 py-1">
                    <button (click)="decrementEquip(eq.id)" class="w-6 h-6 rounded-full bg-white flex items-center justify-center border-none text-sm font-black">-</button>
                    <span class="text-xs font-black w-4 text-center">{{ getEquipQty(eq.id) }}</span>
                    <button (click)="incrementEquip(eq.id)" class="w-6 h-6 rounded-full bg-white flex items-center justify-center border-none text-sm font-black">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 7: GALLERY -->
          <div *ngIf="step() === 7" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Venue Photos</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Add photos to attract players and coaches</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div class="aspect-video rounded-2xl overflow-hidden relative bg-slate-200">
                <img src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=200&fit=crop&auto=format" class="w-full h-full object-cover" />
                <button class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center border-none text-xs">×</button>
              </div>
              <div (click)="uploadPhoto()" class="aspect-video rounded-2xl border-2 border-dashed border-[#E5E7EB] flex flex-col items-center justify-center bg-[#F9FAFB] cursor-pointer">
                <ion-icon name="camera-outline" class="text-2xl text-[#C4C9D4]"></ion-icon>
                <span class="text-[10px] text-[#9CA3AF] font-bold mt-1 uppercase tracking-wider">Add Photo</span>
              </div>
            </div>
          </div>

          <!-- STEP 8: SUPERVISORS -->
          <div *ngIf="step() === 8" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Ground Supervisors</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Assign staff to coordinate with users</p>
            </div>
            <div class="space-y-3">
              <div *ngFor="let s of supervisors" class="bg-white p-4 rounded-[22px] border border-[#F3F4F6] shadow-sm flex items-center justify-between text-left">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full bg-[#8CF000]/10 flex items-center justify-center text-lg">👤</div>
                  <div>
                    <p class="text-[14px] font-black text-[#111827] m-0">{{ s.name }}</p>
                    <p class="text-[10px] text-[#9CA3AF] m-0 font-bold mt-0.5">{{ s.role }} · {{ s.phone }}</p>
                  </div>
                </div>
                <div class="w-2.5 h-2.5 rounded-full bg-[#8CF000]"></div>
              </div>
              <button class="w-full h-12 rounded-[20px] text-xs font-black bg-[#F3F4F6] text-[#6B7280] border-none flex items-center justify-center gap-1">
                <ion-icon name="add-outline" class="text-sm font-black"></ion-icon>Add Supervisor
              </button>
            </div>
          </div>

          <!-- STEP 9: VERIFICATION -->
          <div *ngIf="step() === 9" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Documents & Verification</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Upload business documents for approval</p>
            </div>
            <div class="space-y-3">
              <div *ngFor="let doc of verDocs" (click)="toggleDoc(doc.id)"
                class="w-full flex items-center gap-3 px-4 py-4 rounded-[20px] transition-all text-left border cursor-pointer"
                [style.backgroundColor]="isDocUploaded(doc.id) ? 'rgba(140,240,0,0.08)' : '#F9FAFB'"
                [style.borderColor]="isDocUploaded(doc.id) ? '#8CF000' : '#E5E7EB'"
                [style.borderStyle]="isDocUploaded(doc.id) ? 'solid' : 'dashed'">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  [style.backgroundColor]="isDocUploaded(doc.id) ? '#8CF000' : '#F3F4F6'">
                  <ion-icon [name]="isDocUploaded(doc.id) ? 'checkmark-outline' : 'document-text-outline'"
                    [style.color]="isDocUploaded(doc.id) ? '#111827' : '#C4C9D4'" class="text-base font-bold"></ion-icon>
                </div>
                <div class="flex-grow">
                  <p class="text-[13px] font-black text-[#111827] m-0">
                    {{ doc.label }}<span *ngIf="doc.required" class="text-[#EF4444] ml-0.5">*</span>
                  </p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5">{{ isDocUploaded(doc.id) ? '✓ Uploaded successfully' : 'Tap to upload PDF/Image' }}</p>
                </div>
                <ion-icon name="cloud-upload-outline" class="text-[#C4C9D4] flex-shrink-0 text-base"></ion-icon>
              </div>
            </div>
          </div>

          <!-- STEP 10: AUTOMATION -->
          <div *ngIf="step() === 10" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Booking & Settings</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Automation and listing configuration</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm text-left">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-[14px] font-black text-[#111827] m-0">Auto-Confirm Bookings</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5">Instantly approve bookings with deposit</p>
                </div>
                <button (click)="autoConfirm.set(!autoConfirm())" class="w-12 h-6 rounded-full relative flex-shrink-0 border-none transition-colors duration-200"
                  [style.backgroundColor]="autoConfirm() ? '#8CF000' : '#E5E7EB'">
                  <div class="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
                    [style.left.px]="autoConfirm() ? 24 : 3"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- STICKY ACTION BUTTON BAR -->
      <div *ngIf="!isSuccess()" class="fixed bottom-0 left-0 right-0 z-30 bg-white px-5 pt-3 pb-8"
        style="box-shadow: 0 -4px 24px rgba(0,0,0,0.09); border-top: 1px solid #F3F4F6;">
        <div class="flex gap-3 max-w-md mx-auto">
          <button (click)="handleNext()" [disabled]="!canProceed()"
            class="w-full h-13 rounded-[24px] text-[15px] font-black border-none text-[#111827] transition-all"
            [style.background]="canProceed() ? 'linear-gradient(135deg,#8CF000,#A3E635)' : '#F3F4F6'"
            [style.color]="canProceed() ? '#111827' : '#C4C9D4'"
            [style.boxShadow]="canProceed() ? '0 4px 16px rgba(140,240,0,0.38)' : 'none'">
            {{ step() === totalSteps ? 'Save & Go Live' : 'Continue →' }}
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .complete-profile-page, .success-screen {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .form-input {
      width: 100%;
      padding: 12px 16px;
      background: #F9FAFB;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      border: 1.5px solid #F3F4F6;
      outline: none;
      box-shadow: none;
      min-height: unset;
      &:focus {
        border-color: #8CF000;
        background: white;
      }
      &::placeholder {
        color: #C4C9D4;
        font-weight: 400;
      }
    }

    .btn-orange-gradient {
      background: linear-gradient(135deg, #FF7A00, #FF9A40);
      box-shadow: 0 4px 20px rgba(255,122,0,0.42);
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `]
})
export class VenueCompleteProfilePage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly totalSteps = TOTAL_STEPS;
  readonly stepNumbers = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);

  readonly ownershipTypes = OWNERSHIP_TYPES;
  readonly days = DAYS;
  readonly states = STATES;
  readonly venueAmenities = VENUE_AMENITIES;
  readonly equipmentList = EQUIPMENT_LIST;
  readonly verDocs = VERIFICATION_DOCS;

  step = signal(1);
  isSuccess = signal(false);

  // States
  bizName = 'Phoenix Arena Pvt Ltd';
  venueName = 'Phoenix Arena';
  ownerName = 'Suresh Kumar';
  mobile = '+91 98765 43210';
  email = 'suresh@phoenixarena.in';
  website = '';
  gstNo = '';
  panNo = '';
  yearEst = '2018';
  ownership = signal('Private');

  address = 'Aliganj Sports Complex, Sector 14';
  city = 'Lucknow';
  pincode = '226024';
  stateVal = signal('Uttar Pradesh');
  landmark = 'Near Aliganj Metro Station';
  opDays = signal<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  openTime = '06:00';
  closeTime = '22:00';

  facilities = signal<MaintFacility[]>(MOCK_FACILITIES);

  // Pricing
  hourlyPrice = '1200';
  peakPrice = '1500';
  weekendPrice = '1800';
  cancelFee = '500';
  coachDisc = '10';
  academyDisc = '15';
  corpDisc = '20';

  selectedAmenities = signal<string[]>(['Parking', 'Washrooms', 'Changing Rooms', 'Water Dispenser', 'CCTV', 'Cafeteria']);

  equipQty = signal<Record<string, number>>({ football: 5, basketball: 4 });
  equipPrices = signal<Record<string, string>>({ football: '200', basketball: '150' });

  uploadedPhotos = signal<string[]>([]);
  supervisors = [
    { id: 's1', name: 'Ravi Kumar', role: 'Ground Supervisor', phone: '+91 98765 43210', checkin: true },
  ];

  uploadedDocs = signal<Record<string, boolean>>({});

  autoConfirm = signal(true);

  canProceed = computed(() => {
    const s = this.step();
    if (s === 1) return this.bizName.trim() !== '' && this.ownerName.trim() !== '' && this.mobile.trim().length >= 8;
    if (s === 2) return this.address.trim() !== '' && this.city.trim() !== '' && this.pincode.trim().length >= 6;
    if (s === 4) return this.hourlyPrice !== '' && this.peakPrice !== '' && this.weekendPrice !== '';
    return true;
  });

  toggleDay(day: string) {
    this.opDays.update(list => list.includes(day) ? list.filter(x => x !== day) : [...list, day]);
  }

  isDaySelected(day: string): boolean {
    return this.opDays().includes(day);
  }

  toggleAmenity(am: string) {
    this.selectedAmenities.update(list => list.includes(am) ? list.filter(x => x !== am) : [...list, am]);
  }

  isAmenitySelected(am: string): boolean {
    return this.selectedAmenities().includes(am);
  }

  getEquipQty(id: string): number {
    return this.equipQty()[id] ?? 0;
  }

  getEquipPrice(id: string): string {
    return this.equipPrices()[id] ?? '0';
  }

  incrementEquip(id: string) {
    this.equipQty.update(q => ({ ...q, [id]: (q[id] ?? 0) + 1 }));
  }

  decrementEquip(id: string) {
    this.equipQty.update(q => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) - 1) }));
  }

  uploadPhoto() {
    this.uploadedPhotos.update(p => [...p, 'new_photo']);
  }

  toggleDoc(id: string) {
    this.uploadedDocs.update(docs => ({ ...docs, [id]: !docs[id] }));
  }

  isDocUploaded(id: string): boolean {
    return !!this.uploadedDocs()[id];
  }

  handleNext() {
    if (this.step() < this.totalSteps) {
      this.step.update(s => s + 1);
      return;
    }
    this.isSuccess.set(true);
  }

  handleBack() {
    if (this.step() === 1) {
      void this.router.navigateByUrl('/app/venue/dashboard');
    } else {
      this.step.update(s => s - 1);
    }
  }

  getSafeMapUrl(): SafeResourceUrl {
    const raw = `https://maps.google.com/maps?q=${encodeURIComponent(this.address + ', ' + this.city)}&output=embed&z=14`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(raw);
  }

  exit() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }

  finish() {
    void firstValueFrom(this.auth.completeOnboarding({
      name: this.venueName || this.ownerName || 'Venue Owner',
      sports: ['football', 'basketball', 'badminton'],
      venueType: 'multi',
    })).finally(() => this.router.navigateByUrl('/app/venue/dashboard'));
  }
}
