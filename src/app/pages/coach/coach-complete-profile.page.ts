import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { AuthService } from '../../core/services/auth.service';

const LANGUAGES = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Punjabi','Marathi','Gujarati','Bengali','Other'];
const LOCATIONS = ['Sports Academy','Sports Club','School','Private Turf',"Player's Venue",'Home Coaching','Public Grounds','Indoor Courts'];
const RADII = ['5 km','10 km','20 km','Anywhere'];
const SESSION_TYPES = ['Individual Coaching','Group Sessions','Academy Training','Corporate Wellness','School Coaching','Weekend Camps','Holiday Camps'];
const EQUIPMENT = ['Balls','Racquets','Training Cones','Training Kit','Fitness Equipment','Shuttlecocks','Nets','Protective Gear','Water','Other'];
const TRIAL_OPTS = ['Free Trial','30-Min Trial','Discounted First Session','Custom Price'];
const TRAVEL_OPTS = [
  { id:'player', label:'Player Comes to Me', emoji:'🏟' },
  { id:'i-travel',label:'I Travel to Players', emoji:'🚗' },
  { id:'both',    label:'Both',               emoji:'↔️' },
];
const DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const TIMES = ['Morning','Afternoon','Evening','Night'];
const ACHIEVEMENTS = ['District Level','State Level','National Level','International Level','Former Professional Player','Current Professional Coach','Other'];

const ALL_SECTIONS = [
  'languages','locations','sessions','equipment','trial',
  'travel','availability','fees','bio','achievements','gallery','verification',
];

