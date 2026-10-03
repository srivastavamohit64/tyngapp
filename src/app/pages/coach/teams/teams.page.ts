import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CoachService, CoachTeam } from '../../../core/services/coach.service';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';
import { SkeletonListComponent } from '../../../shared/components/skeleton';

@Component({
  selector: 'app-coach-teams-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, SkeletonListComponent],
  template: `
    <ion-content fullscreen>
      <app-brand-header-shell title="My Teams">
      <button headerEnd type="button" aria-label="Plan a group session" (click)="planSession()" class="app-header-btn rounded-full bg-primary/20 flex items-center justify-center">
        <ion-icon name="add-outline" class="text-xl text-primary"></ion-icon>
      </button>
      <main class="page-with-tab-bar min-h-full bg-background text-white">
        <section class="px-6 py-6 space-y-4">
          <p class="text-sm text-slate-400 m-0">Groups of students you coach together in the same sessions.</p>

          <app-skeleton-list *ngIf="loading()" [count]="3" avatarSize="44px"></app-skeleton-list>

          <div *ngIf="!loading() && error()" class="bg-card p-5 rounded-xl border border-white/10 text-center">
            <p class="text-sm text-slate-300 m-0 mb-3">{{ error() }}</p>
            <button type="button" (click)="load()" class="h-10 px-5 rounded-lg bg-primary text-black font-bold border-none">Try again</button>
          </div>

          <div *ngIf="!loading() && !error() && !teams().length" class="bg-card p-6 rounded-xl border border-white/10 text-center">
            <ion-icon name="people-outline" class="text-4xl text-primary"></ion-icon>
            <h3 class="font-bold text-lg mt-2 mb-1">No teams yet</h3>
            <p class="text-sm text-slate-400 m-0 mb-4">Plan a session with two or more students and they will appear here as a team.</p>
            <button type="button" (click)="planSession()" class="h-10 px-5 rounded-lg bg-primary text-black font-bold border-none">Plan a group session</button>
          </div>

          <button
            *ngFor="let team of teams()"
            type="button"
            (click)="openTeam(team)"
            class="w-full text-left bg-card p-4 rounded-xl border border-white/10 hover:border-primary transition-all cursor-pointer text-white"
          >
            <div class="flex items-start justify-between mb-4 gap-3">
              <div class="flex-1 min-w-0">
                <h3 class="font-bold text-lg mb-0.5 truncate">{{ team.name }}</h3>
                <div class="text-sm text-slate-400 capitalize truncate">
                  {{ team.sport || 'Coaching' }}<ng-container *ngIf="team.venue_name"> · {{ team.venue_name }}</ng-container>
                </div>
              </div>
              <span class="text-[11px] font-bold px-2 py-0.5 rounded-full"
                [class.bg-primary]="team.status === 'active'" [class.text-black]="team.status === 'active'"
                [class.bg-white/10]="team.status !== 'active'" [class.text-slate-300]="team.status !== 'active'">
                {{ team.status === 'active' ? 'Active' : 'Inactive' }}
              </span>
            </div>

            <div class="flex -space-x-2 mb-4">
              <ng-container *ngFor="let member of team.members.slice(0, 6)">
                <img *ngIf="member.photo; else initials" [src]="member.photo" [alt]="member.name" class="w-8 h-8 rounded-full object-cover border-2 border-black" />
                <ng-template #initials>
                  <span class="w-8 h-8 rounded-full bg-white/15 border-2 border-black flex items-center justify-center text-[11px] font-bold">{{ initial(member.name) }}</span>
                </ng-template>
              </ng-container>
              <span *ngIf="team.members.length > 6" class="w-8 h-8 rounded-full bg-white/15 border-2 border-black flex items-center justify-center text-[11px] font-bold">+{{ team.members.length - 6 }}</span>
            </div>

            <div class="grid grid-cols-3 gap-4 mb-4">
              <div>
                <div class="flex items-center gap-1 text-slate-400 text-sm mb-1">
                  <ion-icon name="people-outline" class="text-primary"></ion-icon>
                  Players
                </div>
                <div class="text-lg font-bold">{{ team.players }}</div>
              </div>
              <div>
                <div class="flex items-center gap-1 text-slate-400 text-sm mb-1">
                  <ion-icon name="checkmark-done-outline" class="text-primary"></ion-icon>
                  Attendance
                </div>
                <div class="text-lg font-bold">{{ team.attendance_rate === null ? '—' : team.attendance_rate + '%' }}</div>
              </div>
              <div>
                <div class="flex items-center gap-1 text-slate-400 text-sm mb-1">
                  <ion-icon name="ribbon-outline" class="text-primary"></ion-icon>
                  Avg Age
                </div>
                <div class="text-lg font-bold">{{ team.avg_age === null ? '—' : team.avg_age }}</div>
              </div>
            </div>

            <div class="bg-primary/10 p-3 rounded-lg border border-primary/30">
              <div class="text-xs text-slate-400 mb-1 font-medium">{{ team.next_session ? 'Next Session' : 'Last Session' }}</div>
              <div class="text-primary text-sm font-semibold">
                {{ team.next_session ? formatWhen(team.next_session.starts_at) : formatWhen(team.last_session_at) }}
              </div>
              <div class="text-xs text-slate-400 mt-1">{{ team.completed_sessions }} of {{ team.sessions }} sessions completed</div>
            </div>
          </button>
        </section>
      </main>
      </app-brand-header-shell>
    </ion-content>
  `
})
export class CoachTeamsPage implements OnInit {
  private readonly router = inject(Router);
  private readonly coach = inject(CoachService);

  readonly teams = signal<CoachTeam[]>([]);
  readonly loading = signal(true);
  readonly error = signal('');

  ngOnInit() {
    this.load();
  }

  ionViewWillEnter() {
    if (!this.loading()) this.load();
  }

  load() {
    this.loading.set(true);
    this.error.set('');
    this.coach.getTeams().subscribe({
      next: response => {
        this.teams.set(response.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.teams.set([]);
        this.error.set('Your teams could not be loaded. Check your connection and try again.');
        this.loading.set(false);
      },
    });
  }

  openTeam(team: CoachTeam) {
    if (team.next_session) {
      this.router.navigateByUrl('/app/coach/session/' + encodeURIComponent(team.next_session.id));
      return;
    }
    this.router.navigateByUrl('/app/coach/schedule');
  }

  planSession() {
    this.router.navigateByUrl('/app/coach/plan');
  }

  initial(name: string): string {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  formatWhen(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    const today = new Date();
    const dayDiff = Math.round(
      (new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
        - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / 86400000
    );
    const time = date.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (dayDiff === 0) return `Today, ${time}`;
    if (dayDiff === 1) return `Tomorrow, ${time}`;
    if (dayDiff === -1) return `Yesterday, ${time}`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: date.getFullYear() === today.getFullYear() ? undefined : 'numeric' }) + `, ${time}`;
  }
}
