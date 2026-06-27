import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  styleUrls: ['./settings.page.scss'],
  templateUrl: './settings.page.html',
})
export class SettingsPage {
  readonly router = inject(Router);

  readonly options = [
    { name: 'Account', icon: 'person-outline' },
    { name: 'Notifications', icon: 'notifications-outline' },
    { name: 'Privacy', icon: 'shield-checkmark-outline' },
  ];

  goBack() {
    void this.router.navigateByUrl('/app/profile');
  }
}
