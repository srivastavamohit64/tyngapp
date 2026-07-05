import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface StudentRecord {
  id: number;
  name: string;
  photo: string;
  skill: string;
  attendance: number;
}

const BLOOD_GROUPS = ['A+','A−','B+','B−','AB+','AB−','O+','O−'];
const GENDERS = ['Male','Female','Other'];
const SKILL_LEVELS = ['Beginner','Intermediate','Advanced'];
const ALL_SPORTS = ['Cricket','Football','Basketball','Badminton','Tennis','Volleyball','Swimming'];
const ALLERGY_OPTS = ['Dust','Pollen','Nuts','Dairy','Latex','Penicillin','Other'];
const SESSION_DAYS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const FREQUENCIES = ['Once Weekly','Twice Weekly','Three Times Weekly','Custom'];
const MEMBERSHIPS = ['Trial Student','Regular Student','Academy Student','Private Coaching','Camp Participant'];
const BATCHES = [
  { id:'b1', label:'Saturday Cricket Batch', members:12 },
  { id:'b2', label:'Football Academy Group', members:18 },
  { id:'b3', label:'Morning Badminton Group', members:6  },
];

const MOCK_STUDENTS: StudentRecord[] = [
  { id: 1, name: 'Rahul Sharma', photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&auto=format', skill: 'Intermediate', attendance: 95 },
  { id: 2, name: 'Priya Verma', photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=80&h=80&fit=crop&auto=format', skill: 'Beginner', attendance: 88 },
  { id: 3, name: 'Vikram Patel', photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&auto=format', skill: 'Advanced', attendance: 92 },
];

@Component({
  selector: 'app-coach-enroll-student',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <!-- SUCCESS SCREEN -->
      <div *ngIf="isSuccess()" class="success-shell px-6">
        <div class="mb-6 flex flex-col items-center">
          <div class="success-circle mb-4">
            <ion-icon name="checkmark-outline" class="text-white text-5xl font-black"></ion-icon>
          </div>
          <h1 class="text-[24px] font-black text-[#111827] mb-1">Student Enrolled! 🎉</h1>
          <p class="text-[14px] text-[#9CA3AF] mb-5 text-center">{{ getStudentName() }} has been added to your roster.</p>
        </div>

        <div class="w-full max-w-sm bg-white rounded-[24px] p-5 mb-5 shadow-sm border border-slate-100 text-left space-y-2.5">
          <div *ngFor="let item of getSuccessItems()" class="flex items-center gap-3 py-2 border-b border-[#F9FAFB] last:border-none">
            <div class="w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
              <ion-icon name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
            </div>
            <span class="text-[13px] font-semibold text-[#111827]">{{ item }}</span>
          </div>
        </div>

        <div class="w-full max-w-sm grid grid-cols-2 gap-2.5">
          <button (click)="go('/app/coach/students')" class="success-action-btn shadow-sm">
            <ion-icon name="people-outline" class="text-[#8CF000] text-2xl mb-1"></ion-icon>
            View Profile
          </button>
          <button (click)="go('/app/coach/plan')" class="success-action-btn shadow-sm">
            <ion-icon name="calendar-outline" class="text-[#8CF000] text-2xl mb-1"></ion-icon>
            Schedule Session
          </button>
          <button (click)="go('/app/home')" class="success-action-btn shadow-sm">
            <ion-icon name="home-outline" class="text-[#8CF000] text-2xl mb-1"></ion-icon>
            Go Home
          </button>
          <button (click)="resetEnrollment()" class="success-action-btn shadow-sm">
            <ion-icon name="person-add-outline" class="text-[#8CF000] text-2xl mb-1"></ion-icon>
            Enroll Another
          </button>
        </div>
      </div>

      <!-- MAIN PAGE WIZARD -->
      <div *ngIf="!isSuccess()" class="enroll-page">
        <!-- Header -->
        <div class="sticky-header">
          <div class="flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
            <button (click)="handleBack()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <div class="text-center">
              <p class="text-[15px] font-black text-[#111827] m-0">Enroll Student</p>
              <p *ngIf="enrollType === 'managed'" class="text-[11px] text-[#9CA3AF] font-bold m-0">Step {{ managedStep }} of 6</p>
            </div>
            <button (click)="go('/app/home')" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="close-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
          </div>
          <div *ngIf="enrollType === 'managed'" class="py-3 bg-white flex justify-center border-b border-[#F3F4F6]">
            <div class="flex items-center gap-1.5">
              <div *ngFor="let s of [1,2,3,4,5,6]" class="h-1.5 rounded-full transition-all"
                [style.width]="managedStep === s ? '18px' : '6px'"
                [style.backgroundColor]="managedStep > s ? '#FF7A00' : (managedStep === s ? '#8CF000' : '#E5E7EB')"></div>
            </div>
          </div>
        </div>

        <div class="px-5 pt-5 pb-32">
          <!-- STEP 0: Select Enrollment Type -->
          <div *ngIf="enrollType === null">
            <h2 class="text-[22px] font-black text-[#111827] mb-1">How would you like to enroll?</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-5">Choose the best option for your student</p>
            <div class="space-y-3">
              <button (click)="enrollType = 'existing'" class="type-card border-none shadow-sm text-left w-full">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-[#8CF000]/12 flex items-center justify-center flex-shrink-0 text-2xl">📱</div>
                  <div class="flex-1">
                    <p class="text-[16px] font-black text-[#111827] m-0">Existing TYNG User</p>
                    <p class="text-[12px] text-[#9CA3AF] mt-0.5 mb-3">Student already has the TYNG app</p>
                    <div *ngFor="let bullet of ['Search by mobile, TYNG ID or name','Connect to your coaching profile','Full student history synced']" class="flex items-center gap-2 py-0.5">
                      <div class="w-4 h-4 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
                        <ion-icon name="checkmark-outline" style="font-size:9px;color:#111827;font-weight:bold;"></ion-icon>
                      </div>
                      <span class="text-[12px] text-[#6B7280]">{{ bullet }}</span>
                    </div>
                  </div>
                  <ion-icon name="chevron-forward-outline" class="text-[#D1D5DB] flex-shrink-0 mt-1"></ion-icon>
                </div>
              </button>

              <button (click)="enrollType = 'invite'" class="type-card border-none shadow-sm text-left w-full">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-[#8CF000]/12 flex items-center justify-center flex-shrink-0 text-2xl">✉️</div>
                  <div class="flex-1">
                    <p class="text-[16px] font-black text-[#111827] m-0">Invite to TYNG</p>
                    <p class="text-[12px] text-[#9CA3AF] mt-0.5 mb-3">Student doesn't have TYNG yet</p>
                    <div *ngFor="let bullet of ['Send SMS + WhatsApp invitation','Automatic coach invitation code','Profile syncs when they join']" class="flex items-center gap-2 py-0.5">
                      <div class="w-4 h-4 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
                        <ion-icon name="checkmark-outline" style="font-size:9px;color:#111827;font-weight:bold;"></ion-icon>
                      </div>
                      <span class="text-[12px] text-[#6B7280]">{{ bullet }}</span>
                    </div>
                  </div>
                  <ion-icon name="chevron-forward-outline" class="text-[#D1D5DB] flex-shrink-0 mt-1"></ion-icon>
                </div>
              </button>

              <button (click)="enrollType = 'managed'" class="type-card border-none shadow-sm text-left w-full">
                <div class="flex items-start gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-[#8CF000]/12 flex items-center justify-center flex-shrink-0 text-2xl">👨‍💼</div>
                  <div class="flex-1">
                    <p class="text-[16px] font-black text-[#111827] m-0">Coach Managed Profile</p>
                    <p class="text-[12px] text-[#9CA3AF] mt-0.5 mb-3">For children or academy students</p>
                    <div *ngFor="let bullet of ['Coach creates the profile','Works without a smartphone','Parents can be added anytime']" class="flex items-center gap-2 py-0.5">
                      <div class="w-4 h-4 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
                        <ion-icon name="checkmark-outline" style="font-size:9px;color:#111827;font-weight:bold;"></ion-icon>
                      </div>
                      <span class="text-[12px] text-[#6B7280]">{{ bullet }}</span>
                    </div>
                  </div>
                  <ion-icon name="chevron-forward-outline" class="text-[#D1D5DB] flex-shrink-0 mt-1"></ion-icon>
                </div>
              </button>
            </div>
          </div>

          <!-- TYPE 1: Existing User -->
          <div *ngIf="enrollType === 'existing'">
            <h2 class="text-[20px] font-black text-[#111827] mb-1">Find Student</h2>
            <p class="text-[13px] text-[#9CA3AF] mb-4">Search by name, mobile number or TYNG ID</p>
            <div class="flex items-center gap-2 bg-white rounded-2xl px-4 h-12 mb-4 border border-[#F3F4F6] shadow-sm">
              <ion-icon name="search-outline" class="text-[#9CA3AF]"></ion-icon>
              <input [(ngModel)]="searchQ" placeholder="Search TYNG users…" class="flex-1 bg-transparent text-[14px] text-[#111827] focus:outline-none min-h-0 border-none" />
            </div>

            <div *ngIf="selExisting" class="flex items-center gap-3 bg-[#8CF000]/10 rounded-2xl px-4 py-3.5 mb-4 border border-[#8CF000]/30 shadow-sm">
              <img [src]="selExisting.photo" class="w-10 h-10 rounded-full object-cover" />
              <div class="flex-1 text-left">
                <p class="text-[14px] font-black text-[#111827] m-0">{{ selExisting.name }}</p>
                <p class="text-[11px] text-[#8CF000] font-semibold m-0">✓ Selected</p>
              </div>
              <button (click)="selExisting = null" class="bg-transparent border-none p-0 flex"><ion-icon name="close-outline" class="text-slate-400"></ion-icon></button>
            </div>

            <div class="space-y-2">
              <button *ngFor="let s of filterStudents()" (click)="selExisting = s" class="student-row border-none shadow-sm bg-white"
                [style.borderColor]="selExisting?.id === s.id ? '#8CF000' : '#F3F4F6'"
                [style.backgroundColor]="selExisting?.id === s.id ? 'rgba(140,240,0,0.06)' : 'white'">
                <img [src]="s.photo" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div class="flex-1 text-left">
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ s.name }}</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">{{ s.skill }} · {{ s.attendance }}% attendance</p>
                </div>
                <div *ngIf="selExisting?.id === s.id" class="w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center">
                  <ion-icon name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
                </div>
              </button>
            </div>
          </div>

          <!-- TYPE 2: Invite Flow -->
          <div *ngIf="enrollType === 'invite'">
            <div *ngIf="invSent" class="text-center py-10">
              <div class="success-circle mb-4 mx-auto">
                <ion-icon name="checkmark-outline" class="text-white text-5xl font-black"></ion-icon>
              </div>
              <p class="text-[18px] font-black text-[#111827] mb-1">Invitation Sent!</p>
              <p class="text-[13px] text-[#9CA3AF]">
                {{ invName }} will receive an SMS and WhatsApp with a download link and your coaching invitation code.
              </p>
              <div class="mt-5 bg-white rounded-[20px] p-4 text-left shadow-sm border border-slate-100">
                <div *ngFor="let i of ['SMS Download Link','WhatsApp Invitation','App Store / Play Store Link','Coach Invitation Code']" class="flex items-center gap-2.5 py-2">
                  <div class="w-5 h-5 rounded-full bg-[#8CF000] flex items-center justify-center">
                    <ion-icon name="checkmark-outline" style="font-size:11px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                  <span class="text-[13px] text-[#111827] font-semibold">{{ i }}</span>
                </div>
              </div>
            </div>

            <div *ngIf="!invSent" class="space-y-4">
              <h2 class="text-[20px] font-black text-[#111827] mb-0.5">Invite to TYNG</h2>
              <p class="text-[13px] text-[#9CA3AF] mb-4">We'll send them a download link with your coaching invitation</p>
              <div class="section-card-box shadow-sm bg-white p-5">
                <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Student Details</p>
                <div class="space-y-3">
                  <div>
                    <label class="field-label">Full Name <span class="text-red-500">*</span></label>
                    <input [(ngModel)]="invName" placeholder="Enter student name" class="text-input" />
                  </div>
                  <div>
                    <label class="field-label">Mobile Number <span class="text-red-500">*</span></label>
                    <input [(ngModel)]="invPhone" type="tel" placeholder="Enter mobile number" class="text-input" />
                  </div>
                  <div>
                    <label class="field-label">Email Address</label>
                    <input [(ngModel)]="invEmail" placeholder="Enter email (optional)" class="text-input" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TYPE 3: Managed profile wizard -->
          <!-- STEP 1: Basic details -->
          <div *ngIf="enrollType === 'managed' && managedStep === 1" class="space-y-4">
            <h2 class="text-[20px] font-black text-[#111827] m-0">Student Information</h2>
            <div class="flex items-center gap-4 bg-white rounded-[24px] p-5 shadow-sm border border-slate-100">
              <div class="w-[72px] h-[72px] rounded-2xl bg-[#F3F4F6] flex flex-col items-center justify-center gap-1 flex-shrink-0 border-2 border-dashed border-[#E5E7EB]">
                <ion-icon name="camera-outline" class="text-[#C4C9D4] text-xl"></ion-icon>
                <span class="text-[9px] text-[#C4C9D4] font-semibold">Photo</span>
              </div>
              <div class="flex gap-2">
                <button class="px-3 py-2 rounded-xl bg-[#8CF000]/12 text-[12px] font-bold text-[#111827] border-none">Upload Photo</button>
                <button class="px-3 py-2 rounded-xl bg-[#F3F4F6] text-[12px] font-bold text-[#6B7280] border-none">Take Photo</button>
              </div>
            </div>

            <div class="section-card-box bg-white p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Basic Details</p>
              <div class="space-y-3">
                <div>
                  <label class="field-label">Full Name <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="sName" placeholder="Enter student name" class="text-input" />
                </div>
                <div>
                  <label class="field-label">Date of Birth <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="sDob" type="date" class="text-input" />
                </div>
                <div>
                  <label class="field-label">Gender</label>
                  <div class="chips-grid">
                    <button *ngFor="let g of genderOptions" class="chip-btn border-none" [class.chip-active]="sGender === g" (click)="sGender = g">{{ g }}</button>
                  </div>
                </div>
                <div>
                  <label class="field-label">Sport(s) <span class="text-red-500">*</span></label>
                  <div class="chips-grid">
                    <button *ngFor="let s of sportsOptions" class="chip-btn border-none" [class.chip-active]="sSports.includes(s)" (click)="toggleSportSelection(s)">{{ s }}</button>
                  </div>
                </div>
                <div>
                  <label class="field-label">Skill Level</label>
                  <div class="chips-grid">
                    <button *ngFor="let sk of skillOptions" class="chip-btn border-none" [class.chip-active]="sSkill === sk" (click)="sSkill = sk">{{ sk }}</button>
                  </div>
                </div>
                <div>
                  <label class="field-label">Preferred Playing Position</label>
                  <input [(ngModel)]="sPos" placeholder="Enter position" class="text-input" />
                </div>
                <div>
                  <label class="field-label">School / Academy</label>
                  <input [(ngModel)]="sSchool" placeholder="Enter school (optional)" class="text-input" />
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 2: Emergency Contact -->
          <div *ngIf="enrollType === 'managed' && managedStep === 2" class="space-y-4">
            <h2 class="text-[20px] font-black text-[#111827] m-0">Emergency Contact</h2>
            <div class="section-card-box bg-white p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Parent / Guardian</p>
              <div class="space-y-3">
                <div>
                  <label class="field-label">Full Name <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="gName" placeholder="Enter guardian name" class="text-input" />
                </div>
                <div>
                  <label class="field-label">Relationship</label>
                  <input [(ngModel)]="gRel" placeholder="Enter relationship" class="text-input" />
                </div>
                <div>
                  <label class="field-label">Mobile Number <span class="text-red-500">*</span></label>
                  <input [(ngModel)]="gPhone" type="tel" placeholder="Enter mobile number" class="text-input" />
                </div>
                <div>
                  <label class="field-label">Alternate Number</label>
                  <input [(ngModel)]="gPhone2" type="tel" placeholder="Enter alternate number (optional)" class="text-input" />
                </div>
                <div>
                  <label class="field-label">Email Address</label>
                  <input [(ngModel)]="gEmail" type="email" placeholder="Enter email (optional)" class="text-input" />
                </div>
                <div>
                  <label class="field-label">Home Address</label>
                  <input [(ngModel)]="gAddr" placeholder="Enter address (optional)" class="text-input" />
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 3: Medical Info -->
          <div *ngIf="enrollType === 'managed' && managedStep === 3" class="space-y-4">
            <h2 class="text-[20px] font-black text-[#111827] m-0">Medical Information</h2>
            <div class="section-card-box bg-white p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Health Details</p>
              <div class="space-y-4">
                <div>
                  <label class="field-label">Blood Group</label>
                  <div class="chips-grid">
                    <button *ngFor="let b of bloodOptions" class="chip-btn border-none" [class.chip-active]="blood === b" (click)="blood = b">{{ b }}</button>
                  </div>
                </div>
                <div>
                  <label class="field-label">Allergies</label>
                  <div class="chips-grid">
                    <button *ngFor="let a of allergyOptions" class="chip-btn border-none" [class.chip-active]="allergies.includes(a)" (click)="toggleAllergy(a)">{{ a }}</button>
                  </div>
                  <div class="flex gap-2 mt-2">
                    <input [(ngModel)]="newAlg" placeholder="Add custom…" class="flex-1 px-3 py-2 bg-[#F9FAFB] rounded-xl text-[13px] focus:outline-none border border-[#F3F4F6] min-h-0" />
                    <button (click)="addCustomAllergy()" class="w-9 h-9 rounded-xl bg-[#8CF000] flex items-center justify-center border-none">
                      <ion-icon name="add-outline" class="text-[#111827] text-lg font-bold"></ion-icon>
                    </button>
                  </div>
                </div>
                <div *ngFor="let mField of [{ label:'Medical Conditions', key:'medCond', ph:'Enter medical conditions' }, { label:'Current Injuries', key:'injuries', ph:'Any active injuries?' }, { label:'Medications', key:'meds', ph:'Any medications being taken' }, { label:'Emergency Notes', key:'emerNotes', ph:'Important info for emergency responders' }]">
                  <label class="field-label">{{ mField.label }}</label>
                  <textarea [(ngModel)]="this[mField.key]" [placeholder]="mField.ph" rows="2"
                    class="w-full px-4 py-3 bg-[#F9FAFB] rounded-xl text-[14px] text-[#111827] placeholder:text-[#C4C9D4] focus:outline-none border border-[#F3F4F6] resize-none"></textarea>
                </div>
              </div>
            </div>
          </div>

          <!-- STEP 4: Access & Notes -->
          <div *ngIf="enrollType === 'managed' && managedStep === 4" class="space-y-4">
            <h2 class="text-[20px] font-black text-[#111827] m-0">Notes &amp; Access</h2>
            <div class="section-card-box bg-white p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Coach Notes</p>
              <textarea [(ngModel)]="coachNotes" rows="4" placeholder="Initial observations, goals or anything important to remember about this student…"
                class="w-full px-4 py-3 bg-[#F9FAFB] rounded-xl text-[14px] text-[#111827] placeholder:text-[#C4C9D4] focus:outline-none border border-[#F3F4F6] resize-none"></textarea>
            </div>

            <div class="section-card-box bg-white p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-2">Parent Access</p>
              <p class="text-[13px] text-[#9CA3AF] mb-4">Does the student or parent have access to a smartphone?</p>
              <div class="grid grid-cols-2 gap-3 mb-4">
                <button (click)="hasPhone = true" class="flex flex-col items-center py-4 rounded-[20px] border-none shadow-sm"
                  [style.backgroundColor]="hasPhone === true ? 'rgba(140,240,0,0.10)' : '#F9FAFB'"
                  [style.border]="hasPhone === true ? '2px solid #8CF000' : '2px solid transparent'">
                  <span class="text-2xl mb-1.5">📱</span>
                  <p class="text-[13px] font-black text-[#111827] m-0">Yes</p>
                </button>
                <button (click)="hasPhone = false; parentPhone = ''" class="flex flex-col items-center py-4 rounded-[20px] border-none shadow-sm"
                  [style.backgroundColor]="hasPhone === false ? 'rgba(140,240,0,0.10)' : '#F9FAFB'"
                  [style.border]="hasPhone === false ? '2px solid #8CF000' : '2px solid transparent'">
                  <span class="text-2xl mb-1.5">🚫</span>
                  <p class="text-[13px] font-black text-[#111827] m-0">No</p>
                </button>
              </div>
              <div *ngIf="hasPhone === true">
                <label class="field-label">Parent / Student Mobile Number</label>
                <input [(ngModel)]="parentPhone" type="tel" placeholder="Enter mobile number" class="text-input" />
                <div class="mt-3 bg-[#8CF000]/10 rounded-xl p-3 border border-[#8CF000]/20">
                  <p class="text-[11px] text-[#6B7280] m-0">TYNG will send: Download Link · Invitation · Student Profile Access</p>
                </div>
              </div>
              <div *ngIf="hasPhone === false" class="bg-[#FFF7ED] rounded-xl p-3">
                <p class="text-[11px] text-[#C2410C] leading-relaxed m-0">
                  Coach will manage attendance, progress and scheduling. Parents can be invited at any time from the student profile.
                </p>
              </div>
            </div>
          </div>

          <!-- STEP 5: Training Details -->
          <div *ngIf="enrollType === 'managed' && managedStep === 5" class="space-y-4">
            <h2 class="text-[20px] font-black text-[#111827] m-0">Training Details</h2>
            <div class="section-card-box bg-white p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-1">Training Batch</p>
              <p class="text-[12px] text-[#9CA3AF] mb-3">Select an existing batch or leave blank</p>
              <div class="space-y-2.5">
                <button *ngFor="let b of batchOptions" (click)="selBatch = (selBatch === b.id ? '' : b.id)" class="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-[#F9FAFB] border-none shadow-sm"
                  [style.border]="selBatch === b.id ? '1.5px solid #8CF000' : '1.5px solid transparent'">
                  <ion-icon name="people-outline" class="text-[#6B7280]"></ion-icon>
                  <div class="flex-1 text-left">
                    <p class="text-[13px] font-bold text-[#111827] m-0">{{ b.label }}</p>
                    <p class="text-[11px] text-[#9CA3AF] m-0">{{ b.members }} students</p>
                  </div>
                  <div *ngIf="selBatch === b.id" class="w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center">
                    <ion-icon name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                </button>
              </div>
            </div>

            <div class="section-card-box bg-white p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-2">Session Days</p>
              <div class="chips-grid">
                <button *ngFor="let d of daysOptions" class="chip-btn border-none" [class.chip-active]="sessDays.includes(d)" (click)="toggleDay(d)">{{ d }}</button>
              </div>
            </div>

            <div class="section-card-box bg-white p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Training Frequency</p>
              <div class="grid grid-cols-2 gap-2">
                <button *ngFor="let f of freqOptions" (click)="frequency = f" class="py-3 rounded-2xl text-[12px] font-bold transition-all border-none bg-[#F9FAFB]"
                  [style.backgroundColor]="frequency === f ? 'rgba(140,240,0,0.12)' : '#F9FAFB'"
                  [style.color]="frequency === f ? '#111827' : '#6B7280'"
                  [style.border]="frequency === f ? '1.5px solid #8CF000' : '1.5px solid transparent'">
                  {{ f }}
                </button>
              </div>
            </div>

            <div class="section-card-box bg-white p-5 shadow-sm border border-slate-100">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-3">Membership Type</p>
              <div class="space-y-2">
                <button *ngFor="let m of membershipOptions" (click)="membership = m" class="w-full flex items-center justify-between px-4 py-3.5 rounded-2xl bg-[#F9FAFB] border-none shadow-sm"
                  [style.border]="membership === m ? '1.5px solid #8CF000' : '1.5px solid transparent'">
                  <p class="text-[14px] font-bold text-[#111827] m-0">{{ m }}</p>
                  <div *ngIf="membership === m" class="w-6 h-6 rounded-full bg-[#8CF000] flex items-center justify-center">
                    <ion-icon name="checkmark-outline" style="font-size:12px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                </button>
              </div>
            </div>
          </div>

          <!-- STEP 6: Review & Publish -->
          <div *ngIf="enrollType === 'managed' && managedStep === 6" class="space-y-4">
            <h2 class="text-[20px] font-black text-[#111827] m-0">Ready to Enroll</h2>

            <div class="bg-white rounded-[24px] overflow-hidden border border-[#8CF000]/22 shadow-md">
              <div class="px-5 pt-5 pb-4 flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-[#8CF000]/15 flex items-center justify-center flex-shrink-0">
                  <ion-icon name="flash-outline" class="text-[#8CF000] text-xl"></ion-icon>
                </div>
                <div class="flex-1">
                  <p class="text-[14px] font-black text-[#111827] m-0">TYNG Smart Features</p>
                  <p class="text-[11px] text-[#9CA3AF] m-0">Automatically managed for this student</p>
                </div>
                <button (click)="automate = !automate" class="toggle-btn" [class.toggle-on]="automate">
                  <div class="toggle-thumb" [class.toggle-thumb-on]="automate"></div>
                </button>
              </div>
              <div class="border-t border-[#F3F4F6] px-5 pb-5 pt-4 space-y-2.5">
                <div *ngFor="let task of ['Add the student to My Students','Generate a unique TYNG Student ID','Create a personal attendance QR Code','Link to upcoming coaching sessions','Create a progress tracking profile','Store evaluations and coach notes','Track attendance automatically']"
                  class="flex items-center gap-2.5">
                  <div class="w-5 h-5 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
                    <ion-icon name="checkmark-outline" style="font-size:11px;color:#111827;font-weight:bold;"></ion-icon>
                  </div>
                  <span class="text-[13px] text-[#111827] font-semibold">{{ task }}</span>
                </div>
                <div class="mt-3 bg-[#F9FAFB] rounded-xl px-3 py-3 border border-slate-100">
                  <p class="text-[11px] text-[#9CA3AF] leading-relaxed m-0">
                    If the student joins TYNG later, all history, attendance, evaluations and progress are automatically synced to their account.
                  </p>
                </div>
              </div>
            </div>

            <!-- Profile Summary preview -->
            <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4">Profile Preview</p>
              <div class="flex items-center gap-4 mb-4">
                <div class="w-16 h-16 rounded-2xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  <ion-icon name="person-outline" class="text-[#C4C9D4] text-3xl"></ion-icon>
                </div>
                <div>
                  <p class="text-[18px] font-black text-[#111827] m-0">{{ sName || 'Student Name' }}</p>
                  <p class="text-[12px] text-[#9CA3AF] m-0">{{ sSports.join(' · ') || 'Sport' }} · {{ sSkill || 'Skill Level' }}</p>
                </div>
              </div>
              <div class="space-y-2">
                <div *ngFor="let summary of [{ label:'Batch', val:getBatchLabel() }, { label:'Guardian', val:gName || '—' }, { label:'Contact', val:gPhone || '—' }, { label:'Membership', val:membership || '—' }]"
                  class="flex items-center justify-between bg-[#F9FAFB] rounded-xl px-3.5 py-2.5">
                  <span class="text-[11px] text-[#9CA3AF] font-bold">{{ summary.label }}</span>
                  <span class="text-[12px] font-semibold text-[#111827]">{{ summary.val }}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Sticky bottom CTA -->
        <div class="fixed-bottom-bar bg-white px-5 pt-3 pb-8">
          <button *ngIf="enrollType" (click)="handleNext()" [disabled]="!canProceed()" class="w-full h-14 rounded-2xl text-[16px] font-black flex items-center justify-center gap-2 border-none"
            [style.background]="canProceed() ? 'linear-gradient(135deg,#FF7A00,#FF9A40)' : '#F3F4F6'"
            [style.color]="canProceed() ? 'white' : '#C4C9D4'">
            {{ getCtaLabel() }}
            <ion-icon name="chevron-forward-outline"></ion-icon>
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .enroll-page {
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
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .type-card {
      background: #FFFFFF;
      border-radius: 24px;
      padding: 20px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
      margin-bottom: 12px;
      cursor: pointer;
    }

    .student-row, .batch-select-btn {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-radius: 16px;
      cursor: pointer;
      border: 1.5px solid transparent;
      transition: all 0.2s;
    }

    .section-card-box {
      border-radius: 24px;
      border: 1px solid #F3F4F6;
    }

    .field-label {
      font-size: 11px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #9CA3AF;
      margin-bottom: 6px;
      display: block;
    }

    .text-input {
      width: 100%;
      padding: 12px 16px;
      background: #F9FAFB;
      border-radius: 12px;
      border: 1px solid #F3F4F6;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      outline: none;
      box-sizing: border-box;

      &:focus {
        border-color: rgba(140,240,0,0.3);
      }
    }

    /* Chips */
    .chips-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .chip-btn {
      padding: 6px 14px;
      border-radius: 999px;
      background: #F3F4F6;
      color: #6B7280;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1.5px solid transparent;
    }

    .chip-active {
      background: rgba(140,240,0,0.14);
      color: #111827;
      border-color: #8CF000;
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
export class CoachEnrollStudentPage {
  [key: string]: any;
  private readonly router = inject(Router);

  enrollType: 'existing' | 'invite' | 'managed' | null = null;
  managedStep = 1;
  isSuccess = signal(false);

  // Existing user
  searchQ = '';
  selExisting: StudentRecord | null = null;

  // Invite
  invName = '';
  invPhone = '';
  invEmail = '';
  invSent = false;

  // Managed details
  sName = '';
  sDob = '';
  sGender = '';
  sSports: string[] = [];
  sSkill = '';
  sPos = '';
  sSchool = '';

  gName = '';
  gRel = '';
  gPhone = '';
  gPhone2 = '';
  gEmail = '';
  gAddr = '';

  blood = '';
  allergies: string[] = [];
  newAlg = '';
  medCond = '';
  injuries = '';
  meds = '';
  emerNotes = '';

  coachNotes = '';
  hasPhone: boolean | null = null;
  parentPhone = '';

  selBatch = '';
  sessDays: string[] = [];
  frequency = '';
  membership = '';
  automate = true;

  readonly genderOptions = GENDERS;
  readonly sportsOptions = ALL_SPORTS;
  readonly skillOptions = SKILL_LEVELS;
  readonly bloodOptions = BLOOD_GROUPS;
  readonly allergyOptions = ALLERGY_OPTS;
  readonly batchOptions = BATCHES;
  readonly daysOptions = SESSION_DAYS;
  readonly freqOptions = FREQUENCIES;
  readonly membershipOptions = MEMBERSHIPS;

  handleBack() {
    if (this.enrollType === 'managed' && this.managedStep > 1) {
      this.managedStep--;
    } else {
      this.enrollType = null;
      this.managedStep = 1;
    }
  }

  canProceed(): boolean {
    if (this.enrollType === 'existing') return this.selExisting !== null;
    if (this.enrollType === 'invite') return this.invName.trim() !== '' && this.invPhone.trim().length >= 10;
    if (this.enrollType === 'managed') {
      if (this.managedStep === 1) return this.sName.trim() !== '' && this.sSports.length > 0;
      if (this.managedStep === 2) return this.gName.trim() !== '' && this.gPhone.trim().length >= 10;
      return true;
    }
    return false;
  }

  handleNext() {
    if (this.enrollType === 'invite') {
      this.invSent = true;
      setTimeout(() => this.isSuccess.set(true), 1500);
      return;
    }
    if (this.enrollType === 'existing') {
      this.isSuccess.set(true);
      return;
    }
    if (this.enrollType === 'managed') {
      if (this.managedStep < 6) {
        this.managedStep++;
      } else {
        this.isSuccess.set(true);
      }
    }
  }

  toggleStudent(id: number) {
    this.selExisting = MOCK_STUDENTS.find(s => s.id === id) || null;
  }

  filterStudents() {
    if (!this.searchQ) return MOCK_STUDENTS;
    return MOCK_STUDENTS.filter(s => s.name.toLowerCase().includes(this.searchQ.toLowerCase()));
  }

  toggleSportSelection(val: string) {
    this.sSports = this.sSports.includes(val) ? this.sSports.filter(x => x !== val) : [...this.sSports, val];
  }

  toggleAllergy(val: string) {
    this.allergies = this.allergies.includes(val) ? this.allergies.filter(x => x !== val) : [...this.allergies, val];
  }

  addCustomAllergy() {
    if (this.newAlg.trim()) {
      this.allergies = [...this.allergies, this.newAlg.trim()];
      this.newAlg = '';
    }
  }

  toggleDay(val: string) {
    this.sessDays = this.sessDays.includes(val) ? this.sessDays.filter(x => x !== val) : [...this.sessDays, val];
  }

  resetEnrollment() {
    this.enrollType = null;
    this.managedStep = 1;
    this.isSuccess.set(false);
    this.selExisting = null;
    this.invSent = false;
    this.sName = '';
    this.sDob = '';
    this.sSports = [];
    this.gName = '';
    this.gPhone = '';
  }

  getStudentName() {
    if (this.enrollType === 'existing') return this.selExisting?.name ?? 'Student';
    if (this.enrollType === 'invite') return this.invName || 'Student';
    return this.sName || 'Student';
  }

  getSuccessItems() {
    const list = [
      'Student Profile Created',
      'TYNG Student ID Generated',
      'Attendance QR Code Created',
      'Added to My Students',
      'Linked to Upcoming Sessions',
    ];
    if (this.hasPhone || this.invPhone) {
      list.push('TYNG Invitation Sent');
    }
    return list;
  }

  getBatchLabel() {
    return BATCHES.find(b => b.id === this.selBatch)?.label ?? 'No batch';
  }

  getCtaLabel() {
    if (this.enrollType === 'managed' && this.managedStep === 6) return 'Enroll Student';
    if (this.enrollType === 'invite' && !this.invSent) return 'Send Invitation';
    if (this.enrollType === 'existing') return 'Connect Student';
    return 'Continue';
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }
}
