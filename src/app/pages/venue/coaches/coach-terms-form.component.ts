import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { EmploymentType, VenueCoachAssignment, VenueCoachTerms, VenueCourtOption } from '../../../core/services/venue-coach.service';

export const EMPLOYMENT_OPTIONS: { value: EmploymentType; label: string }[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
];

export const WEEK_DAYS = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
];

@Component({
  selector: 'app-coach-terms-form',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  styleUrls: ['./venue-coaches.shared.scss'],
  template: `
    <div class="vc-card vc-pad vc-form">
      <label class="vc-field">
        <span>Facility</span>
        <select [(ngModel)]="courtId" (ngModelChange)="emit()" aria-label="Facility">
          <option [ngValue]="null">{{ courts.length ? 'Choose a facility' : 'No facilities added yet' }}</option>
          <option *ngFor="let court of courts" [ngValue]="court.id">{{ court.name }}{{ court.sport ? ' · ' + court.sport : '' }}</option>
        </select>
      </label>
      <label class="vc-field" *ngIf="!courtId">
        <span>Or type a place</span>
        <input type="text" maxlength="120" [(ngModel)]="facilityLabel" (ngModelChange)="emit()" placeholder="e.g. Football Turf A" />
      </label>

      <div class="vc-field">
        <span>Employment type</span>
        <div class="vc-pills wrap">
          <button type="button" *ngFor="let t of employmentOptions" [class.active]="employmentType === t.value" (click)="employmentType = t.value; emit()">{{ t.label }}</button>
        </div>
      </div>

      <label class="vc-field" *ngIf="isMonthly">
        <span>{{ employmentType === 'contract' ? 'Contract amount per month (₹)' : 'Monthly salary (₹)' }}</span>
        <input type="number" inputmode="numeric" min="1" [(ngModel)]="monthlySalary" (ngModelChange)="emit()" placeholder="e.g. 42000" />
      </label>
      <label class="vc-field" *ngIf="!isMonthly">
        <span>Hourly rate (₹)</span>
        <input type="number" inputmode="numeric" min="1" [(ngModel)]="hourlyRate" (ngModelChange)="emit()" placeholder="e.g. 800" />
      </label>

      <div class="vc-field">
        <span>Work days</span>
        <div class="vc-days">
          <button type="button" *ngFor="let d of weekDays" [class.active]="workDays.includes(d.value)" (click)="toggleDay(d.value)" [attr.aria-pressed]="workDays.includes(d.value)">{{ d.label }}</button>
        </div>
      </div>

      <div class="vc-grid-2">
        <label class="vc-field"><span>Shift starts</span><input type="time" [(ngModel)]="shiftStart" (ngModelChange)="emit()" /></label>
        <label class="vc-field"><span>Shift ends</span><input type="time" [(ngModel)]="shiftEnd" (ngModelChange)="emit()" /></label>
        <label class="vc-field"><span>Start date</span><input type="date" [(ngModel)]="startDate" (ngModelChange)="emit()" /></label>
        <label class="vc-field"><span>End date (optional)</span><input type="date" [min]="startDate" [(ngModel)]="endDate" (ngModelChange)="emit()" /></label>
      </div>

      <label class="vc-field">
        <span>Notice period (days)</span>
        <input type="number" inputmode="numeric" min="0" max="180" [(ngModel)]="noticeDays" (ngModelChange)="emit()" placeholder="e.g. 30" />
      </label>
    </div>
  `,
})
export class CoachTermsFormComponent implements OnChanges {
  @Input() courts: VenueCourtOption[] = [];
  @Input() initial: Partial<VenueCoachAssignment> | null = null;
  @Output() termsChange = new EventEmitter<{ terms: VenueCoachTerms; error: string | null }>();

  readonly employmentOptions = EMPLOYMENT_OPTIONS;
  readonly weekDays = WEEK_DAYS;

  courtId: number | null = null;
  facilityLabel = '';
  employmentType: EmploymentType = 'monthly';
  monthlySalary: number | null = null;
  hourlyRate: number | null = null;
  workDays: string[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  shiftStart = '06:00';
  shiftEnd = '10:00';
  startDate = new Date().toISOString().slice(0, 10);
  endDate = '';
  noticeDays: number | null = 30;

  get isMonthly(): boolean {
    return this.employmentType === 'monthly' || this.employmentType === 'contract';
  }

  ngOnChanges(): void {
    const a = this.initial;
    if (a) {
      this.courtId = a.courtId ?? null;
      this.facilityLabel = a.facilityLabel ?? '';
      this.employmentType = a.employmentType ?? 'monthly';
      this.monthlySalary = a.monthlySalary ?? null;
      this.hourlyRate = a.hourlyRate ?? null;
      this.workDays = a.workDays?.length ? [...a.workDays] : this.workDays;
      this.shiftStart = a.shiftStart ?? '';
      this.shiftEnd = a.shiftEnd ?? '';
      this.startDate = a.startDate ?? this.startDate;
      this.endDate = a.endDate ?? '';
      this.noticeDays = a.noticeDays ?? null;
    }
    void Promise.resolve().then(() => this.emit());
  }

  toggleDay(day: string): void {
    this.workDays = this.workDays.includes(day) ? this.workDays.filter((d) => d !== day) : [...this.workDays, day];
    this.emit();
  }

  emit(): void {
    const terms: VenueCoachTerms = {
      employment_type: this.employmentType,
      monthly_salary: this.isMonthly ? Number(this.monthlySalary) || null : null,
      hourly_rate: this.isMonthly ? null : Number(this.hourlyRate) || null,
      venue_court_id: this.courtId,
      facility_label: this.courtId ? null : this.facilityLabel.trim() || null,
      work_days: this.workDays,
      shift_start: this.shiftStart || null,
      shift_end: this.shiftEnd || null,
      start_date: this.startDate,
      end_date: this.endDate || null,
      notice_days: this.noticeDays === null || (this.noticeDays as unknown) === '' ? null : Number(this.noticeDays),
    };
    let error: string | null = null;
    if (this.isMonthly && !terms.monthly_salary) error = 'Enter the monthly amount.';
    else if (!this.isMonthly && !terms.hourly_rate) error = 'Enter the hourly rate.';
    else if (!terms.start_date) error = 'Choose a start date.';
    else if (terms.end_date && terms.end_date < terms.start_date) error = 'The end date must be after the start date.';
    else if (!this.workDays.length) error = 'Pick at least one work day.';
    this.termsChange.emit({ terms, error });
  }
}
