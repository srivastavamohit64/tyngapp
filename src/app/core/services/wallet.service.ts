import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api.model';
import { ApiService } from './api.service';

export interface WalletSummary {
  id: string;
  userId: string;
  balance: number;
  currency: string;
  totalCredits: number;
  totalDebits: number;
  tpPoints?: number;
  tpEarned?: number;
  tpRedeemed?: number;
  tpExpiring?: number;
  tpPointsPerRupee?: number;
  tpValueInr?: number;
  updatedAt?: string | null;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  walletId: string;
  bookingId?: string | null;
  paymentId?: string | null;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  isCredit: boolean;
  reference?: string | null;
  description?: string | null;
  status: string;
  createdBy?: string | null;
  booking?: {
    id: string;
    sport?: string | null;
    bookingDate?: string | null;
    bookingStatus?: string | null;
  } | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface WalletTransactionsResponse {
  items: WalletTransaction[];
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
  };
}

@Injectable({ providedIn: 'root' })
export class WalletService {
  private readonly api = inject(ApiService);

  getWallet(): Observable<ApiResponse<WalletSummary>> {
    return this.api.get<WalletSummary>('/wallet');
  }

  getTransactions(page = 1, perPage = 20): Observable<ApiResponse<WalletTransactionsResponse>> {
    return this.api.get<WalletTransactionsResponse>(
      `/wallet/transactions?page=${page}&per_page=${perPage}`
    );
  }

  topup(amount: number, gateway = 'simulated'): Observable<ApiResponse<{
    wallet: WalletSummary;
    transaction: WalletTransaction;
  }>> {
    return this.api.post('/wallet/topup', {
      amount,
      gateway,
    });
  }

  convertTp(points: number): Observable<ApiResponse<{
    wallet: WalletSummary;
    transaction: WalletTransaction | null;
    rupees: number;
  }>> {
    return this.api.post('/wallet/convert-tp', { points });
  }
}
