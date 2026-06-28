import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { SplashPage } from './pages/splash/splash.page';

const routes: Routes = [
  {
    path: '',
    component: SplashPage,
    pathMatch: 'full',
  },
  {
    path: 'splash',
    component: SplashPage,
  },
  {
    path: 'login',
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then((m) => m.WelcomePage),
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
        path: 'teams',
        loadComponent: () => import('./pages/coach/teams/teams.page').then((m) => m.CoachTeamsPage),
      },
      {
        path: 'coach/evaluate',
        loadComponent: () => import('./pages/coach/evaluate/evaluate.page').then((m) => m.CoachEvaluatePage),
      },
      {
        path: 'coach/plan',
        loadComponent: () => import('./pages/coach/plan/plan.page').then((m) => m.CoachPlanPage),
      },
      {
        path: 'schedule',
        loadComponent: () => import('./pages/coach/schedule/schedule.page').then((m) => m.CoachSchedulePage),
      },
      {
        path: 'venue/calendar',
        loadComponent: () => import('./pages/venue/calendar/calendar.page').then((m) => m.VenueCalendarPage),
      },
      {
        path: 'venue/analytics',
        loadComponent: () => import('./pages/venue/analytics/analytics.page').then((m) => m.VenueAnalyticsPage),
      },
      {
        path: 'venue/bookings',
        loadComponent: () => import('./pages/venue/bookings/bookings.page').then((m) => m.VenueBookingsPage),
      },
      {
        path: 'venue/facilities',
        loadComponent: () => import('./pages/venue/facilities/facilities.page').then((m) => m.VenueFacilitiesPage),
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
