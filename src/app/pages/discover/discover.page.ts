import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DiscoverPlayer } from '../../core/models/api.model';
import { AuthService } from '../../core/services/auth.service';
import { ChatService } from '../../core/services/chat.service';
import { SocialService } from '../../core/services/social.service';
import { UiChromeService } from '../../core/services/ui-chrome.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

interface SportChip {
  id: string;
  name: string;
  level: string | null;
  icon: string;
}

interface DiscoverCard {
  id: string;
  name: string;
  firstName: string;
  initials: string;
  username: string | null;
  age: number | null;
  photo: string | null;
  area: string | null;
  distance: number | null;
  availabilityLabel: string | null;
  verified: boolean;
  level: number;
  bio: string | null;
  sports: SportChip[];
  reliability: number | null;
  rating: number | null;
  games: number;
  reasons: string[];
}

type FilterKey = 'sports' | 'skill' | 'distance' | 'reliability' | 'availability';

interface FilterGroup {
  key: FilterKey;
  title: string;
  multi: boolean;
  options: Array<{ value: string; label: string }>;
}

const SPORT_ICONS: Record<string, string> = {
  football: 'football-outline',
  cricket: 'locate-outline',
  badminton: 'pulse-outline',
  basketball: 'basketball-outline',
  tennis: 'tennisball-outline',
  swimming: 'water-outline',
  volleyball: 'baseball-outline',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  morning: 'AVAILABLE MORNINGS',
  afternoon: 'AVAILABLE AFTERNOONS',
  evening: 'AVAILABLE EVENINGS',
  night: 'AVAILABLE NIGHTS',
  weekend: 'AVAILABLE WEEKENDS',
  flexible: 'FLEXIBLE SCHEDULE',
};

const SWIPE_THRESHOLD = 110;

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent],
  styleUrls: ['./discover.page.scss'],
  templateUrl: './discover.page.html',
})
export class DiscoverPage implements OnDestroy {
  private readonly router = inject(Router);
  private readonly social = inject(SocialService);
  private readonly chat = inject(ChatService);
  private readonly auth = inject(AuthService);
  private readonly chrome = inject(UiChromeService);
  private readonly toastCtrl = inject(ToastController);

  cards: DiscoverCard[] = [];
  index = 0;
  total = 0;
  page = 1;
  lastPage = 1;
  loading = true;
  loadingMore = false;
  errorMessage = '';

  searchOpen = false;
  searchQuery = '';
  searchResults: DiscoverCard[] = [];
  searching = false;
  private searchTimer?: ReturnType<typeof setTimeout>;

  sheet: 'filters' | 'connect' | null = null;
  selected: Record<FilterKey, string[]> = this.emptyFilters();
  draft: Record<FilterKey, string[]> = this.emptyFilters();
  connectTarget: DiscoverCard | null = null;
  connectMessage = '';
  sending = false;
  toastLabel = '';
  private toastTimer?: ReturnType<typeof setTimeout>;

  dragX = 0;
  dragging = false;
  leaving: 'left' | 'right' | null = null;
  private startX = 0;
  private startY = 0;
  private moved = false;

  constructor() {
    void this.load(true);
  }

  get current(): DiscoverCard | undefined {
    return this.cards[this.index];
  }

  get next(): DiscoverCard | undefined {
    return this.cards[this.index + 1];
  }

  get nearbyLabel(): string {
    if (this.loading) return 'Finding players near you…';
    const remaining = Math.max(0, this.total - this.index);
    return `${remaining} ${remaining === 1 ? 'player' : 'players'} nearby`;
  }

  get hasFilters(): boolean {
    return Object.values(this.selected).some((values) => values.length > 0);
  }

  get filterGroups(): FilterGroup[] {
    const groups: FilterGroup[] = [
      {
        key: 'sports',
        title: 'SPORT',
        multi: true,
        options: ['Football', 'Cricket', 'Badminton', 'Basketball', 'Tennis'].map((s) => ({ value: s.toLowerCase(), label: s })),
      },
      {
        key: 'skill',
        title: 'SKILL LEVEL',
        multi: true,
        options: ['Beginner', 'Intermediate', 'Advanced', 'Expert'].map((s) => ({ value: s.toLowerCase(), label: s })),
      },
    ];
    const me = this.auth.user();
    if (me?.latitude != null && me?.longitude != null) {
      groups.push({
        key: 'distance',
        title: 'DISTANCE',
        multi: false,
        options: [
          { value: '2', label: 'Nearby' },
          { value: '5', label: '< 5 km' },
          { value: '10', label: '< 10 km' },
          { value: '20', label: '< 20 km' },
        ],
      });
    }
    groups.push(
      {
        key: 'reliability',
        title: 'RELIABILITY',
        multi: false,
        options: ['80', '90', '95'].map((v) => ({ value: v, label: `${v}+` })),
      },
      {
        key: 'availability',
        title: 'AVAILABILITY',
        multi: true,
        options: [
          { value: 'morning', label: 'Morning' },
          { value: 'evening', label: 'Evening' },
          { value: 'night', label: 'Night' },
          { value: 'weekend', label: 'Weekends' },
          { value: 'flexible', label: 'Flexible' },
        ],
      },
    );
    return groups;
  }

