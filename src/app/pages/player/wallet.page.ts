import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ActionSheetController, IonicModule, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import {
  GiftCard,
  GiftCardService,
} from '../../core/services/gift-card.service';
import {
  WalletService,
  WalletSummary,
  WalletTransaction,
} from '../../core/services/wallet.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { PageSkeletonComponent, SkeletonListComponent } from '../../shared/components/skeleton';

@Component({
  selector: 'app-wallet-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent, PageHeaderComponent, PageSkeletonComponent, SkeletonListComponent],
  template: `
    <ion-content fullscreen>
      <ion-refresher slot="fixed" (ionRefresh)="refresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-brand-header-shell [showBrand]="false">
        <main class="wallet-page">
          <app-page-header
            [title]="pageTitle()"
            [showBack]="true"
            [showActions]="true"
            (back)="goBack()"
          >
            <button
              actions
              type="button"
              class="header-passbook-btn"
              aria-label="Passbook"
              (click)="openPassbookModal()"
            >
              <ion-icon name="book-outline"></ion-icon>
            </button>
          </app-page-header>

          <div class="wallet-body">
            <app-page-skeleton *ngIf="loading() && !wallet()" variant="wallet" label="Loading wallet"></app-page-skeleton>

            <div *ngIf="!loading() && errorMessage() && !wallet()" class="state-card page-error">
              <p>{{ errorMessage() }}</p>
              <button type="button" class="retry-btn" (click)="loadAll()">Retry</button>
            </div>

            <ng-container *ngIf="wallet() as w">
            <section class="tp-card">
              <div class="tp-top">
                <div class="tp-main">
                  <p class="tp-kicker">TP Points</p>
                  <h2>{{ (w.tpPoints || 0) | number:'1.0-0' }} TP</h2>
                </div>
                <div class="tp-rate">
                  <span>{{ w.tpPointsPerRupee || 5 }} TP = ₹1</span>
                  <strong>Value ₹{{ (w.tpValueInr || 0) | number:'1.0-0' }}</strong>
                </div>
              </div>
              <div class="tp-stats">
                <div><span>Earned</span><strong>+{{ (w.tpEarned || 0) | number:'1.0-0' }}</strong></div>
                <div><span>Redeemed</span><strong>−{{ (w.tpRedeemed || 0) | number:'1.0-0' }}</strong></div>
                <div><span>Expiring</span><strong class="warn">{{ (w.tpExpiring || 0) | number:'1.0-0' }}</strong></div>
              </div>
              <div class="tp-convert">
                <input type="number" [(ngModel)]="convertPoints" min="1" [placeholder]="'Min ' + (w.tpPointsPerRupee || 5) + ' TP'" />
                <button type="button" [disabled]="converting() || !convertPoints" (click)="convertTp()">
                  {{ converting() ? 'Converting…' : 'Convert to wallet' }}
                </button>
              </div>
              <p class="tp-preview" *ngIf="convertPreview() as preview">≈ ₹{{ preview | number:'1.2-2' }} will be added</p>
            </section>

            <section class="balance-card">
              <div class="balance-orb"></div>
              <button type="button" class="balance-topup-btn" (click)="openTopupModal()">
                <ion-icon name="add"></ion-icon>
                <span>topup</span>
              </button>
              <p class="balance-label">Available balance</p>
              <h2 class="balance-value">
                ₹{{ (w.balance || 0) | number:'1.2-2' }}
              </h2>
              <p class="balance-currency">{{ w.currency || 'INR' }}</p>
              <div class="balance-stats">
                <div>
                  <span>Credits</span>
                  <strong>₹{{ (w.totalCredits || 0) | number:'1.0-0' }}</strong>
                </div>
                <div>
                  <span>Debits</span>
                  <strong>₹{{ (w.totalDebits || 0) | number:'1.0-0' }}</strong>
                </div>
              </div>
            </section>

            <section class="gift-card-panel">
              <div class="gift-orb"></div>
              <button
                type="button"
                class="gift-history-btn"
                aria-label="Gift card history"
                (click)="openGiftHistoryModal()"
              >
                <ion-icon name="time-outline"></ion-icon>
                <span>history</span>
              </button>
              <div class="gift-panel-top">
                <div class="gift-panel-main">
                  <p class="gift-kicker">Gift Cards</p>
                  <h2>{{ myGiftCards().length || 0 }} <span>created</span></h2>
                </div>
                <div class="gift-panel-meta">
                  <span>Wallet pay</span>
                  <strong>Share &amp; redeem</strong>
                </div>
              </div>
              <p class="gift-panel-sub">Buy with wallet balance or redeem a code.</p>

              <div class="gift-card-actions">
                <button type="button" class="gift-action create" (click)="openCreateGiftModal()">
                  <ion-icon name="gift-outline"></ion-icon>
                  <span>Create</span>
                </button>
                <button type="button" class="gift-action redeem" (click)="openRedeemGiftModal()">
                  <ion-icon name="ticket-outline"></ion-icon>
                  <span>Redeem</span>
                </button>
              </div>
            </section>
            </ng-container>
          </div>
        </main>
      </app-brand-header-shell>

      <div class="topup-backdrop" *ngIf="showTopupModal()" (click)="closeTopupModal()"></div>
      <div class="topup-popup" *ngIf="showTopupModal()" role="dialog" aria-modal="true" aria-label="Top up wallet">
        <div class="topup-popup-header">
          <div>
            <h3>Top up wallet</h3>
            <p>Simulated payment for now — gateway can be wired later.</p>
          </div>
          <button type="button" class="topup-close" aria-label="Close" (click)="closeTopupModal()">
            <ion-icon name="close"></ion-icon>
          </button>
        </div>
        <div class="quick-amounts">
          <button type="button" *ngFor="let amt of quickAmounts" [class.active]="topupAmount === amt" (click)="topupAmount = amt">
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
      </div>

      <div class="passbook-backdrop" *ngIf="showPassbookModal()" (click)="closePassbookModal()"></div>
      <div class="passbook-sheet" *ngIf="showPassbookModal()" role="dialog" aria-modal="true" aria-label="Passbook">
        <div class="sheet-handle"></div>
        <div class="txn-header">
          <h3>Transactions</h3>
          <div class="txn-header-right">
            <span>{{ transactions().length }} shown</span>
            <button type="button" class="topup-close" aria-label="Close" (click)="closePassbookModal()">
              <ion-icon name="close"></ion-icon>
            </button>
          </div>
        </div>

        <div class="passbook-body">
          <app-skeleton-list *ngIf="loading() && transactions().length === 0" [count]="5"></app-skeleton-list>
          <div *ngIf="!loading() && errorMessage() && transactions().length === 0" class="state-card">{{ errorMessage() }}</div>
          <div *ngIf="!loading() && !errorMessage() && transactions().length === 0" class="state-card">
            No wallet activity yet. Tap topup to get started.
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
        </div>
      </div>

      <div class="gift-backdrop" *ngIf="showCreateGiftModal()" (click)="closeCreateGiftModal()"></div>
      <div class="gift-sheet" *ngIf="showCreateGiftModal()" role="dialog" aria-modal="true" aria-label="Create gift card">
        <div class="sheet-handle"></div>
        <div class="gift-sheet-header">
          <div>
            <h3>Create Gift Card</h3>
            <p>Paid from your wallet balance.</p>
          </div>
          <button type="button" class="topup-close" aria-label="Close" [disabled]="creatingGift()" (click)="closeCreateGiftModal()">
            <ion-icon name="close"></ion-icon>
          </button>
        </div>

        <ng-container *ngIf="!createdGift(); else createSuccessTpl">
          <label class="gift-label">Gift Card Amount</label>
          <div class="quick-amounts gift-amounts">
            <button
              type="button"
              *ngFor="let amt of giftQuickAmounts"
              [class.active]="giftAmount === amt"
              (click)="giftAmount = amt"
            >
              ₹{{ amt }}
            </button>
          </div>
          <input
            type="number"
            class="gift-input"
            [(ngModel)]="giftAmount"
            min="100"
            max="5000"
            placeholder="Enter amount (₹100 – ₹5000)"
          />
          <div class="gift-summary">
            <span>Gift Card Value</span>
            <strong>₹{{ (giftAmount || 0) | number:'1.0-0' }}</strong>
          </div>
          <div class="gift-summary">
            <span>Payment Method</span>
            <strong>Wallet · ₹{{ (wallet()?.balance || 0) | number:'1.2-2' }}</strong>
          </div>
          <p class="gift-error" *ngIf="createGiftError()">{{ createGiftError() }}</p>
          <button
            type="button"
            class="gift-submit"
            [disabled]="creatingGift() || !giftAmount || giftAmount < 100 || giftAmount > 5000"
            (click)="createGiftCard()"
          >
            {{ creatingGift() ? 'Creating…' : 'Create Gift Card' }}
          </button>
        </ng-container>

        <ng-template #createSuccessTpl>
          <div class="gift-success">
            <ion-icon name="checkmark-circle"></ion-icon>
            <h4>Gift Card Created</h4>
            <p>Share this code &amp; PIN with your friend via WhatsApp or any app.</p>
            <div class="gift-secret">
              <div>
                <span>Code</span>
                <strong>{{ createdGift()?.fullCode || createdGift()?.code }}</strong>
              </div>
              <button type="button" class="copy-btn" (click)="copyText(createdGift()?.fullCode || createdGift()?.code || '', 'Code copied')">
                Copy
              </button>
            </div>
            <div class="gift-secret">
              <div>
                <span>PIN</span>
                <strong>{{ createdGift()?.pin }}</strong>
              </div>
              <button type="button" class="copy-btn" (click)="copyText(createdGift()?.pin || '', 'PIN copied')">
                Copy
              </button>
            </div>
            <div class="gift-summary">
              <span>Value</span>
              <strong>₹{{ (createdGift()?.amount || 0) | number:'1.2-2' }}</strong>
            </div>
            <button type="button" class="gift-share-primary" *ngIf="createdGift() as card" (click)="shareGiftCard(card)">
              <ion-icon name="share-social-outline"></ion-icon>
              Share with friend
            </button>
            <button type="button" class="gift-submit" (click)="closeCreateGiftModal()">Done</button>
          </div>
        </ng-template>
      </div>

      <div class="gift-backdrop" *ngIf="showRedeemGiftModal()" (click)="closeRedeemGiftModal()"></div>
      <div class="gift-sheet" *ngIf="showRedeemGiftModal()" role="dialog" aria-modal="true" aria-label="Redeem gift card">
        <div class="sheet-handle"></div>
        <div class="gift-sheet-header">
          <div>
            <h3>Redeem Gift Card</h3>
            <p>Enter code and PIN to add money to wallet.</p>
          </div>
          <button type="button" class="topup-close" aria-label="Close" [disabled]="redeemingGift()" (click)="closeRedeemGiftModal()">
            <ion-icon name="close"></ion-icon>
          </button>
        </div>

        <ng-container *ngIf="!redeemSuccessAmount(); else redeemSuccessTpl">
          <label class="gift-label">Gift Card Code</label>
          <input
            type="text"
            class="gift-input"
            [(ngModel)]="redeemCode"
            placeholder="TYNG-XXXX-XXXX"
            autocomplete="off"
            autocapitalize="characters"
          />
          <label class="gift-label">PIN</label>
          <input
            type="password"
            class="gift-input"
            [(ngModel)]="redeemPin"
            placeholder="Enter PIN"
            maxlength="12"
            autocomplete="off"
          />
          <p class="gift-error" *ngIf="redeemGiftError()">{{ redeemGiftError() }}</p>
          <button
            type="button"
            class="gift-submit"
            [disabled]="redeemingGift() || !redeemCode || !redeemPin"
            (click)="redeemGiftCard()"
          >
            {{ redeemingGift() ? 'Redeeming…' : 'Redeem Gift Card' }}
          </button>
        </ng-container>

        <ng-template #redeemSuccessTpl>
          <div class="gift-success">
            <ion-icon name="checkmark-circle"></ion-icon>
            <h4>Gift Card Redeemed Successfully</h4>
            <p>₹{{ redeemSuccessAmount() | number:'1.2-2' }} has been added to your wallet.</p>
            <button type="button" class="gift-submit" (click)="closeRedeemGiftModal()">Done</button>
          </div>
        </ng-template>
      </div>

      <div class="gift-backdrop" *ngIf="showGiftHistoryModal()" (click)="closeGiftHistoryModal()"></div>
      <div class="gift-sheet gift-history-sheet" *ngIf="showGiftHistoryModal()" role="dialog" aria-modal="true" aria-label="Gift card history">
        <div class="sheet-handle"></div>
        <div class="gift-sheet-header">
          <div>
            <h3>Gift card history</h3>
            <p>Your created gift cards and redemption status.</p>
          </div>
          <button type="button" class="topup-close" aria-label="Close" (click)="closeGiftHistoryModal()">
            <ion-icon name="close"></ion-icon>
          </button>
        </div>

        <div *ngIf="loadingGiftCards()" class="history-skel">
          <app-skeleton-list [count]="3"></app-skeleton-list>
        </div>
        <div *ngIf="!loadingGiftCards() && myGiftCards().length === 0" class="state-card">
          No gift cards created yet.
        </div>

        <div class="history-gift-list" *ngIf="myGiftCards().length">
          <div class="history-gift-item" *ngFor="let card of myGiftCards()">
            <div class="my-gift-main">
              <strong>₹{{ card.amount | number:'1.0-0' }}</strong>
              <span class="my-gift-code">{{ card.fullCode || card.code }}</span>
              <em>
                {{ card.createdAt | date:'mediumDate' }}
                <ng-container *ngIf="card.redeemedAt"> · Redeemed {{ card.redeemedAt | date:'mediumDate' }}</ng-container>
              </em>
            </div>
            <div class="my-gift-side">
              <span class="status-pill light" [attr.data-status]="card.status">
                {{ card.statusLabel || card.status }}
              </span>
              <button
                *ngIf="card.canShare"
                type="button"
                class="share-gift-btn"
                [disabled]="sharingGiftId() === card.id"
                (click)="shareGiftCard(card)"
              >
                <ion-icon name="share-social-outline"></ion-icon>
                {{ sharingGiftId() === card.id ? '…' : 'Share' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      :host { display: block; min-width: 0; }
      .wallet-page {
        min-height: 100%;
        min-width: 0;
        overflow-x: hidden;
        background: #FAFBFC;
        color: #111827;
        padding-bottom: calc(28px + var(--safe-area-bottom));
      }
      .wallet-body {
        display: flex;
        flex-direction: column;
        gap: 14px;
        padding: 8px 16px 0;
        min-width: 0;
        box-sizing: border-box;
      }
      .wallet-body *,
      .wallet-body *::before,
      .wallet-body *::after { box-sizing: border-box; }
      .tp-card, .balance-card, .gift-card-panel {
        width: 100%;
        min-width: 0;
        overflow: hidden;
      }

      .header-passbook-btn {
        width: 40px; height: 40px; border: none; border-radius: 14px;
        background: #f3f4f6; color: #111827;
        display: inline-flex; align-items: center; justify-content: center; padding: 0;
      }
      .header-passbook-btn ion-icon { font-size: 20px; }

      .balance-card {
        position: relative; overflow: hidden; border-radius: 24px; padding: 18px 16px 16px;
        color: #fff !important; background: linear-gradient(135deg, #111827 0%, #1f2937 55%, #ff7a00 140%);
        box-shadow: 0 16px 40px rgba(17,24,39,.22);
      }
      .balance-orb {
        position: absolute; right: -30px; top: -40px; width: 140px; height: 140px; border-radius: 999px;
        background: radial-gradient(circle, rgba(255,154,64,.45), transparent 70%);
        pointer-events: none;
      }
      .balance-topup-btn {
        position: absolute; top: 14px; right: 14px; z-index: 2;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
        min-width: 44px; padding: 6px 8px; border: 1px solid rgba(255,255,255,.22);
        border-radius: 14px; background: rgba(255,255,255,.12); color: #fff;
        backdrop-filter: blur(6px);
      }
      .balance-topup-btn ion-icon { font-size: 22px; line-height: 1; }
      .balance-topup-btn span {
        font-size: 9px; font-weight: 800; letter-spacing: .04em; text-transform: lowercase;
        line-height: 1; color: rgba(255,255,255,.9);
      }
      .balance-label { margin: 0; padding-right: 56px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,.8); letter-spacing: .04em; text-transform: uppercase; }
      .balance-value {
        margin: 8px 0 0; font-size: clamp(28px, 8vw, 36px); font-weight: 900; letter-spacing: -0.03em;
        color: #ffffff !important; line-height: 1.1; overflow-wrap: anywhere;
      }
      .balance-currency { margin: 2px 0 16px; font-size: 12px; font-weight: 700; color: rgba(255,255,255,.75); }
      .balance-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      .balance-stats div {
        background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.08);
        border-radius: 16px; padding: 10px 12px; min-width: 0;
      }
      .balance-stats span { display: block; font-size: 11px; color: rgba(255,255,255,.75); margin-bottom: 4px; }
      .balance-stats strong { font-size: 15px; font-weight: 800; color: #ffffff !important; overflow-wrap: anywhere; }

      .txn-header h3 { margin: 0; font-size: 16px; font-weight: 900; }

      .topup-backdrop {
        position: fixed; inset: 0; z-index: 40;
        background: rgba(17, 24, 39, 0.45);
      }
      .topup-popup {
        position: fixed; left: 16px; right: 16px; top: 50%; z-index: 41;
        transform: translateY(-50%);
        max-width: 28rem; margin: 0 auto;
        background: #fff; border-radius: 24px; padding: 18px 16px 16px;
        box-shadow: 0 20px 48px rgba(17, 24, 39, 0.22);
      }
      .topup-popup-header {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        margin-bottom: 14px;
      }
      .topup-popup-header h3 { margin: 0; font-size: 16px; font-weight: 900; color: #111827; }
      .topup-popup-header p {
        margin: 4px 0 0; color: #6b7280; font-size: 12px; font-weight: 600; line-height: 1.4;
      }
      .topup-close {
        width: 36px; height: 36px; border: none; border-radius: 12px; flex-shrink: 0;
        background: #f3f4f6; color: #111827;
        display: inline-flex; align-items: center; justify-content: center; padding: 0;
      }
      .topup-close ion-icon { font-size: 18px; }
      .quick-amounts { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
      .quick-amounts button {
        width: 100%; height: 40px; border: 1px solid #e5e7eb; background: #f9fafb; border-radius: 12px;
        padding: 0; font-size: 13px; font-weight: 800; color: #111827;
      }
      .quick-amounts button.active { background: #111827; color: #fff; border-color: #111827; }
      .topup-row { display: flex; flex-direction: column; gap: 8px; width: 100%; }
      .topup-row input {
        width: 100%; height: 46px; border-radius: 14px; border: 1px solid #e5e7eb;
        padding: 0 12px; font-size: 14px; font-weight: 700; outline: none;
      }
      .topup-btn {
        width: 100%; height: 46px; border: none; border-radius: 14px; padding: 0 16px;
        background: linear-gradient(135deg,#ff7a00,#ff9a40); color: #fff; font-weight: 900; font-size: 14px;
      }
      .topup-btn:disabled { opacity: .6; }

      .passbook-backdrop {
        position: fixed; inset: 0; z-index: 40;
        background: rgba(17, 24, 39, 0.45);
      }
      .passbook-sheet {
        position: fixed; left: 0; right: 0; bottom: 0; z-index: 41;
        max-width: 28rem; margin: 0 auto;
        max-height: min(88vh, 720px);
        display: flex; flex-direction: column;
        background: #fff; border-radius: 24px 24px 0 0;
        padding: 12px 16px calc(16px + var(--safe-area-bottom));
        box-shadow: 0 -12px 40px rgba(17, 24, 39, 0.18);
      }
      .sheet-handle {
        width: 40px; height: 4px; border-radius: 99px; background: #e5e7eb;
        margin: 0 auto 12px; flex-shrink: 0;
      }
      .passbook-body {
        overflow-y: auto; min-height: 0; flex: 1;
        -webkit-overflow-scrolling: touch;
      }
      .txn-header-right {
        display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      }
      .page-error { margin-top: 0; }
      .retry-btn {
        margin-top: 12px; height: 40px; padding: 0 16px; border: none; border-radius: 12px;
        background: #111827; color: #fff; font-size: 13px; font-weight: 800;
      }

      .txn-header { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 12px; flex-shrink: 0; }
      .txn-header span { font-size: 12px; color: #9ca3af; font-weight: 700; flex-shrink: 0; }
      .txn-list { display: flex; flex-direction: column; gap: 10px; }
      .txn-item {
        display: flex; align-items: center; gap: 12px; padding: 12px;
        border-radius: 18px; background: #fafbfc; border: 1px solid #f0f2f5; min-width: 0;
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
      .txn-amount { font-size: 13px; font-weight: 900; white-space: nowrap; flex-shrink: 0; }
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

      .tp-card {
        border-radius: 24px; padding: 16px; color: #fff;
        background: linear-gradient(160deg, #111827 0%, #1e293b 70%);
      }
      .tp-top { display: flex; justify-content: space-between; gap: 10px; align-items: flex-start; }
      .tp-main { min-width: 0; flex: 1; }
      .tp-kicker { margin: 0; font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #9CA3AF; }
      .tp-top h2 { margin: 6px 0 0; font-size: clamp(24px, 8vw, 28px); font-weight: 900; color: #8cf000; line-height: 1.1; overflow-wrap: anywhere; }
      .tp-rate { flex-shrink: 0; text-align: right; font-size: 11px; font-weight: 700; color: #9CA3AF; }
      .tp-rate strong { display: block; margin-top: 4px; color: #8cf000; font-size: 13px; }
      .tp-stats { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; margin: 14px 0 12px; }
      .tp-stats div { background: rgba(255,255,255,.06); border-radius: 12px; padding: 8px 6px; min-width: 0; text-align: center; }
      .tp-stats span { display: block; font-size: 10px; color: #9CA3AF; font-weight: 700; }
      .tp-stats strong { display: block; font-size: 12px; font-weight: 800; overflow-wrap: anywhere; }
      .tp-stats .warn { color: #FDBA74; }
      .tp-convert { display: flex; flex-direction: column; gap: 8px; width: 100%; }
      .tp-convert input {
        width: 100%; height: 44px; border-radius: 12px; border: 1px solid rgba(255,255,255,.12);
        background: rgba(255,255,255,.08); color: #fff; padding: 0 12px; font-weight: 800;
      }
      .tp-convert input::placeholder { color: rgba(255,255,255,.45); }
      .tp-convert button {
        width: 100%; height: 44px; border: none; border-radius: 12px; padding: 0 14px;
        background: #8cf000; color: #111827; font-weight: 900; font-size: 13px;
      }
      .tp-convert button:disabled { opacity: .6; }
      .tp-preview { margin: 8px 0 0; font-size: 11px; font-weight: 700; color: #9CA3AF; }

      .gift-card-panel {
        position: relative;
        border-radius: 24px; padding: 16px; color: #fff;
        background: linear-gradient(145deg, #111827 0%, #1f2937 58%, #7c2d12 145%);
        box-shadow: 0 16px 40px rgba(17,24,39,.18);
      }
      .gift-orb {
        position: absolute; right: -28px; top: -36px; width: 130px; height: 130px; border-radius: 999px;
        background: radial-gradient(circle, rgba(255,154,64,.4), transparent 72%);
        pointer-events: none;
      }
      .gift-history-btn {
        position: absolute; top: 14px; right: 14px; z-index: 2;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
        min-width: 44px; padding: 6px 8px; border: 1px solid rgba(255,255,255,.22);
        border-radius: 14px; background: rgba(255,255,255,.12); color: #fff;
        backdrop-filter: blur(6px);
      }
      .gift-history-btn ion-icon { font-size: 18px; line-height: 1; }
      .gift-history-btn span {
        font-size: 9px; font-weight: 800; letter-spacing: .04em; text-transform: lowercase;
        line-height: 1; color: rgba(255,255,255,.9);
      }
      .gift-panel-top {
        position: relative; z-index: 1;
        display: flex; justify-content: space-between; gap: 10px; align-items: flex-start;
        padding-right: 58px;
      }
      .gift-panel-main { min-width: 0; flex: 1; }
      .gift-kicker {
        margin: 0; font-size: 11px; font-weight: 800; letter-spacing: .08em;
        text-transform: uppercase; color: #9CA3AF;
      }
      .gift-panel-main h2 {
        margin: 6px 0 0; font-size: clamp(24px, 8vw, 28px); font-weight: 900;
        color: #ff9a40; line-height: 1.1;
      }
      .gift-panel-main h2 span {
        font-size: 14px; font-weight: 800; color: rgba(255,255,255,.72); margin-left: 4px;
      }
      .gift-panel-meta {
        display: none;
      }
      .gift-panel-sub {
        position: relative; z-index: 1;
        margin: 8px 0 0; font-size: 12px; font-weight: 600; color: rgba(255,255,255,.68); line-height: 1.4;
      }
      .gift-card-actions {
        position: relative; z-index: 1;
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px;
      }
      .gift-action {
        display: flex; flex-direction: column; align-items: flex-start; gap: 8px;
        min-height: 72px; padding: 12px; border-radius: 14px;
        border: 1px solid rgba(255,255,255,.1);
        background: rgba(255,255,255,.06); text-align: left; color: #fff;
      }
      .gift-action ion-icon { font-size: 20px; }
      .gift-action span { font-size: 12px; font-weight: 800; line-height: 1.25; }
      .gift-action.create ion-icon { color: #ff9a40; }
      .gift-action.redeem ion-icon { color: #8cf000; }

      .history-gift-list { display: flex; flex-direction: column; gap: 10px; }
      .history-gift-item {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 10px;
        padding: 12px; border-radius: 16px; background: #fafbfc; border: 1px solid #f0f2f5;
      }
      .my-gift-main { min-width: 0; flex: 1; }
      .my-gift-main strong { display: block; font-size: 15px; font-weight: 900; color: #111827; }
      .my-gift-code {
        display: block; margin-top: 2px; font-size: 12px; font-weight: 800; color: #4b5563;
        letter-spacing: .02em; word-break: break-all;
      }
      .my-gift-main em {
        display: block; margin-top: 4px; font-size: 11px; font-style: normal; font-weight: 600;
        color: #9ca3af;
      }
      .my-gift-side {
        display: flex; flex-direction: column; align-items: flex-end; gap: 8px; flex-shrink: 0;
      }
      .status-pill {
        display: inline-flex; align-items: center; height: 22px; padding: 0 8px; border-radius: 999px;
        font-size: 10px; font-weight: 800; text-transform: capitalize;
        background: #f3f4f6; color: #4b5563;
      }
      .status-pill[data-status="active"] { background: #ecfdf5; color: #059669; }
      .status-pill[data-status="redeemed"] { background: #eff6ff; color: #2563eb; }
      .status-pill[data-status="expired"],
      .status-pill[data-status="cancelled"],
      .status-pill[data-status="failed"] { background: #fff7ed; color: #c2410c; }
      .share-gift-btn {
        display: inline-flex; align-items: center; gap: 4px; height: 30px; padding: 0 10px;
        border: none; border-radius: 10px; background: #ff7a00; color: #fff;
        font-size: 11px; font-weight: 800;
      }
      .share-gift-btn:disabled { opacity: .65; }
      .share-gift-btn ion-icon { font-size: 14px; }
      .gift-history-sheet { max-height: min(88vh, 720px); }
      .gift-share-primary {
        width: 100%; height: 46px; border: none; border-radius: 14px; margin-bottom: 8px;
        background: #111827; color: #fff; font-weight: 900; font-size: 14px;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      }
      .gift-share-primary ion-icon { font-size: 18px; }

      .gift-backdrop {
        position: fixed; inset: 0; z-index: 40;
        background: rgba(17, 24, 39, 0.45);
      }
      .gift-sheet {
        position: fixed; left: 0; right: 0; bottom: 0; z-index: 41;
        max-width: 28rem; margin: 0 auto;
        max-height: min(90vh, 760px);
        overflow-y: auto;
        background: #fff; border-radius: 24px 24px 0 0;
        padding: 12px 16px calc(18px + var(--safe-area-bottom));
        box-shadow: 0 -12px 40px rgba(17, 24, 39, 0.18);
        -webkit-overflow-scrolling: touch;
      }
      .gift-sheet-header {
        display: flex; align-items: flex-start; justify-content: space-between; gap: 12px;
        margin-bottom: 14px;
      }
      .gift-sheet-header h3 { margin: 0; font-size: 17px; font-weight: 900; color: #111827; }
      .gift-sheet-header p { margin: 4px 0 0; font-size: 12px; font-weight: 600; color: #6b7280; line-height: 1.4; }
      .gift-label {
        display: block; margin: 0 0 6px; font-size: 12px; font-weight: 800; color: #374151;
      }
      .gift-amounts {
        margin-bottom: 10px;
        grid-template-columns: repeat(3, 1fr);
      }
      .gift-input {
        width: 100%; height: 46px; border-radius: 14px; border: 1px solid #e5e7eb;
        padding: 0 12px; font-size: 14px; font-weight: 700; outline: none; margin-bottom: 12px;
        background: #fff; color: #111827;
      }
      .gift-summary {
        display: flex; justify-content: space-between; align-items: center; gap: 12px;
        padding: 12px; border-radius: 14px; background: #f9fafb; border: 1px solid #f0f2f5;
        margin-bottom: 10px;
      }
      .gift-summary span { font-size: 12px; font-weight: 700; color: #6b7280; }
      .gift-summary strong { font-size: 14px; font-weight: 900; color: #111827; }
      .gift-error {
        margin: 0 0 10px; font-size: 12px; font-weight: 700; color: #dc2626; line-height: 1.4;
      }
      .gift-submit {
        width: 100%; height: 48px; border: none; border-radius: 14px; margin-top: 4px;
        background: linear-gradient(135deg,#ff7a00,#ff9a40); color: #fff; font-weight: 900; font-size: 14px;
      }
      .gift-submit:disabled { opacity: .6; }
      .gift-success { text-align: center; padding: 8px 0 0; }
      .gift-success ion-icon { font-size: 42px; color: #059669; }
      .gift-success h4 { margin: 10px 0 6px; font-size: 17px; font-weight: 900; color: #111827; }
      .gift-success > p { margin: 0 0 14px; font-size: 13px; font-weight: 600; color: #6b7280; line-height: 1.45; }
      .gift-secret {
        display: flex; align-items: center; justify-content: space-between; gap: 10px;
        text-align: left; padding: 12px; border-radius: 14px; background: #111827; color: #fff;
        margin-bottom: 10px;
      }
      .gift-secret span { display: block; font-size: 11px; font-weight: 700; color: rgba(255,255,255,.65); margin-bottom: 4px; }
      .gift-secret strong { font-size: 15px; font-weight: 900; letter-spacing: .03em; word-break: break-all; }
      .copy-btn {
        flex-shrink: 0; height: 34px; padding: 0 12px; border: none; border-radius: 10px;
        background: rgba(255,255,255,.14); color: #fff; font-size: 12px; font-weight: 800;
      }

      @media (min-width: 480px) {
        .tp-convert, .topup-row { flex-direction: row; align-items: stretch; }
        .tp-convert input, .topup-row input { flex: 1; min-width: 0; width: auto; }
        .tp-convert button, .topup-btn { width: auto; flex-shrink: 0; }
        .quick-amounts { grid-template-columns: repeat(4, 1fr); }
      }
    `,
  ],
})
export class WalletPage implements OnInit {
  private readonly walletService = inject(WalletService);
  private readonly giftCardService = inject(GiftCardService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastController);
  private readonly actionSheet = inject(ActionSheetController);
  private readonly location = inject(Location);
  private readonly router = inject(Router);

