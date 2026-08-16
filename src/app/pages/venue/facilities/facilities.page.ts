import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { NativeMediaPickerService } from '../../../core/services/native-media-picker.service';
import { VenueService } from '../../../core/services/venue.service';
import { normalizeImageFile } from '../../../core/utils/image-file.util';

interface MaintFacility {
  id: string;
  name: string;
  sport: string;
  emoji: string;
  status: string;
  photo: string;
  pricePerHour?: number;
  hasActiveBookings?: boolean;
  activeBookingCount?: number;
}

interface StatusOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

const SURFACES = ['Artificial Turf', 'Natural Grass', 'Wooden Court', 'Synthetic Court', 'Clay', 'Concrete'];

const AMENITY_OPTIONS = [
  'Changing Rooms', 'Washrooms', 'Drinking Water', 'Floodlights', 'Parking', 'CCTV',
  'Accessible Washroom', 'Showers', 'Lockers', 'Water Dispenser', 'First Aid Kit', 'Medical Room',
  'Air Conditioning', 'Spectator Seating', 'Wi-Fi', 'Charging Station', 'Scoreboard', 'Music System',
  'Cafeteria', 'Pro Shop', 'Wheelchair Accessible',
];

const DEFAULT_RULES = [
  'Sports shoes mandatory inside the turf',
  'No outside food or drinks',
  'Maximum 22 players at a time',
  'No smoking on premises',
  'Respect all equipment',
];

const STATUS_OPTIONS: StatusOption[] = [
  { id: 'open', label: 'Open', emoji: '🟢', color: '#22C55E', bg: '#F0FDF4' },
  { id: 'maintenance', label: 'Maintenance', emoji: '🟡', color: '#D97706', bg: '#FFFBEB' },
  { id: 'closed', label: 'Closed', emoji: '🔴', color: '#DC2626', bg: '#FEF2F2' },
  { id: 'reserved', label: 'Reserved', emoji: '🟠', color: '#C2410C', bg: '#FFF7ED' },
];

