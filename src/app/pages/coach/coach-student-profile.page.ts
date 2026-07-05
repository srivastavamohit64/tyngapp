import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

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
  attendance: number;
  trainingFocus: string[];
  lastSession: string;
  coachSince: string;
  membershipStatus: 'Active' | 'Inactive';
  stats: {
    sessions: number;
    hours: number;
    attendance: number;
    improvement: number;
    streak: number;
    tournamentWins: number;
    personalBest: string;
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
  achievements: string[];
  timeline: { icon: string; text: string; date: string; done: boolean }[];
  upcomingSession?: { venue: string; date: string; time: string; focus: string[]; weather: string };
}

const STUDENTS: Student[] = [
  {
    id: 1, name: 'Rahul Sharma', age: 19,
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&auto=format',
    cover: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=350&fit=crop&auto=format',
    sport: 'Cricket', emoji: '🏏', skillLevel: 'Advanced',
    sessionsCompleted: 18, attendance: 94,
    trainingFocus: ['🏏 Batting', '💪 Fitness', '🧠 Game Awareness'],
    lastSession: '2 days ago', coachSince: 'Jan 2024', membershipStatus: 'Active',
    stats: { sessions: 18, hours: 27, attendance: 94, improvement: 28, streak: 5, tournamentWins: 2, personalBest: 'Top 10 District' },
    evaluation: { technique: 8, fitness: 7, gameAwareness: 8, discipline: 9, teamwork: 7, confidence: 8 },
    notes: [
      { text: 'Excellent attitude during practice. Very coachable.', date: '28 Jun 2025' },
      { text: 'Needs better footwork positioning for defence shots.', date: '20 Jun 2025' },
      { text: 'Ready for district-level trials. Remarkable progress.', date: '10 Jun 2025' },
    ],
    achievements: ['Perfect Attendance', 'Most Improved', 'Consistency Award'],
    timeline: [
      { icon: '✓', text: 'Joined TYNG', date: 'Jan 2024', done: true },
      { icon: '✓', text: 'First Coaching Session', date: 'Jan 2024', done: true },
      { icon: '⭐', text: 'Skill Level Upgraded to Advanced', date: 'Mar 2024', done: true },
      { icon: '🏆', text: 'Won District U-21 Tournament', date: 'May 2024', done: true },
      { icon: '📈', text: 'Personal Best in Batting Average', date: 'Jun 2025', done: true },
    ],
    upcomingSession: { venue: 'Phoenix Arena', date: 'Today', time: '6:00 PM', focus: ['🏏 Batting', '🧠 Game Awareness'], weather: 'Clear ☀️ 28°C' },
  },
  {
    id: 2, name: 'Priya Verma', age: 17,
    photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&h=200&fit=crop&auto=format',
    cover: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=350&fit=crop&auto=format',
    sport: 'Badminton', emoji: '🏸', skillLevel: 'Intermediate',
    sessionsCompleted: 12, attendance: 88,
    trainingFocus: ['🏃 Footwork', '⚡ Speed', '🛡 Defence'],
    lastSession: 'Yesterday', coachSince: 'Mar 2024', membershipStatus: 'Active',
    stats: { sessions: 12, hours: 18, attendance: 88, improvement: 35, streak: 3, tournamentWins: 0, personalBest: 'Fastest Smash Speed' },
    evaluation: { technique: 7, fitness: 8, gameAwareness: 6, discipline: 8, teamwork: 6, confidence: 7 },
    notes: [
      { text: 'Great natural talent. Needs consistent practice on backhand.', date: '25 Jun 2025' },
      { text: 'Attendance improved significantly this month.', date: '15 Jun 2025' },
    ],
    achievements: ['Fast Learner', 'Consistency Award'],
    timeline: [
      { icon: '✓', text: 'Joined TYNG', date: 'Mar 2024', done: true },
      { icon: '✓', text: 'First Coaching Session', date: 'Mar 2024', done: true },
      { icon: '⭐', text: 'Upgraded to Intermediate', date: 'May 2024', done: true },
      { icon: '🏆', text: 'Runner-Up City Tennis League', date: 'Jun 2025', done: true },
    ],
    upcomingSession: { venue: 'Sports Authority Complex', date: 'Tomorrow', time: '5:30 PM', focus: ['🏃 Footwork', '🎾 Backhand'], weather: 'Partly Cloudy ⛅' },
  },
  {
    id: 3, name: 'Vikram Singh', age: 22,
    photo: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=200&h=200&fit=crop&auto=format',
    cover: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=350&fit=crop&auto=format',
    sport: 'Football', emoji: '⚽', skillLevel: 'Expert',
    sessionsCompleted: 34, attendance: 96,
    trainingFocus: ['🥅 Goalkeeping', '🛡 Defence', '🤝 Teamwork'],
    lastSession: 'Today', coachSince: 'Sep 2023', membershipStatus: 'Active',
    stats: { sessions: 34, hours: 51, attendance: 96, improvement: 42, streak: 12, tournamentWins: 4, personalBest: 'District Champion 2024' },
    evaluation: { technique: 9, fitness: 9, gameAwareness: 9, discipline: 10, teamwork: 8, confidence: 9 },
    notes: [
      { text: 'Outstanding dedication. Ready for state-level selection.', date: '26 Jun 2025' },
    ],
    achievements: ['Tournament Winner', 'Most Improved', 'Perfect Attendance', 'Team Captain'],
    timeline: [
      { icon: '✓', text: 'Joined TYNG', date: 'Sep 2023', done: true },
      { icon: '⭐', text: 'Upgraded to Advanced', date: 'Dec 2023', done: true },
      { icon: '⭐', text: 'Upgraded to Expert', date: 'Mar 2024', done: true },
      { icon: '🏆', text: 'Won District Championship', date: 'May 2024', done: true },
      { icon: '📈', text: 'Personal Best — All-time Best Rating', date: 'Jun 2025', done: true },
    ],
    upcomingSession: { venue: 'K.D. Singh Stadium', date: 'Today', time: '7:30 PM', focus: ['🥅 Goalkeeping', '🛡 Defence'], weather: 'Clear ☀️' },
  },
  {
    id: 4, name: 'Ananya Patel', age: 15,
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&auto=format',
    cover: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=700&h=350&fit=crop&auto=format',
    sport: 'Tennis', emoji: '🎾', skillLevel: 'Beginner',
    sessionsCompleted: 6, attendance: 82,
    trainingFocus: ['🎯 Serving', '🎯 Accuracy', '🧠 Game Awareness'],
    lastSession: '3 days ago', coachSince: 'May 2025', membershipStatus: 'Active',
    stats: { sessions: 6, hours: 9, attendance: 82, improvement: 65, streak: 2, tournamentWins: 0, personalBest: 'First Match Win' },
    evaluation: { technique: 5, fitness: 6, gameAwareness: 5, discipline: 7, teamwork: 7, confidence: 6 },
    notes: [
      { text: 'Great potential. Improving rapidly for a beginner.', date: '22 Jun 2025' },
    ],
    achievements: ['Fast Learner'],
    timeline: [
      { icon: '✓', text: 'Joined TYNG', date: 'May 2025', done: true },
      { icon: '✓', text: 'First Coaching Session', date: 'May 2025', done: true },
      { icon: '📈', text: 'First Match Win', date: 'Jun 2025', done: true },
    ],
    upcomingSession: { venue: 'Phoenix Sports Hub', date: 'Wed', time: '4:00 PM', focus: ['🎯 Serving', '🎯 Accuracy'], weather: 'Clear ☀️' },
  },
];

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
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div *ngIf="student" class="student-profile-page pb-40">
        <!-- Hero Cover image -->
        <div class="relative h-[32vh] min-h-[220px] overflow-hidden bg-gray-900">
          <img [src]="student.cover" class="w-full h-full object-cover" />
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
              <p class="text-[13px] text-[#9CA3AF] m-0">Age {{ student.age }} · {{ student.emoji }} {{ student.sport }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-[11px] bg-[#F0FDF4] text-[#16A34A] font-bold px-2.5 py-0.5 rounded-full">
                  {{ student.membershipStatus }}
                </span>
                <span class="text-[11px] text-[#9CA3AF]">Coach since {{ student.coachSince }}</span>
              </div>
            </div>
          </div>

          <!-- Quick statistics row -->
          <div class="grid grid-cols-3 gap-3 mb-5">
            <div *ngFor="let s of [{ label:'Attendance', val: student.attendance + '%', color:'#16A34A' }, { label:'Rating', val: getOverallRating(), color:'#D97706' }, { label:'Sessions', val: student.sessionsCompleted, color:'#1D4ED8' }]"
              class="bg-white rounded-2xl p-3 text-center shadow-sm border border-slate-100">
              <p class="text-[20px] font-black m-0" [style.color]="s.color">{{ s.val }}</p>
              <p class="text-[10px] text-[#9CA3AF] mt-0.5 m-0 font-bold">{{ s.label }}</p>
            </div>
          </div>
        </div>

        <div class="px-5 space-y-4">
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
          <div class="bg-white rounded-[24px] p-5 shadow-md border border-[#8CF000]/20">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-1 m-0">Current Training Focus</p>
            <p class="text-[12px] text-[#9CA3AF] mb-4 m-0">Set goals for the student's next coaching session.</p>

            <div class="flex flex-wrap gap-2 mb-4">
              <button *ngFor="let f of focusAreas" (click)="toggleFocus(f.id)"
                class="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-[12px] font-semibold transition-all border-none"
                [style.backgroundColor]="selectedFocus.includes(f.id) ? 'rgba(140,240,0,0.12)' : '#F3F4F6'"
                [style.color]="selectedFocus.includes(f.id) ? '#111827' : '#6B7280'"
                [style.border]="selectedFocus.includes(f.id) ? '2px solid #8CF000' : '2px solid transparent'">
                <span>{{ f.emoji }}</span>{{ f.label }}
                <ion-icon *ngIf="selectedFocus.includes(f.id)" name="checkmark-outline" class="text-[#16A34A] text-xs font-bold"></ion-icon>
              </button>
            </div>

            <!-- List items of selected -->
            <div *ngIf="selectedFocus.length > 0" class="bg-[#F9FAFB] rounded-2xl px-4 py-3.5 mb-3 border border-slate-100">
              <p class="text-[11px] font-black text-[#9CA3AF] uppercase tracking-wider mb-2 m-0">Focus for Next Session</p>
              <div class="space-y-1.5">
                <div *ngFor="let fid of selectedFocus" class="flex items-center gap-2">
                  <div class="w-1.5 h-1.5 rounded-full bg-[#8CF000]"></div>
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
                  <span class="text-[13px] font-black text-[#8CF000]">{{ evaluation[key] }}/10</span>
                </div>
                <input type="range" min="1" max="10" [(ngModel)]="evaluation[key]" (input)="evalSaved = false" class="w-full range-slider" />
              </div>
            </div>

            <div class="bg-[#111827] rounded-2xl px-5 py-4 flex items-center justify-between mb-4">
              <div>
                <p class="text-[11px] text-white/50 uppercase tracking-wider m-0">Overall Rating</p>
                <p class="text-[30px] font-black text-[#8CF000] leading-none mt-0.5 m-0">{{ getOverallRating() }}</p>
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
            <div class="mb-4">
              <textarea [(ngModel)]="newNote" placeholder="Add a private note about this student..." rows="2"
                class="w-full p-3.5 rounded-2xl text-[13px] text-[#111827] placeholder:text-[#C4C9D4] focus:outline-none resize-none mb-2 border border-slate-100 bg-[#FAFBFC]"></textarea>
              <button (click)="addNote()" [disabled]="!newNote.trim()" class="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-bold border-none"
                [style.backgroundColor]="newNote.trim() ? '#8CF000' : '#F3F4F6'"
                [style.color]="newNote.trim() ? '#111827' : '#C4C9D4'">
                <ion-icon name="add-outline"></ion-icon>Add Note
              </button>
            </div>

            <div class="space-y-3">
              <div *ngFor="let note of (notesExpanded ? notes : notes.slice(0, 2))" class="bg-[#F9FAFB] rounded-2xl px-4 py-3.5 border border-slate-100">
                <p class="text-[13px] text-[#111827] leading-relaxed mb-1 m-0">"{{ note.text }}"</p>
                <p class="text-[10px] text-[#9CA3AF] m-0 font-medium">{{ note.date }}</p>
              </div>
              <button *ngIf="notes.length > 2" (click)="notesExpanded = !notesExpanded" class="w-full flex items-center justify-center gap-1 text-[12px] font-bold text-[#8CF000] py-1 bg-transparent border-none">
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
                    [style.backgroundColor]="t.done ? '#8CF000' : '#E5E7EB'">
                    <ion-icon *ngIf="t.done" name="checkmark-outline" style="font-size:8px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                  <div class="text-left">
                    <p class="text-[13px] font-bold text-[#111827] m-0">{{ t.icon }} {{ t.text }}</p>
                    <p class="text-[10px] text-[#9CA3AF] m-0">{{ t.date }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Achievements -->
          <div class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Achievements</p>
            <div class="flex flex-wrap gap-2">
              <div *ngFor="let a of student.achievements" class="flex items-center gap-1.5 px-3 py-2 rounded-full text-[12px] font-bold"
                [style.backgroundColor]="getAchievementStyle(a).bg"
                [style.color]="getAchievementStyle(a).color">
                🏅 {{ a }}
              </div>
            </div>
          </div>

          <!-- Upcoming Session -->
          <div *ngIf="student.upcomingSession" class="section-card p-5">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Upcoming Session</p>
            <div class="bg-[#F9FAFB] rounded-2xl p-4 border border-slate-100 text-left">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="text-[15px] font-black text-[#111827] m-0">{{ student.upcomingSession.date }} · {{ student.upcomingSession.time }}</p>
                  <p class="text-[12px] text-[#9CA3AF] m-0">{{ student.upcomingSession.venue }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[11px] text-[#9CA3AF] m-0">Weather</p>
                  <p class="text-[12px] font-black text-[#111827] m-0">{{ student.upcomingSession.weather }}</p>
                </div>
              </div>
              <div class="flex flex-wrap gap-1.5 mb-3">
                <span *ngFor="let f of student.upcomingSession.focus" class="text-[10px] font-bold bg-[#8CF000]/12 text-[#111827] px-2 py-1 rounded-full border border-[#8CF000]/25">{{ f }}</span>
              </div>
              <button (click)="go('/app/schedule')" class="w-full h-10 rounded-xl text-[13px] font-black btn-green-gradient border-none text-[#111827] flex items-center justify-center gap-1">
                View Session
              </button>
            </div>
          </div>

        </div>
      </div>

      <!-- Sticky Quick actions footer -->
      <div class="fixed-bottom-bar bg-white px-4 pt-3 pb-8">
        <div class="grid grid-cols-4 gap-2">
          <button (click)="go('/app/coach/evaluate')" class="quick-action-btn" style="background-color:rgba(140,240,0,0.08);color:#8CF000;">
            <ion-icon name="list-outline"></ion-icon>
            <span>Evaluate</span>
          </button>
          <button (click)="go('/app/chat')" class="quick-action-btn" style="background-color:rgba(56,189,248,0.08);color:#38BDF8;">
            <ion-icon name="chatbubbles-outline"></ion-icon>
            <span>Message</span>
          </button>
          <button (click)="go('/app/schedule')" class="quick-action-btn" style="background-color:rgba(255,122,0,0.08);color:#FF7A00;">
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Schedule</span>
          </button>
          <button (click)="openQRScanner()" class="quick-action-btn" style="background-color:rgba(124,58,237,0.08);color:#7C3AED;">
            <ion-icon name="qr-code-outline"></ion-icon>
            <span>Attendance</span>
          </button>
        </div>
      </div>

      <!-- Scan Attendance modal overlay -->
      <div *ngIf="showQR()" class="modal-overlay">
        <div class="modal-backdrop" (click)="showQR.set(false)"></div>
        <div class="modal-content-card bg-white p-6 rounded-[32px] max-w-sm w-full mx-6 relative z-50">
          <div class="w-10 h-1 rounded-full bg-[#E5E7EB] mx-auto mb-5"></div>

          <!-- SUCCESS MARKED STATE -->
          <div *ngIf="scanState() === 'success'" class="flex flex-col items-center text-center">
            <div class="success-circle mb-4">
              <ion-icon name="checkmark-outline" class="text-white text-5xl font-black"></ion-icon>
            </div>
            <p class="text-[20px] font-black text-[#111827] mb-1">Attendance Marked!</p>
            <p class="text-[14px] text-[#9CA3AF] mb-1">{{ student?.name }}</p>
            <p class="text-[12px] text-[#9CA3AF] mb-4">12:30 PM · {{ todayString }}</p>
            <div class="bg-[#F0FDF4] rounded-2xl px-4 py-2.5 w-full border border-[#8CF000]/22">
              <p class="text-[12px] font-semibold text-[#16A34A] text-center m-0">Attendance updated to {{ student ? Math.min(student.attendance + 2, 100) : 96 }}%</p>
            </div>
            <button (click)="closeQRScanner()" class="mt-4 w-full h-11 rounded-2xl text-[14px] font-black btn-green-gradient text-[#111827] border-none">
              Done
            </button>
          </div>

          <!-- READY SCANNING STATE -->
          <div *ngIf="scanState() !== 'success'" class="flex flex-col items-center">
            <p class="text-[18px] font-black text-[#111827] text-center mb-1">Mark Attendance</p>
            <p class="text-[13px] text-[#9CA3AF] text-center mb-5">Scan {{ student?.name }}'s TYNG QR Code</p>

            <!-- Camera scan frame simulation -->
            <div class="relative w-full aspect-square rounded-2xl bg-[#111827] overflow-hidden mb-5 flex items-center justify-center">
              <div *ngIf="scanState() === 'scanning'" class="absolute inset-0 flex items-center justify-center">
                <div class="scanning-laser"></div>
                <p class="relative z-10 text-white text-[13px] font-semibold">Scanning…</p>
              </div>
              <div *ngIf="scanState() === 'ready'" class="flex flex-col items-center gap-3">
                <ion-icon name="camera-outline" class="text-white/30 text-5xl"></ion-icon>
                <p class="text-white/50 text-[13px] font-bold">Tap to start scanning</p>
              </div>

              <!-- Brackets corners visual -->
              <div class="absolute top-3 left-3 w-6 h-6 border-t-4 border-l-4 border-[#8CF000]"></div>
              <div class="absolute top-3 right-3 w-6 h-6 border-t-4 border-r-4 border-[#8CF000]"></div>
              <div class="absolute bottom-3 left-3 w-6 h-6 border-b-4 border-l-4 border-[#8CF000]"></div>
              <div class="absolute bottom-3 right-3 w-6 h-6 border-b-4 border-r-4 border-[#8CF000]"></div>
            </div>

            <button (click)="startScanning()" class="w-full h-12 rounded-2xl text-[15px] font-black btn-green-gradient text-[#111827] border-none">
              {{ scanState() === 'scanning' ? 'Scanning…' : 'Start Scanning' }}
            </button>
          </div>
        </div>
      </div>
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

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000, #A3E635);
      box-shadow: 0 4px 16px rgba(140,240,0,0.30);
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
        background: #8CF000;
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

    /* Modal styles */
    .modal-overlay {
      position: fixed;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 50;
    }

    .modal-backdrop {
      position: absolute;
      inset: 0;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px);
    }

    .modal-content-card {
      box-shadow: 0 20px 60px rgba(0,0,0,0.25);
    }

    .success-circle {
      width: 80px; height: 80px;
      border-radius: 50%;
      background: #8CF000;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 32px rgba(140,240,0,0.45);
    }

    .scanning-laser {
      position: absolute;
      left: 0; right: 0;
      height: 2px;
      background: #8CF000;
      animation: scanLaser 1.8s infinite ease-in-out;
    }

    @keyframes scanLaser {
      0% { top: 10%; }
      50% { top: 90%; }
      100% { top: 10%; }
    }
  `]
})
export class CoachStudentProfilePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  student: Student | null = null;
  liked = false;
  showQR = signal(false);
  scanState = signal<'ready' | 'scanning' | 'success'>('ready');
  todayString = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

  selectedFocus: string[] = [];
  evaluation: any = { technique: 5, fitness: 5, gameAwareness: 5, discipline: 5, teamwork: 5, confidence: 5 };
  evalSaved = false;
  focusSaved = false;
  newNote = '';
  notes: { text: string; date: string }[] = [];
  notesExpanded = false;

  readonly Math = Math;
  readonly focusAreas = FOCUS_AREAS;

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      const match = STUDENTS.find(s => s.id === id) || STUDENTS[0];
      if (match) {
        this.student = JSON.parse(JSON.stringify(match)); // deep copy to allow modifications locally
        if (this.student) {
          this.evaluation = { ...this.student.evaluation };
          this.notes = [...this.student.notes];
          this.selectedFocus = this.student.trainingFocus
            .map(f => FOCUS_AREAS.find(a => f.includes(a.label))?.id ?? '')
            .filter(Boolean);
        }
      }
    });
  }

  back() {
    this.router.navigateByUrl('/app/coach/students');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
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

  getSkillLabel(key: string): string {
    const labels: Record<string, string> = {
      technique: 'Technique', fitness: 'Fitness', gameAwareness: 'Game Awareness',
      discipline: 'Discipline', teamwork: 'Teamwork', confidence: 'Confidence'
    };
    return labels[key] ?? key;
  }

  getAchievementStyle(a: string) {
    return ACHIEVEMENT_COLORS[a] ?? { bg: '#F3F4F6', color: '#6B7280' };
  }

  getMetricsList() {
    if (!this.student) return [];
    return [
      { emoji: '📅', label: 'Sessions', value: String(this.student.stats.sessions), accent: '#8CF000' },
      { emoji: '⏱', label: 'Training Hours', value: `${this.student.stats.hours}h`, accent: '#FF7A00' },
      { emoji: '✅', label: 'Attendance', value: `${this.student.stats.attendance}%`, accent: '#38BDF8' },
      { emoji: '📈', label: 'Improvement', value: `+${this.student.stats.improvement}%`, accent: '#22C55E' },
      { emoji: '🔥', label: 'Streak', value: `${this.student.stats.streak} sessions`, accent: '#EF4444' },
      { emoji: '🏆', label: 'Tournament Wins', value: String(this.student.stats.tournamentWins), accent: '#F59E0B' },
      { emoji: '🎯', label: 'Personal Best', value: this.student.stats.personalBest, accent: '#7C3AED' },
      { emoji: '⭐', label: 'Overall Rating', value: this.getOverallRating(), accent: '#F59E0B' },
    ];
  }

  toggleFocus(id: string) {
    this.selectedFocus = this.selectedFocus.includes(id)
      ? this.selectedFocus.filter(x => x !== id)
      : [...this.selectedFocus, id];
    this.focusSaved = false;
  }

  getFocusLabel(id: string): string {
    const f = FOCUS_AREAS.find(a => a.id === id);
    return f ? `${f.emoji} ${f.label}` : '';
  }

  saveFocus() {
    this.focusSaved = true;
    if (this.student) {
      this.student.trainingFocus = this.selectedFocus.map(id => {
        const f = FOCUS_AREAS.find(a => a.id === id);
        return f ? `${f.emoji} ${f.label}` : '';
      }).filter(Boolean);
    }
  }

  saveEvaluation() {
    this.evalSaved = true;
    if (this.student) {
      this.student.evaluation = { ...this.evaluation };
    }
  }

  addNote() {
    if (!this.newNote.trim()) return;
    this.notes = [
      { text: this.newNote.trim(), date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
      ...this.notes
    ];
    if (this.student) {
      this.student.notes = [...this.notes];
    }
    this.newNote = '';
  }

  openQRScanner() {
    this.scanState.set('ready');
    this.showQR.set(true);
  }

  startScanning() {
    this.scanState.set('scanning');
    setTimeout(() => {
      this.scanState.set('success');
      if (this.student) {
        this.student.attendance = Math.min(this.student.attendance + 2, 100);
      }
    }, 1800);
  }

  closeQRScanner() {
    this.showQR.set(false);
  }
}
