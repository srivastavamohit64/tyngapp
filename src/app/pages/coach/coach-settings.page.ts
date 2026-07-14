import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

interface StatusItem {
  id: string;
  label: string;
  dot: string;
  bg: string;
  desc: string;
}

const STATUSES: StatusItem[] = [
  { id: 'available', label: 'Available', dot: '#22C55E', bg: '#F0FDF4', desc: 'Accepting new bookings' },
  { id: 'busy', label: 'Busy', dot: '#F59E0B', bg: '#FFFBEB', desc: 'Limited availability' },
  { id: 'leave', label: 'On Leave', dot: '#EF4444', bg: '#FEF2F2', desc: 'Not available now' },
  { id: 'offline', label: 'Offline', dot: '#9CA3AF', bg: '#F9FAFB', desc: 'Profile hidden' },
];

@Component({
  selector: 'app-coach-settings',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="settings-page pb-32">
        <!-- Sticky Header -->
        <div class="sticky-header flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
          <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
          <p class="text-[17px] font-black text-[#111827] m-0">Settings</p>
          <button (click)="go('/app/coach/notifications')" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="help-circle-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
        </div>

        <div class="px-4 pt-4 space-y-4">
          <!-- Coach status card -->
          <div class="section-card p-5 text-left bg-white">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-3 h-3 rounded-full" [style.backgroundColor]="getCurrentStatus().dot" [style.boxShadow]="'0 0 8px ' + getCurrentStatus().dot + '60'"></div>
              <div>
                <p class="text-[15px] font-black text-[#111827] m-0">{{ getCurrentStatus().label }}</p>
                <p class="text-[12px] text-[#9CA3AF] m-0">{{ getCurrentStatus().desc }}</p>
              </div>
            </div>

            <!-- Status selector -->
            <div class="grid grid-cols-2 gap-2.5 mb-4">
              <button *ngFor="let s of statuses" (click)="status.set(s.id)" class="status-selector-btn border-none"
                [style.backgroundColor]="status() === s.id ? s.bg : '#F9FAFB'"
                [style.border]="status() === s.id ? '2px solid ' + s.dot : '2px solid #F3F4F6'">
                <div class="w-3 h-3 rounded-full flex-shrink-0" [style.backgroundColor]="s.dot"></div>
                <span class="text-[13px] font-semibold text-[#111827]">{{ s.label }}</span>
                <ion-icon *ngIf="status() === s.id" name="checkmark-outline" class="ml-auto text-[#16A34A] font-bold text-sm"></ion-icon>
              </button>
            </div>

            <!-- Vacation Mode toggle -->
            <div class="border-t border-[#F3F4F6] pt-4">
              <div class="flex items-center justify-between mb-3">
                <div>
                  <p class="text-[14px] font-bold text-[#111827] m-0">Vacation Mode</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 font-medium">Block all bookings for a period</p>
                </div>
                <button (click)="vacationMode.set(!vacationMode())" class="toggle-btn" [class.toggle-on]="vacationMode()">
                  <div class="toggle-thumb" [class.toggle-thumb-on]="vacationMode()"></div>
                </button>
              </div>

              <div *ngIf="vacationMode()" class="space-y-3">
                <div class="grid grid-cols-2 gap-2.5">
                  <div>
                    <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1 m-0 font-bold">Start Date</p>
                    <input type="date" [(ngModel)]="vacStart" class="text-input-field" />
                  </div>
                  <div>
                    <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-1 m-0 font-bold">End Date</p>
                    <input type="date" [(ngModel)]="vacEnd" class="text-input-field" />
                  </div>
                </div>
                <div class="bg-[#FFF7ED] rounded-xl px-3.5 py-2.5">
                  <p class="text-[11px] text-[#C2410C] leading-relaxed m-0 font-bold">
                    Students will not be able to book sessions during this period.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Account Nav rows -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Account</p>
            <div class="space-y-1">
              <button *ngFor="let r of accountRows" (click)="goAccount(r.action)"
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

          <!-- Notifications toggles -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Notifications</p>
            <div class="space-y-1">
              <div *ngFor="let k of notifKeys" class="flex items-center justify-between py-3 border-b border-[#F9FAFB] last:border-none">
                <div class="flex-1 pr-4 min-w-0">
                  <p class="text-[14px] font-bold text-[#111827] m-0">{{ getNotifLabel(k) }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">{{ getNotifSub(k) }}</p>
                </div>
                <button (click)="toggleNotif(k)" class="toggle-btn" [class.toggle-on]="notif[k]">
                  <div class="toggle-thumb" [class.toggle-thumb-on]="notif[k]"></div>
                </button>
              </div>
            </div>
          </div>

          <!-- Booking Preferences (Figma) -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Booking Preferences</p>
            <div class="space-y-1">
              <div *ngFor="let k of bizKeys" class="flex items-center justify-between py-3 border-b border-[#F9FAFB] last:border-none">
                <div class="flex-1 pr-4 min-w-0">
                  <p class="text-[14px] font-bold text-[#111827] m-0">{{ getBizLabel(k) }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">{{ getBizSub(k) }}</p>
                </div>
                <button (click)="toggleBiz(k)" class="toggle-btn" [class.toggle-on]="biz[k]">
                  <div class="toggle-thumb" [class.toggle-thumb-on]="biz[k]"></div>
                </button>
              </div>

              <!-- Max students slider -->
              <div class="pt-4 mt-1 border-t border-[#F9FAFB]">
                <div class="flex justify-between items-center mb-2">
                  <p class="text-[14px] font-bold text-[#111827] m-0">Max Students Per Day</p>
                  <span class="text-[14px] font-black text-[#8CF000]">{{ maxStudents }}</span>
                </div>
                <input type="range" min="1" max="30" [(ngModel)]="maxStudents" class="w-full range-input-slider" />
                <div class="flex justify-between text-[10px] text-[#9CA3AF] mt-1 font-bold"><span>1</span><span>30</span></div>
              </div>

              <!-- Travel radius segments -->
              <div class="pt-4 mt-1 border-t border-[#F9FAFB]">
                <p class="text-[14px] font-bold text-[#111827] mb-3 m-0">Travel Distance Radius</p>
                <div class="flex bg-[#F3F4F6] p-1 rounded-2xl">
                  <button *ngFor="let opt of ['5 km','10 km','20 km','Anywhere']" (click)="travelRadius = opt" class="segment-pill-btn border-none"
                    [style.backgroundColor]="travelRadius === opt ? 'white' : 'transparent'"
                    [style.color]="travelRadius === opt ? '#111827' : '#9CA3AF'">
                    {{ opt }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Coaching Preferences -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Coaching Preferences</p>
            <div class="space-y-1">
              <div *ngFor="let k of coachPrefKeys" class="flex items-center justify-between py-3 border-b border-[#F9FAFB] last:border-none">
                <div class="flex-1 pr-4 min-w-0">
                  <p class="text-[14px] font-bold text-[#111827] m-0">{{ getCoachPrefLabel(k) }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">{{ getCoachPrefSub(k) }}</p>
                </div>
                <button (click)="toggleCoachPref(k)" class="toggle-btn" [class.toggle-on]="coachPrefs[k]">
                  <div class="toggle-thumb" [class.toggle-thumb-on]="coachPrefs[k]"></div>
                </button>
              </div>
            </div>
          </div>

          <!-- Payments rows -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Payments</p>
            <div class="space-y-1">
              <button *ngFor="let r of [{ icon:'business-outline', label:'Manage Bank Account', sub:'HDFC Bank · XXXX 4589', color:'#22C55E' }, { icon:'card-outline', label:'UPI & Payment Methods', sub:'GPay, PhonePe, Paytm', color:'#38BDF8' }, { icon:'receipt-outline', label:'GST Details', sub:'Optional · For compliance', color:'#7C3AED' }, { icon:'analytics-outline', label:'Tax Information', sub:'PAN, TDS settings', color:'#F59E0B' }, { icon:'wallet-outline', label:'Auto Withdraw Settings', sub:'Daily · Weekly · Manual', color:'#FF7A00' }]"
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

          <!-- App Preferences -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">App Preferences</p>
            <div class="space-y-1">
              <div *ngFor="let k of appPrefKeys" class="flex items-center justify-between py-3 border-b border-[#F9FAFB] last:border-none">
                <div class="flex-1 pr-4 min-w-0">
                  <p class="text-[14px] font-bold text-[#111827] m-0">{{ getAppPrefLabel(k) }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">{{ getAppPrefSub(k) }}</p>
                </div>
                <button (click)="toggleAppPref(k)" class="toggle-btn" [class.toggle-on]="appPrefs[k]">
                  <div class="toggle-thumb" [class.toggle-thumb-on]="appPrefs[k]"></div>
                </button>
              </div>
            </div>
            <div class="py-3.5 border-b border-[#F9FAFB]">
              <div class="flex items-center gap-2.5 mb-2.5">
                <div class="w-9 h-9 rounded-xl bg-[#38BDF8]/15 flex items-center justify-center">
                  <ion-icon name="globe-outline" class="text-[#38BDF8] text-base"></ion-icon>
                </div>
                <p class="text-[14px] font-semibold text-[#111827] m-0">App Language</p>
              </div>
              <div class="grid grid-cols-3 gap-2">
                <button *ngFor="let l of ['English','Hindi','Tamil']" (click)="language = l" class="lang-btn border-none"
                  [class.lang-btn--active]="language === l">{{ l }}</button>
              </div>
            </div>
            <div class="pt-3.5">
              <div class="flex items-center gap-2.5 mb-3">
                <div class="w-9 h-9 rounded-xl bg-[#7C3AED]/15 flex items-center justify-center">
                  <ion-icon name="calendar-outline" class="text-[#7C3AED] text-base"></ion-icon>
                </div>
                <p class="text-[14px] font-semibold text-[#111827] m-0">Calendar Sync</p>
              </div>
              <div class="flex bg-[#F3F4F6] p-1 rounded-2xl">
                <button *ngFor="let opt of ['Google Calendar','Apple Calendar','None']" (click)="calSync = opt" class="segment-pill-btn border-none flex-1"
                  [style.backgroundColor]="calSync === opt ? 'white' : 'transparent'"
                  [style.color]="calSync === opt ? '#111827' : '#9CA3AF'"
                  [style.boxShadow]="calSync === opt ? '0 1px 4px rgba(0,0,0,0.08)' : 'none'">
                  {{ opt }}
                </button>
              </div>
            </div>
          </div>

          <!-- Privacy & Security -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Privacy & Security</p>
            <div class="space-y-1">
              <div *ngFor="let k of privacyKeys" class="flex items-center justify-between py-3 border-b border-[#F9FAFB] last:border-none">
                <div class="flex-1 pr-4 min-w-0">
                  <p class="text-[14px] font-bold text-[#111827] m-0">{{ getPrivacyLabel(k) }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">{{ getPrivacySub(k) }}</p>
                </div>
                <button (click)="togglePrivacy(k)" class="toggle-btn" [class.toggle-on]="privacy[k]">
                  <div class="toggle-thumb" [class.toggle-thumb-on]="privacy[k]"></div>
                </button>
              </div>
            </div>
            <div class="pt-4 border-t border-[#F9FAFB] mt-1">
              <p class="text-[13px] font-bold text-[#111827] mb-3 m-0">Profile Visibility</p>
              <div class="grid grid-cols-2 gap-2">
                <button *ngFor="let v of visibilityOptions" (click)="visibility = v" class="visibility-btn border-none"
                  [class.visibility-btn--active]="visibility === v">{{ v }}</button>
              </div>
            </div>
            <button class="nav-row-btn w-full flex items-center gap-3.5 py-3 mt-2 border-none bg-white text-left">
              <div class="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-[#7C3AED]/15">
                <ion-icon name="shield-checkmark-outline" class="text-[#7C3AED] text-base"></ion-icon>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-bold text-[#111827] m-0">Manage Connected Devices</p>
                <p class="text-[11px] text-[#9CA3AF] m-0">2 devices active</p>
              </div>
              <ion-icon name="chevron-forward-outline" class="text-[#D1D5DB] text-sm"></ion-icon>
            </button>
          </div>

          <!-- Connected Accounts -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Connected Accounts</p>
            <div *ngFor="let acc of connectedAccounts" class="flex items-center gap-3 py-3.5 border-b border-[#F9FAFB] last:border-none">
              <div class="w-9 h-9 rounded-xl bg-[#F3F4F6] flex items-center justify-center text-lg">{{ acc.emoji }}</div>
              <div class="flex-1">
                <p class="text-[14px] font-semibold text-[#111827] m-0">{{ acc.label }}</p>
                <p class="text-[11px] m-0" [style.color]="connected[acc.id] ? '#16A34A' : '#9CA3AF'">
                  {{ connected[acc.id] ? '✓ Connected' : 'Not connected' }}
                </p>
              </div>
              <button (click)="toggleConnected(acc.id)" class="connect-btn border-none"
                [class.connect-btn--connected]="connected[acc.id]">
                {{ connected[acc.id] ? 'Disconnect' : 'Connect' }}
              </button>
            </div>
          </div>

          <!-- Help & Support -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Help & Support</p>
            <button *ngFor="let r of helpRows" class="nav-row-btn w-full flex items-center gap-3.5 py-3 border-none bg-white text-left">
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

          <!-- Danger zone -->
          <div class="section-card p-5 bg-white text-left border-red-200 border-2">
            <p class="text-[12px] font-black text-[#EF4444] uppercase tracking-widest mb-4 m-0">Account Actions</p>
            <div class="space-y-3">
              <div *ngIf="showLogout()" class="bg-[#FEF2F2] rounded-2xl p-4 mb-3 border border-red-100">
                <p class="text-[13px] font-bold text-[#111827] mb-1 m-0">Log out of TYNG?</p>
                <p class="text-[11px] text-[#6B7280] mb-3 m-0 font-medium">Your profile and session data will be preserved.</p>
                <div class="flex gap-2 mt-2">
                  <button (click)="showLogout.set(false)" class="flex-1 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] font-bold text-[#111827]">Cancel</button>
                  <button (click)="confirmLogout()" class="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-[12px] font-bold text-white border-none">Log Out</button>
                </div>
              </div>
              <button *ngIf="!showLogout()" (click)="showLogout.set(true)" class="danger-btn w-full flex items-center gap-3.5 py-3 border-none bg-white text-left text-red-500">
                <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center"><ion-icon name="log-out-outline" class="text-red-500"></ion-icon></div>
                <div>
                  <p class="text-[14px] font-bold m-0">Log Out</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">Sign out of your account</p>
                </div>
                <ion-icon name="chevron-forward-outline" class="ml-auto text-red-300"></ion-icon>
              </button>
              <div *ngIf="!showDelete()" class="mt-1">
                <button (click)="showDelete.set(true)" class="danger-btn w-full flex items-center gap-3.5 py-3 border-none bg-white text-left text-red-500">
                  <div class="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center"><ion-icon name="trash-outline" class="text-red-500"></ion-icon></div>
                  <div>
                    <p class="text-[14px] font-bold m-0">Delete Account</p>
                    <p class="text-[11px] text-[#9CA3AF] m-0">Permanently remove your account</p>
                  </div>
                  <ion-icon name="chevron-forward-outline" class="ml-auto text-red-300"></ion-icon>
                </button>
              </div>
              <div *ngIf="showDelete()" class="bg-[#FEF2F2] rounded-2xl p-4 mt-3 border border-red-100">
                <p class="text-[13px] font-bold text-[#111827] mb-1 m-0">Delete Account Permanently?</p>
                <p class="text-[11px] text-[#6B7280] mb-3 m-0 font-medium">This will permanently delete your coach profile, sessions, and payment history.</p>
                <div class="flex gap-2 mt-2">
                  <button (click)="showDelete.set(false)" class="flex-1 py-2.5 rounded-xl bg-white border border-[#E5E7EB] text-[12px] font-bold text-[#111827]">Cancel</button>
                  <button class="flex-1 py-2.5 rounded-xl bg-[#EF4444] text-[12px] font-bold text-white border-none">Delete Forever</button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .settings-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .section-card {
      background: #FFFFFF;
      border-radius: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
      border: 1px solid #F3F4F6;
    }

    .status-selector-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      border-radius: 16px;
      cursor: pointer;
      width: 100%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    }

    .toggle-btn {
      width: 48px; height: 26px;
      border-radius: 999px;
      background: #E5E7EB;
      border: none;
      position: relative;
      cursor: pointer;
      transition: background 0.2s;
    }

    .toggle-on {
      background: #8CF000;
    }

    .toggle-thumb {
      position: absolute;
      top: 3px; left: 3px;
      width: 20px; height: 20px;
      border-radius: 50%;
      background: white;
      box-shadow: 0 1px 4px rgba(0,0,0,0.2);
      transition: transform 0.2s;
    }

    .toggle-thumb-on {
      transform: translateX(22px);
    }

    .text-input-field {
      width: 100%;
      padding: 10px 12px;
      border-radius: 12px;
      border: 2px solid #F3F4F6;
      background: #FAFBFC;
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      outline: none;
      box-sizing: border-box;

      &:focus {
        border-color: #8CF000;
      }
    }

    .nav-row-btn, .danger-btn {
      transition: transform 0.2s;
      cursor: pointer;

      &:active {
        transform: scale(0.98);
      }
    }

    .range-input-slider {
      -webkit-appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background: #E5E7EB;
      outline: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: #8CF000;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
    }

    .segment-pill-btn {
      flex: 1;
      padding: 8px 0;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      transition: all 0.2s;
    }

    .lang-btn {
      padding: 10px 0;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      background: #F3F4F6;
      color: #6B7280;
      cursor: pointer;
    }

    .lang-btn--active {
      background: #8CF000;
      color: #111827;
    }

    .visibility-btn {
      padding: 10px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 700;
      text-align: center;
      background: #F9FAFB;
      color: #6B7280;
      border: 1.5px solid transparent;
      cursor: pointer;
    }

    .visibility-btn--active {
      background: rgba(140, 240, 0, 0.12);
      color: #111827;
      border-color: #8CF000;
    }

    .connect-btn {
      padding: 8px 14px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 700;
      background: linear-gradient(135deg, #8CF000, #A3E635);
      color: #111827;
      cursor: pointer;
    }

    .connect-btn--connected {
      background: #FEF2F2;
      color: #DC2626;
    }
  `]
})
export class CoachSettingsPage {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);

  status = signal('available');
  vacationMode = signal(false);
  vacStart = '';
  vacEnd = '';

  showLogout = signal(false);
  showDelete = signal(false);

  // Notifications map state
  notif: Record<string, boolean> = {
    push: true, chat: true, sessions: true, bookingRequests: true,
    reviews: true, payments: true, achievements: true,
    venuePartnership: false, announcements: true, marketing: false,
  };
  readonly notifKeys = ['push', 'chat', 'sessions', 'bookingRequests', 'reviews', 'payments', 'achievements', 'venuePartnership', 'announcements', 'marketing'];

  // Business map state
  biz: Record<string, boolean> = {
    acceptNewStudents: true, oneOnOne: true, groupSessions: true,
    academySessions: true, trialSessions: true, venuePartnership: true,
    autoAcceptTrial: false,
  };
  readonly bizKeys = ['acceptNewStudents', 'oneOnOne', 'groupSessions', 'academySessions', 'trialSessions', 'venuePartnership', 'autoAcceptTrial'];

  maxStudents = 8;
  travelRadius = '10 km';

  coachPrefs: Record<string, boolean> = {
    showInSearch: true, showOnlineStatus: true, allowMessages: true,
    weekendSessions: true, holidayCamps: false, opportunityAlerts: true,
  };
  readonly coachPrefKeys = ['showInSearch', 'showOnlineStatus', 'allowMessages', 'weekendSessions', 'holidayCamps', 'opportunityAlerts'];

  appPrefs: Record<string, boolean> = {
    darkMode: false, locationPerms: true, cameraPerms: true, micPerms: false,
  };
  readonly appPrefKeys = ['darkMode', 'locationPerms', 'cameraPerms', 'micPerms'];
  language = 'English';
  calSync = 'Google Calendar';

  privacy: Record<string, boolean> = {
    showPhone: false, showEmail: false, allowDMs: true, twoFA: false,
  };
  readonly privacyKeys = ['showPhone', 'showEmail', 'allowDMs', 'twoFA'];
  visibility = 'Everyone';
  readonly visibilityOptions = ['Everyone', 'TYNG Members Only', 'Students Only', 'Hidden'];

  connected: Record<string, boolean> = { google: true, apple: false, whatsapp: true };
  readonly connectedAccounts = [
    { id: 'google', label: 'Google', emoji: '🔵' },
    { id: 'apple', label: 'Apple', emoji: '⚫' },
    { id: 'whatsapp', label: 'WhatsApp', emoji: '🟢' },
  ];
  readonly accountRows = [
    { icon: 'person-outline', label: 'Edit Profile', sub: 'Name, photo, bio, sports', color: '#8CF000', action: 'edit-profile' },
    { icon: 'phone-portrait-outline', label: 'Change Mobile Number', sub: 'Update registered mobile', color: '#FF7A00', action: 'edit-profile' },
    { icon: 'mail-outline', label: 'Change Email Address', sub: 'Update email address', color: '#38BDF8', action: 'edit-profile' },
    { icon: 'lock-closed-outline', label: 'Change Password', sub: 'Update account password', color: '#7C3AED', action: 'change-password' },
  ];

  readonly helpRows = [
    { icon: 'help-circle-outline', label: 'Help Centre', sub: 'Browse articles & guides', color: '#8CF000' },
    { icon: 'help-circle-outline', label: 'Frequently Asked Questions', sub: 'Common coaching queries', color: '#38BDF8' },
    { icon: 'mail-outline', label: 'Contact TYNG Support', sub: 'Response within 24 hours', color: '#FF7A00' },
    { icon: 'shield-checkmark-outline', label: 'Report a Problem', sub: 'Technical issues & bugs', color: '#EF4444' },
    { icon: 'globe-outline', label: 'Feature Requests', sub: 'Suggest improvements', color: '#7C3AED' },
    { icon: 'star-outline', label: 'Rate TYNG', sub: 'Share your feedback', color: '#F59E0B' },
    { icon: 'information-circle-outline', label: 'About TYNG', sub: 'Version 1.0 · Build 2025', color: '#6B7280' },
    { icon: 'document-text-outline', label: 'Privacy Policy', sub: 'How we handle your data', color: '#6B7280' },
    { icon: 'document-text-outline', label: 'Terms & Conditions', sub: 'Usage agreement', color: '#6B7280' },
  ];

  readonly statuses = STATUSES;

  getCurrentStatus(): StatusItem {
    return STATUSES.find(s => s.id === this.status()) || STATUSES[0];
  }

  back() {
    this.router.navigateByUrl('/app/coach/dashboard');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  toggleNotif(key: string) {
    this.notif[key] = !this.notif[key];
  }

  toggleBiz(key: string) {
    this.biz[key] = !this.biz[key];
  }

  toggleCoachPref(key: string) {
    this.coachPrefs[key] = !this.coachPrefs[key];
  }

  toggleAppPref(key: string) {
    this.appPrefs[key] = !this.appPrefs[key];
  }

  togglePrivacy(key: string) {
    this.privacy[key] = !this.privacy[key];
  }

  toggleConnected(id: string) {
    this.connected[id] = !this.connected[id];
  }

  getCoachPrefLabel(key: string): string {
    const labels: Record<string, string> = {
      showInSearch: 'Show Profile in Search', showOnlineStatus: 'Show Online Status',
      allowMessages: 'Allow Student Messages', weekendSessions: 'Available for Weekend Sessions',
      holidayCamps: 'Available for Holiday Camps', opportunityAlerts: 'Receive Coaching Opportunity Alerts',
    };
    return labels[key] ?? key;
  }

  getCoachPrefSub(key: string): string {
    const subs: Record<string, string> = {
      showInSearch: 'Appear in student discovery', showOnlineStatus: 'Let students see when you\'re active',
      allowMessages: 'Students can contact you directly', weekendSessions: 'Sat & Sun coaching slots',
      holidayCamps: 'Intensive vacation programs', opportunityAlerts: 'New local coaching roles',
    };
    return subs[key] ?? '';
  }

  getAppPrefLabel(key: string): string {
    const labels: Record<string, string> = {
      darkMode: 'Dark Mode', locationPerms: 'Location Permissions',
      cameraPerms: 'Camera Permissions', micPerms: 'Microphone Permissions',
    };
    return labels[key] ?? key;
  }

  getAppPrefSub(key: string): string {
    const subs: Record<string, string> = {
      darkMode: 'System setting override', locationPerms: 'Required for nearby features',
      cameraPerms: 'Profile photos & QR scanning', micPerms: 'Voice notes in chat',
    };
    return subs[key] ?? '';
  }

  getPrivacyLabel(key: string): string {
    const labels: Record<string, string> = {
      showPhone: 'Show Phone Number', showEmail: 'Show Email Address',
      allowDMs: 'Allow Direct Messages', twoFA: 'Two-Factor Authentication',
    };
    return labels[key] ?? key;
  }

  getPrivacySub(key: string): string {
    const subs: Record<string, string> = {
      showPhone: 'Visible to students on your profile', showEmail: 'Visible to students on your profile',
      allowDMs: 'Students can message you first', twoFA: 'Secure your account with OTP',
    };
    return subs[key] ?? '';
  }

  getNotifLabel(key: string): string {
    const labels: Record<string, string> = {
      push: 'Push Notifications', chat: 'Chat Notifications', sessions: 'Session & Schedule',
      bookingRequests: 'Booking Requests', reviews: 'Student Reviews', payments: 'Payment Alerts',
      achievements: 'Achievement Notifications', venuePartnership: 'Venue Partnership Updates',
      announcements: 'TYNG Announcements', marketing: 'Marketing & Offers'
    };
    return labels[key] ?? key;
  }

  getNotifSub(key: string): string {
    const subs: Record<string, string> = {
      push: 'All app notifications', chat: 'Messages from students', sessions: 'Reminders and changes',
      bookingRequests: 'New student bookings', reviews: 'When a review is posted', payments: 'Credits and withdrawals',
      achievements: 'Milestones and badges', venuePartnership: 'New collab opportunities',
      announcements: 'Platform updates', marketing: 'Tips and promotions'
    };
    return subs[key] ?? '';
  }

  getBizLabel(key: string): string {
    const labels: Record<string, string> = {
      acceptNewStudents: 'Accept New Students', oneOnOne: 'Accept One-on-One Sessions',
      groupSessions: 'Accept Group Sessions', academySessions: 'Accept Academy Sessions',
      trialSessions: 'Accept Trial Sessions', venuePartnership: 'Accept Venue Partnership Requests',
      autoAcceptTrial: 'Auto-Accept Trial Requests'
    };
    return labels[key] ?? key;
  }

  getBizSub(key: string): string {
    const subs: Record<string, string> = {
      acceptNewStudents: 'Allow new students to book', oneOnOne: 'Private individual coaching',
      groupSessions: 'Multiple students per session', academySessions: 'Institutional coaching',
      trialSessions: 'First-time introductory sessions', venuePartnership: 'Collaboration with venues',
      autoAcceptTrial: 'No manual approval needed'
    };
    return subs[key] ?? '';
  }

  goAccount(action: string) {
    if (action === 'change-password') {
      void this.router.navigateByUrl('/app/change-password');
      return;
    }
    void this.router.navigateByUrl('/app/profile/edit');
  }

  confirmLogout() {
    this.auth.logout().subscribe();
  }
}
