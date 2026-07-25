import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { VENUE_DATA, type VenueDetail } from './venue-detail.page';

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
                <strong>{{ hours }}</strong>
                <span>{{ hours === 1 ? 'Hour' : 'Hours' }}</span>
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
                [class.is-active]="paymentMethod === 'online'"
                (click)="paymentMethod = 'online'"
              >
                <div class="pay-icon online"><ion-icon name="phone-portrait-outline"></ion-icon></div>
                <div>
                  <strong>Pay online</strong>
                  <p>UPI / cards · instant confirmation</p>
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
                  <p>Cash / UPI when you arrive</p>
                </div>
                <ion-icon class="radio" [name]="paymentMethod === 'at_venue' ? 'radio-button-on' : 'radio-button-off'"></ion-icon>
              </button>
            </div>
          </section>

          <section class="card">
            <h3 class="card-heading">Price breakdown</h3>
            <div class="price-row">
              <div>
                <strong>Court booking</strong>
                <span>{{ hours }} hr × ₹{{ venue.pricePerHour.toLocaleString() }}</span>
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
            <ion-icon [name]="paymentMethod === 'online' ? 'lock-closed-outline' : 'checkmark-circle-outline'"></ion-icon>
            <span>{{ saving() ? 'Booking…' : (paymentMethod === 'online' ? 'Pay & confirm' : 'Confirm · pay at venue') }}</span>
          </button>
        </div>
        <p class="cta-note">
          {{ paymentMethod === 'online' ? 'Secure checkout · free cancellation up to 24h before' : 'Venue will see this booking instantly · pay on arrival' }}
        </p>
      </div>
    </ion-footer>
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
      .meta-chips ion-icon { color: #8cf000; font-size: 12px; }
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
        font-size: 11px; font-weight: 900; color: #65a30d; background: rgba(140,240,0,.14);
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
      .rental-meta em { font-style: normal; color: #8cf000; margin-left: 6px; }
      .qty-controls { display: flex; align-items: center; gap: 8px; }
      .qty-controls span { width: 18px; text-align: center; font-weight: 900; font-size: 14px; }
      .qty-controls button {
        width: 30px; height: 30px; border-radius: 999px; border: 1px solid #e5e7eb; background: #fff;
        display: inline-flex; align-items: center; justify-content: center;
      }
      .qty-controls .plus {
        border: none; background: linear-gradient(135deg,#8cf000,#a3e635);
        box-shadow: 0 2px 8px rgba(140,240,0,.35);
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
        font-size: 13px; font-weight: 900; background: linear-gradient(135deg,#8cf000,#a3e635);
        color: #111827; box-shadow: 0 4px 14px rgba(140,240,0,.28); white-space: nowrap;
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
        border-color: #8cf000; background: rgba(140,240,0,.08);
        box-shadow: 0 4px 14px rgba(140,240,0,.16);
      }
      .pay-icon {
        width: 42px; height: 42px; border-radius: 14px; display: inline-flex;
        align-items: center; justify-content: center; flex-shrink: 0;
      }
      .pay-icon.online { background: #eff6ff; color: #2563eb; }
      .pay-icon.venue { background: #fff7ed; color: #ea580c; }
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
      .grand > strong { font-size: 24px; font-weight: 900; color: #8cf000; }
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
    `,
  ],
})
export class VenueBookingSummaryPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly bookingService = inject(BookingService);

  venueId: number | null = null;
  venue: VenueDetail | null = null;

  selectedDate = 'Today';
  bookingDate = '';
  selectedSlots: string[] = [];
  rentalQty: Record<string, number> = {};

  showRental = true;
  paymentMethod: 'online' | 'at_venue' = 'online';

  couponInput = '';
  appliedCoupon: AppliedCoupon | null = null;
  couponError = '';
  couponLoading = signal(false);
  saving = signal(false);
  saveError = signal('');

  readonly platformFee = 49;
  readonly taxRate = 0.18;

  ngOnInit() {
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

  get hours(): number {
    return this.selectedSlots.length;
  }

  get startTime(): string {
    return this.selectedSlots[0] || '';
  }

  get endHour(): string {
    if (this.hours === 0 || !this.startTime) return '';
    const [hm, ampm] = this.startTime.split(' ');
    const [h, m] = hm.split(':').map(Number);
    let total = (ampm === 'PM' && h !== 12 ? h + 12 : h === 12 && ampm === 'AM' ? 0 : h) * 60 + m + this.hours * 60;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    const eAmpm = eh >= 12 ? 'PM' : 'AM';
    const dh = eh > 12 ? eh - 12 : eh === 0 ? 12 : eh;
    return `${dh}:${em.toString().padStart(2, '0')} ${eAmpm}`;
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
    return this.hours * this.venue.pricePerHour;
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

  async confirmBooking() {
    if (!this.venue || !this.venueId || this.hours === 0 || this.saving()) return;
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
          duration_hours: this.hours,
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
      this.saveError.set(error?.error?.message || 'Unable to create booking.');
    } finally {
      this.saving.set(false);
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
