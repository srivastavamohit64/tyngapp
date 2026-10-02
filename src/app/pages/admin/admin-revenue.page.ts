import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

@Component({
  selector: 'app-admin-revenue',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  template: `
    <ion-content fullscreen>
      <app-brand-header-shell title="Revenue">
      <main class="page">
        <div class="hero-card">
          <p>Monthly Revenue</p>
          <h2>₹24,50,000</h2>
          <span>+18% vs last month</span>
        </div>
        <div class="row" *ngFor="let r of rows">
          <div>
            <strong>{{ r.label }}</strong>
            <span>{{ r.sub }}</span>
          </div>
          <strong class="amt">{{ r.amount }}</strong>
        </div>
      </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .page { min-height: 100%; background: #fafbfc; padding: 14px 20px calc(112px + var(--safe-area-bottom)); }
      .hero-card { background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to)); border-radius: 24px; padding: 24px; margin-bottom: 20px; color: #111827; }
      .hero-card p { margin: 0; font-size: 14px; opacity: 0.8; }
      .hero-card h2 { margin: 8px 0; font-size: 32px; font-weight: 900; }
      .hero-card span { font-size: 13px; font-weight: 700; }
      .row { display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px 16px; margin-bottom: 10px; }
      .row strong { display: block; color: #111827; font-size: 14px; }
      .row span { font-size: 12px; color: #6b7280; }
      .amt { color: var(--app-primary) !important; font-size: 15px !important; }
    `,
  ],
})
export class AdminRevenuePage {
  readonly rows = [
    { label: 'Venue Bookings', sub: 'Platform fee', amount: '₹12.4L' },
    { label: 'Coach Sessions', sub: 'Commission', amount: '₹8.1L' },
    { label: 'Premium Plans', sub: 'Subscriptions', amount: '₹4.0L' },
  ];
}
