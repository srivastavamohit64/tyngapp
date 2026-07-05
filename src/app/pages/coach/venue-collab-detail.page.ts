import { CommonModule } from '@angular/common';
import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface CollabContract {
  start: string;
  end: string;
  duration: string;
  paymentCycle: string;
  gst: string;
  method: string;
}

interface CollabSessions {
  scheduled: number;
  completed: number;
  hours: number;
  remaining: number;
  attendance: number;
  cancellation: number;
}

interface CollabEarnings {
  coaching: number;
  bonus: number;
  incentive: number;
}

interface CollabTimeline {
  month: string;
  amount: number;
  status: string;
  date: string;
}

interface CollabAttendance {
  date: string;
  time: string;
  duration: string;
  students: number;
  status: string;
}

interface CollabPayment {
  bank: string;
  upi: string;
  ref: string;
  date: string;
  invoice: string;
  gst: string;
}

interface CollabManager {
  name: string;
  title: string;
  photo: string;
  phone: string;
  email: string;
}

interface CollabNote {
  text: string;
  date: string;
}

interface CollabVenueData {
  venueName: string;
  sport: string;
  emoji: string;
  image: string;
  status: string;
  contractType: string;
  monthly: number;
  schedule: string;
  time: string;
  contract: CollabContract;
  sessions: CollabSessions;
  earnings: CollabEarnings;
  timeline: CollabTimeline[];
  attendance: CollabAttendance[];
  payment: CollabPayment;
  manager: CollabManager;
  notes: CollabNote[];
}

