import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule, IonicModule],
  template: `
    <label class="search">
      <ion-icon name="search-outline" class="search-icon"></ion-icon>
      <input
        class="search-input"
        [placeholder]="placeholder"
        [(ngModel)]="value"
        (ngModelChange)="valueChange.emit($event)"
      />
    </label>
  `,
  styles: [
    `
      .search {
        min-height: var(--app-control-height);
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 0 14px;
        background: var(--app-muted);
        border: 1px solid transparent;
        border-radius: var(--app-radius-input);
        color: var(--app-foreground-muted);
        transition: background var(--app-motion-fast) ease, border-color var(--app-motion-fast) ease, box-shadow var(--app-motion-fast) ease;
      }
      .search:focus-within {
        background: var(--app-surface);
        border-color: var(--app-primary);
        box-shadow: var(--app-focus-ring);
      }
      .search-icon { flex: 0 0 auto; font-size: 19px; }
      .search-input {
        flex: 1;
        min-width: 0;
        border: 0 !important;
        border-radius: 0 !important;
        background: transparent !important;
        color: var(--app-foreground) !important;
        outline: 0 !important;
        box-shadow: none !important;
        -webkit-appearance: none;
        appearance: none;
        padding: 0 !important;
        margin: 0 !important;
        font-size: 14px;
        font-weight: 600;
      }
      .search-input::placeholder { color: var(--app-foreground-muted); }
    `,
  ],
})
export class SearchComponent {
  @Input() placeholder = 'Search';
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();
}