  readonly wallet = signal<WalletSummary | null>(null);
  readonly transactions = signal<WalletTransaction[]>([]);
  readonly myGiftCards = signal<GiftCard[]>([]);
  readonly loading = signal(true);
  readonly loadingMore = signal(false);
  readonly loadingGiftCards = signal(false);
  readonly toppingUp = signal(false);
  readonly converting = signal(false);
  readonly errorMessage = signal('');
  readonly hasMore = signal(false);
  readonly showTopupModal = signal(false);
  readonly showPassbookModal = signal(false);
  readonly showCreateGiftModal = signal(false);
  readonly showRedeemGiftModal = signal(false);
  readonly showGiftHistoryModal = signal(false);
  readonly creatingGift = signal(false);
  readonly redeemingGift = signal(false);
  readonly sharingGiftId = signal<string | null>(null);
  readonly createGiftError = signal('');
  readonly redeemGiftError = signal('');
  readonly createdGift = signal<GiftCard | null>(null);
  readonly redeemSuccessAmount = signal<number | null>(null);

  topupAmount: number | null = 500;
  giftAmount: number | null = 500;
  convertPoints: number | null = null;
  redeemCode = '';
  redeemPin = '';
  quickAmounts = [200, 500, 1000, 2000];
  giftQuickAmounts = [100, 250, 500, 1000, 2000, 5000];
  private page = 1;

