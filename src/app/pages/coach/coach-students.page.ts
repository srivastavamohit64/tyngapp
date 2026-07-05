import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
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
  achievements: string[];
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
    achievements: ['Perfect Attendance', 'Most Improved', 'Consistency Award']
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
    achievements: ['Fast Learner', 'Consistency Award']
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
    achievements: ['Tournament Winner', 'Most Improved', 'Perfect Attendance', 'Team Captain']
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
    achievements: ['Fast Learner']
  },
  {
    id: 5, name: 'Kabir Malhotra', age: 20,
    photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=200&h=200&fit=crop&auto=format',
    cover: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=350&fit=crop&auto=format',
    sport: 'Cricket', emoji: '🏏', skillLevel: 'Advanced',
    sessionsCompleted: 15, attendance: 78,
    trainingFocus: ['🏏 Batting', '🔥 Stamina'],
    lastSession: '1 week ago', coachSince: 'Feb 2024', membershipStatus: 'Inactive',
    stats: { sessions: 15, hours: 22, attendance: 78, improvement: 18, streak: 0, tournamentWins: 1, personalBest: 'Century in Local Match' },
    evaluation: { technique: 8, fitness: 6, gameAwareness: 7, discipline: 6, teamwork: 7, confidence: 8 },
    achievements: ['Consistency Award']
  },
];

