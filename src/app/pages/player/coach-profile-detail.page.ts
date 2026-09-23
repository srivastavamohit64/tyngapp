import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController, IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { CoachService } from '../../core/services/coach.service';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-coach-profile-detail',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-top page-with-tab-bar px-6 py-4 bg-background text-foreground" *ngIf="coach">
        
        <!-- Header -->
        <header class="flex items-center justify-between mb-6">
          <button (click)="back()" class="h-10 w-10 grid place-items-center rounded-full bg-card border border-border">
            <ion-icon name="chevron-back-outline" class="text-xl"></ion-icon>
          </button>
          <h1 class="text-lg font-bold text-center flex-1">Coach Profile</h1>
          <div class="w-10"></div>
        </header>

        <!-- Profile Detail Card -->
        <div class="bg-card border border-border rounded-2xl p-6 mb-6 flex flex-col items-center text-center">
          <div class="h-24 w-24 rounded-full bg-slate-100 flex items-center justify-center text-5xl shadow-md mb-4 animate-bounce">
            {{ coach.avatar }}
          </div>
          <h2 class="text-xl font-bold text-slate-900 mb-1">{{ coach.name }}</h2>
          <p class="text-xs font-bold text-primary mb-3 uppercase tracking-wide">{{ coach.sport }} • {{ coach.experience }}</p>
          <span class="rating flex items-center gap-1.5 text-sm font-bold text-secondary mb-4">
            <ion-icon name="star"></ion-icon>
            {{ coach.rating }} (48 Reviews)
          </span>

          <div class="grid grid-cols-2 gap-4 w-full border-t border-border pt-4 mt-2">
            <div class="text-center">
              <p class="text-xs text-slate-400">Session Cost</p>
              <p class="text-base font-bold text-slate-900 mt-0.5">{{ coach.price }}</p>
            </div>
            <div class="text-center">
              <p class="text-xs text-slate-400">Location</p>
              <p class="text-base font-bold text-slate-900 mt-0.5">{{ coach.distance }} away</p>
            </div>
          </div>
        </div>

        <!-- About section -->
        <div class="mb-6">
          <h3 class="text-base font-bold text-slate-900 mb-2">About Coach</h3>
          <p class="text-sm text-slate-600 leading-relaxed">{{ coach.bio }}</p>
        </div>

        <section class="mb-6" *ngIf="coach.gallery?.length">
          <h3 class="text-base font-bold text-slate-900 mb-3">Coaching gallery</h3>
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
          <h3 class="text-base font-bold text-slate-900 mb-3">Specialties</h3>
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
    </ion-content>
  `,
  styles: [
    `
      .rating ion-icon {
        color: #FF7A00;
      }
      .coach-gallery-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .coach-gallery-item { display:block; overflow:hidden; min-height:120px; border-radius:16px; background:#f3f4f6; }
      .coach-gallery-item img,.coach-gallery-item video { width:100%; height:140px; display:block; object-fit:cover; }
      .coach-certificate { min-height:120px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px; color:#2563eb; font-size:12px; font-weight:700; }
      .coach-certificate ion-icon { font-size:28px; }
      button.bg-gradient-to-r {
        background: linear-gradient(to right, var(--app-primary), var(--app-primary-to)) !important;
      }
    `
  ]
})
export class CoachProfileDetailPage implements OnInit {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly coachService = inject(CoachService);
  private readonly chat = inject(ChatService);
  private readonly alertCtrl = inject(AlertController);

  coachId: number | null = null;
  coach: any = null;
  requesting = false;
  requestSent = false;
  canChat = false;
  bookingInProgress = false;
  bookingRequestSent = false;
  bookingChatId: string | null = null;

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
        this.coachService.getCoach(this.coachId).subscribe({
          next: (response) => {
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
          },
          error: () => { this.coach = null; },
        });
        this.coachService.getMyCoachStudentRequests().subscribe({
          next: (response) => {
            const data: any = response.data;
            const requests = Array.isArray(data) ? data : (data?.data || []);
            const match = requests.find((item: any) => Number(item.coach_id) === this.coachId);
            this.canChat = match?.status === 'accepted';
            this.requestSent = !!match && !this.canChat;
          },
        });
      }
    });
  }

  back() {
    this.router.navigateByUrl('/app/coaches');
  }

  async bookSession() {
    if (!this.coach || !this.coachId || this.bookingInProgress) return;
    if (this.bookingRequestSent && this.bookingChatId) {
      void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(this.bookingChatId)}`);
      return;
    }

    this.bookingInProgress = true;
    let requestWasSent = false;
    const sport = String(this.coach.sport || '').split(',')[0].trim();
    const requestMessage = `Hi ${this.coach.name}, I'd like to book a coaching session with you. Please let me know your availability and confirm the details.`;

    try {
      const requestResponse = await firstValueFrom(this.coachService.requestCoachingBooking(this.coachId, {
        sport,
        message: requestMessage,
      }));
      if (!requestResponse.success) throw new Error(requestResponse.message || 'Unable to send the booking request.');
      requestWasSent = true;

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
      const detail = error?.error?.message || error?.message || 'Please try again.';
      const alert = await this.alertCtrl.create({
        header: requestWasSent ? 'Request sent, chat unavailable' : 'Booking request not sent',
        message: requestWasSent
          ? `Your request is with ${this.coach.name}, but we could not send the first chat message. ${detail}`
          : detail,
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
