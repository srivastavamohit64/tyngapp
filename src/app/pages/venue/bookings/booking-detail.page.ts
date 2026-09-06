import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController, AlertController, IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingParticipant, BookingRecord, BookingSession } from '../../../core/models/api.model';
import { BookingService } from '../../../core/services/booking.service';
import { ChatService } from '../../../core/services/chat.service';
import { SessionRealtimeService } from '../../../core/services/session-realtime.service';
import { VenueService } from '../../../core/services/venue.service';
import { environment } from '../../../../environments/environment';
import {
  checkInAppOrigin,
  formatBookingTimeRange,
  gameChatMemberIds,
  sportEmoji,
} from '../../../core/utils/booking.utils';
import { PageSkeletonComponent } from '../../../shared/components/skeleton';

type DetailTab = 'overview' | 'players' | 'amenities' | 'live';

@Component({
  selector: 'app-venue-booking-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, PageSkeletonComponent],
  template: `
    <ion-content [fullscreen]="true" class="bd-content">
      <div class="bd-page">
        <div class="bd-sticky">
        <header class="bd-header">
          <button type="button" class="bd-icon-btn" (click)="goBack()" aria-label="Back">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <div class="bd-header-title">
            <h1>Booking Details</h1>
            <p *ngIf="booking()">#{{ booking()!.id }}</p>
          </div>
          <button type="button" class="bd-icon-btn" (click)="openMenu()" aria-label="More">
            <ion-icon name="ellipsis-horizontal"></ion-icon>
          </button>
        </header>
          <div class="bd-tabs" *ngIf="booking()">
            <div class="bd-tabs-scroll">
              <button type="button" class="bd-tab" [class.bd-tab--active]="tab() === 'overview'" (click)="tab.set('overview')">Overview</button>
              <button type="button" class="bd-tab" [class.bd-tab--active]="tab() === 'players'" (click)="tab.set('players')">
                Players ({{ playerCount() }})
              </button>
              <button type="button" class="bd-tab" [class.bd-tab--active]="tab() === 'amenities'" (click)="tab.set('amenities')">Amenities</button>
            </div>
            <button *ngIf="isLive()" type="button" class="live-chip" [class.live-chip--active]="tab() === 'live'" (click)="tab.set('live')">
              <span class="live-dot"></span> Live
            </button>
          </div>
        </div>

        <div *ngIf="loading() && !booking()" class="px-4 pt-3">
          <app-page-skeleton variant="detail" label="Loading booking"></app-page-skeleton>
        </div>
        <div *ngIf="!loading() && errorMessage() && !booking()" class="bd-state bd-state--error">
          <p>{{ errorMessage() }}</p>
          <button type="button" class="btn btn--primary" (click)="load()">Retry</button>
        </div>

        <ng-container *ngIf="booking() as b">
          <div class="bd-body">
            <section class="bd-hero" *ngIf="tab() !== 'players'">
              <div class="bd-hero-top">
                <div class="bd-hero-icon">{{ sportEmoji(b.sport) }}</div>
                <div class="bd-hero-copy">
                  <h2>{{ titleCase(b.sport) }} Booking</h2>
                  <p>{{ courtName() }} · {{ b.venue?.name || 'Venue' }}</p>
                </div>
              </div>
              <div class="bd-hero-badges">
                <span class="bd-badge bd-badge--lime">{{ bookingTypeLabel() }}</span>
                <span *ngIf="isLive()" class="bd-badge bd-badge--live"><span class="live-dot"></span> Live</span>
                <span *ngIf="!isLive()" class="bd-badge">{{ titleCase(b.bookingStatus) }}</span>
              </div>
              <div *ngIf="isLive()" class="live-banner"><span class="live-dot"></span> Session Live · {{ elapsedLabel() }} elapsed</div>
            </section>

            <section *ngIf="tab() === 'overview'" class="bd-card">
              <h3>Booking Information</h3>
              <div class="bd-row" *ngFor="let row of infoRows()">
                <div class="bd-row-left">
                  <ion-icon [name]="row.icon"></ion-icon>
                  <span>{{ row.label }}</span>
                </div>
                <strong>{{ row.value }}</strong>
              </div>
            </section>

            <section *ngIf="tab() === 'overview'" class="bd-card bd-ref-card">
              <span>Booking Reference</span>
              <button type="button" class="bd-ref-copy" (click)="copyReference()">
                <strong>{{ reference() }}</strong>
                <ion-icon name="copy-outline"></ion-icon>
              </button>
            </section>

            <section *ngIf="tab() === 'overview'" class="bd-card">
              <h3>Captain</h3>
              <div class="cap-row">
                <div class="cap-avatar">
                  <img *ngIf="b.host.profileImage" [src]="b.host.profileImage" [alt]="b.host.name" />
                  <span *ngIf="!b.host.profileImage">{{ initials(b.host.name) }}</span>
                  <i class="cap-dot"></i>
                </div>
                <div class="cap-copy">
                  <p>{{ b.host.name || 'Player' }}</p>
                  <span>{{ handle(b.host) }}</span>
                </div>
              </div>
              <div class="cap-pills">
                <span class="pill pill-green">★ {{ (b.host.rating || 4.5) | number:'1.1-1' }}</span>
                <span class="pill pill-blue">⚡ {{ reliability()?.reliabilityPct || 0 }}% Reliable</span>
                <span class="pill pill-grey">{{ b.host.gamesPlayed || reliability()?.totalBookings || 0 }} Matches</span>
              </div>
              <div class="cap-actions">
                <button type="button" class="btn" (click)="openCaptainChat()"><ion-icon name="chatbubble-outline"></ion-icon>Chat</button>
                <button type="button" class="btn" (click)="callCaptain()"><ion-icon name="call-outline"></ion-icon>Call</button>
                <button type="button" class="btn" (click)="showCaptainProfile()"><ion-icon name="person-outline"></ion-icon>Profile</button>
              </div>
            </section>

            <section *ngIf="tab() === 'overview'" class="bd-card">
              <h3>Special Requests</h3>
              <div *ngIf="!specialRequests().length" class="bd-empty">No special requests for this booking.</div>
              <div *ngFor="let req of specialRequests(); let last = last" class="req-row" [class.req-row--last]="last">
                <ion-icon [name]="req.icon || 'chatbubble-outline'"></ion-icon>
                <span>{{ req.text }}</span>
              </div>
            </section>

            <section *ngIf="tab() === 'overview'" class="bd-card">
              <h3>Communication</h3>
              <div class="comm-grid">
                <button type="button" class="btn" (click)="openGameChat()"><ion-icon name="chatbubbles-outline"></ion-icon>Game Chat</button>
                <button type="button" class="btn" (click)="callPlayers()"><ion-icon name="call-outline"></ion-icon>Call</button>
                <button type="button" class="btn" (click)="announce()"><ion-icon name="megaphone-outline"></ion-icon>Announce</button>
                <button type="button" class="btn" (click)="shareLocation()"><ion-icon name="location-outline"></ion-icon>Share Location</button>
              </div>
            </section>

            <section *ngIf="tab() === 'overview'" class="bd-card">
              <div class="bd-card-head">
                <h3>Customer Reliability</h3>
                <span class="trusted" *ngIf="reliability()?.trusted">Trusted</span>
              </div>
              <div class="rel-grid">
                <div class="rel-card rel-green">
                  <strong>{{ reliability()?.attendanceRate || 0 }}%</strong>
                  <p>Attendance Rate</p>
                  <span>{{ reliability()?.attendanceDetail || '—' }}</span>
                </div>
                <div class="rel-card rel-yellow">
                  <strong>{{ reliability()?.cancellationRate || 0 }}%</strong>
                  <p>Cancellation %</p>
                  <span>{{ reliability()?.cancellationDetail || '—' }}</span>
                </div>
                <div class="rel-card rel-orange">
                  <strong>{{ reliability()?.lateRate || 0 }}%</strong>
                  <p>Late Arrivals</p>
                  <span>{{ reliability()?.lateDetail || '—' }}</span>
                </div>
                <div class="rel-card rel-blue">
                  <strong>{{ reliability()?.totalBookings || 0 }}</strong>
                  <p>Total Bookings</p>
                  <span>{{ reliability()?.totalDetail || '—' }}</span>
                </div>
              </div>
            </section>

            <section *ngIf="tab() === 'overview'" class="bd-card">
              <div class="bd-card-head">
                <h3>Disputes & Issues</h3>
                <span class="open-pill">{{ openDisputeCount() }} Open</span>
              </div>
              <div *ngIf="!openDisputeCount()" class="dispute-empty">
                <div class="dispute-ok">✓</div>
                <p>No Active Disputes</p>
                <span>This booking has no open disputes or escalations.</span>
              </div>
              <div *ngFor="let d of disputes()" class="dispute-item">
                <strong>{{ titleCase(d.status) }}</strong>
                <p>{{ d.message }}</p>
                <span>{{ d.author }} · {{ formatWhen(d.createdAt) }}</span>
              </div>
              <button type="button" class="btn btn--danger" (click)="raiseDispute()">
                <ion-icon name="warning-outline"></ion-icon>
                Raise Dispute / Report Issue
              </button>
            </section>

            <section *ngIf="tab() === 'players'" class="bd-card players-card">
              <div *ngIf="!playerRows().length" class="bd-empty">No players listed yet.</div>
              <div *ngFor="let p of playerRows()" class="bd-player">
                <div class="bd-player-avatar">{{ initials(p.name) }}</div>
                <div class="bd-player-copy">
                  <p>{{ p.name }}</p>
                  <span *ngIf="p.at">@ {{ p.at }}</span>
                </div>
                <div class="p-status" [style.color]="p.color">
                  <i [style.background]="p.color"></i>{{ p.statusLabel }}
                </div>
                <button type="button" class="btn btn--icon" (click)="dial(p.phone)" [disabled]="!p.phone" aria-label="Call player">
                  <ion-icon name="call-outline"></ion-icon>
                </button>
                <button *ngIf="isLive() && p.canCheckIn" type="button" class="btn btn--icon" (click)="manualCheck(p.userId)" aria-label="Check in">
                  <ion-icon name="checkmark"></ion-icon>
                </button>
              </div>
            </section>

            <section *ngIf="tab() === 'live'" class="bd-card live-timer">
              <p class="timer-kicker">SESSION TIMER</p>
              <div class="timer-clock">{{ elapsedLabel() }}</div>
              <div class="timer-meta">
                <div><span>STARTED</span><strong>{{ startedClock() }}</strong></div>
                <div><span>REMAINING</span><strong class="green">{{ remainingLabel() }}</strong></div>
                <div><span>ENDS AT</span><strong>{{ endClock() }}</strong></div>
              </div>
            </section>

            <section *ngIf="tab() === 'live'" class="bd-card">
              <h3>Attendance QR</h3>
              <div class="qr-summary">
                <div class="qr-ring-wrap">
                  <svg viewBox="0 0 36 36">
                    <path class="ring-bg" pathLength="100" d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31" />
                    <path class="ring-fg" pathLength="100" [attr.stroke-dasharray]="attendancePct() + ' 100'" d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31" />
                  </svg>
                  <strong>{{ session()?.checkedIn || 0 }}/{{ session()?.totalPlayers || playerCount() }}</strong>
                </div>
                <div>
                  <p>{{ session()?.checkedIn || 0 }} / {{ session()?.totalPlayers || playerCount() }} Players</p>
                  <span>Checked in · {{ attendancePct() }}% attendance</span>
                </div>
              </div>
              <button type="button" class="btn btn--primary" (click)="openQr()">
                <ion-icon name="qr-code-outline"></ion-icon> Generate QR
              </button>
            </section>

            <section *ngIf="tab() === 'live'" class="bd-card">
              <h3>Live Attendance</h3>
              <div *ngIf="!checkedRows().length" class="bd-empty">Waiting for the first check-in…</div>
              <div *ngFor="let p of checkedRows()" class="bd-player">
                <div class="bd-player-avatar">{{ initials(p.name) }}</div>
                <div class="bd-player-copy">
                  <p>{{ p.name }}</p>
                  <span *ngIf="p.at">@ {{ p.at }}</span>
                </div>
                <div class="p-status p-status-ok"><i></i>Checked In</div>
              </div>
            </section>

            <section *ngIf="tab() === 'live'" class="bd-card">
              <h3>Supervisor Actions</h3>
              <div class="sup-grid">
                <button type="button" class="btn" (click)="tab.set('amenities')"><ion-icon name="cube-outline"></ion-icon>Request Equipment</button>
                <button type="button" class="btn btn--danger" (click)="raiseDispute()"><ion-icon name="warning-outline"></ion-icon>Report Issue</button>
              </div>
            </section>

            <section *ngIf="tab() === 'live'" class="bd-card">
              <h3>Session Timeline</h3>
              <div *ngIf="!timeline().length" class="bd-empty">No session events yet.</div>
              <div class="tl-list" *ngIf="timeline().length">
                <div class="tl" *ngFor="let ev of timeline()">
                  <div class="tl-rail"><span class="tl-dot" [attr.data-type]="ev.type"></span></div>
                  <div class="tl-copy">
                    <p>{{ ev.text }}</p>
                    <span>{{ formatClockOnly(ev.at) }}</span>
                  </div>
                </div>
              </div>
            </section>

            <section *ngIf="tab() === 'amenities'" class="am-wrap">
              <p class="am-hint">Tap an item to advance its status.</p>
              <div *ngIf="!amenityItems().length" class="bd-card bd-empty">No amenities recorded for this booking.</div>
              <button
                type="button"
                class="am-card"
                *ngFor="let item of amenityItems()"
                (click)="cycleAmenity(item)"
                [disabled]="amenityBusy() === item.key"
              >
                <span class="am-ico" [attr.data-status]="item.status">
                  <ion-icon [name]="amenityIcon(item.name)"></ion-icon>
                </span>
                <span class="am-copy">
                  <strong>{{ item.name }}</strong>
                  <small>Quantity: {{ item.qty }}</small>
                </span>
                <span class="am-pill" [attr.data-status]="item.status">{{ amenityStatusLabel(item.status) }}</span>
              </button>
            </section>
          </div>
        </ng-container>
      </div>
    </ion-content>

    <ng-container *ngIf="booking() as b">
      <div class="bd-footer" *ngIf="b.bookingStatus === 'pending'">
        <button type="button" class="btn btn--danger" [disabled]="acting()" (click)="decline()">Decline</button>
        <button type="button" class="btn btn--lime" [disabled]="acting()" (click)="accept()">Accept</button>
      </div>
      <div class="bd-footer" *ngIf="!isLive() && !isEnded() && b.bookingStatus !== 'pending' && b.bookingStatus !== 'cancelled' && b.bookingStatus !== 'expired'">
        <button type="button" class="btn btn--lime" (click)="openStartConfirm()">
          <ion-icon name="play-circle-outline"></ion-icon>
          Start Session
        </button>
      </div>
      <div class="bd-footer" *ngIf="isLive()">
        <button type="button" class="btn" (click)="openQr()"><ion-icon name="qr-code-outline"></ion-icon> QR Code</button>
        <button type="button" class="btn btn--danger-solid" (click)="openEndConfirm()"><ion-icon name="stop-circle-outline"></ion-icon> End Session</button>
      </div>

      <div class="sheet-mask" *ngIf="startOpen()" (click)="startOpen.set(false)">
        <div class="sheet" (click)="$event.stopPropagation()">
          <div class="grab"></div>
          <div class="sheet-orb"></div>
          <h2>Start Session?</h2>
          <p class="sheet-sub">{{ titleCase(b.sport) }} Booking · {{ timeRange() }}</p>
          <div class="sheet-box">
            <p><span class="ok">✓</span> {{ playerCount() }} players registered</p>
            <p><span class="ok">✓</span> Amenities: {{ amenityProgress() }}</p>
            <p><span class="ok">✓</span> Payment: {{ paymentLabel() }}</p>
          </div>
          <div class="sheet-actions">
            <button type="button" class="btn" (click)="startOpen.set(false)">Cancel</button>
            <button type="button" class="btn btn--primary" [disabled]="acting()" (click)="confirmStart()">Yes, Start Now</button>
          </div>
        </div>
      </div>

      <div class="sheet-mask" *ngIf="qrOpen()" (click)="qrOpen.set(false)">
        <div class="sheet sheet-qr" (click)="$event.stopPropagation()">
          <div class="grab"></div>
          <h2>Scan to Check In</h2>
          <p class="sheet-sub">{{ titleCase(b.sport) }} · {{ reference() }}</p>
          <div class="qr-frame">
              <img *ngIf="qrImageUrl()" class="qr-img" [src]="qrImageUrl()" alt="Check-in QR" />
              <div *ngIf="!qrImageUrl()" class="qr-empty">Generating check-in code…</div>
          </div>
          <div class="qr-warn">
            <ion-icon name="time-outline"></ion-icon>
            <div>
              <strong>Valid for 30 minutes only</strong>
              <small>Expires at {{ tokenExpiry() }} · Single-use per player</small>
            </div>
          </div>
          <div class="sheet-actions">
            <button type="button" class="btn" (click)="refreshQr()"><ion-icon name="refresh-outline"></ion-icon> Refresh</button>
            <button type="button" class="btn btn--primary" (click)="qrOpen.set(false)">Close</button>
          </div>
        </div>
      </div>

      <div class="sheet-mask" *ngIf="endOpen()" (click)="endOpen.set(false)">
        <div class="sheet" (click)="$event.stopPropagation()">
          <div class="grab"></div>
          <div class="sheet-orb sheet-orb--red"></div>
          <h2>End Session?</h2>
          <p class="sheet-sub">This will lock attendance and generate the booking summary</p>
          <div class="end-warn">
            <ion-icon name="warning"></ion-icon>
            <div>
              <strong>This action cannot be undone</strong>
              <small>Elapsed: {{ elapsedLabel() }} · {{ session()?.checkedIn || 0 }}/{{ session()?.totalPlayers || playerCount() }} checked in</small>
            </div>
          </div>
          <div class="sheet-actions">
            <button type="button" class="btn" (click)="endOpen.set(false)">Continue Session</button>
            <button type="button" class="btn btn--danger-solid" [disabled]="acting()" (click)="confirmEnd()">End Now</button>
          </div>
        </div>
      </div>

      <div class="sheet-mask sheet-mask--complete" *ngIf="completeOpen()" (click)="completeOpen.set(false)">
        <div class="sheet sheet-complete" (click)="$event.stopPropagation()">
          <div class="grab"></div>
          <div class="complete-emoji">🎉</div>
          <h2>Session Complete</h2>
          <p class="sheet-sub">{{ titleCase(b.sport) }} Booking</p>
          <div class="stat-grid">
            <div class="stat-card" *ngFor="let s of completeStats()">
              <span class="stat-ico">{{ s.icon }}</span>
              <strong [style.color]="s.color">{{ s.value }}</strong>
              <span>{{ s.label }}</span>
            </div>
          </div>
          <div class="rate-box">
            <p>Rate your experience</p>
            <div class="rate-row">
              <button type="button" class="btn" (click)="rateToast('Captain')">★ Rate Captain</button>
              <button type="button" class="btn" (click)="rateToast('Venue')">★ Rate Venue</button>
              <button type="button" class="btn" (click)="rateToast('Coach')">★ Rate Coach</button>
            </div>
          </div>
          <div class="sheet-actions">
            <button type="button" class="btn" (click)="shareSummary()"><ion-icon name="download-outline"></ion-icon> Summary</button>
            <button type="button" class="btn btn--primary" (click)="generateInvoice()">Generate Invoice</button>
          </div>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    :host { display: block; height: 100%; position: relative; }
    .bd-content {
      --background: #F4F6F8;
      --padding-start: 0;
      --padding-end: 0;
      --padding-top: 0;
      --padding-bottom: 0;
    }
    .bd-page {
      min-height: 100%;
      background: #F4F6F8;
      padding-bottom: calc(108px + var(--safe-area-bottom));
    }
    .bd-sticky {
      position: sticky; top: 0; z-index: 12;
      background: #fff;
      box-shadow: 0 1px 0 #F3F4F6;
    }
    .bd-header {
      display: grid;
      grid-template-columns: 40px 1fr 40px;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      padding-top: calc(10px + var(--app-chrome-top-inset, var(--safe-area-top)));
      background: #fff;
    }
    .bd-header-title { text-align: center; min-width: 0; }
    .bd-header-title h1 { margin: 0; font-size: 16px; font-weight: 900; color: #111827; line-height: 1.2; }
    .bd-header-title p { margin: 2px 0 0; font-size: 11px; font-weight: 700; color: #9CA3AF; }
    .bd-icon-btn {
      width: 40px; height: 40px; border: none; border-radius: 999px;
      background: #F3F4F6; color: #111827; display: grid; place-items: center; font-size: 18px;
    }
    .bd-tabs {
      display: flex; align-items: center; gap: 8px;
      padding: 8px 16px 12px; background: #fff;
    }
    .bd-tabs-scroll {
      display: flex; gap: 8px; overflow-x: auto; flex: 1; min-width: 0;
      scrollbar-width: none;
    }
    .bd-tabs-scroll::-webkit-scrollbar { display: none; }
    .bd-tab {
      flex: 0 0 auto; border: none; border-radius: 999px; padding: 8px 14px;
      background: #F3F4F6; color: #111827; font-size: 12px; font-weight: 800; white-space: nowrap;
    }
    .bd-tab--active { background: #111827; color: #8cf000; }
    .live-chip {
      flex: 0 0 auto; border: none; border-radius: 999px; padding: 8px 12px;
      background: #111827; color: #8cf000; font-size: 12px; font-weight: 800;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .live-chip--active { box-shadow: inset 0 0 0 2px #8cf000; }
    .bd-body { padding: 16px; display: flex; flex-direction: column; gap: 14px; }
    .bd-hero {
      background: #111827; color: #fff; border-radius: 22px; padding: 16px;
    }
    .bd-hero-top { display: flex; align-items: center; gap: 12px; }
    .bd-hero-icon {
      width: 48px; height: 48px; border-radius: 14px; background: #8cf000;
      display: grid; place-items: center; font-size: 24px; flex-shrink: 0;
    }
    .bd-hero-copy { min-width: 0; }
    .bd-hero-copy h2 { margin: 0; font-size: 18px; font-weight: 900; color: #fff; }
    .bd-hero-copy p { margin: 4px 0 0; font-size: 13px; color: #9CA3AF; font-weight: 600; }
    .bd-hero-badges { display: flex; gap: 8px; margin-top: 14px; flex-wrap: wrap; }
    .bd-badge {
      border-radius: 999px; padding: 5px 10px; font-size: 11px; font-weight: 800;
      background: #1f2937; color: #fff; border: 1px solid #374151;
    }
    .bd-badge--lime { color: #8cf000; border-color: #8cf000; }
    .bd-badge--live {
      background: #052e16; color: #8cf000; border-color: #8cf000;
      display: inline-flex; align-items: center; gap: 6px;
    }
    .live-dot {
      width: 8px; height: 8px; border-radius: 50%; background: #8cf000;
      box-shadow: 0 0 0 3px rgba(140,240,0,.22);
    }
    .live-banner {
      margin-top: 12px; border: 1px solid #8cf000; color: #8cf000; border-radius: 12px;
      padding: 8px 10px; font-size: 12px; font-weight: 800;
      display: flex; align-items: center; gap: 8px;
    }
    .bd-card { background: #fff; border-radius: 22px; padding: 16px; }
    .bd-card h3 { margin: 0 0 12px; font-size: 15px; font-weight: 900; color: #111827; }
    .bd-row {
      display: flex; align-items: center; justify-content: space-between; gap: 12px;
      padding: 11px 0; border-bottom: 1px solid #F3F4F6;
    }
    .bd-row:last-child { border-bottom: none; }
    .bd-row-left { display: flex; align-items: center; gap: 8px; color: #6B7280; font-size: 13px; font-weight: 700; min-width: 0; }
    .bd-row-left ion-icon { font-size: 16px; color: #9CA3AF; }
    .bd-row strong { font-size: 13px; font-weight: 800; color: #111827; text-align: right; }
    .bd-card-head { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 12px; }
    .bd-card-head h3 { margin: 0; }
    .bd-ref-card {
      display: flex; align-items: center; justify-content: space-between; gap: 10px;
      font-size: 13px; font-weight: 700; color: #6B7280;
    }
    .bd-ref-copy {
      border: none; background: transparent; display: inline-flex; align-items: center; gap: 6px;
      color: #111827; font-size: 13px; font-weight: 800;
    }
    .bd-ref-copy ion-icon { color: #16a34a; font-size: 16px; }
    .cap-row { display: flex; align-items: center; gap: 12px; }
    .cap-avatar {
      position: relative; width: 52px; height: 52px; border-radius: 50%; background: #111827; color: #fff;
      display: grid; place-items: center; font-weight: 900; overflow: hidden; flex-shrink: 0;
    }
    .cap-avatar img { width: 100%; height: 100%; object-fit: cover; }
    .cap-dot {
      position: absolute; right: 2px; bottom: 2px; width: 12px; height: 12px; border-radius: 50%;
      background: #22C55E; border: 2px solid #fff;
    }
    .cap-copy p { margin: 0; font-size: 15px; font-weight: 800; color: #111827; }
    .cap-copy span { font-size: 12px; font-weight: 700; color: #9CA3AF; }
    .cap-pills { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0; }
    .pill { border-radius: 999px; padding: 4px 8px; font-size: 11px; font-weight: 800; }
    .pill-green { background: #DCFCE7; color: #15803D; }
    .pill-blue { background: #E0F2FE; color: #0369A1; }
    .pill-grey { background: #F3F4F6; color: #4B5563; }
    .cap-actions { display: flex; gap: 8px; }
    .comm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .sup-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .btn {
      flex: 1;
      width: 100%;
      border: 1.5px solid #E5E7EB;
      background: #fff;
      border-radius: 16px;
      min-height: 48px;
      padding: 0 12px;
      font-size: 13px;
      font-weight: 800;
      color: #111827;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn ion-icon { font-size: 18px; }
    .btn:disabled { opacity: .45; }
    .btn--primary { background: #111827; color: #8cf000; border-color: #111827; }
    .btn--lime { background: #8cf000; color: #111827; border-color: #8cf000; }
    .btn--danger { background: #fff; color: #DC2626; border-color: #FECACA; }
    .btn--danger-solid { background: #DC2626; color: #fff; border-color: #DC2626; }
    .btn--icon {
      flex: 0 0 auto;
      width: 40px;
      min-height: 40px;
      padding: 0;
      border-radius: 12px;
    }
    .btn--icon ion-icon { font-size: 18px; }
    .req-row {
      display: flex; align-items: flex-start; gap: 10px; padding: 12px 0;
      border-bottom: 1px solid #F3F4F6; font-size: 13px; font-weight: 700; color: #111827;
    }
    .req-row ion-icon { color: #6B7280; font-size: 18px; margin-top: 1px; }
    .req-row--last { border-bottom: none; padding-bottom: 0; }
    .trusted { background: #DCFCE7; color: #15803D; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 800; }
    .rel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .rel-card { border-radius: 16px; padding: 12px; }
    .rel-card strong { display: block; font-size: 22px; font-weight: 900; line-height: 1.1; }
    .rel-card p { margin: 4px 0 0; font-size: 12px; font-weight: 800; color: #111827; }
    .rel-card span { font-size: 11px; font-weight: 600; color: #9CA3AF; }
    .rel-green { background: #F0FDF4; } .rel-green strong { color: #16A34A; }
    .rel-yellow { background: #FFFBEB; } .rel-yellow strong { color: #D97706; }
    .rel-orange { background: #FFF7ED; } .rel-orange strong { color: #C2410C; }
    .rel-blue { background: #EFF6FF; } .rel-blue strong { color: #2563EB; }
    .open-pill { background: #F3F4F6; color: #6B7280; border-radius: 999px; padding: 4px 10px; font-size: 11px; font-weight: 800; }
    .dispute-empty { text-align: center; padding: 8px 8px 16px; }
    .dispute-ok { width: 44px; height: 44px; border-radius: 14px; background: #22C55E; color: #fff; display: grid; place-items: center; margin: 0 auto 10px; font-size: 20px; font-weight: 900; }
    .dispute-empty p { margin: 0; font-size: 15px; font-weight: 800; color: #111827; }
    .dispute-empty span { display: block; margin-top: 4px; font-size: 12px; font-weight: 600; color: #9CA3AF; }
    .dispute-item { padding: 10px 0; border-bottom: 1px solid #F3F4F6; }
    .dispute-item p { margin: 4px 0; font-size: 13px; font-weight: 600; color: #374151; }
    .dispute-item span { font-size: 11px; color: #9CA3AF; font-weight: 600; }
    .bd-card > .btn--danger { margin-top: 12px; }
    .players-card { padding: 4px 16px; }
    .bd-player, .bd-rental {
      display: flex; align-items: center; gap: 10px; padding: 12px 0;
      border-bottom: 1px solid #F3F4F6;
    }
    .bd-player:last-child { border-bottom: none; }
    .bd-player-avatar {
      width: 42px; height: 42px; border-radius: 50%; background: #111827; color: #fff;
      display: grid; place-items: center; font-weight: 800; font-size: 12px; flex-shrink: 0;
    }
    .bd-player-copy { flex: 1; min-width: 0; }
    .bd-player-copy p { margin: 0; font-size: 14px; font-weight: 800; color: #111827; }
    .bd-player-copy span { font-size: 11px; font-weight: 700; color: #9CA3AF; }
    .p-status {
      display: inline-flex; align-items: center; gap: 6px;
      font-size: 12px; font-weight: 800; white-space: nowrap;
    }
    .p-status i { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
    .p-status-ok { color: #16A34A; }
    .p-status-ok i { background: #16A34A; }
    .bd-amenity {
      padding: 8px 0; font-size: 13px; font-weight: 700; color: #111827;
      border-bottom: 1px solid #F9FAFB;
    }
    .am-wrap { display: flex; flex-direction: column; gap: 10px; }
    .am-hint { margin: 2px 2px 4px; font-size: 13px; font-weight: 600; color: #9CA3AF; }
    .am-card {
      width: 100%; display: flex; align-items: center; gap: 12px;
      background: #fff; border: none; border-radius: 18px; padding: 14px 14px;
      box-shadow: 0 1px 0 rgba(17,24,39,.04); text-align: left;
    }
    .am-card:disabled { opacity: .7; }
    .am-ico {
      width: 44px; height: 44px; border-radius: 14px; background: #F3F4F6; color: #111827;
      display: grid; place-items: center; font-size: 20px; flex-shrink: 0;
    }
    .am-ico[data-status="prepared"] { background: #FFFBEB; color: #B45309; }
    .am-ico[data-status="delivered"] { background: #ECFCCB; color: #3F6212; }
    .am-copy { flex: 1; min-width: 0; }
    .am-copy strong { display: block; font-size: 15px; font-weight: 800; color: #111827; }
    .am-copy small { display: block; margin-top: 2px; font-size: 12px; font-weight: 600; color: #9CA3AF; }
    .am-pill {
      border-radius: 999px; padding: 6px 12px; font-size: 12px; font-weight: 800; white-space: nowrap;
      background: #F3F4F6; color: #4B5563;
    }
    .am-pill[data-status="prepared"] { background: #FEF3C7; color: #B45309; }
    .am-pill[data-status="delivered"] { background: #DCFCE7; color: #15803D; }
    .bd-rental { justify-content: space-between; font-size: 13px; font-weight: 700; }
    .bd-empty { color: #9CA3AF; font-size: 13px; font-weight: 600; padding: 8px 0; }
    .bd-state { padding: 48px 20px; text-align: center; color: #6B7280; font-weight: 700; }
    .bd-state--error { color: #DC2626; }
    .bd-state .btn { width: auto; margin-top: 12px; }
    .live-timer { text-align: center; background: #111827; color: #fff; }
    .timer-kicker { color: #9CA3AF; letter-spacing: .14em; font-size: 11px; font-weight: 800; margin: 0 0 8px; }
    .timer-clock { font-size: 52px; font-weight: 900; color: #8cf000; line-height: 1; font-variant-numeric: tabular-nums; }
    .timer-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px; margin-top: 18px; }
    .timer-meta span { display: block; font-size: 10px; color: #9CA3AF; font-weight: 800; letter-spacing: .06em; }
    .timer-meta strong { font-size: 13px; }
    .timer-meta .green { color: #8cf000; }
    .qr-summary { display: flex; gap: 14px; align-items: center; }
    .qr-ring-wrap { position: relative; width: 74px; height: 74px; flex-shrink: 0; }
    .qr-ring-wrap svg { width: 74px; height: 74px; transform: rotate(-90deg); }
    .ring-bg, .ring-fg { fill: none; stroke-width: 3.4; }
    .ring-bg { stroke: #E5E7EB; }
    .ring-fg { stroke: #8cf000; stroke-linecap: round; }
    .qr-ring-wrap strong {
      position: absolute; inset: 0; display: grid; place-items: center;
      font-size: 13px; font-weight: 900; color: #111827;
    }
    .qr-summary p { margin: 0; font-size: 15px; font-weight: 900; color: #111827; }
    .qr-summary span { font-size: 12px; font-weight: 700; color: #9CA3AF; }
    .qr-summary + .btn { margin-top: 14px; }
    .tl-list { position: relative; }
    .tl { display: flex; gap: 12px; padding: 0 0 16px; }
    .tl:last-child { padding-bottom: 0; }
    .tl-rail { position: relative; width: 14px; flex-shrink: 0; }
    .tl-rail::before {
      content: ''; position: absolute; left: 6px; top: 14px; bottom: -16px; width: 2px; background: #E5E7EB;
    }
    .tl:last-child .tl-rail::before { display: none; }
    .tl-dot {
      width: 14px; height: 14px; border-radius: 50%; background: #8cf000; display: block;
      box-shadow: 0 0 0 4px #ECFCCB;
    }
    .tl-dot[data-type="confirmed"],
    .tl-dot[data-type="session_started"],
    .tl-dot[data-type="checkin"] { background: #22C55E; box-shadow: 0 0 0 4px #DCFCE7; }
    .tl-dot[data-type="equipment"] { background: #F59E0B; box-shadow: 0 0 0 4px #FEF3C7; }
    .tl-dot[data-type="session_ended"] { background: #EF4444; box-shadow: 0 0 0 4px #FEE2E2; }
    .tl-copy p { margin: 0; font-weight: 800; font-size: 13px; color: #111827; }
    .tl-copy span { font-size: 11px; color: #9CA3AF; font-weight: 700; }
    .bd-footer {
      position: fixed; left: 0; right: 0; bottom: 0; z-index: 20;
      display: flex; gap: 10px;
      padding: 12px 16px calc(12px + var(--safe-area-bottom));
      background: #F4F6F8;
      border-top: 1px solid #E5E7EB;
    }
    .bd-footer .btn {
      min-height: 52px;
      font-size: 15px;
      border-radius: 16px;
    }
    .bd-footer .btn--lime {
      box-shadow: 0 6px 16px rgba(140, 240, 0, 0.28);
    }
    .sheet-mask {
      position: fixed; inset: 0; background: rgba(17,24,39,.5); z-index: 80;
      display: flex; align-items: flex-end;
    }
    .sheet {
      width: 100%; background: #fff; border-radius: 28px 28px 0 0;
      padding: 12px 18px calc(18px + var(--safe-area-bottom));
      text-align: center;
    }
    .grab { width: 40px; height: 4px; border-radius: 99px; background: #E5E7EB; margin: 0 auto 14px; }
    .sheet-orb {
      width: 56px; height: 56px; border-radius: 50%; margin: 0 auto 12px;
      background: radial-gradient(circle at 32% 28%, #f7ffc2, #8cf000 42%, #4d7c0f);
      box-shadow: 0 10px 24px rgba(140,240,0,.35);
    }
    .sheet h2 { margin: 0; font-size: 24px; font-weight: 900; color: #111827; }
    .sheet-sub { margin: 6px 0 14px; color: #6B7280; font-weight: 600; font-size: 13px; }
    .sheet-box {
      background: #F9FAFB; border-radius: 16px; padding: 12px 14px; text-align: left;
    }
    .sheet-box p { margin: 8px 0; color: #111827; font-weight: 700; font-size: 14px; display: flex; gap: 8px; align-items: center; }
    .sheet-box .ok { color: #16A34A; font-weight: 900; }
    .sheet-actions { display: flex; gap: 10px; margin-top: 16px; }
    .qr-frame {
      width: 220px; height: 220px; margin: 8px auto 14px; padding: 10px;
      border: 1px solid #E5E7EB; border-radius: 18px; background: #fff;
    }
    .qr-img { width: 100%; height: 100%; display: block; }
    .qr-empty { height: 100%; display: grid; place-items: center; color: #9CA3AF; font-weight: 700; font-size: 13px; }
    .qr-warn {
      background: #FFEDD5; color: #9A3412; border-radius: 14px; padding: 12px;
      display: flex; gap: 10px; align-items: flex-start; text-align: left; font-size: 13px;
    }
    .qr-warn ion-icon { font-size: 20px; margin-top: 1px; }
    .qr-warn strong { display: block; font-weight: 800; }
    .qr-warn small { display: block; margin-top: 2px; color: #C2410C; font-weight: 700; }
    .sheet-orb--red {
      background: radial-gradient(circle at 32% 28%, #fecaca, #ef4444 42%, #991b1b);
      box-shadow: 0 10px 24px rgba(239,68,68,.35);
    }
    .end-warn {
      background: #FEE2E2; color: #991B1B; border-radius: 14px; padding: 12px;
      display: flex; gap: 10px; align-items: flex-start; text-align: left;
    }
    .end-warn ion-icon { font-size: 20px; margin-top: 1px; color: #DC2626; }
    .end-warn strong { display: block; font-weight: 800; font-size: 14px; }
    .end-warn small { display: block; margin-top: 3px; font-weight: 700; font-size: 12px; }
    .sheet-mask--complete { align-items: flex-end; }
    .sheet-complete {
      max-height: 92vh; overflow-y: auto; text-align: center;
      padding-bottom: calc(20px + var(--safe-area-bottom));
    }
    .complete-emoji { font-size: 36px; line-height: 1; margin-bottom: 8px; }
    .stat-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .stat-card {
      background: #F9FAFB; border-radius: 16px; padding: 12px 10px;
      display: flex; flex-direction: column; align-items: center; gap: 4px;
    }
    .stat-ico { font-size: 18px; }
    .stat-card strong { font-size: 18px; font-weight: 900; line-height: 1.1; }
    .stat-card span:last-child { font-size: 11px; font-weight: 700; color: #9CA3AF; }
    .rate-box {
      margin-top: 12px; background: #ECFCCB; border-radius: 16px; padding: 12px;
      text-align: left;
    }
    .rate-box p { margin: 0 0 10px; color: #3F6212; font-weight: 800; font-size: 14px; }
    .rate-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }
    .rate-row .btn { min-height: 40px; font-size: 11px; padding: 0 6px; }
  `],
})
export class VenueBookingDetailPage implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly bookings = inject(BookingService);
  private readonly venueService = inject(VenueService);
  private readonly chat = inject(ChatService);
  private readonly toastCtrl = inject(ToastController);
  private readonly actionSheet = inject(ActionSheetController);
  private readonly alertCtrl = inject(AlertController);
  private readonly realtime = inject(SessionRealtimeService);
  private tick: ReturnType<typeof setInterval> | null = null;
  private readonly nowMs = signal(Date.now());

  readonly sportEmoji = sportEmoji;
  readonly tab = signal<DetailTab>('overview');
  readonly loading = signal(true);
  readonly acting = signal(false);
  readonly errorMessage = signal('');
  readonly booking = signal<BookingRecord | null>(null);
  readonly players = signal<BookingParticipant[]>([]);
  readonly amenities = signal<string[]>([]);
  readonly supervisor = signal('—');
  readonly amenityBusy = signal<string | null>(null);
  readonly startOpen = signal(false);
  readonly qrOpen = signal(false);
  readonly endOpen = signal(false);
  readonly completeOpen = signal(false);
  readonly qrToken = signal<string | null>(null);
  readonly qrExpiresAt = signal<string | null>(null);

  ngOnInit(): void {
    this.tick = setInterval(() => this.nowMs.set(Date.now()), 1000);
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) void this.load(id);
    });
  }

  ngOnDestroy(): void {
    if (this.tick) clearInterval(this.tick);
    this.realtime.stop();
  }

  titleCase(value?: string | null): string {
    return String(value || '').replace(/\b\w/g, (c) => c.toUpperCase()) || '—';
  }

  courtName(): string {
    const b = this.booking();
    return b?.slot?.courtName || String(b?.calendarEvent?.meta?.['courtName'] || 'Court');
  }

  bookingTypeLabel(): string {
    const role = String(this.booking()?.host?.role || 'player').toLowerCase();
    return role === 'coach' ? 'Coach Booking' : 'Player Booking';
  }

  playerCount(): number {
    return this.booking()?.currentPlayers || this.players().length || 0;
  }

  reference(): string {
    const id = String(this.booking()?.id || '').padStart(4, '0');
    const sport = String(this.booking()?.sport || 'BK').slice(0, 2).toUpperCase();
    return `TNG-BK-${id}-${sport}`;
  }

  initials(name?: string | null): string {
    const parts = String(name || 'P').trim().split(/\s+/);
    return ((parts[0]?.[0] || 'P') + (parts[1]?.[0] || '')).toUpperCase();
  }

  handle(host?: BookingRecord['host'] | null): string {
    if (host?.username) return `@${host.username}`;
    const slug = String(host?.name || 'player').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    return `@${slug || 'player'}`;
  }

  reliability() {
    return this.booking()?.hostReliability || null;
  }

  specialRequests() {
    return this.booking()?.specialRequests || [];
  }

  disputes() {
    return this.booking()?.disputes || [];
  }

  openDisputeCount(): number {
    return this.disputes().filter((d) => String(d.status).toLowerCase() === 'open').length;
  }

  formatClockOnly(iso?: string | null): string {
    return this.clockFromIso(iso);
  }

  formatWhen(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString([], { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
  }

  async openCaptainChat(): Promise<void> {
    const host = this.booking()?.host;
    if (!host?.id) return;
    const res = await this.chat.openPrivate({
      id: host.id,
      name: host.name || 'Player',
      avatar: host.profileImage ?? null,
    });
    if (res.success && res.data?.id) {
      void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(res.data.id)}`);
      return;
    }
    await this.toast(res.message || 'Unable to open chat.');
  }

  async openGameChat(): Promise<void> {
    const booking = this.booking();
    if (!booking) return;
    const res = await this.chat.openGame(booking.id, {
      title: `${this.titleCase(booking.sport)} · ${this.courtName()}`,
      memberIds: gameChatMemberIds(booking),
    });
    if (res.success && res.data?.id) {
      void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(res.data.id)}`);
      return;
    }
    await this.toast(res.message || 'Unable to open game chat.');
  }

  async callCaptain(): Promise<void> {
    const phone = this.booking()?.host?.phone;
    if (!phone) {
      await this.toast('Captain phone number is not available.');
      return;
    }
    this.dial(phone);
  }

  async callPlayers(): Promise<void> {
    const list = this.callablePlayers();
    if (!list.length) {
      await this.toast('No player phone numbers available.');
      return;
    }
    if (list.length === 1) {
      this.dial(list[0].phone);
      return;
    }
    const sheet = await this.actionSheet.create({
      header: 'Call player',
      subHeader: 'Choose who to call',
      buttons: [
        ...list.map((player) => ({
          text: player.role === 'Captain' ? `${player.name} (Captain)` : player.name,
          icon: 'call-outline',
          handler: () => this.dial(player.phone),
        })),
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  dial(phone?: string | null): void {
    const value = String(phone || '').replace(/\s+/g, '');
    if (!value) {
      void this.toast('Phone number is not available.');
      return;
    }
    window.location.href = `tel:${value}`;
  }

  private callablePlayers(): Array<{ id: string; name: string; phone: string; role: string }> {
    const seen = new Set<string>();
    const list: Array<{ id: string; name: string; phone: string; role: string }> = [];
    const add = (id?: string | number | null, name?: string | null, phone?: string | null, role = 'Player') => {
      const userId = String(id || '');
      const number = String(phone || '').trim();
      if (!userId || !number || seen.has(userId)) return;
      seen.add(userId);
      list.push({ id: userId, name: name || 'Player', phone: number, role });
    };
    const booking = this.booking();
    add(booking?.host?.id || booking?.hostUserId, booking?.host?.name, booking?.host?.phone, 'Captain');
    for (const player of this.players()) {
      const status = String(player.status || '').toLowerCase();
      if (status && !['joined', 'host', 'accepted'].includes(status)) continue;
      add(
        player.user?.id,
        player.user?.name,
        player.user?.phone,
        player.role === 'host' ? 'Captain' : 'Player',
      );
    }
    return list;
  }

  async showCaptainProfile(): Promise<void> {
    const host = this.booking()?.host;
    if (!host) return;
    const alert = await this.alertCtrl.create({
      header: host.name || 'Captain',
      message: `${this.handle(host)}\n${host.phone || 'No phone'}\n${host.email || ''}`.trim(),
      buttons: ['OK'],
    });
    await alert.present();
  }

  async announce(): Promise<void> {
    const booking = this.booking();
    if (!booking) return;
    const alert = await this.alertCtrl.create({
      header: 'Announce to game chat',
      inputs: [{ name: 'text', type: 'textarea', placeholder: 'Message for all players…' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Send',
          handler: (data) => {
            void this.sendAnnounce(String(data?.text || ''));
          },
        },
      ],
    });
    await alert.present();
  }

  async shareLocation(): Promise<void> {
    const b = this.booking();
    const place = b?.venue?.address || b?.venue?.location || b?.venue?.name || 'Venue';
    const text = `${place} — ${this.courtName()} (${this.reference()})`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Venue location', text });
        return;
      }
    } catch {
      // fall through to copy
    }
    try {
      await navigator.clipboard.writeText(text);
      await this.toast('Location copied.');
    } catch {
      await this.toast(text);
    }
  }

  async raiseDispute(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Raise Dispute / Report Issue',
      inputs: [{ name: 'message', type: 'textarea', placeholder: 'Describe the issue…' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit',
          handler: (data) => {
            void this.submitDispute(String(data?.message || ''));
          },
        },
      ],
    });
    await alert.present();
  }

  infoRows(): Array<{ icon: string; label: string; value: string }> {
    const b = this.booking();
    if (!b) return [];
    const method = String(b.paymentMethod || '').toLowerCase();
    const pay = String(b.paymentStatus || '').toLowerCase();
    const paid = pay === 'paid' || pay === 'completed';
    const methodLabel = method === 'online' ? 'Online' : method === 'wallet' ? 'Wallet' : method === 'at_venue' ? 'At venue' : '—';
    const hours = Math.max(1, Math.round((Number(b.durationMinutes) || 60) / 60));
    return [
      { icon: 'calendar-outline', label: 'Date', value: this.formatLongDate(b.bookingDate) },
      { icon: 'time-outline', label: 'Time', value: formatBookingTimeRange(b.startTime, b.endTime).replace(' · ', ' – ') },
      { icon: 'timer-outline', label: 'Duration', value: hours === 1 ? '1 Hour' : `${hours} Hours` },
      { icon: 'people-outline', label: 'Players', value: `${this.playerCount()} registered` },
      { icon: 'football-outline', label: 'Facility', value: this.courtName() },
      { icon: 'cash-outline', label: 'Amount', value: `₹${Number(b.price || 0).toLocaleString('en-IN')}` },
      { icon: 'card-outline', label: 'Payment', value: `${paid ? 'Paid' : this.titleCase(pay || 'Pending')} · ${methodLabel}` },
      { icon: 'person-outline', label: 'Supervisor', value: this.supervisor() },
    ];
  }

  rentals(): Array<{ name: string; qty: number; lineTotal: string }> {
    return (this.booking()?.rentalDetails || [])
      .filter((item) => Number(item?.qty || 0) > 0)
      .map((item) => {
        const qty = Number(item.qty || 0);
        const price = Number(item.price || 0);
        return { name: String(item.name || 'Equipment'), qty, lineTotal: `₹${(qty * price).toLocaleString('en-IN')}` };
      });
  }

  async load(id?: string): Promise<void> {
    const bookingId = id || this.route.snapshot.paramMap.get('id');
    if (!bookingId) {
      this.errorMessage.set('Missing booking id.');
      this.loading.set(false);
      return;
    }
    this.loading.set(true);
    this.errorMessage.set('');
    try {
      const res = await firstValueFrom(this.bookings.getBooking(bookingId));
      if (!res.success || !res.data) {
        this.errorMessage.set(res.message || 'Booking not found.');
        this.booking.set(null);
        return;
      }
      this.applyBooking(res.data);
      await Promise.all([this.loadPlayers(bookingId), this.loadVenueExtras(res.data)]);
      if (res.data.session?.status === 'live') {
        this.tab.set('live');
      }
      void this.attachRealtime(bookingId);
    } catch (error: any) {
      this.errorMessage.set(error?.error?.message || 'Unable to load booking.');
      this.booking.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  async copyReference(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.reference());
      const toast = await this.toastCtrl.create({ message: 'Reference copied', duration: 1400, color: 'dark' });
      await toast.present();
    } catch {
      // ignore
    }
  }

  async openMenu(): Promise<void> {
    const b = this.booking();
    if (!b) return;
    const buttons: Array<{ text: string; icon?: string; role?: string; handler?: () => void }> = [
      { text: 'Copy reference', icon: 'copy-outline', handler: () => { void this.copyReference(); } },
    ];
    if (b.host?.phone || this.callablePlayers().length) {
      buttons.push({ text: 'Call player', icon: 'call-outline', handler: () => { void this.callPlayers(); } });
    }
    buttons.push({ text: 'Cancel', role: 'cancel' });
    const sheet = await this.actionSheet.create({ header: 'Booking', buttons });
    await sheet.present();
  }

  async startSession(): Promise<void> {
    this.openStartConfirm();
  }

  openStartConfirm(): void {
    this.startOpen.set(true);
  }

  session(): BookingSession | null {
    return this.booking()?.session || null;
  }

  isLive(): boolean {
    return this.session()?.status === 'live';
  }

  isEnded(): boolean {
    return this.session()?.status === 'ended';
  }

  timeRange(): string {
    const b = this.booking();
    if (!b) return '';
    return formatBookingTimeRange(b.startTime, b.endTime).replace(' · ', ' – ');
  }

  paymentLabel(): string {
    const pay = String(this.booking()?.paymentStatus || '').toLowerCase();
    if (pay === 'paid' || pay === 'completed') return 'Fully collected';
    return this.titleCase(pay || 'Pending');
  }

  amenityItems(): Array<{ key: string; name: string; qty: number; status: 'pending' | 'prepared' | 'delivered' }> {
    const fromApi = this.booking()?.amenityChecklist || [];
    if (fromApi.length) {
      return fromApi.map((item) => ({
        key: item.key,
        name: item.name,
        qty: Number(item.qty || 1),
        status: item.status || 'pending',
      }));
    }
    const rentals = this.rentals().map((item) => ({
      key: `rental:${item.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name: item.name,
      qty: item.qty,
      status: 'pending' as const,
    }));
    if (rentals.length) return rentals;
    return this.amenities()
      .filter((name) => !/park|light|wash|toilet|chang|locker|wifi|cafe|shower/i.test(name))
      .map((name) => ({
        key: `amenity:${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
        name,
        qty: 1,
        status: 'pending' as const,
      }));
  }

  amenityIcon(name: string): string {
    const value = name.toLowerCase();
    if (value.includes('football') || value.includes('soccer')) return 'football-outline';
    if (value.includes('basket')) return 'basketball-outline';
    if (value.includes('net') || value.includes('goal')) return 'grid-outline';
    if (value.includes('bib') || value.includes('jersey') || value.includes('shirt')) return 'shirt-outline';
    if (value.includes('water') || value.includes('cooler')) return 'water-outline';
    if (value.includes('chair') || value.includes('seat')) return 'cafe-outline';
    if (value.includes('pa') || value.includes('speaker') || value.includes('mic')) return 'mic-outline';
    if (value.includes('cone')) return 'triangle-outline';
    return 'cube-outline';
  }

  amenityStatusLabel(status: string): string {
    if (status === 'prepared') return 'Prepared';
    if (status === 'delivered') return 'Delivered';
    return 'Pending';
  }

  async cycleAmenity(item: { key: string; name: string }): Promise<void> {
    const id = this.booking()?.id;
    if (!id || this.amenityBusy()) return;
    this.amenityBusy.set(item.key);
    try {
      const res = await firstValueFrom(this.bookings.cycleAmenity(id, item.key));
      if (res.success && res.data) {
        this.applyBooking(res.data);
      }
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.error?.message || 'Unable to update amenity status.',
        duration: 1600,
        color: 'dark',
      });
      await toast.present();
    } finally {
      this.amenityBusy.set(null);
    }
  }

  amenityProgress(): string {
    const items = this.amenityItems();
    const total = items.length;
    const delivered = items.filter((item) => item.status === 'delivered').length;
    if (!total) return 'None listed';
    return `${delivered} of ${total} delivered`;
  }

  attendancePct(): number {
    const total = this.session()?.totalPlayers || this.playerCount() || 1;
    const checked = this.session()?.checkedIn || 0;
    return Math.round((checked / total) * 100);
  }

  clockFromIso(iso?: string | null): string {
    if (!iso) return '—';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  startedClock(): string {
    return this.clockFromIso(this.session()?.startedAt) || this.formatClock(this.booking()?.startTime);
  }

  endClock(): string {
    return this.formatClock(this.booking()?.endTime);
  }

  elapsedLabel(): string {
    const start = this.session()?.startedAt ? Date.parse(this.session()!.startedAt!) : 0;
    if (!start) return '00:00';
    const sec = Math.max(0, Math.floor((this.nowMs() - start) / 1000));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  remainingLabel(): string {
    const end = this.bookingEndMs();
    if (!end) return '—';
    const sec = Math.max(0, Math.floor((end - this.nowMs()) / 1000));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  tokenExpiry(): string {
    return this.clockFromIso(this.qrExpiresAt() || this.session()?.checkinTokenExpiresAt);
  }

  qrImageUrl(): string {
    const token = this.qrToken() || this.session()?.checkinToken;
    const id = this.booking()?.id;
    if (!token || !id) return '';
    const payload = `${checkInAppOrigin(environment.apiUrl)}/app/check-in?b=${encodeURIComponent(id)}&t=${encodeURIComponent(token)}`;
    return `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(payload)}`;
  }

  timeline() {
    return this.session()?.timeline || [];
  }

  playerRows() {
    const attendance = this.session()?.attendance || [];
    const byId = new Map(attendance.map((a) => [String(a.userId), a]));
    const fromPlayers = this.players().map((p) => {
      const userId = String(p.user?.id || '');
      const row = byId.get(userId);
      return this.rowFromAttendance(userId, p.user?.name || 'Player', row, p.user?.phone);
    });
    if (fromPlayers.length) return fromPlayers;
    return attendance.map((a) => this.rowFromAttendance(a.userId, a.name, a, this.players().find((p) => String(p.user?.id) === String(a.userId))?.user?.phone));
  }

  checkedRows() {
    return this.playerRows().filter((p) => p.status === 'checked_in' || p.status === 'late');
  }

  async confirmStart(): Promise<void> {
    const id = this.booking()?.id;
    if (!id || this.acting()) return;
    this.acting.set(true);
    try {
      const res = await firstValueFrom(this.bookings.startSession(id));
      if (res.success && res.data) {
        this.applyBooking(res.data);
        this.startOpen.set(false);
        this.tab.set('live');
        void this.attachRealtime(id);
        await this.toast('Session is live.');
        return;
      }
      await this.toast(res.message || 'Unable to start session.');
    } catch (error: any) {
      await this.toast(error?.error?.message || 'Unable to start session.');
    } finally {
      this.acting.set(false);
    }
  }

  async endSession(): Promise<void> {
    this.openEndConfirm();
  }

  openEndConfirm(): void {
    this.qrOpen.set(false);
    this.endOpen.set(true);
  }

  completeStats(): Array<{ icon: string; value: string; label: string; color: string }> {
    const rows = this.session()?.attendance || [];
    const attended = rows.filter((r) => r.status === 'checked_in').length;
    const late = rows.filter((r) => r.status === 'late').length;
    const noshow = rows.filter((r) => r.status === 'absent' || r.status === 'awaiting').length;
    const extras = this.rentals().reduce((sum, item) => {
      const n = Number(String(item.lineTotal).replace(/[^\d.]/g, '')) || 0;
      return sum + n;
    }, 0);
    const price = Number(this.booking()?.price || 0);
    return [
      { icon: '⏱', value: this.durationLabel(), label: 'Duration', color: '#111827' },
      { icon: '👥', value: String(this.session()?.totalPlayers || this.playerCount()), label: 'Registered', color: '#111827' },
      { icon: '✅', value: String(attended), label: 'Attended', color: '#16A34A' },
      { icon: '✕', value: String(noshow), label: 'No Shows', color: '#DC2626' },
      { icon: '🟠', value: String(late), label: 'Late Arrivals', color: '#EA580C' },
      { icon: '⚠️', value: String(this.openDisputeCount()), label: 'Incidents', color: '#111827' },
      { icon: '💰', value: `₹${price.toLocaleString('en-IN')}`, label: 'Revenue', color: '#15803D' },
      { icon: '＋', value: `₹${extras.toLocaleString('en-IN')}`, label: 'Extra Charges', color: '#2563EB' },
    ];
  }

  durationLabel(): string {
    const start = this.session()?.startedAt ? Date.parse(this.session()!.startedAt!) : 0;
    const end = this.session()?.endedAt ? Date.parse(this.session()!.endedAt!) : this.nowMs();
    if (!start) return '00:00';
    const sec = Math.max(0, Math.floor((end - start) / 1000));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  async rateToast(who: string): Promise<void> {
    await this.toast(`Thanks — ${who} rating saved.`);
  }

  async shareSummary(): Promise<void> {
    const stats = this.completeStats().map((s) => `${s.label}: ${s.value}`).join('\n');
    const text = `Session Complete — ${this.titleCase(this.booking()?.sport)} Booking\n${stats}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Session summary', text });
        return;
      }
    } catch {
      // fall through
    }
    try {
      await navigator.clipboard.writeText(text);
      await this.toast('Summary copied.');
    } catch {
      await this.toast(text);
    }
  }

  async generateInvoice(): Promise<void> {
    this.completeOpen.set(false);
    await this.toast('Invoice will be generated and sent to the captain.');
  }

  async confirmEnd(): Promise<void> {
    const id = this.booking()?.id;
    if (!id || this.acting()) return;
    this.acting.set(true);
    try {
      const res = await firstValueFrom(this.bookings.endSession(id));
      if (res.success && res.data) {
        this.applyBooking(res.data);
        this.endOpen.set(false);
        this.qrOpen.set(false);
        this.completeOpen.set(true);
        return;
      }
      await this.toast(res.message || 'Unable to end session.');
    } catch (error: any) {
      await this.toast(error?.error?.message || 'Unable to end session.');
    } finally {
      this.acting.set(false);
    }
  }

  async openQr(): Promise<void> {
    const ready = await this.ensureCheckinToken();
    if (!ready) return;
    this.qrOpen.set(true);
  }

  async refreshQr(): Promise<void> {
    await this.ensureCheckinToken(true);
  }

  private applyBooking(data: BookingRecord): void {
    this.booking.set(data);
    this.captureQr(data);
  }

  private captureQr(data: BookingRecord): void {
    const token = data.session?.checkinToken;
    if (token) this.qrToken.set(token);
    if (data.session?.checkinTokenExpiresAt) this.qrExpiresAt.set(data.session.checkinTokenExpiresAt);
    if (data.session?.status === 'ended') {
      this.qrToken.set(null);
      this.qrExpiresAt.set(null);
    }
  }

  private async ensureCheckinToken(force = false): Promise<boolean> {
    const id = this.booking()?.id;
    if (!id) return false;
    if (!force && (this.qrToken() || this.session()?.checkinToken)) return true;
    try {
      const res = await firstValueFrom(this.bookings.refreshCheckinQr(id));
      if (res.success && res.data) {
        this.applyBooking(res.data);
        return !!(this.qrToken() || res.data.session?.checkinToken);
      }
    } catch {
      // Session may still be startable
    }
    try {
      const started = await firstValueFrom(this.bookings.startSession(id));
      if (started.success && started.data) {
        this.applyBooking(started.data);
        this.tab.set('live');
        return !!(this.qrToken() || started.data.session?.checkinToken);
      }
    } catch (error: any) {
      await this.toast(error?.error?.message || 'Unable to generate QR. Start the session first.');
    }
    return false;
  }

  async manualCheck(userId: string): Promise<void> {
    const id = this.booking()?.id;
    if (!id || !userId) return;
    try {
      const res = await firstValueFrom(this.bookings.manualCheckIn(id, userId));
      if (res.success && res.data) this.booking.set(res.data);
    } catch (error: any) {
      await this.toast(error?.error?.message || 'Unable to check in player.');
    }
  }

  private rowFromAttendance(
    userId: string,
    name: string,
    row?: { status?: string; checkedInAt?: string | null } | null,
    phone?: string | null,
  ) {
    const status = row?.status || 'awaiting';
    const labels: Record<string, string> = {
      checked_in: 'Checked In',
      late: 'Late',
      awaiting: 'Awaiting',
      absent: 'Absent',
    };
    const colors: Record<string, string> = {
      checked_in: '#16A34A',
      late: '#EA580C',
      awaiting: '#EA580C',
      absent: '#DC2626',
    };
    return {
      userId,
      name,
      status,
      statusLabel: labels[status] || status,
      color: colors[status] || '#6B7280',
      at: row?.checkedInAt ? this.clockFromIso(row.checkedInAt) : '',
      canCheckIn: status === 'awaiting',
      phone: phone || '',
    };
  }

  private formatClock(time?: string | null): string {
    if (!time) return '—';
    const [h, m] = String(time).split(':');
    const d = new Date();
    d.setHours(Number(h || 0), Number(m || 0), 0, 0);
    return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }

  private bookingEndMs(): number {
    const b = this.booking();
    if (!b?.bookingDate || !b.endTime) return 0;
    return Date.parse(`${b.bookingDate}T${String(b.endTime).slice(0, 8)}`);
  }

  private async attachRealtime(bookingId: string): Promise<void> {
    await this.realtime.listen(bookingId, (partial) => {
      const current = this.booking();
      if (!current) return;
      const session = {
        ...(current.session || {
          status: 'idle',
          checkedIn: 0,
          totalPlayers: this.playerCount(),
          attendance: [],
          timeline: [],
        }),
        attendance: partial.attendance || current.session?.attendance || [],
        timeline: partial.timeline || current.session?.timeline || [],
        checkedIn: partial.checkedIn ?? current.session?.checkedIn ?? 0,
        totalPlayers: partial.totalPlayers ?? current.session?.totalPlayers ?? this.playerCount(),
        checkinToken: this.qrToken() || current.session?.checkinToken || null,
        checkinTokenExpiresAt: this.qrExpiresAt() || current.session?.checkinTokenExpiresAt || null,
      };
      this.booking.set({ ...current, session });
    });
  }

  private async sendAnnounce(text: string): Promise<void> {
    const trimmed = text.trim();
    const booking = this.booking();
    if (!trimmed || !booking) return;
    const memberIds = gameChatMemberIds(booking);
    const open = await this.chat.openGame(booking.id, {
      title: `${this.titleCase(booking.sport)} · ${this.courtName()}`,
      memberIds: memberIds as Array<string | number>,
    });
    if (!open.success || !open.data?.id) {
      await this.toast(open.message || 'Unable to open game chat.');
      return;
    }
    const sent = await this.chat.sendMessage(open.data.id, trimmed);
    if (!sent.success) {
      await this.toast(sent.message || 'Unable to send announcement.');
      return;
    }
    void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(open.data.id)}`);
  }

  private async submitDispute(message: string): Promise<void> {
    const id = this.booking()?.id;
    const trimmed = message.trim();
    if (!id || !trimmed) {
      await this.toast('Please describe the issue.');
      return;
    }
    try {
      const res = await firstValueFrom(this.bookings.createDispute(id, trimmed));
      if (res.success && res.data) {
        this.booking.set(res.data);
        await this.toast('Dispute submitted.');
        return;
      }
      await this.toast(res.message || 'Unable to submit dispute.');
    } catch (error: any) {
      await this.toast(error?.error?.message || 'Unable to submit dispute.');
    }
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 1800, color: 'dark' });
    await toast.present();
  }

  async accept(): Promise<void> {
    const id = this.booking()?.id;
    if (!id || this.acting()) return;
    this.acting.set(true);
    try {
      await firstValueFrom(this.bookings.approveBooking(id));
      await this.load(id);
    } catch (error: any) {
      this.errorMessage.set(error?.error?.message || 'Unable to accept booking.');
    } finally {
      this.acting.set(false);
    }
  }

  async decline(): Promise<void> {
    const id = this.booking()?.id;
    if (!id || this.acting()) return;
    this.acting.set(true);
    try {
      await firstValueFrom(this.bookings.cancelBooking(id));
      await this.load(id);
    } catch (error: any) {
      this.errorMessage.set(error?.error?.message || 'Unable to decline booking.');
    } finally {
      this.acting.set(false);
    }
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/app/venue/bookings');
  }

  private async loadPlayers(bookingId: string): Promise<void> {
    try {
      const res = await firstValueFrom(this.bookings.getBookingPlayers(bookingId));
      const list = res.data?.acceptedPlayers || res.data?.players || this.booking()?.acceptedPlayers || this.booking()?.players || [];
      this.players.set(list);
    } catch {
      this.players.set(this.booking()?.acceptedPlayers || this.booking()?.players || []);
    }
  }

  private async loadVenueExtras(booking: BookingRecord): Promise<void> {
    try {
      const res = await firstValueFrom(this.venueService.getMyProfile());
      const data = (res.data || {}) as Record<string, any>;
      const amenities = Array.isArray(data['amenities']) ? data['amenities'].map((a: unknown) => String(a)) : [];
      this.amenities.set(amenities);
      const courts = Array.isArray(data['courts']) ? data['courts'] : [];
      const courtName = this.courtName().toLowerCase();
      const match = courts.find((c: any) => String(c?.name || c?.courtName || '').toLowerCase() === courtName);
      const meta = (match?.meta || {}) as Record<string, unknown>;
      this.supervisor.set(String(meta['supervisorName'] || '—'));
    } catch {
      this.amenities.set([]);
      this.supervisor.set('—');
    }
  }

  private formatLongDate(date?: string | null): string {
    if (!date) return '—';
    const d = new Date(`${date}T00:00:00`);
    if (Number.isNaN(d.getTime())) return date;
    return new Intl.DateTimeFormat('en-GB', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(d);
  }
}
