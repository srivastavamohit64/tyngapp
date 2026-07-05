import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

interface OnboardingSport {
  id: string;
  name: string;
  emoji: string;
  image: string;
  accent: string;
}

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="onboarding-shell">
        <header class="onboarding-header">
          <!-- Progress tracker -->
          <div class="progress-track">
            <div 
              *ngFor="let stepNum of stepsList" 
              class="progress-segment"
              [class.is-filled]="stepNum <= step"
            ></div>
          </div>
          <h1 class="heading-title">{{ heading }}</h1>
          <p class="heading-desc">{{ description }}</p>
        </header>

        <section class="onboarding-content">
          <!-- STEP 1: Name & Specialties/Sports -->
          <div *ngIf="step === 1" class="step-container">
            <div class="name-field-container">
              <label class="name-label">{{ roleLabel }} Name</label>
              <input
                type="text"
                class="name-input"
                [value]="name"
                (input)="name = $any($event.target).value"
                [placeholder]="rolePlaceholder"
              />
            </div>

            <!-- Venue extra: Venue Type selection -->
            <div *ngIf="isVenue" class="name-field-container" style="margin-top: 20px">
              <label class="name-label">Venue Type</label>
              <select
                class="name-input select-input"
                [value]="venueType"
                (change)="venueType = $any($event.target).value"
              >
                <option value="">Select venue type…</option>
                <option value="multi-sport">Multi-Sport Complex</option>
                <option value="football">Football Ground</option>
                <option value="cricket">Cricket Ground</option>
                <option value="basketball">Basketball Court</option>
                <option value="tennis">Tennis Court</option>
                <option value="badminton">Badminton Court</option>
                <option value="other">Other</option>
              </select>
            </div>

            <!-- Player / Coach: Select Sports Grid -->
            <div *ngIf="!isVenue" class="sports-section">
              <div class="selection-heading">
                {{ isCoach ? 'Select Specialties' : 'Choose Sports you Play' }}
              </div>
              <div class="sports-grid">
                <button
                  *ngFor="let sport of sports"
                  type="button"
                  class="sport-card"
                  [class.is-selected]="selectedSports.includes(sport.id)"
                  [style.borderColor]="selectedSports.includes(sport.id) ? sport.accent : null"
                  (click)="toggleSport(sport.id)"
                >
                  <div class="sport-img-wrapper">
                    <img [src]="sport.image" alt="sport image" class="sport-bg-img" />
                    <div class="sport-overlay"></div>
                  </div>
                  <div class="sport-card-info">
                    <span class="sport-emoji">{{ sport.emoji }}</span>
                    <span class="sport-name">{{ sport.name }}</span>
                  </div>
                  <span
                    *ngIf="selectedSports.includes(sport.id)"
                    class="sport-check"
                    [style.backgroundColor]="sport.accent"
                  >
                    ✓
                  </span>
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 2: Skill level / Experience -->
          <div *ngIf="step === 2" class="stack-list">
            <button
              *ngFor="let skill of (isCoach ? coachSkills : playerSkills)"
              type="button"
              class="skill-card"
              [class.is-selected]="skillLevel === skill.id"
              (click)="skillLevel = skill.id"
            >
              <div class="skill-top">
                <div>
                  <div class="skill-title">{{ skill.name }}</div>
                  <div class="skill-desc">{{ skill.desc }}</div>
                </div>
                <div class="skill-percent">{{ skill.progress }}%</div>
              </div>
              <div class="skill-bar">
                <div
                  class="skill-bar-fill"
                  [class]="skill.gradientClass"
                  [style.width.%]="skillLevel === skill.id ? skill.progress : 0"
                ></div>
              </div>
              <div *ngIf="skillLevel === skill.id" class="ai-suggestion">
                <div class="ai-label">✨ AI Suggestion</div>
                <div class="ai-text">{{ skill.aiSuggestion }}</div>
              </div>
            </button>
          </div>

          <!-- STEP 3: Playing Intent / Coaching Focus -->
          <div *ngIf="step === 3" class="stack-list">
            <button
              *ngFor="let intent of (isCoach ? coachIntents : playerIntents)"
              type="button"
              class="intent-card"
              [class.is-selected]="playingStyle === intent.id"
              (click)="playingStyle = intent.id"
            >
              <div class="intent-top">
                <div>
                  <div class="intent-title">{{ intent.name }}</div>
                  <div class="intent-desc">{{ intent.desc }}</div>
                </div>
                <span *ngIf="playingStyle === intent.id" class="intent-check">✓</span>
              </div>
              <div class="feature-grid">
                <span
                  *ngFor="let feat of intent.features"
                  class="feature-chip"
                  [class.is-selected]="playingStyle === intent.id"
                >
                  {{ feat }}
                </span>
              </div>
            </button>
          </div>

          <!-- STEP 4: Preferred time slots / Operating hours -->
          <div *ngIf="step === 4" class="timeline-list">
            <button
              *ngFor="let slot of times"
              type="button"
              class="time-card"
              [class.is-selected]="timeSlots.includes(slot.id)"
              [style.borderColor]="timeSlots.includes(slot.id) ? slot.color : null"
              [style.backgroundColor]="timeSlots.includes(slot.id) ? slot.color + '15' : null"
              (click)="toggleTimeSlot(slot.id)"
            >
              <div
                class="time-icon"
                [style.backgroundColor]="timeSlots.includes(slot.id) ? slot.color : '#F3F4F6'"
                [style.color]="timeSlots.includes(slot.id) ? '#FFFFFF' : '#111827'"
              >
                {{ slot.emoji }}
              </div>
              <div class="time-copy">
                <div class="time-title" [style.color]="timeSlots.includes(slot.id) ? slot.color : '#111827'">
                  {{ slot.name }}
                </div>
                <div class="time-range">{{ slot.timeRange }}</div>
              </div>
              <span
                *ngIf="timeSlots.includes(slot.id)"
                class="time-check"
                [style.backgroundColor]="slot.color"
              >
                ✓
              </span>
            </button>
          </div>
        </section>

        <footer class="onboarding-footer">
          <button *ngIf="step > 1" type="button" class="btn-secondary" (click)="back()">Back</button>
          <button type="button" class="btn-primary" [disabled]="!canProceed" (click)="next()">
            {{ lastStep ? 'Complete Setup' : 'Continue' }}
          </button>
        </footer>
      </main>
    </ion-content>
  `,
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  ngOnInit() {
    if (this.auth.user()?.role === 'coach') {
      void this.router.navigateByUrl('/coach-onboarding', { replaceUrl: true });
    }
  }

  step = 1;
  name = this.auth.user()?.name || '';
  selectedSports: string[] = [];
  skillLevel = '';
  playingStyle = '';
  timeSlots: string[] = [];
  venueType = '';

  get isCoach() {
    return this.auth.user()?.role === 'coach';
  }

  get isVenue() {
    return this.auth.user()?.role === 'venue';
  }

  get stepsList() {
    return this.isVenue ? [1, 4] : [1, 2, 3, 4];
  }

  get lastStep() {
    return this.step === 4;
  }

  get roleLabel() {
    if (this.isCoach) return 'Coach';
    if (this.isVenue) return 'Venue';
    return 'Player';
  }

  get rolePlaceholder() {
    if (this.isCoach) return 'Enter your name';
    if (this.isVenue) return 'Enter venue name';
    return 'Enter your name';
  }

  readonly sports: OnboardingSport[] = [
    { id: 'cricket', name: 'Cricket', emoji: '🏏', accent: '#22C55E', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=400&fit=crop&auto=format' },
    { id: 'football', name: 'Football', emoji: '⚽', accent: '#3B82F6', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=400&fit=crop&auto=format' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', accent: '#F97316', image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=300&h=400&fit=crop&auto=format' },
    { id: 'volleyball', name: 'Volleyball', emoji: '🏐', accent: '#A855F7', image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=300&h=400&fit=crop&auto=format' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾', accent: '#FACC15', image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=300&h=400&fit=crop&auto=format' },
    { id: 'badminton', name: 'Badminton', emoji: '🏸', accent: '#38BDF8', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=400&fit=crop&auto=format' },
    { id: 'padel', name: 'Padel', emoji: '🏓', accent: '#F59E0B', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=300&h=400&fit=crop&auto=format' },
    { id: 'squash', name: 'Squash', emoji: '🎾', accent: '#8B5CF6', image: 'https://images.unsplash.com/photo-1672068787369-82556699e538?w=300&h=400&fit=crop&auto=format' },
    { id: 'chess', name: 'Chess', emoji: '♟️', accent: '#94A3B8', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=300&h=400&fit=crop&auto=format' },
    { id: 'golf', name: 'Golf', emoji: '⛳', accent: '#10B981', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=400&fit=crop&auto=format' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉', accent: '#EF4444', image: 'https://images.unsplash.com/photo-1676972523246-2ff4125551fb?w=300&h=400&fit=crop&auto=format' },
    { id: 'swimming', name: 'Swimming', emoji: '🏊', accent: '#06B6D4', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=400&fit=crop&auto=format' },
  ];

  readonly playerSkills = [
    { id: 'beginner', name: 'Beginner', desc: 'Just starting out', progress: 25, gradientClass: 'gradient-green', aiSuggestion: "Perfect! We'll search for casual matches and beginner programs." },
    { id: 'intermediate', name: 'Intermediate', desc: 'Regular player, decent control', progress: 50, gradientClass: 'gradient-blue', aiSuggestion: "Great! We'll recommend competitive community games." },
    { id: 'advanced', name: 'Advanced', desc: 'Competed in amateur leagues', progress: 75, gradientClass: 'gradient-orange', aiSuggestion: "Excellent! You'll fit nicely in ranked local clubs & cups." },
    { id: 'expert', name: 'Expert', desc: 'Federation / Pro level', progress: 100, gradientClass: 'gradient-violet', aiSuggestion: "Incredible! We'll highlight semi-pro open tourneys for you." },
  ];

  readonly coachSkills = [
    { id: 'junior', name: '1–3 Years (Rising Coach)', desc: 'Focus on children and beginner players', progress: 25, gradientClass: 'gradient-green', aiSuggestion: 'Great! Youth training academies and introductory sports clinics.' },
    { id: 'mid', name: '4–10 Years (Experienced Coach)', desc: 'Regularly coaching team training', progress: 60, gradientClass: 'gradient-blue', aiSuggestion: 'Excellent! Match with competitive clubs and high-school teams.' },
    { id: 'master', name: '10+ Years (Elite Coach)', desc: 'Professional academy coaching credentials', progress: 100, gradientClass: 'gradient-orange', aiSuggestion: 'Superb! Academy collaborations, professional training development.' },
  ];

  readonly playerIntents = [
    { id: 'recreational', name: 'Recreational & Social', desc: 'Play casually and make friends', features: ['Casual friendly matches', 'Social events', 'Flexible times'] },
    { id: 'competitive', name: 'Competitive & Ranked', desc: 'Serious games and tournaments', features: ['Ranked leagues', 'Local tourneys', 'Skill stats tracking'] },
  ];

  readonly coachIntents = [
    { id: 'youth', name: 'Development & Fundamentals', desc: 'Help young talents build athletic basics', features: ['Beginner clinics', 'Skill drills', 'Fun sessions'] },
    { id: 'tactical', name: 'Tactical & Performance Prep', desc: 'Strategic match prep for advanced competition', features: ['League strategy', 'Video sessions', 'Tournament prep'] },
  ];

  readonly times = [
    { id: 'morning', name: 'Morning', timeRange: '6:00 AM - 12:00 PM', emoji: '🌅', color: '#FF7A00' },
    { id: 'evening', name: 'Evening', timeRange: '4:00 PM - 8:00 PM', emoji: '🌆', color: '#FF7A00' },
    { id: 'night', name: 'Night', timeRange: '8:00 PM - 12:00 AM', emoji: '🌙', color: '#7C3AED' },
    { id: 'weekend', name: 'Weekends', timeRange: 'Saturday & Sunday', emoji: '🎉', color: '#8CF000' },
    { id: 'flexible', name: 'Flexible', timeRange: 'Anytime works', emoji: '🔄', color: '#38BDF8' },
  ];

  get heading() {
    if (this.isVenue) {
      return this.step === 1 ? 'Set up your venue' : 'Operating Hours';
    }
    return [
      this.isCoach ? 'Coaching Specialties' : 'Select Sports',
      this.isCoach ? 'Coaching Experience' : 'Your Skill Level',
      this.isCoach ? 'Coaching Focus' : 'Your Play Intent',
      this.isCoach ? 'Availability' : 'Preferred Times',
    ][this.step - 1];
  }

  get description() {
    if (this.isVenue) {
      return this.step === 1
        ? 'Tell players and coaches about your facility'
        : 'Specify when players can book courts';
    }
    return [
      this.isCoach ? 'Choose sports you specialize in coaching' : 'Select sports you are interested in playing',
      this.isCoach ? 'Select your years of coaching experience' : 'Choose a level that best describes your play',
      this.isCoach ? 'What is your primary coaching focus?' : 'What matches are you looking to join?',
      this.isCoach ? 'Specify when you run training sessions' : 'Select times you are usually available to play',
    ][this.step - 1];
  }

  get canProceed() {
    if (this.step === 1) {
      if (this.isVenue) return this.name.trim().length > 0 && this.venueType.length > 0;
      return this.name.trim().length > 0 && this.selectedSports.length > 0;
    }
    if (this.step === 2) return !!this.skillLevel;
    if (this.step === 3) return !!this.playingStyle;
    return this.timeSlots.length > 0;
  }

  back() {
    if (this.isVenue && this.step === 4) {
      this.step = 1;
    } else {
      this.step -= 1;
    }
  }

  toggleSport(sportId: string) {
    const idx = this.selectedSports.indexOf(sportId);
    if (idx >= 0) {
      this.selectedSports.splice(idx, 1);
    } else {
      this.selectedSports.push(sportId);
    }
  }

  toggleTimeSlot(timeId: string) {
    const idx = this.timeSlots.indexOf(timeId);
    if (idx >= 0) {
      this.timeSlots.splice(idx, 1);
    } else {
      this.timeSlots.push(timeId);
    }
  }

  next() {
    if (!this.canProceed) return;
    if (this.isVenue && this.step === 1) {
      this.step = 4;
      return;
    }
    if (this.step < 4) {
      this.step += 1;
      return;
    }
    this.auth.completeOnboarding({
      name: this.name,
      sports: this.selectedSports,
      experience: this.skillLevel,
      focus: this.playingStyle,
      availability: this.timeSlots,
    });
    const role = this.auth.user()?.role;
    if (role === 'admin') {
      void this.router.navigateByUrl('/app/admin/dashboard');
    } else {
      void this.router.navigateByUrl('/app/home');
    }
  }
}
