import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Subscription, firstValueFrom } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { RealtimeService } from '../../../core/services/realtime.service';
import { VenueEarningsData, VenueService } from '../../../core/services/venue.service';
import { PageSkeletonComponent } from '../../../shared/components/skeleton';

type PeriodKey = 'today' | 'week' | 'month' | 'year';

@Component({
  selector: 'app-venue-earnings-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, PageSkeletonComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <div class="earnings-page text-left">
        <div class="sticky-header">
          <div class="header-row">
            <button type="button" class="icon-btn" (click)="goBack()" aria-label="Back">
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
            <div class="header-title">
              <h1>Earnings & Payouts</h1>
              <span class="live-badge" *ngIf="liveConnected()">
                <span class="live-dot"></span>
                Live
              </span>
            </div>
            <button type="button" class="icon-btn" (click)="reload()" aria-label="Refresh">
              <ion-icon name="refresh-outline"></ion-icon>
            </button>
          </div>

          <div class="period-row">
            <button
              type="button"
              class="period-chip"
              *ngFor="let p of periods"
              [class.active]="selectedPeriod() === p.key"
              (click)="selectPeriod(p.key)"
            >
              {{ p.label }}
            </button>
          </div>
        </div>

        <div class="px-5 pt-2" *ngIf="loading() && !data()">
          <app-page-skeleton variant="wallet" label="Loading earnings"></app-page-skeleton>
        </div>

        <div class="px-5 pt-4 space-y-5" *ngIf="!loading() && errorMessage() && !data()">
          <div class="state-card">
            <p>{{ errorMessage() }}</p>
            <button type="button" (click)="reload()">Retry</button>
          </div>
        </div>

        <div class="px-5 pt-4 space-y-5" *ngIf="data()">
          <!-- Summary hero -->
          <div
            class="rounded-[24px] p-6 relative overflow-hidden text-left"
            style="background: linear-gradient(135deg, #111827 0%, #1F2937 100%); box-shadow: 0 6px 28px rgba(0,0,0,0.20);"
          >
            <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[var(--app-primary)]/10"></div>
            <div class="relative">
              <p class="text-[11px] font-black text-[var(--app-primary)] uppercase tracking-widest mb-1 m-0">
                {{ data()!.periodLabel }} Earnings
              </p>
              <div class="flex items-baseline gap-1.5 mb-1">
                <span class="text-[16px] font-bold text-white/50">₹</span>
                <p class="text-[38px] font-black text-white leading-none m-0">
                  {{ formatInr(mainEarnings()) }}
                </p>
              </div>
              <p class="text-[12px] text-white/40 mb-5 m-0">
                {{ changeLabel() }} compared to previous period
              </p>

              <div class="grid grid-cols-2 gap-3">
                <div *ngFor="let item of summaryStats()" class="bg-white/10 rounded-2xl p-3 text-left">
                  <span class="text-lg">{{ item.emoji }}</span>
                  <p class="text-[16px] font-black text-white mt-0.5 mb-0">₹{{ formatInr(item.value) }}</p>
                  <div class="flex items-center justify-between mt-1">
                    <p class="text-[10px] text-white/40 m-0 leading-none">{{ item.label }}</p>
                    <span class="text-[9px] font-black" [style.color]="item.color">{{ item.pct }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Revenue by facility -->
          <div class="card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0 mb-4">Revenue by Facility</p>
            <div class="space-y-4" *ngIf="data()!.facilities.length; else noFacilities">
              <div *ngFor="let f of data()!.facilities" class="space-y-1.5">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2.5">
                    <div class="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-base">
                      {{ f.emoji }}
                    </div>
                    <div>
                      <p class="text-[13px] font-bold text-[#111827] m-0 leading-none mb-1">{{ f.name }}</p>
                      <p class="text-[10px] text-[#9CA3AF] m-0 leading-none font-bold">
                        {{ f.bookings }} bookings ·
                        <span [style.color]="f.occupancy >= 85 ? '#16A34A' : '#D97706'">{{ f.occupancy }}% occupancy</span>
                      </p>
                    </div>
                  </div>
                  <p class="text-[14px] font-black text-[#111827] m-0">₹{{ formatInr(f.revenue) }}</p>
                </div>
                <div class="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div
                    class="h-full rounded-full"
                    [style.backgroundColor]="f.color"
                    [style.width.%]="maxFacilityRevenue() ? (f.revenue / maxFacilityRevenue()) * 100 : 0"
                  ></div>
                </div>
              </div>
            </div>
            <ng-template #noFacilities>
              <p class="empty-note">No facility revenue in this period yet.</p>
            </ng-template>
          </div>

          <!-- Booking analytics -->
          <div class="card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0 mb-4">Booking Analytics</p>
            <div class="grid grid-cols-2 gap-3">
              <div
                *ngFor="let card of analyticsCards()"
                class="rounded-[18px] p-3.5 relative overflow-hidden"
                [style.backgroundColor]="card.color + '10'"
                [style.border]="'1.5px solid ' + card.color + '22'"
              >
                <div class="absolute -bottom-3 -right-3 w-10 h-10 rounded-full opacity-20" [style.backgroundColor]="card.color"></div>
                <div class="relative text-left">
                  <p class="text-[19px] font-black text-[#111827] m-0 leading-none mb-1">{{ card.value }}</p>
                  <p class="text-[9px] text-[#6B7280] font-black uppercase tracking-wider m-0">{{ card.label }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Trends -->
          <div class="card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0 mb-4">Booking Trends (7 days)</p>
            <p class="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-2 m-0">Revenue Trend (₹)</p>
            <div class="bg-[#F9FAFB] rounded-2xl p-4 mb-4">
              <svg width="100%" height="80" viewBox="0 0 280 80" preserveAspectRatio="none" style="overflow: visible;">
                <line x1="0" y1="20" x2="280" y2="20" stroke="#F3F4F6" stroke-width="1"></line>
                <line x1="0" y1="40" x2="280" y2="40" stroke="#F3F4F6" stroke-width="1"></line>
                <line x1="0" y1="60" x2="280" y2="60" stroke="#F3F4F6" stroke-width="1"></line>
                <path [attr.d]="areaPath()" fill="rgba(var(--app-primary-rgb),0.08)"></path>
                <polyline [attr.points]="linePoints()" fill="none" stroke="var(--app-primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
              </svg>
            </div>

            <p class="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-2 m-0">Bookings Per Day</p>
            <div class="bg-[#F9FAFB] rounded-2xl p-4">
              <div class="flex items-end justify-around gap-1 h-20">
                <div *ngFor="let val of barData(); let idx = index" class="flex flex-col items-center gap-1 flex-1">
                  <span class="text-[8px] font-black text-[#9CA3AF]">{{ val }}</span>
                  <div
                    class="w-full rounded-t-md"
                    [style.backgroundColor]="idx === barData().length - 1 ? 'var(--app-primary)' : '#E5E7EB'"
                    [style.height.px]="barHeight(val)"
                  ></div>
                  <span class="text-[8px] text-[#C4C9D4] font-bold">{{ barLabels()[idx] }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Breakdown -->
          <div class="card p-5 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Earnings Breakdown</p>
            <div class="space-y-0 mb-4">
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">Gross Booking Revenue</span>
                <span class="text-[13px] font-black text-[#111827]">₹{{ formatInr(data()!.breakdown.gross) }}</span>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">Platform Fee (5%)</span>
                <span class="text-[13px] font-black text-[#EF4444]">-₹{{ formatInr(data()!.breakdown.platformFee) }}</span>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">GST (18% on fee)</span>
                <span class="text-[13px] font-black text-[#EF4444]">-₹{{ formatInr(data()!.breakdown.gstOnFee) }}</span>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">Discounts Applied</span>
                <span class="text-[13px] font-black text-[#EF4444]">-₹{{ formatInr(data()!.breakdown.discounts) }}</span>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">Refunds</span>
                <span class="text-[13px] font-black text-[#EF4444]">-₹{{ formatInr(data()!.breakdown.refunds) }}</span>
              </div>
            </div>
            <div class="bg-[#111827] rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p class="text-[11px] text-white/50 uppercase tracking-wider m-0 leading-none mb-1">Net Earnings</p>
                <p class="text-[11px] text-white/30 m-0 leading-none font-bold">After all deductions</p>
              </div>
              <p class="text-[26px] font-black text-[var(--app-primary)] m-0">₹{{ formatInr(data()!.breakdown.net) }}</p>
            </div>
          </div>

          <!-- Payouts -->
          <div class="card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Payout Timeline</p>
            <div class="space-y-3">
              <div *ngFor="let p of data()!.payouts" class="bg-[#F9FAFB] rounded-[20px] p-4 text-left border border-[#F3F4F6]">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <p class="text-[14px] font-black text-[#111827] m-0 mb-1">{{ p.month }}</p>
                    <p class="text-[11px] text-[#9CA3AF] m-0 font-bold">{{ p.period }} · {{ p.date }}</p>
                  </div>
                  <span
                    class="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
                    [style.backgroundColor]="payoutStyle(p.status).bg"
                    [style.color]="payoutStyle(p.status).color"
                  >
                    {{ p.status }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-center">
                  <div class="bg-white rounded-xl py-2 shadow-sm border border-slate-50">
                    <p class="text-[13px] font-black text-[#111827] m-0">₹{{ formatInr(p.gross) }}</p>
                    <p class="text-[9px] text-[#9CA3AF] font-bold uppercase m-0 mt-0.5">Gross</p>
                  </div>
                  <div class="bg-white rounded-xl py-2 shadow-sm border border-slate-50">
                    <p class="text-[13px] font-black text-[#111827] m-0">₹{{ formatInr(p.fee) }}</p>
                    <p class="text-[9px] text-[#9CA3AF] font-bold uppercase m-0 mt-0.5">Fee</p>
                  </div>
                  <div class="bg-white rounded-xl py-2 shadow-sm border border-slate-50">
                    <p class="text-[13px] font-black text-[#111827] m-0">₹{{ formatInr(p.gst) }}</p>
                    <p class="text-[9px] text-[#9CA3AF] font-bold uppercase m-0 mt-0.5">GST</p>
                  </div>
                  <div class="bg-white rounded-xl py-2 shadow-sm border border-slate-50">
                    <p class="text-[13px] font-black text-[#16A34A] m-0">₹{{ formatInr(p.net) }}</p>
                    <p class="text-[9px] text-[#9CA3AF] font-bold uppercase m-0 mt-0.5">Net Credited</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Transactions -->
          <div class="card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Transaction History</p>
            <div class="flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-4 h-10 mb-4">
              <ion-icon name="search-outline" class="text-[#9CA3AF]"></ion-icon>
              <input
                [ngModel]="searchQ()"
                (ngModelChange)="searchQ.set($event)"
                placeholder="Search by name or facility…"
                class="flex-1 bg-transparent text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none min-h-0 border-none outline-none"
              />
            </div>
            <div class="space-y-2.5" *ngIf="filteredTransactions().length; else noTx">
              <div
                *ngFor="let t of filteredTransactions()"
                class="flex items-start gap-3 bg-[#F9FAFB] rounded-2xl px-4 py-3.5 border border-[#F3F4F6] text-left"
              >
                <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 text-xs font-mono font-black text-[#9CA3AF] shadow-sm">
                  {{ t.id.slice(-3) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[12px] font-black text-[#111827] truncate m-0 mb-1">{{ t.facility }}</p>
                  <p class="text-[10px] text-[#9CA3AF] font-bold m-0">{{ t.name }} · {{ t.date }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-[13px] font-black text-[#111827] m-0 mb-1">₹{{ formatInr(t.net) }}</p>
                  <span
                    class="text-[9px] font-black uppercase tracking-wider"
                    [style.color]="t.status === 'Completed' ? '#16A34A' : t.status === 'Pending' ? '#D97706' : '#DC2626'"
                  >
                    {{ t.status }}
                  </span>
                </div>
              </div>
            </div>
            <ng-template #noTx>
              <p class="empty-note">No transactions in this period.</p>
            </ng-template>
          </div>

          <!-- AI tips -->
          <div
            class="rounded-[24px] p-5 relative overflow-hidden text-left"
            style="background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-to) 100%); box-shadow: 0 4px 24px rgba(var(--app-primary-rgb),0.35);"
            *ngIf="data()!.aiTips.length"
          >
            <div class="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-8 translate-x-8"></div>
            <div class="relative">
              <div class="flex items-center gap-2 mb-3">
                <ion-icon name="flash-outline" class="text-[#111827] text-lg font-bold"></ion-icon>
                <p class="text-[14px] font-black text-[#111827] m-0 uppercase tracking-wider">AI Revenue Insights</p>
              </div>
              <div class="space-y-2">
                <div *ngFor="let tip of data()!.aiTips" class="flex items-start gap-2.5 bg-white/25 rounded-2xl px-3.5 py-2.5">
                  <span class="text-base flex-shrink-0 mt-0.5">{{ tip.emoji }}</span>
                  <p class="text-[12px] font-bold text-[#111827] leading-relaxed m-0">{{ tip.text }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="action-footer" *ngIf="data()">
        <div class="flex gap-3 max-w-md mx-auto">
          <button type="button" class="flex-1 h-12 rounded-2xl text-[13px] font-black text-[#6B7280] bg-[#F3F4F6] border-none flex items-center justify-center gap-1.5">
            <ion-icon name="download-outline" class="text-base"></ion-icon>Monthly Report
          </button>
          <button
            type="button"
            class="flex-1 h-12 rounded-2xl text-[13px] font-black text-white border-none flex items-center justify-center gap-1.5 shadow-md"
            style="background: linear-gradient(135deg, #FF7A00, #FF9A40);"
          >
            <ion-icon name="cash-outline" class="text-base"></ion-icon>Withdraw Funds
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100%;
      }

      ion-content {
        --background: #fafbfc;
      }

      ion-content::part(scroll) {
        scrollbar-width: none;
      }

      ion-content::part(scroll)::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }

      .earnings-page {
        background: #fafbfc;
        min-height: 100%;
        padding-bottom: calc(var(--app-tab-bar-height, 72px) + 88px + var(--safe-area-bottom));
      }

      .sticky-header {
        position: sticky;
        top: 0;
        z-index: 30;
        background: #fff;
        border-bottom: 1px solid #f3f4f6;
        padding: calc(8px + var(--app-chrome-top-inset, var(--safe-area-top))) 16px 12px;
      }

      .header-row {
        display: grid;
        grid-template-columns: 40px 1fr 40px;
        align-items: center;
        gap: 10px;
        min-height: 40px;
      }

      .icon-btn {
        width: 40px;
        height: 40px;
        border: none;
        border-radius: 12px;
        background: #f3f4f6;
        color: #111827;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
      }

      .icon-btn ion-icon {
        font-size: 18px;
      }

      .header-title {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        min-width: 0;
      }

      .header-title h1 {
        margin: 0;
        font-size: 16px;
        font-weight: 900;
        color: #111827;
        line-height: 1.2;
        letter-spacing: -0.01em;
      }

      .live-badge {
        display: inline-flex;
        align-items: center;
        gap: 5px;
        font-size: 10px;
        font-weight: 800;
        color: #16a34a;
        letter-spacing: 0.02em;
        line-height: 1;
      }

      .live-dot {
        width: 6px;
        height: 6px;
        border-radius: 999px;
        background: #22c55e;
        box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
      }

      .period-row {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
        margin-top: 12px;
      }

      .period-chip {
        height: 36px;
        border: none;
        border-radius: 999px;
        background: #f3f4f6;
        color: #6b7280;
        font-size: 11px;
        font-weight: 800;
        padding: 0 6px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .period-chip.active {
        background: var(--app-primary);
        color: #111827;
        box-shadow: 0 2px 10px rgba(var(--app-primary-rgb), 0.28);
      }

      .card {
        background: white;
        border-radius: 24px;
        border: 1px solid #f3f4f6;
        box-shadow: 0 2px 16px rgba(0, 0, 0, 0.05);
      }

      .action-footer {
        position: fixed;
        left: 0;
        right: 0;
        bottom: calc(var(--app-tab-bar-height, 72px) + 12px + var(--safe-area-bottom));
        z-index: 25;
        background: #fff;
        padding: 12px 20px;
        border-top: 1px solid #f3f4f6;
        box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.09);
      }

      .state-card,
      .empty-note {
        background: #fff;
        border: 1px solid #f3f4f6;
        border-radius: 20px;
        padding: 20px;
        text-align: center;
        color: #6b7280;
        font-size: 13px;
        font-weight: 700;
      }
      .state-card button {
        margin-top: 12px;
        border: none;
        border-radius: 12px;
        background: #111827;
        color: #fff;
        height: 40px;
        padding: 0 16px;
        font-weight: 800;
      }
    `,
  ],
})
export class VenueEarningsPage implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly venueService = inject(VenueService);
  private readonly realtime = inject(RealtimeService);

  readonly periods: { key: PeriodKey; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Week' },
    { key: 'month', label: 'Month' },
    { key: 'year', label: 'Year' },
  ];

  selectedPeriod = signal<PeriodKey>('month');
  loading = signal(true);
  errorMessage = signal('');
  data = signal<VenueEarningsData | null>(null);
  liveConnected = signal(false);
  searchQ = signal('');

  private realtimeSub: Subscription | null = null;
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  readonly mainEarnings = computed(() => this.data()?.summary.gross ?? 0);

  readonly maxFacilityRevenue = computed(() => {
    const list = this.data()?.facilities || [];
    return Math.max(0, ...list.map((f) => f.revenue));
  });

  readonly summaryStats = computed(() => {
    const d = this.data();
    if (!d) return [];
    return [
      { emoji: '💰', label: 'Today', value: d.summary.today, pct: this.selectedPeriod() === 'today' ? 'Active' : '', color: 'var(--app-primary)' },
      { emoji: '📅', label: 'This Week', value: d.summary.week, pct: this.selectedPeriod() === 'week' ? 'Active' : '', color: '#FF7A00' },
      { emoji: '📊', label: 'This Month', value: d.summary.month, pct: `${d.summary.changePct >= 0 ? '+' : ''}${d.summary.changePct}%`, color: '#38BDF8' },
      { emoji: '👛', label: 'Wallet Balance', value: d.summary.walletBalance, pct: 'Ready', color: '#22C55E' },
    ];
  });

  readonly analyticsCards = computed(() => {
    const a = this.data()?.analytics;
    if (!a) return [];
    return [
      { label: "Today's Bookings", value: String(a.todayBookings), color: 'var(--app-primary)' },
      { label: 'Weekly Bookings', value: String(a.weekBookings), color: '#FF7A00' },
      { label: 'Monthly Bookings', value: String(a.monthBookings), color: '#38BDF8' },
      { label: 'Yearly Bookings', value: String(a.yearBookings), color: '#22C55E' },
    ];
  });

  readonly filteredTransactions = computed(() => {
    const items = this.data()?.transactions || [];
    const q = this.searchQ().trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (t) => t.facility.toLowerCase().includes(q) || t.name.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    if (this.auth.user()?.role !== 'venue') {
      void this.router.navigateByUrl('/app/home');
      return;
    }
    void this.reload();
    void this.bindRealtime();
  }

  ngOnDestroy(): void {
    this.realtimeSub?.unsubscribe();
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  }

  selectPeriod(period: PeriodKey): void {
    if (this.selectedPeriod() === period) return;
    this.selectedPeriod.set(period);
    void this.reload();
  }

  async reload(silent = false): Promise<void> {
    if (!silent) this.loading.set(true);
    this.errorMessage.set('');
    try {
      const res = await firstValueFrom(this.venueService.getEarnings(this.selectedPeriod()));
      if (!res.success || !res.data) {
        this.errorMessage.set(res.message || 'Could not load earnings');
        this.data.set(null);
        return;
      }
      this.data.set(res.data);
    } catch {
      this.errorMessage.set('Could not load earnings');
    } finally {
      this.loading.set(false);
    }
  }

  formatInr(value: number): string {
    return Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }

  changeLabel(): string {
    const pct = this.data()?.summary.changePct ?? 0;
    return `${pct >= 0 ? '+' : ''}${pct}%`;
  }

  payoutStyle(status: string): { bg: string; color: string } {
    if (status === 'Completed') return { bg: '#F0FDF4', color: '#16A34A' };
    if (status === 'Processing') return { bg: '#EFF6FF', color: '#1D4ED8' };
    return { bg: '#F3F4F6', color: '#6B7280' };
  }

  barData(): number[] {
    return this.data()?.trends.bookings || [0, 0, 0, 0, 0, 0, 0];
  }

  barLabels(): string[] {
    return this.data()?.trends.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  }

  barHeight(val: number): number {
    const max = Math.max(...this.barData(), 1);
    return Math.max(4, (val / max) * 50);
  }

  linePoints(): string {
    return this.linePointsArray()
      .map((p) => `${p.x},${p.y}`)
      .join(' ');
  }

  areaPath(): string {
    const points = this.linePointsArray();
    if (!points.length) return '';
    return `M 0,80 L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L 280,80 Z`;
  }

  private linePointsArray(): { x: number; y: number }[] {
    const ld = this.data()?.trends.revenue || [];
    if (!ld.length) return [];
    const max = Math.max(...ld, 1);
    const min = Math.min(...ld, 0);
    const range = max - min || 1;
    return ld.map((val, idx) => {
      const x = ld.length === 1 ? 140 : (idx / (ld.length - 1)) * 280;
      const y = 80 - (((val - min) / range) * 60 + 10);
      return { x, y };
    });
  }

  private async bindRealtime(): Promise<void> {
    try {
      await this.realtime.connect();
      this.liveConnected.set(true);
      const venueId = String(this.auth.user()?.id || '');
      this.realtimeSub = this.realtime.nearbyGames$.subscribe((event) => {
        const gameVenueId = String(event.game?.venueId || event.game?.venue?.id || '');
        if (!venueId || !gameVenueId || gameVenueId !== venueId) return;
        this.scheduleRefresh();
      });
    } catch {
      this.liveConnected.set(false);
    }
  }

  private scheduleRefresh(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => {
      void this.reload(true);
    }, 350);
  }

  goBack(): void {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }
}
