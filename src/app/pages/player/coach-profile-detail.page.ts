import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ActionSheetController, AlertController, IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BackNavigationService } from '../../core/services/back-navigation.service';
import { CoachHistoryEntry, CoachService } from '../../core/services/coach.service';
import { ChatService } from '../../core/services/chat.service';
import { SocialService } from '../../core/services/social.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { PageSkeletonComponent } from '../../shared/components/skeleton';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

type ProfileTab = 'overview' | 'sessions' | 'experience' | 'reviews';
type BookingStep = 'session' | 'time' | 'review' | 'confirmed';

interface GalleryItem { id: number; category: string; url: string; name?: string | null; mimeType?: string | null }
interface AvailabilityDay { date: string; slots: { name: string; hours: string }[] }
interface ReviewItem { id: number; rating: number; comment?: string | null; createdAt?: string | null; player: { name: string; profileImage?: string | null } }
interface SessionOffer { id: string; name: string; copy: string; price: number | null; suffix: string }
interface QuickSlot { date: string; slot: string; label: string; time: string }

interface CoachProfile {
  id: number;
  name: string;
  profileImage?: string | null;
  bio?: string | null;
  sports: string[];
  area?: string | null;
  location?: string | null;
  distanceKm?: number | null;
  rating?: number | null;
  reviewCount: number;
  sessionsCompleted: number;
  activeStudents: number;
  experienceLabel?: string | null;
  experienceYears?: string | null;
  idVerified: boolean;
  certified: boolean;
  pricePerHour?: number | null;
  groupPrice?: number | null;
  feesNegotiable: boolean;
  nextAvailable?: { date: string; slot: string } | null;
  languages: string[];
  sessionTypes: string[];
  achievements: string[];
  gallery: GalleryItem[];
  details: {
    serviceRadius?: string;
    coachingLocations: string[];
    trialEnabled?: boolean | null;
    trialType?: string;
    travelMode?: string;
    weeklyAvailability: Record<string, string[]>;
    feeOptions: Record<string, string | number>;
    specialities: string[];
    coachingLevels: string[];
    coachingHistory: CoachHistoryEntry[];
  };
  partnerVenues: { id: number; name: string; area?: string | null }[];
  upcomingAvailability: AvailabilityDay[];
  reliability: { score: number; completed: number; metrics: { label: string; value: number }[] } | null;
  gamesPlayed: number;
  memberSince?: string | null;
  reviews: ReviewItem[];
  ratingBreakdown: Record<string, number>;
  viewer: {
    isSelf: boolean;
    isStudent: boolean;
    studentRequestStatus: string | null;
    canMessage: boolean;
    canReview: boolean;
    myReview: { rating: number; comment?: string | null } | null;
  };
}

const SLOT_START: Record<string, number> = { Morning: 6, Afternoon: 12, Evening: 17, Night: 21 };
const SLOT_END: Record<string, number> = { Morning: 12, Afternoon: 17, Evening: 21, Night: 24 };
const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

