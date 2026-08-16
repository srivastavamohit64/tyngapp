import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Database, DataSnapshot, getDatabase, off, onValue, ref } from 'firebase/database';
import { environment } from '../../../environments/environment';
import { BookingSession, BookingSessionAttendance, BookingSessionEvent } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class SessionRealtimeService implements OnDestroy {
  private readonly zone = inject(NgZone);
  private db: Database | null = null;
  private sessionRef: ReturnType<typeof ref> | null = null;

  async listen(
    bookingId: string,
    onUpdate: (session: Partial<BookingSession>) => void,
  ): Promise<() => void> {
    this.stop();
    await this.ensureDb();
    if (!this.db) return () => undefined;

    this.sessionRef = ref(this.db, `sessions/${bookingId}`);
    onValue(this.sessionRef, (snap: DataSnapshot) => {
      const val = snap.val() as {
        meta?: BookingSession;
        attendance?: Record<string, BookingSessionAttendance>;
        timeline?: Record<string, BookingSessionEvent>;
      } | null;
      if (!val) return;
      const attendance = val.attendance ? Object.values(val.attendance) : [];
      const timeline = val.timeline
        ? Object.values(val.timeline).sort((a, b) => Date.parse(b.at || '') - Date.parse(a.at || ''))
        : [];
      this.zone.run(() =>
        onUpdate({
          ...(val.meta || {}),
          attendance,
          timeline,
          checkedIn: attendance.filter((r) => r.status === 'checked_in' || r.status === 'late').length,
          totalPlayers: attendance.length || Number(val.meta?.totalPlayers || 0),
        }),
      );
    });

    return () => this.stop();
  }

  stop(): void {
    if (this.sessionRef) {
      off(this.sessionRef);
      this.sessionRef = null;
    }
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private async ensureDb(): Promise<void> {
    if (this.db) return;
    const app = this.ensureApp();
    this.db = getDatabase(app);
  }

  private ensureApp(): FirebaseApp {
    if (getApps().length) return getApp();
    const fb = environment.firebase || ({} as typeof environment.firebase);
    return initializeApp({
      apiKey: fb.apiKey,
      authDomain: fb.authDomain,
      databaseURL: fb.databaseURL,
      projectId: fb.projectId,
      storageBucket: fb.storageBucket,
      messagingSenderId: fb.messagingSenderId,
      appId: fb.appId || undefined,
    });
  }
}
