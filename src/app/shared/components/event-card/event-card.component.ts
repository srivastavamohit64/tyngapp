import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { EventGame } from '../../models/app.models';

@Component({
  selector: 'app-event-card',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <button class="w-full rounded-[20px] border border-white/10 bg-card p-4 text-left text-white" (click)="open.emit(event)">
      <div class="mb-3 flex items-start justify-between gap-3">
        <div>
          <div class="flex items-center gap-2 font-semibold">
            {{ event?.sport }}
            <span *ngIf="event?.status === 'almost-full'" class="rounded-full bg-accent/20 px-2 py-0.5 text-xs text-accent">Almost Full</span>
          </div>
          <p class="text-sm text-slate-400">{{ event?.time }}</p>
        </div>
        <span class="inline-flex items-center gap-1 rounded-full bg-secondary/20 px-3 py-1 text-sm text-secondary">
          <ion-icon name="people-outline"></ion-icon>{{ event?.players }}
        </span>
      </div>
      <div class="flex flex-wrap gap-4 text-sm text-slate-400">
        <span class="inline-flex items-center gap-1"><ion-icon name="pin-outline"></ion-icon>{{ event?.location }}</span>
        <span class="inline-flex items-center gap-1"><ion-icon name="trending-up-outline"></ion-icon>{{ event?.distance }}</span>
      </div>
    </button>
  `,
})
export class EventCardComponent {
  @Input() event?: EventGame;
  @Output() open = new EventEmitter<EventGame | undefined>();
}
