import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/welcome/welcome.page').then((m) => m.WelcomePage),
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'auth',
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'app/onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'app/chat',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/chat/chat.page').then((m) => m.ChatPage),
  },
  {
    path: 'app/map',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/events/events.page').then((m) => m.EventsPage),
  },
  {
    path: 'app/game/create',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/events/events.page').then((m) => m.EventsPage),
  },
  {
    path: 'app/game/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/events/events.page').then((m) => m.EventsPage),
  },
  {
    path: 'app/events/details/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/events/events.page').then((m) => m.EventsPage),
  },
  {
    path: 'app/events/:mode',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/events/events.page').then((m) => m.EventsPage),
  },
  {
    path: 'app/settings',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/settings/settings.page').then((m) => m.SettingsPage),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/tabs/tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home.page').then((m) => m.HomePage),
      },
      {
        path: 'discover',
        loadComponent: () => import('./pages/discover/discover.page').then((m) => m.DiscoverPage),
      },
      {
        path: 'venues',
        loadComponent: () => import('./pages/events/venues.page').then((m) => m.VenuesPage),
      },
      {
        path: 'leaderboard',
        loadComponent: () => import('./pages/events/leaderboard.page').then((m) => m.LeaderboardPage),
      },
      {
        path: 'profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: '',
        pathMatch: 'full',
        redirectTo: 'home',
      },
    ],
  },
  {
    path: '**',
    redirectTo: '',
  },
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule { }
