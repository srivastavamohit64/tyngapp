import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-team-management',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="safe-area-top page-with-tab-bar px-6 py-4 bg-background text-foreground">
        
        <!-- Header -->
        <header class="flex items-center justify-between mb-6">
          <button (click)="back()" class="h-10 w-10 grid place-items-center rounded-full bg-card border border-border">
            <ion-icon name="chevron-back-outline" class="text-xl"></ion-icon>
          </button>
          <h1 class="text-lg font-bold text-center flex-1">Team Management</h1>
          <div class="w-10"></div>
        </header>

        <!-- Teams list -->
        <div class="space-y-4 mb-8">
          <div *ngFor="let team of teams" class="bg-card border border-border rounded-2xl p-4 flex gap-4 items-center">
            <div class="h-12 w-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl shadow-sm">
              {{ team.avatar }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-sm text-slate-900 leading-tight truncate">{{ team.name }}</h3>
              <p class="text-xs text-slate-400 mt-1">👥 {{ team.members }} members • {{ team.sport }}</p>
            </div>
            <span class="text-xs font-bold text-primary border border-[#8CF000]/30 px-3 py-1.5 rounded-lg bg-[#8CF000]/5">
              MANAGE
            </span>
          </div>
        </div>

        <!-- Add Team CTA -->
        <button (click)="createTeam()" class="w-full h-12 rounded-full bg-gradient-to-r from-[#8CF000] to-[#A3E635] text-[#111827] font-bold shadow-md hover:scale-[1.01] active:scale-[0.99] transition-all">
          Create New Team
        </button>

      </main>
    </ion-content>
  `,
  styles: [
    `
      button.bg-gradient-to-r {
        background: linear-gradient(to right, #8CF000, #A3E635) !important;
      }
    `
  ]
})
export class TeamManagementPage {
  private readonly router = inject(Router);

  readonly teams = [
    { id: 1, name: 'Lucknow Football Stars', sport: 'Football', members: 14, avatar: '⚽' },
    { id: 2, name: 'Gomti Nagar Cricket Club', sport: 'Cricket', members: 22, avatar: '🏏' }
  ];

  back() {
    this.router.navigateByUrl('/app/home');
  }

  createTeam() {
    alert('Creating a new team flow... A chat group will be opened.');
    this.router.navigateByUrl('/app/chat');
  }
}