  pageTitle(): string {
    return this.auth.user()?.role === 'venue' ? 'Venue Account' : 'Wallet';
  }

  convertPreview(): number | null {
    const points = Number(this.convertPoints || 0);
    const rate = Number(this.wallet()?.tpPointsPerRupee || 5);
    if (!points || !rate) return null;
    return Math.round((points / rate) * 100) / 100;
  }

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

  openTopupModal(): void {
    this.closeAllModals();
    this.topupAmount = 500;
    this.showTopupModal.set(true);
  }

  closeTopupModal(): void {
    if (this.toppingUp()) return;
    this.showTopupModal.set(false);
  }

  openPassbookModal(): void {
    this.closeAllModals();
    this.showPassbookModal.set(true);
  }

  closePassbookModal(): void {
    this.showPassbookModal.set(false);
  }

  openCreateGiftModal(): void {
    this.closeAllModals();
    this.giftAmount = 500;
    this.createGiftError.set('');
    this.createdGift.set(null);
    this.showCreateGiftModal.set(true);
  }

  closeCreateGiftModal(): void {
    if (this.creatingGift()) return;
    this.showCreateGiftModal.set(false);
    this.createdGift.set(null);
    this.createGiftError.set('');
  }

  openRedeemGiftModal(): void {
    this.closeAllModals();
    this.redeemCode = '';
    this.redeemPin = '';
    this.redeemGiftError.set('');
    this.redeemSuccessAmount.set(null);
    this.showRedeemGiftModal.set(true);
  }

