import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse, DiscoverResponse, FriendItem } from '../models/api.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class SocialService {
  private readonly api = inject(ApiService);

  getDiscoverPlayers(query = ''): Observable<ApiResponse<DiscoverResponse>> {
    const suffix = query ? `?${query}` : '';
    return this.api.get<DiscoverResponse>(`/discover${suffix}`);
  }

  swipePlayer(playerId: string, direction: 'left' | 'right'): Observable<ApiResponse<{ direction: string; friendAdded: boolean }>> {
    return this.api.post<{ direction: string; friendAdded: boolean }>('/discover/swipe', {
      player_id: playerId,
      direction,
    });
  }

  getFriends(): Observable<ApiResponse<FriendItem[]>> {
    return this.api.get<FriendItem[]>('/friends');
  }

  addFriend(playerId: string): Observable<ApiResponse<{ added: boolean }>> {
    return this.api.post<{ added: boolean }>('/friends/add', {
      player_id: playerId,
    });
  }

  removeFriend(playerId: string): Observable<ApiResponse<null>> {
    return this.api.delete<null>(`/friends/remove/${playerId}`);
  }

  getBlockedUsers(): Observable<ApiResponse<{ items: BlockedUser[] }>> {
    return this.api.get<{ items: BlockedUser[] }>('/blocked-users');
  }

  getBlockStatus(userId: string): Observable<ApiResponse<{ blocked: boolean }>> {
    return this.api.get<{ blocked: boolean }>(`/users/${userId}/block`);
  }

  blockUser(userId: string): Observable<ApiResponse<{ blocked: boolean }>> {
    return this.api.post<{ blocked: boolean }>(`/users/${userId}/block`);
  }

  unblockUser(userId: string): Observable<ApiResponse<{ blocked: boolean }>> {
    return this.api.delete<{ blocked: boolean }>(`/users/${userId}/block`);
  }
}

export interface BlockedUser {
  id: string;
  name: string;
  username: string;
  profileImage: string | null;
  role: string;
  location: string | null;
  blockedAt: string | null;
}
