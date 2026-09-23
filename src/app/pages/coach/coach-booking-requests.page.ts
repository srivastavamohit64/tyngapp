import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ChatService } from '../../core/services/chat.service';
import { CoachService } from '../../core/services/coach.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

type RequestFilter = 'pending' | 'all';

@Component({
  selector: 'app-coach-booking-requests',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell>
        <main class="booking-requests-page">
          <header class="page-heading">
            <button type="button" class="back-button" aria-label="Back to dashboard" (click)="back()">
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
            <div>
              <p class="eyebrow">COACH WORKSPACE</p>
              <h1>Session requests</h1>
              <p class="subtitle">See who would like to book a session with you.</p>
            </div>
          </header>

          <div class="filter-row" role="tablist" aria-label="Booking request filter">
            <button type="button" role="tab" [attr.aria-selected]="filter() === 'pending'" [class.active]="filter() === 'pending'" (click)="setFilter('pending')">Waiting for you</button>
            <button type="button" role="tab" [attr.aria-selected]="filter() === 'all'" [class.active]="filter() === 'all'" (click)="setFilter('all')">All requests</button>
          </div>

          <div *ngIf="error()" class="notice error-notice" role="alert">{{ error() }}</div>
          <div *ngIf="successMessage()" class="notice success-notice" role="status">{{ successMessage() }}</div>
          <div *ngIf="loading() && requests().length === 0" class="loading-state">
            <ion-spinner name="crescent"></ion-spinner><span>Loading booking requests…</span>
          </div>

          <section *ngIf="!loading() && requests().length === 0" class="empty-state">
            <div class="empty-icon"><ion-icon name="calendar-clear-outline"></ion-icon></div>
            <h2>{{ filter() === 'pending' ? 'No new requests' : 'No booking requests yet' }}</h2>
            <p>{{ filter() === 'pending' ? 'When a player asks to book a session, their details will appear here.' : 'New player booking requests will appear here.' }}</p>
          </section>

          <section class="request-list" aria-label="Player session booking requests">
            <article *ngFor="let request of requests(); trackBy: trackRequest" class="request-card">
              <div class="request-topline">
                <img class="player-avatar" [src]="playerImage(request)" [alt]="request.player?.name || 'Player'" />
                <div class="player-details">
                  <h2>{{ request.player?.name || 'Player' }}</h2>
                  <p *ngIf="request.player?.username" class="username">@{{ request.player.username }}</p>
                  <p class="request-date">{{ request.created_at | date:'d MMM y, h:mm a' }}</p>
                </div>
                <span class="status-pill" [class.pending]="request.status === 'pending'" [class.accepted]="request.status === 'accepted'" [class.declined]="request.status === 'declined'">{{ request.status || 'pending' }}</span>
              </div>

              <div class="request-meta">
                <span class="meta-chip"><ion-icon name="football-outline"></ion-icon>{{ request.sport || 'Coaching session' }}</span>
                <span *ngIf="request.requested_date" class="meta-chip"><ion-icon name="calendar-outline"></ion-icon>{{ request.requested_date | date:'d MMM y' }}</span>
                <span *ngIf="request.requested_start_time" class="meta-chip"><ion-icon name="time-outline"></ion-icon>{{ request.requested_start_time }}</span>
                <span *ngIf="request.quoted_price" class="meta-chip"><ion-icon name="cash-outline"></ion-icon>₹{{ request.quoted_price }}</span>
              </div>

              <p *ngIf="request.message" class="request-message">“{{ request.message }}”</p>

              <div *ngIf="request.status === 'pending'" class="response-actions">
                <button type="button" class="accept-button" [disabled]="respondingId() === request.id" (click)="respond(request, 'accepted')">
                  <ion-spinner *ngIf="respondingId() === request.id && respondingStatus() === 'accepted'" name="crescent"></ion-spinner>
                  <ion-icon *ngIf="respondingId() !== request.id || respondingStatus() !== 'accepted'" name="checkmark-circle-outline"></ion-icon>
                  <span>{{ respondingId() === request.id && respondingStatus() === 'accepted' ? 'Accepting…' : 'Accept request' }}</span>
                </button>
                <button type="button" class="decline-button" [disabled]="respondingId() === request.id" (click)="respond(request, 'declined')">
                  <ion-spinner *ngIf="respondingId() === request.id && respondingStatus() === 'declined'" name="crescent"></ion-spinner>
                  <ion-icon *ngIf="respondingId() !== request.id || respondingStatus() !== 'declined'" name="close-circle-outline"></ion-icon>
                  <span>{{ respondingId() === request.id && respondingStatus() === 'declined' ? 'Declining…' : 'Decline' }}</span>
                </button>
              </div>

              <button type="button" class="chat-button" [disabled]="openingChat() === request.player_id || respondingId() === request.id" (click)="openChat(request)">
                <ion-spinner *ngIf="openingChat() === request.player_id" name="crescent"></ion-spinner>
                <ion-icon *ngIf="openingChat() !== request.player_id" name="chatbubble-ellipses-outline"></ion-icon>
                <span>{{ openingChat() === request.player_id ? 'Opening chat…' : 'Message player' }}</span>
              </button>
            </article>
          </section>
        </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [`
    .booking-requests-page { min-height:100%; background:#f7f9fc; padding:18px 18px 112px; color:#172033; }
    .page-heading { display:flex; align-items:center; gap:13px; max-width:720px; margin:0 auto 22px; }
    .back-button { width:42px; height:42px; flex:0 0 42px; display:grid; place-items:center; border:0; border-radius:15px; background:#fff; color:#172033; font-size:21px; box-shadow:0 2px 10px #1526420d; }
    .eyebrow { margin:0 0 4px; color:#16a34a; font-size:10px; font-weight:800; letter-spacing:.12em; }
    h1 { margin:0; font-size:23px; line-height:1.15; font-weight:850; }
    .subtitle { margin:5px 0 0; color:#788398; font-size:12px; line-height:1.4; }
    .filter-row { display:flex; gap:8px; max-width:720px; margin:0 auto 16px; }
    .filter-row button { min-height:38px; padding:0 14px; border:1px solid #e3e8ef; border-radius:20px; background:#fff; color:#657086; font-size:12px; font-weight:700; }
    .filter-row button.active { border-color:#a3e635; background:#f0fbdc; color:#267b22; }
    .request-list { display:grid; gap:12px; max-width:720px; margin:0 auto; }
    .request-card { min-width:0; padding:16px; border:1px solid #edf0f4; border-radius:20px; background:#fff; box-shadow:0 4px 16px #15264208; }
    .request-topline { display:flex; align-items:center; gap:11px; min-width:0; }
    .player-avatar { width:46px; height:46px; flex:0 0 46px; border-radius:50%; object-fit:cover; background:#edf2f7; }
    .player-details { flex:1; min-width:0; }
    .player-details h2 { margin:0; overflow:hidden; color:#172033; font-size:15px; font-weight:800; text-overflow:ellipsis; white-space:nowrap; }
    .username,.request-date { margin:3px 0 0; color:#8a94a6; font-size:11px; }
    .status-pill { flex:0 0 auto; padding:5px 8px; border-radius:20px; background:#f1f3f6; color:#667085; font-size:10px; font-weight:800; text-transform:capitalize; }
    .status-pill.pending { background:#fff5dc; color:#ad6b00; }
    .status-pill.accepted { background:#ecfdf3; color:#16803c; }
    .status-pill.declined { background:#fff1f0; color:#b42318; }
    .request-meta { display:flex; flex-wrap:wrap; gap:7px; margin-top:14px; }
    .meta-chip { display:inline-flex; align-items:center; gap:5px; min-height:27px; padding:4px 8px; border-radius:9px; background:#f7f9fc; color:#5f6b7e; font-size:10px; }
    .meta-chip ion-icon { color:#16a34a; font-size:14px; }
    .request-message { margin:12px 0 0; padding:10px 12px; border-left:3px solid #a3e635; border-radius:0 10px 10px 0; background:#f8fbea; color:#536071; font-size:12px; line-height:1.5; overflow-wrap:anywhere; }
    .response-actions { display:grid; grid-template-columns:1fr 1fr; gap:9px; margin-top:13px; }
    .response-actions button { display:flex; align-items:center; justify-content:center; gap:7px; min-height:42px; border:0; border-radius:12px; font-size:12px; font-weight:800; }
    .response-actions button:disabled { opacity:.6; }
    .response-actions ion-icon { font-size:17px; }
    .accept-button { background:#73d900; color:#14210a; }
    .decline-button { background:#f2f4f7; color:#596579; }
    .chat-button { display:flex; align-items:center; justify-content:center; gap:8px; width:100%; min-height:42px; margin-top:14px; border:0; border-radius:13px; background:#73d900; color:#14210a; font-size:13px; font-weight:800; }
    .chat-button:disabled { opacity:.65; }
    .chat-button ion-icon { font-size:17px; }
    .loading-state,.empty-state { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:10px; max-width:720px; min-height:210px; margin:0 auto; padding:24px; border:1px solid #edf0f4; border-radius:20px; background:#fff; color:#8993a4; text-align:center; }
    .empty-icon { display:grid; place-items:center; width:54px; height:54px; border-radius:17px; background:#effbdd; color:#52b500; font-size:25px; }
    .empty-state h2 { margin:2px 0 0; color:#172033; font-size:16px; font-weight:800; }
    .empty-state p { max-width:290px; margin:0; font-size:12px; line-height:1.5; }
    .notice { max-width:720px; margin:0 auto 12px; padding:10px 12px; border-radius:12px; font-size:12px; }
    .error-notice { background:#fff1f0; color:#b42318; }
    .success-notice { background:#ecfdf3; color:#16803c; }
    @media (min-width:700px) { .booking-requests-page { padding:28px 28px 120px; } .page-heading h1 { font-size:27px; } }
  `],
})
export class CoachBookingRequestsPage implements OnInit {
  private readonly coach = inject(CoachService);
  private readonly chat = inject(ChatService);
  private readonly router = inject(Router);
  readonly requests = signal<any[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly successMessage = signal('');
  readonly filter = signal<RequestFilter>('pending');
  readonly openingChat = signal<number | null>(null);
  readonly respondingId = signal<number | null>(null);
  readonly respondingStatus = signal<'accepted' | 'declined' | null>(null);

  ngOnInit(): void { this.load(); }

  setFilter(value: RequestFilter): void {
    this.filter.set(value);
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set('');
    this.coach.getCoachBookingRequests(this.filter()).subscribe({
      next: (response) => {
        const data: any = response.data;
        this.requests.set(Array.isArray(data) ? data : data?.data || []);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Could not load booking requests. Please try again.');
        this.loading.set(false);
      },
    });
  }

  respond(request: any, status: 'accepted' | 'declined'): void {
    const requestId = Number(request.id);
    if (!requestId || this.respondingId() !== null) return;
    this.error.set('');
    this.successMessage.set('');
    this.respondingId.set(requestId);
    this.respondingStatus.set(status);
    this.coach.respondToCoachBookingRequest(requestId, status).subscribe({
      next: response => {
        this.respondingId.set(null);
        this.respondingStatus.set(null);
        if (!response.success) {
          this.error.set(response.message || 'Could not update this request. Please try again.');
          return;
        }
        this.successMessage.set(status === 'accepted'
          ? 'Request accepted. The player is now in your students list; message them to confirm a date and time.'
          : 'Request declined. The player has been notified.');
        this.load();
      },
      error: error => {
        this.respondingId.set(null);
        this.respondingStatus.set(null);
        this.error.set(error?.error?.message || 'Could not update this request. Please try again.');
      },
    });
  }

  playerImage(request: any): string {
    return resolveMediaUrl(request.player?.profile_image) || 'assets/icon/avatar-placeholder.svg';
  }

  trackRequest(_index: number, request: any): number { return request.id; }

  async openChat(request: any): Promise<void> {
    const playerId = Number(request.player_id || request.player?.id);
    if (!playerId) return;
    this.openingChat.set(playerId);
    const response = await this.chat.openPrivate(playerId);
    this.openingChat.set(null);
    if (response.success && response.data?.id) {
      await this.router.navigateByUrl(`/app/coach/chat/${encodeURIComponent(response.data.id)}`);
    } else {
      this.error.set(response.message || 'Could not open a chat with this player.');
    }
  }

  back(): void { void this.router.navigateByUrl('/app/coach/dashboard'); }
}
