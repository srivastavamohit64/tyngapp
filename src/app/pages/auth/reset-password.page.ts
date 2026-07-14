import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TextInputComponent, PrimaryButtonComponent],
  template: `
    <ion-content fullscreen>
      <main class="auth-flow">
        <button type="button" class="back-btn" (click)="router.navigateByUrl('/forgot-password')">
          <ion-icon name="chevron-back-outline"></ion-icon>
        </button>
        <h1 class="title">Reset Password</h1>
        <p class="subtitle">Enter the OTP sent to +91 {{ phone }} and your new password.</p>

        <div class="fields">
          <app-text-input label="OTP" placeholder="6-digit code" type="tel" icon="key-outline"
            [maxlength]="6" [(ngModel)]="otp"></app-text-input>
          <app-text-input label="New Password" placeholder="Enter new password" type="password"
            icon="lock-closed-outline" [(ngModel)]="password"></app-text-input>
          <app-text-input label="Confirm Password" placeholder="Confirm new password" type="password"
            icon="lock-closed-outline" [(ngModel)]="passwordConfirmation"></app-text-input>
        </div>

        <p *ngIf="error" class="error">{{ error }}</p>

        <app-primary-button icon="arrow-forward" [disabled]="!canSubmit || submitting" (pressed)="submit()">
          {{ submitting ? 'Resetting...' : 'Reset Password' }}
        </app-primary-button>
      </main>
    </ion-content>
  `,
  styles: [`
    .auth-flow { padding: calc(20px + var(--safe-area-top)) 20px 32px; min-height: 100%; background: #fafbfc; }
    .back-btn { width: 40px; height: 40px; border: none; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; margin-bottom: 20px; }
    .title { font-size: 28px; font-weight: 900; color: #111827; margin: 0 0 8px; }
    .subtitle { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 24px; }
    .fields { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
    .error { color: #dc2626; font-size: 13px; margin: 0 0 12px; }
  `],
})
export class ResetPasswordPage implements OnInit {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  phone = '';
  otp = '';
  password = '';
  passwordConfirmation = '';
  error = '';
  submitting = false;

  get canSubmit() {
    return this.phone.length === 10 && this.otp.length === 6
      && this.password.length >= 6 && this.password === this.passwordConfirmation;
  }

  ngOnInit() {
    this.phone = this.route.snapshot.queryParamMap.get('phone') || '';
  }

  async submit() {
    if (!this.canSubmit || this.submitting) return;
    this.submitting = true;
    this.error = '';
    try {
      await firstValueFrom(this.auth.resetPassword({
        phone: this.phone,
        otp: this.otp,
        password: this.password,
        password_confirmation: this.passwordConfirmation,
      }));
      this.auth.clearSession();
      void this.router.navigate(['/login'], {
        queryParams: { reset: '1', phone: this.phone },
      });
    } catch (e) {
      this.error = String(e);
    } finally {
      this.submitting = false;
    }
  }
}
