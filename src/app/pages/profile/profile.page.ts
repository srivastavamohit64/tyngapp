import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="min-h-full bg-background pb-32 text-white">
        <section class="bg-gradient-to-b from-primary/20 to-transparent px-6 pb-8 pt-6">
          <div class="mb-6 flex items-center justify-between">
            <h1 class="text-2xl font-semibold tracking-[-0.01em]">Profile</h1>
            <button class="grid h-10 w-10 place-items-center rounded-full bg-card" (click)="router.navigateByUrl('/app/settings')">
              <ion-icon name="settings-outline" class="text-xl"></ion-icon>
            </button>
          </div>

          <div class="flex flex-col items-center">
            <div class="relative mb-4 grid h-24 w-24 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-5xl">
              🏏
              <div class="absolute -bottom-2 -right-2 grid h-10 w-10 place-items-center rounded-full border-4 border-background bg-accent text-sm text-white">
                L12
              </div>
            </div>
            <h2 class="mb-1 text-[32px] font-bold leading-tight tracking-[-0.02em]">Rahul Sharma</h2>
            <div class="mb-4 flex items-center gap-2 text-sm text-[#94A3B8]">
              <ion-icon name="location-outline"></ion-icon>
              <span>Lucknow</span>
              <span>•</span>
              <span>Member since Jan 2024</span>
            </div>
            <div class="inline-flex items-center gap-2 rounded-full bg-card px-4 py-2">
              <ion-icon name="star" class="text-xl text-accent"></ion-icon>
              <span>4.8 Rating</span>
            </div>
          </div>
        </section>

        <section class="-mt-4 space-y-6 px-6">
          <div class="rounded-xl border border-white/10 bg-card p-4">
            <div class="mb-3 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <ion-icon name="flash-outline" class="text-xl text-accent"></ion-icon>
                <span>Level 12 Progress</span>
              </div>
              <span class="text-sm text-[#94A3B8]">8450/10000 XP</span>
            </div>
            <div class="h-3 overflow-hidden rounded-full bg-muted">
              <div class="h-full w-[84.5%] rounded-full bg-gradient-to-r from-primary to-secondary"></div>
            </div>
          </div>

          <div class="rounded-xl border border-accent/30 bg-gradient-to-r from-accent/20 to-secondary/20 p-4">
            <div class="flex items-center gap-3">
              <div class="grid h-12 w-12 place-items-center rounded-full bg-accent/30 text-accent">
                <ion-icon name="flash-outline" class="text-2xl"></ion-icon>
              </div>
              <div>
                <div>Current Streak</div>
                <div class="text-sm text-[#94A3B8]">3 weekends in a row!</div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="mb-3 text-xl font-medium">Stats</h3>
            <div class="grid grid-cols-3 gap-3">
              <div *ngFor="let stat of stats" class="rounded-xl border border-white/10 bg-card p-4 text-center">
                <ion-icon [name]="stat.icon" class="mx-auto mb-2 text-2xl text-primary"></ion-icon>
                <div class="mb-1 text-xl">{{ stat.value }}</div>
                <div class="text-xs text-[#94A3B8]">{{ stat.label }}</div>
              </div>
            </div>
          </div>

          <div>
            <h3 class="mb-3 text-xl font-medium">Badges</h3>
            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let badge of badges" class="flex items-center gap-3 rounded-xl border border-white/10 bg-card p-4">
                <div class="grid h-10 w-10 place-items-center rounded-lg bg-primary/20">
                  <ion-icon [name]="badge.icon" class="text-xl" [class]="badge.color"></ion-icon>
                </div>
                <span class="text-sm">{{ badge.name }}</span>
              </div>
            </div>
          </div>

          <div>
            <div class="mb-3 flex items-center justify-between">
              <h3 class="text-xl font-medium">Match History</h3>
              <button class="flex items-center gap-1 text-sm text-primary">
                View All
                <ion-icon name="chevron-forward-outline"></ion-icon>
              </button>
            </div>
            <div class="space-y-2">
              <div *ngFor="let match of recentMatches" class="flex items-center justify-between rounded-xl border border-white/10 bg-card p-4">
                <div>
                  <div>{{ match.sport }}</div>
                  <div class="text-sm text-[#94A3B8]">{{ match.date }}</div>
                </div>
                <div class="text-right">
                  <div [class.text-secondary]="match.result === 'Won'" [class.text-red-500]="match.result !== 'Won'">{{ match.result }}</div>
                  <div class="text-sm text-[#94A3B8]">{{ match.score }}</div>
                </div>
              </div>
            </div>
          </div>

          <div class="rounded-xl border border-white/10 bg-card p-4">
            <div class="mb-3 flex items-start gap-3">
              <ion-icon name="shield-checkmark-outline" class="mt-1 shrink-0 text-xl text-secondary"></ion-icon>
              <div class="flex-1">
                <div class="mb-1">Reliability Score</div>
                <div class="mb-3 text-sm text-[#94A3B8]">Your attendance and punctuality rating</div>
                <div class="flex items-center gap-2">
                  <div class="h-3 flex-1 overflow-hidden rounded-full bg-muted">
                    <div class="h-full w-[95%] rounded-full bg-secondary"></div>
                  </div>
                  <span>95%</span>
                </div>
              </div>
            </div>
          </div>

          <button
            class="flex h-14 w-full items-center justify-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 font-semibold text-red-400 active:scale-[0.98]"
            (click)="logout()"
          >
            <ion-icon name="log-out-outline" class="text-xl"></ion-icon>
            Logout
          </button>
        </section>
      </main>
    </ion-content>
  `,
})
export class ProfilePage {
  readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly stats = [
    { label: 'Games Played', value: 127, icon: 'trophy-outline' },
    { label: 'Win Rate', value: '68%', icon: 'trending-up-outline' },
    { label: 'This Month', value: 14, icon: 'calendar-outline' },
  ];
  readonly badges = [
    { name: 'Trusted Player', icon: 'shield-checkmark-outline', color: 'text-secondary' },
    { name: 'Top Scorer', icon: 'flash-outline', color: 'text-accent' },
    { name: 'Early Bird', icon: 'star-outline', color: 'text-primary' },
    { name: 'Team Captain', icon: 'ribbon-outline', color: 'text-accent' },
  ];
  readonly recentMatches = [
    { sport: 'Football', date: 'Apr 20, 2026', result: 'Won', score: '3-2' },
    { sport: 'Cricket', date: 'Apr 18, 2026', result: 'Lost', score: '145-156' },
    { sport: 'Basketball', date: 'Apr 15, 2026', result: 'Won', score: '78-65' },
  ];

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
