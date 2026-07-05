import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

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
];

@Component({
  selector: 'app-coach-session-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div *ngIf="session" class="session-detail-page pb-32">
        <!-- Hero section -->
        <div class="relative h-[32vh] min-h-[220px] overflow-hidden bg-gray-900">
          <img [src]="session.image" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#FAFBFC]"></div>

          <div class="absolute top-0 left-0 right-0 flex items-center justify-between px-5 pt-12">
            <button (click)="back()" class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 border-none">
              <ion-icon name="chevron-back-outline" class="text-white text-xl"></ion-icon>
            </button>
            <div class="flex gap-2">
              <button class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 border-none">
                <ion-icon name="share-social-outline" class="text-white text-base"></ion-icon>
              </button>
              <button (click)="liked = !liked" class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 border-none">
                <ion-icon [name]="liked ? 'heart' : 'heart-outline'" [class.text-red-500]="liked" class="text-white text-base"></ion-icon>
              </button>
            </div>
          </div>

          <div class="absolute bottom-12 left-5 flex gap-2">
            <span class="text-[11px] font-bold bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
              {{ session.emoji }} {{ session.sport }}
            </span>
            <span class="text-[11px] font-bold px-3 py-1.5 rounded-full"
              [style.backgroundColor]="session.status === 'Confirmed' ? '#F0FDF4' : '#F3F4F6'"
              [style.color]="session.status === 'Confirmed' ? '#16A34A' : '#6B7280'">
              {{ session.status }}
            </span>
          </div>
        </div>

        <!-- Session Content Body -->
        <div class="px-5 -mt-4 space-y-4 relative z-10">
          <!-- Session general metadata card -->
          <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <h1 class="text-[22px] font-black text-[#111827] mb-1 m-0">{{ session.name }}</h1>
            <p class="text-[13px] text-[#9CA3AF] mb-4 m-0">{{ session.teamName ?? session.studentName }} · {{ session.type }}</p>

            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let s of [{ name: 'location-outline', label:'Venue', val:session.venue }, { name: 'time-outline', label:'Time', val:session.time }, { name: 'people-outline', label:'Students', val: getAttendanceCount() + '/' + session.students.length }, { name: 'hourglass-outline', label:'Duration', val:session.duration }, { name: 'cloudy-night-outline', label:'Weather', val:session.weather }, { name: 'trail-sign-outline', label:'Distance', val:session.distance }]"
                class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  <ion-icon [name]="s.name" class="text-[#6B7280] text-sm"></ion-icon>
                </div>
                <div>
                  <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider m-0 font-bold">{{ s.label }}</p>
                  <p class="text-[12px] font-bold text-[#111827] m-0 truncate w-32">{{ s.val }}</p>
                </div>
              </div>
            </div>

            <div class="flex gap-2.5 mt-4 pt-4 border-t border-[#F3F4F6]">
              <button (click)="go('/app/chat')" class="action-btn">
                <ion-icon name="chatbubbles-outline"></ion-icon>Chat
              </button>
              <button class="action-btn">
                <ion-icon name="navigate-outline"></ion-icon>Navigate
              </button>
            </div>
          </div>

          <!-- Present roster checklist -->
          <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0">Students</p>
              <span class="text-[12px] font-bold text-[#8CF000]">
                {{ getPresentCount() }}/{{ session.students.length }} Present
              </span>
            </div>

            <div class="space-y-3">
              <div *ngFor="let s of session.students" class="flex items-center gap-3 bg-[#F9FAFB] rounded-2xl px-3.5 py-3 border border-slate-100">
                <img [src]="s.photo" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ s.name }}</p>
                  <div class="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                    <span [style.color]="getSkillColor(s.skill)" class="font-bold">{{ s.skill }}</span>
                    <span>·</span>
                    <span class="font-bold">{{ s.attendance }}% Attend</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button (click)="go('/app/chat')" class="w-8 h-8 rounded-full bg-[#EFF6FF] border-none flex items-center justify-center">
                    <ion-icon name="chatbubble-ellipses-outline" class="text-[#2563EB] text-sm"></ion-icon>
                  </button>
                  <button (click)="toggleAttendance(s.id)" class="w-8 h-8 rounded-full border-none flex items-center justify-center transition-all"
                    [style.backgroundColor]="attendance[s.id] ? '#8CF000' : '#F3F4F6'">
                    <ion-icon name="checkmark-outline" [style.color]="attendance[s.id] ? '#111827' : '#C4C9D4'" style="font-weight:bold;"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Amenities -->
          <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Venue Amenities</p>
            <div class="grid grid-cols-4 gap-2.5">
              <div *ngFor="let a of amenities" class="flex flex-col items-center gap-1.5 py-3 bg-[#F9FAFB] rounded-2xl border border-slate-100">
                <ion-icon [name]="a.icon" class="text-slate-500 text-base"></ion-icon>
                <span class="text-[9px] font-bold text-[#9CA3AF]">{{ a.label }}</span>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Coach Notes</p>
            <textarea [(ngModel)]="notes" (input)="savedNotes = false" rows="4" placeholder="Add notes about today's training session, observations, or reminders..."
              class="w-full p-4 rounded-2xl text-[14px] text-[#111827] placeholder:text-[#C4C9D4] focus:outline-none resize-none bg-[#FAFBFC] border border-slate-200"></textarea>
            <div class="flex items-center justify-between mt-2">
              <p class="text-[11px] text-[#C4C9D4] m-0 font-bold">{{ notes.length }}/500</p>
              <button (click)="saveNotes()" [disabled]="!notes.trim()" class="px-5 py-2 rounded-xl text-[13px] font-bold border-none"
                [style.backgroundColor]="notes.trim() ? '#8CF000' : '#F3F4F6'"
                [style.color]="notes.trim() ? '#111827' : '#C4C9D4'">
                {{ savedNotes ? '✓ Saved' : 'Save Notes' }}
              </button>
            </div>
          </div>

          <!-- Payments card -->
          <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Payment</p>
            <div class="space-y-3">
              <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280]">Session Earnings</span>
                <span class="text-[13px] font-bold text-[#111827]">₹{{ session.earnings.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280]">Payment Status</span>
                <span class="text-[13px] font-bold" [style.color]="session.status === 'Completed' ? '#16A34A' : '#D97706'">
                  {{ session.status === 'Completed' ? 'Received ✓' : 'Pending' }}
                </span>
              </div>
              <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280]">Platform Fee</span>
                <span class="text-[13px] font-bold text-[#6B7280]">₹49</span>
              </div>
              <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280]">Net Earnings</span>
                <span class="text-[13px] font-black text-[#16A34A]">₹{{ Math.max(0, session.earnings - 49).toLocaleString() }}</span>
              </div>
            </div>
            <button class="mt-4 w-full h-10 rounded-2xl text-[13px] font-bold text-[#6B7280] bg-[#F9FAFB] border border-[#F3F4F6] flex items-center justify-center gap-1">
              View Full Breakdown<ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
          </div>

          <!-- Coach Assistant AI card -->
          <div class="rounded-[24px] p-5 relative overflow-hidden bg-gradient-to-br from-[#8CF000] to-[#A3E635] text-left">
            <div class="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8"></div>
            <div class="relative">
              <div class="flex items-center gap-2 mb-3">
                <ion-icon name="flame-outline" class="text-[#111827] text-lg font-bold"></ion-icon>
                <p class="text-[14px] font-black text-[#111827] m-0">Coach Assistant</p>
                <span class="text-[9px] bg-[#111827]/15 text-[#111827] font-black px-2 py-0.5 rounded-full">AI</span>
              </div>
              <div class="space-y-2 mb-4">
                <div *ngFor="let tip of ['🚗 Leave 15 minutes early to avoid evening traffic on Gomti Nagar.','☀️ Weather is ideal for outdoor coaching today.','🔄 One student has requested a reschedule — review before you leave.']"
                  class="flex items-start gap-2 bg-white/20 rounded-2xl px-3.5 py-2.5">
                  <p class="text-[12px] text-[#111827] leading-relaxed m-0 font-semibold">{{ tip }}</p>
                </div>
              </div>
              <button class="w-full h-10 rounded-2xl text-[13px] font-black bg-gradient-to-br from-[#FF7A00] to-[#FF9A40] text-white border-none shadow-md">
                View All Suggestions →
              </button>
            </div>
          </div>

          <!-- Recent activities list -->
          <div class="bg-white rounded-[24px] px-5 py-5 shadow-sm border border-slate-100 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Recent Activity</p>
            <div class="space-y-0">
              <div *ngFor="let a of activityList; let idx = index" class="flex items-center gap-3 py-3" [class.border-b]="idx < activityList.length - 1" class="border-slate-50">
                <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm" [style.backgroundColor]="a.bg">
                  {{ a.icon }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[12px] font-bold text-[#111827] leading-snug m-0">{{ a.text }}</p>
                  <p class="text-[10px] text-[#9CA3AF] mt-0.5 m-0 font-medium">{{ a.time }}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      <!-- Bottom Sticky Footer Actions -->
      <div class="fixed-bottom-bar bg-white px-5 pt-4 pb-8">
        <div class="grid grid-cols-3 gap-2.5">
          <button (click)="go('/app/chat')" class="footer-action-btn">
            <ion-icon name="chatbubbles-outline"></ion-icon>Chat
          </button>
          <button class="footer-action-btn">
            <ion-icon name="navigate-outline"></ion-icon>Navigate
          </button>
          <button class="footer-action-btn font-black text-white bg-gradient-to-br from-[#FF7A00] to-[#FF9A40] shadow-md border-none">
            Attendance
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .session-detail-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .section-card {
      background: #FFFFFF;
      border-radius: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    }

    .action-btn {
      flex: 1;
      height: 44px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #6B7280;
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      cursor: pointer;
    }

    .footer-action-btn {
      height: 48px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #6B7280;
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      cursor: pointer;
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000, #A3E635);
      box-shadow: 0 2px 8px rgba(140,240,0,0.30);
    }

    .fixed-bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 30;
      max-width: 440px;
      margin: 0 auto;
      border-top: 1px solid #F3F4F6;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.09);
    }
  `]
})
export class CoachSessionDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  session: CoachSession | null = null;
  liked = false;
  notes = '';
  savedNotes = false;
  attendance: Record<number, boolean> = {};

  readonly Math = Math;
  readonly amenities = [
    { icon: 'car-outline', label: 'Parking' },
    { icon: 'water-outline', label: 'Washroom' },
    { icon: 'shirt-outline', label: 'Changing Room' },
    { icon: 'cube-outline', label: 'Equipment' },
    { icon: 'flash-outline', label: 'Floodlights' },
    { icon: 'cafe-outline', label: 'Café' },
    { icon: 'water-outline', label: 'Water' },
    { icon: 'lock-closed-outline', label: 'Lockers' },
  ];

  readonly activityList = [
    { icon: '⭐', bg: '#FFFBEB', text: 'New 5-Star Review received from Ananya', time: '1 hr ago' },
    { icon: '🏆', bg: '#F5F3FF', text: 'Student Aarav won District Championship', time: '3 hrs ago' },
    { icon: '💰', bg: '#F0FDF4', text: '₹1,200 payment received', time: '5 hrs ago' },
    { icon: '📅', bg: '#EFF6FF', text: 'Session rescheduled — Priya moved to 7 PM', time: 'Yesterday' },
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      const match = SESSIONS.find(s => s.id === id) || SESSIONS[0];
      if (match) {
        this.session = JSON.parse(JSON.stringify(match));
        if (this.session) {
          this.attendance = this.session.students.reduce((acc, s) => {
            acc[s.id] = s.id <= (this.session?.studentsConfirmed ?? 0);
            return acc;
          }, {} as Record<number, boolean>);
        }
      }
    });
  }

  back() {
    this.router.navigateByUrl('/app/schedule');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  getPresentCount() {
    return Object.values(this.attendance).filter(Boolean).length;
  }

  getAttendanceCount() {
    return this.session ? this.session.studentsConfirmed : 0;
  }

  toggleAttendance(id: number) {
    this.attendance[id] = !this.attendance[id];
  }

  saveNotes() {
    this.savedNotes = true;
  }

  getSkillColor(skill: string) {
    if (skill === 'Expert') return '#C2410C';
    if (skill === 'Advanced') return '#D97706';
    if (skill === 'Intermediate') return '#1D4ED8';
    return '#16A34A';
  }
}
