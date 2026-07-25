import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { VenueCourtCard, VenueService } from '../../core/services/venue.service';
import { AuthService } from '../../core/services/auth.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

export interface Court {
  id: string;
  courtName: string;
  venueName: string;
  sport: string;
  image: string;
  distance: number;
  rating: number;
  ratingCount: number;
  pricePerHour: number;
  openTime: string;
  closeTime: string;
  amenities: string[];
  hasRentalGear: boolean;
  gamesPlayed: number;
  isIndoor: boolean;
  isOpenNow: boolean;
  venueDetailId: number | string;
  city?: string;
}

const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&h=420&fit=crop&auto=format';
const KNOWN_CITIES = ['Lucknow', 'Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

@Component({
  selector: 'app-venues-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent],
  styleUrls: ['./venues.page.scss'],
  templateUrl: './venues.page.html',
})
export class VenuesPage implements OnInit {
  private readonly router = inject(Router);
  private readonly venueService = inject(VenueService);
  private readonly auth = inject(AuthService);

  city = signal('Lucknow');
  showCityPicker = signal(false);
  searchQuery = signal('');
  activeSport = signal('all');
  activeFilters = signal<string[]>([]);
  loading = signal(true);
  errorMessage = signal('');
  courts = signal<Court[]>([]);
  usedFallbackCity = signal(false);

  readonly cities = KNOWN_CITIES;

  readonly sports = [
    { id: 'all',         label: 'All',          image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=120&h=120&fit=crop&auto=format' },
    { id: 'basketball',  label: 'Basketball',   image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=120&h=120&fit=crop&auto=format' },
    { id: 'football',    label: 'Football',     image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=120&h=120&fit=crop&auto=format' },
    { id: 'cricket',     label: 'Cricket',      image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=120&h=120&fit=crop&auto=format' },
    { id: 'tennis',      label: 'Tennis',       image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=120&h=120&fit=crop&auto=format' },
    { id: 'badminton',   label: 'Badminton',    image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=120&h=120&fit=crop&auto=format' },
    { id: 'volleyball',  label: 'Volleyball',   image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=120&h=120&fit=crop&auto=format' },
    { id: 'swimming',    label: 'Swimming',     image: 'https://images.unsplash.com/photo-1530549387789-4c1017266635?w=120&h=120&fit=crop&auto=format' },
    { id: 'tabletennis', label: 'Table Tennis', image: 'https://images.unsplash.com/photo-1676827613262-5fba25cee5fd?w=120&h=120&fit=crop&auto=format' },
    { id: 'pickleball',  label: 'Pickleball',   image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=120&h=120&fit=crop&auto=format' },
  ];

  readonly filterChips = [
    { id: 'indoor',  label: 'Indoor',  icon: 'business-outline' },
    { id: 'outdoor', label: 'Outdoor', icon: 'leaf-outline' },
    { id: 'morning', label: 'Morning', icon: 'sunny-outline' },
    { id: 'evening', label: 'Evening', icon: 'moon-outline' },
    { id: 'rental',  label: 'Rental',  icon: 'shirt-outline' },
    { id: 'open',    label: 'Open Now', icon: 'radio-button-on-outline' },
    { id: 'price',   label: 'Price',   icon: 'pricetag-outline' },
    { id: 'rating',  label: 'Rating',  icon: 'star-outline' },
  ];

  readonly amenityMap: Record<string, { icon: string; label: string }> = {
    parking:   { icon: 'car-outline',   label: 'Parking' },
    lights:    { icon: 'flash-outline', label: 'Lights' },
    washrooms: { icon: 'water-outline', label: 'WC' },
    water:     { icon: 'water-outline', label: 'Water' },
    cafeteria: { icon: 'cafe-outline',  label: 'Café' },
    changing:  { icon: 'shirt-outline', label: 'Changing' },
  };

  filteredCourts = computed(() => {
    let result = [...this.courts()];
    const sport = this.activeSport();
    const query = this.searchQuery().trim().toLowerCase();
    const activeFlts = this.activeFilters();
    const city = this.city().toLowerCase();

    if (sport !== 'all') {
      result = result.filter((c) => c.sport === sport);
    }
    if (query) {
      result = result.filter((c) =>
        c.courtName.toLowerCase().includes(query) ||
        c.venueName.toLowerCase().includes(query) ||
        (c.city || '').toLowerCase().includes(query),
      );
    }
    if (activeFlts.includes('indoor')) result = result.filter((c) => c.isIndoor);
    if (activeFlts.includes('outdoor')) result = result.filter((c) => !c.isIndoor);
    if (activeFlts.includes('open')) result = result.filter((c) => c.isOpenNow);
    if (activeFlts.includes('rental')) result = result.filter((c) => c.hasRentalGear);
    if (activeFlts.includes('morning')) {
      result = result.filter((c) => {
        const hour = this.parseHour(c.openTime);
        return hour !== null && hour < 12;
      });
    }
    if (activeFlts.includes('evening')) {
      result = result.filter((c) => {
        const close = this.parseHour(c.closeTime);
        return close !== null && close >= 16;
      });
    }
    if (activeFlts.includes('price')) {
      result.sort((a, b) => a.pricePerHour - b.pricePerHour);
    } else if (activeFlts.includes('rating')) {
      result.sort((a, b) => b.rating - a.rating);
    } else {
      result.sort((a, b) => {
        const aMatch = (a.city || '').toLowerCase().includes(city) ? 0 : 1;
        const bMatch = (b.city || '').toLowerCase().includes(city) ? 0 : 1;
        return aMatch - bMatch;
      });
    }

    return result;
  });

  ngOnInit() {
    this.city.set(this.resolveCity(this.auth.user()?.location));
    void this.loadCourts();
  }

  async loadCourts() {
    this.loading.set(true);
    this.errorMessage.set('');
    this.usedFallbackCity.set(false);

    try {
      // Load all open courts, then prefer the selected city client-side.
      // Strict city API filtering was hiding venues when locality/city text did not match exactly.
      const response = await firstValueFrom(this.venueService.getCourts());

      if (response.success && Array.isArray(response.data)) {
        const mapped = response.data.map((court) => this.mapCourt(court));
        const city = this.city().toLowerCase();
        const preferredCount = mapped.filter((court) =>
          (court.city || '').toLowerCase().includes(city),
        ).length;
        this.courts.set(mapped);
        this.usedFallbackCity.set(preferredCount === 0 && mapped.length > 0);
      } else {
        this.courts.set([]);
        this.errorMessage.set(response.message || 'Unable to load courts.');
      }
    } catch (error: any) {
      this.courts.set([]);
      this.errorMessage.set(error?.error?.message || 'Unable to load courts.');
    } finally {
      this.loading.set(false);
    }
  }

  setSport(id: string) {
    this.activeSport.set(id);
  }

  toggleFilter(id: string) {
    this.activeFilters.update((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  }

  selectCity(c: string) {
    this.city.set(c);
    this.showCityPicker.set(false);
    void this.loadCourts();
  }

  bookNow(court: Court) {
    void this.router.navigateByUrl(`/app/venue/${court.venueDetailId}`);
  }

  resetAll() {
    this.activeSport.set('all');
    this.activeFilters.set([]);
    this.searchQuery.set('');
    this.city.set('Lucknow');
    void this.loadCourts();
  }

  private resolveCity(location?: string | null): string {
    const raw = (location || '').trim();
    if (!raw) return 'Lucknow';

    const known = KNOWN_CITIES.find((city) =>
      raw.toLowerCase().includes(city.toLowerCase()),
    );
    if (known) return known;

    // Locality-only addresses (e.g. Kapoorthla) map to Lucknow for now.
    return 'Lucknow';
  }

  private mapCourt(court: VenueCourtCard): Court {
    return {
      id: court.id,
      courtName: court.courtName,
      venueName: court.venueName,
      sport: (court.sport || '').toLowerCase(),
      image: court.image || DEFAULT_IMAGE,
      distance: court.distance ?? 0,
      rating: court.rating || 4.5,
      ratingCount: court.ratingCount || 0,
      pricePerHour: Number(court.pricePerHour || 0),
      openTime: court.openTime || '6:00 AM',
      closeTime: court.closeTime || '10:00 PM',
      amenities: court.amenities || [],
      hasRentalGear: !!court.hasRentalGear,
      gamesPlayed: court.gamesPlayed || 0,
      isIndoor: !!court.isIndoor,
      isOpenNow: !!court.isOpenNow,
      venueDetailId: court.venueId,
      city: court.city || undefined,
    };
  }

  private parseHour(value: string): number | null {
    try {
      const date = new Date(`1970-01-01 ${value}`);
      if (Number.isNaN(date.getTime())) return null;
      return date.getHours();
    } catch {
      return null;
    }
  }
}
