import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CoachGalleryCategory, CoachGalleryItem, CoachProfileDetails, CoachProfileDetailsPayload, CoachService, CoachVerificationDocument, CoachVerificationDocumentType } from '../../core/services/coach.service';
import { LocationService } from '../../core/services/location.service';
import { NativeMediaPickerService } from '../../core/services/native-media-picker.service';
import {
  CURRENT_LOCATION_ID,
  SavedAddress,
  SavedAddressesService,
} from '../../core/services/saved-addresses.service';
import { normalizeImageFile } from '../../core/utils/image-file.util';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { LocationFieldComponent } from '../../shared/components/location-field/location-field.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

const ADDRESS_TAGS = ['Home', 'Work', 'Other'] as const;
const COACH_LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Punjabi','Marathi','Gujarati','Bengali','Other'];
const COACH_LOCATIONS = ['Sports Academy','Sports Club','School','Private Turf',"Player's Venue",'Home Coaching','Public Grounds','Indoor Courts'];
const COACH_SESSION_TYPES = ['Individual Coaching','Group Sessions','Academy Training','Corporate Wellness','School Coaching','Weekend Camps','Holiday Camps'];
const COACH_EQUIPMENT = ['Balls','Racquets','Training Cones','Training Kit','Fitness Equipment','Shuttlecocks','Nets','Protective Gear','Water','Other'];
const COACH_TRIAL_TYPES = ['Free Trial','30-Min Trial','Discounted First Session','Custom Price'];
const COACH_TRAVEL_MODES = [
  { id: 'player', label: 'Player comes to me' },
  { id: 'i-travel', label: 'I travel to players' },
  { id: 'both', label: 'Both' },
];
const COACH_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const COACH_TIMES = ['Morning','Afternoon','Evening','Night'];
const COACH_ACHIEVEMENTS = ['District Level','State Level','National Level','International Level','Former Professional Player','Current Professional Coach','Other'];

