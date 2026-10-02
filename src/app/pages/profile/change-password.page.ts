import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

@Component({
  selector: 'app-change-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TextInputComponent, PrimaryButtonComponent, BrandHeaderShellComponent],
  template: `
    <ion-content fullscreen>
      <app-brand-header-shell>
      <main class="edit-profile">
        <header class="hdr">
          <h1>Change Password</h1>
        </header>

        <div class="fields">
          <app-text-input label="Current Password" type="password" icon="lock-closed-outline" [(ngModel)]="currentPassword"></app-text-input>
          <app-text-input label="New Password" type="password" icon="lock-closed-outline" [(ngModel)]="password"></app-text-input>
          <app-text-input label="Confirm Password" type="password" icon="lock-closed-outline" [(ngModel)]="passwordConfirmation"></app-text-input>
        </div>

        <p *ngIf="error" class="error">{{ error }}</p>
        <p *ngIf="success" class="success">{{ success }}</p>

        <app-primary-button icon="checkmark" [disabled]="!canSubmit || submitting" (pressed)="submit()">
          {{ submitting ? 'Updating...' : 'Update Password' }}
        </app-primary-button>
      </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .edit-profile { padding: 14px 20px 32px; min-height: 100%; background: #fafbfc; }
    .hdr { display: flex; align-items: center; gap: 12px; margin-bottom: 24px; }
    .hdr h1 { flex: 1; font-size: var(--app-header-title-size); font-weight: var(--app-header-title-weight); line-height: var(--app-header-title-line-height); margin: 0; color: #111827; }
    .fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .error { color: #dc2626; font-size: 13px; margin: 0 0 12px; }
    .success { color: #16a34a; font-size: 13px; margin: 0 0 12px; }
  `],
})
export class ChangePasswordPage {
  readonly auth = inject(AuthService);

  currentPassword = '';
  password = '';
  passwordConfirmation = '';
  error = '';
  success = '';
  submitting = false;

  get canSubmit() {
    return this.currentPassword.length >= 6 && this.password.length >= 6
      && this.password === this.passwordConfirmation;
  }

  async submit() {
    if (!this.canSubmit || this.submitting) return;
    this.submitting = true;
    this.error = '';
    this.success = '';
    try {
      await firstValueFrom(this.auth.changePassword({
        current_password: this.currentPassword,
        password: this.password,
        password_confirmation: this.passwordConfirmation,
      }));
      this.success = 'Password updated successfully.';
      this.currentPassword = '';
      this.password = '';
      this.passwordConfirmation = '';
    } catch (e) {
      this.error = String(e);
    } finally {
      this.submitting = false;
    }
  }
}
