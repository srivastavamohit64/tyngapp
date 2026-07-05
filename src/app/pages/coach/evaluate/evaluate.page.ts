import { CommonModule } from '@angular/common';
import { Component, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

interface PlayerItem {
  id: number;
  name: string;
  avatar: string;
  position: string;
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
    <ion-content [fullscreen]="true">
      <div class="evaluate-page pb-32 text-left">
        <!-- Sticky Header -->
        <div class="sticky-header flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
          <button (click)="goBack()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
          <p class="text-[17px] font-black text-[#111827] m-0">Player Evaluation</p>
          <div class="w-10"></div>
        </div>

        <div class="px-5 pt-4 space-y-6">
          <!-- Select Player -->
          <div>
            <label class="block mb-3 text-xs font-black uppercase text-[#9CA3AF] tracking-wider">Select Player</label>
            <div class="space-y-2.5">
              <button
                *ngFor="let player of players"
                (click)="selectedPlayer.set(player)"
                class="w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 text-left border-none"
                [style.backgroundColor]="selectedPlayer().id === player.id ? 'rgba(140,240,0,0.08)' : 'white'"
                [style.border]="selectedPlayer().id === player.id ? '2px solid #8CF000' : '2px solid #F3F4F6'"
                [style.boxShadow]="selectedPlayer().id === player.id ? '0 2px 12px rgba(140,240,0,0.18)' : '0 1px 4px rgba(0,0,0,0.05)'"
              >
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-[#8CF000] to-[#A3E635] flex items-center justify-center text-2xl shadow-sm">
                  {{ player.avatar }}
                </div>
                <div class="flex-grow">
                  <p class="text-[15px] font-black text-[#111827] m-0 leading-none">{{ player.name }}</p>
                  <p class="text-sm text-[#9CA3AF] m-0 mt-1 font-bold">{{ player.position }}</p>
                </div>
                <ion-icon *ngIf="selectedPlayer().id === player.id" name="checkmark-circle" class="text-[#8CF000] text-xl"></ion-icon>
              </button>
            </div>
          </div>

          <!-- Rating card -->
          <div class="section-card p-5 bg-white border border-[#F3F4F6]">
            <p class="text-[15px] font-black text-[#111827] mb-4 m-0">Rate Performance</p>
            <div class="space-y-6">
              <div *ngFor="let cat of categories">
                <div class="flex items-center gap-2 mb-3">
                  <ion-icon [name]="cat.icon" class="text-[#8CF000] text-lg font-bold"></ion-icon>
                  <span class="text-[14px] font-bold text-[#111827]">{{ cat.name }}</span>
                </div>
                <div class="flex gap-2">
                  <button
                    *ngFor="let rating of [1, 2, 3, 4, 5]"
                    (click)="setRating(cat.id, rating)"
                    class="flex-1 h-12 rounded-xl transition-all border-none font-black text-[15px]"
                    [style.backgroundColor]="getRatingVal(cat.id) >= rating ? '#8CF000' : '#F3F4F6'"
                    [style.color]="getRatingVal(cat.id) >= rating ? '#111827' : '#9CA3AF'"
                  >
                    {{ rating }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Strengths -->
          <div>
            <label class="block mb-2 text-xs font-black uppercase text-[#9CA3AF] tracking-wider">Strengths</label>
            <textarea
              [(ngModel)]="strengths"
              placeholder="What did the player do well?"
              class="w-full px-4 py-4 bg-white rounded-2xl border-2 border-[#F3F4F6] focus:border-[#8CF000] focus:outline-none transition-colors min-h-[100px] text-[13px] font-semibold text-[#111827] outline-none"
            ></textarea>
          </div>

          <!-- Areas for Improvement -->
          <div>
            <label class="block mb-2 text-xs font-black uppercase text-[#9CA3AF] tracking-wider">Areas for Improvement</label>
            <textarea
              [(ngModel)]="improvements"
              placeholder="What can the player work on?"
              class="w-full px-4 py-4 bg-white rounded-2xl border-2 border-[#F3F4F6] focus:border-[#8CF000] focus:outline-none transition-colors min-h-[100px] text-[13px] font-semibold text-[#111827] outline-none"
            ></textarea>
          </div>

          <!-- Save Button CTA -->
          <button
            (click)="saveEvaluation()"
            class="w-full bg-[#8CF000] text-[#111827] py-4 rounded-2xl transition-colors flex items-center justify-center gap-2 border-none font-black text-[15px] shadow-lg shadow-[#8CF000]/30"
          >
            <ion-icon name="save-outline" class="text-lg"></ion-icon>
            Save Evaluation
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .evaluate-page {
      background: #FAFBFC;
      min-height: 100%;
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .section-card {
      border-radius: 24px;
      box-shadow: 0 2px 16px rgba(0,0,0,0.07);
    }
  `]
})
export class CoachEvaluatePage {
  private readonly router = inject(Router);

  players: PlayerItem[] = [
    { id: 1, name: 'Rahul Sharma', avatar: '🏏', position: 'Forward' },
    { id: 2, name: 'Priya Singh', avatar: '⚽', position: 'Midfielder' },
    { id: 3, name: 'Amit Kumar', avatar: '🏀', position: 'Defender' },
  ];

  selectedPlayer = signal<PlayerItem>(this.players[0]);

  categories: CategoryItem[] = [
    { id: 'technical', name: 'Technical Skills', icon: 'baseball-outline' },
    { id: 'tactical', name: 'Tactical Awareness', icon: 'trending-up-outline' },
    { id: 'physical', name: 'Physical Fitness', icon: 'ribbon-outline' },
    { id: 'mental', name: 'Mental Strength', icon: 'star-outline' },
  ];

  ratings = signal<Record<string, number>>({
    technical: 0,
    tactical: 0,
    physical: 0,
    mental: 0,
  });

  strengths = '';
  improvements = '';

  getRatingVal(catId: string): number {
    return this.ratings()[catId] ?? 0;
  }

  setRating(catId: string, rating: number) {
    this.ratings.update(r => ({ ...r, [catId]: rating }));
  }

  goBack() {
    this.router.navigateByUrl('/app/home');
  }

  saveEvaluation() {
    // Save locally or print if needed
    this.router.navigateByUrl('/app/home');
  }
}
