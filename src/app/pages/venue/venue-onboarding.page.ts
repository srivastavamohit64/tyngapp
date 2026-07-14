import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { LocationFieldComponent } from '../../shared/components/location-field/location-field.component';

interface VenueTypeOption {
  id: string;
  label: string;
  emoji: string;
  image: string;
}

interface SportOption {
  id: string;
  label: string;
  emoji: string;
  image: string;
}

const VENUE_TYPES: VenueTypeOption[] = [
  { id: 'multi', label: 'Multi-Sports Complex', emoji: '🏟️', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=400&fit=crop&auto=format' },
  { id: 'football', label: 'Football Turf', emoji: '⚽', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=400&fit=crop&auto=format' },
  { id: 'cricket', label: 'Cricket Academy', emoji: '🏏', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=400&fit=crop&auto=format' },
  { id: 'badminton', label: 'Badminton Arena', emoji: '🏸', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=400&fit=crop&auto=format' },
  { id: 'tennis', label: 'Tennis Club', emoji: '🎾', image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=300&h=400&fit=crop&auto=format' },
  { id: 'basketball', label: 'Basketball Court', emoji: '🏀', image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=300&h=400&fit=crop&auto=format' },
  { id: 'volleyball', label: 'Volleyball Court', emoji: '🏐', image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=300&h=400&fit=crop&auto=format' },
  { id: 'swimming', label: 'Swimming Academy', emoji: '🏊', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=400&fit=crop&auto=format' },
  { id: 'tabletennis', label: 'Table Tennis Centre', emoji: '🏓', image: 'https://images.unsplash.com/photo-1676827613262-5fba25cee5fd?w=300&h=400&fit=crop&auto=format' },
  { id: 'hockey', label: 'Hockey Ground', emoji: '🏑', image: 'https://images.unsplash.com/photo-1541983663620-7571a820610c?w=300&h=400&fit=crop&auto=format' },
  { id: 'golf', label: 'Golf Club', emoji: '⛳', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=400&fit=crop&auto=format' },
  { id: 'fitness', label: 'Fitness & Sports Centre', emoji: '🏋️', image: 'https://images.unsplash.com/photo-1780398683040-fce0ccbd5ef2?w=300&h=400&fit=crop&auto=format' },
];

const SPORTS: SportOption[] = [
  { id: 'cricket', label: 'Cricket', emoji: '🏏', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=400&fit=crop&auto=format' },
  { id: 'football', label: 'Football', emoji: '⚽', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=400&fit=crop&auto=format' },
  { id: 'badminton', label: 'Badminton', emoji: '🏸', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=400&fit=crop&auto=format' },
  { id: 'tennis', label: 'Tennis', emoji: '🎾', image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=300&h=400&fit=crop&auto=format' },
  { id: 'basketball', label: 'Basketball', emoji: '🏀', image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=300&h=400&fit=crop&auto=format' },
  { id: 'volleyball', label: 'Volleyball', emoji: '🏐', image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=300&h=400&fit=crop&auto=format' },
  { id: 'tabletennis', label: 'Table Tennis', emoji: '🏓', image: 'https://images.unsplash.com/photo-1676827613262-5fba25cee5fd?w=300&h=400&fit=crop&auto=format' },
  { id: 'swimming', label: 'Swimming', emoji: '🏊', image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=300&h=400&fit=crop&auto=format' },
  { id: 'hockey', label: 'Hockey', emoji: '🏑', image: 'https://images.unsplash.com/photo-1541983663620-7571a820610c?w=300&h=400&fit=crop&auto=format' },
  { id: 'golf', label: 'Golf', emoji: '⛳', image: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=300&h=400&fit=crop&auto=format' },
  { id: 'rugby', label: 'Rugby', emoji: '🏉', image: 'https://images.unsplash.com/photo-1676972523246-2ff4125551fb?w=300&h=400&fit=crop&auto=format' },
  { id: 'kabaddi', label: 'Kabaddi', emoji: '🥋', image: 'https://images.unsplash.com/photo-1771238113635-1f062e3845f9?w=300&h=400&fit=crop&auto=format' },
  { id: 'chess', label: 'Chess', emoji: '♟️', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=300&h=400&fit=crop&auto=format' },
];

const TOTAL_STEPS = 4;
const WELCOME_FEATURES = ['Receive instant bookings', 'Partner with coaches', 'Manage courts & slots'];

@Component({
  selector: 'app-venue-onboarding',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, LocationFieldComponent],
  templateUrl: './venue-onboarding.page.html',
  styleUrl: './venue-onboarding.page.scss',
})
export class VenueOnboardingPage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly sanitizer = inject(DomSanitizer);

  readonly totalSteps = TOTAL_STEPS;
  readonly stepNumbers = [1, 2, 3, 4];
  readonly venueTypes = VENUE_TYPES;
  readonly sportsList = SPORTS;
  readonly welcomeFeatures = WELCOME_FEATURES;

  step = 1;
  venueType = '';
  venueName = '';
  businessName = '';
  ownerName = '';
  mobile = '';
  email = '';
  city = '';
  address = '';
  sports: string[] = [];

  canProceed(): boolean {
    if (this.step === 1) return true;
    if (this.step === 2) return !!this.venueType;
    if (this.step === 3) return !!this.venueName.trim() && !!this.ownerName.trim() && this.mobile.replace(/\D/g, '').length >= 10;
    if (this.step === 4) return this.sports.length > 0;
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
    void this.finish();
  }

  toggleSport(id: string) {
    const idx = this.sports.indexOf(id);
    if (idx >= 0) this.sports.splice(idx, 1);
    else this.sports.push(id);
  }

  getVenueTypeLabel(): string {
    return VENUE_TYPES.find(v => v.id === this.venueType)?.label ?? '';
  }

  onMobileInput(value: string) {
    this.mobile = (value || '').replace(/\D/g, '').slice(0, 10);
  }

  showMapPreview(): boolean {
    return this.address.trim().length > 10;
  }

  mapEmbedUrl(): string {
    return `https://maps.google.com/maps?q=${encodeURIComponent(`${this.address}, ${this.city}`)}&output=embed&z=14`;
  }

  mapEmbedSafeUrl(): SafeResourceUrl {
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.mapEmbedUrl());
  }

  async finish() {
    try {
      await firstValueFrom(this.auth.completeOnboarding({
        name: this.ownerName.trim() || this.venueName.trim() || 'Venue Owner',
        location: this.city.trim() || null,
        sports: this.sports,
        experience: this.venueType,
      }));
    } catch {
      // Continue navigation if API sync fails
    }
    void this.router.navigateByUrl('/app/venue/dashboard');
  }
}
