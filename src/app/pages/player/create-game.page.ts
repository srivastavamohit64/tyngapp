import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, QueryList, ViewChildren, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { BookingService } from '../../core/services/booking.service';
import { DesignDataService } from '../../core/services/design-data.service';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { PrimaryButtonComponent } from '../../shared/components/primary-button/primary-button.component';
import { Venue } from '../../shared/models/app.models';

interface VenueApi {
  id: number;
  name: string;
  location?: string | null;
  distance?: string | null;
  price?: number | null;
  rating?: number | null;
  emoji?: string | null;
  sports?: string[] | null;
}

interface DateOption {
  key: string;
  label: string;
  subLabel: string;
  date: Date;
  isToday: boolean;
}

@Component({
  selector: 'app-create-game',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderComponent, PrimaryButtonComponent],
  template: `
    <ion-content fullscreen>
      <div class="create-page page-safe-bottom">
        <app-header
          variant="page"
          title="Create Game"
          [subtitle]="'Step ' + currentStep + ' of ' + steps.length"
          [showBack]="true"
          [hasProjectedEnd]="true"
          (back)="back()"
        >
          <button type="button" class="icon-btn" (click)="next()" [disabled]="!canProceed()">
            <ion-icon name="chevron-forward"></ion-icon>
          </button>
        </app-header>

        <div class="stepper">
          <div class="step-row">
            <ng-container *ngFor="let step of steps; let i = index; let last = last">
              <div
                class="step-dot"
                [class.active]="currentStep === step.id"
                [class.done]="currentStep > step.id"
              >
                <ion-icon [name]="currentStep > step.id ? 'checkmark' : step.icon"></ion-icon>
              </div>
              <div class="step-line" *ngIf="!last" [class.done]="currentStep > step.id"></div>
            </ng-container>
          </div>
          <strong>{{ activeStepName }}</strong>
        </div>

        <section class="content">
          <!-- Step 1: Sport -->
          <ng-container *ngIf="currentStep === 1">
            <h3>Select Sport</h3>
            <p class="muted">Choose what you want to play</p>
            <div class="grid-2">
              <button
                type="button"
                class="picker"
                *ngFor="let sport of data.sports"
                [class.selected]="selectedSport === sport.id"
                (click)="selectSport(sport.id)"
              >
                <div class="emoji">{{ sport.emoji }}</div>
                <strong>{{ sport.name }}</strong>
                <span class="caption">{{ sport.players }}</span>
              </button>
            </div>
          </ng-container>

          <!-- Step 2: Venue -->
          <ng-container *ngIf="currentStep === 2">
            <h3>Choose Venue</h3>
            <p class="muted">Select a venue for your match</p>
            <div class="list">
              <div class="muted" *ngIf="venuesLoading">Loading venues...</div>
              <div class="muted" *ngIf="!venuesLoading && venues.length === 0">No venues available.</div>
              <button
                type="button"
                class="venue-row"
                *ngFor="let venue of venues"
                [class.selected]="selectedVenue === venue.id"
                (click)="selectedVenue = venue.id"
              >
                <div class="venue-emoji">{{ venue.emoji || '🏟️' }}</div>
                <div class="venue-info">
                  <strong>{{ venue.name }}</strong>
                  <span>
                    {{ venue.location || '—' }}
                    <ng-container *ngIf="venue.distance"> · {{ venue.distance }}</ng-container>
                  </span>
                </div>
                <strong class="price" *ngIf="venue.price !== null && venue.price !== undefined">₹{{ venue.price }}/hr</strong>
                <strong class="price" *ngIf="venue.price === null || venue.price === undefined">—</strong>
              </button>
            </div>
          </ng-container>

          <!-- Step 3: Date & Time -->
          <ng-container *ngIf="currentStep === 3">
            <h3>Date &amp; Time</h3>
            <p class="muted">When do you want to play?</p>
            <div class="chip-row">
              <button
                type="button"
                class="chip date-chip"
                *ngFor="let d of dateOptions; let i = index"
                [class.active]="selectedDateKey === d.key"
                (click)="selectDate(d)"
                #dateChip
              >
                <span class="chip-label">{{ d.label }}</span>
                <span class="chip-sub">{{ d.subLabel }}</span>
              </button>
            </div>
            <div class="chip-row mt">
              <button
                type="button"
                class="chip"
                *ngFor="let t of timeSlots"
                [class.active]="selectedTime === t"
                (click)="selectTime(t)"
              >
                {{ t }}
              </button>
            </div>
          </ng-container>

          <!-- Step 4: Team Size -->
          <ng-container *ngIf="currentStep === 4">
            <h3>Team Size</h3>
            <p class="muted">How many players per side?</p>
            <div class="grid-2">
              <button
                type="button"
                class="picker"
                *ngFor="let size of teamSizes"
                [class.selected]="selectedTeamSize === size"
                (click)="selectedTeamSize = size"
              >
                <ion-icon name="people-outline" class="size-icon"></ion-icon>
                <strong>{{ size }}</strong>
              </button>
            </div>
          </ng-container>

          <!-- Step 5: Confirm -->
          <ng-container *ngIf="currentStep === 5">
            <h3>Confirm Match</h3>
            <p class="muted">Review your game details</p>
            <div class="summary-card">
              <div class="sum-row"><span>Sport</span><strong>{{ sportName }}</strong></div>
              <div class="sum-row"><span>Venue</span><strong>{{ venueName }}</strong></div>
              <div class="sum-row"><span>When</span><strong>{{ selectedDateDisplay }} · {{ selectedTime }}</strong></div>
              <div class="sum-row"><span>Format</span><strong>{{ selectedTeamSize }}</strong></div>
            </div>
            <app-primary-button icon="checkmark-circle" [disabled]="submitting" (pressed)="confirm()">
              {{ submitting ? 'Creating...' : 'Create Game' }}
            </app-primary-button>
          </ng-container>
        </section>

        <div class="footer-cta" *ngIf="currentStep < 5">
          <app-primary-button icon="arrow-forward" [disabled]="!canProceed()" (pressed)="next()">
            Continue
          </app-primary-button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .create-page {
        min-height: 100%;
        background: #fafbfc;
      }

      .icon-btn {
        width: 40px;
        height: 40px;
        min-height: unset;
        border-radius: 12px;
        display: grid;
        place-items: center;
        background: #f3f4f6;
        color: #111827;
        font-size: 20px;
        padding: 0;
      }

      .icon-btn:disabled {
        opacity: 0.35;
      }

      .stepper {
        padding: 20px 24px 8px;
      }

      .step-row {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
      }

      .step-dot {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: #f3f4f6;
        color: #9ca3af;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        font-size: 16px;
      }

      .step-dot.active {
        background: #8cf000;
        color: #111827;
        box-shadow: 0 2px 10px rgba(140, 240, 0, 0.4);
      }

      .step-dot.done {
        background: #111827;
        color: #8cf000;
      }

      .step-line {
        flex: 1;
        height: 3px;
        background: #f3f4f6;
        margin: 0 4px;
        border-radius: 2px;
      }

      .step-line.done {
        background: #8cf000;
      }

      .stepper strong {
        font-size: 14px;
        color: #111827;
      }

      .content {
        padding: 8px 24px 24px;
      }

      h3 {
        margin: 0 0 4px;
        font-size: 20px;
        font-weight: 600;
        color: #111827;
      }

      .muted {
        margin: 0 0 20px;
        color: #6b7280;
        font-size: 14px;
      }

      .grid-2 {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .picker {
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 20px;
        padding: 20px 12px;
        text-align: center;
        min-height: unset;
      }

      .picker.selected {
        border-color: #8cf000;
        background: rgba(140, 240, 0, 0.08);
        box-shadow: 0 4px 16px rgba(140, 240, 0, 0.15);
      }

      .emoji {
        font-size: 36px;
        margin-bottom: 8px;
      }

      .picker strong {
        display: block;
        color: #111827;
        font-size: 14px;
      }

      .caption {
        display: block;
        margin-top: 4px;
        font-size: 12px;
        color: #9ca3af;
      }

      .size-icon {
        font-size: 28px;
        color: #8cf000;
        margin-bottom: 8px;
      }

      .list {
        display: flex;
        flex-direction: column;
        gap: 10px;
      }

      .venue-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px;
        background: #fff;
        border: 1.5px solid #e5e7eb;
        border-radius: 16px;
        text-align: left;
        min-height: unset;
        width: 100%;
      }

      .venue-row.selected {
        border-color: #8cf000;
        background: rgba(140, 240, 0, 0.06);
      }

      .venue-emoji {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #f3f4f6;
        display: grid;
        place-items: center;
        font-size: 24px;
        flex-shrink: 0;
      }

      .venue-info {
        flex: 1;
        min-width: 0;
      }

      .venue-info strong {
        display: block;
        font-size: 14px;
        color: #111827;
      }

      .venue-info span {
        font-size: 12px;
        color: #9ca3af;
      }

      .price {
        color: #8cf000;
        font-size: 13px;
        white-space: nowrap;
      }

      .chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .chip-row.mt {
        margin-top: 16px;
      }

      .chip {
        padding: 10px 16px;
        border-radius: 12px;
        background: #fff;
        border: 1.5px solid #e5e7eb;
        color: #6b7280;
        font-size: 14px;
        font-weight: 600;
        min-height: unset;
        transition: transform 180ms ease, background 180ms ease, border-color 180ms ease, color 180ms ease;
      }

      .chip.active {
        background: #8cf000;
        border-color: #8cf000;
        color: #111827;
        transform: translateY(-1px) scale(1.02);
      }

      .date-chip {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 2px;
        min-width: 72px;
      }

      .chip-label {
        font-size: 13px;
        font-weight: 700;
      }

      .chip-sub {
        font-size: 11px;
        color: #9ca3af;
      }

      .chip.active .chip-sub {
        color: #111827;
        opacity: 0.8;
      }

      .summary-card {
        background: #fff;
        border-radius: 20px;
        padding: 20px;
        border: 1px solid #e5e7eb;
        margin-bottom: 20px;
      }

      .sum-row {
        display: flex;
        justify-content: space-between;
        padding: 10px 0;
        border-bottom: 1px solid #f3f4f6;
        font-size: 14px;
      }

      .sum-row:last-child {
        border-bottom: none;
      }

      .sum-row span {
        color: #9ca3af;
      }

      .sum-row strong {
        color: #111827;
      }

      .footer-cta {
        padding: 0 24px 24px;
      }

      .footer-cta ::ng-deep .btn,
      .content ::ng-deep app-primary-button .btn {
        border-radius: 999px;
        min-height: 56px;
      }
    `,
  ],
})
export class CreateGamePage implements OnInit {
  private readonly router = inject(Router);
  readonly data = inject(DesignDataService);
  private readonly api = inject(ApiService);
  private readonly bookingService = inject(BookingService);
  private readonly toastCtrl = inject(ToastController);

