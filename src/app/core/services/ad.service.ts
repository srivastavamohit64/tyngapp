import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, HomeAd } from '../models/api.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class AdService {
  private readonly api = inject(ApiService);

  list(placement = 'home_banner'): Observable<HomeAd[]> {
    return this.api
      .get<HomeAd[]>(`/ads?placement=${encodeURIComponent(placement)}`)
      .pipe(map((res: ApiResponse<HomeAd[]>) => res.data ?? []));
  }
}
