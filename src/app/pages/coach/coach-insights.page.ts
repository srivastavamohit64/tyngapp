import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

interface PerfCard {
  id: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  color: string;
}

const SPARKLINES: Record<string, number[]> = {
  views:      [45,67,89,72,95,110,145,130,167,198,187,247],
  bookings:   [1,2,0,3,2,4,3,5,4,6,5,7],
  acceptance: [78,82,85,80,88,90,91,89,92,91,93,91],
  completion: [88,90,92,91,94,95,96,95,97,96,97,96],
  repeat:     [70,72,75,73,77,78,80,79,81,80,82,82],
  rating:     [4.6,4.7,4.7,4.8,4.8,4.8,4.9,4.9,4.9,4.9,4.9,4.9],
};

const PERF_CARDS = [
  { id:'views',      label:'Profile Views',         value:'1,247', change:'+18%', positive:true,  color:'#8CF000' },
  { id:'bookings',   label:'Booking Requests',      value:'34',    change:'+12%', positive:true,  color:'#FF7A00' },
  { id:'acceptance', label:'Acceptance Rate',       value:'91%',   change:'+5%',  positive:true,  color:'#38BDF8' },
  { id:'completion', label:'Session Completion',    value:'96%',   change:'+3%',  positive:true,  color:'#22C55E' },
  { id:'repeat',     label:'Repeat Students',       value:'82%',   change:'+8%',  positive:true,  color:'#7C3AED' },
  { id:'rating',     label:'Average Rating',        value:'4.9',   change:'+0.2', positive:true,  color:'#F59E0B' },
];

const REVIEW_TAGS = [
  { label:'Professional', count:234 },
  { label:'Patient',      count:198 },
  { label:'Motivating',   count:178 },
  { label:'Friendly',     count:156 },
  { label:'Knowledgeable',count:143 },
  { label:'Disciplined',  count:127 },
  { label:'Supportive',   count:115 },
  { label:'Reliable',     count:98  },
];

const FUNNEL = [
  { label:'Profile Views',      value:'1,247', pct:100, conversionTo:'7.1%' },
  { label:'Booking Enquiries',  value:'89',    pct:36,  conversionTo:'42.7%' },
  { label:'Confirmed Sessions', value:'38',    pct:18,  conversionTo:'81.6%' },
  { label:'Returning Students', value:'31',    pct:14,  conversionTo:null    },
];

