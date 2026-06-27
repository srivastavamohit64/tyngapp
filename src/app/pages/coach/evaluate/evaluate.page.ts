import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-coach-evaluate',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content fullscreen>
      <div class="eval-shell">

        <!-- Header -->
        <div class="eval-header">
          <button class="back-btn" (click)="goBack()">
            <ion-icon name="chevron-back-outline"></ion-icon>
          </button>
          <h1>Player Evaluation</h1>
        </div>

        <!-- Select Player -->
        <section class="eval-section">
          <label class="section-label">Select Player</label>
          <div class="player-list">
            <button
              *ngFor="let player of players"
              class="player-row"
              [class.is-selected]="selectedPlayer?.id === player.id"
              (click)="selectedPlayer = player"
              type="button"
            >
              <div class="player-avatar">{{ player.avatar }}</div>
              <div class="player-meta">
                <div class="player-name">{{ player.name }}</div>
                <div class="player-pos">{{ player.position }}</div>
              </div>
              <ion-icon
                *ngIf="selectedPlayer?.id === player.id"
                name="checkmark-circle"
                class="player-check"
              ></ion-icon>
            </button>
          </div>
        </section>

        <!-- Rate Performance -->
        <section class="eval-section">
          <div class="rate-card">
            <h2 class="rate-title">Rate Performance</h2>
            <div class="category-list">
              <div *ngFor="let cat of categories" class="cat-item">
                <div class="cat-header">
                  <ion-icon [name]="cat.icon" class="cat-icon"></ion-icon>
                  <span class="cat-name">{{ cat.name }}</span>
                </div>
                <div class="rating-row">
                  <button
                    *ngFor="let n of [1,2,3,4,5]"
                    class="rating-btn"
                    [class.is-active]="(ratings[cat.id] || 0) >= n"
                    (click)="setRating(cat.id, n)"
                    type="button"
                  >
                    {{ n }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Strengths -->
        <section class="eval-section">
          <label class="section-label">Strengths</label>
          <textarea
            class="eval-textarea"
            placeholder="What did the player do well?"
            [(ngModel)]="strengths"
            rows="3"
          ></textarea>
        </section>

        <!-- Areas for Improvement -->
        <section class="eval-section">
          <label class="section-label">Areas for Improvement</label>
          <textarea
            class="eval-textarea"
            placeholder="What can the player work on?"
            [(ngModel)]="improvements"
            rows="3"
          ></textarea>
        </section>

        <!-- Save Button -->
        <section class="eval-section">
          <button class="save-btn" (click)="saveEvaluation()" type="button">
            <ion-icon name="save-outline"></ion-icon>
            Save Evaluation
          </button>
        </section>

      </div>
    </ion-content>
  `,
  styleUrls: ['./evaluate.page.scss'],
})
export class CoachEvaluatePage {
  players = [
    { id: 1, name: 'Rahul Sharma', avatar: '🏏', position: 'Forward' },
    { id: 2, name: 'Priya Singh',  avatar: '⚽', position: 'Midfielder' },
    { id: 3, name: 'Amit Kumar',   avatar: '🏀', position: 'Defender' },
  ];

  selectedPlayer = this.players[0];

  categories = [
    { id: 'technical', name: 'Technical Skills',   icon: 'compass-outline' },
    { id: 'tactical',  name: 'Tactical Awareness', icon: 'trending-up-outline' },
    { id: 'physical',  name: 'Physical Fitness',   icon: 'ribbon-outline' },
    { id: 'mental',    name: 'Mental Strength',    icon: 'star-outline' },
  ];

  ratings: Record<string, number> = {
    technical: 0,
    tactical: 0,
    physical: 0,
    mental: 0,
  };

  strengths = '';
  improvements = '';

  constructor(private router: Router) {}

  setRating(categoryId: string, value: number) {
    this.ratings = { ...this.ratings, [categoryId]: value };
  }

  goBack() {
    this.router.navigate(['/app/home']);
  }

  saveEvaluation() {
    console.log('Evaluation saved', {
      player: this.selectedPlayer,
      ratings: this.ratings,
      strengths: this.strengths,
      improvements: this.improvements,
    });
    this.router.navigate(['/app/home']);
  }
}
