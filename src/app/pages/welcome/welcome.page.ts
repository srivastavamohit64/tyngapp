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
      <main class="safe-area-screen flex min-h-full flex-col justify-between bg-gradient-to-b from-[#0A0F1C] via-[#111827] to-[#0A0F1C] text-white">
        <section class="flex flex-1 flex-col items-center justify-center">
          <img
            src="assets/tyng-logo.jpeg"
            alt="Tyng Logo"
            class="mb-8 h-48 w-48 animate-[float_2s_ease-in-out_infinite] rounded-2xl object-contain"
          />

          <p class="mb-12 text-center text-lg text-[#94A3B8]">Tie to Play. Connect & Compete.</p>

          <div class="w-full max-w-xs space-y-4">
            <div
              *ngFor="let feature of features"
              class="flex items-center gap-4 rounded-[20px] border border-white/10 bg-[#111827]/50 p-4 shadow-[0_8px_24px_rgba(0,0,0,0.24)] backdrop-blur-sm"
            >
              <div class="grid h-10 w-10 place-items-center rounded-lg bg-primary/20 text-primary">
                <ion-icon [name]="feature.icon" class="text-xl"></ion-icon>
              </div>
              <span>{{ feature.text }}</span>
            </div>
          </div>
        </section>

        <button
          class="min-h-[52px] w-full rounded-2xl bg-gradient-to-r from-[#2563EB] to-[#3B82F6] py-4 font-semibold text-white shadow-[0_0_24px_rgba(37,99,235,0.35)] active:scale-[0.98]"
          (click)="router.navigateByUrl('/login')"
        >
          Get Started
        </button>
      </main>
    </ion-content>
  `,
  styles: [
    `
      @keyframes float {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(-10px);
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