@Component({
  selector: 'app-venue-facilities-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <div class="fac-page" [class.has-save]="hasChanges() || saved()">
        <header class="sticky-header fac-header">
          <button type="button" class="fac-icon-btn" (click)="goBack()" aria-label="Back">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <div class="fac-header-copy">
            <h1>Facilities & Amenities</h1>
            <p>{{ facilityList().length }} court{{ facilityList().length === 1 ? '' : 's' }}</p>
          </div>
          <button type="button" class="fac-icon-btn fac-icon-btn--add" (click)="addFacility()" aria-label="Add facility">
            <ion-icon name="add-outline"></ion-icon>
          </button>
        </header>

        <div class="fac-track no-scrollbar" *ngIf="!loading() && facilityList().length">
          <button
            type="button"
            class="fac-chip"
            *ngFor="let f of facilityList()"
            [class.is-selected]="selectedId() === f.id"
            (click)="selectFacility(f.id)"
          >
            <div class="fac-chip-media">
              <img [src]="f.photo" [alt]="f.name" />
              <span class="fac-chip-name">{{ f.emoji }} {{ f.name }}</span>
            </div>
            <div class="fac-chip-meta">
              <span class="fac-chip-sport">{{ f.sport }}</span>
              <span class="fac-chip-price" *ngIf="f.pricePerHour">₹{{ f.pricePerHour }}</span>
              <span class="fac-chip-status" [style.background]="getStatusStyle(f.status).bg" [style.color]="getStatusStyle(f.status).color">
                {{ f.status }}
              </span>
            </div>
          </button>
        </div>

        <div class="fac-body">
          <p *ngIf="loading()" class="fac-muted">Loading facilities…</p>

          <div *ngIf="saveError()" class="fac-alert fac-alert--error">{{ saveError() }}</div>
          <div *ngIf="saved()" class="fac-alert fac-alert--ok">Facility saved.</div>

          <div *ngIf="!loading() && facilityList().length === 0" class="fac-card fac-empty">
            <p>No facilities yet</p>
            <span>Add your first court so players can book it.</span>
            <button type="button" class="fac-primary" (click)="addFacility()">Add facility</button>
          </div>

          <ng-container *ngIf="!loading() && (facilityList().length || selectedId())">
            <section class="fac-card">
              <h2>Facility information</h2>
              <label class="fac-label">Facility name *</label>
              <input [(ngModel)]="facilityName" (ngModelChange)="onChange()" placeholder="Enter facility name" class="fac-input" />

              <label class="fac-label">Sport *</label>
              <input [(ngModel)]="sport" (ngModelChange)="onChange()" placeholder="Enter sport type" class="fac-input" />

              <div class="fac-grid">
                <div>
                  <label class="fac-label">Court number</label>
                  <input [(ngModel)]="courtNumber" (ngModelChange)="onChange()" placeholder="e.g. 1" class="fac-input" />
                </div>
                <div>
                  <label class="fac-label">Type</label>
                  <div class="fac-pills">
                    <button type="button" *ngFor="let t of ['Indoor', 'Outdoor']" class="fac-pill" [class.is-on]="isIndoor() === (t === 'Indoor')" (click)="isIndoor.set(t === 'Indoor'); onChange()">
                      {{ t }}
                    </button>
                  </div>
                </div>
              </div>

              <label class="fac-label">Playing surface</label>
              <div class="fac-pills fac-pills--wrap">
                <button type="button" *ngFor="let s of surfaces" class="fac-pill" [class.is-on]="surface() === s" (click)="surface.set(s); onChange()">
                  {{ s }}
                </button>
              </div>

              <div class="fac-grid">
                <div>
                  <label class="fac-label">Dimensions</label>
                  <input [(ngModel)]="dimensions" (ngModelChange)="onChange()" placeholder="e.g. 40 × 20 m" class="fac-input" />
                </div>
                <div>
                  <label class="fac-label">Max capacity *</label>
                  <input type="number" [(ngModel)]="capacity" (ngModelChange)="onChange()" placeholder="22" class="fac-input" />
                </div>
              </div>
            </section>

            <section class="fac-card">
              <h2>Facility photos</h2>
              <p class="fac-sub">Cover photo replaces the default image at the top and on every venue / turf listing.</p>
              <p class="fac-label">Cover image</p>
              <button type="button" class="photo-cover" [disabled]="photoBusy()" (click)="pickPhoto('cover')">
                <img *ngIf="coverUrl()" [src]="coverUrl()!" alt="Cover" />
                <div *ngIf="!coverUrl()" class="photo-empty">
                  <ion-icon name="camera-outline"></ion-icon>
                  <span>Upload cover image</span>
                </div>
                <span *ngIf="coverUrl()" class="photo-change">Change</span>
              </button>
              <p class="fac-label">Gallery images</p>
              <div class="photo-grid">
                <button type="button" class="photo-tile" *ngFor="let url of galleryUrls(); let i = index" (click)="pickPhoto('gallery')">
                  <img [src]="url" [alt]="'Gallery ' + (i + 1)" />
                </button>
                <button type="button" class="photo-tile photo-tile--add" *ngFor="let _ of gallerySlots()" [disabled]="photoBusy()" (click)="pickPhoto('gallery')">
                  <span>+</span>
                </button>
                <button type="button" class="photo-tile photo-tile--add" [disabled]="photoBusy()" (click)="pickPhoto('pano')">
                  <img *ngIf="panoUrl()" [src]="panoUrl()!" alt="360" />
                  <div *ngIf="!panoUrl()" class="pano-empty">
                    <span>⚡</span>
                    <strong>360°</strong>
                  </div>
                </button>
              </div>
              <p class="fac-hint" *ngIf="photoBusy()">Uploading photo…</p>
            </section>

            <section class="fac-card">
              <h2>Amenities</h2>
              <p class="fac-sub">Select all that apply to this facility</p>
              <div class="amenity-wrap">
                <button
                  type="button"
                  class="amenity-pill"
                  *ngFor="let a of amenityOptions"
                  [class.is-on]="isAmenityOn(a)"
                  (click)="toggleAmenity(a)"
                >
                  <span *ngIf="isAmenityOn(a)">✓</span>{{ a }}
                </button>
              </div>
            </section>

            <section class="fac-card">
              <div class="fac-card-head">
                <h2>Pricing for this facility</h2>
                <span class="fac-lock" *ngIf="priceLocked()">Locked</span>
              </div>
              <p class="fac-hint" *ngIf="!priceLocked()">Hourly rate is unique to this turf or court.</p>
              <div class="fac-alert fac-alert--warn" *ngIf="priceLocked()">
                Price cannot be edited while this facility has {{ activeBookingCount() }} active booking{{ activeBookingCount() === 1 ? '' : 's' }}. Finish or cancel those bookings first.
              </div>
              <div class="fac-grid" [class.is-locked]="priceLocked()">
                <div>
                  <label class="fac-label">Hourly charge (₹) *</label>
                  <input type="number" [(ngModel)]="pricePerHour" (ngModelChange)="onPriceChange()" [disabled]="priceLocked()" placeholder="800" class="fac-input" />
                </div>
                <div>
                  <label class="fac-label">Peak hours (₹)</label>
                  <input type="number" [(ngModel)]="peakPrice" (ngModelChange)="onPriceChange()" [disabled]="priceLocked()" placeholder="1200" class="fac-input" />
                </div>
                <div>
                  <label class="fac-label">Weekend (₹)</label>
                  <input type="number" [(ngModel)]="weekendPrice" (ngModelChange)="onPriceChange()" [disabled]="priceLocked()" placeholder="2000" class="fac-input" />
                </div>
                <div>
                  <label class="fac-label">Cancellation fee (₹)</label>
                  <input type="number" [(ngModel)]="cancelFee" (ngModelChange)="onPriceChange()" [disabled]="priceLocked()" placeholder="400" class="fac-input" />
                </div>
              </div>
            </section>

            <section class="fac-card">
              <h2>Facility status</h2>
              <div class="fac-status-grid">
                <button type="button" *ngFor="let opt of statusOptions" class="fac-status" [class.is-on]="status() === opt.id" [style.background]="status() === opt.id ? opt.bg : '#F9FAFB'" (click)="status.set(opt.id); onChange()">
                  <span>{{ opt.emoji }}</span>
                  <strong>{{ opt.label }}</strong>
                </button>
              </div>
              <p class="fac-hint" *ngIf="status() === 'maintenance' || status() === 'closed'">Maintenance or closed courts will not accept new bookings.</p>
            </section>

            <section class="fac-card">
              <h2>Equipment available</h2>
              <div class="fac-equip" *ngFor="let eq of equipmentOptions()">
                <div class="fac-equip-ico">{{ eq.emoji }}</div>
                <div class="fac-equip-copy">
                  <p>{{ eq.label }}</p>
                  <input *ngIf="getEquipQty(eq.id) > 0" [(ngModel)]="rentalPrices[eq.id]" (ngModelChange)="onChange()" placeholder="₹ Rental price" class="fac-input fac-input--sm" />
                </div>
                <div class="fac-stepper">
                  <button type="button" (click)="decQty(eq.id)" aria-label="Decrease">−</button>
                  <strong>{{ getEquipQty(eq.id) }}</strong>
                  <button type="button" class="is-add" (click)="incQty(eq.id)" aria-label="Increase">+</button>
                </div>
              </div>
            </section>

            <section class="fac-card">
              <h2>Cleaning & maintenance</h2>
              <div class="fac-grid">
                <div>
                  <label class="fac-label">Last cleaned</label>
                  <input type="date" [(ngModel)]="lastCleaned" (ngModelChange)="onChange()" class="fac-input" />
                </div>
                <div>
                  <label class="fac-label">Next cleaning</label>
                  <input type="date" [(ngModel)]="nextCleaning" (ngModelChange)="onChange()" class="fac-input" />
                </div>
              </div>
              <label class="fac-label">Notes</label>
              <textarea [(ngModel)]="maintNotes" (ngModelChange)="onChange()" rows="2" placeholder="Issues, upcoming work, or special notes" class="fac-input fac-textarea"></textarea>
            </section>

            <section class="fac-card">
              <h2>Turf supervisor</h2>
              <p class="fac-label">Supervisor photo</p>
              <div class="sup-photo-row">
                <div class="sup-photo-wrap">
                  <button type="button" class="sup-photo" [disabled]="photoBusy()" (click)="pickPhoto('supervisor')">
                    <img *ngIf="supPhoto" [src]="supPhoto" alt="Supervisor" />
                    <ion-icon *ngIf="!supPhoto" name="camera-outline"></ion-icon>
                  </button>
                  <span class="sup-plus" aria-hidden="true">+</span>
                </div>
                <div class="sup-photo-actions">
                  <button type="button" class="sup-btn sup-btn--upload" [disabled]="photoBusy()" (click)="pickPhoto('supervisor', 'library')">Upload</button>
                  <button type="button" class="sup-btn sup-btn--camera" [disabled]="photoBusy()" (click)="pickPhoto('supervisor', 'camera')">Take Photo</button>
                </div>
              </div>
              <label class="fac-label">Full name *</label>
              <input [(ngModel)]="supName" (ngModelChange)="onChange()" placeholder="Supervisor name" class="fac-input" />
              <label class="fac-label">Designation</label>
              <input [(ngModel)]="supRole" (ngModelChange)="onChange()" placeholder="e.g. Ground Supervisor" class="fac-input" />
              <div class="fac-grid">
                <div>
                  <label class="fac-label">Mobile *</label>
                  <input [(ngModel)]="supPhone" (ngModelChange)="onChange()" placeholder="10-digit number" class="fac-input" />
                </div>
                <div>
                  <label class="fac-label">Alternate</label>
                  <input [(ngModel)]="supAlt" (ngModelChange)="onChange()" placeholder="Optional" class="fac-input" />
                </div>
              </div>
              <label class="fac-label">Email</label>
              <input [(ngModel)]="supEmail" (ngModelChange)="onChange()" placeholder="Optional" class="fac-input" />
              <label class="fac-label">Shift timing</label>
              <input [(ngModel)]="supShift" (ngModelChange)="onChange()" placeholder="e.g. 6 AM – 2 PM" class="fac-input" />
            </section>

            <section class="fac-card">
              <h2>Facility rules</h2>
              <div class="rules-box">
                <div class="rule-row" *ngFor="let rule of rulesList; let i = index">
                  <span>•</span>
                  <input [(ngModel)]="rulesList[i]" (ngModelChange)="onChange()" class="fac-input fac-input--rule" />
                  <button type="button" class="rule-del" (click)="removeRule(i)" aria-label="Remove rule">×</button>
                </div>
              </div>
              <button type="button" class="fac-pill" (click)="addRule()">+ Add rule</button>
            </section>
          </ng-container>
        </div>

        <div *ngIf="hasChanges() || saved()" class="venue-safe-footer fac-footer">
          <button type="button" class="fac-ghost" [disabled]="saving()" (click)="discardChanges()">Discard</button>
          <button type="button" class="fac-primary fac-primary--wide" [disabled]="saving()" (click)="saveChanges()">
            {{ saving() ? 'Saving…' : (saved() ? 'Saved' : 'Save facility') }}
          </button>
        </div>
      </div>
      <input #photoInput type="file" accept="image/*" hidden (change)="onPhotoFile($event)" />
    </ion-content>
  `,
  styles: [`
    .fac-page {
      min-height: 100%;
      background: #F7F8FA;
      padding-bottom: 16px;
    }

    .fac-page.has-save {
      padding-bottom: 88px;
    }

    .fac-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px 12px;
      background: #fff;
      border-bottom: 1px solid #F3F4F6;
    }

    .fac-header-copy {
      flex: 1;
      min-width: 0;
      text-align: center;
    }

    .fac-header-copy h1 {
      margin: 0;
      font-size: 16px;
      font-weight: 900;
      color: #111827;
      line-height: 1.2;
    }

    .fac-header-copy p {
      margin: 2px 0 0;
      font-size: 11px;
      font-weight: 700;
      color: #9CA3AF;
    }

    .fac-icon-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      background: #F3F4F6;
      color: #111827;
      display: grid;
      place-items: center;
      font-size: 20px;
      flex-shrink: 0;
    }

    .fac-icon-btn--add {
      background: rgba(var(--app-primary-rgb), 0.18);
    }

    .fac-track {
      display: flex;
      gap: 10px;
      padding: 12px 16px 4px;
      overflow-x: auto;
      background: #fff;
      border-bottom: 1px solid #F3F4F6;
    }

    .fac-chip {
      flex: 0 0 148px;
      padding: 0;
      border: 1.5px solid #E5E7EB;
      border-radius: 16px;
      overflow: hidden;
      background: #fff;
      text-align: left;
      box-shadow: 0 1px 4px rgba(17, 24, 39, 0.04);
    }

    .fac-chip.is-selected {
      border-color: var(--app-primary);
      box-shadow: 0 0 0 3px rgba(var(--app-primary-rgb), 0.16);
    }

    .fac-chip-media {
      position: relative;
      height: 78px;
      background: #E5E7EB;
    }

    .fac-chip-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .fac-chip-name {
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 6px;
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      line-height: 1.2;
      text-shadow: 0 1px 4px rgba(0,0,0,.45);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .fac-chip-meta {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 8px;
      min-height: 34px;
    }

    .fac-chip-sport {
      font-size: 9px;
      font-weight: 800;
      letter-spacing: .04em;
      text-transform: uppercase;
      color: #9CA3AF;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .fac-chip-price {
      font-size: 10px;
      font-weight: 800;
      color: #111827;
      white-space: nowrap;
    }

    .fac-chip-status {
      font-size: 8px;
      font-weight: 800;
      text-transform: lowercase;
      border-radius: 999px;
      padding: 2px 6px;
      white-space: nowrap;
    }

    .fac-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .fac-card {
      background: #fff;
      border: 1px solid #F3F4F6;
      border-radius: 20px;
      padding: 16px;
      box-shadow: 0 1px 8px rgba(17, 24, 39, 0.04);
    }

    .fac-card h2,
    .fac-card-head h2 {
      margin: 0 0 12px;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: .08em;
      text-transform: uppercase;
      color: #6B7280;
    }

    .fac-card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }

    .fac-card-head h2 { margin: 0; }

    .fac-lock {
      font-size: 10px;
      font-weight: 800;
      color: #B45309;
      background: #FEF3C7;
      border-radius: 999px;
      padding: 4px 8px;
    }

    .fac-label {
      display: block;
      margin: 12px 0 6px;
      font-size: 11px;
      font-weight: 800;
      color: #6B7280;
    }

    .fac-card > .fac-label:first-of-type { margin-top: 0; }

    .fac-input {
      width: 100%;
      box-sizing: border-box;
      height: 44px;
      padding: 0 12px;
      border: 1.5px solid #E5E7EB;
      border-radius: 12px;
      background: #F9FAFB;
      font-size: 14px;
      font-weight: 700;
      color: #111827;
      outline: none;
    }

    .fac-input:focus {
      border-color: var(--app-primary);
      background: #fff;
    }

    .fac-input:disabled {
      opacity: .7;
      color: #6B7280;
    }

    .fac-input--sm { height: 36px; margin-top: 6px; font-size: 12px; }

    .fac-textarea {
      height: auto;
      padding: 10px 12px;
      resize: none;
      font-weight: 600;
    }

    .fac-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }

    .fac-grid.is-locked { opacity: .85; }

    .fac-pills {
      display: flex;
      gap: 8px;
    }

    .fac-pills--wrap {
      flex-wrap: wrap;
    }

    .fac-pill {
      flex: 1;
      min-height: 40px;
      padding: 8px 10px;
      border: 1.5px solid #E5E7EB;
      border-radius: 12px;
      background: #F9FAFB;
      color: #6B7280;
      font-size: 12px;
      font-weight: 800;
    }

    .fac-pills--wrap .fac-pill {
      flex: 0 0 auto;
      border-radius: 999px;
      min-height: 34px;
    }

    .fac-pill.is-on {
      background: rgba(var(--app-primary-rgb), 0.12);
      border-color: var(--app-primary);
      color: #111827;
    }

    .fac-status-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .fac-status {
      display: flex;
      align-items: center;
      gap: 8px;
      min-height: 48px;
      padding: 10px 12px;
      border: 1.5px solid transparent;
      border-radius: 14px;
      text-align: left;
    }

    .fac-status.is-on {
      border-color: currentColor;
    }

    .fac-status strong {
      font-size: 13px;
      font-weight: 800;
      color: #111827;
    }

    .fac-equip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 0;
      border-bottom: 1px solid #F3F4F6;
    }

    .fac-equip:last-child { border-bottom: none; }

    .fac-equip-ico {
      width: 36px;
      height: 36px;
      border-radius: 12px;
      background: #F3F4F6;
      display: grid;
      place-items: center;
      font-size: 18px;
      flex-shrink: 0;
    }

    .fac-equip-copy { flex: 1; min-width: 0; }
    .fac-equip-copy p { margin: 0; font-size: 13px; font-weight: 800; color: #111827; }

    .fac-stepper {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
    }

    .fac-stepper button {
      width: 28px;
      height: 28px;
      border-radius: 999px;
      border: 1px solid #E5E7EB;
      background: #fff;
      font-weight: 800;
      color: #6B7280;
    }

    .fac-stepper .is-add {
      border: none;
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      color: #111827;
    }

    .fac-stepper strong {
      width: 18px;
      text-align: center;
      font-size: 14px;
      color: #111827;
    }

    .fac-hint {
      margin: 8px 0 0;
      font-size: 12px;
      font-weight: 600;
      color: #9CA3AF;
      line-height: 1.4;
    }

    .fac-sub {
      margin: -6px 0 12px;
      font-size: 12px;
      font-weight: 600;
      color: #9CA3AF;
    }

    .amenity-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .amenity-pill {
      border: 1.5px solid transparent;
      border-radius: 999px;
      padding: 8px 12px;
      background: #F3F4F6;
      color: #4B5563;
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
      line-height: 1.2;
    }

    .amenity-pill.is-on {
      background: #F7FEE7;
      border-color: var(--app-primary);
      color: #3F6212;
    }

    .fac-page button {
      font-family: inherit;
      color: inherit;
      -webkit-tap-highlight-color: transparent;
    }

    .photo-cover {
      position: relative;
      width: 100%;
      height: 140px;
      border: 1.5px dashed #D1D5DB;
      border-radius: 16px;
      background: #F3F4F6;
      overflow: hidden;
      display: grid;
      place-items: center;
      padding: 0;
      color: #9CA3AF;
    }

    .photo-cover img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .photo-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: #9CA3AF;
      font-size: 12px;
      font-weight: 800;
    }

    .photo-empty ion-icon { font-size: 28px; }

    .photo-change {
      position: absolute;
      right: 10px;
      bottom: 10px;
      background: #111827;
      color: #fff;
      border-radius: 999px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 800;
    }

    .photo-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .photo-tile {
      aspect-ratio: 1;
      border: 1.5px dashed #D1D5DB;
      border-radius: 14px;
      background: #F3F4F6;
      overflow: hidden;
      display: grid;
      place-items: center;
      color: #9CA3AF;
      font-size: 22px;
      font-weight: 800;
      padding: 0;
      line-height: 1;
    }

    .photo-tile img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .pano-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      color: #6B7280;
      font-size: 11px;
      font-weight: 800;
    }

    .sup-photo-row {
      display: flex;
      align-items: center;
      gap: 14px;
    }

    .sup-photo-wrap {
      position: relative;
      width: 76px;
      height: 76px;
      flex-shrink: 0;
    }

    .sup-photo {
      width: 72px;
      height: 72px;
      border: none;
      border-radius: 16px;
      background: #F3F4F6;
      display: grid;
      place-items: center;
      overflow: hidden;
      color: #9CA3AF;
      font-size: 26px;
      padding: 0;
    }

    .sup-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sup-plus {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #22C55E;
      color: #fff;
      font-size: 15px;
      font-weight: 900;
      line-height: 22px;
      text-align: center;
      border: 2px solid #fff;
      box-sizing: border-box;
      pointer-events: none;
    }

    .sup-photo-actions {
      display: flex;
      align-items: center;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }

    .sup-btn {
      flex: 1;
      height: 40px;
      padding: 0 12px;
      border-radius: 999px;
      font-size: 13px;
      font-weight: 800;
      white-space: nowrap;
      line-height: 1;
    }

    .sup-btn--upload {
      border: 1.5px solid var(--app-primary);
      background: rgba(var(--app-primary-rgb), 0.18);
      color: #111827;
    }

    .sup-btn--camera {
      border: 1.5px solid #E5E7EB;
      background: #F3F4F6;
      color: #111827;
    }

    .rules-box {
      background: #F3F4F6;
      border-radius: 14px;
      padding: 8px 10px;
      margin-bottom: 10px;
    }

    .rule-row {
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 6px 0;
    }

    .fac-input--rule {
      height: 38px;
      background: #fff;
    }

    .rule-del {
      width: 28px;
      height: 28px;
      border: none;
      border-radius: 999px;
      background: #fff;
      color: #9CA3AF;
      font-size: 18px;
      flex-shrink: 0;
    }

    .fac-muted {
      text-align: center;
      color: #9CA3AF;
      font-weight: 700;
      font-size: 13px;
      padding: 24px 0;
    }

    .fac-empty {
      text-align: center;
      padding: 28px 16px;
    }

    .fac-empty p { margin: 0; font-size: 16px; font-weight: 900; color: #111827; }
    .fac-empty span { display: block; margin: 6px 0 14px; font-size: 12px; font-weight: 600; color: #9CA3AF; }

    .fac-alert {
      border-radius: 14px;
      padding: 10px 12px;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.4;
    }

    .fac-alert--error { background: #FEF2F2; color: #DC2626; }
    .fac-alert--ok { background: #F0FDF4; color: #15803D; }
    .fac-alert--warn { background: #FFFBEB; color: #B45309; margin: 8px 0 12px; }

    .fac-footer {
      display: flex;
      gap: 10px;
      background: #fff;
      border-top: 1px solid #F3F4F6;
      box-shadow: 0 -8px 24px rgba(17, 24, 39, 0.06);
    }

    .fac-ghost,
    .fac-primary {
      height: 48px;
      border: none;
      border-radius: 16px;
      font-size: 14px;
      font-weight: 800;
    }

    .fac-ghost {
      flex: 1;
      background: #F3F4F6;
      color: #6B7280;
    }

    .fac-primary {
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      color: #111827;
      box-shadow: 0 4px 12px rgba(var(--app-primary-rgb), 0.28);
      padding: 0 18px;
    }

    .fac-primary--wide { flex: 2; }

    .no-scrollbar {
      scrollbar-width: none;
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `],
})
export class VenueFacilitiesPage implements OnInit {
  @ViewChild('photoInput') photoInput?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly venueService = inject(VenueService);
  private readonly auth = inject(AuthService);
  private readonly mediaPicker = inject(NativeMediaPickerService);
  private readonly actionSheet = inject(ActionSheetController);

  facilityList = signal<MaintFacility[]>([]);
  selectedId = signal('');
  loading = signal(false);
  saving = signal(false);
  saveError = signal('');
  hasChanges = signal(false);
  saved = signal(false);
  photoBusy = signal(false);
  coverUrl = signal('');
  galleryUrls = signal<string[]>([]);
  panoUrl = signal('');
  selectedAmenities = signal<string[]>([]);

  facilityName = '';
  sport = 'Football';
  courtNumber = '1';
  isIndoor = signal(false);
  surface = signal('Artificial Turf');
  dimensions = '';
  capacity = 22;
  status = signal('open');
  pricePerHour = 0;
  peakPrice: number | null = null;
  weekendPrice: number | null = null;
  cancelFee: number | null = null;

  equipQty = signal<Record<string, number>>({});
  rentalPrices: Record<string, string> = {};

  lastCleaned = '';
  nextCleaning = '';
  maintNotes = '';

  supName = '';
  supRole = '';
  supShift = '';
  supPhone = '';
  supAlt = '';
  supEmail = '';
  supPhoto = '';
  rulesList: string[] = [...DEFAULT_RULES];

  readonly surfaces = SURFACES;
  readonly statusOptions = STATUS_OPTIONS;
  readonly amenityOptions = AMENITY_OPTIONS;
  equipmentOptions = signal<Array<{ id: string; label: string; emoji: string; defaultPrice: number }>>([]);

  private courtsRaw: any[] = [];
  private venueAmenities: string[] = [];
  private photoKind: 'cover' | 'gallery' | 'pano' | 'supervisor' = 'cover';

  ngOnInit() {
    void this.bootstrap();
  }

  priceLocked(): boolean {
    const court = this.courtsRaw.find((c) => String(c.id) === this.selectedId()) || {};
    return !!court.hasActiveBookings && Number(this.selectedId()) > 0;
  }

  activeBookingCount(): number {
    const court = this.courtsRaw.find((c) => String(c.id) === this.selectedId()) || {};
    return Number(court.activeBookingCount || 0);
  }

  private async bootstrap() {
    this.loading.set(true);
    this.saveError.set('');
    const keepId = this.selectedId();
    try {
      const [equipRes, profileRes] = await Promise.all([
        firstValueFrom(this.venueService.getEquipmentCatalog()),
        firstValueFrom(this.venueService.getMyProfile()),
      ]);

      const equipItems = Array.isArray(equipRes.data) ? equipRes.data : [];
      this.equipmentOptions.set(
        equipItems.map((item) => ({
          id: item.id,
          label: item.label || item.name,
          emoji: item.emoji || '🎾',
          defaultPrice: Number(item.defaultPricePerHour || 0),
        })),
      );

      if (!profileRes.success || !profileRes.data) {
        this.saveError.set(profileRes.message || 'Unable to load facilities.');
        return;
      }

      const data = profileRes.data as Record<string, any>;
      this.venueAmenities = Array.isArray(data['amenities']) ? data['amenities'].map((a: unknown) => String(a)) : [];
      const rental = Array.isArray(data['rentalEquipment']) ? data['rentalEquipment'] : [];
      const qty: Record<string, number> = {};
      const prices: Record<string, string> = {};
      rental.forEach((item: any) => {
        const id = String(item?.id || '');
        if (!id) return;
        qty[id] = Number(item?.qty || 0);
        prices[id] = String(item?.price ?? 0);
      });
      this.equipQty.set(qty);
      this.rentalPrices = prices;

      const courts = Array.isArray(data['courts']) ? data['courts'] : [];
      this.courtsRaw = courts;
      const mapped: MaintFacility[] = courts.map((court: any, index: number) => {
        const sport = this.titleCase(String(court.sport || 'Sport'));
        return {
          id: String(court.id ?? `new-${index}`),
          name: String(court.courtName || court.name || `Court ${index + 1}`),
          sport,
          emoji: this.sportEmoji(sport),
          status: String(court.status || 'open').toLowerCase(),
          photo: String(court.image || court.imageUrl || DEFAULT_PHOTOS[sport.toLowerCase()] || DEFAULT_PHOTOS['football']),
          pricePerHour: Number(court.pricePerHour || 0),
          hasActiveBookings: !!court.hasActiveBookings,
          activeBookingCount: Number(court.activeBookingCount || 0),
        };
      });

      this.facilityList.set(mapped);
      if (mapped.length) {
        const next = mapped.find((item) => item.id === keepId) || mapped[0];
        this.selectFacility(next.id);
      } else {
        this.resetFormForNew();
      }
    } catch (error: any) {
      this.saveError.set(error?.error?.message || 'Unable to load facilities.');
    } finally {
      this.loading.set(false);
    }
  }

  selectFacility(id: string) {
    const f = this.facilityList().find((x) => x.id === id);
    if (!f) return;
    this.selectedId.set(id);
    const court = this.courtsRaw.find((c) => String(c.id) === id) || {};
    const meta = (court.meta && typeof court.meta === 'object') ? court.meta : {};

    this.facilityName = f.name;
    this.sport = f.sport;
    this.status.set(f.status);
    this.courtNumber = String(meta['courtNumber'] || '');
    this.isIndoor.set(!!court.isIndoor);
    this.surface.set(String(court.surface || meta['surface'] || 'Artificial Turf'));
    this.dimensions = String(meta['dimensions'] || '');
    this.capacity = Number(court.maxPlayers || meta['capacity'] || 22);
    this.pricePerHour = Number(court.pricePerHour || 0);
    this.peakPrice = court.peakPrice != null && court.peakPrice !== '' ? Number(court.peakPrice) : null;
    this.weekendPrice = court.weekendPrice != null && court.weekendPrice !== '' ? Number(court.weekendPrice) : null;
    this.cancelFee = meta['cancellationFee'] != null && meta['cancellationFee'] !== ''
      ? Number(meta['cancellationFee'])
      : null;
    this.lastCleaned = String(meta['lastCleaned'] || '');
    this.nextCleaning = String(meta['nextCleaning'] || '');
    this.maintNotes = String(meta['maintNotes'] || '');
    this.supName = String(meta['supervisorName'] || '');
    this.supRole = String(meta['supervisorRole'] || '');
    this.supPhone = String(meta['supervisorPhone'] || '');
    this.supAlt = String(meta['supervisorAlt'] || '');
    this.supEmail = String(meta['supervisorEmail'] || '');
    this.supShift = String(meta['supervisorShift'] || '');
    this.supPhoto = String(meta['supervisorPhoto'] || '');
    const savedRules = Array.isArray(meta['rules']) ? meta['rules'].map((r: unknown) => String(r)).filter(Boolean) : [];
    this.rulesList = savedRules.length ? savedRules : [...DEFAULT_RULES];
    const savedAmenities = Array.isArray(meta['amenities']) ? meta['amenities'].map((a: unknown) => String(a)) : this.venueAmenities;
    this.selectedAmenities.set(savedAmenities);
    const gallery = Array.isArray(meta['gallery']) ? meta['gallery'].map((u: unknown) => String(u)).filter(Boolean) : [];
    this.galleryUrls.set(gallery);
    this.panoUrl.set(String(meta['panoramaUrl'] || ''));
    this.coverUrl.set(String(court.image || court.imageUrl || f.photo || ''));
    if (this.coverUrl().startsWith('https://images.unsplash.com')) {
      this.coverUrl.set('');
    }

    this.hasChanges.set(false);
    this.saved.set(false);
    this.saveError.set('');
  }

  getStatusStyle(status: string) {
    if (status === 'open') return { bg: '#F0FDF4', color: '#16A34A' };
    if (status === 'maintenance') return { bg: '#FFFBEB', color: '#D97706' };
    if (status === 'closed') return { bg: '#FEF2F2', color: '#DC2626' };
    return { bg: '#FFF7ED', color: '#C2410C' };
  }

  getEquipQty(id: string): number {
    return this.equipQty()[id] ?? 0;
  }

  incQty(id: string) {
    this.equipQty.update((eq) => ({ ...eq, [id]: (eq[id] ?? 0) + 1 }));
    if (!this.rentalPrices[id]) {
      const item = this.equipmentOptions().find((e) => e.id === id);
      this.rentalPrices[id] = String(item?.defaultPrice ?? 0);
    }
    this.onChange();
  }

  decQty(id: string) {
    this.equipQty.update((eq) => {
      const copy = { ...eq };
      if ((copy[id] ?? 0) > 0) copy[id]--;
      return copy;
    });
    this.onChange();
  }

  onChange() {
    this.hasChanges.set(true);
    this.saved.set(false);
  }

  onPriceChange() {
    if (this.priceLocked()) return;
    this.onChange();
  }

  async saveChanges() {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');
    try {
      const selectedId = this.selectedId();
      const numericId = Number(selectedId);
      const meta: Record<string, unknown> = {
        courtNumber: this.courtNumber,
        dimensions: this.dimensions,
        capacity: this.capacity,
        lastCleaned: this.lastCleaned,
        nextCleaning: this.nextCleaning,
        maintNotes: this.maintNotes,
        supervisorName: this.supName,
        supervisorRole: this.supRole,
        supervisorPhone: this.supPhone,
        supervisorAlt: this.supAlt,
        supervisorEmail: this.supEmail,
        supervisorShift: this.supShift,
        supervisorPhoto: this.supPhoto,
        amenities: this.selectedAmenities(),
        gallery: this.galleryUrls(),
        panoramaUrl: this.panoUrl(),
        rules: this.rulesList.map((r) => r.trim()).filter(Boolean),
      };

      if (!this.priceLocked()) {
        meta['cancellationFee'] = this.cancelFee != null && String(this.cancelFee) !== '' ? Number(this.cancelFee) : null;
      } else {
        const court = this.courtsRaw.find((c) => String(c.id) === selectedId) || {};
        const existing = (court.meta && typeof court.meta === 'object') ? court.meta : {};
        if (existing['cancellationFee'] != null) {
          meta['cancellationFee'] = existing['cancellationFee'];
        }
      }

      const courtPayload: Record<string, unknown> = {
        name: this.facilityName.trim() || 'Court',
        sport: this.sport.toLowerCase(),
        isIndoor: this.isIndoor(),
        hasRentalGear: Object.values(this.equipQty()).some((q) => q > 0),
        status: this.status(),
        surface: this.surface(),
        maxPlayers: Number(this.capacity || 0) || null,
        meta,
      };

      if (this.coverUrl() && !this.coverUrl().startsWith('https://images.unsplash.com')) {
        courtPayload['imageUrl'] = this.coverUrl();
      }

      if (!this.priceLocked()) {
        courtPayload['pricePerHour'] = Number(this.pricePerHour || 0);
        courtPayload['peakPrice'] = this.peakPrice != null && String(this.peakPrice) !== '' ? Number(this.peakPrice) : null;
        courtPayload['weekendPrice'] = this.weekendPrice != null && String(this.weekendPrice) !== '' ? Number(this.weekendPrice) : null;
      }

      if (Number.isFinite(numericId) && numericId > 0) {
        await firstValueFrom(this.venueService.updateCourt(numericId, courtPayload));
      } else {
        courtPayload['pricePerHour'] = Number(this.pricePerHour || 0);
        courtPayload['peakPrice'] = this.peakPrice != null && String(this.peakPrice) !== '' ? Number(this.peakPrice) : null;
        courtPayload['weekendPrice'] = this.weekendPrice != null && String(this.weekendPrice) !== '' ? Number(this.weekendPrice) : null;
        const created = await firstValueFrom(this.venueService.createCourt(courtPayload as any));
        if (created.data?.id) {
          this.selectedId.set(String(created.data.id));
        }
      }

      await firstValueFrom(
        this.venueService.updateMyProfile({
          amenities: this.selectedAmenities(),
          rentalEquipment: this.equipmentOptions()
            .filter((item) => (this.equipQty()[item.id] || 0) > 0)
            .map((item) => ({
              id: item.id,
              label: item.label,
              emoji: item.emoji,
              qty: this.equipQty()[item.id] || 0,
              price: Number(this.rentalPrices[item.id] || item.defaultPrice || 0),
            })),
        }),
      );

      await this.bootstrap();
      this.hasChanges.set(false);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    } catch (error: any) {
      const field = error?.error?.errors?.pricePerHour;
      const fieldMsg = Array.isArray(field) ? field[0] : field;
      this.saveError.set(fieldMsg || error?.error?.message || 'Unable to save facility.');
    } finally {
      this.saving.set(false);
    }
  }

  discardChanges() {
    if (this.selectedId()) this.selectFacility(this.selectedId());
    this.hasChanges.set(false);
  }

  addFacility() {
    const nextId = `new-${Date.now()}`;
    const newFac: MaintFacility = {
      id: nextId,
      name: 'New Court',
      sport: 'Basketball',
      emoji: '🏀',
      status: 'open',
      photo: DEFAULT_PHOTOS['basketball'],
      pricePerHour: 0,
    };
    this.facilityList.update((list) => [...list, newFac]);
    this.courtsRaw = [...this.courtsRaw, { id: nextId, meta: {} }];
    this.selectFacility(nextId);
    this.onChange();
  }

  goBack() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }

  gallerySlots(): number[] {
    return Array.from({ length: Math.max(0, 5 - this.galleryUrls().length) });
  }

  isAmenityOn(name: string): boolean {
    return this.selectedAmenities().includes(name);
  }

  toggleAmenity(name: string) {
    this.selectedAmenities.update((list) =>
      list.includes(name) ? list.filter((item) => item !== name) : [...list, name],
    );
    this.onChange();
  }

  addRule() {
    this.rulesList = [...this.rulesList, ''];
    this.onChange();
  }

  removeRule(index: number) {
    this.rulesList = this.rulesList.filter((_, i) => i !== index);
    this.onChange();
  }

  async pickPhoto(kind: 'cover' | 'gallery' | 'pano' | 'supervisor', source?: 'camera' | 'library'): Promise<void> {
    this.photoKind = kind;
    if (source === 'camera') {
      await this.openCamera();
      return;
    }
    if (source === 'library') {
      await this.openLibrary();
      return;
    }
    const sheet = await this.actionSheet.create({
      header: kind === 'cover' ? 'Cover photo' : kind === 'supervisor' ? 'Supervisor photo' : 'Add photo',
      buttons: [
        { text: 'Take photo', icon: 'camera-outline', handler: () => { void this.openCamera(); } },
        { text: 'Choose from gallery', icon: 'image-outline', handler: () => { void this.openLibrary(); } },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  async onPhotoFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const normalized = await normalizeImageFile(file, this.photoKind);
      await this.uploadPickedFile(normalized);
    } catch {
      this.saveError.set('Unable to read that image. Please try another photo.');
    }
  }

  private async openCamera(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const file = await this.mediaPicker.takePhoto(`facility-${this.photoKind}`);
      if (file) await this.uploadPickedFile(file);
      return;
    }
    this.photoInput?.nativeElement.click();
  }

  private async openLibrary(): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      const file = await this.mediaPicker.pickPhoto(`facility-${this.photoKind}`);
      if (file) await this.uploadPickedFile(file);
      return;
    }
    this.photoInput?.nativeElement.click();
  }

  private async uploadPickedFile(file: File): Promise<void> {
    this.photoBusy.set(true);
    this.saveError.set('');
    try {
      const courtId = await this.ensureCourtId();
      const asCover = this.photoKind === 'cover';
      const res = await firstValueFrom(
        this.venueService.uploadGallery([file], {
          asCover,
          courtId: courtId || undefined,
        }),
      );
      const url = res.data?.uploaded?.[0] || '';
      if (!url) {
        this.saveError.set(res.message || 'Upload failed.');
        return;
      }
      if (res.data?.user) this.auth.hydrateUser(res.data.user);

      if (this.photoKind === 'cover') {
        this.coverUrl.set(url);
        this.facilityList.update((list) =>
          list.map((item) => item.id === this.selectedId() ? { ...item, photo: url } : item),
        );
      } else if (this.photoKind === 'gallery') {
        this.galleryUrls.update((urls) => urls.includes(url) ? urls : [...urls, url]);
      } else if (this.photoKind === 'pano') {
        this.panoUrl.set(url);
      } else {
        this.supPhoto = url;
      }
      this.onChange();
      if (courtId && this.photoKind !== 'cover') {
        await this.persistPhotoMeta(Number(courtId));
      }
    } catch (error: any) {
      this.saveError.set(error?.error?.message || 'Unable to upload photo.');
    } finally {
      this.photoBusy.set(false);
    }
  }

  private async persistPhotoMeta(courtId: number): Promise<void> {
    const court = this.courtsRaw.find((c) => String(c.id) === String(courtId)) || {};
    const existing = (court.meta && typeof court.meta === 'object') ? court.meta : {};
    await firstValueFrom(this.venueService.updateCourt(courtId, {
      name: this.facilityName.trim() || 'Court',
      sport: this.sport.toLowerCase(),
      meta: {
        ...existing,
        gallery: this.galleryUrls(),
        panoramaUrl: this.panoUrl(),
        supervisorPhoto: this.supPhoto,
      },
    }));
  }

  private async ensureCourtId(): Promise<string | null> {
    const selectedId = this.selectedId();
    const numericId = Number(selectedId);
    if (Number.isFinite(numericId) && numericId > 0) return String(numericId);
    const created = await firstValueFrom(this.venueService.createCourt({
      name: this.facilityName.trim() || 'Court',
      sport: this.sport.toLowerCase(),
      isIndoor: this.isIndoor(),
      pricePerHour: Number(this.pricePerHour || 0),
      status: this.status(),
      surface: this.surface(),
      maxPlayers: Number(this.capacity || 0) || null,
    }));
    if (created.data?.id) {
      this.selectedId.set(String(created.data.id));
      return String(created.data.id);
    }
    return null;
  }

  private resetFormForNew() {
    this.selectedId.set('');
    this.facilityName = '';
    this.sport = 'Football';
    this.status.set('open');
    this.courtNumber = '1';
    this.isIndoor.set(false);
    this.surface.set('Artificial Turf');
    this.dimensions = '';
    this.capacity = 22;
    this.pricePerHour = 0;
    this.peakPrice = null;
    this.weekendPrice = null;
    this.cancelFee = null;
  }

  private titleCase(value: string): string {
    return value.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private sportEmoji(sport: string): string {
    const key = sport.toLowerCase();
    if (key.includes('foot')) return '⚽';
    if (key.includes('basket')) return '🏀';
    if (key.includes('badminton')) return '🏸';
    if (key.includes('cricket')) return '🏏';
    if (key.includes('tennis')) return '🎾';
    if (key.includes('volley')) return '🏐';
    if (key.includes('table')) return '🏓';
    return '🏟️';
  }
}

const DEFAULT_PHOTOS: Record<string, string> = {
  football: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=200&fit=crop&auto=format',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop&auto=format',
  badminton: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=200&fit=crop&auto=format',
  cricket: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=200&fit=crop&auto=format',
  tennis: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=300&h=200&fit=crop&auto=format',
};
