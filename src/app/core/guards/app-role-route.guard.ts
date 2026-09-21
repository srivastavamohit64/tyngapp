import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Keeps each signed-in role inside its own app area, including browser back/deep links. */
export const appRoleRouteGuard: CanActivateChildFn = (_route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.ensureSession().pipe(
    map((ok) => {
      const user = auth.user();
      if (!ok || !user) return router.createUrlTree(['/login']);

      const path = (state.url || '').split('?')[0];
      const home = user.role === 'coach'
        ? '/app/coach/dashboard'
        : user.role === 'venue'
          ? auth.venueHomePath(user)
          : '/app/home';

      if (path.startsWith('/app/coach/') && user.role !== 'coach') {
        return router.createUrlTree([home]);
      }

      if (user.role === 'coach') {
        const playerOnly = [
          '/app/home', '/app/discover', '/app/search', '/app/venues', '/app/leaderboard',
          '/app/map', '/app/game/', '/app/events/', '/app/coaches', '/app/ongoing',
          '/app/venue/', '/app/my-bookings', '/app/check-in', '/app/xp/', '/app/team/',
          '/app/friends', '/app/stats',
        ];
        if (playerOnly.some((prefix) => path === prefix || path.startsWith(prefix))) {
          return router.createUrlTree(['/app/coach/dashboard']);
        }
      }

      return true;
    }),
  );
};
