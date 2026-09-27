import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse, HomePromotion } from '../models/api.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class HomePromotionService {
  private readonly api = inject(ApiService);

  list(): Observable<HomePromotion[]> {
    return this.api
      .get<HomePromotion[]>('/home/promotions')
      .pipe(map((response: ApiResponse<HomePromotion[]>) => response.data ?? []));
  }
}
