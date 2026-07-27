import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { Subject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingRecord } from '../models/api.model';
import { ApiService } from './api.service';

export type NearbyGameRealtimeEvent =
  | { type: 'created'; game: BookingRecord }
  | { type: 'updated'; action: string; game: BookingRecord };

interface RealtimeConfig {
  enabled: boolean;
  key: string;
  host: string;
  port: number;
  scheme: string;
  channel: string;
  events: {
    created: string;
    updated: string;
  };
}

declare global {
  interface Window {
    Pusher: typeof Pusher;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Echo?: any;
  }
}

/**
 * Laravel Reverb / Echo client for live nearby-game updates.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly zone = inject(NgZone);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private echo: any = null;
  private connecting: Promise<void> | null = null;
  private channelName = 'nearby-games';
  private readonly nearbyGameSubject = new Subject<NearbyGameRealtimeEvent>();

  readonly nearbyGames$ = this.nearbyGameSubject.asObservable();

  async connect(): Promise<void> {
    if (this.echo) return;
    if (this.connecting) return this.connecting;

    this.connecting = this.bootstrap().finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  disconnect(): void {
    try {
      this.echo?.disconnect();
    } catch {
      // ignore
    }
    this.echo = null;
    if (typeof window !== 'undefined') {
      delete window.Echo;
    }
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.nearbyGameSubject.complete();
  }

  private async bootstrap(): Promise<void> {
    const config = await this.resolveConfig();
    if (!config.enabled || !config.key) {
      console.info('[realtime] Reverb disabled or missing key — skipping live nearby games.');
      return;
    }

    window.Pusher = Pusher;
    const forceTLS = config.scheme === 'https';
    const port = config.port || (forceTLS ? 443 : 8080);

    this.channelName = config.channel || 'nearby-games';
    this.echo = new Echo({
      broadcaster: 'reverb',
      key: config.key,
      wsHost: config.host,
      wsPort: port,
      wssPort: port,
      forceTLS,
      enabledTransports: ['ws', 'wss'],
      disableStats: true,
      authEndpoint: `${this.api.baseUrl}/broadcasting/auth`,
      auth: {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('tyng_auth_token') || ''}`,
          Accept: 'application/json',
        },
      },
    });

    window.Echo = this.echo;

    const createdEvent = config.events?.created || 'game.created';
    const updatedEvent = config.events?.updated || 'game.updated';

    this.echo
      .channel(this.channelName)
      .listen(`.${createdEvent}`, (payload: { game?: BookingRecord }) => {
        if (!payload?.game?.id) return;
        this.zone.run(() => {
          this.nearbyGameSubject.next({ type: 'created', game: payload.game! });
        });
      })
      .listen(`.${updatedEvent}`, (payload: { action?: string; game?: BookingRecord }) => {
        if (!payload?.game?.id) return;
        this.zone.run(() => {
          this.nearbyGameSubject.next({
            type: 'updated',
            action: payload.action || 'updated',
            game: payload.game!,
          });
        });
      });
  }

  private async resolveConfig(): Promise<RealtimeConfig> {
    const fallback: RealtimeConfig = {
      enabled: !!environment.reverb?.enabled,
      key: environment.reverb?.key || '',
      host: environment.reverb?.host || '127.0.0.1',
      port: environment.reverb?.port || 8080,
      scheme: environment.reverb?.scheme || 'http',
      channel: environment.reverb?.channel || 'nearby-games',
      events: {
        created: 'game.created',
        updated: 'game.updated',
      },
    };

    try {
      const response = await firstValueFrom(this.api.get<RealtimeConfig>('/realtime/config'));
      if (response.success && response.data) {
        return {
          ...fallback,
          ...response.data,
          events: {
            ...fallback.events,
            ...(response.data.events || {}),
          },
        };
      }
    } catch (error) {
      console.warn('[realtime] Unable to load /realtime/config, using environment fallback', error);
    }

    return fallback;
  }
}
