import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BackNavigationService } from '../../core/services/back-navigation.service';
import { FormsModule } from '@angular/forms';
import { IonicModule, IonContent } from '@ionic/angular';
import { CoachService } from '../../core/services/coach.service';
import { ChatService } from '../../core/services/chat.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageSkeletonComponent } from '../../shared/components/skeleton';

interface Student {
  id: number;
  name: string;
  photo: string;
  attendanceStatus?: 'present' | 'absent' | null;
  participantStatus: string;
}

interface CoachSession {
  id: string;
  name: string;
  sport: string;
  emoji: string;
  image: string;
  studentName?: string;
  teamName?: string;
  venue: string;
  address: string;
  date: string;
  time: string;
  duration: string;
  type: 'Training' | 'One-on-One' | 'Academy' | 'Group Session';
  status: 'Confirmed' | 'Completed' | 'Pending' | 'Cancelled' | 'Needs completion';
  startsIn?: string | null;
  earnings: number;
  studentsConfirmed: number;
  studentsTotal: number;
  students: Student[];
  source: 'scheduling' | 'legacy';
  description: string;
  coachNotes: string;
  coachFee: number;
  venueFee: number;
  platformFee: number;
  taxAmount: number;
  paymentStatus: string;
  attendanceSupported: boolean;
  tab: 'today' | 'upcoming' | 'completed' | 'cancelled';
}

