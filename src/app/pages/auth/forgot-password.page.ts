import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';

@Component({
  selector: 'app-forgot-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TextInputComponent, PrimaryButtonComponent],
  template: `
    <ion-content fullscreen>
      <main class="auth-flow">
        <button type="button" class="back-btn" (click)="router.navigateByUrl('/login')">
          <ion-icon name="chevron-back-outline"></ion-icon>
        </button>
        <h1 class="title">Forgot Password</h1>
        <p class="subtitle">Enter your registered mobile number. We'll send you a 6-digit OTP.</p>

        <div class="fields">
          <app-text-input label="Mobile Number" placeholder="Enter mobile number" type="tel" icon="call-outline"
            [maxlength]="10" [ngModel]="phone" (ngModelChange)="onPhone($event)">
            <span prefix class="dial"><span class="flag">🇮🇳</span><span class="code">+91</span></span>
          </app-text-input>
        </div>

        <p *ngIf="error" class="error">{{ error }}</p>
        <p *ngIf="devOtp" class="dev-otp">Dev OTP: <strong>{{ devOtp }}</strong></p>

        <app-primary-button icon="arrow-forward" [disabled]="phone.length !== 10 || submitting" (pressed)="submit()">
          {{ submitting ? 'Sending...' : 'Send OTP' }}
        </app-primary-button>
      </main>
    </ion-content>
  `,
  styles: [`
    .auth-flow { padding: calc(20px + var(--safe-area-top)) 20px 32px; min-height: 100%; background: #fafbfc; }
    .back-btn { width: 40px; height: 40px; border: none; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; margin-bottom: 20px; }
    .title { font-size: 28px; font-weight: 900; color: #111827; margin: 0 0 8px; }
    .subtitle { font-size: 14px; color: #6b7280; line-height: 1.5; margin: 0 0 24px; }
    .fields { margin-bottom: 16px; }
    .dial { display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; color: #111827; }
    .error { color: #dc2626; font-size: 13px; margin: 0 0 12px; }
    .dev-otp { color: #2563eb; font-size: 13px; margin: 0 0 12px; }
  `],
})
export class ForgotPasswordPage {
  readonly auth = inject(AuthService);
  readonly router = inject(Router);

  phone = '';
  error = '';
  devOtp = '';
  submitting = false;

  onPhone(value: string) {
    this.phone = (value || '').replace(/\D/g, '').slice(0, 10);
  }

  async submit() {
    if (this.phone.length !== 10 || this.submitting) return;
    this.submitting = true;
    this.error = '';
    this.devOtp = '';
    try {
      const result = await firstValueFrom(this.auth.forgotPassword({ phone: this.phone }));
      if (result.otp) this.devOtp = result.otp;
      void this.router.navigate(['/reset-password'], { queryParams: { phone: this.phone } });
    } catch (e) {
      this.error = String(e);
    } finally {
      this.submitting = false;
    }
  }
}