@Component({
  selector: 'app-edit-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TextInputComponent, LocationFieldComponent, PrimaryButtonComponent],
  template: `
    <ion-content fullscreen>
      <main class="edit-profile">
        <header class="hdr">
          <button type="button" class="icon-btn" (click)="back()"><ion-icon name="chevron-back-outline"></ion-icon></button>
          <h1>Edit Profile</h1>
          <span class="spacer"></span>
        </header>

        <div class="avatar-block">
          <div class="avatar" [class.has-photo]="!!previewUrl">
            <img *ngIf="previewUrl" [src]="previewUrl" [alt]="name || 'Profile'" />
            <span *ngIf="!previewUrl">{{ initials }}</span>
          </div>
          <button type="button" class="upload-btn" (click)="pickPhoto()">Change Photo</button>
          <p class="hint">Camera or photo library</p>
          <input #cameraInput type="file" accept="image/*" capture="environment" hidden (change)="onFile($event)" />
          <input #libraryInput type="file" accept="image/jpeg,image/png,image/webp,image/*" hidden (change)="onFile($event)" />
        </div>

        <section class="coach-gallery" *ngIf="auth.user()?.role === 'coach'">
          <div class="coach-gallery-heading"><h2>Coaching gallery</h2><p>Add, preview, or remove profile media</p></div>
          <div class="coach-gallery-categories">
            <button type="button" *ngFor="let category of galleryCategories" (click)="addCoachMedia(category.id)" [disabled]="galleryBusy">
              <span>{{ category.label }}</span><small>{{ galleryFor(category.id).length }} saved</small>
            </button>
          </div>
          <div class="coach-gallery-grid" *ngIf="coachGallery.length">
            <div class="coach-gallery-item" *ngFor="let item of coachGallery">
              <img *ngIf="item.mimeType.startsWith('image/')" [src]="item.url" [alt]="item.name || 'Coach gallery media'" />
              <video *ngIf="item.mimeType.startsWith('video/')" [src]="item.url" controls playsinline></video>
              <a *ngIf="item.mimeType === 'application/pdf'" [href]="item.url" target="_blank" rel="noopener">View certificate</a>
              <button type="button" (click)="removeCoachMedia(item)" [disabled]="galleryBusy" aria-label="Remove gallery item"><ion-icon name="trash-outline"></ion-icon></button>
              <small>{{ galleryLabel(item.category) }}</small>
            </div>
          </div>
          <p *ngIf="galleryError" class="error">{{ galleryError }}</p>
          <input #coachGalleryInput type="file" [accept]="coachGalleryAccept" hidden (change)="onCoachGalleryFile($event)" />
        </section>

        <section class="coach-details" *ngIf="auth.user()?.role === 'coach' && coachDetailsLoaded">
          <div class="coach-details-heading">
            <div>
              <h2>Coaching details</h2>
              <p>Update the information players see when they discover you.</p>
            </div>
            <ion-icon name="options-outline"></ion-icon>
          </div>

          <div class="detail-group">
            <div class="detail-group-heading"><h3>Languages spoken</h3><span>{{ coachDetails.languages.length }} selected</span></div>
            <div class="detail-chips">
              <button type="button" *ngFor="let item of coachLanguageOptions" (click)="toggleCoachArray('languages', item)" [class.detail-chip-active]="coachDetails.languages.includes(item)">{{ item }}</button>
            </div>
          </div>

          <div class="detail-group">
            <div class="detail-group-heading"><h3>Where do you coach?</h3><span>{{ coachDetails.coachingLocations.length }} selected</span></div>
            <div class="detail-chips">
              <button type="button" *ngFor="let item of coachLocationOptions" (click)="toggleCoachArray('coachingLocations', item)" [class.detail-chip-active]="coachDetails.coachingLocations.includes(item)">{{ item }}</button>
            </div>
            <label class="detail-label">Travel radius</label>
            <div class="detail-segments">
              <button type="button" *ngFor="let radius of ['5 km','10 km','20 km','Anywhere']" (click)="coachDetails.serviceRadius = radius" [class.detail-segment-active]="coachDetails.serviceRadius === radius">{{ radius }}</button>
            </div>
          </div>

          <div class="detail-group">
            <div class="detail-group-heading"><h3>Training formats</h3><span>{{ coachDetails.sessionTypes.length }} selected</span></div>
            <div class="detail-chips">
              <button type="button" *ngFor="let item of coachSessionTypeOptions" (click)="toggleCoachArray('sessionTypes', item)" [class.detail-chip-active]="coachDetails.sessionTypes.includes(item)">{{ item }}</button>
            </div>
          </div>

          <div class="detail-group">
            <div class="detail-group-heading"><h3>Equipment available</h3><span>{{ coachDetails.equipment.length }} selected</span></div>
            <div class="detail-chips">
              <button type="button" *ngFor="let item of coachEquipmentOptions" (click)="toggleCoachArray('equipment', item)" [class.detail-chip-active]="coachDetails.equipment.includes(item)">{{ item }}</button>
            </div>
          </div>

          <div class="detail-group">
            <div class="detail-group-heading"><h3>Trial session</h3><span>Optional</span></div>
            <div class="detail-segments detail-segments-two">
              <button type="button" (click)="coachDetails.trialEnabled = true" [class.detail-segment-active]="coachDetails.trialEnabled === true">Offer trials</button>
              <button type="button" (click)="coachDetails.trialEnabled = false; coachDetails.trialType = ''" [class.detail-segment-active]="coachDetails.trialEnabled === false">No trials</button>
            </div>
            <div class="detail-chips detail-chips-compact" *ngIf="coachDetails.trialEnabled === true">
              <button type="button" *ngFor="let item of coachTrialOptions" (click)="coachDetails.trialType = item" [class.detail-chip-active]="coachDetails.trialType === item">{{ item }}</button>
            </div>
          </div>

          <div class="detail-group">
            <div class="detail-group-heading"><h3>Session arrangement</h3><span>How you work</span></div>
            <div class="detail-segments detail-segments-two">
              <button type="button" *ngFor="let item of coachTravelOptions" (click)="coachDetails.travelMode = item.id" [class.detail-segment-active]="coachDetails.travelMode === item.id">{{ item.label }}</button>
            </div>
          </div>

          <div class="detail-group">
            <div class="detail-group-heading"><h3>Weekly availability</h3><span>{{ selectedCoachSlotCount() }} slots</span></div>
            <div class="edit-availability-grid">
              <div *ngFor="let day of coachDays" class="edit-availability-day">
                <strong>{{ day }}</strong>
                <div>
                  <button type="button" *ngFor="let time of coachTimes" (click)="toggleCoachAvailability(day, time)" [class.edit-availability-active]="isCoachAvailable(day, time)">{{ time.slice(0, 3) }}</button>
                </div>
              </div>
            </div>
          </div>

          <div class="detail-group detail-fees-group">
            <div class="detail-group-heading"><h3>Pricing</h3><span>Per session</span></div>
            <div class="detail-fees">
              <label *ngFor="let fee of [{ label: 'Individual', key: 'individual' }, { label: 'Group', key: 'group' }, { label: 'Monthly', key: 'monthly' }]">
                <span>{{ fee.label }}</span>
                <div><b>₹</b><input type="number" [(ngModel)]="coachDetails.feeOptions[fee.key]" placeholder="0" /></div>
              </label>
            </div>
            <button type="button" class="detail-toggle-row" (click)="coachDetails.feesNegotiable = !coachDetails.feesNegotiable">
              <span>Pricing is negotiable</span><span class="mini-toggle" [class.mini-toggle-active]="coachDetails.feesNegotiable"><i></i></span>
            </button>
          </div>

          <div class="detail-group">
            <div class="detail-group-heading"><h3>Achievements</h3><span>{{ coachDetails.achievements.length }} selected</span></div>
            <div class="detail-chips">
              <button type="button" *ngFor="let item of coachAchievementOptions" (click)="toggleCoachArray('achievements', item)" [class.detail-chip-active]="coachDetails.achievements.includes(item)">{{ item }}</button>
            </div>
          </div>

          <div class="detail-group">
            <div class="detail-group-heading"><h3>Coach bio</h3><span>{{ coachDetails.bio.length }}/2000</span></div>
            <textarea [(ngModel)]="coachDetails.bio" maxlength="2000" rows="4" placeholder="Tell players about your coaching experience, approach and what they can expect."></textarea>
          </div>
          <p *ngIf="coachDetailsError" class="error">{{ coachDetailsError }}</p>
          <p *ngIf="coachDetailsSuccess" class="success">{{ coachDetailsSuccess }}</p>
        </section>

        <section class="coach-details" *ngIf="auth.user()?.role === 'coach'">
          <div class="coach-details-heading">
            <div><h2>Verification documents</h2><p>Replace any submitted document when your details change.</p></div>
            <ion-icon name="shield-checkmark-outline"></ion-icon>
          </div>
          <div class="verification-edit-list">
            <div *ngFor="let doc of verificationCategories" class="verification-edit-row">
              <div class="verification-edit-copy"><b>{{ doc.label }}</b><span>{{ verificationFor(doc.id)?.name || doc.hint }}</span></div>
              <button type="button" (click)="addVerificationDocument(doc.id)" [disabled]="verificationBusy" class="verification-edit-upload">{{ verificationFor(doc.id) ? 'Replace' : 'Upload' }}</button>
              <button type="button" *ngIf="verificationFor(doc.id) as uploaded" (click)="removeVerificationDocument(uploaded)" [disabled]="verificationBusy" class="verification-edit-remove" aria-label="Remove document"><ion-icon name="trash-outline"></ion-icon></button>
            </div>
          </div>
          <input #verificationInput type="file" [accept]="verificationAccept" hidden (change)="onVerificationFile($event)" />
          <p *ngIf="verificationError" class="error">{{ verificationError }}</p>
        </section>

        <div class="fields">
          <app-text-input label="Full Name" placeholder="Your name" icon="person-outline" [(ngModel)]="name"></app-text-input>
          <app-text-input label="Mobile Number" placeholder="Mobile" type="tel" icon="call-outline"
            [maxlength]="10" [ngModel]="phone" (ngModelChange)="onPhone($event)"></app-text-input>
          <app-text-input label="Email Address" placeholder="Email" type="email" icon="mail-outline" [(ngModel)]="email"></app-text-input>
          <app-location-field label="Location" placeholder="e.g. Lucknow, Gomti Nagar" [(ngModel)]="location"></app-location-field>
        </div>

        <section class="saved-block" *ngIf="auth.user()?.role !== 'coach'">
          <div class="saved-head-row">
            <div class="saved-head">
              <h2>Saved addresses</h2>
              <p>Used on Home for nearby games &amp; bookings</p>
            </div>
            <button type="button" class="saved-add" (click)="openAddAddressModal()" aria-label="Add address">
              <ion-icon name="add"></ion-icon>
            </button>
          </div>

          <div class="saved-empty" *ngIf="!savedAddresses.length">
            No saved addresses yet. Tap + to add one.
          </div>
          <div class="saved-list" *ngIf="savedAddresses.length">
            <div class="saved-item" *ngFor="let addr of savedAddresses">
              <div class="saved-item-text">
                <p class="saved-item-label">{{ addr.label }}</p>
                <p class="saved-item-meta">{{ addr.address }}</p>
              </div>
              <button type="button" class="saved-use" (click)="useAddress(addr)">Use</button>
              <button type="button" class="saved-del" (click)="removeAddress(addr.id)" aria-label="Remove">
                <ion-icon name="trash-outline"></ion-icon>
              </button>
            </div>
          </div>
        </section>

        <p *ngIf="error" class="error">{{ error }}</p>
        <p *ngIf="success" class="success">{{ success }}</p>

        <app-primary-button icon="checkmark" [disabled]="submitting || coachDetailsSaving || !name.trim()" (pressed)="save()">
          {{ submitting ? 'Saving...' : 'Save Changes' }}
        </app-primary-button>
      </main>
    </ion-content>

    <ion-modal
      [isOpen]="addAddressOpen"
      (didDismiss)="closeAddAddressModal()"
      [initialBreakpoint]="0.82"
      [breakpoints]="[0, 0.82, 1]"
    >
      <ng-template>
        <div class="addr-modal">
          <div class="addr-modal-handle"></div>
          <div class="addr-modal-top">
            <h2>Add address</h2>
            <button type="button" class="addr-modal-close" (click)="closeAddAddressModal()" aria-label="Close">
              <ion-icon name="close"></ion-icon>
            </button>
          </div>
          <p class="addr-modal-sub">Save a place for quick selection on Home</p>

          <p class="addr-field-label">Save as</p>
          <div class="addr-tags">
            <button
              type="button"
              class="addr-tag"
              *ngFor="let tag of addressTags"
              [class.is-active]="newAddressTag === tag"
              (click)="selectTag(tag)"
            >
              {{ tag }}
            </button>
          </div>

          <div class="addr-custom" *ngIf="newAddressTag === 'Other'">
            <input
              type="text"
              [(ngModel)]="newAddressLabel"
              placeholder="e.g. Bread Factory, Parents home"
              maxlength="40"
            />
          </div>

          <div class="addr-map-field">
            <app-location-field
              label="Full address *"
              placeholder="House / street / area"
              [(ngModel)]="newAddressValue"
            ></app-location-field>
          </div>

          <div class="addr-landmark">
            <p class="addr-field-label">Landmark <span>Optional</span></p>
            <input
              type="text"
              [(ngModel)]="newAddressLandmark"
              placeholder="Near park, tower, etc."
              maxlength="80"
            />
          </div>

          <p *ngIf="addAddressError" class="addr-error">{{ addAddressError }}</p>

          <button
            type="button"
            class="addr-save-btn"
            [disabled]="!canSaveNewAddress"
            (click)="confirmAddAddress()"
          >
            Save address
          </button>
        </div>
      </ng-template>
    </ion-modal>
  `,
  styles: [`
    .edit-profile { padding: calc(12px + var(--safe-area-top)) 20px 32px; min-height: 100%; background: #fafbfc; }
    .hdr { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .hdr h1 { flex: 1; text-align: center; font-size: 17px; font-weight: 900; margin: 0; color: #111827; }
    .spacer { width: 40px; }
    .icon-btn { width: 40px; height: 40px; border: none; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; }
    .avatar-block { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 24px; }
    .avatar {
      width: 96px; height: 96px; border-radius: 50%; overflow: hidden;
      background: linear-gradient(135deg, var(--app-primary), #ff7a00);
      display: grid; place-items: center; font-size: 32px; font-weight: 900; color: #111827; flex-shrink: 0;
    }
    .avatar.has-photo { background: #e5e7eb; }
    .avatar img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
    .upload-btn { font-size: 13px; font-weight: 700; color: #2563eb; cursor: pointer; background: none; border: none; padding: 0; }
    .hint { margin: 0; font-size: 11px; color: #9ca3af; font-weight: 600; }
    .fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .coach-gallery { padding:16px; margin-bottom:18px; border:1px solid #edf0f2; border-radius:18px; background:#fff; }
    .coach-gallery-heading h2 { margin:0; font-size:15px; font-weight:900; color:#111827; }
    .coach-gallery-heading p { margin:4px 0 12px; font-size:12px; color:#9ca3af; }
    .coach-gallery-categories { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .coach-gallery-categories button { min-height:48px; padding:8px 10px; display:flex; justify-content:space-between; align-items:center; gap:6px; background:#f9fafb; border:1px solid #edf0f2; border-radius:12px; text-align:left; font-size:11px; font-weight:800; color:#374151; }
    .coach-gallery-categories small { color:#9ca3af; font-size:10px; white-space:nowrap; }
    .coach-gallery-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; margin-top:12px; }
    .coach-gallery-item { position:relative; min-width:0; min-height:92px; overflow:hidden; border-radius:12px; background:#f3f4f6; }
    .coach-gallery-item img,.coach-gallery-item video { width:100%; height:92px; object-fit:cover; display:block; }
    .coach-gallery-item a { display:grid; height:92px; place-items:center; color:#2563eb; font-size:11px; }
    .coach-gallery-item>button { position:absolute; top:5px; right:5px; border:0; border-radius:50%; width:26px; height:26px; background:#fff; color:#dc2626; }
    .coach-gallery-item>small { position:absolute; bottom:0; left:0; right:0; padding:3px 5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#fff; background:#111827a8; font-size:9px; }

    .coach-details { padding: 18px 16px; margin-bottom: 18px; background: #fff; border: 1px solid #edf0f2; border-radius: 20px; }
    .coach-details-heading { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; margin-bottom:18px; }
    .coach-details-heading h2 { margin:0; color:#111827; font-size:17px; font-weight:900; }
    .coach-details-heading p { margin:4px 0 0; color:#9ca3af; font-size:12px; line-height:1.4; }
    .coach-details-heading ion-icon { padding:8px; color:#111827; background:rgba(var(--app-primary-rgb),.18); border-radius:12px; font-size:18px; }
    .detail-group { padding:16px 0; border-top:1px solid #f3f4f6; }
    .detail-group:first-of-type { border-top:0; padding-top:0; }
    .detail-group-heading { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:10px; }
    .detail-group-heading h3 { margin:0; color:#111827; font-size:13px; font-weight:850; }
    .detail-group-heading span { color:#9ca3af; font-size:10px; font-weight:700; }
    .detail-chips { display:flex; flex-wrap:wrap; gap:7px; }
    .detail-chip { padding:8px 11px; }
    .detail-chips button { padding:8px 11px; color:#6b7280; background:#f8fafc; border:1px solid #edf0f2; border-radius:999px; font-size:11px; font-weight:700; }
    .detail-chips button.detail-chip-active { color:#111827; background:rgba(var(--app-primary-rgb),.18); border-color:var(--app-primary); }
    .detail-label { display:block; margin:14px 0 7px; color:#6b7280; font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.08em; }
    .detail-segments { display:flex; gap:6px; padding:4px; background:#f3f4f6; border-radius:13px; }
    .detail-segments button { flex:1; min-height:34px; padding:6px 5px; color:#9ca3af; background:transparent; border:0; border-radius:10px; font-size:10px; font-weight:800; }
    .detail-segments button.detail-segment-active { color:#111827; background:#fff; box-shadow:0 1px 4px rgba(0,0,0,.08); }
    .detail-segments-two { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); }
    .detail-chips-compact { margin-top:9px; }
    .edit-availability-grid { display:grid; gap:7px; }
    .edit-availability-day { display:flex; align-items:center; gap:8px; padding:8px; background:#f8fafc; border:1px solid #edf0f2; border-radius:12px; }
    .edit-availability-day>strong { width:28px; color:#374151; font-size:10px; text-transform:uppercase; }
    .edit-availability-day>div { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:5px; flex:1; }
    .edit-availability-day button { min-height:30px; padding:4px 2px; color:#9ca3af; background:#fff; border:1px solid #edf0f2; border-radius:8px; font-size:9px; font-weight:800; }
    .edit-availability-day button.edit-availability-active { color:#111827; background:var(--app-primary); border-color:var(--app-primary); }
    .detail-fees { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:7px; }
    .detail-fees label { padding:9px; background:#f8fafc; border:1px solid #edf0f2; border-radius:12px; }
    .detail-fees label>span { display:block; margin-bottom:5px; color:#9ca3af; font-size:9px; font-weight:800; }
    .detail-fees label>div { display:flex; align-items:center; gap:4px; }
    .detail-fees b { color:#6b7280; font-size:14px; }
    .detail-fees input { width:100%; min-width:0; padding:0; color:#111827; background:transparent; border:0; outline:0; font-size:13px; font-weight:900; }
    .detail-toggle-row { width:100%; display:flex; align-items:center; justify-content:space-between; margin-top:10px; padding:10px 0 0; color:#374151; background:transparent; border:0; border-top:1px solid #f3f4f6; font-size:12px; font-weight:700; text-align:left; }
    .mini-toggle { width:34px; height:20px; display:block; padding:2px; background:#e5e7eb; border-radius:999px; transition:background .15s; }
    .mini-toggle i { display:block; width:16px; height:16px; background:#fff; border-radius:50%; box-shadow:0 1px 3px rgba(0,0,0,.16); transition:transform .15s; }
    .mini-toggle-active { background:var(--app-primary); }
    .mini-toggle-active i { transform:translateX(14px); }
    .detail-group textarea { width:100%; box-sizing:border-box; padding:12px; color:#111827; background:#f8fafc; border:1px solid #edf0f2; border-radius:14px; outline:0; resize:vertical; font:inherit; font-size:13px; line-height:1.5; }
    .detail-group textarea:focus { background:#fff; border-color:var(--app-primary); box-shadow:0 0 0 3px rgba(var(--app-primary-rgb),.12); }
    .verification-edit-list { display:flex; flex-direction:column; gap:8px; }
    .verification-edit-row { display:flex; align-items:center; gap:8px; padding:10px; background:#f8fafc; border:1px solid #edf0f2; border-radius:13px; }
    .verification-edit-copy { min-width:0; flex:1; }
    .verification-edit-copy b,.verification-edit-copy span { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .verification-edit-copy b { color:#374151; font-size:11px; }
    .verification-edit-copy span { margin-top:3px; color:#9ca3af; font-size:10px; }
    .verification-edit-upload { padding:7px 9px; color:#111827; background:var(--app-primary); border:0; border-radius:9px; font-size:10px; font-weight:800; }
    .verification-edit-remove { width:28px; height:28px; color:#dc2626; background:#fff; border:1px solid #fee2e2; border-radius:9px; }

    .saved-block { margin: 0 0 20px; }
    .saved-head-row {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 12px;
    }
    .saved-head h2 { margin: 0; font-size: 15px; font-weight: 900; color: #111827; }
    .saved-head p { margin: 4px 0 0; font-size: 12px; font-weight: 600; color: #9ca3af; }
    .saved-add {
      width: 36px;
      height: 36px;
      border: none;
      border-radius: 12px;
      background: #111827;
      color: #fff;
      display: grid;
      place-items: center;
      flex-shrink: 0;
      box-shadow: 0 6px 14px rgba(17, 24, 39, 0.18);
    }
    .saved-add ion-icon { font-size: 22px; }
    .saved-empty { padding: 14px; border-radius: 14px; background: #f3f4f6; font-size: 12px; font-weight: 600; color: #6b7280; }
    .saved-list { display: flex; flex-direction: column; gap: 8px; }
    .saved-item {
      display: flex; align-items: center; gap: 8px; padding: 12px; border-radius: 14px;
      border: 1.5px solid #f3f4f6; background: #fff;
    }
    .saved-item-text { flex: 1; min-width: 0; }
    .saved-item-label { margin: 0; font-size: 13px; font-weight: 800; color: #111827; }
    .saved-item-meta {
      margin: 2px 0 0; font-size: 11px; font-weight: 600; color: #9ca3af;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .saved-use {
      border: none; border-radius: 999px; padding: 6px 10px;
      background: color-mix(in srgb, var(--app-primary) 22%, #fff);
      font-size: 11px; font-weight: 800; color: #111827;
    }
    .saved-del {
      width: 34px; height: 34px; border: none; border-radius: 10px;
      background: #fef2f2; color: #dc2626; display: grid; place-items: center;
    }

    .addr-modal {
      padding: 10px 20px calc(20px + var(--safe-area-bottom));
      background: #fafbfc;
      min-height: 100%;
    }
    .addr-modal-handle {
      width: 36px; height: 4px; border-radius: 999px; background: #e5e7eb; margin: 0 auto 14px;
    }
    .addr-modal-top {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
    }
    .addr-modal-top h2 { margin: 0; font-size: 18px; font-weight: 900; color: #111827; }
    .addr-modal-close {
      width: 34px; height: 34px; border: none; border-radius: 50%;
      background: #f3f4f6; display: grid; place-items: center; color: #111827;
    }
    .addr-modal-sub {
      margin: 4px 0 18px; font-size: 12px; font-weight: 600; color: #9ca3af;
    }
    .addr-field-label {
      margin: 0 0 8px; font-size: 11px; font-weight: 800; letter-spacing: 0.04em;
      text-transform: uppercase; color: #9ca3af;
    }
    .addr-field-label span { text-transform: none; letter-spacing: 0; font-weight: 600; }
    .addr-tags { display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap; }
    .addr-tag {
      border: 1.5px solid #e5e7eb; background: #fff; border-radius: 999px;
      padding: 8px 14px; font-size: 13px; font-weight: 800; color: #4b5563;
    }
    .addr-tag.is-active {
      border-color: var(--app-primary);
      background: color-mix(in srgb, var(--app-primary) 18%, #fff);
      color: #111827;
    }
    .addr-custom, .addr-landmark { margin-bottom: 14px; }
    .addr-custom input, .addr-landmark input {
      width: 100%; border: 2px solid #f3f4f6; border-radius: 16px; background: #fff;
      padding: 14px 16px; font-size: 14px; font-weight: 600; color: #111827; outline: none;
    }
    .addr-custom input:focus, .addr-landmark input:focus { border-color: var(--app-primary); }
    .addr-map-field { margin-bottom: 14px; }
    .addr-error { margin: 0 0 12px; font-size: 13px; font-weight: 600; color: #dc2626; }
    .addr-save-btn {
      width: 100%; border: none; border-radius: 999px; padding: 14px 20px;
      background: var(--app-primary); color: #111827; font-size: 15px; font-weight: 800;
      box-shadow: 0 4px 14px rgba(var(--app-primary-rgb), 0.35);
    }
    .addr-save-btn:disabled { opacity: 0.5; }

    .error { color: #dc2626; font-size: 13px; margin: 0 0 12px; }
    .success { color: #16a34a; font-size: 13px; margin: 0 0 12px; }
  `],
})
export class EditProfilePage implements OnInit {
  @ViewChild('cameraInput') cameraInput?: ElementRef<HTMLInputElement>;
  @ViewChild('libraryInput') libraryInput?: ElementRef<HTMLInputElement>;
  @ViewChild('coachGalleryInput') coachGalleryInput?: ElementRef<HTMLInputElement>;
  @ViewChild('verificationInput') verificationInput?: ElementRef<HTMLInputElement>;

  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  private readonly navigationLocation = inject(Location);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly mediaPicker = inject(NativeMediaPickerService);
  private readonly savedAddressesService = inject(SavedAddressesService);
  private readonly locationService = inject(LocationService);
  private readonly coachService = inject(CoachService);

