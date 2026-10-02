import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { VenueEventRecord, VenueEventService } from '../../core/services/venue-event.service';
import { PageSkeletonComponent } from '../../shared/components/skeleton';

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, IonicModule, PageSkeletonComponent],
  template: `
    <ion-content [fullscreen]="true">
      <main class="event-page">
        <button type="button" class="back-button" (click)="back()">
          <ion-icon name="chevron-back-outline"></ion-icon>
          <span>Events</span>
        </button>

        <app-page-skeleton *ngIf="loading" variant="detail" label="Loading event"></app-page-skeleton>
        <div *ngIf="!loading && errorMessage" class="state error">
          <h2>Couldn't load event</h2>
          <p>{{ errorMessage }}</p>
          <button type="button" class="primary-button" (click)="loadEvent()">Try again</button>
        </div>

        <article *ngIf="!loading && event" class="event-card">
          <img *ngIf="event.coverImage" [src]="event.coverImage" [alt]="event.name || 'Event'" class="cover" />
          <div class="content">
            <span class="eyebrow">{{ event.type | titlecase }}</span>
            <h1>{{ event.name || 'Sports event' }}</h1>
            <p *ngIf="event.description" class="description">{{ event.description }}</p>

            <div class="details">
              <div><ion-icon name="football-outline"></ion-icon><span>{{ event.sport || 'Multiple sports' }}</span></div>
              <div><ion-icon name="calendar-outline"></ion-icon><span>{{ event.eventDate ? (event.eventDate | date:'EEE, d MMM y') : 'Date to be announced' }}</span></div>
              <div><ion-icon name="time-outline"></ion-icon><span>{{ event.startTime || 'Time to be announced' }}<ng-container *ngIf="event.endTime"> – {{ event.endTime }}</ng-container></span></div>
              <div><ion-icon name="location-outline"></ion-icon><span>{{ event.facility || 'Venue details available soon' }}</span></div>
            </div>

            <div class="stats">
              <div><strong>{{ event.registrations }}</strong><span>registered</span></div>
              <div><strong>{{ event.maxParticipants }}</strong><span>max participants</span></div>
              <div><strong>{{ event.entryFee | currency:'INR':'symbol':'1.0-0' }}</strong><span>entry fee</span></div>
            </div>

            <div *ngIf="event.prizePool > 0" class="prize">Prize pool: {{ event.prizePool | currency:'INR':'symbol':'1.0-0' }}</div>
          </div>
        </article>
      </main>
    </ion-content>
  `,
  styles: [`
    :host { display: block; --event-bg: #f8fafc; }
    .event-page { min-height: 100%; padding: 18px 20px 40px; background: var(--event-bg); color: #111827; }
    .back-button { display: flex; align-items: center; gap: 6px; border: 0; background: transparent; color: #334155; font-size: 16px; padding: 8px 0 18px; }
    .state { min-height: 60vh; display: grid; place-content: center; text-align: center; color: #64748b; }
    .state h2 { color: #111827; margin: 0 0 8px; }
    .state p { margin: 0 0 18px; }
    .event-card { overflow: hidden; max-width: 720px; margin: 0 auto; border-radius: 24px; background: white; box-shadow: 0 8px 30px rgba(15, 23, 42, .08); }
    .cover { display: block; width: 100%; height: 220px; object-fit: cover; background: #dbeafe; }
    .content { padding: 24px; }
    .eyebrow { color: #16a34a; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
    h1 { margin: 8px 0 10px; font-size: 30px; line-height: 1.1; }
    .description { color: #64748b; line-height: 1.5; }
    .details { display: grid; gap: 14px; margin: 24px 0; color: #334155; }
    .details div { display: flex; align-items: center; gap: 12px; }
    .details ion-icon { color: #65a30d; font-size: 20px; }
    .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; padding: 16px 0; border-top: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; }
    .stats div { display: grid; gap: 3px; text-align: center; }
    .stats strong { font-size: 18px; }
    .stats span { color: #64748b; font-size: 11px; }
    .prize { margin-top: 18px; color: #166534; font-weight: 700; }
    .primary-button { border: 0; border-radius: 999px; padding: 12px 24px; background: #a3f536; color: #365314; font-weight: 700; }
  `],
})
export class EventDetailPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly events = inject(VenueEventService);

  event: VenueEventRecord | null = null;
  loading = true;
  errorMessage = '';
  private eventId = '';

  ngOnInit(): void {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    void this.loadEvent();
  }

  async loadEvent(): Promise<void> {
    if (!this.eventId) {
      this.errorMessage = 'Event not found.';
      this.loading = false;
      return;
    }
    this.loading = true;
    this.errorMessage = '';
    try {
      const response = await firstValueFrom(this.events.getPublicEvent(this.eventId));
      if (response.success && response.data) this.event = response.data;
      else this.errorMessage = response.message || 'Event not found.';
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Unable to load this event.';
    } finally {
      this.loading = false;
    }
  }

  back(): void {
    void this.router.navigateByUrl('/app/home');
  }
}
