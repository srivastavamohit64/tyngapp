import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
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
  icon: string;
}

@Component({
  selector: 'app-coach-evaluate',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true" class="evaluation-shell">
      <main class="evaluation-page">
        <header class="page-header">
          <button type="button" class="back-button" aria-label="Go back" (click)="goBack()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1>Player Evaluation</h1>
          <button type="button" class="history-button" aria-label="View past evaluations" title="Past evaluations" (click)="openEvaluationHistory()">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M9 5.5H6.8A1.8 1.8 0 0 0 5 7.3v12A1.8 1.8 0 0 0 6.8 21h10.4a1.8 1.8 0 0 0 1.8-1.8v-12a1.8 1.8 0 0 0-1.8-1.8H15" />
              <rect x="8.5" y="3" width="7" height="5" rx="1.5" />
            </svg>
          </button>
        </header>

        <div class="page-body">
          <div *ngIf="loadingPlayers()" class="loading-state" aria-live="polite">
            <ion-spinner name="crescent"></ion-spinner>
            <span>Loading your players&hellip;</span>
          </div>

          <div *ngIf="!loadingPlayers() && loadError()" class="empty-state">
            <ion-icon name="cloud-offline-outline"></ion-icon>
            <strong>Players could not be loaded</strong>
            <p>{{ loadError() }}</p>
            <button type="button" (click)="loadPlayers()">Try again</button>
          </div>

          <div *ngIf="!loadingPlayers() && !loadError() && players().length === 0" class="empty-state">
            <ion-icon name="people-outline"></ion-icon>
            <strong>No students to evaluate</strong>
            <p>Accept or enrol a student first, then return here to record an evaluation.</p>
            <button type="button" (click)="openStudents()">Open My Students</button>
          </div>

          <ng-container *ngIf="!loadingPlayers() && !loadError() && players().length">
            <section class="player-section" aria-labelledby="player-label">
              <p id="player-label" class="field-title">Select Player</p>
              <div class="player-list">
                <button
                  *ngFor="let player of players(); trackBy: trackPlayer"
                  type="button"
                  class="player-card"
                  [class.selected]="selectedPlayerId() === player.id"
                  [attr.aria-pressed]="selectedPlayerId() === player.id"
                  (click)="selectPlayer(player.id)">
                  <span class="player-avatar">
                    <img *ngIf="player.avatar" [src]="player.avatar" [alt]="player.name" />
                    <span *ngIf="!player.avatar">{{ sportEmoji(player.sport) }}</span>
                  </span>
                  <span class="player-copy">
                    <strong>{{ player.name }}</strong>
                    <small>{{ playerSubtitle(player) }}</small>
                  </span>
                  <ion-icon *ngIf="selectedPlayerId() === player.id" name="checkmark-circle"></ion-icon>
                </button>
              </div>
            </section>

            <section class="rating-card" aria-labelledby="rating-heading">
              <h2 id="rating-heading">Rate Performance</h2>
              <div class="rating-list">
                <div *ngFor="let category of categories" class="rating-row">
                  <div class="category-title">
                    <ion-icon [name]="category.icon"></ion-icon>
                    <span>{{ category.name }}</span>
                    <b *ngIf="getRatingVal(category.id)">{{ getRatingVal(category.id) }}/5</b>
                  </div>
                  <div class="rating-options" role="group" [attr.aria-label]="category.name + ' rating'">
                    <button
                      *ngFor="let rating of ratingOptions"
                      type="button"
                      [class.active]="getRatingVal(category.id) >= rating"
                      [class.selected-score]="getRatingVal(category.id) === rating"
                      [attr.aria-label]="category.name + ': ' + rating + ' out of 5'"
                      [attr.aria-pressed]="getRatingVal(category.id) === rating"
                      (click)="setRating(category.id, rating)">
                      {{ rating }}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section class="notes-form">
              <label for="strengths">Strengths</label>
              <textarea
                id="strengths"
                [(ngModel)]="strengths"
                maxlength="4000"
                placeholder="What did the player do well?"></textarea>

              <label for="improvements">Areas for Improvement</label>
              <textarea
                id="improvements"
                [(ngModel)]="improvements"
                maxlength="4000"
                placeholder="What can the player work on?"></textarea>
            </section>

            <div *ngIf="error()" class="form-message error" role="alert">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <span>{{ error() }}</span>
            </div>
            <div *ngIf="success()" class="form-message success" aria-live="polite">
              <ion-icon name="checkmark-circle-outline"></ion-icon>
              <span>{{ success() }}</span>
            </div>

            <button
              type="button"
              class="save-button"
              [disabled]="saving() || !selectedPlayerId()"
              (click)="saveEvaluation()">
              <ion-spinner *ngIf="saving()" name="crescent"></ion-spinner>
              <ion-icon *ngIf="!saving()" name="save-outline"></ion-icon>
              <span>{{ saving() ? 'Saving Evaluation...' : 'Save Evaluation' }}</span>
            </button>
          </ng-container>
        </div>
      </main>

      <ion-modal
        [isOpen]="historyOpen()"
        (didDismiss)="closeEvaluationHistory()"
        [initialBreakpoint]="0.82"
        [breakpoints]="[0, 0.5, 0.82, 1]">
        <ng-template>
          <section class="history-sheet">
            <div class="sheet-handle"></div>
            <header class="history-header">
              <div>
                <p>EVALUATION HISTORY</p>
                <h2>{{ selectedPlayerName() }}</h2>
              </div>
              <button type="button" (click)="closeEvaluationHistory()" aria-label="Close evaluation history"><ion-icon name="close-outline"></ion-icon></button>
            </header>

            <div *ngIf="historyLoading() && !evaluations().length" class="history-state">
              <ion-spinner name="crescent"></ion-spinner><span>Loading past evaluations...</span>
            </div>
            <div *ngIf="historyError() && !evaluations().length" class="history-state error-state">
              <ion-icon name="alert-circle-outline"></ion-icon><span>{{ historyError() }}</span>
              <button type="button" (click)="loadEvaluationHistory(true)">Try again</button>
            </div>
            <div *ngIf="!historyLoading() && !historyError() && !evaluations().length" class="history-state">
              <ion-icon name="clipboard-outline"></ion-icon><strong>No past evaluations</strong><span>Saved evaluations for this player will appear here.</span>
            </div>

            <div *ngIf="evaluations().length" class="history-list">
              <article *ngFor="let evaluation of evaluations(); trackBy: trackEvaluation" class="history-card">
                <div class="history-card-top">
                  <div><strong>{{ evaluation.rating || 0 }}</strong><span>/5 average</span></div>
                  <time>{{ evaluation.evaluated_at | date:'d MMM y, h:mm a' }}</time>
                </div>
                <div *ngIf="ratingEntries(evaluation).length" class="history-ratings">
                  <span *ngFor="let rating of ratingEntries(evaluation)"><b>{{ rating.label }}</b>{{ rating.value }}/5</span>
                </div>
                <div *ngIf="evaluation.strengths" class="history-note"><b>Strengths</b><p>{{ evaluation.strengths }}</p></div>
                <div *ngIf="evaluation.areas_to_improve" class="history-note improvement"><b>Areas for improvement</b><p>{{ evaluation.areas_to_improve }}</p></div>
                <div *ngIf="evaluation.notes" class="history-note"><b>Coach notes</b><p>{{ evaluation.notes }}</p></div>
              </article>

              <p *ngIf="historyError()" class="history-inline-error">{{ historyError() }}</p>
              <button *ngIf="historyPage() < historyLastPage()" type="button" class="load-more" [disabled]="historyLoading()" (click)="loadEvaluationHistory()">
                <ion-spinner *ngIf="historyLoading()" name="crescent"></ion-spinner>
                {{ historyLoading() ? 'Loading...' : 'Load older evaluations' }}
              </button>
              <p *ngIf="historyPage() >= historyLastPage()" class="history-end">All saved evaluations are shown.</p>
            </div>
          </section>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styleUrls: ['./evaluate.page.scss'],
})
export class CoachEvaluatePage implements OnInit {
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly coach = inject(CoachService);