  readonly addressTags = ADDRESS_TAGS;

  name = '';
  phone = '';
  email = '';
  location = '';
  previewUrl = '';
  selectedFile?: File;
  error = '';
  success = '';
  submitting = false;
  savedAddresses: SavedAddress[] = [];
  coachGallery: CoachGalleryItem[] = [];
  galleryBusy = false;
  galleryError = '';
  selectedGalleryCategory: CoachGalleryCategory = 'profile_photo';
  readonly galleryCategories: { id: CoachGalleryCategory; label: string }[] = [
    { id: 'profile_photo', label: 'Profile photos' }, { id: 'training_photo', label: 'Training photos' },
    { id: 'video', label: 'Videos' }, { id: 'certificate', label: 'Certificates' },
  ];
  readonly coachLanguageOptions = COACH_LANGUAGES;
  readonly coachLocationOptions = COACH_LOCATIONS;
  readonly coachSessionTypeOptions = COACH_SESSION_TYPES;
  readonly coachEquipmentOptions = COACH_EQUIPMENT;
  readonly coachTrialOptions = COACH_TRIAL_TYPES;
  readonly coachTravelOptions = COACH_TRAVEL_MODES;
  readonly coachDays = COACH_DAYS;
  readonly coachTimes = COACH_TIMES;
  readonly coachAchievementOptions = COACH_ACHIEVEMENTS;
  coachDetailsLoaded = false;
  coachDetailsSaving = false;
  coachDetailsError = '';
  coachDetailsSuccess = '';
  coachDetails: CoachProfileDetails = this.emptyCoachDetails();
  verificationDocuments: CoachVerificationDocument[] = [];
  verificationBusy = false;
  verificationError = '';
  selectedVerificationType: CoachVerificationDocumentType = 'government_id';
  readonly verificationCategories: { id: CoachVerificationDocumentType; label: string; hint: string }[] = [
    { id: 'government_id', label: 'Government ID', hint: 'Aadhar, PAN or Passport' },
    { id: 'coaching_certificate', label: 'Coaching Certificate', hint: 'BWF, BCCI, FIFA etc.' },
    { id: 'professional_profile_photo', label: 'Professional Profile Photo', hint: 'Clear headshot, good lighting' },
  ];

