import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ThemeService } from '../../core/services/theme.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="page">
        <header class="header">
          <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back"></ion-icon></button>
          <h1>System Settings</h1>
        </header>
        <button type="button" class="row" *ngFor="let item of items" (click)="item.action()">
          <div class="icon"><ion-icon [name]="item.icon"></ion-icon></div>
          <div class="text">
            <strong>{{ item.label }}</strong>
            <span>{{ item.desc }}</span>
          </div>
          <ion-icon name="chevron-forward" class="chevron"></ion-icon>
        </button>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .page { min-height: 100%; background: #fafbfc; padding: calc(16px + env(safe-area-inset-top,0px)) 20px calc(112px + env(safe-area-inset-bottom,0px)); }
      .header { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
      .back { width: 40px; height: 40px; min-height: unset; border-radius: 12px; background: #f3f4f6; display: grid; place-items: center; font-size: 20px; color: #111827; }
      h1 { margin: 0; font-size: 22px; font-weight: 700; color: #111827; }
      .row { display: flex; align-items: center; gap: 12px; width: 100%; background: #fff; border: 1px solid #e5e7eb; border-radius: 16px; padding: 14px; margin-bottom: 10px; text-align: left; min-height: unset; }
      .icon { width: 40px; height: 40px; border-radius: 12px; background: rgba(140,240,0,0.2); color: #8cf000; display: grid; place-items: center; font-size: 20px; }
      .text { flex: 1; } .text strong { display: block; color: #111827; font-size: 14px; } .text span { font-size: 12px; color: #6b7280; }
      .chevron { color: #9ca3af; }
    `,
  ],
})
export class AdminSettingsPage {
  private readonly router = inject(Router);
  private readonly theme = inject(ThemeService);
  private readonly auth = inject(AuthService);

  readonly items = [
    { label: 'Toggle Theme', desc: 'Switch light / dark mode', icon: 'moon-outline', action: () => this.theme.toggleTheme() },
    { label: 'Platform Fees', desc: 'Commission & pricing rules', icon: 'cash-outline', action: () => undefined },
    { label: 'Notifications', desc: 'System alerts & emails', icon: 'notifications-outline', action: () => undefined },
    { label: 'Log Out', desc: 'Sign out of admin panel', icon: 'log-out-outline', action: () => { this.auth.logout(); void this.router.navigateByUrl('/welcome'); } },
  ];

  back() { void this.router.navigateByUrl('/app/admin/dashboard'); }
}
