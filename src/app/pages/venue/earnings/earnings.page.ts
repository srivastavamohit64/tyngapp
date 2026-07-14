import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface PayoutItem {
  id: string;
  month: string;
  period: string;
  gross: number;
  fee: number;
  gst: number;
  net: number;
  status: string;
  date: string;
}

interface TransactionItem {
  id: string;
  facility: string;
  name: string;
  date: string;
  amount: number;
  fee: number;
  gst: number;
  net: number;
  status: string;
}

@Component({
  selector: 'app-venue-earnings-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="earnings-page pb-36 text-left">
        <!-- Header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button (click)="goBack()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <p class="text-[17px] font-black text-[#111827] m-0">Earnings & Payouts</p>
            <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="calendar-outline" class="text-lg text-[#111827]"></ion-icon>
            </button>
          </div>

          <!-- Period Chips -->
          <div class="flex gap-2 px-5 pb-4 overflow-x-auto no-scrollbar">
            <button *ngFor="let p of periods" (click)="selectedPeriod.set(p)"
              class="flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-black transition-all border-none"
              [style.backgroundColor]="selectedPeriod() === p ? '#8CF000' : '#F3F4F6'"
              [style.color]="selectedPeriod() === p ? '#111827' : '#6B7280'"
              [style.boxShadow]="selectedPeriod() === p ? '0 2px 8px rgba(140,240,0,0.30)' : 'none'">
              {{ p }}
            </button>
            <button class="flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-black bg-[#F3F4F6] text-[#6B7280] border-none">
              Custom ▸
            </button>
          </div>
        </div>

        <div class="px-5 pt-4 space-y-5">
          <!-- Earnings Summary Hero Card -->
          <div class="rounded-[24px] p-6 relative overflow-hidden text-left"
            style="background: linear-gradient(135deg, #111827 0%, #1F2937 100%); box-shadow: 0 6px 28px rgba(0,0,0,0.20);">
            <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#8CF000]/10"></div>
            <div class="relative">
              <p class="text-[11px] font-black text-[#8CF000] uppercase tracking-widest mb-1">{{ selectedPeriod() }} Earnings</p>
              <div class="flex items-baseline gap-1.5 mb-1">
                <span class="text-[16px] font-bold text-white/50">₹</span>
                <p class="text-[38px] font-black text-white leading-none m-0">
                  {{ getMainEarnings().toLocaleString('en-IN') }}
                </p>
              </div>
              <p class="text-[12px] text-white/40 mb-5 m-0">+22% compared to previous period</p>

              <div class="grid grid-cols-2 gap-3">
                <div *ngFor="let item of summaryStats" class="bg-white/10 rounded-2xl p-3 text-left">
                  <span class="text-lg">{{ item.emoji }}</span>
                  <p class="text-[16px] font-black text-white mt-0.5 mb-0">₹{{ item.value.toLocaleString('en-IN') }}</p>
                  <div class="flex items-center justify-between mt-1">
                    <p class="text-[10px] text-white/40 m-0 leading-none">{{ item.label }}</p>
                    <span class="text-[9px] font-black" [style.color]="item.color">{{ item.pct }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Revenue by Facility -->
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0">Revenue by Facility</p>
            </div>
            <div class="space-y-4">
              <div *ngFor="let f of facilities" class="space-y-1.5">
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
                  <p class="text-[14px] font-black text-[#111827] m-0">₹{{ f.revenue.toLocaleString('en-IN') }}</p>
                </div>
                <div class="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                  <div class="h-full rounded-full" [style.backgroundColor]="f.color" [style.width.%]="(f.revenue / maxFacilityRevenue) * 100"></div>
                </div>
              </div>
            </div>
          </div>

          <!-- Booking Analytics -->
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0">Booking Analytics</p>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let card of analyticsCards" class="rounded-[18px] p-3.5 relative overflow-hidden"
                [style.backgroundColor]="card.color + '10'" [style.border]="'1.5px solid ' + card.color + '22'">
                <div class="absolute -bottom-3 -right-3 w-10 h-10 rounded-full opacity-20" [style.backgroundColor]="card.color"></div>
                <div class="relative text-left">
                  <p class="text-[19px] font-black text-[#111827] m-0 leading-none mb-1">{{ card.value }}</p>
                  <p class="text-[9px] text-[#6B7280] font-black uppercase tracking-wider m-0 mb-3">{{ card.label }}</p>
                  <div class="flex items-center justify-between">
                    <span class="text-[9px] font-black text-[#16A34A]">{{ card.change }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Booking Trends -->
          <div class="card p-5">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0">Booking Trends</p>
              <div class="flex bg-[#F3F4F6] p-0.5 rounded-xl border-none">
                <button *ngFor="let tab of chartTabs" (click)="selectedChartTab.set(tab)"
                  class="px-3 py-1.5 rounded-xl text-[11px] font-black transition-all border-none"
                  [style.backgroundColor]="selectedChartTab() === tab ? 'white' : 'transparent'"
                  [style.color]="selectedChartTab() === tab ? '#111827' : '#9CA3AF'"
                  [style.boxShadow]="selectedChartTab() === tab ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'">
                  {{ tab }}
                </button>
              </div>
            </div>

            <p class="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-2">Revenue Trend (₹)</p>
            <div class="bg-[#F9FAFB] rounded-2xl p-4 mb-4">
              <svg width="100%" height="80" viewBox="0 0 280 80" preserveAspectRatio="none" style="overflow: visible;">
                <line x1="0" y1="20" x2="280" y2="20" stroke="#F3F4F6" stroke-width="1"></line>
                <line x1="0" y1="40" x2="280" y2="40" stroke="#F3F4F6" stroke-width="1"></line>
                <line x1="0" y1="60" x2="280" y2="60" stroke="#F3F4F6" stroke-width="1"></line>
                <path [attr.d]="getAreaPath()" fill="rgba(140,240,0,0.08)"></path>
                <polyline [attr.points]="getLinePoints()" fill="none" stroke="#8CF000" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"></polyline>
              </svg>
            </div>

            <p class="text-[11px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-2">Bookings Per Day</p>
            <div class="bg-[#F9FAFB] rounded-2xl p-4">
              <div class="flex items-end justify-around gap-1 h-20">
                <div *ngFor="let val of getBarData(); let idx = index" class="flex flex-col items-center gap-1 flex-1">
                  <span class="text-[8px] font-black text-[#9CA3AF]">{{ val }}</span>
                  <div class="w-full rounded-t-md" [style.backgroundColor]="idx === 6 ? '#8CF000' : '#E5E7EB'"
                    [style.height.px]="(val / 22) * 50"></div>
                  <span class="text-[8px] text-[#C4C9D4] font-bold">{{ getBarLabels()[idx] }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Earnings Breakdown -->
          <div class="card p-5 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Earnings Breakdown</p>
            <div class="space-y-0 mb-4">
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">Gross Booking Revenue</span>
                <span class="text-[13px] font-black text-[#111827]">₹1,82,000</span>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">Platform Fee (5%)</span>
                <span class="text-[13px] font-black text-[#EF4444]">-₹9,100</span>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">GST (18% on fee)</span>
                <span class="text-[13px] font-black text-[#EF4444]">-₹1,638</span>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">Discounts Applied</span>
                <span class="text-[13px] font-black text-[#EF4444]">-₹5,460</span>
              </div>
              <div class="flex items-center justify-between py-3 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280] font-bold">Refunds</span>
                <span class="text-[13px] font-black text-[#EF4444]">-₹2,000</span>
              </div>
            </div>
            <div class="bg-[#111827] rounded-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p class="text-[11px] text-white/50 uppercase tracking-wider m-0 leading-none mb-1">Net Earnings</p>
                <p class="text-[11px] text-white/30 m-0 leading-none font-bold">After all deductions</p>
              </div>
              <p class="text-[26px] font-black text-[#8CF000] m-0">₹1,63,802</p>
            </div>
          </div>

          <!-- Payout Timeline -->
          <div class="card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Payout Timeline</p>
            <div class="space-y-3">
              <div *ngFor="let p of payouts" class="bg-[#F9FAFB] rounded-[20px] p-4 text-left border border-[#F3F4F6]">
                <div class="flex items-start justify-between mb-3">
                  <div>
                    <p class="text-[14px] font-black text-[#111827] m-0 mb-1">{{ p.month }}</p>
                    <p class="text-[11px] text-[#9CA3AF] m-0 font-bold">{{ p.period }} · {{ p.date }}</p>
                  </div>
                  <span class="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider"
                    [style.backgroundColor]="getPayoutStatusStyle(p.status).bg"
                    [style.color]="getPayoutStatusStyle(p.status).color">
                    {{ p.status }}
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-2 text-center">
                  <div class="bg-white rounded-xl py-2 shadow-sm border border-slate-50">
                    <p class="text-[13px] font-black text-[#111827] m-0">₹{{ p.gross.toLocaleString('en-IN') }}</p>
                    <p class="text-[9px] text-[#9CA3AF] font-bold uppercase m-0 mt-0.5">Gross</p>
                  </div>
                  <div class="bg-white rounded-xl py-2 shadow-sm border border-slate-50">
                    <p class="text-[13px] font-black text-[#111827] m-0">₹{{ p.fee.toLocaleString('en-IN') }}</p>
                    <p class="text-[9px] text-[#9CA3AF] font-bold uppercase m-0 mt-0.5">Fee</p>
                  </div>
                  <div class="bg-white rounded-xl py-2 shadow-sm border border-slate-50">
                    <p class="text-[13px] font-black text-[#111827] m-0">₹{{ p.gst.toLocaleString('en-IN') }}</p>
                    <p class="text-[9px] text-[#9CA3AF] font-bold uppercase m-0 mt-0.5">GST</p>
                  </div>
                  <div class="bg-white rounded-xl py-2 shadow-sm border border-slate-50">
                    <p class="text-[13px] font-black text-[#16A34A] m-0">₹{{ p.net.toLocaleString('en-IN') }}</p>
                    <p class="text-[9px] text-[#9CA3AF] font-bold uppercase m-0 mt-0.5">Net Credited</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Transaction History -->
          <div class="card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Transaction History</p>
            <div class="flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-4 h-10 mb-4">
              <ion-icon name="search-outline" class="text-[#9CA3AF]"></ion-icon>
              <input [(ngModel)]="searchQ" placeholder="Search by name or facility…"
                class="flex-1 bg-transparent text-[13px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none min-h-0 border-none outline-none" />
            </div>
            <div class="space-y-2.5">
              <div *ngFor="let t of getFilteredTransactions()" class="flex items-start gap-3 bg-[#F9FAFB] rounded-2xl px-4 py-3.5 border border-[#F3F4F6] text-left">
                <div class="w-9 h-9 rounded-xl bg-white flex items-center justify-center flex-shrink-0 text-xs font-mono font-black text-[#9CA3AF] shadow-sm">
                  {{ t.id.slice(-3) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[12px] font-black text-[#111827] truncate m-0 mb-1">{{ t.facility }}</p>
                  <p class="text-[10px] text-[#9CA3AF] font-bold m-0">{{ t.name }} · {{ t.date }}</p>
                </div>
                <div class="text-right flex-shrink-0">
                  <p class="text-[13px] font-black text-[#111827] m-0 mb-1">₹{{ t.net.toLocaleString('en-IN') }}</p>
                  <span class="text-[9px] font-black uppercase tracking-wider"
                    [style.color]="t.status === 'Completed' ? '#16A34A' : '#DC2626'">{{ t.status }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Linked Bank Account -->
          <div class="card p-5 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Linked Bank Account</p>
            <div class="bg-gradient-to-br from-[#111827] to-[#374151] rounded-2xl px-5 py-4 mb-4 relative overflow-hidden">
              <div class="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/5"></div>
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-[12px] text-white/50 mb-0.5 m-0">Primary Account</p>
                  <p class="text-[17px] font-black text-white m-0">HDFC Bank</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white/70 text-lg">
                  🏟️
                </div>
              </div>
              <p class="text-[18px] font-black text-white tracking-widest font-mono m-0">XXXX XXXX 4589</p>
              <div class="mt-3 flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-[#8CF000]"></div>
                <p class="text-[11px] text-white/50 m-0 font-bold">Verified & Active</p>
              </div>
            </div>
            <div class="flex gap-3">
              <button class="flex-grow h-10 rounded-xl text-[12px] font-black text-[#111827] bg-[#8CF000]/10 border border-[#8CF000]/40">
                Edit Details
              </button>
              <button class="flex-grow h-10 rounded-xl text-[12px] font-black text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB]">
                Change Account
              </button>
            </div>
          </div>

          <!-- AI Revenue Insights -->
          <div class="rounded-[24px] p-5 relative overflow-hidden text-left"
            style="background: linear-gradient(135deg, #8CF000 0%, #A3E635 100%); box-shadow: 0 4px 24px rgba(140,240,0,0.35);">
            <div class="absolute top-0 right-0 w-28 h-28 rounded-full bg-white/10 -translate-y-8 translate-x-8"></div>
            <div class="relative">
              <div class="flex items-center gap-2 mb-3">
                <ion-icon name="flash-outline" class="text-[#111827] text-lg font-bold"></ion-icon>
                <p class="text-[14px] font-black text-[#111827] m-0 uppercase tracking-wider">AI Revenue Insights</p>
                <span class="text-[9px] bg-[#111827]/15 text-[#111827] font-black px-2 py-0.5 rounded-full">AI</span>
              </div>
              <div class="space-y-2 mb-4">
                <div *ngFor="let tip of aiTips" class="flex items-start gap-2.5 bg-white/25 rounded-2xl px-3.5 py-2.5">
                  <span class="text-base flex-shrink-0 mt-0.5">{{ tip.emoji }}</span>
                  <p class="text-[12px] font-bold text-[#111827] leading-relaxed m-0">{{ tip.text }}</p>
                </div>
              </div>
              <button class="w-full h-11 rounded-2xl text-[13px] font-black text-white border-none shadow-md"
                style="background: linear-gradient(135deg, #FF7A00, #FF9A40);">
                View Recommendations →
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Sticky bottom bar -->
      <div class="fixed bottom-0 left-0 right-0 z-30 bg-white px-5 pt-3 pb-8"
        style="box-shadow: 0 -4px 24px rgba(0,0,0,0.09); border-top: 1px solid #F3F4F6;">
        <div class="flex gap-3 max-w-md mx-auto">
          <button class="flex-1 h-12 rounded-2xl text-[13px] font-black text-[#6B7280] bg-[#F3F4F6] border-none flex items-center justify-center gap-1.5">
            <ion-icon name="download-outline" class="text-base"></ion-icon>Monthly Report
          </button>
          <button class="flex-1 h-12 rounded-2xl text-[13px] font-black text-white border-none flex items-center justify-center gap-1.5 shadow-md"
            style="background: linear-gradient(135deg, #FF7A00, #FF9A40);">
            <ion-icon name="cash-outline" class="text-base"></ion-icon>Withdraw Funds
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .earnings-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .card {
      background: white;
      border-radius: 24px;
      border: 1px solid #F3F4F6;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05);
    }

    .no-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .no-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `]
})
export class VenueEarningsPage {
  private readonly router = inject(Router);

  readonly periods = ['Today', 'This Week', 'This Month', 'This Year'];
  readonly chartTabs = ['Week', 'Month', 'Year'];
  selectedPeriod = signal('This Month');
  selectedChartTab = signal('Week');
  searchQ = '';

  readonly summaryStats = [
    { emoji: '💰', label: 'Today', value: 12500, pct: '+18%', color: '#8CF000' },
    { emoji: '📅', label: 'This Week', value: 48000, pct: '+12%', color: '#FF7A00' },
    { emoji: '📊', label: 'This Month', value: 182000, pct: '+22%', color: '#38BDF8' },
    { emoji: '👛', label: 'Wallet Balance', value: 32500, pct: 'Ready', color: '#22C55E' },
  ];

  readonly facilities = [
    { id: 'f1', name: 'Football Turf A', emoji: '⚽', revenue: 152000, bookings: 132, occupancy: 92, color: '#8CF000' },
    { id: 'f2', name: 'Swimming Pool', emoji: '🏊', revenue: 112000, bookings: 58, occupancy: 85, color: '#38BDF8' },
    { id: 'f3', name: 'Basketball Court', emoji: '🏀', revenue: 86500, bookings: 74, occupancy: 78, color: '#FF7A00' },
    { id: 'f4', name: 'Badminton Court 1', emoji: '🏸', revenue: 72000, bookings: 96, occupancy: 88, color: '#7C3AED' },
    { id: 'f5', name: 'Cricket Nets', emoji: '🏏', revenue: 60000, bookings: 48, occupancy: 71, color: '#F59E0B' },
  ];

  readonly analyticsCards = [
    { label: "Today's Bookings", value: '8', change: '+3', color: '#8CF000' },
    { label: 'Weekly Bookings', value: '52', change: '+8', color: '#FF7A00' },
    { label: 'Monthly Bookings', value: '218', change: '+22%', color: '#38BDF8' },
    { label: 'Yearly Bookings', value: '2,648', change: '+18%', color: '#22C55E' },
  ];

  readonly payouts: PayoutItem[] = [
    { id: 'p1', month: 'May 2026', period: '1–31 May', gross: 65000, fee: 3250, gst: 585, net: 61165, status: 'Completed', date: '5 Jun 2026' },
    { id: 'p2', month: 'Jun 2026', period: '1–20 Jun', gross: 42600, fee: 2130, gst: 383, net: 40087, status: 'Processing', date: 'Est. 30 Jun' },
    { id: 'p3', month: 'Jul 2026', period: 'Upcoming', gross: 62800, fee: 3140, gst: 565, net: 59095, status: 'Scheduled', date: '5 Aug 2026' },
  ];

  readonly transactions: TransactionItem[] = [
    { id: 'TXN001', facility: 'Football Turf A', name: 'Aryan Mehta (Coach)', date: '29 Jun', amount: 3000, fee: 150, gst: 27, net: 2823, status: 'Completed' },
    { id: 'TXN002', facility: 'Basketball Court', name: 'Rahul Sharma', date: '29 Jun', amount: 1600, fee: 80, gst: 14, net: 1506, status: 'Completed' },
    { id: 'TXN003', facility: 'Swimming Pool', name: 'Deepika Sharma (Coach)', date: '28 Jun', amount: 2400, fee: 120, gst: 22, net: 2258, status: 'Completed' },
    { id: 'TXN004', facility: 'Badminton Court 1', name: 'Priya Verma', date: '28 Jun', amount: 800, fee: 40, gst: 7, net: 753, status: 'Completed' },
    { id: 'TXN005', facility: 'Cricket Nets', name: 'Vikram Singh', date: '27 Jun', amount: 1200, fee: 60, gst: 11, net: 1129, status: 'Refunded' },
  ];

  readonly aiTips = [
    { emoji: '⚽', text: 'Football Turf A generated 42% of your monthly revenue. Consider adding a second turf.' },
    { emoji: '🌙', text: 'Weekend evening slots are fully booked. Review and update your peak hour pricing.' },
    { emoji: '🏀', text: 'Basketball Court occupancy has dropped 8% this month. A discount offer may help.' },
    { emoji: '📈', text: 'Increasing weekday morning discounts could improve overall utilisation by ~15%.' },
  ];

  get maxFacilityRevenue(): number {
    return Math.max(...this.facilities.map(f => f.revenue));
  }

  getMainEarnings(): number {
    if (this.selectedPeriod() === 'Today') return 12500;
    if (this.selectedPeriod() === 'This Week') return 48000;
    if (this.selectedPeriod() === 'This Month') return 182000;
    return 482500;
  }

  getPayoutStatusStyle(status: string) {
    if (status === 'Completed') return { bg: '#F0FDF4', color: '#16A34A' };
    if (status === 'Processing') return { bg: '#EFF6FF', color: '#1D4ED8' };
    return { bg: '#F3F4F6', color: '#6B7280' };
  }

  getFilteredTransactions(): TransactionItem[] {
    if (!this.searchQ) return this.transactions;
    const q = this.searchQ.toLowerCase();
    return this.transactions.filter(t => 
      t.facility.toLowerCase().includes(q) || t.name.toLowerCase().includes(q)
    );
  }

  getAreaPath(): string {
    const points = this.getLinePointsArray();
    if (points.length === 0) return '';
    return `M 0,80 L ${points.map(p => `${p.x},${p.y}`).join(' L ')} L 280,80 Z`;
  }

  getLinePoints(): string {
    return this.getLinePointsArray().map(p => `${p.x},${p.y}`).join(' ');
  }

  private getLinePointsArray(): { x: number; y: number }[] {
    const tab = this.selectedChartTab();
    const ld = tab === 'Week' 
      ? [28000, 42000, 36000, 55000, 48000, 72000, 82000]
      : tab === 'Month'
      ? [110000, 95000, 128000, 115000, 142000, 160000, 182000]
      : [280000, 310000, 290000, 350000, 420000, 460000, 482500];
    
    const max = Math.max(...ld);
    const min = Math.min(...ld);
    const range = max - min || 1;
    const height = 60; // Max visual height within 80px SVG
    const padding = 10;
    
    return ld.map((val, idx) => {
      const x = (idx / (ld.length - 1)) * 280;
      const y = 80 - (((val - min) / range) * height + padding);
      return { x, y };
    });
  }

  getBarData(): number[] {
    const tab = this.selectedChartTab();
    return tab === 'Week' 
      ? [8, 12, 9, 15, 11, 18, 22]
      : tab === 'Month'
      ? [12, 10, 14, 13, 16, 18, 20]
      : [18, 20, 19, 22, 21, 23, 22];
  }

  getBarLabels(): string[] {
    const tab = this.selectedChartTab();
    return tab === 'Week' 
      ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
      : ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'];
  }

  goBack() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }
}
