import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

interface SettingsRow {
  icon: string;
  label: string;
  sub: string;
  color: string;
  path: string;
}

interface SettingsSection {
  title: string;
  rows: SettingsRow[];
}

@Component({
  selector: 'app-coach-settings',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-brand-header-shell title="Settings">
      <div class="settings-page pb-32">

        <div class="px-4 pt-4 space-y-4">
          <button type="button" (click)="go('/app/coach/profile')" class="section-card profile-card w-full p-5 flex items-center gap-4 text-left border-none">
            <img *ngIf="user()?.profileImage; else initials" [src]="user()?.profileImage" [alt]="user()?.name" class="w-14 h-14 rounded-2xl object-cover flex-shrink-0" />
            <ng-template #initials>
              <span class="w-14 h-14 rounded-2xl bg-[#F3F4F6] flex items-center justify-center text-[20px] font-black text-[#111827] flex-shrink-0">{{ initial() }}</span>
            </ng-template>
            <div class="flex-1 min-w-0">
              <p class="text-[16px] font-black text-[#111827] m-0 truncate">{{ user()?.name || 'Coach' }}</p>
              <p class="text-[12px] text-[#9CA3AF] m-0 truncate">{{ user()?.email || user()?.phone || 'Coach account' }}</p>
              <div class="flex items-center gap-2 mt-1.5">
                <span class="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="user()?.coachVerified ? '#F0FDF4' : '#F3F4F6'"
                  [style.color]="user()?.coachVerified ? '#16A34A' : '#6B7280'">
                  {{ user()?.coachVerified ? 'Verified coach' : 'Not verified yet' }}
                </span>
                <span *ngIf="(user()?.profileCompletion ?? 100) < 100" class="text-[11px] font-bold text-[#C2410C]">Profile {{ user()?.profileCompletion }}% complete</span>
              </div>
            </div>
            <ion-icon name="chevron-forward-outline" class="text-[#D1D5DB] text-sm"></ion-icon>
          </button>

          <div *ngFor="let section of sections" class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">{{ section.title }}</p>
            <div class="space-y-1">
              <button *ngFor="let r of section.rows" type="button" (click)="go(r.path)"
                class="nav-row-btn w-full flex items-center gap-3.5 py-3 border-none bg-white text-left">
                <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" [style.backgroundColor]="r.color + '15'">
                  <ion-icon [name]="r.icon" [style.color]="r.color" class="text-base"></ion-icon>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-[14px] font-bold text-[#111827] m-0">{{ r.label }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">{{ r.sub }}</p>
                </div>
                <ion-icon name="chevron-forward-outline" class="text-[#D1D5DB] text-sm"></ion-icon>
              </button>
            </div>
          </div>

          <div class="section-card p-5 bg-white text-left border-red-200 border-2">
            <p class="text-[12px] font-black text-[#EF4444] uppercase tracking-widest mb-4 m-0">Account Actions</p>
            <div *ngIf="showLogout()" class="bg-[#FEF2F2] rounded-2xl p-4 border border-red-100">
              <p class="text-[13px] font-bold text-[#111827] mb-1 m-0">Log out of TYNG?</p>
              <p class="text-[11px] text-[#6B7280] mb-3 m-0 font-medium">Your profile and session data will be preserved.</p>
              <div class="flex gap-2 mt-2">
                <button type="button" (click)="showLogout.set(false)" class="flex-1 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] font-bold text-[#111827]">Cancel</button>
                <button type="button" (click)="confirmLogout()" class="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-[12px] font-bold text-white border-none">Log Out</button>
              </div>
            </div>
            <button *ngIf="!showLogout()" type="button" (click)="showLogout.set(true)" class="danger-btn w-full flex items-center gap-3.5 py-3 border-none bg-white text-left text-red-500">
              <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center"><ion-icon name="log-out-outline" class="text-red-500"></ion-icon></div>
              <div>
                <p class="text-[14px] font-bold m-0">Log Out</p>
                <p class="text-[11px] text-[#9CA3AF] m-0">Sign out of your account</p>
              </div>
              <ion-icon name="chevron-forward-outline" class="ml-auto text-red-300"></ion-icon>
            </button>
          </div>
        </div>

      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .settings-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .section-card {
      background: #FFFFFF;
      border-radius: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
      border: 1px solid #F3F4F6;
    }

    .nav-row-btn, .danger-btn, .profile-card {
      transition: transform 0.2s;
      cursor: pointer;

      &:active {
        transform: scale(0.98);
      }
    }
  `]
})
export class CoachSettingsPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  readonly user = this.auth.user;
  readonly showLogout = signal(false);

  readonly sections: SettingsSection[] = [
    {
      title: 'Account',
      rows: [
        { icon: 'person-outline', label: 'Edit Profile', sub: 'Name, photo, mobile and email', color: '#16A34A', path: '/app/profile/edit' },
        { icon: 'clipboard-outline', label: 'Coaching Profile', sub: 'Sports, experience, pricing and documents', color: '#FF7A00', path: '/app/coach/complete-profile' },
        { icon: 'lock-closed-outline', label: 'Change Password', sub: 'Update account password', color: '#7C3AED', path: '/app/change-password' },
      ],
    },
    {
      title: 'Coaching & Payments',
      rows: [
        { icon: 'calendar-outline', label: 'Schedule', sub: 'Your sessions and availability', color: '#0EA5E9', path: '/app/coach/schedule' },
        { icon: 'stats-chart-outline', label: 'Earnings', sub: 'Revenue, payouts and venue collaborations', color: '#22C55E', path: '/app/coach/earnings' },
        { icon: 'wallet-outline', label: 'Wallet', sub: 'Balance, transactions and withdrawals', color: '#F59E0B', path: '/app/wallet' },
      ],
    },
    {
      title: 'Notifications & Privacy',
      rows: [
        { icon: 'notifications-outline', label: 'Notifications', sub: 'Choose which alerts you receive', color: '#38BDF8', path: '/app/settings/notifications' },
        { icon: 'ban-outline', label: 'Blocked Users', sub: 'People you have blocked', color: '#EF4444', path: '/app/blocked-users' },
      ],
    },
    {
      title: 'Legal',
      rows: [
        { icon: 'shield-checkmark-outline', label: 'Privacy Policy', sub: 'How we use and protect your data', color: '#6B7280', path: '/app/legal/privacy-policy' },
        { icon: 'document-text-outline', label: 'Terms & Conditions', sub: 'Rules for using TYNG', color: '#6B7280', path: '/app/legal/terms-conditions' },
      ],
    },
  ];

  initial(): string {
    return (this.user()?.name || 'C').trim().charAt(0).toUpperCase();
  }

  go(path: string) {
    void this.router.navigateByUrl(path);
  }

  confirmLogout() {
    this.auth.logout().subscribe();
  }
}