const COLLAB_DATA: Record<string, CollabVenueData> = {
  '1': {
    venueName:    'Elite Cricket Academy',
    sport:        'Cricket', emoji: '🏏',
    image:        'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=800&h=420&fit=crop&auto=format',
    status:       'Active',
    contractType: 'Monthly Contract',
    monthly:      35000,
    schedule:     'Monday · Wednesday · Friday',
    time:         '4:00 PM – 7:00 PM',
    contract: {
      start:    '1 July 2026', end: '31 December 2026',
      duration: '6 Months', paymentCycle: 'Monthly',
      gst: '18%', method: 'Bank Transfer',
    },
    sessions: { scheduled: 48, completed: 44, hours: 132, remaining: 12, attendance: 98, cancellation: 2 },
    earnings: { coaching: 35000, bonus: 2000, incentive: 1500 },
    timeline: [
      { month: 'July',      amount: 35000, status: 'Paid',       date: '5 Aug 2026' },
      { month: 'August',    amount: 35000, status: 'Paid',       date: '5 Sep 2026' },
      { month: 'September', amount: 35000, status: 'Processing', date: 'Estimated 5 Oct' },
      { month: 'October',   amount: 35000, status: 'Upcoming',   date: 'Due 5 Nov' },
      { month: 'November',  amount: 35000, status: 'Upcoming',   date: 'Due 5 Dec' },
      { month: 'December',  amount: 35000, status: 'Upcoming',   date: 'Due 5 Jan' },
    ],
    attendance: [
      { date: '12 Sep', time: '4 PM–7 PM', duration: '3 hrs', students: 11, status: 'Completed' },
      { date: '10 Sep', time: '4 PM–7 PM', duration: '3 hrs', students: 12, status: 'Completed' },
      { date: '8 Sep',  time: '4 PM–7 PM', duration: '3 hrs', students: 10, status: 'Completed' },
      { date: '5 Sep',  time: '4 PM–7 PM', duration: '3 hrs', students: 11, status: 'Completed' },
      { date: '3 Sep',  time: '4 PM–7 PM', duration: '3 hrs', students: 12, status: 'Completed' },
    ],
    payment: { bank: 'HDFC Bank · XXXX 4589', upi: 'rajesh@hdfc', ref: 'TXN-EC-20261001', date: '5 Sep 2026', invoice: 'INV-EC-2026-09', gst: 'GSTIN29AA1234Z1' },
    manager: { name: 'Suresh Kumar', title: 'Venue Manager', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', phone: '+91 98765 43210', email: 'suresh@elitecricket.in' },
    notes: [
      { text: 'Excellent attendance this month. Coach Rajesh has maintained 98% attendance consistently.', date: '10 Sep 2026' },
      { text: 'Performance bonus awarded for conducting 2 additional weekend sessions in August.', date: '2 Sep 2026' },
      { text: 'Contract renewed until December 2026 with updated payment terms.', date: '28 Jul 2026' },
    ],
  },
  '2': {
    venueName:    'Phoenix Sports Hub',
    sport:        'Badminton', emoji: '🏸',
    image:        'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=800&h=420&fit=crop&auto=format',
    status:       'Active',
    contractType: 'Per Session',
    monthly:      18000,
    schedule:     'Tuesday · Thursday · Saturday',
    time:         '6:00 AM – 9:00 AM',
    contract: { start: '1 Jun 2026', end: '30 Nov 2026', duration: '6 Months', paymentCycle: 'Weekly', gst: '18%', method: 'UPI' },
    sessions: { scheduled: 36, completed: 32, hours: 96, remaining: 12, attendance: 94, cancellation: 6 },
    earnings: { coaching: 18000, bonus: 0, incentive: 500 },
    timeline: [
      { month: 'June',    amount: 18000, status: 'Paid',     date: '5 Jul 2026' },
      { month: 'July',    amount: 18000, status: 'Paid',     date: '5 Aug 2026' },
      { month: 'August',  amount: 18000, status: 'Paid',     date: '5 Sep 2026' },
      { month: 'September', amount: 18000, status: 'Upcoming', date: 'Due 5 Oct' },
    ],
    attendance: [
      { date: '10 Sep', time: '6 AM–9 AM', duration: '3 hrs', students: 5, status: 'Completed' },
      { date: '8 Sep',  time: '6 AM–9 AM', duration: '3 hrs', students: 4, status: 'Completed' },
    ],
    payment: { bank: 'HDFC Bank · XXXX 4589', upi: 'rajesh@hdfc', ref: 'TXN-PS-20260901', date: '5 Sep 2026', invoice: 'INV-PS-2026-09', gst: 'GSTIN29AA1234Z1' },
    manager: { name: 'Rekha Sharma', title: 'Sports Director', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', phone: '+91 87654 32109', email: 'rekha@phoenixsports.in' },
    notes: [{ text: 'Good performance. Attendance slightly lower than target this month.', date: '8 Sep 2026' }],
  },
};

const DOCS = [
  { name: 'Monthly Invoice',     sub: 'September 2026 · PDF', size: '124 KB' },
  { name: 'GST Invoice',         sub: 'GSTIN · September 2026', size: '89 KB' },
  { name: 'Payment Receipt',     sub: 'TXN-EC-20261001 · PDF',  size: '56 KB' },
  { name: 'Contract Agreement',  sub: 'Jul–Dec 2026 · PDF',      size: '342 KB' },
  { name: 'Attendance Report',   sub: 'September 2026 · PDF',   size: '178 KB' },
];

@Component({
  selector: 'app-venue-collab-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="collab-detail-page pb-36 text-left">
        <!-- Sticky Header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[15px] font-black text-[#111827] m-0">Venue Collaboration</p>
              <p class="text-[11px] text-[#9CA3AF] m-0 font-bold">{{ data().venueName }}</p>
            </div>
            <div class="flex gap-1.5">
              <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
                <ion-icon name="download-outline" class="text-[#111827] text-lg"></ion-icon>
              </button>
              <button class="w-9 h-9 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
                <ion-icon name="share-social-outline" class="text-[#111827] text-lg"></ion-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="px-5 pt-4 space-y-4">
          <!-- Cover card banner -->
          <div class="section-card bg-white overflow-hidden shadow-sm border border-slate-50">
            <div class="relative h-[160px] overflow-hidden bg-gray-200">
              <img [src]="data().image" class="w-full h-full object-cover" />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"></div>
              <div class="absolute top-3 right-3">
                <span class="text-[11px] font-black px-2.5 py-1 rounded-full"
                  [style.backgroundColor]="getStatusStyle(data().status).bg"
                  [style.color]="getStatusStyle(data().status).color">
                  {{ data().status }}
                </span>
              </div>
              <div class="absolute bottom-3 left-4 right-4">
                <div class="flex items-center gap-2 mb-0.5">
                  <span class="text-2xl">{{ data().emoji }}</span>
                  <p class="text-white font-black text-[18px] drop-shadow-md m-0 leading-none">{{ data().venueName }}</p>
                </div>
                <p class="text-white/70 text-[12px] m-0 mt-1 font-bold">{{ data().sport }} · {{ data().contractType }}</p>
              </div>
            </div>

            <div class="px-5 py-4 text-left">
              <div class="flex items-start justify-between mb-3 flex-wrap gap-2">
                <div>
                  <p class="text-[11px] text-[#9CA3AF] font-bold m-0 uppercase tracking-wider">Monthly Contract</p>
                  <p class="text-[26px] font-black text-[#111827] m-0">₹{{ data().monthly.toLocaleString('en-IN') }}<span class="text-[13px] text-[#9CA3AF] font-medium"> /month</span></p>
                </div>
                <div class="text-right">
                  <p class="text-[12px] font-black text-[#111827] m-0">{{ data().schedule }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 font-bold mt-1">{{ data().time }}</p>
                </div>
              </div>
              <button class="w-full h-10 rounded-2xl text-[13px] font-bold text-[#111827] flex items-center justify-center gap-1 border-none bg-[#8CF000]/12 border-[#8CF000]/30 border-2">
                View Venue Profile<ion-icon name="chevron-forward-outline"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Contract summary parameters list -->
          <div class="section-card p-5 bg-white">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Contract Summary</p>
            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let item of getContractList()" class="bg-[#F9FAFB] rounded-2xl px-3.5 py-3 border border-slate-50 text-left">
                <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider mb-0.5 m-0 font-bold">{{ item.label }}</p>
                <p class="text-[13px] font-black text-[#111827] leading-tight m-0">{{ item.val }}</p>
              </div>
            </div>
          </div>

          <!-- Session statistics counters -->
          <div class="section-card p-5 bg-white">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Session Summary</p>
            <div class="grid grid-cols-2 gap-3 mb-4">
              <div *ngFor="let s of getSessionStatsList()" class="rounded-[20px] p-3.5 relative overflow-hidden border"
                [style.backgroundColor]="s.color + '10'" [style.borderColor]="s.color + '22'">
                <div class="absolute -bottom-3 -right-3 w-10 h-10 rounded-full opacity-20" [style.backgroundColor]="s.color"></div>
                <span class="text-xl relative leading-none">{{ s.emoji }}</span>
                <p class="text-[20px] font-black text-[#111827] mt-1.5 leading-none relative m-0">{{ s.val }}</p>
                <p class="text-[10px] text-[#6B7280] mt-1 relative m-0 font-bold">{{ s.label }}</p>
                <p class="text-[9px] text-[#9CA3AF] relative m-0 font-bold">{{ s.sub }}</p>
              </div>
            </div>
            <!-- Attendance percentage rates -->
            <div class="grid grid-cols-2 gap-3">
              <div class="bg-[#F9FAFB] rounded-2xl px-4 py-3 text-center border border-slate-50">
                <p class="text-[22px] font-black text-[#22C55E] m-0">{{ data().sessions.attendance }}%</p>
                <p class="text-[10px] text-[#9CA3AF] mt-0.5 m-0 font-bold">Attendance Rate</p>
              </div>
              <div class="bg-[#F9FAFB] rounded-2xl px-4 py-3 text-center border border-slate-50">
                <p class="text-[22px] font-black text-[#EF4444] m-0">{{ data().sessions.cancellation }}%</p>
                <p class="text-[10px] text-[#9CA3AF] mt-0.5 m-0 font-bold">Cancellation Rate</p>
              </div>
            </div>
          </div>

          <!-- Invoice Breakdown -->
          <div class="section-card p-5 bg-white">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Earnings Breakdown</p>
            <div class="space-y-0.5">
              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB]">
                <div>
                  <p class="text-[13px] font-bold text-[#6B7280] m-0">Coaching Charges</p>
                </div>
                <p class="text-[13px] font-black text-[#111827] m-0">₹{{ data().earnings.coaching.toLocaleString('en-IN') }}</p>
              </div>

              <div *ngIf="data().earnings.bonus > 0" class="flex items-start justify-between py-3 border-b border-[#F9FAFB]">
                <div>
                  <p class="text-[13px] font-bold text-[#6B7280] m-0">Performance Bonus</p>
                  <p class="text-[10px] text-[#9CA3AF] m-0 font-bold">Weekend additional sessions</p>
                </div>
                <p class="text-[13px] font-black text-[#111827] m-0">+₹{{ data().earnings.bonus.toLocaleString('en-IN') }}</p>
              </div>

              <div *ngIf="data().earnings.incentive > 0" class="flex items-start justify-between py-3 border-b border-[#F9FAFB]">
                <div>
                  <p class="text-[13px] font-bold text-[#6B7280] m-0">Venue Incentive</p>
                  <p class="text-[10px] text-[#9CA3AF] m-0 font-bold">Attendance excellence bonus</p>
                </div>
                <p class="text-[13px] font-black text-[#111827] m-0">+₹{{ data().earnings.incentive.toLocaleString('en-IN') }}</p>
              </div>

              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB]">
                <div>
                  <p class="text-[13px] font-black text-[#111827] m-0">Gross Amount</p>
                </div>
                <p class="text-[14px] font-black text-[#111827] m-0">₹{{ getGross().toLocaleString('en-IN') }}</p>
              </div>

              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB] pt-4">
                <div>
                  <p class="text-[13px] font-bold text-[#6B7280] m-0">GST (18%)</p>
                  <p class="text-[10px] text-[#9CA3AF] m-0 font-bold">Collected from venue, not deducted</p>
                </div>
                <p class="text-[13px] font-black text-[#111827] m-0">₹0</p>
              </div>

              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB]">
                <div>
                  <p class="text-[13px] font-bold text-[#6B7280] m-0">Platform Fee</p>
                  <p class="text-[10px] text-[#9CA3AF] m-0 font-bold">TYNG processing charge</p>
                </div>
                <p class="text-[13px] font-black text-[#EF4444] m-0">−₹750</p>
              </div>

              <div class="flex items-start justify-between py-3 border-b border-[#F9FAFB]">
                <div>
                  <p class="text-[13px] font-bold text-[#6B7280] m-0">TDS (10%)</p>
                  <p class="text-[10px] text-[#9CA3AF] m-0 font-bold">Section 194C applicable</p>
                </div>
                <p class="text-[13px] font-black text-[#EF4444] m-0">−₹{{ getTDS().toLocaleString('en-IN') }}</p>
              </div>
            </div>

            <!-- Net payable hero -->
            <div class="mt-4 rounded-[20px] px-5 py-4 flex items-center justify-between bg-gradient-to-br from-[#111827] to-[#1F2937] text-white">
              <div class="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-[#8CF000]/10"></div>
              <div>
                <p class="text-[11px] font-black text-[#8CF000] uppercase tracking-wider mb-0.5 m-0">Net Payable</p>
                <p class="text-[11px] text-white/40 m-0 font-bold">After deductions</p>
              </div>
              <p class="text-[32px] font-black text-[#8CF000] m-0">₹{{ getNet().toLocaleString('en-IN') }}</p>
            </div>
          </div>

          <!-- Timeline steps of payments -->
          <div class="section-card p-5 bg-white">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Payment Timeline</p>
            <div class="space-y-2.5">
              <div *ngFor="let t of data().timeline" class="flex items-center gap-3 bg-[#F9FAFB] rounded-2xl px-4 py-3.5 border border-slate-50">
                <div class="w-10 h-10 rounded-2xl bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ion-icon name="calendar-outline" class="text-[#6B7280] text-base"></ion-icon>
                </div>
                <div class="flex-grow">
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ t.month }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5 font-bold">{{ t.date }}</p>
                </div>
                <div class="text-right">
                  <p class="text-[14px] font-black text-[#111827] m-0">₹{{ t.amount.toLocaleString('en-IN') }}</p>
                  <span class="text-[10px] font-bold px-2 py-0.5 rounded-full inline-block mt-0.5"
                    [style.backgroundColor]="getStatusStyle(t.status).bg"
                    [style.color]="getStatusStyle(t.status).color">
                    {{ t.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Attendance Logs -->
          <div class="section-card p-5 bg-white">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-0 m-0">Attendance Log</p>
              <button class="text-[12px] font-bold text-[#8CF000] flex items-center gap-0.5 bg-transparent border-none">
                All Sessions<ion-icon name="chevron-forward-outline"></ion-icon>
              </button>
            </div>
            <div class="space-y-0.5">
              <div *ngFor="let a of data().attendance" class="flex items-center gap-3 py-3.5 border-b border-[#F9FAFB] last:border-none">
                <div class="w-10 h-10 rounded-2xl bg-[#F0FDF4] flex items-center justify-center flex-shrink-0 border border-slate-50 shadow-sm">
                  <ion-icon name="checkmark-circle-outline" class="text-[#22C55E] text-base"></ion-icon>
                </div>
                <div class="flex-grow">
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ a.date }} · {{ a.time }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5 font-bold">{{ a.duration }} · {{ a.students }} students</p>
                </div>
                <span class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  [style.backgroundColor]="getStatusStyle(a.status).bg"
                  [style.color]="getStatusStyle(a.status).color">
                  {{ a.status }}
                </span>
              </div>
            </div>
          </div>

          <!-- Documents list -->
          <div class="section-card p-5 bg-white">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Documents</p>
            <div class="space-y-3">
              <div *ngFor="let doc of docOptions" class="flex items-center gap-3 bg-[#F9FAFB] rounded-2xl px-4 py-3.5 border border-slate-50">
                <div class="w-10 h-10 rounded-2xl bg-[#EFF6FF] flex items-center justify-center flex-shrink-0 shadow-sm">
                  <ion-icon name="document-text-outline" class="text-[#2563EB] text-lg"></ion-icon>
                </div>
                <div class="flex-grow">
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ doc.name }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0 mt-0.5 font-bold">{{ doc.sub }} · {{ doc.size }}</p>
                </div>
                <button class="w-9 h-9 rounded-xl flex items-center justify-center border-none shadow-sm btn-orange-gradient">
                  <ion-icon name="download-outline" class="text-white text-sm"></ion-icon>
                </button>
              </div>
            </div>
          </div>

          <!-- Payout detail log rows -->
          <div class="section-card p-5 bg-white">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Payment Information</p>
            <div class="space-y-1">
              <div *ngFor="let item of getPaymentDetailsList()" class="flex items-center justify-between py-2.5 border-b border-[#F9FAFB] last:border-none">
                <span class="text-[12px] text-[#9CA3AF] font-bold">{{ item.label }}</span>
                <span class="text-[13px] font-black text-[#111827] max-w-[55%] truncate">{{ item.val }}</span>
              </div>
            </div>
          </div>

          <!-- Manager card contact profile -->
          <div class="section-card p-5 bg-white">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Venue Contact</p>
            <div class="flex items-center gap-4 mb-4">
              <img [src]="data().manager.photo" class="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-slate-100 shadow-sm" />
              <div class="flex-grow min-w-0">
                <p class="text-[15px] font-black text-[#111827] m-0 leading-none">{{ data().manager.name }}</p>
                <p class="text-[12px] text-[#9CA3AF] m-0 mt-1 font-bold">{{ data().manager.title }}</p>
                <div class="flex items-center gap-1 text-[11px] text-[#9CA3AF] mt-1.5 font-bold">
                  <ion-icon name="phone-portrait-outline"></ion-icon><span>{{ data().manager.phone }}</span>
                </div>
              </div>
            </div>
            <div class="grid grid-cols-3 gap-2">
              <button class="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-none bg-[#F0FDF4] text-[#22C55E]">
                <ion-icon name="call-outline" class="text-lg"></ion-icon>
                <span class="text-[11px] font-bold">Call</span>
              </button>
              <button (click)="go('/app/chat')" class="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-none bg-[#EFF6FF] text-[#2563EB]">
                <ion-icon name="chatbubble-ellipses-outline" class="text-lg"></ion-icon>
                <span class="text-[11px] font-bold">Chat</span>
              </button>
              <button class="flex flex-col items-center gap-1.5 py-3 rounded-2xl border-none bg-[#FFF7ED] text-[#FF7A00]">
                <ion-icon name="mail-outline" class="text-lg"></ion-icon>
                <span class="text-[11px] font-bold">Email</span>
              </button>
            </div>
          </div>

          <!-- Notes -->
          <div class="section-card p-5 bg-white">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Notes & Remarks</p>
            <div class="space-y-3">
              <div *ngFor="let n of data().notes" class="bg-[#F9FAFB] rounded-2xl px-4 py-3.5 border-l-4 border-[#8CF000] border-t border-r border-b border-slate-100">
                <p class="text-[13px] text-[#111827] leading-relaxed mb-1 m-0 font-medium">"{{ n.text }}"</p>
                <p class="text-[10px] text-[#9CA3AF] m-0 mt-2 font-bold">{{ n.date }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Sticky bottom footer action buttons -->
        <div class="fixed bottom-0 left-0 right-0 z-30 bg-white max-w-md mx-auto px-4 pt-3 pb-8 shadow-2xl border-t border-[#F3F4F6]">
          <div class="grid grid-cols-3 gap-2.5">
            <button class="flex flex-col items-center gap-1 py-3 rounded-2xl text-[10px] font-black border-none btn-green-gradient">
              <ion-icon name="download-outline" class="text-base"></ion-icon>Download Receipt
            </button>
            <button class="flex flex-col items-center gap-1 py-3 rounded-2xl text-[10px] font-black border-none btn-orange-gradient">
              <ion-icon name="document-text-outline" class="text-base"></ion-icon>Download Invoice
            </button>
            <button class="flex flex-col items-center gap-1 py-3 rounded-2xl text-[10px] font-bold border-none bg-[#F3F4F6] text-[#6B7280]">
              <ion-icon name="share-social-outline" class="text-base"></ion-icon>Share PDF
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .collab-detail-page {
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
      border-radius: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000, #A3E635);
      box-shadow: 0 4px 12px rgba(140,240,0,0.30);
      color: #111827;
    }

    .btn-orange-gradient {
      background: linear-gradient(135deg, #FF7A00, #FF9A40);
      box-shadow: 0 4px 12px rgba(255,122,0,0.30);
      color: white;
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }
  `]
})
export class VenueCollabDetailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  collabId = signal('1');
  readonly docOptions = DOCS;

  data = computed((): CollabVenueData => {
    const id = this.collabId();
    return COLLAB_DATA[id] || COLLAB_DATA['1'];
  });

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.collabId.set(idStr);
      }
    });
  }

  getGross(): number {
    const d = this.data();
    return d.earnings.coaching + d.earnings.bonus + d.earnings.incentive;
  }

  getTDS(): number {
    return Math.round(this.getGross() * 0.10);
  }

  getNet(): number {
    return this.getGross() - 750 - this.getTDS();
  }

  getStatusStyle(status: string) {
    if (status === 'Active' || status === 'Paid' || status === 'Completed') {
      return { bg: '#F0FDF4', color: '#16A34A' };
    }
    if (status === 'Processing') {
      return { bg: '#EFF6FF', color: '#1D4ED8' };
    }
    if (status === 'Pending') {
      return { bg: '#FFF7ED', color: '#C2410C' };
    }
    if (status === 'Cancelled' || status === 'Failed') {
      return { bg: '#FEF2F2', color: '#DC2626' };
    }
    return { bg: '#F3F4F6', color: '#6B7280' }; // Upcoming
  }

  getContractList() {
    const d = this.data();
    return [
      { label: 'Start Date', val: d.contract.start },
      { label: 'End Date', val: d.contract.end },
      { label: 'Duration', val: d.contract.duration },
      { label: 'Monthly Payment', val: `₹${d.monthly.toLocaleString('en-IN')}` },
      { label: 'Payment Cycle', val: d.contract.paymentCycle },
      { label: 'Payment Method', val: d.contract.method },
      { label: 'GST Applicable', val: d.contract.gst },
      { label: 'Contract Status', val: d.status },
    ];
  }

  getSessionStatsList() {
    const d = this.data();
    return [
      { emoji: '📅', label: 'Scheduled', val: d.sessions.scheduled, sub: 'Total booked', color: '#8CF000' },
      { emoji: '✅', label: 'Completed', val: d.sessions.completed, sub: 'Successfully done', color: '#22C55E' },
      { emoji: '⏱', label: 'Hours Coached', val: `${d.sessions.hours}h`, sub: 'Total coaching', color: '#38BDF8' },
      { emoji: '⏳', label: 'Remaining', val: `${d.sessions.remaining}h`, sub: 'Scheduled ahead', color: '#FF7A00' },
    ];
  }

  getPaymentDetailsList() {
    const d = this.data();
    return [
      { label: 'Bank Account', val: d.payment.bank },
      { label: 'UPI ID', val: d.payment.upi },
      { label: 'Transaction Ref', val: d.payment.ref },
      { label: 'Payment Date', val: d.payment.date },
      { label: 'Invoice No.', val: d.payment.invoice },
      { label: 'GST Number', val: d.payment.gst },
    ];
  }

  back() {
    this.router.navigateByUrl('/app/coach/earnings');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }
}
