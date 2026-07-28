import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import {
  WalletService,
  WalletSummary,
  WalletTransaction,
} from '../../core/services/wallet.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-wallet-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent, PageHeaderComponent],
  template: `
    <ion-content fullscreen>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-brand-header-shell [showBrand]="false">
        <main class="min-h-full bg-[#FAFBFC] text-[#111827] pb-[calc(32px+env(safe-area-inset-bottom,0px))]">
          <app-page-header title="Wallet" [showBack]="true" (back)="goBack()"></app-page-header>

          <div class="px-4 pt-2 space-y-4">
            <section class="balance-card">
              <div class="balance-orb"></div>
              <p class="balance-label">Available balance</p>
              <h2 class="balance-value">
                ₹{{ (wallet()?.balance || 0) | number:'1.2-2' }}
              </h2>
              <p class="balance-currency">{{ wallet()?.currency || 'INR' }}</p>
              <div class="balance-stats">
                <div>
                  <span>Credits</span>
                  <strong>₹{{ (wallet()?.totalCredits || 0) | number:'1.0-0' }}</strong>
                </div>
                <div>
                  <span>Debits</span>
                  <strong>₹{{ (wallet()?.totalDebits || 0) | number:'1.0-0' }}</strong>
                </div>
              </div>
            </section>

            <section class="topup-card">
              <h3>Top up wallet</h3>
              <p>Simulated payment for now — gateway can be wired later.</p>
              <div class="quick-amounts">
                <button type="button" *ngFor="let amt of quickAmounts" (click)="topupAmount = amt">
                  ₹{{ amt }}
                </button>
              </div>
              <div class="topup-row">
                <input
                  type="number"
                  [(ngModel)]="topupAmount"
                  min="1"
                  placeholder="Enter amount"
                />
                <button type="button" class="topup-btn" [disabled]="toppingUp() || !topupAmount" (click)="topup()">
                  {{ toppingUp() ? 'Processing…' : 'Add money' }}
                </button>
              </div>
            </section>

            <section class="txn-section">
              <div class="txn-header">
                <h3>Transactions</h3>
                <span>{{ transactions().length }} shown</span>
              </div>

              <div *ngIf="loading()" class="state-card">Loading wallet…</div>
              <div *ngIf="!loading() && errorMessage()" class="state-card">{{ errorMessage() }}</div>
              <div *ngIf="!loading() && !errorMessage() && transactions().length === 0" class="state-card">
                No wallet activity yet. Top up to get started.
              </div>

              <div class="txn-list" *ngIf="transactions().length">
                <div class="txn-item" *ngFor="let txn of transactions()">
                  <div class="txn-icon" [class.credit]="txn.isCredit" [class.debit]="!txn.isCredit">
                    <ion-icon [name]="txn.isCredit ? 'arrow-down-outline' : 'arrow-up-outline'"></ion-icon>
                  </div>
                  <div class="txn-meta">
                    <strong>{{ formatType(txn.type) }}</strong>
                    <span>{{ txn.description || txn.reference || 'Wallet activity' }}</span>
                    <em>{{ txn.createdAt | date:'mediumDate' }} · {{ txn.createdAt | date:'shortTime' }}</em>
                  </div>
                  <div class="txn-amount" [class.credit]="txn.isCredit" [class.debit]="!txn.isCredit">
                    {{ txn.isCredit ? '+' : '−' }}₹{{ txn.amount | number:'1.2-2' }}
                  </div>
                </div>
              </div>

              <button
                *ngIf="hasMore()"
                type="button"
                class="load-more"
                [disabled]="loadingMore()"
                (click)="loadMore()"
              >
                {{ loadingMore() ? 'Loading…' : 'Load more' }}
              </button>
            </section>
          </div>
        </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .balance-card {
        position: relative; overflow: hidden; border-radius: 28px; padding: 22px 20px 18px;
        color: #fff !important; background: linear-gradient(135deg, #111827 0%, #1f2937 55%, #ff7a00 140%);
        box-shadow: 0 16px 40px rgba(17,24,39,.22);
      }
      .balance-orb {
        position: absolute; right: -30px; top: -40px; width: 140px; height: 140px; border-radius: 999px;
        background: radial-gradient(circle, rgba(255,154,64,.45), transparent 70%);
      }
      .balance-label { margin: 0; font-size: 12px; font-weight: 700; color: rgba(255,255,255,.8); letter-spacing: .04em; text-transform: uppercase; }
      .balance-value {
        margin: 8px 0 0; font-size: 36px; font-weight: 900; letter-spacing: -0.03em;
        color: #ffffff !important;
      }
      .balance-currency { margin: 2px 0 16px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,.75); }
      .balance-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      .balance-stats div {
        background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.08);
        border-radius: 16px; padding: 10px 12px;
      }
      .balance-stats span { display: block; font-size: 11px; color: rgba(255,255,255,.75); margin-bottom: 4px; }
      .balance-stats strong { font-size: 15px; font-weight: 800; color: #ffffff !important; }

      .topup-card, .txn-section {
        background: #fff; border: 1px solid #eef0f3; border-radius: 24px; padding: 16px;
        box-shadow: 0 8px 24px rgba(17,24,39,.04);
      }
      .topup-card h3, .txn-header h3 { margin: 0; font-size: 16px; font-weight: 900; }
      .topup-card p { margin: 4px 0 12px; color: #6b7280; font-size: 12px; font-weight: 600; }
      .quick-amounts { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
      .quick-amounts button {
        border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 999px;
        padding: 8px 12px; font-size: 12px; font-weight: 800; color: #111827;
      }
      .topup-row { display: flex; gap: 8px; }
      .topup-row input {
        flex: 1; min-width: 0; height: 46px; border-radius: 14px; border: 1px solid #e5e7eb;
        padding: 0 12px; font-size: 14px; font-weight: 700; outline: none;
      }
      .topup-btn {
        height: 46px; border: none; border-radius: 14px; padding: 0 16px;
        background: linear-gradient(135deg,#ff7a00,#ff9a40); color: #fff; font-weight: 900; font-size: 13px;
      }
      .topup-btn:disabled { opacity: .6; }

      .txn-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
      .txn-header span { font-size: 12px; color: #9ca3af; font-weight: 700; }
      .txn-list { display: flex; flex-direction: column; gap: 10px; }
      .txn-item {
        display: flex; align-items: center; gap: 12px; padding: 12px;
        border-radius: 18px; background: #fafbfc; border: 1px solid #f0f2f5;
      }
      .txn-icon {
        width: 40px; height: 40px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0;
      }
      .txn-icon.credit { background: #ecfdf5; color: #059669; }
      .txn-icon.debit { background: #fff7ed; color: #ea580c; }
      .txn-meta { min-width: 0; flex: 1; }
      .txn-meta strong { display: block; font-size: 13px; font-weight: 800; }
      .txn-meta span, .txn-meta em {
        display: block; font-size: 11px; color: #6b7280; font-style: normal;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .txn-amount { font-size: 13px; font-weight: 900; white-space: nowrap; }
      .txn-amount.credit { color: #059669; }
      .txn-amount.debit { color: #ea580c; }
      .state-card {
        text-align: center; padding: 28px 16px; border-radius: 18px; background: #f9fafb;
        color: #6b7280; font-size: 13px; font-weight: 600;
      }
      .load-more {
        width: 100%; margin-top: 12px; height: 42px; border-radius: 14px;
        border: 1px solid #e5e7eb; background: #fff; font-weight: 800; font-size: 13px;
      }
    `,
  ],
})
export class WalletPage implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly toast = inject(ToastController);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly wallet = signal<WalletSummary | null>(null);
  readonly transactions = signal<WalletTransaction[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly toppingUp = signal(false);
  readonly errorMessage = signal('');
  readonly hasMore = signal(false);

  topupAmount: number | null = 500;
  quickAmounts = [200, 500, 1000, 2000];
  private page = 1;

  ngOnInit(): void {
    void this.loadAll();
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/app/home');
  }

  async refresh(event?: RefresherCustomEvent) {
    await this.loadAll(true);
    await event?.target.complete();
  }

  async loadMore() {
    if (this.loadingMore() || !this.hasMore()) return;
    this.loadingMore.set(true);
    try {
      this.page += 1;
      const res = await firstValueFrom(this.walletService.getTransactions(this.page));
      if (res.success && res.data) {
        this.transactions.update((items) => [...items, ...(res.data?.items || [])]);
        this.hasMore.set((res.data.pagination.currentPage || 1) < (res.data.pagination.lastPage || 1));
      }
    } finally {
      this.loadingMore.set(false);
    }
  }

  async topup() {
    const amount = Number(this.topupAmount || 0);
    if (!amount || amount < 1) {
      await this.showToast('Enter a valid amount');
      return;
    }

    this.toppingUp.set(true);
    try {
      const res = await firstValueFrom(this.walletService.topup(amount));
      if (!res.success || !res.data) {
        await this.showToast(res.message || 'Top-up failed');
        return;
      }
      this.wallet.set(res.data.wallet);
      await this.loadTransactions(true);
      await this.showToast(res.message || 'Wallet topped up');
    } catch (err: unknown) {
      const message = (err as { error?: { message?: string } })?.error?.message || 'Top-up failed';
      await this.showToast(message);
    } finally {
      this.toppingUp.set(false);
    }
  }

  formatType(type: string): string {
    return (type || 'transaction').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private async loadAll(silent = false) {
    if (!silent) this.loading.set(true);
    this.errorMessage.set('');
    try {
      const [walletRes] = await Promise.all([
        firstValueFrom(this.walletService.getWallet()),
        this.loadTransactions(true),
      ]);
      if (walletRes.success && walletRes.data) {
        this.wallet.set(walletRes.data);
      } else {
        this.errorMessage.set(walletRes.message || 'Could not load wallet');
      }
    } catch {
      this.errorMessage.set('Could not load wallet');
    } finally {
      this.loading.set(false);
    }
  }

  private async loadTransactions(reset = false) {
    if (reset) this.page = 1;
    const res = await firstValueFrom(this.walletService.getTransactions(this.page));
    if (res.success && res.data) {
      this.transactions.set(res.data.items || []);
      this.hasMore.set((res.data.pagination.currentPage || 1) < (res.data.pagination.lastPage || 1));
    }
  }

  private async showToast(message: string) {
    const toast = await this.toast.create({
      message,
      duration: 2200,
      position: 'bottom',
      color: 'dark',
    });
    await toast.present();
  }
}
