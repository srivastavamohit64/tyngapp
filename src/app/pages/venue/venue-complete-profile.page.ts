import { CommonModule } from '@angular/common';
import { Component, signal, inject, ElementRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ActionSheetController, AlertController, IonicModule, ViewWillEnter } from '@ionic/angular';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { MediaPermissionService } from '../../core/services/media-permission.service';
import { VenueService, SportsEquipmentItem } from '../../core/services/venue.service';
import { fetchWebPathAsImageFile, normalizeImageFile } from '../../core/utils/image-file.util';
import { LocationFieldComponent } from '../../shared/components/location-field/location-field.component';
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
}

const OWNERSHIP_TYPES = ['Private', 'Academy', 'Corporate', 'Government', 'School', 'Society', 'Other'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const STATES = ['Uttar Pradesh', 'Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Rajasthan', 'Other'];

const VERIFICATION_DOCS = [
  { id: 'biz', label: 'Business Registration', required: true },
  { id: 'gst', label: 'GST Certificate', required: true },
  { id: 'pan', label: 'PAN Card', required: true },
  { id: 'cheque', label: 'Cancelled Cheque', required: true },
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

const TOTAL_STEPS = 7;

const STEP_TITLES = [
  'Business details',
  'Location & hours',
  'Facilities',
  'Pricing & booking',
  'Equipment',
  'Photos',
  'Documents',
];

@Component({
  selector: 'app-venue-complete-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, LocationFieldComponent],
  template: `
    <ion-content [fullscreen]="true">
      <!-- SUCCESS SCREEN -->
      <div *ngIf="isSuccess()" class="success-screen flex flex-col items-center justify-center px-6 text-center pb-12">
        <div class="w-28 h-28 rounded-full bg-[var(--app-primary)] flex items-center justify-center mx-auto mb-5 shadow-lg"
          style="box-shadow: 0 8px 36px rgba(var(--app-primary-rgb),0.45);">
          <ion-icon name="checkmark-outline" class="text-5xl text-[#111827] font-black"></ion-icon>
        </div>
        <h1 class="text-[28px] font-black text-[#111827] mb-2 m-0 leading-none">Your Venue is Live! 🎉</h1>
        <p class="text-[14px] text-[#9CA3AF] mb-6 font-bold">Phoenix Arena is now active on TYNG.</p>

        <div class="w-full max-w-sm bg-white rounded-[24px] p-5 mb-6 text-left border border-[#F3F4F6] shadow-sm">
          <div *ngFor="let item of ['Venue Published', 'Search Listing Active', 'Online Booking Enabled', 'Payments Activated', 'QR Entry Enabled', 'Analytics Started']"
            class="flex items-center gap-3 py-2.5 border-b border-[#F9FAFB] last:border-0">
            <div class="w-5 h-5 rounded-full bg-[var(--app-primary)] flex items-center justify-center flex-shrink-0">
              <ion-icon name="checkmark-outline" class="text-xs text-[#111827] font-black"></ion-icon>
            </div>
            <span class="text-[13px] font-black text-[#111827]">{{ item }}</span>
          </div>
        </div>

        <div class="w-full max-w-sm space-y-3">
          <button (click)="goDashboard()" class="w-full h-14 rounded-[24px] text-[16px] font-black text-white border-none shadow-md btn-orange-gradient">
            Go to Dashboard
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

          <!-- Progress dots indicator -->
          <div class="flex items-center justify-center gap-0.5 pb-4 pt-2">
            <div *ngFor="let s of stepNumbers" class="flex items-center">
              <div class="h-1.5 rounded-full transition-all duration-200"
                [style.width]="step() === s ? '16px' : '6px'"
                [style.backgroundColor]="step() > s ? '#FF7A00' : step() === s ? 'var(--app-primary)' : '#E5E7EB'">
              </div>
              <div *ngIf="s < totalSteps" class="w-1 h-px mx-0.5"
                [style.backgroundColor]="step() > s ? '#FF7A00' : '#E5E7EB'">
              </div>
            </div>
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

          <!-- STEP 2: VENUE INFORMATION -->
          <div *ngIf="step() === 2" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Venue Information</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Location and operating hours</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div class="complete-profile-address-field-wrap">
                <app-location-field
                  label="Full Address *"
                  placeholder="Street address"
                  [(ngModel)]="address"
                  (ngModelChange)="onLocationFieldsChanged()"
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
            </div>
          </div>

          <!-- STEP 3: FACILITIES -->
          <div *ngIf="step() === 3" class="space-y-5">
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
              <div *ngFor="let f of facilities(); let idx = index" class="bg-white rounded-[22px] overflow-hidden border border-[#F3F4F6] shadow-sm text-left">
                <div class="relative h-[100px] bg-slate-200">
                  <img [src]="f.photo" class="w-full h-full object-cover" [alt]="f.name" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  <button type="button" class="remove-facility" (click)="removeFacility(idx)" aria-label="Remove facility">
                    <ion-icon name="trash-outline"></ion-icon>
                  </button>
                  <span class="absolute top-2.5 right-12 text-[9px] font-black px-2 py-0.5 rounded-full uppercase"
                    [style.backgroundColor]="f.status === 'Open' ? '#F0FDF4' : '#FEF2F2'"
                    [style.color]="f.status === 'Open' ? '#16A34A' : '#DC2626'">
                    {{ f.status }}
                  </span>
                  <div class="absolute bottom-2.5 left-3 right-3">
                    <span class="text-lg">{{ f.emoji }}</span>
                    <p class="text-white font-black text-[14px] m-0 mt-0.5">{{ f.name }}</p>
                    <p class="text-white/70 text-[10px] m-0 mt-0.5 font-bold">
                      {{ f.sport }} · {{ f.indoor ? 'Indoor' : 'Outdoor' }}
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

          <!-- STEP 4: PRICING + BOOKING SETTINGS -->
          <div *ngIf="step() === 4" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Pricing & Booking</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Hourly charge, discounts, and booking automation</p>
            </div>
            <div class="bg-white rounded-[24px] p-5 space-y-4 border border-[#F3F4F6] shadow-sm">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Hourly Charge (₹) *</p>
                  <input type="number" [(ngModel)]="hourlyPrice" placeholder="e.g. 800" class="form-input" />
                </div>
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Peak Hours Price (₹)</p>
                  <input type="number" [(ngModel)]="peakPrice" placeholder="e.g. 1200" class="form-input" />
                </div>
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Weekend Price (₹)</p>
                  <input type="number" [(ngModel)]="weekendPrice" placeholder="e.g. 2000" class="form-input" />
                </div>
                <div>
                  <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-semibold mb-1.5 m-0">Cancellation Fee (₹)</p>
                  <input type="number" [(ngModel)]="cancelFee" placeholder="e.g. 400" class="form-input" />
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

          <!-- STEP 5: EQUIPMENT (admin catalog) -->
          <div *ngIf="step() === 5" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Sports Equipment</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Choose rentals from the admin catalog and set quantities</p>
            </div>
            <div *ngIf="equipmentLoading()" class="empty-facilities">
              <p class="text-[13px] font-bold text-[#9CA3AF] m-0">Loading equipment…</p>
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

          <!-- STEP 6: GALLERY -->
          <div *ngIf="step() === 6" class="space-y-5">
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

          <!-- STEP 7: VERIFICATION -->
          <div *ngIf="step() === 7" class="space-y-5">
            <div>
              <h2 class="text-[20px] font-black text-[#111827] m-0">Documents & Verification</h2>
              <p class="text-[13px] text-[#9CA3AF] m-0 mt-0.5">Upload all required documents, then go live</p>
            </div>
            <div class="space-y-3">
              <label
                *ngFor="let doc of verDocs"
                class="doc-row w-full flex items-center gap-3 px-4 py-4 rounded-[20px] transition-all text-left border cursor-pointer"
                [class.doc-row--uploaded]="isDocUploaded(doc.id)"
                [class.opacity-60]="docUploading() === doc.id"
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
                    <span *ngIf="isDocUploaded(doc.id)" class="uploaded-badge">Uploaded</span>
                  </div>
                  <p class="text-[11px] m-0 mt-0.5 font-bold"
                    [style.color]="isDocUploaded(doc.id) ? '#16A34A' : '#9CA3AF'">
                    {{ docUploading() === doc.id
                      ? 'Uploading…'
                      : (isDocUploaded(doc.id) ? ('✓ ' + (docFileName(doc.id) || 'Uploaded successfully')) : 'Tap to upload PDF/Image') }}
                  </p>
                  <button
                    *ngIf="docPreviewUrl(doc.id) as previewUrl"
                    type="button"
                    class="doc-preview-btn"
                    (click)="$event.preventDefault(); $event.stopPropagation(); openDocumentPreview(previewUrl)"
                  >
                    Preview document
                  </button>
                </div>
                <ion-icon
                  name="cloud-upload-outline"
                  class="flex-shrink-0 text-xl"
                  [class.cloud-active]="isDocUploaded(doc.id)"
                  [class.cloud-idle]="!isDocUploaded(doc.id)"
                ></ion-icon>
                <input
                  type="file"
                  accept="image/*,application/pdf,.pdf"
                  hidden
                  [disabled]="docUploading() !== null"
                  (change)="onDocumentSelected(doc.id, $event)"
                />
              </label>
            </div>
            <p *ngIf="!allRequiredDocsUploaded()" class="text-[12px] font-bold text-[#9CA3AF] m-0 text-center">
              Upload every required document (*) to enable Save & Go Live
            </p>
          </div>
        </div>
      </div>

      <!-- STICKY ACTION BUTTON BAR -->
      <div *ngIf="!isSuccess()" class="venue-safe-footer fixed bottom-0 left-0 right-0 z-30 bg-white px-5 pt-3"
        style="box-shadow: 0 -4px 24px rgba(0,0,0,0.09); border-top: 1px solid #F3F4F6;">
        <div class="flex gap-3 max-w-md mx-auto">
          <button (click)="handleNext()" [disabled]="!canProceed() || saving()"
            class="w-full h-13 rounded-[24px] text-[15px] font-black border-none text-[#111827] transition-all"
            [style.background]="canProceed() && !saving() ? 'linear-gradient(135deg,var(--app-primary),var(--app-primary-to))' : '#F3F4F6'"
            [style.color]="canProceed() && !saving() ? '#111827' : '#C4C9D4'"
            [style.boxShadow]="canProceed() && !saving() ? '0 4px 18px rgba(var(--app-primary-rgb),0.38)' : 'none'"
            [style.opacity]="canProceed() && !saving() ? '1' : '0.6'">
            {{ saving() ? 'Saving…' : (step() === totalSteps ? 'Save & Go Live' : 'Continue →') }}
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

    .complete-profile-page {
      padding-bottom: calc(120px + env(safe-area-inset-bottom, 0px));
    }

    .success-screen {
      padding-top: env(safe-area-inset-top, 0px);
      padding-bottom: calc(48px + env(safe-area-inset-bottom, 0px));
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      padding-top: env(safe-area-inset-top, 0px);
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
      width: 30px;
      height: 30px;
      border-radius: 999px;
      border: none;
      background: rgba(0,0,0,0.55);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
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
  private readonly auth = inject(AuthService);
  private readonly venueService = inject(VenueService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly alertCtrl = inject(AlertController);
  private readonly mediaPermissions = inject(MediaPermissionService);

  readonly totalSteps = TOTAL_STEPS;
  readonly stepNumbers = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);
  readonly stepTitles = STEP_TITLES;

  readonly ownershipTypes = OWNERSHIP_TYPES;
  readonly days = DAYS;
  readonly states = STATES;
  readonly verDocs = VERIFICATION_DOCS;
  readonly facilitySports = FACILITY_SPORTS;

  step = signal(1);
  isSuccess = signal(false);
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

  // Pricing
  hourlyPrice = '';
  peakPrice = '';
  weekendPrice = '';
  cancelFee = '';
  coachDisc = '';
  academyDisc = '';
  corpDisc = '';

  autoConfirm = signal(true);

  equipQty = signal<Record<string, number>>({});
  equipPrices = signal<Record<string, string>>({});

  uploadedPhotos = signal<string[]>([]);

  uploadedDocs = signal<Record<string, { name: string; url?: string }>>({});
  docUploading = signal<string | null>(null);

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
      this.venueName = user.name || '';
      this.bizName = user.name || '';
      this.ownerName = user.name || '';
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
  }

  onLocationFieldsChanged() {
    if (this.mapRefreshTimer) clearTimeout(this.mapRefreshTimer);
    this.mapRefreshTimer = setTimeout(() => this.refreshMapPreview(), 450);
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
    const s = this.step();
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
      return this.address.trim() !== '' && this.city.trim() !== '' && pin.length === 6;
    }
    if (s === 3) {
      return this.facilities().length > 0;
    }
    if (s === 4) {
      return String(this.hourlyPrice ?? '').trim() !== '';
    }
    if (s === 7) {
      return this.allRequiredDocsUploaded();
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
      },
    ]);
    this.newFacilityIndoor = false;
    this.suggestFacilityName();
  }

  removeFacility(index: number) {
    this.facilities.update((list) => list.filter((_, i) => i !== index));
    this.suggestFacilityName();
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
    const allowed = await this.mediaPermissions.ensureCamera();
    if (!allowed) {
      await this.showMediaPermissionDenied('Camera access is required to take venue photos. Enable it in App settings.');
      return;
    }

    if (Capacitor.isNativePlatform()) {
      try {
        const photo = await Camera.getPhoto({
          quality: 85,
          resultType: CameraResultType.Uri,
          source: CameraSource.Camera,
          correctOrientation: true,
          saveToGallery: false,
        });
        if (!photo.webPath) {
          this.saveError.set('Camera did not return an image. Please try again.');
          return;
        }
        const file = await fetchWebPathAsImageFile(photo.webPath, 'venue-camera');
        await this.uploadNormalizedGallery([file]);
        return;
      } catch (error: unknown) {
        const message = String((error as { message?: string })?.message || error || '');
        if (/cancel/i.test(message)) return;
        console.warn('Capacitor camera failed, falling back to file input', error);
      }
    }

    this.galleryCameraInput?.nativeElement.click();
  }

  private async openGalleryLibrary() {
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

  async onDocumentSelected(docId: string, event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

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
    return this.verDocs
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
    if (this.step() < this.totalSteps) {
      this.step.update((s) => Math.min(s + 1, this.totalSteps));
      return;
    }
    this.finish();
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
    void this.persistProfile(true).then((result) => {
      if (!result.ok) return;
      if (result.ready) {
        this.isSuccess.set(true);
        return;
      }
      const missing = result.missing.length
        ? `Still missing: ${result.missing.join(', ')}`
        : 'Profile saved but not ready for listing yet.';
      this.saveError.set(missing);
      this.isSuccess.set(false);
    });
  }

  async goDashboard() {
    this.saveError.set('');
    this.isSuccess.set(false);
    void this.router.navigateByUrl('/app/venue/dashboard', { replaceUrl: true });
  }

  private async loadExistingProfile() {
    try {
      const response = await firstValueFrom(this.venueService.getMyProfile());
      if (!response.success || !response.data) return;

      const data = response.data as Record<string, any>;

      if (data['venueName'] || data['displayName'] || data['name']) {
        this.venueName = String(data['venueName'] || data['displayName'] || data['name']);
      }
      if (data['businessName']) this.bizName = String(data['businessName']);
      else if (data['name'] && !this.bizName) this.bizName = String(data['name']);

      if (data['ownerName']) this.ownerName = String(data['ownerName']);
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

      if (Array.isArray(data['gallery']) && data['gallery'].length) {
        this.uploadedPhotos.set(data['gallery'].map((g: unknown) => String(g)));
      }

      if (data['verificationDocuments']) {
        this.applyVerificationDocuments(data['verificationDocuments']);
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
            return {
              id: String(court.id ?? `court-${index}`),
              name: String(court.courtName || court.name || `${label} Court ${index + 1}`),
              sport: label,
              emoji: sportMeta?.emoji || sportEmoji(sportId),
              indoor: !!court.isIndoor,
              court: String(index + 1),
              status: String(court.status || 'open').toLowerCase() === 'open' ? 'Open' : 'Maintenance',
              photo: String(court.image || court.imageUrl || sportMeta?.photo || FACILITY_SPORTS[0].photo),
            } satisfies MaintFacility;
          }),
        );

        const first = courts[0];
        if (first?.pricePerHour != null && first.pricePerHour !== '') {
          this.hourlyPrice = String(first.pricePerHour);
        }
        if (first?.peakPrice != null && first.peakPrice !== '') {
          this.peakPrice = String(first.peakPrice);
        }
        if (first?.weekendPrice != null && first.weekendPrice !== '') {
          this.weekendPrice = String(first.weekendPrice);
        }
        this.suggestFacilityName();
      }
    } catch {
      // Keep local defaults if profile fetch fails.
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
        return {
          ...(Number.isFinite(numericId) && numericId > 0 ? { id: numericId } : {}),
          name: facility.name,
          sport: facility.sport.toLowerCase(),
          isIndoor: facility.indoor,
          pricePerHour: Number(this.hourlyPrice || 0),
          peakPrice: this.peakPrice !== '' ? Number(this.peakPrice) : null,
          weekendPrice: this.weekendPrice !== '' ? Number(this.weekendPrice) : null,
          hasRentalGear: Object.values(this.equipQty()).some((qty) => qty > 0),
          imageUrl: facility.photo || null,
          status: facility.status.toLowerCase() === 'open' ? 'open' : 'maintenance',
          sortOrder: index,
        };
      });

      if (!courts.length) {
        courts.push({
          name: `${this.venueName || 'Main'} Court 1`,
          sport: sports[0] || 'football',
          isIndoor: false,
          pricePerHour: Number(this.hourlyPrice || 0),
          peakPrice: this.peakPrice !== '' ? Number(this.peakPrice) : null,
          weekendPrice: this.weekendPrice !== '' ? Number(this.weekendPrice) : null,
          hasRentalGear: false,
          imageUrl: null,
          status: 'open',
          sortOrder: 0,
        });
      }

      const galleryUrls = this.uploadedPhotos()
        .map((p) => String(p).trim())
        .filter((p) => /^https?:\/\//i.test(p) || p.startsWith('/') || p.includes('storage/'));

      const response = await firstValueFrom(this.venueService.updateMyProfile({
        name: this.venueName || this.ownerName || this.auth.user()?.name,
        displayName: this.venueName || this.bizName,
        venueName: this.venueName,
        businessName: this.bizName,
        ownerName: this.ownerName,
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
        courts,
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
          name: this.venueName || this.ownerName || 'Venue Owner',
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
