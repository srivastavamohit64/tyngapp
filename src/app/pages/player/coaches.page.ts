import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FilterChip, FilterChipsComponent } from '../../shared/components/filter-chips/filter-chips.component';
import { FormsModule } from '@angular/forms';
import { CoachService } from '../../core/services/coach.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

@Component({
  selector: 'app-coaches',
  standalone: true,
  imports: [CommonModule, IonicModule, FilterChipsComponent, FormsModule],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-top page-with-tab-bar px-6 py-4 bg-background text-foreground">
        
        <!-- Header -->
        <header class="app-header-bar flex items-center justify-between mb-6">
          <button (click)="back()" class="app-header-btn grid place-items-center rounded-full bg-card border border-border">
            <ion-icon name="chevron-back-outline" class="text-xl"></ion-icon>
          </button>
          <h1 class="app-header-title text-center flex-1">Find Coaches</h1>
          <div class="app-header-btn"></div>
        </header>

        <section *ngIf="invitations.length" class="invites mb-6" aria-label="Coaching invitations">
          <div class="invites-title">
            <b>Coaching invitations</b>
            <span>{{ invitations.length }} waiting for you</span>
          </div>
          <button type="button" class="invite-row" *ngFor="let invite of invitations" (click)="openInvitation(invite.token)">
            <img *ngIf="invite.coach?.profileImage; else inviteCoachIcon" [src]="photo(invite.coach.profileImage)" alt="" />
            <ng-template #inviteCoachIcon><span class="invite-fallback"><ion-icon name="person-outline"></ion-icon></span></ng-template>
            <span class="invite-copy">
              <strong>{{ invite.coach?.name || 'A coach' }}</strong>
              <small>Invited you to join as a student</small>
            </span>
            <span class="invite-cta">Review</span>
          </button>
        </section>

        <!-- Search and Filter -->
        <div class="search-box mb-6 relative">
          <ion-icon name="search-outline" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></ion-icon>
          <input [(ngModel)]="search" (ngModelChange)="applyFilters()" type="text" placeholder="Search coaches, sports, specialties..." class="w-full pl-12 pr-4 h-12 rounded-xl bg-card border border-border outline-none text-sm font-medium" />
        </div>

        <!-- Sport filters -->
        <app-filter-chips
          class="mb-4"
          [chips]="sportChips"
          [value]="selectedSport"
          (valueChange)="selectedSport = $event; applyFilters()"
        ></app-filter-chips>

        <!-- Coaches list -->
        <div class="space-y-4">
          <div 
            *ngFor="let coach of filteredCoaches()" 
            class="coach-card p-4 rounded-2xl border border-border bg-card flex gap-4 hover:border-primary transition-all cursor-pointer"
            (click)="viewCoach(coach.id)"
          >
            <div class="avatar-box h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-3xl shadow-sm overflow-hidden">
              <img *ngIf="coach.profileImage; else coachPlaceholder" [src]="photo(coach.profileImage)" [alt]="coach.name" class="h-full w-full object-cover" />
              <ng-template #coachPlaceholder><ion-icon name="person-outline" class="text-slate-500"></ion-icon></ng-template>
            </div>
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-base text-slate-900 leading-tight">{{ coach.name }}</h3>
                <span class="rating flex items-center gap-1 text-xs font-bold text-secondary">
                  <ion-icon name="star" class="text-orange-400"></ion-icon>
                  {{ coach.rating }}
                </span>
              </div>
              <p class="text-xs font-bold text-primary mb-2 uppercase tracking-wide">{{ coach.sport }} • {{ coach.experience }}</p>
              <p class="text-xs text-slate-500 leading-normal line-clamp-2 mb-3">{{ coach.bio }}</p>
              <div class="flex justify-between items-end gap-3 text-xs">
                <span class="coach-location min-w-0 flex-1 text-slate-400"><ion-icon name="location-outline"></ion-icon> {{ coach.distance }}</span>
                <span class="coach-price flex-shrink-0 whitespace-nowrap font-bold text-slate-900">{{ coach.price }}</span>
              </div>
            </div>
          </div>
        </div>

      </main>
    </ion-content>
  `,
  styles: [
    `
      .sport-chip.active {
        background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-primary-to) 100%) !important;
        color: #111827 !important;
        border-color: transparent !important;
      }
      .rating ion-icon {
        color: #FF7A00;
      }
      .avatar-box {
        flex: 0 0 4rem;
        width: 4rem;
        height: 4rem;
      }
      .avatar-box img {
        display: block;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .coach-card {
        align-items: flex-start;
        min-width: 0;
      }
      .coach-card .rating {
        flex-shrink: 0;
        white-space: nowrap;
      }
      .coach-location {
        overflow-wrap: anywhere;
        line-height: 1.35;
      }
      .invites { padding: 14px; border: 1px solid #d9f99d; border-radius: 18px; background: #f7fee7; }
      .invites-title { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
      .invites-title b { font-size: 14px; color: #111827; }
      .invites-title span { font-size: 11px; font-weight: 700; color: #4d7c0f; }
      .invite-row { width: 100%; display: flex; align-items: center; gap: 10px; padding: 10px; margin-top: 8px; border: 0; border-radius: 14px; background: #fff; text-align: left; box-shadow: 0 2px 8px rgba(16, 24, 40, 0.05); }
      .invite-row:first-of-type { margin-top: 0; }
      .invite-row img, .invite-fallback { width: 42px; height: 42px; flex: 0 0 42px; border-radius: 50%; object-fit: cover; background: #f3f4f6; display: grid; place-items: center; color: #6b7280; font-size: 18px; }
      .invite-copy { flex: 1; min-width: 0; display: grid; gap: 2px; }
      .invite-copy strong { font-size: 13px; color: #111827; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .invite-copy small { font-size: 11px; color: #6b7280; }
      .invite-cta { flex-shrink: 0; padding: 7px 12px; border-radius: 999px; background: var(--app-primary); color: #111827; font-size: 12px; font-weight: 800; }
    `
  ]
})
export class CoachesPage implements OnInit {
  private readonly router = inject(Router);
  private readonly coachService = inject(CoachService);
  selectedSport = 'All';
  search = '';
  loading = true;
  error = '';

  readonly sports = ['All', 'Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton'];

  readonly sportChips: FilterChip[] = this.sports.map((s) => ({ id: s, label: s }));

  coaches: any[] = [];
  invitations: any[] = [];

  ngOnInit(): void { this.applyFilters(); }

  ionViewWillEnter(): void { this.loadInvitations(); }

  loadInvitations(): void {
    this.coachService.getMyCoachInvitations().subscribe({
      next: (response) => { this.invitations = Array.isArray(response.data) ? response.data : []; },
      error: () => { this.invitations = []; },
    });
  }

  openInvitation(token: string): void {
    void this.router.navigateByUrl(`/app/coach-invite/${encodeURIComponent(token)}`);
  }

  applyFilters(): void {
    this.loading = true; this.error = '';
    this.coachService.getCoaches(this.search, this.selectedSport).subscribe({
      next: (response) => {
        const payload: any = response.data;
        const items = Array.isArray(payload) ? payload : (payload?.data || []);
        this.coaches = items.map((coach: any) => ({ ...coach, sport: Array.isArray(coach.sports) ? coach.sports.join(', ') : (coach.sport || 'Multi-sport'), experience: coach.experience || 'Coach', bio: coach.bio || 'Coach profile information will be available soon.', rating: coach.rating ?? 'New', avatar: '👤', distance: coach.location || 'Location not set', price: 'View profile' }));
        this.loading = false;
      },
      error: () => { this.error = 'Unable to load coaches. Please try again.'; this.loading = false; },
    });
  }

  /* Demo data removed: Coach directory is loaded from the live API. */
  /*
  readonly coaches = [
    { id: 1, name: 'Coach Arvind Sharma', sport: 'Cricket', experience: '12+ Yrs Exp', rating: 4.9, avatar: '🏏', distance: '1.5 km', price: '₹800/session', bio: 'Former State level cricketer focusing on batting techniques, stamina building, and match strategy for all age groups.' },
    { id: 2, name: 'Coach Rohan Das', sport: 'Football', experience: '8 Yrs Exp', rating: 4.8, avatar: '⚽', distance: '2.8 km', price: '₹1000/session', bio: 'Specialist youth football trainer with tactical certifications. Head of Elite Junior Squad programs.' },
    { id: 3, name: 'Coach Sarah Miller', sport: 'Basketball', experience: '6 Yrs Exp', rating: 4.7, avatar: '🏀', distance: '3.2 km', price: '₹1200/session', bio: 'Dedicated basketball coach specializing in shooting mechanics, dribbling skills, and court positioning workouts.' },
    { id: 4, name: 'Coach Aman Verma', sport: 'Tennis', experience: '10 Yrs Exp', rating: 4.9, avatar: '🎾', distance: '1.1 km', price: '₹1500/session', bio: 'Professional Tennis training focusing on serving techniques, baseline rallies, and reflex speeds.' }
  ]; */

  back() {
    this.router.navigateByUrl('/app/home');
  }

  filteredCoaches() {
    return this.coaches;
  }

  photo(url?: string | null): string | null {
    return resolveMediaUrl(url);
  }

  viewCoach(id: number) {
    this.router.navigateByUrl(`/app/coaches/${id}`);
  }
}