  get verificationAccept(): string {
    return this.selectedVerificationType === 'professional_profile_photo' ? 'image/*' : 'image/*,application/pdf,.pdf';
  }

  get coachGalleryAccept(): string {
    return this.selectedGalleryCategory === 'video' ? 'video/*' : this.selectedGalleryCategory === 'certificate' ? 'image/*,application/pdf,.pdf' : 'image/*';
  }

  addAddressOpen = false;
  newAddressTag: (typeof ADDRESS_TAGS)[number] = 'Home';
  newAddressLabel = '';
  newAddressValue = '';
  newAddressLandmark = '';
  addAddressError = '';

  get initials() {
    return (this.name || 'U').charAt(0).toUpperCase();
  }

  get canSaveNewAddress(): boolean {
    return !!this.resolveNewLabel() && !!this.newAddressValue.trim();
  }

  ngOnInit() {
    const user = this.auth.user();
    if (!user) {
      void this.router.navigateByUrl('/login');
      return;
    }
    this.name = user.name;
    this.phone = user.phone || '';
    this.email = user.email || '';
    this.location = user.location || '';
    this.previewUrl = user.profileImage || '';
    this.reloadSaved();
    if (user.role === 'coach') {
      this.loadCoachGallery();
      this.loadCoachDetails();
      this.loadVerificationDocuments();
    }
  }

