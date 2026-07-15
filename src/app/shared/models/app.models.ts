export type UserRole = 'player' | 'coach' | 'venue' | 'admin';

export interface Sport {
  id: string;
  name: string;
  emoji: string;
  players?: string;
  color?: string;
}

export interface Player {
  id: number;
  name: string;
  avatar: string;
  sport: string;
  skill: string;
  rating: number;
  reliability: number;
  distance: string;
  gamesPlayed: number;
  badges: string[];
}

export interface EventGame {
  id: number;
  sport: string;
  time: string;
  location: string;
  distance: string;
  players: string;
  status: 'filling' | 'almost-full' | 'live';
}

export interface Venue {
  id: number;
  name: string;
  location?: string;
  distance?: string | null;
  price?: number | null;
  rating?: number | null;
  emoji?: string | null;
  sports?: string[];
}

export interface ChatMessage {
  id: number;
  sender?: string;
  avatar?: string;
  text: string;
  time: string;
  isSelf?: boolean;
  type?: 'system' | 'message';
}

export interface TabItem {
  label: string;
  icon: string;
  route: string;
}
