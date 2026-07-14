import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-bottom-cta',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="bottom-cta-outer">
      <div class="bottom-cta-inner">
        <!-- Price display -->
        <div class="price-block" *ngIf="showPrice">
          <span class="price-kicker">{{ labelText }}</span>
          <p class="price-main">
            {{ pricePrefix }}{{ price }}
            <span class="price-unit" *ngIf="unit">{{ unit }}</span>
          </p>
        </div>

        <!-- Button -->
        <button 
          type="button" 
          class="cta-btn" 
          [class.cta-btn--full]="!showPrice"
          (click)="onButtonClick()"
        >
          <span>{{ btnLabel }}</span>
          <ion-icon name="chevron-forward-outline" class="btn-arrow"></ion-icon>
        </button>
      </div>
      
      <!-- Sub-label -->
      <p class="cta-footnote" *ngIf="subText">{{ subText }}</p>
    </div>
  `,
  styles: [
    `
      .bottom-cta-outer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 30;
        background: #ffffff;
        padding: 16px 20px calc(20px + env(safe-area-inset-bottom, 0px)) 20px;
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.09);
        border-top: 1px solid #f3f4f6;
        max-width: 440px;
        margin: 0 auto;
        box-sizing: border-box;
      }

      .bottom-cta-inner {
        display: flex;
        align-items: center;
        gap: 16px;
        margin-bottom: 8px;
      }

      .price-block {
        text-align: left;
        flex-shrink: 0;
      }

      .price-kicker {
        font-size: 11px;
        color: #9ca3af;
        display: block;
        line-height: 1;
        margin-bottom: 2px;
      }

      .price-main {
        font-size: 20px;
        font-weight: 900;
        color: #111827;
        margin: 0;
        line-height: 1.15;
      }

      .price-unit {
        font-size: 12px;
        font-weight: 500;
        color: #9ca3af;
      }

      .cta-btn {
        flex: 1;
        height: 56px;
        border: none;
        border-radius: 16px;
        background: linear-gradient(135deg, #ff7a00 0%, #ff9a40 100%);
        box-shadow: 0 4px 20px rgba(255, 122, 0, 0.42);
        color: #ffffff;
        font-size: 16px;
        font-weight: 900;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: pointer;
        padding: 0 16px;
        outline: none;
        box-sizing: border-box;
        transition: transform 0.1s ease;
      }

      .cta-btn:active {
        transform: scale(0.97);
      }

      .cta-btn--full {
        width: 100%;
      }

      .btn-arrow {
        font-size: 18px;
      }

      .cta-footnote {
        text-align: center;
        font-size: 10px;
        color: #9ca3af;
        margin: 0;
        font-weight: 500;
      }
    `,
  ],
})
export class BottomCtaComponent {
  @Input() price: string | number = '';
  @Input() unit = '/hr';
  @Input() pricePrefix = '₹';
  @Input() labelText = 'Starting from';
  @Input() btnLabel = 'Continue to Booking';
  @Input() subText = 'Free cancellation up to 24 hours before your slot';
  @Input() showPrice = true;

  @Output() btnClick = new EventEmitter<void>();

  onButtonClick() {
    this.btnClick.emit();
  }
}
