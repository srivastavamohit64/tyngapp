import { CommonModule, Location } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AlertController, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CoachService } from '../../core/services/coach.service';
import { ChatService } from '../../core/services/chat.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { PageSkeletonComponent } from '../../shared/components/skeleton';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

@Component({
  selector: 'app-coach-profile-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, PageSkeletonComponent, BrandHeaderShellComponent],
  template: `
    <ion-content fullscreen>
      <app-brand-header-shell (back)="back()">
      <main class="page-with-tab-bar px-6 py-4 bg-background text-foreground" *ngIf="!coach">
        <header class="flex items-center mb-6">
          <h1 class="app-header-title flex-1">Coach Profile</h1>
        </header>
        <app-page-skeleton *ngIf="loading" variant="profile" label="Loading coach profile"></app-page-skeleton>
        <div *ngIf="!loading" class="py-16 text-center text-sm text-slate-500" role="alert">
          <p class="mb-4">{{ loadError || 'This coach profile is not available.' }}</p>
          <button type="button" class="h-10 px-5 rounded-xl bg-primary font-bold text-slate-900" (click)="loadCoach()">Try again</button>
        </div>
      </main>
      <main class="page-with-tab-bar px-6 py-4 bg-background text-foreground" *ngIf="coach">
        
        <!-- Header -->
        <header class="flex items-center mb-6">
          <h1 class="app-header-title flex-1">Coach Profile</h1>
        </header>

        <!-- Profile Detail Card -->
        <div class="bg-card border border-border rounded-2xl p-6 mb-6 flex flex-col items-center text-center">
          <div class="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-5xl shadow-md mb-4 animate-bounce overflow-hidden">
            <img *ngIf="coach.profileImage; else coachDetailPlaceholder" [src]="photo(coach.profileImage)" [alt]="coach.name" class="h-full w-full object-cover" />
            <ng-template #coachDetailPlaceholder>{{ coach.avatar }}</ng-template>
          </div>
          <h2 class="text-xl font-bold text-slate-900 mb-1">{{ coach.name }}</h2>
          <p class="text-xs font-bold text-primary mb-3 uppercase tracking-wide">{{ coach.sport }} • {{ coach.experience }}</p>
          <span class="rating flex items-center gap-1.5 text-sm font-bold text-secondary mb-4">
            <ion-icon name="star"></ion-icon>
            {{ coach.rating }}<ng-container *ngIf="coach.reviewCount"> ({{ coach.reviewCount }} review{{ coach.reviewCount === 1 ? '' : 's' }})</ng-container>
          </span>

          <div class="grid grid-cols-2 gap-4 w-full border-t border-border pt-4 mt-2">
            <div class="text-center">
              <p class="text-xs text-slate-400">Session Cost</p>
              <p class="text-base font-bold text-slate-900 mt-0.5">{{ coach.price }}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-400">Location</p>
              <p class="text-base font-bold text-slate-900 mt-0.5">{{ coach.distance }}</p>
            </div>
          </div>
        </div>

        <!-- About section -->
        <div class="mb-6">
          <h3 class="app-section-title mb-2">About Coach</h3>
          <p class="text-sm text-slate-600 leading-relaxed">{{ coach.bio }}</p>
        </div>

        <section class="mb-6" *ngIf="coach.gallery?.length">
          <h3 class="app-section-title mb-3">Coaching gallery</h3>
          <div class="coach-gallery-grid">
            <a *ngFor="let item of coach.gallery" [href]="item.url" target="_blank" rel="noopener" class="coach-gallery-item">
              <img *ngIf="item.mimeType?.startsWith('image/')" [src]="item.url" [alt]="item.name || 'Coach gallery photo'" />
              <video *ngIf="item.mimeType?.startsWith('video/')" [src]="item.url" controls playsinline (click)="$event.stopPropagation()"></video>
              <span *ngIf="item.mimeType === 'application/pdf'" class="coach-certificate"><ion-icon name="document-text-outline"></ion-icon>View certificate</span>
            </a>
          </div>
        </section>

        <!-- Specialties section -->
        <div class="mb-6">
          <h3 class="app-section-title mb-3">Specialties</h3>
          <div class="flex flex-wrap gap-2">
            <span *ngFor="let spec of coach.specialties" class="px-3.5 py-1.5 bg-card border border-border rounded-lg text-xs font-semibold text-slate-800">
              {{ spec }}
            </span>
          </div>
        </div>

        <!-- Booking CTA -->
        <div class="cta-box mt-8">
          <button *ngIf="!canChat" (click)="requestToJoin()" [disabled]="requesting || requestSent" class="w-full h-12 mb-3 rounded-full border border-[var(--app-primary)] bg-white text-[#111827] font-bold disabled:opacity-60">
            {{ requestSent ? 'Coaching Request Sent' : requesting ? 'Sending Request…' : 'Request to Join as Student' }}
          </button>
          <button *ngIf="canChat" (click)="openCoachChat()" class="w-full h-12 mb-3 rounded-full border border-[var(--app-primary)] bg-white text-[#111827] font-bold">Chat with Coach</button>
          <button (click)="bookSession()" [disabled]="bookingInProgress" class="w-full h-12 rounded-full bg-gradient-to-r from-[var(--app-primary)] to-[var(--app-primary-to)] text-[#111827] font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-60">
            {{ bookingInProgress ? 'Sending request…' : bookingRequestSent ? 'Open Coach Chat' : 'Book Coaching Session' }}
          </button>
        </div>

      </main>
      </app-brand-header-shell>

      <ion-modal
        [isOpen]="bookingSheetOpen"
        [initialBreakpoint]="1"
        [breakpoints]="[0, 1]"
        class="booking-sheet-modal"
        (didDismiss)="closeBookingSheet()"
      >
        <ng-template>
          <form class="booking-sheet" (ngSubmit)="submitBooking()" novalidate>
            <div class="sheet-head">
              <div>
                <h2>Book a session</h2>
                <p>{{ coach?.name }} will see these details before confirming.</p>
              </div>
              <button type="button" class="sheet-close" aria-label="Close" (click)="closeBookingSheet()">
                <ion-icon name="close"></ion-icon>
              </button>
            </div>

            <label class="field">
              <span>Session date <b>*</b></span>
              <input type="date" name="sessionDate" [(ngModel)]="sessionDate" [min]="today()" required />
            </label>

            <label class="field">
              <span>Time <b>*</b></span>
              <input type="time" name="sessionTime" [(ngModel)]="sessionTime" required />
            </label>

            <div class="field">
              <span>Is it a recurring session? <b>*</b></span>
              <div class="choice-row" role="radiogroup" aria-label="Recurring session">
                <button type="button" role="radio" [attr.aria-checked]="!isRecurring" [class.active]="!isRecurring" (click)="setRecurring(false)">No, one time</button>
                <button type="button" role="radio" [attr.aria-checked]="isRecurring" [class.active]="isRecurring" (click)="setRecurring(true)">Yes, recurring</button>
              </div>
            </div>

            <label class="field" *ngIf="isRecurring">
              <span>End date <b>*</b></span>
              <input type="date" name="recurringEndDate" [(ngModel)]="recurringEndDate" [min]="minEndDate()" required />
            </label>

            <p *ngIf="bookingFormError" class="form-error" role="alert">{{ bookingFormError }}</p>

            <button type="submit" class="sheet-submit" [disabled]="bookingInProgress">
              {{ bookingInProgress ? 'Sending request…' : 'Send booking request' }}
            </button>
          </form>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [
    `
      .rating ion-icon {
        color: #FF7A00;
      }
      .coach-gallery-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
      .coach-gallery-item { display:block; overflow:hidden; min-height:96px; border-radius:12px; background:#f3f4f6; }
      .coach-gallery-item img,.coach-gallery-item video { width:100%; height:104px; display:block; object-fit:cover; }
      .coach-certificate { min-height:96px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; color:#2563eb; font-size:11px; font-weight:700; }
      .coach-certificate ion-icon { font-size:28px; }
      button.bg-gradient-to-r {
        background: linear-gradient(to right, var(--app-primary), var(--app-primary-to)) !important;
      }
      .booking-sheet-modal { --height: auto; --border-radius: 24px 24px 0 0; }
      .booking-sheet { display:flex; flex-direction:column; gap:14px; padding:20px 20px calc(20px + var(--safe-area-bottom)); background:#fff; color:#111827; }
      .sheet-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
      .sheet-head h2 { margin:0; font-size:18px; font-weight:800; }
      .sheet-head p { margin:4px 0 0; color:#6b7280; font-size:12px; line-height:1.4; }
      .sheet-close { width:36px; height:36px; flex:0 0 36px; display:grid; place-items:center; padding:0; border:0; border-radius:12px; background:#f3f4f6; color:#111827; font-size:18px; }
      .field { display:flex; flex-direction:column; gap:6px; }
      .field > span { font-size:13px; font-weight:700; color:#374151; }
      .field b { color:#ef4444; }
      .field input { width:100%; height:48px; padding:0 14px; border:1px solid #e5e7eb; border-radius:14px; background:#f9fafb; color:#111827; font-size:15px; font-family:inherit; box-sizing:border-box; }
      .field input:focus { outline:none; border-color:var(--app-primary); background:#fff; }
      .choice-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      .choice-row button { height:44px; border:1px solid #e5e7eb; border-radius:14px; background:#fff; color:#4b5563; font-size:13px; font-weight:700; }
      .choice-row button.active { border-color:var(--app-primary); background:rgba(var(--app-primary-rgb), 0.14); color:#111827; }
      .form-error { margin:0; padding:10px 12px; border-radius:12px; background:#fef2f2; color:#b91c1c; font-size:12px; font-weight:600; }
      .sheet-submit { height:50px; margin-top:4px; border:0; border-radius:999px; background:linear-gradient(to right, var(--app-primary), var(--app-primary-to)); color:#111827; font-size:15px; font-weight:800; }
      .sheet-submit:disabled { opacity:.6; }
    `
  ]
})
export class CoachProfileDetailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly navigationLocation = inject(Location);
  private readonly coachService = inject(CoachService);
  private readonly chat = inject(ChatService);
  private readonly alertCtrl = inject(AlertController);

  coachId: number | null = null;
  coach: any = null;
  loading = true;
  loadError = '';
  requesting = false;
  requestSent = false;
  canChat = false;
  bookingInProgress = false;
  bookingRequestSent = false;
  bookingChatId: string | null = null;
  bookingSheetOpen = false;
  sessionDate = '';
  sessionTime = '';
  isRecurring = false;
  recurringEndDate = '';
  bookingFormError = '';

  readonly coaches = [
    { id: 1, name: 'Coach Arvind Sharma', sport: 'Cricket', experience: '12+ Yrs Exp', rating: 4.9, avatar: '🏏', distance: '1.5 km', price: '₹800/session', bio: 'Former State level cricketer focusing on batting techniques, stamina building, and match strategy for all age groups.', specialties: ['Batting Stance', 'Spin Tactics', 'Fitness Training', 'Group Scrimmage'] },
    { id: 2, name: 'Coach Rohan Das', sport: 'Football', experience: '8 Yrs Exp', rating: 4.8, avatar: '⚽', distance: '2.8 km', price: '₹1000/session', bio: 'Specialist youth football trainer with tactical certifications. Head of Elite Junior Squad programs.', specialties: ['Dribbling & Pace', 'Midfield Play', 'Tactical Positioning', 'Youth Training'] },
    { id: 3, name: 'Coach Sarah Miller', sport: 'Basketball', experience: '6 Yrs Exp', rating: 4.7, avatar: '🏀', distance: '3.2 km', price: '₹1200/session', bio: 'Dedicated basketball coach specializing in shooting mechanics, dribbling skills, and court positioning workouts.', specialties: ['Shooting Mechanics', 'Dribbling', 'Defense Systems', '1-on-1 Prep'] },
    { id: 4, name: 'Coach Aman Verma', sport: 'Tennis', experience: '10 Yrs Exp', rating: 4.9, avatar: '🎾', distance: '1.1 km', price: '₹1500/session', bio: 'Professional Tennis training focusing on serving techniques, baseline rallies, and reflex speeds.', specialties: ['Serve Form', 'Baseline Rallies', 'Footwork', 'Singles Strategy'] }
  ];

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const idStr = params.get('id');
      if (idStr) {
        this.coachId = +idStr;
        this.loadCoach();
        this.coachService.getMyCoachStudentRequests().subscribe({
          next: (response) => {
            const data: any = response.data;
            const requests = Array.isArray(data) ? data : (data?.data || []);
            const match = requests.find((item: any) => Number(item.coach_id) === this.coachId);
            this.canChat = match?.status === 'accepted';
            this.requestSent = !!match && !this.canChat;
          },
        });
      } else {
        this.loading = false;
      }
    });
  }

  loadCoach() {
    if (!this.coachId) return;
    this.loading = true;
    this.loadError = '';
    this.coachService.getCoach(this.coachId).subscribe({
      next: (response) => {
        this.loading = false;
        const item: any = response.data;
        this.coach = {
          ...item,
          avatar: '👤',
          sport: Array.isArray(item.sports) ? item.sports.join(', ') : (item.sport || 'Multi-sport'),
          specialties: Array.isArray(item.sports) && item.sports.length ? item.sports : ['Coaching program'],
          experience: item.experience || 'Coach',
          bio: item.bio || 'Coach profile information will be available soon.',
          rating: item.rating ?? 'New',
          price: 'Discuss with Coach',
          distance: item.location || 'Location not set',
        };
        if (this.route.snapshot.queryParamMap.get('book') === '1') this.bookSession();
      },
      error: (error) => {
        this.coach = null;
        this.loading = false;
        this.loadError = error?.error?.message || 'This coach profile could not be loaded.';
      },
    });
  }

  back() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.navigationLocation.back();
      return;
    }
    void this.router.navigateByUrl('/app/coaches');
  }

  photo(url?: string | null): string | null {
    return resolveMediaUrl(url);
  }

  bookSession() {
    if (!this.coach || !this.coachId || this.bookingInProgress) return;
    if (this.bookingRequestSent && this.bookingChatId) {
      void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(this.bookingChatId)}`);
      return;
    }
    this.bookingFormError = '';
    this.bookingSheetOpen = true;
  }

  closeBookingSheet() {
    this.bookingSheetOpen = false;
  }

  setRecurring(value: boolean) {
    this.isRecurring = value;
    if (!value) this.recurringEndDate = '';
    this.bookingFormError = '';
  }

  today(): string {
    return this.toDateInput(new Date());
  }

  minEndDate(): string {
    if (!this.sessionDate) return this.today();
    const next = new Date(`${this.sessionDate}T00:00:00`);
    next.setDate(next.getDate() + 1);
    return this.toDateInput(next);
  }

  private validateBookingForm(): string {
    if (!this.sessionDate) return 'Choose a session date.';
    if (this.sessionDate < this.today()) return 'The session date cannot be in the past.';
    if (!this.sessionTime) return 'Choose a session time.';
    if (this.sessionDate === this.today() && new Date(`${this.sessionDate}T${this.sessionTime}:00`) <= new Date()) {
      return 'Choose a time later than now.';
    }
    if (this.isRecurring) {
      if (!this.recurringEndDate) return 'Choose when the recurring sessions should end.';
      if (this.recurringEndDate <= this.sessionDate) return 'The end date must be after the first session date.';
    }
    return '';
  }

  private toDateInput(date: Date): string {
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private readableDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  }

  private readableTime(value: string): string {
    return new Date(`2000-01-01T${value}:00`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  async submitBooking() {
    if (!this.coach || !this.coachId || this.bookingInProgress) return;
    this.bookingFormError = this.validateBookingForm();
    if (this.bookingFormError) return;

    this.bookingInProgress = true;
    let requestWasSent = false;
    const sport = String(this.coach.sport || '').split(',')[0].trim();
    const schedule = this.isRecurring
      ? `starting ${this.readableDate(this.sessionDate)} at ${this.readableTime(this.sessionTime)}, recurring until ${this.readableDate(this.recurringEndDate)}`
      : `on ${this.readableDate(this.sessionDate)} at ${this.readableTime(this.sessionTime)}`;
    const requestMessage = `Hi ${this.coach.name}, I'd like to book a coaching session ${schedule}. Please confirm if this works for you.`;

    try {
      const requestResponse = await firstValueFrom(this.coachService.requestCoachingBooking(this.coachId, {
        sport,
        message: requestMessage,
        requested_date: this.sessionDate,
        requested_start_time: this.sessionTime,
        is_recurring: this.isRecurring,
        recurring_end_date: this.isRecurring ? this.recurringEndDate : null,
      }));
      if (!requestResponse.success) throw new Error(requestResponse.message || 'Unable to send the booking request.');
      requestWasSent = true;
      this.bookingSheetOpen = false;

      const threadResponse = await this.chat.openPrivate({
        id: this.coachId,
        name: this.coach.name,
        avatar: this.coach.profileImage ?? null,
      });
      if (!threadResponse.success || !threadResponse.data?.id) {
        throw new Error(threadResponse.message || 'Unable to open the coach chat.');
      }

      const chatId = threadResponse.data.id;
      const messageResponse = await this.chat.sendMessage(chatId, requestMessage);
      if (!messageResponse.success) {
        throw new Error(messageResponse.message || 'Unable to send the first chat message.');
      }

      this.bookingRequestSent = true;
      this.bookingChatId = chatId;
      await this.showBookingSent(chatId);
    } catch (error: any) {
      const fieldErrors = error?.error?.errors ? ([] as unknown[]).concat(...Object.values(error.error.errors)) : [];
      const detail = String(fieldErrors[0] || error?.error?.message || error?.message || 'Please try again.');
      if (!requestWasSent) {
        this.bookingFormError = detail;
        return;
      }
      const alert = await this.alertCtrl.create({
        header: 'Request sent, chat unavailable',
        message: `Your request is with ${this.coach.name}, but we could not send the first chat message. ${detail}`,
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.bookingInProgress = false;
    }
  }

  private async showBookingSent(chatId: string): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Booking request sent',
      message: 'Booking request sent to ' + this.coach.name + '! They will confirm via Chat.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Proceed', role: 'confirm' },
      ],
      backdropDismiss: false,
    });

    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role === 'confirm') {
      void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(chatId)}`);
    }
  }

  requestToJoin() {
    if (!this.coachId || this.requesting || this.requestSent) return;
    this.requesting = true;
    this.coachService.requestToJoin(this.coachId, { sport: this.coach?.sport, message: 'I would like to join your coaching program.' }).subscribe({
      next: () => { this.requestSent = true; this.requesting = false; },
      error: (error) => { this.requesting = false; alert(error?.error?.message || 'Unable to send your coaching request.'); },
    });
  }

  async openCoachChat() {
    if (!this.coachId || !this.coach) return;
    const result = await this.chat.openPrivate({ id: this.coachId, name: this.coach.name, avatar: this.coach.profileImage ?? null });
    if (result.success && result.data?.id) {
      void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(result.data.id)}`);
      return;
    }
    alert(result.message || 'Unable to open chat.');
  }
}
