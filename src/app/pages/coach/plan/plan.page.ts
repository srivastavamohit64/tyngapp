import { CommonModule } from '@angular/common';
import { Component, signal, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CoachService } from '../../../core/services/coach.service';
import { resolveMediaUrl } from '../../../core/utils/media-url.util';
import { BrandHeaderShellComponent } from '../../../shared/components/brand-header-shell/brand-header-shell.component';

interface Sport {
  id: string;
  name: string;
  emoji: string;
  image: string;
}

interface Student {
  id: number;
  name: string;
  photo: string;
  skill: string;
  attendance: number;
}

interface Venue {
  id: number;
  name: string;
  image: string;
  distance: string;
  pricePerHour: number;
  rating: number;
  address: string;
  sportEmojis: string[];
  isCoachFriendly: boolean;
  courts: VenueCourt[];
  openTime: string;
  closeTime: string;
  slotIntervalMinutes: number;
}

interface VenueCourt {
  id: number;
  name: string;
  sport: string;
  pricePerHour: number;
  maxPlayers: number | null;
}

interface CoachAvailabilitySlot {
  label: string;
  endLabel: string;
  period: 'Morning' | 'Afternoon' | 'Evening';
}

const SPORTS: Sport[] = [
  { id:'cricket',    name:'Cricket',      emoji:'🏏', image:'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=400&fit=crop&auto=format' },
  { id:'football',   name:'Football',     emoji:'⚽', image:'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=400&fit=crop&auto=format' },
  { id:'badminton',  name:'Badminton',    emoji:'🏸', image:'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=400&fit=crop&auto=format' },
  { id:'basketball', name:'Basketball',   emoji:'🏀', image:'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=300&h=400&fit=crop&auto=format' },
  { id:'tennis',     name:'Tennis',       emoji:'🎾', image:'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=300&h=400&fit=crop&auto=format' },
  { id:'tabletennis',name:'Table Tennis', emoji:'🏓', image:'https://images.unsplash.com/photo-1676827613262-5fba25cee5fd?w=300&h=400&fit=crop&auto=format' },
  { id:'volleyball', name:'Volleyball',   emoji:'🏐', image:'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=300&h=400&fit=crop&auto=format' },
];

const PREV_BATCHES = [
  { id:'b1', label:'Saturday Cricket Batch',  sport:'Cricket',  members:12 },
  { id:'b2', label:'Football Academy Group',   sport:'Football', members:18 },
  { id:'b3', label:'Summer Camp Group',        sport:'Multi',    members:24 },
  { id:'b4', label:'Beginners Badminton',      sport:'Badminton',members:6  },
];

const SESSION_TYPES = [
  { id:'individual', label:'Individual',     emoji:'👤' },
  { id:'group',      label:'Group',          emoji:'👥' },
  { id:'academy',    label:'Academy',        emoji:'🏫' },
  { id:'private',    label:'Private Batch',  emoji:'🔒' },
  { id:'camp',       label:'Camp',           emoji:'⛺' },
];

const TRAINING_FOCUS = [
  'Batting','Footwork','Fitness','Speed','Game Awareness',
  'Defence','Stamina','Teamwork','Shooting','Passing','Serving','Strategy',
];

const EQUIPMENT_OPTS = ['Balls','Racquets','Training Cones','Fitness Equipment','Nets','Water','Protective Gear','Other'];
const EQUIP_SOURCES  = [
  { id:'venue',   label:'Venue Provides'        },
  { id:'coach',   label:'Coach Provides'        },
  { id:'student', label:'Students Bring Their Own' },
];

const DURATIONS = [
  { id:'30min',  label:'30 min',  hrs:0.5 },
  { id:'60min',  label:'60 min',  hrs:1   },
  { id:'90min',  label:'90 min',  hrs:1.5 },
  { id:'120min', label:'120 min', hrs:2   },
];

