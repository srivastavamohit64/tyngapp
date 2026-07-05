import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

export interface Venue {
  id: string;
  name: string;
  address: string;
  distance: string;
  rating: number;
  reviews: number;
  pricePerHour: number;
  sports: string[];
  sportEmojis: string[];
  image: string;
  slots: string[];
  amenities: string[];
  isCoachFriendly: boolean;
  isIndoor: boolean;
  capacity: number;
  isOpenNow: boolean;
}

const COACH_VENUES: Venue[] = [
  {
    id: 'cv1',
    name: 'Elite Sports Academy',
    address: 'Gomti Nagar Extension, Lucknow',
    distance: '2.1 km',
    rating: 4.9, reviews: 156,
    pricePerHour: 1500,
    sports: ['Cricket', 'Football', 'Badminton'],
    sportEmojis: ['🏏', '⚽', '🏸'],
    image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=700&h=420&fit=crop&auto=format',
    slots: ['6 AM', '7 AM', '8 AM', '4 PM', '5 PM', '6 PM', '7 PM'],
    amenities: ['Parking', 'Floodlights', 'Washrooms', 'Equipment', 'Café', 'Changing Rooms', 'Water'],
    isCoachFriendly: true, isIndoor: false, capacity: 50,
    isOpenNow: true,
  },
  {
    id: 'cv2',
    name: 'Cricket Training Ground',
    address: 'Gomti Nagar Extension (Ekana), Lucknow',
    distance: '4.5 km',
    rating: 4.8, reviews: 128,
    pricePerHour: 2000,
    sports: ['Cricket'],
    sportEmojis: ['🏏'],
    image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=700&h=420&fit=crop&auto=format',
    slots: ['6 AM', '7 AM', '5 PM', '6 PM', '7 PM'],
    amenities: ['Parking', 'Floodlights', 'Washrooms', 'Equipment', 'Changing Rooms', 'Water'],
    isCoachFriendly: true, isIndoor: false, capacity: 30,
    isOpenNow: true,
  },
  {
    id: 'cv3',
    name: 'Phoenix Sports Hub',
    address: 'Aliganj, Lucknow',
    distance: '5.2 km',
    rating: 4.7, reviews: 94,
    pricePerHour: 1200,
    sports: ['Tennis', 'Badminton', 'Basketball'],
    sportEmojis: ['🎾', '🏸', '🏀'],
    image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=700&h=420&fit=crop&auto=format',
    slots: ['7 AM', '8 AM', '4 PM', '5 PM', '6 PM', '7 PM', '8 PM'],
    amenities: ['Parking', 'Floodlights', 'Washrooms', 'Equipment', 'AC Indoor', 'Water', 'Lockers'],
    isCoachFriendly: true, isIndoor: true, capacity: 20,
    isOpenNow: true,
  },
  {
    id: 'cv4',
    name: 'City Sports Complex',
    address: 'Hazratganj, Lucknow',
    distance: '3.8 km',
    rating: 4.5, reviews: 72,
    pricePerHour: 800,
    sports: ['Football', 'Basketball', 'Volleyball'],
    sportEmojis: ['⚽', '🏀', '🏐'],
    image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=700&h=420&fit=crop&auto=format',
    slots: ['6 AM', '7 AM', '8 AM', '5 PM', '6 PM', '7 PM'],
    amenities: ['Parking', 'Washrooms', 'Equipment', 'Water'],
    isCoachFriendly: false, isIndoor: false, capacity: 40,
    isOpenNow: false,
  },
];

interface SportCard {
  id: string;
  name: string;
  emoji: string;
  image: string;
}

interface DurationOption {
  id: string;
  label: string;
  hrs: number;
}

interface TrainingType {
  id: string;
  label: string;
  emoji: string;
}

interface EquipmentOption {
  id: string;
  label: string;
  price: number;
  emoji: string;
}