@Component({
  selector: 'app-coach-profile-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, PageSkeletonComponent, BrandHeaderShellComponent],
  template: `
    <ion-content fullscreen class="cp-content">
      <app-brand-header-shell title="Coach Profile" (back)="back()">
        <main class="cp-empty" *ngIf="!coach">
          <app-page-skeleton *ngIf="loading" variant="profile" label="Loading coach profile"></app-page-skeleton>
          <div *ngIf="!loading" class="cp-error" role="alert">
            <p>{{ loadError || 'This coach profile is not available.' }}</p>
            <button type="button" (click)="loadCoach()">Try again</button>
          </div>
        </main>

        <main class="cp-page" *ngIf="coach as c">
          <section class="cp-hero">
            <div class="cp-cover">
              <img *ngIf="coverUrl" [src]="coverUrl" [alt]="c.name + ' coaching'" />
              <div class="cp-cover-shade"></div>
              <div class="cp-cover-actions">
                <button type="button" aria-label="Share coach" (click)="share()"><ion-icon name="share-social-outline"></ion-icon></button>
                <button type="button" *ngIf="!c.viewer.isSelf" aria-label="Coach options" (click)="openMore()"><ion-icon name="ellipsis-horizontal"></ion-icon></button>
              </div>
            </div>
            <div class="cp-identity">
              <div class="cp-photo-row">
                <div class="cp-photo">
                  <img *ngIf="photo(c.profileImage) as src; else initialsTpl" [src]="src" [alt]="c.name" />
                  <ng-template #initialsTpl><span class="cp-initials">{{ initials }}</span></ng-template>
                  <span class="cp-photo-tick" *ngIf="c.idVerified"><ion-icon name="checkmark-circle"></ion-icon></span>
                </div>
                <span class="cp-verified-chip" *ngIf="c.idVerified"><ion-icon name="shield-checkmark-outline"></ion-icon> VERIFIED COACH</span>
              </div>
              <div class="cp-name-row">
                <h1>{{ c.name }}</h1>
                <ion-icon *ngIf="c.idVerified" name="checkmark-circle"></ion-icon>
              </div>
              <p class="cp-sport">{{ primarySport }} Coach</p>
              <p class="cp-specialities" *ngIf="specialityLine">{{ specialityLine }}</p>
              <div class="cp-meta">
                <span *ngIf="c.area || c.location"><ion-icon name="location-outline"></ion-icon>{{ c.area || c.location }}</span>
                <span *ngIf="c.distanceKm !== null && c.distanceKm !== undefined">{{ c.distanceKm }} km away</span>
                <span *ngIf="c.details.serviceRadius">Service radius: {{ c.details.serviceRadius }}</span>
                <span *ngIf="c.languages.length">{{ c.languages.join(' • ') }}</span>
              </div>
            </div>
          </section>

          <div class="cp-summary">
            <div class="cp-tiles">
              <div class="cp-card cp-tile"><b>{{ c.rating ? (c.rating | number: '1.1-1') + '★' : 'NEW' }}</b><span>RATING</span></div>
              <div class="cp-card cp-tile"><b>{{ experienceTile }}</b><span>EXPERIENCE</span></div>
              <div class="cp-card cp-tile"><b>{{ c.sessionsCompleted }}</b><span>SESSIONS</span></div>
              <div class="cp-card cp-tile"><b>{{ c.activeStudents }}</b><span>STUDENTS</span></div>
            </div>
            <div class="cp-card cp-booking-summary">
              <button type="button" (click)="tab = 'sessions'">
                <small>NEXT AVAILABLE</small>
                <strong>{{ nextAvailableLabel }}</strong>
                <em>VIEW SCHEDULE →</em>
              </button>
              <button type="button" (click)="openBooking()" [disabled]="c.viewer.isSelf">
                <small>STARTING FROM</small>
                <strong class="cp-price" *ngIf="startingPrice !== null; else onRequest">₹{{ startingPrice | number }}<span> / SESSION</span></strong>
                <ng-template #onRequest><strong>ON REQUEST</strong></ng-template>
                <em>CHOOSE SESSION →</em>
              </button>
            </div>
          </div>

          <nav class="cp-tabs" aria-label="Coach profile sections">
            <button type="button" *ngFor="let t of tabs" [class.active]="tab === t.id" (click)="tab = t.id">{{ t.label }}</button>
          </nav>

          <!-- OVERVIEW -->
          <div class="cp-panel" *ngIf="tab === 'overview'">
            <section>
              <h2 class="app-section-title">About</h2>
              <div class="cp-card cp-pad"><p class="cp-body">{{ c.bio || 'This coach has not written an introduction yet.' }}</p></div>
            </section>

            <section *ngIf="c.details.specialities.length">
              <h2 class="app-section-title">Specialities</h2>
              <div class="cp-card cp-pad-sm cp-chips">
                <span class="cp-chip cp-chip-green" *ngFor="let item of c.details.specialities">{{ item }}</span>
              </div>
            </section>

            <section *ngIf="c.sports.length">
              <h2 class="app-section-title">Sports</h2>
              <div class="cp-stack">
                <div class="cp-card cp-sport-row" *ngFor="let sport of c.sports; let first = first">
                  <div class="cp-sport-icon" [class.alt]="!first"><ion-icon [name]="sportIcon(sport)"></ion-icon></div>
                  <div>
                    <div class="cp-sport-name"><b>{{ sport }}</b><span *ngIf="first" class="cp-primary">PRIMARY</span></div>
                    <p>{{ first ? (c.experienceLabel || 'Coaching') + (c.experienceYears ? ' • ' + c.experienceYears : '') : 'Also coaches' }}</p>
                  </div>
                </div>
              </div>
            </section>

            <section *ngIf="c.details.coachingLevels.length">
              <h2 class="app-section-title">Who I coach</h2>
              <div class="cp-card cp-pad-sm cp-chips">
                <span class="cp-chip" *ngFor="let item of c.details.coachingLevels">{{ item }}</span>
              </div>
            </section>

            <section *ngIf="sessionTypeTiles.length">
              <h2 class="app-section-title">Session types</h2>
              <div class="cp-grid-2">
                <div class="cp-card cp-type" *ngFor="let item of sessionTypeTiles"><ion-icon [name]="item.icon"></ion-icon><b>{{ item.label }}</b></div>
              </div>
            </section>

            <section *ngIf="locationRows.length">
              <h2 class="app-section-title">Training locations</h2>
              <div class="cp-card cp-rows">
                <div class="cp-row" *ngFor="let row of locationRows"><b>{{ row.value }}</b><span>{{ row.label }}</span></div>
              </div>
            </section>

            <section *ngIf="c.reliability as r">
              <h2 class="app-section-title">Coach reliability</h2>
              <div class="cp-card cp-pad">
                <div class="cp-score">
                  <div><p class="cp-score-value">{{ r.score }}<span> / 100</span></p><p class="cp-muted">Based on {{ r.completed }} recorded session{{ r.completed === 1 ? '' : 's' }}.</p></div>
                  <ion-icon name="shield-checkmark-outline"></ion-icon>
                </div>
                <div class="cp-bars">
                  <div class="cp-bar" *ngFor="let m of r.metrics"><span>{{ m.label }}</span><i><em [style.width.%]="m.value"></em></i><b>{{ m.value }}</b></div>
                </div>
              </div>
            </section>

            <section *ngIf="c.details.trialEnabled && !c.viewer.isSelf">
              <h2 class="app-section-title">Try a session</h2>
              <div class="cp-trial">
                <span class="cp-trial-glow"></span>
                <p class="cp-trial-label">TRIAL SESSION</p>
                <div class="cp-trial-row">
                  <div><p class="cp-trial-title">{{ (c.details.trialType || 'Trial session') | uppercase }}</p><p class="cp-trial-copy">Meet your coach and set your training goals.</p></div>
                  <button type="button" (click)="openBooking('trial')">BOOK TRIAL</button>
                </div>
              </div>
            </section>

            <section *ngIf="mediaItems.length">
              <h2 class="app-section-title">Gallery</h2>
              <div class="cp-gallery">
                <a *ngFor="let item of mediaItems" [href]="item.url" target="_blank" rel="noopener" class="cp-gallery-item">
                  <img *ngIf="item.mimeType?.startsWith('image/')" [src]="item.url" [alt]="item.name || 'Coaching photo'" />
                  <video *ngIf="item.mimeType?.startsWith('video/')" [src]="item.url" controls playsinline (click)="$event.stopPropagation()"></video>
                </a>
              </div>
            </section>
          </div>

          <!-- SESSIONS -->
          <div class="cp-panel" *ngIf="tab === 'sessions'">
            <section>
              <h2 class="app-section-title">Session offerings</h2>
              <div class="cp-stack-lg">
                <div class="cp-card cp-offer" *ngFor="let offer of offers">
                  <div class="cp-offer-head">
                    <div><b>{{ offer.name }}</b><p>{{ offer.copy }}</p></div>
                    <strong>{{ offerPrice(offer) }}<span *ngIf="offer.price">{{ offer.suffix }}</span></strong>
                  </div>
                  <button type="button" *ngIf="!c.viewer.isSelf" (click)="openBooking(offer.id)">BOOK →</button>
                </div>
              </div>
              <p class="cp-note" *ngIf="c.feesNegotiable">Prices can be discussed with the coach.</p>
            </section>

            <section>
              <h2 class="app-section-title">Availability</h2>
              <div class="cp-card cp-rows" *ngIf="c.upcomingAvailability.length; else noAvailability">
                <div class="cp-avail" *ngFor="let day of c.upcomingAvailability">
                  <span>{{ dayLabel(day.date) }}</span>
                  <div>
                    <button type="button" *ngFor="let slot of day.slots" (click)="pickSlotAndBook(day.date, slot.name)" [disabled]="c.viewer.isSelf">{{ slot.name }} · {{ slot.hours }}</button>
                  </div>
                </div>
              </div>
              <ng-template #noAvailability><div class="cp-card cp-pad"><p class="cp-body">This coach has not shared their weekly hours yet. Send a booking request with a time that suits you.</p></div></ng-template>
              <button type="button" class="cp-outline-btn" *ngIf="weekRows.length" (click)="showWeek = !showWeek">{{ showWeek ? 'HIDE FULL SCHEDULE' : 'VIEW FULL SCHEDULE' }}</button>
              <div class="cp-card cp-rows cp-week" *ngIf="showWeek">
                <div class="cp-row" *ngFor="let row of weekRows"><b>{{ row.day }}</b><span>{{ row.slots }}</span></div>
              </div>
            </section>
          </div>

          <!-- EXPERIENCE -->
          <div class="cp-panel" *ngIf="tab === 'experience'">
            <div class="cp-card cp-pad">
              <div class="cp-exp-head">
                <div class="cp-exp-icon"><ion-icon name="school-outline"></ion-icon></div>
                <div><p class="cp-exp-years">{{ c.experienceYears || 'New coach' }}</p><p class="cp-exp-label">{{ (c.experienceLabel || 'Coaching experience') | uppercase }}</p></div>
              </div>
              <p class="cp-body cp-exp-copy" *ngIf="c.memberSince">Coaching on TYNG since {{ c.memberSince | date: 'MMMM yyyy' }}.</p>
            </div>

            <section *ngIf="certificates.length || c.certified">
              <h2 class="app-section-title">Certifications</h2>
              <div class="cp-stack">
                <a class="cp-cert" *ngFor="let cert of certificates" [href]="cert.url" target="_blank" rel="noopener">
                  <div class="cp-cert-icon"><ion-icon name="document-text-outline"></ion-icon></div>
                  <div class="cp-cert-copy"><b>{{ cert.name || 'Coaching certificate' }}</b><p>Uploaded by the coach</p></div>
                  <span [class.verified]="c.certified">{{ c.certified ? 'VERIFIED' : 'VIEW' }}</span>
                </a>
                <div class="cp-cert" *ngIf="!certificates.length && c.certified">
                  <div class="cp-cert-icon"><ion-icon name="document-text-outline"></ion-icon></div>
                  <div class="cp-cert-copy"><b>Coaching certificate</b><p>Checked by TYNG. The document itself stays private.</p></div>
                  <span class="verified">VERIFIED</span>
                </div>
              </div>
            </section>

            <section *ngIf="c.achievements.length">
              <h2 class="app-section-title">Achievements</h2>
              <div class="cp-card cp-pad-sm cp-chips">
                <span class="cp-chip cp-chip-green" *ngFor="let item of c.achievements"><ion-icon name="trophy-outline"></ion-icon>{{ item }}</span>
              </div>
            </section>

            <section *ngIf="c.details.coachingHistory.length">
              <h2 class="app-section-title">Coaching history</h2>
              <div class="cp-card cp-rows">
                <div class="cp-history" *ngFor="let item of c.details.coachingHistory">
                  <div><b>{{ item.place }}</b><span>{{ item.period }}</span></div>
                  <p *ngIf="item.role">{{ item.role }}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 class="app-section-title">Sporting activity</h2>
              <div class="cp-grid-2 cp-gap-lg">
                <div class="cp-card cp-activity"><b>{{ c.gamesPlayed }}</b><span>VERIFIED GAMES PLAYED</span><p>As a player</p></div>
                <div class="cp-card cp-activity"><b>{{ c.sessionsCompleted }}</b><span>COACHING SESSIONS</span><p>Completed</p></div>
              </div>
            </section>
          </div>

          <!-- REVIEWS -->
          <div class="cp-panel" *ngIf="tab === 'reviews'">
            <div class="cp-card cp-pad">
              <div class="cp-score">
                <div>
                  <p class="cp-rating-value">{{ c.rating ? (c.rating | number: '1.1-1') : 'NEW' }} <span>★</span></p>
                  <p class="cp-muted cp-caps">{{ c.reviewCount }} VERIFIED REVIEW{{ c.reviewCount === 1 ? '' : 'S' }}</p>
                </div>
                <ion-icon name="checkmark-circle"></ion-icon>
              </div>
              <div class="cp-bars">
                <div class="cp-bar cp-bar-stars" *ngFor="let star of [5, 4, 3, 2, 1]">
                  <span>{{ star }} star</span><i><em [style.width.%]="breakdownPercent(star)"></em></i><b>{{ c.ratingBreakdown[star] || 0 }}</b>
                </div>
              </div>
            </div>

            <section *ngIf="c.viewer.canReview">
              <h2 class="app-section-title">{{ c.viewer.myReview ? 'Your review' : 'Rate your coach' }}</h2>
              <form class="cp-card cp-pad cp-review-form" (ngSubmit)="submitReview()">
                <div class="cp-star-picker" role="radiogroup" aria-label="Rating">
                  <button type="button" *ngFor="let star of [1, 2, 3, 4, 5]" role="radio" [attr.aria-checked]="reviewRating === star" [attr.aria-label]="star + ' star'" (click)="reviewRating = star">
                    <ion-icon [name]="star <= reviewRating ? 'star' : 'star-outline'"></ion-icon>
                  </button>
                </div>
                <textarea name="reviewComment" [(ngModel)]="reviewComment" maxlength="1000" rows="3" placeholder="How were your sessions with this coach?"></textarea>
                <p class="cp-form-error" *ngIf="reviewError">{{ reviewError }}</p>
                <button type="submit" [disabled]="reviewSaving || !reviewRating">{{ reviewSaving ? 'SAVING…' : c.viewer.myReview ? 'UPDATE REVIEW' : 'POST REVIEW' }}</button>
              </form>
            </section>

            <section>
              <h2 class="app-section-title">Player reviews</h2>
              <div class="cp-stack-lg" *ngIf="c.reviews.length; else noReviews">
                <div class="cp-card cp-review" *ngFor="let review of c.reviews">
                  <div class="cp-review-head">
                    <img *ngIf="photo(review.player.profileImage) as src; else reviewInitial" [src]="src" [alt]="review.player.name" />
                    <ng-template #reviewInitial><span class="cp-review-initial">{{ review.player.name.charAt(0) }}</span></ng-template>
                    <div><b>{{ review.player.name }}</b><div class="cp-review-stars"><ion-icon *ngFor="let s of [1, 2, 3, 4, 5]" [name]="s <= review.rating ? 'star' : 'star-outline'"></ion-icon></div></div>
                    <small>{{ relativeDate(review.createdAt) }}</small>
                  </div>
                  <p class="cp-review-text" *ngIf="review.comment">“{{ review.comment }}”</p>
                  <div class="cp-review-verified"><ion-icon name="checkmark-circle"></ion-icon> VERIFIED SESSION</div>
                </div>
              </div>
              <ng-template #noReviews><div class="cp-card cp-pad"><p class="cp-body">No reviews yet. Players can review this coach after finishing a session with them.</p></div></ng-template>
            </section>
          </div>
        </main>
      </app-brand-header-shell>

      <div slot="fixed" class="cp-action" *ngIf="coach && !coach.viewer.isSelf">
        <div class="cp-action-inner">
          <button type="button" class="cp-action-secondary" *ngIf="canMessage" (click)="openCoachChat()"><ion-icon name="chatbubble-outline"></ion-icon> MESSAGE</button>
          <button type="button" class="cp-action-secondary" *ngIf="!canMessage" (click)="requestToJoin()" [disabled]="requesting || coach.viewer.studentRequestStatus === 'pending'">
            <ion-icon name="person-add-outline"></ion-icon>{{ coach.viewer.studentRequestStatus === 'pending' ? 'REQUEST SENT' : requesting ? 'SENDING…' : 'JOIN AS STUDENT' }}
          </button>
          <button type="button" class="cp-action-primary" (click)="openBooking()"><ion-icon name="calendar-outline"></ion-icon> BOOK SESSION</button>
        </div>
      </div>

      <ion-modal [isOpen]="bookingOpen" [initialBreakpoint]="1" [breakpoints]="[0, 1]" class="cp-sheet-modal" (didDismiss)="closeBooking()">
        <ng-template>
          <div class="cp-sheet" *ngIf="coach as c">
            <div class="cp-sheet-head">
              <div><h2>{{ step === 'confirmed' ? 'REQUEST SENT' : 'BOOK SESSION' }}</h2><p>{{ c.name }} • {{ primarySport }}</p></div>
              <button type="button" aria-label="Close" (click)="closeBooking()"><ion-icon name="close"></ion-icon></button>
            </div>
            <div class="cp-steps" *ngIf="step !== 'confirmed'">
              <span *ngFor="let s of stepOrder; let i = index" [class.done]="stepOrder.indexOf(step) >= i"></span>
            </div>

            <div class="cp-sheet-body" *ngIf="step === 'session'">
              <button type="button" class="cp-option" *ngFor="let offer of offers" [class.active]="selectedOfferId === offer.id" (click)="selectedOfferId = offer.id">
                <span class="cp-radio"><ion-icon *ngIf="selectedOfferId === offer.id" name="checkmark"></ion-icon></span>
                <div><b>{{ offer.name }}</b><p>{{ offer.copy }}</p></div>
                <strong>{{ offerPrice(offer) }}</strong>
              </button>
            </div>

            <div class="cp-sheet-body" *ngIf="step === 'time'">
              <div *ngIf="quickSlots.length">
                <p class="cp-sheet-label">COACH IS AVAILABLE</p>
                <div class="cp-slot-chips">
                  <button type="button" *ngFor="let q of quickSlots" [class.active]="sessionDate === q.date && sessionTime === q.time" (click)="applyQuickSlot(q)">{{ q.label }}</button>
                </div>
              </div>
              <label class="cp-field"><span>Session date <b>*</b></span><input type="date" [(ngModel)]="sessionDate" [min]="today()" /></label>
              <label class="cp-field"><span>Time <b>*</b></span><input type="time" [(ngModel)]="sessionTime" /></label>
              <div class="cp-field">
                <span>Is it a recurring session?</span>
                <div class="cp-choice" role="radiogroup" aria-label="Recurring session">
                  <button type="button" role="radio" [attr.aria-checked]="!isRecurring" [class.active]="!isRecurring" (click)="setRecurring(false)">No, one time</button>
                  <button type="button" role="radio" [attr.aria-checked]="isRecurring" [class.active]="isRecurring" (click)="setRecurring(true)">Yes, recurring</button>
                </div>
              </div>
              <label class="cp-field" *ngIf="isRecurring"><span>End date <b>*</b></span><input type="date" [(ngModel)]="recurringEndDate" [min]="minEndDate()" /></label>
            </div>

            <div class="cp-sheet-body" *ngIf="step === 'review'">
              <div class="cp-review-coach">
                <img *ngIf="photo(c.profileImage) as src; else sheetInitials" [src]="src" [alt]="c.name" />
                <ng-template #sheetInitials><span class="cp-initials cp-initials-sm">{{ initials }}</span></ng-template>
                <div><b>{{ selectedOffer.name }}</b><p>{{ c.name }} • {{ scheduleSummary }}</p></div>
              </div>
              <div class="cp-summary-rows">
                <div><span>SESSION</span><b>{{ selectedOffer.name | titlecase }}</b></div>
                <div><span>WHEN</span><b>{{ scheduleSummary }}</b></div>
                <div><span>PRICE</span><b>{{ offerPrice(selectedOffer) }}{{ selectedOffer.price ? selectedOffer.suffix : '' }}</b></div>
                <div><span>PAYMENT</span><b>Agreed with the coach</b></div>
              </div>
              <p class="cp-fineprint">Your request goes to {{ c.name }}, and a chat opens so you can agree the venue and confirm the time.</p>
            </div>

            <div class="cp-sheet-done" *ngIf="step === 'confirmed'">
              <div class="cp-done-icon"><ion-icon name="checkmark"></ion-icon></div>
              <b>REQUEST SENT</b>
              <p>{{ selectedOffer.name | titlecase }}<br />{{ scheduleSummary }}</p>
              <button type="button" (click)="openBookingChat()">OPEN COACH CHAT</button>
            </div>

            <p class="cp-form-error" *ngIf="bookingError" role="alert">{{ bookingError }}</p>
            <button type="button" class="cp-sheet-cta" *ngIf="step !== 'confirmed'" [disabled]="bookingBusy" (click)="nextStep()">
              {{ step === 'review' ? (bookingBusy ? 'SENDING REQUEST…' : 'SEND BOOKING REQUEST') : 'CONTINUE' }}
            </button>
          </div>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    :host, .cp-sheet { --cp-green:#8CF000; --cp-green-dark:#16A34A; --cp-dark:#111827; --cp-muted:#6B7280; --cp-faint:#9CA3AF; }
    .cp-content { --background:#FAFBFC; }
    .cp-empty { padding:16px 24px; }
    .cp-error { padding:64px 0; text-align:center; color:#64748b; font-size:14px; }
    .cp-error button { margin-top:16px; height:40px; padding:0 20px; border:0; border-radius:12px; background:var(--app-primary); color:var(--cp-dark); font-weight:700; }
    .cp-page { min-height:100%; background:#FAFBFC; padding-bottom:calc(96px + var(--safe-area-bottom)); color:var(--cp-dark); }
    .cp-card { border:1px solid #F0F1F3; border-radius:26px; background:#fff; box-shadow:0 5px 20px rgba(17,24,39,.065); }
    .cp-pad { padding:20px; }
    .cp-pad-sm { padding:16px; }

    .cp-cover { position:relative; height:205px; overflow:hidden; background:linear-gradient(135deg,#111827,#1F2937 55%,#2c3a14); }
    .cp-cover img { width:100%; height:100%; object-fit:cover; display:block; }
    .cp-cover-shade { position:absolute; inset:0; background:linear-gradient(to top,rgba(17,24,39,.9),rgba(17,24,39,.3) 50%,rgba(17,24,39,.15)); }
    .cp-cover-actions { position:absolute; top:16px; right:16px; display:flex; gap:8px; }
    .cp-cover-actions button { width:40px; height:40px; display:grid; place-items:center; border:0; border-radius:50%; background:rgba(255,255,255,.15); color:#fff; font-size:17px; backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
    .cp-identity { position:relative; padding:0 16px 20px; }
    .cp-photo-row { margin-top:-66px; display:flex; align-items:flex-end; justify-content:space-between; }
    .cp-photo { position:relative; width:130px; height:130px; }
    .cp-photo img,.cp-initials { width:130px; height:130px; box-sizing:border-box; border:4px solid #FAFBFC; border-radius:34px; object-fit:cover; object-position:center 20%; box-shadow:0 8px 28px rgba(17,24,39,.2); background:#E5E7EB; }
    .cp-initials { display:grid; place-items:center; color:var(--cp-dark); font-size:44px; font-weight:900; }
    .cp-initials-sm { width:48px; height:48px; border:0; border-radius:16px; font-size:18px; box-shadow:none; }
    .cp-photo-tick { position:absolute; right:-4px; bottom:-4px; width:36px; height:36px; display:grid; place-items:center; border:3px solid #FAFBFC; border-radius:50%; background:var(--cp-green); color:var(--cp-dark); font-size:18px; box-sizing:border-box; }
    .cp-verified-chip { margin-bottom:8px; display:inline-flex; align-items:center; gap:4px; padding:6px 12px; border:1px solid rgba(140,240,0,.3); border-radius:999px; background:#F5FFE8; color:var(--cp-green-dark); font-size:8px; font-weight:900; }
    .cp-name-row { margin-top:16px; display:flex; align-items:center; gap:8px; }
    .cp-name-row h1 { margin:0; font-size:24px; font-weight:900; letter-spacing:-.04em; text-transform:uppercase; line-height:1.1; }
    .cp-name-row ion-icon { flex-shrink:0; color:var(--cp-green-dark); font-size:18px; }
    .cp-sport { margin:4px 0 0; color:var(--cp-green-dark); font-size:10px; font-weight:700; text-transform:capitalize; }
    .cp-specialities { margin:4px 0 0; color:var(--cp-muted); font-size:9px; }
    .cp-meta { margin-top:12px; display:flex; flex-wrap:wrap; gap:8px 12px; color:var(--cp-muted); font-size:8px; font-weight:500; }
    .cp-meta span { display:inline-flex; align-items:center; gap:4px; }
    .cp-meta ion-icon { color:var(--cp-green-dark); font-size:11px; }

    .cp-summary { display:flex; flex-direction:column; gap:12px; padding:0 16px 20px; }
    .cp-tiles { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; }
    .cp-tile { padding:12px 4px; text-align:center; }
    .cp-tile b { display:block; font-size:13px; font-weight:900; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .cp-tile span { display:block; margin-top:4px; color:var(--cp-faint); font-size:6.5px; font-weight:900; line-height:1.2; }
    .cp-booking-summary { display:grid; grid-template-columns:1fr 1fr; overflow:hidden; }
    .cp-booking-summary button { padding:16px; border:0; background:transparent; text-align:left; color:var(--cp-dark); }
    .cp-booking-summary button + button { border-left:1px solid #EEF0F3; }
    .cp-booking-summary button:active { opacity:.75; }
    .cp-booking-summary small { display:block; color:var(--cp-faint); font-size:7px; font-weight:900; }
    .cp-booking-summary strong { display:block; margin-top:4px; font-size:11px; font-weight:900; }
    .cp-booking-summary strong.cp-price { font-size:15px; }
    .cp-booking-summary strong span { color:var(--cp-faint); font-size:7px; }
    .cp-booking-summary em { display:block; margin-top:8px; color:var(--cp-green-dark); font-size:7px; font-weight:900; font-style:normal; }

    .cp-tabs { position:sticky; top:0; z-index:20; display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:8px; padding:10px 16px; border-top:1px solid #EEF0F3; border-bottom:1px solid #EEF0F3; background:rgba(250,251,252,.95); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
    .cp-tabs button { padding:10px 0; border:0; border-radius:999px; background:#fff; color:var(--cp-muted); font-size:8px; font-weight:900; }
    .cp-tabs button.active { background:var(--cp-green); color:var(--cp-dark); box-shadow:0 4px 14px rgba(140,240,0,.22); }

    .cp-panel { display:flex; flex-direction:column; gap:24px; padding:20px 16px; }
    .cp-panel .app-section-title { margin:0 0 14px; }
    .cp-body { margin:0; color:var(--cp-muted); font-size:10px; font-weight:500; line-height:1.6; white-space:pre-line; }
    .cp-muted { margin:4px 0 0; color:var(--cp-muted); font-size:8px; }
    .cp-caps { color:var(--cp-faint); }
    .cp-note { margin:10px 4px 0; color:var(--cp-muted); font-size:9px; }
    .cp-chips { display:flex; flex-wrap:wrap; gap:8px; }
    .cp-chip { display:inline-flex; align-items:center; gap:4px; padding:8px 12px; border-radius:999px; background:#F3F4F6; color:var(--cp-muted); font-size:8px; font-weight:900; }
    .cp-chip-green { border:1px solid rgba(140,240,0,.25); background:#F5FFE8; color:#477315; }
    .cp-stack { display:flex; flex-direction:column; gap:8px; }
    .cp-stack-lg { display:flex; flex-direction:column; gap:12px; }
    .cp-grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .cp-gap-lg { gap:12px; }
    .cp-sport-row { display:flex; align-items:center; gap:12px; padding:16px; }
    .cp-sport-icon { width:44px; height:44px; flex-shrink:0; display:grid; place-items:center; border-radius:16px; background:#F0FDF4; color:var(--cp-green-dark); font-size:19px; }
    .cp-sport-icon.alt { background:#FFF7ED; color:#FF7A00; }
    .cp-sport-name { display:flex; align-items:center; gap:8px; }
    .cp-sport-name b { font-size:11px; font-weight:900; text-transform:capitalize; }
    .cp-primary { padding:2px 8px; border-radius:999px; background:var(--cp-green); font-size:6.5px; font-weight:900; }
    .cp-sport-row p { margin:4px 0 0; color:var(--cp-faint); font-size:8px; }
    .cp-type { display:flex; align-items:center; gap:8px; padding:12px; }
    .cp-type ion-icon { flex-shrink:0; color:var(--cp-green-dark); font-size:14px; }
    .cp-type b { font-size:8px; font-weight:900; }
    .cp-rows { padding:0 16px; }
    .cp-rows > * + * { border-top:1px solid #F3F4F6; }
    .cp-row { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; }
    .cp-row b { font-size:9px; font-weight:900; }
    .cp-row span { color:var(--cp-faint); font-size:8px; text-align:right; }
    .cp-score { display:flex; align-items:flex-end; justify-content:space-between; }
    .cp-score > ion-icon { color:var(--cp-green-dark); font-size:27px; }
    .cp-score-value { margin:0; font-size:34px; font-weight:900; line-height:1; }
    .cp-score-value span,.cp-rating-value span { color:var(--cp-faint); font-size:12px; }
    .cp-rating-value { margin:0; font-size:35px; font-weight:900; line-height:1; }
    .cp-rating-value span { color:#FF7A00; font-size:17px; }
    .cp-bars { margin-top:16px; display:flex; flex-direction:column; gap:12px; }
    .cp-bar { display:grid; grid-template-columns:105px 1fr 25px; align-items:center; gap:8px; }
    .cp-bar span { color:var(--cp-muted); font-size:7.5px; font-weight:700; }
    .cp-bar i { height:6px; overflow:hidden; border-radius:999px; background:#EEF0F3; }
    .cp-bar em { display:block; height:100%; border-radius:999px; background:var(--cp-green); }
    .cp-bar b { text-align:right; font-size:7.5px; font-weight:900; }
    .cp-bar-stars { grid-template-columns:60px 1fr 25px; }
    .cp-trial { position:relative; overflow:hidden; padding:20px; border-radius:26px; background:linear-gradient(135deg,#111827,#1F2937); box-shadow:0 7px 24px rgba(17,24,39,.18); }
    .cp-trial-glow { position:absolute; right:-32px; top:-32px; width:112px; height:112px; border-radius:50%; background:rgba(140,240,0,.1); }
    .cp-trial-label { position:relative; margin:0; color:var(--cp-green); font-size:9px; font-weight:900; letter-spacing:.05em; }
    .cp-trial-row { position:relative; margin-top:12px; display:flex; align-items:flex-end; justify-content:space-between; gap:12px; }
    .cp-trial-title { margin:0; color:#fff; font-size:18px; font-weight:900; }
    .cp-trial-copy { margin:4px 0 0; color:rgba(255,255,255,.45); font-size:8px; }
    .cp-trial button { flex-shrink:0; padding:10px 16px; border:0; border-radius:12px; background:var(--cp-green); color:var(--cp-dark); font-size:8px; font-weight:900; }
    .cp-gallery { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    .cp-gallery-item { display:block; overflow:hidden; border-radius:18px; background:#F3F4F6; }
    .cp-gallery-item img,.cp-gallery-item video { width:100%; height:110px; display:block; object-fit:cover; }

    .cp-offer { padding:16px; }
    .cp-offer-head { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .cp-offer-head b { font-size:10px; font-weight:900; }
    .cp-offer-head p { margin:4px 0 0; color:var(--cp-faint); font-size:8px; }
    .cp-offer-head strong { flex-shrink:0; font-size:14px; font-weight:900; }
    .cp-offer-head strong span { color:var(--cp-faint); font-size:7px; }
    .cp-offer button { margin-top:16px; width:100%; height:40px; border:0; border-radius:16px; background:var(--cp-green); color:var(--cp-dark); font-size:8px; font-weight:900; }
    .cp-avail { display:flex; align-items:center; gap:12px; padding:12px 0; }
    .cp-avail > span { width:76px; flex-shrink:0; color:var(--cp-muted); font-size:8px; font-weight:900; }
    .cp-avail > div { display:flex; flex:1; flex-wrap:wrap; gap:8px; }
    .cp-avail button { padding:8px 12px; border:1px solid rgba(140,240,0,.3); border-radius:999px; background:#F5FFE8; color:#477315; font-size:8px; font-weight:900; }
    .cp-outline-btn { margin-top:12px; width:100%; height:44px; border:1px solid var(--cp-dark); border-radius:16px; background:#fff; color:var(--cp-dark); font-size:8px; font-weight:900; }
    .cp-week { margin-top:12px; }

    .cp-exp-head { display:flex; align-items:center; gap:16px; }
    .cp-exp-icon { width:56px; height:56px; display:grid; place-items:center; border-radius:20px; background:#F5FFE8; color:var(--cp-green-dark); font-size:24px; }
    .cp-exp-years { margin:0; font-size:25px; font-weight:900; line-height:1.1; }
    .cp-exp-label { margin:4px 0 0; color:var(--cp-faint); font-size:8px; font-weight:900; }
    .cp-exp-copy { margin-top:16px; font-size:9px; }
    .cp-cert { display:flex; align-items:center; gap:12px; padding:16px; border:1px solid #F0F1F3; border-radius:22px; background:#fff; box-shadow:0 4px 16px rgba(17,24,39,.055); color:inherit; text-decoration:none; }
    .cp-cert-icon { width:44px; height:44px; flex-shrink:0; display:grid; place-items:center; border-radius:16px; background:#EFF6FF; color:#2563EB; font-size:18px; }
    .cp-cert-copy { flex:1; min-width:0; }
    .cp-cert-copy b { display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-size:10px; font-weight:900; }
    .cp-cert-copy p { margin:4px 0 0; color:var(--cp-faint); font-size:8px; }
    .cp-cert > span { flex-shrink:0; color:var(--cp-muted); font-size:7px; font-weight:900; }
    .cp-cert > span.verified { color:var(--cp-green-dark); }
    .cp-history { padding:16px 0; }
    .cp-history > div { display:flex; align-items:flex-start; justify-content:space-between; gap:12px; }
    .cp-history b { font-size:10px; font-weight:900; }
    .cp-history span { flex-shrink:0; color:var(--cp-faint); font-size:7px; font-weight:700; }
    .cp-history p { margin:4px 0 0; color:var(--cp-muted); font-size:8px; }
    .cp-activity { padding:16px; text-align:center; }
    .cp-activity b { display:block; font-size:23px; font-weight:900; }
    .cp-activity span { display:block; margin-top:4px; color:var(--cp-faint); font-size:7px; font-weight:900; }
    .cp-activity p { margin:4px 0 0; color:var(--cp-muted); font-size:7px; }

    .cp-review-form { display:flex; flex-direction:column; gap:12px; }
    .cp-star-picker { display:flex; gap:6px; }
    .cp-star-picker button { padding:0; border:0; background:transparent; color:#FF7A00; font-size:26px; line-height:1; }
    .cp-review-form textarea { width:100%; box-sizing:border-box; padding:12px; border:1px solid #E5E7EB; border-radius:16px; background:#FAFBFC; color:var(--cp-dark); font:inherit; font-size:12px; resize:vertical; outline:0; }
    .cp-review-form textarea:focus { border-color:var(--cp-green); background:#fff; }
    .cp-review-form button[type=submit] { height:44px; border:0; border-radius:16px; background:var(--cp-green); color:var(--cp-dark); font-size:9px; font-weight:900; }
    .cp-review-form button[type=submit]:disabled { opacity:.5; }
    .cp-review { padding:16px; }
    .cp-review-head { display:flex; align-items:center; gap:12px; }
    .cp-review-head img,.cp-review-initial { width:40px; height:40px; flex-shrink:0; border-radius:50%; object-fit:cover; background:#E5E7EB; }
    .cp-review-initial { display:grid; place-items:center; font-size:15px; font-weight:900; text-transform:uppercase; }
    .cp-review-head > div { flex:1; min-width:0; }
    .cp-review-head b { font-size:10px; font-weight:900; }
    .cp-review-head small { flex-shrink:0; color:var(--cp-faint); font-size:7px; }
    .cp-review-stars { margin-top:4px; display:flex; gap:2px; color:#FF7A00; font-size:9px; }
    .cp-review-text { margin:12px 0 0; color:var(--cp-muted); font-size:9px; line-height:1.6; }
    .cp-review-verified { margin-top:12px; display:flex; align-items:center; gap:4px; color:var(--cp-green-dark); font-size:7px; font-weight:900; }
    .cp-form-error { margin:0; padding:10px 12px; border-radius:12px; background:#FEF2F2; color:#B91C1C; font-size:11px; font-weight:600; }

    .cp-action { left:0; right:0; bottom:var(--app-bottom-chrome-offset, 0px); padding:0 16px calc(12px + var(--app-bottom-chrome-pad, var(--safe-area-bottom))); }
    .cp-action-inner { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding:8px; border:1px solid #EEF0F3; border-radius:24px; background:rgba(255,255,255,.95); box-shadow:0 8px 30px rgba(17,24,39,.14); backdrop-filter:blur(12px); -webkit-backdrop-filter:blur(12px); }
    .cp-action button { height:48px; display:flex; align-items:center; justify-content:center; gap:8px; border-radius:16px; font-size:9px; font-weight:900; }
    .cp-action button ion-icon { font-size:14px; }
    .cp-action-secondary { border:1px solid var(--cp-dark); background:#fff; color:var(--cp-dark); }
    .cp-action-secondary:disabled { opacity:.55; }
    .cp-action-primary { border:0; background:var(--cp-green); color:var(--cp-dark); }

    .cp-sheet-modal { --height:auto; --border-radius:30px 30px 0 0; }
    .cp-sheet { max-height:88vh; overflow-y:auto; padding:20px 20px calc(32px + var(--safe-area-bottom)); background:#fff; color:var(--cp-dark); box-sizing:border-box; }
    .cp-sheet-head { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .cp-sheet-head h2 { margin:0; font-size:16px; font-weight:900; }
    .cp-sheet-head p { margin:4px 0 0; color:var(--cp-muted); font-size:8px; text-transform:capitalize; }
    .cp-sheet-head button { width:36px; height:36px; display:grid; place-items:center; border:0; border-radius:12px; background:#F3F4F6; color:var(--cp-dark); font-size:15px; }
    .cp-steps { margin-top:20px; display:flex; gap:6px; }
    .cp-steps span { flex:1; height:6px; border-radius:999px; background:#E5E7EB; }
    .cp-steps span.done { background:var(--cp-green); }
    .cp-sheet-body { margin-top:20px; display:flex; flex-direction:column; gap:10px; }
    .cp-option { display:flex; align-items:center; gap:12px; width:100%; padding:12px; border:1px solid #E5E7EB; border-radius:16px; background:#fff; color:var(--cp-dark); text-align:left; }
    .cp-option.active { border-color:var(--cp-green); background:#F5FFE8; }
    .cp-option > div { flex:1; min-width:0; }
    .cp-option b { font-size:9px; font-weight:900; }
    .cp-option p { margin:4px 0 0; color:var(--cp-faint); font-size:7.5px; }
    .cp-option strong { flex-shrink:0; font-size:10px; font-weight:900; }
    .cp-radio { width:20px; height:20px; flex-shrink:0; display:grid; place-items:center; box-sizing:border-box; border:1px solid #D1D5DB; border-radius:50%; font-size:12px; }
    .cp-option.active .cp-radio { border-color:var(--cp-green); background:var(--cp-green); }
    .cp-sheet-label { margin:0 0 8px; color:var(--cp-faint); font-size:8px; font-weight:900; }
    .cp-slot-chips { display:flex; flex-wrap:wrap; gap:8px; }
    .cp-slot-chips button { padding:10px 14px; border:1px solid #E5E7EB; border-radius:999px; background:#fff; color:var(--cp-muted); font-size:8px; font-weight:900; }
    .cp-slot-chips button.active { border-color:var(--cp-green); background:var(--cp-green); color:var(--cp-dark); }
    .cp-field { display:flex; flex-direction:column; gap:6px; }
    .cp-field > span { color:#374151; font-size:12px; font-weight:700; }
    .cp-field b { color:#EF4444; }
    .cp-field input { width:100%; height:46px; box-sizing:border-box; padding:0 14px; border:1px solid #E5E7EB; border-radius:14px; background:#F9FAFB; color:var(--cp-dark); font:inherit; font-size:14px; }
    .cp-field input:focus { outline:0; border-color:var(--cp-green); background:#fff; }
    .cp-choice { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
    .cp-choice button { height:42px; border:1px solid #E5E7EB; border-radius:14px; background:#fff; color:#4B5563; font-size:12px; font-weight:700; }
    .cp-choice button.active { border-color:var(--cp-green); background:#F5FFE8; color:var(--cp-dark); }
    .cp-review-coach { display:flex; align-items:center; gap:12px; padding:12px; border-radius:16px; background:#FAFBFC; }
    .cp-review-coach img { width:48px; height:48px; border-radius:16px; object-fit:cover; object-position:top; }
    .cp-review-coach b { font-size:10px; font-weight:900; }
    .cp-review-coach p { margin:4px 0 0; color:var(--cp-muted); font-size:8px; }
    .cp-summary-rows { padding:0 16px; border:1px solid #E5E7EB; border-radius:16px; }
    .cp-summary-rows > div { display:flex; align-items:center; justify-content:space-between; gap:12px; padding:12px 0; }
    .cp-summary-rows > div + div { border-top:1px solid #F3F4F6; }
    .cp-summary-rows span { color:var(--cp-faint); font-size:8px; }
    .cp-summary-rows b { font-size:9px; font-weight:900; text-align:right; }
    .cp-fineprint { margin:2px 0 0; color:var(--cp-faint); font-size:7.5px; line-height:1.6; }
    .cp-sheet-done { padding:32px 0 8px; text-align:center; }
    .cp-done-icon { width:64px; height:64px; margin:0 auto; display:grid; place-items:center; border-radius:50%; background:var(--cp-green); font-size:28px; }
    .cp-sheet-done b { display:block; margin-top:20px; font-size:16px; font-weight:900; }
    .cp-sheet-done p { margin:8px 0 0; color:var(--cp-muted); font-size:9px; line-height:1.6; }
    .cp-sheet-done button { margin-top:24px; width:100%; height:48px; border:0; border-radius:16px; background:var(--cp-dark); color:var(--cp-green); font-size:9px; font-weight:900; }
    .cp-sheet-cta { margin-top:24px; width:100%; height:48px; border:0; border-radius:16px; background:var(--cp-green); color:var(--cp-dark); font-size:9px; font-weight:900; }
    .cp-sheet-cta:disabled { opacity:.6; }
    .cp-sheet .cp-form-error { margin-top:14px; }
  `],
})
export class CoachProfileDetailPage implements OnInit {
  private readonly router = inject(Router);
  readonly backNavigation = inject(BackNavigationService);
  private readonly route = inject(ActivatedRoute);
  private readonly coachService = inject(CoachService);
  private readonly chat = inject(ChatService);
  private readonly social = inject(SocialService);
  private readonly alertCtrl = inject(AlertController);
  private readonly actionSheet = inject(ActionSheetController);
  private readonly toastCtrl = inject(ToastController);

