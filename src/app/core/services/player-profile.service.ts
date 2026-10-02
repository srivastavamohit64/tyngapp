import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiResponse } from '../models/api.model';
import { ApiService } from './api.service';

export interface HomeSportsSetting {
  sports: string[] | null;
  count: number;
}

export type PlayingLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';
export type DocumentType = 'medical_certificate' | 'fitness_certificate' | 'insurance_card' | 'identity' | 'other';
export type DocumentVisibility = 'only_me' | 'coach_active_session' | 'venue_emergency' | 'tyng_verification';

export interface ProfileVisibility {
  showCity: boolean;
  showAgeRange: boolean;
  showGamesPlayed: boolean;
  showReliability: boolean;
  showRating: boolean;
  showBadges: boolean;
  showSports: boolean;
  allowMessages: boolean;
}

export interface MedicalAccess {
  coach: boolean;
  venue: boolean;
  emergency: boolean;
  players: boolean;
}

export interface ProfileIdentity {
  id: string;
  name: string;
  username: string;
  tyId: string;
  profileImage: string | null;
  verified: boolean;
  city: string | null;
  memberSince: string | null;
  primarySport: string | null;
  otherSports: string[];
  phoneMasked: string | null;
  emailMasked: string | null;
  phoneVerified: boolean;
  emailVerified: boolean;
}

export interface ProfilePersonal {
  name: string;
  username: string;
  dob: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
  area: string | null;
  languages: string[];
  bio: string | null;
  primarySport: string | null;
  otherSports: string[];
  playingLevel: PlayingLevel | null;
  preferredPosition: string | null;
  dominantHand: string | null;
  dominantFoot: string | null;
  playStyle: string | null;
  preferredTimes: TimeSlot[];
  preferredDays: string | null;
  environment: string | null;
  searchRadiusKm: number | null;
  coachInterest: string | null;
  venuePreference: string | null;
  visibility: ProfileVisibility;
}

export interface EmergencyContact {
  name: string | null;
  relationship: string | null;
  phone: string | null;
}

export interface ProfileMedical {
  medical: {
    heightCm: number | null;
    weightKg: number | null;
    bloodGroup: string | null;
    fitnessLevel: PlayingLevel | null;
    restingHeartRate: number | null;
    fitnessPosition: string | null;
    sportsInterested: string[];
    hydrationReminder: boolean;
    allergies: string[];
    medicalConditions: string | null;
    pastInjuries: string | null;
    currentInjuries: string | null;
    surgeries: string | null;
    medications: string | null;
    emergencyNotes: string | null;
  };
  emergencyContacts: { primary: EmergencyContact; secondary: EmergencyContact };
  medicalAccess: MedicalAccess;
  wellness: { smoking: string | null; alcohol: string | null; diet: string | null; sleepHours: number | null };
}

export interface ProfileBadge {
  code: string;
  name: string;
  description: string | null;
  category: string;
  threshold: number | null;
  visibility: string;
  earned: boolean;
  earnedAt: string | null;
}

export interface ProfileGame {
  bookingId: string;
  sport: string | null;
  venue: string | null;
  date: string | null;
  result: 'win' | 'loss' | 'draw' | null;
  noShow: boolean;
  hosted: boolean;
  xp: number;
}

