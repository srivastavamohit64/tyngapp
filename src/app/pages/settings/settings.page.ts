import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  styleUrls: ['./settings.page.scss'],
  templateUrl: './settings.page.html',
})
export class SettingsPage {
  readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly options = [
    { name: 'Edit Profile', sub: 'Name, photo, location', icon: 'person-outline', path: '/app/profile/edit' },
    { name: 'Change Password', sub: 'Update your password', icon: 'lock-closed-outline', path: '/app/change-password' },
    { name: 'Notifications', sub: 'Choose which alerts you receive', icon: 'notifications-outline', path: '/app/settings/notifications' },
    { name: 'Blocked Users', sub: 'People you have blocked', icon: 'ban-outline', path: '/app/blocked-users' },
    { name: 'Privacy Policy', sub: 'How we use and protect your data', icon: 'shield-checkmark-outline', path: '/app/legal/privacy-policy' },
    { name: 'Terms & Conditions', sub: 'Rules for using TYNG', icon: 'document-text-outline', path: '/app/legal/terms-conditions' },
  ];

  openOption(path: string | null) {
    if (path) {
      void this.router.navigateByUrl(path);
    }
  }

  logout() {
    this.auth.logout().subscribe();
  }
}
