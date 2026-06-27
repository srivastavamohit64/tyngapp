import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuController } from '@ionic/angular';
import { PlatformService } from './core/services/platform.service';
import { ThemeService } from './core/services/theme.service';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  private readonly platform = inject(PlatformService);
  readonly theme = inject(ThemeService);
  readonly auth = inject(AuthService);
  private readonly menu = inject(MenuController);
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.platform.init();
  }

  getRoleEmoji(): string {
    const role = this.auth.user()?.role;
    if (role === 'coach') return '👨‍🏫';
    if (role === 'venue') return '🏟️';
    return '🏏';
  }

  async navigateTo(path: string) {
    await this.menu.close();
    void this.router.navigateByUrl(path);
  }

  async logout() {
    await this.menu.close();
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
}
