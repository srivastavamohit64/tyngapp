import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-text-input',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TextInputComponent),
      multi: true,
    },
  ],
  template: `
    <div
      class="field"
      [class.focused]="focused"
      [class.filled]="!!value"
      [class.floating]="focused || !!value"
      [class.disabled]="disabled"
      (click)="focusInput()"
    >
      <span class="float-label">{{ label }}</span>
      <div class="field-row">
        <ng-content select="[prefix]"></ng-content>
        <ion-icon *ngIf="icon" [name]="icon" class="field-icon"></ion-icon>
        <input
          #inputEl
          [type]="type"
          [placeholder]="focused && !value ? placeholder : ''"
          [disabled]="disabled"
          [attr.maxlength]="maxlength || null"
          [value]="value"
          (input)="onInput($event)"
          (focus)="focused = true"
          (blur)="onBlur()"
        />
        <ng-content select="[suffix]"></ng-content>
      </div>
    </div>
  `,
  styles: [
    `
      .field {
        display: block;
        position: relative;
        background: #f9fafb;
        border: 2px solid #f3f4f6;
        border-radius: 16px;
        padding: 14px 16px;
        transition: border-color 0.15s ease, background 0.15s ease, padding 0.15s ease;
        cursor: text;
      }

      .field.floating {
        padding: 8px 16px 10px;
      }

      .field.focused {
        background: #ffffff;
        border-color: #8cf000;
      }

      .field.disabled {
        opacity: 0.55;
        pointer-events: none;
      }

      .float-label {
        display: block;
        font-size: 15px;
        font-weight: 500;
        color: #9ca3af;
        line-height: 1.2;
        pointer-events: none;
        transition: font-size 0.15s ease, color 0.15s ease, margin 0.15s ease;
        margin-bottom: 0;
      }

      .field.floating .float-label {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 4px;
      }

      .field.focused.floating .float-label {
        color: #8cf000;
      }

      .field-row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 0;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transition: max-height 0.15s ease, opacity 0.15s ease, min-height 0.15s ease;
      }

      .field.floating .field-row {
        min-height: 22px;
        max-height: 40px;
        opacity: 1;
        overflow: visible;
      }

      .field-icon {
        font-size: 17px;
        color: #9ca3af;
        flex-shrink: 0;
      }

      .field.focused .field-icon {
        color: #8cf000;
      }

      input {
        flex: 1;
        min-width: 0;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        outline: none;
        font-size: 15px;
        font-weight: 500;
        color: #111827;
        padding: 0;
        margin: 0;
        min-height: 22px;
        border-radius: 0;
        line-height: 1.3;
      }

      input::placeholder {
        color: #c4c9d4;
        font-weight: 500;
      }
    `,
  ],
})
export class TextInputComponent implements ControlValueAccessor {
  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;

  @Input() label = '';
  @Input() placeholder = '';
  @Input() type = 'text';
  @Input() icon = '';
  @Input() disabled = false;
  @Input() maxlength: number | null = null;

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

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  focusInput() {
    this.inputEl?.nativeElement.focus();
  }

  onInput(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    this.value = next;
    this.onChange(next);
    this.valueChange.emit(next);
  }

  onBlur() {
    this.focused = false;
    this.onTouched();
  }
}