  readonly players = signal<PlayerItem[]>([]);
  readonly selectedPlayerId = signal<number | null>(null);
  readonly loadingPlayers = signal(true);
  readonly loadError = signal('');
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly historyOpen = signal(false);
  readonly historyLoading = signal(false);
  readonly historyError = signal('');
  readonly evaluations = signal<any[]>([]);
  readonly historyPage = signal(0);
  readonly historyLastPage = signal(1);
  readonly ratingOptions = [1, 2, 3, 4, 5];
  readonly categories: CategoryItem[] = [
    { id: 'technical', name: 'Technical Skills', icon: 'disc-outline' },
    { id: 'tactical', name: 'Tactical Awareness', icon: 'trending-up-outline' },
    { id: 'physical', name: 'Physical Fitness', icon: 'ribbon-outline' },
    { id: 'mental', name: 'Mental Strength', icon: 'star-outline' },
  ];

  ratings = signal<Record<CategoryItem['id'], number>>({
    technical: 0,
    tactical: 0,
    physical: 0,
    mental: 0,
  });
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
        const players = rows
          .filter((row: any) => row.status === 'active' && row.student)
          .map((row: any) => ({
            id: Number(row.student.id),
            name: row.student.name || 'Player',
            avatar: row.student.profile_image,
            sport: Array.isArray(row.student.sports) ? row.student.sports[0] : row.student.sports,
            level: row.student.level,
          }));

