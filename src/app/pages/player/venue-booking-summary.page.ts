import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { WalletService } from '../../core/services/wallet.service';
import { VENUE_DATA, type VenueDetail } from './venue-detail.page';
import {
  blockedMinutesForSlots,
  courtCostFromMinutes,
  formatDurationLabel,
  normalizeSlotInterval,
  playMinutesForSlots,
  slotEndClock,
  type SlotIntervalMinutes,
} from '../../core/utils/booking.utils';

interface AppliedCoupon {
  code: string;
  type: 'percent' | 'flat';
  value: number;
  desc: string;
  discount: number;
}

@Component({
  selector: 'app-venue-booking-summary',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content fullscreen class="summary-content">
      <div class="summary-page" *ngIf="venue">
        <header class="summary-header">
          <button type="button" class="icon-btn" (click)="back()" aria-label="Back">
            <ion-icon name="chevron-back"></ion-icon>
          </button>
          <div class="summary-header-copy">
            <h1>Booking Summary</h1>
            <p>Review before confirming</p>
          </div>
          <div class="icon-btn icon-btn--ghost"></div>
        </header>

        <div class="summary-body">
          <section class="card venue-card">
            <div class="venue-row">
              <div class="venue-thumb">
                <img [src]="venue.images[0]" [alt]="venue.courtName" />
              </div>
              <div class="venue-meta">
                <h2>{{ venue.courtName }}</h2>
                <p>{{ venue.venueName }}</p>
                <div class="meta-chips">
                  <span><ion-icon name="calendar-outline"></ion-icon>{{ selectedDate }}</span>
                  <span><ion-icon name="time-outline"></ion-icon>{{ startTime }} – {{ endHour }}</span>
                </div>
              </div>
            </div>
            <div class="stat-strip">
              <div>
                <strong>{{ durationLabel }}</strong>
                <span>Duration</span>
              </div>
              <div>
                <strong>₹{{ venue.pricePerHour.toLocaleString() }}</strong>
                <span>per hour</span>
              </div>
              <div>
                <strong>₹{{ courtCost.toLocaleString() }}</strong>
                <span>court total</span>
              </div>
            </div>
          </section>

          <section class="card">
            <button type="button" class="section-toggle" (click)="showRental = !showRental">
              <div>
                <h3>Rental equipment</h3>
                <span class="badge" *ngIf="rentalCost > 0">+₹{{ rentalCost }}</span>
              </div>
              <ion-icon [name]="showRental ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
            </button>
            <div class="rental-list" *ngIf="showRental">
              <div class="rental-row" *ngFor="let item of venue.rentalEquipment">
                <div class="rental-emoji">{{ item.emoji }}</div>
                <div class="rental-meta">
                  <strong>{{ item.name }}</strong>
                  <span>₹{{ item.price }}/session
                    <em *ngIf="(rentalQty[item.id] || 0) > 0">= ₹{{ item.price * rentalQty[item.id] }}</em>
                  </span>
                </div>
                <div class="qty-controls">
                  <button type="button" (click)="dec(item.id)">
                    <ion-icon [name]="(rentalQty[item.id] || 0) === 1 ? 'trash-outline' : 'remove-outline'"></ion-icon>
                  </button>
                  <span>{{ rentalQty[item.id] || 0 }}</span>
                  <button type="button" class="plus" (click)="inc(item.id)">
                    <ion-icon name="add-outline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section class="card coupon-card">
            <div class="card-title">
              <ion-icon name="ticket-outline"></ion-icon>
              <h3>Coupon code</h3>
            </div>

            <div class="coupon-applied" *ngIf="appliedCoupon; else couponForm">
              <div class="coupon-check"><ion-icon name="checkmark"></ion-icon></div>
              <div>
                <strong>{{ appliedCoupon.code }}</strong>
                <p>{{ appliedCoupon.desc }} · You save ₹{{ couponDiscount }}</p>
              </div>
              <button type="button" class="link-btn" (click)="removeCoupon()">Remove</button>
            </div>

            <ng-template #couponForm>
              <div class="coupon-form">
                <div class="coupon-input" [class.has-error]="!!couponError">
                  <ion-icon name="pricetag-outline"></ion-icon>
                  <input
                    [(ngModel)]="couponInput"
                    (ngModelChange)="couponError = ''"
                    (keydown.enter)="applyCoupon()"
                    placeholder="Enter coupon code"
                    autocomplete="off"
                  />
                </div>
                <button
                  type="button"
                  class="apply-btn"
                  [disabled]="!couponInput.trim() || couponLoading()"
                  (click)="applyCoupon()"
                >
                  {{ couponLoading() ? '…' : 'Apply' }}
                </button>
              </div>
              <p class="error" *ngIf="couponError">{{ couponError }}</p>
              <p class="hint">Try OPTIKO10 · WELCOME150 · SUPER50 · TYNG20</p>
            </ng-template>
          </section>

          <section class="card">
            <h3 class="card-heading">Payment method</h3>
            <div class="pay-options">
              <button
                type="button"
                class="pay-option"
                [class.is-active]="paymentMethod === 'wallet'"
                (click)="paymentMethod = 'wallet'"
              >
                <div class="pay-icon wallet"><ion-icon name="wallet-outline"></ion-icon></div>
                <div>
                  <strong>Pay with wallet</strong>
                  <p>
                    Balance ₹{{ (walletBalance() || 0) | number:'1.0-0' }}
                    <ng-container *ngIf="walletBalance() !== null && walletBalance()! < grandTotal"> · insufficient</ng-container>
                  </p>
                </div>
                <ion-icon class="radio" [name]="paymentMethod === 'wallet' ? 'radio-button-on' : 'radio-button-off'"></ion-icon>
              </button>
              <button
                type="button"
                class="pay-option"
                [class.is-active]="paymentMethod === 'online'"
                (click)="paymentMethod = 'online'"
              >
                <div class="pay-icon online"><ion-icon name="phone-portrait-outline"></ion-icon></div>
                <div>
                  <strong>Pay online</strong>
                  <p>UPI / cards · {{ venue.autoConfirm !== false ? 'instant confirmation' : 'venue approval in 10 min' }}</p>
                </div>
                <ion-icon class="radio" [name]="paymentMethod === 'online' ? 'radio-button-on' : 'radio-button-off'"></ion-icon>
              </button>
              <button
                type="button"
                class="pay-option"
                [class.is-active]="paymentMethod === 'at_venue'"
                (click)="paymentMethod = 'at_venue'"
              >
                <div class="pay-icon venue"><ion-icon name="storefront-outline"></ion-icon></div>
                <div>
                  <strong>Pay at venue</strong>
                  <p>{{ venue.autoConfirm !== false ? 'Cash / UPI when you arrive' : 'Venue must approve within 10 minutes' }}</p>
                </div>
                <ion-icon class="radio" [name]="paymentMethod === 'at_venue' ? 'radio-button-on' : 'radio-button-off'"></ion-icon>
              </button>
            </div>
            <button *ngIf="paymentMethod === 'wallet' && walletBalance() !== null && walletBalance()! < grandTotal" type="button" class="wallet-topup-link" (click)="openTopupModal()">
              Top up wallet
            </button>
          </section>

          <section class="card">
            <h3 class="card-heading">Price breakdown</h3>
            <div class="price-row">
              <div>
                <strong>Court booking</strong>
                <span>{{ durationLabel }} × ₹{{ venue.pricePerHour.toLocaleString() }}/hr</span>
              </div>
              <em>₹{{ courtCost.toLocaleString() }}</em>
            </div>
            <div class="price-row" *ngIf="rentalCost > 0">
              <div>
                <strong>Rental equipment</strong>
                <span>{{ getSelectedRentalsCount() }} item(s)</span>
              </div>
              <em>₹{{ rentalCost.toLocaleString() }}</em>
            </div>
            <div class="price-row">
              <div>
                <strong>GST (18%)</strong>
                <span>On services</span>
              </div>
              <em>₹{{ tax.toLocaleString() }}</em>
            </div>
            <div class="price-row">
              <div>
                <strong>Platform fee</strong>
                <span>Processing</span>
              </div>
              <em>₹{{ platformFee.toLocaleString() }}</em>
            </div>
            <div class="price-row save" *ngIf="couponDiscount > 0">
              <div>
                <strong>Coupon · {{ appliedCoupon?.code }}</strong>
                <span>{{ appliedCoupon?.desc }}</span>
              </div>
              <em>−₹{{ couponDiscount.toLocaleString() }}</em>
            </div>
            <div class="grand">
              <div>
                <span>Grand total</span>
                <p>Taxes & fees included</p>
              </div>
              <strong>₹{{ grandTotal.toLocaleString() }}</strong>
            </div>
          </section>

          <p class="save-error" *ngIf="saveError()">{{ saveError() }}</p>
        </div>
      </div>
    </ion-content>

    <ion-footer *ngIf="venue" class="summary-footer ion-no-border">
      <div class="summary-cta">
        <div class="cta-top">
          <div>
            <span>Total</span>
            <strong>₹{{ grandTotal.toLocaleString() }}</strong>
          </div>
          <button
            type="button"
            class="cta-btn"
            [disabled]="saving()"
            (click)="confirmBooking()"
          >
            <ion-icon [name]="paymentMethod === 'at_venue' ? 'checkmark-circle-outline' : 'lock-closed-outline'"></ion-icon>
            <span>{{ saving() ? 'Booking…' : ctaLabel }}</span>
          </button>
        </div>
        <p class="cta-note">
          {{ ctaNote }}
        </p>
      </div>
    </ion-footer>

    <!-- Top-up modal -->
    <div class="topup-backdrop" *ngIf="showTopupModal()" (click)="closeTopupModal()"></div>
    <div class="topup-sheet" *ngIf="showTopupModal()" role="dialog" aria-label="Top up wallet">
      <div class="sheet-handle"></div>
      <h3>Top up wallet</h3>
      <p class="sheet-sub">
        Need ₹{{ topupShortfall | number:'1.0-0' }} more for this booking.
        Current balance ₹{{ (walletBalance() || 0) | number:'1.0-0' }}.
      </p>
      <div class="quick-amounts">
        <button
          type="button"
          *ngFor="let amt of topupQuickAmounts"
          [class.active]="topupAmount === amt"
          (click)="topupAmount = amt"
        >
          ₹{{ amt }}
        </button>
      </div>
      <div class="topup-row">
        <input
          type="number"
          [(ngModel)]="topupAmount"
          min="1"
          placeholder="Enter amount"
        />
        <button
          type="button"
          class="topup-confirm"
          [disabled]="toppingUp() || !topupAmount || topupAmount < 1"
          (click)="confirmTopup()"
        >
          {{ toppingUp() ? 'Adding…' : 'Add money' }}
        </button>
      </div>
      <p class="topup-error" *ngIf="topupError()">{{ topupError() }}</p>
      <p class="topup-hint">Simulated payment — stays on this page after top-up.</p>
      <button type="button" class="topup-cancel" (click)="closeTopupModal()">Cancel</button>
    </div>
  `,
  styles: [
    `
      :host { display: flex; flex-direction: column; height: 100%; }
      .summary-content { --background: #f4f6f8; }
      .summary-page { min-height: 100%; background: #f4f6f8; color: #111827; text-align: left; }
      .summary-header {
        position: sticky; top: 0; z-index: 20;
        display: flex; align-items: center; justify-content: space-between; gap: 12px;
        padding: 10px 16px; background: rgba(255,255,255,.96); border-bottom: 1px solid #eef0f3;
      }
      .summary-header-copy { text-align: center; min-width: 0; }
      .summary-header-copy h1 { margin: 0; font-size: 15px; font-weight: 900; }
      .summary-header-copy p { margin: 2px 0 0; font-size: 11px; font-weight: 700; color: #9ca3af; }
      .icon-btn {
        width: 40px; height: 40px; border: none; border-radius: 14px; background: #f3f4f6;
        display: inline-flex; align-items: center; justify-content: center; color: #111827;
      }
      .icon-btn ion-icon { font-size: 20px; }
      .icon-btn--ghost { background: transparent; pointer-events: none; }
      .summary-body { padding: 16px 16px 28px; display: flex; flex-direction: column; gap: 14px; }
      .card {
        background: #fff; border: 1px solid #eef0f3; border-radius: 22px;
        box-shadow: 0 8px 24px rgba(17,24,39,.04); padding: 16px;
      }
      .venue-row { display: flex; gap: 12px; align-items: center; }
      .venue-thumb { width: 72px; height: 72px; border-radius: 16px; overflow: hidden; background: #e5e7eb; flex-shrink: 0; }
      .venue-thumb img { width: 100%; height: 100%; object-fit: cover; }
      .venue-meta { min-width: 0; flex: 1; }
      .venue-meta h2 { margin: 0; font-size: 15px; font-weight: 900; }
      .venue-meta > p { margin: 4px 0 0; font-size: 12px; font-weight: 700; color: #9ca3af; }
      .meta-chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
      .meta-chips span {
        display: inline-flex; align-items: center; gap: 4px;
        font-size: 11px; font-weight: 700; color: #6b7280;
      }
      .meta-chips ion-icon { color: var(--app-primary); font-size: 12px; }
      .stat-strip {
        margin-top: 14px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px;
        background: #f9fafb; border: 1px solid #f3f4f6; border-radius: 16px; padding: 12px;
      }
      .stat-strip div { text-align: center; }
      .stat-strip strong { display: block; font-size: 16px; font-weight: 900; }
      .stat-strip span { display: block; margin-top: 2px; font-size: 10px; font-weight: 700; color: #9ca3af; }
      .section-toggle {
        width: 100%; border: none; background: transparent; display: flex; align-items: center;
        justify-content: space-between; padding: 0; color: inherit;
      }
      .section-toggle > div { display: flex; align-items: center; gap: 8px; }
      .section-toggle h3, .card-heading, .card-title h3 {
        margin: 0; font-size: 12px; font-weight: 900; letter-spacing: .08em; text-transform: uppercase;
      }
      .badge {
        font-size: 11px; font-weight: 900; color: #65a30d; background: rgba(var(--app-primary-rgb),.14);
        border-radius: 999px; padding: 2px 8px;
      }
      .rental-list { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
      .rental-row { display: flex; align-items: center; gap: 10px; }
      .rental-emoji {
        width: 40px; height: 40px; border-radius: 12px; background: #f3f4f6;
        display: flex; align-items: center; justify-content: center; font-size: 18px;
      }
      .rental-meta { flex: 1; min-width: 0; }
      .rental-meta strong { display: block; font-size: 14px; font-weight: 900; }
      .rental-meta span { display: block; margin-top: 2px; font-size: 11px; font-weight: 700; color: #9ca3af; }
      .rental-meta em { font-style: normal; color: var(--app-primary); margin-left: 6px; }
      .qty-controls { display: flex; align-items: center; gap: 8px; }
      .qty-controls span { width: 18px; text-align: center; font-weight: 900; font-size: 14px; }
      .qty-controls button {
        width: 30px; height: 30px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff;
        display: inline-flex; align-items: center; justify-content: center;
      }
      .qty-controls .plus {
        border: none; background: linear-gradient(135deg,var(--app-primary),var(--app-primary-to));
        box-shadow: 0 2px 8px rgba(var(--app-primary-rgb),.35);
      }
      .card-title { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
      .card-title ion-icon { color: #ff7a00; font-size: 16px; }
      .coupon-form { display: flex; gap: 8px; }
      .coupon-input {
        flex: 1; display: flex; align-items: center; gap: 8px; background: #f3f4f6;
        border: 1.5px solid transparent; border-radius: 16px; padding: 0 12px; height: 48px;
      }
      .coupon-input.has-error { border-color: #ef4444; background: #fef2f2; }
      .coupon-input ion-icon { color: #9ca3af; font-size: 16px; }
      .coupon-input input {
        flex: 1; border: none; outline: none; background: transparent; height: 100%;
        font-size: 14px; font-weight: 800; text-transform: uppercase; color: #111827;
      }
      .apply-btn {
        height: 48px; padding: 0 18px; border: none; border-radius: 16px;
        font-size: 13px; font-weight: 900; background: linear-gradient(135deg,var(--app-primary),var(--app-primary-to));
        color: #111827; box-shadow: 0 4px 14px rgba(var(--app-primary-rgb),.28); white-space: nowrap;
      }
      .apply-btn:disabled { background: #eef0f3; color: #c4c9d4; box-shadow: none; }
      .coupon-applied {
        display: flex; align-items: center; gap: 10px; padding: 12px;
        background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 16px;
      }
      .coupon-check {
        width: 32px; height: 32px; border-radius: 999px; background: #22c55e; color: #fff;
        display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
      }
      .coupon-applied strong { display: block; font-size: 13px; font-weight: 900; }
      .coupon-applied p { margin: 2px 0 0; font-size: 11px; font-weight: 700; color: #16a34a; }
      .link-btn { border: none; background: transparent; color: #9ca3af; font-size: 12px; font-weight: 800; }
      .error { margin: 8px 0 0; font-size: 11px; font-weight: 700; color: #ef4444; }
      .hint { margin: 8px 0 0; font-size: 11px; font-weight: 700; color: #9ca3af; }
      .pay-options { display: flex; flex-direction: column; gap: 10px; margin-top: 12px; }
      .pay-option {
        width: 100%; display: flex; align-items: center; gap: 12px; text-align: left;
        border: 1.5px solid #e8eaee; background: #fff; border-radius: 18px; padding: 12px;
      }
      .pay-option.is-active {
        border-color: var(--app-primary); background: rgba(var(--app-primary-rgb),.08);
        box-shadow: 0 4px 14px rgba(var(--app-primary-rgb),.16);
      }
      .pay-icon {
        width: 42px; height: 42px; border-radius: 14px; display: inline-flex;
        align-items: center; justify-content: center; flex-shrink: 0;
      }
      .pay-icon.online { background: #eff6ff; color: #2563eb; }
      .pay-icon.wallet { background: #ecfdf5; color: #059669; }
      .pay-icon.venue { background: #fff7ed; color: #ea580c; }
      .wallet-topup-link {
        margin-top: 10px; width: 100%; height: 40px; border: none; border-radius: 12px;
        background: #111827; color: #fff; font-size: 12px; font-weight: 800;
      }
      .pay-icon ion-icon { font-size: 18px; }
      .pay-option strong { display: block; font-size: 14px; font-weight: 900; }
      .pay-option p { margin: 2px 0 0; font-size: 11px; font-weight: 700; color: #9ca3af; }
      .pay-option .radio { margin-left: auto; font-size: 20px; color: #9ca3af; }
      .pay-option.is-active .radio { color: #65a30d; }
      .price-row {
        display: flex; justify-content: space-between; gap: 12px;
        padding: 12px 0; border-bottom: 1px solid #f9fafb;
      }
      .price-row strong { display: block; font-size: 14px; font-weight: 800; }
      .price-row span { display: block; margin-top: 2px; font-size: 11px; font-weight: 700; color: #9ca3af; }
      .price-row em { font-style: normal; font-size: 14px; font-weight: 800; color: #6b7280; }
      .price-row.save em { color: #16a34a; }
      .grand {
        margin-top: 12px; border-radius: 18px; padding: 14px 16px;
        background: linear-gradient(145deg,#111827,#1f2937); color: #fff;
        display: flex; align-items: center; justify-content: space-between;
      }
      .grand span { font-size: 11px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; color: rgba(255,255,255,.5); }
      .grand p { margin: 4px 0 0; font-size: 11px; font-weight: 700; color: rgba(255,255,255,.4); }
      .grand > strong { font-size: 24px; font-weight: 900; color: var(--app-primary); }
      .save-error {
        margin: 0; padding: 12px 14px; border-radius: 14px; background: #fef2f2;
        border: 1px solid #fecaca; color: #dc2626; font-size: 13px; font-weight: 700;
      }
      .summary-footer { background: #fff; box-shadow: 0 -8px 28px rgba(17,24,39,.08); }
      .summary-cta {
        max-width: 28rem; margin: 0 auto;
        padding: 12px 16px calc(16px + env(safe-area-inset-bottom, 0px));
      }
      .cta-top { display: flex; align-items: center; gap: 12px; }
      .cta-top > div span { display: block; font-size: 11px; font-weight: 700; color: #9ca3af; }
      .cta-top > div strong { display: block; margin-top: 2px; font-size: 20px; font-weight: 900; }
      .cta-btn {
        flex: 1; min-width: 0; height: 52px; border: none; border-radius: 16px;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
        font-size: 14px; font-weight: 900; color: #fff;
        background: linear-gradient(135deg,#ff7a00,#ff9a40);
        box-shadow: 0 8px 22px rgba(255,122,0,.35); padding: 0 14px;
      }
      .cta-btn:disabled { opacity: .65; }
      .cta-btn span { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .cta-note { margin: 8px 0 0; text-align: center; font-size: 10px; font-weight: 700; color: #9ca3af; }

      .topup-backdrop {
        position: fixed; inset: 0; z-index: 40;
        background: rgba(17, 24, 39, 0.45);
      }
      .topup-sheet {
        position: fixed; left: 0; right: 0; bottom: 0; z-index: 41;
        max-width: 28rem; margin: 0 auto;
        background: #fff; border-radius: 24px 24px 0 0;
        padding: 12px 20px calc(20px + env(safe-area-inset-bottom, 0px));
        box-shadow: 0 -12px 40px rgba(17, 24, 39, 0.18);
      }
      .sheet-handle {
        width: 40px; height: 4px; border-radius: 99px; background: #e5e7eb;
        margin: 0 auto 14px;
      }
      .topup-sheet h3 {
        margin: 0; font-size: 18px; font-weight: 900; color: #111827;
      }
      .sheet-sub {
        margin: 6px 0 14px; font-size: 12px; font-weight: 600; color: #6b7280; line-height: 1.4;
      }
      .quick-amounts {
        display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px;
      }
      .quick-amounts button {
        height: 40px; border-radius: 12px; border: 1.5px solid #e5e7eb;
        background: #f9fafb; font-size: 13px; font-weight: 800; color: #111827;
      }
      .quick-amounts button.active {
        border-color: var(--app-primary); background: rgba(var(--app-primary-rgb), 0.12); color: #3f6212;
      }
      .topup-row { display: flex; gap: 8px; }
      .topup-row input {
        flex: 1; min-width: 0; height: 48px; border-radius: 14px;
        border: 1.5px solid #e5e7eb; padding: 0 14px; font-size: 15px; font-weight: 700;
        color: #111827; background: #fff;
      }
      .topup-confirm {
        flex-shrink: 0; height: 48px; padding: 0 16px; border: none; border-radius: 14px;
        background: #111827; color: #fff; font-size: 13px; font-weight: 800;
      }
      .topup-confirm:disabled { opacity: .55; }
      .topup-error {
        margin: 10px 0 0; font-size: 12px; font-weight: 700; color: #dc2626;
      }
      .topup-hint {
        margin: 10px 0 0; font-size: 11px; font-weight: 600; color: #9ca3af;
      }
      .topup-cancel {
        margin-top: 12px; width: 100%; height: 44px; border: none; border-radius: 14px;
        background: #f3f4f6; color: #4b5563; font-size: 13px; font-weight: 800;
      }
    `,
  ],
})
export class VenueBookingSummaryPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);
  private readonly walletService = inject(WalletService);

  venueId: number | null = null;
  venue: VenueDetail | null = null;

  selectedDate = 'Today';
  bookingDate = '';
  selectedSlots: string[] = [];
  rentalQty: Record<string, number> = {};

  showRental = true;
  paymentMethod: 'online' | 'at_venue' | 'wallet' = 'wallet';
  walletBalance = signal<number | null>(null);
  showTopupModal = signal(false);
  toppingUp = signal(false);
  topupError = signal('');
  topupAmount: number | null = 500;
  topupQuickAmounts = [200, 500, 1000, 2000];

  couponInput = '';
  appliedCoupon: AppliedCoupon | null = null;
  couponError = '';
  couponLoading = signal(false);
  saving = signal(false);
  saveError = signal('');

  readonly platformFee = 49;
  readonly taxRate = 0.18;

  ngOnInit() {
    void this.loadWalletBalance();
    this.route.paramMap.subscribe((params) => {
      const idStr = params.get('id');
      if (!idStr) return;
      this.venueId = +idStr;

      const nav = this.router.getCurrentNavigation();
      const state = (nav?.extras.state || history.state || {}) as Record<string, unknown>;

      if (state['venue']) this.venue = state['venue'] as VenueDetail;
      if (state['selectedDate']) this.selectedDate = String(state['selectedDate']);
      if (state['bookingDate']) this.bookingDate = String(state['bookingDate']);
      if (Array.isArray(state['selectedSlots'])) this.selectedSlots = state['selectedSlots'] as string[];
      if (state['rentalItems']) this.rentalQty = state['rentalItems'] as Record<string, number>;

      if (!this.venue) {
        this.venue = VENUE_DATA.find((v) => v.id === this.venueId) || VENUE_DATA[0];
      }
      if (!this.bookingDate) {
        this.bookingDate = this.fallbackBookingDate();
      }
    });
  }

  get ctaLabel(): string {
    if (!this.venue) return 'Confirm';
    if (this.paymentMethod === 'wallet') {
      return this.venue.autoConfirm !== false ? 'Pay with wallet' : 'Pay & request';
    }
    if (this.paymentMethod === 'online') {
      return this.venue.autoConfirm !== false ? 'Pay & confirm' : 'Pay & request';
    }
    return this.venue.autoConfirm !== false ? 'Confirm · pay at venue' : 'Request booking';
  }

  get ctaNote(): string {
    if (!this.venue) return '';
    if (this.venue.autoConfirm === false) {
      return 'Venue has 10 minutes to approve. If not approved, the booking is cancelled automatically.';
    }
    if (this.paymentMethod === 'wallet') {
      return 'Amount will be deducted from your TYNG wallet instantly';
    }
    if (this.paymentMethod === 'online') {
      return 'Secure checkout · free cancellation up to 24h before';
    }
    return 'Venue will see this booking instantly · pay on arrival';
  }

  get slotIntervalMinutes(): SlotIntervalMinutes {
    return normalizeSlotInterval(this.venue?.slotIntervalMinutes);
  }

  get playMinutes(): number {
    return playMinutesForSlots(this.selectedSlots.length);
  }

  get blockedMinutes(): number {
    return blockedMinutesForSlots(this.selectedSlots.length, this.slotIntervalMinutes);
  }

  get durationMinutes(): number {
    return this.playMinutes;
  }

  get durationLabel(): string {
    return formatDurationLabel(this.playMinutes);
  }

  get startTime(): string {
    return this.selectedSlots[0] || '';
  }

  get endHour(): string {
    const last = this.selectedSlots[this.selectedSlots.length - 1];
    return last ? slotEndClock(last) : '';
  }

  inc(itemId: string) {
    this.rentalQty[itemId] = (this.rentalQty[itemId] || 0) + 1;
  }

  dec(itemId: string) {
    this.rentalQty[itemId] = Math.max(0, (this.rentalQty[itemId] || 0) - 1);
  }

  getSelectedRentalsCount(): number {
    return Object.values(this.rentalQty).filter((q) => q > 0).length;
  }

  get courtCost(): number {
    if (!this.venue) return 0;
    return courtCostFromMinutes(this.venue.pricePerHour, this.playMinutes);
  }

  get rentalCost(): number {
    if (!this.venue) return 0;
    return this.venue.rentalEquipment.reduce(
      (sum, item) => sum + (this.rentalQty[item.id] || 0) * item.price,
      0,
    );
  }

  get subTotal(): number {
    return this.courtCost + this.rentalCost;
  }

  get tax(): number {
    return Math.round(this.subTotal * this.taxRate);
  }

  get couponDiscount(): number {
    return this.appliedCoupon?.discount || 0;
  }

  get grandTotal(): number {
    return Math.max(0, this.subTotal + this.tax + this.platformFee - this.couponDiscount);
  }

  async applyCoupon() {
    const code = this.couponInput.trim().toUpperCase();
    if (!code) return;
    this.couponLoading.set(true);
    this.couponError = '';
    try {
      const response = await firstValueFrom(
        this.bookingService.validateCoupon(code, this.courtCost),
      );
      if (!response.success || !response.data) {
        this.couponError = response.message || 'Invalid coupon code.';
        return;
      }
      const data = response.data;
      this.appliedCoupon = {
        code: data.code,
        type: data.type,
        value: data.value,
        desc: data.description || data.title || 'Coupon applied',
        discount: data.discount || 0,
      };
      this.couponInput = '';
    } catch (error: any) {
      this.couponError = error?.error?.message || 'Invalid coupon code.';
    } finally {
      this.couponLoading.set(false);
    }
  }

  removeCoupon() {
    this.appliedCoupon = null;
  }

  back() {
    this.router.navigate([`/app/venue/${this.venueId}/book`], {
      state: {
        venue: this.venue,
        rentalItems: this.rentalQty,
      },
    });
  }

  goWallet() {
    this.openTopupModal();
  }

  get topupShortfall(): number {
    return Math.max(0, Math.ceil(this.grandTotal - (this.walletBalance() || 0)));
  }

  openTopupModal() {
    const shortfall = this.topupShortfall;
    const suggested = shortfall > 0 ? Math.max(shortfall, 100) : 500;
    this.topupQuickAmounts = Array.from(
      new Set([suggested, 200, 500, 1000, 2000].filter((n) => n > 0)),
    ).slice(0, 4);
    this.topupAmount = suggested;
    this.topupError.set('');
    this.showTopupModal.set(true);
  }

  closeTopupModal() {
    this.showTopupModal.set(false);
    this.topupError.set('');
  }

  async confirmTopup() {
    const amount = Number(this.topupAmount || 0);
    if (!amount || amount < 1) {
      this.topupError.set('Enter a valid amount');
      return;
    }

    this.toppingUp.set(true);
    this.topupError.set('');
    try {
      const res = await firstValueFrom(this.walletService.topup(amount));
      if (!res.success || !res.data) {
        this.topupError.set(res.message || 'Top-up failed');
        return;
      }
      this.walletBalance.set(Number(res.data.wallet?.balance || 0));
      this.saveError.set('');
      this.closeTopupModal();
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message || 'Top-up failed';
      this.topupError.set(message);
    } finally {
      this.toppingUp.set(false);
    }
  }

  async confirmBooking() {
    if (!this.venue || !this.venueId || this.durationMinutes === 0 || this.saving()) return;

    if (this.paymentMethod === 'wallet' && (this.walletBalance() ?? 0) < this.grandTotal) {
      this.saveError.set('Insufficient wallet balance. Please top up your wallet first.');
      return;
    }

    this.saving.set(true);
    this.saveError.set('');
    try {
      const rentalDetails = this.venue.rentalEquipment
        .filter((item) => (this.rentalQty[item.id] || 0) > 0)
        .map((item) => ({
          id: item.id,
          name: item.name,
          qty: this.rentalQty[item.id],
          price: item.price,
        }));

      const response = await firstValueFrom(
        this.bookingService.bookGame({
          sport: this.venue.sport || 'basketball',
          venue_id: this.venueId,
          date: this.bookingDate || this.fallbackBookingDate(),
          time: this.normalizeSlotTime(this.startTime),
          team_size: '1',
          duration_hours: this.selectedSlots.length,
          duration_minutes: this.blockedMinutes,
          price: this.grandTotal,
          payment_method: this.paymentMethod,
          coupon_code: this.appliedCoupon?.code || null,
          coupon_discount: this.couponDiscount,
          rental_details: rentalDetails,
          court_name: this.venue.courtName,
        }),
      );

      if (!response.success) {
        this.saveError.set(response.message || 'Unable to create booking.');
        return;
      }

      void this.router.navigateByUrl('/app/my-bookings');
    } catch (error: any) {
      const fieldErrors = error?.error?.errors;
      const paymentError = fieldErrors?.payment_method?.[0];
      this.saveError.set(paymentError || error?.error?.message || 'Unable to create booking.');
      if (this.paymentMethod === 'wallet') {
        void this.loadWalletBalance();
      }
    } finally {
      this.saving.set(false);
    }
  }

  private async loadWalletBalance() {
    try {
      const res = await firstValueFrom(this.walletService.getWallet());
      this.walletBalance.set(res.success && res.data ? Number(res.data.balance || 0) : 0);
    } catch {
      this.walletBalance.set(0);
    }
  }

  private normalizeSlotTime(slot: string): string {
    // Ensure "6:00 AM" format for backend date_format:g:i A
    if (/^\d{1,2}:\d{2}\s?(AM|PM)$/i.test(slot)) {
      const [hm, ampm] = slot.trim().split(/\s+/);
      const [h, m] = hm.split(':');
      return `${Number(h)}:${m} ${ampm.toUpperCase()}`;
    }
    return slot;
  }

  private fallbackBookingDate(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
