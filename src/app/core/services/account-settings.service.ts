import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { ApiService } from './api.service';

export interface CmsPage {
  title: string;
  slug: string;
  content: string;
  updatedAt: string | null;
}

export interface NotificationCategory {
  key: string;
  label: string;
  description: string;
}

export interface NotificationSettings {
  enabled: boolean;
  categories: Record<string, boolean>;
  catalog: NotificationCategory[];
}

@Injectable({ providedIn: 'root' })
export class AccountSettingsService {
  private readonly api = inject(ApiService);

  getPage(slug: string): Observable<ApiResponse<CmsPage>> {
    return this.api.get<CmsPage>(`/pages/${encodeURIComponent(slug)}`);
  }

  getNotificationSettings(): Observable<ApiResponse<NotificationSettings>> {
    return this.api.get<NotificationSettings>('/notification-settings');
  }

  updateNotificationSettings(changes: { enabled?: boolean; categories?: Record<string, boolean> }): Observable<ApiResponse<NotificationSettings>> {
    return this.api.put<NotificationSettings>('/notification-settings', changes);
  }
}
