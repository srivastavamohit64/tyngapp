import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
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
        #inputEl
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
        color: var(--app-foreground-muted);
        pointer-events: none;
      }

      input {
        width: 100%;
        padding: 14px 16px 14px 44px;
        background: var(--app-muted) !important;
        border: none !important;
        border-radius: var(--app-radius-input) !important;
        font-size: 14px;
        font-weight: 500;
        color: var(--app-foreground) !important;
        box-shadow: none !important;
        outline: none;
        min-height: var(--app-control-height);
        border: 1px solid transparent !important;
        transition: background var(--app-motion-fast) ease, box-shadow var(--app-motion-fast) ease, border-color var(--app-motion-fast) ease;
      }

      input::placeholder {
        color: var(--app-foreground-muted);
      }

      .search.focused input {
        background: var(--app-surface) !important;
        border-color: var(--app-primary) !important;
        box-shadow: var(--app-focus-ring) !important;
      }
    `,
  ],
})
export class SearchBarComponent implements ControlValueAccessor {
  @Input() placeholder = 'Search…';
  @Output() valueChange = new EventEmitter<string>();
  @ViewChild('inputEl') private inputEl?: ElementRef<HTMLInputElement>;

  value = '';
  focused = false;

  focus(): void {
    this.inputEl?.nativeElement.focus();
  }

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
