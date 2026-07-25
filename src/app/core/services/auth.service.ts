import { Injectable, inject, signal } from '@angular/core';
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

const TOKEN_KEY = 'tyng_auth_token';
const USER_KEY = 'tyng_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly user = signal<AuthUser | null>(this.readCachedUser());
  readonly sessionReady = signal(false);

  register(payload: RegisterPayload): Observable<AuthUser> {
    return this.api.post<AuthTokenResponse>('/register', payload).pipe(
      map((res) => this.persistAuth(res.data!)),
      catchError((err) => throwError(() => this.extractError(err))),
    );
  }

  login(payload: LoginPayload): Observable<AuthUser> {
    return this.api.post<AuthTokenResponse>('/login', payload).pipe(
      map((res) => this.persistAuth(res.data!)),
      catchError((err) => throwError(() => this.extractError(err))),
    );
  }

  logout(): Observable<void> {
    const clear = () => {
      this.clearSession();
      void this.router.navigateByUrl('/welcome');
    };

    if (!this.getToken()) {
      clear();
      return of(undefined);
    }

    return this.api.post<null>('/logout').pipe(
      tap(() => clear()),
      catchError(() => {
        clear();
        return of(undefined);
      }),
      map(() => undefined),
    );
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

  venueHomePath(_user: AuthUser | null = this.user()): string {
    // Prefer dashboard; completion card handles incomplete profiles.
    // Older APIs still mark ready=false for optional Amenities/Verification.
    return '/app/venue/dashboard';
  }

  private persistAuth(data: AuthTokenResponse): AuthUser {
    localStorage.setItem(TOKEN_KEY, data.token);
    this.setUser(data.user);
    return data.user;
  }

  private setUser(user: AuthUser): void {
    const unwrapped = this.unwrapUser(user);
    const normalized: AuthUser = {
      ...unwrapped,
      // Bust image caches so Profile / drawer / edit screens refresh immediately.
      profileImage: this.withCacheBust(unwrapped.profileImage, unwrapped.updatedAt || String(Date.now())),
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
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  }

  clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.user.set(null);
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
