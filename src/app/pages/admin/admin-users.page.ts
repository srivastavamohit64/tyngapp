import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="page">
        <header class="header">
          <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back"></ion-icon></button>
          <h1>User Management</h1>
        </header>
        <div class="search">
          <ion-icon name="search-outline"></ion-icon>
          <input type="text" [(ngModel)]="query" placeholder="Search users…" />
        </div>
        <div class="user-card" *ngFor="let u of filtered">
          <div class="avatar">{{ u.avatar }}</div>
          <div class="info">
            <strong>{{ u.name }}</strong>
            <span>{{ u.role }} · {{ u.city }}</span>
          </div>
          <span class="badge" [class.banned]="u.status === 'banned'">{{ u.status }}</span>
        </div>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .page { min-height: 100%; background: #fafbfc; padding: calc(16px + env(safe-area-inset-top,0px)) 20px calc(112px + env(safe-area-inset-bottom,0px)); }
      .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      .back { width: 40px; height: 40px; min-height: unset; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; font-size: 20px; color: #111827; }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: #111827; }
      .search { display: flex; align-items: center; gap: 10px; background: #f3f4f6; border-radius: 16px; padding: 12px 16px; margin-bottom: 16px; color: #9ca3af; }
      .search input { flex: 1; border: none !important; background: transparent !important; box-shadow: none !important; outline: none; color: #111827; font-size: 14px; }
      .user-card { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px; margin-bottom: 10px; }
      .avatar { width: 44px; height: 44px; border-radius: 50%; background: #f3f4f6; display: grid; place-items: center; font-size: 22px; }
      .info { flex: 1; } .info strong { display: block; color: #111827; font-size: 14px; } .info span { font-size: 12px; color: #6b7280; }
      .badge { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; background: rgba(140,240,0,0.2); color: #111827; }
      .badge.banned { background: rgba(239,68,68,0.15); color: #ef4444; }
    `,
  ],
})
export class AdminUsersPage {
  private readonly router = inject(Router);
  query = '';
  readonly users = [
    { name: 'Rahul Sharma', avatar: '🏏', role: 'Player', city: 'Lucknow', status: 'active' },
    { name: 'Coach Arvind', avatar: '👨‍🏫', role: 'Coach', city: 'Lucknow', status: 'active' },
    { name: 'Phoenix Arena', avatar: '🏟️', role: 'Venue', city: 'Lucknow', status: 'active' },
    { name: 'Spam Account', avatar: '⚠️', role: 'Player', city: 'Unknown', status: 'banned' },
  ];
  get filtered() {
    const q = this.query.toLowerCase();
    return this.users.filter((u) => !q || u.name.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }
  back() { void this.router.navigateByUrl('/app/admin/dashboard'); }
}
