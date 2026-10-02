import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

@Component({
  selector: 'app-admin-disputes',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  template: `
    <ion-content fullscreen>
      <app-brand-header-shell>
      <main class="page">
        <header class="header">
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
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .page { min-height: 100%; background: #fafbfc; padding: 14px 20px calc(112px + var(--safe-area-bottom)); }
      .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      h1 { margin: 0; font-size: var(--app-header-title-size); font-weight: var(--app-header-title-weight); line-height: var(--app-header-title-line-height); color: #111827; }
      .card { background: #fff; border: 1px solid #e5e7eb; border-radius: 20px; padding: 16px; margin-bottom: 12px; }
      .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
      .top strong { color: #111827; }
      .top span { font-size: 11px; font-weight: 700; text-transform: uppercase; padding: 4px 10px; border-radius: 999px; background: rgba(255,122,0,0.15); color: #ff7a00; }
      .top span.high { background: rgba(239,68,68,0.15); color: #ef4444; }
      p { margin: 0 0 12px; font-size: 14px; color: #6b7280; }
      .actions { display: flex; gap: 8px; }
      .resolve { flex: 1; min-height: 44px; border-radius: 12px; background: linear-gradient(135deg,var(--app-primary),var(--app-primary-to)); color: #111827; font-weight: 700; }
      .view { flex: 1; min-height: 44px; border-radius: 12px; background: #f3f4f6; color: #111827; font-weight: 600; }
    `,
  ],
})
export class AdminDisputesPage {
  readonly disputes = [
    { id: 'Case #12453', message: 'Payment dispute reported by user', severity: 'high' },
    { id: 'Case #4521', message: 'Venue booking cancellation conflict', severity: 'medium' },
  ];
}
