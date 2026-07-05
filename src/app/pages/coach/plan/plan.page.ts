import { CommonModule } from '@angular/common';
import { Component, signal, effect, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

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
  slots: string[];
  pricePerHour: number;
  rating: number;
  address: string;
  sportEmojis: string[];
  isCoachFriendly: boolean;
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

const COACH_VENUES: Venue[] = [
  { id: 1, name: 'Ekana Cricket Stadium', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=200&fit=crop&auto=format', distance: '2.1 km', slots: ['6 AM','7 AM','8 AM','4 PM','5 PM','6 PM','7 PM','8 PM'], pricePerHour: 1200, rating: 4.8, address: 'Amar Shaheed Path, Gomti Nagar', sportEmojis: ['🏏','⚽'], isCoachFriendly: true },
  { id: 2, name: 'Phoenix Sports Hub', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=200&fit=crop&auto=format', distance: '3.8 km', slots: ['6 AM','8 AM','10 AM','4 PM','6 PM','8 PM'], pricePerHour: 1000, rating: 4.5, address: 'Vibhuti Khand, Gomti Nagar', sportEmojis: ['🏸','🏀','🏐'], isCoachFriendly: true },
  { id: 3, name: 'Sports Authority Complex', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=200&fit=crop&auto=format', distance: '4.5 km', slots: ['7 AM','9 AM','3 PM','5 PM','7 PM'], pricePerHour: 800, rating: 4.2, address: 'Aliganj, Lucknow', sportEmojis: ['🏏','🎾','🏓'], isCoachFriendly: false }
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
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <!-- SUCCESS SCREEN -->
      <div *ngIf="success()" class="success-shell px-6">
        <div class="mb-6 flex flex-col items-center">
          <div class="success-circle mb-4">
            <ion-icon name="checkmark-outline" class="text-white text-5xl font-black"></ion-icon>
          </div>
          <h1 class="text-[26px] font-black text-[#111827] mb-1">Session Created! 🎉</h1>
          <p class="text-[14px] text-[#9CA3AF] mb-6 text-center">Your coaching session is live and students are notified.</p>
        </div>

        <div class="w-full max-w-sm bg-white rounded-[24px] p-5 mb-5 shadow-sm border border-slate-100 space-y-2.5">
          <div *ngFor="let a of ['Venue Reserved','Session Published','Student Invitations Sent','Session Chat Created','Schedule Updated','Attendance QR Generated']"
            class="flex items-center gap-3 py-2 border-b border-[#F9FAFB] last:border-0">
            <div class="w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
              <ion-icon name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
            </div>
            <span class="text-[13px] font-semibold text-[#111827]">{{ a }}</span>
          </div>
        </div>

        <div class="w-full max-w-sm grid grid-cols-2 gap-2.5">
          <button (click)="go('/app/coach/students')" class="success-action-btn shadow-sm">
            <ion-icon name="people-outline" class="text-[#8CF000] text-2xl mb-1"></ion-icon>
            Manage Students
          </button>
          <button (click)="go('/app/chat')" class="success-action-btn shadow-sm">
            <ion-icon name="chatbubbles-outline" class="text-[#8CF000] text-2xl mb-1"></ion-icon>
            Session Chat
          </button>
          <button (click)="go('/app/schedule')" class="success-action-btn shadow-sm">
            <ion-icon name="calendar-outline" class="text-[#8CF000] text-2xl mb-1"></ion-icon>
            My Schedule
          </button>
          <button (click)="go('/app/home')" class="success-action-btn shadow-sm">
            <ion-icon name="home-outline" class="text-[#8CF000] text-2xl mb-1"></ion-icon>
            Go Home
          </button>
        </div>
      </div>

      <!-- MAIN WIZARD FLOW -->
      <div *ngIf="!success()" class="plan-page">
        <!-- Sticky Wizard Header -->
        <div class="sticky-header">
          <div class="flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
            <button (click)="handleBack()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[15px] font-black text-[#111827]">Create New Session</p>
              <p class="text-[11px] text-[#9CA3AF] font-bold">Step {{ step() }} of 8</p>
            </div>
            <button (click)="go('/app/home')" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="close-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
          </div>
          <div class="py-3 bg-white flex justify-center">
            <!-- Progress indicator dots -->
            <div class="flex items-center gap-1.5">
              <div *ngFor="let s of [1,2,3,4,5,6,7,8]" class="h-2 rounded-full transition-all"
                [style.width]="step() === s ? '20px' : '8px'"
                [style.backgroundColor]="step() > s ? '#FF7A00' : (step() === s ? '#8CF000' : '#E5E7EB')"></div>
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
              <button *ngFor="let s of sportsOptions" (click)="sport = s.id" class="sport-selection-btn"
                [style.borderColor]="sport === s.id ? '#8CF000' : 'transparent'"
                [style.boxShadow]="sport === s.id ? '0 0 0 3px rgba(140,240,0,0.20)' : 'none'">
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
            <!-- Sub-tabs -->
            <div class="flex bg-[#F3F4F6] p-1 rounded-2xl mb-4">
              <button *ngFor="let t of ['my','batch','new']" (click)="studTab = t" class="flex-1 py-2 rounded-xl text-[11px] font-bold border-none"
                [style.backgroundColor]="studTab === t ? 'white' : 'transparent'"
                [style.color]="studTab === t ? '#111827' : '#9CA3AF'">
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
              <span class="text-[11px] font-black text-[#8CF000] ml-2 self-center">{{ selStudents.length }} Selected</span>
            </div>

            <!-- List my students -->
            <div *ngIf="studTab === 'my'">
              <div class="flex items-center gap-2 bg-[#F3F4F6] rounded-2xl px-3 h-10 mb-3">
                <ion-icon name="search-outline" class="text-[#9CA3AF]"></ion-icon>
                <input [(ngModel)]="searchQ" placeholder="Search by name..." class="flex-1 bg-transparent text-[13px] text-[#111827] focus:outline-none min-h-0 border-none" />
              </div>
              <div class="space-y-2">
                <button *ngFor="let s of filterStudents()" (click)="toggleStudent(s.id)" class="student-select-row border-none shadow-sm"
                  [style.backgroundColor]="selStudents.includes(s.id) ? 'rgba(140,240,0,0.08)' : 'white'"
                  [style.border]="selStudents.includes(s.id) ? '1.5px solid #8CF000' : '1.5px solid #F3F4F6'">
                  <img [src]="s.photo" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                  <div class="flex-1 text-left">
                    <p class="text-[13px] font-bold text-[#111827]">{{ s.name }}</p>
                    <p class="text-[10px] text-[#9CA3AF]">{{ s.skill }} · {{ s.attendance }}% attendance</p>
                  </div>
                  <div class="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                    [style.backgroundColor]="selStudents.includes(s.id) ? '#8CF000' : '#F3F4F6'">
                    <ion-icon *ngIf="selStudents.includes(s.id)" name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                </button>
              </div>
            </div>

            <!-- List batches -->
            <div *ngIf="studTab === 'batch'" class="space-y-3">
              <button *ngFor="let b of batchOptions" (click)="selBatch = (selBatch === b.id ? '' : b.id)" class="batch-select-btn border-none shadow-sm"
                [style.backgroundColor]="selBatch === b.id ? 'rgba(140,240,0,0.08)' : 'white'"
                [style.border]="selBatch === b.id ? '1.5px solid #8CF000' : '1.5px solid #F3F4F6'">
                <div class="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center">
                  <ion-icon name="people-outline" class="text-[#6B7280] text-lg"></ion-icon>
                </div>
                <div class="flex-1 text-left">
                  <p class="text-[14px] font-bold text-[#111827]">{{ b.label }}</p>
                  <p class="text-[11px] text-[#9CA3AF]">{{ b.members }} students · {{ b.sport }}</p>
                </div>
                <div *ngIf="selBatch === b.id" class="w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center">
                  <ion-icon name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
                </div>
              </button>
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
            <div class="space-y-4">
              <button *ngFor="let v of venueOptions" (click)="selectedVenue = v" class="venue-select-btn border-none shadow-sm text-left bg-white"
                [style.border]="selectedVenue?.id === v.id ? '2.5px solid #8CF000' : '2.5px solid transparent'">
                <div class="relative h-[120px] overflow-hidden bg-slate-200">
                  <img [src]="v.image" class="w-full h-full object-cover" />
                  <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <span *ngIf="v.isCoachFriendly" class="absolute top-3 left-3 text-[10px] font-bold bg-[#FF7A00] text-white px-2 py-0.5 rounded-full">Coach Friendly 🏋️</span>
                  <div *ngIf="selectedVenue?.id === v.id" class="absolute top-3 right-3 w-7 h-7 rounded-full bg-[#8CF000] flex items-center justify-center">
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
              <button *ngFor="let d of dateOptions" (click)="dateIdx = d.idx" class="flex-shrink-0 flex flex-col items-center px-3.5 py-2.5 rounded-2xl min-w-[54px] border-none shadow-sm"
                [style.backgroundColor]="dateIdx === d.idx ? 'rgba(140,240,0,0.12)' : 'white'"
                [style.border]="dateIdx === d.idx ? '2px solid #8CF000' : '2px solid #F3F4F6'">
                <span class="text-[9px] font-bold" [style.color]="dateIdx === d.idx ? '#8CF000' : '#9CA3AF'">{{ d.isToday ? 'Today' : d.day }}</span>
                <span class="text-[18px] font-black text-[#111827] mt-0.5">{{ d.dateNum }}</span>
                <span class="text-[9px]" [style.color]="dateIdx === d.idx ? '#9CA3AF' : '#C4C9D4'">{{ d.monthShort }}</span>
              </button>
            </div>
            <!-- Time slots -->
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Select Time</p>
            <div class="grid grid-cols-4 gap-2 mb-5">
              <button *ngFor="let t of (selectedVenue?.slots ?? ['6 AM','7 AM','8 AM','4 PM','5 PM','6 PM','7 PM','8 PM'])" (click)="time = t" class="py-3 rounded-2xl border-none shadow-sm text-center"
                [style.backgroundColor]="time === t ? '#8CF000' : 'white'"
                [style.border]="time === t ? '2px solid #8CF000' : '2px solid #F3F4F6'">
                <p class="text-[12px] font-black m-0" [style.color]="time === t ? '#111827' : '#6B7280'">{{ t }}</p>
              </button>
            </div>
            <!-- Duration -->
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Duration</p>
            <div class="grid grid-cols-4 gap-2 mb-4">
              <button *ngFor="let d of durationsOptions" (click)="duration = d.id" class="py-3 rounded-2xl border-none text-center"
                [style.backgroundColor]="duration === d.id ? 'rgba(140,240,0,0.12)' : 'white'"
                [style.border]="duration === d.id ? '2px solid #8CF000' : '2px solid #F3F4F6'">
                <p class="text-[12px] font-bold m-0" [style.color]="duration === d.id ? '#111827' : '#6B7280'">{{ d.label }}</p>
              </button>
            </div>
            <!-- Duration calculations -->
            <div *ngIf="time" class="bg-[#111827] rounded-2xl px-4 py-3 flex items-center justify-between text-white">
              <div class="flex items-center gap-2"><ion-icon name="time-outline" class="text-[#8CF000]"></ion-icon><span class="text-[13px] font-bold">{{ time }}</span></div>
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
                  [style.backgroundColor]="sessType === t.id ? 'rgba(140,240,0,0.10)' : 'white'"
                  [style.border]="sessType === t.id ? '2px solid #8CF000' : '2px solid #F3F4F6'">
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
                <button *ngFor="let s of equipSourceOptions" (click)="equipSrc = s.id" class="w-full flex items-center justify-between px-4 py-4 rounded-[20px] bg-white border border-[#F3F4F6] shadow-sm hover:border-[#8CF000]"
                  [style.backgroundColor]="equipSrc === s.id ? 'rgba(140,240,0,0.08)' : 'white'"
                  [style.borderColor]="equipSrc === s.id ? '#8CF000' : '#F3F4F6'">
                  <p class="text-[14px] font-bold text-[#111827] m-0">{{ s.label }}</p>
                  <div *ngIf="equipSrc === s.id" class="w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center">
                    <ion-icon name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 7: Smart Pricing -->
          <div *ngIf="step() === 7" class="space-y-4">
            <div class="rounded-[24px] p-5 relative overflow-hidden bg-gradient-to-br from-[#111827] to-[#1F2937] text-white">
              <div class="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-[#8CF000]/10"></div>
              <div class="relative">
                <div class="flex items-center gap-2 mb-2">
                  <ion-icon name="sparkles" class="text-[#8CF000]"></ion-icon>
                  <p class="text-[14px] font-black text-[#8CF000] m-0">TYNG Smart Pricing</p>
                  <span class="text-[9px] bg-[#8CF000]/20 text-[#8CF000] px-2 py-0.5 rounded-full font-black">AI</span>
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
              <div *ngIf="!coupon" class="flex gap-2 mt-3">
                <input [(ngModel)]="couponInp" placeholder="Enter coupon code"
                  class="flex-1 bg-[#F3F4F6] rounded-xl px-3 h-10 text-[13px] font-semibold uppercase focus:outline-none min-h-0 border-none" />
                <button (click)="applyCoupon()" [disabled]="!couponInp.trim()" class="h-10 px-4 rounded-xl text-[12px] font-black border-none"
                  [style.backgroundColor]="couponInp.trim() ? '#8CF000' : '#F3F4F6'"
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
            <div *ngIf="getCoachFeeNumber() > 0" class="rounded-[24px] p-5 text-center bg-gradient-to-br from-[#8CF000] to-[#A3E635] shadow-md">
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
              <input [(ngModel)]="sessionTitle" class="w-full text-[16px] font-black text-[#111827] bg-[#F9FAFB] rounded-xl px-3 py-2.5 focus:outline-none min-h-0 border-none" />
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
            <div class="bg-white rounded-[24px] overflow-hidden border border-[#8CF000]/22 shadow-md">
              <div class="px-5 py-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-[#8CF000]/15 flex items-center justify-center flex-shrink-0">
                  <ion-icon name="flash-outline" class="text-[#8CF000] text-xl"></ion-icon>
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
                  <div class="w-5 h-5 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
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
              <p class="text-[10px] text-[#8CF000] font-bold m-0">₹{{ getPricePerStudent() }} / student</p>
            </div>
            <ng-template #stepInfo>
              <div class="flex-shrink-0">
                <p class="text-[10px] text-[#9CA3AF] font-bold mb-0">Step {{ step() }} of 8</p>
                <p class="text-[14px] font-black text-[#111827] m-0">{{ getStepTitleLabel() }}</p>
              </div>
            </ng-template>

            <button (click)="handleNext()" [disabled]="!canProceed()" class="flex-1 h-12 rounded-2xl text-[15px] font-black flex items-center justify-center gap-2 border-none"
              [style.background]="canProceed() ? 'linear-gradient(135deg,#FF7A00,#FF9A40)' : '#F3F4F6'"
              [style.color]="canProceed() ? 'white' : '#C4C9D4'">
              {{ step() === 8 ? 'Publish Session' : 'Continue' }}
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .plan-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .success-shell {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: #FAFBFC;
    }

    .success-circle {
      width: 96px; height: 96px;
      border-radius: 50%;
      background: #8CF000;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 8px 36px rgba(140,240,0,0.45);
    }

    .success-action-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: white;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      color: #111827;
      border: none;
      cursor: pointer;
    }

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
      background: #8CF000;
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
      background: rgba(140,240,0,0.08);
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
      width: 100%;
      border-radius: 22px;
      overflow: hidden;
      cursor: pointer;
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
      background: rgba(140,240,0,0.14);
      color: #111827;
      border-color: #8CF000;
      border: 1.5px solid #8CF000;
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000, #A3E635);
      box-shadow: 0 2px 8px rgba(140,240,0,0.38);
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
export class CoachPlanPage {
  readonly Math = Math;
  private readonly router = inject(Router);

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
  dateIdx = 0;
  time = '';
  duration = '60min';
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

  readonly sportsOptions = SPORTS;
  readonly batchOptions = PREV_BATCHES;
  readonly venueOptions = COACH_VENUES;
  readonly durationsOptions = DURATIONS;
  readonly sessionTypeOptions = SESSION_TYPES;
  readonly focusOptions = TRAINING_FOCUS;
  readonly equipmentOptions = EQUIPMENT_OPTS;
  readonly equipSourceOptions = EQUIP_SOURCES;
  dateOptions = buildDates();

  constructor() {
    effect(() => {
      const sp = this.sportsOptions.find(s => s.id === this.sport);
      const vName = this.selectedVenue?.name.split(' ')[0] ?? 'Training';
      const label = this.selStudents.length === 1
        ? MOCK_STUDENTS.find(s => s.id === this.selStudents[0])?.name ?? 'Student'
        : this.selStudents.length > 1 ? `Group (${this.selStudents.length})` : 'New Session';
      if (sp) {
        this.sessionTitle = `${vName} ${sp.name} Training – ${label}`;
      }
    });
  }

  handleBack() {
    if (this.step() === 1) {
      this.router.navigateByUrl('/app/home');
    } else {
      this.step.update(s => s - 1);
    }
  }

  canProceed(): boolean {
    const s = this.step();
    if (s === 1) return this.sport !== '';
    if (s === 2) return this.selStudents.length > 0 || this.selBatch !== '';
    if (s === 3) return this.selectedVenue !== null;
    if (s === 4) return this.time !== '';
    if (s === 5) return this.sessType !== '';
    if (s === 7) return this.getCoachFeeNumber() > 0;
    return true;
  }

  handleNext() {
    if (this.step() < 8) {
      this.step.update(s => s + 1);
    } else {
      this.success.set(true);
    }
  }

  toggleStudent(id: number) {
    this.selStudents = this.selStudents.includes(id)
      ? this.selStudents.filter(x => x !== id)
      : [...this.selStudents, id];
  }

  getStudentPhoto(id: number) {
    return MOCK_STUDENTS.find(s => s.id === id)?.photo ?? '';
  }

  getStudentName(id: number) {
    return MOCK_STUDENTS.find(s => s.id === id)?.name.split(' ')[0] ?? 'Student';
  }

  filterStudents() {
    if (!this.searchQ) return MOCK_STUDENTS;
    return MOCK_STUDENTS.filter(s => s.name.toLowerCase().includes(this.searchQ.toLowerCase()));
  }

  getEndTime(): string {
    if (!this.time) return '';
    const dur = this.durationsOptions.find(d => d.id === this.duration);
    const hrs = dur?.hrs ?? 1;
    const [hm, ampm] = this.time.split(' ');
    const [h, m] = hm.split(':').map(Number);
    let total = (ampm === 'PM' && h !== 12 ? h + 12 : h === 12 && ampm === 'AM' ? 0 : h) * 60 + m + hrs * 60;
    const eh = Math.floor(total / 60) % 24;
    const em = total % 60;
    const eAmpm = eh >= 12 ? 'PM' : 'AM';
    const dh = eh > 12 ? eh - 12 : eh === 0 ? 12 : eh;
    return `${dh}:${em.toString().padStart(2, '0')} ${eAmpm}`;
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
    if (!this.selectedVenue) return 0;
    const dur = this.durationsOptions.find(d => d.id === this.duration);
    return Math.round(this.selectedVenue.pricePerHour * (dur?.hrs ?? 1));
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

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  goBack() {
    this.handleBack();
  }
}