const MOCK_STUDENTS: Student[] = [
  { id: 1, name: 'Rahul Sharma', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', skill: 'Intermediate', attendance: 95 },
  { id: 2, name: 'Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', skill: 'Beginner', attendance: 88 },
  { id: 3, name: 'Vikram Patel', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format', skill: 'Advanced', attendance: 92 },
];

function buildDates() {
  const today = new Date();
  return Array.from({ length:14 }, (_,i) => {
    const d = new Date(today); d.setDate(today.getDate()+i);
    return { idx:i, day:d.toLocaleDateString('en-US',{weekday:'short'}), dateNum:d.getDate(), monthShort:d.toLocaleDateString('en-US',{month:'short'}), isToday:i===0 };
  });
}

@Component({
  selector: 'app-coach-plan',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-brand-header-shell title="Create Session" (back)="success() ? go('/app/coach/dashboard') : handleBack()">
      <!-- SUCCESS SCREEN -->
      <div *ngIf="success()" class="success-shell">
        <div class="success-hero">
          <div class="success-circle mb-4">
            <ion-icon name="checkmark-outline" class="text-white text-5xl font-black"></ion-icon>
          </div>
          <h1 class="text-[26px] font-black text-[#111827] mb-1">Session Created! 🎉</h1>
          <p class="text-[14px] text-[#9CA3AF] mb-6 text-center">{{ sessionCreationMessage() }}</p>
        </div>

        <div class="success-checklist">
          <p class="success-card-title">What’s ready</p>
          <div *ngFor="let item of successItems(); let last = last" class="success-check-row" [class.success-check-row-last]="last">
            <span class="success-check-icon"><ion-icon name="checkmark-outline"></ion-icon></span>
            <span>{{ item }}</span>
          </div>
        </div>

        <div class="success-actions">
          <button (click)="go('/app/coach/students')" class="success-action-btn shadow-sm">
            <ion-icon name="people-outline" class="text-[var(--app-primary)] text-2xl mb-1"></ion-icon>
            Manage Students
          </button>
          <button (click)="go('/app/coach/chat')" class="success-action-btn shadow-sm">
            <ion-icon name="chatbubbles-outline" class="text-[var(--app-primary)] text-2xl mb-1"></ion-icon>
            Session Chat
          </button>
          <button (click)="go('/app/coach/schedule')" class="success-action-btn shadow-sm">
            <ion-icon name="calendar-outline" class="text-[var(--app-primary)] text-2xl mb-1"></ion-icon>
            My Schedule
          </button>
          <button (click)="go('/app/coach/dashboard')" class="success-action-btn shadow-sm">
            <ion-icon name="home-outline" class="text-[var(--app-primary)] text-2xl mb-1"></ion-icon>
            Go Home
          </button>
        </div>
      </div>

      <!-- MAIN WIZARD FLOW -->
      <div *ngIf="!success()" class="plan-page">
        <!-- Sticky Wizard Header -->
        <div class="sticky-header">
          <div class="app-header-bar flex items-center justify-between px-5 bg-white border-b border-[#F3F4F6]">
            <p class="text-[12px] text-[#9CA3AF] font-bold m-0">Step {{ step() }} of 8</p>
            <button (click)="go('/app/coach/dashboard')" class="app-header-btn flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="close-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
          </div>
          <div class="py-3 bg-white flex justify-center">
            <!-- Progress indicator dots -->
            <div class="flex items-center gap-1.5" role="group" aria-label="Session setup steps">
              <button *ngFor="let s of [1,2,3,4,5,6,7,8]" type="button" (click)="goToStep(s)"
                class="h-3 rounded-full border-0 p-0 transition-all focus:outline-none focus:ring-2 focus:ring-orange-300"
                [attr.aria-label]="'Go to step ' + s + ': ' + stepTitles[s - 1]"
                [attr.aria-current]="step() === s ? 'step' : null"
                [style.width]="step() === s ? '24px' : '12px'"
                [style.backgroundColor]="step() > s ? '#FF7A00' : (step() === s ? 'var(--app-primary)' : '#E5E7EB')"></button>
            </div>
          </div>
        </div>

        <div class="px-5 pt-5 pb-32">
          <!-- STEP 1: Choose Sport -->
          <div *ngIf="step() === 1">
            <div class="step-title-block">
              <h2>Choose Sport</h2>
              <p>Select the sport you'll be coaching</p>
            </div>
            <div class="grid grid-cols-3 gap-3">
                <button *ngFor="let s of sportsOptions" (click)="selectSport(s.id)" class="sport-selection-btn"
                [style.borderColor]="sport === s.id ? 'var(--app-primary)' : 'transparent'"
                [style.boxShadow]="sport === s.id ? '0 0 0 3px rgba(var(--app-primary-rgb),0.20)' : 'none'">
                <img [src]="s.image" [alt]="s.name" class="sport-bg-img" />
                <div class="sport-overlay"></div>
                <div *ngIf="sport === s.id" class="sport-checked">
                  <ion-icon name="checkmark-outline" style="color:#111827;font-size:12px;font-weight:bold;"></ion-icon>
                </div>
                <div class="sport-label-wrap">
                  <span class="text-lg">{{ s.emoji }}</span>
                  <p class="text-white font-black text-[10px] mt-0.5">{{ s.name }}</p>
                </div>
              </button>
            </div>
          </div>

          <!-- STEP 2: Select Students -->
          <div *ngIf="step() === 2">
            <div class="step-title-block">
              <h2>Who are you coaching?</h2>
            </div>
            <p *ngIf="loading()" class="text-[13px] text-[#6B7280] mb-3">Loading your active students…</p>
            <p *ngIf="loadError()" class="text-[13px] text-[#DC2626] mb-3">{{ loadError() }}</p>
            <!-- Sub-tabs -->
            <div class="student-tabs" role="tablist" aria-label="Choose students">
              <button *ngFor="let t of ['my','batch','new']" type="button" role="tab" (click)="studTab = t"
                class="student-tab" [class.student-tab-active]="studTab === t"
                [attr.aria-selected]="studTab === t">
                {{ t === 'my' ? 'My Students' : t === 'batch' ? 'Previous Batch' : 'Add New' }}
              </button>
            </div>

            <!-- Selected Chips Wrap -->
            <div *ngIf="selStudents.length > 0" class="selected-chips-wrap mb-4">
              <div *ngFor="let id of selStudents" class="selected-chip">
                <img [src]="getStudentPhoto(id)" class="w-5 h-5 rounded-full object-cover" />
                <span>{{ getStudentName(id) }}</span>
                <button (click)="toggleStudent(id)" class="bg-transparent border-none p-0 flex items-center">
                  <ion-icon name="close-outline" class="text-slate-400"></ion-icon>
                </button>
              </div>
              <span class="text-[11px] font-black text-[var(--app-primary)] ml-2 self-center">{{ selStudents.length }} Selected</span>
            </div>

            <!-- List my students -->
            <div *ngIf="studTab === 'my'">
              <div class="flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-3 h-10 mb-3">
                <ion-icon name="search-outline" class="text-[#9CA3AF]"></ion-icon>
                <input [(ngModel)]="searchQ" placeholder="Search by name..." class="flex-1 bg-transparent text-[13px] text-[#111827] focus:outline-none min-h-0 border-none" />
              </div>
              <div class="space-y-2">
                <button *ngFor="let s of filterStudents()" (click)="toggleStudent(s.id)" class="student-select-row border-none shadow-sm"
                  [style.backgroundColor]="selStudents.includes(s.id) ? 'rgba(var(--app-primary-rgb),0.08)' : 'white'"
                  [style.border]="selStudents.includes(s.id) ? '1.5px solid var(--app-primary)' : '1.5px solid #F3F4F6'">
                  <img [src]="s.photo" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div class="flex-1 text-left">
                    <p class="text-[13px] font-bold text-[#111827]">{{ s.name }}</p>
                    <p class="text-[10px] text-[#9CA3AF]">{{ s.skill }} · {{ s.attendance }}% attendance</p>
                  </div>
                  <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    [style.backgroundColor]="selStudents.includes(s.id) ? 'var(--app-primary)' : '#F3F4F6'">
                    <ion-icon *ngIf="selStudents.includes(s.id)" name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                </button>
              </div>
              <p *ngIf="!loading() && !filterStudents().length" class="py-6 text-center text-[13px] text-[#6B7280]">No active students found. Accept a student request first.</p>
            </div>

            <!-- List batches -->
            <div *ngIf="studTab === 'batch'" class="space-y-3">
              <button *ngFor="let b of batchOptions" (click)="selectBatch(b)" class="batch-select-btn border-none shadow-sm"
                [style.backgroundColor]="selBatch === b.id ? 'rgba(var(--app-primary-rgb),0.08)' : 'white'"
                [style.border]="selBatch === b.id ? '1.5px solid var(--app-primary)' : '1.5px solid #F3F4F6'">
                <div class="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
                  <ion-icon name="people-outline" class="text-[#6B7280] text-lg"></ion-icon>
                </div>
                <div class="flex-1 text-left">
                  <p class="text-[14px] font-bold text-[#111827]">{{ b.label }}</p>
                  <p class="text-[11px] text-[#9CA3AF]">{{ b.members }} students · {{ b.sport }}</p>
                </div>
                <div *ngIf="selBatch === b.id" class="w-6 h-6 rounded-full bg-[var(--app-primary)] flex items-center justify-center">
                  <ion-icon name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
                </div>
              </button>
              <p *ngIf="!loading() && !batchOptions.length" class="py-6 text-center text-[13px] text-[#6B7280]">No previous group sessions yet. Create a session with two or more students to save a reusable batch.</p>
            </div>

            <!-- Add new -->
            <div *ngIf="studTab === 'new'">
              <div class="flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-3 h-12">
                <ion-icon name="search-outline" class="text-[#9CA3AF]"></ion-icon>
                <input placeholder="Search by name, mobile or TYNG ID…" class="flex-1 bg-transparent text-[14px] text-[#111827] focus:outline-none min-h-0 border-none" />
              </div>
            </div>
          </div>

          <!-- STEP 3: Choose Venue -->
          <div *ngIf="step() === 3">
            <div class="step-title-block">
              <h2>Select a Venue</h2>
              <p>Choose where you'll conduct the session</p>
            </div>
            <p *ngIf="loading()" class="text-[13px] text-[#6B7280]">Loading approved venues…</p>
            <p *ngIf="!loading() && !venueOptions.length" class="py-8 text-center text-[13px] text-[#6B7280]">No approved venues are available right now.</p>
            <div class="space-y-4">
              <button *ngFor="let v of availableVenues()" (click)="chooseVenue(v)" class="venue-select-btn border-none shadow-sm text-left bg-white"
                [style.border]="selectedVenue?.id === v.id ? '2.5px solid var(--app-primary)' : '2.5px solid transparent'">
                <div class="relative h-[120px] overflow-hidden bg-slate-200">
                  <img [src]="v.image" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <span *ngIf="v.isCoachFriendly" class="absolute top-3 left-3 text-[10px] font-bold bg-[#FF7A00] text-white px-2 py-0.5 rounded-full">Coach Friendly 🏋️</span>
                  <div *ngIf="selectedVenue?.id === v.id" class="absolute top-3 right-3 w-7 h-7 rounded-full bg-[var(--app-primary)] flex items-center justify-center">
                    <ion-icon name="checkmark-outline" style="font-size:14px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                  <div class="absolute bottom-2 right-3 bg-white/90 rounded-lg px-2 py-1">
                    <p class="text-[12px] font-black text-[#111827] m-0">₹{{ v.pricePerHour }}/hr</p>
                  </div>
                </div>
                <div class="px-4 py-3">
                  <div class="flex items-start justify-between mb-1">
                    <p class="text-[14px] font-black text-[#111827] m-0">{{ v.name }}</p>
                    <div class="flex items-center gap-1">
                      <ion-icon name="star" class="text-[#F59E0B] text-xs"></ion-icon>
                      <span class="text-[11px] font-bold text-[#111827]">{{ v.rating }}</span>
                    </div>
                  </div>
                  <p class="text-[11px] text-[#9CA3AF] m-0">{{ v.address }} · {{ v.distance }}</p>
                </div>
              </button>
            </div>
            <div *ngIf="selectedVenue" class="mt-5">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Select Facility</p>
              <div class="grid grid-cols-1 gap-2">
                <button *ngFor="let court of availableCourts()" type="button" (click)="chooseCourt(court)" class="facility-option text-left bg-white shadow-sm"
                  [style.border]="selectedCourtId === court.id ? '2px solid var(--app-primary)' : '2px solid #F3F4F6'">
                  <div class="flex items-center justify-between gap-3">
                    <div><p class="text-[13px] font-black text-[#111827] m-0">{{ court.name }}</p><p class="text-[11px] text-[#9CA3AF] m-0">{{ court.sport }}<span *ngIf="court.maxPlayers"> · Up to {{ court.maxPlayers }} players</span></p></div>
                    <span class="text-[12px] font-black text-[#111827]">₹{{ court.pricePerHour }}/hr</span>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 4: Date & Time -->
          <div *ngIf="step() === 4">
            <div class="step-title-block">
              <h2>Date &amp; Time</h2>
              <p>When will this session take place?</p>
            </div>
            <!-- Calendar row -->
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Select Date</p>
            <div class="flex gap-2.5 overflow-x-auto pb-1 mb-5 no-scrollbar">
              <button *ngFor="let d of dateOptions" (click)="selectDate(d.idx)" class="flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-2xl min-w-[54px] border-none shadow-sm"
                [style.backgroundColor]="dateIdx === d.idx ? 'rgba(var(--app-primary-rgb),0.12)' : 'white'"
                [style.border]="dateIdx === d.idx ? '2px solid var(--app-primary)' : '2px solid #F3F4F6'">
                <span class="text-[9px] font-bold" [style.color]="dateIdx === d.idx ? 'var(--app-primary)' : '#9CA3AF'">{{ d.isToday ? 'Today' : d.day }}</span>
                <span class="text-[18px] font-black text-[#111827] mt-0.5">{{ d.dateNum }}</span>
                <span class="text-[9px]" [style.color]="dateIdx === d.idx ? '#9CA3AF' : '#C4C9D4'">{{ d.monthShort }}</span>
              </button>
            </div>
            <!-- Time slots -->
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Select Time</p>
            <div *ngIf="selectedVenue" class="availability-hours">
              <ion-icon name="time-outline"></ion-icon>
              <span><strong>Venue hours</strong> {{ selectedVenue.openTime }} – {{ selectedVenue.closeTime }}</span>
              <span *ngIf="selectedVenue.slotIntervalMinutes" class="availability-gap">{{ selectedVenue.slotIntervalMinutes }} min gap</span>
            </div>
            <div *ngIf="availabilityLoading" class="py-5 flex items-center justify-center gap-2 text-[12px] text-[#6B7280]">
              <ion-spinner name="crescent"></ion-spinner><span>Checking venue availability…</span>
            </div>
            <div *ngIf="!availabilityLoading && availabilityMessage" class="availability-empty">
              <ion-icon name="calendar-clear-outline"></ion-icon>
              <span>{{ availabilityMessage }}</span>
              <button *ngIf="availabilityMessage.includes('could not be checked')" type="button" (click)="loadAvailableTimes()">Try again</button>
            </div>
            <div *ngIf="!availabilityLoading && availableTimes.length" class="time-periods">
              <section *ngFor="let period of availabilityPeriods" class="time-period" [hidden]="!timesForPeriod(period).length">
                <h3>{{ period }} <span>{{ timesForPeriod(period).length }} open</span></h3>
                <div class="time-slot-grid">
                  <button *ngFor="let t of timesForPeriod(period)" type="button" (click)="selectTime(t.label)"
                    class="time-slot-option" [class.time-slot-selected]="time === t.label">
                    <strong>{{ t.label }}</strong><small>until {{ t.endLabel }}</small>
                  </button>
                </div>
              </section>
            </div>
            <div *ngIf="!availabilityLoading && !availabilityMessage && !availableTimes.length" class="availability-empty">
              <ion-icon name="calendar-outline"></ion-icon>
              <span>Choose a venue and facility to check available times.</span>
            </div>
            <!-- Duration -->
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Duration</p>
            <div class="grid grid-cols-4 gap-2 mb-4">
              <button *ngFor="let d of durationsOptions" (click)="selectDuration(d.id)" class="py-3 rounded-2xl border-none text-center"
                [style.backgroundColor]="duration === d.id ? 'rgba(var(--app-primary-rgb),0.12)' : 'white'"
                [style.border]="duration === d.id ? '2px solid var(--app-primary)' : '2px solid #F3F4F6'">
                <p class="text-[12px] font-bold m-0" [style.color]="duration === d.id ? '#111827' : '#6B7280'">{{ d.label }}</p>
              </button>
            </div>
            <!-- Duration calculations -->
            <div *ngIf="time" class="bg-[#111827] rounded-2xl px-4 py-3 flex items-center justify-between text-white">
              <div class="flex items-center gap-2"><ion-icon name="time-outline" class="text-[var(--app-primary)]"></ion-icon><span class="text-[13px] font-bold">{{ time }}</span></div>
              <span class="text-white/40 text-[13px]">→</span>
              <span class="text-[13px] font-bold">{{ getEndTime() }}</span>
            </div>
          </div>

          <!-- STEP 5: Training Details -->
          <div *ngIf="step() === 5" class="space-y-5">
            <div class="step-title-block">
              <h2>Training Details</h2>
            </div>
            <!-- Session type -->
            <div>
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Session Type</p>
              <div class="grid grid-cols-3 gap-2">
                <button *ngFor="let t of sessionTypeOptions" (click)="sessType = t.id" class="flex flex-col items-center py-4 rounded-[20px] border-none shadow-sm bg-white"
                  [style.backgroundColor]="sessType === t.id ? 'rgba(var(--app-primary-rgb),0.10)' : 'white'"
                  [style.border]="sessType === t.id ? '2px solid var(--app-primary)' : '2px solid #F3F4F6'">
                  <span class="text-2xl mb-1.5">{{ t.emoji }}</span>
                  <p class="text-[11px] font-black text-[#111827] m-0">{{ t.label }}</p>
                </button>
              </div>
            </div>
            <!-- Training focus -->
            <div>
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Training Focus</p>
              <div class="chips-grid">
                <button *ngFor="let f of focusOptions" (click)="toggleFocus(f)" class="chip-btn border-none"
                  [class.chip-active]="trainingFocus.includes(f)">
                  {{ f }}
                </button>
              </div>
            </div>
            <!-- Steppers -->
            <div>
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-2">Maximum Students</p>
              <div class="flex items-center gap-4 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
                <button (click)="maxStuds = Math.max(1, maxStuds - 1)" class="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center border-none">
                  <ion-icon name="remove-outline" class="text-[#6B7280]"></ion-icon>
                </button>
                <p class="flex-1 text-center text-[22px] font-black text-[#111827] m-0">{{ maxStuds }}</p>
                <button (click)="maxStuds = maxStuds + 1" class="w-9 h-9 rounded-full flex items-center justify-center border-none btn-green-gradient text-[#111827]">
                  <ion-icon name="add-outline"></ion-icon>
                </button>
              </div>
            </div>
            <div>
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-2">Minimum Required</p>
              <div class="flex items-center gap-4 bg-white rounded-2xl px-4 py-3 shadow-sm border border-slate-100">
                <button (click)="minStuds = Math.max(1, minStuds - 1)" class="w-9 h-9 rounded-full bg-[#F3F4F6] flex items-center justify-center border-none">
                  <ion-icon name="remove-outline" class="text-[#6B7280]"></ion-icon>
                </button>
                <p class="flex-1 text-center text-[22px] font-black text-[#111827] m-0">{{ minStuds }}</p>
                <button (click)="minStuds = Math.min(maxStuds, minStuds + 1)" class="w-9 h-9 rounded-full flex items-center justify-center border-none btn-green-gradient text-[#111827]">
                  <ion-icon name="add-outline"></ion-icon>
                </button>
              </div>
            </div>
            <!-- Notes -->
            <div>
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-2">Session Notes (Optional)</p>
              <textarea [(ngModel)]="notes" rows="3" placeholder="Any special instructions for this session…"
                class="w-full p-4 rounded-2xl text-[14px] text-[#111827] placeholder:text-[#C4C9D4] focus:outline-none resize-none border border-slate-200 bg-white"></textarea>
            </div>
          </div>

          <!-- STEP 6: Equipment -->
          <div *ngIf="step() === 6" class="space-y-5">
            <div class="step-title-block">
              <h2>Equipment</h2>
              <p>What equipment is needed for this session?</p>
            </div>
            <div>
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Select Equipment</p>
              <div class="chips-grid">
                <button *ngFor="let e of equipmentOptions" (click)="toggleEquip(e)" class="chip-btn border-none"
                  [class.chip-active]="equip.includes(e)">
                  {{ e }}
                </button>
              </div>
            </div>
            <div>
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Equipment Source</p>
              <div class="space-y-2.5">
                <button *ngFor="let s of equipSourceOptions" (click)="equipSrc = s.id" class="equipment-source-option"
                  [style.backgroundColor]="equipSrc === s.id ? 'rgba(var(--app-primary-rgb),0.08)' : 'white'"
                  [style.borderColor]="equipSrc === s.id ? 'var(--app-primary)' : '#F3F4F6'">
                  <div class="flex items-center gap-3">
                    <div class="equipment-source-icon" [style.backgroundColor]="equipSrc === s.id ? 'var(--app-primary)' : '#F3F4F6'">
                      <ion-icon [name]="s.id === 'venue' ? 'business-outline' : s.id === 'coach' ? 'whistle-outline' : 'people-outline'" [style.color]="equipSrc === s.id ? '#111827' : '#6B7280'"></ion-icon>
                    </div>
                    <div class="text-left">
                      <p class="text-[14px] font-black text-[#111827] m-0">{{ s.label }}</p>
                      <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5">{{ s.id === 'venue' ? 'Confirm availability with the venue' : s.id === 'coach' ? 'Bring equipment for this session' : 'Ask students to bring their own' }}</p>
                    </div>
                  </div>
                  <div class="equipment-source-radio" [class.equipment-source-radio-selected]="equipSrc === s.id">
                    <ion-icon *ngIf="equipSrc === s.id" name="checkmark-outline"></ion-icon>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 7: Smart Pricing -->
          <div *ngIf="step() === 7" class="space-y-4">
            <div class="rounded-[24px] p-5 relative overflow-hidden bg-gradient-to-br from-[#111827] to-[#1F2937] text-white">
              <div class="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[var(--app-primary)]/10"></div>
              <div class="relative">
                <div class="flex items-center gap-2 mb-2">
                  <ion-icon name="sparkles" class="text-[var(--app-primary)]"></ion-icon>
                  <p class="text-[14px] font-black text-[var(--app-primary)] m-0">TYNG Smart Pricing</p>
                  <span class="text-[9px] bg-[var(--app-primary)]/20 text-[var(--app-primary)] px-2 py-0.5 rounded-full font-black">AI</span>
                </div>
                <p class="text-[12px] text-white/50 mb-4 leading-normal">Enter only your coaching fee. TYNG calculates everything else automatically.</p>
                <div class="bg-white/10 rounded-2xl p-4">
                  <p class="text-[11px] text-white/50 mb-1 font-bold">Your Coaching Fee</p>
                  <div class="flex items-baseline gap-2">
                    <span class="text-[22px] font-bold text-white/50">₹</span>
                    <input type="number" [(ngModel)]="coachFee" placeholder="Enter amount"
                      class="flex-1 bg-transparent text-[36px] font-black text-white focus:outline-none min-h-0 placeholder:text-white/25 border-none outline-none" />
                  </div>
                </div>
              </div>
            </div>

            <!-- Auto breakdown details -->
            <div *ngIf="getCoachFeeNumber() > 0" class="section-card p-5">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Auto-Calculated Breakdown</p>
              <div class="space-y-2">
                <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                  <span class="text-[13px] text-[#6B7280]">Your Coaching Fee</span>
                  <span class="text-[13px] font-bold text-[#111827]">₹{{ getCoachFeeNumber() }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                  <div>
                    <p class="text-[13px] text-[#6B7280] m-0">Venue Cost</p>
                    <p class="text-[10px] text-[#C4C9D4] m-0">{{ getDurationLabel() }} at {{ selectedVenue?.name || 'Venue' }}</p>
                  </div>
                  <span class="text-[13px] font-bold text-[#6B7280]">₹{{ getVenueCost() }}</span>
                </div>
                <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                  <span class="text-[13px] text-[#6B7280]">Platform Fee</span>
                  <span class="text-[13px] font-bold text-[#6B7280]">₹49</span>
                </div>
                <div class="flex justify-between py-2 border-b border-[#F9FAFB]">
                  <span class="text-[13px] text-[#6B7280]">GST (18%)</span>
                  <span class="text-[13px] font-bold text-[#6B7280]">₹{{ getGst() }}</span>
                </div>
                <div *ngIf="coupon" class="flex justify-between py-2 border-b border-[#F9FAFB] text-[#22C55E]">
                  <span class="text-[13px]">Coupon: {{ coupon.code }}</span>
                  <span class="text-[13px] font-bold">-₹{{ coupon.discount }}</span>
                </div>
              </div>

              <!-- Coupon input -->
              <div *ngIf="!coupon" class="coupon-entry">
                <input [(ngModel)]="couponInp" placeholder="Enter coupon code" aria-label="Coupon code"
                  class="coupon-input" />
                <button type="button" (click)="applyCoupon()" [disabled]="!couponInp.trim()" class="coupon-apply"
                  [style.backgroundColor]="couponInp.trim() ? 'var(--app-primary)' : '#F3F4F6'"
                  [style.color]="couponInp.trim() ? '#111827' : '#C4C9D4'">
                  Apply
                </button>
              </div>
              <div *ngIf="coupon" class="flex items-center gap-2 bg-[#F0FDF4] rounded-xl px-3 py-2 mt-3">
                <ion-icon name="checkmark-circle-outline" class="text-[#22C55E]"></ion-icon>
                <span class="text-[12px] font-bold text-[#111827] flex-1">{{ coupon.code }} applied</span>
                <button (click)="coupon = null" class="bg-transparent border-none p-0 flex"><ion-icon name="close-outline" class="text-[#9CA3AF]"></ion-icon></button>
              </div>
              <p *ngIf="couponErr" class="text-[11px] text-[#EF4444] mt-1 m-0">{{ couponErr }}</p>
            </div>

            <!-- Total payments per student -->
            <div *ngIf="getCoachFeeNumber() > 0" class="rounded-[24px] p-5 text-center bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-primary-to)] shadow-md">
              <p class="text-[12px] font-black text-[#111827]/60 uppercase tracking-wider mb-1">Each Student Pays</p>
              <p class="text-[48px] font-black text-[#111827] leading-none m-0">₹{{ getPricePerStudent() }}</p>
              <p class="text-[12px] text-[#111827]/50 mt-1 mb-0">÷ {{ getNumStudents() }} student{{ getNumStudents() !== 1 ? 's' : '' }}</p>
            </div>

            <div *ngIf="getCoachFeeNumber() > 0" class="bg-[#FFF7ED] rounded-2xl p-4">
              <p class="text-[12px] text-[#C2410C] leading-relaxed m-0">
                💡 Students see only one final price. TYNG automatically splits payments between the venue, coach and platform.
              </p>
            </div>
          </div>

          <!-- STEP 8: Review & Publish -->
          <div *ngIf="step() === 8" class="space-y-4">
            <div class="step-title-block">
              <h2>Review &amp; Publish</h2>
              <p>Confirm your session details</p>
            </div>

            <!-- Title generated -->
            <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
              <p class="text-[11px] text-[#9CA3AF] font-black uppercase tracking-wider mb-2">Session Title (Auto-generated)</p>
              <input [(ngModel)]="sessionTitle" placeholder="Add a session title" aria-label="Session title"
                class="w-full text-[16px] font-black text-[#111827] bg-[#F9FAFB] rounded-xl px-3 py-2.5 focus:outline-none min-h-0 border-none" />
            </div>

            <!-- Summary metrics -->
            <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Session Summary</p>
              <div class="space-y-2">
                <div *ngFor="let summary of getSummaryList()" class="flex items-center justify-between py-2 border-b border-[#F9FAFB] last:border-none">
                  <span class="text-[13px] text-[#6B7280]">{{ summary.emoji }} {{ summary.label }}</span>
                  <span class="text-[13px] font-bold text-[#111827]">{{ summary.val }}</span>
                </div>
              </div>
            </div>

            <!-- Automation toggle -->
            <div class="bg-white rounded-[24px] overflow-hidden border border-[var(--app-primary)]/22 shadow-md">
              <div class="px-5 py-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-[var(--app-primary)]/15 flex items-center justify-center flex-shrink-0">
                  <ion-icon name="flash-outline" class="text-[var(--app-primary)] text-xl"></ion-icon>
                </div>
                <div class="flex-1">
                  <p class="text-[14px] font-black text-[#111827] m-0">Automatically Manage Session</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">TYNG handles invitations, scheduling & more</p>
                </div>
                <button (click)="automate = !automate" class="toggle-btn" [class.toggle-on]="automate">
                  <div class="toggle-thumb" [class.toggle-thumb-on]="automate"></div>
                </button>
              </div>
              <div *ngIf="automate" class="px-5 py-4 space-y-2.5 border-t border-[#F3F4F6]">
                <div *ngFor="let task of ['Create Coaching Session','Invite Selected Students','Add Session to Student Calendars','Add Session to Coach Schedule','Create Dedicated Session Chat','Generate Attendance QR Code','Send Automatic Reminders','Collect Session Feedback']"
                  class="flex items-center gap-2.5">
                  <div class="w-5 h-5 rounded-full bg-[var(--app-primary)] flex items-center justify-center flex-shrink-0">
                    <ion-icon name="checkmark-outline" style="font-size:11px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                  <span class="text-[13px] text-[#111827]">{{ task }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky Bottom continue bar -->
        <div class="fixed-bottom-bar bg-white px-5 pt-3 pb-8">
          <div class="flex items-center gap-4">
            <div *ngIf="getCoachFeeNumber() > 0; else stepInfo" class="flex-shrink-0">
              <p class="text-[10px] text-[#9CA3AF] font-bold mb-0">Your Earnings</p>
              <p class="text-[18px] font-black text-[#111827] m-0">₹{{ getCoachFeeNumber() }}</p>
              <p class="text-[10px] text-[var(--app-primary)] font-bold m-0">₹{{ getPricePerStudent() }} / student</p>
            </div>
            <ng-template #stepInfo>
              <div class="flex-shrink-0">
                <p class="text-[10px] text-[#9CA3AF] font-bold mb-0">Step {{ step() }} of 8</p>
                <p class="text-[14px] font-black text-[#111827] m-0">{{ getStepTitleLabel() }}</p>
              </div>
            </ng-template>

            <button (click)="handleNext()" [disabled]="!canProceed() || publishing()" class="flex-1 h-12 rounded-2xl text-[15px] font-black flex items-center justify-center gap-2 border-none"
              [style.background]="canProceed() ? 'linear-gradient(135deg,#FF7A00,#FF9A40)' : '#F3F4F6'"
              [style.color]="canProceed() ? 'white' : '#C4C9D4'">
              {{ step() === 8 ? (publishing() ? 'Publishing…' : 'Publish Session') : 'Continue' }}
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
          </div>
          <p *ngIf="publishError()" class="mt-2 text-center text-[12px] text-[#DC2626]">{{ publishError() }}</p>
        </div>
      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .plan-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .success-shell {
      width: min(100%, 480px);
      min-height: 100%;
      box-sizing: border-box;
      margin: 0 auto;
      padding: 24px 20px calc(24px + env(safe-area-inset-bottom));
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      gap: 16px;
      background: #FAFBFC;
    }

    .success-circle {
      width: 68px;
      height: 68px;
      border-radius: 50%;
      background: var(--app-primary);
      display: grid;
      place-items: center;
      box-shadow: 0 8px 24px rgba(var(--app-primary-rgb), .25);
    }

    .success-circle ion-icon { color: #173000; font-size: 34px; font-weight: 900; }
    .success-hero { display:flex; width:100%; flex-direction:column; align-items:center; text-align:center; }
    .success-hero h1 { margin:4px 0 0; color:#111827; font-size:25px; font-weight:900; line-height:1.2; }
    .success-hero p { max-width:340px; margin:7px 0 0; color:#667085; font-size:13px; line-height:1.45; }
    .success-checklist { width:100%; box-sizing:border-box; padding:14px 16px 8px; border:1px solid #EAECF0; border-radius:20px; background:#fff; box-shadow:0 4px 14px rgba(16,24,40,.045); }
    .success-card-title { margin:0 0 5px; color:#98A2B3; font-size:10px; font-weight:850; letter-spacing:.1em; text-transform:uppercase; }
    .success-check-row { display:flex; min-height:46px; align-items:center; gap:11px; border-bottom:1px solid #F2F4F7; color:#344054; font-size:12px; font-weight:750; }
    .success-check-row-last { border-bottom:0; }
    .success-check-icon { width:24px; height:24px; flex:0 0 24px; display:grid; place-items:center; border-radius:50%; background:var(--app-primary); color:#203600; }
    .success-check-icon ion-icon { font-size:14px; font-weight:900; }
    .success-actions { display:grid; width:100%; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }

    .success-action-btn {
      display: flex;
      min-height:82px;
      min-width:0;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap:5px;
      padding: 12px 8px;
      border:1px solid #EAECF0;
      background: white;
      border-radius: 17px;
      font-size: 12px;
      font-weight: 800;
      color: #111827;
      cursor: pointer;
      transition:transform .15s ease, box-shadow .15s ease;
    }
    .success-action-btn:active { transform:scale(.98); }
    .success-action-btn ion-icon { color:#65A30D; font-size:23px; }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 20;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .step-title-block {
      margin-bottom: 20px;
    }

    .step-title-block h2 {
      font-size: 22px;
      font-weight: 900;
      color: #111827;
      margin: 0;
    }

    .step-title-block p {
      font-size: 13px;
      color: #9CA3AF;
      margin: 4px 0 0;
    }

    .student-tabs {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      align-items: center;
      gap: 4px;
      width: 100%;
      min-height: 48px;
      margin: 0 0 18px;
      padding: 4px;
      box-sizing: border-box;
      border: 1px solid #E8EBEF;
      border-radius: 16px;
      background: #F3F4F6;
    }

    .student-tab {
      display: flex;
      min-width: 0;
      min-height: 38px;
      align-items: center;
      justify-content: center;
      padding: 0 5px;
      border: 1px solid transparent;
      border-radius: 12px;
      background: transparent;
      color: #667085;
      font-size: 12px;
      font-weight: 700;
      line-height: 1.15;
      text-align: center;
      white-space: nowrap;
      transition: background-color .18s ease, color .18s ease, box-shadow .18s ease;
    }

    .student-tab-active {
      border-color: #EEF0F3;
      background: #FFFFFF;
      color: #111827;
      box-shadow: 0 2px 5px rgba(16, 24, 40, .08);
    }

    .availability-hours {
      display: flex;
      min-height: 40px;
      align-items: center;
      gap: 7px;
      margin: -3px 0 12px;
      padding: 0 11px;
      border: 1px solid #E8EBEF;
      border-radius: 12px;
      background: #FFFFFF;
      color: #667085;
      font-size: 10px;
    }

    .availability-hours > ion-icon { color: #65A30D; font-size: 16px; }
    .availability-hours strong { margin-right: 3px; color: #344054; font-weight: 800; }
    .availability-gap { margin-left: auto; color: #667085; white-space: nowrap; }

    .time-periods { display: grid; gap: 15px; margin: 0 0 20px; }
    .time-period h3 {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin: 0 0 8px;
      color: #475467;
      font-size: 11px;
      font-weight: 850;
    }
    .time-period h3 span { color: #98A2B3; font-size: 10px; font-weight: 650; }
    .time-slot-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
    .time-slot-option {
      display: grid;
      min-width: 0;
      min-height: 50px;
      align-content: center;
      gap: 3px;
      padding: 6px 3px;
      border: 1px solid #E4E7EC;
      border-radius: 13px;
      background: #FFFFFF;
      color: #344054;
      box-shadow: 0 2px 5px rgba(16, 24, 40, .045);
      text-align: center;
      transition: border-color .16s ease, background-color .16s ease, transform .16s ease;
    }
    .time-slot-option strong { font-size: 11px; font-weight: 850; line-height: 1.2; }
    .time-slot-option small { color: #98A2B3; font-size: 9px; line-height: 1.1; }
    .time-slot-option.time-slot-selected {
      border-color: var(--app-primary);
      background: rgba(var(--app-primary-rgb), .14);
      color: #111827;
      box-shadow: 0 3px 9px rgba(var(--app-primary-rgb), .14);
    }
    .time-slot-selected small { color: #475467; }
    .availability-empty {
      display: flex;
      min-height: 72px;
      align-items: center;
      justify-content: center;
      gap: 9px;
      margin-bottom: 18px;
      padding: 12px;
      border: 1px dashed #D0D5DD;
      border-radius: 14px;
      background: #FFFFFF;
      color: #667085;
      font-size: 11px;
      line-height: 1.4;
    }
    .availability-empty ion-icon { flex: 0 0 auto; color: #98A2B3; font-size: 18px; }
    .availability-empty button { padding: 5px 8px; border-radius: 8px; background: #F3F4F6; color: #344054; font-size: 10px; font-weight: 800; }

    .coupon-entry {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 76px;
      gap: 10px;
      margin-top: 14px;
    }
    .coupon-input {
      width: 100%;
      min-width: 0;
      height: 48px;
      padding: 0 14px;
      box-sizing: border-box;
      border: 1px solid #EAECF0;
      border-radius: 14px;
      outline: none;
      background: #F8F9FB;
      color: #111827;
      font: inherit;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: .035em;
      text-transform: uppercase;
    }
    .coupon-input::placeholder { color: #98A2B3; font-weight: 500; letter-spacing: 0; text-transform: uppercase; }
    .coupon-input:focus { border-color: #A3E635; box-shadow: 0 0 0 3px rgba(163, 230, 53, .16); }
    .coupon-apply {
      display: flex;
      width: 76px;
      min-width: 76px;
      height: 48px;
      align-items: center;
      justify-content: center;
      padding: 0 8px;
      border: 0;
      border-radius: 14px;
      font-size: 12px;
      font-weight: 850;
      white-space: nowrap;
    }
    .coupon-apply:disabled { cursor: default; }

    /* Sport btn */
    .sport-selection-btn {
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      aspect-ratio: 3/4;
      cursor: pointer;
      border: 2.5px solid transparent;
      padding: 0;
    }

    .sport-bg-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .sport-overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(0,0,0,0.75), transparent);
    }

    .sport-checked {
      position: absolute;
      top: 8px; right: 8px;
      width: 24px; height: 24px;
      border-radius: 50%;
      background: var(--app-primary);
      display: flex; align-items: center; justify-content: center;
    }

    .sport-label-wrap {
      position: absolute;
      bottom: 8px; left: 0; right: 0;
      text-align: center;
    }

    /* Selected student chips */
    .selected-chips-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      background: rgba(var(--app-primary-rgb),0.08);
      border-radius: 16px;
      padding: 12px;
    }

    .selected-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      background: white;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      color: #111827;
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
    }

    /* Student Select Row */
    .student-select-row {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-radius: 16px;
      cursor: pointer;
      background: white;
    }

    /* Batch Select */
    .batch-select-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      border-radius: 20px;
      background: white;
      cursor: pointer;
    }

    /* Venue select */
    .venue-select-btn {
      display: block;
      width: 100%;
      border-radius: 22px;
      overflow: hidden;
      cursor: pointer;
      padding: 0;
      text-align: left;
      box-shadow: 0 2px 8px rgba(15, 23, 42, .08);
      transition: border-color .18s ease, box-shadow .18s ease;
    }

    .facility-option {
      display: flex;
      width: 100%;
      min-height: 68px;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 12px 14px;
      border: 1.5px solid #E5E7EB;
      border-radius: 16px;
      box-sizing: border-box;
      line-height: 1.4;
    }

    .facility-option > div {
      min-width: 0;
      flex: 1;
    }

    .facility-option p {
      margin: 0;
      white-space: normal;
      overflow-wrap: anywhere;
    }

    .facility-option p + p {
      margin-top: 4px;
      color: #9CA3AF;
      font-size: 11px;
      line-height: 1.35;
    }

    .facility-option > span {
      flex: 0 0 auto;
      white-space: nowrap;
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
      cursor: pointer;
    }

    .chip-active {
      background: rgba(var(--app-primary-rgb),0.14);
      color: #111827;
      border-color: var(--app-primary);
      border: 1.5px solid var(--app-primary);
    }

    .equipment-source-option {
      width: 100%; min-height: 72px; display: flex; align-items: center; justify-content: space-between;
      padding: 12px 14px; border: 1.5px solid #E5E7EB; border-radius: 18px;
      box-shadow: 0 2px 8px rgba(15, 23, 42, .04); transition: all .18s ease;
    }
    .equipment-source-option:active { transform: scale(.985); }
    .equipment-source-icon {
      width: 38px; height: 38px; display: flex; align-items: center; justify-content: center;
      border-radius: 13px; font-size: 18px; flex-shrink: 0;
    }
    .equipment-source-radio {
      width: 22px; height: 22px; border: 2px solid #D1D5DB; border-radius: 50%; display: flex;
      align-items: center; justify-content: center; color: #111827; flex-shrink: 0;
    }
    .equipment-source-radio-selected { background: var(--app-primary); border-color: var(--app-primary); }
    .equipment-source-radio ion-icon { font-size: 13px; font-weight: 900; }

    .btn-green-gradient {
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      box-shadow: 0 2px 8px rgba(var(--app-primary-rgb),0.38);
    }

    .btn-orange-gradient {
      background: linear-gradient(135deg, #FF7A00, #FF9A40);
      box-shadow: 0 4px 16px rgba(255, 122, 0, 0.40);
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

    /* Section Card */
    .section-card {
      background: #FFFFFF;
      border-radius: 24px;
      box-shadow: 0 2px 16px rgba(0, 0, 0, 0.07);
    }

    /* Fixed bottom bar */
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

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }
  `]
})
export class CoachPlanPage implements OnInit {
  readonly Math = Math;
  private readonly router = inject(Router);
  private readonly coachService = inject(CoachService);
  loading = signal(false);
  publishing = signal(false);
  loadError = signal('');
  publishError = signal('');
  sessionCreationMessage = signal('Your session is being created.');
  sessionCreatedConfirmed = signal(false);

  // Flow step State
  step = signal(1);
  success = signal(false);

  // Step variables
  sport = '';
  studTab = 'my';
  selStudents: number[] = [];
  selBatch = '';
  searchQ = '';
  selectedVenue: Venue | null = null;
  selectedCourtId: number | null = null;
  dateIdx = 0;
  time = '';
  duration = '60min';
  availableTimes: CoachAvailabilitySlot[] = [];
  readonly availabilityPeriods: CoachAvailabilitySlot['period'][] = ['Morning', 'Afternoon', 'Evening'];
  availabilityLoading = false;
  availabilityMessage = '';
  private availabilityRequest = 0;
  sessType = '';
  trainingFocus: string[] = [];
  maxStuds = 12;
  minStuds = 5;
  notes = '';
  equip: string[] = [];
  equipSrc = 'venue';
  coachFee = '';
  couponInp = '';
  coupon: { code: string; discount: number } | null = null;
  couponErr = '';
  automate = true;
  sessionTitle = '';
  private generatedSessionTitle = '';

  readonly sportsOptions = SPORTS;
  readonly stepTitles = ['Choose Sport', 'Select Students', 'Choose Venue', 'Date & Time', 'Training Details', 'Equipment', 'Set Pricing', 'Review & Publish'];
  batchOptions: Array<{ id: string; label: string; sport: string; members: number; studentIds: number[] }> = [];
  venueOptions: Venue[] = [];
  studentOptions: Student[] = [];
  readonly durationsOptions = DURATIONS;
  readonly sessionTypeOptions = SESSION_TYPES;
  readonly focusOptions = TRAINING_FOCUS;
  readonly equipmentOptions = EQUIPMENT_OPTS;
  readonly equipSourceOptions = EQUIP_SOURCES;
  dateOptions = buildDates();

  ngOnInit(): void {
    void this.loadPlanningData();
  }

  private async loadPlanningData(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const [studentsResponse, venuesResponse, batchesResponse, profileResponse] = await Promise.all([
        firstValueFrom(this.coachService.getStudents()),
        firstValueFrom(this.coachService.getSchedulingVenues()),
        firstValueFrom(this.coachService.getSessionBatches()),
        firstValueFrom(this.coachService.getMyCoachProfileDetails()),
      ]);
      const students = studentsResponse.data?.data ?? studentsResponse.data ?? [];
      const venues = venuesResponse.data ?? [];
      this.studentOptions = students.map((item: any) => ({
        id: Number(item.student?.id ?? item.student_id),
        name: item.student?.name ?? 'Student',
        photo: item.student?.profile_image || 'assets/icon/favicon.png',
        skill: item.student?.level || 'Player',
        attendance: 0,
      })).filter((item: Student) => item.id > 0);
      this.venueOptions = venues.map((item: any) => {
        const courts = (item.courts || []).map((court: any) => ({
          id: Number(court.id), name: court.name || 'Facility', sport: court.sport || 'Sport',
          pricePerHour: Number(court.price_per_hour || 0), maxPlayers: court.max_players ? Number(court.max_players) : null,
        })).filter((court: VenueCourt) => court.id > 0);
        return {
          id: Number(item.id), name: item.name, image: resolveMediaUrl(item.image) || 'assets/icon/favicon.png',
          distance: '', pricePerHour: courts[0]?.pricePerHour || 0, rating: 0,
          address: item.location || 'Location pending', sportEmojis: [], isCoachFriendly: item.partnership?.status === 'active',
          courts,
          openTime: item.open_time || '6:00 AM', closeTime: item.close_time || '10:00 PM',
          slotIntervalMinutes: Number(item.slot_interval_minutes || 0),
        };
      }).filter((item: Venue) => item.id > 0 && item.courts.length > 0);
      this.batchOptions = (batchesResponse.data || []).map((item: any) => ({
        id: String(item.id), label: item.label || 'Previous group session', sport: item.sport || 'Training',
        members: Number(item.members || 0), studentIds: (item.studentIds || []).map(Number),
      }));
      if (!this.coachFee) {
        this.coachFee = String(profileResponse.data?.feeOptions?.['individual'] ?? '');
      }
    } catch {
      this.loadError.set('Could not load your students and venues. Please try again.');
    } finally {
      this.loading.set(false);
    }
  }

  handleBack() {
    if (this.step() === 1) {
      this.router.navigateByUrl('/app/coach/dashboard');
    } else {
      this.step.update(s => s - 1);
    }
  }

  canProceed(): boolean {
    const s = this.step();
    if (s === 1) return this.sport !== '';
    if (s === 2) return this.selStudents.length > 0 || this.selBatch !== '';
    if (s === 3) return this.selectedVenue !== null && this.selectedCourtId !== null;
    if (s === 4) return this.time !== '';
    if (s === 5) return this.sessType !== '';
    if (s === 7) return this.getCoachFeeNumber() > 0;
    return true;
  }

  goToStep(step: number): void {
    if (step < 1 || step > 8 || this.publishing() || this.success()) return;
    this.step.set(step);
    this.publishError.set('');
    if (step === 8) this.refreshGeneratedTitle();
    if (step === 4) void this.loadAvailableTimes();
  }

  selectSport(sportId: string): void {
    this.sport = sportId;
    if (this.selectedVenue && !this.selectedVenue.courts.some(court => this.courtSupportsSelectedSport(court))) {
      this.selectedVenue = null;
      this.selectedCourtId = null;
    } else if (this.selectedVenue) {
      this.selectedCourtId = this.preferredCourt(this.selectedVenue)?.id ?? null;
    }
    this.refreshGeneratedTitle();
  }

  handleNext() {
    if (this.step() < 8) {
      this.step.update(s => s + 1);
      if (this.step() === 8) this.refreshGeneratedTitle();
      if (this.step() === 4) void this.loadAvailableTimes();
    } else {
      void this.publishSession();
    }
  }

  toggleStudent(id: number) {
    this.selStudents = this.selStudents.includes(id)
      ? this.selStudents.filter(x => x !== id)
      : [...this.selStudents, id];
    this.refreshGeneratedTitle();
  }

  selectBatch(batch: { id: string; studentIds: number[] }): void {
    const isSelected = this.selBatch === batch.id;
    this.selBatch = isSelected ? '' : batch.id;
    this.selStudents = isSelected ? [] : batch.studentIds;
    this.refreshGeneratedTitle();
  }

  getStudentPhoto(id: number) {
    return this.studentOptions.find(s => s.id === id)?.photo ?? 'assets/icon/favicon.png';
  }

  getStudentName(id: number) {
    return this.studentOptions.find(s => s.id === id)?.name.split(' ')[0] ?? 'Student';
  }

  filterStudents() {
    if (!this.searchQ) return this.studentOptions;
    return this.studentOptions.filter(s => s.name.toLowerCase().includes(this.searchQ.toLowerCase()));
  }

  getEndTime(): string {
    if (!this.time) return '';
    const dur = this.durationsOptions.find(d => d.id === this.duration);
    const hrs = dur?.hrs ?? 1;
    return this.displayTime(this.toMinutes(this.time) + hrs * 60);
  }

  selectDate(index: number): void {
    this.dateIdx = index;
    this.time = '';
    void this.loadAvailableTimes();
  }

  selectDuration(id: string): void {
    this.duration = id;
    this.time = '';
    void this.loadAvailableTimes();
  }

  selectTime(value: string): void {
    this.time = value;
    this.availabilityMessage = '';
  }

  async loadAvailableTimes(): Promise<void> {
    const venue = this.selectedVenue;
    const court = this.selectedCourt();
    if (!venue || !court || this.step() !== 4) {
      this.availableTimes = [];
      this.availabilityMessage = '';
      return;
    }

    const requestId = ++this.availabilityRequest;
    const durationMinutes = Math.round((this.durationsOptions.find(item => item.id === this.duration)?.hrs ?? 1) * 60);
    this.availabilityLoading = true;
    this.availabilityMessage = '';
    try {
      const response = await firstValueFrom(this.coachService.getVenueAvailability(
        venue.id, court.id, this.sessionDate(), durationMinutes,
      ));
      if (requestId !== this.availabilityRequest) return;
      const slots = Array.isArray(response.data?.slots) ? response.data.slots : [];
      this.availableTimes = slots.map((slot: any) => ({
        label: String(slot.label || this.displayTime(this.toMinutes(slot.startTime || ''))),
        endLabel: String(slot.endLabel || this.displayTime(this.toMinutes(slot.endTime || ''))),
        period: (['Morning', 'Afternoon', 'Evening'].includes(slot.period) ? slot.period : 'Afternoon') as CoachAvailabilitySlot['period'],
      }));
      if (!this.availableTimes.some(slot => slot.label === this.time)) this.time = '';
      this.availabilityMessage = this.availableTimes.length
        ? ''
        : `No available times for this date. There is a ${venue.slotIntervalMinutes || 0}-minute venue break between booking slots.`;
    } catch (error: any) {
      if (requestId !== this.availabilityRequest) return;
      this.availableTimes = [];
      this.time = '';
      this.availabilityMessage = error?.error?.message || 'Venue availability could not be checked. Please try again.';
    } finally {
      if (requestId === this.availabilityRequest) this.availabilityLoading = false;
    }
  }

  timesForPeriod(period: CoachAvailabilitySlot['period']): CoachAvailabilitySlot[] {
    return this.availableTimes.filter(slot => slot.period === period);
  }

  private toMinutes(value: string): number {
    const match = String(value).trim().match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return 0;
    let hour = Number(match[1]);
    const minutes = Number(match[2] || 0);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hour < 12) hour += 12;
    if (meridiem === 'AM' && hour === 12) hour = 0;
    return hour * 60 + minutes;
  }

  private displayTime(total: number): string {
    const normalized = ((total % 1440) + 1440) % 1440;
    const hour = Math.floor(normalized / 60);
    const minutes = normalized % 60;
    return `${hour % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hour >= 12 ? 'PM' : 'AM'}`;
  }

  private timeForApi(display: string): string {
    const minutes = this.toMinutes(display);
    return `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`;
  }

  private sessionDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + this.dateIdx);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private async publishSession(): Promise<void> {
    if (this.publishing()) return;
    this.publishError.set('');
    this.publishing.set(true);
    try {
      const response = await firstValueFrom(this.coachService.createSession({
        title: this.sessionTitle.trim(), sport: this.sportsOptions.find(s => s.id === this.sport)?.name || this.sport,
        student_ids: this.selStudents, venue_court_id: this.selectedCourtId,
        session_date: this.sessionDate(), start_time: this.timeForApi(this.time), end_time: this.timeForApi(this.getEndTime()),
        coach_fee: this.getCoachFeeNumber(),
        description: `Type: ${this.sessType}; Focus: ${this.trainingFocus.join(', ') || 'General'}; Equipment: ${this.equip.join(', ') || 'None'} (${this.equipSrc}).`,
        notes: this.notes || null,
      }));
      if (!response.success) throw new Error(response.message || 'Unable to create the session.');
      const confirmed = response.data?.status === 'confirmed';
      this.sessionCreatedConfirmed.set(confirmed);
      this.sessionCreationMessage.set(confirmed
        ? 'Your session is confirmed and player invitations are ready.'
        : 'Your session request has been sent to the venue for approval.');
      this.success.set(true);
    } catch (error: any) {
      this.publishError.set(error?.error?.message || error?.message || 'Unable to create the session. Please review the selected time and try again.');
    } finally {
      this.publishing.set(false);
    }
  }

  toggleFocus(f: string) {
    this.trainingFocus = this.trainingFocus.includes(f)
      ? this.trainingFocus.filter(x => x !== f)
      : [...this.trainingFocus, f];
  }

  toggleEquip(e: string) {
    this.equip = this.equip.includes(e) ? this.equip.filter(x => x !== e) : [...this.equip, e];
  }

  getCoachFeeNumber(): number {
    return parseInt(this.coachFee) || 0;
  }

  getDurationLabel(): string {
    return this.durationsOptions.find(d => d.id === this.duration)?.label ?? '60 min';
  }

  getVenueCost(): number {
    const court = this.selectedCourt();
    if (!court) return 0;
    const dur = this.durationsOptions.find(d => d.id === this.duration);
    return Math.round(court.pricePerHour * (dur?.hrs ?? 1));
  }

  chooseVenue(venue: Venue): void {
    this.selectedVenue = venue;
    this.selectedCourtId = this.preferredCourt(venue)?.id ?? null;
    this.refreshGeneratedTitle();
    this.time = '';
    this.availableTimes = [];
    this.availabilityMessage = '';
    if (this.step() === 4) void this.loadAvailableTimes();
  }

  chooseCourt(court: VenueCourt): void {
    this.selectedCourtId = court.id;
    this.time = '';
    this.availableTimes = [];
    this.availabilityMessage = '';
    if (this.step() === 4) void this.loadAvailableTimes();
  }

  private refreshGeneratedTitle(): void {
    const sportName = this.sportsOptions.find(item => item.id === this.sport)?.name || 'Training';
    const venueName = this.selectedVenue?.name.trim().split(/\s+/)[0] || 'Training';
    const studentLabel = this.selStudents.length === 1
      ? this.studentOptions.find(student => student.id === this.selStudents[0])?.name || 'Student'
      : this.selStudents.length > 1 ? `Group (${this.selStudents.length})` : 'New Session';
    const nextTitle = `${venueName} ${sportName} Training – ${studentLabel}`;

    if (!this.sessionTitle.trim() || this.sessionTitle === this.generatedSessionTitle) {
      this.sessionTitle = nextTitle;
    }
    this.generatedSessionTitle = nextTitle;
  }

  selectedCourt(): VenueCourt | null {
    return this.selectedVenue?.courts.find(court => court.id === this.selectedCourtId) ?? null;
  }

  private preferredCourt(venue: Venue): VenueCourt | undefined {
    return venue.courts.find(court => this.courtSupportsSelectedSport(court));
  }

  private courtSupportsSelectedSport(court: VenueCourt): boolean {
    const selectedSport = this.sportsOptions.find(item => item.id === this.sport)?.name.toLowerCase();
    return !!selectedSport && court.sport.trim().toLowerCase() === selectedSport;
  }

  availableVenues(): Venue[] {
    if (!this.sport) return this.venueOptions;
    return this.venueOptions.filter(venue => venue.courts.some(court => this.courtSupportsSelectedSport(court)));
  }

  availableCourts(): VenueCourt[] {
    if (!this.selectedVenue || !this.sport) return [];
    return this.selectedVenue.courts.filter(court => this.courtSupportsSelectedSport(court));
  }

  getGst(): number {
    const subtotal = this.getCoachFeeNumber() + this.getVenueCost() + 49;
    return Math.round(subtotal * 0.18);
  }

  getPricePerStudent(): number {
    const subtotal = this.getCoachFeeNumber() + this.getVenueCost() + 49;
    const gst = this.getGst();
    const disc = this.coupon ? this.coupon.discount : 0;
    const total = subtotal + gst - disc;
    const count = this.selStudents.length || 1;
    return Math.round(total / count);
  }

  getNumStudents(): number {
    return this.selStudents.length || 1;
  }

  applyCoupon() {
    if (this.couponInp.toUpperCase() === 'COACH15') {
      const subtotal = this.getCoachFeeNumber() + this.getVenueCost() + 49;
      this.coupon = { code: 'COACH15', discount: Math.round(subtotal * 0.15) };
      this.couponErr = '';
      this.couponInp = '';
    } else {
      this.couponErr = 'Invalid code. Try COACH15';
    }
  }

  getStepTitleLabel(): string {
    const titles = ['Choose Sport', 'Select Students', 'Choose Venue', 'Date & Time', 'Training Details', 'Equipment', 'Set Pricing', 'Review'];
    return titles[this.step() - 1];
  }

  getSummaryList() {
    const sportObj = this.sportsOptions.find(s => s.id === this.sport);
    const dateObj = this.dateOptions[this.dateIdx];
    return [
      { emoji: '🏅', label: 'Sport', val: sportObj?.name ?? '—' },
      { emoji: '🏟️', label: 'Venue', val: this.selectedVenue?.name ?? '—' },
      { emoji: '👥', label: 'Students', val: `${this.selStudents.length || 0} selected` },
      { emoji: '📅', label: 'Date', val: dateObj.isToday ? 'Today' : `${dateObj.day} ${dateObj.dateNum}` },
      { emoji: '🕒', label: 'Time', val: this.time || '—' },
      { emoji: '⏳', label: 'Duration', val: this.getDurationLabel() },
      { emoji: '👤', label: 'Price / Student', val: `₹${this.getPricePerStudent().toLocaleString()}` },
    ];
  }

  successItems(): string[] {
    return [
      this.sessionCreatedConfirmed() ? 'Venue booking confirmed' : 'Venue approval requested',
      'Coaching session created',
      'Student invitations sent',
      'Session chat created',
      'Coach schedule updated',
      'Attendance QR ready',
    ];
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  goBack() {
    this.handleBack();
  }
}
