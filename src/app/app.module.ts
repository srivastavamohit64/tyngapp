import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { RouteReuseStrategy } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { appPageTransition } from './core/utils/page-transition';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { apiInterceptor } from './core/interceptors/api.interceptor';
import { AuthService } from './core/services/auth.service';
import { ThemeService } from './core/services/theme.service';
import { InAppNotificationBannerComponent } from './shared/components/in-app-notification-banner/in-app-notification-banner.component';

export function initAuthSession(auth: AuthService) {
  return () => firstValueFrom(auth.ensureSession()).catch(() => false);
}

export function initAppTheme(theme: ThemeService) {
  return () => theme.init().catch(() => undefined);
}

@NgModule({
  declarations: [AppComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({
      mode: 'ios',
      animated: true,
      navAnimation: appPageTransition,
    }),
    AppRoutingModule,
    InAppNotificationBannerComponent,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(withInterceptors([apiInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: initAuthSession,
      deps: [AuthService],
      multi: true,
    },
    {
      provide: APP_INITIALIZER,
      useFactory: initAppTheme,
      deps: [ThemeService],
      multi: true,
    },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
