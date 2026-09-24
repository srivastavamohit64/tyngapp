import { CommonModule } from '@angular/common';
import { Component, signal, inject, ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, AlertController, IonicModule, ViewWillEnter } from '@ionic/angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MediaPermissionService } from '../../core/services/media-permission.service';
import { NativeMediaPickerService } from '../../core/services/native-media-picker.service';
import { VenueService, SportsEquipmentItem } from '../../core/services/venue.service';
import { normalizeImageFile } from '../../core/utils/image-file.util';
import { LocationFieldComponent } from '../../shared/components/location-field/location-field.component';
import { ReverseGeocodeDetails } from '../../core/services/location.service';
import { SkeletonListComponent } from '../../shared/components/skeleton';
import { sportEmoji } from '../../core/utils/booking.utils';

interface MaintFacility {
  id: string;
  name: string;
  sport: string;
  emoji: string;
  indoor: boolean;
  court: string;
  status: string;
  photo: string;
  hourlyPrice: string;
  peakPrice: string;
  weekendPrice: string;
  cancelFee: string;
  meta?: Record<string, unknown>;
}

const OWNERSHIP_TYPES = ['Private', 'Academy', 'Corporate', 'Government', 'School', 'Society', 'Other'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATES = ['Uttar Pradesh', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Other'];

const VERIFICATION_DOCS = [
  { id: 'gst', label: 'GST Certificate', required: true },
  { id: 'aadhaar', label: 'Aadhaar Card', required: true },
  { id: 'biz', label: 'Business Registration', required: false },
  { id: 'pan', label: 'PAN Card', required: false },
  { id: 'cheque', label: 'Cancelled Cheque', required: false },
  { id: 'bank', label: 'Bank Details', required: false },
  { id: 'id', label: 'Owner Government ID', required: false },
  { id: 'licence', label: 'Venue Licence', required: false },
  { id: 'insurance', label: 'Insurance', required: false },
];

const FACILITY_SPORTS = [
  { id: 'football', label: 'Football', emoji: '⚽', photo: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=200&fit=crop&auto=format' },
  { id: 'cricket', label: 'Cricket', emoji: '🏏', photo: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=200&fit=crop&auto=format' },
  { id: 'badminton', label: 'Badminton', emoji: '🏸', photo: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=200&fit=crop&auto=format' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', photo: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop&auto=format' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾', photo: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=300&h=200&fit=crop&auto=format' },
  { id: 'volleyball', label: 'Volleyball', emoji: '🏐', photo: 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=300&h=200&fit=crop&auto=format' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊', photo: 'https://images.unsplash.com/photo-1519315901367-f34ff9154487?w=300&h=200&fit=crop&auto=format' },
];

const TOTAL_STEPS = 8;

const STEP_TITLES = [
  'Business details',
  'Location',
  'Hours',
  'Facilities',
  'Pricing & booking',
  'Equipment',
  'Photos',
  'Documents',
];

@Component({
  selector: 'app-venue-complete-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, LocationFieldComponent, SkeletonListComponent],
  template: `
    <ion-content [fullscreen]="true">
      <!-- SUCCESS SCREEN -->
      <div *ngIf="isSuccess()" class="success-screen flex flex-col items-center justify-center px-6 text-center pb-12">
        <div class="w-28 h-28 rounded-full bg-[var(--app-primary)] flex items-center justify-center mx-auto mb-5 shadow-lg"
          style="box-shadow: 0 8px 36px rgba(var(--app-primary-rgb),0.45);">
          <ion-icon [name]="submittedForApproval() ? 'time-outline' : 'checkmark-outline'" class="text-5xl text-[#111827] font-black"></ion-icon>
        </div>
        <h1 class="text-[28px] font-black text-[#111827] mb-2 m-0 leading-none">
          {{ submittedForApproval() ? 'Submitted for Approval' : 'Your Venue is Live! 🎉' }}
        </h1>
        <p class="text-[14px] text-[#9CA3AF] mb-6 font-bold">
          {{ submittedForApproval()
            ? 'Admin will review your venue account. After approval, you will submit required documents separately.'
            : 'Your venue is now active on TYNG.' }}
        </p>

        <div class="w-full max-w-sm bg-white rounded-[24px] p-5 mb-6 text-left border border-[#F3F4F6] shadow-sm">
          <div *ngFor="let item of (submittedForApproval()
            ? ['Profile submitted', 'Waiting for account approval', 'Documents come after approval']
            : ['Venue Published', 'Search Listing Active', 'Online Booking Enabled', 'Payments Activated', 'QR Entry Enabled', 'Analytics Started'])"
            class="flex items-center gap-3 py-2.5 border-b border-[#F9FAFB] last:border-0">
            <div class="w-5 h-5 rounded-full bg-[var(--app-primary)] flex items-center justify-center flex-shrink-0">
              <ion-icon name="checkmark-outline" class="text-xs text-[#111827] font-black"></ion-icon>
            </div>
            <span class="text-[13px] font-black text-[#111827]">{{ item }}</span>
          </div>
        </div>

        <div class="w-full max-w-sm space-y-3">
          <button (click)="goDashboard()" class="w-full h-14 rounded-[24px] text-[16px] font-black text-white border-none shadow-md btn-orange-gradient">
            {{ submittedForApproval() ? 'View approval status' : 'Go to Dashboard' }}
          </button>
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
              <p class="text-[14px] font-black text-[#111827] m-0 leading-none">
                {{ isEditingReadyProfile() ? 'Edit Venue Profile' : 'Complete Venue Profile' }}
              </p>
              <p class="text-[11px] text-[#9CA3AF] m-0 font-bold mt-1">
                Step {{ step() }} of {{ totalSteps }} · {{ stepTitle() }}
              </p>
            </div>
            <div class="w-10 h-10" aria-hidden="true"></div>
          </div>

          <!-- Progress dots indicator (tap to jump) -->
          <div class="flex items-center justify-center gap-0.5 pb-4 pt-2">
            <button
              type="button"
              *ngFor="let s of stepNumbers"
              class="flex items-center border-none bg-transparent p-0"
              (click)="jumpToStep(s)"
              [attr.aria-label]="'Go to step ' + s"
            >
              <div class="h-1.5 rounded-full transition-all duration-200"
                [style.width]="step() === s ? '16px' : '6px'"
                [style.backgroundColor]="step() > s ? '#FF7A00' : step() === s ? 'var(--app-primary)' : '#E5E7EB'">
              </div>
              <div *ngIf="s < totalSteps" class="w-1 h-px mx-0.5"
                [style.backgroundColor]="step() > s ? '#FF7A00' : '#E5E7EB'">
              </div>
            </button>
          </div>
        </div>

        <div class="px-5 pt-5">
          <div *ngIf="saveError()" class="mb-4 rounded-2xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-[13px] font-bold text-[#DC2626]">
            {{ saveError() }}
          </div>
          <!-- STEP 1: BUSINESS INFORMATION -->
          <div *ngIf="step() === 1" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Business Information</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Legal and contact details for your venue</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div>
                <p class="field-label">Business Registration Name *</p>
                <input [(ngModel)]="bizName" placeholder="Legal company name" class="form-input" />
              </div>
              <div>
                <p class="field-label">Venue Display Name *</p>
                <input [(ngModel)]="venueName" placeholder="Name shown to players" class="form-input" />
              </div>
              <div>
                <p class="field-label">Owner / Manager Name *</p>
                <input [(ngModel)]="ownerName" placeholder="Full name" class="form-input" />
              </div>
              <div>
                <p class="field-label">Mobile Number *</p>
                <input [(ngModel)]="mobile" placeholder="10-digit mobile" type="tel" maxlength="10" class="form-input" />
              </div>
              <div>
                <p class="field-label">Email Address *</p>
                <input [(ngModel)]="email" placeholder="contact@venue.in" type="email" class="form-input" />
              </div>
              <div>
                <p class="field-label">Website <span class="optional">Optional</span></p>
                <input [(ngModel)]="website" placeholder="https://" class="form-input" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="field-label">GST Number <span class="optional">Optional</span></p>
                  <input [(ngModel)]="gstNo" placeholder="GSTIN" class="form-input" />
                </div>
                <div>
                  <p class="field-label">PAN <span class="optional">Optional</span></p>
                  <input [(ngModel)]="panNo" placeholder="ABCDE1234F" class="form-input" />
                </div>
              </div>
              <div>
                <p class="field-label">Year Established <span class="optional">Optional</span></p>
                <input [(ngModel)]="yearEst" placeholder="e.g. 2018" type="text" inputmode="numeric" maxlength="4" class="form-input" />
              </div>
              <div>
                <p class="field-label">Ownership Type *</p>
                <div class="chip-wrap">
                  <button type="button" *ngFor="let opt of ownershipTypes" (click)="ownership.set(opt)"
                    class="choice-chip"
                    [class.active]="ownership() === opt">
                    {{ opt }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2: LOCATION -->
          <div *ngIf="step() === 2" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Location</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Where players will find your venue</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div class="complete-profile-address-field-wrap">
                <app-location-field
                  label="Full Address *"
                  placeholder="Street address"
                  [(ngModel)]="address"
                  (ngModelChange)="onLocationFieldsChanged()"
                  (detailsChange)="onLocationDetails($event)"
                ></app-location-field>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="field-label">City *</p>
                  <input
                    [(ngModel)]="city"
                    (ngModelChange)="onLocationFieldsChanged()"
                    placeholder="Lucknow"
                    class="form-input"
                  />
                </div>
                <div>
                  <p class="field-label">Pincode *</p>
                  <input
                    [ngModel]="pincode"
                    (ngModelChange)="onPincodeInput($event)"
                    placeholder="226024"
                    type="text"
                    inputmode="numeric"
                    maxlength="6"
                    class="form-input"
                  />
                </div>
              </div>

              <div *ngIf="mapEmbedUrl()" class="venue-map-preview">
                <p class="field-label">Venue location</p>
                <div class="venue-map-frame">
                  <iframe
                    [src]="mapEmbedUrl()!"
                    title="Venue location map"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    allowfullscreen
                  ></iframe>
                  <a
                    class="venue-map-open"
                    [href]="externalMapsUrl"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ion-icon name="open-outline"></ion-icon>
                    Maps
                  </a>
                </div>
              </div>

              <div>
                <p class="field-label">State *</p>
                <div class="chip-wrap">
                  <button type="button" *ngFor="let state of states" (click)="stateVal.set(state)"
                    class="choice-chip"
                    [class.active]="stateVal() === state">
                    {{ state }}
                  </button>
                </div>
              </div>
              <div>
                <p class="field-label">Landmark <span class="optional">Optional</span></p>
                <input [(ngModel)]="landmark" placeholder="Near landmark" class="form-input" />
              </div>
            </div>
          </div>

          <!-- STEP 3: HOURS -->
          <div *ngIf="step() === 3" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Hours &amp; slots</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Operating days, timings and booking gaps</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div>
                <p class="field-label">Operating Days</p>
                <div class="day-wrap">
                  <button type="button" *ngFor="let day of days" (click)="toggleDay(day)"
                    class="day-chip"
                    [class.active]="isDaySelected(day)">
                    {{ day }}
                  </button>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="field-label">Opening Time</p>
                  <input type="time" [(ngModel)]="openTime" class="form-input" />
                </div>
                <div>
                  <p class="field-label">Closing Time</p>
                  <input type="time" [(ngModel)]="closeTime" class="form-input" />
                </div>
              </div>
              <div>
                <p class="field-label">Gap between booking slots</p>
                <p class="text-[11px] text-[#9CA3AF] font-semibold m-0 mb-2">Each slot is 1 hour. Default gap is 15 min (7–8, then 8:15–9:15). You can extend it to 30 min.</p>
                <div class="chip-wrap">
                  <button type="button" class="choice-chip" [class.active]="slotIntervalMinutes() === 15" (click)="slotIntervalMinutes.set(15)">15 min</button>
                  <button type="button" class="choice-chip" [class.active]="slotIntervalMinutes() === 30" (click)="slotIntervalMinutes.set(30)">30 min</button>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 4: FACILITIES -->
          <div *ngIf="step() === 4" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Facilities</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">
                Add as many courts as you offer — football, badminton, swimming, and more
              </p>
            </div>

            <div *ngIf="facilities().length > 0" class="space-y-3">
              <div class="flex items-center justify-between px-1">
                <p class="field-label" style="margin:0">Added facilities ({{ facilities().length }})</p>
                <p class="text-[11px] font-bold text-[#9CA3AF] m-0">Tap trash to remove</p>
              </div>
              <div *ngFor="let f of facilities(); trackBy: trackFacility" class="bg-white rounded-[22px] overflow-hidden border border-[#F3F4F6] shadow-sm text-left">
                <div class="relative h-[100px] bg-slate-200">
                  <img [src]="f.photo" class="w-full h-full object-cover" [alt]="f.name" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none"></div>
                  <button
                    type="button"
                    class="remove-facility"
                    (click)="removeFacility(f.id, $event)"
                    aria-label="Remove facility"
                  >
                    <ion-icon name="trash-outline" aria-hidden="true"></ion-icon>
                  </button>
                  <span class="absolute top-2.5 right-12 z-[1] text-[9px] font-black px-2 py-0.5 rounded-full uppercase pointer-events-none"
                    [style.backgroundColor]="f.status === 'Open' ? '#F0FDF4' : '#FEF2F2'"
                    [style.color]="f.status === 'Open' ? '#16A34A' : '#DC2626'">
                    {{ f.status }}
                  </span>
                  <div class="absolute bottom-2.5 left-3 right-3">
                    <span class="text-lg">{{ f.emoji }}</span>
                    <p class="text-white font-black text-[14px] m-0 mt-0.5">{{ f.name }}</p>
                    <p class="text-white/70 text-[10px] m-0 mt-0.5 font-bold">
                      {{ f.sport }} · {{ f.indoor ? 'Indoor' : 'Outdoor' }}
                      <ng-container *ngIf="f.hourlyPrice"> · ₹{{ f.hourlyPrice }}/hr</ng-container>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-[24px] p-5 space-y-3 border border-[#F3F4F6] shadow-sm">
              <p class="text-[14px] font-black text-[#111827] m-0">
                {{ facilities().length ? 'Add another facility' : 'Add your first facility' }}
              </p>

              <p class="field-label">Sport *</p>
              <div class="chip-wrap">
                <button
                  type="button"
                  *ngFor="let sport of facilitySports"
                  class="choice-chip"
                  [class.active]="newFacilitySport === sport.id"
                  (click)="selectFacilitySport(sport.id)"
                >
                  {{ sport.emoji }} {{ sport.label }}
                </button>
              </div>

              <p class="field-label">Facility name *</p>
              <input [(ngModel)]="newFacilityName" placeholder="e.g. Badminton Court 1" class="form-input" />

              <div class="flex items-center justify-between py-1">
                <div>
                  <p class="text-[14px] font-black text-[#111827] m-0">Indoor facility</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5">Turn off for outdoor courts</p>
                </div>
                <button type="button" class="toggle-btn" [class.on]="newFacilityIndoor" (click)="newFacilityIndoor = !newFacilityIndoor">
                  <span class="toggle-knob"></span>
                </button>
              </div>

              <button type="button" class="add-facility-btn" [disabled]="!canAddFacility()" (click)="addFacility()">
                <ion-icon name="add-circle-outline"></ion-icon>
                {{ facilities().length ? 'Add another facility' : 'Add facility' }}
              </button>
            </div>

            <div *ngIf="facilities().length === 0" class="empty-facilities">
              <div class="text-4xl mb-2">🏟️</div>
              <p class="text-[15px] font-black text-[#111827] m-0">No facilities yet</p>
              <p class="text-[12px] text-[#9CA3AF] m-0 mt-1">Pick a sport and tap Add — you can add multiple courts before continuing.</p>
            </div>
          </div>

          <!-- STEP 5: PRICING + BOOKING SETTINGS -->
          <div *ngIf="step() === 5" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Pricing & Booking</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Each turf or court has its own hourly rate</p>
            </div>

            <div *ngIf="facilities().length === 0" class="empty-facilities">
              <p class="text-[15px] font-black text-[#111827] m-0">No facilities yet</p>
              <p class="text-[12px] text-[#9CA3AF] m-0 mt-1">Go back and add courts first — pricing is set per facility.</p>
            </div>

            <div *ngFor="let f of facilities(); let idx = index; trackBy: trackFacility" class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div class="flex items-center gap-3">
                <span class="text-2xl leading-none">{{ f.emoji }}</span>
                <div class="min-w-0">
                  <p class="text-[15px] font-black text-[#111827] m-0">{{ f.name }}</p>
                  <p class="text-[11px] font-bold text-[#9CA3AF] m-0 mt-0.5">{{ f.sport }} · {{ f.indoor ? 'Indoor' : 'Outdoor' }}</p>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Hourly Charge (₹) *</p>
                  <input type="number" [ngModel]="f.hourlyPrice" (ngModelChange)="setFacilityPrice(idx, 'hourlyPrice', $event)" placeholder="e.g. 800" class="form-input" />
                </div>
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Peak Hours Price (₹)</p>
                  <input type="number" [ngModel]="f.peakPrice" (ngModelChange)="setFacilityPrice(idx, 'peakPrice', $event)" placeholder="e.g. 1200" class="form-input" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Weekend Price (₹)</p>
                  <input type="number" [ngModel]="f.weekendPrice" (ngModelChange)="setFacilityPrice(idx, 'weekendPrice', $event)" placeholder="e.g. 2000" class="form-input" />
                </div>
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Cancellation Fee (₹)</p>
                  <input type="number" [ngModel]="f.cancelFee" (ngModelChange)="setFacilityPrice(idx, 'cancelFee', $event)" placeholder="e.g. 400" class="form-input" />
                </div>
              </div>
            </div>

            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div>
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
              <div class="border-t border-[#F3F4F6] pt-4 mt-2 flex items-center justify-between gap-3">
                <div>
                  <p class="text-[14px] font-black text-[#111827] m-0">Auto-Confirm Bookings</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5">Instantly approve bookings with deposit</p>
                </div>
                <button type="button" (click)="autoConfirm.set(!autoConfirm())" class="w-12 h-6 rounded-full relative flex-shrink-0 border-none transition-colors duration-200"
                  [style.backgroundColor]="autoConfirm() ? 'var(--app-primary)' : '#E5E7EB'">
                  <div class="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
                    [style.left.px]="autoConfirm() ? 24 : 3"></div>
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 6: EQUIPMENT (admin catalog) -->
          <div *ngIf="step() === 6" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Sports Equipment</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Choose rentals from the admin catalog and set quantities</p>
            </div>
            <div *ngIf="equipmentLoading() && equipmentList().length === 0">
              <app-skeleton-list [count]="4"></app-skeleton-list>
            </div>
            <div *ngIf="!equipmentLoading() && equipmentList().length === 0" class="empty-facilities">
              <p class="text-[15px] font-black text-[#111827] m-0">No equipment yet</p>
              <p class="text-[12px] text-[#9CA3AF] m-0 mt-1">Ask admin to add sports equipment in the Laravel admin panel.</p>
            </div>
            <div class="space-y-3">
              <div *ngFor="let eq of equipmentList()" class="bg-white p-4 rounded-[22px] border border-[#F3F4F6] shadow-sm flex items-center justify-between text-left gap-3">
                <div class="flex items-center gap-3 min-w-0">
                  <span class="text-2xl flex-shrink-0">{{ eq.emoji }}</span>
                  <div class="min-w-0">
                    <p class="text-[14px] font-black text-[#111827] m-0 truncate">{{ eq.label }}</p>
                    <p class="text-[10px] text-[#9CA3AF] m-0 font-bold mt-0.5">Rental: ₹{{ getEquipPrice(eq.id) }}/hr</p>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <input
                    type="number"
                    class="equip-price-input"
                    [ngModel]="getEquipPrice(eq.id)"
                    (ngModelChange)="setEquipPrice(eq.id, $event)"
                    placeholder="₹"
                  />
                  <div class="flex items-center gap-2 bg-[#F3F4F6] rounded-xl px-2 py-1">
                    <button type="button" (click)="decrementEquip(eq.id)" class="w-6 h-6 rounded-full bg-white flex items-center justify-center border-none text-sm font-black">-</button>
                    <span class="text-xs font-black w-4 text-center">{{ getEquipQty(eq.id) }}</span>
                    <button type="button" (click)="incrementEquip(eq.id)" class="w-6 h-6 rounded-full bg-white flex items-center justify-center border-none text-sm font-black">+</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 7: GALLERY -->
          <div *ngIf="step() === 7" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Venue Photos</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Add photos from camera, gallery, or files</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let photo of uploadedPhotos(); let idx = index" class="aspect-video rounded-2xl overflow-hidden relative bg-slate-200">
                <img [src]="photo" class="w-full h-full object-cover" [alt]="'Venue photo ' + (idx + 1)" />
                <button type="button" (click)="removePhoto(idx)" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 text-white flex items-center justify-center border-none text-xs">×</button>
              </div>
              <button
                type="button"
                (click)="pickVenuePhotos()"
                [disabled]="photoUploading()"
                class="aspect-video rounded-2xl border-2 border-dashed border-[#E5E7EB] flex flex-col items-center justify-center bg-[#F9FAFB]"
              >
                <ion-icon name="camera-outline" class="text-2xl text-[#C4C9D4]"></ion-icon>
                <span class="text-[10px] text-[#9CA3AF] font-bold mt-1 uppercase tracking-wider">
                  {{ photoUploading() ? 'Uploading…' : 'Add Photo' }}
                </span>
              </button>
            </div>
            <input #galleryCameraInput type="file" accept="image/*" capture="environment" multiple hidden (change)="onGalleryFilesSelected($event)" />
            <input #galleryLibraryInput type="file" accept="image/*" multiple hidden (change)="onGalleryFilesSelected($event)" />
          </div>

          <!-- STEP 8: VERIFICATION -->
          <div *ngIf="step() === 8" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Documents & Verification</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">
                Optional for now. After account approval you must submit required documents to activate your venue.
              </p>
            </div>
            <div class="space-y-3">
              <div
                *ngFor="let doc of verDocs()"
                class="doc-row w-full flex items-center gap-3 px-4 py-4 rounded-[20px] transition-all text-left border"
                [class.doc-row--uploaded]="isDocUploaded(doc.id)"
                [class.doc-row--editable]="isEditAllowed(doc.id)"
                [class.opacity-60]="docUploading() === doc.id"
                [class.cursor-pointer]="canPickDocument(doc.id)"
                [class.cursor-default]="!canPickDocument(doc.id)"
              >
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  [style.backgroundColor]="isDocUploaded(doc.id) ? 'var(--app-primary)' : '#F3F4F6'">
                  <ion-icon [name]="isDocUploaded(doc.id) ? 'checkmark-outline' : 'document-text-outline'"
                    [style.color]="isDocUploaded(doc.id) ? '#111827' : '#C4C9D4'" class="text-base font-bold"></ion-icon>
                </div>
                <div class="flex-grow min-w-0">
                  <div class="flex items-center gap-2 flex-wrap">
                    <p class="text-[13px] font-black text-[#111827] m-0">
                      {{ doc.label }}<span *ngIf="doc.required" class="text-[#EF4444] ml-0.5">*</span>
                    </p>
                    <span *ngIf="isEditAllowed(doc.id)" class="uploaded-badge" style="background:#DCFCE7;color:#166534;">Edit allowed</span>
                    <span *ngIf="isDocUploaded(doc.id) && !isDocLocked(doc.id) && !isEditAllowed(doc.id)" class="uploaded-badge">Uploaded</span>
                    <span *ngIf="isDocLocked(doc.id) && !isEditAllowed(doc.id)" class="uploaded-badge" style="background:#FEF3C7;color:#92400E;">Locked</span>
                  </div>
                  <p class="text-[11px] m-0 mt-0.5 font-bold"
                    [style.color]="isEditAllowed(doc.id) ? '#16A34A' : (isDocUploaded(doc.id) ? '#16A34A' : '#9CA3AF')">
                    {{ docUploading() === doc.id
                      ? 'Uploading…'
                      : (isEditAllowed(doc.id)
                        ? 'Admin approved — tap cloud to upload a new file'
                        : (isDocLocked(doc.id)
                          ? 'Locked after upload — use Request Edit Document below'
                          : (isDocUploaded(doc.id) ? ('✓ ' + (docFileName(doc.id) || 'Uploaded successfully')) : 'Tap cloud to upload PDF/Image'))) }}
                  </p>
                  <button
                    *ngIf="docPreviewUrl(doc.id) as previewUrl"
                    type="button"
                    class="doc-preview-btn"
                    (click)="openDocumentPreview(previewUrl)"
                  >
                    Preview document
                  </button>
                  <p *ngIf="hasPendingEditRequest(doc.id) && !isEditAllowed(doc.id)" class="text-[11px] font-bold text-[#F59E0B] m-0 mt-1">
                    Edit request pending with admin
                  </p>
                </div>

                <button
                  *ngIf="canPickDocument(doc.id)"
                  type="button"
                  class="doc-upload-icon-btn"
                  [disabled]="docUploading() !== null"
                  [attr.aria-label]="'Upload ' + doc.label"
                  (click)="triggerDocumentUpload(doc.id, $event)"
                >
                  <ion-icon name="cloud-upload-outline"></ion-icon>
                </button>
                <div *ngIf="!canPickDocument(doc.id)" class="doc-lock-icon" aria-hidden="true">
                  <ion-icon name="lock-closed-outline"></ion-icon>
                </div>

                <input
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  hidden
                  [attr.data-doc-id]="doc.id"
                  [disabled]="docUploading() !== null || !canPickDocument(doc.id)"
                  (change)="onDocumentSelected(doc.id, $event)"
                />
              </div>
            </div>
            <p class="text-[12px] font-bold text-[#9CA3AF] m-0 text-center">
              You can submit for account approval without documents. Required docs will be requested after approval.
            </p>
          </div>
        </div>
      </div>

      <!-- STICKY ACTION BUTTON BAR -->
      <div *ngIf="!isSuccess()" class="venue-safe-footer fixed bottom-0 left-0 right-0 z-30 bg-white px-5 pt-3"
        style="box-shadow: 0 -4px 24px rgba(0,0,0,0.09); border-top: 1px solid #F3F4F6;">
        <div class="flex flex-col gap-2.5 max-w-md mx-auto">
          <button
            *ngIf="step() === 8 && requestableLockedDocs().length > 0"
            type="button"
            class="request-edit-doc-btn"
            [disabled]="submittingDocEdit()"
            (click)="openDocEditSheet()"
          >
            <ion-icon name="create-outline" aria-hidden="true"></ion-icon>
            Request Edit Document
          </button>
          <button (click)="handleNext()" [disabled]="!canProceed() || saving()"
            class="w-full h-13 rounded-[24px] text-[15px] font-black border-none text-[#111827] transition-all"
            [style.background]="canProceed() && !saving() ? 'linear-gradient(135deg,var(--app-primary),var(--app-primary-to))' : '#F3F4F6'"
            [style.color]="canProceed() && !saving() ? '#111827' : '#C4C9D4'"
            [style.boxShadow]="canProceed() && !saving() ? '0 4px 18px rgba(var(--app-primary-rgb),0.38)' : 'none'"
            [style.opacity]="canProceed() && !saving() ? '1' : '0.6'">
            {{ saving() ? 'Saving…' : (step() === totalSteps ? 'Save & Submit for Approval' : 'Save & Continue →') }}
          </button>
        </div>
      </div>

      <!-- Multi-document edit request sheet -->
      <div *ngIf="showDocEditSheet()" class="doc-edit-backdrop" (click)="closeDocEditSheet()">
        <div class="doc-edit-sheet" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="doc-edit-title">
          <div class="doc-edit-handle" aria-hidden="true"></div>
          <h3 id="doc-edit-title" class="doc-edit-title">Request edit document</h3>
          <p class="doc-edit-sub">Select one or more locked documents. Admin will review these in Document Requests.</p>

          <div class="doc-edit-list">
            <label
              *ngFor="let doc of requestableLockedDocs()"
              class="doc-edit-option"
              [class.selected]="isDocSelectedForEdit(doc.id)"
            >
              <input
                type="checkbox"
                class="doc-edit-check"
                [checked]="isDocSelectedForEdit(doc.id)"
                (change)="toggleDocEditSelection(doc.id)"
              />
              <span class="doc-edit-option-label">{{ doc.label }}</span>
            </label>
          </div>

          <p class="field-label" style="margin-top:14px">Reason</p>
          <textarea
            class="doc-edit-reason"
            rows="3"
            maxlength="1000"
            [(ngModel)]="docEditReason"
            placeholder="Tell admin why you need to replace these documents (optional)"
          ></textarea>

          <div class="doc-edit-actions">
            <button type="button" class="doc-edit-cancel" [disabled]="submittingDocEdit()" (click)="closeDocEditSheet()">Cancel</button>
            <button
              type="button"
              class="doc-edit-submit"
              [disabled]="selectedDocEditIds().length === 0 || submittingDocEdit()"
              (click)="submitSelectedDocEditRequests()"
            >
              {{ submittingDocEdit() ? 'Submitting…' : 'Submit request' }}
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .complete-profile-page, .success-screen {
      background: #FAFBFC;
      min-height: 100%;
    }

    .complete-profile-page {
      padding-bottom: calc(160px + var(--safe-area-bottom));
    }

    .success-screen {
      padding-top: var(--safe-area-top);
      padding-bottom: calc(48px + var(--safe-area-bottom));
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      padding-top: var(--app-chrome-top-inset, var(--safe-area-top));
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .field-label {
      margin: 0 0 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #9ca3af;
    }

    .optional {
      text-transform: none;
      letter-spacing: 0;
      font-weight: 600;
      color: #c4c9d4;
    }

    .form-input {
      width: 100%;
      padding: 13px 14px;
      background: #F3F4F6;
      border-radius: 14px;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      border: 1.5px solid transparent;
      outline: none;
      box-shadow: none;
      min-height: 48px;
    }

    .form-input:focus {
      border-color: var(--app-primary);
      background: #fff;
    }

    .form-input::placeholder {
      color: #C4C9D4;
      font-weight: 500;
    }

    .chip-wrap,
    .day-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 4px;
    }

    .choice-chip {
      padding: 8px 12px;
      border-radius: 999px;
      border: 1.5px solid transparent;
      background: #F3F4F6;
      color: #6B7280;
      font-size: 12px;
      font-weight: 700;
      line-height: 1;
    }

    .choice-chip.active {
      background: rgba(var(--app-primary-rgb), 0.16);
      border-color: var(--app-primary);
      color: #111827;
    }

    .day-chip {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: 1.5px solid #E5E7EB;
      background: #fff;
      color: #6B7280;
      font-size: 11px;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      flex: 0 0 42px;
    }

    .day-chip.active {
      background: rgba(var(--app-primary-rgb), 0.16);
      border-color: var(--app-primary);
      color: #111827;
    }

    .complete-profile-address-field-wrap {
      margin-bottom: 2px;
    }

    .venue-map-preview {
      margin-top: 4px;
    }

    .venue-map-frame {
      position: relative;
      height: 180px;
      border-radius: 18px;
      overflow: hidden;
      border: 1px solid #E5E7EB;
      background: #F3F4F6;
    }

    .venue-map-frame iframe {
      width: 100%;
      height: 100%;
      border: 0;
      display: block;
    }

    .venue-map-open {
      position: absolute;
      top: 10px;
      left: 10px;
      z-index: 2;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 10px;
      border-radius: 999px;
      background: #fff;
      color: #111827;
      font-size: 11px;
      font-weight: 800;
      text-decoration: none;
      box-shadow: 0 2px 10px rgba(0,0,0,0.12);
    }

    .venue-map-open ion-icon {
      font-size: 14px;
    }

    .toggle-btn {
      width: 48px;
      height: 28px;
      border-radius: 999px;
      border: none;
      background: #E5E7EB;
      position: relative;
      padding: 0;
      flex-shrink: 0;
      transition: background 0.2s ease;
    }

    .toggle-btn.on {
      background: var(--app-primary);
    }

    .toggle-knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 4px rgba(0,0,0,0.18);
      transition: left 0.2s ease;
    }

    .toggle-btn.on .toggle-knob {
      left: 23px;
    }

    .add-facility-btn {
      width: 100%;
      height: 48px;
      border-radius: 16px;
      border: none;
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      color: #111827;
      font-size: 14px;
      font-weight: 900;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .add-facility-btn:disabled {
      background: #F3F4F6;
      color: #C4C9D4;
    }

    .empty-facilities {
      text-align: center;
      padding: 28px 16px;
      border-radius: 22px;
      border: 1.5px dashed #E5E7EB;
      background: #fff;
    }

    .remove-facility {
      position: absolute;
      top: 10px;
      right: 10px;
      z-index: 5;
      width: 36px;
      height: 36px;
      border-radius: 999px;
      border: none;
      background: rgba(0,0,0,0.55);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      pointer-events: auto;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    .remove-facility ion-icon {
      pointer-events: none;
      font-size: 18px;
    }

    .equip-price-input {
      width: 64px;
      min-height: 32px;
      border: none;
      border-radius: 10px;
      background: #F3F4F6;
      font-size: 11px;
      font-weight: 800;
      color: #111827;
      text-align: center;
      padding: 4px 6px;
    }

    .doc-row {
      background: #F9FAFB;
      border-color: #E5E7EB;
      border-style: dashed;
    }

    .doc-row--uploaded {
      background: rgba(var(--app-primary-rgb), 0.08);
      border-color: var(--app-primary);
      border-style: solid;
    }

    .uploaded-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 8px;
      border-radius: 999px;
      background: var(--app-primary);
      color: #111827;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .doc-preview-btn {
      margin-top: 6px;
      border: none;
      background: transparent;
      color: #2563EB;
      font-size: 11px;
      font-weight: 800;
      padding: 0;
    }

    .doc-row--editable {
      border-color: var(--app-primary);
      background: rgba(var(--app-primary-rgb), 0.08);
    }

    .doc-upload-icon-btn {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      background: rgba(var(--app-primary-rgb), 0.18);
      color: #111827;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
    }

    .doc-upload-icon-btn ion-icon {
      font-size: 22px;
      pointer-events: none;
    }

    .doc-upload-icon-btn:disabled {
      opacity: 0.5;
    }

    .doc-lock-icon {
      flex-shrink: 0;
      width: 40px;
      height: 40px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: var(--app-primary);
    }

    .doc-lock-icon ion-icon {
      font-size: 22px;
    }

    .request-edit-doc-btn {
      width: 100%;
      min-height: 52px;
      border-radius: 24px;
      border: none;
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      color: #111827;
      font-size: 15px;
      font-weight: 900;
      padding: 12px 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      box-shadow: 0 4px 18px rgba(var(--app-primary-rgb), 0.38);
    }

    .request-edit-doc-btn ion-icon {
      font-size: 20px;
      pointer-events: none;
    }

    .request-edit-doc-btn:disabled {
      background: #F3F4F6;
      color: #C4C9D4;
      box-shadow: none;
      opacity: 1;
    }

    .doc-edit-backdrop {
      position: fixed;
      inset: 0;
      z-index: 80;
      background: rgba(17, 24, 39, 0.45);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 0;
    }

    .doc-edit-sheet {
      width: 100%;
      max-width: 480px;
      max-height: min(78vh, 640px);
      overflow: auto;
      background: #fff;
      border-radius: 24px 24px 0 0;
      padding: 10px 20px calc(18px + var(--safe-area-bottom));
      box-shadow: 0 -8px 32px rgba(0,0,0,0.18);
    }

    .doc-edit-handle {
      width: 40px;
      height: 4px;
      border-radius: 999px;
      background: #E5E7EB;
      margin: 4px auto 14px;
    }

    .doc-edit-title {
      margin: 0;
      font-size: 18px;
      font-weight: 900;
      color: #111827;
    }

    .doc-edit-sub {
      margin: 6px 0 14px;
      font-size: 12px;
      font-weight: 600;
      color: #9CA3AF;
      line-height: 1.4;
    }

    .doc-edit-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-height: 240px;
      overflow: auto;
    }

    .doc-edit-option {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 14px;
      border: 1.5px solid #E5E7EB;
      background: #F9FAFB;
    }

    .doc-edit-option.selected {
      border-color: var(--app-primary);
      background: rgba(var(--app-primary-rgb), 0.1);
    }

    .doc-edit-check {
      width: 18px;
      height: 18px;
      accent-color: var(--app-primary);
      flex-shrink: 0;
    }

    .doc-edit-option-label {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
    }

    .doc-edit-reason {
      width: 100%;
      min-height: 84px;
      border: 1.5px solid #E5E7EB;
      border-radius: 14px;
      background: #F3F4F6;
      padding: 12px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      resize: vertical;
      outline: none;
    }

    .doc-edit-reason:focus {
      border-color: var(--app-primary);
      background: #fff;
    }

    .doc-edit-actions {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }

    .doc-edit-cancel,
    .doc-edit-submit {
      flex: 1;
      min-height: 48px;
      border-radius: 16px;
      border: none;
      font-size: 14px;
      font-weight: 900;
    }

    .doc-edit-cancel {
      background: #F3F4F6;
      color: #6B7280;
    }

    .doc-edit-submit {
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      color: #111827;
    }

    .doc-edit-submit:disabled {
      background: #F3F4F6;
      color: #C4C9D4;
    }

    .venue-safe-footer {
      padding-bottom: calc(12px + var(--safe-area-bottom));
    }

    .cloud-idle {
      color: #C4C9D4;
    }

    .cloud-active {
      color: #16A34A;
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
export class VenueCompleteProfilePage implements ViewWillEnter {
  @ViewChild('galleryCameraInput') galleryCameraInput?: ElementRef<HTMLInputElement>;
  @ViewChild('galleryLibraryInput') galleryLibraryInput?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);
  private readonly venueService = inject(VenueService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly alertCtrl = inject(AlertController);
  private readonly mediaPermissions = inject(MediaPermissionService);
  private readonly mediaPicker = inject(NativeMediaPickerService);

  readonly totalSteps = TOTAL_STEPS;
  readonly stepNumbers = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);
  readonly stepTitles = STEP_TITLES;

  readonly ownershipTypes = OWNERSHIP_TYPES;
  readonly days = DAYS;
  readonly states = STATES;
  verDocs = signal(VERIFICATION_DOCS);
  readonly facilitySports = FACILITY_SPORTS;

  step = signal(1);
  isSuccess = signal(false);
  submittedForApproval = signal(false);
  saving = signal(false);
  saveError = signal('');
  mapEmbedUrl = signal<SafeResourceUrl | null>(null);
  private mapQueryKey = '';
  private mapRefreshTimer: ReturnType<typeof setTimeout> | null = null;

  equipmentList = signal<SportsEquipmentItem[]>([]);
  equipmentLoading = signal(false);
  photoUploading = signal(false);

  // States
  bizName = '';
  venueName = '';
  ownerName = '';
  mobile = '';
  email = '';
  website = '';
  gstNo = '';
  panNo = '';
  yearEst = '';
  ownership = signal('Private');

  address = '';
  city = '';
  pincode = '';
  stateVal = signal('Uttar Pradesh');
  landmark = '';
  opDays = signal<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']);
  openTime = '06:00';
  closeTime = '22:00';

  facilities = signal<MaintFacility[]>([]);
  newFacilityName = '';
  newFacilitySport = 'football';
  newFacilityIndoor = false;

  coachDisc = '';
  academyDisc = '';
  corpDisc = '';

  autoConfirm = signal(true);
  slotIntervalMinutes = signal<15 | 30>(15);

  equipQty = signal<Record<string, number>>({});
  equipPrices = signal<Record<string, string>>({});

  uploadedPhotos = signal<string[]>([]);

  uploadedDocs = signal<Record<string, { name: string; url?: string }>>({});
  docUploading = signal<string | null>(null);
  editableDocuments = signal<string[]>([]);
  accountStatus = signal<string>('incomplete');
  pendingEditDocIds = signal<string[]>([]);
  showDocEditSheet = signal(false);
  selectedDocEditIds = signal<string[]>([]);
  submittingDocEdit = signal(false);
  docEditReason = '';

  get externalMapsUrl(): string {
    const query = [this.address, this.city].filter(Boolean).join(', ');
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  stepTitle(): string {
    return this.stepTitles[this.step() - 1] || '';
  }

  isEditingReadyProfile(): boolean {
    return this.auth.user()?.venueProfileReady === true;
  }

  constructor() {
    const user = this.auth.user();
    if (user) {
      this.venueName = (user.displayName || '').trim();
      this.bizName = (user.businessName || '').trim();
      this.ownerName = (user.ownerName || '').trim();
      this.mobile = user.phone || '';
      this.email = user.email || '';
      this.address = user.location || '';
      this.city = (user.location || '').split(/[>,\-\/|]+/)[0]?.trim() || '';
      const preferred = (user.sports || [])[0]?.toLowerCase();
      if (preferred && this.facilitySports.some((s) => s.id === preferred)) {
        this.newFacilitySport = preferred;
      }
    }
    this.suggestFacilityName();
    this.refreshMapPreview();
    void this.loadExistingProfile();
    void this.loadEquipmentCatalog();
  }

  ionViewWillEnter() {
    // Allow re-opening this wizard to edit even when venueProfileReady=true.
    // (Previously we hard-redirected to dashboard, which blocked Edit / side-menu.)
    if (this.isSuccess()) {
      this.isSuccess.set(false);
    }
    this.applyResumeStep();
    // Admin may have approved document edit requests while this page stayed cached.
    void this.refreshDocumentEditState();
  }

  /** Pull latest editable/pending document flags from API (no full profile rewrite). */
  private async refreshDocumentEditState(): Promise<void> {
    try {
      const [profileRes, editRes] = await Promise.all([
        firstValueFrom(this.venueService.getMyProfile()).catch(() => null),
        firstValueFrom(this.venueService.getDocumentEditRequests()).catch(() => null),
      ]);

      if (profileRes?.success && profileRes.data) {
        const data = profileRes.data as Record<string, unknown>;
        if (data['verificationDocuments']) {
          this.applyVerificationDocuments(data['verificationDocuments']);
        }
        if (Array.isArray(data['editableDocuments'])) {
          this.editableDocuments.set(data['editableDocuments'].map((id: unknown) => String(id)));
        }
      }

      if (editRes?.success && editRes.data) {
        const pending = (editRes.data.requests || [])
          .filter((r) => String(r.status).toLowerCase() === 'pending')
          .map((r) => String(r.docId));
        // Never keep a doc in "pending" if admin already granted edit access.
        const editable = new Set(
          (editRes.data.editableDocuments || this.editableDocuments()).map(String),
        );
        this.pendingEditDocIds.set(pending.filter((id) => !editable.has(id)));
        if (Array.isArray(editRes.data.editableDocuments)) {
          this.editableDocuments.set(editRes.data.editableDocuments.map(String));
        }
      }
    } catch {
      // Keep existing local flags if refresh fails.
    }
  }

  onLocationFieldsChanged() {
    if (this.mapRefreshTimer) clearTimeout(this.mapRefreshTimer);
    this.mapRefreshTimer = setTimeout(() => this.refreshMapPreview(), 450);
  }

  onLocationDetails(details: ReverseGeocodeDetails) {
    if (details.city) this.city = details.city;
    if (details.pincode) this.pincode = details.pincode.replace(/\D/g, '').slice(0, 6);
    if (details.state) {
      const match = STATES.find((s) => s.toLowerCase() === details.state.toLowerCase());
      this.stateVal.set(match || details.state);
    }
    this.onLocationFieldsChanged();
  }

  private refreshMapPreview() {
    const query = [this.address, this.city].filter((part) => !!part?.trim()).join(', ').trim();
    if (query.length < 5) {
      this.mapQueryKey = '';
      this.mapEmbedUrl.set(null);
      return;
    }
    if (query === this.mapQueryKey) return;
    this.mapQueryKey = query;
    const raw = `https://maps.google.com/maps?q=${encodeURIComponent(query)}&output=embed&z=14`;
    this.mapEmbedUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(raw));
  }

  canProceed(): boolean {
    return this.canProceedFor(this.step());
  }

  canProceedFor(s: number): boolean {
    if (s === 1) {
      return (
        this.bizName.trim() !== '' &&
        this.venueName.trim() !== '' &&
        this.ownerName.trim() !== '' &&
        this.mobile.replace(/\D/g, '').length >= 10 &&
        !!this.ownership()
      );
    }
    if (s === 2) {
      const pin = String(this.pincode ?? '').replace(/\D/g, '');
      return this.address.trim() !== '' && this.city.trim() !== '' && pin.length === 6 && !!this.stateVal();
    }
    if (s === 3) {
      return this.opDays().length > 0 && !!this.openTime && !!this.closeTime;
    }
    if (s === 4) {
      return this.facilities().length > 0;
    }
    if (s === 5) {
      const list = this.facilities();
      return list.length > 0 && list.every((f) => String(f.hourlyPrice ?? '').trim() !== '');
    }
    if (s === 8) {
      // Documents are a separate post-approval flow — do not block account submit.
      return true;
    }
    return true;
  }

  canAddFacility(): boolean {
    return !!this.newFacilitySport;
  }

  selectFacilitySport(sportId: string) {
    this.newFacilitySport = sportId;
    this.suggestFacilityName();
  }

  addFacility() {
    if (!this.canAddFacility()) return;
    const sportMeta = this.facilitySports.find((s) => s.id === this.newFacilitySport) || this.facilitySports[0];
    const nextIndex = this.facilities().length + 1;
    const name = this.newFacilityName.trim() || this.buildFacilityName(sportMeta.label);
    this.facilities.update((list) => [
      ...list,
      {
        id: `local-${Date.now()}-${nextIndex}`,
        name,
        sport: sportMeta.label,
        emoji: sportMeta.emoji,
        indoor: this.newFacilityIndoor,
        court: String(nextIndex),
        status: 'Open',
        photo: sportMeta.photo,
        hourlyPrice: '',
        peakPrice: '',
        weekendPrice: '',
        cancelFee: '',
      },
    ]);
    this.newFacilityIndoor = false;
    this.suggestFacilityName();
  }

  trackFacility(_index: number, facility: MaintFacility): string {
    return facility.id;
  }

  removeFacility(id: string, event?: Event) {
    event?.preventDefault();
    event?.stopPropagation();
    this.facilities.update((list) => list.filter((item) => item.id !== id));
    this.suggestFacilityName();
  }

  setFacilityPrice(index: number, field: 'hourlyPrice' | 'peakPrice' | 'weekendPrice' | 'cancelFee', value: string) {
    this.facilities.update((list) =>
      list.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  private suggestFacilityName() {
    const sportMeta = this.facilitySports.find((s) => s.id === this.newFacilitySport) || this.facilitySports[0];
    this.newFacilityName = this.buildFacilityName(sportMeta.label);
  }

  private buildFacilityName(sportLabel: string): string {
    const count = this.facilities().filter(
      (f) => f.sport.toLowerCase() === sportLabel.toLowerCase(),
    ).length + 1;
    return `${sportLabel} Court ${count}`;
  }

  onPincodeInput(value: string | number | null) {
    this.pincode = String(value ?? '').replace(/\D/g, '').slice(0, 6);
  }

  toggleDay(day: string) {
    this.opDays.update(list => list.includes(day) ? list.filter(x => x !== day) : [...list, day]);
  }

  isDaySelected(day: string): boolean {
    return this.opDays().includes(day);
  }

  getEquipQty(id: string): number {
    return this.equipQty()[id] ?? 0;
  }

  getEquipPrice(id: string): string {
    return this.equipPrices()[id] ?? '0';
  }

  setEquipPrice(id: string, value: string | number | null) {
    const next = String(value ?? '').replace(/[^\d.]/g, '');
    this.equipPrices.update((prices) => ({ ...prices, [id]: next || '0' }));
  }

  incrementEquip(id: string) {
    this.equipQty.update(q => ({ ...q, [id]: (q[id] ?? 0) + 1 }));
  }

  decrementEquip(id: string) {
    this.equipQty.update(q => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) - 1) }));
  }

  async pickVenuePhotos() {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Add venue photo',
      buttons: [
        { text: 'Take photo', icon: 'camera-outline', handler: () => { void this.openGalleryCamera(); } },
        { text: 'Photo library', icon: 'images-outline', handler: () => { void this.openGalleryLibrary(); } },
        { text: 'Browse files', icon: 'folder-outline', handler: () => { void this.openGalleryLibrary(); } },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async openGalleryCamera() {
    if (Capacitor.isNativePlatform()) {
      const file = await this.mediaPicker.takePhoto('venue-camera');
      if (file) {
        await this.uploadNormalizedGallery([file]);
      }
      return;
    }
    this.galleryCameraInput?.nativeElement.click();
  }

  private async openGalleryLibrary() {
    if (Capacitor.isNativePlatform()) {
      const files = await this.mediaPicker.pickPhotos('venue', 8);
      if (files.length) {
        await this.uploadNormalizedGallery(files);
      }
      return;
    }

    const allowed = await this.mediaPermissions.ensurePhotos();
    if (!allowed) {
      await this.showMediaPermissionDenied('Photo library access is required to choose venue photos. Enable it in App settings.');
      return;
    }
    this.galleryLibraryInput?.nativeElement.click();
  }

  private async showMediaPermissionDenied(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Permission needed',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async onGalleryFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length) return;

    try {
      const normalized = await Promise.all(files.map((file, i) => normalizeImageFile(file, `venue-${i}`)));
      await this.uploadNormalizedGallery(normalized);
    } catch {
      this.saveError.set('Unable to read one or more images. Please try again.');
    }
  }

  private async uploadNormalizedGallery(files: File[]) {
    if (!files.length) return;
    this.photoUploading.set(true);
    this.saveError.set('');
    try {
      const response = await firstValueFrom(this.venueService.uploadGallery(files));
      if (!response.success || !response.data) {
        this.saveError.set(response.message || 'Unable to upload photos.');
        return;
      }
      const payload = response.data as {
        uploaded?: string[];
        gallery?: string[];
        profileImage?: string | null;
        user?: { id: string; profileImage?: string | null; updatedAt?: string | null } & Record<string, unknown>;
      };
      if (Array.isArray(payload.gallery) && payload.gallery.length) {
        this.uploadedPhotos.set(payload.gallery.map((url) => String(url)));
      } else if (Array.isArray(payload.uploaded) && payload.uploaded.length) {
        this.uploadedPhotos.update((list) => [...list, ...payload.uploaded!.map((url) => String(url))]);
      }
      if (payload.user || payload.profileImage) {
        await firstValueFrom(this.auth.fetchMe());
      }
    } catch (error: any) {
      this.saveError.set(error?.error?.message || error?.message || 'Unable to upload photos.');
    } finally {
      this.photoUploading.set(false);
    }
  }

  removePhoto(index: number) {
    this.uploadedPhotos.update((list) => list.filter((_, i) => i !== index));
  }

  async triggerDocumentUpload(docId: string, event: Event): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    if (!this.canPickDocument(docId)) {
      this.saveError.set('This document is locked. Request edit permission from admin.');
      return;
    }

    const row = (event.currentTarget as HTMLElement | null)?.closest?.('.doc-row') as HTMLElement | null;
    if (!row) return;

    if (Capacitor.isNativePlatform()) {
      const allowed = await this.mediaPermissions.ensurePhotos();
      if (!allowed) {
        await this.showMediaPermissionDenied(
          'Files / Photos access is required to upload documents. Enable it in App settings.',
        );
        return;
      }
    }

    const input = row.querySelector('input[type="file"]') as HTMLInputElement | null;
    input?.click();
  }

  isEditAllowed(docId: string): boolean {
    return this.editableDocuments().includes(docId);
  }

  isDocLocked(docId: string): boolean {
    if (!this.isDocUploaded(docId)) return false;
    return !this.isEditAllowed(docId);
  }

  canPickDocument(docId: string): boolean {
    if (this.docUploading() !== null) return false;
    if (!this.isDocUploaded(docId)) return true;
    return !this.isDocLocked(docId);
  }

  hasPendingEditRequest(docId: string): boolean {
    if (this.isEditAllowed(docId)) return false;
    return this.pendingEditDocIds().includes(docId);
  }

  requestableLockedDocs(): Array<{ id: string; label: string; required: boolean }> {
    return this.verDocs().filter(
      (doc) => this.isDocLocked(doc.id) && !this.hasPendingEditRequest(doc.id),
    );
  }

  openDocEditSheet(): void {
    const available = this.requestableLockedDocs().map((d) => d.id);
    if (!available.length) {
      void this.alertCtrl.create({
        header: 'No locked documents',
        message: 'There are no locked documents available to request for edit.',
        buttons: ['OK'],
      }).then((a) => a.present());
      return;
    }
    this.selectedDocEditIds.set([]);
    this.docEditReason = '';
    this.showDocEditSheet.set(true);
  }

  closeDocEditSheet(): void {
    if (this.submittingDocEdit()) return;
    this.showDocEditSheet.set(false);
    this.selectedDocEditIds.set([]);
    this.docEditReason = '';
  }

  isDocSelectedForEdit(docId: string): boolean {
    return this.selectedDocEditIds().includes(docId);
  }

  toggleDocEditSelection(docId: string): void {
    this.selectedDocEditIds.update((ids) =>
      ids.includes(docId) ? ids.filter((id) => id !== docId) : [...ids, docId],
    );
  }

  async submitSelectedDocEditRequests(): Promise<void> {
    const ids = this.selectedDocEditIds();
    if (!ids.length || this.submittingDocEdit()) return;

    this.submittingDocEdit.set(true);
    this.saveError.set('');
    try {
      const reason = this.docEditReason.trim();
      const response = await firstValueFrom(
        this.venueService.requestDocumentEdit(ids, reason || undefined),
      );
      if (!response.success) {
        const msg = response.message || 'Unable to submit edit request.';
        this.saveError.set(msg);
        const fail = await this.alertCtrl.create({
          header: 'Request failed',
          message: msg,
          buttons: ['OK'],
        });
        await fail.present();
        return;
      }

      const createdIds = (response.data?.requests || [])
        .map((r) => String(r.docId))
        .filter(Boolean);
      const fallbackIds = createdIds.length ? createdIds : ids;
      this.pendingEditDocIds.update((pending) => {
        const next = new Set(pending);
        fallbackIds.forEach((id) => next.add(id));
        return Array.from(next);
      });

      this.showDocEditSheet.set(false);
      this.selectedDocEditIds.set([]);
      this.docEditReason = '';

      const count = fallbackIds.length;
      const ok = await this.alertCtrl.create({
        header: 'Request sent',
        message: count === 1
          ? 'Admin will review your document edit request in Document Requests.'
          : `${count} document edit requests were sent. Admin will review them in Document Requests.`,
        buttons: ['OK'],
      });
      await ok.present();
    } catch (error: any) {
      const msg = error?.error?.message || 'Unable to submit edit request.';
      this.saveError.set(msg);
      const fail = await this.alertCtrl.create({
        header: 'Request failed',
        message: msg,
        buttons: ['OK'],
      });
      await fail.present();
    } finally {
      this.submittingDocEdit.set(false);
    }
  }

  async onDocumentSelected(docId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!this.canPickDocument(docId)) {
      this.saveError.set('This document is locked. Request edit permission from admin.');
      return;
    }

    this.docUploading.set(docId);
    this.saveError.set('');
    try {
      const response = await firstValueFrom(this.venueService.uploadDocument(docId, file));
      if (!response.success || !response.data) {
        this.saveError.set(response.message || 'Unable to upload document.');
        return;
      }
      const payload = response.data as {
        document?: { id?: string; name?: string; url?: string };
        verificationDocuments?: Record<string, { name?: string; url?: string }>;
        editableDocuments?: string[];
      };
      if (payload.verificationDocuments && typeof payload.verificationDocuments === 'object') {
        this.applyVerificationDocuments(payload.verificationDocuments);
      } else if (payload.document) {
        this.uploadedDocs.update((docs) => ({
          ...docs,
          [docId]: {
            name: String(payload.document?.name || file.name),
            url: payload.document?.url ? String(payload.document.url) : undefined,
          },
        }));
      }
      if (Array.isArray(payload.editableDocuments)) {
        this.editableDocuments.set(payload.editableDocuments.map(String));
      } else {
        this.editableDocuments.update((ids) => ids.filter((id) => id !== docId));
      }
    } catch (error: any) {
      this.saveError.set(error?.error?.message || 'Unable to upload document.');
    } finally {
      this.docUploading.set(null);
    }
  }

  isDocUploaded(id: string): boolean {
    const doc = this.uploadedDocs()[id];
    return !!(doc?.name || doc?.url);
  }

  docFileName(id: string): string {
    return this.uploadedDocs()[id]?.name || '';
  }

  docPreviewUrl(id: string): string | null {
    const url = this.uploadedDocs()[id]?.url;
    return url ? String(url) : null;
  }

  openDocumentPreview(url: string) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private applyVerificationDocuments(raw: unknown) {
    const next: Record<string, { name: string; url?: string }> = {};
    if (Array.isArray(raw)) {
      raw.forEach((item: any) => {
        const id = String(item?.id || '');
        if (!id) return;
        next[id] = {
          name: String(item?.name || 'Uploaded document'),
          url: item?.url ? String(item.url) : undefined,
        };
      });
    } else if (raw && typeof raw === 'object') {
      Object.entries(raw as Record<string, any>).forEach(([id, item]) => {
        if (!id || !item) return;
        next[id] = {
          name: String(item?.name || 'Uploaded document'),
          url: item?.url ? String(item.url) : undefined,
        };
      });
    }
    if (Object.keys(next).length) {
      this.uploadedDocs.set(next);
    }
  }

  allRequiredDocsUploaded(): boolean {
    return this.verDocs()
      .filter((doc) => doc.required)
      .every((doc) => this.isDocUploaded(doc.id));
  }

  private async loadEquipmentCatalog() {
    this.equipmentLoading.set(true);
    try {
      const response = await firstValueFrom(this.venueService.getEquipmentCatalog());
      const items = Array.isArray(response.data) ? response.data : [];
      this.equipmentList.set(items);
      const prices: Record<string, string> = { ...this.equipPrices() };
      items.forEach((item) => {
        if (prices[item.id] === undefined) {
          prices[item.id] = String(item.defaultPricePerHour ?? 0);
        }
      });
      this.equipPrices.set(prices);
    } catch {
      this.equipmentList.set([]);
    } finally {
      this.equipmentLoading.set(false);
    }
  }

  handleNext() {
    this.saveError.set('');
    if (!this.canProceed()) {
      void this.showStepAlert('Please complete the required fields on this step before continuing.');
      return;
    }
    if (this.step() >= this.totalSteps) {
      this.finish();
      return;
    }
    void this.persistProfile(false).then((result) => {
      if (!result.ok) return;
      this.step.update((s) => Math.min(s + 1, this.totalSteps));
      if (this.step() === 8) {
        void this.refreshDocumentEditState();
      }
    });
  }

  async jumpToStep(target: number) {
    if (target === this.step()) return;
    if (target < 1 || target > this.totalSteps) return;

    for (let s = 1; s < target; s++) {
      if (!this.isStepComplete(s)) {
        await this.showStepAlert(
          `Complete “${this.stepTitles[s - 1]}” before opening “${this.stepTitles[target - 1]}”.`,
        );
        return;
      }
    }

    this.saveError.set('');
    this.step.set(target);
    if (target === 8) {
      void this.refreshDocumentEditState();
    }
  }

  /** Local completeness for navigation gates (does not call API). */
  isStepComplete(s: number): boolean {
    return this.canProceedFor(s);
  }

  firstIncompleteStep(): number {
    for (let s = 1; s <= this.totalSteps; s++) {
      if (!this.isStepComplete(s)) return s;
    }
    return 1;
  }

  private async showStepAlert(message: string) {
    const alert = await this.alertCtrl.create({
      header: 'Complete previous step',
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  handleBack() {
    this.saveError.set('');
    if (this.step() === 1) {
      void this.router.navigateByUrl('/app/venue/profile');
    } else {
      this.step.update((s) => Math.max(1, s - 1));
    }
  }

  finish() {
    void this.persistProfile(true).then(async (result) => {
      if (!result.ok) return;
      if (!result.ready) {
        const missing = result.missing.length
          ? `Still missing: ${result.missing.join(', ')}`
          : 'Profile saved but not ready yet.';
        this.saveError.set(missing);
        this.isSuccess.set(false);
        return;
      }

      try {
        this.saving.set(true);
        const submit = await firstValueFrom(this.venueService.submitForApproval());
        if (!submit.success) {
          this.saveError.set(submit.message || 'Unable to submit for approval.');
          return;
        }
        if (submit.data?.user) {
          this.auth.hydrateUser(submit.data.user as any);
        } else {
          await firstValueFrom(this.auth.fetchMe());
        }
        this.accountStatus.set(String(submit.data?.accountStatus || 'pending'));
        this.submittedForApproval.set(true);
        this.isSuccess.set(true);
      } catch (error: any) {
        this.saveError.set(error?.error?.message || 'Unable to submit for approval.');
      } finally {
        this.saving.set(false);
      }
    });
  }

  async goDashboard() {
    this.saveError.set('');
    this.isSuccess.set(false);
    if (this.submittedForApproval() || this.auth.isVenueAwaitingApproval()) {
      void this.router.navigateByUrl('/venue-pending-approval', { replaceUrl: true });
      return;
    }
    void this.router.navigateByUrl('/app/venue/dashboard', { replaceUrl: true });
  }

  private async loadExistingProfile() {
    try {
      const response = await firstValueFrom(this.venueService.getMyProfile());
      if (!response.success || !response.data) return;

      const data = response.data as Record<string, any>;

      const displayName = String(data['displayName'] || data['venueName'] || '').trim();
      const businessName = String(data['businessName'] || '').trim();
      const ownerName = String(data['ownerName'] || '').trim();
      if (displayName) this.venueName = displayName;
      if (businessName) this.bizName = businessName;
      if (ownerName) this.ownerName = ownerName;
      if (data['phone']) this.mobile = String(data['phone']).replace(/\D/g, '').slice(-10);
      if (data['email']) this.email = String(data['email']);

      if (data['address']) this.address = String(data['address']);
      if (data['city']) this.city = String(data['city']);
      if (data['state']) this.stateVal.set(String(data['state']));
      if (data['pincode']) this.pincode = String(data['pincode']).replace(/\D/g, '').slice(0, 6);
      if (data['landmark']) this.landmark = String(data['landmark']);

      if (data['openTime']) this.openTime = this.toInputTime(String(data['openTime']));
      if (data['closeTime']) this.closeTime = this.toInputTime(String(data['closeTime']));
      if (Array.isArray(data['operatingDays']) && data['operatingDays'].length) {
        this.opDays.set(data['operatingDays'].map((d: unknown) => String(d)));
      }

      if (data['ownershipType']) this.ownership.set(String(data['ownershipType']));
      if (data['gstNumber']) this.gstNo = String(data['gstNumber']);
      if (data['panNumber']) this.panNo = String(data['panNumber']);
      if (data['yearEstablished']) this.yearEst = String(data['yearEstablished']);
      if (typeof data['autoConfirm'] === 'boolean') this.autoConfirm.set(!!data['autoConfirm']);
      if (data['slotIntervalMinutes'] != null) {
        this.slotIntervalMinutes.set(Number(data['slotIntervalMinutes']) === 30 ? 30 : 15);
      }

      if (Array.isArray(data['gallery']) && data['gallery'].length) {
        this.uploadedPhotos.set(data['gallery'].map((g: unknown) => String(g)));
      }

      if (data['verificationDocuments']) {
        this.applyVerificationDocuments(data['verificationDocuments']);
      }

      if (Array.isArray(data['requiredDocuments']) && data['requiredDocuments'].length) {
        this.verDocs.set(
          data['requiredDocuments'].map((item: any) => ({
            id: String(item.id),
            label: String(item.label || item.id),
            required: !!item.required,
          })),
        );
      }

      if (Array.isArray(data['editableDocuments'])) {
        this.editableDocuments.set(data['editableDocuments'].map((id: unknown) => String(id)));
      }

      if (data['accountStatus']) {
        this.accountStatus.set(String(data['accountStatus']));
      }

      try {
        const editRes = await firstValueFrom(this.venueService.getDocumentEditRequests());
        const pending = (editRes.data?.requests || [])
          .filter((r) => String(r.status).toLowerCase() === 'pending')
          .map((r) => String(r.docId));
        if (Array.isArray(editRes.data?.editableDocuments)) {
          this.editableDocuments.set(editRes.data!.editableDocuments.map(String));
        }
        const editable = new Set(this.editableDocuments());
        this.pendingEditDocIds.set(pending.filter((id) => !editable.has(id)));
        if (Array.isArray(editRes.data?.requiredDocuments) && editRes.data!.requiredDocuments.length) {
          this.verDocs.set(
            editRes.data!.requiredDocuments.map((item) => ({
              id: item.id,
              label: item.label,
              required: !!item.required,
            })),
          );
        }
      } catch {
        // optional enrichment
      }

      const rental = Array.isArray(data['rentalEquipment']) ? data['rentalEquipment'] : [];
      if (rental.length) {
        const qty: Record<string, number> = { ...this.equipQty() };
        const prices: Record<string, string> = { ...this.equipPrices() };
        rental.forEach((item: any) => {
          const id = String(item?.id || '');
          if (!id) return;
          qty[id] = Number(item?.qty || 0);
          if (item?.price !== undefined && item?.price !== null) {
            prices[id] = String(item.price);
          }
        });
        this.equipQty.set(qty);
        this.equipPrices.set(prices);
      }

      this.refreshMapPreview();

      const courts = Array.isArray(data['courts']) ? data['courts'] : [];
      if (courts.length) {
        this.facilities.set(
          courts.map((court: any, index: number) => {
            const sportId = String(court.sport || 'football').toLowerCase();
            const sportMeta = this.facilitySports.find((s) => s.id === sportId);
            const label = sportMeta?.label || this.titleCase(sportId);
            const meta = (court.meta && typeof court.meta === 'object') ? court.meta : {};
            const cancel = meta['cancellationFee'] ?? meta['cancelFee'];
            return {
              id: String(court.id ?? `court-${index}`),
              name: String(court.courtName || court.name || `${label} Court ${index + 1}`),
              sport: label,
              emoji: sportMeta?.emoji || sportEmoji(sportId),
              indoor: !!court.isIndoor,
              court: String(index + 1),
              status: String(court.status || 'open').toLowerCase() === 'open' ? 'Open' : 'Maintenance',
              photo: String(court.image || court.imageUrl || sportMeta?.photo || FACILITY_SPORTS[0].photo),
              hourlyPrice: court.pricePerHour != null && court.pricePerHour !== '' ? String(court.pricePerHour) : '',
              peakPrice: court.peakPrice != null && court.peakPrice !== '' ? String(court.peakPrice) : '',
              weekendPrice: court.weekendPrice != null && court.weekendPrice !== '' ? String(court.weekendPrice) : '',
              cancelFee: cancel != null && cancel !== '' ? String(cancel) : '',
              meta,
            } satisfies MaintFacility;
          }),
        );

        this.suggestFacilityName();
      }
    } catch {
      // Keep local defaults if profile fetch fails.
    } finally {
      this.applyResumeStep();
    }
  }

  private applyResumeStep() {
    const params = this.route.snapshot.queryParamMap;
    const stepParam = Number(params.get('step') || '');
    if (Number.isFinite(stepParam) && stepParam >= 1 && stepParam <= this.totalSteps) {
      this.step.set(stepParam);
      return;
    }
    if (params.get('resume') === '1' || params.get('resume') === 'true') {
      this.step.set(this.firstIncompleteStep());
    }
  }

  private titleCase(value: string): string {
    return value.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private toInputTime(value: string): string {
    if (/^\d{1,2}:\d{2}$/.test(value)) {
      const [h, m] = value.split(':');
      return `${String(h).padStart(2, '0')}:${m}`;
    }
    const match = value.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return value;
    let hour = Number(match[1]);
    const minutes = match[2];
    const suffix = match[3].toUpperCase();
    if (suffix === 'PM' && hour < 12) hour += 12;
    if (suffix === 'AM' && hour === 12) hour = 0;
    return `${String(hour).padStart(2, '0')}:${minutes}`;
  }

  private async persistProfile(markLive: boolean): Promise<{ ok: boolean; ready: boolean; missing: string[] }> {
    this.saving.set(true);
    this.saveError.set('');
    try {
      const sports = this.facilities().length
        ? Array.from(new Set(this.facilities().map((f) => f.sport.toLowerCase())))
        : (this.auth.user()?.sports || ['football']);

      const courts = this.facilities().map((facility, index) => {
        const numericId = Number(facility.id);
        const cancel = String(facility.cancelFee ?? '').trim();
        return {
          ...(Number.isFinite(numericId) && numericId > 0 ? { id: numericId } : {}),
          name: facility.name,
          sport: facility.sport.toLowerCase(),
          isIndoor: facility.indoor,
          pricePerHour: Number(facility.hourlyPrice || 0),
          peakPrice: String(facility.peakPrice ?? '').trim() !== '' ? Number(facility.peakPrice) : null,
          weekendPrice: String(facility.weekendPrice ?? '').trim() !== '' ? Number(facility.weekendPrice) : null,
          hasRentalGear: Object.values(this.equipQty()).some((qty) => qty > 0),
          imageUrl: facility.photo || null,
          status: facility.status.toLowerCase() === 'open' ? 'open' : 'maintenance',
          sortOrder: index,
          meta: {
            ...(facility.meta || {}),
            cancellationFee: cancel !== '' ? Number(cancel) : null,
          },
        };
      });

      // Only invent a placeholder court on final go-live — never during Save & Continue.
      if (!courts.length && markLive) {
        courts.push({
          name: `${this.venueName || 'Main'} Court 1`,
          sport: sports[0] || 'football',
          isIndoor: false,
          pricePerHour: 0,
          peakPrice: null,
          weekendPrice: null,
          hasRentalGear: false,
          imageUrl: null,
          status: 'open',
          sortOrder: 0,
          meta: { cancellationFee: null },
        });
      }

      const galleryUrls = this.uploadedPhotos()
        .map((p) => String(p).trim())
        .filter((p) => /^https?:\/\//i.test(p) || p.startsWith('/') || p.includes('storage/'));

      const response = await firstValueFrom(this.venueService.updateMyProfile({
        name: this.venueName.trim(),
        displayName: this.venueName.trim(),
        venueName: this.venueName.trim(),
        businessName: this.bizName.trim(),
        ownerName: this.ownerName.trim(),
        phone: (() => {
          const digits = this.mobile.replace(/\D/g, '').slice(-10);
          return digits.length === 10 ? digits : undefined;
        })(),
        email: this.email || null,
        location: [this.address, this.city].filter(Boolean).join(', '),
        city: this.city,
        state: this.stateVal(),
        pincode: String(this.pincode ?? '').replace(/\D/g, '').slice(0, 6) || null,
        address: this.address,
        landmark: this.landmark,
        openTime: this.toDisplayTime(this.openTime),
        closeTime: this.toDisplayTime(this.closeTime),
        slotIntervalMinutes: this.slotIntervalMinutes(),
        operatingDays: this.opDays(),
        // Only send gallery when we have URLs — empty array was wiping uploaded photos.
        ...(galleryUrls.length ? { gallery: galleryUrls } : {}),
        rentalEquipment: this.equipmentList()
          .filter((item) => (this.equipQty()[item.id] || 0) > 0)
          .map((item) => ({
            id: item.id,
            label: item.label || item.name,
            emoji: item.emoji,
            qty: this.equipQty()[item.id] || 0,
            price: Number(this.equipPrices()[item.id] || item.defaultPricePerHour || 0),
          })),
        verificationDocuments: Object.entries(this.uploadedDocs()).reduce(
          (acc, [id, doc]) => {
            if (!doc?.name && !doc?.url) return acc;
            acc[id] = {
              id,
              name: doc.name,
              url: doc.url || undefined,
            };
            return acc;
          },
          {} as Record<string, { id: string; name: string; url?: string }>,
        ),
        ownershipType: this.ownership(),
        gstNumber: this.gstNo || null,
        panNumber: this.panNo || null,
        yearEstablished: this.yearEst ? Number(this.yearEst) : null,
        autoConfirm: this.autoConfirm(),
        sports,
        venueType: 'multi',
        ...(courts.length ? { courts } : {}),
      }));

      if (!response.success) {
        this.saveError.set(response.message || 'Unable to save venue profile.');
        return { ok: false, ready: false, missing: [] };
      }

      const completion = (response.data as any)?.completion as {
        ready?: boolean;
        missing?: string[];
        checklist?: Array<{ id?: string; label?: string; done?: boolean }>;
      } | undefined;

      // Verification is optional (wizard no longer requires it).
      // Filter so older APIs don't block "Go Live" on removed Amenities.
      const optionalLabels = new Set(['amenities', 'verification']);
      const missing = (Array.isArray(completion?.missing) ? completion!.missing : [])
        .map((m) => String(m))
        .filter((label) => !optionalLabels.has(label.trim().toLowerCase()));

      let ready = !!completion?.ready;
      if (!ready && missing.length === 0) {
        ready = true;
      }
      // If API still returns old missing list only for optional items, treat as ready.
      if (!ready && Array.isArray(completion?.checklist)) {
        const requiredIds = new Set(['info', 'sports', 'photos', 'pricing']);
        ready = completion!.checklist
          .filter((item) => requiredIds.has(String(item.id || '')))
          .every((item) => !!item.done);
      }

      await firstValueFrom(this.auth.fetchMe());
      if (markLive) {
        await firstValueFrom(this.auth.completeOnboarding({
          name: this.venueName.trim() || 'Venue',
          sports,
          venueType: 'multi',
        }));
      }

      // Re-check after /me + onboarding so auth flag matches backend.
      const me = this.auth.user();
      if (me?.venueProfileReady === true) {
        ready = true;
      } else if (ready) {
        // Optimistic: local readiness passed even if remote /me still lagging.
        ready = true;
      } else if (me?.venueProfileReady === false) {
        ready = false;
      }

      return { ok: true, ready, missing };
    } catch (error: any) {
      this.saveError.set(error?.error?.message || 'Unable to save venue profile.');
      return { ok: false, ready: false, missing: [] };
    } finally {
      this.saving.set(false);
    }
  }

  private toDisplayTime(value: string): string {
    if (!value) return '6:00 AM';
    if (value.includes('AM') || value.includes('PM')) return value;
    const [h = '0', m = '00'] = value.split(':');
    const hour = Number(h);
    const suffix = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m} ${suffix}`;
  }
}
