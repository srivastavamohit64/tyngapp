import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../shared/models/app.models';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-screen flex min-h-full flex-col bg-background text-white">
        <div class="mb-6 flex justify-center pt-2">
          <img src="assets/tyng-logo.jpeg" alt="Tyng Logo" class="h-24 w-24 rounded-xl object-contain" />
        </div>

        <section class="flex flex-1 flex-col justify-center">
          <div class="mb-8">
            <h1 class="mb-2 text-[32px] font-bold leading-tight tracking-[-0.02em]">
              {{ title }}
            </h1>
            <p class="text-[#94A3B8]">{{ subtitle }}</p>
          </div>

          <div *ngIf="step() === 'role'" class="space-y-3">
            <button
              *ngFor="let role of roles"
              class="auth-role-button flex w-full items-center gap-4 text-left transition-all active:scale-[0.98]"
              (click)="selectRole(role.id)"
            >
              <div class="grid h-12 w-12 place-items-center rounded-lg bg-primary/20 text-primary">
                <ion-icon [name]="role.icon" class="text-2xl"></ion-icon>
              </div>
              <div class="min-w-0 flex-1">
                <div class="font-medium text-white">{{ role.name }}</div>
                <div class="text-sm text-[#94A3B8]">{{ role.desc }}</div>
              </div>
              <ion-icon name="arrow-forward-outline" class="text-xl text-[#64748B]"></ion-icon>
            </button>
          </div>

          <div *ngIf="step() === 'phone'" class="space-y-4">
            <label class="relative block">
              <ion-icon name="call-outline" class="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-[#64748B]"></ion-icon>
              <input
                type="tel"
                inputmode="tel"
                [(ngModel)]="phone"
                placeholder="Phone number"
                class="auth-input w-full pl-12 pr-4 text-white outline-none transition-colors placeholder:text-[#64748B] focus:border-primary"
              />
            </label>
            <button
              class="auth-primary-button flex w-full items-center justify-center gap-2 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="phone.length < 10"
              (click)="sendOtp()"
            >
              Send OTP
              <ion-icon name="arrow-forward-outline" class="text-xl"></ion-icon>
            </button>
            <button class="auth-link-button w-full text-[#94A3B8]" (click)="step.set('role')">Change account type</button>
          </div>

          <div *ngIf="step() === 'otp'" class="space-y-4">
            <div class="flex justify-center gap-2">
              <input
                *ngFor="let digit of otpDigits; let index = index"
                type="text"
                maxlength="1"
                inputmode="numeric"
                class="auth-otp-input text-center text-white outline-none focus:border-primary"
                [value]="otp[index] || ''"
                (input)="setOtpDigit(index, $event)"
              />
            </div>
            <button
              class="auth-primary-button w-full font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              [disabled]="otp.length < 6"
              (click)="verifyOtp()"
            >
              Verify & Continue
            </button>
            <button class="auth-link-button w-full text-[#94A3B8]" (click)="step.set('phone')">Change phone number</button>
          </div>
        </section>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .auth-role-button {
        min-height: 84px;
        padding: 16px;
        border-radius: 12px;
        border: 2px solid rgba(255, 255, 255, 0.1);
        background: #111827;
      }

      .auth-input {
        min-height: 56px;
        padding-top: 16px;
        padding-bottom: 16px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: #1e293b;
      }

      .auth-primary-button {
        min-height: 52px;
        padding: 16px;
        border-radius: 12px;
        background: #2563eb;
      }

      .auth-link-button {
        min-height: 40px;
        padding: 8px 0;
        border-radius: 12px;
        background: transparent;
      }

      .auth-otp-input {
        width: 48px;
        height: 56px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: #1e293b;
      }
    `,
  ],
})
export class AuthPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  readonly step = signal<'role' | 'phone' | 'otp'>('role');
  selectedRole: UserRole | null = null;
  phone = '';
  otp = '';
  readonly otpDigits = Array.from({ length: 6 });
  readonly roles = [
    { id: 'player' as UserRole, name: 'Player', icon: 'people-outline', desc: 'Find games and players' },
    { id: 'coach' as UserRole, name: 'Coach', icon: 'trophy-outline', desc: 'Manage teams and sessions' },
    { id: 'venue' as UserRole, name: 'Venue Owner', icon: 'business-outline', desc: 'Manage bookings' },
  ];

  get title() {
    if (this.step() === 'phone') return 'Sign In';
    if (this.step() === 'otp') return 'Verify OTP';
    return 'Welcome to Tyng';
  }

  get subtitle() {
    if (this.step() === 'phone') return 'Enter your phone number to continue';
    if (this.step() === 'otp') return 'Enter the OTP sent to your phone';
    return 'Select your account type';
  }

  selectRole(role: UserRole) {
    this.selectedRole = role;
    this.step.set('phone');
  }

  sendOtp() {
    if (this.phone.length >= 10) {
      this.step.set('otp');
    }
  }

  setOtpDigit(index: number, event: Event) {
    const input = event.target as HTMLInputElement;
    const digits = this.otp.split('');
    digits[index] = input.value.slice(-1);
    this.otp = digits.join('');
    if (input.value && index < 5) {
      (input.nextElementSibling as HTMLInputElement | null)?.focus();
    }
  }

  verifyOtp() {
    if (this.otp.length === 6 && this.selectedRole) {
      this.auth.loginAs(this.selectedRole);
      this.router.navigateByUrl('/onboarding');
    }
  }
}
