import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="onboarding-shell">
        <header class="onboarding-header">
          <div class="progress-track">
            <div
              *ngFor="let item of [1, 2, 3, 4]"
              class="progress-segment"
              [class.is-filled]="item <= step"
            ></div>
          </div>
          <h1>{{ heading }}</h1>
          <p>{{ description }}</p>
        </header>

        <section class="onboarding-content">
          <div *ngIf="step === 1" class="sports-grid">
            <button
              *ngFor="let sport of sports"
              type="button"
              class="sport-card"
              [class.is-selected]="selectedSports.includes(sport.id)"
              [style.borderColor]="selectedSports.includes(sport.id) ? sport.color : null"
              [style.backgroundColor]="selectedSports.includes(sport.id) ? sport.color + '20' : null"
              (click)="toggle(selectedSports, sport.id)"
            >
              <div class="sport-emoji">{{ sport.emoji }}</div>
              <div
                class="sport-name"
                [style.color]="selectedSports.includes(sport.id) ? sport.color : '#94A3B8'"
              >
                {{ sport.name }}
              </div>
              <span
                *ngIf="selectedSports.includes(sport.id)"
                class="sport-check"
                [style.backgroundColor]="sport.color"
              >
                ✓
              </span>
            </button>
          </div>

          <div *ngIf="step === 2" class="stack-list">
            <button
              *ngFor="let skill of skills"
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

          <div *ngIf="step === 3" class="stack-list">
            <button
              *ngFor="let style of styles"
              type="button"
              class="intent-card"
              [class.is-selected]="playingStyle === style.id"
              [style.background]="playingStyle === style.id ? style.bgPattern : null"
              (click)="playingStyle = style.id"
            >
              <div class="intent-top">
                <div>
                  <div class="intent-title">{{ style.name }}</div>
                  <div class="intent-desc">{{ style.desc }}</div>
                </div>
                <span *ngIf="playingStyle === style.id" class="intent-check">✓</span>
              </div>
              <div class="feature-grid">
                <span
                  *ngFor="let feature of style.features"
                  class="feature-chip"
                  [class.is-selected]="playingStyle === style.id"
                >
                  {{ feature }}
                </span>
              </div>
            </button>
          </div>

          <div *ngIf="step === 4" class="timeline-list">
            <div class="timeline-line"></div>
            <button
              *ngFor="let slot of times"
              type="button"
              class="time-card"
              [class.is-selected]="timeSlots.includes(slot.id)"
              [style.borderColor]="timeSlots.includes(slot.id) ? slot.color : null"
              [style.backgroundColor]="timeSlots.includes(slot.id) ? slot.color + '15' : null"
              (click)="toggle(timeSlots, slot.id)"
            >
              <div
                class="time-icon"
                [style.backgroundColor]="timeSlots.includes(slot.id) ? slot.color : '#1E293B'"
              >
                {{ slot.emoji }}
              </div>
              <div class="time-copy">
                <div class="time-title" [style.color]="timeSlots.includes(slot.id) ? slot.color : '#94A3B8'">
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
          <button *ngIf="step > 1" type="button" class="btn-secondary" (click)="step = step - 1">Back</button>
          <button type="button" class="btn-primary" [disabled]="!canProceed" (click)="next()">
            {{ step === 4 ? 'Complete Setup' : 'Continue' }}
          </button>
        </footer>
      </main>
    </ion-content>
  `,
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  step = 1;
  selectedSports: string[] = [];
  skillLevel = '';
  playingStyle = '';
  timeSlots: string[] = [];

  readonly sports = [
    { id: 'cricket', name: 'Cricket', emoji: '🏏', color: '#22C55E' },
    { id: 'football', name: 'Football', emoji: '⚽', color: '#2563EB' },
    { id: 'basketball', name: 'Basketball', emoji: '🏀', color: '#F97316' },
    { id: 'volleyball', name: 'Volleyball', emoji: '🏐', color: '#7C3AED' },
    { id: 'tennis', name: 'Tennis', emoji: '🎾', color: '#22C55E' },
    { id: 'badminton', name: 'Badminton', emoji: '🏸', color: '#38BDF8' },
    { id: 'paddle', name: 'Paddle', emoji: '🏓', color: '#F59E0B' },
    { id: 'squash', name: 'Squash', emoji: '🎾', color: '#8B5CF6' },
    { id: 'chess', name: 'Chess', emoji: '♟️', color: '#64748B' },
    { id: 'golf', name: 'Golf', emoji: '⛳', color: '#10B981' },
    { id: 'rugby', name: 'Rugby', emoji: '🏉', color: '#DC2626' },
    { id: 'polo', name: 'Polo', emoji: '🏇', color: '#A855F7' },
    { id: 'swimming', name: 'Swimming', emoji: '🏊', color: '#06B6D4' },
    { id: 'hyrox', name: 'Hyrox', emoji: '🏋️', color: '#EF4444' },
    { id: 'marathon', name: 'Marathon', emoji: '🏃', color: '#F97316' },
    { id: 'cycling', name: 'Cycling', emoji: '🚴', color: '#22C55E' },
  ];

  readonly skills = [
    { id: 'beginner', name: 'Beginner', desc: 'Just getting started', progress: 25, gradientClass: 'gradient-green', aiSuggestion: "Perfect! We'll match you with beginner-friendly games and supportive players." },
    { id: 'intermediate', name: 'Intermediate', desc: 'Regular player', progress: 50, gradientClass: 'gradient-blue', aiSuggestion: "Great! You'll find competitive matches with players at your level." },
    { id: 'advanced', name: 'Advanced', desc: 'Skilled and experienced', progress: 75, gradientClass: 'gradient-orange', aiSuggestion: "Excellent! We'll connect you with competitive games and tournaments." },
    { id: 'expert', name: 'Expert', desc: 'Professional level', progress: 100, gradientClass: 'gradient-violet', aiSuggestion: "Impressive! You'll get priority access to pro-level matches and leagues." },
  ];

  readonly styles = [
    { id: 'recreational', name: 'Recreational', desc: 'Play for fun and social connections', features: ['Casual matches', 'Social games', 'Meet new friends', 'Flexible timing'], bgPattern: 'radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.2), transparent 50%)' },
    { id: 'competitive', name: 'Competitive', desc: 'Serious matches and tournaments', features: ['Ranked matches', 'Tournaments', 'League play', 'Skill tracking'], bgPattern: 'radial-gradient(circle at 80% 50%, rgba(249, 115, 22, 0.2), transparent 50%)' },
    { id: 'training', name: 'Training Mode', desc: 'Skill development and coaching', features: ['Coach sessions', 'Skill drills', 'Performance tracking', 'Guided improvement'], bgPattern: 'radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.2), transparent 50%)' },
  ];

  readonly times = [
    { id: 'morning', name: 'Morning', timeRange: '6:00 AM - 12:00 PM', emoji: '🌅', color: '#F59E0B' },
    { id: 'evening', name: 'Evening', timeRange: '4:00 PM - 8:00 PM', emoji: '🌆', color: '#F97316' },
    { id: 'night', name: 'Night', timeRange: '8:00 PM - 12:00 AM', emoji: '🌙', color: '#7C3AED' },
    { id: 'weekend', name: 'Weekends', timeRange: 'Saturday & Sunday', emoji: '🎉', color: '#22C55E' },
    { id: 'flexible', name: 'Flexible', timeRange: 'Anytime works', emoji: '🔄', color: '#38BDF8' },
  ];

  get heading() {
    return ['Select your sports', 'Your skill level', 'Sports intent', 'Preferred time slots'][this.step - 1];
  }

  get description() {
    return ['Choose one or more sports you play', 'Select your current skill level', 'What brings you to the game?', 'When do you usually play?'][this.step - 1];
  }

  get canProceed() {
    if (this.step === 1) return this.selectedSports.length > 0;
    if (this.step === 2) return !!this.skillLevel;
    if (this.step === 3) return !!this.playingStyle;
    return this.timeSlots.length > 0;
  }

  toggle(collection: string[], id: string) {
    const index = collection.indexOf(id);
    if (index >= 0) collection.splice(index, 1);
    else collection.push(id);
  }

  next() {
    if (!this.canProceed) return;
    if (this.step < 4) {
      this.step += 1;
      return;
    }
    this.auth.completeOnboarding();
    this.router.navigateByUrl('/app/home');
  }
}
