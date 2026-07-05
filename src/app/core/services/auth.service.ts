import { Injectable, signal } from '@angular/core';
import { UserRole } from '../../shared/models/app.models';

export interface AuthUser {
  id: string;
  name: string;
  role: UserRole;
  isOnboarded: boolean;
  sports?: string[];
  experience?: string;
  focus?: string;
  availability?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly storageKey = 'tyng_user';
  readonly user = signal<AuthUser | null>(this.readUser());

  loginAs(role: UserRole, options?: { name?: string; isOnboarded?: boolean }) {
    const user: AuthUser = {
      id: `user_${Date.now()}`,
      name: options?.name ?? '',
      role,
      isOnboarded: options?.isOnboarded ?? false,
    };
    localStorage.setItem(this.storageKey, JSON.stringify(user));
    this.user.set(user);
  }

  completeOnboarding(data?: Partial<AuthUser>) {
    const activeUser = this.user();
    if (activeUser) {
      const user = { ...activeUser, ...data, isOnboarded: true };
      localStorage.setItem(this.storageKey, JSON.stringify(user));
      this.user.set(user);
    }
  }

  logout() {
    localStorage.removeItem(this.storageKey);
    this.user.set(null);
  }

  private readUser(): AuthUser | null {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
}
