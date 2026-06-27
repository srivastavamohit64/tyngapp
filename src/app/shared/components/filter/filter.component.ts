import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule, TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-filter',
  standalone: true,
  imports: [CommonModule, TitleCasePipe],
  template: `
    <div class="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
      <button
        *ngFor="let option of options"
        class="whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold"
        [class.bg-primary]="selected === option"
        [class.text-white]="selected === option"
        [class.bg-card]="selected !== option"
        [class.text-slate-400]="selected !== option"
        (click)="selectedChange.emit(option)"
      >
        {{ option | titlecase }}
      </button>
    </div>
  `,
})
export class FilterComponent {
  @Input() options: string[] = [];
  @Input() selected = '';
  @Output() selectedChange = new EventEmitter<string>();
}
