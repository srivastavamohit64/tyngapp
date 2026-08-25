import { CommonModule } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, MenuController, ViewWillEnter } from '@ionic/angular';
import { Subscription, firstValueFrom } from 'rxjs';
import { BookingRecord, HomeAd } from '../../core/models/api.model';
import { AdService } from '../../core/services/ad.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService } from '../../core/services/booking.service';
import { DesignDataService } from '../../core/services/design-data.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { LocationService, UserLocation, LocationError, LocationErrorType } from '../../core/services/location.service';
import {
  formatBookingDate,
  formatBookingTime,
} from '../../core/utils/booking.utils';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { EventGame } from '../../shared/models/app.models';

interface QuickSuggestion {
  id: string;
  title: string;
  meta: string;
}

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [
    CommonModule,
    IonicModule,
    BrandHeaderShellComponent,
  ],
  styleUrls: ['./home.page.scss'],
  templateUrl: './home.page.html',
})
export class HomePage implements ViewWillEnter, OnDestroy {
  readonly data = inject(DesignDataService);
  readonly auth = inject(AuthService);
  private readonly bookingService = inject(BookingService);
  private readonly adService = inject(AdService);
  private readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);
  private readonly menu = inject(MenuController);
  private readonly locationService = inject(LocationService);

  readonly notificationRoute = computed(() =>
    this.auth.user()?.role === 'coach' ? '/app/coach/notifications' : '/app/notifications'
  );

  private nearbyRealtimeSub?: Subscription;

  nearbyGames: EventGame[] = [];
  nearbyBookings: BookingRecord[] = [];
  nearbyLoading = false;
  nearbyError = '';
  quickSuggestion: QuickSuggestion | null = null;

  homeAds: HomeAd[] = [];
  adsLoading = true;
  adSlideIndex = 0;
  private adSliderTimer?: ReturnType<typeof setInterval>;

  // General state
  greeting = '';
  currentLocation?: UserLocation;
  locationLoading = false;
  locationError?: string;

  get helloName(): string {
    return (this.auth.user()?.name || '').trim() || 'Player';
  }

  // Coach Dashboard state
  coachProfileDismissed = signal(false);
  readonly coachPulseMetrics = [
    { icon: '📅', label: "Today's Sessions", value: '4', accent: 'var(--app-primary)' },
    { icon: '💰', label: 'Expected Earnings', value: '₹4,250', accent: '#FF7A00' },
    { icon: '⭐', label: 'New Reviews', value: '3', accent: '#F59E0B' },
    { icon: '👥', label: 'Booking Requests', value: '5', accent: '#38BDF8' },
  ];
  readonly coachSessions = [
    { id: 1, sport: 'Cricket', emoji: '🏏', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=300&fit=crop&auto=format', title: 'Elite Cricket Academy', team: 'Advanced Batch · 12 Students', venue: 'Phoenix Arena', time: '6:00 PM', type: 'Training', status: 'upcoming', startsIn: 'Starts in 45 min' },
    { id: 2, sport: 'Football', emoji: '⚽', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=300&fit=crop&auto=format', title: 'Football Skills Workshop', team: 'Junior Squad · 8 Students', venue: 'K.D. Singh Stadium', time: '7:30 PM', type: 'Skills', status: 'upcoming', startsIn: 'Starts in 2h 15m' },
    { id: 3, sport: 'Badminton', emoji: '🏸', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=300&fit=crop&auto=format', title: 'Individual Coaching', team: 'Priya Verma · 1 Student', venue: 'Sports Complex', time: '4:00 PM', type: 'One-on-One', status: 'completed', startsIn: null },
  ];
  readonly coachQuickActions = [
    { icon: 'add-outline', label: 'New Session', sub: 'Schedule a slot', color: 'var(--app-primary)', path: '/app/coach/create-session' },
    { icon: 'calendar-outline', label: 'Manage Schedule', sub: 'View your calendar', color: '#FF7A00', path: '/app/coach/schedule' },
    { icon: 'person-add-outline', label: 'Add Student', sub: 'Onboard a new player', color: '#38BDF8', path: '/app/coach/enroll-student' },
    { icon: 'analytics-outline', label: 'Evaluate Player', sub: 'Track progress', color: '#7C3AED', path: '/app/coach/evaluate' },
  ];
  readonly coachActivities = [
    { id: 1, icon: '✓', bg: '#F0FDF4', color: '#16A34A', text: 'Rahul completed Session #18', time: '20 min ago' },
    { id: 2, icon: '⭐', bg: '#FFFBEB', color: '#D97706', text: 'You received a 5-Star Review from Ananya', time: '1 hr ago' },
    { id: 3, icon: '🏆', bg: '#F5F3FF', color: '#7C3AED', text: 'Aarav won District Badminton Championship', time: '3 hrs ago' },
    { id: 4, icon: '💰', bg: '#F0FDF4', color: '#16A34A', text: '₹1,200 Payment Received', time: '5 hrs ago' },
    { id: 5, icon: '📅', bg: '#EFF6FF', color: '#3B82F6', text: 'Session Rescheduled — Priya moved to 7 PM', time: 'Yesterday' },
  ];
  readonly coachVenues = [
    { id: 1, name: 'Ekana Cricket Stadium', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=200&fit=crop&auto=format', distance: '2.1 km', slots: 3 },
    { id: 2, name: 'Phoenix Sports Hub', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=200&fit=crop&auto=format', distance: '3.8 km', slots: 5 },
    { id: 3, name: 'Sports Authority Complex', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&auto=format', distance: '4.5 km', slots: 2 },
  ];
  readonly coachCommunity = [
    { id: 1, title: 'Coach Workshop', sub: 'This Saturday · 4 PM', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=160&fit=crop&auto=format', tag: 'Workshop' },
    { id: 2, title: 'NIS Certification', sub: 'Registrations Open', image: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=300&h=160&fit=crop&auto=format', tag: 'Certification' },
    { id: 3, title: 'Sports Seminar', sub: 'Next Wed · Online', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=160&fit=crop&auto=format', tag: 'Seminar' },
  ];
  readonly coachReviews = [
    { name: 'Ananya Patel', photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&auto=format', rating: 5, text: 'Excellent coaching session. My cricket technique improved dramatically in just 3 weeks.' },
    { name: 'Rahul Sharma', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', rating: 5, text: 'My batting improved significantly after just 5 sessions. Highly recommended!' },
  ];

  // Venue Dashboard state
  venueProfileDismissed = signal(false);
  readonly venuePulseMetrics = [
    { icon: '🏟️', label: "Today's Bookings", value: '8', accent: 'var(--app-primary)' },
    { icon: '💰', label: "Today's Revenue", value: '₹12,500', accent: '#FF7A00' },
    { icon: '📈', label: 'Occupancy Rate', value: '74%', accent: '#38BDF8' },
    { icon: '📩', label: 'Pending Requests', value: '3', accent: '#F59E0B' },
  ];
  readonly venueBookings = [
    { id: 1, name: 'Rahul Sharma', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', sport: 'Cricket', court: 'Court 1', time: '6:00 – 8:00 AM', amount: '₹2,400', status: 'Confirmed', type: 'player' },
    { id: 2, name: 'Coach Aryan Mehta', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', sport: 'Football', court: 'Court 2', time: '4:00 – 6:00 PM', amount: '₹3,000', status: 'Confirmed', type: 'coach' },
    { id: 3, name: 'Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', sport: 'Badminton', court: 'Court 3', time: '7:00 – 8:00 PM', amount: '₹800', status: 'Pending', type: 'player' },
  ];
  readonly venueCourts = [
    { name: 'Court 1', bookedCount: 8, totalCount: 16, slots: [true, true, true, false, false, false, false, true, true, true, true, false, false, true, true, false] },
    { name: 'Court 2', bookedCount: 6, totalCount: 16, slots: [true, true, false, false, false, false, true, true, true, false, false, false, true, true, false, false] },
    { name: 'Court 3', bookedCount: 7, totalCount: 16, slots: [false, false, false, true, true, false, false, false, false, true, true, true, false, false, true, true] },
  ];
  readonly slotHours = ['6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'];
  readonly venueCoachSessions = [
    { id: 1, name: 'Coach Aryan Mehta', photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=80&h=80&fit=crop&auto=format', sport: 'Football', time: '4:00 PM', students: 8, court: 'Court 2' },
    { id: 2, name: 'Coach Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', sport: 'Badminton', time: '6:00 PM', students: 4, court: 'Court 3' },
  ];
  readonly venueActivities = [
    { emoji: '✅', bg: '#F0FDF4', color: '#16A34A', text: 'Booking confirmed — Rahul Sharma, Cricket, Court 1', time: '10 min ago' },
    { emoji: '💰', bg: '#F0FDF4', color: '#16A34A', text: 'Payment received — ₹2,400 for cricket session', time: '12 min ago' },
    { emoji: '🤝', bg: '#EFF6FF', color: '#3B82F6', text: 'Coach partnership approved — Aryan Mehta', time: '1 hr ago' },
    { emoji: '❌', bg: '#FEF2F2', color: '#EF4444', text: 'Booking cancelled — Kabir Malhotra, Tennis', time: '2 hrs ago' },
    { emoji: '🎉', bg: '#F5F3FF', color: '#7C3AED', text: 'Weekend Football Tournament created', time: 'Yesterday' },
  ];
  readonly venueAiTips = [
    { emoji: '📉', text: 'Court 3 occupancy is 34% below average this week. Consider creating a discount offer.' },
    { emoji: '⚽', text: 'Evening football slots are fully booked. Consider opening additional sessions.' },
    { emoji: '📷', text: 'Add more venue photos to improve your search visibility by up to 40%.' },
    { emoji: '📈', text: 'Weekend demand is increasing. Review and update your weekend pricing.' },
  ];
  readonly venuePendingActions = [
    { label: 'Approve Booking', sub: 'Vikram Singh — Basketball, 8 PM', urgency: 'high' },
    { label: 'Respond to Coach', sub: 'Coach Deepika — partnership request', urgency: 'medium' },
    { label: 'Confirm Partnership', sub: 'Elite Cricket Academy', urgency: 'medium' },
    { label: 'Update Weekend Pricing', sub: 'Rates outdated since last month', urgency: 'low' },
  ];
  readonly venueChecklist = [
    { label: 'Venue Information', done: true },
    { label: 'Sports Offered', done: true },
    { label: 'Photos', done: false },
    { label: 'Pricing', done: false },
    { label: 'Verification', done: false },
  ];

  constructor() {
    const hour = new Date().getHours();
    this.greeting = hour < 12 ? 'Good Morning,' : hour < 17 ? 'Good Afternoon,' : hour < 21 ? 'Good Evening,' : 'Good Night,';
    const role = this.auth.user()?.role;
    if (role === 'admin') {
      void this.router.navigateByUrl('/app/admin/dashboard', { replaceUrl: true });
    } else if (role === 'venue') {
      void this.router.navigateByUrl(this.auth.venueHomePath(), { replaceUrl: true });
    }
  }

  ionViewWillEnter() {
    const role = this.auth.user()?.role;
    if (role === 'player' || !role) {
      void this.loadNearbyGames();
      void this.loadHomeAds();
      void this.loadCurrentLocation();
      this.listenForNearbyGames();
    }
  }

  ngOnDestroy() {
    this.nearbyRealtimeSub?.unsubscribe();
    this.stopAdSlider();
  }

  async loadCurrentLocation() {
    this.seedSavedLocation();
    this.locationLoading = true;
    this.locationError = undefined;

    try {
      const location = await this.locationService.getLocationWithFallback();
      if (location) {
        this.currentLocation = await this.enrichLocation(location);
        await this.syncProfileLocation(this.currentLocation);
      }
    } catch (error: any) {
      this.seedSavedLocation();
      if (error instanceof LocationError && error.type === LocationErrorType.GPS_DISABLED) {
        this.locationError = 'Enable GPS to see your location';
      } else if (error instanceof LocationError) {
        this.locationError = 'Location permission denied';
      }
    } finally {
      this.locationLoading = false;
    }
  }

  private seedSavedLocation() {
    if (this.currentLocation?.shortLabel || this.currentLocation?.address) {
      return;
    }
    const saved = this.locationService.getSavedLocation();
    if (saved) {
      this.currentLocation = saved;
      return;
    }
    const profile = (this.auth.user()?.location || '').trim();
    if (profile) {
      this.currentLocation = {
        latitude: 0,
        longitude: 0,
        shortLabel: profile,
        address: profile,
        timestamp: 0,
      };
    }
  }

  private async enrichLocation(location: UserLocation): Promise<UserLocation> {
    if (location.postalArea && location.pincode) {
      return location;
    }
    try {
      const details = await this.locationService.reverseGeocodeDetails(location.latitude, location.longitude);
      const enriched: UserLocation = {
        ...location,
        address: details.address || location.address,
        postalArea: details.postalArea,
        pincode: details.pincode,
        city: details.city,
        shortLabel: details.shortLabel,
      };
      this.locationService.saveLocation(enriched);
      return enriched;
    } catch {
      return location;
    }
  }

  private async syncProfileLocation(location: UserLocation) {
    const label = (location.shortLabel || '').trim();
    if (!label) return;

    const current = (this.auth.user()?.location || '').trim();
    if (current.toLowerCase() === label.toLowerCase()) return;

    try {
      await firstValueFrom(this.auth.updateProfile({ location: label }));
      void this.loadNearbyGames();
    } catch (error) {
      console.warn('Could not save GPS location to profile:', error);
    }
  }

  async refreshLocation() {
    await this.loadCurrentLocation();
  }

  async openAppSettings() {
    try {
      // For Android, open app settings using intent URL
      window.open('package:com.tyng.app', '_system');
    } catch (error) {
      console.error('Failed to open app settings:', error);
    }
  }

  async openLocationSettings() {
    try {
      // For Android, open location settings
      window.open('android.settings.LOCATION_SOURCE_SETTINGS', '_system');
    } catch (error) {
      console.error('Failed to open location settings:', error);
    }
  }

  private listenForNearbyGames() {
    if (this.nearbyRealtimeSub) return;
    void this.realtime.connect();
    this.nearbyRealtimeSub = this.realtime.nearbyGames$.subscribe((event) => {
      if (event.type === 'created') {
        this.upsertNearbyBooking(event.game, true);
        return;
      }
      this.upsertNearbyBooking(event.game, false);
    });
  }

  private upsertNearbyBooking(booking: BookingRecord, prepend: boolean) {
    // Keep Nearby Games to joinable social matches only (not direct solo venue bookings).
    if (!this.isJoinableNearbyGame(booking)) {
      this.nearbyBookings = this.nearbyBookings.filter((item) => item.id !== booking.id);
      this.nearbyGames = this.nearbyBookings.map((item) => this.mapNearbyGame(item));
      this.quickSuggestion = this.buildQuickSuggestion(this.nearbyBookings);
      return;
    }

    const existingIndex = this.nearbyBookings.findIndex((item) => item.id === booking.id);
    if (existingIndex >= 0) {
      this.nearbyBookings = [
        ...this.nearbyBookings.slice(0, existingIndex),
        booking,
        ...this.nearbyBookings.slice(existingIndex + 1),
      ];
    } else if (prepend) {
      this.nearbyBookings = [booking, ...this.nearbyBookings];
    } else {
      this.nearbyBookings = [...this.nearbyBookings, booking];
    }
    this.nearbyGames = this.nearbyBookings.map((item) => this.mapNearbyGame(item));
    this.quickSuggestion = this.buildQuickSuggestion(this.nearbyBookings);
    this.nearbyError = '';
  }

  private isJoinableNearbyGame(booking: BookingRecord): boolean {
    const total = Number(booking.totalPlayers || 0);
    const current = Number(booking.currentPlayers || 0);
    const status = String(booking.bookingStatus || '');
    return total > 1
      && current < total
      && status !== 'full'
      && status !== 'pending'
      && status !== 'cancelled'
      && status !== 'expired'
      && status !== 'completed';
  }

  get locationLabel(): string {
    const live = (this.currentLocation?.postalArea
      || this.currentLocation?.city
      || this.currentLocation?.shortLabel
      || this.currentLocation?.address
      || '').trim();
    if (live) return this.withoutPincode(live);

    const saved = this.locationService.getSavedLocation();
    const cached = (saved?.postalArea || saved?.city || saved?.shortLabel || saved?.address || '').trim();
    if (cached) return this.withoutPincode(cached);

    const profile = (this.auth.user()?.location || '').trim();
    if (profile) return this.withoutPincode(profile);

    return this.locationLoading ? 'Detecting location…' : 'Set your location';
  }

  get playerLocation(): string {
    return this.locationLabel === 'Detecting location…' || this.locationLabel === 'Set your location'
      ? ''
      : this.locationLabel;
  }

  /** Postal area / neighbourhood from GPS, else profile. */
  get locationCity(): string {
    if (this.currentLocation?.postalArea) {
      return this.currentLocation.postalArea;
    }
    const parts = this.shortLocationParts;
    if (parts[0]) return parts[0];
    if (this.locationLoading) return 'Detecting location…';
    return 'Set your location';
  }

  get locationArea(): string {
    if (this.currentLocation?.city && this.currentLocation.city.toLowerCase() !== this.locationCity.toLowerCase()) {
      return this.currentLocation.city;
    }
    const parts = this.shortLocationParts;
    if (parts.length < 2) return '';
    const city = this.pickCityName(parts);
    return city && city.toLowerCase() !== parts[0].toLowerCase() ? city : '';
  }

  private withoutPincode(value: string): string {
    return value
      .replace(/\b\d{5,6}\b/g, '')
      .replace(/\s*[>\-,/|]\s*(?=\s*[>\-,/|]|$)/g, '')
      .replace(/\s*[>\-,/|]\s*/g, ' > ')
      .replace(/\s{2,}/g, ' ')
      .replace(/^[>\-,/|\s]+|[>\-,/|\s]+$/g, '')
      .trim();
  }

  private get shortLocationParts(): string[] {
    if (!this.playerLocation) return [];
    return this.playerLocation
      .split(/[>,\-\/|]+/)
      .map((part) => part.trim())
      .filter(Boolean)
      .filter((part) => part.length > 0 && !/^(india|bharat)$/i.test(part) && !/^\d{5,6}$/.test(part));
  }

  private pickCityName(parts: string[]): string {
    const stateLike =
      /(pradesh|nadu|bengal|rashtra|delhi|goa|gujarat|rajasthan|punjab|haryana|kerala|karnataka|odisha|bihar|assam|sikkim|jharkhand|chhattisgarh|uttarakhand|himachal|telangana|andhra|madhya|west bengal)$/i;
    const candidates = parts.slice(1).filter((part) => !stateLike.test(part));
    return candidates[candidates.length - 1] || parts[1] || '';
  }

  editLocation() {
    void this.router.navigateByUrl('/app/profile/edit');
  }

  async loadNearbyGames() {
    this.nearbyLoading = true;
    this.nearbyError = '';
    try {
      const nearby = this.locationService.nearbyLocationQuery(this.auth.user()?.location);
      const response = await firstValueFrom(
        this.bookingService.getNearbyGames(20, {
          matchLocation: !!nearby.query,
          location: nearby.query || undefined,
        }),
      );
      if (response.success && Array.isArray(response.data)) {
        this.nearbyBookings = response.data.filter((booking) => this.isJoinableNearbyGame(booking));
        this.nearbyGames = this.nearbyBookings.map((booking) => this.mapNearbyGame(booking));
        this.quickSuggestion = this.buildQuickSuggestion(this.nearbyBookings);
      } else {
        this.nearbyBookings = [];
        this.nearbyGames = [];
        this.quickSuggestion = null;
        this.nearbyError = response.message || 'Unable to load nearby games.';
      }
    } catch (error: any) {
      this.nearbyBookings = [];
      this.nearbyGames = [];
      this.quickSuggestion = null;
      this.nearbyError = error?.error?.message || 'Unable to load nearby games.';
    } finally {
      this.nearbyLoading = false;
    }
  }

  private buildQuickSuggestion(bookings: BookingRecord[]): QuickSuggestion | null {
    if (!this.playerLocation) return null;

    const match = bookings.find((booking) =>
      this.matchesPlayerLocation(
        `${booking.venue?.location || ''} ${booking.venue?.name || ''} ${booking.host?.location || ''}`
      )
    );
    if (!match) return null;

    const sport = (match.sport || 'Game').replace(/\b\w/g, (c) => c.toUpperCase());
    const venue = match.venue?.name || 'Nearby venue';
    return {
      id: match.id,
      title: `${sport} near you at ${venue}`,
      meta: `${formatBookingDate(match.bookingDate)} · ${formatBookingTime(match.startTime)} · ${match.currentPlayers}/${match.totalPlayers} joined`,
    };
  }

  private matchesPlayerLocation(haystack: string): boolean {
    const tokens = this.playerLocation
      .toLowerCase()
      .split(/[>,\-\/|]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 3);
    if (!tokens.length) return false;
    const text = haystack.toLowerCase();
    return tokens.some((token) => text.includes(token));
  }

  private mapNearbyGame(booking: BookingRecord): EventGame {
    const ratio = booking.totalPlayers > 0 ? booking.currentPlayers / booking.totalPlayers : 0;
    const sport = (booking.sport || 'Game').replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      id: booking.id,
      sport,
      time: `${formatBookingDate(booking.bookingDate)} · ${formatBookingTime(booking.startTime)}`,
      location: booking.venue?.name || 'Venue TBD',
      distance: booking.venue?.location || 'Nearby',
      players: `${booking.currentPlayers}/${booking.totalPlayers}`,
      status: ratio >= 0.8 ? 'almost-full' : 'filling',
    };
  }

  async openMenu() {
    await this.menu.open();
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  async loadHomeAds() {
    this.adsLoading = true;
    try {
      this.homeAds = await firstValueFrom(this.adService.list('home_banner'));
      this.adSlideIndex = 0;
      this.startAdSlider();
    } catch {
      this.homeAds = [];
      this.stopAdSlider();
    } finally {
      this.adsLoading = false;
    }
  }

  selectAdSlide(index: number) {
    if (index < 0 || index >= this.homeAds.length) return;
    this.adSlideIndex = index;
    this.startAdSlider();
  }

  openAd(ad: HomeAd) {
    const url = (ad.linkUrl || '').trim();
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private startAdSlider() {
    this.stopAdSlider();
    if (this.homeAds.length < 2) return;
    this.adSliderTimer = setInterval(() => {
      this.adSlideIndex = (this.adSlideIndex + 1) % this.homeAds.length;
    }, 4000);
  }

  private stopAdSlider() {
    if (this.adSliderTimer) {
      clearInterval(this.adSliderTimer);
      this.adSliderTimer = undefined;
    }
  }

  getStatusStyle(status: string) {
    if (status === 'upcoming') return { bg: '#FFF7ED', color: '#C2410C' };
    if (status === 'completed') return { bg: '#F3F4F6', color: '#6B7280' };
    if (status === 'Confirmed') return { bg: '#F0FDF4', color: '#16A34A' };
    if (status === 'Pending') return { bg: '#FFF7ED', color: '#C2410C' };
    return { bg: '#F3F4F6', color: '#6B7280' };
  }

  getUrgencyColor(urgency: string) {
    if (urgency === 'high') return '#EF4444';
    if (urgency === 'medium') return '#F59E0B';
    return '#9CA3AF';
  }
}
