import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-admin-venues',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="page">
        <header class="header">
          <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back"></ion-icon></button>
          <h1>Venue Management</h1>
        </header>
        <div class="card" *ngFor="let v of venues">
          <div class="emoji">{{ v.emoji }}</div>
          <div class="info">
            <strong>{{ v.name }}</strong>
            <span>{{ v.location }}</span>
          </div>
          <span class="status" [class.pending]="v.status === 'pending'">{{ v.status }}</span>
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
      .card { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px; margin-bottom: 10px; }
      .emoji { width: 48px; height: 48px; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; font-size: 24px; }
      .info { flex: 1; } .info strong { display: block; color: #111827; } .info span { font-size: 12px; color: #6b7280; }
      .status { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; background: rgba(140,240,0,0.2); color: #111827; }
      .status.pending { background: rgba(255,122,0,0.15); color: #ff7a00; }
    `,
  ],
})
export class AdminVenuesPage {
  private readonly router = inject(Router);
  readonly venues = [
    { name: 'Phoenix Sports Hub', emoji: '🏟️', location: 'Aliganj', status: 'approved' },
    { name: 'Elite Sports Arena', emoji: '⚽', location: 'Indira Nagar', status: 'pending' },
    { name: 'PlayZone Complex', emoji: '🏀', location: 'Gomti Nagar', status: 'approved' },
  ];
  back() { void this.router.navigateByUrl('/app/admin/dashboard'); }
}