@Component({
  selector: 'app-coach-insights',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="insights-page">
        <!-- Sticky Header -->
        <div class="sticky-header flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
          <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
          <p class="text-[17px] font-black text-[#111827] m-0">Coach Insights</p>
          <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="calendar-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
        </div>

        <!-- Filter tabs -->
        <div class="flex gap-2 px-5 py-3 bg-white border-b border-[#F3F4F6] overflow-x-auto no-scrollbar">
          <button *ngFor="let t of timeTabs" (click)="selectedTab.set(t)" class="flex-shrink-0 px-3.5 py-2 rounded-full text-[11px] font-bold border-none"
            [style.backgroundColor]="selectedTab() === t ? '#8CF000' : '#F3F4F6'"
            [style.color]="selectedTab() === t ? '#111827' : '#6B7280'">
            {{ t }}
          </button>
        </div>

        <div class="px-5 pt-4 pb-32 space-y-4">
          <!-- Coach Growth Index (Hero) -->
          <div class="hero-growth-card p-6 relative overflow-hidden bg-gradient-to-br from-[#111827] to-[#1F2937] text-white">
            <div class="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-[#8CF000]/10"></div>
            <div class="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-[#FF7A00]/10"></div>

            <div class="relative flex items-center gap-6">
              <!-- Ring visual percentage -->
              <div class="flex-shrink-0 relative w-[100px] h-[100px] flex items-center justify-center">
                <svg width="100" height="100" viewBox="0 0 100 100" class="absolute">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke="#8CF000" strokeWidth="8"
                    strokeDasharray="263.8" strokeDashoffset="15.8" strokeLinecap="round" transform="rotate(-90 50 50)" />
                </svg>
                <div class="text-center relative">
                  <p class="text-[26px] font-black text-white m-0">94</p>
                  <p class="text-[10px] text-white/50 m-0">/ 100</p>
                </div>
              </div>

              <div class="flex-1">
                <p class="text-[11px] font-black text-[#8CF000] uppercase tracking-widest mb-1 m-0">Coach Growth Index</p>
                <div class="flex gap-0.5 mb-1.5">
                  <ion-icon *ngFor="let s of [1,2,3,4,5]" name="star" class="text-[#F59E0B] text-sm"></ion-icon>
                </div>
                <p class="text-[16px] font-black text-white m-0">Elite Coach</p>
                <p class="text-[11px] text-white/50 m-0">Top 5% of TYNG coaches this month</p>
              </div>
            </div>

            <!-- Quick stats grid -->
            <div class="relative grid grid-cols-4 gap-2 mt-5 pt-4 border-t border-white/10">
              <div *ngFor="let m of [{ emoji:'⭐', label:'Avg Rating', value:'4.9' }, { emoji:'👥', label:'Repeat', value:'82%' }, { emoji:'⚡', label:'Response', value:'<1hr' }, { emoji:'📈', label:'Profile', value:'40%' }]"
                class="text-center">
                <span class="text-lg">{{ m.emoji }}</span>
                <p class="text-[15px] font-black text-white mt-0.5 m-0">{{ m.value }}</p>
                <p class="text-[9px] text-white/40 m-0 font-medium">{{ m.label }}</p>
              </div>
            </div>
          </div>

          <!-- Performance Overview grid -->
          <div>
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Performance Overview</p>
            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let card of perfCards" class="section-card p-4">
                <div class="flex items-start justify-between mb-2">
                  <div class="w-9 h-9 rounded-xl flex items-center justify-center"
                    [style.backgroundColor]="card.color + '15'">
                    <ion-icon [name]="getIconName(card.id)" [style.color]="card.color" class="text-base"></ion-icon>
                  </div>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    [style.backgroundColor]="card.positive ? '#F0FDF4' : '#FEF2F2'"
                    [style.color]="card.positive ? '#16A34A' : '#DC2626'">
                    {{ card.change }}
                  </span>
                </div>
                <p class="text-[22px] font-black text-[#111827] leading-none mb-0.5">{{ card.value }}</p>
                <p class="text-[10px] text-[#9CA3AF] mb-3 font-semibold">{{ card.label }}</p>
                <!-- SVG Sparkline -->
                <div class="h-8 w-full flex items-center">
                  <svg width="100%" height="32" viewBox="0 0 120 32" class="overflow-visible">
                    <polyline [attr.points]="getSparklinePoints(card.id)" fill="none" [attr.stroke]="card.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                    <circle [attr.cx]="getLastX()" [attr.cy]="getLastY(card.id)" r="3" [attr.fill]="card.color" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Business Performance progress charts -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Business Performance</p>
            <div class="space-y-4">
              <div *ngFor="let item of businessMetrics" class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 text-lg">
                  {{ item.emoji }}
                </div>
                <div class="flex-1 min-w-0">
                  <div class="flex items-center justify-between mb-1">
                    <p class="text-[13px] font-bold text-[#111827] m-0">{{ item.label }}</p>
                    <p class="text-[14px] font-black m-0" [style.color]="item.color">{{ item.value }}</p>
                  </div>
                  <div class="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div class="h-full rounded-full" [style.backgroundColor]="item.color" [style.width]="item.pct + '%'"></div>
                  </div>
                  <p class="text-[10px] text-[#9CA3AF] mt-0.5 m-0 font-medium">{{ item.sub }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Student Growth -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Student Growth Dashboard</p>
            <div class="grid grid-cols-3 gap-3 mb-4">
              <div *ngFor="let m of [{ emoji:'🏆', label:'Tournament Winners', value:'3', color:'#F59E0B' }, { emoji:'📈', label:'Students Improved', value:'18/24', color:'#22C55E' }, { emoji:'🎯', label:'Avg Improvement', value:'+28%', color:'#8CF000' }]"
                class="rounded-[18px] p-3 text-center"
                [style.backgroundColor]="m.color + '12'" [style.border]="'1.5px solid ' + m.color + '22'">
                <span class="text-2xl">{{ m.emoji }}</span>
                <p class="text-[16px] font-black text-[#111827] mt-1 m-0">{{ m.value }}</p>
                <p class="text-[9px] text-[#9CA3AF] mt-0.5 m-0 font-medium">{{ m.label }}</p>
              </div>
            </div>
            <div class="bg-[#F9FAFB] rounded-2xl p-4 mb-3 border border-slate-100">
              <div class="flex justify-between text-[12px] mb-2">
                <span class="font-bold text-[#111827]">Students Improved This Period</span>
                <span class="font-black text-[#8CF000]">18 / 24</span>
              </div>
              <div class="h-2.5 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div class="h-full rounded-full bg-[#8CF000]" style="width: 75%;"></div>
              </div>
            </div>
            <div class="space-y-2.5">
              <div *ngFor="let p of [{ emoji:'⭐', label:'Most Improved', name:'Rahul Sharma', sub:'Advanced → Expert · +42%', badge:'🏅' }, { emoji:'🥇', label:'Top Performer', name:'Vikram Singh', sub:'4 Tournament Wins · 96% Attend', badge:'🏆' }]"
                class="flex items-center gap-3 bg-[#F9FAFB] rounded-2xl px-4 py-3 border border-slate-100">
                <div class="w-9 h-9 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-xl">{{ p.emoji }}</div>
                <div class="flex-1">
                  <p class="text-[10px] text-[#9CA3AF] font-bold uppercase tracking-wider m-0">{{ p.label }}</p>
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ p.name }}</p>
                  <p class="text-[10px] text-[#9CA3AF] m-0">{{ p.sub }}</p>
                </div>
                <span class="text-2xl">{{ p.badge }}</span>
              </div>
            </div>
          </div>

          <!-- Student Retention Donut metrics -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Student Retention</p>
            <div class="grid grid-cols-4 gap-2 mb-4">
              <div *ngFor="let r of [{ pct:82, color:'#8CF000', label:'Repeat Rate' }, { pct:78, color:'#FF7A00', label:'Renewals' }, { pct:91, color:'#38BDF8', label:'Satisfaction' }, { pct:65, color:'#7C3AED', label:'Referrals' }]"
                class="flex flex-col items-center gap-1.5">
                <div class="relative w-[60px] h-[60px] flex items-center justify-center">
                  <svg width="60" height="60" viewBox="0 0 60 60" class="absolute">
                    <circle cx="30" cy="30" r="24" fill="none" stroke="#F3F4F6" strokeWidth="6" />
                    <circle cx="30" cy="30" r="24" fill="none" [attr.stroke]="r.color" strokeWidth="6"
                      strokeDasharray="150.8" [attr.strokeDashoffset]="150.8 - (r.pct/100)*150.8" strokeLinecap="round" transform="rotate(-90 30 30)" />
                  </svg>
                  <span class="text-[11px] font-black text-[#111827] relative z-10">{{ r.pct }}%</span>
                </div>
                <span class="text-[9px] font-bold text-[#9CA3AF] text-center leading-tight">{{ r.label }}</span>
              </div>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let retention of [{ label:'Avg Coaching Duration', value:'4.2 months', color:'#8CF000' }, { label:'Returning Students', value:'31 this month', color:'#FF7A00' }]"
                class="bg-[#F9FAFB] rounded-2xl p-3.5 border border-slate-100">
                <p class="text-[16px] font-black leading-none m-0" [style.color]="retention.color">{{ retention.value }}</p>
                <p class="text-[10px] text-[#9CA3AF] mt-1 m-0 font-bold">{{ retention.label }}</p>
              </div>
            </div>
          </div>

          <!-- Review Highlights -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Review Highlights</p>
            <div class="flex flex-wrap gap-2 mb-4">
              <div *ngFor="let tag of reviewTags" class="flex items-center gap-1 bg-[#F9FAFB] border border-[#F3F4F6] rounded-full px-3.5 py-1.5">
                <span class="text-[11px] font-bold text-[#111827]">{{ tag.label }}</span>
                <span class="text-[10px] text-[#9CA3AF] font-bold">({{ tag.count }})</span>
              </div>
            </div>
            <div class="bg-[rgba(140,240,0,0.06)] rounded-2xl p-4 border border-[#8CF000]/22">
              <p class="text-[13px] text-[#111827] font-bold mb-1">💡 What Students Say</p>
              <p class="text-[11px] text-[#6B7280] leading-relaxed m-0">
                Students highly value your <strong class="text-[#111827]">structured batting sessions</strong> and <strong class="text-[#111827]">motivational coaching approach</strong>.
              </p>
            </div>
          </div>

          <!-- Conversion funnel -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Conversion Funnel</p>
            <div class="space-y-3">
              <div *ngFor="let step of funnelSteps; let i = index">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[12px] font-bold text-[#111827]">{{ step.label }}</span>
                  <span class="text-[12px] font-black text-[#111827]">{{ step.value }}</span>
                </div>
                <div class="flex items-center gap-3">
                  <div class="flex-1 h-3.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                    <div class="h-full rounded-full bg-gradient-to-r from-[#8CF000] to-[#A3E635]" [style.width]="step.pct + '%'"></div>
                  </div>
                  <span class="text-[11px] font-black text-[#8CF000] w-12 text-right">{{ step.pct }}%</span>
                </div>
                <div *ngIf="step.conversionTo" class="flex justify-end text-[10px] text-[#9CA3AF] mt-1 font-bold">
                  {{ step.conversionTo }} conversion to next step
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .insights-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .hero-growth-card {
      border-radius: 24px;
      box-shadow: 0 6px 30px rgba(0,0,0,0.20);
    }

    .section-card {
      background: #FFFFFF;
      border-radius: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .toggle-btn {
      width: 48px; height: 26px;
      border-radius: 999px;
      background: #E5E7EB;
      border: none;
      position: relative;
      cursor: pointer;
    }

    .toggle-on {
      background: #8CF000;
    }

    .toggle-thumb {
      position: absolute;
      top: 3px; left: 3px;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
    }

    .toggle-thumb-on {
      transform: translateX(22px);
    }
  `]
})
export class CoachInsightsPage {
  private readonly router = inject(Router);

  selectedTab = signal('Last 30 Days');
  readonly timeTabs = ['Last 7 Days', 'Last 30 Days', 'This Month', 'This Year'];
  readonly perfCards = PERF_CARDS;
  readonly reviewTags = REVIEW_TAGS;
  readonly funnelSteps = FUNNEL;

  readonly businessMetrics = [
    { emoji: '💰', label: 'Monthly Earnings', value: '₹32,000', sub: '+22% this month', pct: 78, color: '#8CF000' },
    { emoji: '💵', label: 'Avg Session Price', value: '₹850', sub: 'Per session avg', pct: 68, color: '#FF7A00' },
    { emoji: '📚', label: 'Sessions Conducted', value: '38', sub: 'This period', pct: 85, color: '#38BDF8' },
    { emoji: '👥', label: 'Avg Students / Session', value: '4.2', sub: 'Group sessions', pct: 55, color: '#7C3AED' },
    { emoji: '📈', label: 'Revenue Growth', value: '+22%', sub: 'vs last month', pct: 88, color: '#22C55E' },
    { emoji: '📆', label: 'Highest Booking Day', value: 'Tuesday', sub: 'Evening peak', pct: 90, color: '#F59E0B' },
  ];

  back() {
    this.router.navigateByUrl('/app/home');
  }

  getIconName(id: string): string {
    if (id === 'views') return 'eye-outline';
    if (id === 'bookings') return 'calendar-outline';
    if (id === 'acceptance') return 'checkmark-circle-outline';
    if (id === 'completion') return 'award-outline';
    if (id === 'repeat') return 'refresh-outline';
    return 'star-outline';
  }

  getSparklinePoints(id: string): string {
    const data = SPARKLINES[id];
    const w = 120;
    const h = 32;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return data.map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / range) * h}`).join(' ');
  }

  getLastX(): number {
    return 120;
  }

  getLastY(id: string): number {
    const data = SPARKLINES[id];
    const h = 32;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    return h - ((data[data.length - 1] - min) / range) * h;
  }
}
