import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-search-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SearchBarComponent),
      multi: true,
    },
  ],
  template: `
    <div class="search" [class.focused]="focused">
      <ion-icon name="search-outline" class="icon"></ion-icon>
      <input
        type="search"
        [placeholder]="placeholder"
        [value]="value"
        (input)="onInput($event)"
        (focus)="focused = true"
        (blur)="focused = false"
      />
    </div>
  `,
  styles: [
    `
      .search {
        position: relative;
        display: flex;
        align-items: center;
      }

      .icon {
        position: absolute;
        left: 16px;
        font-size: 18px;
        color: #9ca3af;
        pointer-events: none;
      }

      input {
        width: 100%;
        padding: 14px 16px 14px 44px;
        background: #f3f4f6 !important;
        border: none !important;
        border-radius: 16px !important;
        font-size: 14px;
        font-weight: 500;
        color: #111827 !important;
        box-shadow: none !important;
        outline: none;
        min-height: 48px;
      }

      input::placeholder {
        color: #9ca3af;
      }

      .search.focused input {
        background: #ffffff !important;
        box-shadow: 0 0 0 2px rgba(140, 240, 0, 0.4) !important;
      }
    `,
  ],
})
export class SearchBarComponent implements ControlValueAccessor {
  @Input() placeholder = 'Search…';
  @Output() valueChange = new EventEmitter<string>();

  value = '';
  focused = false;

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  onInput(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    this.value = next;
    this.onChange(next);
    this.valueChange.emit(next);
    this.onTouched();
  }
}
