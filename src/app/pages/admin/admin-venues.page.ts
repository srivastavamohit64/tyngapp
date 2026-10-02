import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

@Component({
  selector: 'app-admin-venues',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  template: `
    <ion-content fullscreen>
      <app-brand-header-shell title="Venue Management">
      <main class="page">
        <header class="header">
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
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .page { min-height: 100%; background: #fafbfc; padding: 14px 20px calc(112px + var(--safe-area-bottom)); }
      .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      h1 { margin: 0; font-size: var(--app-header-title-size); font-weight: var(--app-header-title-weight); line-height: var(--app-header-title-line-height); color: #111827; }
      .card { display: flex; align-items: center; gap: 12px; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px; margin-bottom: 10px; }
      .emoji { width: 48px; height: 48px; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; font-size: 24px; }
      .info { flex: 1; } .info strong { display: block; color: #111827; } .info span { font-size: 12px; color: #6b7280; }
      .status { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; background: rgba(var(--app-primary-rgb),0.2); color: #111827; }
      .status.pending { background: rgba(255,122,0,0.15); color: #ff7a00; }
    `,
  ],
})
export class AdminVenuesPage {
  readonly venues = [
    { name: 'Phoenix Sports Hub', emoji: '🏟️', location: 'Aliganj', status: 'approved' },
    { name: 'Elite Sports Arena', emoji: '⚽', location: 'Indira Nagar', status: 'pending' },
    { name: 'PlayZone Complex', emoji: '🏀', location: 'Gomti Nagar', status: 'approved' },
  ];
}
