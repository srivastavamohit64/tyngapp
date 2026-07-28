import { Injectable, inject, signal, computed, OnDestroy } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { filter } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { RealtimeService } from './realtime.service';

export interface TabBadges {
  bookings: number;
  chat: number;
  notifications?: number;
}

@Injectable({ providedIn: 'root' })
export class TabBadgeService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly realtime = inject(RealtimeService);
  private readonly router = inject(Router);

  private readonly badges = signal<TabBadges>({ bookings: 0, chat: 0 });
  private realtimeSub: Subscription | null = null;
  private navSub: Subscription | null = null;
  private started = false;

  readonly bookingsBadge = computed(() => this.badges().bookings);
  readonly chatBadge = computed(() => this.badges().chat);

  start(): void {
    if (this.started) return;
    this.started = true;

    void this.refresh();
    void this.bindRealtime();

    this.navSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe((e) => {
        const path = (e.urlAfterRedirects || '').split('?')[0];
        void this.handleRoute(path);
      });
  }

  stop(): void {
    this.realtimeSub?.unsubscribe();
    this.navSub?.unsubscribe();
    this.realtimeSub = null;
    this.navSub = null;
    this.started = false;
    this.badges.set({ bookings: 0, chat: 0 });
  }

  ngOnDestroy(): void {
    this.stop();
  }

  async refresh(): Promise<void> {
    if (!this.auth.user() || !this.auth.getToken()) {
      this.badges.set({ bookings: 0, chat: 0 });
      return;
    }

    try {
      const res = await firstValueFrom(this.api.get<TabBadges>('/notifications/badges'));
      if (res.success && res.data) {
        this.badges.set({
          bookings: Number(res.data.bookings || 0),
          chat: Number(res.data.chat || 0),
        });
      }
    } catch {
      // ignore — badges are best-effort
    }
  }

  async markBookingsSeen(): Promise<void> {
    const role = this.auth.user()?.role;
    // Venue bubble is driven by pending bookings count — don't zero it here.
    if (role === 'venue') {
      await this.refresh();
      return;
    }

    try {
      const res = await firstValueFrom(this.api.post<TabBadges>('/notifications/bookings/seen', {}));
      if (res.success && res.data) {
        this.badges.set({
          bookings: Number(res.data.bookings || 0),
          chat: Number(res.data.chat || 0),
        });
      } else {
        this.badges.update((b) => ({ ...b, bookings: 0 }));
      }
    } catch {
      this.badges.update((b) => ({ ...b, bookings: 0 }));
    }
  }

  bumpBookings(delta = 1): void {
    this.badges.update((b) => ({
      ...b,
      bookings: Math.max(0, Number(b.bookings || 0) + delta),
    }));
  }

  private async bindRealtime(): Promise<void> {
    try {
      await this.realtime.connect();
      this.realtimeSub = this.realtime.nearbyGames$.subscribe((event) => {
        const user = this.auth.user();
        if (!user?.id) return;
        const game = event.game;
        const userId = String(user.id);
        const venueId = String(game.venueId || game.venue?.id || '');
        const hostId = String(game.hostUserId || '');

        // Always refresh from API — never optimistic +1 (that double-counted
        // when Firebase emitted create and the badge already had the pending).
        if (user.role === 'venue' && venueId === userId) {
          void this.refresh();
          return;
        }

        if (user.role !== 'venue' && (hostId === userId || this.isPlayerInGame(game, userId))) {
          if (
            event.type === 'created' ||
            (event.type === 'updated' &&
              ['approved', 'rejected', 'cancelled', 'joined', 'pending_approval'].includes(event.action))
          ) {
            void this.refresh();
          }
        }
      });
    } catch {
      // optional
    }
  }

  private isPlayerInGame(game: { acceptedPlayers?: { user?: { id?: string } }[] }, userId: string): boolean {
    return (game.acceptedPlayers || []).some((p) => String(p.user?.id || '') === userId);
  }

  private async handleRoute(path: string): Promise<void> {
    if (path.startsWith('/app/venue/bookings') || path.startsWith('/app/my-bookings')) {
      await this.markBookingsSeen();
    }
  }
}
