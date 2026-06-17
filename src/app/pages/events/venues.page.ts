import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SportsBadgeComponent } from '../../shared/components/sports-badge/sports-badge.component';

@Component({
  selector: 'app-venues-page',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, SportsBadgeComponent],
  template: `
    <ion-content fullscreen>
      <main class="min-h-full bg-background pb-32 text-white">
        <app-header title="Book Venue" subtitle="Reserve sports facilities nearby"></app-header>
        <section class="space-y-4 px-6 py-4">
          <article class="rounded-[20px] border border-white/10 bg-card p-4" *ngFor="let venue of data.venues">
            <div class="flex gap-4">
              <div class="grid h-14 w-14 place-items-center rounded-xl bg-primary/20 text-3xl">{{ venue.emoji }}</div>
              <div class="min-w-0 flex-1">
                <div class="mb-2 flex justify-between gap-2">
                  <h3 class="font-semibold">{{ venue.name }}</h3>
                  <span class="text-accent">★ {{ venue.rating }}</span>
                </div>
                <p class="mb-3 text-sm text-slate-400">{{ venue.location }} · {{ venue.distance }}</p>
                <div class="flex items-center justify-between gap-3">
                  <div class="flex flex-wrap gap-2">
                    <app-sports-badge *ngFor="let sport of venue.sports" [label]="sport"></app-sports-badge>
                  </div>
                  <strong class="text-primary">₹{{ venue.price }}/hr</strong>
                </div>
              </div>
            </div>
          </article>
        </section>
      </main>
    </ion-content>
  `,
})
export class VenuesPage {
  readonly data = inject(DesignDataService);
}