  closeRedeemGiftModal(): void {
    if (this.redeemingGift()) return;
    this.showRedeemGiftModal.set(false);
    this.redeemSuccessAmount.set(null);
    this.redeemGiftError.set('');
  }

  openGiftHistoryModal(): void {
    this.closeAllModals();
    this.showGiftHistoryModal.set(true);
    void this.loadMyGiftCards();
  }

  closeGiftHistoryModal(): void {
    this.showGiftHistoryModal.set(false);
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
      this.showTopupModal.set(false);
      await this.loadTransactions(true);
      await this.showToast(res.message || 'Wallet topped up');
    } catch (err: unknown) {
      await this.showToast(this.apiErrorMessage(err, 'Top-up failed'));
    } finally {
      this.toppingUp.set(false);
    }
  }

  async createGiftCard() {
    const amount = Number(this.giftAmount || 0);
    if (!amount || amount < 100) {
      this.createGiftError.set('Minimum gift card amount is ₹100.');
      return;
    }
    if (amount > 5000) {
      this.createGiftError.set('Maximum gift card amount is ₹5,000.');
      return;
    }
    if (this.creatingGift()) return;

    this.creatingGift.set(true);
    this.createGiftError.set('');
    try {
      const res = await firstValueFrom(this.giftCardService.create(amount));
      if (!res.success || !res.data?.giftCard) {
        this.createGiftError.set(res.message || 'Unable to create gift card.');
        return;
      }
      this.wallet.set(res.data.wallet);
      this.createdGift.set(res.data.giftCard);
      await Promise.all([this.loadTransactions(true), this.loadMyGiftCards()]);
    } catch (err: unknown) {
      this.createGiftError.set(this.apiErrorMessage(err, 'Unable to create gift card.'));
    } finally {
      this.creatingGift.set(false);
    }
  }

  async redeemGiftCard() {
    const code = (this.redeemCode || '').trim();
    const pin = (this.redeemPin || '').trim();
    if (!code || !pin) {
      this.redeemGiftError.set('Enter gift card code and PIN.');
      return;
    }
    if (this.redeemingGift()) return;

    this.redeemingGift.set(true);
    this.redeemGiftError.set('');
    try {
      const res = await firstValueFrom(this.giftCardService.redeem(code, pin));
      if (!res.success || !res.data) {
        this.redeemGiftError.set(res.message || 'Unable to redeem gift card.');
        return;
      }
      this.wallet.set(res.data.wallet);
      this.redeemSuccessAmount.set(Number(res.data.amount || res.data.giftCard?.amount || 0));
      this.redeemCode = '';
      this.redeemPin = '';
      await Promise.all([this.loadTransactions(true), this.loadMyGiftCards()]);
    } catch (err: unknown) {
      this.redeemGiftError.set(this.apiErrorMessage(err, 'Unable to redeem gift card.'));
    } finally {
      this.redeemingGift.set(false);
    }
  }

  async shareGiftCard(card: GiftCard) {
    if (!card?.id) {
      await this.showToast('Gift card unavailable');
      return;
    }
    if (card.status !== 'active' && !card.canShare && !card.pin) {
      await this.showToast('Only active gift cards can be shared');
      return;
    }
    if (this.sharingGiftId()) return;

    this.sharingGiftId.set(card.id);
    try {
      let shareCard = card;
      let pin = (card.pin || '').trim();
      let code = (card.fullCode || card.code || '').trim();

      // Always resolve via share API so older cards without stored PIN still work.
      const res = await firstValueFrom(this.giftCardService.shareDetails(card.id));
      if (!res.success || !res.data) {
        await this.showToast(res.message || 'Unable to prepare gift card for sharing');
        return;
      }
      shareCard = {
        ...card,
        ...res.data.giftCard,
        fullCode: res.data.code || res.data.giftCard?.fullCode || res.data.giftCard?.code,
        pin: res.data.pin || res.data.giftCard?.pin,
      };
      pin = (shareCard.pin || '').trim();
      code = (shareCard.fullCode || shareCard.code || '').trim();

      if (!code || !pin) {
        await this.showToast('Unable to prepare gift card for sharing');
        return;
      }

      // Keep local history list in sync after PIN backfill.
      this.myGiftCards.update((items) =>
        items.map((item) => (item.id === shareCard.id ? { ...item, ...shareCard, canShare: true } : item))
      );
      if (this.createdGift()?.id === shareCard.id) {
        this.createdGift.set({ ...this.createdGift()!, ...shareCard });
      }

      const text = this.buildGiftShareText(shareCard);
      const sheet = await this.actionSheet.create({
        header: 'Share gift card',
        buttons: [
          {
            text: 'WhatsApp',
            icon: 'logo-whatsapp',
            handler: () => {
              void this.openWhatsAppShare(text);
            },
          },
          {
            text: 'More apps',
            icon: 'share-social-outline',
            handler: () => {
              void this.openNativeShare(text);
            },
          },
          {
            text: 'Copy message',
            icon: 'copy-outline',
            handler: () => {
              void this.copyText(text, 'Gift card message copied');
            },
          },
          { text: 'Cancel', role: 'cancel' },
        ],
      });
      await sheet.present();
    } catch (err: unknown) {
      await this.showToast(this.apiErrorMessage(err, 'Unable to share gift card'));
    } finally {
      this.sharingGiftId.set(null);
    }
  }

  async copyText(value: string, successMessage: string) {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      await this.showToast(successMessage);
    } catch {
      await this.showToast('Could not copy. Please copy manually.');
    }
  }

  async convertTp() {
    const points = Number(this.convertPoints || 0);
    const rate = Number(this.wallet()?.tpPointsPerRupee || 5);
    if (!points || points < rate) {
      await this.showToast(`Enter at least ${rate} TP to convert`);
      return;
    }
    this.converting.set(true);
    try {
      const res = await firstValueFrom(this.walletService.convertTp(points));
      if (!res.success || !res.data) {
        await this.showToast(res.message || 'Conversion failed');
        return;
      }
      this.wallet.set(res.data.wallet);
      this.convertPoints = null;
      await this.loadTransactions(true);
      this.auth.fetchMe().subscribe();
      await this.showToast(res.message || 'TP converted to wallet');
    } catch (err: unknown) {
      await this.showToast(this.apiErrorMessage(err, 'Conversion failed'));
    } finally {
      this.converting.set(false);
    }
  }

  formatType(type: string): string {
    return (type || 'transaction').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private closeAllModals(): void {
    this.showTopupModal.set(false);
    this.showPassbookModal.set(false);
    this.showCreateGiftModal.set(false);
    this.showRedeemGiftModal.set(false);
    this.showGiftHistoryModal.set(false);
  }

  private buildGiftShareText(card: GiftCard): string {
    const code = card.fullCode || card.code;
    const amount = Number(card.amount || 0).toLocaleString('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
    return [
      "You've received a TYNG Gift Card!",
      '',
      `Amount: ₹${amount}`,
      `Code: ${code}`,
      `PIN: ${card.pin}`,
      '',
      'Redeem in the TYNG app → Wallet → Redeem Gift Card',
    ].join('\n');
  }

  private async openWhatsAppShare(text: string) {
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  }

  private async openNativeShare(text: string) {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'TYNG Gift Card',
          text,
        });
        return;
      }
      await this.openWhatsAppShare(text);
    } catch (err: unknown) {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') return;
      await this.copyText(text, 'Gift card message copied');
    }
  }

  private apiErrorMessage(err: unknown, fallback: string): string {
    const message = (err as { error?: { message?: string } })?.error?.message;
    return message || fallback;
  }

  async loadAll(silent = false) {
    if (!silent) this.loading.set(true);
    this.errorMessage.set('');
    try {
      const [walletRes] = await Promise.all([
        firstValueFrom(this.walletService.getWallet()),
        this.loadTransactions(true),
        this.loadMyGiftCards(),
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

  private async loadMyGiftCards() {
    this.loadingGiftCards.set(true);
    try {
      const res = await firstValueFrom(this.giftCardService.list(1, 50, 'created'));
      if (res.success && res.data) {
        this.myGiftCards.set(res.data.items || []);
      }
    } catch {
      // Keep previous list; wallet page can still function.
    } finally {
      this.loadingGiftCards.set(false);
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