  @ViewChildren('dateChip') dateChips?: QueryList<ElementRef<HTMLElement>>;

  submitting = false;
  venues: Venue[] = [];
  venuesLoading = false;

  openingTime = '06:00';
  closingTime = '20:00';
  slotIntervalMinutes = 60;

  dateOptions: DateOption[] = [];
  timeSlots: string[] = [];
  selectedDateKey = '';
  selectedDateLabel = '';

  currentStep = 1;
  steps = [
    { id: 1, name: 'Sport', icon: 'trophy-outline' },
    { id: 2, name: 'Venue', icon: 'location-outline' },
    { id: 3, name: 'Date', icon: 'calendar-outline' },
    { id: 4, name: 'Team', icon: 'people-outline' },
    { id: 5, name: 'Confirm', icon: 'checkmark-circle-outline' },
  ];

  selectedSport = '';
  selectedVenue: number | string = '';
  selectedTime = '';
  selectedTeamSize = '';

  teamSizes = ['5v5', '7v7', '11v11', 'Custom'];

  get activeStepName() {
    return this.steps[this.currentStep - 1]?.name;
  }

  get sportName() {
    return this.data.sports.find((s) => s.id === this.selectedSport)?.name || '—';
  }

  get venueName() {
    return this.venues.find((v) => v.id === this.selectedVenue)?.name || '—';
  }

