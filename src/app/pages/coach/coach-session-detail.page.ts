import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent } from '@ionic/angular';
import { CoachService } from '../../core/services/coach.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

interface Student {
  id: number;
  name: string;
  photo: string;
  skill: string;
  attendance: number;
  sessions: number;
  attendanceStatus?: 'present' | 'absent' | null;
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
  source: 'scheduling' | 'legacy';
  description: string;
  coachNotes: string;
  coachFee: number;
  venueFee: number;
  platformFee: number;
  taxAmount: number;
  paymentStatus: string;
  attendanceSupported: boolean;
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

const SESSIONS: any[] = [
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
      <div *ngIf="loading" class="p-8 text-center text-slate-500">Loading session details…</div>
      <div *ngIf="errorMessage && !loading" class="p-8 text-center">
        <p class="text-slate-700">{{ errorMessage }}</p>
        <button (click)="back()" class="mt-3 px-5 py-3 rounded-xl bg-white border border-slate-200">Back to schedule</button>
      </div>
      <div *ngIf="session && !loading" class="session-detail-page pb-32">
        <!-- Hero section -->
        <div class="relative h-[32vh] min-h-[220px] overflow-hidden bg-gray-900">
          <img [src]="session.image" [alt]="session.sport + ' session'" class="w-full h-full object-cover" />
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
            <p *ngIf="session.description" class="text-[13px] text-slate-600 mb-4 whitespace-pre-line">{{ session.description }}</p>
            <p class="text-[13px] text-[#9CA3AF] mb-4 m-0">{{ session.teamName ?? session.studentName }} · {{ session.type }}</p>

            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let s of sessionFacts()"
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
              <button (click)="go('/app/coach/chat')" class="action-btn">
                <ion-icon name="chatbubbles-outline"></ion-icon>Chat
              </button>
              <button (click)="navigateToVenue()" class="action-btn">
                <ion-icon name="navigate-outline"></ion-icon>Navigate
              </button>
            </div>
          </div>

          <!-- Present roster checklist -->
          <div #attendanceSection class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0">Students</p>
              <span class="text-[12px] font-bold text-[var(--app-primary)]">
                {{ getPresentCount() }}/{{ session.students.length }} Present
              </span>
            </div>

            <div class="space-y-3">
              <div *ngFor="let s of session.students" class="flex items-center gap-3 bg-[#F9FAFB] rounded-2xl px-3.5 py-3 border border-slate-100">
                <img *ngIf="s.photo" [src]="s.photo" [alt]="s.name" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div *ngIf="!s.photo" class="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">{{ initials(s.name) }}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ s.name }}</p>
                  <div class="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                    <span class="font-bold">{{ s.attendanceStatus || 'Attendance not marked' }}</span>
                    <span>·</span>
                    <span></span>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button (click)="go('/app/coach/chat')" class="w-8 h-8 rounded-full bg-[#EFF6FF] border-none flex items-center justify-center">
                    <ion-icon name="chatbubble-ellipses-outline" class="text-[#2563EB] text-sm"></ion-icon>
                  </button>
                  <button (click)="toggleAttendance(s.id)" [disabled]="savingAttendance[s.id] || !session.attendanceSupported" class="w-8 h-8 rounded-full border-none flex items-center justify-center transition-all"
                    [style.backgroundColor]="s.attendanceStatus === 'present' ? 'var(--app-primary)' : '#F3F4F6'">
                    <ion-icon [name]="s.attendanceStatus === 'present' ? 'checkmark-outline' : s.attendanceStatus === 'absent' ? 'close-outline' : 'ellipse-outline'" [style.color]="s.attendanceStatus === 'present' ? '#111827' : '#C4C9D4'" style="font-weight:bold;"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Amenities are not provided by the session API, so don't show invented venue features. -->
          <div *ngIf="session && false" class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
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
            <textarea [(ngModel)]="notes" (input)="savedNotes = false" rows="4" maxlength="4000" placeholder="Add private notes about this session..."
              class="w-full p-4 rounded-2xl text-[14px] text-[#111827] placeholder:text-[#C4C9D4] focus:outline-none resize-none bg-[#FAFBFC] border border-slate-200"></textarea>
            <div class="flex items-center justify-between mt-2">
              <p class="text-[11px] text-[#C4C9D4] m-0 font-bold">{{ notes.length }}/4000</p>
              <button (click)="saveNotes()" [disabled]="savingNotes || notes.length > 4000" class="px-5 py-2 rounded-xl text-[13px] font-bold border-none"
                [style.backgroundColor]="notes.trim() ? 'var(--app-primary)' : '#F3F4F6'"
                [style.color]="notes.trim() ? '#111827' : '#C4C9D4'">
                {{ savedNotes ? '✓ Saved' : 'Save Notes' }}
              </button>
            </div>
          </div>

          <!-- Payments card -->
          <div *ngIf="session && false" class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Payment</p>
            <div class="space-y-3">
              <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280]">Session total</span>
                <span class="text-[13px] font-bold text-[#111827]">₹{{ session.earnings.toLocaleString() }}</span>
              </div>
              <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280]">Payment Status</span>
                <span class="text-[13px] font-bold" [style.color]="session.status === 'Completed' ? '#16A34A' : '#D97706'">
                  {{ session.status === 'Completed' ? 'Received ✓' : 'Pending' }}
                </span>
              </div>
              <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280]">Venue fee</span>
                <span class="text-[13px] font-bold text-[#6B7280]">₹49</span>
              </div>
              <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                <span class="text-[13px] text-[#6B7280]">Coach fee</span>
                <span class="text-[13px] font-black text-[#16A34A]">₹{{ Math.max(0, session.earnings - 49).toLocaleString() }}</span>
              </div>
            </div>
            <button class="mt-4 w-full h-10 rounded-2xl text-[13px] font-bold text-[#6B7280] bg-[#F9FAFB] border border-[#F3F4F6] flex items-center justify-center gap-1">
              View Full Breakdown<ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
          </div>

          <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Session price details</p>
            <div class="flex justify-between py-2 border-b border-slate-50"><span>Coach fee</span><strong>₹{{ session.coachFee | number:'1.2-2' }}</strong></div>
            <div class="flex justify-between py-2 border-b border-slate-50"><span>Venue fee</span><strong>₹{{ session.venueFee | number:'1.2-2' }}</strong></div>
            <div class="flex justify-between py-2 border-b border-slate-50"><span>Platform fee</span><strong>₹{{ session.platformFee | number:'1.2-2' }}</strong></div>
            <div class="flex justify-between py-2 border-b border-slate-50"><span>Tax</span><strong>₹{{ session.taxAmount | number:'1.2-2' }}</strong></div>
            <div class="flex justify-between pt-3 font-bold"><span>Total listed price</span><strong>₹{{ session.earnings | number:'1.2-2' }}</strong></div>
            <p class="text-[11px] text-slate-500 mt-3 mb-0">Payment collection is not connected to this session record.</p>
          </div>

          <!-- Coach Assistant AI card -->
          <div *ngIf="false" class="rounded-[24px] p-5 relative overflow-hidden bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-primary-to)] text-left">
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
          <div *ngIf="false" class="bg-white rounded-[24px] px-5 py-5 shadow-sm border border-slate-100 text-left">
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
          <button (click)="go('/app/coach/chat')" class="footer-action-btn">
            <ion-icon name="chatbubbles-outline"></ion-icon>Chat
          </button>
          <button (click)="navigateToVenue()" class="footer-action-btn">
            <ion-icon name="navigate-outline"></ion-icon>Navigate
          </button>
          <button (click)="openAttendance()" class="footer-action-btn font-black text-white bg-gradient-to-br from-[#FF7A00] to-[#FF9A40] shadow-md border-none"
            [class.opacity-50]="session?.attendanceSupported === false" [attr.aria-disabled]="session?.attendanceSupported === false">
            Attendance
          </button>
        </div>
        <p *ngIf="actionNotice" class="text-center text-xs text-slate-600 mt-2 mb-0">{{ actionNotice }}</p>
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
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      box-shadow: 0 2px 8px rgba(var(--app-primary-rgb),0.30);
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
  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild('attendanceSection') private attendanceSection?: ElementRef<HTMLElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coachService = inject(CoachService);

  session: CoachSession | null = null;
  loading = true;
  errorMessage = '';
  actionNotice = '';
  liked = false;
  notes = '';
  savedNotes = false;
  savingNotes = false;
  savingAttendance: Record<number, boolean> = {};
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
      if (!id) { this.loading = false; this.errorMessage = 'Session not found.'; return; }
      this.loading = true;
      this.errorMessage = '';
      this.coachService.getSchedulingSession(id).subscribe({
        next: response => {
          if (!response.success || !response.data) { this.errorMessage = response.message || 'Unable to load this session.'; this.loading = false; return; }
          this.session = this.mapSession(response.data);
          this.notes = this.session.coachNotes || '';
          this.loading = false;
        },
        error: error => { this.errorMessage = error?.error?.message || 'Unable to load this session. Please try again.'; this.loading = false; },
      });
    });
  }

  private mapSession(item: any): CoachSession {
    const startsAt = item.starts_at ? new Date(item.starts_at) : new Date();
    const endsAt = item.ends_at ? new Date(item.ends_at) : startsAt;
    const participants = Array.isArray(item.participants) ? item.participants : [];
    const status = this.statusLabel(item.status);
    return {
      id: String(item.id), source: item.source === 'legacy' ? 'legacy' : 'scheduling',
      name: item.title || 'Coaching Session', sport: item.sport || 'Training', emoji: this.sportEmoji(item.sport), image: 'assets/hero-sports.png',
      studentName: participants.length === 1 ? participants[0]?.name : undefined,
      teamName: participants.length > 1 ? `${participants.length} players` : undefined,
      venue: item.venue || 'Venue pending', address: [item.venue_location, item.court].filter(Boolean).join(' · ') || 'Location pending',
      date: startsAt.toLocaleDateString(), time: `${startsAt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${startsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      duration: this.durationLabel(startsAt, endsAt), type: participants.length === 1 ? 'One-on-One' : 'Group Session', status,
      weather: '', distance: '', earnings: Number(item.price ?? 0), studentsConfirmed: Number(item.confirmed_participants_count ?? 0), studentsTotal: participants.length,
      coachFee: Number(item.coach_fee ?? item.price ?? 0), venueFee: Number(item.venue_fee ?? 0), platformFee: Number(item.platform_fee ?? 0),
      taxAmount: Number(item.tax_amount ?? 0), paymentStatus: 'No payment recorded', description: item.description || '', coachNotes: item.coach_notes || '',
      attendanceSupported: item.attendance_supported !== false && ['confirmed', 'completed', 'scheduled'].includes(item.status),
      students: participants.map((player: any) => ({ id: Number(player.id), name: player.name || 'Player', photo: resolveMediaUrl(player.photo) || '', skill: '', attendance: 0, sessions: 0, attendanceStatus: player.attendance || null })),
      tab: status === 'Completed' ? 'completed' : status === 'Cancelled' ? 'cancelled' : 'upcoming',
    };
  }

  private statusLabel(status: string): CoachSession['status'] {
    if (status === 'completed') return 'Completed';
    if (['cancelled', 'rejected', 'expired'].includes(status)) return 'Cancelled';
    if (['confirmed', 'scheduled'].includes(status)) return 'Confirmed';
    return 'Pending';
  }

  private durationLabel(start: Date, end: Date): string {
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes} min`;
  }

  private sportEmoji(sport: string): string {
    return ({ cricket: '🏏', football: '⚽', badminton: '🏸', tennis: '🎾', basketball: '🏀' } as Record<string, string>)[String(sport || '').toLowerCase()] || '🏅';
  }

  sessionFacts(): Array<{ name: string; label: string; val: string }> {
    if (!this.session) return [];
    return [
      { name: 'location-outline', label: 'Venue', val: this.session.venue },
      { name: 'time-outline', label: 'Date & time', val: this.session.time },
      { name: 'people-outline', label: 'Players', val: String(this.session.students.length) },
      { name: 'hourglass-outline', label: 'Duration', val: this.session.duration },
      { name: 'basketball-outline', label: 'Facility', val: this.session.address },
      { name: 'checkmark-circle-outline', label: 'Confirmed', val: `${this.session.studentsConfirmed}/${this.session.studentsTotal}` },
    ];
  }

  async scrollToAttendance(): Promise<void> {
    const section = this.attendanceSection?.nativeElement;
    const content = this.content;
    if (!section || !content) return;
    const scrollElement = await content.getScrollElement();
    const sectionTop = section.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top + scrollElement.scrollTop;
    await content.scrollToPoint(0, Math.max(0, sectionTop - 12), 350);
  }

  async openAttendance(): Promise<void> {
    this.actionNotice = this.session?.attendanceSupported
      ? ''
      : 'Attendance can be recorded after the venue approves this session.';
    await this.scrollToAttendance();
  }

  navigateToVenue(): void {
    if (!this.session) return;
    const destination = [this.session.venue, this.session.address].filter(Boolean).join(', ');
    if (!destination || this.session.venue.toLowerCase().includes('pending') || this.session.address.toLowerCase().includes('location pending')) {
      this.actionNotice = 'Venue directions are unavailable because this session has no confirmed venue address yet.';
      return;
    }
    this.actionNotice = '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  back() {
    this.router.navigateByUrl('/app/coach/schedule');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  getPresentCount() { return this.session?.students.filter(student => student.attendanceStatus === 'present').length ?? 0; }

  getAttendanceCount() {
    return this.session ? this.session.studentsConfirmed : 0;
  }

  toggleAttendance(id: number) {
    if (!this.session) return;
    const student = this.session.students.find(player => player.id === id);
    if (!student || this.savingAttendance[id]) return;
    const previous = student.attendanceStatus;
    const status = previous === 'present' ? 'absent' : 'present';
    student.attendanceStatus = status;
    this.savingAttendance[id] = true;
    this.coachService.saveSchedulingAttendance(this.session.id, id, status).subscribe({
      next: () => { this.savingAttendance[id] = false; },
      error: error => { student.attendanceStatus = previous; this.savingAttendance[id] = false; this.errorMessage = error?.error?.message || 'Attendance could not be saved.'; },
    });
  }

  saveNotes() {
    if (!this.session || this.savingNotes) return;
    this.savingNotes = true;
    this.coachService.saveSchedulingSessionNotes(this.session.id, this.notes).subscribe({
      next: () => { this.savedNotes = true; this.savingNotes = false; },
      error: error => { this.savedNotes = false; this.savingNotes = false; this.errorMessage = error?.error?.message || 'Session notes could not be saved.'; },
    });
  }

  initials(name: string): string { return (name || 'Player').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }

  getSkillColor(skill: string) {
    if (skill === 'Expert') return '#C2410C';
    if (skill === 'Advanced') return '#D97706';
    if (skill === 'Intermediate') return '#1D4ED8';
    return '#16A34A';
  }
}
