import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { ApiService } from './api.service';
import { WalletSummary, WalletTransaction } from './wallet.service';

export interface GiftCard {
  id: string;
  code: string;
  fullCode?: string | null;
  pin?: string | null;
  amount: number;
  currency: string;
  status: string;
  statusLabel?: string;
  canShare?: boolean;
  isPurchaser?: boolean;
  isRedeemer?: boolean;
  purchasedBy: string;
  redeemedBy?: string | null;
  expiresAt?: string | null;
  redeemedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface GiftCardCreateResult {
  giftCard: GiftCard;
  wallet: WalletSummary;
  transaction: WalletTransaction | null;
}

export interface GiftCardRedeemResult {
  giftCard: GiftCard;
  wallet: WalletSummary;
  transaction: WalletTransaction | null;
  amount: number;
}

@Injectable({ providedIn: 'root' })
export class GiftCardService {
  private readonly api = inject(ApiService);

  create(amount: number): Observable<ApiResponse<GiftCardCreateResult>> {
    return this.api.post('/gift-cards/create', { amount });
  }

  redeem(code: string, pin: string): Observable<ApiResponse<GiftCardRedeemResult>> {
    return this.api.post('/gift-cards/redeem', { code, pin });
  }

  list(
    page = 1,
    perPage = 20,
    scope: 'all' | 'created' | 'redeemed' = 'all'
  ): Observable<ApiResponse<{
    items: GiftCard[];
    pagination: {
      currentPage: number;
      lastPage: number;
      perPage: number;
      total: number;
    };
  }>> {
    return this.api.get(`/gift-cards?page=${page}&per_page=${perPage}&scope=${scope}`);
  }

  shareDetails(id: string): Observable<ApiResponse<{
    giftCard: GiftCard;
    code: string;
    pin: string;
    amount: number;
  }>> {
    return this.api.get(`/gift-cards/${id}/share`);
  }
}
