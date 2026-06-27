import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-coach-plan',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content fullscreen>
      <div class="plan-shell">

        <!-- Header -->
        <div class="plan-header">
          <button class="back-btn" (click)="goBack()" type="button">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1>Plan Session</h1>
        </div>

        <!-- Team -->
        <div class="form-group">
          <label class="form-label">Team</label>
          <div class="field-row field-display">
            <ion-icon name="people-outline" class="field-icon"></ion-icon>
            <select class="field-select" [(ngModel)]="selectedTeam">
              <option *ngFor="let t of teams" [value]="t">{{ t }}</option>
            </select>
          </div>
        </div>

        <!-- Date & Time -->
        <div class="form-group">
          <label class="form-label">Date &amp; Time</label>
          <div class="dt-row">
            <div class="field-row field-display">
              <ion-icon name="calendar-outline" class="field-icon"></ion-icon>
              <input
                type="date"
                class="field-input"
                [(ngModel)]="sessionDate"
              />
            </div>
            <div class="field-row field-display">
              <ion-icon name="time-outline" class="field-icon"></ion-icon>
              <input
                type="time"
                class="field-input"
                [(ngModel)]="sessionTime"
              />
            </div>
          </div>
        </div>

        <!-- Venue -->
        <div class="form-group">
          <label class="form-label">Venue</label>
          <div class="field-row field-display">
            <ion-icon name="location-outline" class="field-icon"></ion-icon>
            <input
              type="text"
              class="field-input"
              placeholder="e.g. Phoenix Arena"
              [(ngModel)]="venue"
            />
          </div>
        </div>

        <!-- Session Type -->
        <div class="form-group">
          <label class="form-label">Session Type</label>
          <div class="chip-wrap">
            <button
              *ngFor="let type of sessionTypes"
              class="type-chip"
              [class.is-active]="sessionType === type"
              (click)="sessionType = type"
              type="button"
            >
              {{ type }}
            </button>
          </div>
        </div>

        <!-- Training Drills -->
        <div class="form-group">
          <label class="form-label drills-label">
            <ion-icon name="compass-outline"></ion-icon>
            Training Drills
          </label>

          <!-- Selected drills tags -->
          <div class="selected-drills" *ngIf="selectedDrills.length > 0">
            <div class="drill-tag" *ngFor="let d of selectedDrills">
              {{ d }}
              <button class="drill-remove" (click)="removeDrill(d)" type="button">
                <ion-icon name="close-outline"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Available drill rows -->
          <div class="drill-list">
            <button
              *ngFor="let drill of availableDrills"
              class="drill-row"
              [class.is-added]="selectedDrills.includes(drill)"
              (click)="toggleDrill(drill)"
              type="button"
            >
              <span>{{ drill }}</span>
              <ion-icon
                [name]="selectedDrills.includes(drill) ? 'checkmark-outline' : 'add-outline'"
                [class.added-icon]="selectedDrills.includes(drill)"
              ></ion-icon>
            </button>
          </div>
        </div>

        <!-- Session Notes -->
        <div class="form-group">
          <label class="form-label">Session Notes</label>
          <textarea
            class="plan-textarea"
            placeholder="Add notes about session goals, focus areas, etc."
            [(ngModel)]="notes"
            rows="4"
          ></textarea>
        </div>

        <!-- Footer Buttons -->
        <div class="plan-footer">
          <button class="btn-cancel" (click)="goBack()" type="button">
            Cancel
          </button>
          <button
            class="btn-create"
            [disabled]="!sessionType || selectedDrills.length === 0"
            (click)="createSession()"
            type="button"
          >
            <ion-icon name="checkmark-outline"></ion-icon>
            Create Session
          </button>
        </div>

      </div>
    </ion-content>
  `,
  styleUrls: ['./plan.page.scss'],
})
export class CoachPlanPage {
  teams = ['Elite Football Squad', 'Junior Cricket Team', 'Basketball Academy'];
  selectedTeam = this.teams[0];

  sessionDate = '';
  sessionTime = '16:00';
  venue = 'Phoenix Arena';

  sessionTypes = ['Training', 'Match Prep', 'Scrimmage', 'Fitness', 'Tactical'];
  sessionType = '';

  availableDrills = [
    'Passing Drills',
    'Shooting Practice',
    'Defensive Formation',
    'Conditioning',
    'Set Pieces',
    'Ball Control',
  ];
  selectedDrills: string[] = [];

  notes = '';

  constructor(private router: Router) {}

  toggleDrill(drill: string) {
    if (this.selectedDrills.includes(drill)) {
      this.removeDrill(drill);
    } else {
      this.selectedDrills = [...this.selectedDrills, drill];
    }
  }

  removeDrill(drill: string) {
    this.selectedDrills = this.selectedDrills.filter((d) => d !== drill);
  }

  goBack() {
    this.router.navigate(['/app/home']);
  }

  createSession() {
    console.log('Session created', {
      team: this.selectedTeam,
      date: this.sessionDate,
      time: this.sessionTime,
      venue: this.venue,
      type: this.sessionType,
      drills: this.selectedDrills,
      notes: this.notes,
    });
    this.router.navigate(['/app/schedule']);
  }
}
