import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CoachService } from '../../core/services/coach.service';

interface CoachVenueCourt {
  id: number;
  name: string;
  sport: string;
  pricePerHour: number;
  maxPlayers: number;
  isIndoor: boolean;
  image: string;
}

export interface CoachVenue {
  id: number;
  name: string;
  address: string;
  city: string;
  rating: number;
  sports: string[];
  image: string;
  amenities: string[];
  rentalEquipment: any[];
  openTime: string;
  closeTime: string;
  isOpenNow: boolean;
  autoConfirm: boolean;
  courts: CoachVenueCourt[];
  minPrice: number;
  maxCapacity: number;
  hasIndoor: boolean;
  hasOutdoor: boolean;
}

@Component({
  selector: 'app-coach-book-venue',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true" class="page-shell">
      <main class="venue-page">
        <header class="topbar">
          <button type="button" (click)="back()" aria-label="Back"><ion-icon name="chevron-back-outline"></ion-icon></button>
          <h1>Book Venue</h1>
          <div class="header-actions">
            <button type="button" (click)="searchOpen.set(!searchOpen())" aria-label="Search venues"><ion-icon [name]="searchOpen() ? 'close-outline' : 'search-outline'"></ion-icon></button>
            <button type="button" [class.active]="filtersOpen()" (click)="filtersOpen.set(!filtersOpen())" aria-label="Venue filters"><ion-icon name="options-outline"></ion-icon></button>
          </div>
        </header>

        <section *ngIf="searchOpen()" class="search-wrap">
          <label class="search-box">
            <ion-icon name="search-outline"></ion-icon>
            <input [ngModel]="searchQ()" (ngModelChange)="searchQ.set($event)" placeholder="Search venue, sport, court or area" autocomplete="off" />
            <button *ngIf="searchQ()" type="button" (click)="searchQ.set('')" aria-label="Clear search"><ion-icon name="close-circle"></ion-icon></button>
          </label>
        </section>

        <section class="chips" aria-label="Venue filters">
          <button *ngFor="let filter of primaryFilters()" type="button" [class.selected]="selectedFilter() === filter" (click)="selectFilter(filter)">{{ filter }}</button>
        </section>
        <section *ngIf="filtersOpen()" class="more-filters">
          <div><strong>More filters</strong><button type="button" (click)="clearFilters()">Clear</button></div>
          <section class="chips inner">
            <button *ngFor="let filter of secondaryFilters()" type="button" [class.selected]="selectedFilter() === filter" (click)="selectFilter(filter)">{{ filter }}</button>
          </section>
        </section>

        <div class="content">
          <div class="results-title">
            <span>{{ loading() ? 'Loading approved venues…' : filteredVenues().length + ' approved venue' + (filteredVenues().length === 1 ? '' : 's') }}</span>
            <button *ngIf="selectedFilter() !== 'All' || searchQ()" type="button" (click)="clearFilters()">Reset</button>
          </div>

          <div *ngIf="loading()" class="state"><ion-spinner name="crescent"></ion-spinner><p>Finding bookable venues…</p></div>
          <div *ngIf="!loading() && error()" class="state error">
            <ion-icon name="cloud-offline-outline"></ion-icon><strong>Venues could not be loaded</strong><p>{{ error() }}</p><button type="button" (click)="load()">Try again</button>
          </div>
          <div *ngIf="!loading() && !error() && !filteredVenues().length" class="state">
            <ion-icon name="location-outline"></ion-icon><strong>No matching venues</strong><p>Try another search or remove a filter.</p><button type="button" (click)="clearFilters()">Show all venues</button>
          </div>

          <section *ngIf="!loading() && !error()" class="venue-list">
            <article *ngFor="let venue of filteredVenues(); trackBy: trackVenue" class="venue-card">
              <button type="button" class="venue-cover" (click)="bookVenue(venue)" [attr.aria-label]="'Book ' + venue.name">
                <img [src]="venue.image || fallbackImage" alt="" />
                <span class="shade"></span>
                <span *ngIf="venue.isOpenNow" class="open-badge">Open now</span>
                <span class="price"><b>{{ venue.minPrice ? ('₹' + (venue.minPrice | number:'1.0-0')) : 'Ask venue' }}</b><small>{{ venue.minPrice ? 'per hour' : 'for pricing' }}</small></span>
                <span class="venue-name"><b>{{ venue.name }}</b><small>{{ venue.sports.join(' · ') || 'Multi-sport venue' }}</small></span>
              </button>
              <div class="venue-info">
                <div class="meta">
                  <span *ngIf="venue.rating"><ion-icon name="star"></ion-icon>{{ venue.rating | number:'1.1-1' }}</span>
                  <span><ion-icon name="location-outline"></ion-icon>{{ venue.address || venue.city || 'Address not provided' }}</span>
                </div>
                <div class="amenities" *ngIf="venue.amenities.length">
                  <span *ngFor="let amenity of venue.amenities.slice(0,4)">{{ amenity }}</span><span *ngIf="venue.amenities.length > 4">+{{ venue.amenities.length - 4 }}</span>
                </div>
                <div class="booking-row">
                  <span class="hours"><ion-icon name="time-outline"></ion-icon><b>{{ venue.openTime || 'Hours unavailable' }}<ng-container *ngIf="venue.closeTime"> – {{ venue.closeTime }}</ng-container></b><small>Choose a court, date and available time</small></span>
                  <button type="button" (click)="bookVenue(venue)">Book venue<ion-icon name="chevron-forward-outline"></ion-icon></button>
                </div>
              </div>
            </article>
          </section>

          <section *ngIf="upcoming().length" class="upcoming">
            <div class="section-title"><div><h2>Upcoming reservations</h2><p>Your coaching venue requests</p></div><button type="button" (click)="go('/app/coach/schedule')">View all</button></div>
            <article *ngFor="let session of upcoming().slice(0,3)">
              <span class="calendar-icon"><ion-icon name="calendar-outline"></ion-icon></span>
              <div><b>{{ session.venue || 'Venue session' }}</b><span>{{ session.starts_at | date:'EEE, d MMM · h:mm a' }} · {{ session.court || 'Court' }}</span></div>
              <i [class.pending]="session.status === 'pending_venue_approval'">{{ session.status === 'pending_venue_approval' ? 'Pending' : 'Confirmed' }}</i>
            </article>
          </section>
        </div>
      </main>
    </ion-content>
  `,
  styles: [`
    :host{display:block;--lime:var(--app-primary,#7cf000);--ink:#101828;--muted:#667085;--line:#e8ecf0}.page-shell{--background:#f7f9fb}.venue-page{min-height:100%;padding-bottom:calc(30px + env(safe-area-inset-bottom));color:var(--ink);background:#f7f9fb}.topbar{position:sticky;top:0;z-index:30;height:calc(58px + env(safe-area-inset-top));padding:env(safe-area-inset-top) 14px 0;display:grid;grid-template-columns:80px 1fr 80px;align-items:center;border-bottom:1px solid var(--line);background:rgba(255,255,255,.96);backdrop-filter:blur(14px)}.topbar>button,.header-actions button{width:38px;height:38px;padding:0;border:0;border-radius:13px;display:grid;place-items:center;color:var(--ink);background:#f2f4f7;font-size:19px}.topbar h1{margin:0;text-align:center;font-size:17px;font-weight:850}.header-actions{display:flex;justify-content:flex-end;gap:5px}.header-actions button.active{color:#315200;background:#eaffd3}.search-wrap{position:sticky;top:calc(58px + env(safe-area-inset-top));z-index:29;padding:10px 14px 4px;background:rgba(255,255,255,.96)}.search-box{height:47px;padding:0 13px;border:1px solid var(--line);border-radius:15px;display:flex;align-items:center;gap:9px;background:#f8fafb}.search-box>ion-icon{color:#98a2b3}.search-box input{min-width:0;flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:12px}.search-box button{padding:0;border:0;color:#98a2b3;background:transparent;font-size:18px}.chips{padding:9px 14px;display:flex;gap:7px;overflow-x:auto;background:#fff;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}.chips button{height:34px;padding:0 13px;flex:0 0 auto;border:1px solid transparent;border-radius:999px;color:#667085;background:#f2f4f7;font:inherit;font-size:10.5px;font-weight:750}.chips button.selected{border-color:#75df0d;color:#1c3000;background:var(--lime)}.more-filters{padding:11px 14px 5px;border-top:1px solid #f2f4f7;background:#fff}.more-filters>div{display:flex;justify-content:space-between}.more-filters strong{font-size:11px}.more-filters>div button,.results-title button,.section-title button{border:0;color:#4f9900;background:transparent;font-size:10px;font-weight:800}.chips.inner{padding:8px 0 5px;flex-wrap:wrap}.content{width:min(100%,460px);margin:0 auto;padding:14px;box-sizing:border-box}.results-title{margin:0 3px 11px;display:flex;justify-content:space-between;color:#667085;font-size:11px;font-weight:750}.state{min-height:280px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;color:var(--muted)}.state>ion-icon{color:#6bd20a;font-size:38px}.state ion-spinner{color:var(--lime)}.state strong{color:var(--ink);font-size:15px}.state p{max-width:280px;margin:0;font-size:11px;line-height:1.45}.state button{margin-top:4px;padding:10px 15px;border:0;border-radius:12px;background:var(--lime);font-weight:800}.state.error>ion-icon{color:#f04438}.venue-list{display:grid;gap:14px}.venue-card{overflow:hidden;border:1px solid var(--line);border-radius:22px;background:#fff;box-shadow:0 5px 18px rgba(16,24,40,.045)}.venue-cover{position:relative;width:100%;height:164px;padding:0;border:0;display:block;overflow:hidden;background:#e8ecf0;text-align:left}.venue-cover img{width:100%;height:100%;object-fit:cover}.shade{position:absolute;inset:0;background:linear-gradient(180deg,rgba(0,0,0,.02) 35%,rgba(0,0,0,.72))}.open-badge{position:absolute;top:11px;left:11px;padding:5px 9px;border-radius:999px;color:#1f3200;background:var(--lime);font-size:9px;font-weight:850}.price{position:absolute;top:10px;right:10px;min-width:62px;padding:8px;border-radius:12px;display:grid;gap:2px;background:rgba(255,255,255,.95);text-align:center}.price b{font-size:11px}.price small{color:#98a2b3;font-size:7.5px}.venue-name{position:absolute;right:13px;bottom:12px;left:13px;display:grid;gap:4px;color:#fff}.venue-name b{font-size:15px}.venue-name small{font-size:9px;opacity:.78}.venue-info{padding:12px}.meta{display:flex;align-items:center;gap:10px}.meta span{min-width:0;display:flex;align-items:center;gap:4px;color:#667085;font-size:9.5px}.meta span:last-child{overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.meta ion-icon{flex:0 0 auto;color:#98a2b3}.meta span:first-child ion-icon{color:#f79009}.amenities{margin-top:10px;display:flex;gap:5px;overflow:hidden}.amenities span{padding:5px 7px;flex:0 0 auto;border-radius:999px;color:#667085;background:#f2f4f7;font-size:8px;font-weight:700}.booking-row{margin-top:11px;padding-top:11px;border-top:1px solid #f1f3f5;display:flex;align-items:center;gap:10px}.hours{min-width:0;flex:1;display:grid;grid-template-columns:15px 1fr;column-gap:4px}.hours ion-icon{grid-row:1/3;color:#98a2b3}.hours b{overflow:hidden;color:#475467;font-size:9.5px;text-overflow:ellipsis;white-space:nowrap}.hours small{margin-top:2px;color:#98a2b3;font-size:7.5px}.booking-row>button{height:38px;padding:0 13px;border:0;border-radius:13px;display:flex;align-items:center;gap:4px;color:#193000;background:var(--lime);font-size:10px;font-weight:850}.upcoming{margin-top:24px}.section-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:9px}.section-title h2{margin:0;font-size:14px}.section-title p{margin:2px 0 0;color:#98a2b3;font-size:9px}.upcoming article{margin-bottom:8px;padding:11px;border:1px solid var(--line);border-radius:16px;display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:10px;align-items:center;background:#fff}.calendar-icon{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;color:#4d9600;background:#efffdc}.upcoming article div{min-width:0;display:grid;gap:3px}.upcoming article b,.upcoming article span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.upcoming article b{font-size:11px}.upcoming article div span{color:#667085;font-size:8.5px}.upcoming i{padding:4px 7px;border-radius:999px;color:#067647;background:#ecfdf3;font-size:7.5px;font-style:normal;font-weight:800}.upcoming i.pending{color:#b54708;background:#fffaeb}@media(min-width:700px){.topbar{grid-template-columns:80px minmax(0,300px) 80px;justify-content:center}}
  `],
})
export class CoachBookVenuePage implements OnInit {
  private readonly router = inject(Router);
  private readonly coach = inject(CoachService);
  readonly fallbackImage = 'assets/icon/favicon.png';
  readonly loading = signal(true);
  readonly error = signal('');
  readonly venues = signal<CoachVenue[]>([]);
  readonly upcoming = signal<any[]>([]);
  readonly searchOpen = signal(false);
  readonly filtersOpen = signal(false);
  readonly searchQ = signal('');
  readonly selectedFilter = signal('All');

  readonly primaryFilters = computed(() => ['All', ...this.sports().slice(0, 4)]);
  readonly secondaryFilters = computed(() => ['Open now', 'Price: Low', 'Indoor', 'Outdoor', ...this.sports().slice(4), ...this.amenities().slice(0, 5)]);
  readonly sports = computed(() => [...new Set(this.venues().reduce<string[]>((items, venue) => items.concat(venue.sports), []))].sort());
  readonly amenities = computed(() => [...new Set(this.venues().reduce<string[]>((items, venue) => items.concat(venue.amenities), []))].sort());
  readonly filteredVenues = computed(() => {
    const query = this.searchQ().trim().toLowerCase();
    const filter = this.selectedFilter();
    let rows = this.venues().filter(venue => !query || [venue.name, venue.address, venue.city, ...venue.sports, ...venue.courts.map(court => court.name)].join(' ').toLowerCase().includes(query));
    if (filter === 'Open now') rows = rows.filter(venue => venue.isOpenNow);
    else if (filter === 'Indoor') rows = rows.filter(venue => venue.hasIndoor);
    else if (filter === 'Outdoor') rows = rows.filter(venue => venue.hasOutdoor);
    else if (filter === 'Price: Low') rows = [...rows].sort((a, b) => (a.minPrice || Number.MAX_SAFE_INTEGER) - (b.minPrice || Number.MAX_SAFE_INTEGER));
    else if (this.sports().includes(filter)) rows = rows.filter(venue => venue.sports.includes(filter));
    else if (this.amenities().includes(filter)) rows = rows.filter(venue => venue.amenities.includes(filter));
    return rows;
  });

  ngOnInit(): void { void this.load(); }

  async load(): Promise<void> {
    this.loading.set(true); this.error.set('');
    try {
      const [venuesResponse, sessionsResponse] = await Promise.all([
        firstValueFrom(this.coach.getSchedulingVenues()),
        firstValueFrom(this.coach.getSchedulingSessions(new Date().toISOString().slice(0, 10))),
      ]);
      const rows = Array.isArray(venuesResponse.data) ? venuesResponse.data : [];
      this.venues.set(rows.map(item => this.mapVenue(item)).filter(venue => venue.courts.length > 0));
      this.upcoming.set(Array.isArray(sessionsResponse.data) ? sessionsResponse.data.filter((item: any) => ['confirmed', 'pending_venue_approval'].includes(item.status)) : []);
    } catch (error: any) {
      this.error.set(error?.error?.message || 'Check your connection and try again.');
    } finally { this.loading.set(false); }
  }

  private mapVenue(item: any): CoachVenue {
    const courts: CoachVenueCourt[] = (Array.isArray(item.courts) ? item.courts : []).map((court: any) => ({
      id: Number(court.id), name: String(court.name || 'Court'), sport: this.titleCase(court.sport || 'Sport'),
      pricePerHour: Number(court.price_per_hour || 0), maxPlayers: Number(court.max_players || 1),
      isIndoor: !!court.is_indoor, image: String(court.image || ''),
    }));
    return {
      id: Number(item.id), name: String(item.name || 'Venue'), address: String(item.location || ''), city: String(item.city || ''),
      rating: Number(item.rating || 0), sports: (Array.isArray(item.sports) ? item.sports : courts.map(court => court.sport)).map((sport: any) => this.titleCase(sport)),
      image: String(item.image || courts.find(court => court.image)?.image || ''), amenities: Array.isArray(item.amenities) ? item.amenities.map(String) : [],
      rentalEquipment: Array.isArray(item.rental_equipment) ? item.rental_equipment : [], openTime: String(item.open_time || ''), closeTime: String(item.close_time || ''),
      isOpenNow: !!item.is_open_now, autoConfirm: !!item.auto_confirm, courts,
      minPrice: courts.length ? Math.min(...courts.map(court => court.pricePerHour)) : 0,
      maxCapacity: courts.length ? Math.max(...courts.map(court => court.maxPlayers || 1)) : 1,
      hasIndoor: courts.some(court => court.isIndoor), hasOutdoor: courts.some(court => !court.isIndoor),
    };
  }

  selectFilter(filter: string): void { this.selectedFilter.set(filter); }
  clearFilters(): void { this.selectedFilter.set('All'); this.searchQ.set(''); }
  trackVenue(_index: number, venue: CoachVenue): number { return venue.id; }
  bookVenue(venue: CoachVenue): void { void this.router.navigate(['/app/coach/venue-booking'], { queryParams: { venue: venue.id }, state: { venue } }); }
  titleCase(value: unknown): string { return String(value || '').replace(/[-_]/g, ' ').replace(/\b\w/g, char => char.toUpperCase()); }
  back(): void { void this.router.navigateByUrl('/app/coach/dashboard'); }
  go(path: string): void { void this.router.navigateByUrl(path); }
}
