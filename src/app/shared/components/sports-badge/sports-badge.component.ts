import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sports-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      <span *ngIf="emoji">{{ emoji }}</span>
      {{ label }}
    </span>
  `,
})
export class SportsBadgeComponent {
  @Input() label = '';
  @Input() emoji = '';
}