        this.players.set(players);
        if (players.length) {
          this.selectPlayer(players[0].id);
        }
        this.loadingPlayers.set(false);
      },
      error: () => {
        this.loadingPlayers.set(false);
        this.loadError.set('Check your connection and try again.');
      },
    });
  }

  selectPlayer(id: number): void {
    if (this.selectedPlayerId() === Number(id)) {
      return;
    }

    this.selectedPlayerId.set(Number(id));
    this.ratings.set({ technical: 0, tactical: 0, physical: 0, mental: 0 });
    this.strengths = '';
    this.improvements = '';
    this.error.set('');
    this.success.set('');
    this.closeEvaluationHistory();
  }

  trackPlayer(_index: number, player: PlayerItem): number {
    return player.id;
  }

  trackEvaluation(_index: number, evaluation: any): number {
    return Number(evaluation.id);
  }

  selectedPlayerName(): string {
    return this.players().find(player => player.id === this.selectedPlayerId())?.name || 'Player';
  }

  openEvaluationHistory(): void {
    if (!this.selectedPlayerId() && this.players().length) {
      this.selectPlayer(this.players()[0].id);
    }
    if (!this.selectedPlayerId()) {
      this.error.set('Select a player to view past evaluations.');
      return;
    }
    this.historyOpen.set(true);
    this.loadEvaluationHistory(true);
  }

  closeEvaluationHistory(): void {
    this.historyOpen.set(false);
  }

  loadEvaluationHistory(reset = false): void {
    const playerId = this.selectedPlayerId();
    if (!playerId || this.historyLoading()) return;
    const page = reset ? 1 : this.historyPage() + 1;
    this.historyLoading.set(true);
    this.historyError.set('');
    if (reset) {
      this.evaluations.set([]);
      this.historyPage.set(0);
    }
    this.coach.getEvaluations(playerId, page).subscribe({
      next: response => {
        const payload: any = response.data;
        const rows = Array.isArray(payload) ? payload : payload?.data || [];
        this.evaluations.set(reset ? rows : [...this.evaluations(), ...rows]);
        this.historyPage.set(Number(payload?.current_page || page));
        this.historyLastPage.set(Number(payload?.last_page || 1));
        this.historyLoading.set(false);
      },
      error: () => {
        this.historyError.set('Past evaluations could not be loaded. Please try again.');
        this.historyLoading.set(false);
      },
    });
  }

  ratingEntries(evaluation: any): { label: string; value: number }[] {
    const ratings = evaluation?.skill_ratings || {};
    return this.categories
      .map(category => ({ label: category.name, value: Number(ratings[category.id] || 0) }))
      .filter(item => item.value > 0);
  }

  getRatingVal(category: CategoryItem['id']): number {
    return this.ratings()[category];
  }

  setRating(category: CategoryItem['id'], rating: number): void {
    this.ratings.update(current => ({ ...current, [category]: rating }));
    this.error.set('');
    this.success.set('');
  }

  playerSubtitle(player: PlayerItem): string {
    return [player.sport, player.level ? 'Level ' + player.level : null]
      .filter(Boolean)
      .join(' \u00b7 ') || 'Player';
  }

  sportEmoji(sport?: string): string {
    const key = String(sport || '').toLowerCase();
    if (key.includes('cricket')) return '\u{1F3CF}';
    if (key.includes('football') || key.includes('soccer')) return '\u26BD';
    if (key.includes('basketball')) return '\u{1F3C0}';
    if (key.includes('badminton')) return '\u{1F3F8}';
    if (key.includes('tennis')) return '\u{1F3BE}';
    return '\u{1F3C5}';
  }

  goBack(): void {
    if (history.length > 1) {
      this.location.back();
    } else {
      void this.router.navigateByUrl('/app/coach/dashboard');
    }
  }

  openStudents(): void {
    void this.router.navigateByUrl('/app/coach/students');
  }

  saveEvaluation(): void {
    const playerId = this.selectedPlayerId();
    const ratingValues = Object.values(this.ratings());
    if (!playerId) {
      this.error.set('Select a player before saving.');
      return;
    }
    if (ratingValues.some(value => value < 1)) {
      this.error.set('Rate all four performance areas before saving.');
      return;
    }

    this.saving.set(true);
    this.error.set('');
    this.success.set('');
    const average = Number(
      (ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length).toFixed(1),
    );

    this.coach.saveStudentEvaluation(playerId, {
      rating: average,
      skill_ratings: { ...this.ratings() },
      strengths: this.strengths.trim(),
      areas_to_improve: this.improvements.trim(),
    }).subscribe({
      next: () => {
        const player = this.players().find(item => item.id === playerId);
        this.success.set('Evaluation saved for ' + (player?.name || 'the player') + '.');
        this.saving.set(false);
      },
      error: () => {
        this.error.set('The evaluation could not be saved. Check your connection and try again.');
        this.saving.set(false);
      },
    });
  }
}
