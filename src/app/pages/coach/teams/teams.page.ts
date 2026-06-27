import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-coach-teams-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-top page-with-tab-bar min-h-full bg-background text-white">
        <header class="bg-card border-b border-white/10 px-6 py-4 sticky top-0 z-10">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <button (click)="goHome()" class="text-slate-400 flex items-center bg-transparent">
                <ion-icon name="chevron-back-outline" class="text-2xl"></ion-icon>
              </button>
              <h2 class="text-xl font-bold tracking-tight">My Teams</h2>
            </div>
            <button class="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <ion-icon name="add-outline" class="text-xl text-primary"></ion-icon>
            </button>
          </div>
        </header>

        <section class="px-6 py-6 space-y-4">
          <div
            *ngFor="let team of teams"
            (click)="goSchedule()"
            class="bg-card p-4 rounded-xl border border-white/10 hover:border-primary transition-all cursor-pointer"
          >
            <div class="flex items-start justify-between mb-4">
              <div class="flex-1">
                <h3 class="font-bold text-lg mb-0.5">{{ team.name }}</h3>
                <div class="text-sm text-slate-400">{{ team.sport }}</div>
              </div>
              <ion-icon name="chevron-forward-outline" class="text-slate-400 text-xl"></ion-icon>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div class="flex items-center gap-1 text-slate-400 text-sm mb-1">
                  <ion-icon name="people-outline" class="text-primary"></ion-icon>
                  Players
                </div>
                <div class="text-lg font-bold">{{ team.players }}</div>
              </div>
              <div>
                <div class="flex items-center gap-1 text-slate-400 text-sm mb-1">
                  <ion-icon name="trending-up-outline" class="text-primary"></ion-icon>
                  Win Rate
                </div>
                <div class="text-lg font-bold">{{ team.winRate }}%</div>
              </div>
              <div>
                <div class="flex items-center gap-1 text-slate-400 text-sm mb-1">
                  <ion-icon name="ribbon-outline" class="text-primary"></ion-icon>
                  Avg Age
                </div>
                <div class="text-lg font-bold">{{ team.avgAge }}</div>
              </div>
            </div>

            <div class="bg-primary/10 p-3 rounded-lg border border-primary/30">
              <div class="text-xs text-slate-400 mb-1 font-medium">Next Session</div>
              <div class="text-primary text-sm font-semibold">{{ team.upcomingSession }}</div>
            </div>
          </div>
        </section>
      </main>
    </ion-content>
  `
})
export class CoachTeamsPage {
  private readonly router = inject(Router);

  readonly teams = [
    {
      id: 1,
      name: 'Elite Football Squad',
      sport: 'Football',
      players: 11,
      avgAge: 24,
      winRate: 72,
      upcomingSession: 'Today, 4:00 PM',
    },
    {
      id: 2,
      name: 'Junior Cricket Team',
      sport: 'Cricket',
      players: 22,
      avgAge: 19,
      winRate: 65,
      upcomingSession: 'Tomorrow, 6:00 AM',
    },
    {
      id: 3,
      name: 'Basketball Academy',
      sport: 'Basketball',
      players: 12,
      avgAge: 21,
      winRate: 68,
      upcomingSession: 'Tomorrow, 5:00 PM',
    },
  ];

  goHome() {
    this.router.navigateByUrl('/app/home');
  }

  goSchedule() {
    this.router.navigateByUrl('/app/schedule');
  }
}
