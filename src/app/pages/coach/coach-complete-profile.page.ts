import { CommonModule } from '@angular/common';
import { Component, DoCheck, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { CoachGalleryCategory, CoachGalleryItem, CoachProfileDetails, CoachProfileDetailsPayload, CoachService, CoachVerificationDocument, CoachVerificationDocumentType } from '../../core/services/coach.service';

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
              <div class="h-full rounded-full" [style.width]="getProgress() + '%'" style="background: linear-gradient(90deg,var(--app-primary) 0%,var(--app-primary-to) 100%)"></div>
            </div>
            <p class="text-[11px] text-[#9CA3AF] mt-1.5 leading-relaxed">
              Complete your profile to unlock bookings, earn your Verified Coach badge and improve your visibility.
            </p>
          </div>
        </div>

        <div class="px-4 pt-4 space-y-3">
          <p *ngIf="profileSaveError" class="mx-1 text-[12px] font-semibold text-red-600">{{ profileSaveError }}</p>

          <!-- 1. Languages -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'languages'" [class.section-done]="isDone('languages')">
            <button (click)="toggleSection('languages')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('languages') ? 'var(--app-primary)' : '#F3F4F6'">
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('locations') ? 'var(--app-primary)' : '#F3F4F6'">
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
                  [style.backgroundColor]="radius === r ? 'var(--app-primary)' : '#F3F4F6'"
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('sessions') ? 'var(--app-primary)' : '#F3F4F6'">
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('equipment') ? 'var(--app-primary)' : '#F3F4F6'">
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('trial') ? 'var(--app-primary)' : '#F3F4F6'">
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
                  [style.backgroundColor]="trialOn === true ? 'rgba(var(--app-primary-rgb),0.12)' : '#F3F4F6'"
                  [style.color]="trialOn === true ? '#111827' : '#6B7280'"
                  [style.border]="trialOn === true ? '2px solid var(--app-primary)' : '2px solid transparent'">
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('travel') ? 'var(--app-primary)' : '#F3F4F6'">
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
                <button *ngFor="let opt of travelOptions" class="w-full flex items-center gap-4 px-5 py-4 rounded-[20px] bg-white border border-[#F3F4F6] text-left shadow-sm hover:border-[var(--app-primary)]"
                  [style.borderColor]="travel === opt.id ? 'var(--app-primary)' : '#F3F4F6'"
                  [style.backgroundColor]="travel === opt.id ? 'rgba(var(--app-primary-rgb),0.08)' : 'white'"
                  (click)="travel = opt.id">
                  <span class="text-2xl">{{ opt.emoji }}</span>
                  <p class="flex-1 text-[14px] font-bold text-[#111827]">{{ opt.label }}</p>
                  <div *ngIf="travel === opt.id" class="w-5 h-5 rounded-full bg-[var(--app-primary)] flex items-center justify-center">
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('availability') ? 'var(--app-primary)' : '#F3F4F6'">
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
              <div class="availability-intro">
                <div class="availability-intro-icon"><ion-icon name="calendar-outline"></ion-icon></div>
                <div>
                  <p class="availability-title">Build your coaching week</p>
                  <p class="availability-copy">Choose the time windows players can request.</p>
                </div>
                <span class="availability-count">{{ getSelectedSlotCount() }} slots</span>
              </div>
              <div class="availability-grid">
                <div *ngFor="let day of daysOptions" class="availability-day" [class.availability-day-active]="getSelectedSlotCount(day) > 0">
                  <div class="availability-day-head">
                    <span class="availability-day-name">{{ day }}</span>
                    <span class="availability-day-count" *ngIf="getSelectedSlotCount(day) > 0">{{ getSelectedSlotCount(day) }}</span>
                  </div>
                  <div class="availability-slots">
                    <button *ngFor="let time of timeOptions" type="button" class="availability-slot" [class.availability-slot-active]="isAvail(day, time)"
                      (click)="toggleAvail(day, time)" [attr.aria-pressed]="isAvail(day, time)">
                      <span>{{ time }}</span>
                      <ion-icon [name]="isAvail(day, time) ? 'checkmark-circle-outline' : 'ellipse-outline'"></ion-icon>
                    </button>
                  </div>
                </div>
              </div>
              <div class="availability-footer">
                <span class="availability-save-state" [class.availability-save-error]="availabilitySaveState === 'error'">
                  <ion-icon [name]="availabilitySaveState === 'error' ? 'alert-circle-outline' : availabilitySaveState === 'saved' ? 'checkmark-circle-outline' : 'cloud-upload-outline'"></ion-icon>
                  {{ availabilitySaveState === 'saved' ? 'Availability saved' : availabilitySaveState === 'error' ? 'Save failed — try again' : 'Changes save automatically' }}
                </span>
                <button *ngIf="getSelectedSlotCount() > 0" type="button" (click)="clearAvailability()" class="availability-clear-btn">Clear</button>
              </div>
              <button (click)="finishSection('fees')" [disabled]="!isDone('availability') || profileSaveBusy" class="next-step-btn w-full h-11 mt-4">
                <ion-spinner *ngIf="profileSaveBusy" name="crescent"></ion-spinner>
                Save & Next
              </button>
            </div>
          </div>

          <!-- 8. Pricing -->
          <div class="section-box" [class.section-expanded]="expandedSection() === 'fees'" [class.section-done]="isDone('fees')">
            <button (click)="toggleSection('fees')" class="section-title-btn">
              <div class="flex items-center gap-3">
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('fees') ? 'var(--app-primary)' : '#F3F4F6'">
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('bio') ? 'var(--app-primary)' : '#F3F4F6'">
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
                  class="textarea-box" [style.borderColor]="bio.length >= 30 ? 'var(--app-primary)' : '#F3F4F6'"></textarea>
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('achievements') ? 'var(--app-primary)' : '#F3F4F6'">
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('gallery') ? 'var(--app-primary)' : '#F3F4F6'">
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
                <div *ngFor="let u of galleryCategories" class="gallery-upload-box" [class.has-gallery-items]="galleryFor(u.id).length > 0">
                  <button type="button" (click)="addGalleryItem(u.id)" [disabled]="galleryBusy" class="gallery-add-action">
                    <span class="text-2xl">{{ u.emoji }}</span>
                    <p class="text-[11px] font-semibold text-[#6B7280] mt-1">{{ u.label }}</p>
                    <span class="gallery-count">{{ galleryFor(u.id).length }} saved</span>
                    <ion-icon name="add-circle-outline" class="text-[#16A34A] mt-1 text-lg"></ion-icon>
                  </button>
                  <div *ngFor="let item of galleryFor(u.id)" class="gallery-preview">
                    <img *ngIf="item.mimeType.startsWith('image/')" [src]="item.url" [alt]="item.name || u.label" />
                    <video *ngIf="item.mimeType.startsWith('video/')" [src]="item.url" controls playsinline></video>
                    <a *ngIf="item.mimeType === 'application/pdf'" [href]="item.url" target="_blank" rel="noopener">View certificate</a>
                    <button type="button" (click)="removeGalleryItem(item)" [disabled]="galleryBusy" aria-label="Remove media"><ion-icon name="trash-outline"></ion-icon></button>
                  </div>
                </div>
              </div>
              <input #galleryInput type="file" [accept]="galleryAccept" hidden (change)="onGalleryFile($event)" />
              <p *ngIf="galleryError" class="text-[12px] text-red-600 mb-3">{{ galleryError }}</p>
              <div *ngIf="galleryUp" class="flex items-center gap-2 bg-[#F0FDF4] rounded-xl px-3 py-2 mb-3">
                <ion-icon name="checkmark-circle-outline" class="text-[#22C55E]"></ion-icon>
                <p class="text-[12px] font-semibold text-[#16A34A]">{{ gallery.length }} gallery item(s) saved to your profile</p>
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
                <div class="status-dot flex items-center justify-center flex-shrink-0" [style.backgroundColor]="isDone('verification') ? 'var(--app-primary)' : '#F3F4F6'">
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
                <div *ngFor="let doc of verificationCategories" class="verification-document-card">
                  <button type="button" (click)="addVerificationDocument(doc.id)" [disabled]="verificationBusy" class="verify-upload-row w-full">
                    <span class="text-2xl flex-shrink-0">{{ doc.emoji }}</span>
                    <div class="flex-1">
                      <p class="text-[13px] font-bold text-[#111827] text-left">{{ doc.label }}</p>
                      <p class="text-[11px] text-[#9CA3AF] text-left">{{ verificationFor(doc.id)?.name || doc.hint }}</p>
                    </div>
                    <span *ngIf="verificationFor(doc.id)" class="text-[10px] font-black text-[#2563EB]">Submitted</span>
                    <ion-icon *ngIf="!verificationFor(doc.id)" name="cloud-upload-outline" class="text-[#C4C9D4] text-lg"></ion-icon>
                  </button>
                  <div *ngIf="verificationFor(doc.id) as uploaded" class="verification-preview">
                    <img *ngIf="uploaded.mimeType.startsWith('image/') && verificationPreview(uploaded.id)" [src]="verificationPreview(uploaded.id)" [alt]="doc.label" />
                    <button type="button" class="verification-open" (click)="openVerificationDocument(uploaded)">{{ uploaded.mimeType === 'application/pdf' ? 'View PDF' : 'Preview' }}</button>
                    <button type="button" class="verification-remove" (click)="removeVerificationDocument(uploaded)" [disabled]="verificationBusy" aria-label="Remove document"><ion-icon name="trash-outline"></ion-icon></button>
                  </div>
                </div>
              </div>
              <input #verificationInput type="file" [accept]="verificationAccept" hidden (change)="onVerificationFile($event)" />
              <p *ngIf="verificationError" class="text-[12px] text-red-600 mb-3">{{ verificationError }}</p>
              <div *ngIf="verifyUp" class="flex items-center gap-2.5 bg-[#EFF6FF] rounded-[16px] px-4 py-3 mb-3">
                <ion-icon name="shield-checkmark" class="text-[#2563EB] text-xl"></ion-icon>
                <div>
                  <p class="text-[12px] font-black text-[#1D4ED8] text-left">Documents submitted for review</p>
                  <p class="text-[10px] text-[#6B7280] text-left">Your Verified Coach badge is pending admin approval.</p>
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
              [style.background]="getProgress() >= 100 ? 'linear-gradient(135deg,#FF7A00,#FF9A40)' : 'linear-gradient(135deg,var(--app-primary),var(--app-primary-to))'">
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
      border-color: rgba(var(--app-primary-rgb),0.30);
      box-shadow: 0 4px 20px rgba(var(--app-primary-rgb),0.12);
    }

    .section-done {
      border-color: rgba(var(--app-primary-rgb),0.15);
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
      background: rgba(var(--app-primary-rgb),0.14);
      color: #111827;
      border-color: var(--app-primary);
    }

    .next-step-btn {
      border: none;
      background: linear-gradient(135deg,var(--app-primary),var(--app-primary-to));
      color: #111827;
      font-size: 13px;
      font-weight: 800;
      border-radius: 16px;
      box-shadow: 0 3px 10px rgba(var(--app-primary-rgb),0.30);
      cursor: pointer;
    }

    .next-step-btn:disabled {
      background: #F3F4F6;
      color: #C4C9D4;
      box-shadow: none;
      cursor: not-allowed;
    }

    .availability-intro {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 16px;
      padding: 12px;
      background: #F8FAFC;
      border: 1px solid #EEF0F3;
      border-radius: 16px;
    }

    .availability-intro-icon {
      width: 34px;
      height: 34px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 34px;
      color: #111827;
      background: var(--app-primary);
      border-radius: 11px;
      font-size: 18px;
    }

    .availability-title {
      margin: 0 0 2px;
      color: #111827;
      font-size: 12px;
      font-weight: 800;
    }

    .availability-copy {
      margin: 0;
      color: #9CA3AF;
      font-size: 11px;
      line-height: 1.35;
    }

    .availability-count {
      margin-left: auto;
      padding: 6px 8px;
      color: #6B7280;
      background: #FFFFFF;
      border: 1px solid #E5E7EB;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      white-space: nowrap;
    }

    .availability-grid {
      display: grid;
      gap: 8px;
    }

    .availability-day {
      padding: 10px;
      background: #FFFFFF;
      border: 1px solid #EEF0F3;
      border-radius: 16px;
      transition: border-color 160ms ease, background 160ms ease;
    }

    .availability-day-active {
      background: #FCFFEF;
      border-color: rgba(var(--app-primary-rgb), 0.55);
    }

    .availability-day-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
    }

    .availability-day-name {
      color: #374151;
      font-size: 11px;
      font-weight: 900;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    .availability-day-count {
      min-width: 18px;
      height: 18px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      color: #111827;
      background: var(--app-primary);
      border-radius: 999px;
      font-size: 10px;
      font-weight: 900;
    }

    .availability-slots {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 6px;
    }

    .availability-slot {
      min-height: 42px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 5px 2px;
      color: #6B7280;
      background: #F8FAFC;
      border: 1px solid #EEF0F3;
      border-radius: 11px;
      font-size: 9px;
      font-weight: 800;
      cursor: pointer;
      transition: all 160ms ease;
    }

    .availability-slot ion-icon { color: #C4C9D4; font-size: 14px; }
    .availability-slot-active {
      color: #111827;
      background: var(--app-primary);
      border-color: var(--app-primary);
      box-shadow: 0 2px 7px rgba(var(--app-primary-rgb), 0.25);
    }

    .availability-slot-active ion-icon { color: #111827; }

    .availability-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      min-height: 28px;
      margin-top: 12px;
    }

    .availability-save-state {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      color: #9CA3AF;
      font-size: 10px;
      font-weight: 700;
    }

    .availability-save-state ion-icon { font-size: 14px; }
    .availability-save-error { color: #DC2626; }

    .availability-clear-btn {
      padding: 5px 8px;
      color: #9CA3AF;
      background: transparent;
      border: 0;
      font-size: 10px;
      font-weight: 800;
      cursor: pointer;
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
      background: var(--app-primary);
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
      border-color: var(--app-primary);
    }
    .gallery-upload-box.has-gallery-items { height: auto; min-height: 172px; padding: 10px; aspect-ratio: auto; align-items: stretch; justify-content: flex-start; }
    .gallery-add-action { width: 100%; min-height: 145px; display:flex; flex-direction:column; align-items:center; justify-content:center; border:0; background:transparent; }
    .gallery-count { font-size:10px; color:#9ca3af; margin-top:2px; }
    .gallery-preview { position:relative; width:100%; margin-top:8px; }
    .gallery-preview img,.gallery-preview video { display:block; width:100%; height:100px; object-fit:cover; border-radius:10px; background:#e5e7eb; }
    .gallery-preview a { display:block; padding:16px 8px; color:#2563eb; font-size:11px; }
    .gallery-preview button { position:absolute; right:5px; top:5px; width:28px; height:28px; border:0; border-radius:50%; background:#fff; color:#dc2626; }

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
      border-color: var(--app-primary);
    }
    .verification-document-card { overflow:hidden; border-radius:18px; }
    .verification-preview { position:relative; display:flex; align-items:center; gap:8px; padding:8px 10px; background:#eff6ff; border:1px solid #bfdbfe; border-top:0; }
    .verification-preview img { width:46px; height:40px; object-fit:cover; border-radius:8px; background:#e5e7eb; }
    .verification-open { flex:1; min-height:34px; border:0; border-radius:9px; background:#fff; color:#2563eb; font-size:11px; font-weight:800; }
    .verification-remove { width:34px; height:34px; border:0; border-radius:9px; background:#fff; color:#dc2626; }

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
export class CoachCompleteProfilePage implements DoCheck, OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly coachService = inject(CoachService);
  @ViewChild('galleryInput') galleryInput?: ElementRef<HTMLInputElement>;
  @ViewChild('verificationInput') verificationInput?: ElementRef<HTMLInputElement>;

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
  gallery: CoachGalleryItem[] = [];
  galleryBusy = false;
  galleryError = '';
  selectedGalleryCategory: CoachGalleryCategory = 'profile_photo';
  readonly galleryCategories: { id: CoachGalleryCategory; label: string; emoji: string }[] = [
    { id: 'profile_photo', label: 'Profile Photos', emoji: '📸' },
    { id: 'training_photo', label: 'Training Photos', emoji: '🏃' },
    { id: 'video', label: 'Videos', emoji: '🎬' },
    { id: 'certificate', label: 'Certificates', emoji: '📜' },
  ];
  verificationDocuments: CoachVerificationDocument[] = [];
  verificationPreviews: Record<number, string> = {};
  verificationBusy = false;
  verificationError = '';
  selectedVerificationType: CoachVerificationDocumentType = 'government_id';
  readonly verificationCategories: { id: CoachVerificationDocumentType; label: string; hint: string; emoji: string }[] = [
    { id: 'government_id', label: 'Government ID', hint: 'Aadhar, PAN or Passport', emoji: '🪪' },
    { id: 'coaching_certificate', label: 'Coaching Certificate', hint: 'BWF, BCCI, FIFA etc.', emoji: '📋' },
    { id: 'professional_profile_photo', label: 'Professional Profile Photo', hint: 'Clear headshot, good lighting', emoji: '📸' },
  ];
  profileSaveBusy = false;
  profileSaveError = '';
  availabilitySaveState: 'idle' | 'saving' | 'saved' | 'error' = 'idle';
  private profileDetailsLoaded = false;
  private lastProfileDraft = '';
  private profileAutosaveTimer?: ReturnType<typeof setTimeout>;

  get verifyUp(): boolean { return this.verificationCategories.every((category) => !!this.verificationFor(category.id)); }

  get verificationAccept(): string {
    return this.selectedVerificationType === 'professional_profile_photo' ? 'image/*' : 'image/*,application/pdf,.pdf';
  }

  get galleryAccept(): string {
    return this.selectedGalleryCategory === 'video' ? 'video/*' : this.selectedGalleryCategory === 'certificate' ? 'image/*,application/pdf,.pdf' : 'image/*';
  }

  ngOnInit(): void { this.loadGallery(); this.loadVerificationDocuments(); this.loadProfileDetails(); }

  ngDoCheck(): void {
    if (!this.profileDetailsLoaded || this.profileSaveBusy) return;
    const draft = this.profileDetailsDraft();
    if (draft === this.lastProfileDraft) return;
    this.lastProfileDraft = draft;
    if (this.profileAutosaveTimer) clearTimeout(this.profileAutosaveTimer);
    this.profileAutosaveTimer = setTimeout(() => { void this.saveProfileDetails(false); }, 700);
  }

  galleryFor(category: CoachGalleryCategory): CoachGalleryItem[] {
    return this.gallery.filter((item) => item.category === category);
  }

  addGalleryItem(category: CoachGalleryCategory): void {
    if (this.galleryBusy || !this.galleryInput?.nativeElement) return;
    this.selectedGalleryCategory = category;
    this.galleryError = '';
    this.galleryInput.nativeElement.value = '';
    this.galleryInput.nativeElement.accept = this.galleryAccept;
    this.galleryInput.nativeElement.click();
  }

  async onGalleryFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.galleryBusy = true;
    this.galleryError = '';
    try {
      const response = await firstValueFrom(this.coachService.uploadCoachMedia(this.selectedGalleryCategory, file));
      if (!response.success || !response.data) throw new Error(response.message || 'Unable to upload this item.');
      this.gallery = [response.data, ...this.gallery];
      this.galleryUp = this.gallery.length > 0;
    } catch (error: any) {
      this.galleryError = error?.error?.message || error?.message || 'Unable to upload this item. Please try again.';
    } finally { this.galleryBusy = false; }
  }

  async removeGalleryItem(item: CoachGalleryItem): Promise<void> {
    if (this.galleryBusy) return;
    this.galleryBusy = true;
    this.galleryError = '';
    try {
      const response = await firstValueFrom(this.coachService.deleteCoachMedia(item.id));
      if (!response.success) throw new Error(response.message || 'Unable to remove this item.');
      this.gallery = this.gallery.filter((media) => media.id !== item.id);
      this.galleryUp = this.gallery.length > 0;
    } catch (error: any) {
      this.galleryError = error?.error?.message || error?.message || 'Unable to remove this item.';
    } finally { this.galleryBusy = false; }
  }

  private loadGallery(): void {
    this.coachService.getMyCoachMedia().subscribe({
      next: (response) => { this.gallery = Array.isArray(response.data) ? response.data : []; this.galleryUp = this.gallery.length > 0; },
      error: () => { this.galleryError = 'Saved gallery could not be loaded. Try reopening this page.'; },
    });
  }

  verificationFor(documentType: CoachVerificationDocumentType): CoachVerificationDocument | undefined {
    return this.verificationDocuments.find((document) => document.documentType === documentType);
  }

  verificationPreview(id: number): string { return this.verificationPreviews[id] || ''; }

  addVerificationDocument(documentType: CoachVerificationDocumentType): void {
    if (this.verificationBusy || !this.verificationInput?.nativeElement) return;
    this.selectedVerificationType = documentType;
    this.verificationError = '';
    this.verificationInput.nativeElement.value = '';
    this.verificationInput.nativeElement.accept = this.verificationAccept;
    this.verificationInput.nativeElement.click();
  }

  async onVerificationFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.verificationBusy = true;
    this.verificationError = '';
    try {
      const result = await firstValueFrom(this.coachService.uploadCoachVerificationDocument(this.selectedVerificationType, file));
      if (!result.success || !result.data) throw new Error(result.message || 'Unable to upload this document.');
      const uploaded = result.data;
      const prior = this.verificationFor(uploaded.documentType);
      if (prior) this.releaseVerificationPreview(prior.id);
      this.verificationDocuments = [uploaded, ...this.verificationDocuments.filter((document) => document.documentType !== uploaded.documentType)];
      await this.loadVerificationPreview(uploaded);
    } catch (error: any) {
      this.verificationError = error?.error?.message || error?.message || 'Unable to upload this document. Please try again.';
    } finally { this.verificationBusy = false; }
  }

  async removeVerificationDocument(document: CoachVerificationDocument): Promise<void> {
    if (this.verificationBusy) return;
    this.verificationBusy = true;
    this.verificationError = '';
    try {
      const result = await firstValueFrom(this.coachService.deleteCoachVerificationDocument(document.id));
      if (!result.success) throw new Error(result.message || 'Unable to remove this document.');
      this.releaseVerificationPreview(document.id);
      this.verificationDocuments = this.verificationDocuments.filter((item) => item.id !== document.id);
    } catch (error: any) {
      this.verificationError = error?.error?.message || error?.message || 'Unable to remove this document.';
    } finally { this.verificationBusy = false; }
  }

  openVerificationDocument(document: CoachVerificationDocument): void {
    const preview = this.verificationPreview(document.id);
    if (preview) window.open(preview, '_blank', 'noopener,noreferrer');
  }

  private loadVerificationDocuments(): void {
    this.coachService.getMyCoachVerificationDocuments().subscribe({
      next: (result) => {
        this.verificationDocuments = Array.isArray(result.data) ? result.data : [];
        void Promise.all(this.verificationDocuments.map((document) => this.loadVerificationPreview(document)));
      },
      error: () => { this.verificationError = 'Saved verification documents could not be loaded. Try reopening this page.'; },
    });
  }

  private async loadVerificationPreview(document: CoachVerificationDocument): Promise<void> {
    try {
      const blob = await firstValueFrom(this.coachService.getCoachVerificationDocumentBlob(document.id));
      this.releaseVerificationPreview(document.id);
      this.verificationPreviews[document.id] = URL.createObjectURL(blob);
    } catch { this.verificationError = 'A verification document preview could not be loaded.'; }
  }

  private releaseVerificationPreview(id: number): void {
    const url = this.verificationPreviews[id];
    if (url) URL.revokeObjectURL(url);
    delete this.verificationPreviews[id];
  }

  toggleSection(id: string) {
    this.expandedSection.update(curr => curr === id ? null : id);
  }

  async finishSection(next: string): Promise<void> {
    if (await this.saveProfileDetails()) this.expandedSection.set(next);
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
    const nextSlots = list.includes(slot) ? list.filter(x => x !== slot) : [...list, slot];
    this.avail = { ...this.avail, [day]: nextSlots };
    this.availabilitySaveState = 'saving';
  }

  clearAvailability(): void {
    this.avail = {};
    this.availabilitySaveState = 'saving';
  }

  getSelectedSlotCount(day?: string): number {
    if (day) return (this.avail[day] ?? []).length;
    return Object.values(this.avail).reduce((total, slots) => total + slots.length, 0);
  }

  getSelectedDaysCount(): number {
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

  async onSubmitVerification(): Promise<void> {
    await this.onPublish();
  }

  async onPublish(): Promise<void> {
    if (this.getProgress() >= 100) {
      if (!await this.saveProfileDetails()) return;
      try {
        await firstValueFrom(this.auth.completeOnboarding({ name: this.auth.user()?.name || 'Coach' }));
        this.showDone.set(true);
      } catch (error: any) {
        this.profileSaveError = error?.error?.message || error?.message || 'Your details were saved, but the profile could not be published.';
      }
    } else {
      const remaining = this.allSections.find(s => !this.isDone(s));
      if (remaining) this.expandedSection.set(remaining);
    }
  }

  private loadProfileDetails(): void {
    this.coachService.getMyCoachProfileDetails().subscribe({
      next: (result) => {
        const details = result.data;
        if (!result.success || !details) return;
        this.applyProfileDetails(details);
        this.lastProfileDraft = this.profileDetailsDraft();
        this.profileDetailsLoaded = true;
      },
      error: () => { this.profileSaveError = 'Saved profile details could not be loaded. You can still update them and save again.'; },
    });
  }

  private applyProfileDetails(details: CoachProfileDetails): void {
    this.langs = Array.isArray(details.languages) ? details.languages : [];
    this.locs = Array.isArray(details.coachingLocations) ? details.coachingLocations : [];
    this.radius = details.serviceRadius || '';
    this.sessions = Array.isArray(details.sessionTypes) ? details.sessionTypes : [];
    this.equip = Array.isArray(details.equipment) ? details.equipment : [];
    this.trialOn = details.trialEnabled;
    this.trialType = details.trialType || '';
    this.travel = details.travelMode || '';
    this.avail = details.weeklyAvailability && typeof details.weeklyAvailability === 'object' ? { ...details.weeklyAvailability } : {};
    this.availabilitySaveState = 'idle';
    this.fees = {
      individual: String(details.feeOptions?.['individual'] ?? ''),
      group: String(details.feeOptions?.['group'] ?? ''),
      monthly: String(details.feeOptions?.['monthly'] ?? ''),
    };
    this.negotiable = !!details.feesNegotiable;
    this.achievements = Array.isArray(details.achievements) ? details.achievements : [];
    this.bio = details.bio || '';
  }

  private async saveProfileDetails(showError = true): Promise<boolean> {
    if (this.profileSaveBusy) return false;
    this.profileSaveBusy = true;
    this.profileSaveError = '';
    const payload: CoachProfileDetailsPayload = {
      languages: this.langs,
      coaching_locations: this.locs,
      service_radius: this.radius,
      session_types: this.sessions,
      equipment: this.equip,
      trial_enabled: this.trialOn,
      trial_type: this.trialType,
      travel_mode: this.travel,
      weekly_availability: this.avail,
      fee_options: this.fees,
      fees_negotiable: this.negotiable,
      achievements: this.achievements,
      bio: this.bio.trim(),
    };
    try {
      const result = await firstValueFrom(this.coachService.saveMyCoachProfileDetails(payload));
      if (!result.success) throw new Error(result.message || 'Unable to save profile details.');
      this.lastProfileDraft = this.profileDetailsDraft();
      if (this.availabilitySaveState === 'saving') this.availabilitySaveState = 'saved';
      void firstValueFrom(this.auth.fetchMe()).catch(() => undefined);
      return true;
    } catch (error: any) {
      if (showError) this.profileSaveError = error?.error?.message || error?.message || 'Unable to save profile details. Please try again.';
      if (this.availabilitySaveState === 'saving') this.availabilitySaveState = 'error';
      return false;
    } finally { this.profileSaveBusy = false; }
  }

  private profileDetailsDraft(): string {
    return JSON.stringify({
      languages: this.langs, locations: this.locs, radius: this.radius, sessions: this.sessions,
      equipment: this.equip, trialOn: this.trialOn, trialType: this.trialType, travel: this.travel,
      availability: this.avail, fees: this.fees, negotiable: this.negotiable, bio: this.bio,
      achievements: this.achievements,
    });
  }

  finishOnboarding() {
    void this.router.navigateByUrl('/app/coach/dashboard');
  }

  back() {
    this.router.navigateByUrl('/app/coach/dashboard');
  }
}