  get selectedDateDisplay() {
    return this.selectedDateLabel || '—';
  }

  ngOnInit() {
    this.venues = [...this.data.venues];
    void this.loadVenues();
    this.initializeDates();
  }

  private async loadVenues() {
    this.venuesLoading = true;
    try {
      const response = await firstValueFrom(this.api.get<VenueApi[]>('/venues'));
      if (response.success && Array.isArray(response.data)) {
        this.venues = response.data.map((venue) => ({
          id: venue.id,
          name: venue.name,
          location: venue.location ?? undefined,
          distance: venue.distance ?? null,
          price: venue.price ?? null,
          rating: venue.rating ?? null,
          emoji: venue.emoji ?? '🏟️',
          sports: venue.sports ?? [],
        }));
      }
    } catch (e) {
      console.error('Failed to load venues', e);
    } finally {
      this.venuesLoading = false;
    }
  }

  private initializeDates() {
    this.dateOptions = this.buildDateOptions();
    const todayOption = this.dateOptions[0];
    if (todayOption) {
      this.selectDate(todayOption, false);
    }
  }

  private buildDateOptions(): DateOption[] {
    const today = this.startOfDay(new Date());
    const options: DateOption[] = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : this.formatWeekday(date);
      options.push({
        key: this.formatDateKey(date),
        label,
        subLabel: this.formatShortDate(date),
        date,
        isToday: i === 0,
      });
    }
    return options;
  }

  selectDate(option: DateOption, scrollIntoView = true) {
    this.selectedDateKey = option.key;
    this.selectedDateLabel = `${option.label} · ${option.subLabel}`;
    this.generateSlots(option);
    if (scrollIntoView) {
      this.scrollSelectedChipIntoView();
    }
  }

  selectTime(slot: string) {
    this.selectedTime = slot;
  }

  private generateSlots(option: DateOption) {
    const openingMinutes = this.timeToMinutes(this.openingTime);
    const closingMinutes = this.timeToMinutes(this.closingTime);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    let slots = this.buildTimeSlots(openingMinutes, closingMinutes, this.slotIntervalMinutes);

    if (option.isToday) {
      slots = slots.filter((slot) => this.timeToMinutes(slot, true) >= nowMinutes);
      if (slots.length === 0) {
        const tomorrow = this.dateOptions[1];
        if (tomorrow) {
          this.selectDate(tomorrow);
        }
        return;
      }
    }

    this.timeSlots = slots;
    this.selectedTime = slots[0] ?? '';
  }

  private buildTimeSlots(openingMinutes: number, closingMinutes: number, intervalMinutes: number) {
    const slots: string[] = [];
    for (let minutes = openingMinutes; minutes <= closingMinutes; minutes += intervalMinutes) {
      slots.push(this.formatTime(minutes));
    }
    return slots;
  }

  private formatTime(totalMinutes: number): string {
    const hours24 = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const period = hours24 >= 12 ? 'PM' : 'AM';
    const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
  }

  private timeToMinutes(time: string, isDisplay = false): number {
    const normalized = time.trim();
    const hasPeriod = normalized.includes('AM') || normalized.includes('PM');

    if (!isDisplay && !hasPeriod) {
      const [hourStr, minuteStr] = normalized.split(':');
      return parseInt(hourStr, 10) * 60 + parseInt(minuteStr, 10);
    }

    const [timePart, period] = normalized.split(' ');
    const [hourStr, minuteStr] = timePart.split(':');
    let hours = parseInt(hourStr, 10);
    const minutes = parseInt(minuteStr, 10);
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  private formatWeekday(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  }

  private formatShortDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' }).format(date);
  }

  private formatDateKey(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private startOfDay(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private scrollSelectedChipIntoView() {
    requestAnimationFrame(() => {
      const index = this.dateOptions.findIndex((d) => d.key === this.selectedDateKey);
      const chip = this.dateChips?.get(index)?.nativeElement;
      chip?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
  }

  back() {
    if (this.currentStep === 1) {
      void this.router.navigateByUrl('/app/home');
      return;
    }
    this.currentStep--;
  }

  next() {
    if (this.currentStep < this.steps.length && this.canProceed()) {
      this.currentStep++;
    }
  }

  canProceed() {
    if (this.currentStep === 1) return !!this.selectedSport;
    if (this.currentStep === 2) return !!this.selectedVenue;
    if (this.currentStep === 3) return !!this.selectedDateKey && !!this.selectedTime;
    if (this.currentStep === 4) return !!this.selectedTeamSize;
    return true;
  }

  selectSport(id: string) {
    this.selectedSport = id;
    setTimeout(() => this.next(), 180);
  }

  async confirm() {
    if (this.submitting) return;
    this.submitting = true;
    try {
      const response = await firstValueFrom(
        this.bookingService.bookGame({
          sport: this.selectedSport,
          venue_id: this.selectedVenue,
          date: this.selectedDateKey,
          time: this.selectedTime,
          team_size: this.selectedTeamSize,
        })
      );
      if (response.success) {
        const toast = await this.toastCtrl.create({
          message: response.message || 'Game created successfully!',
          duration: 2000,
          color: 'success',
          position: 'bottom'
        });
        await toast.present();
        const bookingId = response.data?.id;
        void this.router.navigateByUrl(bookingId ? `/app/my-bookings/${bookingId}` : '/app/my-bookings');
      } else {
        const toast = await this.toastCtrl.create({
          message: response.message || 'Failed to create game.',
          duration: 3000,
          color: 'danger',
          position: 'bottom'
        });
        await toast.present();
      }
    } catch (e: any) {
      console.error(e);
      const toast = await this.toastCtrl.create({
        message: e?.error?.message || 'Error occurred while creating game.',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    } finally {
      this.submitting = false;
    }
  }
}
