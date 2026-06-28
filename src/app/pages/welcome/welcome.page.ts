import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-welcome-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="welcome-shell">

        <!-- Centre content -->
        <section class="welcome-body">

          <!-- Logo with spring pop-in + glow ring + float -->
          <div class="logo-wrap">
            <div class="logo-glow"></div>
            <div class="logo-ring logo-ring-1"></div>
            <div class="logo-ring logo-ring-2"></div>
            <img src="assets/tyng-logo.jpeg" alt="Tyng Logo" class="logo-img" />
          </div>

          <!-- Tagline -->
          <p class="tagline">Tie to Play. Connect &amp; Compete.</p>

          <!-- Feature cards (staggered slide-in) -->
          <div class="features-list">
            <div
              *ngFor="let feature of features; let i = index"
              class="feature-card"
              [style.animation-delay]="(0.15 + i * 0.1) + 's'"
            >
              <div class="feature-icon">
                <ion-icon [name]="feature.icon"></ion-icon>
              </div>
              <span class="feature-text">{{ feature.text }}</span>
            </div>
          </div>
        </section>

        <!-- Get Started — pinned to bottom with safe-area gap -->
        <div class="cta-wrap">
          <button class="cta-btn" (click)="router.navigateByUrl('/login')">
            Get Started
            <ion-icon name="arrow-forward-outline" class="cta-arrow"></ion-icon>
          </button>
        </div>

      </main>
    </ion-content>
  `,
  styles: [
    `
      /* ── Shell ──────────────────────────────────── */
      .welcome-shell {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 100%;
        background: linear-gradient(180deg, #070c18 0%, #111827 50%, #070c18 100%);
        padding-top: env(safe-area-inset-top, 0px);
        padding-bottom: 0;
        transition: background 0.3s ease;
      }
      :host-context(.light-mode) .welcome-shell {
        background: linear-gradient(180deg, #f4f6ff 0%, #ffffff 50%, #f4f6ff 100%);
      }

      /* ── Body ───────────────────────────────────── */
      .welcome-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 24px 16px;
      }

      /* ── Logo wrapper ───────────────────────────── */
      .logo-wrap {
        position: relative;
        display: grid;
        place-items: center;
        width: 200px;
        height: 200px;
        margin-bottom: 28px;
        animation: logoPopIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }

      /* Pulsing radial glow */
      .logo-glow {
        position: absolute;
        inset: -28px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(33, 48, 212, 0.50) 0%, transparent 68%);
        animation: glowPulse 3s ease-in-out infinite;
        pointer-events: none;
      }

      /* Concentric expanding rings */
      .logo-ring {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        animation: ringExpand 3s ease-out infinite;
      }
      .logo-ring-1 {
        inset: -14px;
        border: 1px solid rgba(33, 48, 212, 0.35);
        animation-delay: 0s;
      }
      .logo-ring-2 {
        inset: -30px;
        border: 1px solid rgba(0, 201, 119, 0.22);
        animation-delay: 1.3s;
      }

      /* Logo image itself */
      .logo-img {
        width: 192px;
        height: 192px;
        border-radius: 24px;
        object-fit: contain;
        position: relative;
        z-index: 1;
        animation: float 2.4s ease-in-out infinite;
        box-shadow:
          0 0 0 4px rgba(33, 48, 212, 0.18),
          0 20px 60px rgba(33, 48, 212, 0.40),
          0 8px 24px rgba(0, 0, 0, 0.55);
        transition: box-shadow 0.3s ease;
      }
      :host-context(.light-mode) .logo-img {
        box-shadow:
          0 0 0 4px rgba(33, 48, 212, 0.12),
          0 20px 60px rgba(33, 48, 212, 0.20),
          0 8px 24px rgba(33, 48, 212, 0.15);
      }

      /* ── Tagline ────────────────────────────────── */
      .tagline {
        color: #94a3b8;
        font-size: 17px;
        text-align: center;
        margin: 0 0 32px;
        animation: fadeUp 0.6s 0.45s ease both;
        letter-spacing: 0.2px;
        transition: color 0.3s ease;
      }
      :host-context(.light-mode) .tagline {
        color: #5262a0;
      }

      /* ── Feature cards ──────────────────────────── */
      .features-list {
        width: 100%;
        max-width: 340px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .feature-card {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px;
        border-radius: 20px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        background: rgba(17, 24, 39, 0.65);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.24);
        transition: background-color 0.3s, border-color 0.3s, box-shadow 0.3s;
        animation: slideInLeft 0.5s ease both;
        animation-fill-mode: both;
      }
      :host-context(.light-mode) .feature-card {
        border-color: rgba(33, 48, 212, 0.12);
        background: rgba(255, 255, 255, 0.75);
        box-shadow: 0 8px 24px rgba(33, 48, 212, 0.06);
      }

      .feature-icon {
        width: 40px;
        height: 40px;
        border-radius: 10px;
        background: rgba(33, 48, 212, 0.2);
        display: grid;
        place-items: center;
        flex-shrink: 0;
        color: #4f6bff;
        font-size: 20px;
      }

      .feature-text {
        color: #e2e8f0;
        font-size: 15px;
        font-weight: 500;
        transition: color 0.3s ease;
      }
      :host-context(.light-mode) .feature-text {
        color: #0d1240;
      }

      /* ── CTA wrap — pinned at bottom with gap ───── */
      .cta-wrap {
        padding: 16px 24px calc(28px + env(safe-area-inset-bottom, 0px));
        animation: fadeUp 0.6s 0.75s ease both;
      }

      .cta-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        min-height: 56px;
        border-radius: 18px;
        background: linear-gradient(135deg, #2130d4 0%, #4f6bff 100%);
        color: #ffffff;
        font-size: 17px;
        font-weight: 700;
        border: none;
        cursor: pointer;
        appearance: none;
        box-shadow:
          0 0 36px rgba(33, 48, 212, 0.55),
          0 8px 24px rgba(33, 48, 212, 0.35);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
        letter-spacing: 0.3px;
      }

      .cta-btn:hover {
        box-shadow:
          0 0 52px rgba(33, 48, 212, 0.70),
          0 12px 32px rgba(33, 48, 212, 0.45);
      }

      .cta-btn:active {
        transform: scale(0.97);
      }

      .cta-arrow {
        font-size: 20px;
      }

      /* ── Keyframes ──────────────────────────────── */
      @keyframes logoPopIn {
        0%   { transform: scale(0.45) rotate(-12deg); opacity: 0; }
        65%  { transform: scale(1.07) rotate(3deg);   opacity: 1; }
        100% { transform: scale(1)    rotate(0deg);   opacity: 1; }
      }

      @keyframes float {
        0%, 100% { transform: translateY(0); }
        50%       { transform: translateY(-12px); }
      }

      @keyframes glowPulse {
        0%, 100% { opacity: 0.75; transform: scale(1);    }
        50%       { opacity: 1;   transform: scale(1.10); }
      }

      @keyframes ringExpand {
        0%   { opacity: 0.6; transform: scale(0.88); }
        50%  { opacity: 0.2; transform: scale(1.06); }
        100% { opacity: 0.6; transform: scale(0.88); }
      }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(18px); }
        to   { opacity: 1; transform: translateY(0);    }
      }

      @keyframes slideInLeft {
        from { opacity: 0; transform: translateX(-22px); }
        to   { opacity: 1; transform: translateX(0);     }
      }
    `,
  ],
})
export class WelcomePage {
  readonly router = inject(Router);
  readonly features = [
    { icon: 'people-outline',   text: 'Find players near you' },
    { icon: 'trophy-outline',   text: 'Join games & tournaments' },
    { icon: 'location-outline', text: 'Book premium venues' },
    { icon: 'barbell-outline',  text: 'Track your stats' },
  ];
}
