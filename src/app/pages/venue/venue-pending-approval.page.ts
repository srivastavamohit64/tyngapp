import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-venue-pending-approval',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true" class="pending-page">
      <div class="wrap">
        <div class="icon-wrap" [class.declined]="isDeclined()" [class.docs]="isDocsPending()">
          <ion-icon [name]="heroIcon()"></ion-icon>
        </div>

        <h1>{{ title() }}</h1>
        <p class="sub">{{ subtitle() }}</p>

        <div class="card" *ngIf="isDocsPending()">
          <div class="row"><ion-icon name="checkmark-circle"></ion-icon><span>Account approved</span></div>
          <div class="row"><ion-icon name="checkmark-circle"></ion-icon><span>Documents submitted</span></div>
          <div class="row muted"><ion-icon name="ellipse-outline"></ion-icon><span>Status: Pending Approval</span></div>
        </div>

        <div class="card" *ngIf="isAccountPending()">
          <div class="row"><ion-icon name="checkmark-circle"></ion-icon><span>Application submitted</span></div>
          <div class="row muted"><ion-icon name="ellipse-outline"></ion-icon><span>Status: Pending Approval</span></div>
        </div>

        <div class="actions">
          <button *ngIf="isDeclined()" type="button" class="btn primary" (click)="goEditProfile()">
            Update &amp; Resubmit
          </button>
          <button type="button" class="btn ghost" (click)="refreshStatus()" [disabled]="refreshing()">
            {{ refreshing() ? 'Checking…' : 'Refresh status' }}
          </button>
          <button type="button" class="btn outline" (click)="logout()">Log out</button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .pending-page { --background: #FAFBFC; }
    .wrap {
      min-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: calc(48px + var(--safe-area-top)) 24px calc(48px + var(--safe-area-bottom));
      text-align: center;
    }
    .icon-wrap {
      width: 96px; height: 96px; border-radius: 50%;
      background: #FFF7ED; color: #EA580C;
      display: flex; align-items: center; justify-content: center;
      margin-bottom: 20px;
    }
    .icon-wrap.declined { background: #FEF2F2; color: #DC2626; }
    .icon-wrap.docs { background: #EFF6FF; color: #2563EB; }
    .icon-wrap ion-icon { font-size: 48px; }
    h1 { margin: 0 0 10px; font-size: 26px; font-weight: 900; color: #111827; }
    .sub { margin: 0 0 24px; font-size: 14px; line-height: 1.5; color: #6B7280; font-weight: 600; max-width: 360px; }
    .card {
      width: 100%; max-width: 360px; background: #fff; border: 1px solid #F3F4F6;
      border-radius: 20px; padding: 16px 18px; text-align: left; margin-bottom: 24px;
    }
    .row { display: flex; align-items: center; gap: 10px; padding: 8px 0; font-size: 13px; font-weight: 800; color: #111827; }
    .row ion-icon { color: #16A34A; font-size: 18px; }
    .row.muted { color: #9CA3AF; }
    .row.muted ion-icon { color: #F59E0B; }
    .actions { width: 100%; max-width: 360px; display: grid; gap: 10px; }
    .btn {
      height: 48px; border-radius: 16px; border: none; font-size: 15px; font-weight: 800; cursor: pointer;
    }
    .btn.primary { background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to)); color: #111827; }
    .btn.ghost { background: #F3F4F6; color: #111827; }
    .btn.outline { background: transparent; border: 1px solid #E5E7EB; color: #374151; }
  `],
})
export class VenuePendingApprovalPage implements ViewWillEnter {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly refreshing = signal(false);
  readonly user = this.auth.user;

  readonly isDeclined = computed(() => this.user()?.accountStatus === 'declined');
  readonly isAccountPending = computed(() => this.user()?.accountStatus === 'pending');
  readonly isDocsPending = computed(() => this.auth.isVenueDocumentsPending(this.user()));
  readonly reason = computed(() => this.user()?.accountRejectionReason || '');

  readonly title = computed(() => {
    if (this.isDeclined()) return 'Account Declined';
    if (this.isDocsPending()) return 'Documents Under Review';
    return 'Application Submitted';
  });

  readonly subtitle = computed(() => {
    if (this.isDeclined()) {
      const r = this.reason();
      return `Your venue account was declined by admin.${r ? ` Reason: ${r}` : ''} You can update your profile and resubmit for approval.`;
    }
    if (this.isDocsPending()) {
      return 'Your documents are currently being reviewed by our team. You will be able to access the application once all required documents are approved. Status: Pending Document Approval.';
    }
    return 'Your venue application has been submitted successfully. Our team will review your account. You will be notified once your account is approved. Status: Pending Approval.';
  });

  heroIcon(): string {
    if (this.isDeclined()) return 'close-circle-outline';
    if (this.isDocsPending()) return 'document-text-outline';
    return 'time-outline';
  }

  ionViewWillEnter(): void {
    void this.refreshStatus(false);
  }

  async refreshStatus(showBusy = true): Promise<void> {
    if (showBusy) this.refreshing.set(true);
    try {
      const user = await firstValueFrom(this.auth.fetchMe());
      if (this.auth.canAccessVenueApp(user)) {
        void this.router.navigateByUrl('/app/venue/dashboard');
        return;
      }
      if (user.accountStatus === 'incomplete') {
        void this.router.navigateByUrl('/app/venue/complete-profile');
        return;
      }
      if (this.auth.needsVenueDocuments(user)) {
        void this.router.navigateByUrl('/app/venue/dashboard');
      }
    } catch {
      // keep current screen
    } finally {
      this.refreshing.set(false);
    }
  }

  goEditProfile(): void {
    void this.router.navigateByUrl('/app/venue/complete-profile');
  }

  logout(): void {
    void firstValueFrom(this.auth.logout());
  }
}
