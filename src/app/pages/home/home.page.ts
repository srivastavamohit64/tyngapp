import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { EventCardComponent } from '../../shared/components/event-card/event-card.component';
import { SearchComponent } from '../../shared/components/search/search.component';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, IonicModule, EventCardComponent, SearchComponent],
  template: `
    <ion-content fullscreen>
      <main class="min-h-full bg-background pb-32 text-white">
        <section class="bg-gradient-to-b from-primary/20 to-transparent px-6 pb-8 pt-6">
          <div class="mb-6 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <ion-icon name="location-outline" class="text-xl text-primary"></ion-icon>
              <div>
                <p class="text-sm text-slate-400">Location</p>
                <p class="font-semibold">Lucknow <ion-icon name="chevron-forward-outline"></ion-icon></p>
              </div>
            </div>
            <button class="relative grid h-12 w-12 place-items-center rounded-full bg-card">
              <ion-icon name="notifications-outline" class="text-xl"></ion-icon>
              <span class="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent"></span>
            </button>
          </div>
          <app-search placeholder="Find players, games, venues"></app-search>
        </section>

        <section class="space-y-6 px-6">
          <div class="-mt-4 rounded-2xl bg-gradient-to-r from-primary to-secondary p-6">
            <div class="mb-3 flex justify-between">
              <div>
                <p class="text-sm text-white/80">Quick Suggestion</p>
                <p class="font-bold">4 players available near you</p>
              </div>
              <div class="grid h-12 w-12 place-items-center rounded-full bg-white/20">
                <ion-icon name="people-outline" class="text-2xl"></ion-icon>
              </div>
            </div>
            <p class="mb-4 flex items-center gap-2 text-sm"><ion-icon name="time-outline"></ion-icon>Available at 7 PM today</p>
            <button class="h-13 w-full rounded-full bg-white font-bold text-primary" (click)="go('/app/discover')">View Players</button>
          </div>

          <button class="flex w-full items-center justify-between rounded-2xl border-2 border-primary/40 bg-gradient-to-r from-violet/20 to-secondary/20 p-4 text-left" (click)="go('/app/map')">
            <div class="flex items-center gap-3">
              <div class="grid h-12 w-12 place-items-center rounded-xl bg-primary/30">
                <ion-icon name="map-outline" class="text-2xl text-primary"></ion-icon>
              </div>
              <div>
                <p class="font-bold">Live Sports Map</p>
                <p class="text-sm text-slate-400">View nearby games & players</p>
              </div>
            </div>
            <span class="rounded-full bg-accent/20 px-3 py-1 text-xs text-accent">⚡ 4 Live</span>
          </button>

          <div>
            <h2 class="mb-4 text-xl font-bold">Quick Actions</h2>
            <div class="grid grid-cols-3 gap-3">
              <button class="rounded-[20px] border border-white/10 bg-card p-4" (click)="go('/app/discover')">
                <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-primary/20 text-primary"><ion-icon name="add-outline" class="text-2xl"></ion-icon></div>
                <p class="font-semibold">Join Game</p>
              </button>
              <button class="rounded-[20px] border border-white/10 bg-card p-4" (click)="go('/app/game/create')">
                <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-secondary/20 text-secondary"><ion-icon name="people-outline" class="text-2xl"></ion-icon></div>
                <p class="font-semibold">Create Game</p>
              </button>
              <button class="rounded-[20px] border border-white/10 bg-card p-4" (click)="go('/app/venues')">
                <div class="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-xl bg-accent/20 text-accent"><ion-icon name="business-outline" class="text-2xl"></ion-icon></div>
                <p class="font-semibold">Book Venue</p>
              </button>
            </div>
          </div>

          <div>
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-xl font-bold">Nearby Games</h2>
              <button class="text-sm font-semibold text-primary">See all ›</button>
            </div>
            <div class="max-h-72 space-y-3 overflow-y-auto pr-1">
              <app-event-card *ngFor="let game of data.games" [event]="game" (open)="go('/app/game/' + game.id)"></app-event-card>
            </div>
          </div>
        </section>
      </main>
    </ion-content>
  `,
})
export class HomePage {
  readonly data = inject(DesignDataService);
  private readonly router = inject(Router);

  go(path: string) {
    this.router.navigateByUrl(path);
  }
}
