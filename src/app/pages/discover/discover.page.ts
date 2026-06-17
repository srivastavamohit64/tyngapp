import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { FilterComponent } from '../../shared/components/filter/filter.component';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { PlayerCardComponent } from '../../shared/components/player-card/player-card.component';

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [CommonModule, IonicModule, HeaderComponent, FilterComponent, PlayerCardComponent],
  template: `
    <ion-content fullscreen>
      <main class="min-h-full bg-background pb-32 text-white">
        <app-header title="Discover Players" subtitle="Find compatible players nearby">
          <button class="grid h-10 w-10 place-items-center rounded-full bg-primary/20 text-primary">
            <ion-icon name="options-outline" class="text-xl"></ion-icon>
          </button>
        </app-header>
        <section class="space-y-4 px-6 py-4">
          <app-filter [options]="skills" [selected]="selectedSkill()" (selectedChange)="selectedSkill.set($event)"></app-filter>
          <app-player-card *ngFor="let player of data.players" [player]="player"></app-player-card>
        </section>
      </main>
    </ion-content>
  `,
})
export class DiscoverPage {
  readonly data = inject(DesignDataService);
  readonly skills = ['all', 'beginner', 'intermediate', 'pro'];
  readonly selectedSkill = signal('all');
}
