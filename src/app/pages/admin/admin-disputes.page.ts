import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-admin-disputes',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="page">
        <header class="header">
          <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back"></ion-icon></button>
          <h1>Disputes</h1>
        </header>
        <div class="card" *ngFor="let d of disputes">
          <div class="top">
            <strong>{{ d.id }}</strong>
            <span [class]="d.severity">{{ d.severity }}</span>
          </div>
          <p>{{ d.message }}</p>
          <div class="actions">
            <button type="button" class="resolve">Resolve</button>
            <button type="button" class="view">View</button>
          </div>
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
      .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 20px; padding: 16px; margin-bottom: 12px; }
      .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .top strong { color: #111827; }
      .top span { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; background: rgba(255,122,0,0.15); color: #ff7a00; }
      .top span.high { background: rgba(239,68,68,0.15); color: #ef4444; }
      p { margin: 0 0 12px; font-size: 14px; color: #6b7280; }
      .actions { display: flex; gap: 8px; }
      .resolve { flex: 1; min-height: 44px; border-radius: 12px; background: linear-gradient(135deg,#8cf000,#a3e635); color: #111827; font-weight: 700; }
      .view { flex: 1; min-height: 44px; border-radius: 12px; background: #f3f4f6; color: #111827; font-weight: 600; }
    `,
  ],
})
export class AdminDisputesPage {
  private readonly router = inject(Router);
  readonly disputes = [
    { id: 'Case #12453', message: 'Payment dispute reported by user', severity: 'high' },
    { id: 'Case #4521', message: 'Venue booking cancellation conflict', severity: 'medium' },
  ];
  back() { void this.router.navigateByUrl('/app/admin/dashboard'); }
}
