import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { NativeMediaPickerService } from '../../core/services/native-media-picker.service';
import { normalizeImageFile } from '../../core/utils/image-file.util';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { LocationFieldComponent } from '../../shared/components/location-field/location-field.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

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
          <!-- Web / fallback only — native Android uses Capacitor Camera (Samsung-safe). -->
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

        <p *ngIf="error" class="error">{{ error }}</p>
        <p *ngIf="success" class="success">{{ success }}</p>

        <app-primary-button icon="checkmark" [disabled]="submitting || !name.trim()" (pressed)="save()">
          {{ submitting ? 'Saving...' : 'Save Changes' }}
        </app-primary-button>
      </main>
    </ion-content>
  `,
  styles: [`
    .edit-profile { padding: calc(12px + var(--safe-area-top)) 20px 32px; min-height: 100%; background: #fafbfc; }
    .hdr { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .hdr h1 { flex: 1; text-align: center; font-size: 17px; font-weight: 900; margin: 0; color: #111827; }
    .spacer { width: 40px; }
    .icon-btn { width: 40px; height: 40px; border: none; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; }
    .avatar-block { display: flex; flex-direction: column; align-items: center; gap: 8px; margin-bottom: 24px; }
    .avatar {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      overflow: hidden;
      background: linear-gradient(135deg, var(--app-primary), #ff7a00);
      display: grid;
      place-items: center;
      font-size: 32px;
      font-weight: 900;
      color: #111827;
      flex-shrink: 0;
      position: relative;
    }
    .avatar.has-photo { background: #e5e7eb; }
    .avatar img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      display: block;
    }
    .upload-btn { font-size: 13px; font-weight: 700; color: #2563eb; cursor: pointer; background: none; border: none; padding: 0; }
    .hint { margin: 0; font-size: 11px; color: #9ca3af; font-weight: 600; }
    .fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
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

  name = '';
  phone = '';
  email = '';
  location = '';
  previewUrl = '';
  selectedFile?: File;
  error = '';
  success = '';
  submitting = false;

  get initials() {
    return (this.name || 'U').charAt(0).toUpperCase();
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
  }

  onPhone(value: string) {
    this.phone = (value || '').replace(/\D/g, '').slice(0, 10);
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
      const updated = await firstValueFrom(this.auth.updateProfile({
        name: this.name.trim(),
        phone: this.phone || undefined,
        email: this.email || null,
        location: this.location.trim() || null,
      }, this.selectedFile));
      this.selectedFile = undefined;
      this.previewUrl = updated.profileImage || this.previewUrl;
      this.success = 'Profile updated successfully.';
      setTimeout(() => this.back(), 600);
    } catch (e) {
      this.error = String(e);
    } finally {
      this.submitting = false;
    }
  }
}
