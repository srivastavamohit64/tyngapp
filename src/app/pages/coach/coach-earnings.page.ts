import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface PeriodData {
  main: number;
  today: number;
  week: number;
}

const PERIOD_DATA: Record<string, PeriodData> = {
  'Today':      { main: 3850,   today: 3850,  week: 18250 },
  'This Week':  { main: 18250,  today: 3850,  week: 18250 },
  'This Month': { main: 74800,  today: 3850,  week: 18250 },
  'This Year':  { main: 284500, today: 3850,  week: 18250 },
};

const BREAKDOWNS = [
  { icon: 'trending-up-outline', label: 'Individual Coaching', amount: 22500, pct: 30, color: '#8CF000' },
  { icon: 'people-outline', label: 'Group Sessions', amount: 18400, pct: 25, color: '#FF7A00' },
  { icon: 'book-outline', label: 'Academy Sessions', amount: 33900, pct: 45, color: '#38BDF8' },
];

const PAYOUTS = [
  { amount: 8400, label: 'Scheduled for Tomorrow', status: 'Processing', date: '30 Jun 2025' },
  { amount: 12600, label: 'Scheduled for Friday', status: 'Pending', date: '4 Jul 2025' },
];

const VENUES = [
  {
    id: 1, name: 'Elite Cricket Academy', sport: 'Cricket', emoji: '🏏',
    image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=500&h=220&fit=crop&auto=format',
    type: 'Monthly Contract', monthly: 35000,
    schedule: 'Mon · Wed · Fri', time: '4:00 PM – 7:00 PM', status: 'Active',
  },
  {
    id: 2, name: 'Phoenix Sports Hub', sport: 'Badminton', emoji: '🏸',
    image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=500&h=220&fit=crop&auto=format',
    type: 'Per Session', monthly: 18000,
    schedule: 'Tue · Thu · Sat', time: '6:00 AM – 9:00 AM', status: 'Active',
  },
  {
    id: 3, name: 'K.D. Singh Stadium', sport: 'Football', emoji: '⚽',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=500&h=220&fit=crop&auto=format',
    type: 'Weekend Sessions', monthly: 8000,
    schedule: 'Sat · Sun', time: '5:00 PM – 8:00 PM', status: 'Review',
  },
];

const WITHDRAWALS = [
  { amount: 12000, date: '28 Jun 2025', bank: 'HDFC Bank', status: 'Completed', ref: 'TXN8821' },
  { amount: 8000, date: '25 Jun 2025', bank: 'HDFC Bank', status: 'Completed', ref: 'TXN8654' },
  { amount: 15000, date: '20 Jun 2025', bank: 'HDFC Bank', status: 'Completed', ref: 'TXN8412' },
];

const TRANSACTIONS = [
  { label: 'Individual Cricket Session', amount: 800, time: 'Today, 6:00 PM', type: 'credit' },
  { label: 'Group Football Training', amount: 2400, time: 'Yesterday, 7:30 PM', type: 'credit' },
  { label: 'Academy Coaching', amount: 5000, time: 'Monday, 4:00 PM', type: 'credit' },
  { label: 'Group Badminton Session', amount: 1200, time: 'Monday, 8:00 AM', type: 'credit' },
  { label: 'Individual Tennis Coaching', amount: 900, time: 'Last Week', type: 'credit' },
];

