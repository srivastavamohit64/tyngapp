/** Routes that show the brand tyng. top bar (Figma AppLayout PLAYER_MAIN_ROUTES). */
export const PLAYER_BRAND_HEADER_ROUTES = [
  '/app/home',
  '/app/ongoing',
  '/app/my-bookings',
  '/app/discover',
  '/app/venues',
  '/app/chat',
  '/app/leaderboard',
  '/app/profile',
];

/** Coach primary tab routes with brand top bar. */
export const COACH_BRAND_HEADER_ROUTES = [
  '/app/coach/dashboard',
  '/app/home',
  '/app/coach/students',
  '/app/coach/schedule',
  '/app/schedule',
];

/** Venue primary tab routes with brand top bar. */
export const VENUE_BRAND_HEADER_ROUTES = [
  '/app/venue/dashboard',
  '/app/home',
  '/app/venue/bookings',
  '/app/venue/calendar',
  '/app/chat',
];

export function shouldShowBrandHeader(path: string, role?: string): boolean {
  if (!path) return false;
  const normalized = path.split('?')[0];

  if (role === 'coach') {
    return COACH_BRAND_HEADER_ROUTES.some((r) => normalized === r || normalized.startsWith(r + '/'));
  }
  if (role === 'venue') {
    return VENUE_BRAND_HEADER_ROUTES.some((r) => normalized === r || normalized.startsWith(r + '/'));
  }
  if (role === 'admin') {
    return normalized.startsWith('/app/admin');
  }
  return PLAYER_BRAND_HEADER_ROUTES.some((r) => normalized === r || normalized.startsWith(r + '/'));
}
