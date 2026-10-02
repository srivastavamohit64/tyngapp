import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

export interface ChipOption {
  value: string;
  label: string;
}

@Component({
  selector: 'pp-chips',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="pp-chips">
      <button
        *ngFor="let option of options"
        type="button"
        class="pp-chip"
        [class.active]="isActive(option.value)"
        [class.readonly]="!editing"
        [disabled]="!editing && !isActive(option.value)"
        [attr.aria-pressed]="isActive(option.value)"
        (click)="pick(option.value)"
      >
        <ion-icon *ngIf="isActive(option.value)" name="checkmark"></ion-icon>
        {{ option.label }}
      </button>
    </div>
  `,
  styles: [`
    .pp-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .pp-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 8px 12px;
      border: 1px solid transparent;
      border-radius: 999px;
      background: #f3f4f6;
      color: #6b7280;
      font-size: 10px;
      font-weight: 900;
      line-height: 1;
      transition: background 0.15s ease, border-color 0.15s ease;
    }
    .pp-chip ion-icon { font-size: 11px; --ionicon-stroke-width: 64px; }
    .pp-chip.active { border-color: #8cf000; background: #f5ffe8; color: #111827; }
    .pp-chip.readonly { cursor: default; }
    .pp-chip:disabled { opacity: 1; }
    .pp-chip:not(.readonly):active { transform: scale(0.95); }
  `],
})
export class PpChipsComponent {
  @Input() options: ChipOption[] = [];
  @Input() selected: string[] | string | null = [];
  @Input() editing = false;
  @Input() multiple = false;
  @Output() selectedChange = new EventEmitter<string[] | string | null>();

  isActive(value: string): boolean {
    const current = this.selected;
    if (Array.isArray(current)) return current.includes(value);
    return current === value;
  }

  pick(value: string): void {
    if (!this.editing) return;
    if (this.multiple) {
      const current = Array.isArray(this.selected) ? this.selected : [];
      this.selectedChange.emit(current.includes(value) ? current.filter((item) => item !== value) : [...current, value]);
      return;
    }
    this.selectedChange.emit(this.isActive(value) ? null : value);
  }
}

@Component({
  selector: 'pp-field',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="pp-field">
      <p class="pp-field-label">{{ label }}</p>
      <ng-container *ngIf="editing && editable; else readView">
        <textarea
          *ngIf="multiline; else singleLine"
          class="pp-input pp-textarea"
          [placeholder]="placeholder"
          [maxlength]="maxlength"
          [ngModel]="model"
          (ngModelChange)="modelChange.emit($event)"
        ></textarea>
        <ng-template #singleLine>
          <input
            class="pp-input"
            [type]="type"
            [placeholder]="placeholder"
            [attr.inputmode]="type === 'number' ? 'decimal' : null"
            [attr.max]="max"
            [attr.min]="min"
            [maxlength]="maxlength"
            [ngModel]="model"
            (ngModelChange)="modelChange.emit($event)"
          />
        </ng-template>
      </ng-container>
      <ng-template #readView>
        <p class="pp-field-value" [class.empty]="!display">{{ display || emptyText }}</p>
      </ng-template>
    </div>
  `,
  styles: [`
    .pp-field { padding: 12px 0; border-bottom: 1px solid #f5f6f7; }
    :host:last-child .pp-field { border-bottom: 0; }
    .pp-field-label {
      margin: 0 0 6px;
      color: #9ca3af;
      font-size: 9px;
      font-weight: 900;
      letter-spacing: 0.05em;
      text-transform: uppercase;
    }
    .pp-field-value {
      margin: 0;
      color: #111827;
      font-size: 12px;
      font-weight: 600;
      line-height: 1.55;
      white-space: pre-line;
      overflow-wrap: anywhere;
    }
    .pp-field-value.empty { color: #c4c9d4; }
    .pp-input {
      width: 100%;
      height: 44px;
      box-sizing: border-box;
      padding: 0 12px;
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      background: #fafbfc;
      color: #111827;
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      outline: none;
    }
    .pp-input:focus { border-color: #8cf000; box-shadow: 0 0 0 3px rgba(140, 240, 0, 0.18); }
    .pp-textarea { height: auto; min-height: 84px; padding: 10px 12px; resize: none; line-height: 1.5; }
  `],
})
export class PpFieldComponent {
  @Input() label = '';
  @Input() display: string | number | null | undefined = '';
  @Input() editing = false;
  @Input() editable = true;
  @Input() multiline = false;
  @Input() type: 'text' | 'number' | 'date' | 'tel' = 'text';
  @Input() placeholder = '';
  @Input() emptyText = 'Not added';
  @Input() maxlength = 500;
  @Input() min: string | number | null = null;
  @Input() max: string | number | null = null;
  @Input() model: string | number | null | undefined = '';
  @Output() modelChange = new EventEmitter<string>();
}

@Component({
  selector: 'pp-toggle',
  standalone: true,
  template: `
    <button
      type="button"
      class="pp-toggle"
      role="switch"
      [class.on]="checked"
      [disabled]="disabled"
      [attr.aria-checked]="checked"
      [attr.aria-label]="label"
      (click)="checkedChange.emit(!checked)"
    >
      <span></span>
    </button>
  `,
  styles: [`
    .pp-toggle {
      position: relative;
      flex-shrink: 0;
      width: 44px;
      height: 24px;
      padding: 0;
      border: 0;
      border-radius: 999px;
      background: #d1d5db;
      transition: background 0.2s ease;
    }
    .pp-toggle span {
      position: absolute;
      top: 2px;
      left: 3px;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(17, 24, 39, 0.2);
      transition: transform 0.2s ease;
    }
    .pp-toggle.on { background: #8cf000; }
    .pp-toggle.on span { transform: translateX(18px); }
    .pp-toggle:disabled { opacity: 0.55; }
  `],
})
export class PpToggleComponent {
  @Input() checked = false;
  @Input() disabled = false;
  @Input() label = '';
  @Output() checkedChange = new EventEmitter<boolean>();
}
