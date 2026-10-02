import { CommonModule } from '@angular/common';
import { Component, OnDestroy, ViewChild, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonPopover, IonicModule, MenuController, Platform, ToastController, ViewWillEnter, ViewWillLeave } from '@ionic/angular';
import { PluginListenerHandle } from '@capacitor/core';
import { App } from '@capacitor/app';
import { Subscription, firstValueFrom } from 'rxjs';
import { BookingRecord, CoachDashboard, CoachDashboardMilestone, CoachDashboardWeather, HomeAd, HomePromotion } from '../../core/models/api.model';
import { AdService } from '../../core/services/ad.service';
import { AuthService } from '../../core/services/auth.service';
import { BookingService, HomeSportGameCard } from '../../core/services/booking.service';
import { CoachService } from '../../core/services/coach.service';
import { RealtimeService } from '../../core/services/realtime.service';
import { LocationService, UserLocation, LocationError, LocationErrorType } from '../../core/services/location.service';
import { HomePromotionService } from '../../core/services/home-promotion.service';
import {
  CURRENT_LOCATION_ID,
  SavedAddress,
  SavedAddressesService,
} from '../../core/services/saved-addresses.service';
import {
  formatBookingDate,
  formatBookingTime,
} from '../../core/utils/booking.utils';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { EventGame } from '../../shared/models/app.models';
import { VenueEventRecord, VenueEventService } from '../../core/services/venue-event.service';
import { VenueListItem, VenueService } from '../../core/services/venue.service';
import { PlayerProfileService } from '../../core/services/player-profile.service';
import { XpService, XpSummary } from '../../core/services/xp.service';

interface HomeRaceRow {
  rank: number;
  name: string;
  initials: string;
  caption: string;
  xp: number;
  me: boolean;
}

interface HomeBadgeCard {
  name: string;
  description: string;
  icon: string;
  color: string;
  tint: string;
  earned: boolean;
}

const HOME_SPORTS_COUNT = 5;
const HOME_SPORTS_STORAGE_PREFIX = 'tyng_home_sports_';

const HOME_BADGE_PALETTES = [
  { color: '#D97706', tint: '#FFFBEB' },
  { color: '#7C3AED', tint: '#F5F3FF' },
  { color: '#2563EB', tint: '#EFF6FF' },
  { color: '#16A34A', tint: '#F0FDF4' },
];

interface QuickSuggestion {
  id: string;
  title: string;
  meta: string;
}

interface HomeSport {
  id: string;
  name: string;
  icon: string;
  box?: boolean;
}

interface HomeSportGroup {
  name: string;
  sports: HomeSport[];
}

interface HomeCoachCard {
  id: number;
  name: string;
  image: string | null;
  sport: string;
  specialties: string;
  experience: string;
  rating: string;
  verified: boolean;
  price: string;
}

interface HomeVenueCard {
  id: number;
  name: string;
  image: string | null;
  area: string;
  distance: string | null;
  sports: string[];
  price: number | null;
  rating: string | null;
}

interface HomeTournamentCard {
  id: string;
  title: string;
  sportLabel: string;
  formatLabel: string;
  dateLabel: string;
  detailLabel: string;
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
export class HomePage implements ViewWillEnter, ViewWillLeave, OnDestroy {
  readonly auth = inject(AuthService);
  private readonly venueService = inject(VenueService);
  private readonly playerProfileService = inject(PlayerProfileService);
  private readonly toasts = inject(ToastController);
  private readonly bookingService = inject(BookingService);
  private readonly coachService = inject(CoachService);
  private readonly venueEventService = inject(VenueEventService);
  private readonly adService = inject(AdService);
  private readonly homePromotionService = inject(HomePromotionService);
  private readonly xpService = inject(XpService);
  private readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);
  private readonly menu = inject(MenuController);
  private readonly locationService = inject(LocationService);
  private readonly savedAddressesService = inject(SavedAddressesService);
  private readonly platform = inject(Platform);

  readonly notificationRoute = computed(() =>
    this.auth.user()?.role === 'coach' ? '/app/coach/notifications' : '/app/notifications'
  );

  private nearbyRealtimeSub?: Subscription;
  private resumeSub?: Subscription;
  private appStateHandle?: PluginListenerHandle;
  private homeVisible = false;
  private gpsBootstrapInFlight?: Promise<void>;
  private lastGpsBootstrapAt = 0;

  nearbyGames: EventGame[] = [];
  nearbyBookings: BookingRecord[] = [];
  nearbyLoading = false;
  nearbyError = '';
  xpSummary: XpSummary | null = null;
  raceRows: HomeRaceRow[] = [];
  raceNote = '';
  homeBadges: HomeBadgeCard[] = [];
  quickSuggestion: QuickSuggestion | null = null;
  sportDrawerGames: HomeSportGameCard[] = [];
  sportDrawerLoading = false;
  sportDrawerLoadingMore = false;
  sportDrawerError = '';
  private sportDrawerPage = 1;
  private sportDrawerLastPage = 1;
  private sportDrawerRequestVersion = 0;

  homeAds: HomeAd[] = [];
  adsLoading = true;
  adSlideIndex = 0;
  private adSliderTimer?: ReturnType<typeof setInterval>;

  private readonly featuredHomeSports: HomeSport[] = [
    { id: 'cricket', name: 'Cricket', icon: 'assets/sports/cricket.svg' },
    { id: 'badminton', name: 'Badminton', icon: 'assets/sports/badminton.svg' },
    { id: 'tennis', name: 'Tennis', icon: 'assets/sports/tennis.svg' },
    { id: 'basketball', name: 'Basketball', icon: 'assets/sports/basketball.svg' },
  ];

  get homeSports(): HomeSport[] {
    const uniqueCatalog = this.sportCatalog;
    const custom = (this.customHomeSportIds || [])
      .map((id) => uniqueCatalog.find((sport) => sport.id === id))
      .filter((sport): sport is HomeSport => !!sport);
    if (custom.length === HOME_SPORTS_COUNT) return custom;
    const preferred = (this.auth.user()?.sports || [])
      .map((value) => this.normalizeSportPreference(value))
      .filter(Boolean);
    const preferenceRank = (sport: HomeSport) => {
      const id = this.normalizeSportPreference(sport.id);
      const name = this.normalizeSportPreference(sport.name);
      const index = preferred.findIndex((item) => item === id || item === name);
      return index < 0 ? Number.MAX_SAFE_INTEGER : index;
    };
    const featuredRank = (sport: HomeSport) => this.featuredHomeSports.findIndex((item) => item.id === sport.id);
    return [...uniqueCatalog].sort((a, b) => {
      const aPreference = preferenceRank(a);
      const bPreference = preferenceRank(b);
      if (aPreference !== bPreference) return aPreference - bPreference;
      if (aPreference === Number.MAX_SAFE_INTEGER) {
        const aFeatured = featuredRank(a);
        const bFeatured = featuredRank(b);
        if (aFeatured !== bFeatured) {
          if (aFeatured < 0) return 1;
          if (bFeatured < 0) return -1;
          return aFeatured - bFeatured;
        }
      }
      return a.name.localeCompare(b.name);
    }).slice(0, HOME_SPORTS_COUNT);
  }

  private get sportCatalog(): HomeSport[] {
    const catalog = this.allSportGroups.reduce((sports, group) => sports.concat(group.sports), [] as HomeSport[]);
    return catalog.filter((sport, index) => sport.id !== 'suggest' && catalog.findIndex((item) => item.id === sport.id) === index);
  }

  get sportRailItems(): HomeSport[] {
    return [...this.homeSports, { id: 'home-more', name: 'More', icon: '' }];
  }

  activateHomeSport(sport: HomeSport): void {
    if (sport.id === 'home-more') {
      this.openSportsPicker();
      return;
    }
    this.openSportGames(sport);
  }

