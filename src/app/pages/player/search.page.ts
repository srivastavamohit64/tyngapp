import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DiscoverPlayer, SearchVenue } from '../../core/models/api.model';
import { BookingService } from '../../core/services/booking.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

type SearchTab = 'venues' | 'players' | 'coaches';

@Component({
  selector: 'app-search-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <div class="search-page">
        <header class="sp-header">
          <button type="button" class="sp-back" (click)="back()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <div class="sp-input-wrap">
            <ion-icon name="search-outline"></ion-icon>
            <input
              #queryInput
              type="search"
              [(ngModel)]="query"
              (ngModelChange)="onQueryChange($event)"
              placeholder="Search venues, players, coaches"
              autocomplete="off"
            />
          </div>
        </header>

        <div class="sp-tabs">
          <button
            type="button"
            class="sp-tab"
            [class.is-active]="tab === 'venues'"
            (click)="tab = 'venues'"
          >
            Venues
            <span *ngIf="venues.length">{{ venues.length }}</span>
          </button>
          <button
            type="button"
            class="sp-tab"
            [class.is-active]="tab === 'players'"
            (click)="tab = 'players'"
          >
            Players
            <span *ngIf="players.length">{{ players.length }}</span>
          </button>
          <button
            type="button"
            class="sp-tab"
            [class.is-active]="tab === 'coaches'"
            (click)="tab = 'coaches'"
          >
            Coaches
            <span *ngIf="coaches.length">{{ coaches.length }}</span>
          </button>
        </div>

        <p class="sp-hint" *ngIf="query.trim().length < 2">Type at least 2 characters to search.</p>
        <p class="sp-hint" *ngIf="loading">Searching…</p>
        <p class="sp-hint" *ngIf="!loading && query.trim().length >= 2 && visibleCount === 0">
          No {{ tab }} found for “{{ query.trim() }}”.
        </p>

        <div class="sp-list" *ngIf="tab === 'venues'">
          <button type="button" class="sp-row" *ngFor="let venue of venues" (click)="openVenue(venue)">
            <img *ngIf="photo(venue.profileImage)" [src]="photo(venue.profileImage)" alt="" />
            <div *ngIf="!photo(venue.profileImage)" class="sp-avatar">🏟️</div>
            <div class="sp-copy">
              <strong>{{ venue.name }}</strong>
              <small>{{ venue.city || venue.location || 'Venue' }}</small>
            </div>
            <ion-icon name="chevron-forward"></ion-icon>
          </button>
        </div>

        <div class="sp-list" *ngIf="tab === 'players'">
          <button type="button" class="sp-row" *ngFor="let player of players" (click)="openPlayer(player)">
            <img *ngIf="photo(player.profileImage)" [src]="photo(player.profileImage)" alt="" />
            <div *ngIf="!photo(player.profileImage)" class="sp-avatar">👤</div>
            <div class="sp-copy">
              <strong>{{ player.name }}</strong>
              <small>{{ player.city || 'Player' }} · {{ sportsLabel(player) }}</small>
            </div>
            <ion-icon name="chevron-forward"></ion-icon>
          </button>
        </div>

        <div class="sp-list" *ngIf="tab === 'coaches'">
          <button type="button" class="sp-row" *ngFor="let coach of coaches" (click)="openCoach(coach)">
            <img *ngIf="photo(coach.profileImage)" [src]="photo(coach.profileImage)" alt="" />
            <div *ngIf="!photo(coach.profileImage)" class="sp-avatar">🎓</div>
            <div class="sp-copy">
              <strong>{{ coach.name }}</strong>
              <small>{{ coach.city || 'Coach' }} · {{ sportsLabel(coach) }}</small>
            </div>
            <ion-icon name="chevron-forward"></ion-icon>
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .search-page { min-height: 100%; background: #fafbfc; padding-bottom: 120px; }
    .sp-header {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: calc(52px + env(safe-area-inset-top, 0px)) 16px 12px;
      background: #fff;
    }
    .sp-back {
      width: 40px; height: 40px; border: none; border-radius: 50%;
      background: #f3f4f6; display: grid; place-items: center; font-size: 18px;
    }
    .sp-input-wrap {
      flex: 1; display: flex; align-items: center; gap: 8px;
      background: #f3f4f6; border-radius: 16px; padding: 0 14px; height: 48px;
    }
    .sp-input-wrap ion-icon { color: #9ca3af; font-size: 18px; }
    .sp-input-wrap input {
      flex: 1; border: none; background: transparent; outline: none;
      font-size: 14px; font-weight: 600; color: #111827; min-height: unset;
    }
    .sp-tabs {
      display: flex; gap: 8px; padding: 12px 16px 8px; background: #fff;
      border-bottom: 1px solid #f3f4f6;
    }
    .sp-tab {
      border: none; border-radius: 999px; padding: 8px 14px;
      font-size: 13px; font-weight: 800; color: #6b7280; background: #f3f4f6;
    }
    .sp-tab.is-active {
      background: #111827; color: #fff;
    }
    .sp-tab span {
      margin-left: 6px; font-size: 11px; opacity: 0.75;
    }
    .sp-hint { margin: 20px 20px 0; color: #9ca3af; font-size: 13px; font-weight: 600; }
    .sp-list { padding: 8px 16px 0; display: flex; flex-direction: column; gap: 8px; }
    .sp-row {
      width: 100%; display: flex; align-items: center; gap: 12px; text-align: left;
      background: #fff; border: 1px solid #f3f4f6; border-radius: 18px; padding: 12px;
    }
    .sp-row img, .sp-avatar {
      width: 48px; height: 48px; border-radius: 14px; object-fit: cover; flex-shrink: 0;
    }
    .sp-avatar { display: grid; place-items: center; background: #f3f4f6; font-size: 22px; }
    .sp-copy { flex: 1; min-width: 0; }
    .sp-copy strong { display: block; font-size: 14px; color: #111827; }
    .sp-copy small { display: block; margin-top: 2px; color: #9ca3af; font-size: 12px; }
    .sp-row ion-icon { color: #d1d5db; font-size: 16px; }
  `],
})
export class SearchPage implements AfterViewInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly bookingService = inject(BookingService);

  @ViewChild('queryInput') queryInput?: ElementRef<HTMLInputElement>;

  query = '';
  tab: SearchTab = 'venues';
  loading = false;
  venues: SearchVenue[] = [];
  players: DiscoverPlayer[] = [];
  coaches: DiscoverPlayer[] = [];

  private timer?: ReturnType<typeof setTimeout>;
  private requestId = 0;

  ngAfterViewInit(): void {
    setTimeout(() => this.queryInput?.nativeElement.focus(), 80);
  }

  ngOnDestroy(): void {
    if (this.timer) clearTimeout(this.timer);
  }

  get visibleCount(): number {
    if (this.tab === 'venues') return this.venues.length;
    if (this.tab === 'players') return this.players.length;
    return this.coaches.length;
  }

  onQueryChange(value: string): void {
    this.query = value ?? '';
    if (this.timer) clearTimeout(this.timer);
    const needle = this.query.trim();
    if (needle.length < 2) {
      this.venues = [];
      this.players = [];
      this.coaches = [];
      this.loading = false;
      return;
    }
    this.loading = true;
    this.timer = setTimeout(() => void this.runSearch(needle), 280);
  }

  back(): void {
    void this.router.navigateByUrl('/app/home');
  }

  openVenue(venue: SearchVenue): void {
    void this.router.navigateByUrl(`/app/venue/${venue.id}`);
  }

  openPlayer(player: DiscoverPlayer): void {
    void this.router.navigateByUrl(`/app/player/${player.id}`, { state: { player } });
  }

  openCoach(coach: DiscoverPlayer): void {
    void this.router.navigateByUrl(`/app/coaches/${coach.id}`);
  }

  photo(url?: string | null): string | null {
    return resolveMediaUrl(url);
  }

  sportsLabel(person: DiscoverPlayer): string {
    const sports = person.sports || person.preferredSports || [];
    return sports.slice(0, 2).join(', ') || person.skillLevel || 'Sports';
  }

  private async runSearch(needle: string): Promise<void> {
    const id = ++this.requestId;
    try {
      const response = await firstValueFrom(this.bookingService.search(needle, 20));
      if (id !== this.requestId) return;
      this.venues = response.data?.venues || [];
      this.players = response.data?.players || [];
      this.coaches = response.data?.coaches || [];
    } catch {
      if (id !== this.requestId) return;
      this.venues = [];
      this.players = [];
      this.coaches = [];
    } finally {
      if (id === this.requestId) this.loading = false;
    }
  }
}