  private emptyCoachDetails(): CoachProfileDetails {
    return {
      languages: [], coachingLocations: [], serviceRadius: '', sessionTypes: [], equipment: [],
      trialEnabled: null, trialType: '', travelMode: '', weeklyAvailability: {},
      feeOptions: { individual: '', group: '', monthly: '' }, feesNegotiable: false,
      achievements: [], bio: '',
    };
  }

  private loadCoachDetails(): void {
    this.coachService.getMyCoachProfileDetails().subscribe({
      next: (result) => {
        if (!result.success || !result.data) return;
        this.coachDetails = {
          ...this.emptyCoachDetails(),
          ...result.data,
          languages: Array.isArray(result.data.languages) ? result.data.languages : [],
          coachingLocations: Array.isArray(result.data.coachingLocations) ? result.data.coachingLocations : [],
          sessionTypes: Array.isArray(result.data.sessionTypes) ? result.data.sessionTypes : [],
          equipment: Array.isArray(result.data.equipment) ? result.data.equipment : [],
          weeklyAvailability: result.data.weeklyAvailability && typeof result.data.weeklyAvailability === 'object' ? { ...result.data.weeklyAvailability } : {},
          feeOptions: { individual: '', group: '', monthly: '', ...(result.data.feeOptions || {}) },
          achievements: Array.isArray(result.data.achievements) ? result.data.achievements : [],
        };
        this.coachDetailsLoaded = true;
      },
      error: () => { this.coachDetailsError = 'Coaching details could not be loaded.'; },
    });
  }