const SPORTS_CARDS: SportCard[] = [
  { id: 'cricket', name: 'Cricket', emoji: '🏏', image: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=400&fit=crop&auto=format' },
  { id: 'football', name: 'Football', emoji: '⚽', image: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=400&fit=crop&auto=format' },
  { id: 'basketball', name: 'Basketball', emoji: '🏀', image: 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=300&h=400&fit=crop&auto=format' },
  { id: 'badminton', name: 'Badminton', emoji: '🏸', image: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=400&fit=crop&auto=format' },
  { id: 'tennis', name: 'Tennis', emoji: '🎾', image: 'https://images.unsplash.com/photo-1761156896762-2ef13f932004?w=300&h=400&fit=crop&auto=format' },
  { id: 'volleyball', name: 'Volleyball', emoji: '🏐', image: 'https://images.unsplash.com/photo-1601512986351-9b0e01780eef?w=300&h=400&fit=crop&auto=format' },
];

const DURATIONS: DurationOption[] = [
  { id: '30min', label: '30 Minutes', hrs: 0.5 },
  { id: '60min', label: '60 Minutes', hrs: 1 },
  { id: '90min', label: '90 Minutes', hrs: 1.5 },
  { id: '2hrs', label: '2 Hours', hrs: 2 },
];

const TRAINING_TYPES: TrainingType[] = [
  { id: 'individual', label: 'Individual', emoji: '👤' },
  { id: 'small-group', label: 'Small Group', emoji: '👥' },
  { id: 'academy', label: 'Academy Batch', emoji: '🏫' },
  { id: 'private', label: 'Private Class', emoji: '🔒' },
  { id: 'corporate', label: 'Corporate', emoji: '🏢' },
  { id: 'camp', label: 'Sports Camp', emoji: '⛺' },
];

const EQUIPMENT: EquipmentOption[] = [
  { id: 'footballs', label: 'Footballs', price: 200, emoji: '⚽' },
  { id: 'cricket-kits', label: 'Cricket Kits', price: 500, emoji: '🏏' },
  { id: 'basketballs', label: 'Basketballs', price: 150, emoji: '🏀' },
  { id: 'shuttlecocks', label: 'Shuttlecocks', price: 100, emoji: '🏸' },
  { id: 'racquets', label: 'Racquets', price: 200, emoji: '🎾' },
  { id: 'cones', label: 'Training Cones', price: 100, emoji: '🔺' },
];

interface DateOption {
  idx: number;
  day: string;
  dateNum: number;
  monthShort: string;
  isToday: boolean;
}

function buildDates(): DateOption[] {
  const today = new Date();
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      idx: i,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      dateNum: d.getDate(),
      monthShort: d.toLocaleDateString('en-US', { month: 'short' }),
      isToday: i === 0
    };
  });
}

@Component({
  selector: 'app-coach-venue-booking',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <!-- SUCCESS SCREEN -->
      <div *ngIf="isSuccess()" class="min-h-screen bg-[#FAFBFC] flex flex-col items-center justify-center px-6 text-center py-10">
        <div class="w-24 h-24 rounded-full bg-[#8CF000] flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#8CF000]/40">
          <ion-icon name="checkmark-outline" class="text-[#111827] text-4xl font-black"></ion-icon>
        </div>
        <h1 class="text-[26px] font-black text-[#111827] mb-2 m-0">Venue Booked Successfully! 🎉</h1>
        <p class="text-[14px] text-[#9CA3AF] m-0 mb-6">Your coaching session is ready.</p>

        <!-- Automation Tasks status card -->
        <div class="w-full max-w-sm bg-white rounded-[24px] p-5 mb-6 text-left shadow-md border border-slate-50">
          <div *ngFor="let a of getAutomationSuccessLogs(); let idx = index" class="flex items-center gap-3 py-2.5 border-b border-[#F9FAFB] last:border-none">
            <div class="w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
              <ion-icon name="checkmark-outline" class="text-[#111827] text-xs font-black"></ion-icon>
            </div>
            <span class="text-[13px] font-bold text-[#111827]">{{ a }}</span>
          </div>
        </div>

        <!-- Dashboard shortcuts grid -->
        <div class="w-full max-w-sm grid grid-cols-2 gap-2.5">
          <button (click)="go('/app/coach/students')" class="flex flex-col items-center gap-2 py-4 bg-white rounded-[20px] text-[12px] font-black text-[#111827] border border-slate-100 shadow-sm">
            <ion-icon name="people-outline" class="text-[#8CF000] text-xl"></ion-icon>
            Manage Students
          </button>
          <button (click)="go('/app/chat')" class="flex flex-col items-center gap-2 py-4 bg-white rounded-[20px] text-[12px] font-black text-[#111827] border border-slate-100 shadow-sm">
            <ion-icon name="chatbubble-ellipses-outline" class="text-[#8CF000] text-xl"></ion-icon>
            Session Chat
          </button>
          <button (click)="go('/app/coach/schedule')" class="flex flex-col items-center gap-2 py-4 bg-white rounded-[20px] text-[12px] font-black text-[#111827] border border-slate-100 shadow-sm">
            <ion-icon name="calendar-outline" class="text-[#8CF000] text-xl"></ion-icon>
            View Schedule
          </button>
          <button (click)="go('/app/home')" class="flex flex-col items-center gap-2 py-4 bg-white rounded-[20px] text-[12px] font-black text-[#111827] border border-slate-100 shadow-sm">
            <ion-icon name="home-outline" class="text-[#8CF000] text-xl"></ion-icon>
            Home Dashboard
          </button>
        </div>
      </div>

      <!-- MAIN BOOKING STEPS FLOW -->
      <div *ngIf="!isSuccess()" class="min-h-screen bg-[#FAFBFC] pb-36 text-left">
        <!-- Sticky steps indicator top header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button (click)="handlePrev()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[14px] font-black text-[#111827] m-0">{{ selectedVenue.name }}</p>
              <p class="text-[11px] text-[#9CA3AF] m-0 font-bold">Step {{ step() }} of 8</p>
            </div>
            <div class="w-10"></div>
          </div>

          <!-- Progress dots track -->
          <div class="flex justify-center items-center gap-1 px-6 pb-3 pt-1">
            <div *ngFor="let idx of [0,1,2,3,4,5,6,7]" class="flex items-center">
              <div class="h-[7px] rounded-full transition-all duration-300"
                [style.width]="step() === (idx + 1) ? '20px' : '7px'"
                [style.backgroundColor]="step() > (idx + 1) ? '#FF7A00' : step() === (idx + 1) ? '#8CF000' : '#E5E7EB'">
              </div>
              <div *ngIf="idx < 7" class="w-2.5 h-[1.5px] mx-0.5"
                [style.backgroundColor]="step() > (idx + 1) ? '#FF7A00' : '#E5E7EB'">
              </div>
            </div>
          </div>
        </div>

        <!-- Steps Views content -->
        <div class="px-5 pt-5">
          <!-- STEP 1: CHOOSE SPORT -->
          <div *ngIf="step() === 1">
            <h2 class="text-[20px] font-black text-[#111827] mb-1 m-0">Choose Sport</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5 m-0 font-medium">What sport will you be coaching?</p>
            <div class="grid grid-cols-3 gap-3">
              <button *ngFor="let s of sports" (click)="sport.set(s.id)" class="relative rounded-[20px] overflow-hidden focus:outline-none border-none p-0"
                [style.aspectRatio]="'3/4'"
                [style.border]="sport() === s.id ? '2.5px solid #8CF000' : '2.5px solid transparent'"
                [style.boxShadow]="sport() === s.id ? '0 0 0 3px rgba(140,240,0,0.20)' : 'none'">
                <img [src]="s.image" class="absolute inset-0 w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent"></div>
                <div *ngIf="sport() === s.id" class="absolute inset-0 bg-[rgba(140,240,0,0.15)]"></div>
                <div *ngIf="sport() === s.id" class="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center">
                  <ion-icon name="checkmark-outline" class="text-[#111827] text-xs font-black"></ion-icon>
                </div>
                <p class="absolute bottom-2 left-2 right-2 text-white font-black text-[11px] m-0 text-left">{{ s.name }}</p>
              </button>
            </div>
          </div>

          <!-- STEP 2: SELECT DATE -->
          <div *ngIf="step() === 2">
            <h2 class="text-[20px] font-black text-[#111827] mb-1 m-0">Select Date</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5 m-0 font-medium">When do you want to book?</p>
            <div class="flex gap-2.5 overflow-x-auto pb-2 no-scrollbar">
              <button *ngFor="let d of dates" (click)="dateIdx.set(d.idx)" class="flex-shrink-0 flex flex-col items-center px-4 py-3 rounded-2xl min-w-[58px] border-none transition-all"
                [style.backgroundColor]="dateIdx() === d.idx ? 'rgba(140,240,0,0.12)' : 'white'"
                [style.border]="dateIdx() === d.idx ? '2px solid #8CF000' : '2px solid #F3F4F6'"
                [style.boxShadow]="dateIdx() === d.idx ? '0 2px 12px rgba(140,240,0,0.22)' : '0 1px 4px rgba(0,0,0,0.06)'">
                <span class="text-[10px] font-bold" [style.color]="dateIdx() === d.idx ? '#8CF000' : '#9CA3AF'">{{ d.isToday ? 'Today' : d.day }}</span>
                <span class="text-[18px] font-black text-[#111827] mt-0.5">{{ d.dateNum }}</span>
                <span class="text-[9px] font-bold" [style.color]="dateIdx() === d.idx ? '#9CA3AF' : '#C4C9D4'">{{ d.monthShort }}</span>
              </button>
            </div>
          </div>

          <!-- STEP 3: SELECT TIME SLOT -->
          <div *ngIf="step() === 3">
            <h2 class="text-[20px] font-black text-[#111827] mb-1 m-0">Select Time Slot</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5 m-0 font-medium">Available slots at {{ selectedVenue.name }}</p>
            <div class="grid grid-cols-3 gap-2.5">
              <button *ngFor="let slot of selectedVenue.slots" (click)="time.set(slot)" class="py-3.5 rounded-2xl text-center border-none transition-all"
                [style.backgroundColor]="time() === slot ? '#8CF000' : 'white'"
                [style.border]="time() === slot ? '2px solid #8CF000' : '2px solid #F3F4F6'"
                [style.boxShadow]="time() === slot ? '0 2px 10px rgba(140,240,0,0.35)' : '0 1px 4px rgba(0,0,0,0.06)'">
                <p class="text-[14px] font-black m-0" [style.color]="time() === slot ? '#111827' : '#6B7280'">{{ slot }}</p>
              </button>
            </div>
          </div>

          <!-- STEP 4: SESSION DURATION -->
          <div *ngIf="step() === 4">
            <h2 class="text-[20px] font-black text-[#111827] mb-1 m-0">Session Duration</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5 m-0 font-medium">How long is your coaching session?</p>
            <div class="space-y-3">
              <button *ngFor="let d of durations" (click)="duration.set(d.id)" class="w-full flex items-center justify-between px-5 py-4 rounded-[22px] border-none transition-all text-left"
                [style.backgroundColor]="duration() === d.id ? 'rgba(140,240,0,0.08)' : 'white'"
                [style.border]="duration() === d.id ? '2.5px solid #8CF000' : '2px solid #F3F4F6'"
                [style.boxShadow]="duration() === d.id ? '0 4px 16px rgba(140,240,0,0.18)' : '0 1px 6px rgba(0,0,0,0.06)'">
                <p class="text-[16px] font-black text-[#111827] m-0">{{ d.label }}</p>
                <div class="flex items-center gap-2">
                  <p class="text-[13px] text-[#9CA3AF] font-bold m-0">₹{{ (selectedVenue.pricePerHour * d.hrs).toLocaleString() }}</p>
                  <div *ngIf="duration() === d.id" class="w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center">
                    <ion-icon name="checkmark-outline" class="text-[#111827] text-xs font-black"></ion-icon>
                  </div>
                </div>
              </button>
            </div>
          </div>

          <!-- STEP 5: TRAINING TYPE -->
          <div *ngIf="step() === 5">
            <h2 class="text-[20px] font-black text-[#111827] mb-1 m-0">Training Type</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5 m-0 font-medium">What type of coaching session?</p>
            <div class="grid grid-cols-2 gap-3">
              <button *ngFor="let t of trainingTypes" (click)="trainType.set(t.id)" class="flex flex-col items-center py-5 rounded-[22px] border-none transition-all"
                [style.backgroundColor]="trainType() === t.id ? 'rgba(140,240,0,0.10)' : 'white'"
                [style.border]="trainType() === t.id ? '2.5px solid #8CF000' : '2px solid #F3F4F6'"
                [style.boxShadow]="trainType() === t.id ? '0 4px 16px rgba(140,240,0,0.18)' : '0 1px 6px rgba(0,0,0,0.06)'">
                <span class="text-3xl mb-2">{{ t.emoji }}</span>
                <p class="text-[13px] font-black text-[#111827] m-0">{{ t.label }}</p>
                <div *ngIf="trainType() === t.id" class="w-5 h-5 rounded-full bg-[#8CF000] flex items-center justify-center mt-2">
                  <ion-icon name="checkmark-outline" class="text-[#111827] text-[10px] font-black"></ion-icon>
                </div>
              </button>
            </div>
          </div>

          <!-- STEP 6: NUMBER OF STUDENTS -->
          <div *ngIf="step() === 6">
            <h2 class="text-[20px] font-black text-[#111827] mb-1 m-0">Number of Students</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-8 m-0 font-medium">Venue capacity: {{ selectedVenue.capacity }} students</p>

            <div class="bg-white rounded-[24px] p-8 flex flex-col items-center border border-slate-100 shadow-sm text-center">
              <div class="flex items-center gap-8">
                <button (click)="students.set(Math.max(1, students() - 1))" class="w-14 h-14 rounded-full bg-[#F3F4F6] flex items-center justify-center border-2 border-[#E5E7EB] border-none">
                  <ion-icon name="remove-outline" class="text-xl text-[#6B7280] font-bold"></ion-icon>
                </button>
                <div>
                  <p class="text-[56px] font-black text-[#111827] leading-none m-0">{{ students() }}</p>
                  <p class="text-[12px] text-[#9CA3AF] mt-1 m-0 font-bold">students</p>
                </div>
                <button (click)="students.set(Math.min(selectedVenue.capacity, students() + 1))" class="w-14 h-14 rounded-full flex items-center justify-center border-none btn-green-gradient">
                  <ion-icon name="add-outline" class="text-xl text-[#111827] font-bold"></ion-icon>
                </button>
              </div>
              <div class="mt-6 w-full text-left">
                <input type="range" min="1" [max]="selectedVenue.capacity" [(ngModel)]="studentsVal" class="w-full range-slider-input" (input)="onSliderChange($event)" />
                <div class="flex justify-between text-[10px] text-[#9CA3AF] mt-1 font-bold">
                  <span>1</span><span>Max {{ selectedVenue.capacity }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 7: EQUIPMENT RENTALS -->
          <div *ngIf="step() === 7">
            <h2 class="text-[20px] font-black text-[#111827] mb-1 m-0">Equipment Rental</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5 m-0 font-medium">Select equipment needed for your session</p>
            <div class="space-y-2.5">
              <div *ngFor="let e of equipment" class="bg-white rounded-[20px] px-4 py-3.5 flex items-center gap-3 border border-slate-100 shadow-sm">
                <div class="w-10 h-10 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  <span class="text-xl">{{ e.emoji }}</span>
                </div>
                <div class="flex-1">
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ e.label }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5 font-bold">₹{{ e.price }}/session <span *ngIf="getEquipQty(e.id) > 0" class="text-[#8CF000] font-black">= ₹{{ e.price * getEquipQty(e.id) }}</span></p>
                </div>
                <div class="flex items-center gap-2.5">
                  <button (click)="decEquip(e.id)" class="w-8 h-8 rounded-full flex items-center justify-center border border-[#E5E7EB] bg-white border-none shadow-sm">
                    <ion-icon name="remove-outline" class="text-[#6B7280] text-xs font-bold"></ion-icon>
                  </button>
                  <span class="w-4 text-center text-[15px] font-black text-[#111827]">{{ getEquipQty(e.id) }}</span>
                  <button (click)="incEquip(e.id)" class="w-8 h-8 rounded-full flex items-center justify-center border-none btn-green-gradient shadow-sm">
                    <ion-icon name="add-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 8: SUMMARY & AUTOMATIONS CHECKOUT -->
          <div *ngIf="step() === 8" class="space-y-4">
            <h2 class="text-[20px] font-black text-[#111827] m-0">Booking Summary</h2>

            <!-- Smart Automation Accordion Toggle Card -->
            <div class="bg-white rounded-[24px] overflow-hidden border-[#8CF000]/22 border-2 shadow-md">
              <div class="px-5 pt-5 pb-4">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-2xl bg-[#8CF000]/15 flex items-center justify-center flex-shrink-0">
                    <ion-icon name="sparkles-outline" class="text-[#8CF000] text-lg font-bold"></ion-icon>
                  </div>
                  <div class="flex-1">
                    <p class="text-[15px] font-black text-[#111827] m-0">Automate Coaching Session</p>
                    <p class="text-[11px] text-[#9CA3AF] m-0 font-medium mt-0.5">TYNG can automatically create your session after booking.</p>
                  </div>
                  <button (click)="automate.set(!automate())" class="toggle-btn" [class.toggle-on]="automate()">
                    <div class="toggle-thumb" [class.toggle-thumb-on]="automate()"></div>
                  </button>
                </div>

                <div *ngIf="automate()" class="flex items-center gap-2 bg-[#8CF000]/8 rounded-xl px-3 py-2.5 mt-3">
                  <ion-icon name="checkmark-circle" class="text-[#16A34A] text-base"></ion-icon>
                  <span class="text-[12px] font-bold text-[#111827]">Invite Students After Booking</span>
                </div>
              </div>

              <!-- Expanded automation checklist details -->
              <div *ngIf="automate()" class="border-t border-[#F3F4F6] px-5 pb-5 pt-4 space-y-4">
                <div>
                  <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Choose Participants</p>
                  <div class="space-y-2.5">
                    <button *ngFor="let opt of [{ id:'existing', icon:'👥', label:'Select Existing Students', sub:'Choose from your student list' }, { id:'batch', icon:'📚', label:'Select Previous Batch', sub:'Reuse a coaching batch' }, { id:'new', icon:'➕', label:'Add New Participants', sub:'Search by name or TYNG ID' }]"
                      (click)="participantType.set(opt.id)" class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl border-none text-left"
                      [style.backgroundColor]="participantType() === opt.id ? 'rgba(140,240,0,0.08)' : '#F9FAFB'"
                      [style.border]="participantType() === opt.id ? '2px solid #8CF000' : '2px solid transparent'">
                      <span class="text-2xl">{{ opt.icon }}</span>
                      <div class="flex-grow">
                        <p class="text-[13px] font-bold text-[#111827] m-0">{{ opt.label }}</p>
                        <p class="text-[11px] text-[#9CA3AF] m-0 font-medium mt-0.5">{{ opt.sub }}</p>
                      </div>
                      <ion-icon *ngIf="participantType() === opt.id" name="checkmark-circle" class="text-[#8CF000] text-lg"></ion-icon>
                    </button>
                  </div>
                </div>

                <div class="bg-[#111827] rounded-2xl p-4 text-white">
                  <div class="flex items-center gap-2 mb-3">
                    <ion-icon name="flash-outline" class="text-[#8CF000] text-base"></ion-icon>
                    <p class="text-[12px] font-black text-[#8CF000] uppercase tracking-wider m-0">TYNG Will Automatically</p>
                  </div>
                  <div *ngFor="let a of ['Create a coaching session','Add it to your schedule','Add to student\\'s calendar','Create dedicated session chat','Generate unique attendance QR Code']"
                    class="flex items-center gap-2 py-1.5 border-b border-white/5 last:border-none">
                    <div class="w-4 h-4 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
                      <ion-icon name="checkmark-outline" class="text-[#111827] text-[10px] font-black"></ion-icon>
                    </div>
                    <span class="text-[11px] text-white/70 font-medium">{{ a }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Coupon Code input validation -->
            <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Coupon Code</p>
              <div *ngIf="appliedCoupon()" class="flex items-center gap-3 bg-[#F0FDF4] rounded-2xl px-4 py-3 border border-[#8CF000]/15">
                <ion-icon name="checkmark-outline" class="text-[#22C55E] text-base"></ion-icon>
                <div class="flex-grow">
                  <p class="text-[13px] font-black text-[#111827] m-0">{{ appliedCoupon()?.code }}</p>
                  <p class="text-[11px] text-[#16A34A] m-0 font-bold">You save ₹{{ appliedCoupon()?.discount }}</p>
                </div>
                <button (click)="removeCoupon()" class="text-[#9CA3AF] bg-transparent border-none"><ion-icon name="close-outline" class="text-lg"></ion-icon></button>
              </div>

              <div *ngIf="!appliedCoupon()">
                <div class="flex gap-2">
                  <input [(ngModel)]="couponInput" placeholder="Enter coupon code..." class="flex-grow bg-[#F3F4F6] rounded-2xl px-4 h-11 text-[14px] font-bold text-[#111827] uppercase border-none focus:outline-none outline-none" />
                  <button (click)="applyCoupon()" [disabled]="!couponInput.trim()" class="h-11 px-5 rounded-2xl text-[13px] font-black border-none"
                    [style.backgroundColor]="couponInput.trim() ? '#8CF000' : '#F3F4F6'"
                    [style.color]="couponInput.trim() ? '#111827' : '#C4C9D4'">
                    Apply
                  </button>
                </div>
                <p *ngIf="couponErr()" class="text-[11px] text-[#EF4444] mt-1.5 m-0 font-bold">{{ couponErr() }}</p>
                <p class="text-[10px] text-[#9CA3AF] mt-1 m-0 font-bold">Try: COACH20</p>
              </div>
            </div>

            <!-- Price breaks receipt invoice -->
            <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3 m-0">Price Breakdown</p>
              <div class="space-y-0.5">
                <div class="flex justify-between items-start py-3 border-b border-[#F9FAFB]">
                  <div>
                    <p class="text-[13px] font-bold text-[#6B7280] m-0">Venue Charges</p>
                    <p class="text-[10px] text-[#C4C9D4] m-0 font-bold">{{ getHrs() }}h × ₹{{ selectedVenue.pricePerHour.toLocaleString() }}</p>
                  </div>
                  <p class="text-[13px] font-black text-[#111827] m-0">₹{{ getVenueCost().toLocaleString() }}</p>
                </div>

                <div *ngIf="getEquipCost() > 0" class="flex justify-between items-start py-3 border-b border-[#F9FAFB]">
                  <div>
                    <p class="text-[13px] font-bold text-[#6B7280] m-0">Equipment Rental</p>
                    <p class="text-[10px] text-[#C4C9D4] m-0 font-bold">Selected items</p>
                  </div>
                  <p class="text-[13px] font-black text-[#111827] m-0">₹{{ getEquipCost().toLocaleString() }}</p>
                </div>

                <div class="flex justify-between items-start py-3 border-b border-[#F9FAFB]">
                  <div>
                    <p class="text-[13px] font-bold text-[#6B7280] m-0">GST (18%)</p>
                    <p class="text-[10px] text-[#C4C9D4] m-0 font-bold">Standard government tax</p>
                  </div>
                  <p class="text-[13px] font-black text-[#111827] m-0">₹{{ getGST().toLocaleString() }}</p>
                </div>

                <div class="flex justify-between items-start py-3 border-b border-[#F9FAFB]">
                  <div>
                    <p class="text-[13px] font-bold text-[#6B7280] m-0">Platform Fee</p>
                    <p class="text-[10px] text-[#C4C9D4] m-0 font-bold">Processing charge</p>
                  </div>
                  <p class="text-[13px] font-black text-[#111827] m-0">₹49</p>
                </div>

                <div *ngIf="appliedCoupon()" class="flex justify-between items-start py-3 border-b border-[#F9FAFB]">
                  <div>
                    <p class="text-[13px] font-bold text-[#22C55E] m-0">Coupon: {{ appliedCoupon()?.code }}</p>
                    <p class="text-[10px] text-[#C4C9D4] m-0 font-bold">Discount applied</p>
                  </div>
                  <p class="text-[13px] font-black text-[#22C55E] m-0">−₹{{ appliedCoupon()?.discount?.toLocaleString() }}</p>
                </div>
              </div>

              <!-- Total Payable -->
              <div class="mt-3 bg-[#111827] rounded-2xl px-5 py-4 flex items-center justify-between">
                <div class="text-left">
                  <p class="text-[11px] text-white/50 uppercase tracking-wider m-0">Total Payable</p>
                  <p class="text-[10px] text-white/30 m-0">Incl. GST & fees</p>
                </div>
                <p class="text-[28px] font-black text-[#8CF000] m-0">₹{{ getTotal().toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky continue bottom bar CTA -->
        <div class="fixed bottom-0 left-0 right-0 z-30 bg-white max-w-md mx-auto px-5 pt-3 pb-8 shadow-2xl border-t border-[#F3F4F6]">
          <div class="flex items-center gap-4">
            <div class="flex-shrink-0 text-left">
              <p class="text-[10px] text-[#9CA3AF] m-0 font-bold">Total Amount</p>
              <p class="text-[20px] font-black text-[#111827] m-0">₹{{ getTotal().toLocaleString() }}</p>
            </div>
            <button (click)="handleNext()" [disabled]="!canProceed()" class="flex-grow h-13 py-3.5 rounded-2xl text-[15px] font-black flex items-center justify-center gap-1 border-none transition-all"
              [style.background]="canProceed() ? 'linear-gradient(135deg,#FF7A00,#FF9A40)' : '#F3F4F6'"
              [style.color]="canProceed() ? 'white' : '#C4C9D4'"
              [style.boxShadow]="canProceed() ? '0 4px 16px rgba(255,122,0,0.35)' : 'none'">
              <span>{{ step() === 8 ? 'Confirm Booking' : 'Continue' }}</span>
              <ion-icon name="chevron-forward-outline" class="text-lg"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000, #A3E635);
      box-shadow: 0 4px 14px rgba(140,240,0,0.30);
      color: #111827;
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

    .range-slider-input {
      -webkit-appearance: none;
      width: 100%;
      height: 6px;
      border-radius: 999px;
      background: #E5E7EB;
      outline: none;

      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 22px;
        height: 22px;
        border-radius: 50%;
        background: #8CF000;
        cursor: pointer;
        box-shadow: 0 2px 6px rgba(0,0,0,0.15);
      }
    }
  `]
})
export class CoachVenueBookingPage {
  private readonly router = inject(Router);

  selectedVenue = COACH_VENUES[0];

  step = signal(1);
  isSuccess = signal(false);

  sport = signal('');
  dateIdx = signal(0);
  time = signal('');
  duration = signal('');
  trainType = signal('');
  students = signal(10);
  studentsVal = 10;
  equip = signal<Record<string, number>>({});

  automate = signal(true);
  participantType = signal<string>('existing');
  sessionTitle = '';

  couponInput = '';
  appliedCoupon = signal<{ code: string; discount: number } | null>(null);
  couponErr = signal('');

  readonly sports = SPORTS_CARDS;
  readonly dates = buildDates();
  readonly durations = DURATIONS;
  readonly trainingTypes = TRAINING_TYPES;
  readonly equipment = EQUIPMENT;
  readonly Math = Math;

  constructor() {
    // Read state from navigate
    const state = this.router.getCurrentNavigation()?.extras?.state as { venue?: Venue } | undefined;
    if (state?.venue) {
      this.selectedVenue = state.venue;
    }
  }

  onSliderChange(e: Event) {
    const val = parseInt((e.target as HTMLInputElement).value) || 1;
    this.students.set(val);
  }

  getHrs(): number {
    const durObj = DURATIONS.find(d => d.id === this.duration());
    return durObj?.hrs ?? 1;
  }

  getVenueCost(): number {
    return this.selectedVenue.pricePerHour * this.getHrs();
  }

  getEquipQty(id: string): number {
    return this.equip()[id] ?? 0;
  }

  incEquip(id: string) {
    this.equip.update(e => ({ ...e, [id]: (e[id] ?? 0) + 1 }));
  }

  decEquip(id: string) {
    this.equip.update(e => {
      const copy = { ...e };
      if ((copy[id] ?? 0) > 0) {
        copy[id]--;
      }
      return copy;
    });
  }

  getEquipCost(): number {
    return Object.entries(this.equip()).reduce((sum, [id, qty]) => {
      const meta = EQUIPMENT.find(eq => eq.id === id);
      return sum + (meta ? meta.price * qty : 0);
    }, 0);
  }

  getSubtotal(): number {
    return this.getVenueCost() + this.getEquipCost();
  }

  getGST(): number {
    return Math.round(this.getSubtotal() * 0.18);
  }

  getTotal(): number {
    const disc = this.appliedCoupon()?.discount ?? 0;
    return this.getSubtotal() + this.getGST() + 49 - disc;
  }

  canProceed = computed(() => {
    const s = this.step();
    if (s === 1) return this.sport() !== '';
    if (s === 2) return true; // Date defaults to 0
    if (s === 3) return this.time() !== '';
    if (s === 4) return this.duration() !== '';
    if (s === 5) return this.trainType() !== '';
    if (s === 6) return this.students() > 0;
    return true;
  });

  handleNext() {
    if (this.step() < 8) {
      this.step.update(s => s + 1);
    } else {
      this.isSuccess.set(true);
    }
  }

  handlePrev() {
    if (this.step() === 1) {
      this.back();
    } else {
      this.step.update(s => s - 1);
    }
  }

  applyCoupon() {
    const code = this.couponInput.toUpperCase().trim();
    if (code === 'COACH20') {
      const disc = Math.round(this.getSubtotal() * 0.20);
      this.appliedCoupon.set({ code: 'COACH20', discount: disc });
      this.couponErr.set('');
      this.couponInput = '';
    } else {
      this.couponErr.set('Invalid code. Try COACH20');
    }
  }

  removeCoupon() {
    this.appliedCoupon.set(null);
  }

  getAutomationSuccessLogs(): string[] {
    if (!this.automate()) return ['Venue Reserved'];
    return [
      'Venue Reserved',
      'Coaching Session Created',
      'Student Invitations Sent',
      'Session Chat Created',
      'Added to My Schedule',
      'Attendance QR Generated',
    ];
  }

  back() {
    this.router.navigateByUrl('/app/coach/book-venue');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }
}
