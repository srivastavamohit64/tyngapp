import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import {
  Database,
  DataSnapshot,
  getDatabase,
  off,
  onChildAdded,
  onChildChanged,
  ref,
} from 'firebase/database';
import { Subject, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { BookingRecord } from '../models/api.model';
import { ApiService } from './api.service';

export type NearbyGameRealtimeEvent =
  | { type: 'created'; game: BookingRecord }
  | { type: 'updated'; action: string; game: BookingRecord };

interface FirebaseRealtimeConfig {
  enabled: boolean;
  driver?: string;
  apiKey: string;
  authDomain?: string;
  databaseURL: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  path: string;
  channel?: string;
  events?: {
    created: string;
    updated: string;
  };
}

/**
 * Firebase Realtime Database client for live nearby-game updates.
 * Replaces Laravel Echo / Reverb.
 */
@Injectable({ providedIn: 'root' })
export class RealtimeService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly zone = inject(NgZone);

  private connecting: Promise<void> | null = null;
  private db: Database | null = null;
  private pathRef: ReturnType<typeof ref> | null = null;
  private readonly nearbyGameSubject = new Subject<NearbyGameRealtimeEvent>();
  private readonly seenInitial = new Set<string>();
  private readonly recentEventKeys = new Map<string, number>();
  private startedListeningAt = 0;

  readonly nearbyGames$ = this.nearbyGameSubject.asObservable();

  async connect(): Promise<void> {
    if (this.db && this.pathRef) return;
    if (this.connecting) return this.connecting;

    this.connecting = this.bootstrap().finally(() => {
      this.connecting = null;
    });
    return this.connecting;
  }

  disconnect(): void {
    if (this.pathRef) {
      off(this.pathRef);
      this.pathRef = null;
    }
    this.db = null;
    this.seenInitial.clear();
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.nearbyGameSubject.complete();
  }

  private async bootstrap(): Promise<void> {
    const config = await this.resolveConfig();
    if (!config.enabled || !config.databaseURL || !config.apiKey || !config.projectId) {
      console.info('[realtime] Firebase RTDB disabled or missing config — skipping live nearby games.');
      return;
    }

    const app = this.ensureApp(config);
    this.db = getDatabase(app);
    const path = (config.path || 'realtime/nearby-games').replace(/^\/+|\/+$/g, '');
    this.pathRef = ref(this.db, path);
    this.startedListeningAt = Date.now();

    const emitFromSnapshot = (snapshot: DataSnapshot, forceType?: 'created' | 'updated') => {
      const value = snapshot.val() as {
        type?: string;
        action?: string;
        game?: BookingRecord;
        updatedAt?: number;
      } | null;

      if (!value?.game?.id) return;

      // Ignore the initial dump of existing nodes when first connecting.
      const updatedAt = Number(value.updatedAt || 0);
      const key = String(snapshot.key || value.game.id);
      if (!forceType && !this.seenInitial.has(key) && updatedAt > 0 && updatedAt < this.startedListeningAt - 2000) {
        this.seenInitial.add(key);
        return;
      }
      this.seenInitial.add(key);

      const type = (forceType || value.type || 'updated') === 'created' ? 'created' : 'updated';
      const dedupeKey = `${key}:${type}:${value.action || ''}:${updatedAt || 0}`;
      const now = Date.now();
      const last = this.recentEventKeys.get(dedupeKey) || 0;
      if (now - last < 1500) {
        return;
      }
      this.recentEventKeys.set(dedupeKey, now);

      this.zone.run(() => {
        if (type === 'created') {
          this.nearbyGameSubject.next({ type: 'created', game: value.game! });
        } else {
          this.nearbyGameSubject.next({
            type: 'updated',
            action: value.action || 'updated',
            game: value.game!,
          });
        }
      });
    };

    onChildAdded(this.pathRef, (snapshot) => {
      // Fresh nodes created after connect → treat as created when payload says so.
      emitFromSnapshot(snapshot);
    });

    onChildChanged(this.pathRef, (snapshot) => {
      emitFromSnapshot(snapshot, 'updated');
    });

    console.info('[realtime] Firebase RTDB listening on', path);
  }

  private ensureApp(config: FirebaseRealtimeConfig): FirebaseApp {
    if (getApps().length) {
      return getApp();
    }

    return initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain || `${config.projectId}.firebaseapp.com`,
      databaseURL: config.databaseURL,
      projectId: config.projectId,
      storageBucket: config.storageBucket || `${config.projectId}.firebasestorage.app`,
      messagingSenderId: config.messagingSenderId || undefined,
      appId: config.appId || undefined,
    });
  }

  private async resolveConfig(): Promise<FirebaseRealtimeConfig> {
    const fb = environment.firebase || {};
    const fallback: FirebaseRealtimeConfig = {
      enabled: fb.enabled !== false,
      apiKey: fb.apiKey || '',
      authDomain: fb.authDomain || '',
      databaseURL: fb.databaseURL || '',
      projectId: fb.projectId || '',
      storageBucket: fb.storageBucket || '',
      messagingSenderId: fb.messagingSenderId || '',
      appId: fb.appId || '',
      path: fb.path || 'realtime/nearby-games',
    };

    try {
      const response = await firstValueFrom(this.api.get<FirebaseRealtimeConfig>('/realtime/config'));
      if (response.success && response.data) {
        return {
          ...fallback,
          ...response.data,
          // Prefer non-empty server values, keep local fallbacks for blanks.
          apiKey: response.data.apiKey || fallback.apiKey,
          databaseURL: response.data.databaseURL || fallback.databaseURL,
          projectId: response.data.projectId || fallback.projectId,
          path: response.data.path || fallback.path,
        };
      }
    } catch (error) {
      console.warn('[realtime] Unable to load /realtime/config, using environment fallback', error);
    }

    return fallback;
  }
}