  readonly tabs: { id: ProfileTab; label: string }[] = [
    { id: 'overview', label: 'OVERVIEW' },
    { id: 'sessions', label: 'SESSIONS' },
    { id: 'experience', label: 'EXPERIENCE' },
    { id: 'reviews', label: 'REVIEWS' },
  ];
  readonly stepOrder: BookingStep[] = ['session', 'time', 'review'];

  coachId: number | null = null;
  coach: CoachProfile | null = null;
  loading = true;
  loadError = '';
  tab: ProfileTab = 'overview';
  showWeek = false;
  requesting = false;

  coverUrl: string | null = null;
  primarySport = 'Multi-sport';
  specialityLine = '';
  experienceTile = '—';
  nextAvailableLabel = 'ASK THE COACH';
  startingPrice: number | null = null;
  offers: SessionOffer[] = [];
  sessionTypeTiles: { label: string; icon: string }[] = [];
  locationRows: { value: string; label: string }[] = [];
  certificates: GalleryItem[] = [];
  mediaItems: GalleryItem[] = [];
  weekRows: { day: string; slots: string }[] = [];
  quickSlots: QuickSlot[] = [];

  bookingOpen = false;
  step: BookingStep = 'session';
  selectedOfferId = '';
  sessionDate = '';
  sessionTime = '';
  isRecurring = false;
  recurringEndDate = '';
  bookingError = '';
  bookingBusy = false;
  bookingChatId: string | null = null;

