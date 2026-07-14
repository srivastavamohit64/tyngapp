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
      formData.append('profile_image', profileImage);

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
      void this.router.navigateByUrl('/app/venue/dashboard');
      return;
    }

    void this.router.navigateByUrl('/app/home');
  }

  private persistAuth(data: AuthTokenResponse): AuthUser {
    localStorage.setItem(TOKEN_KEY, data.token);
    this.setUser(data.user);
    return data.user;
  }

  private setUser(user: AuthUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.user.set(user);
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
      error?: { message?: string; errors?: Record<string, string[]> };
      message?: string;
    };

    const fieldErrors = httpErr.error?.errors;
    if (fieldErrors) {
      const first = Object.values(fieldErrors)[0];
      if (first?.[0]) return first[0];
    }

    return httpErr.error?.message || httpErr.message || 'Something went wrong. Please try again.';
  }
}
