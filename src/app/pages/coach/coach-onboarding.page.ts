import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
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
  templateUrl: './coach-onboarding.page.html',
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

  async finish() {
    try {
      await firstValueFrom(this.auth.completeOnboarding({
        name: this.auth.user()?.name || 'Coach',
        sports: this.sports,
        experience: this.experience,
        formats: this.formats,
        personality: this.personality,
      }));
    } catch {
      // Keep navigation even if sync fails locally
    }
    void this.router.navigateByUrl('/app/coach/dashboard');
  }
}
