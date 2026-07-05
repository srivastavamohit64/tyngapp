import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-section-header',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="section-head">
      <h3 [class.caps]="caps">{{ title }}</h3>
      <button *ngIf="actionLabel" type="button" class="action" (click)="action.emit()">
        {{ actionLabel }}
        <ion-icon name="chevron-forward"></ion-icon>
      </button>
    </div>
  `,
  styles: [
    `
      .section-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 16px;
      }

      h3 {
        margin: 0;
        font-size: 20px;
        font-weight: 500;
        color: #111827;
        line-height: 1.3;
      }

      h3.caps {
        font-size: 13px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.1em;
      }

      .action {
        display: inline-flex;
        align-items: center;
        gap: 2px;
        background: transparent;
        color: #8cf000;
        font-size: 14px;
        font-weight: 500;
        min-height: unset;
        padding: 0;
      }

      .action ion-icon {
        font-size: 14px;
      }
    `,
  ],
})
export class SectionHeaderComponent {
  @Input() title = '';
  @Input() actionLabel = '';
  @Input() caps = false;
  @Output() action = new EventEmitter<void>();
}
