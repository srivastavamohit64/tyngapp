import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-coach-profile-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-top page-with-tab-bar px-6 py-4 bg-background text-foreground" *ngIf="coach">
        
        <!-- Header -->
        <header class="flex items-center justify-between mb-6">
          <button (click)="back()" class="h-10 w-10 grid place-items-center rounded-full bg-card border border-border">
            <ion-icon name="chevron-back-outline" class="text-xl"></ion-icon>
          </button>
          <h1 class="text-lg font-bold text-center flex-1">Coach Profile</h1>
          <div class="w-10"></div>
        </header>

        <!-- Profile Detail Card -->
        <div class="bg-card border border-border rounded-2xl p-6 mb-6 flex flex-col items-center text-center">
          <div class="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-5xl shadow-md mb-4 animate-bounce">
            {{ coach.avatar }}
          </div>
          <h2 class="text-xl font-bold text-slate-900 mb-1">{{ coach.name }}</h2>
          <p class="text-xs font-bold text-primary mb-3 uppercase tracking-wide">{{ coach.sport }} • {{ coach.experience }}</p>
          <span class="rating flex items-center gap-1.5 text-sm font-bold text-secondary mb-4">
            <ion-icon name="star"></ion-icon>
            {{ coach.rating }} (48 Reviews)
          </span>

          <div class="grid grid-cols-2 gap-4 w-full border-t border-border pt-4 mt-2">
            <div class="text-center">
              <p class="text-xs text-slate-400">Session Cost</p>
              <p class="text-base font-bold text-slate-900 mt-0.5">{{ coach.price }}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-400">Location</p>
              <p class="text-base font-bold text-slate-900 mt-0.5">{{ coach.distance }} away</p>
            </div>
          </div>
        </div>

        <!-- About section -->
        <div class="mb-6">
          <h3 class="text-base font-bold text-slate-900 mb-2">About Coach</h3>
          <p class="text-sm text-slate-600 leading-relaxed">{{ coach.bio }}</p>
        </div>

        <!-- Specialties section -->
        <div class="mb-6">
          <h3 class="text-base font-bold text-slate-900 mb-3">Specialties</h3>
          <div class="flex flex-wrap gap-2">
            <span *ngFor="let spec of coach.specialties" class="px-3.5 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-slate-800">
              {{ spec }}
            </span>
          </div>
        </div>

        <!-- Booking CTA -->
        <div class="cta-box mt-8">
          <button (click)="bookSession()" class="w-full h-12 rounded-full bg-gradient-to-r from-[#8CF000] to-[#A3E635] text-[#111827] font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all">
            Book Coaching Session
          </button>
        </div>

      </main>
    </ion-content>
  `,
  styles: [
    `
      .rating ion-icon {
        color: #FF7A00;
      }
      button.bg-gradient-to-r {
        background: linear-gradient(to right, #8CF000, #A3E635) !important;
      }
    `
  ]
})
export class CoachProfileDetailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  coachId: number | null = null;
  coach: any = null;

  readonly coaches = [
    { id: 1, name: 'Coach Arvind Sharma', sport: 'Cricket', experience: '12+ Yrs Exp', rating: 4.9, avatar: '🏏', distance: '1.5 km', price: '₹800/session', bio: 'Former State level cricketer focusing on batting techniques, stamina building, and match strategy for all age groups.', specialties: ['Batting Stance', 'Spin Tactics', 'Fitness Training', 'Group Scrimmage'] },
    { id: 2, name: 'Coach Rohan Das', sport: 'Football', experience: '8 Yrs Exp', rating: 4.8, avatar: '⚽', distance: '2.8 km', price: '₹1000/session', bio: 'Specialist youth football trainer with tactical certifications. Head of Elite Junior Squad programs.', specialties: ['Dribbling & Pace', 'Midfield Play', 'Tactical Positioning', 'Youth Training'] },
    { id: 3, name: 'Coach Sarah Miller', sport: 'Basketball', experience: '6 Yrs Exp', rating: 4.7, avatar: '🏀', distance: '3.2 km', price: '₹1200/session', bio: 'Dedicated basketball coach specializing in shooting mechanics, dribbling skills, and court positioning workouts.', specialties: ['Shooting Mechanics', 'Dribbling', 'Defense Systems', '1-on-1 Prep'] },
    { id: 4, name: 'Coach Aman Verma', sport: 'Tennis', experience: '10 Yrs Exp', rating: 4.9, avatar: '🎾', distance: '1.1 km', price: '₹1500/session', bio: 'Professional Tennis training focusing on serving techniques, baseline rallies, and reflex speeds.', specialties: ['Serve Form', 'Baseline Rallies', 'Footwork', 'Singles Strategy'] }
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.coachId = +idStr;
        this.coach = this.coaches.find(c => c.id === this.coachId) || this.coaches[0];
      }
    });
  }

  back() {
    this.router.navigateByUrl('/app/coaches');
  }

  bookSession() {
    // Navigate to a simple booking completed or summary flow
    alert('Booking request sent to ' + this.coach.name + '! They will confirm via Chat.');
    this.router.navigateByUrl('/app/chat');
  }
}
