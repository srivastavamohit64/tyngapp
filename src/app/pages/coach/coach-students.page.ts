import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { FilterChip, FilterChipsComponent } from '../../shared/components/filter-chips/filter-chips.component';

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
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent, FilterChipsComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell>
      <div class="students-page">
        <!-- Sticky Header -->
        <div class="sticky-header flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
          <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
          <p class="text-[17px] font-black text-[#111827] m-0">My Students</p>
          <button (click)="go('/app/coach/enroll-student')" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="person-add-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
        </div>

        <!-- Search bar -->
        <div class="px-5 pt-4 bg-[#FAFBFC]">
          <div class="flex items-center gap-2 bg-white rounded-2xl px-4 h-12 border border-[#F3F4F6] shadow-sm">
            <ion-icon name="search-outline" class="text-[#9CA3AF] text-lg"></ion-icon>
            <input [(ngModel)]="searchQ" placeholder="Search by name, sport, skill..." class="flex-1 bg-transparent text-[14px] text-[#111827] focus:outline-none min-h-0 border-none" />
            <button class="bg-transparent border-none p-0 flex"><ion-icon name="options-outline" class="text-[#9CA3AF] text-lg"></ion-icon></button>
          </div>
        </div>

        <!-- Filter chips track -->
        <div class="px-5 py-3 bg-[#FAFBFC]">
          <app-filter-chips
            [chips]="filterChips"
            [value]="selectedFilter()"
            (valueChange)="selectedFilter.set($event)"
          ></app-filter-chips>
        </div>

        <!-- Students List -->
        <div class="px-5 pb-32 space-y-3">
          <div *ngIf="filteredStudents().length === 0" class="text-center py-12">
            <p class="text-slate-400 text-sm font-semibold">No students found matching filters.</p>
          </div>

          <div *ngFor="let s of filteredStudents()" (click)="go('/app/coach/student/' + s.id)" class="student-card p-4 flex items-center gap-3 cursor-pointer">
            <img [src]="s.photo" class="w-12 h-12 rounded-full object-cover flex-shrink-0" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="text-[14px] font-bold text-[#111827] m-0 truncate">{{ s.name }}</h3>
                <span class="text-[9px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="getSkillStyle(s.skillLevel).bg"
                  [style.color]="getSkillStyle(s.skillLevel).color">
                  {{ s.skillLevel }}
                </span>
              </div>
              <p class="text-[11px] text-[#9CA3AF] m-0">
                {{ s.emoji }} {{ s.sport }} · {{ s.attendance }}% attendance · last session {{ s.lastSession }}
              </p>
            </div>
            <div class="flex items-center gap-2 flex-shrink-0">
              <button (click)="$event.stopPropagation(); go('/app/chat')" class="w-8 h-8 rounded-full bg-[#FAFBFC] border border-[#F3F4F6] flex items-center justify-center">
                <ion-icon name="chatbubble-ellipses-outline" class="text-slate-600 text-sm"></ion-icon>
              </button>
              <ion-icon name="chevron-forward-outline" class="text-[#D1D5DB]"></ion-icon>
            </div>
          </div>
        </div>
      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .students-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .student-card {
      background: #FFFFFF;
      border-radius: 20px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      border: 1px solid #F3F4F6;
      transition: transform 0.2s;

      &:active {
        transform: scale(0.98);
      }
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }
  `]
})
export class CoachStudentsPage {
  private readonly router = inject(Router);

  searchQ = '';
  selectedFilter = signal('All');

  readonly filterOptions = ['All', 'Active', 'Inactive', 'Beginner', 'Intermediate', 'Advanced', 'Expert'];

  readonly filterChips: FilterChip[] = this.filterOptions.map((f) => ({ id: f, label: f }));

  filteredStudents = computed(() => {
    const query = this.searchQ.toLowerCase().trim();
    const filter = this.selectedFilter();

    return STUDENTS.filter(s => {
      // Search query filter
      const matchesQuery = !query || s.name.toLowerCase().includes(query) || s.sport.toLowerCase().includes(query);

      // Category filter
      let matchesFilter = true;
      if (filter === 'Active') matchesFilter = s.membershipStatus === 'Active';
      else if (filter === 'Inactive') matchesFilter = s.membershipStatus === 'Inactive';
      else if (filter !== 'All') matchesFilter = s.skillLevel === filter;

      return matchesQuery && matchesFilter;
    });
  });

  back() {
    this.router.navigateByUrl('/app/home');
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
