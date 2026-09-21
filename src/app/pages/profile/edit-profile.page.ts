import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
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

        <app-primary-button icon="checkmark" [disabled]="submitting || !name.trim()" (pressed)="save()">
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

  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  private readonly actionSheetCtrl = inject(ActionSheetController);
  private readonly mediaPicker = inject(NativeMediaPickerService);
  private readonly savedAddressesService = inject(SavedAddressesService);
  private readonly locationService = inject(LocationService);

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
    void this.router.navigateByUrl(this.auth.user()?.role === 'coach' ? '/app/coach/profile' : '/app/profile');
  }

  async save() {
    if (this.submitting || !this.name.trim()) return;
    this.submitting = true;
    this.error = '';
    this.success = '';
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
      this.submitting = false;
    }
  }
}
