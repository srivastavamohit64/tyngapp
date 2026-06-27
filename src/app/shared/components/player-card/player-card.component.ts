import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Player } from '../../models/app.models';

@Component({
  selector: 'app-player-card',
  standalone: true,
  imports: [IonicModule],
  template: `
    <article class="rounded-[20px] border border-white/10 bg-card p-4">
      <div class="flex gap-4">
        <div class="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary text-3xl">
          {{ player?.avatar }}
        </div>
        <div class="min-w-0 flex-1">
          <div class="mb-2 flex items-start justify-between gap-2">
            <div>
              <h3 class="font-semibold text-white">{{ player?.name }}</h3>
              <p class="text-sm text-slate-400">{{ player?.sport }}</p>
            </div>
            <span class="rounded-lg bg-accent/20 px-2 py-1 text-sm text-accent">★ {{ player?.rating }}</span>
          </div>
          <div class="mb-3 flex flex-wrap gap-3 text-sm text-slate-400">
            <span>{{ player?.skill }}</span>
            <span>{{ player?.distance }}</span>
            <span>{{ player?.gamesPlayed }} games</span>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-muted">
            <div class="h-full rounded-full bg-secondary" [style.width.%]="player?.reliability || 0"></div>
          </div>
        </div>
      </div>
    </article>
  `,
})
export class PlayerCardComponent {
  @Input() player?: Player;
}