export interface PlayerProfile {
  identity: ProfileIdentity;
  personal: ProfilePersonal;
  medical: ProfileMedical;
  pulse: {
    level: number;
    levelTitle: string;
    lifetimeXp: number;
    seasonXp: number;
    nextLevelXp: number | null;
    xpToNextLevel: number | null;
    progressPct: number;
    nextLevel: { level: number; title: string; minimumXp: number } | null;
    reliability: number;
    rating: number | null;
    streak: number;
    xpThisMonth: number;
  };
  stats: {
    played: number;
    won: number;
    lost: number;
    draws: number;
    winRate: number | null;
    hosted: number;
    joined: number;
    completed: number;
    noShows: number;
    currentStreak: number;
    longestStreak: number;
    onTimePct: number | null;
    completionPct: number | null;
    thisMonth: number;
    resultsRecorded: number;
  };
  ranks: Record<'city' | 'sport' | 'friends', { rank: number | null; label: string | null }>;
  reliability: {
    score: number;
    hasData: boolean;
    attendance: number | null;
    punctuality: number | null;
    lateCancellations: number | null;
    noShows: number | null;
    bookingCompletion: number | null;
    captainReliability: number | null;
  };
  reputation: {
    overall: number | null;
    count: number;
    reliability: number;
    sportsmanship: number | null;
    punctuality: number | null;
    communication: number | null;
    venueBehaviour: number | null;
  };
  badges: { items: ProfileBadge[]; earned: number; locked: number; secret: number; total: number };
  games: ProfileGame[];
  recentXp: Array<{ id: string; label: string; amount: number; category: string | null; sport: string | null; createdAt: string | null }>;
  completion: { pct: number; missing: string[] };
}

export interface PlayerDocument {
  id: number;
  documentType: DocumentType;
  title: string | null;
  name: string | null;
  mimeType: string | null;
  sizeBytes: number;
  visibility: DocumentVisibility;
  createdAt: string | null;
}

export type PersonalUpdate = Partial<Omit<ProfilePersonal, 'age' | 'visibility'>> & { visibility?: Partial<ProfileVisibility> };

export interface MedicalUpdate {
  medical?: Partial<ProfileMedical['medical']>;
  emergencyContacts?: Partial<ProfileMedical['emergencyContacts']>;
  medicalAccess?: Partial<MedicalAccess>;
  wellness?: Partial<ProfileMedical['wellness']>;
}

@Injectable({ providedIn: 'root' })
export class PlayerProfileService {
  private readonly api = inject(ApiService);

  getProfile(): Observable<ApiResponse<PlayerProfile>> {
    return this.api.get<PlayerProfile>('/player/profile');
  }

  updatePersonal(changes: PersonalUpdate): Observable<ApiResponse<PlayerProfile>> {
    return this.api.put<PlayerProfile>('/player/profile', changes);
  }

  updateMedical(changes: MedicalUpdate): Observable<ApiResponse<PlayerProfile>> {
    return this.api.put<PlayerProfile>('/player/profile/medical', changes);
  }

  getHomeSports(): Observable<ApiResponse<HomeSportsSetting>> {
    return this.api.get<HomeSportsSetting>('/player/home-sports');
  }

  /** Pass exactly `count` sport ids, or null to go back to the default order. */
  saveHomeSports(sports: string[] | null): Observable<ApiResponse<HomeSportsSetting>> {
    return this.api.put<HomeSportsSetting>('/player/home-sports', { sports });
  }

  setGameResult(bookingId: string, result: 'win' | 'loss' | 'draw' | null): Observable<ApiResponse<{ bookingId: string; result: string | null }>> {
    return this.api.post(`/player/games/${bookingId}/result`, { result });
  }

  getDocuments(): Observable<ApiResponse<{ items: PlayerDocument[] }>> {
    return this.api.get<{ items: PlayerDocument[] }>('/player/documents');
  }

  uploadDocument(file: File, documentType: DocumentType, replaceId?: number): Observable<ApiResponse<PlayerDocument>> {
    const form = new FormData();
    form.append('file', file);
    form.append('document_type', documentType);
    if (replaceId) form.append('replace_id', String(replaceId));
    return this.api.postForm<PlayerDocument>('/player/documents', form);
  }

  updateDocument(id: number, changes: { title?: string | null; visibility?: DocumentVisibility }): Observable<ApiResponse<PlayerDocument>> {
    return this.api.patch<PlayerDocument>(`/player/documents/${id}`, changes);
  }

  documentFile(id: number, download = false): Observable<Blob> {
    return this.api.getBlob(`/player/documents/${id}/file${download ? '?download=1' : ''}`);
  }

  deleteDocument(id: number): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/player/documents/${id}`);
  }
}