  get cardTransform(): string {
    if (this.leaving === 'right') return 'translateX(140%) rotate(14deg)';
    if (this.leaving === 'left') return 'translateX(-140%) rotate(-14deg)';
    return `translateX(${this.dragX}px) rotate(${(this.dragX / 220) * 4}deg)`;
  }

  get connectHintOpacity(): number {
    return Math.min(1, Math.max(0, (this.dragX - 30) / 90));
  }

  get skipHintOpacity(): number {
    return Math.min(1, Math.max(0, (-this.dragX - 30) / 90));
  }

  async refresh(event: Event): Promise<void> {
    await this.load(true);
    (event as RefresherCustomEvent).target.complete();
  }

  toggleSearch(): void {
    this.searchOpen = !this.searchOpen;
    if (!this.searchOpen) {
      this.searchQuery = '';
      this.searchResults = [];
    }
  }

  onSearchInput(): void {
    clearTimeout(this.searchTimer);
    const query = this.searchQuery.trim();
    if (!query) {
      this.searchResults = [];
      this.searching = false;
      return;
    }
    this.searching = true;
    this.searchTimer = setTimeout(() => void this.runSearch(query), 300);
  }

  openFilters(): void {
    this.draft = this.cloneFilters(this.selected);
    this.openSheet('filters');
  }

  isDraftSelected(key: FilterKey, value: string): boolean {
    return this.draft[key].includes(value);
  }

  toggleDraft(group: FilterGroup, value: string): void {
    const values = this.draft[group.key];
    if (values.includes(value)) {
      this.draft[group.key] = values.filter((v) => v !== value);
    } else {
      this.draft[group.key] = group.multi ? [...values, value] : [value];
    }
  }

  clearDraft(): void {
    this.draft = this.emptyFilters();
  }

  async applyFilters(): Promise<void> {
    this.selected = this.cloneFilters(this.draft);
    this.closeSheet();
    await this.load(true);
  }

  async clearFilters(): Promise<void> {
    this.selected = this.emptyFilters();
    await this.load(true);
  }

  async filterBySport(sportId: string): Promise<void> {
    this.selected = { ...this.emptyFilters(), sports: [sportId] };
    await this.load(true);
  }

  viewProfile(card: DiscoverCard): void {
    void this.router.navigateByUrl(`/app/player/${card.id}`);
  }

  skip(): void {
    const card = this.current;
    if (!card || this.leaving) return;
    this.animateOut('left');
    void firstValueFrom(this.social.swipePlayer(card.id, 'left')).catch(() => null);
  }

  startConnect(): void {
    const card = this.current;
    if (!card || this.leaving) return;
    this.connectTarget = card;
    this.connectMessage = 'Hey! Would be great to play sometime.';
    this.openSheet('connect');
  }

  async sendConnection(): Promise<void> {
    const target = this.connectTarget;
    if (!target || this.sending) return;
    this.sending = true;
    try {
      const res = await firstValueFrom(this.social.swipePlayer(target.id, 'right'));
      if (!res.success) {
        await this.presentError(res.message || 'Could not connect right now.');
        return;
      }
      const message = this.connectMessage.trim();
      if (message) {
        const thread = await this.chat.openPrivate(target.id);
        if (thread.success && thread.data?.id) {
          await this.chat.sendMessage(thread.data.id, message);
        }
      }
      this.closeSheet();
      this.showBadge(res.data?.friendAdded ? 'CONNECTED' : 'REQUEST SENT');
      if (this.current?.id === target.id) this.animateOut('right');
    } catch (error: any) {
      await this.presentError(error?.error?.message || 'Could not connect right now.');
    } finally {
      this.sending = false;
    }
  }

  openSheet(sheet: 'filters' | 'connect'): void {
    if (!this.sheet) this.chrome.openOverlay();
    this.sheet = sheet;
  }

  closeSheet(): void {
    if (this.sheet) this.chrome.closeOverlay();
    this.sheet = null;
  }

  ionViewWillLeave(): void {
    this.closeSheet();
  }

  ngOnDestroy(): void {
    this.closeSheet();
    clearTimeout(this.searchTimer);
    clearTimeout(this.toastTimer);
  }

  onPointerDown(event: PointerEvent): void {
    if (this.leaving || (event.target as HTMLElement).closest('button')) return;
    this.dragging = true;
    this.moved = false;
    this.startX = event.clientX;
    this.startY = event.clientY;
    (event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId);
  }

  onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    const dx = event.clientX - this.startX;
    const dy = event.clientY - this.startY;
    if (!this.moved && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 8) {
      this.dragging = false;
      this.dragX = 0;
      return;
    }
    if (Math.abs(dx) > 6) this.moved = true;
    this.dragX = dx;
  }

  onPointerUp(): void {
    if (!this.dragging) return;
    this.dragging = false;
    if (this.dragX > SWIPE_THRESHOLD) {
      this.dragX = 0;
      this.startConnect();
    } else if (this.dragX < -SWIPE_THRESHOLD) {
      this.skip();
    } else {
      this.dragX = 0;
    }
  }

  private animateOut(direction: 'left' | 'right'): void {
    this.leaving = direction;
    setTimeout(() => {
      this.index += 1;
      this.leaving = null;
      this.dragX = 0;
      if (this.cards.length - this.index <= 3 && this.page < this.lastPage && !this.loadingMore) {
        void this.load(false);
      }
    }, 280);
  }

  private async load(reset: boolean): Promise<void> {
    if (reset) {
      this.loading = true;
      this.errorMessage = '';
      this.page = 1;
      this.index = 0;
      this.cards = [];
    } else {
      this.loadingMore = true;
      this.page += 1;
    }
    try {
      const res = await firstValueFrom(this.social.getDiscoverPlayers(this.buildQuery(this.page)));
      if (!res.success || !res.data) {
        this.errorMessage = res.message || 'Unable to load players.';
        return;
      }
      const next = res.data.items.map((player) => this.toCard(player));
      const known = new Set(this.cards.map((c) => c.id));
      this.cards = [...this.cards, ...next.filter((c) => !known.has(c.id))];
      this.lastPage = res.data.pagination.lastPage;
      this.total = res.data.pagination.total;
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Unable to load players right now.';
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  private async runSearch(query: string): Promise<void> {
    const params = new URLSearchParams({ q: query, per_page: '8' });
    const res = await firstValueFrom(this.social.getDiscoverPlayers(params.toString())).catch(() => null);
    if (query !== this.searchQuery.trim()) return;
    this.searchResults = (res?.data?.items ?? []).map((player) => this.toCard(player));
    this.searching = false;
  }

  private buildQuery(page: number): string {
    const params = new URLSearchParams({ page: String(page), per_page: '20' });
    if (this.selected.sports.length) params.set('sports', this.selected.sports.join(','));
    if (this.selected.skill.length) params.set('skill', this.selected.skill.join(','));
    if (this.selected.availability.length) params.set('availability', this.selected.availability.join(','));
    if (this.selected.reliability[0]) params.set('min_reliability', this.selected.reliability[0]);
    if (this.selected.distance[0]) params.set('max_distance', this.selected.distance[0]);
    return params.toString();
  }

  private toCard(player: DiscoverPlayer): DiscoverCard {
    const name = (player.name || 'TYNG Player').trim();
    const level = player.skillLevel || null;
    const sports = (player.sports ?? []).slice(0, 3).map((sport) => {
      const id = String(sport).toLowerCase();
      return {
        id,
        name: id.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        level,
        icon: SPORT_ICONS[id] ?? 'trophy-outline',
      };
    });
    const availability = (player.availability ?? []).map((slot) => String(slot).toLowerCase());
    const slot = availability.find((s) => s !== 'flexible' && AVAILABILITY_LABELS[s]) ?? availability.find((s) => AVAILABILITY_LABELS[s]);
    return {
      id: String(player.id),
      name,
      firstName: name.split(/\s+/)[0],
      initials: name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join(''),
      username: player.username ? `@${player.username}` : null,
      age: player.age ?? null,
      photo: resolveMediaUrl(player.profileImage ?? null),
      area: this.formatArea(player.area ?? null),
      distance: player.distance ?? null,
      availabilityLabel: slot ? AVAILABILITY_LABELS[slot] : null,
      verified: !!player.verified,
      level: Number(player.level || 1),
      bio: player.bio || null,
      sports,
      reliability: player.reliabilityScore ?? null,
      rating: player.rating ?? null,
      games: Number(player.gamesPlayed || 0),
      reasons: player.matchReasons ?? [],
    };
  }

  private formatArea(area: string | null): string | null {
    if (!area) return null;
    return area
      .split('>')
      .map((part) => part.trim())
      .filter(Boolean)
      .join(', ');
  }

  private emptyFilters(): Record<FilterKey, string[]> {
    return { sports: [], skill: [], distance: [], reliability: [], availability: [] };
  }

  private cloneFilters(source: Record<FilterKey, string[]>): Record<FilterKey, string[]> {
    return {
      sports: [...source.sports],
      skill: [...source.skill],
      distance: [...source.distance],
      reliability: [...source.reliability],
      availability: [...source.availability],
    };
  }

  private showBadge(label: string): void {
    this.toastLabel = label;
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => (this.toastLabel = ''), 1400);
  }

  private async presentError(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, color: 'danger', duration: 2200, position: 'bottom' });
    await toast.present();
  }
}