@Component({
  selector: 'app-coach-earnings',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="earnings-page pb-32">
        <!-- Header -->
        <div class="sticky-header flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
          <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
          <p class="text-[17px] font-black text-[#111827] m-0">Earnings</p>
          <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="calendar-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
        </div>

        <!-- Period chips -->
        <div class="flex gap-2 px-5 py-3 bg-white border-b border-[#F3F4F6] overflow-x-auto no-scrollbar">
          <button *ngFor="let p of periods" (click)="selectedPeriod.set(p)" class="flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-bold border-none transition-all"
            [style.backgroundColor]="selectedPeriod() === p ? '#8CF000' : '#F3F4F6'"
            [style.color]="selectedPeriod() === p ? '#111827' : '#6B7280'">
            {{ p }}
          </button>
        </div>

        <div class="px-5 pt-4 space-y-4">
          <!-- Summary Hero Card -->
          <div class="summary-hero-card p-6 relative overflow-hidden bg-gradient-to-br from-[#111827] to-[#1F2937] text-white">
            <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#8CF000]/10"></div>
            <div class="absolute -bottom-6 left-10 w-28 h-28 rounded-full bg-[#FF7A00]/10"></div>

            <div class="relative text-left">
              <p class="text-[12px] font-black text-[#8CF000] uppercase tracking-widest mb-1 m-0">{{ selectedPeriod() }}'s Earnings</p>
              <div class="flex items-baseline gap-2 mb-1">
                <span class="text-[16px] font-bold text-white/50">₹</span>
                <p class="text-[42px] font-black text-white leading-none m-0">
                  {{ getCurrentData().main.toLocaleString('en-IN') }}
                </p>
              </div>
              <p class="text-[12px] text-white/40 mb-5 m-0">+22% compared to last period</p>

              <!-- 3 Stat tiles -->
              <div class="grid grid-cols-3 gap-3">
                <div *ngFor="let s of [{ emoji:'💰', label:'Today', value: getCurrentData().today }, { emoji:'📅', label:'This Week', value: getCurrentData().week }, { emoji:'👛', label:'Wallet', value: 12500 }]"
                  class="bg-white/10 rounded-2xl px-3 py-3 text-center">
                  <span class="text-lg">{{ s.emoji }}</span>
                  <p class="text-[14px] font-black text-white mt-1 m-0">₹{{ s.value.toLocaleString('en-IN') }}</p>
                  <p class="text-[9px] text-white/40 mt-0.5 m-0 font-medium">{{ s.label }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Wallet card -->
          <div class="section-card p-5 bg-white text-left">
            <div class="flex items-center gap-2 mb-4">
              <div class="w-9 h-9 rounded-xl bg-[#8CF000]/15 flex items-center justify-center">
                <ion-icon name="wallet-outline" class="text-[#8CF000] text-lg"></ion-icon>
              </div>
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-0 m-0">TYNG Wallet</p>
            </div>

            <div class="bg-[#F9FAFB] rounded-2xl px-5 py-4 mb-4 text-center border border-slate-50">
              <p class="text-[12px] text-[#9CA3AF] font-bold mb-1 m-0">Available Balance</p>
              <p class="text-[36px] font-black text-[#111827] m-0">₹12,500</p>
              <div class="flex items-center justify-center gap-1.5 mt-1">
                <div class="w-2 h-2 rounded-full bg-[#8CF000]"></div>
                <p class="text-[11px] text-[#22C55E] font-bold m-0">Ready to withdraw</p>
              </div>
            </div>

            <div class="flex gap-3">
              <button (click)="openWithdrawModal()" class="flex-1 h-12 rounded-2xl text-[14px] font-black text-[#111827] flex items-center justify-center gap-2 btn-orange-gradient border-none">
                <ion-icon name="arrow-down-circle-outline" class="text-base"></ion-icon>Withdraw
              </button>
              <button class="flex-1 h-12 rounded-2xl text-[14px] font-bold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB]">
                Manage Account
              </button>
            </div>
          </div>

          <!-- Breakdown list -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Earnings Breakdown</p>
            <div class="space-y-4">
              <div *ngFor="let b of breakdowns">
                <div class="flex items-center gap-3 mb-2">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" [style.backgroundColor]="b.color + '15'">
                    <ion-icon [name]="b.icon" [style.color]="b.color" class="text-base"></ion-icon>
                  </div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-[13px] font-bold text-[#111827]">{{ b.label }}</span>
                      <span class="text-[14px] font-black text-[#111827]">₹{{ b.amount.toLocaleString('en-IN') }}</span>
                    </div>
                    <div class="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                      <div class="h-full rounded-full" [style.backgroundColor]="b.color" [style.width]="b.pct + '%'"></div>
                    </div>
                  </div>
                  <span class="text-[11px] font-black ml-2 flex-shrink-0" [style.color]="b.color">{{ b.pct }}%</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Upcoming payouts -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Upcoming Payouts</p>
            <div class="space-y-3">
              <div *ngFor="let p of payouts" class="flex items-center gap-4 bg-[#F9FAFB] rounded-2xl px-4 py-3.5 border border-slate-100">
                <div class="w-10 h-10 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm border border-slate-50">
                  <ion-icon name="time-outline" class="text-[#6B7280] text-lg"></ion-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[16px] font-black text-[#111827] m-0">₹{{ p.amount.toLocaleString('en-IN') }}</p>
                  <p class="text-[12px] text-[#9CA3AF] m-0 font-medium">{{ p.label }} · {{ p.date }}</p>
                </div>
                <span class="text-[11px] font-bold px-2.5 py-1 rounded-full flex-shrink-0"
                  [style.backgroundColor]="getStatusStyle(p.status).bg"
                  [style.color]="getStatusStyle(p.status).color">
                  {{ p.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Venue collaborations list -->
          <div class="text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 px-1 m-0">Venue Collaborations</p>
            <div class="space-y-4">
              <div *ngFor="let v of venues" class="section-card bg-white overflow-hidden shadow-sm border border-slate-100">
                <!-- Cover -->
                <div class="relative h-[130px] overflow-hidden bg-gray-200">
                  <img [src]="v.image" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <!-- Status -->
                  <span class="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
                    [style.backgroundColor]="getStatusStyle(v.status).bg"
                    [style.color]="getStatusStyle(v.status).color">
                    {{ v.status }}
                  </span>
                  <!-- Name overlay -->
                  <div class="absolute bottom-3 left-3">
                    <div class="flex items-center gap-2">
                      <span class="text-xl leading-none">{{ v.emoji }}</span>
                      <p class="text-white font-black text-[15px] m-0 drop-shadow-md leading-none">{{ v.name }}</p>
                    </div>
                    <p class="text-white/70 text-[11px] m-0 mt-1 font-medium">{{ v.sport }} · {{ v.type }}</p>
                  </div>
                </div>

                <!-- Body details -->
                <div class="px-4 py-3.5">
                  <div class="flex items-center justify-between mb-3">
                    <div>
                      <p class="text-[11px] text-[#9CA3AF] font-bold m-0">Monthly Earnings</p>
                      <p class="text-[22px] font-black text-[#111827] m-0">₹{{ v.monthly.toLocaleString('en-IN') }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-[11px] text-[#9CA3AF] m-0 font-bold">{{ v.schedule }}</p>
                      <p class="text-[12px] font-black text-[#111827] m-0 mt-0.5">{{ v.time }}</p>
                    </div>
                  </div>
                  <button (click)="go('/app/coach/venue-collab/' + v.id)" class="w-full h-10 rounded-2xl text-[13px] font-bold text-[#111827] flex items-center justify-center gap-1 border-none bg-[#8CF000]/12 border-[#8CF000]/35 border-2">
                    View Details<ion-icon name="chevron-forward-outline"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Withdrawal history log timelines -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Withdrawal History</p>
            <div class="relative pl-6">
              <div class="absolute left-2 top-2 bottom-2 w-px bg-[#F3F4F6]"></div>
              <div class="space-y-4">
                <div *ngFor="let w of withdrawals" class="relative flex items-start gap-3">
                  <div class="absolute -left-7 top-2 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center bg-[#8CF000]">
                    <ion-icon name="checkmark-outline" style="font-size:8px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>

                  <div class="flex-1 bg-[#F9FAFB] rounded-2xl px-4 py-3 border border-slate-100">
                    <div class="flex items-center justify-between mb-1">
                      <p class="text-[16px] font-black text-[#111827] m-0">₹{{ w.amount.toLocaleString('en-IN') }}</p>
                      <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        [style.backgroundColor]="getStatusStyle(w.status).bg"
                        [style.color]="getStatusStyle(w.status).color">
                        {{ w.status }}
                      </span>
                    </div>
                    <div class="flex items-center gap-2 text-[11px] text-[#9CA3AF] font-bold">
                      <ion-icon name="card-outline"></ion-icon>
                      <span>{{ w.bank }}</span>
                      <span>·</span>
                      <span>{{ w.date }}</span>
                      <span>·</span>
                      <span class="font-mono text-[9px]">{{ w.ref }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent transactions list -->
          <div class="section-card p-5 bg-white text-left">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-0 m-0">Recent Transactions</p>
              <button class="text-[12px] font-bold text-[#8CF000] flex items-center gap-0.5 bg-transparent border-none">
                View All<ion-icon name="chevron-forward-outline"></ion-icon>
              </button>
            </div>
            <div class="space-y-1">
              <div *ngFor="let t of transactions; let idx = index" class="flex items-center gap-3 py-3.5 border-b border-[#F9FAFB] last:border-none">
                <div class="w-10 h-10 rounded-2xl bg-[#F0FDF4] flex items-center justify-center flex-shrink-0 border border-slate-100">
                  <ion-icon name="trending-up-outline" class="text-[#22C55E] text-lg"></ion-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-bold text-[#111827] leading-tight m-0">{{ t.label }}</p>
                  <p class="text-[11px] text-[#9CA3AF] mt-0.5 m-0 font-medium">{{ t.time }}</p>
                </div>
                <p class="text-[15px] font-black flex-shrink-0 text-[#16A34A] m-0">
                  +₹{{ t.amount.toLocaleString('en-IN') }}
                </p>
              </div>
            </div>
          </div>

          <!-- Bank account metrics -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Linked Bank Account</p>
            <div class="bg-gradient-to-br from-[#111827] to-[#374151] rounded-2xl px-5 py-4 mb-4 relative overflow-hidden">
              <div class="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-white/5"></div>
              <div class="flex items-start justify-between mb-4">
                <div>
                  <p class="text-[12px] text-white/50 font-medium mb-0.5 m-0">Primary Account</p>
                  <p class="text-[17px] font-black text-white m-0">HDFC Bank</p>
                </div>
                <div class="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <ion-icon name="business-outline" class="text-white/70 text-xl"></ion-icon>
                </div>
              </div>
              <p class="text-[18px] font-bold text-white tracking-widest font-mono m-0">
                XXXX XXXX 4589
              </p>
              <div class="mt-3 flex items-center gap-1.5">
                <div class="w-2 h-2 rounded-full bg-[#8CF000]"></div>
                <p class="text-[11px] text-white/50 m-0 font-bold">Verified & Active</p>
              </div>
            </div>
            <div class="flex gap-3">
              <button class="flex-1 h-10 rounded-2xl text-[13px] font-bold text-[#111827] border-none bg-[#8CF000]/12 border-[#8CF000]/35 border-2">
                Edit Details
              </button>
              <button class="flex-1 h-10 rounded-2xl text-[13px] font-bold text-[#6B7280] bg-[#F9FAFB] border border-[#E5E7EB]">
                Change Account
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Withdraw bottom sheet overlay modal -->
      <div *ngIf="showWithdrawSheet()" class="modal-overlay">
        <div class="modal-backdrop" (click)="showWithdrawSheet.set(false)"></div>
        <div class="modal-content bg-white rounded-t-[32px] p-6 max-w-sm w-full relative z-50 text-left">
          <div class="w-10 h-1 rounded-full bg-[#E5E7EB] mx-auto mb-5"></div>

          <!-- SUCCESS STATE -->
          <div *ngIf="withdrawState() === 'success'" class="flex flex-col items-center text-center">
            <div class="success-circle mb-4">
              <ion-icon name="checkmark-outline" class="text-white text-5xl font-black"></ion-icon>
            </div>
            <p class="text-[20px] font-black text-[#111827] mb-1 m-0">Withdrawal Initiated!</p>
            <p class="text-[14px] text-[#9CA3AF] mb-4 m-0">Amount: ₹{{ withdrawVal }}</p>
            <div class="bg-[#F0FDF4] rounded-2xl px-4 py-2.5 w-full border border-[#8CF000]/22 mb-4">
              <p class="text-[12px] font-bold text-[#16A34A] text-center m-0">Funds will credit within 24 hours.</p>
            </div>
            <button (click)="showWithdrawSheet.set(false)" class="w-full h-11 rounded-2xl text-[14px] font-black btn-orange-gradient text-white border-none">
              Done
            </button>
          </div>

          <!-- INPUT SLIDE STATE -->
          <div *ngIf="withdrawState() === 'input'" class="space-y-4">
            <h2 class="text-[18px] font-black text-[#111827] m-0">Enter Amount</h2>
            <p class="text-[13px] text-[#9CA3AF] m-0">Select how much you want to transfer to your HDFC bank account.</p>

            <div class="bg-[#FAFBFC] rounded-2xl p-4 border border-[#F3F4F6]">
              <p class="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider mb-1 m-0">Withdrawal Amount</p>
              <div class="flex items-baseline gap-2">
                <span class="text-[24px] font-black text-[#111827]/40">₹</span>
                <input type="number" [(ngModel)]="withdrawVal" placeholder="Enter amount" class="flex-1 bg-transparent text-[36px] font-black text-[#111827] focus:outline-none min-h-0 border-none outline-none" />
              </div>
              <p class="text-[11px] text-[#9CA3AF] mt-2 mb-0">Max available: ₹12,500</p>
            </div>

            <button (click)="submitWithdrawal()" [disabled]="!isWithdrawValid()" class="w-full h-12 rounded-2xl text-[15px] font-black btn-orange-gradient text-white border-none">
              Confirm Withdrawal
            </button>
          </div>
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

    .summary-hero-card {
      border-radius: 24px;
      box-shadow: 0 6px 28px rgba(0,0,0,0.20);
    }

    .section-card {
      border-radius: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .btn-orange-gradient {
      background: linear-gradient(135deg, #FF7A00, #FF9A40);
      box-shadow: 0 4px 16px rgba(255, 122, 0, 0.35);
      color: white;
    }

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: flex-end;
      justify-content: center;
      z-index: 50;
    }

    .modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
    }

    .modal-content {
      box-shadow: 0 -10px 40px rgba(0,0,0,0.15);
      animation: slideUp 0.3s ease-out;
    }

    @keyframes slideUp {
      from { transform: translateY(100%); }
      to { transform: translateY(0); }
    }

    .success-circle {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: #8CF000;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 32px rgba(140,240,0,0.45);
    }
  `]
})
export class CoachEarningsPage {
  private readonly router = inject(Router);

  selectedPeriod = signal('This Month');
  showWithdrawSheet = signal(false);
  withdrawState = signal<'input' | 'success'>('input');
  withdrawVal = '';

  readonly periods = ['Today', 'This Week', 'This Month', 'This Year'];
  readonly breakdowns = BREAKDOWNS;
  readonly payouts = PAYOUTS;
  readonly venues = VENUES;
  readonly withdrawals = WITHDRAWALS;
  readonly transactions = TRANSACTIONS;
  readonly Math = Math;

  back() {
    this.router.navigateByUrl('/app/home');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  getCurrentData(): PeriodData {
    return PERIOD_DATA[this.selectedPeriod()] || PERIOD_DATA['This Month'];
  }

  getStatusStyle(status: string) {
    if (status === 'Active') return { bg: '#F0FDF4', color: '#16A34A' };
    if (status === 'Review') return { bg: '#FFFBEB', color: '#D97706' };
    if (status === 'Processing') return { bg: '#EFF6FF', color: '#1D4ED8' };
    if (status === 'Pending') return { bg: '#FFF7ED', color: '#C2410C' };
    return { bg: '#F0FDF4', color: '#16A34A' }; // Completed
  }

  openWithdrawModal() {
    this.withdrawVal = '';
    this.withdrawState.set('input');
    this.showWithdrawSheet.set(true);
  }

  isWithdrawValid(): boolean {
    const val = parseInt(this.withdrawVal) || 0;
    return val > 0 && val <= 12500;
  }

  submitWithdrawal() {
    this.withdrawState.set('success');
  }
}
