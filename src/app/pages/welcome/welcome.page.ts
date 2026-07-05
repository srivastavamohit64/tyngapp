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
        <section class="welcome-body">
          <div class="logo-wrap">
            <img src="assets/tyng-logo.jpeg" alt="Tyng Logo" class="logo-img" />
          </div>

          <p class="tagline">Tie to Play. Connect &amp; Compete.</p>

          <div class="features-list">
            <div
              *ngFor="let feature of features; let i = index"
              class="feature-card"
              [style.animation-delay]="(0.4 + i * 0.1) + 's'"
            >
              <div class="feature-icon">
                <ion-icon [name]="feature.icon"></ion-icon>
              </div>
              <span class="feature-text">{{ feature.text }}</span>
            </div>
          </div>
        </section>

        <div class="cta-wrap">
          <button type="button" class="cta-btn" (click)="router.navigateByUrl('/auth')">
            Get Started
          </button>
        </div>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .welcome-shell {
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        min-height: 100%;
        background: #ffffff;
        padding: calc(env(safe-area-inset-top, 0px) + 28px) 24px 0;
      }

      .welcome-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        padding-top: 8px;
        overflow-y: auto;
      }

      .logo-wrap {
        margin-bottom: 20px;
        padding-top: 4px;
        animation: logoPop 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) both;
      }

      .logo-img {
        width: 144px;
        height: 144px;
        object-fit: contain;
        border-radius: 16px;
        animation: float 2s ease-in-out infinite;
      }

      .tagline {
        color: #6b7280;
        font-size: 16px;
        text-align: center;
        margin: 0 0 28px;
        animation: fadeUp 0.5s 0.5s ease both;
      }

      .features-list {
        width: 100%;
        max-width: 300px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .feature-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 16px;
        border: 1px solid #e5e7eb;
        background: rgba(255, 255, 255, 0.5);
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
        animation: slideIn 0.4s ease both;
      }

      .feature-icon {
        width: 36px;
        height: 36px;
        border-radius: 8px;
        background: rgba(140, 240, 0, 0.2);
        display: grid;
        place-items: center;
        flex-shrink: 0;
        color: #8cf000;
        font-size: 18px;
      }

      .feature-text {
        color: #111827;
        font-size: 14px;
        font-weight: 400;
      }

      .cta-wrap {
        padding: 16px 0 calc(24px + env(safe-area-inset-bottom, 0px));
        animation: fadeUp 0.5s 0.8s ease both;
        width: 100%;
        flex-shrink: 0;
      }

      .cta-btn {
        width: 100%;
        min-height: 52px;
        border-radius: 16px;
        background: linear-gradient(to right, #8cf000, #a3e635);
        color: #111827;
        font-size: 16px;
        font-weight: 700;
        box-shadow: 0 4px 20px rgba(140, 240, 0, 0.35);
      }

      .cta-btn:active {
        transform: scale(0.98);
      }

      @keyframes logoPop {
        from {
          transform: scale(0.5) rotate(-10deg);
          opacity: 0;
        }
        to {
          transform: scale(1) rotate(0);
          opacity: 1;
        }
      }

      @keyframes float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-6px);
        }
      }

      @keyframes fadeUp {
        from {
          opacity: 0;
          transform: translateY(20px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateX(-20px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `,
  ],
})
export class WelcomePage {
  readonly router = inject(Router);
  readonly features = [
    { icon: 'people-outline', text: 'Find players near you' },
    { icon: 'trophy-outline', text: 'Join games & tournaments' },
    { icon: 'location-outline', text: 'Book premium venues' },
    { icon: 'barbell-outline', text: 'Track your stats' },
  ];
}
