import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-leaderboard-page',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent],
  template: `
    <ion-content fullscreen>
      <main class="min-h-full bg-background pb-32 text-white">
        <app-header title="Leaderboard" subtitle="Top players in Lucknow"></app-header>
        <section class="space-y-4 px-6 py-4">
          <article
            class="flex items-center gap-4 rounded-[20px] border border-white/10 bg-card p-4"
            *ngFor="let player of leaderboard"
          >
            <div class="w-10 text-slate-400">#{{ player.rank }}</div>
            <div class="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl">
              {{ player.avatar }}
            </div>
            <div class="flex-1">
              <h3 class="font-semibold">{{ player.name }}</h3>
              <p class="text-sm text-slate-400">{{ player.games }} games · {{ player.wins }}% wins</p>
            </div>
            <strong class="text-accent">{{ player.points | number }}</strong>
          </article>
        </section>
      </main>
    </ion-content>
  `,
})
export class LeaderboardPage {
  readonly leaderboard = [
    { rank: 1, name: 'Amit Kumar', avatar: '🏀', points: 9850, games: 203, wins: 72 },
    { rank: 2, name: 'Rahul Sharma', avatar: '🏏', points: 8450, games: 127, wins: 68 },
    { rank: 3, name: 'Priya Singh', avatar: '⚽', points: 7920, games: 145, wins: 65 },
    { rank: 4, name: 'Sneha Verma', avatar: '🏸', points: 7450, games: 112, wins: 71 },
  ];
}
