import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
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
          <div class="avatar" [style.backgroundImage]="previewUrl ? 'url(' + previewUrl + ')' : 'none'">
            <span *ngIf="!previewUrl">{{ initials }}</span>
          </div>
          <label class="upload-btn">
            Change Photo
            <input type="file" accept="image/jpeg,image/png,image/webp" hidden (change)="onFile($event)" />
          </label>
        </div>

        <div class="fields">
          <app-text-input label="Full Name" placeholder="Your name" icon="person-outline" [(ngModel)]="name"></app-text-input>
          <app-text-input label="Mobile Number" placeholder="Mobile" type="tel" icon="call-outline"
            [maxlength]="10" [ngModel]="phone" (ngModelChange)="onPhone($event)"></app-text-input>
          <app-text-input label="Email Address" placeholder="Email" type="email" icon="mail-outline" [(ngModel)]="email"></app-text-input>
          <app-location-field label="Location" placeholder="City e.g. Lucknow" [(ngModel)]="location"></app-location-field>
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
    .avatar-block { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 24px; }
    .avatar { width: 96px; height: 96px; border-radius: 999px; background: linear-gradient(135deg, #8cf000, #ff7a00); display: grid; place-items: center; font-size: 32px; font-weight: 900; color: #111827; background-size: cover; background-position: center; }
    .upload-btn { font-size: 13px; font-weight: 700; color: #2563eb; cursor: pointer; }
    .fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .error { color: #dc2626; font-size: 13px; margin: 0 0 12px; }
    .success { color: #16a34a; font-size: 13px; margin: 0 0 12px; }
  `],
})
export class EditProfilePage implements OnInit {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);

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

  onFile(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.selectedFile = file;
    this.previewUrl = URL.createObjectURL(file);
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
      await firstValueFrom(this.auth.updateProfile({
        name: this.name.trim(),
        phone: this.phone || undefined,
        email: this.email || null,
        location: this.location.trim() || null,
      }, this.selectedFile));
      this.success = 'Profile updated successfully.';
      setTimeout(() => this.back(), 600);
    } catch (e) {
      this.error = String(e);
    } finally {
      this.submitting = false;
    }
  }
}
