import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FilterChip, FilterChipsComponent } from '../../shared/components/filter-chips/filter-chips.component';

@Component({
  selector: 'app-coaches',
  standalone: true,
  imports: [CommonModule, IonicModule, FilterChipsComponent],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-top page-with-tab-bar px-6 py-4 bg-background text-foreground">
        
        <!-- Header -->
        <header class="flex items-center justify-between mb-6">
          <button (click)="back()" class="h-10 w-10 grid place-items-center rounded-full bg-card border border-border">
            <ion-icon name="chevron-back-outline" class="text-xl"></ion-icon>
          </button>
          <h1 class="text-lg font-bold text-center flex-1">Find Coaches</h1>
          <div class="w-10"></div>
        </header>

        <!-- Search and Filter -->
        <div class="search-box mb-6 relative">
          <ion-icon name="search-outline" class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-lg"></ion-icon>
          <input type="text" placeholder="Search sports, specialties..." class="w-full pl-12 pr-4 h-12 rounded-xl bg-card border border-border outline-none text-sm font-medium" />
        </div>

        <!-- Sport filters -->
        <app-filter-chips
          class="mb-4"
          [chips]="sportChips"
          [value]="selectedSport"
          (valueChange)="selectedSport = $event"
        ></app-filter-chips>

        <!-- Coaches list -->
        <div class="space-y-4">
          <div 
            *ngFor="let coach of filteredCoaches()" 
            class="coach-card p-4 rounded-2xl border border-border bg-card flex gap-4 hover:border-primary transition-all cursor-pointer"
            (click)="viewCoach(coach.id)"
          >
            <div class="avatar-box h-16 w-16 rounded-xl bg-slate-100 flex items-center justify-center text-3xl shadow-sm">
              {{ coach.avatar }}
            </div>
            <div class="flex-1">
              <div class="flex justify-between items-start mb-1">
                <h3 class="font-bold text-base text-slate-900 leading-tight">{{ coach.name }}</h3>
                <span class="rating flex items-center gap-1 text-xs font-bold text-secondary">
                  <ion-icon name="star" class="text-orange-400"></ion-icon>
                  {{ coach.rating }}
                </span>
              </div>
              <p class="text-xs font-bold text-primary mb-2 uppercase tracking-wide">{{ coach.sport }} • {{ coach.experience }}</p>
              <p class="text-xs text-slate-500 leading-normal line-clamp-2 mb-3">{{ coach.bio }}</p>
              <div class="flex justify-between items-center text-xs">
                <span class="text-slate-400"><ion-icon name="location-outline"></ion-icon> {{ coach.distance }}</span>
                <span class="font-bold text-slate-900">{{ coach.price }}</span>
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
        background: linear-gradient(135deg, #8CF000 0%, #A3E635 100%) !important;
        color: #111827 !important;
        border-color: transparent !important;
      }
      .rating ion-icon {
        color: #FF7A00;
      }
    `
  ]
})
export class CoachesPage {
  private readonly router = inject(Router);
  selectedSport = 'All';

  readonly sports = ['All', 'Football', 'Cricket', 'Basketball', 'Tennis', 'Badminton'];

  readonly sportChips: FilterChip[] = this.sports.map((s) => ({ id: s, label: s }));

  readonly coaches = [
    { id: 1, name: 'Coach Arvind Sharma', sport: 'Cricket', experience: '12+ Yrs Exp', rating: 4.9, avatar: '🏏', distance: '1.5 km', price: '₹800/session', bio: 'Former State level cricketer focusing on batting techniques, stamina building, and match strategy for all age groups.' },
    { id: 2, name: 'Coach Rohan Das', sport: 'Football', experience: '8 Yrs Exp', rating: 4.8, avatar: '⚽', distance: '2.8 km', price: '₹1000/session', bio: 'Specialist youth football trainer with tactical certifications. Head of Elite Junior Squad programs.' },
    { id: 3, name: 'Coach Sarah Miller', sport: 'Basketball', experience: '6 Yrs Exp', rating: 4.7, avatar: '🏀', distance: '3.2 km', price: '₹1200/session', bio: 'Dedicated basketball coach specializing in shooting mechanics, dribbling skills, and court positioning workouts.' },
    { id: 4, name: 'Coach Aman Verma', sport: 'Tennis', experience: '10 Yrs Exp', rating: 4.9, avatar: '🎾', distance: '1.1 km', price: '₹1500/session', bio: 'Professional Tennis training focusing on serving techniques, baseline rallies, and reflex speeds.' }
  ];

  back() {
    this.router.navigateByUrl('/app/home');
  }

  filteredCoaches() {
    if (this.selectedSport === 'All') return this.coaches;
    return this.coaches.filter(c => c.sport === this.selectedSport);
  }

  viewCoach(id: number) {
    this.router.navigateByUrl(`/app/coaches/${id}`);
  }
}
