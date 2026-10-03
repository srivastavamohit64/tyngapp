import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackNavigationService } from '../../core/services/back-navigation.service';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CoachService } from '../../core/services/coach.service';
import { ChatService } from '../../core/services/chat.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { PageSkeletonComponent } from '../../shared/components/skeleton';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

interface Student {
  id: number;
  name: string;
  age: number;
  photo: string;
  cover: string;
  sport: string;
  emoji: string;
  skillLevel: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  sessionsCompleted: number;
  trainingFocus: string[];
  lastSession: string;
  coachSince: string;
  membershipStatus: 'Active' | 'Inactive';
  stats: {
    sessions: number;
    hours: number;
    attendance: number | null;
    improvement: number | null;
    streak: number;
  };
  evaluation: {
    technique: number;
    fitness: number;
    gameAwareness: number;
    discipline: number;
    teamwork: number;
    confidence: number;
  };
  notes: { text: string; date: string }[];
  achievements: any[];
  timeline: { icon: string; text: string; date: string; done: boolean }[];
  managedProfile?: any;
  upcomingSession?: { id: string; title: string; venue: string; date: string; time: string; pending: boolean };
  attendanceSessionId: string | null;
}

const FOCUS_AREAS = [
  { id: 'serving', emoji: '🎯', label: 'Serving' },
  { id: 'footwork', emoji: '🏃', label: 'Footwork' },
  { id: 'fitness', emoji: '💪', label: 'Fitness' },
  { id: 'awareness', emoji: '🧠', label: 'Game Awareness' },
  { id: 'accuracy', emoji: '🎯', label: 'Accuracy' },
  { id: 'speed', emoji: '⚡', label: 'Speed' },
  { id: 'teamwork', emoji: '🤝', label: 'Teamwork' },
  { id: 'defence', emoji: '🛡️', label: 'Defence' },
  { id: 'stamina', emoji: '🔥', label: 'Stamina' },
  { id: 'backhand', emoji: '🎾', label: 'Backhand' },
  { id: 'batting', emoji: '🏏', label: 'Batting' },
  { id: 'goalkeeping', emoji: '🥅', label: 'Goalkeeping' },
];

const ACHIEVEMENT_COLORS: Record<string, { bg: string; color: string }> = {
  'Perfect Attendance': { bg: '#F0FDF4', color: '#16A34A' },
  'Most Improved': { bg: '#FFFBEB', color: '#D97706' },
  'Tournament Winner': { bg: '#FFF7ED', color: '#C2410C' },
  'Fast Learner': { bg: '#EFF6FF', color: '#1D4ED8' },
  'Team Captain': { bg: '#F5F3FF', color: '#7C3AED' },
  'Consistency Award': { bg: '#F0FDF4', color: '#16A34A' },
};

