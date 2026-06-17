import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SportsBadgeComponent } from '../../shared/components/sports-badge/sports-badge.component';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, SportsBadgeComponent],
  template: `
    <ion-content fullscreen>
      <main class="min-h-full bg-background text-white">
        <app-header [title]="title" [subtitle]="subtitle" [showBack]="true" (back)="back()"></app-header>
        <section class="space-y-4 px-6 py-5 pb-8" [ngSwitch]="mode">
          <ng-container *ngSwitchCase="'venues'">
            <article class="rounded-[20px] border border-white/10 bg-card p-4" *ngFor="let venue of data.venues">
              <div class="flex gap-4">
                <div class="grid h-14 w-14 place-items-center rounded-xl bg-primary/20 text-3xl">{{ venue.emoji }}</div>
                <div class="min-w-0 flex-1">
                  <div class="mb-2 flex justify-between gap-2"><h3 class="font-semibold">{{ venue.name }}</h3><span class="text-accent">★ {{ venue.rating }}</span></div>
                  <p class="mb-3 text-sm text-slate-400">{{ venue.location }} · {{ venue.distance }}</p>
                  <div class="flex items-center justify-between gap-3">
                    <div class="flex flex-wrap gap-2"><app-sports-badge *ngFor="let sport of venue.sports" [label]="sport"></app-sports-badge></div>
                    <strong class="text-primary">₹{{ venue.price }}/hr</strong>
                  </div>
                </div>
              </div>
            </article>
          </ng-container>

          <ng-container *ngSwitchCase="'map'">
            <div class="relative h-[520px] rounded-[24px] border border-white/10 bg-[radial-gradient(circle_at_30%_30%,rgba(37,99,235,.35),transparent_28%),linear-gradient(135deg,#0f172a,#111827)]">
              <button class="absolute left-[42%] top-[35%] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-primary">⚽</button>
              <button class="absolute left-[68%] top-[25%] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-secondary">🏏</button>
              <button class="absolute left-[48%] top-[45%] grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-info">8</button>
            </div>
          </ng-container>

          <ng-container *ngSwitchCase="'create'">
            <div class="rounded-[20px] border border-white/10 bg-card p-4">
              <h2 class="mb-2 text-xl font-bold">Select Sport</h2>
              <p class="mb-5 text-slate-400">Choose what you want to play</p>
              <div class="grid grid-cols-2 gap-3">
                <button class="rounded-2xl border border-white/10 p-5 text-center" *ngFor="let sport of data.sports">
                  <div class="mb-2 text-4xl">{{ sport.emoji }}</div>
                  <p class="font-semibold">{{ sport.name }}</p>
                  <p class="text-xs text-slate-400">{{ sport.players }}</p>
                </button>
              </div>
            </div>
          </ng-container>

          <ng-container *ngSwitchCase="'leaderboard'">
            <article class="flex items-center gap-4 rounded-[20px] border border-white/10 bg-card p-4" *ngFor="let player of leaderboard">
              <div class="w-10 text-slate-400">#{{ player.rank }}</div>
              <div class="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-2xl">{{ player.avatar }}</div>
              <div class="flex-1">
                <h3 class="font-semibold">{{ player.name }}</h3>
                <p class="text-sm text-slate-400">{{ player.games }} games · {{ player.wins }}% wins</p>
              </div>
              <strong class="text-accent">{{ player.points | number }}</strong>
            </article>
          </ng-container>

          <ng-container *ngSwitchDefault>
            <article class="rounded-[20px] border border-white/10 bg-card p-5">
              <h2 class="text-2xl font-bold">Football</h2>
              <p class="mt-2 text-slate-400">Today, 7:00 PM · Phoenix Arena</p>
              <button class="mt-5 h-12 w-full rounded-xl bg-primary font-bold">Confirm</button>
            </article>
          </ng-container>
        </section>
      </main>
    </ion-content>
  `,
})
export class EventsPage {
  readonly data = inject(DesignDataService);
  private readonly router = inject(Router);
  mode: 'venues' | 'map' | 'create' | 'leaderboard' | 'details' = this.router.url.includes('map')
    ? 'map'
    : this.router.url.includes('create')
      ? 'create'
      : this.router.url.includes('venues')
        ? 'venues'
        : this.router.url.includes('leaderboard')
          ? 'leaderboard'
          : 'details';
  readonly leaderboard = [
    { rank: 1, name: 'Amit Kumar', avatar: '🏀', points: 9850, games: 203, wins: 72 },
    { rank: 2, name: 'Rahul Sharma', avatar: '🏏', points: 8450, games: 127, wins: 68 },
    { rank: 3, name: 'Priya Singh', avatar: '⚽', points: 7920, games: 145, wins: 65 },
    { rank: 4, name: 'Sneha Verma', avatar: '🏸', points: 7450, games: 112, wins: 71 },
  ];

  get title() {
    return this.mode === 'map' ? 'Live Sports Map' : this.mode === 'create' ? 'Create Game' : this.mode === 'venues' ? 'Book Venue' : this.mode === 'leaderboard' ? 'Leaderboard' : 'Game Details';
  }

  get subtitle() {
    return this.mode === 'map' ? 'Lucknow' : '';
  }

  back() {
    this.router.navigateByUrl('/app/home');
  }
}
