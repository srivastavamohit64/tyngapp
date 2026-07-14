import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';
import { VENUE_DATA, type VenueDetail } from './venue-detail.page';

interface Coupon {
  discount: number;
  type: 'percent' | 'flat';
  desc: string;
}

const COUPONS: Record<string, Coupon> = {
  'TYNG20':   { discount: 20,  type: 'percent', desc: '20% off court booking' },
  'FIRST100': { discount: 100, type: 'flat',    desc: '₹100 off first booking' },
  'SPORT50':  { discount: 50,  type: 'flat',    desc: '₹50 off for sports lovers' },
};

@Component({
  selector: 'app-venue-booking-summary',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content fullscreen>
      <div class="min-h-screen bg-[#FAFBFC] pb-32 text-[#111827] text-left" *ngIf="venue">
        
        <!-- Header -->
        <div class="sticky top-0 z-30 bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button
              (click)="back()"
              class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none outline-none"
            >
              <ion-icon name="chevron-back" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[15px] font-black text-[#111827] m-0">Booking Summary</p>
              <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5 font-bold">Review before payment</p>
            </div>
            <div class="w-10"></div>
          </div>
        </div>

        <div class="px-5 pt-5 space-y-4">
          
          <!-- Venue summary card -->
          <div class="bg-white rounded-[24px] border border-[#F3F4F6] shadow-sm">
            <div class="p-4 flex items-center gap-4">
              <div class="w-[80px] h-[80px] rounded-2xl overflow-hidden bg-gray-200 flex-shrink-0">
                <img [src]="venue.images[0]" [alt]="venue.courtName" class="w-full h-full object-cover" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[16px] font-black text-[#111827] leading-tight m-0">{{ venue.courtName }}</p>
                <p class="text-[12px] text-[#9CA3AF] mt-1 m-0 font-bold">{{ venue.venueName }}</p>
                
                <div class="flex items-center gap-3 mt-2 flex-wrap">
                  <div class="flex items-center gap-1 leading-none">
                    <ion-icon name="calendar-outline" class="text-[#8CF000] text-xs font-bold"></ion-icon>
                    <span class="text-[11px] font-bold text-[#6B7280]">{{ selectedDate }}</span>
                  </div>
                  <div class="flex items-center gap-1 leading-none">
                    <ion-icon name="time-outline" class="text-[#8CF000] text-xs font-bold"></ion-icon>
                    <span class="text-[11px] font-bold text-[#6B7280]">{{ startTime }} – {{ endHour }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Booking meta strip -->
            <div class="mx-4 mb-4 bg-[#F9FAFB] rounded-2xl px-4 py-3 grid grid-cols-3 gap-2 border border-[#F3F4F6]">
              <div class="text-center">
                <p class="text-[18px] font-black text-[#111827] m-0">{{ hours }}</p>
                <p class="text-[10px] text-[#9CA3AF] m-0 mt-0.5 font-bold">{{ hours === 1 ? 'Hour' : 'Hours' }}</p>
              </div>
              <div class="text-center border-x border-[#E5E7EB]">
                <p class="text-[18px] font-black text-[#111827] m-0">₹{{ venue.pricePerHour.toLocaleString() }}</p>
                <p class="text-[10px] text-[#9CA3AF] m-0 mt-0.5 font-bold">per hour</p>
              </div>
              <div class="text-center">
                <p class="text-[18px] font-black text-[#111827] m-0">₹{{ courtCost.toLocaleString() }}</p>
                <p class="text-[10px] text-[#9CA3AF] m-0 mt-0.5 font-bold">court total</p>
              </div>
            </div>
          </div>

          <!-- Rental Equipment (editable) -->
          <div class="bg-white rounded-[24px] border border-[#F3F4F6] shadow-sm">
            <button
              (click)="showRental = !showRental"
              class="w-full flex items-center justify-between px-5 pt-5 pb-4 border-none bg-transparent outline-none"
            >
              <div class="flex items-center gap-2">
                <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0 leading-none">
                  Rental Equipment
                </p>
                <span *ngIf="rentalCost > 0" class="text-[11px] font-black text-[#8CF000] bg-[rgba(140,240,0,0.12)] px-2 py-0.5 rounded-full">
                  +₹{{ rentalCost }}
                </span>
              </div>
              <ion-icon [name]="showRental ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF] text-sm"></ion-icon>
            </button>

            <div *ngIf="showRental" class="px-5 pb-5 space-y-3">
              <div *ngFor="let item of venue.rentalEquipment" class="flex items-center gap-3 py-1.5 border-b border-[#F9FAFB] last:border-0">
                <div class="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 text-xl font-bold">
                  {{ item.emoji }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-black text-[#111827] m-0">{{ item.name }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5 font-bold">
                    ₹{{ item.price }}/session
                    <span *ngIf="(rentalQty[item.id] || 0) > 0" class="ml-1.5 text-[#8CF000] font-black">
                      = ₹{{ item.price * rentalQty[item.id] }}
                    </span>
                  </p>
                </div>
                <div class="flex items-center gap-2.5 flex-shrink-0">
                  <button
                    (click)="dec(item.id)"
                    class="w-8 h-8 rounded-full flex items-center justify-center border transition-all outline-none"
                    [style.borderColor]="(rentalQty[item.id] || 0) > 0 ? '#E5E7EB' : '#F3F4F6'"
                    style="background-color: white;"
                  >
                    <ion-icon *ngIf="rentalQty[item.id] === 1" name="trash-outline" class="text-[#EF4444] text-[11px] font-black"></ion-icon>
                    <ion-icon *ngIf="rentalQty[item.id] !== 1" name="remove-outline" class="text-[#6B7280] text-[11px] font-black"></ion-icon>
                  </button>
                  <span class="w-5 text-center text-[15px] font-black text-[#111827]">{{ rentalQty[item.id] || 0 }}</span>
                  <button
                    (click)="inc(item.id)"
                    class="w-8 h-8 rounded-full flex items-center justify-center border-none outline-none"
                    style="background: linear-gradient(135deg,#8CF000,#A3E635); box-shadow: 0 2px 8px rgba(140,240,0,0.35);"
                  >
                    <ion-icon name="add-outline" class="text-[#111827] text-[11px] font-black"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Coupon code -->
          <div class="bg-white rounded-[24px] border border-[#F3F4F6] shadow-sm">
            <div class="px-5 py-5">
              <div class="flex items-center gap-2 mb-3">
                <ion-icon name="gift-outline" class="text-[#FF7A00] text-sm"></ion-icon>
                <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0 leading-none">Coupon / Promo</p>
              </div>

              <div
                *ngIf="appliedCoupon; else couponForm"
                class="flex items-center gap-3 bg-[#F0FDF4] rounded-2xl px-4 py-3 border border-[#BBF7D0] text-left"
              >
                <div class="w-8 h-8 rounded-full bg-[#22C55E] flex items-center justify-center flex-shrink-0">
                  <ion-icon name="checkmark" class="text-white text-sm font-black"></ion-icon>
                </div>
                <div class="flex-1">
                  <p class="text-[13px] font-black text-[#111827] m-0">{{ appliedCoupon.code }}</p>
                  <p class="text-[11px] text-[#16A34A] m-0 mt-0.5 font-bold">
                    {{ appliedCoupon.desc }} — You save ₹{{ couponDiscount }}
                  </p>
                </div>
                <button (click)="appliedCoupon = null" class="text-[#9CA3AF] border-none bg-transparent outline-none">
                  <ion-icon name="trash-outline" class="text-sm"></ion-icon>
                </button>
              </div>

              <ng-template #couponForm>
                <div>
                  <div class="flex gap-2">
                    <div
                      class="flex-1 flex items-center gap-2.5 bg-[#F3F4F6] rounded-2xl px-4 h-11 border border-transparent"
                      [style.borderColor]="couponError ? '#EF4444' : 'transparent'"
                    >
                      <ion-icon name="pricetag-outline" class="text-[#9CA3AF] text-sm"></ion-icon>
                      <input
                        [(ngModel)]="couponInput"
                        (ngModelChange)="couponError = ''"
                        (keydown.enter)="applyCoupon()"
                        placeholder="Enter coupon code"
                        class="flex-1 bg-transparent text-[14px] font-bold text-[#111827] placeholder:text-[#9CA3AF] placeholder:font-normal border-none outline-none min-h-0 uppercase"
                        style="box-shadow: none;"
                      />
                    </div>
                    <button
                      (click)="applyCoupon()"
                      [disabled]="!couponInput.trim()"
                      class="h-11 px-5 rounded-2xl text-[13px] font-black transition-all border-none outline-none"
                      [style.background]="couponInput.trim() ? 'linear-gradient(135deg,#8CF000,#A3E635)' : '#F3F4F6'"
                      [style.color]="couponInput.trim() ? '#111827' : '#C4C9D4'"
                    >
                      Apply
                    </button>
                  </div>
                  <p *ngIf="couponError" class="text-[11px] text-[#EF4444] mt-1.5 ml-1 m-0 font-bold">{{ couponError }}</p>
                  <p class="text-[11px] text-[#9CA3AF] mt-2 ml-1 m-0 font-bold">Try: TYNG20 · FIRST100 · SPORT50</p>
                </div>
              </ng-template>
            </div>
          </div>

          <!-- Price breakdown -->
          <div class="bg-white rounded-[24px] border border-[#F3F4F6] shadow-sm">
            <div class="px-5 pt-5">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-1 m-0 leading-none">Price Breakdown</p>
            </div>
            
            <div class="px-5">
              <!-- Row: Court Booking -->
              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB] text-left">
                <div>
                  <p class="text-[14px] font-bold text-[#111827] m-0">Court Booking</p>
                  <p class="text-[11px] text-[#9CA3AF] mt-0.5 m-0 font-bold">
                    {{ hours }} hr{{ hours > 1 ? 's' : '' }} × ₹{{ venue.pricePerHour.toLocaleString() }}/hr
                  </p>
                </div>
                <p class="text-[14px] font-bold text-[#6B7280] m-0">₹{{ courtCost.toLocaleString() }}</p>
              </div>

              <!-- Row: Rental Equipment -->
              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB] text-left" *ngIf="rentalCost > 0">
                <div>
                  <p class="text-[14px] font-bold text-[#111827] m-0">Rental Equipment</p>
                  <p class="text-[11px] text-[#9CA3AF] mt-0.5 m-0 font-bold">
                    {{ getSelectedRentalsCount() }} item{{ getSelectedRentalsCount() > 1 ? 's' : '' }} selected
                  </p>
                </div>
                <p class="text-[14px] font-bold text-[#6B7280] m-0">₹{{ rentalCost.toLocaleString() }}</p>
              </div>

              <!-- Row: GST (18%) -->
              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB] text-left">
                <div>
                  <p class="text-[14px] font-bold text-[#111827] m-0">GST (18%)</p>
                  <p class="text-[11px] text-[#9CA3AF] mt-0.5 m-0 font-bold">Applicable on all services</p>
                </div>
                <p class="text-[14px] font-bold text-[#6B7280] m-0">₹{{ tax.toLocaleString() }}</p>
              </div>

              <!-- Row: Platform Fee -->
              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB] text-left">
                <div>
                  <p class="text-[14px] font-bold text-[#111827] m-0">Platform Fee</p>
                  <p class="text-[11px] text-[#9CA3AF] mt-0.5 m-0 font-bold">One-time processing charge</p>
                </div>
                <p class="text-[14px] font-bold text-[#6B7280] m-0">₹{{ platformFee.toLocaleString() }}</p>
              </div>

              <!-- Row: Coupon Discount -->
              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB] text-left" *ngIf="couponDiscount > 0">
                <div>
                  <p class="text-[14px] font-bold text-[#111827] m-0">Coupon: {{ appliedCoupon?.code }}</p>
                  <p class="text-[11px] text-[#22C55E] mt-0.5 m-0 font-bold">{{ appliedCoupon?.desc }}</p>
                </div>
                <p class="text-[14px] font-black text-[#22C55E] m-0">-₹{{ couponDiscount.toLocaleString() }}</p>
              </div>
            </div>

            <!-- Grand Total -->
            <div
              class="mx-5 mb-5 mt-2 rounded-[20px] overflow-hidden text-left"
              style="background: linear-gradient(135deg,#111827 0%,#1F2937 100%);"
            >
              <div class="px-5 py-4 flex items-center justify-between">
                <div>
                  <p class="text-[11px] text-white/50 uppercase tracking-wider font-bold m-0 leading-none">Grand Total</p>
                  <p class="text-[12px] text-white/40 mt-1 m-0 leading-none font-bold">Taxes & fees included</p>
                </div>
                <p class="text-[28px] font-black text-[#8CF000] m-0">₹{{ grandTotal.toLocaleString() }}</p>
              </div>
              <div class="px-5 pb-4 flex items-center gap-2" *ngIf="couponDiscount > 0">
                <div class="w-5 h-5 rounded-full bg-[#22C55E] flex items-center justify-center">
                  <ion-icon name="checkmark" class="text-white text-[10px] font-black"></ion-icon>
                </div>
                <p class="text-[12px] text-[#22C55E] font-bold m-0 leading-none">
                  You're saving ₹{{ couponDiscount }} on this booking!
                </p>
              </div>
            </div>
          </div>

          <!-- Cancellation policy -->
          <div class="bg-white rounded-[24px] border border-[#F3F4F6] shadow-sm">
            <button
              (click)="showPolicy = !showPolicy"
              class="w-full flex items-center justify-between px-5 py-4 border-none bg-transparent outline-none"
            >
              <div class="flex items-center gap-2">
                <ion-icon name="information-circle-outline" class="text-[#FF7A00] text-sm"></ion-icon>
                <p class="text-[14px] font-black text-[#111827] m-0">Cancellation Policy</p>
              </div>
              <ion-icon [name]="showPolicy ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF] text-sm"></ion-icon>
            </button>

            <div *ngIf="showPolicy" class="px-5 pb-5 space-y-3">
              <div
                *ngFor="let p of [
                  { icon: '✅', title: 'Full Refund', desc: 'Cancel up to 24 hours before your slot for a 100% refund.', color: '#16A34A' },
                  { icon: '⚠️', title: '50% Refund', desc: 'Cancel between 6–24 hours before your slot for a 50% refund.', color: '#D97706' },
                  { icon: '❌', title: 'No Refund', desc: 'Cancellations within 6 hours of the slot are non-refundable.', color: '#DC2626' }
                ]"
                class="flex items-start gap-3 bg-[#F9FAFB] rounded-2xl px-4 py-3 text-left"
              >
                <span class="text-lg flex-shrink-0 mt-0.5 leading-none">{{ p.icon }}</span>
                <div>
                  <p class="text-[13px] font-black m-0 leading-none" [style.color]="p.color">{{ p.title }}</p>
                  <p class="text-[12px] text-[#6B7280] leading-relaxed mt-1 m-0 font-bold">{{ p.desc }}</p>
                </div>
              </div>
              <p class="text-[11px] text-[#9CA3AF] px-1 leading-relaxed m-0 font-bold">
                Refunds are processed within 5–7 business days to your original payment method. Platform fees are non-refundable.
              </p>
            </div>
          </div>

          <!-- Secure Payment -->
          <div class="bg-white rounded-[24px] px-5 py-5 border border-[#F3F4F6] shadow-sm text-left">
            <div class="flex items-center gap-2 mb-4 leading-none">
              <ion-icon name="lock-closed-outline" class="text-[#8CF000] text-sm font-bold"></ion-icon>
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0">Secure Payment</p>
            </div>

            <!-- Security badges -->
            <div class="flex items-center gap-2 mb-4 flex-wrap leading-none">
              <span
                *ngFor="let b of [
                  { label: '🔒 SSL Encrypted', bg: '#F0FDF4', color: '#16A34A' },
                  { label: '✅ PCI DSS', bg: '#EFF6FF', color: '#1D4ED8' },
                  { label: '🛡 RBI Compliant', bg: '#FFF7ED', color: '#C2410C' }
                ]"
                class="text-[11px] font-black px-3 py-1.5 rounded-full"
                [style.backgroundColor]="b.bg"
                [style.color]="b.color"
              >
                {{ b.label }}
              </span>
            </div>

            <!-- Payment methods -->
            <p class="text-[11px] text-[#9CA3AF] uppercase tracking-wider font-bold mb-3 m-0 leading-none">Accepted Payments</p>
            <div class="grid grid-cols-2 gap-2.5">
              <div
                *ngFor="let m of [
                  { emoji: '📱', label: 'UPI', sub: 'GPay · PhonePe · Paytm · BHIM' },
                  { emoji: '💳', label: 'Cards', sub: 'Visa · Mastercard · RuPay · Amex' },
                  { emoji: '🏦', label: 'Net Banking', sub: 'All major Indian banks' },
                  { emoji: '💰', label: 'TYNG Wallet', sub: 'Instant · No extra charges' }
                ]"
                class="flex items-center gap-2.5 bg-[#F9FAFB] rounded-2xl px-3.5 py-3 border border-[#F3F4F6]"
              >
                <span class="text-xl leading-none">{{ m.emoji }}</span>
                <div class="min-w-0">
                  <p class="text-[12px] font-black text-[#111827] m-0">{{ m.label }}</p>
                  <p class="text-[9px] text-[#9CA3AF] truncate mt-0.5 m-0 font-bold">{{ m.sub }}</p>
                </div>
              </div>
            </div>

            <!-- EMI note -->
            <div class="mt-3 flex items-center gap-2 bg-[#FFF7ED] rounded-xl px-3.5 py-2.5 border border-[#FFE2C2]">
              <span class="text-base leading-none">💳</span>
              <p class="text-[11px] font-bold text-[#C2410C] m-0">
                EMI available on orders above ₹1,000 · No-cost EMI on select cards
              </p>
            </div>

            <p class="text-[10px] text-[#C4C9D4] text-center mt-4 m-0 font-bold">
              Powered by Razorpay · All transactions are 256-bit encrypted
            </p>
          </div>

        </div>

        <!-- Sticky checkout pay CTA -->
        <div
          class="fixed bottom-0 left-0 right-0 z-30 bg-white max-w-md mx-auto px-5 pt-4 pb-8 border-t border-[#F3F4F6]"
          style="box-shadow: 0 -4px 28px rgba(0,0,0,0.09);"
        >
          <div class="flex items-center justify-between mb-3 leading-none text-left">
            <div>
              <p class="text-[11px] text-[#9CA3AF] m-0 font-bold">Total Amount</p>
              <p class="text-[22px] font-black text-[#111827] m-0 mt-1">₹{{ grandTotal.toLocaleString() }}</p>
            </div>
            <button
              (click)="proceedToPayment()"
              class="h-14 px-8 rounded-2xl text-[16px] font-black text-white flex items-center gap-2 border-none outline-none active:scale-98 transition-all"
              style="background: linear-gradient(135deg,#FF7A00 0%,#FF9A40 100%); box-shadow: 0 4px 20px rgba(255,122,0,0.42);"
            >
              <ion-icon name="lock-closed-outline" class="text-sm font-bold"></ion-icon>
              <span>Proceed to Payment</span>
            </button>
          </div>
          <div class="flex items-center justify-center gap-3 leading-none">
            <div class="flex items-center gap-1">
              <ion-icon name="shield-checkmark-outline" class="text-[#8CF000] text-[11px] font-black"></ion-icon>
              <span class="text-[10px] text-[#9CA3AF] font-bold">Secure checkout</span>
            </div>
            <div class="w-1 h-1 rounded-full bg-[#E5E7EB]"></div>
            <div class="flex items-center gap-1">
              <ion-icon name="checkmark-outline" class="text-[#8CF000] text-[11px] font-black"></ion-icon>
              <span class="text-[10px] text-[#9CA3AF] font-bold">Free cancellation 24hrs before</span>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  `,
})
export class VenueBookingSummaryPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  venueId: number | null = null;
  venue: VenueDetail | null = null;

  selectedDate = 'Today, Jun 29';
  selectedSlots: string[] = ['6:00 PM', '7:00 PM'];
  rentalQty: Record<string, number> = {};

  showRental = true;
  showPolicy = false;

  couponInput = '';
  appliedCoupon: (Coupon & { code: string }) | null = null;
  couponError = '';

  readonly platformFee = 49;
  readonly taxRate = 0.18;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.venueId = +idStr;

        const nav = this.router.getCurrentNavigation();
        if (nav?.extras.state) {
          this.venue = nav.extras.state['venue'] as VenueDetail;
          this.selectedDate = nav.extras.state['selectedDate'] as string;
          this.selectedSlots = nav.extras.state['selectedSlots'] as string[];
          this.rentalQty = (nav.extras.state['rentalItems'] || {}) as Record<string, number>;
        }

        if (!this.venue) {
          this.venue = VENUE_DATA.find(v => v.id === this.venueId) || VENUE_DATA[0];
        }
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
    return Object.values(this.rentalQty).filter(q => q > 0).length;
  }

  get courtCost(): number {
    if (!this.venue) return 0;
    return this.hours * this.venue.pricePerHour;
  }

  get rentalCost(): number {
    if (!this.venue) return 0;
    return this.venue.rentalEquipment.reduce(
      (sum, item) => sum + (this.rentalQty[item.id] || 0) * item.price, 0
    );
  }

  get subTotal(): number {
    return this.courtCost + this.rentalCost;
  }

  get tax(): number {
    return Math.round(this.subTotal * this.taxRate);
  }

  get couponDiscount(): number {
    if (!this.appliedCoupon) return 0;
    if (this.appliedCoupon.type === 'percent') {
      return Math.round((this.courtCost * this.appliedCoupon.discount) / 100);
    } else {
      return this.appliedCoupon.discount;
    }
  }

  get grandTotal(): number {
    return this.subTotal + this.tax + this.platformFee - this.couponDiscount;
  }

  applyCoupon() {
    const code = this.couponInput.trim().toUpperCase();
    if (COUPONS[code]) {
      this.appliedCoupon = { ...COUPONS[code], code };
      this.couponError = '';
      this.couponInput = '';
    } else {
      this.couponError = 'Invalid coupon code. Try TYNG20 or FIRST100';
    }
  }

  back() {
    this.router.navigate([`/app/venue/${this.venueId}/book`], {
      state: {
        venue: this.venue,
        rentalItems: this.rentalQty
      }
    });
  }

  proceedToPayment() {
    alert('Payment Successful! Court booking confirmed.');
    this.router.navigateByUrl('/app/home');
  }
}
