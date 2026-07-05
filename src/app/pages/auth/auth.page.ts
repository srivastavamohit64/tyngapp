import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../shared/models/app.models';
import { TextInputComponent } from '../../shared/components/text-input/text-input.component';
import { CheckboxComponent } from '../../shared/components/checkbox/checkbox.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1583725596997-8e7a07cbe019?w=800&h=700&fit=crop&auto=format&q=85';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TextInputComponent,
    CheckboxComponent,
    PrimaryButtonComponent,
  ],
  template: `
    <ion-content fullscreen [scrollY]="true">
      <main class="login-shell">
        <!-- Hero -->
        <div class="hero">
          <img [src]="heroImage" alt="Players" class="hero-img" />
          <div class="hero-overlay"></div>
          <div class="hero-fade"></div>

          <div class="hero-tags">
            <span *ngFor="let tag of sportTags" class="hero-tag">{{ tag }}</span>
          </div>

          <div class="hero-pill">🔥 4,200+ active players</div>
        </div>

        <!-- Sliding card -->
        <div class="form-card-wrap">
          <div class="form-header">
            <h1 class="welcome-title">tyng<span class="dot">.</span></h1>
            <p class="welcome-subtitle">
              Find Players. <span class="bold">Create Teams.</span> Play Together.
            </p>
          </div>

          <div class="form-box">
            <!-- Role chips (signup only) -->
            <div class="role-block" *ngIf="isSignup">
              <p class="role-label">I'm joining as</p>
              <div class="role-grid">
                <button
                  type="button"
                  *ngFor="let r of roles"
                  class="role-chip"
                  [class.active]="selectedRole === r.id"
                  (click)="selectedRole = r.id"
                >
                  <ion-icon [name]="r.icon" class="role-icon"></ion-icon>
                  <span class="role-name">{{ r.name }}</span>
                </button>
              </div>
            </div>

            <!-- Fields with floating labels -->
            <div class="fields">
              <app-text-input
                *ngIf="isSignup"
                label="Full Name"
                placeholder="Enter your name"
                icon="person-outline"
                [(ngModel)]="name"
              ></app-text-input>

              <app-text-input
                label="Mobile Number"
                placeholder="Enter mobile number"
                type="tel"
                icon="call-outline"
                [maxlength]="10"
                [ngModel]="phone"
                (ngModelChange)="onPhone($event)"
              >
                <span prefix class="dial">
                  <span class="flag">🇮🇳</span>
                  <span class="code">+91</span>
                  <span class="dial-sep"></span>
                </span>
                <span *ngIf="phone.length === 10" suffix class="phone-ok">
                  <ion-icon name="checkmark"></ion-icon>
                </span>
              </app-text-input>

              <app-text-input
                *ngIf="isSignup"
                label="Email Address"
                placeholder="Enter email address"
                type="email"
                icon="mail-outline"
                [(ngModel)]="email"
              ></app-text-input>

              <app-text-input
                label="Password"
                placeholder="Enter password"
                [type]="showPassword ? 'text' : 'password'"
                icon="lock-closed-outline"
                [(ngModel)]="password"
              >
                <button
                  type="button"
                  suffix
                  class="pwd-toggle"
                  (click)="togglePassword($event)"
                  [attr.aria-label]="showPassword ? 'Hide password' : 'Show password'"
                >
                  <ion-icon [name]="showPassword ? 'eye-off-outline' : 'eye-outline'"></ion-icon>
                </button>
              </app-text-input>
            </div>

            <app-checkbox *ngIf="isSignup" [(ngModel)]="agreed" class="agree-check">
              I agree to the
              <span class="link">Terms &amp; Conditions</span>
              and
              <span class="link">Privacy Policy</span>
            </app-checkbox>

            <app-primary-button
              class="cta-wrap"
              icon="arrow-forward"
              [disabled]="!canSubmit"
              (pressed)="handleSubmit()"
            >
              {{ isSignup ? 'Continue' : 'Log In' }}
            </app-primary-button>

            <p class="auth-switch">
              <ng-container *ngIf="isSignup">
                Already have an account?
                <button type="button" class="auth-switch-link" (click)="setMode('login')">Log in</button>
              </ng-container>
              <ng-container *ngIf="!isSignup">
                Don't have an account?
                <button type="button" class="auth-switch-link" (click)="setMode('signup')">Join</button>
              </ng-container>
            </p>
          </div>

          <div class="divider">
            <span class="line"></span>
            <span class="or">or continue with</span>
            <span class="line"></span>
          </div>

          <div class="social-row">
            <button type="button" class="social google" (click)="handleSocial()">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.259c-.806.54-1.837.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
              </svg>
              <span>Google</span>
            </button>
            <button type="button" class="social apple" (click)="handleSocial()">
              <ion-icon name="logo-apple"></ion-icon>
              <span>Apple</span>
            </button>
          </div>

          <p class="bottom-msg">🏙️ Join thousands of players across your city.</p>
        </div>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .login-shell {
        min-height: 100%;
        background: #fafbfc;
        padding-bottom: env(safe-area-inset-bottom, 0px);
      }

      .hero {
        position: relative;
        height: 46vh;
        min-height: 280px;
        overflow: hidden;
        background: #111827;
      }

      .hero-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
      }

      .hero-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.2), rgba(0, 0, 0, 0.1), transparent);
      }

      .hero-fade {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 112px;
        background: linear-gradient(to top, #fafbfc, transparent);
      }

      .hero-tags {
        position: absolute;
        top: calc(32px + env(safe-area-inset-top, 0px));
        left: 20px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
      }

      .hero-tag {
        font-size: 11px;
        font-weight: 600;
        color: #fff;
        background: rgba(0, 0, 0, 0.3);
        backdrop-filter: blur(8px);
        padding: 6px 12px;
        border-radius: 999px;
        border: 1px solid rgba(255, 255, 255, 0.2);
      }

      .hero-pill {
        position: absolute;
        bottom: 40px;
        right: 20px;
        background: #8cf000;
        color: #111827;
        font-size: 12px;
        font-weight: 900;
        padding: 6px 12px;
        border-radius: 999px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .form-card-wrap {
        margin-top: -28px;
        position: relative;
        z-index: 10;
        background: #fafbfc;
        border-radius: 36px 36px 0 0;
        padding: 32px 0 48px;
      }

      .form-header {
        text-align: center;
        padding: 0 24px 24px;
      }

      .welcome-title {
        font-size: 38px;
        font-weight: 900;
        letter-spacing: -0.05em;
        color: #111827;
        margin: 0;
        line-height: 1;
      }

      .welcome-title .dot {
        color: #8cf000;
      }

      .welcome-subtitle {
        margin: 8px 0 0;
        font-size: 15px;
        color: #6b7280;
        font-weight: 500;
        line-height: 1.35;
      }

      .welcome-subtitle .bold {
        color: #111827;
        font-weight: 600;
      }

      .form-box {
        margin: 0 16px;
        background: #fff;
        border-radius: 28px;
        padding: 24px 20px 28px;
        box-shadow: 0 4px 32px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04);
      }

      .role-label {
        font-size: 12px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        margin: 0 0 10px;
      }

      .role-grid {
        display: flex;
        gap: 8px;
        margin-bottom: 20px;
      }

      .role-chip {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        padding: 10px 0;
        border-radius: 16px;
        border: 2px solid #f3f4f6;
        background: #fafbfc;
        color: #9ca3af;
        min-height: unset;
      }

      .role-chip.active {
        border-color: #8cf000;
        background: rgba(140, 240, 0, 0.08);
        color: #111827;
      }

      .role-icon {
        font-size: 16px;
      }

      .role-name {
        font-size: 11px;
        font-weight: 600;
        line-height: 1;
      }

      .fields {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .dial {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-shrink: 0;
      }

      .flag {
        font-size: 16px;
        line-height: 1;
      }

      .code {
        font-size: 13px;
        font-weight: 600;
        color: #6b7280;
      }

      .dial-sep {
        width: 1px;
        height: 16px;
        background: #e5e7eb;
        margin: 0 4px;
      }

      .phone-ok {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #8cf000;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        color: #111827;
        font-size: 12px;
      }

      .agree-check {
        display: block;
        margin-top: 16px;
      }

      .agree-check .link {
        color: #111827;
        font-weight: 600;
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-color: #8cf000;
      }

      .cta-wrap {
        display: block;
        margin-top: 24px;
      }

      .auth-switch {
        text-align: center;
        margin: 16px 0 0;
        font-size: 13px;
        color: #6b7280;
        line-height: 1.5;
      }

      .auth-switch-link {
        background: none;
        border: none;
        padding: 0;
        margin-left: 4px;
        font-size: 13px;
        font-weight: 700;
        color: #111827;
        text-decoration: underline;
        text-underline-offset: 2px;
        text-decoration-color: #8cf000;
        cursor: pointer;
      }

      .pwd-toggle {
        display: grid;
        place-items: center;
        width: 28px;
        height: 28px;
        border: none;
        background: transparent;
        color: #9ca3af;
        padding: 0;
        flex-shrink: 0;
        cursor: pointer;
      }

      .pwd-toggle ion-icon {
        font-size: 18px;
      }

      .cta-wrap ::ng-deep .btn {
        border-radius: 999px;
        min-height: 56px;
      }

      .divider {
        display: flex;
        align-items: center;
        gap: 16px;
        margin: 20px 32px;
      }

      .divider .line {
        flex: 1;
        height: 1px;
        background: #e5e7eb;
      }

      .divider .or {
        font-size: 12px;
        color: #9ca3af;
        font-weight: 500;
        white-space: nowrap;
      }

      .social-row {
        display: flex;
        gap: 12px;
        margin: 0 16px;
      }

      .social {
        flex: 1;
        height: 52px;
        min-height: 52px;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        font-size: 14px;
        font-weight: 600;
        border: 2px solid #f3f4f6;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      }

      .social.google {
        background: #fff;
        color: #111827;
      }

      .social.apple {
        background: #111827;
        color: #fff;
        border-color: #111827;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
      }

      .social.apple ion-icon {
        font-size: 18px;
      }

      .bottom-msg {
        text-align: center;
        margin: 28px 32px 16px;
        font-size: 13px;
        color: #9ca3af;
        line-height: 1.5;
      }
    `,
  ],
})
export class AuthPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  heroImage = HERO_IMAGE;
  mode: 'signup' | 'login' = 'signup';
  name = '';
  phone = '';
  email = '';
  password = '';
  showPassword = false;
  agreed = false;
  selectedRole: UserRole = 'player';

  readonly sportTags = ['⚽ Football', '🏀 Basketball', '🏏 Cricket'];

  readonly roles = [
    { id: 'player' as UserRole, name: 'Player', icon: 'people-outline' },
    { id: 'coach' as UserRole, name: 'Coach', icon: 'trophy-outline' },
    { id: 'venue' as UserRole, name: 'Venue Owner', icon: 'business-outline' },
  ];

  get isSignup() {
    return this.mode === 'signup';
  }

  get canSubmit() {
    const hasPhone = this.phone.length >= 10;
    const hasPassword = this.password.trim().length >= 6;
    if (this.isSignup) {
      return this.name.trim().length > 1 && hasPhone && hasPassword && this.agreed;
    }
    return hasPhone && hasPassword;
  }

  ngOnInit() {
    this.syncModeFromRoute();
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe(() => this.syncModeFromRoute());
  }

  onPhone(value: string) {
    this.phone = (value || '').replace(/\D/g, '').slice(0, 10);
  }

  togglePassword(event: Event) {
    event.stopPropagation();
    this.showPassword = !this.showPassword;
  }

  setMode(mode: 'signup' | 'login') {
    this.mode = mode;
    void this.router.navigateByUrl(mode === 'signup' ? '/auth' : '/login', { replaceUrl: true });
  }

  handleSubmit() {
    if (!this.canSubmit) return;
    if (this.isSignup) {
      this.auth.loginAs(this.selectedRole, { name: this.name.trim() });
      void this.router.navigateByUrl('/onboarding');
      return;
    }
    this.auth.loginAs(this.selectedRole, { isOnboarded: true });
    void this.router.navigateByUrl('/app/home');
  }

  handleSocial() {
    if (this.isSignup) {
      this.auth.loginAs(this.selectedRole);
      void this.router.navigateByUrl('/onboarding');
      return;
    }
    this.auth.loginAs(this.selectedRole, { isOnboarded: true });
    void this.router.navigateByUrl('/app/home');
  }

  private syncModeFromRoute() {
    const path = this.router.url.split('?')[0];
    this.mode = path.includes('/auth') ? 'signup' : 'login';
  }
}