  toggleCoachArray(field: 'languages' | 'coachingLocations' | 'sessionTypes' | 'equipment' | 'achievements', value: string): void {
    const values = this.coachDetails[field];
    this.coachDetails[field] = values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
    this.coachDetailsSuccess = '';
  }

  isCoachAvailable(day: string, time: string): boolean {
    return (this.coachDetails.weeklyAvailability[day] || []).includes(time);
  }

  toggleCoachAvailability(day: string, time: string): void {
    const current = this.coachDetails.weeklyAvailability[day] || [];
    this.coachDetails.weeklyAvailability = {
      ...this.coachDetails.weeklyAvailability,
      [day]: current.includes(time) ? current.filter((item) => item !== time) : [...current, time],
    };
    this.coachDetailsSuccess = '';
  }

  selectedCoachSlotCount(): number {
    return Object.values(this.coachDetails.weeklyAvailability).reduce((count, slots) => count + slots.length, 0);
  }

  verificationFor(type: CoachVerificationDocumentType): CoachVerificationDocument | undefined {
    return this.verificationDocuments.find((document) => document.documentType === type);
  }

  addVerificationDocument(type: CoachVerificationDocumentType): void {
    if (this.verificationBusy || !this.verificationInput?.nativeElement) return;
    this.selectedVerificationType = type;
    this.verificationError = '';
    this.verificationInput.nativeElement.value = '';
    this.verificationInput.nativeElement.accept = this.verificationAccept;
    this.verificationInput.nativeElement.click();
  }

