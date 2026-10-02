import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetButton, ActionSheetController, AlertController, IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import {
  DocumentType,
  DocumentVisibility,
  MedicalAccess,
  PersonalUpdate,
  PlayerDocument,
  PlayerProfile,
  PlayerProfileService,
  ProfileBadge,
  ProfileGame,
  ProfileMedical,
  ProfileVisibility,
} from '../../../core/services/player-profile.service';
import { badgeVisual } from '../../../shared/badge-visuals';
import { ChipOption, PpChipsComponent, PpFieldComponent, PpToggleComponent } from './profile-ui.components';

type Tab = 'overview' | 'personal' | 'stats' | 'medical' | 'documents';

interface PersonalDraft {
  name: string;
  username: string;
  dob: string;
  gender: string | null;
  city: string;
  area: string;
  languagesText: string;
  bio: string;
  primarySport: string | null;
  otherSports: string[];
  playingLevel: string | null;
  preferredPosition: string | null;
  dominantHand: string | null;
  dominantFoot: string | null;
  playStyle: string | null;
  preferredTimes: string[];
  preferredDays: string | null;
  environment: string | null;
  searchRadiusKm: string;
  coachInterest: string;
  venuePreference: string;
}

interface MedicalDraft {
  medical: Omit<ProfileMedical['medical'], 'heightCm' | 'weightKg' | 'restingHeartRate'> & {
    heightCm: string;
    weightKg: string;
    restingHeartRate: string;
  };
  emergencyContacts: ProfileMedical['emergencyContacts'];
  wellness: Omit<ProfileMedical['wellness'], 'sleepHours'> & { sleepHours: string };
  customAllergy: string;
}

const options = (labels: string[]): ChipOption[] => labels.map((label) => ({ value: label, label }));
const lowerOptions = (labels: string[]): ChipOption[] => labels.map((label) => ({ value: label.toLowerCase(), label }));
const titleCase = (value: string): string => value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const SPORTS = ['cricket', 'football', 'badminton', 'tennis', 'basketball', 'volleyball', 'table tennis', 'hockey'];

const POSITIONS: Record<string, string[]> = {
  cricket: ['Batsman', 'Bowler', 'All-rounder', 'Wicketkeeper'],
  football: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  hockey: ['Goalkeeper', 'Defender', 'Midfielder', 'Forward'],
  basketball: ['Guard', 'Forward', 'Center'],
  volleyball: ['Setter', 'Hitter', 'Blocker', 'Libero'],
  badminton: ['Singles', 'Doubles', 'Mixed Doubles'],
  tennis: ['Singles', 'Doubles', 'Mixed Doubles'],
  'table tennis': ['Singles', 'Doubles'],
};

const XP_CATEGORY_ICONS: Record<string, string> = {
  PROFILE: 'person-outline',
  PLAY: 'trophy-outline',
  RELIABILITY: 'time-outline',
  SPORTSMANSHIP: 'shield-checkmark-outline',
  COMMUNITY: 'people-outline',
};

