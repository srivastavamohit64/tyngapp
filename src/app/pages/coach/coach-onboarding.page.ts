import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

interface CoachSport {
  id: string;
  name: string;
  emoji: string;
  image: string;
}

interface ExperienceLevel {
  id: string;
  emoji: string;
  title: string;
  years: string;
  desc: string;
}

interface CoachingFormat {
  id: string;
  icon: string;
  title: string;
  desc: string;
}

interface CoachingPersonality {
  id: string;
  emoji: string;
  title: string;
  desc: string;
}

const SPORTS: CoachSport[] = [
  { id: 'cricket', name: 'Cricket', emoji: '🏏', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=400&fit=crop&auto=format' },
  { id: 'football', name: 'Football', emoji: '⚽', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=400&fit=crop&auto=format' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=300&h=400&fit=crop&auto=format' },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=400&fit=crop&auto=format' },
  { id: 'tennis', name: 'Tennis', emoji: '🎾', image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=300&h=400&fit=crop&auto=format' },
  { id: 'tabletennis', name: 'Table Tennis', emoji: '🏓', image: 'https://images.unsplash.com/photo-1676827613262-5fba25cee5fd?w=300&h=400&fit=crop&auto=format' },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=300&h=400&fit=crop&auto=format' },
  { id: 'hockey', name: 'Hockey', emoji: '🏑', image: 'https://images.unsplash.com/photo-1541983663620-7571a820610c?w=300&h=400&fit=crop&auto=format' },
  { id: 'kabaddi', name: 'Kabaddi', emoji: '🥋', image: 'https://images.unsplash.com/photo-1771238113635-1f062e3845f9?w=300&h=400&fit=crop&auto=format' },
  { id: 'golf', name: 'Golf', emoji: '⛳', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=400&fit=crop&auto=format' },
  { id: 'rugby', name: 'Rugby', emoji: '🏉', image: 'https://images.unsplash.com/photo-1676972523246-2ff4125551fb?w=300&h=400&fit=crop&auto=format' },
];

const EXPERIENCE: ExperienceLevel[] = [
  { id: 'rising', emoji: '🌱', title: 'Rising Coach', years: '0–3 Years', desc: 'Building experience and helping athletes grow.' },
  { id: 'experienced', emoji: '⭐', title: 'Experienced Coach', years: '4–10 Years', desc: 'Regularly coaching individuals and teams.' },
  { id: 'elite', emoji: '🏆', title: 'Elite Coach', years: '10+ Years', desc: 'Professional, academy or high-performance coaching.' },
];

const FORMATS: CoachingFormat[] = [
  { id: 'classes', icon: 'calendar-outline', title: 'Regular Classes', desc: 'Weekly recurring coaching.' },
  { id: 'oneOnOne', icon: 'person-outline', title: 'One-on-One Coaching', desc: 'Private personalised sessions.' },
  { id: 'flexible', icon: 'flash-outline', title: 'Flexible Sessions', desc: 'Available on demand whenever players book.' },
];

const PERSONALITIES: CoachingPersonality[] = [
  { id: 'performance', emoji: '🎯', title: 'Performance Coach', desc: 'Focused on improving match performance and competition.' },
  { id: 'development', emoji: '📈', title: 'Development Coach', desc: 'Builds confidence and strong fundamentals.' },
  { id: 'fitness', emoji: '💪', title: 'Fitness Coach', desc: 'Improves athletic ability and conditioning.' },
  { id: 'community', emoji: '🤝', title: 'Community Coach', desc: 'Friendly, social, beginner-focused and fun.' },
];

const TOTAL_STEPS = 4;
const WELCOME_FEATURES = ['Connect with athletes', 'Manage bookings', 'Grow your coaching'];

@Component({
  selector: 'app-coach-onboarding',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <!-- Finish screen -->
      <div *ngIf="finished" class="finish-screen">
        <div class="finish-icon-wrap">✓</div>
        <h1 class="finish-title">Your Coach Profile<br />is Ready! 🎉</h1>
        <p class="finish-desc">Welcome to TYNG Coaches. Athletes in your city are already waiting to connect.</p>

        <div class="finish-summary">
          <div class="finish-summary-card">
            <span class="text-2xl">{{ getExperience()?.emoji }}</span>
            <div>
              <p class="text-[13px] font-black text-[#111827] m-0">{{ getExperience()?.title ?? 'Coach' }}</p>
              <p class="text-[11px] text-[#9CA3AF] m-0">{{ sports.length }} sport{{ sports.length !== 1 ? 's' : '' }} · {{ formats.length }} format{{ formats.length !== 1 ? 's' : '' }}</p>
            </div>
          </div>
          <div class="finish-chips">
            <span *ngFor="let id of sports.slice(0, 6)" class="finish-chip">
              {{ getSport(id)?.emoji }} {{ getSport(id)?.name }}
            </span>
          </div>
        </div>

        <div class="w-full max-w-sm">
          <button type="button" class="btn-orange" (click)="finish()">Start Exploring TYNG →</button>
          <p class="finish-footnote">You can complete your full profile later to receive bookings faster.</p>
        </div>
      </div>

      <!-- Main onboarding -->
      <div *ngIf="!finished" class="coach-onboarding">
        <header class="coach-onboarding-header">
          <div class="coach-onboarding-header-row">
            <button type="button" class="hdr-btn" (click)="back()">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="hdr-title">
              <p class="hdr-title-main">Create Coach Profile</p>
              <p class="hdr-title-sub">Step {{ step }} of {{ totalSteps }}</p>
            </div>
            <button type="button" class="hdr-btn" [class.hdr-btn--next-ready]="canProceed() && step > 1"
              [disabled]="step === 1 || !canProceed()" (click)="next()">
              <ion-icon name="chevron-forward-outline" class="text-xl" [style.color]="canProceed() && step > 1 ? '#111827' : '#C4C9D4'"></ion-icon>
            </button>
          </div>
          <div class="progress-dots">
            <ng-container *ngFor="let s of stepNumbers; let i = index; let last = last">
              <div class="progress-dot-wrap">
                <div class="progress-dot" [class.progress-dot--active]="step === s" [class.progress-dot--done]="step > s">
                  <span *ngIf="step > s">✓</span>
                  <span *ngIf="step <= s">{{ s }}</span>
                </div>
                <div *ngIf="!last" class="progress-line" [class.progress-line--done]="step > s"></div>
              </div>
            </ng-container>
          </div>
        </header>

        <div class="coach-onboarding-body">
          <!-- Step 1: Welcome -->
          <div *ngIf="step === 1">
            <div class="welcome-hero">
              <img src="https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=600&fit=crop&auto=format" alt="Coaching" class="welcome-hero-img" />
              <div class="welcome-hero-gradient"></div>
              <div class="welcome-badge">
                <div class="welcome-badge-dot"></div>
                <span>TYNG Coaches</span>
              </div>
            </div>
            <div class="welcome-content">
              <h1 class="welcome-heading">Welcome to<br />TYNG Coaches 👋</h1>
              <p class="welcome-desc">Create your coaching profile and start connecting with athletes across your city.</p>
              <div class="feature-pills">
                <div *ngFor="let f of welcomeFeatures" class="feature-pill">
                  <span class="feature-pill-check">✓</span>
                  <span>{{ f }}</span>
                </div>
              </div>
              <button type="button" class="btn-lime" (click)="step = 2">Let's Get Started →</button>
            </div>
          </div>

          <!-- Step 2: Sports -->
          <div *ngIf="step === 2" class="step-panel">
            <h2 class="step-title">What do you coach?</h2>
            <p class="step-sub">Select one or more sports you professionally coach.</p>
            <div class="sports-grid">
              <button *ngFor="let sport of sportsList" type="button" class="sport-tile"
                [class.sport-tile--selected]="sports.includes(sport.id)" (click)="toggleSport(sport.id)">
                <img [src]="sport.image" [alt]="sport.name" class="sport-tile-img" />
                <div class="sport-tile-overlay"></div>
                <div *ngIf="sports.includes(sport.id)" class="sport-tile-tint"></div>
                <span *ngIf="sports.includes(sport.id)" class="sport-tile-check">✓</span>
                <span class="sport-tile-name">{{ sport.name }}</span>
              </button>
            </div>
            <button type="button" class="btn-lime btn-lime-sm" [disabled]="sports.length === 0" (click)="next()">
              {{ sports.length > 0 ? 'Continue with ' + sports.length + ' sport' + (sports.length > 1 ? 's' : '') : 'Select at least one sport' }}
            </button>
          </div>

          <!-- Step 3: Experience -->
          <div *ngIf="step === 3" class="step-panel">
            <h2 class="step-title">Coaching Experience</h2>
            <p class="step-sub">Select the level that best describes your coaching journey.</p>
            <div class="experience-list">
              <button *ngFor="let lvl of experienceLevels" type="button" class="experience-card"
                [class.experience-card--selected]="experience === lvl.id" (click)="experience = lvl.id">
                <span class="experience-emoji">{{ lvl.emoji }}</span>
                <div class="experience-copy">
                  <div class="experience-title-row">
                    <span class="experience-title">{{ lvl.title }}</span>
                    <span class="experience-years">{{ lvl.years }}</span>
                  </div>
                  <p class="experience-desc">{{ lvl.desc }}</p>
                </div>
                <span *ngIf="experience === lvl.id" class="card-check">✓</span>
              </button>
            </div>
            <button type="button" class="btn-lime btn-lime-sm" [disabled]="!experience" (click)="next()">Continue</button>
          </div>

          <!-- Step 4: Format + Personality -->
          <div *ngIf="step === 4" class="step-panel">
            <h2 class="step-title">How do you like to coach?</h2>
            <p class="step-sub">Choose all coaching formats that apply.</p>
            <div class="format-list">
              <button *ngFor="let f of formatOptions" type="button" class="format-card"
                [class.format-card--selected]="formats.includes(f.id)" (click)="toggleFormat(f.id)">
                <div class="format-icon">
                  <ion-icon [name]="f.icon" [style.color]="formats.includes(f.id) ? '#111827' : '#9CA3AF'"></ion-icon>
                </div>
                <div class="flex-1">
                  <p class="format-title">{{ f.title }}</p>
                  <p class="format-desc">{{ f.desc }}</p>
                </div>
                <span *ngIf="formats.includes(f.id)" class="card-check" style="width:24px;height:24px;font-size:12px">✓</span>
              </button>
            </div>

            <h3 class="personality-section-title">Coaching Personality</h3>
            <p class="personality-section-sub">How would your players describe you? Choose one.</p>
            <div class="personality-grid">
              <button *ngFor="let p of personalityOptions" type="button" class="personality-card"
                [class.personality-card--selected]="personality === p.id" (click)="personality = p.id">
                <div class="personality-orb"></div>
                <span class="personality-emoji">{{ p.emoji }}</span>
                <p class="personality-title">{{ p.title }}</p>
                <p class="personality-desc">{{ p.desc }}</p>
                <span *ngIf="personality === p.id" class="personality-check">✓</span>
              </button>
            </div>

            <button type="button" class="btn-orange" [disabled]="!canProceed()" (click)="next()">
              {{ canProceed() ? 'Create My Coach Profile →' : 'Select format & personality' }}
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styleUrl: './coach-onboarding.page.scss',
})
export class CoachOnboardingPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly totalSteps = TOTAL_STEPS;
  readonly stepNumbers = [1, 2, 3, 4];
  readonly sportsList = SPORTS;
  readonly experienceLevels = EXPERIENCE;
  readonly formatOptions = FORMATS;
  readonly personalityOptions = PERSONALITIES;
  readonly welcomeFeatures = WELCOME_FEATURES;

  step = 1;
  finished = false;
  sports: string[] = [];
  experience = '';
  formats: string[] = [];
  personality = '';

  canProceed(): boolean {
    if (this.step === 1) return true;
    if (this.step === 2) return this.sports.length > 0;
    if (this.step === 3) return !!this.experience;
    if (this.step === 4) return this.formats.length > 0 && !!this.personality;
    return false;
  }

  back() {
    if (this.step === 1) {
      void this.router.navigateByUrl('/welcome');
      return;
    }
    this.step -= 1;
  }

  next() {
    if (!this.canProceed()) return;
    if (this.step < TOTAL_STEPS) {
      this.step += 1;
      return;
    }
    this.finished = true;
  }

  toggleSport(id: string) {
    const idx = this.sports.indexOf(id);
    if (idx >= 0) {
      this.sports.splice(idx, 1);
    } else {
      this.sports.push(id);
    }
  }

  toggleFormat(id: string) {
    const idx = this.formats.indexOf(id);
    if (idx >= 0) {
      this.formats.splice(idx, 1);
    } else {
      this.formats.push(id);
    }
  }

  getExperience() {
    return EXPERIENCE.find(e => e.id === this.experience);
  }

  getSport(id: string) {
    return SPORTS.find(s => s.id === id);
  }

  finish() {
    this.auth.completeOnboarding({
      name: this.auth.user()?.name || 'Coach',
      sports: this.sports,
      experience: this.experience,
      formats: this.formats,
      personality: this.personality,
    });
    void this.router.navigateByUrl('/app/coach/dashboard');
  }
}
