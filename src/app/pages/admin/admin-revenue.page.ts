import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-admin-revenue',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="page">
        <header class="header">
          <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back"></ion-icon></button>
          <h1>Revenue</h1>
        </header>
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
    </ion-content>
  `,
  styles: [
    `
      .page { min-height: 100%; background: #fafbfc; padding: calc(16px + env(safe-area-inset-top,0px)) 20px calc(112px + env(safe-area-inset-bottom,0px)); }
      .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      .back { width: 40px; height: 40px; min-height: unset; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; font-size: 20px; color: #111827; }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: #111827; }
      .hero-card { background: linear-gradient(135deg, #8cf000, #a3e635); border-radius: 24px; padding: 24px; margin-bottom: 20px; color: #111827; }
      .hero-card p { margin: 0; font-size: 14px; opacity: 0.8; }
      .hero-card h2 { margin: 8px 0; font-size: 32px; font-weight: 900; }
      .hero-card span { font-size: 13px; font-weight: 700; }
      .row { display: flex; justify-content: space-between; align-items: center; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px 16px; margin-bottom: 10px; }
      .row strong { display: block; color: #111827; font-size: 14px; }
      .row span { font-size: 12px; color: #6b7280; }
      .amt { color: #8cf000 !important; font-size: 15px !important; }
    `,
  ],
})
export class AdminRevenuePage {
  private readonly router = inject(Router);
  readonly rows = [
    { label: 'Venue Bookings', sub: 'Platform fee', amount: '₹12.4L' },
    { label: 'Coach Sessions', sub: 'Commission', amount: '₹8.1L' },
    { label: 'Premium Plans', sub: 'Subscriptions', amount: '₹4.0L' },
  ];
  back() { void this.router.navigateByUrl('/app/admin/dashboard'); }
}