  reviewRating = 0;
  reviewComment = '';
  reviewSaving = false;
  reviewError = '';

  ngOnInit() {
    this.route.paramMap.subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) {
        this.loading = false;
        return;
      }
      this.coachId = id;
      this.loadCoach();
    });
  }

  get initials(): string {
    return (this.coach?.name || 'C').split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join('');
  }

  get canMessage(): boolean {
    return !!this.coach?.viewer.canMessage || !!this.bookingChatId;
  }

  get selectedOffer(): SessionOffer {
    return this.offers.find((offer) => offer.id === this.selectedOfferId) ?? this.offers[0];
  }

  get scheduleSummary(): string {
    if (!this.sessionDate || !this.sessionTime) return '';
    const first = `${this.readableDate(this.sessionDate)} • ${this.readableTime(this.sessionTime)}`;
    return this.isRecurring && this.recurringEndDate ? `${first}, weekly until ${this.readableDate(this.recurringEndDate)}` : first;
  }

  loadCoach() {
    if (!this.coachId) return;
    this.loading = true;
    this.loadError = '';
    this.coachService.getCoach(this.coachId).subscribe({
      next: (response) => {
        this.loading = false;
        if (!response.success || !response.data) {
          this.coach = null;
          this.loadError = response.message || 'This coach profile could not be loaded.';
          return;
        }
        this.applyCoach(this.normalize(response.data));
        if (this.route.snapshot.queryParamMap.get('book') === '1') this.openBooking();
      },
      error: (error) => {
        this.coach = null;
        this.loading = false;
        this.loadError = error?.error?.message || 'This coach profile could not be loaded.';
      },
    });
  }

  private normalize(item: any): CoachProfile {
    const list = (value: unknown): string[] => (Array.isArray(value) ? value.map((v) => String(v)).filter(Boolean) : []);
    const details = item?.details ?? {};
    return {
      ...item,
      sports: list(item?.sports),
      languages: list(item?.languages),
      sessionTypes: list(item?.sessionTypes),
      achievements: list(item?.achievements),
      reviewCount: Number(item?.reviewCount) || 0,
      sessionsCompleted: Number(item?.sessionsCompleted) || 0,
      activeStudents: Number(item?.activeStudents) || 0,
      gamesPlayed: Number(item?.gamesPlayed) || 0,
      gallery: Array.isArray(item?.gallery) ? item.gallery : [],
      partnerVenues: Array.isArray(item?.partnerVenues) ? item.partnerVenues : [],
      upcomingAvailability: Array.isArray(item?.upcomingAvailability) ? item.upcomingAvailability : [],
      reviews: Array.isArray(item?.reviews) ? item.reviews : [],
      ratingBreakdown: item?.ratingBreakdown && typeof item.ratingBreakdown === 'object' ? item.ratingBreakdown : {},
      reliability: item?.reliability ?? null,
      details: {
        ...details,
        coachingLocations: list(details.coachingLocations),
        weeklyAvailability: details.weeklyAvailability && typeof details.weeklyAvailability === 'object' && !Array.isArray(details.weeklyAvailability) ? details.weeklyAvailability : {},
        feeOptions: details.feeOptions && typeof details.feeOptions === 'object' && !Array.isArray(details.feeOptions) ? details.feeOptions : {},
        specialities: list(details.specialities),
        coachingLevels: list(details.coachingLevels),
        coachingHistory: Array.isArray(details.coachingHistory) ? details.coachingHistory.filter((entry: CoachHistoryEntry) => entry?.place) : [],
      },
      viewer: {
        isSelf: !!item?.viewer?.isSelf,
        isStudent: !!item?.viewer?.isStudent,
        studentRequestStatus: item?.viewer?.studentRequestStatus ?? null,
        canMessage: !!item?.viewer?.canMessage,
        canReview: !!item?.viewer?.canReview,
        myReview: item?.viewer?.myReview ?? null,
      },
    };
  }

  private applyCoach(c: CoachProfile): void {
    this.coach = c;
    const images = c.gallery.filter((item) => item.mimeType?.startsWith('image/'));
    this.coverUrl = images.find((item) => item.category === 'training_photo')?.url ?? null;
    this.primarySport = c.sports[0] || 'Multi-sport';
    this.specialityLine = (c.details.specialities.length ? c.details.specialities : c.sessionTypes).slice(0, 4).join(' • ');
    this.experienceTile = c.experienceYears ? c.experienceYears.replace(/\s*years?/i, ' YRS').toUpperCase() : '—';
    this.nextAvailableLabel = c.nextAvailable ? `${this.dayLabel(c.nextAvailable.date)} • ${c.nextAvailable.slot.toUpperCase()}` : 'ASK THE COACH';
    this.offers = this.buildOffers(c);
    const perSession = [this.fee(c, 'individual'), this.fee(c, 'group')].filter((v): v is number => v !== null);
    this.startingPrice = perSession.length ? Math.min(...perSession) : null;
    this.sessionTypeTiles = this.buildSessionTypes(c);
    this.locationRows = [
      ...c.partnerVenues.map((venue) => ({ value: venue.name, label: 'Partner venue' })),
      ...c.details.coachingLocations.map((place) => ({ value: place, label: 'Coaches at' })),
      ...(c.area || c.location ? [{ value: (c.area || c.location) as string, label: 'Based in' }] : []),
      ...(c.details.serviceRadius ? [{ value: c.details.serviceRadius, label: 'Travel radius' }] : []),
    ];
    this.certificates = c.gallery.filter((item) => item.category === 'certificate');
    this.mediaItems = c.gallery.filter((item) => item.category === 'training_photo' || item.category === 'video');
    this.weekRows = WEEK_DAYS
      .map((day) => ({ day, slots: (c.details.weeklyAvailability[day] || []).join(', ') }))
      .filter((row) => row.slots);
    this.quickSlots = this.buildQuickSlots(c);
    this.reviewRating = c.viewer.myReview?.rating ?? 0;
    this.reviewComment = c.viewer.myReview?.comment ?? '';
  }

  private fee(c: CoachProfile, key: string): number | null {
    const value = Number(c.details.feeOptions?.[key]);
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  private buildOffers(c: CoachProfile): SessionOffer[] {
    const offers: SessionOffer[] = [];
    const individual = this.fee(c, 'individual');
    const group = this.fee(c, 'group');
    const monthly = this.fee(c, 'monthly');
    if (individual) offers.push({ id: 'individual', name: '1-TO-1 SESSION', copy: `Personal coaching • ${this.primarySport.replace(/\b\w/g, (ch) => ch.toUpperCase())}`, price: individual, suffix: '' });
    if (group) offers.push({ id: 'group', name: 'GROUP SESSION', copy: 'Train with other players', price: group, suffix: ' / player' });
    if (monthly) offers.push({ id: 'monthly', name: 'MONTHLY PLAN', copy: 'Regular coaching through the month', price: monthly, suffix: ' / month' });
    if (c.details.trialEnabled) offers.push({ id: 'trial', name: 'TRIAL SESSION', copy: c.details.trialType || 'Meet your coach first', price: null, suffix: '' });
    if (!offers.length) offers.push({ id: 'standard', name: 'COACHING SESSION', copy: 'Price agreed with the coach', price: null, suffix: '' });
    return offers;
  }

  private buildSessionTypes(c: CoachProfile): { label: string; icon: string }[] {
    const icons: Record<string, string> = {
      'Individual Coaching': 'person-add-outline', 'Group Sessions': 'people-outline', 'Academy Training': 'school-outline',
      'Corporate Wellness': 'briefcase-outline', 'School Coaching': 'library-outline', 'Weekend Camps': 'flag-outline', 'Holiday Camps': 'sunny-outline',
    };
    const tiles = c.sessionTypes.map((label) => ({ label, icon: icons[label] || 'pulse-outline' }));
    const mode = c.details.travelMode;
    if (mode === 'player' || mode === 'both') tiles.push({ label: 'At Venue', icon: 'location-outline' });
    if (mode === 'i-travel' || mode === 'both') tiles.push({ label: 'Travel to Player', icon: 'car-outline' });
    return tiles;
  }

  private buildQuickSlots(c: CoachProfile): QuickSlot[] {
    const now = new Date();
    const todayIso = this.today();
    const slots: QuickSlot[] = [];
    for (const day of c.upcomingAvailability) {
      for (const slot of day.slots) {
        let hour = SLOT_START[slot.name] ?? 9;
        if (day.date === todayIso && now.getHours() >= hour) hour = Math.min(now.getHours() + 1, (SLOT_END[slot.name] ?? 24) - 1);
        slots.push({ date: day.date, slot: slot.name, label: `${this.dayLabel(day.date, true)} • ${slot.name}`, time: `${String(hour).padStart(2, '0')}:00` });
      }
    }
    return slots.slice(0, 8);
  }

  offerPrice(offer: SessionOffer): string {
    if (offer.price) return `₹${offer.price.toLocaleString('en-IN')}`;
    if (offer.id === 'trial' && /free/i.test(offer.copy)) return 'FREE';
    return 'ON REQUEST';
  }

  breakdownPercent(star: number): number {
    const count = this.coach?.ratingBreakdown[String(star)] || 0;
    const total = this.coach?.reviewCount || 0;
    return total ? Math.round((count / total) * 100) : 0;
  }

  dayLabel(iso: string, title = false): string {
    const today = this.today();
    const tomorrow = this.toDateInput(new Date(Date.now() + 86_400_000));
    const label = iso === today ? 'Today' : iso === tomorrow ? 'Tomorrow' : new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'long' });
    return title ? label : label.toUpperCase();
  }

  relativeDate(value?: string | null): string {
    if (!value) return '';
    const days = Math.floor((Date.now() - new Date(value).getTime()) / 86_400_000);
    if (days < 1) return 'Today';
    if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
    if (days < 30) return `${Math.floor(days / 7)} week${days < 14 ? '' : 's'} ago`;
    if (days < 365) return `${Math.floor(days / 30)} month${days < 60 ? '' : 's'} ago`;
    return new Date(value).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
  }

  sportIcon(sport: string): string {
    const key = sport.toLowerCase();
    if (key.includes('foot') || key.includes('soccer')) return 'football-outline';
    if (key.includes('basket')) return 'basketball-outline';
    if (key.includes('tennis') || key.includes('badminton') || key.includes('pickle') || key.includes('squash')) return 'tennisball-outline';
    if (key.includes('cricket') || key.includes('base')) return 'baseball-outline';
    if (key.includes('golf')) return 'golf-outline';
    if (key.includes('swim')) return 'water-outline';
    return 'trophy-outline';
  }

  back() {
    this.backNavigation.back('/app/coaches');
  }

  photo(url?: string | null): string | null {
    return resolveMediaUrl(url);
  }

  async share(): Promise<void> {
    if (!this.coach) return;
    const url = `${window.location.origin}/app/coaches/${this.coach.id}`;
    const nav = navigator as Navigator & { share?: (data: ShareData) => Promise<void> };
    if (nav.share) {
      try {
        await nav.share({ title: this.coach.name, text: `${this.coach.name} • ${this.primarySport} coach on TYNG`, url });
      } catch { /* dismissed */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      await this.toast('Profile link copied');
    } catch {
      await this.toast(url);
    }
  }

  async openMore(): Promise<void> {
    if (!this.coach) return;
    const sheet = await this.actionSheet.create({
      header: 'Coach options',
      buttons: [
        { text: 'Block coach', role: 'destructive', icon: 'ban-outline', handler: () => { void this.confirmBlock(); } },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private async confirmBlock(): Promise<void> {
    if (!this.coach) return;
    const coach = this.coach;
    const alert = await this.alertCtrl.create({
      header: `Block ${coach.name}?`,
      message: 'They will not be able to message you, and you will not see each other in chat.',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Block', role: 'destructive' },
      ],
    });
    await alert.present();
    const { role } = await alert.onDidDismiss();
    if (role !== 'destructive') return;
    try {
      const result = await firstValueFrom(this.social.blockUser(String(coach.id)));
      if (!result.success) throw new Error(result.message);
      await this.toast(`${coach.name} is blocked`);
      this.back();
    } catch (error: any) {
      await this.toast(error?.error?.message || error?.message || 'Could not block this coach.');
    }
  }

  openBooking(offerId?: string) {
    if (!this.coach || this.coach.viewer.isSelf) return;
    this.selectedOfferId = offerId && this.offers.some((offer) => offer.id === offerId) ? offerId : this.offers[0]?.id ?? '';
    this.bookingError = '';
    this.step = 'session';
    this.bookingOpen = true;
  }

  pickSlotAndBook(date: string, slot: string) {
    this.openBooking();
    const quick = this.quickSlots.find((q) => q.date === date && q.slot === slot);
    if (quick) this.applyQuickSlot(quick);
  }

  applyQuickSlot(slot: QuickSlot) {
    this.sessionDate = slot.date;
    this.sessionTime = slot.time;
    this.bookingError = '';
  }

  closeBooking() {
    this.bookingOpen = false;
    if (this.step === 'confirmed') this.step = 'session';
  }

  setRecurring(value: boolean) {
    this.isRecurring = value;
    if (!value) this.recurringEndDate = '';
    this.bookingError = '';
  }

  async nextStep(): Promise<void> {
    this.bookingError = '';
    if (this.step === 'session') {
      this.step = 'time';
      return;
    }
    if (this.step === 'time') {
      this.bookingError = this.validateBookingForm();
      if (!this.bookingError) this.step = 'review';
      return;
    }
    await this.submitBooking();
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
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  private readableTime(value: string): string {
    return new Date(`2000-01-01T${value}:00`).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  private async submitBooking(): Promise<void> {
    if (!this.coach || !this.coachId || this.bookingBusy) return;
    this.bookingError = this.validateBookingForm();
    if (this.bookingError) {
      this.step = 'time';
      return;
    }

    const coach = this.coach;
    const offer = this.selectedOffer;
    this.bookingBusy = true;
    let requestWasSent = false;
    const priceText = offer.price ? ` (${this.offerPrice(offer)}${offer.suffix})` : '';
    const schedule = this.isRecurring
      ? `starting ${this.readableDate(this.sessionDate)} at ${this.readableTime(this.sessionTime)}, recurring until ${this.readableDate(this.recurringEndDate)}`
      : `on ${this.readableDate(this.sessionDate)} at ${this.readableTime(this.sessionTime)}`;
    const requestMessage = `Hi ${coach.name}, I'd like to book a ${offer.name.toLowerCase()}${priceText} ${schedule}. Please confirm if this works for you.`;

    try {
      const requestResponse = await firstValueFrom(this.coachService.requestCoachingBooking(this.coachId, {
        sport: this.primarySport,
        message: requestMessage,
        requested_date: this.sessionDate,
        requested_start_time: this.sessionTime,
        is_recurring: this.isRecurring,
        recurring_end_date: this.isRecurring ? this.recurringEndDate : null,
      }));
      if (!requestResponse.success) throw new Error(requestResponse.message || 'Unable to send the booking request.');
      requestWasSent = true;
      coach.viewer.canMessage = true;

      const threadResponse = await this.chat.openPrivate({ id: this.coachId, name: coach.name, avatar: coach.profileImage ?? null });
      if (!threadResponse.success || !threadResponse.data?.id) throw new Error(threadResponse.message || 'Unable to open the coach chat.');
      const chatId = threadResponse.data.id;
      const messageResponse = await this.chat.sendMessage(chatId, requestMessage);
      if (!messageResponse.success) throw new Error(messageResponse.message || 'Unable to send the first chat message.');

      this.bookingChatId = chatId;
      this.step = 'confirmed';
    } catch (error: any) {
      const fieldErrors = error?.error?.errors ? ([] as unknown[]).concat(...Object.values(error.error.errors)) : [];
      const detail = String(fieldErrors[0] || error?.error?.message || error?.message || 'Please try again.');
      if (!requestWasSent) {
        this.bookingError = detail;
        return;
      }
      this.bookingOpen = false;
      const alert = await this.alertCtrl.create({
        header: 'Request sent, chat unavailable',
        message: `Your request is with ${coach.name}, but we could not send the first chat message. ${detail}`,
        buttons: ['OK'],
      });
      await alert.present();
    } finally {
      this.bookingBusy = false;
    }
  }

  openBookingChat() {
    const chatId = this.bookingChatId;
    this.bookingOpen = false;
    this.step = 'session';
    if (chatId) void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(chatId)}`);
  }

  requestToJoin() {
    const coach = this.coach;
    if (!this.coachId || !coach || this.requesting || coach.viewer.studentRequestStatus === 'pending') return;
    this.requesting = true;
    this.coachService.requestToJoin(this.coachId, { sport: this.primarySport, message: 'I would like to join your coaching program.' }).subscribe({
      next: () => {
        coach.viewer.studentRequestStatus = 'pending';
        this.requesting = false;
        void this.toast(`Request sent to ${coach.name}`);
      },
      error: (error) => {
        this.requesting = false;
        void this.toast(error?.error?.message || 'Unable to send your coaching request.');
      },
    });
  }

  async openCoachChat() {
    if (!this.coachId || !this.coach) return;
    if (this.bookingChatId) {
      void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(this.bookingChatId)}`);
      return;
    }
    const result = await this.chat.openPrivate({ id: this.coachId, name: this.coach.name, avatar: this.coach.profileImage ?? null });
    if (result.success && result.data?.id) {
      void this.router.navigateByUrl(`/app/chat/${encodeURIComponent(result.data.id)}`);
      return;
    }
    await this.toast(result.message || 'Unable to open chat.');
  }

  submitReview() {
    if (!this.coachId || !this.reviewRating || this.reviewSaving) return;
    this.reviewSaving = true;
    this.reviewError = '';
    this.coachService.submitCoachReview(this.coachId, { rating: this.reviewRating, comment: this.reviewComment.trim() || undefined }).subscribe({
      next: (response) => {
        this.reviewSaving = false;
        if (!response.success) {
          this.reviewError = response.message || 'Could not save your review.';
          return;
        }
        void this.toast(response.message || 'Thanks for your review.');
        this.loadCoach();
      },
      error: (error) => {
        this.reviewSaving = false;
        const fieldErrors = error?.error?.errors ? ([] as unknown[]).concat(...Object.values(error.error.errors)) : [];
        this.reviewError = String(fieldErrors[0] || error?.error?.message || 'Could not save your review.');
      },
    });
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 2200, position: 'bottom' });
    await toast.present();
  }
}
