import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/api.model';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  readonly baseUrl = this.normalizeBaseUrl(environment.apiUrl);

  get<T>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(this.url(path));
  }

  post<T>(path: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.url(path), body ?? {});
  }

  put<T>(path: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(this.url(path), body ?? {});
  }

  patch<T>(path: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.patch<ApiResponse<T>>(this.url(path), body ?? {});
  }

  /**
   * Multipart profile/file updates.
   * PHP ignores uploaded files on real PUT, and Android WebViews often abort
   * multipart PUT with status 0 — so we always POST and spoof PUT.
   */
  putForm<T>(path: string, formData: FormData): Observable<ApiResponse<T>> {
    if (!formData.has('_method')) {
      formData.append('_method', 'PUT');
    }
    return this.http.post<ApiResponse<T>>(this.url(path), formData, {
      headers: {
        'X-HTTP-METHOD-OVERRIDE': 'PUT',
      },
    });
  }

  postForm<T>(path: string, formData: FormData): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(this.url(path), formData);
  }

  delete<T>(path: string, body?: unknown): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(this.url(path), {
      body: body ?? {},
    });
  }

  private url(path: string): string {
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalized}`;
  }

  private normalizeBaseUrl(url: string): string {
    let trimmed = (url || '').trim().replace('tyngpeaople.com', 'tyngpeople.com').replace(/\/+$/, '');
    if (trimmed && !/\/api$/i.test(trimmed)) {
      trimmed = `${trimmed}/api`;
    }
    return trimmed;
  }
}
