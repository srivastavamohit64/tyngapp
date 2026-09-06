import { Capacitor } from '@capacitor/core';
import { Injectable, Injector, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, map, of, tap, throwError } from 'rxjs';
import {
  AuthTokenResponse,
  AuthUser,
  ChangePasswordPayload,
  ForgotPasswordPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  UpdateProfilePayload,
} from '../models/api.model';
import { ApiService } from './api.service';
import { PushNotificationService } from './push-notification.service';
import { RealtimeService } from './realtime.service';
import { TabBadgeService } from './tab-badge.service';
import { ThemeService } from './theme.service';
import { resolveMediaUrl } from '../utils/media-url.util';

const TOKEN_KEY = 'tyng_auth_token';
const USER_KEY = 'tyng_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly injector = inject(Injector);

  readonly user = signal<AuthUser | null>(this.readCachedUser());
  readonly sessionReady = signal(false);

  register(payload: RegisterPayload): Observable<AuthUser> {
    return this.api.post<AuthTokenResponse>('/register', this.withDeviceFields(payload)).pipe(
      map((res) => this.persistAuth(res.data!)),
      catchError((err) => throwError(() => this.extractError(err))),
    );
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    return this.api.post<AuthTokenResponse>('/login', this.withDeviceFields(payload)).pipe(
      map((res) => this.persistAuth(res.data!)),
      catchError((err) => throwError(() => this.extractError(err))),
    );
  }

  logout(): Observable<void> {
    const clear = () => {
      try {
        this.injector.get(TabBadgeService).stop();
      } catch {
        // ignore
      }
      this.clearSession();
      void this.router.navigateByUrl('/welcome');
    };

    if (!this.getToken()) {
      clear();
      return of(undefined);
    }

    // Capture device fields, then start server cleanup while auth token is still present.
    let deviceToken: string | undefined;
    let deviceId: string | undefined;
    try {
      const push = this.injector.get(PushNotificationService);
      deviceToken = push.getCurrentToken() || undefined;
      deviceId = push.getDeviceId() || undefined;
      // Starts DELETE /device-token immediately (do not await).
      void push.unregister().catch(() => undefined);
    } catch {
      // ignore
    }

    // Fire logout API without waiting for response.
    this.api.post<null>('/logout', {
      device_token: deviceToken,
      device_id: deviceId,
    }).pipe(
      catchError(() => of(undefined)),
    ).subscribe();

    // Instant UX: clear local session + navigate right away.
    clear();
    return of(undefined);
  }

  fetchMe(): Observable<AuthUser> {
    return this.api.get<{ user: AuthUser }>('/me').pipe(
      map((res) => {
        const user = res.data!.user;
        this.setUser(user);
        return user;
      }),
      catchError((err) => throwError(() => this.extractError(err))),
    );
  }

  ensureSession(): Observable<boolean> {
    if (this.sessionReady()) {
      return of(!!this.user());
    }

    const token = this.getToken();
    if (!token) {
      this.sessionReady.set(true);
      return of(false);
    }

    return this.fetchMe().pipe(
      map(() => true),
      catchError(() => {
        this.clearSession();
        return of(false);
      }),
      tap(() => this.sessionReady.set(true)),
    );
  }

  completeOnboarding(data: UpdateProfilePayload): Observable<AuthUser> {
    return this.updateProfile({ ...data, isOnboarded: true });
  }

  updateProfile(data: UpdateProfilePayload, profileImage?: File): Observable<AuthUser> {
    if (profileImage) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value === undefined || value === null) return;
        if (Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (typeof value === 'boolean') {
          formData.append(key, value ? '1' : '0');
        } else {
          formData.append(String(key), String(value));
        }
      });
      formData.append('profile_image', profileImage, profileImage.name || `profile-${Date.now()}.jpg`);

      return this.api.putForm<{ user: AuthUser }>('/profile', formData).pipe(
        map((res) => {
          const user = res.data!.user;
          this.setUser(user);
          return user;
        }),
        catchError((err) => throwError(() => this.extractError(err))),
      );
    }

    return this.api.put<{ user: AuthUser }>('/profile', data).pipe(
      map((res) => {
        const user = res.data!.user;
        this.setUser(user);
        return user;
      }),
      catchError((err) => throwError(() => this.extractError(err))),
    );
  }

  changePassword(payload: ChangePasswordPayload): Observable<void> {
    return this.api.post<null>('/change-password', payload).pipe(
      map(() => undefined),
      catchError((err) => throwError(() => this.extractError(err))),
    );
  }

  forgotPassword(payload: ForgotPasswordPayload): Observable<{ phone: string; otp?: string }> {
    return this.api.post<{ phone: string; otp?: string }>('/forgot-password', payload).pipe(
      map((res) => res.data!),
      catchError((err) => throwError(() => this.extractError(err))),
    );
  }

  resetPassword(payload: ResetPasswordPayload): Observable<AuthUser> {
    return this.api.post<{ user: AuthUser }>('/reset-password', payload).pipe(
      map((res) => {
        const user = res.data!.user;
        this.setUser(user);
        return user;
      }),
      catchError((err) => throwError(() => this.extractError(err))),
    );
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /** @deprecated Use register/login API methods */
  loginAs(_role: unknown, _options?: { name?: string; isOnboarded?: boolean }) {
    console.warn('loginAs() is deprecated. Use register() or login().');
  }

  navigateAfterAuth(user: AuthUser): void {
    if (!user.isOnboarded) {
      const path = user.role === 'coach'
        ? '/coach-onboarding'
        : user.role === 'venue'
          ? '/venue-onboarding'
          : '/onboarding';
      void this.router.navigateByUrl(path);
      return;
    }

    if (user.role === 'coach') {
      void this.router.navigateByUrl('/app/coach/dashboard');
      return;
    }

    if (user.role === 'venue') {
      void this.router.navigateByUrl(this.venueHomePath(user));
      return;
    }

    void this.router.navigateByUrl('/app/home');
  }

  /**
   * Single source for venue post-auth / post-onboarding routing.
   * Main app (dashboard) only when backend canAccessApp is true.
   */
  venueHomePath(user: AuthUser | null = this.user()): string {
    if (user?.role !== 'venue') {
      return '/app/home';
    }

    if (!user.isOnboarded) {
      return '/venue-onboarding';
    }

    // Fully approved → main app only.
    if (this.canAccessVenueApp(user)) {
      return '/app/venue/dashboard';
    }

    // Account approved but docs missing/rejected → dashboard hosts mandatory upload modal.
    if (this.needsVenueDocuments(user)) {
      return '/app/venue/dashboard';
    }

    // Declined / incomplete profile → allow finishing profile then resubmit.
    if (user.accountStatus === 'declined' || user.accountStatus === 'incomplete') {
      return '/app/venue/complete-profile';
    }

    // Account pending or documents pending review.
    return '/venue-pending-approval';
  }

  /** Account pending or declined — cannot use the main app. */
  isVenueAccountBlocked(user: AuthUser | null = this.user()): boolean {
    return user?.role === 'venue' && (user.accountStatus === 'pending' || user.accountStatus === 'declined');
  }

  /** Account approved but required docs are under admin review. */
  isVenueDocumentsPending(user: AuthUser | null = this.user()): boolean {
    return user?.role === 'venue'
      && user.accountStatus === 'approved'
      && user.documentsStatus === 'pending';
  }

  /** Account approved but required docs missing or rejected — login OK, must upload. */
  needsVenueDocuments(user: AuthUser | null = this.user()): boolean {
    return user?.role === 'venue'
      && user.accountStatus === 'approved'
      && (user.documentsStatus === 'not_submitted' || user.documentsStatus === 'rejected');
  }

  isVenueAwaitingApproval(user: AuthUser | null = this.user()): boolean {
    return this.isVenueAccountBlocked(user) || this.isVenueDocumentsPending(user);
  }

  /** True only when account + required documents are both approved (backend canAccessApp). */
  canAccessVenueApp(user: AuthUser | null = this.user()): boolean {
    if (user?.role !== 'venue') return true;
    if (typeof user.canAccessApp === 'boolean') return user.canAccessApp;
    return user.accountStatus === 'approved' && user.documentsStatus === 'approved';
  }

  /** Restricted activation surfaces allowed when not fully approved. */
  isVenueActivationUrl(url: string): boolean {
    return url.includes('venue-pending-approval')
      || url.includes('venue-onboarding')
      || url.includes('/venue/complete-profile')
      || url.includes('/venue/dashboard')
      || url.includes('/venue/profile');
  }

  hydrateUser(user: AuthUser): void {
    this.setUser(user);
  }

  private persistAuth(data: AuthTokenResponse): AuthUser {
    localStorage.setItem(TOKEN_KEY, data.token);
    this.setUser(data.user);
    queueMicrotask(() => {
      void this.injector.get(PushNotificationService).syncIfAuthenticated();
      this.injector.get(TabBadgeService).start();
      void this.injector.get(ThemeService).refreshFromApi(true);
      void this.injector.get(RealtimeService).listenUserBookings(String(data.user.id));
    });
    return data.user;
  }

  private setUser(user: AuthUser): void {
    const unwrapped = this.unwrapUser(user);
    const normalized: AuthUser = {
      ...unwrapped,
      // Absolute media URL + cache-bust so Profile / drawer refresh immediately.
      profileImage: this.withCacheBust(
        resolveMediaUrl(unwrapped.profileImage),
        unwrapped.updatedAt || String(Date.now()),
      ),
    };
    localStorage.setItem(USER_KEY, JSON.stringify(normalized));
    this.user.set(normalized);
  }

  private unwrapUser(user: AuthUser | { data?: AuthUser }): AuthUser {
    const maybeWrapped = user as { data?: AuthUser };
    if (maybeWrapped?.data && typeof maybeWrapped.data === 'object' && (maybeWrapped.data as AuthUser).id) {
      return maybeWrapped.data;
    }
    return user as AuthUser;
  }

  private withCacheBust(url: string | null | undefined, version: string): string | null {
    if (!url) return null;
    const clean = url.split('?')[0];
    const stamp = encodeURIComponent(version);
    return `${clean}?v=${stamp}`;
  }

  private readCachedUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored) as AuthUser;
      return {
        ...parsed,
        profileImage: this.withCacheBust(
          resolveMediaUrl(parsed.profileImage),
          parsed.updatedAt || String(Date.now()),
        ),
      };
    } catch {
      return null;
    }
  }

  clearSession(): void {
    try {
      void this.injector.get(RealtimeService).listenUserBookings(null);
    } catch {
      // ignore
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
  }

  private withDeviceFields<T extends LoginPayload | RegisterPayload>(payload: T): T {
    try {
      const push = this.injector.get(PushNotificationService);
      const token = push.getCurrentToken();
      const deviceId = push.getDeviceId();
      const platform = Capacitor.getPlatform();
      return {
        ...payload,
        device_token: token || payload.device_token,
        device_id: deviceId || payload.device_id,
        platform: platform === 'ios' || platform === 'android' || platform === 'web'
          ? platform
          : payload.platform,
      };
    } catch {
      return payload;
    }
  }

  private extractError(err: unknown): string {
    const httpErr = err as {
      status?: number;
      error?: { message?: string; errors?: Record<string, string[]> };
      message?: string;
    };

    if (httpErr.status === 0) {
      return 'Unable to reach the server. Check your internet connection, then try again. If this continues after an update, the live API may still need the latest profile-upload fix.';
    }

    if (httpErr.status === 405) {
      return 'Profile photo upload is not supported on this API version yet. Please update the live server, then try again.';
    }

    const fieldErrors = httpErr.error?.errors;
    if (fieldErrors) {
      const first = Object.values(fieldErrors)[0];
      if (first?.[0]) return first[0];
    }

    return httpErr.error?.message || httpErr.message || 'Something went wrong. Please try again.';
  }
}
