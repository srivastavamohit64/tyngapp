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

/** Bottom tab destinations per role. Only these exact routes show the tab bar and the menu button. */
export const MAIN_TAB_ROUTES: Record<string, string[]> = {
  player: ['/app/home', '/app/discover', '/app/my-bookings', '/app/chat'],
  coach: ['/app/coach/dashboard', '/app/coach/students', '/app/coach/schedule', '/app/coach/chat'],
  venue: ['/app/venue/dashboard', '/app/venue/bookings', '/app/venue/events', '/app/chat'],
  admin: ['/app/admin/dashboard', '/app/admin/users', '/app/admin/venues', '/app/admin/settings'],
};

export function isMainTabRoute(path: string, role?: string): boolean {
  const normalized = (path || '').split('?')[0].split('#')[0].replace(/\/+$/, '');
  const routes = MAIN_TAB_ROUTES[role ?? 'player'] ?? MAIN_TAB_ROUTES['player'];
  return routes.includes(normalized);
}

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
