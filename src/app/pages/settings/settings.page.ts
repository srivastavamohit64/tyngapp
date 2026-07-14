import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./settings.page.scss'],
  templateUrl: './settings.page.html',
})
export class SettingsPage {
  readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly options = [
    { name: 'Edit Profile', sub: 'Name, photo, location', icon: 'person-outline', path: '/app/profile/edit' },
    { name: 'Change Password', sub: 'Update your password', icon: 'lock-closed-outline', path: '/app/change-password' },
    { name: 'Notifications', sub: 'Alerts and reminders', icon: 'notifications-outline', path: null },
    { name: 'Privacy', sub: 'Data and visibility', icon: 'shield-checkmark-outline', path: null },
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
