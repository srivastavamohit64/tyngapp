import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="sticky top-0 z-40 border-b border-white/10 bg-card/95 px-6 py-4 backdrop-blur">
      <div class="flex items-center gap-3">
        <button *ngIf="showBack" class="grid h-10 w-10 place-items-center rounded-full text-slate-400" (click)="back.emit()">
          <ion-icon name="chevron-back-outline" class="text-2xl"></ion-icon>
        </button>
        <div class="min-w-0 flex-1">
          <h1 class="truncate text-2xl font-bold leading-tight text-white">{{ title }}</h1>
          <p *ngIf="subtitle" class="text-sm text-slate-400">{{ subtitle }}</p>
        </div>
        <ng-content></ng-content>
      </div>
    </div>
  `,
})
export class HeaderComponent {
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showBack = false;
  @Output() back = new EventEmitter<void>();
}