  async onVerificationFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.verificationBusy = true;
    this.verificationError = '';
    try {
      const result = await firstValueFrom(this.coachService.uploadCoachVerificationDocument(this.selectedVerificationType, file));
      if (!result.success || !result.data) throw new Error(result.message || 'Unable to upload this document.');
      this.verificationDocuments = [
        ...this.verificationDocuments.filter((document) => document.documentType !== this.selectedVerificationType),
        result.data,
      ];
    } catch (error: any) {
      this.verificationError = error?.error?.message || error?.message || 'Unable to upload this document.';
    } finally { this.verificationBusy = false; }
  }

  async removeVerificationDocument(document: CoachVerificationDocument): Promise<void> {
    if (this.verificationBusy) return;
    this.verificationBusy = true;
    this.verificationError = '';
    try {
      const result = await firstValueFrom(this.coachService.deleteCoachVerificationDocument(document.id));
      if (!result.success) throw new Error(result.message || 'Unable to remove this document.');
      this.verificationDocuments = this.verificationDocuments.filter((item) => item.id !== document.id);
    } catch (error: any) {
      this.verificationError = error?.error?.message || error?.message || 'Unable to remove this document.';
    } finally { this.verificationBusy = false; }
  }

  private loadVerificationDocuments(): void {
    this.coachService.getMyCoachVerificationDocuments().subscribe({
      next: (result) => { this.verificationDocuments = Array.isArray(result.data) ? result.data : []; },
      error: () => { this.verificationError = 'Verification documents could not be loaded.'; },
    });
  }

  galleryFor(category: CoachGalleryCategory): CoachGalleryItem[] { return this.coachGallery.filter((item) => item.category === category); }
  galleryLabel(category: CoachGalleryCategory): string { return this.galleryCategories.find((item) => item.id === category)?.label || 'Gallery'; }

  addCoachMedia(category: CoachGalleryCategory): void {
    if (this.galleryBusy || !this.coachGalleryInput?.nativeElement) return;
    this.selectedGalleryCategory = category;
    this.galleryError = '';
    this.coachGalleryInput.nativeElement.value = '';
    this.coachGalleryInput.nativeElement.accept = this.coachGalleryAccept;
    this.coachGalleryInput.nativeElement.click();
  }

  async onCoachGalleryFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.galleryBusy = true;
    this.galleryError = '';
    try {
      const result = await firstValueFrom(this.coachService.uploadCoachMedia(this.selectedGalleryCategory, file));
      if (!result.success || !result.data) throw new Error(result.message || 'Unable to upload this item.');
      this.coachGallery = [result.data, ...this.coachGallery];
    } catch (error: any) { this.galleryError = error?.error?.message || error?.message || 'Unable to upload this item.'; }
    finally { this.galleryBusy = false; }
  }

  async removeCoachMedia(item: CoachGalleryItem): Promise<void> {
    if (this.galleryBusy) return;
    this.galleryBusy = true;
    this.galleryError = '';
    try {
      const result = await firstValueFrom(this.coachService.deleteCoachMedia(item.id));
      if (!result.success) throw new Error(result.message || 'Unable to remove this item.');
      this.coachGallery = this.coachGallery.filter((media) => media.id !== item.id);
    } catch (error: any) { this.galleryError = error?.error?.message || error?.message || 'Unable to remove this item.'; }
    finally { this.galleryBusy = false; }
  }

  private loadCoachGallery(): void {
    this.coachService.getMyCoachMedia().subscribe({
      next: (result) => { this.coachGallery = Array.isArray(result.data) ? result.data : []; },
      error: () => { this.galleryError = 'Could not load your saved coaching gallery.'; },
    });
  }

  onPhone(value: string) {
    this.phone = (value || '').replace(/\D/g, '').slice(0, 10);
  }

  openAddAddressModal() {
    this.addAddressError = '';
    this.newAddressTag = 'Home';
    this.newAddressLabel = '';
    this.newAddressValue = this.location.trim();
    this.newAddressLandmark = '';
    this.addAddressOpen = true;
  }

  closeAddAddressModal() {
    this.addAddressOpen = false;
    this.addAddressError = '';
  }

  selectTag(tag: (typeof ADDRESS_TAGS)[number]) {
    this.newAddressTag = tag;
    if (tag !== 'Other') {
      this.newAddressLabel = '';
    }
  }

  confirmAddAddress() {
    const label = this.resolveNewLabel();
    const address = this.newAddressValue.trim();
    if (!label || !address) {
      this.addAddressError = 'Add a name and full address to save.';
      return;
    }

    const gps = this.locationService.getSavedLocation();
    const landmark = this.newAddressLandmark.trim();
    const fullAddress = landmark ? `${address} · Near ${landmark}` : address;

    this.savedAddressesService.add({
      label,
      address: fullAddress,
      city: gps?.city,
      postalArea: gps?.postalArea,
      pincode: gps?.pincode,
      latitude: gps?.latitude ?? null,
      longitude: gps?.longitude ?? null,
    });

    this.reloadSaved();
    this.addAddressOpen = false;
    this.success = 'Address saved. You can select it from Home.';
  }

  useAddress(addr: SavedAddress) {
    this.location = addr.address;
    this.savedAddressesService.select(addr.id);
    this.success = 'This address will be used on Home.';
  }

  removeAddress(id: string) {
    this.savedAddressesService.remove(id);
    this.reloadSaved();
  }

  private resolveNewLabel(): string {
    if (this.newAddressTag === 'Other') {
      return this.newAddressLabel.trim();
    }
    return this.newAddressTag;
  }

  private reloadSaved() {
    this.savedAddresses = this.savedAddressesService.list();
  }

  async pickPhoto() {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Update profile photo',
      buttons: [
        { text: 'Take photo', icon: 'camera-outline', handler: () => { void this.openCamera(); } },
        { text: 'Photo library', icon: 'images-outline', handler: () => { void this.openLibrary(); } },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async openCamera() {
    if (Capacitor.isNativePlatform()) {
      const file = await this.mediaPicker.takePhoto('profile-camera');
      if (file) this.setSelectedPhoto(file);
      return;
    }
    this.cameraInput?.nativeElement.click();
  }

  private async openLibrary() {
    if (Capacitor.isNativePlatform()) {
      const file = await this.mediaPicker.pickPhoto('profile-gallery');
      if (file) this.setSelectedPhoto(file);
      return;
    }
    this.libraryInput?.nativeElement.click();
  }

  async onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    try {
      const normalized = await normalizeImageFile(file, 'profile');
      this.setSelectedPhoto(normalized);
    } catch {
      this.error = 'Unable to read that image. Please try another photo.';
    }
  }

  private setSelectedPhoto(file: File) {
    if (this.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(this.previewUrl);
    }
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
    this.error = '';
  }

  back() {
    this.navigationLocation.back();
  }

  async save() {
    if (this.submitting || !this.name.trim()) return;
    this.submitting = true;
    this.coachDetailsSaving = this.auth.user()?.role === 'coach' && this.coachDetailsLoaded;
    this.error = '';
    this.success = '';
    this.coachDetailsError = '';
    this.coachDetailsSuccess = '';
    try {
      const gps = this.locationService.getSavedLocation();
      const updated = await firstValueFrom(this.auth.updateProfile({
        name: this.name.trim(),
        phone: this.phone || undefined,
        email: this.email || null,
        location: this.location.trim() || null,
        latitude: gps?.latitude ?? null,
        longitude: gps?.longitude ?? null,
      }, this.selectedFile));
      if (this.coachDetailsSaving) {
        const detailsPayload: CoachProfileDetailsPayload = {
          languages: this.coachDetails.languages,
          coaching_locations: this.coachDetails.coachingLocations,
          service_radius: this.coachDetails.serviceRadius,
          session_types: this.coachDetails.sessionTypes,
          equipment: this.coachDetails.equipment,
          trial_enabled: this.coachDetails.trialEnabled,
          trial_type: this.coachDetails.trialType,
          travel_mode: this.coachDetails.travelMode,
          weekly_availability: this.coachDetails.weeklyAvailability,
          fee_options: this.coachDetails.feeOptions,
          fees_negotiable: this.coachDetails.feesNegotiable,
          achievements: this.coachDetails.achievements,
          bio: this.coachDetails.bio.trim(),
        };
        await firstValueFrom(this.coachService.saveMyCoachProfileDetails(detailsPayload));
        this.coachDetailsSuccess = 'Coaching details updated successfully.';
      }
      this.selectedFile = undefined;
      this.previewUrl = updated.profileImage || this.previewUrl;
      if (this.location.trim()) {
        this.savedAddressesService.select(CURRENT_LOCATION_ID);
      }
      this.success = 'Profile updated successfully.';
      setTimeout(() => this.back(), 600);
    } catch (e) {
      this.error = String(e);
    } finally {
      this.coachDetailsSaving = false;
      this.submitting = false;
    }
  }
}