@Component({
  selector: 'app-coach-student-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, PageSkeletonComponent, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-brand-header-shell title="Student Profile" (back)="back()">
      <div *ngIf="!student" class="student-profile-loading">
        <app-page-skeleton *ngIf="loading" variant="detail" label="Loading student profile"></app-page-skeleton>
        <div *ngIf="!loading && loadError" class="sp-error" role="alert">
          <p>{{ loadError }}</p>
          <button type="button" (click)="loadStudent(studentId)">Try again</button>
        </div>
      </div>
      <div *ngIf="student" class="student-profile-page pb-40">
        <!-- Hero Cover image -->
        <div class="relative h-[32vh] min-h-[220px] overflow-hidden bg-gray-900">
          <img [src]="student.cover" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#FAFBFC]"></div>

        </div>

        <!-- Student Title details card overlay -->
        <div class="px-5 -mt-14 relative z-10">
          <div class="flex items-end gap-4 mb-4">
            <div class="relative">
              <div class="w-[88px] h-[88px] rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                <img [src]="student.photo" class="w-full h-full object-cover" />
              </div>
              <span class="absolute -bottom-1.5 -right-1.5 text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white"
                [style.backgroundColor]="getSkillStyle(student.skillLevel).bg"
                [style.color]="getSkillStyle(student.skillLevel).color">
                {{ student.skillLevel }}
              </span>
            </div>
            <div class="pb-1">
              <h1 class="text-[22px] font-black text-[#111827] m-0">{{ student.name }}</h1>
              <p class="text-[13px] text-[#9CA3AF] m-0 capitalize"><ng-container *ngIf="student.age > 0">Age {{ student.age }} · </ng-container>{{ student.sport }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[11px] font-bold px-2.5 py-0.5 rounded-full"
                  [style.backgroundColor]="student.membershipStatus === 'Active' ? '#F0FDF4' : '#F3F4F6'"
                  [style.color]="student.membershipStatus === 'Active' ? '#16A34A' : '#6B7280'">
                  {{ student.membershipStatus }}
                </span>
                <span *ngIf="student.coachSince" class="text-[11px] text-[#9CA3AF]">Coaching since {{ formatDate(student.coachSince) }}</span>
              </div>
            </div>
          </div>

          <!-- Quick statistics row -->
          <div class="grid grid-cols-3 gap-3 mb-5">
            <div *ngFor="let s of [{ label:'Attendance', val: student.stats.attendance === null ? '—' : student.stats.attendance + '%', color:'#16A34A' }, { label:'Rating', val: getOverallRating(), color:'#D97706' }, { label:'Completed', val: student.sessionsCompleted, color:'#1D4ED8' }]"
              class="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p class="text-[20px] font-black m-0" [style.color]="s.color">{{ s.val }}</p>
              <p class="text-[10px] text-[#9CA3AF] mt-0.5 m-0 font-bold">{{ s.label }}</p>
            </div>
          </div>
        </div>

        <div class="px-5 space-y-4">
          <div *ngIf="student.managedProfile as profile" class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Managed Profile Details</p>
            <div class="grid grid-cols-2 gap-3">
              <div class="rounded-2xl bg-[#F9FAFB] p-3"><span class="text-[10px] text-[#98A2B3]">Guardian</span><p class="text-[12px] font-bold m-0 mt-1">{{ profile.guardian_name || 'Not set' }}</p></div>
              <div class="rounded-2xl bg-[#F9FAFB] p-3"><span class="text-[10px] text-[#98A2B3]">Contact</span><p class="text-[12px] font-bold m-0 mt-1">{{ profile.guardian_phone || 'Not set' }}</p></div>
              <div class="rounded-2xl bg-[#F9FAFB] p-3"><span class="text-[10px] text-[#98A2B3]">Membership</span><p class="text-[12px] font-bold m-0 mt-1">{{ profile.membership_type || 'Not set' }}</p></div>
              <div class="rounded-2xl bg-[#F9FAFB] p-3"><span class="text-[10px] text-[#98A2B3]">Batch</span><p class="text-[12px] font-bold m-0 mt-1">{{ profile.batch_session?.title || 'No batch' }}</p></div>
            </div>
            <div *ngIf="profile.medical_conditions || profile.current_injuries || profile.allergies?.length" class="mt-3 rounded-2xl bg-[#FFF7ED] p-3">
              <p class="text-[10px] font-black text-[#C2410C] uppercase tracking-wider m-0 mb-1">Safety information</p>
              <p class="text-[11px] text-[#7C2D12] m-0 leading-relaxed">{{ managedSafety(profile) }}</p>
            </div>
          </div>

          <!-- Metrics dashboard cards -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Performance Dashboard</p>
            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let m of getMetricsList()" class="rounded-[18px] p-3.5 relative overflow-hidden"
                [style.backgroundColor]="m.accent + '10'" [style.border]="'1.5px solid ' + m.accent + '20'">
                <div class="absolute -bottom-3 -right-3 w-10 h-10 rounded-full opacity-20" [style.backgroundColor]="m.accent"></div>
                <div class="relative">
                  <span class="text-lg">{{ m.emoji }}</span>
                  <p class="text-[15px] font-black text-[#111827] mt-0.5 leading-tight m-0">{{ m.value }}</p>
                  <p class="text-[10px] text-[#6B7280] mt-0.5 m-0 font-semibold">{{ m.label }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Set Training Focus -->
          <div class="bg-white rounded-[24px] p-5 shadow-md border border-[var(--app-primary)]/20">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-1 m-0">Current Training Focus</p>
            <p class="text-[12px] text-[#9CA3AF] mb-4 m-0">Set goals for the student's next coaching session.</p>

            <div class="flex flex-wrap gap-2 mb-4">
              <button *ngFor="let f of focusAreas" (click)="toggleFocus(f.id)"
                class="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[12px] font-semibold transition-all border-none"
                [style.backgroundColor]="selectedFocus.includes(f.id) ? 'rgba(var(--app-primary-rgb),0.12)' : '#F3F4F6'"
                [style.color]="selectedFocus.includes(f.id) ? '#111827' : '#6B7280'"
                [style.border]="selectedFocus.includes(f.id) ? '2px solid var(--app-primary)' : '2px solid transparent'">
                <ion-icon [name]="getFocusIcon(f.id)" class="text-sm"></ion-icon>{{ f.label }}
                <ion-icon *ngIf="selectedFocus.includes(f.id)" name="checkmark-outline" class="text-[#16A34A] text-xs font-bold"></ion-icon>
              </button>
            </div>

            <!-- List items of selected -->
            <div *ngIf="selectedFocus.length > 0" class="bg-[#F9FAFB] rounded-2xl px-4 py-3.5 mb-3 border border-slate-100">
              <p class="text-[11px] font-black text-[#9CA3AF] uppercase tracking-wider mb-2 m-0">Focus for Next Session</p>
              <div class="space-y-1.5">
                <div *ngFor="let fid of selectedFocus" class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-[var(--app-primary)]"></div>
                  <ion-icon [name]="getFocusIcon(fid)" class="text-[var(--app-primary)]"></ion-icon>
                  <p class="text-[13px] text-[#111827] font-bold m-0">{{ getFocusLabel(fid) }}</p>
                </div>
              </div>
            </div>

            <button (click)="saveFocus()" class="w-full h-11 rounded-2xl text-[14px] font-black btn-green-gradient border-none">
              {{ focusSaved ? '✓ Training Focus Updated' : 'Update Training Focus' }}
            </button>
          </div>

          <!-- Evaluation inputs sliders -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Skill Evaluation</p>
            <div class="space-y-4 mb-4">
              <div *ngFor="let key of ['technique', 'fitness', 'gameAwareness', 'discipline', 'teamwork', 'confidence']">
                <div class="flex items-center justify-between mb-1.5">
                  <span class="text-[13px] font-bold text-[#111827]">{{ getSkillLabel(key) }}</span>
                  <span class="text-[13px] font-black text-[var(--app-primary)]">{{ evaluation[key] }}/10</span>
                </div>
                <input type="range" min="1" max="10" [(ngModel)]="evaluation[key]" (input)="evalSaved = false" [attr.aria-label]="getSkillLabel(key)" class="w-full range-slider" />
              </div>
            </div>

            <div class="bg-[#111827] rounded-2xl px-5 py-4 flex items-center justify-between mb-4">
              <div>
                <p class="text-[11px] text-white/50 uppercase tracking-wider m-0">Overall Rating</p>
                <p class="text-[30px] font-black text-[var(--app-primary)] leading-none mt-0.5 m-0">{{ getOverallRating() }}</p>
              </div>
              <div class="flex gap-0.5">
                <ion-icon *ngFor="let s of [1,2,3,4,5]" name="star" [class.text-[#F59E0B]]="getOverallRatingNum() >= s*2" class="text-slate-600 text-sm"></ion-icon>
              </div>
            </div>

            <button (click)="saveEvaluation()" class="w-full h-11 rounded-2xl text-[14px] font-black btn-orange-gradient border-none">
              {{ evalSaved ? '✓ Evaluation Saved' : 'Save Evaluation' }}
            </button>
          </div>

          <!-- Notes section -->
          <div class="section-card p-5 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Coach Notes (Private)</p>
            <div class="mb-5">
              <textarea [(ngModel)]="newNote" placeholder="Add a private note about this student..." rows="2"
                class="w-full min-h-[96px] p-4 rounded-2xl text-[14px] text-[#111827] placeholder:text-[#AAB3C2] focus:outline-none focus:ring-2 focus:ring-[var(--app-primary)]/35 resize-none mb-3 border border-slate-200 bg-[#FAFBFC]"></textarea>
              <button (click)="addNote()" [disabled]="!newNote.trim()" class="note-add-button flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[13px] font-black border-none"
                [style.backgroundColor]="newNote.trim() ? 'var(--app-primary)' : '#F3F4F6'"
                [style.color]="newNote.trim() ? '#111827' : '#C4C9D4'">
                <ion-icon name="add-outline"></ion-icon>Add Note
              </button>
            </div>

            <div class="space-y-3">
              <div *ngFor="let note of (notesExpanded ? notes : notes.slice(0, 2))" class="note-card bg-[#F9FAFB] rounded-2xl px-4 py-3.5 border border-slate-100">
                <p class="text-[13px] text-[#111827] leading-relaxed mb-2 m-0">{{ note.text }}</p>
                <p class="flex items-center gap-1.5 text-[10px] text-[#7C8798] m-0 font-bold">
                  <ion-icon name="time-outline"></ion-icon>{{ formatNoteDate(note.date) }}
                </p>
              </div>
              <button *ngIf="notes.length > 2" (click)="notesExpanded = !notesExpanded" class="w-full flex items-center justify-center gap-1 text-[12px] font-bold text-[var(--app-primary)] py-1 bg-transparent border-none">
                <ion-icon [name]="notesExpanded ? 'chevron-up-outline' : 'chevron-down-outline'"></ion-icon>
                {{ notesExpanded ? 'Show Less' : 'Show ' + (notes.length - 2) + ' More' }}
              </button>
            </div>
          </div>

          <!-- Timeline -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Progress Timeline</p>
            <div class="relative pl-6">
              <div class="absolute left-2 top-2 bottom-2 w-px bg-[#F3F4F6]"></div>
              <div class="space-y-4">
                <div *ngFor="let t of student.timeline" class="relative flex items-start gap-3">
                  <div class="absolute -left-7 top-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[10px]"
                    [style.backgroundColor]="t.done ? 'var(--app-primary)' : '#E5E7EB'">
                    <ion-icon *ngIf="t.done" name="checkmark-outline" style="font-size:8px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                  <div class="text-left">
                    <p class="text-[13px] font-bold text-[#111827] m-0 flex items-center gap-2"><ion-icon [name]="t.icon"></ion-icon>{{ t.text }}</p>
                    <p class="text-[10px] text-[#9CA3AF] m-0">{{ formatDate(t.date) }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Achievements -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Achievements</p>
            <div class="flex flex-wrap gap-2">
              <div *ngFor="let a of student.achievements" class="achievement-badge flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-bold"
                [style.backgroundColor]="getAchievementStyle(a).bg"
                [style.color]="getAchievementStyle(a).color">
                <ion-icon [name]="a.icon"></ion-icon> {{ a.label }}
              </div>
            </div>
          </div>

          <!-- Upcoming Session -->
          <div *ngIf="student.upcomingSession" class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Upcoming Session</p>
            <div class="bg-[#F9FAFB] rounded-2xl p-4 border border-slate-100 text-left">
              <div class="flex items-center justify-between mb-3">
                <div class="min-w-0">
                  <p class="text-[15px] font-black text-[#111827] m-0">{{ student.upcomingSession.date }} · {{ student.upcomingSession.time }}</p>
                  <p class="text-[12px] text-[#9CA3AF] m-0 truncate">{{ student.upcomingSession.title }}<ng-container *ngIf="student.upcomingSession.venue"> · {{ student.upcomingSession.venue }}</ng-container></p>
                </div>
                <span *ngIf="student.upcomingSession.pending" class="text-[10px] font-bold px-2 py-1 rounded-full bg-[#FFFBEB] text-[#D97706] flex-shrink-0">Awaiting venue</span>
              </div>
              <div *ngIf="selectedFocus.length" class="flex flex-wrap gap-1.5 mb-3">
                <span *ngFor="let f of selectedFocus" class="text-[10px] font-bold bg-[var(--app-primary)]/12 text-[#111827] px-2 py-1 rounded-full border border-[var(--app-primary)]/25">{{ getFocusLabel(f) }}</span>
              </div>
              <button (click)="go('/app/coach/session/' + student.upcomingSession.id)" class="w-full h-10 rounded-xl text-[13px] font-black btn-green-gradient border-none text-[#111827] flex items-center justify-center gap-1">
                View Session
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Sticky Quick actions footer -->
      <div class="fixed-bottom-bar bg-white px-4 pt-3 pb-8">
        <div class="grid grid-cols-4 gap-2">
          <button (click)="go('/app/coach/evaluate')" class="quick-action-btn" style="background-color:rgba(var(--app-primary-rgb),0.08);color:var(--app-primary);">
            <ion-icon name="list-outline"></ion-icon>
            <span>Evaluate</span>
          </button>
          <button (click)="openStudentChat()" class="quick-action-btn" style="background-color:rgba(56,189,248,0.08);color:#38BDF8;">
            <ion-icon name="chatbubbles-outline"></ion-icon>
            <span>Message</span>
          </button>
          <button (click)="go('/app/coach/schedule')" class="quick-action-btn" style="background-color:rgba(255,122,0,0.08);color:#FF7A00;">
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Schedule</span>
          </button>
          <button (click)="openAttendance()" class="quick-action-btn" style="background-color:rgba(124,58,237,0.08);color:#7C3AED;">
            <ion-icon name="checkmark-done-outline"></ion-icon>
            <span>Attendance</span>
          </button>
        </div>
        <p *ngIf="saveError" class="text-center text-xs text-[#B42318] mt-2 mb-0" role="alert">{{ saveError }}</p>
      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .student-profile-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .section-card {
      background: #FFFFFF;
      border-radius: 24px;
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.06);
      border: 1px solid #F3F4F6;
    }

    .note-add-button {
      box-shadow: 0 4px 12px rgba(var(--app-primary-rgb), 0.22);
    }

    .note-add-button:disabled {
      box-shadow: none;
    }

    .note-card {
      border-left: 3px solid var(--app-primary);
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      box-shadow: 0 4px 16px rgba(var(--app-primary-rgb),0.30);
      color: #111827;
    }

    .btn-orange-gradient {
      background: linear-gradient(135deg, #FF7A00, #FF9A40);
      box-shadow: 0 4px 16px rgba(255, 122, 0, 0.35);
      color: #FFFFFF;
    }

    /* Range slider custom */
    .range-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background: #E5E7EB;
      outline: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: var(--app-primary);
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
    }

    .fixed-bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 20;
      max-width: 440px;
      margin: 0 auto;
      border-top: 1px solid #F3F4F6;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.09);
    }

    .quick-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 10px 0;
      border-radius: 18px;
      font-size: 10px;
      font-weight: 700;
      border: none;
      cursor: pointer;

      ion-icon {
        font-size: 20px;
      }
    }

    .student-profile-loading { padding: 12px 16px 24px; }
    .sp-error { padding: 40px 12px; text-align: center; color: #6b7280; font-size: 14px; }
    .sp-error button { margin-top: 12px; height: 40px; padding: 0 18px; border: 0; border-radius: 12px; background: var(--app-primary); color: #111827; font-weight: 800; }
  `]
})
export class CoachStudentProfilePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly backNavigation = inject(BackNavigationService);
  private readonly coach = inject(CoachService);
  private readonly chat = inject(ChatService);

  student: Student | null = null;
  loading = true;
  loadError = '';
  studentId = 0;

  selectedFocus: string[] = [];
  evaluation: any = { technique: 5, fitness: 5, gameAwareness: 5, discipline: 5, teamwork: 5, confidence: 5 };
  evalSaved = false;
  focusSaved = false;
  saveError = '';
  newNote = '';
  notes: { text: string; date: string }[] = [];
  notesExpanded = false;

  readonly focusAreas = FOCUS_AREAS;

  ngOnInit() {
    this.route.paramMap.subscribe(params => this.loadStudent(Number(params.get('id'))));
  }

  loadStudent(id: number) {
    this.studentId = id;
    this.student = null;
    this.loading = true;
    this.loadError = '';
    this.coach.getStudent(id).subscribe({ next: (response) => {
      this.loading = false;
      const data: any = response.data;
      const relation = data?.relationship;
      const managedProfile = relation?.profile;
      const player = relation?.student || {};
      const sessions = data?.sessions || [];
      const stats = data?.stats || {};
      const upcoming = data?.upcoming_session;
      const upcomingStart = upcoming?.starts_at ? new Date(upcoming.starts_at) : null;
      const needsAttendance = sessions.find((session: any) => session.state === 'awaiting_completion' && !session.attendance)
        || sessions.find((session: any) => session.state === 'awaiting_completion');
      const evaluations = data?.evaluations || [];
      const latest = evaluations[0] || {};
      const skillRatings = latest.skill_ratings || {};
      this.student = {
        id: Number(player.id || id), name: player.name || 'Student', age: this.ageFromDob(player.dob),
        photo: resolveMediaUrl(player.profile_image) || 'assets/icon/favicon.png', cover: resolveMediaUrl(player.cover_image) || resolveMediaUrl(player.profile_image) || 'assets/icon/favicon.png', sport: (player.sports || ['Coaching'])[0], emoji: '',
        skillLevel: managedProfile?.skill_level || 'Beginner', sessionsCompleted: Number(stats.completed_sessions ?? 0),
        trainingFocus: relation?.training_focus || [], lastSession: stats.last_session_at || '', coachSince: relation?.enrolled_at || '', membershipStatus: relation?.status === 'active' ? 'Active' : 'Inactive', managedProfile,
        stats: {
          sessions: Number(stats.sessions ?? sessions.length),
          hours: Number(stats.hours ?? 0),
          attendance: stats.attendance_rate ?? null,
          improvement: stats.improvement ?? null,
          streak: Number(stats.streak ?? 0),
        },
        upcomingSession: upcoming && upcomingStart ? {
          id: String(upcoming.id),
          title: upcoming.title || 'Coaching session',
          venue: upcoming.venue || '',
          date: this.relativeDay(upcomingStart),
          time: upcomingStart.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
          pending: upcoming.status === 'pending_venue_approval',
        } : undefined,
        attendanceSessionId: needsAttendance?.id ? String(needsAttendance.id) : (upcoming?.id ? String(upcoming.id) : null),
        evaluation: { technique: skillRatings.technique || latest.rating || 5, fitness: skillRatings.fitness || latest.rating || 5, gameAwareness: skillRatings.gameAwareness || latest.rating || 5, discipline: skillRatings.discipline || latest.rating || 5, teamwork: skillRatings.teamwork || latest.rating || 5, confidence: skillRatings.confidence || latest.rating || 5 },
        notes: (data?.notes || []).map((n: any) => ({ text: n.note, date: n.created_at || '' })), achievements: data?.achievements || [], timeline: data?.timeline || [],
      };
      if (this.student) {
        this.evaluation = { ...this.student.evaluation };
        this.notes = [...this.student.notes];
        this.selectedFocus = [...this.student.trainingFocus];
      }
    }, error: () => {
      this.student = null;
      this.loading = false;
      this.loadError = 'This student could not be loaded. Check your connection and try again.';
    } });
  }

  back() {
    this.backNavigation.back('/app/coach/students');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  async openStudentChat() {
    if (!this.student) return;
    const result = await this.chat.openPrivate({ id: this.student.id, name: this.student.name, avatar: this.student.photo });
    if (result.success && result.data?.id) {
      void this.router.navigateByUrl(`/app/coach/chat/${encodeURIComponent(result.data.id)}`);
      return;
    }
    this.saveError = result.message || 'Unable to open chat.';
  }

  getOverallRating(): string {
    const vals = Object.values(this.evaluation) as number[];
    return (vals.reduce((a, b) => a + b, 0) / 6).toFixed(1);
  }

  getOverallRatingNum(): number {
    return Number(this.getOverallRating());
  }

  getSkillStyle(level: string) {
    if (level === 'Expert') return { bg: '#FFF7ED', color: '#C2410C' };
    if (level === 'Advanced') return { bg: '#FFFBEB', color: '#D97706' };
    if (level === 'Intermediate') return { bg: '#EFF6FF', color: '#1D4ED8' };
    return { bg: '#F0FDF4', color: '#16A34A' };
  }

  ageFromDob(value: string | null | undefined): number {
    if (!value) return 0;
    const dob = new Date(value);
    if (Number.isNaN(dob.getTime())) return 0;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    if (today.getMonth() < dob.getMonth() || (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate())) age--;
    return Math.max(age, 0);
  }

  managedSafety(profile: any): string {
    const values = [
      profile.allergies?.length ? 'Allergies: ' + profile.allergies.join(', ') : null,
      profile.medical_conditions ? 'Conditions: ' + profile.medical_conditions : null,
      profile.current_injuries ? 'Injuries: ' + profile.current_injuries : null,
    ];
    return values.filter(Boolean).join(' · ');
  }

  getSkillLabel(key: string): string {
    const labels: Record<string, string> = {
      technique: 'Technique', fitness: 'Fitness', gameAwareness: 'Game Awareness',
      discipline: 'Discipline', teamwork: 'Teamwork', confidence: 'Confidence'
    };
    return labels[key] ?? key;
  }

  getAchievementStyle(a: string | { label: string }) {
    const label = typeof a === 'string' ? a : (a as any).label;
    return ACHIEVEMENT_COLORS[label] ?? { bg: '#F3F4F6', color: '#6B7280' };
  }

  getMetricsList() {
    if (!this.student) return [];
    return [
      { emoji: '📅', label: 'Sessions', value: String(this.student.stats.sessions), accent: 'var(--app-primary)' },
      { emoji: '⏱', label: 'Training Hours', value: `${this.student.stats.hours}h`, accent: '#FF7A00' },
      { emoji: '✅', label: 'Attendance', value: this.student.stats.attendance === null ? '—' : `${this.student.stats.attendance}%`, accent: '#38BDF8' },
      { emoji: '📈', label: 'Improvement', value: this.formatImprovement(this.student.stats.improvement), accent: '#22C55E' },
      { emoji: '🔥', label: 'Streak', value: `${this.student.stats.streak} ${this.student.stats.streak === 1 ? 'session' : 'sessions'}`, accent: '#EF4444' },
      { emoji: '🎯', label: 'Completed', value: String(this.student.sessionsCompleted), accent: '#7C3AED' },
      { emoji: '🗓', label: 'Last Completed', value: this.student.lastSession ? this.formatDate(this.student.lastSession) : '—', accent: '#1D4ED8' },
      { emoji: '⭐', label: 'Overall Rating', value: this.getOverallRating(), accent: '#F59E0B' },
    ];
  }

  private formatImprovement(value: number | null): string {
    if (value === null || value === undefined) return '—';
    return `${value > 0 ? '+' : ''}${value}%`;
  }

  toggleFocus(id: string) {
    this.selectedFocus = this.selectedFocus.includes(id)
      ? this.selectedFocus.filter(x => x !== id)
      : [...this.selectedFocus, id];
    this.focusSaved = false;
    this.saveFocus();
  }

  getFocusLabel(id: string): string {
    const f = FOCUS_AREAS.find(a => a.id === id);
    return f?.label ?? '';
  }

  getFocusIcon(id: string): string {
    const icons: Record<string, string> = {
      serving: 'locate-outline', footwork: 'walk-outline', fitness: 'fitness-outline', awareness: 'bulb-outline',
      accuracy: 'locate-outline', speed: 'flash-outline', teamwork: 'people-outline', defence: 'shield-outline',
      stamina: 'flame-outline', backhand: 'tennisball-outline', batting: 'baseball-outline', goalkeeping: 'hand-left-outline'
    };
    return icons[id] ?? 'ellipse-outline';
  }

  formatDate(value: string): string {
    if (!value) return 'Date unavailable';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  formatNoteDate(value: string): string {
    if (!value) return 'Just now';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    });
  }

  saveFocus() {
    if (this.student) {
      this.student.trainingFocus = [...this.selectedFocus];
      this.coach.updateStudent(this.student.id, { training_focus: this.selectedFocus }).subscribe({
        next: () => { this.focusSaved = true; this.saveError = ''; },
        error: () => this.saveError = 'Training focus could not be saved.'
      });
    }
  }

  saveEvaluation() {
    if (this.student) {
      const values = Object.values(this.evaluation) as number[];
      this.coach.saveStudentEvaluation(this.student.id, { rating: Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1)), skill_ratings: { ...this.evaluation } }).subscribe({
        next: () => { this.evalSaved = true; this.saveError = ''; this.student!.evaluation = { ...this.evaluation }; },
        error: () => this.saveError = 'Evaluation could not be saved.'
      });
    }
  }

  addNote() {
    if (!this.newNote.trim()) return;
    if (!this.student) return;
    const note = this.newNote.trim();
    this.coach.addStudentNote(this.student.id, note).subscribe({
      next: (response) => {
        const saved = response.data;
        this.notes = [{ text: saved.note, date: saved.created_at }, ...this.notes];
        this.student!.notes = [...this.notes];
        this.newNote = '';
        this.saveError = '';
      },
      error: () => this.saveError = 'Note could not be saved.'
    });
  }

  openAttendance() {
    if (!this.student?.attendanceSessionId) {
      this.saveError = 'There is no current or upcoming session with this student to mark attendance for.';
      return;
    }
    this.saveError = '';
    this.go('/app/coach/session/' + this.student.attendanceSessionId);
  }

  private relativeDay(date: Date): string {
    const today = new Date();
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
    const days = Math.round((startOfDate - startOfToday) / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Tomorrow';
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }
}
