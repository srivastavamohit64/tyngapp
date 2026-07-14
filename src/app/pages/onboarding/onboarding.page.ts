import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

interface OnboardingSport {
  id: string;
  name: string;
  image: string;
  accent: string;
}

interface SkillLevel {
  id: string;
  name: string;
  desc: string;
  progress: number;
  gradientClass: string;
  aiSuggestion: string;
}

interface PlayStyle {
  id: string;
  name: string;
  desc: string;
  gradientClass: string;
  features: string[];
  bgPattern: string;
}

interface TimeSlot {
  id: string;
  name: string;
  timeRange: string;
  emoji: string;
  color: string;
}

@Component({
  selector: 'app-onboarding-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  templateUrl: './onboarding.page.html',
  styleUrl: './onboarding.page.scss',
})
export class OnboardingPage implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly stepNumbers = [1, 2, 3, 4];

  step = 1;
  selectedSports: string[] = [];
  skillLevel = '';
  playingStyle = '';
  timeSlots: string[] = [];

  readonly sports: OnboardingSport[] = [
    { id: 'cricket', name: 'Cricket', accent: '#22C55E', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=400&h=500&fit=crop&auto=format' },
    { id: 'football', name: 'Football', accent: '#3B82F6', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=400&h=500&fit=crop&auto=format' },
    { id: 'basketball', name: 'Basketball', accent: '#F97316', image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=400&h=500&fit=crop&auto=format' },
    { id: 'volleyball', name: 'Volleyball', accent: '#A855F7', image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=400&h=500&fit=crop&auto=format' },
    { id: 'tennis', name: 'Tennis', accent: '#FACC15', image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=400&h=500&fit=crop&auto=format' },
    { id: 'badminton', name: 'Badminton', accent: '#38BDF8', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=400&h=500&fit=crop&auto=format' },
    { id: 'padel', name: 'Padel', accent: '#F59E0B', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&h=500&fit=crop&auto=format' },
    { id: 'squash', name: 'Squash', accent: '#8B5CF6', image: 'https://images.unsplash.com/photo-1672068787369-82556699e538?w=400&h=500&fit=crop&auto=format' },
    { id: 'chess', name: 'Chess', accent: '#94A3B8', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=400&h=500&fit=crop&auto=format' },
    { id: 'golf', name: 'Golf', accent: '#10B981', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=400&h=500&fit=crop&auto=format' },
    { id: 'rugby', name: 'Rugby', accent: '#EF4444', image: 'https://images.unsplash.com/photo-1676972523246-2ff4125551fb?w=400&h=500&fit=crop&auto=format' },
    { id: 'kabaddi', name: 'Kabaddi', accent: '#F97316', image: 'https://images.unsplash.com/photo-1771238113635-1f062e3845f9?w=400&h=500&fit=crop&auto=format' },
    { id: 'swimming', name: 'Swimming', accent: '#06B6D4', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=400&h=500&fit=crop&auto=format' },
    { id: 'hyrox', name: 'Hyrox', accent: '#EF4444', image: 'https://images.unsplash.com/photo-1780398585038-d77d3817c3c6?w=400&h=500&fit=crop&auto=format' },
    { id: 'marathon', name: 'Marathon', accent: '#F97316', image: 'https://images.unsplash.com/photo-1613936360976-8f35cf0e5461?w=400&h=500&fit=crop&auto=format' },
    { id: 'cycling', name: 'Cycling', accent: '#22C55E', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=400&h=500&fit=crop&auto=format' },
  ];

  readonly skills: SkillLevel[] = [
    { id: 'beginner', name: 'Beginner', desc: 'Just getting started', progress: 25, gradientClass: 'gradient-green', aiSuggestion: "Perfect! We'll match you with beginner-friendly games and supportive players." },
    { id: 'intermediate', name: 'Intermediate', desc: 'Regular player', progress: 50, gradientClass: 'gradient-blue', aiSuggestion: "Great! You'll find competitive matches with players at your level." },
    { id: 'advanced', name: 'Advanced', desc: 'Skilled and experienced', progress: 75, gradientClass: 'gradient-orange', aiSuggestion: "Excellent! We'll connect you with competitive games and tournaments." },
    { id: 'expert', name: 'Expert', desc: 'Professional level', progress: 100, gradientClass: 'gradient-violet', aiSuggestion: "Impressive! You'll get priority access to pro-level matches and leagues." },
  ];

  readonly styles: PlayStyle[] = [
    {
      id: 'recreational',
      name: 'Recreational',
      desc: 'Play for fun and social connections',
      gradientClass: 'gradient-green',
      features: ['Casual matches', 'Social games', 'Meet new friends', 'Flexible timing'],
      bgPattern: 'radial-gradient(circle at 20% 50%, rgba(34, 197, 94, 0.2), transparent 50%)',
    },
    {
      id: 'competitive',
      name: 'Competitive',
      desc: 'Serious matches and tournaments',
      gradientClass: 'gradient-orange',
      features: ['Ranked matches', 'Tournaments', 'League play', 'Skill tracking'],
      bgPattern: 'radial-gradient(circle at 80% 50%, rgba(249, 115, 22, 0.2), transparent 50%)',
    },
    {
      id: 'training',
      name: 'Training Mode',
      desc: 'Skill development and coaching',
      gradientClass: 'gradient-blue',
      features: ['Coach sessions', 'Skill drills', 'Performance tracking', 'Guided improvement'],
      bgPattern: 'radial-gradient(circle at 50% 20%, rgba(37, 99, 235, 0.2), transparent 50%)',
    },
  ];

  readonly times: TimeSlot[] = [
    { id: 'morning', name: 'Morning', timeRange: '6:00 AM - 12:00 PM', emoji: '🌅', color: '#F59E0B' },
    { id: 'evening', name: 'Evening', timeRange: '4:00 PM - 8:00 PM', emoji: '🌆', color: '#F97316' },
    { id: 'night', name: 'Night', timeRange: '8:00 PM - 12:00 AM', emoji: '🌙', color: '#7C3AED' },
    { id: 'weekend', name: 'Weekends', timeRange: 'Saturday & Sunday', emoji: '🎉', color: '#22C55E' },
    { id: 'flexible', name: 'Flexible', timeRange: 'Anytime works', emoji: '🔄', color: '#38BDF8' },
  ];

  ngOnInit() {
    const role = this.auth.user()?.role;
    if (role === 'coach') {
      void this.router.navigateByUrl('/coach-onboarding', { replaceUrl: true });
    } else if (role === 'venue') {
      void this.router.navigateByUrl('/venue-onboarding', { replaceUrl: true });
    }
  }

  get heading(): string {
    return [
      'Select your sports',
      'Your skill level',
      'Sports intent',
      'Preferred time slots',
    ][this.step - 1];
  }

  get description(): string {
    if (this.step === 1) {
      return this.selectedSports.length > 0
        ? `Choose one or more sports you play — ${this.selectedSports.length} selected`
        : 'Choose one or more sports you play — tap to select';
    }
    return [
      'Select your current skill level',
      'What brings you to the game?',
      'When do you usually play?',
    ][this.step - 1];
  }

  get canProceed(): boolean {
    if (this.step === 1) return this.selectedSports.length > 0;
    if (this.step === 2) return !!this.skillLevel;
    if (this.step === 3) return !!this.playingStyle;
    return this.timeSlots.length > 0;
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

  back() {
    if (this.step > 1) {
      this.step -= 1;
    }
  }

  async next() {
    if (!this.canProceed) return;
    if (this.step < 4) {
      this.step += 1;
      return;
    }

    try {
      await firstValueFrom(this.auth.completeOnboarding({
        name: this.auth.user()?.name || 'Player',
        sports: this.selectedSports,
        experience: this.skillLevel,
        focus: this.playingStyle,
        availability: this.timeSlots,
      }));
    } catch {
      // Continue navigation if API sync fails
    }
    void this.router.navigateByUrl('/app/home');
  }
}
