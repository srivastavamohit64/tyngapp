import { CommonModule, TitleCasePipe } from '@angular/common';
import { AfterViewChecked, Component, ElementRef, EventEmitter, Input, OnDestroy, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule, NavController, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingRecord, FriendItem } from '../../../core/models/api.model';
import { AuthService } from '../../../core/services/auth.service';
import { BookingService } from '../../../core/services/booking.service';
import { ChatService } from '../../../core/services/chat.service';
import { SocialService } from '../../../core/services/social.service';
import { UiChromeService } from '../../../core/services/ui-chrome.service';
import {
  bookingPaymentLabel,
  bookingReference,
  bookingTitle,
  formatBookingDate,
  formatBookingTime,
  formatDurationLabel,
  formatStartsIn,
  isBookingGameDay,
  isUpcomingStatus,
  gameChatMemberIds,
  sportEmoji,
} from '../../../core/utils/booking.utils';

@Component({
  selector: 'app-player-booking-card',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, TitleCasePipe],
  template: `
    <article
      class="card"
      [class.card--clickable]="variant === 'list'"
      [style.--accent]="accent"
      (click)="onCardClick($event)"
    >
      <div class="card-inner">
        <div class="head">
          <span class="sport">{{ sportEmoji(booking.sport) }}</span>
          <div class="head-main">
            <div class="title-row">
              <h3>{{ title }}</h3>
              <span class="pill" [class.pill-captain]="booking.isHost" [class.pill-player]="!booking.isHost">
                {{ booking.isHost ? 'Captain' : (booking.isInvited ? 'Invited' : 'Player') }}
              </span>
            </div>
            <p class="venue">
              <ion-icon name="location-outline"></ion-icon>
              {{ booking.venue?.name || 'Venue TBD' }}
            </p>
          </div>
          <span class="status" [class.status-done]="isPast" [class.status-ok]="!isPast && isConfirmed">
            {{ statusLabel }}
          </span>
        </div>

        <p *ngIf="booking.bookingStatus === 'pending'" class="pending">{{ pendingNote }}</p>

        <div class="when">
          <span><ion-icon name="calendar-outline"></ion-icon>{{ formatBookingDate(booking.bookingDate) }}</span>
          <span><ion-icon name="time-outline"></ion-icon>{{ formatBookingTime(booking.startTime) }}</span>
          <span *ngIf="startsIn" class="starts">
            <span class="dot"></span>{{ startsIn }}
          </span>
        </div>

        <ng-container *ngIf="booking.isHost; else playerStats">
          <div class="stats">
            <div>
              <p class="lbl">Players</p>
              <p class="val">{{ booking.currentPlayers }}/{{ booking.totalPlayers }}</p>
              <p class="sub">{{ booking.availableSlots }} seats left</p>
            </div>
            <div>
              <p class="lbl">Payment</p>
              <p class="val">{{ paymentLabel }}</p>
            </div>
            <div>
              <p class="lbl">Duration</p>
              <p class="val">{{ formatDurationLabel(booking.durationMinutes) }}</p>
            </div>
            <div>
              <p class="lbl">Venue booked</p>
              <p class="val val-ok" *ngIf="isConfirmed"><ion-icon name="checkmark-circle"></ion-icon> Confirmed</p>
              <p class="val" *ngIf="!isConfirmed">{{ statusLabel }}</p>
            </div>
          </div>
        </ng-container>
        <ng-template #playerStats>
          <div class="player-box">
            <div class="captain-row">
              <img class="avatar" [src]="booking.host?.profileImage || 'assets/icon/favicon.png'" alt="" />
              <div>
                <p class="lbl">Captain</p>
                <p class="val">{{ booking.host?.name || '—' }}</p>
              </div>
              <div class="pay">
                <p class="lbl">Payment</p>
                <p class="val val-ok">{{ paymentLabel }}</p>
              </div>
            </div>
            <div class="player-metrics">
              <div>
                <p class="val">{{ booking.currentPlayers }}/{{ booking.totalPlayers }}</p>
                <p class="lbl">Players</p>
              </div>
              <div>
                <p class="val">{{ booking.availableSlots }}</p>
                <p class="lbl">Seats Left</p>
              </div>
              <div>
                <p class="val val-ok">{{ statusLabel }}</p>
                <p class="lbl">Status</p>
              </div>
            </div>
          </div>
        </ng-template>

        <div class="decision" *ngIf="needsDecision">
          <div class="decision-head">
            <ion-icon name="warning"></ion-icon>
            <strong>⏰ Captain Decision Required</strong>
          </div>
          <p>Game {{ startsIn ? startsIn.replace('Starts in', 'starts in') : 'is about to start' }}. You must decide to continue or cancel before it begins.</p>
          <div class="decision-btns">
            <button type="button" class="go" [disabled]="busy" (click)="continueGame($event)">
              <ion-icon name="checkmark"></ion-icon> Continue Game
            </button>
            <button type="button" class="stop" [disabled]="busy" (click)="cancelGame($event)">
              <ion-icon name="close"></ion-icon> Cancel Game
            </button>
          </div>
        </div>

        <ng-container *ngIf="booking.isHost">
          <p class="section-label">Captain actions</p>
          <div class="actions">
            <button type="button" [class.on]="sheet === 'rules'" (click)="openRules($event)">
              <ion-icon name="create-outline"></ion-icon> Edit Rules
            </button>
            <button type="button" [class.on]="sheet === 'announce'" (click)="openAnnounce($event)">
              <ion-icon name="megaphone-outline"></ion-icon> Announce
            </button>
            <button type="button" (click)="invite($event)">
              <ion-icon name="person-add-outline"></ion-icon> Invite
            </button>
            <button type="button" (click)="openChat($event)">
              <ion-icon name="chatbubble-ellipses-outline"></ion-icon> Chat
            </button>
          </div>
        </ng-container>

        <div class="rating" *ngIf="isPast">
          <span>Your Rating:</span>
          <button
            type="button"
            *ngFor="let star of [1, 2, 3, 4, 5]"
            class="star"
            [class.filled]="star <= (booking.viewerRating || 0)"
            (click)="rate($event, star)"
          >★</button>
        </div>

        <div class="invite-row" *ngIf="booking.canAcceptInvite || booking.canRejectInvite || booking.canJoin || booking.canLeave">
          <button *ngIf="booking.canJoin" type="button" class="lime" [disabled]="busy" (click)="join($event)">Join</button>
          <button *ngIf="booking.canAcceptInvite" type="button" class="lime" [disabled]="busy" (click)="accept($event)">Accept Invite</button>
          <button *ngIf="booking.canRejectInvite" type="button" class="ghost" [disabled]="busy" (click)="reject($event)">Reject</button>
          <button *ngIf="booking.canLeave" type="button" class="ghost" [disabled]="busy" (click)="leave($event)">Leave</button>
        </div>

        <div class="attend" *ngIf="!isPast && (canScanAttendance || isCheckedIn || attendanceHint)">
          <p class="attend-note" *ngIf="attendanceHint">{{ attendanceHint }}</p>
          <button *ngIf="canScanAttendance" type="button" class="scan" (click)="openScan($event)">
            <ion-icon name="scan-outline"></ion-icon> Scan to check in
          </button>
          <p *ngIf="isCheckedIn" class="checked">You’re checked in{{ myAttendanceStatus === 'late' ? ' (late)' : '' }}.</p>
        </div>

        <div class="foot" *ngIf="!isPast">
          <ng-container *ngIf="booking.isHost; else playerFoot">
            <button type="button" class="qr-btn" (click)="openQr($event)">
              <ion-icon name="qr-code-outline"></ion-icon> Your QR
            </button>
            <button type="button" class="dir" (click)="openDirections($event)">
              <ion-icon name="navigate"></ion-icon> Directions
            </button>
          </ng-container>
          <ng-template #playerFoot>
            <button type="button" class="round" (click)="openQr($event)">
              <ion-icon name="qr-code-outline"></ion-icon><span>Your QR</span>
            </button>
            <button type="button" class="round" (click)="openChat($event)">
              <ion-icon name="chatbubble-ellipses-outline"></ion-icon><span>Chat</span>
            </button>
            <button type="button" class="round" (click)="openRules($event)">
              <ion-icon name="shield-checkmark-outline"></ion-icon><span>Rules</span>
            </button>
            <button type="button" class="dir dir-sm" (click)="openDirections($event)">
              <ion-icon name="navigate"></ion-icon> Directions
            </button>
          </ng-template>
        </div>

        <div class="foot" *ngIf="isPast">
          <button *ngIf="variant === 'list'" type="button" class="ghost wide" (click)="viewDetails.emit(booking); $event.stopPropagation()">View Details</button>
          <button type="button" class="dir" (click)="bookAgain.emit(booking); $event.stopPropagation()">
            <ion-icon name="refresh-outline"></ion-icon> Book Again
          </button>
        </div>
      </div>
    </article>

    <div class="tyng-drawer-root" #drawerRoot *ngIf="sheet" (click)="closeSheet()">
      <div class="tyng-drawer" (click)="$event.stopPropagation()">
        <div class="handle"></div>
        <button type="button" class="close" (click)="closeSheet()"><ion-icon name="close"></ion-icon></button>

        <ng-container *ngIf="sheet === 'qr'">
          <h2>Your QR Code</h2>
          <p class="muted">{{ reference }}</p>
          <div class="qr-wrap">
            <img [src]="qrSrc" alt="Booking QR" />
            <span class="qr-dot"></span>
          </div>
          <div class="kv"><span>Booking ID</span><strong>{{ reference }}</strong></div>
          <div class="kv"><span>Type</span><strong>{{ sportEmoji(booking.sport) }} {{ booking.sport | titlecase }} · {{ booking.isHost ? 'Captain' : 'Player' }}</strong></div>
          <div class="kv"><span>Venue</span><strong>{{ booking.venue?.name || '—' }}</strong></div>
          <div class="kv"><span>Date & Time</span><strong>{{ formatBookingDate(booking.bookingDate) }} · {{ formatBookingTime(booking.startTime) }}</strong></div>
          <p class="hint">This is your booking ID. Keep it for the venue if they ask to verify who you are.</p>
          <div class="note">
            To mark attendance, tap <strong>Scan to check in</strong> and scan the <strong>venue QR</strong> at the court — not this code.
          </div>
        </ng-container>

        <ng-container *ngIf="sheet === 'announce'">
          <h2>Send Announcement</h2>
          <p class="muted">All {{ booking.currentPlayers }} participants will be notified</p>
          <textarea
            maxlength="200"
            [(ngModel)]="announceText"
            placeholder="Type your announcement here... e.g. 'Venue has changed to Court 2. Please arrive 15 mins early.'"
          ></textarea>
          <p class="counter">{{ announceText.length }}/200</p>
          <button type="button" class="send" [disabled]="busy || !announceText.trim()" (click)="sendAnnounce()">
            <ion-icon name="megaphone-outline"></ion-icon> Send Announcement
          </button>
        </ng-container>

        <ng-container *ngIf="sheet === 'rules'">
          <h2>{{ booking.isHost ? 'Edit Rules' : 'Game Rules' }}</h2>
          <p class="muted">{{ booking.isHost ? 'Players will see these before the match.' : 'Please follow these rules at the venue.' }}</p>
          <textarea *ngIf="booking.isHost" rows="4" [(ngModel)]="rulesText"></textarea>
          <ul *ngIf="!booking.isHost" class="rules">
            <li *ngFor="let rule of rulesList">{{ rule }}</li>
          </ul>
          <button *ngIf="booking.isHost" type="button" class="send lime-send" [disabled]="busy" (click)="saveRules()">Save Rules</button>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .card {
      background: #fff;
      border-radius: 22px;
      box-shadow: 0 8px 28px rgba(15, 23, 42, 0.08);
      border-left: 5px solid var(--accent, #22c55e);
      overflow: hidden;
    }
    .card--clickable { cursor: pointer; }
    .card-inner { padding: 16px 16px 14px; }
    .head { display: flex; gap: 10px; align-items: flex-start; }
    .sport { font-size: 26px; line-height: 1; }
    .head-main { flex: 1; min-width: 0; }
    .title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    h3 { margin: 0; font-size: 16px; font-weight: 900; color: #111827; }
    .pill {
      font-size: 10px; font-weight: 800; padding: 3px 8px; border-radius: 999px;
    }
    .pill-captain { background: #dcfce7; color: #15803d; }
    .pill-player { background: #dbeafe; color: #1d4ed8; }
    .status {
      font-size: 10px; font-weight: 800; padding: 5px 10px; border-radius: 999px;
      background: #dcfce7; color: #16a34a; flex-shrink: 0;
    }
    .status-ok { background: #dcfce7; color: #16a34a; }
    .status-done { background: #e5e7eb; color: #4b5563; }
    .venue, .when span {
      display: inline-flex; align-items: center; gap: 4px; color: #6b7280; font-size: 12px; font-weight: 600;
    }
    .venue { margin: 6px 0 0; }
    .pending {
      margin: 10px 0 0; padding: 8px 10px; border-radius: 12px;
      background: #fff7ed; border: 1px solid #ffedd5; color: #c2410c;
      font-size: 11px; font-weight: 700;
    }
    .when { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px; align-items: center; }
    .starts {
      display: inline-flex; align-items: center; gap: 6px;
      background: #fff7ed; color: #ea580c; font-size: 10px; font-weight: 800;
      padding: 4px 8px; border-radius: 999px;
    }
    .dot { width: 6px; height: 6px; border-radius: 99px; background: #ea580c; }
    .stats, .player-box {
      margin-top: 12px; background: #f8fafc; border-radius: 16px; padding: 12px;
    }
    .stats { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .lbl { margin: 0; font-size: 10px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; color: #9ca3af; }
    .val { margin: 4px 0 0; font-size: 14px; font-weight: 800; color: #111827; }
    .sub { margin: 2px 0 0; font-size: 11px; font-weight: 700; color: #6b7280; }
    .val-ok { color: #16a34a; display: inline-flex; align-items: center; gap: 4px; }
    .captain-row { display: flex; align-items: center; gap: 10px; padding-bottom: 12px; border-bottom: 1px solid #e5e7eb; }
    .avatar { width: 40px; height: 40px; border-radius: 99px; object-fit: cover; background: #e5e7eb; }
    .pay { margin-left: auto; text-align: right; }
    .player-metrics { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; padding-top: 12px; text-align: center; }
    .decision {
      margin-top: 12px; background: #fff7ed; border: 1px solid #fdba74; border-radius: 16px; padding: 12px;
    }
    .decision-head { display: flex; align-items: center; gap: 8px; color: #9a3412; }
    .decision-head ion-icon { color: #ea580c; font-size: 18px; }
    .decision p { margin: 8px 0 12px; font-size: 13px; color: #7c2d12; font-weight: 600; line-height: 1.4; }
    .decision-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .attend { margin-top: 12px; }
    .attend-note { margin: 0 0 8px; font-size: 12px; font-weight: 700; color: #6b7280; }
    .scan {
      width: 100%; min-height: 48px; border: 0; border-radius: 16px; font-weight: 900; font-size: 14px;
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      background: #111827; color: #8cf000;
    }
    .checked { margin: 0; font-size: 13px; font-weight: 800; color: #16a34a; }
    .go, .stop, .dir, .ghost, .lime, .send, .qr-btn {
      min-height: 44px; border: 0; border-radius: 14px; font-weight: 800; font-size: 13px;
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
    }
    .go { background: #22c55e; color: #fff; }
    .stop { background: #ef4444; color: #fff; }
    .section-label {
      margin: 14px 0 8px; font-size: 10px; font-weight: 800; letter-spacing: .12em;
      text-transform: uppercase; color: #9ca3af;
    }
    .actions { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
    .actions button {
      background: #f8fafc; border: 1px solid #eef2f7; border-radius: 14px; padding: 10px 4px;
      font-size: 10px; font-weight: 800; color: #374151; display: flex; flex-direction: column;
      align-items: center; gap: 6px; min-height: 68px;
    }
    .actions ion-icon { font-size: 18px; }
    .actions button.on { background: #ecfccb; border-color: #bef264; color: #3f6212; }
    .rating { display: flex; align-items: center; gap: 6px; margin-top: 12px; font-size: 13px; font-weight: 700; color: #374151; }
    .star { background: none; border: 0; font-size: 18px; color: #d1d5db; padding: 0; }
    .star.filled { color: #facc15; }
    .invite-row { display: flex; gap: 8px; margin-top: 12px; }
    .foot { display: flex; gap: 8px; margin-top: 14px; align-items: stretch; }
    .qr-btn, .ghost { background: #f3f4f6; color: #111827; padding: 0 12px; }
    .ghost.wide, .lime { flex: 1; }
    .dir { flex: 1; background: var(--app-primary, #8cf000); color: #111827; box-shadow: 0 6px 16px rgba(140, 240, 0, .28); }
    .dir-sm { flex: 1.4; border-radius: 999px; }
    .round {
      width: 64px; background: #f3f4f6; border: 0; border-radius: 18px; color: #374151;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
      font-size: 9px; font-weight: 800; min-height: 58px;
    }
    .lime { background: var(--app-primary, #8cf000); color: #111827; border-radius: 14px; border: 0; font-weight: 800; }
    .tyng-drawer-root {
      position: fixed;
      inset: 0;
      z-index: 40000;
      background: rgba(15, 23, 42, 0.45);
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    .tyng-drawer {
      width: 100%;
      max-width: 450px;
      height: auto;
      max-height: 80vh;
      overflow: auto;
      background: #fff;
      border-radius: 28px 28px 0 0;
      padding: 4px 20px calc(16px + var(--safe-area-bottom));
      position: relative;
      box-shadow: 0 -12px 40px rgba(15, 23, 42, 0.2);
    }
    .handle { width: 42px; height: 4px; border-radius: 99px; background: #e5e7eb; margin: 8px auto 12px; }
    .close {
      position: absolute; top: 14px; right: 14px; width: 36px; height: 36px; border-radius: 99px;
      border: 0; background: #f3f4f6; display: grid; place-items: center;
    }
    h2 { margin: 0; font-size: 22px; font-weight: 900; color: #0f172a; }
    .muted { margin: 4px 0 16px; color: #9ca3af; font-size: 13px; font-weight: 600; }
    .qr-wrap {
      position: relative; width: 168px; height: 168px; margin: 4px auto 12px;
      background: #fff; border-radius: 20px; box-shadow: 0 12px 30px rgba(15,23,42,.12);
      display: grid; place-items: center;
    }
    .qr-wrap img { width: 144px; height: 144px; }
    .qr-dot { position: absolute; width: 28px; height: 28px; border-radius: 8px; background: #8cf000; }
    .kv { display: flex; justify-content: space-between; gap: 12px; padding: 8px 0; font-size: 13px; }
    .kv span { color: #9ca3af; font-weight: 600; }
    .kv strong { color: #111827; text-align: right; }
    .hint { text-align: center; color: #6b7280; font-size: 13px; margin: 12px 0; }
    .note { background: #ecfccb; color: #3f6212; border-radius: 14px; padding: 12px; font-size: 12px; font-weight: 600; line-height: 1.45; }
    textarea {
      width: 100%; min-height: 72px; max-height: 18vh; border: 2px solid #8cf000; border-radius: 18px;
      padding: 14px; font-size: 14px; resize: none; outline: none;
    }
    .counter { text-align: right; color: #9ca3af; font-size: 12px; margin: 6px 0 14px; }
    .send {
      width: 100%; background: #f97316; color: #fff; border-radius: 16px;
      box-shadow: 0 8px 18px rgba(249, 115, 22, .28);
    }
    .lime-send { background: var(--app-primary, #8cf000); color: #111827; box-shadow: none; }
    .rules { margin: 0; padding-left: 18px; color: #374151; font-weight: 600; line-height: 1.6; }
  `],
})
export class PlayerBookingCardComponent implements AfterViewChecked, OnDestroy {
  private readonly bookings = inject(BookingService);
  private readonly chat = inject(ChatService);
  private readonly social = inject(SocialService);
  private readonly auth = inject(AuthService);
  private readonly navCtrl = inject(NavController);
  private readonly chrome = inject(UiChromeService);
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);

  @Input({ required: true }) booking!: BookingRecord;
  @Input() nowTick = Date.now();
  @Input() variant: 'list' | 'detail' = 'list';
  @Input() segment: 'upcoming' | 'past' = 'upcoming';
  @Input() pendingNote = '';
  @Output() updated = new EventEmitter<BookingRecord>();
  @Output() viewDetails = new EventEmitter<BookingRecord>();
  @Output() bookAgain = new EventEmitter<BookingRecord>();

  @ViewChild('drawerRoot') private drawerRoot?: ElementRef<HTMLElement>;

  busy = false;
  sheet: 'qr' | 'announce' | 'rules' | null = null;
  announceText = '';
  rulesText = '';
  private overlayHeld = false;

  private readonly defaultRules = [
    'Arrive 15 minutes early for warm-up.',
    'Wear appropriate sports kit and footwear.',
    'Follow venue safety rules at all times.',
    'Respect teammates, opponents, and staff.',
  ];

  sportEmoji = sportEmoji;
  formatBookingDate = formatBookingDate;
  formatBookingTime = formatBookingTime;
  formatDurationLabel = formatDurationLabel;

  get title(): string {
    return bookingTitle(this.booking);
  }

  get reference(): string {
    return bookingReference(this.booking);
  }

  get paymentLabel(): string {
    return bookingPaymentLabel(this.booking);
  }

  get accent(): string {
    return this.booking.isHost ? '#22c55e' : '#3b82f6';
  }

  get isConfirmed(): boolean {
    const status = String(this.booking.bookingStatus || '').toLowerCase();
    return status === 'confirmed' || status === 'full';
  }

  get isPast(): boolean {
    if (this.segment === 'past') return true;
    const status = String(this.booking.bookingStatus || '').toLowerCase();
    return ['cancelled', 'completed', 'expired'].includes(status);
  }

  get startsIn(): string | null {
    return formatStartsIn(this.booking.bookingDate, this.booking.startTime, this.nowTick);
  }

  get statusLabel(): string {
    const status = String(this.booking.bookingStatus || '').toLowerCase();
    if (status === 'pending') return 'Awaiting';
    if (status === 'confirmed' || status === 'full') return 'Confirmed';
    if (status === 'cancelled') return 'Cancelled';
    if (status === 'completed') return 'Completed';
    if (status === 'expired') return 'Expired';
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';
  }

  get needsDecision(): boolean {
    if (!this.booking.isHost || this.booking.captainContinuedAt) return false;
    if (!isUpcomingStatus(this.booking.bookingStatus)) return false;
    return !!this.startsIn;
  }

  get myAttendanceStatus(): string | null {
    const uid = String(this.auth.user()?.id || '');
    const row = (this.booking.session?.attendance || []).find((item) => String(item.userId) === uid);
    return row?.status || null;
  }

  get isCheckedIn(): boolean {
    const status = this.myAttendanceStatus;
    return status === 'checked_in' || status === 'late';
  }

  get canScanAttendance(): boolean {
    if (this.isPast || this.isCheckedIn) return false;
    if (!(this.booking.isHost || this.booking.isJoined)) return false;
    const bookingStatus = String(this.booking.bookingStatus || '').toLowerCase();
    if (bookingStatus !== 'confirmed' && bookingStatus !== 'full') return false;
    const session = String(this.booking.session?.status || 'idle');
    if (session === 'ended') return false;
    if (session === 'live') return true;
    return isBookingGameDay(this.booking.bookingDate, this.nowTick);
  }

  get attendanceHint(): string {
    if (this.isCheckedIn) return '';
    if (!(this.booking.isHost || this.booking.isJoined)) return '';
    const bookingStatus = String(this.booking.bookingStatus || '').toLowerCase();
    if (bookingStatus === 'pending') return 'Attendance opens after the venue confirms this booking.';
    const session = String(this.booking.session?.status || '');
    if (session === 'live' && this.canScanAttendance) return 'Venue check-in is live. Scan the QR at the court.';
    if (session === 'idle' && this.canScanAttendance) {
      return 'When you arrive, scan the venue QR. If it fails, wait until the venue starts the session.';
    }
    if (session === 'ended') return 'This session’s check-in has ended.';
    return '';
  }

  get qrSrc(): string {
    const uid = this.auth.user()?.id || '';
    const payload = JSON.stringify({
      tyng: 'checkin',
      bookingId: this.booking.id,
      userId: uid,
      reference: this.reference,
    });
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload)}`;
  }

  onCardClick(event: Event): void {
    if (this.variant !== 'list' || this.isPast) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, textarea, a')) return;
    this.viewDetails.emit(this.booking);
  }

  get rulesList(): string[] {
    return this.booking.rules?.length ? this.booking.rules : this.defaultRules;
  }

  ngAfterViewChecked(): void {
    const el = this.drawerRoot?.nativeElement;
    if (el && el.parentElement !== document.body) {
      document.body.appendChild(el);
    }
  }

  ngOnDestroy(): void {
    this.releaseOverlay();
  }

  closeSheet(): void {
    this.sheet = null;
    this.releaseOverlay();
  }

  openScan(event: Event): void {
    event.stopPropagation();
    void this.navCtrl.navigateForward(['/app/check-in'], { queryParams: { b: this.booking.id } });
  }

  openQr(event: Event): void {
    event.stopPropagation();
    this.holdOverlay();
    this.sheet = 'qr';
  }

  openAnnounce(event: Event): void {
    event.stopPropagation();
    this.announceText = '';
    this.holdOverlay();
    this.sheet = 'announce';
  }

  openRules(event: Event): void {
    event.stopPropagation();
    this.rulesText = this.rulesList.join('\n');
    this.holdOverlay();
    this.sheet = 'rules';
  }

  private holdOverlay(): void {
    if (this.overlayHeld) return;
    this.overlayHeld = true;
    this.chrome.openOverlay();
  }

  private releaseOverlay(): void {
    if (!this.overlayHeld) return;
    this.overlayHeld = false;
    this.chrome.closeOverlay();
  }

  openDirections(event: Event): void {
    event.stopPropagation();
    const lat = this.booking.venue?.coordinates?.lat;
    const lng = this.booking.venue?.coordinates?.lng;
    const query = lat != null && lng != null
      ? `${lat},${lng}`
      : (this.booking.venue?.address || this.booking.venue?.location || this.booking.venue?.name || 'venue');
    window.open(`https://maps.google.com/maps?q=${encodeURIComponent(query)}`, '_blank');
  }

  async continueGame(event: Event): Promise<void> {
    event.stopPropagation();
    await this.run(async () => {
      const res = await firstValueFrom(this.bookings.captainContinue(this.booking.id));
      if (res.success && res.data) this.updated.emit(res.data);
      return res.message || 'Game will continue as planned.';
    });
  }

  async cancelGame(event: Event): Promise<void> {
    event.stopPropagation();
    const alert = await this.alertCtrl.create({
      header: 'Cancel game?',
      message: 'This will cancel the match for all players and release the venue slot.',
      buttons: [
        { text: 'Keep Game', role: 'cancel' },
        {
          text: 'Cancel Game',
          role: 'destructive',
          handler: () => {
            void this.run(async () => {
              const res = await firstValueFrom(this.bookings.cancelBooking(this.booking.id));
              if (res.success && res.data) this.updated.emit(res.data);
              return res.message || 'Game cancelled.';
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async openChat(event: Event): Promise<void> {
    event.stopPropagation();
    try {
      const res = await this.chat.openGame(this.booking.id, {
        title: this.title,
        memberIds: this.memberIds(),
      });
      if (res.success && res.data?.id) {
        await this.navCtrl.navigateForward(`/app/chat/${encodeURIComponent(res.data.id)}`);
        return;
      }
      await this.toast(res.message || 'Unable to open chat.', 'danger');
    } catch (error: any) {
      await this.toast(error?.message || 'Unable to open chat.', 'danger');
    }
  }

  async invite(event: Event): Promise<void> {
    event.stopPropagation();
    try {
      const response = await firstValueFrom(this.social.getFriends());
      const friends = response.data || [];
      if (!friends.length) {
        await this.toast('No friends available to invite.', 'danger');
        return;
      }
      const alert = await this.alertCtrl.create({
        header: 'Invite Friends',
        inputs: friends.map((friend: FriendItem) => ({
          type: 'checkbox',
          label: friend.name,
          value: friend.id,
        })),
        buttons: [
          { text: 'Cancel', role: 'cancel' },
          {
            text: 'Invite',
            handler: (selected: string[]) => {
              if (!selected?.length) return;
              void this.run(async () => {
                const res = await firstValueFrom(this.bookings.invitePlayers(this.booking.id, selected));
                if (res.success && res.data) this.updated.emit(res.data);
                return res.message || 'Players invited.';
              });
            },
          },
        ],
      });
      await alert.present();
    } catch (error: any) {
      await this.toast(error?.error?.message || 'Failed to load friends.', 'danger');
    }
  }

  async sendAnnounce(): Promise<void> {
    const text = this.announceText.trim();
    if (!text) return;
    this.busy = true;
    try {
      const opened = await this.chat.openGame(this.booking.id, {
        title: this.title,
        memberIds: this.memberIds(),
      });
      if (!opened.success || !opened.data?.id) {
        await this.toast(opened.message || 'Unable to open game chat.', 'danger');
        return;
      }
      const sent = await this.chat.sendMessage(opened.data.id, `📢 ${text}`);
      if (!sent.success) {
        await this.toast(sent.message || 'Unable to send announcement.', 'danger');
        return;
      }
      this.closeSheet();
      this.announceText = '';
      await this.toast('Announcement sent to all players.', 'success');
    } catch (error: any) {
      await this.toast(error?.message || 'Unable to send announcement.', 'danger');
    } finally {
      this.busy = false;
    }
  }

  async saveRules(): Promise<void> {
    const rules = this.rulesText.split('\n').map((row) => row.trim()).filter(Boolean);
    await this.run(async () => {
      const res = await firstValueFrom(this.bookings.updateRules(this.booking.id, rules));
      if (res.success && res.data) {
        this.updated.emit(res.data);
        this.closeSheet();
      }
      return res.message || 'Rules updated.';
    });
  }

  async rate(event: Event, rating: number): Promise<void> {
    event.stopPropagation();
    await this.run(async () => {
      const res = await firstValueFrom(this.bookings.rateBooking(this.booking.id, rating));
      if (res.success && res.data) this.updated.emit(res.data);
      return res.message || 'Thanks for rating.';
    });
  }

  async join(event: Event): Promise<void> {
    event.stopPropagation();
    await this.run(async () => {
      const res = await firstValueFrom(this.bookings.joinBooking(this.booking.id));
      if (res.success && res.data) this.updated.emit(res.data);
      return res.message || 'Joined booking.';
    });
  }

  async accept(event: Event): Promise<void> {
    event.stopPropagation();
    await this.run(async () => {
      const res = await firstValueFrom(this.bookings.acceptInvite(this.booking.id));
      if (res.success && res.data) this.updated.emit(res.data);
      return res.message || 'Invite accepted.';
    });
  }

  async reject(event: Event): Promise<void> {
    event.stopPropagation();
    await this.run(async () => {
      const res = await firstValueFrom(this.bookings.rejectInvite(this.booking.id));
      if (res.success && res.data) this.updated.emit(res.data);
      return res.message || 'Invite rejected.';
    });
  }

  async leave(event: Event): Promise<void> {
    event.stopPropagation();
    await this.run(async () => {
      const res = await firstValueFrom(this.bookings.leaveBooking(this.booking.id));
      if (res.success && res.data) this.updated.emit(res.data);
      return res.message || 'Left booking.';
    });
  }

  private memberIds(): string[] {
    return gameChatMemberIds(this.booking);
  }

  private async run(action: () => Promise<string>): Promise<void> {
    if (this.busy) return;
    this.busy = true;
    try {
      const message = await action();
      await this.toast(message, 'success');
    } catch (error: any) {
      await this.toast(error?.error?.message || 'Action failed. Please try again.', 'danger');
    } finally {
      this.busy = false;
    }
  }

  private async toast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2200, color, position: 'bottom' });
    await toast.present();
  }
}