@Component({
  selector: 'app-coach-complete-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <!-- SUCCESS SCREEN -->
      <div *ngIf="showDone()" class="done-shell px-6">
        <div class="mb-6 flex flex-col items-center">
          <div class="text-7xl mb-4">🎉</div>
          <h1 class="text-[28px] font-black text-[#111827] leading-tight mb-3 text-center">
            Your Coach Profile<br />is Ready!
          </h1>
          <p class="text-[14px] text-[#9CA3AF] leading-relaxed text-center">
            Players can now discover your profile and start booking coaching sessions.
          </p>
        </div>

        <div class="w-full max-w-sm space-y-2.5 mb-8">
          <div *ngFor="let r of [{ ok:true, label:'Profile Complete', color:'#16A34A' }, { ok:true, label:'Eligible for Bookings', color:'#16A34A' }, { ok:false, label:'Verified Coach — Pending Approval', color:'#1D4ED8' }]"
            class="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
            <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
              [style.backgroundColor]="r.ok ? '#F0FDF4' : '#EFF6FF'">
              <ion-icon name="checkmark-outline" [style.color]="r.color" style="font-size:12px;font-weight:bold;"></ion-icon>
            </div>
            <p class="text-[13px] font-semibold text-[#111827]">{{ r.label }}</p>
          </div>
        </div>

        <div class="w-full max-w-sm space-y-3">
          <button (click)="finishOnboarding()" class="btn-orange-gradient w-full h-14 rounded-[24px] text-[16px] font-black text-white">
            Go to Coach Dashboard
          </button>
          <button (click)="back()" class="w-full h-12 rounded-[24px] text-[14px] font-bold text-[#6B7280] bg-white border-none shadow-sm">
            Preview My Profile
          </button>
        </div>
      </div>

      <!-- FORM SCREEN -->
      <div *ngIf="!showDone()" class="profile-complete-page">

        <!-- Header -->
        <div class="sticky-header">
          <div class="flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
            <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[15px] font-black text-[#111827]">Complete Your Profile</p>
            </div>
            <button *ngIf="getProgress() < 100" (click)="back()" class="text-[13px] font-semibold text-[#9CA3AF] bg-transparent border-none">Skip</button>
            <div *ngIf="getProgress() >= 100" class="w-10"></div>
          </div>

          <!-- Progress bar info -->
          <div class="px-5 pb-4 pt-2 bg-white">
            <div class="flex items-center justify-between mb-2">
              <span class="text-[13px] font-black text-[#111827]">{{ getProgress() }}% Complete</span>
              <span class="text-[11px] text-[#9CA3AF] font-bold">{{ getCompletedCount() }}/{{ allSections.length }} sections</span>
            </div>
            <div class="h-2.5 bg-[#F3F4F6] rounded-full overflow-hidden">
              <div class="h-full rounded-full" [style.width]="getProgress() + '%'" style="background: linear-gradient(90deg,#8CF000 0%,#A3E635 100%)"></div>
            </div>
            <p class="text-[11px] text-[#9CA3AF] mt-1.5 leading-relaxed">
              Complete your profile to unlock bookings, earn your Verified Coach badge and improve your visibility.
            </p>
          </div>
        </div>

        <div class="px-4 pt-4 space-y-3">

          <!-- 1. Languages -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'languages'" [class.section-done]="isDone('languages')">
            <button (click)="toggleSection('languages')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('languages') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('languages')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('languages')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Languages Spoken</p>
                  <p *ngIf="isDone('languages')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left truncate max-w-[200px]">{{ langs.join(', ') }}</p>
                  <p *ngIf="!isDone('languages') && expandedSection() !== 'languages'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Help players communicate with you.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'languages' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'languages'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Help players communicate with you.</p>
              <div class="chips-grid">
                <button *ngFor="let l of languageOptions" class="chip-btn" [class.chip-active]="langs.includes(l)" (click)="toggleLang(l)">
                  <ion-icon *ngIf="langs.includes(l)" name="checkmark-outline" style="font-size:10px;margin-right:2px;"></ion-icon>
                  {{ l }}
                </button>
              </div>
              <button (click)="finishSection('locations')" [disabled]="!isDone('languages')" class="next-step-btn w-full h-11 mt-4">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 2. Coaching Locations -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'locations'" [class.section-done]="isDone('locations')">
            <button (click)="toggleSection('locations')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('locations') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('locations')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('locations')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Where do you coach?</p>
                  <p *ngIf="isDone('locations')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left truncate max-w-[200px]">{{ locs.join(', ') }}</p>
                  <p *ngIf="!isDone('locations') && expandedSection() !== 'locations'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Select all that apply.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'locations' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'locations'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Select all that apply.</p>
              <div class="chips-grid mb-4">
                <button *ngFor="let l of locationOptions" class="chip-btn" [class.chip-active]="locs.includes(l)" (click)="toggleLoc(l)">
                  {{ l }}
                </button>
              </div>
              <p class="text-[11px] font-black text-[#111827] uppercase tracking-wider mb-2">Travel Radius</p>
              <div class="flex gap-2">
                <button *ngFor="let r of radiusOptions" class="flex-1 py-2.5 rounded-xl text-[12px] font-bold transition-all border-none"
                  [style.backgroundColor]="radius === r ? '#8CF000' : '#F3F4F6'"
                  [style.color]="radius === r ? '#111827' : '#6B7280'"
                  (click)="radius = r">
                  {{ r }}
                </button>
              </div>
              <button (click)="finishSection('sessions')" [disabled]="!isDone('locations')" class="next-step-btn w-full h-11 mt-4">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 3. Session Types -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'sessions'" [class.section-done]="isDone('sessions')">
            <button (click)="toggleSection('sessions')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('sessions') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('sessions')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('sessions')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Training Formats</p>
                  <p *ngIf="isDone('sessions')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left truncate max-w-[200px]">{{ sessions.join(', ') }}</p>
                  <p *ngIf="!isDone('sessions') && expandedSection() !== 'sessions'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Choose all formats that apply.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'sessions' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'sessions'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Choose all coaching formats that apply.</p>
              <div class="chips-grid">
                <button *ngFor="let s of sessionTypeOptions" class="chip-btn" [class.chip-active]="sessions.includes(s)" (click)="toggleSessionType(s)">
                  {{ s }}
                </button>
              </div>
              <button (click)="finishSection('equipment')" [disabled]="!isDone('sessions')" class="next-step-btn w-full h-11 mt-4">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 4. Equipment -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'equipment'" [class.section-done]="isDone('equipment')">
            <button (click)="toggleSection('equipment')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('equipment') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('equipment')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('equipment')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Equipment Available</p>
                  <p *ngIf="isDone('equipment')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left truncate max-w-[200px]">{{ equip.join(', ') }}</p>
                  <p *ngIf="!isDone('equipment') && expandedSection() !== 'equipment'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">What do you provide?</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'equipment' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'equipment'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">What do you bring or provide?</p>
              <div class="chips-grid">
                <button *ngFor="let e of equipmentOptions" class="chip-btn" [class.chip-active]="equip.includes(e)" (click)="toggleEquip(e)">
                  {{ e }}
                </button>
              </div>
              <button (click)="finishSection('trial')" [disabled]="!isDone('equipment')" class="next-step-btn w-full h-11 mt-4">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 5. Trial Session -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'trial'" [class.section-done]="isDone('trial')">
            <button (click)="toggleSection('trial')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('trial') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('trial')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('trial')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Offer a Trial Session</p>
                  <p *ngIf="isDone('trial')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">{{ trialOn ? trialType : 'Not Offered' }}</p>
                  <p *ngIf="!isDone('trial') && expandedSection() !== 'trial'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Attract players with a trial offer.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'trial' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'trial'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Attract new players with a trial offer.</p>
              <div class="flex gap-3 mb-4">
                <button (click)="trialOn = true" class="flex-1 py-3 rounded-2xl text-[14px] font-black border-none"
                  [style.backgroundColor]="trialOn === true ? 'rgba(140,240,0,0.12)' : '#F3F4F6'"
                  [style.color]="trialOn === true ? '#111827' : '#6B7280'"
                  [style.border]="trialOn === true ? '2px solid #8CF000' : '2px solid transparent'">
                  Yes, I offer trials
                </button>
                <button (click)="trialOn = false; trialType = ''" class="flex-1 py-3 rounded-2xl text-[14px] font-black border-none"
                  [style.backgroundColor]="trialOn === false ? '#FEF2F2' : '#F3F4F6'"
                  [style.color]="trialOn === false ? '#DC2626' : '#6B7280'"
                  [style.border]="trialOn === false ? '2px solid #FCA5A5' : '2px solid transparent'">
                  No, I don't
                </button>
              </div>
              <div *ngIf="trialOn === true" class="chips-grid mb-3">
                <button *ngFor="let t of trialOptions" class="chip-btn" [class.chip-active]="trialType === t" (click)="trialType = t">
                  {{ t }}
                </button>
              </div>
              <button (click)="finishSection('travel')" [disabled]="!isDone('trial')" class="next-step-btn w-full h-11 mt-4">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 6. Travel Preference -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'travel'" [class.section-done]="isDone('travel')">
            <button (click)="toggleSection('travel')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('travel') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('travel')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('travel')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">How do you conduct sessions?</p>
                  <p *ngIf="isDone('travel')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">{{ travel === 'player' ? 'Player comes to me' : travel === 'i-travel' ? 'I travel to players' : 'Both' }}</p>
                  <p *ngIf="!isDone('travel') && expandedSection() !== 'travel'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Choose your arrangements.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'travel' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'travel'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Choose your preferred arrangements.</p>
              <div class="space-y-3">
                <button *ngFor="let opt of travelOptions" class="w-full flex items-center gap-4 px-5 py-4 rounded-[20px] bg-white border border-[#F3F4F6] text-left shadow-sm hover:border-[#8CF000]"
                  [style.borderColor]="travel === opt.id ? '#8CF000' : '#F3F4F6'"
                  [style.backgroundColor]="travel === opt.id ? 'rgba(140,240,0,0.08)' : 'white'"
                  (click)="travel = opt.id">
                  <span class="text-2xl">{{ opt.emoji }}</span>
                  <p class="flex-1 text-[14px] font-bold text-[#111827]">{{ opt.label }}</p>
                  <div *ngIf="travel === opt.id" class="w-5 h-5 rounded-full bg-[#8CF000] flex items-center justify-center">
                    <ion-icon name="checkmark-outline" style="font-size:11px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                </button>
              </div>
              <button (click)="finishSection('availability')" [disabled]="!isDone('travel')" class="next-step-btn w-full h-11 mt-4">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 7. Availability -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'availability'" [class.section-done]="isDone('availability')">
            <button (click)="toggleSection('availability')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('availability') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('availability')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('availability')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Weekly Availability</p>
                  <p *ngIf="isDone('availability')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">{{ getSelectedDaysCount() }} days selected</p>
                  <p *ngIf="!isDone('availability') && expandedSection() !== 'availability'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Select coaching slot timings.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'availability' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'availability'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Select times you're available to coach.</p>
              <div class="space-y-3">
                <div *ngFor="let day of daysOptions" class="flex items-center gap-2">
                  <span class="text-[11px] font-black text-[#6B7280] w-8">{{ day }}</span>
                  <div class="flex gap-1.5 flex-1">
                    <button *ngFor="let time of timeOptions" class="flex-1 py-1.5 rounded-xl text-[9px] font-bold border-none"
                      [style.backgroundColor]="isAvail(day, time) ? '#8CF000' : '#F3F4F6'"
                      [style.color]="isAvail(day, time) ? '#111827' : '#9CA3AF'"
                      (click)="toggleAvail(day, time)">
                      {{ time.slice(0,3) }}
                    </button>
                  </div>
                </div>
              </div>
              <button (click)="finishSection('fees')" [disabled]="!isDone('availability')" class="next-step-btn w-full h-11 mt-4">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 8. Pricing -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'fees'" [class.section-done]="isDone('fees')">
            <button (click)="toggleSection('fees')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('fees') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('fees')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('fees')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Pricing</p>
                  <p *ngIf="isDone('fees')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Individual: ₹{{ fees.individual || '0' }}/session</p>
                  <p *ngIf="!isDone('fees') && expandedSection() !== 'fees'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Set your coaching rates.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'fees' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'fees'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Set your coaching rates. You can update these anytime.</p>
              <div class="space-y-3 mb-3">
                <div *ngFor="let rate of [{ label:'Individual Session', key:'individual', placeholder:'Enter amount' }, { label:'Group Session', key:'group', placeholder:'Enter amount' }, { label:'Monthly Package', key:'monthly', placeholder:'Enter amount' }]"
                  class="bg-[#F9FAFB] rounded-2xl px-4 py-3 border border-[#F3F4F6]">
                  <p class="text-[11px] text-[#9CA3AF] mb-1">{{ rate.label }}</p>
                  <div class="flex items-center gap-2">
                    <span class="text-[18px] font-bold text-[#6B7280]">₹</span>
                    <input type="number" [placeholder]="rate.placeholder" [(ngModel)]="fees[rate.key]"
                      class="flex-1 bg-transparent text-[18px] font-black text-[#111827] focus:outline-none min-h-0 border-none outline-none" />
                  </div>
                </div>
              </div>
              <div class="flex items-center justify-between bg-[#F9FAFB] rounded-2xl px-4 py-3">
                <p class="text-[13px] font-semibold text-[#111827]">Negotiable Pricing</p>
                <button (click)="negotiable = !negotiable" class="toggle-btn" [class.toggle-on]="negotiable">
                  <div class="toggle-thumb" [class.toggle-thumb-on]="negotiable"></div>
                </button>
              </div>
              <button (click)="finishSection('bio')" [disabled]="!isDone('fees')" class="next-step-btn w-full h-11 mt-4">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 9. Bio -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'bio'" [class.section-done]="isDone('bio')">
            <button (click)="toggleSection('bio')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('bio') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('bio')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('bio')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Coach Bio</p>
                  <p *ngIf="isDone('bio')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left truncate max-w-[200px]">{{ bio }}</p>
                  <p *ngIf="!isDone('bio') && expandedSection() !== 'bio'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Tell players about your philosophy.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'bio' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'bio'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Tell players about your coaching philosophy.</p>
              <div class="relative">
                <textarea maxLength="250" rows="4" [(ngModel)]="bio"
                  placeholder="Tell players about your coaching philosophy, achievements and what they can expect from your sessions."
                  class="textarea-box" [style.borderColor]="bio.length >= 30 ? '#8CF000' : '#F3F4F6'"></textarea>
                <p class="text-[11px] text-[#9CA3AF] text-right mt-1">{{ bio.length }}/250</p>
              </div>
              <button (click)="finishSection('achievements')" [disabled]="!isDone('bio')" class="next-step-btn w-full h-11 mt-3">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 10. Achievements -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'achievements'" [class.section-done]="isDone('achievements')">
            <button (click)="toggleSection('achievements')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('achievements') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('achievements')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('achievements')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Achievements</p>
                  <p *ngIf="isDone('achievements')" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left truncate max-w-[200px]">{{ achievements.join(', ') }}</p>
                  <p *ngIf="!isDone('achievements') && expandedSection() !== 'achievements'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Share credentials.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'achievements' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'achievements'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Share your coaching and playing credentials.</p>
              <div class="chips-grid">
                <button *ngFor="let a of achievementOptions" class="chip-btn" [class.chip-active]="achievements.includes(a)" (click)="toggleAchieve(a)">
                  {{ a }}
                </button>
              </div>
              <button (click)="finishSection('gallery')" [disabled]="!isDone('achievements')" class="next-step-btn w-full h-11 mt-4">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 11. Gallery -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'gallery'" [class.section-done]="isDone('gallery')">
            <button (click)="toggleSection('gallery')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('gallery') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('gallery')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('gallery')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Gallery</p>
                  <p *ngIf="isDone('gallery')" class="text-[11px] text-[#22C55E] font-bold text-left">Photos Uploaded</p>
                  <p *ngIf="!isDone('gallery') && expandedSection() !== 'gallery'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Add media files.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'gallery' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'gallery'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed">Add photos and videos of your coaching sessions.</p>
              <div class="grid grid-cols-2 gap-3 mb-4">
                <div *ngFor="let u of [{emoji:'📸', label:'Profile Photos'}, {emoji:'🏃', label:'Training Photos'}, {emoji:'🎬', label:'Videos'}, {emoji:'📜', label:'Certificates'}]"
                  (click)="galleryUp = true" class="gallery-upload-box">
                  <span class="text-2xl">{{ u.emoji }}</span>
                  <p class="text-[11px] font-semibold text-[#9CA3AF] mt-1">{{ u.label }}</p>
                  <ion-icon name="plus-outline" class="text-[#C4C9D4] mt-1 text-sm"></ion-icon>
                </div>
              </div>
              <div *ngIf="galleryUp" class="flex items-center gap-2 bg-[#F0FDF4] rounded-xl px-3 py-2 mb-3">
                <ion-icon name="checkmark-circle-outline" class="text-[#22C55E]"></ion-icon>
                <p class="text-[12px] font-semibold text-[#16A34A]">Photos uploaded successfully</p>
              </div>
              <button (click)="finishSection('verification')" [disabled]="!isDone('gallery')" class="next-step-btn w-full h-11">
                Save & Next
              </button>
            </div>
          </div>

          <!-- 12. Verification -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'verification'" [class.section-done]="isDone('verification')">
            <button (click)="toggleSection('verification')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('verification') ? '#8CF000' : '#F3F4F6'">
                  <ion-icon *ngIf="isDone('verification')" name="checkmark-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  <div *ngIf="!isDone('verification')" class="w-2 h-2 rounded-full bg-[#D1D5DB]"></div>
                </div>
                <div>
                  <p class="text-[14px] font-bold text-[#111827] text-left">Become a Verified Coach</p>
                  <p *ngIf="isDone('verification')" class="text-[11px] text-[#2563EB] font-bold text-left">Documents Submitted</p>
                  <p *ngIf="!isDone('verification') && expandedSection() !== 'verification'" class="text-[11px] text-[#9CA3AF] mt-0.5 text-left">Required documentation.</p>
                </div>
              </div>
              <ion-icon [name]="expandedSection() === 'verification' ? 'chevron-up-outline' : 'chevron-down-outline'" class="text-[#9CA3AF]"></ion-icon>
            </button>
            <div *ngIf="expandedSection() === 'verification'" class="section-body">
              <p class="text-[12px] text-[#9CA3AF] mb-3 leading-relaxed font-medium">Verification increases trust and improves your visibility on TYNG.</p>
              <div class="space-y-3 mb-4">
                <div *ngFor="let doc of [{emoji:'🪪', label:'Government ID', hint:'Aadhar, PAN or Passport'}, {emoji:'📋', label:'Coaching Certificate', hint:'BWF, BCCI, FIFA etc.'}, {emoji:'📸', label:'Professional Profile Photo', hint:'Clear headshot, good lighting'}]"
                  (click)="verifyUp = true" class="verify-upload-row">
                  <span class="text-2xl flex-shrink-0">{{ doc.emoji }}</span>
                  <div class="flex-1">
                    <p class="text-[13px] font-bold text-[#111827] text-left">{{ doc.label }}</p>
                    <p class="text-[11px] text-[#9CA3AF] text-left">{{ doc.hint }}</p>
                  </div>
                  <ion-icon name="cloud-upload-outline" class="text-[#C4C9D4] text-lg"></ion-icon>
                </div>
              </div>
              <div *ngIf="verifyUp" class="flex items-center gap-2.5 bg-[#EFF6FF] rounded-[16px] px-4 py-3 mb-3">
                <ion-icon name="shield-checkmark" class="text-[#2563EB] text-xl"></ion-icon>
                <div>
                  <p class="text-[12px] font-black text-[#1D4ED8] text-left">🟢 Verified Coach</p>
                  <p class="text-[10px] text-[#6B7280] text-left">Badge Pending Approval · Usually within 48 hrs</p>
                </div>
              </div>
              <button (click)="onSubmitVerification()" [disabled]="!isDone('verification')" class="next-step-btn w-full h-11"
                [style.background]="isDone('verification') ? 'linear-gradient(135deg,#FF7A00,#FF9A40)' : '#F3F4F6'"
                [style.color]="isDone('verification') ? 'white' : '#C4C9D4'">
                {{ isDone('verification') ? 'All Done! Finish →' : 'Upload Documents' }}
              </button>
            </div>
          </div>

        </div>

        <div style="height:140px;"></div>

        <!-- Sticky Bottom Publish Bar -->
        <div class="fixed-bottom-bar bg-white px-5 pt-3 pb-8">
          <div class="flex items-center gap-4">
            <div>
              <p class="text-[11px] text-[#9CA3AF] font-bold">Profile</p>
              <p class="text-[20px] font-black text-[#111827]">{{ getProgress() }}<span class="text-[12px] text-[#9CA3AF]">%</span></p>
            </div>
            <button (click)="onPublish()" class="flex-1 h-12 rounded-2xl text-[14px] font-black text-white border-none"
              [style.background]="getProgress() >= 100 ? 'linear-gradient(135deg,#FF7A00,#FF9A40)' : 'linear-gradient(135deg,#8CF000,#A3E635)'">
              {{ getProgress() >= 100 ? 'Publish Profile 🎉' : 'Save & Continue' }}
            </button>
          </div>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .profile-complete-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .done-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #FAFBFC;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .section-box {
      background: #FFFFFF;
      border-radius: 24px;
      overflow: hidden;
      border: 2px solid transparent;
      box-shadow: 0 1px 8px rgba(0,0,0,0.06);
      transition: all 0.2s;
    }

    .section-expanded {
      border-color: rgba(140,240,0,0.30);
      box-shadow: 0 4px 20px rgba(140,240,0,0.12);
    }

    .section-done {
      border-color: rgba(140,240,0,0.15);
      box-shadow: 0 1px 8px rgba(0,0,0,0.05);
    }

    .section-title-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: none;
      border: none;
      cursor: pointer;
    }

    .status-dot {
      width: 28px; height: 28px;
      border-radius: 50%;
    }

    .section-body {
      padding: 0 20px 20px;
    }

    /* Chips */
    .chips-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip-btn {
      padding: 8px 14px;
      border-radius: 999px;
      background: #F3F4F6;
      color: #6B7280;
      font-size: 12px;
      font-weight: 600;
      border: 1.5px solid transparent;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      transition: all 0.15s;
    }

    .chip-active {
      background: rgba(140,240,0,0.14);
      color: #111827;
      border-color: #8CF000;
    }

    .next-step-btn {
      border: none;
      background: linear-gradient(135deg,#8CF000,#A3E635);
      color: #111827;
      font-size: 13px;
      font-weight: 800;
      border-radius: 16px;
      box-shadow: 0 3px 10px rgba(140,240,0,0.30);
      cursor: pointer;
    }

    .next-step-btn:disabled {
      background: #F3F4F6;
      color: #C4C9D4;
      box-shadow: none;
      cursor: not-allowed;
    }

    /* Toggle */
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

    .textarea-box {
      width: 100%;
      padding: 16px;
      border-radius: 20px;
      font-size: 14px;
      color: #111827;
      background: white;
      border: 2px solid #F3F4F6;
      outline: none;
      resize: none;
    }

    /* Gallery Upload */
    .gallery-upload-box {
      aspect-ratio: 1/1;
      border-radius: 20px;
      border: 2px dashed #E5E7EB;
      background: #F9FAFB;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s;
    }

    .gallery-upload-box:hover {
      border-color: #8CF000;
    }

    /* Verification Row */
    .verify-upload-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #F9FAFB;
      border-radius: 18px;
      border: 2px dashed #E5E7EB;
      cursor: pointer;
      transition: all 0.15s;
    }

    .verify-upload-row:hover {
      border-color: #8CF000;
    }

    /* Bottom sticky bar */
    .fixed-bottom-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 30;
      max-width: 440px;
      margin: 0 auto;
      border-top: 1px solid #F3F4F6;
      box-shadow: 0 -4px 24px rgba(0,0,0,0.09);
    }

    .btn-orange-gradient {
      background: linear-gradient(135deg, #FF7A00, #FF9A40);
      box-shadow: 0 4px 20px rgba(255, 122, 0, 0.40);
      border: none;
      cursor: pointer;
    }
  `]
})
export class CoachCompleteProfilePage {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly allSections = ALL_SECTIONS;
  readonly languageOptions = LANGUAGES;
  readonly locationOptions = LOCATIONS;
  readonly radiusOptions = RADII;
  readonly sessionTypeOptions = SESSION_TYPES;
  readonly equipmentOptions = EQUIPMENT;
  readonly trialOptions = TRIAL_OPTS;
  readonly travelOptions = TRAVEL_OPTS;
  readonly daysOptions = DAYS;
  readonly timeOptions = TIMES;
  readonly achievementOptions = ACHIEVEMENTS;

  showDone = signal(false);
  expandedSection = signal<string | null>('languages');

  // Completed arrays
  langs: string[] = [];
  locs: string[] = [];
  radius = '';
  sessions: string[] = [];
  equip: string[] = [];
  trialOn: boolean | null = null;
  trialType = '';
  travel = '';
  avail: Record<string, string[]> = {};
  fees: { [key: string]: string; individual: string; group: string; monthly: string } = { individual: '', group: '', monthly: '' };
  negotiable = false;
  bio = '';
  achievements: string[] = [];
  galleryUp = false;
  verifyUp = false;

  toggleSection(id: string) {
    this.expandedSection.update(curr => curr === id ? null : id);
  }

  finishSection(next: string) {
    this.expandedSection.set(next);
  }

  toggleLang(val: string) {
    this.langs = this.langs.includes(val) ? this.langs.filter(x => x !== val) : [...this.langs, val];
  }

  toggleLoc(val: string) {
    this.locs = this.locs.includes(val) ? this.locs.filter(x => x !== val) : [...this.locs, val];
  }

  toggleSessionType(val: string) {
    this.sessions = this.sessions.includes(val) ? this.sessions.filter(x => x !== val) : [...this.sessions, val];
  }

  toggleEquip(val: string) {
    this.equip = this.equip.includes(val) ? this.equip.filter(x => x !== val) : [...this.equip, val];
  }

  toggleAchieve(val: string) {
    this.achievements = this.achievements.includes(val) ? this.achievements.filter(x => x !== val) : [...this.achievements, val];
  }

  isAvail(day: string, slot: string) {
    return (this.avail[day] ?? []).includes(slot);
  }

  toggleAvail(day: string, slot: string) {
    const list = this.avail[day] ?? [];
    this.avail[day] = list.includes(slot) ? list.filter(x => x !== slot) : [...list, slot];
  }

  getSelectedDaysCount() {
    return Object.values(this.avail).filter(s => s.length > 0).length;
  }

  isDone(id: string): boolean {
    if (id === 'languages') return this.langs.length > 0;
    if (id === 'locations') return this.locs.length > 0 && this.radius !== '';
    if (id === 'sessions') return this.sessions.length > 0;
    if (id === 'equipment') return this.equip.length > 0;
    if (id === 'trial') return this.trialOn !== null;
    if (id === 'travel') return this.travel !== '';
    if (id === 'availability') return this.getSelectedDaysCount() > 0;
    if (id === 'fees') return this.fees.individual !== '' || this.fees.group !== '' || this.fees.monthly !== '';
    if (id === 'bio') return this.bio.trim().length >= 30;
    if (id === 'achievements') return this.achievements.length > 0;
    if (id === 'gallery') return this.galleryUp;
    if (id === 'verification') return this.verifyUp;
    return false;
  }

  getCompletedCount() {
    return this.allSections.filter(s => this.isDone(s)).length;
  }

  getProgress() {
    return Math.round((this.getCompletedCount() / this.allSections.length) * 100);
  }

  onSubmitVerification() {
    this.verifyUp = true;
  }

  onPublish() {
    if (this.getProgress() >= 100) {
      this.showDone.set(true);
    } else {
      const remaining = this.allSections.find(s => !this.isDone(s));
      if (remaining) this.expandedSection.set(remaining);
    }
  }

  finishOnboarding() {
    this.auth.completeOnboarding({ name: this.auth.user()?.name || 'Coach' });
    this.router.navigateByUrl('/app/home');
  }

  back() {
    this.router.navigateByUrl('/app/home');
  }
}
