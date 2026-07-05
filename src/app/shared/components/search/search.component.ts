import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, IonicModule],
  template: `
    <label class="flex h-14 items-center gap-3 rounded-xl border border-white/10 bg-card px-4 text-slate-400">
      <ion-icon name="search-outline" class="text-xl"></ion-icon>
      <input
        class="w-full bg-transparent border-0 border-none text-foreground outline-none placeholder:text-slate-500"
        style="border: none !important; background: transparent !important; outline: none !important; box-shadow: none !important; -webkit-appearance: none; appearance: none; padding: 0 !important; margin: 0 !important;"
        [placeholder]="placeholder"
        [(ngModel)]="value"
        (ngModelChange)="valueChange.emit($event)"
      />
    </label>
  `,
})
export class SearchComponent {
  @Input() placeholder = 'Search';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