  private normalizeSportPreference(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  homePromotions: HomePromotion[] = [];
  promotionsLoading = true;
  private promotionSliderTimer?: ReturnType<typeof setInterval>;
  private promotionPointerStart?: { x: number; y: number };
  private promotionSwipeConsumedUntil = 0;

  readonly allSportGroups: HomeSportGroup[] = [
    { name: 'Cricket & Football', sports: [
      { id: 'cricket', name: 'Cricket', icon: 'assets/sports/cricket.svg' },
      { id: 'box-cricket', name: 'Box cricket', icon: 'assets/sports/box-cricket.svg', box: true },
      { id: 'football', name: 'Football', icon: 'assets/sports/football.svg' },
      { id: 'box-football', name: 'Box football', icon: 'assets/sports/box-football.svg', box: true },
      { id: 'hockey', name: 'Hockey', icon: 'assets/sports/hockey.svg' },
    ] },
    { name: 'Racquet Sports', sports: [
      { id: 'tennis', name: 'Tennis', icon: 'assets/sports/tennis.svg' },
      { id: 'lawn-tennis', name: 'Lawn tennis', icon: 'assets/sports/lawn-tennis.svg' },
      { id: 'pickleball', name: 'Pickleball', icon: 'assets/sports/pickleball.svg' },
      { id: 'badminton', name: 'Badminton', icon: 'assets/sports/badminton.svg' },
      { id: 'table-tennis', name: 'Table tennis', icon: 'assets/sports/table-tennis.svg' },
    ] },
    { name: 'Court & Team Sports', sports: [
      { id: 'basketball', name: 'Basketball', icon: 'assets/sports/basketball.svg' },
      { id: 'volleyball', name: 'Volleyball', icon: 'assets/sports/volleyball.svg' },
      { id: 'highcross', name: 'Highcross', icon: 'assets/sports/highcross.svg' },
    ] },
    { name: 'Running & Endurance', sports: [
      { id: 'running', name: 'Running', icon: 'assets/sports/running.svg' },
      { id: 'marathon', name: 'Marathon', icon: 'assets/sports/marathon.svg' },
      { id: 'cycling', name: 'Cycling', icon: 'assets/sports/cycling.svg' },
      { id: 'swimming', name: 'Swimming', icon: 'assets/sports/swimming.svg' },
    ] },
    { name: 'Table & Indoor Games', sports: [
      { id: 'carrom', name: 'Carrom', icon: 'assets/sports/carrom.svg' },
      { id: 'billiards', name: 'Billiards', icon: 'assets/sports/billiards.svg' },
      { id: 'golf', name: 'Golf', icon: 'assets/sports/golf.svg' },
    ] },
    { name: 'Fitness & Training', sports: [
      { id: 'yoga', name: 'Yoga', icon: 'assets/sports/yoga.svg' },
      { id: 'martial-arts', name: 'Martial arts', icon: 'assets/sports/martial-arts.svg' },
      { id: 'suggest', name: 'Suggest a sport', icon: 'assets/sports/suggest.svg' },
    ] },
  ];

  homeVenues: HomeVenueCard[] = [];
  venuesLoading = true;
  venuesError = '';
  private venuesRequestVersion = 0;
  homeCoaches: HomeCoachCard[] = [];
  coachesLoading = false;
  coachesError = '';
  homeTournament: HomeTournamentCard | null = null;
  tournamentLoading = false;
  promoSlideIndex = 0;
  sportGamesOpen = false;
  sportsPickerOpen = false;
  readonly homeSportsCount = HOME_SPORTS_COUNT;
  customHomeSportIds: string[] | null = this.readCachedHomeSports();
  homeSportsEditing = false;
  homeSportsDraft: string[] = [];
  homeSportsSaving = false;
  searchFilterOpen = false;
  searchFilterEvent?: Event;
  @ViewChild('searchFilterPopover') private searchFilterPopover?: IonPopover;
  selectedSport: HomeSport | null = null;
  sportSearch = '';
  private pendingDrawerSport: HomeSport | null = null;
  private pendingSportGamesRoute: string | null = null;

  // General state
  greeting = '';
  currentLocation?: UserLocation;
  locationLoading = false;
  locationError?: string;
  locationPickerOpen = false;
  savedAddresses: SavedAddress[] = [];
  selectedAddressId = CURRENT_LOCATION_ID;
  private pendingManageAddresses = false;

  get helloName(): string {
    return (this.auth.user()?.name || '').trim() || 'Player';
  }

  get playerPoints(): string {
    return (this.auth.user()?.tpPoints ?? 0).toLocaleString('en-IN');
  }

  get filteredSportGroups(): HomeSportGroup[] {
    const query = this.normalizeSearchText(this.sportSearch);
    if (!query) return this.allSportGroups;
    const queryTokens = query.split(' ').filter(Boolean);
    return this.allSportGroups
      .map((group) => ({
        ...group,
        sports: group.sports.filter((sport) => {
          const searchable = this.normalizeSearchText([
            sport.name,
            sport.id,
            ...this.sportSearchAliases(sport.id),
          ].join(' '));
          return queryTokens.every((token) => searchable.includes(token));
        }),
      }))
      .filter((group) => group.sports.length > 0);
  }

  get isCurrentSelected(): boolean {
    return this.selectedAddressId === CURRENT_LOCATION_ID;
  }

  get currentLocationMeta(): string {
    const live = (this.currentLocation?.shortLabel
      || this.currentLocation?.address
      || this.currentLocation?.postalArea
      || '').trim();
    if (live) return this.withoutPincode(live);
    return this.locationLoading ? 'Detecting…' : 'Use device GPS';
  }

  // Coach Dashboard state
  coachProfileDismissed = signal(false);
  coachDashboardLoading = signal(false);
  coachDashboardError = signal('');
  coachDailyGoalProgress = 0;
  coachStudentRequestCount = 0;
  coachProgressCards = [
    { icon: 'people-outline', value: '0', label: 'Active Students', bg: '#FFFBEB', color: '#D97706' },
    { icon: 'clipboard-outline', value: '0', label: 'Evaluations Today', bg: '#F0FDF4', color: '#16A34A' },
    { icon: 'star-outline', value: '0', label: 'New Reviews Today', bg: '#F5F3FF', color: '#7C3AED' },
  ];
  coachInsight = {
    heading: 'No sessions scheduled today',
    message: 'Open your schedule to add availability and invite more student requests.',
  };
  coachEarningsSnapshot = [
    { period: 'Today', amount: '₹0', trend: 'Expected earnings' },
    { period: 'Upcoming', amount: '0', trend: 'Scheduled sessions' },
    { period: 'Completed', amount: '0', trend: 'All-time sessions' },
  ];
  coachPulseMetrics = [
    { icon: '📅', label: "Today's Sessions", value: '4', accent: 'var(--app-primary)' },
    { icon: '💰', label: 'Expected Earnings', value: '₹4,250', accent: '#FF7A00' },
    { icon: '⭐', label: 'New Reviews', value: '3', accent: '#F59E0B' },
    { icon: '👥', label: 'Booking Requests', value: '5', accent: '#38BDF8' },
  ];
  coachSessions = [
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
  coachActivities: Array<{ id: string | number; icon: string; bg: string; color: string; text: string; time: string }> = [
    { id: 1, icon: '✓', bg: '#F0FDF4', color: '#16A34A', text: 'Rahul completed Session #18', time: '20 min ago' },
    { id: 2, icon: '⭐', bg: '#FFFBEB', color: '#D97706', text: 'You received a 5-Star Review from Ananya', time: '1 hr ago' },
    { id: 3, icon: '🏆', bg: '#F5F3FF', color: '#7C3AED', text: 'Aarav won District Badminton Championship', time: '3 hrs ago' },
    { id: 4, icon: '💰', bg: '#F0FDF4', color: '#16A34A', text: '₹1,200 Payment Received', time: '5 hrs ago' },
    { id: 5, icon: '📅', bg: '#EFF6FF', color: '#3B82F6', text: 'Session Rescheduled — Priya moved to 7 PM', time: 'Yesterday' },
  ];
  coachVenueLoading = signal(false);
  coachVenueError = signal('');
  coachVenues: Array<{ id: number; name: string; image: string; meta: string; slots: number; price: number }> = [];
  coachCommunity: Array<{ id: number; title: string; sub: string; image: string; tag: string }> = [];
  coachMilestone: CoachDashboardMilestone = {
    completedSessions: 0, achievedTarget: 0, nextTarget: 1,
    title: 'Your first coaching milestone awaits',
    description: 'Complete your first coaching session to begin your journey.',
  };
  coachWeather: CoachDashboardWeather = {
    available: false, location: null, temperature: null,
    condition: 'Weather unavailable', icon: 'cloud-offline-outline',
    outdoorSuitable: false, outdoorLabel: 'Add location',
  };
  coachReviews = [
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
    this.coachPulseMetrics = this.coachPulseMetrics.map((metric) => ({
      ...metric,
      value: metric.label === 'Expected Earnings' ? '₹0' : '0',
    }));
    this.refreshGreeting();
    const role = this.auth.user()?.role;
    if (role === 'admin') {
      void this.router.navigateByUrl('/app/admin/dashboard', { replaceUrl: true });
    } else if (role === 'venue') {
      void this.router.navigateByUrl(this.auth.venueHomePath(), { replaceUrl: true });
    }

    this.resumeSub = this.platform.resume.subscribe(() => {
      if (this.homeVisible) {
        void this.resetToGpsOnOpen();
      }
    });
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive && this.homeVisible) {
        void this.resetToGpsOnOpen();
      }
    }).then((handle) => {
      this.appStateHandle = handle;
    });
  }

  ionViewWillEnter() {
    this.refreshGreeting();
    const role = this.auth.user()?.role;
    if (role === 'coach') {
      void this.loadCoachDashboard();
    }
    this.homeVisible = role === 'player' || !role;
    if (this.homeVisible) {
      void this.loadHomeAds();
      void this.loadHomePromotions();
      void this.loadPlayerCoaches();
      void this.loadHomeSports();
      void this.loadPlayerTournament();
      void this.loadPlayerProgress();
      void this.resetToGpsOnOpen();
      this.listenForNearbyGames();
    }
  }

  get coachName(): string {
    return this.auth.user()?.name?.trim() || 'Coach';
  }

  private refreshGreeting(): void {
    const hour = new Date().getHours();
    this.greeting = hour < 12
      ? 'Good Morning,'
      : hour < 17
        ? 'Good Afternoon,'
        : hour < 21
          ? 'Good Evening,'
          : 'Good Night,';
  }

  get coachProfileCompletion(): number {
    return this.auth.user()?.profileCompletion ?? 0;
  }

  private async loadCoachDashboard(): Promise<void> {
    this.coachDashboardLoading.set(true);
    this.coachDashboardError.set('');
    this.coachSessions = [];
    this.coachReviews = [];
    this.coachActivities = [];
    void this.loadCoachVenues();
    try {
      const response = await firstValueFrom(this.coachService.getDashboard());
      const dashboard = response.data;
      if (!response.success || !dashboard) {
        throw new Error(response.message || 'Unable to load coach dashboard.');
      }
      this.applyCoachDashboard(dashboard);
    } catch {
      this.coachDashboardError.set('Unable to refresh your coach dashboard. Pull down to try again.');
    } finally {
      this.coachDashboardLoading.set(false);
    }
  }

  private applyCoachDashboard(dashboard: CoachDashboard): void {
    // This endpoint is Coach-only. Keep the session role intact even if an
    // older API deployment returns a partial dashboard profile without `role`.
    this.auth.hydrateUser({ ...dashboard.profile, role: 'coach' });
    this.coachDailyGoalProgress = dashboard.stats.dailyGoalProgress;
    this.coachStudentRequestCount = dashboard.stats.pendingStudentRequests;
    this.coachProgressCards = [
      { icon: 'people-outline', value: String(dashboard.stats.students), label: 'Active Students', bg: '#FFFBEB', color: '#D97706' },
      { icon: 'clipboard-outline', value: String(dashboard.stats.evaluationsToday), label: 'Evaluations Today', bg: '#F0FDF4', color: '#16A34A' },
      { icon: 'star-outline', value: String(dashboard.stats.newReviews), label: 'New Reviews Today', bg: '#F5F3FF', color: '#7C3AED' },
    ];
    this.coachInsight = dashboard.stats.todaySessions > 0
      ? {
          heading: `${dashboard.stats.todaySessions} session${dashboard.stats.todaySessions === 1 ? '' : 's'} scheduled today`,
          message: `${dashboard.stats.completedSessionsToday} completed so far. Keep your schedule current so students can book available time.`,
        }
      : {
          heading: 'No sessions scheduled today',
          message: dashboard.stats.pendingStudentRequests > 0
            ? `${dashboard.stats.pendingStudentRequests} student request${dashboard.stats.pendingStudentRequests === 1 ? ' is' : 's are'} waiting for your response.`
            : 'Open your schedule to add availability and invite more student requests.',
        };
    this.coachEarningsSnapshot = [
      { period: 'Today', amount: this.formatCurrency(dashboard.stats.expectedEarnings), trend: 'Expected earnings' },
      { period: 'Upcoming', amount: String(dashboard.stats.upcomingSessions), trend: 'Scheduled sessions' },
      { period: 'Completed', amount: String(dashboard.stats.completedSessions), trend: 'All-time sessions' },
    ];
    this.coachPulseMetrics = [
      { icon: 'ðŸ“…', label: "Today's Sessions", value: String(dashboard.stats.todaySessions), accent: 'var(--app-primary)' },
      { icon: 'ðŸ’°', label: 'Expected Earnings', value: this.formatCurrency(dashboard.stats.expectedEarnings), accent: '#FF7A00' },
      { icon: 'â­', label: 'New Reviews', value: String(dashboard.stats.newReviews), accent: '#F59E0B' },
      { icon: 'ðŸ‘¥', label: 'Booking Requests', value: String(dashboard.stats.bookingRequests), accent: '#38BDF8' },
    ];
    this.coachSessions = dashboard.todaySessions.map((session) => ({
      id: session.id,
      sport: session.sport,
      emoji: this.sportEmoji(session.sport),
      image: this.sportImage(session.sport),
      title: session.title,
      team: session.studentName ? `${session.studentName} Â· ${session.studentCount || 1} Student` : 'Group session',
      venue: session.venueName || 'Venue to be confirmed',
      time: `${this.formatClock(session.startTime)} â€“ ${this.formatClock(session.endTime)}`,
      type: session.studentCount === 1 ? 'One-on-One' : 'Training',
      status: session.status,
      startsIn: ['scheduled', 'confirmed'].includes(session.status) ? this.startsIn(session.startTime) : null,
    }));
    this.coachReviews = dashboard.recentReviews.map((review) => ({
      name: review.name,
      photo: review.profileImage || 'assets/icon/favicon.png',
      rating: review.rating,
      text: review.comment || 'No written feedback provided.',
    }));
    this.coachActivities = dashboard.recentActivity.map((activity) => ({
      id: activity.id,
      icon: this.activityIcon(activity.type),
      bg: this.activityColor(activity.type).bg,
      color: this.activityColor(activity.type).color,
      text: activity.text,
      time: this.relativeTime(activity.at),
    }));
    this.coachCommunity = (dashboard.communityEvents || []).map((event) => ({
      id: Number(event.id),
      title: event.title,
      sub: this.communityEventMeta(event.eventDate, event.startTime, event.venueName, event.registrations),
      image: event.image || 'assets/icon/favicon.png',
      tag: event.tag,
    }));
    this.coachMilestone = dashboard.milestone || this.milestoneFromCompleted(dashboard.stats.completedSessions);
    this.coachWeather = dashboard.weather || {
      available: false,
      location: dashboard.profile.location,
      temperature: null,
      condition: 'Weather unavailable',
      icon: 'cloud-offline-outline',
      outdoorSuitable: false,
      outdoorLabel: 'Add location',
    };
  }

  async loadCoachVenues(): Promise<void> {
    this.coachVenueLoading.set(true);
    this.coachVenueError.set('');
    try {
      const response = await firstValueFrom(this.coachService.getSchedulingVenues());
      const rows = (Array.isArray(response.data) ? response.data : []).slice(0, 6);
      const date = this.localDateValue(new Date());
      this.coachVenues = await Promise.all(rows.map(async (venue: any) => {
        const courts = Array.isArray(venue.courts) ? venue.courts : [];
        const availability = await Promise.all(courts.map(async (court: any) => {
          try {
            const result = await firstValueFrom(this.coachService.getVenueAvailability(venue.id, court.id, date, 60));
            return Array.isArray((result.data as any)?.slots) ? (result.data as any).slots.length : 0;
          } catch {
            return 0;
          }
        }));
        const prices = courts.map((court: any) => Number(court.price_per_hour || 0)).filter((price: number) => price > 0);
        return {
          id: Number(venue.id),
          name: String(venue.name || 'Venue'),
          image: String(venue.image || courts.find((court: any) => court.image)?.image || 'assets/icon/favicon.png'),
          meta: this.venueDistanceOrLocation(venue),
          slots: availability.reduce((sum, count) => sum + count, 0),
          price: prices.length ? Math.min(...prices) : 0,
        };
      }));
    } catch (error: any) {
      this.coachVenues = [];
      this.coachVenueError.set(error?.error?.message || 'Venue availability could not be loaded.');
    } finally {
      this.coachVenueLoading.set(false);
    }
  }

  bookCoachVenue(venueId: number): void {
    void this.router.navigate(['/app/coach/venue-booking'], { queryParams: { venue: venueId } });
  }

  private venueDistanceOrLocation(venue: any): string {
    const coachLatitude = Number(this.auth.user()?.latitude);
    const coachLongitude = Number(this.auth.user()?.longitude);
    const venueLatitude = Number(venue.latitude);
    const venueLongitude = Number(venue.longitude);
    if ([coachLatitude, coachLongitude, venueLatitude, venueLongitude].every(Number.isFinite)
      && (coachLatitude !== 0 || coachLongitude !== 0) && (venueLatitude !== 0 || venueLongitude !== 0)) {
      const earthRadius = 6371;
      const radians = (value: number) => value * Math.PI / 180;
      const latitudeDelta = radians(venueLatitude - coachLatitude);
      const longitudeDelta = radians(venueLongitude - coachLongitude);
      const a = Math.sin(latitudeDelta / 2) ** 2
        + Math.cos(radians(coachLatitude)) * Math.cos(radians(venueLatitude)) * Math.sin(longitudeDelta / 2) ** 2;
      return `${(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1)} km`;
    }
    return String(venue.city || venue.location || 'Location unavailable').split(',')[0].trim();
  }

  private communityEventMeta(date?: string | null, time?: string | null, venue?: string | null, registrations = 0): string {
    const parts: string[] = [];
    if (date) parts.push(new Date(`${date}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }));
    if (time) parts.push(this.formatClock(String(time).slice(0, 5)));
    if (venue) parts.push(venue);
    if (!parts.length && registrations > 0) parts.push(`${registrations} registered`);
    return parts.join(' · ') || 'Details coming soon';
  }

  private milestoneFromCompleted(completed: number): CoachDashboardMilestone {
    const targets = [1, 10, 25, 50, 100, 250, 500, 1000];
    const achieved = [...targets].reverse().find((target) => target <= completed) || 0;
    const next = targets.find((target) => target > completed) || null;
    return completed === 0
      ? { completedSessions: 0, achievedTarget: 0, nextTarget: 1, title: 'Your first coaching milestone awaits', description: 'Complete your first coaching session to begin your journey.' }
      : { completedSessions: completed, achievedTarget: achieved, nextTarget: next, title: `${achieved} Coaching Session${achieved === 1 ? '' : 's'} Completed!`, description: next ? `${next - completed} more session${next - completed === 1 ? '' : 's'} to reach ${next}.` : 'An exceptional coaching journey built on real completed sessions.' };
  }

  private localDateValue(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  coachFocusSessions(): string { return this.coachPulseMetrics[0]?.value || '0'; }
  coachFocusEarnings(): string { return this.coachPulseMetrics[1]?.value || '₹0'; }
  coachFocusRequests(): string { return this.coachPulseMetrics[3]?.value || '0'; }

  openCoachMetric(label: string): void {
    const destinations: Record<string, string> = {
      "Today's Sessions": '/app/coach/schedule',
      'Expected Earnings': '/app/coach/earnings',
      'New Reviews': '/app/coach/insights',
      'Booking Requests': '/app/coach/booking-requests',
    };
    const destination = destinations[label];
    if (destination) void this.router.navigateByUrl(destination);
  }

  metricIcon(label: string): string {
    return ({
      "Today's Sessions": 'calendar-outline',
      'Expected Earnings': 'cash-outline',
      'New Reviews': 'star-outline',
      'Booking Requests': 'people-outline',
    } as Record<string, string>)[label] || 'ellipse-outline';
  }

  sessionIcon(sport: string): string {
    return ({
      football: 'football-outline',
      basketball: 'basketball-outline',
      tennis: 'tennisball-outline',
      cricket: 'trophy-outline',
      badminton: 'fitness-outline',
    } as Record<string, string>)[String(sport || '').toLowerCase()] || 'trophy-outline';
  }

  activityIconName(text: string): string {
    const value = String(text || '').toLowerCase();
    if (value.includes('review')) return 'star-outline';
    if (value.includes('request')) return 'people-outline';
    if (value.includes('complete')) return 'checkmark-outline';
    if (value.includes('session')) return 'calendar-outline';
    return 'ellipse-outline';
  }

  private formatCurrency(value: number): string { return `₹${Math.round(Number(value || 0)).toLocaleString('en-IN')}`; }
  private formatClock(value: string): string {
    const [h = '0', m = '00'] = value.split(':'); const hour = Number(h); const suffix = hour >= 12 ? 'PM' : 'AM';
    return `${hour % 12 || 12}:${m} ${suffix}`;
  }
  private startsIn(value: string): string {
    const [h = 0, m = 0] = value.split(':').map(Number); const now = new Date();
    const minutes = h * 60 + m - (now.getHours() * 60 + now.getMinutes());
    return minutes <= 0 ? 'Starting now' : minutes < 60 ? `Starts in ${minutes} min` : `Starts in ${Math.floor(minutes / 60)}h ${minutes % 60 ? `${minutes % 60}m` : ''}`.trim();
  }
  private sportEmoji(sport: string): string { return ({ cricket: 'ðŸ', football: 'âš½', badminton: 'ðŸ¸', basketball: 'ðŸ€', tennis: 'ðŸŽ¾' } as Record<string, string>)[sport.toLowerCase()] || 'ðŸ†'; }
  private sportImage(sport: string): string { return ({ cricket: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=300&fit=crop&auto=format', football: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=300&fit=crop&auto=format', badminton: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=300&fit=crop&auto=format' } as Record<string, string>)[sport.toLowerCase()] || 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&h=300&fit=crop&auto=format'; }
  private activityIcon(type: string): string { return ({ session_completed: 'âœ“', session_scheduled: 'ðŸ“…', booking_request: 'ðŸ‘¥', review: 'â­' } as Record<string, string>)[type] || 'â€¢'; }
  private activityColor(type: string): { bg: string; color: string } { return ({ review: { bg: '#FFFBEB', color: '#D97706' }, booking_request: { bg: '#EFF6FF', color: '#2563EB' }, session_completed: { bg: '#F0FDF4', color: '#16A34A' }, session_scheduled: { bg: '#F5F3FF', color: '#7C3AED' } } as Record<string, { bg: string; color: string }>)[type] || { bg: '#F3F4F6', color: '#6B7280' }; }
  private relativeTime(value?: string | null): string { if (!value) return 'Recently'; const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000)); if (seconds < 60) return 'Just now'; if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`; if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`; return `${Math.floor(seconds / 86400)} day${seconds >= 172800 ? 's' : ''} ago`; }

  ionViewWillLeave() {
    this.homeVisible = false;
    this.stopPromotionSlider();
  }

  ngOnDestroy() {
    this.homeVisible = false;
    this.nearbyRealtimeSub?.unsubscribe();
    this.resumeSub?.unsubscribe();
    void this.appStateHandle?.remove();
    this.stopAdSlider();
    this.stopPromotionSlider();
  }

  /** Open / reopen: force current GPS selection, then refresh nearby data. */
  private async resetToGpsOnOpen() {
    const now = Date.now();
    // Avoid duplicate GPS hits when both ionViewWillEnter and app resume fire together.
    if (this.gpsBootstrapInFlight) {
      return this.gpsBootstrapInFlight;
    }
    if (now - this.lastGpsBootstrapAt < 2500) {
      return;
    }

    this.gpsBootstrapInFlight = (async () => {
      this.savedAddressesService.select(CURRENT_LOCATION_ID);
      this.refreshAddressState();
      await this.loadCurrentLocation({ forceGps: true });
      await this.loadNearbyGames();
      this.lastGpsBootstrapAt = Date.now();
    })().finally(() => {
      this.gpsBootstrapInFlight = undefined;
    });

    return this.gpsBootstrapInFlight;
  }

  async loadCurrentLocation(options?: { forceGps?: boolean }) {
    this.seedSavedLocation();
    this.locationLoading = true;
    this.locationError = undefined;

    try {
      const location = options?.forceGps
        ? await this.fetchFreshGpsOrFallback()
        : await this.locationService.getLocationWithFallback();
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

  /** Prefer a fresh device GPS fix; fall back to last known / profile if denied. */
  private async fetchFreshGpsOrFallback() {
    try {
      const location = await this.locationService.getCurrentLocationWithAddress();
      this.locationService.saveLocation(location);
      return location;
    } catch (error) {
      const fallback = await this.locationService.getLocationWithFallback();
      if (fallback) return fallback;
      throw error;
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
    this.savedAddressesService.select(CURRENT_LOCATION_ID);
    this.refreshAddressState();
    await this.loadCurrentLocation({ forceGps: true });
    await this.loadNearbyGames();
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
    this.nearbyBookings = this.sortNearbyBookings(this.nearbyBookings);
    this.nearbyGames = this.nearbyBookings.map((item) => this.mapNearbyGame(item));
    this.quickSuggestion = this.buildQuickSuggestion(this.nearbyBookings);
    this.nearbyError = '';
  }

  private isJoinableNearbyGame(booking: BookingRecord): boolean {
    const total = Number(booking.totalPlayers || 0);
    const current = Number(booking.currentPlayers || 0);
    const status = String(booking.bookingStatus || '').toLowerCase();
    return total > 1
      && current < total
      && status !== 'full'
      && status !== 'cancelled'
      && status !== 'expired'
      && status !== 'completed';
  }

  get locationLabel(): string {
    const active = this.savedAddressesService.resolveActive(
      this.currentLocation || this.locationService.getSavedLocation(),
      this.auth.user()?.location,
    );
    const label = (active.label || '').trim();
    if (label) return this.withoutPincode(label);

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

  openLocationPicker() {
    this.refreshAddressState();
    this.locationPickerOpen = true;
  }

  closeLocationPicker() {
    this.locationPickerOpen = false;
  }

  onLocationPickerDismiss() {
    this.locationPickerOpen = false;
    if (this.pendingManageAddresses) {
      this.pendingManageAddresses = false;
      void this.router.navigateByUrl('/app/profile/edit');
    }
  }

  selectCurrentLocation() {
    this.savedAddressesService.select(CURRENT_LOCATION_ID);
    this.refreshAddressState();
    this.closeLocationPicker();
    void this.loadCurrentLocation({ forceGps: true }).then(() => this.loadNearbyGames());
  }

  selectSavedAddress(id: string) {
    this.savedAddressesService.select(id);
    this.refreshAddressState();
    this.closeLocationPicker();
    void this.loadNearbyGames();
  }

  manageAddresses() {
    this.pendingManageAddresses = true;
    this.locationPickerOpen = false;
  }

  private refreshAddressState() {
    this.savedAddresses = this.savedAddressesService.list();
    this.selectedAddressId = this.savedAddressesService.selectedId();
  }

  async loadNearbyGames() {
    void this.loadHomeVenues();
    this.nearbyLoading = true;
    this.nearbyError = '';
    try {
      const nearby = this.locationService.nearbyLocationQuery(this.auth.user()?.location);
      const hasCoordinates = Number.isFinite(nearby.latitude) && Number.isFinite(nearby.longitude);
      const response = await firstValueFrom(
        this.bookingService.getNearbyGames(20, {
          // Use venue coordinates for a true nearest-first sort when possible;
          // retain the existing locality filter as a fallback for text-only addresses.
          matchLocation: !hasCoordinates && !!nearby.query,
          location: !hasCoordinates ? nearby.query || undefined : undefined,
        }),
      );
      if (response.success && Array.isArray(response.data)) {
        this.nearbyBookings = this.sortNearbyBookings(
          response.data.filter((booking) => this.isJoinableNearbyGame(booking)),
          nearby.latitude,
          nearby.longitude,
        );
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

  private sortNearbyBookings(
    bookings: BookingRecord[],
    latitude = this.locationService.nearbyLocationQuery(this.auth.user()?.location).latitude,
    longitude = this.locationService.nearbyLocationQuery(this.auth.user()?.location).longitude,
  ): BookingRecord[] {
    const distance = (booking: BookingRecord): number | null => this.bookingDistanceKm(booking, latitude, longitude);
    const startTimestamp = (booking: BookingRecord) =>
      Date.parse(`${booking.bookingDate || ''}T${booking.startTime || '00:00:00'}`) || Number.MAX_SAFE_INTEGER;

    return [...bookings].sort((a, b) => {
      const aDistance = distance(a);
      const bDistance = distance(b);
      if (aDistance !== null && bDistance !== null && aDistance !== bDistance) return aDistance - bDistance;
      if (aDistance !== null && bDistance === null) return -1;
      if (aDistance === null && bDistance !== null) return 1;
      return startTimestamp(a) - startTimestamp(b);
    });
  }

  selectPromoSlide(index: number): void {
    if (index < 0 || index >= this.homePromotions.length) return;
    this.promoSlideIndex = index;
    this.startPromotionSlider();
  }

  openHomePromotion(promotion: HomePromotion): void {
    if (Date.now() < this.promotionSwipeConsumedUntil) return;
    const route = (promotion.navigationRoute || '').trim();
    if (route !== '/app' && !route.startsWith('/app/')) return;
    void this.router.navigateByUrl(route);
  }

  onPromotionPointerDown(event: PointerEvent): void {
    if (!event.isPrimary || this.homePromotions.length < 2) return;
    this.promotionPointerStart = { x: event.clientX, y: event.clientY };
  }

  onPromotionPointerUp(event: PointerEvent): void {
    const start = this.promotionPointerStart;
    this.promotionPointerStart = undefined;
    if (!start || !event.isPrimary || this.homePromotions.length < 2) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) < 44 || Math.abs(deltaX) <= Math.abs(deltaY)) return;

    event.preventDefault();
    this.promotionSwipeConsumedUntil = Date.now() + 400;
    const direction = deltaX < 0 ? 1 : -1;
    this.promoSlideIndex = (this.promoSlideIndex + direction + this.homePromotions.length) % this.homePromotions.length;
    this.startPromotionSlider();
  }

  onPromotionPointerCancel(): void {
    this.promotionPointerStart = undefined;
  }

  async loadHomePromotions(): Promise<void> {
    this.promotionsLoading = true;
    try {
      this.homePromotions = await firstValueFrom(this.homePromotionService.list());
      this.promoSlideIndex = 0;
      this.startPromotionSlider();
    } catch {
      this.homePromotions = [];
      this.stopPromotionSlider();
    } finally {
      this.promotionsLoading = false;
    }
  }

  private startPromotionSlider(): void {
    this.stopPromotionSlider();
    if (!this.homeVisible || this.homePromotions.length < 2) return;
    this.promotionSliderTimer = setInterval(() => {
      this.promoSlideIndex = (this.promoSlideIndex + 1) % this.homePromotions.length;
    }, 5000);
  }

  private stopPromotionSlider(): void {
    if (!this.promotionSliderTimer) return;
    clearInterval(this.promotionSliderTimer);
    this.promotionSliderTimer = undefined;
  }

  openSportGames(sport: HomeSport): void {
    this.pendingDrawerSport = null;
    this.selectedSport = sport;
    this.sportDrawerGames = [];
    this.sportDrawerError = '';
    this.sportDrawerPage = 1;
    this.sportDrawerLastPage = 1;
    this.sportGamesOpen = true;
    void this.loadSportDrawerGames(true);
  }

  closeSportGames(): void {
    this.pendingSportGamesRoute = null;
    this.sportDrawerRequestVersion += 1;
    this.sportGamesOpen = false;
  }

  onSportGamesDidDismiss(): void {
    this.sportGamesOpen = false;
    const route = this.pendingSportGamesRoute;
    this.pendingSportGamesRoute = null;
    if (route) void this.router.navigateByUrl(route);
  }

  createGameFromSportDrawer(): void {
    this.navigateFromSportGames('/app/game/create');
  }

  async loadSportDrawerGames(reset = false): Promise<void> {
    const sport = this.selectedSport;
    if (!sport || (!reset && (this.sportDrawerLoadingMore || this.sportDrawerPage >= this.sportDrawerLastPage))) return;

    const requestVersion = ++this.sportDrawerRequestVersion;
    const page = reset ? 1 : this.sportDrawerPage + 1;
    if (reset) {
      this.sportDrawerLoading = true;
      this.sportDrawerError = '';
    } else {
      this.sportDrawerLoadingMore = true;
    }

    try {
      const nearby = this.locationService.nearbyLocationQuery(this.auth.user()?.location);
      const response = await firstValueFrom(
        this.bookingService.getHomeSportGames(sport.id, page, nearby.query || undefined),
      );
      if (requestVersion !== this.sportDrawerRequestVersion) return;
      if (!response.success || !response.data) throw new Error(response.message || 'Unable to load games.');

      const nextItems = Array.isArray(response.data.items) ? response.data.items : [];
      const merged = reset ? nextItems : [...this.sportDrawerGames, ...nextItems];
      this.sportDrawerGames = merged.filter((game, index, games) => games.findIndex((item) => item.id === game.id) === index);
      this.sportDrawerPage = response.data.pagination.currentPage;
      this.sportDrawerLastPage = response.data.pagination.lastPage;
      this.sportDrawerError = '';
    } catch (error: any) {
      if (requestVersion !== this.sportDrawerRequestVersion) return;
      this.sportDrawerError = error?.error?.message || error?.message || 'Unable to load games.';
      if (reset) this.sportDrawerGames = [];
    } finally {
      if (requestVersion === this.sportDrawerRequestVersion) {
        this.sportDrawerLoading = false;
        this.sportDrawerLoadingMore = false;
      }
    }
  }

  onSportDrawerScroll(event: Event): void {
    const row = event.currentTarget as HTMLElement | null;
    if (!row || this.sportDrawerLoadingMore || this.sportDrawerPage >= this.sportDrawerLastPage) return;
    const oneCardRemaining = Math.max(180, row.clientWidth * 0.75);
    if (row.scrollLeft + row.clientWidth >= row.scrollWidth - oneCardRemaining) {
      void this.loadSportDrawerGames(false);
    }
  }

  openSportsPicker(): void {
    this.pendingDrawerSport = null;
    this.sportSearch = '';
    this.homeSportsEditing = false;
    this.sportsPickerOpen = true;
  }

  closeSportsPicker(): void {
    if (this.homeSportsEditing) {
      this.homeSportsEditing = false;
      return;
    }
    this.pendingDrawerSport = null;
    this.sportsPickerOpen = false;
  }

  onSportsPickerDidDismiss(): void {
    this.sportsPickerOpen = false;
    this.homeSportsEditing = false;
    const sport = this.pendingDrawerSport;
    this.pendingDrawerSport = null;
    if (sport) this.openSportGames(sport);
  }

  get homeSportsRemaining(): number {
    return HOME_SPORTS_COUNT - this.homeSportsDraft.length;
  }

  startHomeSportsEdit(): void {
    this.homeSportsDraft = this.homeSports.map((sport) => sport.id);
    this.sportSearch = '';
    this.homeSportsEditing = true;
  }

  homeSportDraftPosition(sport: HomeSport): number {
    return this.homeSportsDraft.indexOf(sport.id) + 1;
  }

  isHomeSportDisabled(sport: HomeSport): boolean {
    return sport.id === 'suggest'
      || (!this.homeSportsDraft.includes(sport.id) && this.homeSportsDraft.length >= HOME_SPORTS_COUNT);
  }

  toggleHomeSportDraft(sport: HomeSport): void {
    if (sport.id === 'suggest') return;
    if (this.homeSportsDraft.includes(sport.id)) {
      this.homeSportsDraft = this.homeSportsDraft.filter((id) => id !== sport.id);
    } else if (this.homeSportsDraft.length < HOME_SPORTS_COUNT) {
      this.homeSportsDraft = [...this.homeSportsDraft, sport.id];
    }
  }

  async saveHomeSports(): Promise<void> {
    if (this.homeSportsDraft.length !== HOME_SPORTS_COUNT || this.homeSportsSaving) return;
    await this.persistHomeSports([...this.homeSportsDraft], 'Your Home sports are updated.');
  }

  async resetHomeSports(): Promise<void> {
    if (this.homeSportsSaving) return;
    await this.persistHomeSports(null, 'Home sports are back to the default.');
  }

  private async persistHomeSports(sports: string[] | null, successMessage: string): Promise<void> {
    this.homeSportsSaving = true;
    try {
      const response = await firstValueFrom(this.playerProfileService.saveHomeSports(sports));
      this.applyHomeSports(response.data?.sports ?? null);
      this.homeSportsEditing = false;
      void this.showToast(successMessage);
    } catch (error: any) {
      const errors = error?.error?.errors;
      const firstValue = errors && typeof errors === 'object' ? Object.values(errors)[0] : null;
      const first = Array.isArray(firstValue) ? firstValue[0] : firstValue;
      void this.showToast(String(first || error?.error?.message || 'Could not save your Home sports. Try again.'), 'danger');
    } finally {
      this.homeSportsSaving = false;
    }
  }

  private async loadHomeSports(): Promise<void> {
    if (!this.auth.getToken()) return;
    try {
      const response = await firstValueFrom(this.playerProfileService.getHomeSports());
      this.applyHomeSports(response.data?.sports ?? null);
    } catch {
      // Keep the cached choice when offline.
    }
  }

  private applyHomeSports(sports: string[] | null): void {
    const valid = Array.isArray(sports) && sports.length === HOME_SPORTS_COUNT ? sports : null;
    this.customHomeSportIds = valid;
    const key = this.homeSportsStorageKey();
    if (!key) return;
    try {
      if (valid) localStorage.setItem(key, JSON.stringify(valid));
      else localStorage.removeItem(key);
    } catch {
      // Storage can be unavailable in private mode.
    }
  }

  private readCachedHomeSports(): string[] | null {
    const key = this.homeSportsStorageKey();
    if (!key) return null;
    try {
      const parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return Array.isArray(parsed) && parsed.length === HOME_SPORTS_COUNT ? parsed.map(String) : null;
    } catch {
      return null;
    }
  }

  private homeSportsStorageKey(): string | null {
    const id = this.auth.user()?.id;
    return id ? `${HOME_SPORTS_STORAGE_PREFIX}${id}` : null;
  }

  private async showToast(message: string, color: 'success' | 'danger' = 'success'): Promise<void> {
    const toast = await this.toasts.create({ message, color, duration: 2200, position: 'bottom' });
    await toast.present();
  }

  chooseSportFromPicker(sport: HomeSport): void {
    if (this.homeSportsEditing) {
      this.toggleHomeSportDraft(sport);
      return;
    }
    if (sport.id === 'suggest') {
      this.sportsPickerOpen = false;
      void this.router.navigateByUrl('/app/profile/edit');
      return;
    }
    this.selectedSport = sport;
    this.pendingDrawerSport = sport;
    this.sportsPickerOpen = false;
  }

  updateSportSearch(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    this.sportSearch = input?.value ?? '';
  }

  personInitials(name?: string | null): string {
    const parts = String(name || 'TYNG Player').trim().split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'TP';
  }

  formatSportName(value?: string | null): string {
    return String(value || 'Sport')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  bookingDateTime(booking: { bookingDate?: string | null; startTime: string }): string {
    return `${formatBookingDate(booking.bookingDate)} · ${formatBookingTime(booking.startTime)}`;
  }

  gameDistanceLabel(booking: BookingRecord): string {
    const { latitude, longitude } = this.locationService.nearbyLocationQuery(this.auth.user()?.location);
    const km = this.bookingDistanceKm(booking, latitude, longitude);
    if (km === null) return '';
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }

  gameStartsInLabel(booking: BookingRecord): string {
    const start = Date.parse(`${booking.bookingDate || ''}T${booking.startTime || '00:00:00'}`);
    if (!Number.isFinite(start)) return '';
    const minutes = Math.round((start - Date.now()) / 60000);
    if (minutes <= 0) return 'Live now';
    if (minutes < 60) return `Starts in ${minutes}m`;
    if (minutes < 1440) return `Starts in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    const days = Math.floor(minutes / 1440);
    return `Starts in ${days} day${days > 1 ? 's' : ''}`;
  }

  private bookingDistanceKm(booking: BookingRecord, latitude?: number | null, longitude?: number | null): number | null {
    const rawLat = booking.venue?.coordinates?.lat;
    const rawLng = booking.venue?.coordinates?.lng;
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || rawLat == null || rawLng == null) return null;
    const lat = Number(rawLat);
    const lng = Number(rawLng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    const radians = (degrees: number) => (degrees * Math.PI) / 180;
    const dLat = radians(lat - Number(latitude));
    const dLng = radians(lng - Number(longitude));
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(radians(Number(latitude))) * Math.cos(radians(lat)) * Math.sin(dLng / 2) ** 2;
    return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  gamePlayers(booking: BookingRecord): BookingRecord['players'] {
    return booking.acceptedPlayers?.length ? booking.acceptedPlayers : (booking.players || []);
  }

  gamePrice(booking: BookingRecord): number {
    return Number(booking.costPerPlayer ?? booking.playerShareAmount ?? booking.price ?? 0);
  }

  openGame(booking: { id: string }): void {
    this.navigateFromSportGames(`/app/game/${booking.id}`);
  }

  private navigateFromSportGames(route: string): void {
    this.pendingSportGamesRoute = route;
    this.sportGamesOpen = false;
  }

  private normalizedSport(value?: string | null): string {
    const normalized = String(value || '').trim().toLowerCase().replace(/[\s_]+/g, '-');
    const families: Record<string, string> = {
      'box-cricket': 'cricket',
      'box-football': 'football',
      'lawn-tennis': 'tennis',
      marathon: 'running',
    };
    return families[normalized] || normalized;
  }

  private normalizeSearchText(value: string): string {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  private sportSearchAliases(sportId: string): string[] {
    const aliases: Record<string, string[]> = {
      football: ['soccer'],
      'box-football': ['futsal', 'indoor football', 'soccer'],
      'box-cricket': ['indoor cricket'],
      badminton: ['shuttle', 'shuttlecock'],
      'table-tennis': ['ping pong'],
      pickleball: ['paddle'],
      cycling: ['cycle', 'bicycle', 'bike'],
      swimming: ['swim'],
      'martial-arts': ['combat'],
    };
    return aliases[sportId] || [];
  }

  async loadHomeVenues(): Promise<void> {
    const version = ++this.venuesRequestVersion;
    this.venuesLoading = !this.homeVenues.length;
    this.venuesError = '';
    const { latitude, longitude, city } = this.locationService.nearbyLocationQuery(this.auth.user()?.location);
    const hasCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);
    try {
      const response = await firstValueFrom(
        this.venueService.getVenues(hasCoordinates ? { lat: latitude, lng: longitude, limit: 6 } : {}),
      );
      if (version !== this.venuesRequestVersion) return;
      let rows = Array.isArray(response.data) ? response.data : [];
      const cityKey = (city || '').trim().toLowerCase();
      if (!hasCoordinates && cityKey) {
        const inCity = (venue: VenueListItem) => `${venue.city || ''} ${venue.location || ''}`.toLowerCase().includes(cityKey);
        rows = [...rows.filter(inCity), ...rows.filter((venue) => !inCity(venue))];
      }
      this.homeVenues = rows.slice(0, 6).map((venue) => this.toHomeVenue(venue));
    } catch {
      if (version !== this.venuesRequestVersion) return;
      this.homeVenues = [];
      this.venuesError = 'Venues could not be loaded.';
    } finally {
      if (version === this.venuesRequestVersion) this.venuesLoading = false;
    }
  }

  private toHomeVenue(venue: VenueListItem): HomeVenueCard {
    const price = Number(venue.price);
    const rating = Number(venue.rating);
    return {
      id: Number(venue.id),
      name: venue.name || 'TYNG venue',
      image: resolveMediaUrl(venue.coverImage || venue.profileImage) || null,
      area: this.venueArea(venue),
      distance: venue.distance || null,
      sports: (venue.sports || []).slice(0, 3).map((sport) => this.formatSportName(sport)),
      price: Number.isFinite(price) && price > 0 ? price : null,
      rating: venue.rating != null && Number.isFinite(rating) && rating > 0 ? rating.toFixed(1) : null,
    };
  }

  /** Locality + city from the venue address, skipping house numbers, plus codes, state/PIN and country. */
  private venueArea(venue: VenueListItem): string {
    const parts = String(venue.location || '')
      .split(',')
      .map((part) => part.trim())
      .filter((part) => part
        && !/^[A-Z0-9]{4,}\+[A-Z0-9]{2,}$/i.test(part)
        && !/\b\d{6}\b/.test(part)
        && !/^india$/i.test(part)
        && !/^\d/.test(part)
        && !part.includes('/'))
      .filter((part, index, all) => all.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index);
    if (parts.length) return parts.slice(-2).join(', ');
    const city = String(venue.city || '').trim();
    return /[a-z]{3,}/i.test(city) && !city.includes('+') ? city : 'Location not added';
  }

  async loadPlayerCoaches(): Promise<void> {
    this.coachesLoading = true;
    this.coachesError = '';
    try {
      const response = await firstValueFrom(this.coachService.getCoaches('', '', 50, 'top'));
      const payload: any = response.data;
      const rows = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
      const pricedRows = rows.filter((coach: any) => this.coachPriceAmount(coach) > 0);
      this.homeCoaches = pricedRows.slice(0, 4).map((coach: any, index: number) => {
        const sports: string[] = Array.isArray(coach.sports) ? coach.sports.map(String).filter(Boolean) : [];
        const specialties: string[] = Array.isArray(coach.specialties) && coach.specialties.length ? coach.specialties.map(String) : sports.slice(1);
        const years = Number(coach.experienceYears ?? coach.experience_years);
        return {
          id: Number(coach.id || index + 1),
          name: String(coach.name || coach.displayName || 'TYNG Coach'),
          image: resolveMediaUrl(coach.profileImage || coach.profile_image || coach.photo || coach.avatar),
          sport: this.formatSportName(sports[0] || coach.sport || 'Multi-sport'),
          specialties: specialties.slice(0, 2).map((item) => this.formatSportName(item)).join(' • '),
          experience: Number.isFinite(years) && years > 0
            ? `${years} yr${years === 1 ? '' : 's'} experience`
            : this.formatSportName(String(coach.experience || 'Experienced')),
          rating: String(coach.rating ?? 'New'),
          verified: Boolean(coach.verified ?? coach.isVerified ?? coach.is_verified),
          price: this.coachPriceLabel(coach),
        };
      });
    } catch {
      this.homeCoaches = [];
      this.coachesError = 'Coaches could not be loaded.';
    } finally {
      this.coachesLoading = false;
    }
  }

  private async loadPlayerProgress(): Promise<void> {
    const [summary, board, badges] = await Promise.all([
      firstValueFrom(this.xpService.summary()).catch(() => null),
      firstValueFrom(this.xpService.leaderboard('month')).catch(() => null),
      firstValueFrom(this.xpService.badges()).catch(() => []),
    ]);
    this.xpSummary = summary;

    const rows = board?.items ?? [];
    const me = board?.me ?? null;
    const myRank = me?.rank ?? null;
    const toRow = (row: { rank: number | null; name: string; level: number; levelTitle?: string | null; xp: number }, isMe: boolean): HomeRaceRow => ({
      rank: Number(row.rank || 0),
      name: row.name || 'TYNG Player',
      initials: this.personInitials(row.name),
      caption: isMe ? `${row.levelTitle || 'Player'} • Level ${row.level}` : `Level ${row.level}${row.levelTitle ? ` • ${row.levelTitle}` : ''}`,
      xp: Number(row.xp || 0),
      me: isMe,
    });
    if (me && myRank && myRank > 3) {
      this.raceRows = [...rows.slice(0, 2).map((row) => toRow(row, false)), toRow(me, true)];
    } else {
      this.raceRows = rows.slice(0, 3).map((row) => toRow(row, !!me && row.playerId === me.playerId));
    }
    const ahead = myRank && myRank > 1 ? rows.find((row) => row.rank === myRank - 1) : undefined;
    this.raceNote = !me || !myRank
      ? 'Play a game this month to join the race.'
      : myRank === 1
        ? "You're leading the race this month."
        : ahead
          ? `${Math.max(1, ahead.xp - me.xp + 1).toLocaleString('en-IN')} XP to pass ${ahead.name}.`
          : `You're #${myRank} this month. Keep playing to climb.`;

    const ordered = [...badges.filter((badge) => badge.earned), ...badges.filter((badge) => !badge.earned)].slice(0, 6);
    this.homeBadges = ordered.map((badge, index) => ({
      name: badge.name,
      description: badge.description || (badge.earned ? 'Unlocked' : 'Not unlocked yet'),
      icon: this.badgeIcon(`${badge.category} ${badge.code}`),
      ...HOME_BADGE_PALETTES[index % HOME_BADGE_PALETTES.length],
      earned: badge.earned,
    }));
  }

  get openGamesSuggestion(): string {
    const open = this.nearbyBookings.filter((booking) => Number(booking.availableSlots) > 0);
    if (!open.length) return '';
    const counts = new Map<string, number>();
    open.forEach((booking) => counts.set(booking.sport, (counts.get(booking.sport) || 0) + 1));
    const [sport, count] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    return `${count} ${this.formatSportName(sport).toLowerCase()} game${count === 1 ? '' : 's'} near you ${count === 1 ? 'has' : 'have'} spots open.`;
  }

  private badgeIcon(key: string): string {
    const value = key.toLowerCase();
    if (/time|punctual|reliab|clock/.test(value)) return 'time-outline';
    if (/sport|fair|rating|respect/.test(value)) return 'shield-checkmark-outline';
    if (/venue|ground|explor|travel/.test(value)) return 'location-outline';
    if (/host|organi|create|captain/.test(value)) return 'flash-outline';
    if (/community|friend|social|team/.test(value)) return 'people-outline';
    return 'trophy-outline';
  }

  private async loadPlayerTournament(): Promise<void> {
    this.tournamentLoading = true;
    try {
      const response = await firstValueFrom(this.venueEventService.upcoming(10));
      const events = Array.isArray(response.data) ? response.data : [];
      const event = events.find((item) => this.isTournamentEvent(item));
      this.homeTournament = event ? this.toHomeTournament(event) : null;
    } catch {
      this.homeTournament = null;
    } finally {
      this.tournamentLoading = false;
    }
  }

  private isTournamentEvent(event: VenueEventRecord): boolean {
    const type = String(event.type || '').toLowerCase();
    return type === 'competition' || type.includes('tournament') || Boolean(event.tournamentFormat);
  }

  private toHomeTournament(event: VenueEventRecord): HomeTournamentCard {
    const sportLabel = this.formatSportName(event.sport || 'Sport');
    const formatLabel = String(event.tournamentFormat || event.type || 'Tournament')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
    const prize = Math.max(Number(event.prizePool || 0), Number(event.cashPrize || 0));
    const entryFee = Number(event.entryFee || 0);
    const detailLabel = prize > 0
      ? `Prize ${this.formatCurrency(prize)}`
      : entryFee > 0
        ? `Entry ${this.formatCurrency(entryFee)}`
        : event.registrations > 0
          ? `${event.registrations} registered`
          : 'Registration open';

    return {
      id: String(event.id),
      title: String(event.name || '').trim() || `${sportLabel} Tournament`,
      sportLabel,
      formatLabel,
      dateLabel: this.tournamentDateLabel(event.eventDate),
      detailLabel,
    };
  }

  private tournamentDateLabel(value?: string | null): string {
    if (!value) return 'Date to be announced';
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return 'Date to be announced';
    return date.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  openTournament(eventId: string): void {
    void this.router.navigateByUrl(`/app/events/details/${eventId}`);
  }

  private coachPriceLabel(coach: any): string {
    return `₹${this.coachPriceAmount(coach).toLocaleString('en-IN')}`;
  }

  private coachPriceAmount(coach: any): number {
    const amount = Number(coach.pricePerHour ?? coach.hourlyRate ?? coach.fee ?? 0);
    return Number.isFinite(amount) && amount > 0 ? amount : 0;
  }

  async openMenu() {
    await this.menu.open();
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  openSearchFilter(event: Event): void {
    event.stopPropagation();
    this.searchFilterEvent = event;
    this.searchFilterOpen = true;
  }

  closeSearchFilter(): void {
    this.searchFilterOpen = false;
  }

  async searchByType(type: 'venues' | 'players' | 'coaches'): Promise<void> {
    try {
      await this.searchFilterPopover?.dismiss();
    } catch {
      // Already dismissed.
    }
    this.searchFilterOpen = false;
    await this.router.navigate(['/app/search'], { queryParams: { type } });
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
