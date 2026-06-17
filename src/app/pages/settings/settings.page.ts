import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [IonicModule, HeaderComponent],
  template: `
    <ion-content fullscreen>
      <main class="min-h-full bg-background text-white">
        <app-header title="Settings" [showBack]="true" (back)="router.navigateByUrl('/app/profile')"></app-header>
        <section class="space-y-3 px-6 py-5">
          <button class="h-14 w-full rounded-2xl border border-white/10 bg-card text-left px-5">Account</button>
          <button class="h-14 w-full rounded-2xl border border-white/10 bg-card text-left px-5">Notifications</button>
          <button class="h-14 w-full rounded-2xl border border-white/10 bg-card text-left px-5">Privacy</button>
        </section>
      </main>
    </ion-content>
  `,
})
export class SettingsPage {
  readonly router = inject(Router);
}
