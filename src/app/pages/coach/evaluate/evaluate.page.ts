import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CoachService } from '../../../core/services/coach.service';

interface PlayerItem {
  id: number;
  name: string;
  avatar?: string | null;
  sport?: string;
  level?: string;
}

interface CategoryItem {
  id: 'technical' | 'tactical' | 'physical' | 'mental';
  name: string;
  hint: string;
  icon: string;
}

@Component({
  selector: 'app-coach-evaluate',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <main class="evaluate-page">
        <header class="eval-header">
          <button type="button" class="back-btn" aria-label="Go back" (click)="goBack()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <div class="header-copy"><span class="eyebrow">COACH WORKSPACE</span><h1>Player evaluation</h1></div>
          <span class="header-mark"><ion-icon name="clipboard-outline"></ion-icon></span>
        </header>

        <div class="eval-content">
          <section class="intro-card">
            <div class="intro-icon"><ion-icon name="analytics-outline"></ion-icon></div>
            <div><h2>Track real progress</h2><p>Record a focused snapshot after training or a match. Your notes stay with the player’s coaching history.</p></div>
          </section>

          <div *ngIf="loadingPlayers()" class="state-card"><ion-spinner name="crescent"></ion-spinner><span>Loading your players…</span></div>
          <div *ngIf="!loadingPlayers() && loadError()" class="state-card empty-state">
            <ion-icon name="cloud-offline-outline"></ion-icon><h2>Players could not be loaded</h2>
            <p>{{ loadError() }}</p><button type="button" class="secondary-btn" (click)="loadPlayers()">Try again</button>
          </div>
          <div *ngIf="!loadingPlayers() && !loadError() && players().length === 0" class="state-card empty-state">
            <ion-icon name="people-outline"></ion-icon><h2>No players to evaluate yet</h2>
            <p>Add a player to My Students first, then their profile will appear here.</p>
            <button type="button" class="secondary-btn" (click)="openStudents()">Go to My Students</button>
          </div>

          <ng-container *ngIf="players().length > 0">
            <section class="eval-section">
              <div class="section-heading"><div><span class="step-label">01 · PLAYER</span><h2>Who are you evaluating?</h2></div><span class="step-icon"><ion-icon name="person-outline"></ion-icon></span></div>
              <label class="select-wrap"><span class="sr-only">Select player</span>
                <select [ngModel]="selectedPlayerId()" (ngModelChange)="selectPlayer($event)">
                  <option [ngValue]="null" disabled>Select a player</option>
                  <option *ngFor="let player of players()" [ngValue]="player.id">{{ player.name }}{{ player.sport ? ' · ' + player.sport : '' }}</option>
                </select><ion-icon name="chevron-down-outline"></ion-icon>
              </label>
              <div *ngIf="selectedPlayer() as player" class="selected-player">
                <img *ngIf="player.avatar" [src]="player.avatar" [alt]="player.name" />
                <span *ngIf="!player.avatar" class="player-initial">{{ initials(player.name) }}</span>
                <div class="player-info"><strong>{{ player.name }}</strong><span>{{ player.sport || 'Player' }}<ng-container *ngIf="player.level"> · {{ player.level }}</ng-container></span></div>
                <span class="active-pill"><i></i> Active</span>
              </div>
            </section>

            <section class="eval-section rating-section">
              <div class="section-heading"><div><span class="step-label">02 · PERFORMANCE</span><h2>Rate the session</h2><p>Use a 1–5 scale based on what you observed today.</p></div><span class="step-icon"><ion-icon name="star-outline"></ion-icon></span></div>
              <div class="rating-list">
                <div *ngFor="let category of categories" class="rating-item">
                  <div class="rating-meta"><span class="category-icon"><ion-icon [name]="category.icon"></ion-icon></span><span><strong>{{ category.name }}</strong><small>{{ category.hint }}</small></span><b>{{ getRatingVal(category.id) ? getRatingVal(category.id) + '/5' : '—' }}</b></div>
                  <div class="rating-options" role="group" [attr.aria-label]="category.name + ' rating'">
                    <button type="button" *ngFor="let rating of ratingOptions" (click)="setRating(category.id, rating)" [class.is-active]="getRatingVal(category.id) >= rating" [attr.aria-pressed]="getRatingVal(category.id) === rating">{{ rating }}</button>
                  </div>
                </div>
              </div>
              <div class="scale-hint"><span>1 · Needs focus</span><span>5 · Excellent</span></div>
            </section>

            <section class="eval-section notes-section">
              <div class="section-heading"><div><span class="step-label">03 · COACH NOTES</span><h2>Give useful feedback</h2><p>Specific, encouraging feedback gives players a clear next step.</p></div></div>
              <label class="field-label" for="strengths">What went well?</label>
              <textarea id="strengths" [(ngModel)]="strengths" maxlength="4000" placeholder="For example: kept their head up and made quick passes under pressure."></textarea>
              <div class="field-footer"><span>Call out a specific strength</span><span>{{ strengths.length }}/4000</span></div>
              <label class="field-label improvement-label" for="improvements">One area to work on</label>
              <textarea id="improvements" [(ngModel)]="improvements" maxlength="4000" placeholder="For example: try checking over your shoulder before receiving the ball."></textarea>
              <div class="field-footer"><span>Keep the next step actionable</span><span>{{ improvements.length }}/4000</span></div>
            </section>

            <div *ngIf="error()" class="message error-message"><ion-icon name="alert-circle-outline"></ion-icon>{{ error() }}</div>
            <div *ngIf="success()" class="message success-message"><ion-icon name="checkmark-circle-outline"></ion-icon>{{ success() }}</div>
            <button type="button" class="save-btn" [disabled]="saving() || !selectedPlayerId()" (click)="saveEvaluation()">
              <ion-spinner *ngIf="saving()" name="crescent"></ion-spinner><ion-icon *ngIf="!saving()" name="save-outline"></ion-icon>{{ saving() ? 'Saving evaluation…' : 'Save evaluation' }}
            </button>
            <p class="privacy-note"><ion-icon name="lock-closed-outline"></ion-icon> Shared with your coaching team and TYNG admins for player support.</p>

            <section *ngIf="recentEvaluations().length" class="eval-section history-section">
              <div class="section-heading"><div><span class="step-label">PLAYER HISTORY</span><h2>Recent evaluations</h2></div></div>
              <article *ngFor="let evaluation of recentEvaluations().slice(0, 3)" class="history-card">
                <div class="history-top"><strong>{{ evaluation.rating || '—' }}<small> avg</small></strong><time>{{ evaluation.evaluated_at | date:'d MMM y' }}</time></div>
                <p *ngIf="evaluation.strengths">Went well: {{ evaluation.strengths }}</p><p *ngIf="evaluation.areas_to_improve">Next focus: {{ evaluation.areas_to_improve }}</p>
              </article>
            </section>
          </ng-container>
        </div>
      </main>
    </ion-content>
  `,
  styleUrls: ['./evaluate.page.scss'],
})
export class CoachEvaluatePage implements OnInit {
  private readonly router = inject(Router);
  private readonly coach = inject(CoachService);

  players = signal<PlayerItem[]>([]);
  selectedPlayerId = signal<number | null>(null);
  selectedPlayer = computed(() => this.players().find(player => player.id === this.selectedPlayerId()) || null);
  recentEvaluations = signal<any[]>([]);
  loadingPlayers = signal(true);
  loadError = signal('');
  saving = signal(false);
  error = signal('');
  success = signal('');
  readonly ratingOptions = [1, 2, 3, 4, 5];
  readonly categories: CategoryItem[] = [
    { id: 'technical', name: 'Technical skills', hint: 'Control, passing and execution', icon: 'construct-outline' },
    { id: 'tactical', name: 'Game awareness', hint: 'Decision-making and positioning', icon: 'map-outline' },
    { id: 'physical', name: 'Physical readiness', hint: 'Movement, effort and stamina', icon: 'fitness-outline' },
    { id: 'mental', name: 'Mindset and teamwork', hint: 'Focus, confidence and attitude', icon: 'people-outline' },
  ];
  ratings = signal<Record<string, number>>({ technical: 0, tactical: 0, physical: 0, mental: 0 });
  strengths = '';
  improvements = '';

  ngOnInit(): void {
    this.loadPlayers();
  }

  loadPlayers(): void {
    this.loadingPlayers.set(true);
    this.loadError.set('');
    this.coach.getStudents().subscribe({
      next: response => {
        const data: any = response.data;
        const rows = Array.isArray(data) ? data : data?.data || [];
        const players = rows.filter((row: any) => row.status === 'active' && row.student).map((row: any) => ({
          id: Number(row.student.id), name: row.student.name || 'Player', avatar: row.student.profile_image,
          sport: Array.isArray(row.student.sports) ? row.student.sports[0] : row.student.sports,
          level: row.student.level,
        }));
        this.players.set(players);
        if (players.length) this.selectPlayer(players[0].id);
        this.loadingPlayers.set(false);
      },
      error: () => { this.loadingPlayers.set(false); this.loadError.set('Check your connection and retry.'); },
    });
  }

  selectPlayer(id: number): void {
    this.selectedPlayerId.set(Number(id));
    this.success.set('');
    this.error.set('');
    this.ratings.set({ technical: 0, tactical: 0, physical: 0, mental: 0 });
    this.strengths = '';
    this.improvements = '';
    this.coach.getEvaluations(Number(id)).subscribe({
      next: response => {
        const data: any = response.data;
        this.recentEvaluations.set(Array.isArray(data) ? data : data?.data || []);
      },
      error: () => this.recentEvaluations.set([]),
    });
  }

  initials(name: string): string { return name.split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase(); }
  getRatingVal(category: string): number { return this.ratings()[category] || 0; }
  setRating(category: string, rating: number): void { this.ratings.update(current => ({ ...current, [category]: rating })); }
  goBack(): void { void this.router.navigateByUrl('/app/coach/dashboard'); }
  openStudents(): void { void this.router.navigateByUrl('/app/coach/students'); }

  saveEvaluation(): void {
    const playerId = this.selectedPlayerId();
    const ratingValues = Object.values(this.ratings());
    if (!playerId) { this.error.set('Choose a player before saving.'); return; }
    if (ratingValues.some(value => value < 1)) { this.error.set('Rate all four areas to save a complete evaluation.'); return; }
    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const average = Math.round(ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length);
    this.coach.saveStudentEvaluation(playerId, {
      rating: average, skill_ratings: { ...this.ratings() }, strengths: this.strengths.trim(), areas_to_improve: this.improvements.trim(),
    }).subscribe({
      next: response => {
        const item = (response.data as any) || { rating: average, skill_ratings: { ...this.ratings() }, strengths: this.strengths, areas_to_improve: this.improvements, evaluated_at: new Date().toISOString() };
        this.recentEvaluations.update(items => [item, ...items]);
        this.success.set('Evaluation saved to ' + (this.selectedPlayer()?.name || 'the player') + '’s coaching history.');
        this.saving.set(false);
      },
      error: () => { this.error.set('The evaluation could not be saved. Check your connection and try again.'); this.saving.set(false); },
    });
  }
}
