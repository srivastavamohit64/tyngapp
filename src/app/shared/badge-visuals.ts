export interface BadgeItem {
  code: string;
  name: string;
  description: string | null;
  category: string;
  icon?: string | null;
  threshold: number | null;
  current?: number;
  progressPct?: number;
  hint?: string | null;
  visibility: string;
  earned: boolean;
  earnedAt: string | null;
}

export interface BadgeCatalog {
  audience: 'player' | 'coach' | null;
  items: BadgeItem[];
  earned: number;
  locked: number;
  secret: number;
  total: number;
  next: { code: string; name: string; description: string | null; current: number; threshold: number; progressPct: number } | null;
}

export interface BadgeVisual {
  icon: string;
  color: string;
  bg: string;
}

const BADGE_VISUALS: Record<string, BadgeVisual> = {
  clockwork: { icon: 'time-outline', color: '#D97706', bg: '#FFFBEB' },
  good_sport: { icon: 'shield-checkmark-outline', color: '#7C3AED', bg: '#F5F3FF' },
  ground_hopper: { icon: 'location-outline', color: '#2563EB', bg: '#EFF6FF' },
  game_maker: { icon: 'flash-outline', color: '#16A34A', bg: '#F0FDF4' },
  count_on_me: { icon: 'checkmark-done-circle-outline', color: '#0EA5E9', bg: '#F0F9FF' },
  early_bird: { icon: 'sunny-outline', color: '#F59E0B', bg: '#FFFBEB' },
  explorer: { icon: 'compass-outline', color: '#0891B2', bg: '#ECFEFF' },
  fan_favourite: { icon: 'heart-outline', color: '#DB2777', bg: '#FDF2F8' },
  new_faces: { icon: 'people-outline', color: '#7C3AED', bg: '#F5F3FF' },
  the_connector: { icon: 'git-network-outline', color: '#2563EB', bg: '#EFF6FF' },
  unbroken: { icon: 'flame-outline', color: '#FF7A00', bg: '#FFF7ED' },
  venue_favourite: { icon: 'star-outline', color: '#CA8A04', bg: '#FEFCE8' },
  first_whistle: { icon: 'flag-outline', color: '#16A34A', bg: '#F0FDF4' },
  session_pro: { icon: 'fitness-outline', color: '#2563EB', bg: '#EFF6FF' },
  century_coach: { icon: 'trophy-outline', color: '#D97706', bg: '#FFFBEB' },
  squad_builder: { icon: 'people-outline', color: '#7C3AED', bg: '#F5F3FF' },
  academy_builder: { icon: 'school-outline', color: '#0891B2', bg: '#ECFEFF' },
  talent_scout: { icon: 'clipboard-outline', color: '#0EA5E9', bg: '#F0F9FF' },
  top_rated_coach: { icon: 'star-outline', color: '#CA8A04', bg: '#FEFCE8' },
  iron_coach: { icon: 'barbell-outline', color: '#FF7A00', bg: '#FFF7ED' },
};

export function badgeVisual(badge: Pick<BadgeItem, 'code' | 'icon'>): BadgeVisual {
  return BADGE_VISUALS[badge.code] ?? { icon: badge.icon || 'ribbon-outline', color: '#16A34A', bg: '#F0FDF4' };
}
