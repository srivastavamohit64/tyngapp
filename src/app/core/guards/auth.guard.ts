import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Auth + venue activation gate.
 * Venues never enter main-app routes until canAccessApp (account + docs approved),
 * except allow-listed activation surfaces (pending screen, docs modal host, profile).
 */
export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureSession().pipe(
    map((ok) => {
      if (!ok || !auth.user()) {
        const returnUrl = state.url.startsWith('/app/coach-invite/') ? state.url : undefined;
        if (returnUrl) sessionStorage.setItem('tyng-post-auth-return-url', returnUrl);
        return router.createUrlTree(['/login'], returnUrl ? { queryParams: { returnUrl } } : undefined);
      }

      const user = auth.user()!;
      const url = state.url || '';

      if (user.role !== 'venue') {
        return true;
      }

      if (!user.isOnboarded) {
        if (url.includes('venue-onboarding')) return true;
        return router.createUrlTree(['/venue-onboarding']);
      }

      // Fully approved → any authenticated route OK.
      if (auth.canAccessVenueApp(user)) {
        return true;
      }

      // Not fully approved: never allow arbitrary main-app pages.
      const target = auth.venueHomePath(user);

      // Docs missing/rejected: only dashboard (modal), profile, complete-profile.
      if (auth.needsVenueDocuments(user)) {
        const allowed =
          url.includes('/venue/dashboard')
          || url.includes('/venue/complete-profile')
          || url.includes('/venue/profile')
          || url.includes('venue-pending-approval');
        return allowed ? true : router.createUrlTree([target]);
      }

      // Pending account / docs review / incomplete / declined.
      if (url.includes('venue-pending-approval')) {
        return true;
      }
      if (
        (user.accountStatus === 'declined' || user.accountStatus === 'incomplete')
        && (url.includes('/venue/complete-profile') || url.includes('/venue/profile'))
      ) {
        return true;
      }

      return router.createUrlTree([target]);
    }),
  );
};