@Component({
  selector: 'app-player-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, PpChipsComponent, PpFieldComponent, PpToggleComponent],
  templateUrl: './player-profile.component.html',
  styleUrls: ['./player-profile.component.scss'],
})
export class PlayerProfileComponent implements OnInit {
  private readonly api = inject(PlayerProfileService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly actionSheets = inject(ActionSheetController);
  private readonly alerts = inject(AlertController);
  private readonly toasts = inject(ToastController);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  @ViewChild('docInput') private docInput?: ElementRef<HTMLInputElement>;

  readonly tabs: Array<{ id: Tab; label: string }> = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'personal', label: 'PERSONAL INFO' },
    { id: 'stats', label: 'STATS' },
    { id: 'medical', label: 'MEDICAL & FITNESS' },
    { id: 'documents', label: 'DOCUMENTS' },
  ];

  readonly sportOptions = computed<ChipOption[]>(() => {
    const own = [this.profile()?.personal.primarySport, ...(this.profile()?.personal.otherSports ?? [])].filter(Boolean) as string[];
    return [...new Set([...SPORTS, ...own])].map((sport) => ({ value: sport, label: titleCase(sport) }));
  });
  readonly levelOptions: ChipOption[] = [
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
    { value: 'expert', label: 'Professional' },
  ];
  readonly genderOptions = options(['Male', 'Female', 'Other', 'Prefer not to say']);
  readonly handOptions = lowerOptions(['Right', 'Left', 'Ambidextrous']);
  readonly footOptions = lowerOptions(['Right', 'Left', 'Both']);
  readonly playStyleOptions = lowerOptions(['Recreational', 'Competitive', 'Both']);
  readonly timeOptions = lowerOptions(['Morning', 'Afternoon', 'Evening', 'Night']);
  readonly dayOptions = lowerOptions(['Weekday', 'Weekend', 'Both']);
  readonly environmentOptions = lowerOptions(['Indoor', 'Outdoor', 'Both']);
  readonly bloodGroupOptions = options(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']);
  readonly yesNoOptions = options(['No', 'Occasionally', 'Yes']);
  readonly dietOptions = options(['Vegetarian', 'Non-Vegetarian', 'Eggetarian', 'Vegan']);
  private readonly baseAllergies = ['Dust', 'Pollen', 'Nuts', 'Dairy', 'Latex', 'Bee Sting', 'Penicillin', 'Aspirin'];

  readonly visibilityRows: Array<{ key: keyof ProfileVisibility; label: string }> = [
    { key: 'showCity', label: 'Show City' },
    { key: 'showAgeRange', label: 'Show Age Range' },
    { key: 'showGamesPlayed', label: 'Show Games Played' },
    { key: 'showReliability', label: 'Show Reliability Score' },
    { key: 'showRating', label: 'Show Rating' },
    { key: 'showBadges', label: 'Show Badges' },
    { key: 'showSports', label: 'Show Sports' },
    { key: 'allowMessages', label: 'Allow Other Players to Message Me' },
  ];

  readonly accessRows: Array<{ key: keyof MedicalAccess; label: string; sub?: string }> = [
    { key: 'coach', label: 'Active Coach' },
    { key: 'venue', label: 'Active Venue / Supervisor', sub: 'Only during a confirmed booking' },
    { key: 'emergency', label: 'Emergency Access' },
    { key: 'players', label: 'General Players' },
  ];

  readonly documentTypes: Array<{ type: DocumentType; title: string; copy: string; icon: string; color: string }> = [
    { type: 'medical_certificate', title: 'MEDICAL CERTIFICATE', copy: 'Doctor-issued fitness or participation document', icon: 'heart-outline', color: '#FF7A00' },
    { type: 'fitness_certificate', title: 'FITNESS CERTIFICATE', copy: 'Trainer, academy or gym certification', icon: 'pulse-outline', color: '#16A34A' },
    { type: 'insurance_card', title: 'INSURANCE CARD', copy: 'Sports or health insurance', icon: 'shield-checkmark-outline', color: '#2563EB' },
    { type: 'identity', title: 'IDENTITY / VERIFICATION', copy: 'Documents requested for TYNG verification', icon: 'id-card-outline', color: '#7C3AED' },
    { type: 'other', title: 'OTHER DOCUMENTS', copy: 'Any other relevant private document', icon: 'document-text-outline', color: '#6B7280' },
  ];

  readonly documentVisibilities: Array<{ value: DocumentVisibility; label: string }> = [
    { value: 'only_me', label: 'Only Me' },
    { value: 'coach_active_session', label: 'Coach During Active Session' },
    { value: 'venue_emergency', label: 'Venue Emergency Access' },
    { value: 'tyng_verification', label: 'TYNG Verification Only' },
  ];

  readonly profile = signal<PlayerProfile | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly activeTab = signal<Tab>('overview');
  readonly editing = signal(false);
  readonly saving = signal(false);
  readonly savedPill = signal(false);
  readonly publicPreview = signal(false);
  readonly badgeSheet = signal(false);
  readonly wellnessOpen = signal(false);
  readonly documents = signal<PlayerDocument[]>([]);
  readonly documentsLoading = signal(false);
  readonly documentsLoaded = signal(false);
  readonly documentBusy = signal<number | 'upload' | null>(null);
  readonly toggleBusy = signal<string | null>(null);

  personalDraft: PersonalDraft | null = null;
  medicalDraft: MedicalDraft | null = null;
  private pendingUpload: { type: DocumentType; replaceId?: number } | null = null;
  private savedTimer?: ReturnType<typeof setTimeout>;

  readonly orderedBadges = computed<ProfileBadge[]>(() => {
    const items = this.profile()?.badges.items ?? [];
    return [...items.filter((badge) => badge.earned), ...items.filter((badge) => !badge.earned)];
  });

  readonly positionOptions = computed<ChipOption[]>(() => {
    const sport = (this.editing() && this.personalDraft ? this.personalDraft.primarySport : this.profile()?.personal.primarySport) ?? '';
    const list = POSITIONS[sport] ?? [];
    return options([...list, 'Other / N/A']);
  });

  readonly allergyOptions = computed<ChipOption[]>(() => {
    const own = this.medicalDraft?.medical.allergies ?? this.profile()?.medical.medical.allergies ?? [];
    return options([...new Set([...this.baseAllergies, ...own])]);
  });

  readonly activityStats = computed(() => {
    const s = this.profile()?.stats;
    if (!s) return [];
    const pct = (value: number | null) => (value == null ? '—' : `${value}%`);
    return [
      [String(s.played), 'GAMES PLAYED'], [String(s.won), 'GAMES WON'], [String(s.lost), 'GAMES LOST'], [String(s.draws), 'DRAWS'],
      [String(s.hosted), 'GAMES HOSTED'], [String(s.joined), 'GAMES JOINED'], [String(s.completed), 'COMPLETED'], [String(s.noShows), 'NO-SHOWS'],
      [String(s.currentStreak), 'CURRENT STREAK'], [String(s.longestStreak), 'LONGEST STREAK'], [pct(s.onTimePct), 'ON-TIME'], [pct(s.completionPct), 'COMPLETION'],
    ];
  });

  readonly reliabilityRows = computed(() => {
    const r = this.profile()?.reliability;
    if (!r) return [];
    return [
      ['Attendance', r.attendance], ['Punctuality', r.punctuality], ['Late Cancellations', r.lateCancellations],
      ['No-Shows', r.noShows], ['Booking Completion', r.bookingCompletion], ['Captain Reliability', r.captainReliability],
    ] as Array<[string, number | null]>;
  });

  readonly reputationRows = computed(() => {
    const r = this.profile()?.reputation;
    if (!r) return [];
    return [
      ['Sportsmanship', r.sportsmanship], ['Punctuality', r.punctuality], ['Communication', r.communication], ['Venue Behaviour', r.venueBehaviour],
    ] as Array<[string, number | null]>;
  });

  ngOnInit(): void {
    const requested = this.route.snapshot.queryParamMap.get('tab') as Tab | null;
    if (requested && this.tabs.some((tab) => tab.id === requested)) {
      this.activeTab.set(requested);
    }
    void this.load();
    if (this.activeTab() === 'documents') void this.loadDocuments();
  }

  refresh(): void {
    if (this.loading() || this.editing()) return;
    void this.load(!this.profile());
  }

  async load(showSpinner = true): Promise<void> {
    if (showSpinner) this.loading.set(true);
    this.error.set(null);
    try {
      const res = await firstValueFrom(this.api.getProfile());
      this.profile.set(res.data ?? null);
      if (showSpinner) this.revealActiveTab(false);
    } catch {
      if (showSpinner) this.error.set('Check your connection and try again.');
    } finally {
      this.loading.set(false);
    }
  }

  changeTab(tab: Tab): void {
    if (this.editing()) this.cancelEdit();
    this.activeTab.set(tab);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { tab: tab === 'overview' ? null : tab },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    if (tab === 'documents' && !this.documentsLoaded()) void this.loadDocuments();
    this.revealActiveTab(true);
  }

  private revealActiveTab(smooth: boolean): void {
    setTimeout(() => {
      const button = this.host.nativeElement.querySelector<HTMLElement>(`.pp-tab[data-tab="${this.activeTab()}"]`);
      button?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'nearest', inline: 'center' });
    });
  }

  editPhoto(): void {
    void this.router.navigateByUrl('/app/profile/edit');
  }

  openSettings(): void {
    void this.router.navigateByUrl('/app/settings');
  }

  go(path: string): void {
    void this.router.navigateByUrl(path);
  }

  // ---------- editing ----------

  startEdit(tab: 'personal' | 'medical'): void {
    const profile = this.profile();
    if (!profile) return;
    if (this.activeTab() !== tab) this.changeTab(tab);
    if (tab === 'personal') {
      const p = profile.personal;
      this.personalDraft = {
        name: p.name ?? '',
        username: p.username ?? '',
        dob: p.dob ?? '',
        gender: p.gender,
        city: p.city ?? '',
        area: p.area ?? '',
        languagesText: (p.languages ?? []).join(', '),
        bio: p.bio ?? '',
        primarySport: p.primarySport,
        otherSports: [...(p.otherSports ?? [])],
        playingLevel: p.playingLevel,
        preferredPosition: p.preferredPosition,
        dominantHand: p.dominantHand,
        dominantFoot: p.dominantFoot,
        playStyle: p.playStyle === 'training' ? null : p.playStyle,
        preferredTimes: [...(p.preferredTimes ?? [])],
        preferredDays: p.preferredDays,
        environment: p.environment,
        searchRadiusKm: p.searchRadiusKm != null ? String(p.searchRadiusKm) : '',
        coachInterest: p.coachInterest ?? '',
        venuePreference: p.venuePreference ?? '',
      };
    } else {
      const m = profile.medical;
      this.medicalDraft = {
        medical: {
          ...m.medical,
          heightCm: m.medical.heightCm != null ? String(m.medical.heightCm) : '',
          weightKg: m.medical.weightKg != null ? String(m.medical.weightKg) : '',
          restingHeartRate: m.medical.restingHeartRate != null ? String(m.medical.restingHeartRate) : '',
          sportsInterested: [...(m.medical.sportsInterested ?? [])],
          allergies: [...(m.medical.allergies ?? [])],
        },
        emergencyContacts: {
          primary: { ...m.emergencyContacts.primary },
          secondary: { ...m.emergencyContacts.secondary },
        },
        wellness: { ...m.wellness, sleepHours: m.wellness.sleepHours != null ? String(m.wellness.sleepHours) : '' },
        customAllergy: '',
      };
    }
    this.editing.set(true);
  }

  cancelEdit(): void {
    this.editing.set(false);
    this.personalDraft = null;
    this.medicalDraft = null;
  }

  setPrimarySport(value: string | string[] | null): void {
    if (!this.personalDraft) return;
    const sport = typeof value === 'string' ? value : null;
    this.personalDraft.primarySport = sport;
    this.personalDraft.otherSports = this.personalDraft.otherSports.filter((item) => item !== sport);
    const positions = POSITIONS[sport ?? ''] ?? [];
    if (this.personalDraft.preferredPosition && !positions.includes(this.personalDraft.preferredPosition) && this.personalDraft.preferredPosition !== 'Other / N/A') {
      this.personalDraft.preferredPosition = null;
    }
  }

  otherSportOptions(): ChipOption[] {
    const primary = this.editing() && this.personalDraft ? this.personalDraft.primarySport : this.profile()?.personal.primarySport;
    return this.sportOptions().filter((option) => option.value !== primary);
  }

  addCustomAllergy(): void {
    const draft = this.medicalDraft;
    const value = draft?.customAllergy.trim();
    if (!draft || !value) return;
    if (!draft.medical.allergies.some((item) => item.toLowerCase() === value.toLowerCase())) {
      draft.medical.allergies = [...draft.medical.allergies, value.slice(0, 40)];
    }
    draft.customAllergy = '';
  }

  asList(value: string | string[] | null): string[] {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  asOne(value: string | string[] | null): string | null {
    return typeof value === 'string' ? value : null;
  }

  async save(): Promise<void> {
    if (this.saving()) return;
    this.saving.set(true);
    try {
      const res = this.activeTab() === 'medical' && this.medicalDraft
        ? await firstValueFrom(this.api.updateMedical(this.medicalPayload(this.medicalDraft)))
        : this.personalDraft
          ? await firstValueFrom(this.api.updatePersonal(this.personalPayload(this.personalDraft)))
          : null;
      if (res?.data) this.profile.set(res.data);
      this.cancelEdit();
      this.flashSaved();
      this.auth.fetchMe().subscribe({ error: () => undefined });
    } catch (err) {
      await this.toast(this.errorMessage(err, "Couldn't save your changes. Please try again."));
    } finally {
      this.saving.set(false);
    }
  }

  private personalPayload(d: PersonalDraft): PersonalUpdate {
    const text = (value: string) => value.trim() || null;
    const radius = parseInt(d.searchRadiusKm, 10);
    return {
      name: d.name.trim(),
      username: d.username.trim().replace(/^@/, ''),
      dob: d.dob || null,
      gender: d.gender,
      city: text(d.city),
      area: text(d.area),
      languages: d.languagesText.split(',').map((item) => item.trim()).filter(Boolean).slice(0, 10),
      bio: text(d.bio),
      primarySport: d.primarySport,
      otherSports: d.otherSports,
      playingLevel: d.playingLevel as PersonalUpdate['playingLevel'],
      preferredPosition: d.preferredPosition,
      dominantHand: d.dominantHand,
      dominantFoot: d.dominantFoot,
      playStyle: d.playStyle,
      preferredTimes: d.preferredTimes as PersonalUpdate['preferredTimes'],
      preferredDays: d.preferredDays,
      environment: d.environment,
      searchRadiusKm: Number.isFinite(radius) ? Math.min(100, Math.max(1, radius)) : null,
      coachInterest: text(d.coachInterest),
      venuePreference: text(d.venuePreference),
    };
  }

  private medicalPayload(d: MedicalDraft) {
    const num = (value: string) => {
      const parsed = parseFloat(String(value ?? '').replace(',', '.'));
      return Number.isFinite(parsed) ? parsed : null;
    };
    const text = (value: string | null) => (value ?? '').trim() || null;
    const contact = (c: { name: string | null; relationship: string | null; phone: string | null }) => ({
      name: text(c.name),
      relationship: text(c.relationship),
      phone: text(c.phone),
    });
    const heartRate = num(d.medical.restingHeartRate);
    return {
      medical: {
        heightCm: num(d.medical.heightCm),
        weightKg: num(d.medical.weightKg),
        bloodGroup: d.medical.bloodGroup,
        fitnessLevel: d.medical.fitnessLevel,
        restingHeartRate: heartRate != null ? Math.round(heartRate) : null,
        fitnessPosition: text(d.medical.fitnessPosition),
        sportsInterested: d.medical.sportsInterested,
        allergies: d.medical.allergies,
        medicalConditions: text(d.medical.medicalConditions),
        pastInjuries: text(d.medical.pastInjuries),
        currentInjuries: text(d.medical.currentInjuries),
        surgeries: text(d.medical.surgeries),
        medications: text(d.medical.medications),
        emergencyNotes: text(d.medical.emergencyNotes),
      },
      emergencyContacts: { primary: contact(d.emergencyContacts.primary), secondary: contact(d.emergencyContacts.secondary) },
      wellness: {
        smoking: d.wellness.smoking,
        alcohol: d.wellness.alcohol,
        diet: d.wellness.diet,
        sleepHours: num(d.wellness.sleepHours),
      },
    };
  }

  // ---------- instant toggles ----------

  async setVisibility(key: keyof ProfileVisibility, value: boolean): Promise<void> {
    const profile = this.profile();
    if (!profile || this.toggleBusy()) return;
    const previous = profile.personal.visibility[key];
    this.patchProfile((p) => (p.personal.visibility = { ...p.personal.visibility, [key]: value }));
    this.toggleBusy.set(key);
    try {
      await firstValueFrom(this.api.updatePersonal({ visibility: { [key]: value } }));
    } catch {
      this.patchProfile((p) => (p.personal.visibility = { ...p.personal.visibility, [key]: previous }));
      await this.toast("Couldn't update visibility. Please try again.");
    } finally {
      this.toggleBusy.set(null);
    }
  }

  async setMedicalAccess(key: keyof MedicalAccess, value: boolean): Promise<void> {
    const profile = this.profile();
    if (!profile || this.toggleBusy()) return;
    const previous = profile.medical.medicalAccess[key];
    this.patchProfile((p) => (p.medical.medicalAccess = { ...p.medical.medicalAccess, [key]: value }));
    this.toggleBusy.set(key);
    try {
      await firstValueFrom(this.api.updateMedical({ medicalAccess: { [key]: value } }));
    } catch {
      this.patchProfile((p) => (p.medical.medicalAccess = { ...p.medical.medicalAccess, [key]: previous }));
      await this.toast("Couldn't update access. Please try again.");
    } finally {
      this.toggleBusy.set(null);
    }
  }

  async setHydration(value: boolean): Promise<void> {
    const profile = this.profile();
    if (!profile || this.toggleBusy()) return;
    const previous = profile.medical.medical.hydrationReminder;
    this.patchProfile((p) => (p.medical.medical = { ...p.medical.medical, hydrationReminder: value }));
    if (this.medicalDraft) this.medicalDraft.medical.hydrationReminder = value;
    this.toggleBusy.set('hydration');
    try {
      await firstValueFrom(this.api.updateMedical({ medical: { hydrationReminder: value } }));
    } catch {
      this.patchProfile((p) => (p.medical.medical = { ...p.medical.medical, hydrationReminder: previous }));
      if (this.medicalDraft) this.medicalDraft.medical.hydrationReminder = previous;
      await this.toast("Couldn't update the reminder. Please try again.");
    } finally {
      this.toggleBusy.set(null);
    }
  }

  private patchProfile(mutate: (profile: PlayerProfile) => void): void {
    const current = this.profile();
    if (!current) return;
    const next: PlayerProfile = {
      ...current,
      personal: { ...current.personal },
      medical: { ...current.medical },
    };
    mutate(next);
    this.profile.set(next);
  }

  // ---------- games ----------

  async openGame(game: ProfileGame): Promise<void> {
    const results: Array<['win' | 'loss' | 'draw', string]> = [['win', 'Mark as won'], ['loss', 'Mark as lost'], ['draw', 'Mark as draw']];
    const buttons: ActionSheetButton[] = [
      { text: 'View game', icon: 'open-outline', data: 'view' },
      ...results.filter(([value]) => value !== game.result).map(([value, text]) => ({ text, icon: 'trophy-outline', data: value })),
    ];
    if (game.result) buttons.push({ text: 'Clear result', icon: 'close-circle-outline', data: 'clear' });
    buttons.push({ text: 'Cancel', role: 'cancel' });

    const sheet = await this.actionSheets.create({
      header: `${titleCase(game.sport || 'Game')} · ${game.venue || 'TYNG game'}`,
      subHeader: game.result ? `Result: ${this.resultLabel(game)}` : 'Add your result so it counts in your win rate.',
      buttons,
    });
    await sheet.present();
    const { data } = await sheet.onDidDismiss();
    if (!data) return;
    if (data === 'view') {
      this.go(`/app/ongoing/${game.bookingId}`);
      return;
    }
    try {
      await firstValueFrom(this.api.setGameResult(game.bookingId, data === 'clear' ? null : data));
      await this.load(false);
      await this.toast(data === 'clear' ? 'Result cleared' : 'Result saved');
    } catch (err) {
      await this.toast(this.errorMessage(err, "Couldn't save the result. Please try again."));
    }
  }

  resultLabel(game: ProfileGame): string {
    if (game.noShow) return 'NO-SHOW';
    if (game.result === 'win') return 'WON';
    if (game.result === 'loss') return 'LOST';
    if (game.result === 'draw') return 'DRAW';
    return 'COMPLETED';
  }

  resultColor(game: ProfileGame): string {
    if (game.noShow) return '#DC2626';
    if (game.result === 'win') return '#16A34A';
    if (game.result === 'loss') return '#FF7A00';
    if (game.result === 'draw') return '#7C3AED';
    return '#2563EB';
  }

  // ---------- documents ----------

  async loadDocuments(): Promise<void> {
    this.documentsLoading.set(true);
    try {
      const res = await firstValueFrom(this.api.getDocuments());
      this.documents.set(res.data?.items ?? []);
      this.documentsLoaded.set(true);
    } catch {
      await this.toast("Couldn't load your documents.");
    } finally {
      this.documentsLoading.set(false);
    }
  }

  async chooseUploadType(): Promise<void> {
    const sheet = await this.actionSheets.create({
      header: 'What are you uploading?',
      buttons: [
        ...this.documentTypes.map((doc) => ({ text: titleCase(doc.title.toLowerCase()), icon: doc.icon, data: doc.type })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
    const { data } = await sheet.onDidDismiss();
    if (data) this.pickFile(data as DocumentType);
  }

  pickFile(type: DocumentType, replaceId?: number): void {
    this.pendingUpload = { type, replaceId };
    const input = this.docInput?.nativeElement;
    if (!input) return;
    input.value = '';
    input.click();
  }

  async onFileChosen(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0];
    const pending = this.pendingUpload;
    this.pendingUpload = null;
    if (!file || !pending) return;
    if (file.size > 20 * 1024 * 1024) {
      await this.toast('Files must be 20 MB or smaller.');
      return;
    }
    if (!(file.type.startsWith('image/') || file.type === 'application/pdf')) {
      await this.toast('Upload a PDF or an image.');
      return;
    }
    this.documentBusy.set(pending.replaceId ?? 'upload');
    try {
      const res = await firstValueFrom(this.api.uploadDocument(file, pending.type, pending.replaceId));
      const doc = res.data;
      if (doc) {
        this.documents.update((items) => [doc, ...items.filter((item) => item.id !== pending.replaceId)]);
      }
      await this.toast(pending.replaceId ? 'Document replaced' : 'Document uploaded');
    } catch (err) {
      await this.toast(this.errorMessage(err, "Couldn't upload the document. Please try again."));
    } finally {
      this.documentBusy.set(null);
    }
  }

  async viewDocument(doc: PlayerDocument, download = false): Promise<void> {
    this.documentBusy.set(doc.id);
    try {
      const blob = await firstValueFrom(this.api.documentFile(doc.id, download));
      const url = URL.createObjectURL(blob);
      if (download) {
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.name || `${doc.documentType}.${doc.mimeType === 'application/pdf' ? 'pdf' : 'jpg'}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        window.open(url, '_blank');
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch {
      await this.toast("Couldn't open the document.");
    } finally {
      this.documentBusy.set(null);
    }
  }

  async deleteDocument(doc: PlayerDocument): Promise<void> {
    const alert = await this.alerts.create({
      header: 'Delete document?',
      message: `${this.documentTitle(doc)} will be permanently removed.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Delete', role: 'confirm' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'confirm') return;
    this.documentBusy.set(doc.id);
    try {
      await firstValueFrom(this.api.deleteDocument(doc.id));
      this.documents.update((items) => items.filter((item) => item.id !== doc.id));
      await this.toast('Document deleted');
    } catch {
      await this.toast("Couldn't delete the document.");
    } finally {
      this.documentBusy.set(null);
    }
  }

  async setDocumentVisibility(doc: PlayerDocument, visibility: DocumentVisibility): Promise<void> {
    if (doc.visibility === visibility) return;
    const previous = doc.visibility;
    this.documents.update((items) => items.map((item) => (item.id === doc.id ? { ...item, visibility } : item)));
    try {
      await firstValueFrom(this.api.updateDocument(doc.id, { visibility }));
    } catch {
      this.documents.update((items) => items.map((item) => (item.id === doc.id ? { ...item, visibility: previous } : item)));
      await this.toast("Couldn't change who can see this document.");
    }
  }

  documentTitle(doc: PlayerDocument): string {
    if (doc.title) return doc.title;
    const type = this.documentTypes.find((item) => item.type === doc.documentType);
    return type ? titleCase(type.title.toLowerCase()) : 'Document';
  }

  documentVisual(doc: PlayerDocument) {
    return this.documentTypes.find((item) => item.type === doc.documentType) ?? this.documentTypes[4];
  }

  documentVisibilityLabel(value: DocumentVisibility): string {
    return this.documentVisibilities.find((item) => item.value === value)?.label ?? 'Only Me';
  }

  documentMeta(doc: PlayerDocument): string {
    const kind = doc.mimeType === 'application/pdf' ? 'PDF' : (doc.mimeType?.split('/')[1] || 'File').toUpperCase();
    const size = doc.sizeBytes >= 1024 * 1024 ? `${(doc.sizeBytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(doc.sizeBytes / 1024))} KB`;
    const date = doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    return [date && `Uploaded ${date}`, kind, size].filter(Boolean).join(' • ');
  }

  // ---------- display helpers ----------

  sportLabel(sport: string | null | undefined): string {
    return sport ? titleCase(sport) : '';
  }

  joinLabels(values: string[] | null | undefined): string {
    return (values ?? []).map((value) => titleCase(value)).join(', ');
  }

  levelLabel(value: string | null | undefined): string {
    return this.levelOptions.find((option) => option.value === value)?.label ?? '';
  }

  ratingText(value: number | null | undefined): string {
    return value == null ? '—' : Number(value).toFixed(1);
  }

  rankText(value: number | null | undefined): string {
    return value == null ? '—' : `#${value}`;
  }

  dobLabel(dob: string | null): string {
    if (!dob) return '';
    const date = new Date(`${dob}T00:00:00`);
    return Number.isNaN(date.getTime()) ? dob : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  memberSince(value: string | null): string {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
  }

  todayIso(): string {
    return new Date().toISOString().slice(0, 10);
  }

  badgeVisual(badge: ProfileBadge) {
    return badgeVisual(badge);
  }

  xpIcon(category: string | null): string {
    return XP_CATEGORY_ICONS[(category ?? '').toUpperCase()] ?? 'flash-outline';
  }

  xpMeta(item: { createdAt: string | null; category: string | null; sport: string | null }): string {
    const date = item.createdAt ? new Date(item.createdAt) : null;
    const today = new Date();
    const dateLabel = !date ? '' : date.toDateString() === today.toDateString() ? 'Today' : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const detail = item.sport ? titleCase(item.sport) : item.category ? titleCase(item.category.toLowerCase()) : '';
    return [dateLabel, detail].filter(Boolean).join(' • ');
  }

  badgePct(): number {
    const b = this.profile()?.badges;
    return b && b.total > 0 ? Math.round((b.earned / b.total) * 100) : 0;
  }

  private flashSaved(): void {
    this.savedPill.set(true);
    clearTimeout(this.savedTimer);
    this.savedTimer = setTimeout(() => this.savedPill.set(false), 2200);
  }

  private errorMessage(err: unknown, fallback: string): string {
    const body = (err as { error?: { message?: string; errors?: Record<string, string[]> } })?.error;
    const first = body?.errors ? Object.values(body.errors)[0]?.[0] : null;
    return first || body?.message || fallback;
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toasts.create({ message, duration: 2400, position: 'bottom' });
    await toast.present();
  }
}
