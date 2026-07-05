import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [CommonModule, IonicModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CheckboxComponent),
      multi: true,
    },
  ],
  template: `
    <button
      type="button"
      class="check-row"
      [class.disabled]="disabled"
      [attr.aria-checked]="checked"
      role="checkbox"
      (click)="toggle()"
    >
      <span class="box" [class.on]="checked" [class.off]="!checked">
        <ion-icon *ngIf="checked" name="checkmark" class="tick"></ion-icon>
      </span>
      <span class="label"><ng-content></ng-content></span>
    </button>
  `,
  styles: [
    `
      .check-row {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        width: 100%;
        background: transparent;
        text-align: left;
        min-height: unset;
        padding: 0;
        border-radius: 0;
      }

      .check-row.disabled {
        opacity: 0.45;
        pointer-events: none;
      }

      .box {
        width: 20px;
        height: 20px;
        min-width: 20px;
        border-radius: 6px;
        border: 2px solid #d1d5db;
        background: #ffffff;
        display: grid;
        place-items: center;
        margin-top: 2px;
        transition: background 0.15s ease, border-color 0.15s ease;
      }

      .box.on {
        background: #8cf000;
        border-color: #8cf000;
      }

      .tick {
        font-size: 12px;
        color: #111827;
        font-weight: 900;
      }

      .label {
        flex: 1;
        font-size: 12.5px;
        color: #6b7280;
        line-height: 1.5;
      }
    `,
  ],
})
export class CheckboxComponent implements ControlValueAccessor {
  @Input() disabled = false;
  @Input() checked = false;
  @Output() checkedChange = new EventEmitter<boolean>();

  private onChange: (v: boolean) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  writeValue(value: boolean): void {
    this.checked = !!value;
  }

  registerOnChange(fn: (v: boolean) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  toggle() {
    if (this.disabled) return;
    this.checked = !this.checked;
    this.onChange(this.checked);
    this.checkedChange.emit(this.checked);
    this.onTouched();
  }
}
