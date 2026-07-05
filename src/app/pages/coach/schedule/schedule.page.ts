import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';
import { SegmentControlComponent, SegmentOption } from '../../../shared/components/segment-control/segment-control.component';

interface Student {
  id: number;
  name: string;
  photo: string;
  skill: string;
  attendance: number;
  sessions: number;
}

interface CoachSession {
  id: string;
  name: string;
  sport: string;
  emoji: string;
  image: string;
  studentName?: string;
  teamName?: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  duration: string;
  type: 'Training' | 'One-on-One' | 'Academy' | 'Group Session';
  status: 'Confirmed' | 'Completed' | 'Pending' | 'Cancelled';
  weather: string;
  distance: string;
  startsIn?: string | null;
  earnings: number;
  studentsConfirmed: number;
  studentsTotal: number;
  students: Student[];
  tab: 'today' | 'upcoming' | 'completed' | 'cancelled';
}

const MOCK_STUDENTS: Student[] = [
  { id: 1, name: 'Rahul Sharma', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', skill: 'Advanced', attendance: 94, sessions: 18 },
  { id: 2, name: 'Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', skill: 'Intermediate', attendance: 88, sessions: 12 },
  { id: 3, name: 'Vikram Singh', photo: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=80&h=80&fit=crop&auto=format', skill: 'Expert', attendance: 96, sessions: 24 },
  { id: 4, name: 'Ananya Patel', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format', skill: 'Beginner', attendance: 82, sessions: 6 },
  { id: 5, name: 'Kabir Malhotra', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', skill: 'Advanced', attendance: 91, sessions: 15 },
  { id: 6, name: 'Meena Krishnan', photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&auto=format', skill: 'Intermediate', attendance: 85, sessions: 9 },
];

const SESSIONS: CoachSession[] = [
  {
    id: 's1', name: 'Elite Cricket Academy', sport: 'Cricket', emoji: '🏏',
    image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=350&fit=crop&auto=format',
    teamName: 'Advanced Batch', venue: 'Phoenix Arena', address: 'Gomti Nagar, Lucknow',
    date: 'Today', time: '6:00 PM', duration: '2 hours', type: 'Training', status: 'Confirmed',
    weather: 'Clear ☀️ 28°C', distance: '2.3 km', startsIn: '35 min',
    earnings: 1500, studentsConfirmed: 10, studentsTotal: 12,
    students: MOCK_STUDENTS, tab: 'today'
  },
  {
    id: 's2', name: 'Football Skills Workshop', sport: 'Football', emoji: '⚽',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=350&fit=crop&auto=format',
    teamName: 'Junior Squad', venue: 'K.D. Singh Stadium', address: 'Nehru Nagar, Lucknow',
    date: 'Today', time: '7:30 PM', duration: '90 min', type: 'Group Session', status: 'Confirmed',
    weather: 'Clear ☀️ 26°C', distance: '3.8 km', startsIn: '1h 55m',
    earnings: 1200, studentsConfirmed: 8, studentsTotal: 10,
    students: MOCK_STUDENTS.slice(0, 5), tab: 'today'
  },
  {
    id: 's3', name: 'Priya – Individual Coaching', sport: 'Badminton', emoji: '🏸',
    image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=350&fit=crop&auto=format',
    studentName: 'Priya Verma', venue: 'Sports Authority Complex', address: 'Gomti Nagar, Lucknow',
    date: 'Today', time: '4:00 PM', duration: '60 min', type: 'One-on-One', status: 'Completed',
    weather: 'Clear ☀️', distance: '4.5 km', startsIn: null,
    earnings: 800, studentsConfirmed: 1, studentsTotal: 1,
    students: [MOCK_STUDENTS[1]], tab: 'today'
  },
  {
    id: 's4', name: 'Junior Tennis Camp', sport: 'Tennis', emoji: '🎾',
    image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=700&h=350&fit=crop&auto=format',
    teamName: 'Weekend Juniors', venue: 'Phoenix Sports Hub', address: 'Aliganj, Lucknow',
    date: 'Today', time: '10:00 AM', duration: '90 min', type: 'Academy', status: 'Completed',
    weather: 'Clear ☀️', distance: '5.2 km', startsIn: null,
    earnings: 750, studentsConfirmed: 6, studentsTotal: 6,
    students: MOCK_STUDENTS.slice(2, 6), tab: 'today'
  },
  {
    id: 's5', name: 'Cricket Advanced Batch', sport: 'Cricket', emoji: '🏏',
    image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=350&fit=crop&auto=format',
    teamName: 'Advanced Batch', venue: 'Ekana Cricket Stadium', address: 'Gomti Nagar Extension',
    date: 'Tomorrow', time: '6:30 PM', duration: '2 hours', type: 'Training', status: 'Confirmed',
    weather: 'Partly Cloudy ⛅', distance: '4.5 km', startsIn: '25h 30m',
    earnings: 1500, studentsConfirmed: 10, studentsTotal: 12,
    students: MOCK_STUDENTS, tab: 'upcoming'
  },
  {
    id: 's6', name: 'Badminton Weekend Camp', sport: 'Badminton', emoji: '🏸',
    image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=350&fit=crop&auto=format',
    teamName: 'Weekend Batch', venue: 'Sports Authority Complex', address: 'Gomti Nagar',
    date: 'Yesterday', time: '8:00 AM', duration: '2 hours', type: 'Group Session', status: 'Completed',
    weather: 'Clear ☀️', distance: '4.5 km', startsIn: null,
    earnings: 2000, studentsConfirmed: 8, studentsTotal: 8,
    students: MOCK_STUDENTS.slice(0, 4), tab: 'completed'
  },
  {
    id: 's7', name: 'Football Strategy Session', sport: 'Football', emoji: '⚽',
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=350&fit=crop&auto=format',
    teamName: 'Senior Squad', venue: 'K.D. Singh Stadium', address: 'Nehru Nagar',
    date: 'Today', time: '8:00 AM', duration: '90 min', type: 'Training', status: 'Cancelled',
    weather: 'Rainy 🌧️', distance: '3.8 km', startsIn: null,
    earnings: 0, studentsConfirmed: 0, studentsTotal: 10,
    students: MOCK_STUDENTS.slice(0, 3), tab: 'cancelled'
  },
];

function buildWeek() {
  const today = new Date();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - 2 + i);
    return {
      idx: i - 2,
      dayShort: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      isToday: d.toDateString() === today.toDateString(),
    };
  });
}

@Component({
  selector: 'app-coach-schedule',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, SegmentControlComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell>
      <div class="schedule-page">
        <!-- Sticky Header -->
        <div class="sticky-header">
          <div class="flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
            <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[17px] font-black text-[#111827] m-0">Schedule</p>
              <p class="text-[11px] text-[#9CA3AF] font-bold m-0">{{ todayLabel }}</p>
            </div>
            <button class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="search-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
          </div>

          <!-- Weekly Calendar dates slider -->
          <div class="flex gap-2 px-5 pb-4 pt-2 bg-white border-b border-[#F3F4F6] overflow-x-auto no-scrollbar">
            <button *ngFor="let day of weekDays" (click)="selectedDay.set(day.idx)"
              class="flex-shrink-0 flex flex-col items-center px-3 py-2.5 rounded-2xl min-w-[48px] border-none transition-all"
              [style.backgroundColor]="selectedDay() === day.idx ? '#8CF000' : day.isToday ? 'rgba(140,240,0,0.10)' : 'white'"
              [style.border]="day.isToday && selectedDay() !== day.idx ? '1.5px solid rgba(140,240,0,0.30)' : '1.5px solid transparent'"
              [style.boxShadow]="selectedDay() === day.idx ? '0 2px 10px rgba(140,240,0,0.35)' : '0 1px 4px rgba(0,0,0,0.06)'">
              <span class="text-[10px] font-bold" [style.color]="selectedDay() === day.idx ? '#111827' : '#9CA3AF'">
                {{ day.isToday ? 'Today' : day.dayShort }}
              </span>
              <span class="text-[18px] font-black mt-0.5" style="color:#111827;">
                {{ day.dateNum }}
              </span>
              <div *ngIf="selectedDay() === day.idx" class="w-1.5 h-1.5 rounded-full bg-[#111827] mt-1"></div>
            </button>
          </div>
        </div>

        <div class="px-5 pt-4 pb-36 space-y-4">
          <!-- Today's Schedule Overview card -->
          <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[14px] font-black text-[#111827] m-0">Today's Schedule</p>
              <button (click)="go('/app/coach/plan')" class="w-9 h-9 rounded-xl bg-[#8CF000] border-none flex items-center justify-center shadow-md">
                <ion-icon name="add-outline" class="text-xl text-[#111827] font-bold"></ion-icon>
              </button>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let m of [{ emoji:'📅', label:'Sessions', value: confirmedCount + ' of ' + todaySessions.length, accent:'#8CF000' }, { emoji:'💰', label:'Expected Earnings', value:'₹' + totalEarnings.toLocaleString(), accent:'#FF7A00' }, { emoji:'🔄', label:'Reschedule Requests', value:'1 Pending', accent:'#F59E0B' }, { emoji:'💬', label:'New Messages', value:'3 Unread', accent:'#38BDF8' }]"
                class="flex items-center gap-3 py-2.5 px-3 rounded-[18px]" [style.backgroundColor]="m.accent + '10'">
                <span class="text-xl">{{ m.emoji }}</span>
                <div>
                  <p class="text-[14px] font-black text-[#111827] leading-none m-0">{{ m.value }}</p>
                  <p class="text-[10px] text-[#9CA3AF] mt-0.5 m-0 font-bold">{{ m.label }}</p>
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3.5 border-t border-[#F3F4F6]">
              <div class="flex justify-between text-[11px] mb-1.5">
                <span class="text-[#9CA3AF] font-bold">Today's Completion</span>
                <span class="text-[#8CF000] font-black">50%</span>
              </div>
              <div class="h-1.5 bg-[#F3F4F6] rounded-full overflow-hidden">
                <div class="h-full rounded-full bg-gradient-to-r from-[#8CF000] to-[#A3E635]" style="width: 50%;"></div>
              </div>
            </div>
          </div>

          <!-- Tabs segments -->
          <app-segment-control
            [options]="segmentOptions"
            [value]="activeTab()"
            (valueChange)="onTabChange($event)"
          ></app-segment-control>

          <!-- Session List timeline -->
          <div *ngIf="filteredSessions().length === 0" class="py-16 text-center">
            <div class="text-6xl mb-3">🏋️</div>
            <h3 class="text-[18px] font-black text-[#111827] mb-1">No Coaching Sessions</h3>
            <p class="text-[13px] text-[#6B7280] leading-relaxed mb-5">Enjoy your free time or create a new coaching session.</p>
            <button (click)="go('/app/coach/plan')" class="h-11 px-6 rounded-full text-[13px] font-black border-none btn-green-gradient text-[#111827]">
              Create Session
            </button>
          </div>

          <div *ngIf="filteredSessions().length > 0" class="relative">
            <!-- Timeline vertical line indicator -->
            <div class="absolute left-[18px] top-5 bottom-5 w-px bg-[#F3F4F6]"></div>

            <div class="space-y-4 pl-10">
              <div *ngFor="let sess of filteredSessions()" class="relative text-left">
                <!-- Timeline bullet dot -->
                <div class="absolute -left-[29px] top-[22px] z-10 w-4 h-4 rounded-full border-2 border-white"
                  [style.backgroundColor]="sess.status === 'Completed' ? '#E5E7EB' : sess.status === 'Cancelled' ? '#FCA5A5' : '#8CF000'"
                  [style.boxShadow]="sess.status === 'Confirmed' ? '0 0 0 3px rgba(140,240,0,0.20)' : 'none'"></div>

                <p class="text-[10px] font-bold text-[#9CA3AF] mb-2 -ml-6">{{ sess.time }}</p>

                <!-- High fidelity session card -->
                <div class="bg-white rounded-[24px] overflow-hidden shadow-sm border border-slate-100">
                  <div class="relative h-[150px] overflow-hidden bg-gray-200">
                    <img [src]="sess.image" class="w-full h-full object-cover" />
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>

                    <!-- Top left badges -->
                    <div class="absolute top-3 left-3 flex gap-1.5">
                      <span class="text-[10px] font-black px-2.5 py-1 rounded-full"
                        [style.backgroundColor]="getStatusStyle(sess.status).bg"
                        [style.color]="getStatusStyle(sess.status).color">
                        {{ sess.status }}
                      </span>
                      <span class="text-[10px] font-black px-2.5 py-1 rounded-full"
                        [style.backgroundColor]="getTypeStyle(sess.type).bg"
                        [style.color]="getTypeStyle(sess.type).color">
                        {{ sess.type }}
                      </span>
                    </div>

                    <!-- Countdown startsIn -->
                    <div *ngIf="sess.startsIn" class="absolute top-3 right-3 bg-[#FF7A00] px-2.5 py-1 rounded-full flex items-center gap-1.5">
                      <div class="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></div>
                      <span class="text-[10px] font-black text-white">Starts in {{ sess.startsIn }}</span>
                    </div>

                    <!-- bottom text -->
                    <div class="absolute bottom-0 left-0 right-0 px-4 pb-3">
                      <div class="flex items-end justify-between">
                        <div>
                          <div class="flex items-center gap-2 mb-0.5">
                            <span class="text-xl leading-none">{{ sess.emoji }}</span>
                            <p class="text-white font-black text-[16px] m-0 drop-shadow-md leading-none">{{ sess.name }}</p>
                          </div>
                          <p class="text-white/70 text-[12px] font-medium m-0">{{ sess.teamName ?? sess.studentName }}</p>
                        </div>
                        <div class="text-right">
                          <p class="text-white font-black text-[15px] m-0 leading-none">{{ sess.time }}</p>
                          <p class="text-white/60 text-[11px] m-0">{{ sess.duration }}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Card body content info -->
                  <div class="px-4 pt-3.5 pb-4">
                    <div class="flex items-center gap-3 mb-3 flex-wrap">
                      <div class="flex items-center gap-1 text-[11px] text-[#9CA3AF] font-bold">
                        <ion-icon name="location-outline"></ion-icon>{{ sess.venue }}
                      </div>
                      <div class="h-3 w-px bg-[#E5E7EB]"></div>
                      <div class="flex items-center gap-1 text-[11px] text-[#9CA3AF] font-bold">
                        <ion-icon name="cloudy-night-outline"></ion-icon>{{ sess.weather }}
                      </div>
                      <div class="h-3 w-px bg-[#E5E7EB]"></div>
                      <span class="text-[11px] text-[#9CA3AF] font-bold">{{ sess.distance }}</span>
                    </div>

                    <!-- Attendance avatar bar -->
                    <div class="bg-[#F9FAFB] rounded-2xl px-3.5 py-3 mb-3 flex items-center justify-between border border-slate-100">
                      <div class="flex items-center gap-3">
                        <div class="flex items-center">
                          <img *ngFor="let stud of sess.students.slice(0, 4); let idx = index" [src]="stud.photo"
                            class="w-7 h-7 rounded-full border-2 border-white object-cover"
                            [style.marginLeft]="idx > 0 ? '-8px' : '0px'"
                            [style.zIndex]="10 - idx" />
                          <div *ngIf="sess.students.length > 4" class="w-7 h-7 rounded-full bg-[#F3F4F6] border-2 border-white flex items-center justify-center" style="margin-left:-8px;z-index:0;">
                            <span class="text-[9px] font-bold text-[#6B7280]">+{{ sess.students.length - 4 }}</span>
                          </div>
                        </div>
                        <p class="text-[11px] text-[#9CA3AF] font-bold m-0">
                          <span class="text-[#111827] font-black">{{ sess.studentsConfirmed }}/{{ sess.studentsTotal }}</span> Confirmed
                        </p>
                      </div>
                      <button (click)="go('/app/coach/student/' + sess.students[0].id)" class="text-[11px] font-bold text-[#8CF000] bg-transparent border-none flex items-center gap-0.5">
                        Manage<ion-icon name="chevron-forward-outline"></ion-icon>
                      </button>
                    </div>

                    <!-- Action buttons -->
                    <div class="grid grid-cols-3 gap-2">
                      <button (click)="go('/app/chat')" class="action-card-btn">
                        <ion-icon name="chatbubbles-outline"></ion-icon>Chat
                      </button>
                      <button class="action-card-btn">
                        <ion-icon name="navigate-outline"></ion-icon>Navigate
                      </button>
                      <button (click)="go('/app/coach/session/' + sess.id)" class="action-card-btn font-black text-[#111827] btn-green-gradient">
                        Details<ion-icon name="chevron-forward-outline"></ion-icon>
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .schedule-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000, #A3E635);
      box-shadow: 0 2px 8px rgba(140,240,0,0.30);
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .action-card-btn {
      padding: 10px 0;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      color: #6B7280;
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;

      ion-icon {
        font-size: 15px;
      }
    }
  `]
})
export class CoachSchedulePage {
  private readonly router = inject(Router);

  selectedDay = signal(0);
  activeTab = signal<'today' | 'upcoming' | 'completed' | 'cancelled'>('today');

  readonly todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  readonly weekDays = buildWeek();
  readonly tabsList: { id: 'today' | 'upcoming' | 'completed' | 'cancelled'; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'completed', label: 'Completed' },
    { id: 'cancelled', label: 'Cancelled' },
  ];

  get segmentOptions(): SegmentOption[] {
    return this.tabsList.map((tab) => ({
      id: tab.id,
      label: tab.label,
      count: this.getTabCount(tab.id) || undefined,
    }));
  }

  onTabChange(id: string) {
    this.activeTab.set(id as 'today' | 'upcoming' | 'completed' | 'cancelled');
  }

  readonly todaySessions = SESSIONS.filter(s => s.tab === 'today');
  readonly totalEarnings = this.todaySessions.reduce((sum, s) => sum + s.earnings, 0);
  readonly confirmedCount = this.todaySessions.filter(s => s.status === 'Confirmed').length;

  filteredSessions = computed(() => {
    const tab = this.activeTab();
    return SESSIONS.filter(s => s.tab === tab).sort((a, b) => a.time.localeCompare(b.time));
  });

  back() {
    this.router.navigateByUrl('/app/home');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  getTabCount(tab: 'today' | 'upcoming' | 'completed' | 'cancelled'): number {
    return SESSIONS.filter(s => s.tab === tab).length;
  }

  getStatusStyle(status: string) {
    if (status === 'Confirmed') return { bg: '#F0FDF4', color: '#16A34A' };
    if (status === 'Completed') return { bg: '#F3F4F6', color: '#6B7280' };
    if (status === 'Pending') return { bg: '#FFFBEB', color: '#D97706' };
    return { bg: '#FEF2F2', color: '#DC2626' };
  }

  getTypeStyle(type: string) {
    if (type === 'Training') return { bg: '#EFF6FF', color: '#1D4ED8' };
    if (type === 'One-on-One') return { bg: '#F5F3FF', color: '#7C3AED' };
    if (type === 'Academy') return { bg: '#F0FDF4', color: '#16A34A' };
    return { bg: '#FFF7ED', color: '#C2410C' };
  }
}
