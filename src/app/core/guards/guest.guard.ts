import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureSession().pipe(
    map((ok) => {
      const user = auth.user();
      if (!ok || !user) {
        return true;
      }

      if (!user.isOnboarded) {
        return router.createUrlTree([
          user.role === 'coach'
            ? '/coach-onboarding'
            : user.role === 'venue'
              ? '/venue-onboarding'
              : '/onboarding',
        ]);
      }

      if (user.role === 'venue') {
        return router.createUrlTree([auth.venueHomePath(user)]);
      }

      return router.createUrlTree([
        user.role === 'coach'
          ? '/app/coach/dashboard'
          : '/app/home',
      ]);
    }),
  );
};