@Component({
  selector: 'app-coach-students',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell>
      <div class="students-page">
        <div class="sticky-header">
          <div class="flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
            <button (click)="back()" class="hdr-icon-btn">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <p class="text-[17px] font-black text-[#111827] m-0">My Students</p>
            <div class="flex gap-1">
              <button (click)="searchOpen.set(!searchOpen())" class="hdr-icon-btn hdr-icon-btn--sm">
                <ion-icon [name]="searchOpen() ? 'close-outline' : 'search-outline'" class="text-base text-[#111827]"></ion-icon>
              </button>
              <button class="hdr-icon-btn hdr-icon-btn--sm">
                <ion-icon name="options-outline" class="text-base text-[#111827]"></ion-icon>
              </button>
            </div>
          </div>

          <div *ngIf="searchOpen()" class="search-expand px-4 pb-3 bg-white border-b border-[#F3F4F6]">
            <div class="flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-4 h-10">
              <ion-icon name="search-outline" class="text-[#9CA3AF] text-base"></ion-icon>
              <input [(ngModel)]="searchQ" placeholder="Search students or sports…" class="flex-1 bg-transparent text-[14px] text-[#111827] focus:outline-none min-h-0 border-none" />
            </div>
          </div>

          <div class="filter-track px-5 pb-4 pt-3 bg-white border-b border-[#F3F4F6]">
            <div class="flex gap-2 overflow-x-auto no-scrollbar">
              <button *ngFor="let f of filterOptions" (click)="selectedFilter.set(f)"
                class="filter-chip flex-shrink-0"
                [class.filter-chip--active]="selectedFilter() === f">
                {{ f }}
              </button>
            </div>
          </div>
        </div>

        <div class="px-4 pt-4 pb-32 space-y-4">
          <div class="overview-card">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[14px] font-black text-[#111827] m-0">Student Overview</p>
              <span class="text-[11px] font-semibold text-[#9CA3AF]">{{ students.length }} total</span>
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let m of overviewMetrics()" class="metric-tile"
                [style.backgroundColor]="m.accent + '10'" [style.border]="'1.5px solid ' + m.accent + '22'">
                <div class="metric-orb" [style.backgroundColor]="m.accent"></div>
                <span class="text-xl">{{ m.emoji }}</span>
                <p class="text-[20px] font-black text-[#111827] mt-1 mb-0">{{ m.value }}</p>
                <p class="text-[10px] text-[#6B7280] mt-0.5">{{ m.label }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="filteredStudents().length === 0" class="empty-state">
            <div class="text-6xl mb-3">👥</div>
            <p class="text-[18px] font-black text-[#111827] mb-2">Your coaching journey starts here.</p>
            <p class="text-[13px] text-[#9CA3AF] mb-6">Students will appear once they join your sessions.</p>
            <button (click)="go('/app/coach/enroll-student')" class="invite-btn">Invite Students</button>
          </div>

          <div *ngFor="let s of filteredStudents(); let i = index" class="student-card">
            <div class="relative h-[120px] overflow-hidden bg-slate-200">
              <img [src]="s.cover" [alt]="s.name" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
              <span class="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full"
                [style.backgroundColor]="s.membershipStatus === 'Active' ? '#F0FDF4' : '#FEF2F2'"
                [style.color]="s.membershipStatus === 'Active' ? '#16A34A' : '#DC2626'">
                {{ s.membershipStatus }}
              </span>
              <div class="absolute bottom-3 left-3">
                <span class="text-[11px] font-bold bg-black/50 backdrop-blur-sm text-white px-2.5 py-1 rounded-full">
                  {{ s.emoji }} {{ s.sport }}
                </span>
              </div>
            </div>
            <div class="px-4 -mt-7 pb-4">
              <div class="flex items-end justify-between mb-3">
                <div class="relative">
                  <img [src]="s.photo" class="w-14 h-14 rounded-2xl border-[3px] border-white object-cover shadow-lg" />
                  <div class="session-badge">{{ s.sessionsCompleted }}</div>
                </div>
                <span class="text-[11px] font-bold px-2.5 py-1 rounded-full"
                  [style.backgroundColor]="getSkillStyle(s.skillLevel).bg"
                  [style.color]="getSkillStyle(s.skillLevel).color">
                  {{ s.skillLevel }}
                </span>
              </div>
              <div class="flex items-baseline gap-2 mb-1">
                <h3 class="text-[16px] font-black text-[#111827] m-0">{{ s.name }}</h3>
                <span class="text-[12px] text-[#9CA3AF]">Age {{ s.age }}</span>
              </div>
              <div class="flex items-center gap-3 text-[11px] text-[#9CA3AF] mb-3">
                <span class="font-semibold text-[#111827]">{{ s.sessionsCompleted }} sessions</span>
                <div class="w-1 h-1 rounded-full bg-[#E5E7EB]"></div>
                <span class="font-semibold" [style.color]="s.attendance >= 90 ? '#16A34A' : s.attendance >= 75 ? '#D97706' : '#DC2626'">
                  {{ s.attendance }}% attendance
                </span>
              </div>
              <div class="flex flex-wrap gap-1.5 mb-3">
                <span *ngFor="let focus of s.trainingFocus" class="focus-chip">{{ focus }}</span>
              </div>
              <div class="flex gap-2">
                <button (click)="go('/app/coach/chat')" class="chat-btn">
                  <ion-icon name="chatbubble-ellipses-outline"></ion-icon>
                </button>
                <button (click)="go('/app/coach/student/' + s.id)" class="profile-btn">
                  View Profile <ion-icon name="chevron-forward-outline"></ion-icon>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .students-page { background: #FAFBFC; min-height: 100%; }
    .sticky-header { position: sticky; top: 0; z-index: 30; }
    .hdr-icon-btn {
      width: 40px; height: 40px; border-radius: 12px; background: #F3F4F6; border: none;
      display: flex; align-items: center; justify-content: center;
    }
    .hdr-icon-btn--sm { width: 36px; height: 36px; }
    .filter-track { scrollbar-width: none; }
    .filter-chip {
      padding: 8px 14px; border-radius: 999px; font-size: 12px; font-weight: 700;
      background: #F3F4F6; color: #6B7280; border: none;
    }
    .filter-chip--active {
      background: #8CF000; color: #111827; box-shadow: 0 2px 8px rgba(140,240,0,0.30);
    }
    .overview-card {
      background: white; border-radius: 24px; padding: 20px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    }
    .metric-tile {
      border-radius: 18px; padding: 14px; position: relative; overflow: hidden;
    }
    .metric-orb {
      position: absolute; bottom: -12px; right: -12px; width: 48px; height: 48px;
      border-radius: 50%; opacity: 0.2;
    }
    .student-card {
      background: white; border-radius: 24px; overflow: hidden;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07), 0 1px 4px rgba(0,0,0,0.04);
    }
    .session-badge {
      position: absolute; bottom: -4px; right: -4px; width: 20px; height: 20px;
      border-radius: 50%; background: #8CF000; border: 2px solid white;
      display: flex; align-items: center; justify-content: center;
      font-size: 8px; font-weight: 900; color: #111827;
    }
    .focus-chip {
      font-size: 10px; font-weight: 600; color: #6B7280; background: #F9FAFB;
      padding: 4px 8px; border-radius: 999px;
    }
    .chat-btn {
      width: 36px; height: 36px; border-radius: 12px; border: none;
      background: rgba(56,189,248,0.10); color: #38BDF8;
      display: flex; align-items: center; justify-content: center;
    }
    .profile-btn {
      flex: 1; height: 36px; border-radius: 12px; border: none;
      background: linear-gradient(135deg,#8CF000,#A3E635);
      box-shadow: 0 2px 8px rgba(140,240,0,0.30);
      font-size: 12px; font-weight: 900; color: #111827;
      display: flex; align-items: center; justify-content: center; gap: 4px;
    }
    .empty-state { text-align: center; padding: 48px 16px; }
    .invite-btn {
      height: 48px; padding: 0 28px; border-radius: 999px; border: none;
      background: linear-gradient(135deg,#8CF000,#A3E635);
      box-shadow: 0 4px 16px rgba(140,240,0,0.40);
      font-size: 14px; font-weight: 900; color: #111827;
    }
    .no-scrollbar { scrollbar-width: none; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
  `]
})
export class CoachStudentsPage {
  private readonly router = inject(Router);

  searchQ = '';
  searchOpen = signal(false);
  selectedFilter = signal('All');
  readonly students = STUDENTS;

  readonly filterOptions = ['All', 'Active', 'Inactive', 'Recently Added', 'Beginner', 'Intermediate', 'Advanced'];

  readonly overviewMetrics = computed(() => {
    const active = STUDENTS.filter((s) => s.membershipStatus === 'Active').length;
    const avgAttendance = Math.round(STUDENTS.reduce((sum, s) => sum + s.attendance, 0) / STUDENTS.length);
    const avgRating = (
      STUDENTS.reduce((sum, s) => sum + Object.values(s.evaluation).reduce((a, b) => a + b, 0) / 6, 0) / STUDENTS.length
    ).toFixed(1);
    return [
      { emoji: '👥', label: 'Active Students', value: String(active), accent: '#8CF000' },
      { emoji: '⭐', label: 'Average Rating', value: avgRating, accent: '#F59E0B' },
      { emoji: '✅', label: 'Average Attendance', value: `${avgAttendance}%`, accent: '#38BDF8' },
      { emoji: '📈', label: 'Monthly Growth', value: '+2 Students', accent: '#FF7A00' },
    ];
  });

  filteredStudents = computed(() => {
    const query = this.searchQ.toLowerCase().trim();
    const filter = this.selectedFilter();
    let result = [...STUDENTS];

    if (query) {
      result = result.filter((s) => s.name.toLowerCase().includes(query) || s.sport.toLowerCase().includes(query));
    }
    if (filter === 'Active') result = result.filter((s) => s.membershipStatus === 'Active');
    else if (filter === 'Inactive') result = result.filter((s) => s.membershipStatus === 'Inactive');
    else if (filter === 'Recently Added') result = result.sort((a, b) => b.id - a.id);
    else if (['Beginner', 'Intermediate', 'Advanced'].includes(filter)) {
      result = result.filter((s) => s.skillLevel === filter);
    }
    return result;
  });

  back() {
    this.router.navigateByUrl('/app/coach/dashboard');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  getSkillStyle(level: string) {
    if (level === 'Expert') return { bg: '#FFF7ED', color: '#C2410C' };
    if (level === 'Advanced') return { bg: '#FFFBEB', color: '#D97706' };
    if (level === 'Intermediate') return { bg: '#EFF6FF', color: '#1D4ED8' };
    return { bg: '#F0FDF4', color: '#16A34A' };
  }
}