@Component({
  selector: 'app-coach-session-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent, PageSkeletonComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-brand-header-shell title="Session Details" (back)="back()">
      <app-page-skeleton *ngIf="loading" variant="detail" label="Loading session details"></app-page-skeleton>
      <div *ngIf="errorMessage && !loading" class="p-8 text-center">
        <p class="text-slate-700">{{ errorMessage }}</p>
        <button (click)="back()" class="mt-3 px-5 py-3 rounded-xl bg-white border border-slate-200">Back to schedule</button>
      </div>
      <div *ngIf="session && !loading" class="session-detail-page pb-32">
        <!-- Hero section -->
        <div class="relative h-[32vh] min-h-[220px] overflow-hidden bg-gray-900">
          <img [src]="session.image" [alt]="session.sport + ' session'" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-gradient-to-b from-black/25 via-transparent to-[#FAFBFC]"></div>

          <div class="absolute top-0 left-0 right-0 flex items-center justify-end px-5 pt-4">
            <div class="flex gap-2">
              <button type="button" (click)="shareSession()" aria-label="Share session details" class="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 border-none">
                <ion-icon name="share-social-outline" class="text-white text-base"></ion-icon>
              </button>
            </div>
          </div>

          <div class="absolute bottom-12 left-5 flex gap-2">
            <span class="text-[11px] font-bold bg-black/50 backdrop-blur-sm text-white px-3 py-1.5 rounded-full">
              {{ session.emoji }} {{ session.sport }}
            </span>
            <span class="text-[11px] font-bold px-3 py-1.5 rounded-full"
              [style.backgroundColor]="session.status === 'Confirmed' ? '#F0FDF4' : session.status === 'Needs completion' ? '#FFF7ED' : '#F3F4F6'"
              [style.color]="session.status === 'Confirmed' ? '#16A34A' : session.status === 'Needs completion' ? '#C2410C' : '#6B7280'">
              {{ session.status }}
            </span>
          </div>
        </div>

        <!-- Session Content Body -->
        <div class="px-5 -mt-4 space-y-4 relative z-10">
          <!-- Session general metadata card -->
          <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <h1 class="text-[22px] font-black text-[#111827] mb-1 m-0">{{ session.name }}</h1>
            <p *ngIf="session.description" class="text-[13px] text-slate-600 mb-4 whitespace-pre-line">{{ session.description }}</p>
            <p class="text-[13px] text-[#9CA3AF] mb-4 m-0">{{ session.teamName ?? session.studentName }} · {{ session.type }}</p>

            <div class="grid grid-cols-2 gap-3">
              <div *ngFor="let s of sessionFacts()"
                class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0">
                  <ion-icon [name]="s.name" class="text-[#6B7280] text-sm"></ion-icon>
                </div>
                <div>
                  <p class="text-[10px] text-[#9CA3AF] uppercase tracking-wider m-0 font-bold">{{ s.label }}</p>
                  <p class="text-[12px] font-bold text-[#111827] m-0 truncate w-32">{{ s.val }}</p>
                </div>
              </div>
            </div>

            <div class="flex gap-2.5 mt-4 pt-4 border-t border-[#F3F4F6]">
              <button type="button" (click)="openSessionChat()" class="action-btn">
                <ion-icon name="chatbubbles-outline"></ion-icon>Chat
              </button>
              <button type="button" (click)="navigateToVenue()" class="action-btn">
                <ion-icon name="navigate-outline"></ion-icon>Navigate
              </button>
            </div>
          </div>

          <div *ngIf="session.status === 'Needs completion'" class="complete-card text-left">
            <div class="flex items-start gap-3">
              <div class="complete-icon"><ion-icon name="flag-outline"></ion-icon></div>
              <div class="flex-1 min-w-0">
                <p class="text-[14px] font-black text-[#111827] m-0">Did this session take place?</p>
                <p class="text-[12px] text-[#8A6A48] mt-1 mb-0">Mark it as completed to add ₹{{ session.coachFee | number:'1.0-0' }} to your earnings. Record attendance first if you haven't.</p>
              </div>
            </div>
            <button type="button" (click)="markCompleted()" [disabled]="completing" class="complete-btn">
              <ion-spinner *ngIf="completing" name="crescent"></ion-spinner>
              <ion-icon *ngIf="!completing" name="checkmark-done-outline"></ion-icon>
              {{ completing ? 'Saving…' : 'Mark as completed' }}
            </button>
          </div>

          <!-- Present roster checklist -->
          <div #attendanceSection class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <div class="flex items-center justify-between mb-4">
              <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest m-0">Students</p>
              <span class="text-[12px] font-bold text-[var(--app-primary)]">
                {{ getPresentCount() }}/{{ session.students.length }} Present
              </span>
            </div>

            <div class="space-y-3">
              <div *ngFor="let s of session.students" class="flex items-center gap-3 bg-[#F9FAFB] rounded-2xl px-3.5 py-3 border border-slate-100">
                <img *ngIf="s.photo" [src]="s.photo" [alt]="s.name" class="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                <div *ngIf="!s.photo" class="w-10 h-10 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold">{{ initials(s.name) }}</div>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ s.name }}</p>
                  <div class="flex items-center gap-2 text-[10px] text-[#9CA3AF]">
                    <span class="font-bold capitalize">{{ s.attendanceStatus || 'Attendance not marked' }}</span>
                    <ng-container *ngIf="s.participantStatus">
                      <span>·</span>
                      <span>{{ participantStatusLabel(s.participantStatus) }}</span>
                    </ng-container>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button type="button" (click)="go('/app/coach/student/' + s.id)" [attr.aria-label]="'Open ' + s.name + ' profile'" class="w-8 h-8 rounded-full bg-[#F3F4F6] border-none flex items-center justify-center">
                    <ion-icon name="person-outline" class="text-[#6B7280] text-sm"></ion-icon>
                  </button>
                  <button type="button" (click)="openStudentChat(s)" [disabled]="openingChatId === s.id" [attr.aria-label]="'Chat with ' + s.name" class="w-8 h-8 rounded-full bg-[#EFF6FF] border-none flex items-center justify-center">
                    <ion-icon name="chatbubble-ellipses-outline" class="text-[#2563EB] text-sm"></ion-icon>
                  </button>
                  <button type="button" (click)="toggleAttendance(s.id)" [disabled]="savingAttendance[s.id] || !session.attendanceSupported" [attr.aria-label]="'Mark ' + s.name + ' ' + (s.attendanceStatus === 'present' ? 'absent' : 'present')" class="w-8 h-8 rounded-full border-none flex items-center justify-center transition-all"
                    [style.backgroundColor]="s.attendanceStatus === 'present' ? 'var(--app-primary)' : '#F3F4F6'">
                    <ion-icon [name]="s.attendanceStatus === 'present' ? 'checkmark-outline' : s.attendanceStatus === 'absent' ? 'close-outline' : 'ellipse-outline'" [style.color]="s.attendanceStatus === 'present' ? '#111827' : '#C4C9D4'" style="font-weight:bold;"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Notes -->
          <div class="notes-card text-left">
            <div class="notes-header">
              <div class="notes-heading">
                <div class="notes-icon" aria-hidden="true"><ion-icon name="create-outline"></ion-icon></div>
                <div>
                  <p class="notes-eyebrow">Session notes</p>
                  <h2>Coach Notes</h2>
                </div>
              </div>
              <span class="notes-private"><ion-icon name="lock-closed-outline"></ion-icon> Private</span>
            </div>
            <p class="notes-helper">Capture observations, progress and the next focus for this player.</p>
            <textarea [(ngModel)]="notes" (input)="savedNotes = false" rows="5" maxlength="4000"
              aria-label="Private coach notes"
              placeholder="Write a note about this session..."
              class="notes-textarea"></textarea>
            <div class="notes-footer">
              <p class="notes-count">{{ notes.length }}/4000</p>
              <span *ngIf="savedNotes" class="notes-saved"><ion-icon name="checkmark-circle-outline"></ion-icon> Saved</span>
              <button (click)="saveNotes()" [disabled]="savingNotes || notes.length > 4000" class="notes-save-btn">
                <ion-spinner *ngIf="savingNotes" name="crescent"></ion-spinner>
                <ion-icon *ngIf="!savingNotes" name="checkmark-outline"></ion-icon>
                {{ savedNotes ? '✓ Saved' : 'Save Notes' }}
              </button>
            </div>
          </div>

          <div class="bg-white rounded-[24px] p-5 shadow-sm border border-slate-100 text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Session price details</p>
            <div class="flex justify-between py-2 border-b border-slate-50"><span>Coach fee</span><strong>₹{{ session.coachFee | number:'1.2-2' }}</strong></div>
            <div class="flex justify-between py-2 border-b border-slate-50"><span>Venue fee</span><strong>₹{{ session.venueFee | number:'1.2-2' }}</strong></div>
            <div class="flex justify-between py-2 border-b border-slate-50"><span>Platform fee</span><strong>₹{{ session.platformFee | number:'1.2-2' }}</strong></div>
            <div class="flex justify-between py-2 border-b border-slate-50"><span>Tax</span><strong>₹{{ session.taxAmount | number:'1.2-2' }}</strong></div>
            <div class="flex justify-between pt-3 font-bold"><span>Total listed price</span><strong>₹{{ session.earnings | number:'1.2-2' }}</strong></div>
            <p class="text-[11px] text-slate-500 mt-3 mb-0">Your earnings are the coach fee, counted once the session is marked as completed. Player payments are not collected through this session yet.</p>
          </div>

        </div>
      </div>

      <!-- Bottom Sticky Footer Actions -->
      <div *ngIf="session && !loading" class="fixed-bottom-bar bg-white px-5 pt-4 pb-8">
        <div class="grid grid-cols-3 gap-2.5">
          <button type="button" (click)="openSessionChat()" class="footer-action-btn">
            <ion-icon name="chatbubbles-outline"></ion-icon>Chat
          </button>
          <button type="button" (click)="navigateToVenue()" class="footer-action-btn">
            <ion-icon name="navigate-outline"></ion-icon>Navigate
          </button>
          <button (click)="openAttendance()" class="footer-action-btn font-black text-white bg-gradient-to-br from-[#FF7A00] to-[#FF9A40] shadow-md border-none"
            [class.opacity-50]="session?.attendanceSupported === false" [attr.aria-disabled]="session?.attendanceSupported === false">
            Attendance
          </button>
        </div>
        <p *ngIf="actionNotice" class="text-center text-xs text-slate-600 mt-2 mb-0">{{ actionNotice }}</p>
      </div>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .session-detail-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .section-card {
      background: #FFFFFF;
      border-radius: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.06);
    }

    .notes-card {
      padding: 20px;
      background: #FFFFFF;
      border: 1px solid #EEF0F3;
      border-radius: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.05);
    }

    .notes-header, .notes-heading, .notes-footer {
      display: flex;
      align-items: center;
    }

    .notes-header, .notes-footer {
      justify-content: space-between;
      gap: 12px;
    }

    .notes-heading { gap: 10px; }

    .notes-icon {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 36px;
      color: #111827;
      background: var(--app-primary);
      border-radius: 12px;
      font-size: 18px;
    }

    .notes-eyebrow {
      margin: 0 0 2px;
      color: #9CA3AF;
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .notes-header h2 {
      margin: 0;
      color: #111827;
      font-size: 16px;
      line-height: 1.2;
      font-weight: 800;
    }

    .notes-private {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 9px;
      color: #6B7280;
      background: #F8FAFC;
      border: 1px solid #EEF0F3;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 800;
      white-space: nowrap;
    }

    .notes-helper {
      margin: 14px 0 10px;
      color: #6B7280;
      font-size: 12px;
      line-height: 1.45;
    }

    .notes-textarea {
      width: 100%;
      min-height: 128px;
      display: block;
      box-sizing: border-box;
      padding: 14px;
      color: #111827;
      background: #FBFCFD;
      border: 1px solid #E5E7EB;
      border-radius: 16px;
      font: inherit;
      font-size: 14px;
      line-height: 1.55;
      resize: vertical;
      outline: none;
      transition: border-color 160ms ease, box-shadow 160ms ease, background 160ms ease;
    }

    .notes-textarea::placeholder { color: #AEB5C1; }
    .notes-textarea:focus {
      background: #FFFFFF;
      border-color: var(--app-primary);
      box-shadow: 0 0 0 3px rgba(var(--app-primary-rgb), 0.14);
    }

    .notes-footer { margin-top: 12px; }
    .notes-count {
      margin: 0;
      color: #AEB5C1;
      font-size: 11px;
      font-weight: 700;
    }

    .notes-saved {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      margin-left: auto;
      color: #16A34A;
      font-size: 11px;
      font-weight: 800;
    }

    .notes-save-btn {
      min-width: 112px;
      height: 38px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 0 14px;
      color: #111827;
      background: var(--app-primary);
      border: 0;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      transition: transform 160ms ease, opacity 160ms ease;
    }

    .notes-save-btn:not(:disabled):active { transform: scale(0.97); }
    .notes-save-btn:disabled { opacity: 0.55; cursor: not-allowed; }

    .action-btn {
      flex: 1;
      height: 44px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #6B7280;
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      cursor: pointer;
    }

    .footer-action-btn {
      height: 48px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      font-size: 13px;
      font-weight: 700;
      color: #6B7280;
      background: #F9FAFB;
      border: 1px solid #F3F4F6;
      cursor: pointer;
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      box-shadow: 0 2px 8px rgba(var(--app-primary-rgb),0.30);
    }

    .complete-card {
      padding: 18px;
      border: 1px solid #FFE1BF;
      border-radius: 24px;
      background: #FFF8EF;
    }

    .complete-icon {
      width: 38px;
      height: 38px;
      flex: 0 0 38px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 12px;
      background: #FFE9D1;
      color: #E06A00;
      font-size: 19px;
    }

    .complete-btn {
      width: 100%;
      height: 46px;
      margin-top: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      border: 0;
      border-radius: 14px;
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      color: #111827;
      font-size: 13px;
      font-weight: 800;
    }

    .complete-btn:disabled { opacity: 0.6; }

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
  `]
})
export class CoachSessionDetailPage implements OnInit {
  @ViewChild(IonContent) private content?: IonContent;
  @ViewChild('attendanceSection') private attendanceSection?: ElementRef<HTMLElement>;
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  readonly backNavigation = inject(BackNavigationService);
  private readonly coachService = inject(CoachService);
  private readonly chat = inject(ChatService);

  session: CoachSession | null = null;
  loading = true;
  errorMessage = '';
  actionNotice = '';
  notes = '';
  savedNotes = false;
  savingNotes = false;
  completing = false;
  openingChatId: number | null = null;
  savingAttendance: Record<number, boolean> = {};

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (!id) { this.loading = false; this.errorMessage = 'Session not found.'; return; }
      this.loading = true;
      this.errorMessage = '';
      this.coachService.getSchedulingSession(id).subscribe({
        next: response => {
          if (!response.success || !response.data) { this.errorMessage = response.message || 'Unable to load this session.'; this.loading = false; return; }
          this.session = this.mapSession(response.data);
          this.notes = this.session.coachNotes || '';
          this.loading = false;
        },
        error: error => { this.errorMessage = error?.error?.message || 'Unable to load this session. Please try again.'; this.loading = false; },
      });
    });
  }

  private mapSession(item: any): CoachSession {
    const startsAt = item.starts_at ? new Date(item.starts_at) : new Date();
    const endsAt = item.ends_at ? new Date(item.ends_at) : startsAt;
    const participants = Array.isArray(item.participants) ? item.participants : [];
    const status = this.statusLabel(item.status, startsAt);
    return {
      id: String(item.id), source: item.source === 'legacy' ? 'legacy' : 'scheduling',
      name: item.title || 'Coaching Session', sport: item.sport || 'Training', emoji: this.sportEmoji(item.sport), image: 'assets/hero-sports.png',
      studentName: participants.length === 1 ? participants[0]?.name : undefined,
      teamName: participants.length > 1 ? `${participants.length} players` : undefined,
      venue: item.venue || 'Venue pending', address: [item.venue_location, item.court].filter(Boolean).join(' · ') || 'Location pending',
      date: startsAt.toLocaleDateString(), time: `${startsAt.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' })} · ${startsAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
      duration: this.durationLabel(startsAt, endsAt), type: participants.length === 1 ? 'One-on-One' : 'Group Session', status,
      earnings: Number(item.price ?? 0), studentsConfirmed: Number(item.confirmed_participants_count ?? 0), studentsTotal: participants.length,
      coachFee: Number(item.coach_fee ?? item.price ?? 0), venueFee: Number(item.venue_fee ?? 0), platformFee: Number(item.platform_fee ?? 0),
      taxAmount: Number(item.tax_amount ?? 0), paymentStatus: 'No payment recorded', description: item.description || '', coachNotes: item.coach_notes || '',
      attendanceSupported: item.attendance_supported !== false && ['confirmed', 'completed', 'scheduled'].includes(item.status),
      students: participants.map((player: any) => ({ id: Number(player.id), name: player.name || 'Player', photo: resolveMediaUrl(player.photo) || '', attendanceStatus: player.attendance || null, participantStatus: player.status && player.status !== 'legacy' ? String(player.status) : '' })),
      tab: status === 'Completed' ? 'completed' : status === 'Cancelled' ? 'cancelled' : 'upcoming',
    };
  }

  private statusLabel(status: string, startsAt: Date): CoachSession['status'] {
    if (status === 'completed') return 'Completed';
    if (['cancelled', 'rejected', 'expired'].includes(status)) return 'Cancelled';
    if (['confirmed', 'scheduled'].includes(status)) return startsAt.getTime() <= Date.now() ? 'Needs completion' : 'Confirmed';
    return 'Pending';
  }

  participantStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending_venue_approval: 'Awaiting venue approval',
      pending: 'Awaiting confirmation',
      invited: 'Invited',
      confirmed: 'Confirmed',
      declined: 'Declined',
    };
    return labels[status] || status.replace(/_/g, ' ');
  }

  markCompleted(): void {
    if (!this.session || this.completing) return;
    this.completing = true;
    this.actionNotice = '';
    this.coachService.completeSchedulingSession(this.session.id).subscribe({
      next: (response) => {
        this.completing = false;
        if (!response.success || !this.session) {
          this.actionNotice = response.message || 'This session could not be marked as completed.';
          return;
        }
        this.session = { ...this.session, status: 'Completed', tab: 'completed' };
        this.actionNotice = `Session completed. ₹${Math.round(this.session.coachFee).toLocaleString('en-IN')} added to your earnings.`;
      },
      error: (error) => {
        this.completing = false;
        this.actionNotice = error?.error?.message || 'This session could not be marked as completed.';
      },
    });
  }

  async shareSession(): Promise<void> {
    if (!this.session) return;
    const text = `${this.session.name} · ${this.session.time} at ${this.session.venue}${this.session.address && this.session.address !== 'Location pending' ? ` (${this.session.address})` : ''}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: this.session.name, text });
        return;
      }
      await navigator.clipboard.writeText(text);
      this.actionNotice = 'Session details copied to the clipboard.';
    } catch (error: any) {
      if (error?.name !== 'AbortError') this.actionNotice = 'Session details could not be shared from this device.';
    }
  }

  async openStudentChat(student: Student): Promise<void> {
    this.openingChatId = student.id;
    const response = await this.chat.openPrivate({ id: student.id, name: student.name, avatar: student.photo || null });
    this.openingChatId = null;
    if (response.success && response.data?.id) {
      void this.router.navigateByUrl(`/app/coach/chat/${encodeURIComponent(response.data.id)}`);
    } else {
      this.actionNotice = response.message || `Could not open a chat with ${student.name}.`;
    }
  }

  openSessionChat(): void {
    const students = this.session?.students ?? [];
    if (students.length === 1) {
      void this.openStudentChat(students[0]);
      return;
    }
    void this.router.navigateByUrl('/app/coach/chat');
  }

  private durationLabel(start: Date, end: Date): string {
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    return minutes >= 60 ? `${Math.floor(minutes / 60)}h${minutes % 60 ? ` ${minutes % 60}m` : ''}` : `${minutes} min`;
  }

  private sportEmoji(sport: string): string {
    return ({ cricket: '🏏', football: '⚽', badminton: '🏸', tennis: '🎾', basketball: '🏀' } as Record<string, string>)[String(sport || '').toLowerCase()] || '🏅';
  }

  sessionFacts(): Array<{ name: string; label: string; val: string }> {
    if (!this.session) return [];
    return [
      { name: 'location-outline', label: 'Venue', val: this.session.venue },
      { name: 'time-outline', label: 'Date & time', val: this.session.time },
      { name: 'people-outline', label: 'Players', val: String(this.session.students.length) },
      { name: 'hourglass-outline', label: 'Duration', val: this.session.duration },
      { name: 'basketball-outline', label: 'Facility', val: this.session.address },
      { name: 'checkmark-circle-outline', label: 'Confirmed', val: `${this.session.studentsConfirmed}/${this.session.studentsTotal}` },
    ];
  }

  async scrollToAttendance(): Promise<void> {
    const section = this.attendanceSection?.nativeElement;
    const content = this.content;
    if (!section || !content) return;
    const scrollElement = await content.getScrollElement();
    const sectionTop = section.getBoundingClientRect().top - scrollElement.getBoundingClientRect().top + scrollElement.scrollTop;
    await content.scrollToPoint(0, Math.max(0, sectionTop - 12), 350);
  }

  async openAttendance(): Promise<void> {
    this.actionNotice = this.session?.attendanceSupported
      ? ''
      : 'Attendance can be recorded after the venue approves this session.';
    await this.scrollToAttendance();
  }

  navigateToVenue(): void {
    if (!this.session) return;
    const destination = [this.session.venue, this.session.address].filter(Boolean).join(', ');
    if (!destination || this.session.venue.toLowerCase().includes('pending') || this.session.address.toLowerCase().includes('location pending')) {
      this.actionNotice = 'Venue directions are unavailable because this session has no confirmed venue address yet.';
      return;
    }
    this.actionNotice = '';
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  back() {
    this.backNavigation.back('/app/coach/schedule');
  }

  go(path: string) {
    this.router.navigateByUrl(path);
  }

  getPresentCount() { return this.session?.students.filter(student => student.attendanceStatus === 'present').length ?? 0; }

  getAttendanceCount() {
    return this.session ? this.session.studentsConfirmed : 0;
  }

  toggleAttendance(id: number) {
    if (!this.session) return;
    const student = this.session.students.find(player => player.id === id);
    if (!student || this.savingAttendance[id]) return;
    const previous = student.attendanceStatus;
    const status = previous === 'present' ? 'absent' : 'present';
    student.attendanceStatus = status;
    this.savingAttendance[id] = true;
    this.coachService.saveSchedulingAttendance(this.session.id, id, status).subscribe({
      next: () => { this.savingAttendance[id] = false; },
      error: error => { student.attendanceStatus = previous; this.savingAttendance[id] = false; this.actionNotice = error?.error?.message || 'Attendance could not be saved.'; },
    });
  }

  saveNotes() {
    if (!this.session || this.savingNotes) return;
    this.savingNotes = true;
    this.coachService.saveSchedulingSessionNotes(this.session.id, this.notes).subscribe({
      next: () => { this.savedNotes = true; this.savingNotes = false; },
      error: error => { this.savedNotes = false; this.savingNotes = false; this.actionNotice = error?.error?.message || 'Session notes could not be saved.'; },
    });
  }

  initials(name: string): string { return (name || 'Player').trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
}
