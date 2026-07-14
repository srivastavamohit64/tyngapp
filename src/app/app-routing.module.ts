import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
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
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'welcome',
    loadComponent: () => import('./pages/welcome/welcome.page').then((m) => m.WelcomePage),
  },
  {
    path: 'auth',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/auth.page').then((m) => m.AuthPage),
  },
  {
    path: 'forgot-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/forgot-password.page').then((m) => m.ForgotPasswordPage),
  },
  {
    path: 'reset-password',
    canActivate: [guestGuard],
    loadComponent: () => import('./pages/auth/reset-password.page').then((m) => m.ResetPasswordPage),
  },
  {
    path: 'onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'coach-onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/coach/coach-onboarding.page').then((m) => m.CoachOnboardingPage),
  },
  {
    path: 'venue-onboarding',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/venue/venue-onboarding.page').then((m) => m.VenueOnboardingPage),
  },
  {
    path: 'app/onboarding',
    loadComponent: () => import('./pages/onboarding/onboarding.page').then((m) => m.OnboardingPage),
  },
  {
    path: 'app/map',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/player/live-map.page').then((m) => m.LiveMapPage),
  },
  {
    path: 'app/game/create',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/player/create-game.page').then((m) => m.CreateGamePage),
  },
  {
    path: 'app/game/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/player/game-detail.page').then((m) => m.GameDetailPage),
  },
  {
    path: 'app/events/details/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/player/game-detail.page').then((m) => m.GameDetailPage),
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
    path: 'app/profile/edit',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/edit-profile.page').then((m) => m.EditProfilePage),
  },
  {
    path: 'app/change-password',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/profile/change-password.page').then((m) => m.ChangePasswordPage),
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
        path: 'coach/dashboard',
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
        path: 'coach/schedule',
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
      // Player new routes
      {
        path: 'coaches',
        loadComponent: () => import('./pages/player/coaches.page').then((m) => m.CoachesPage),
      },
      {
        path: 'coaches/:id',
        loadComponent: () => import('./pages/player/coach-profile-detail.page').then((m) => m.CoachProfileDetailPage),
      },
      {
        path: 'ongoing',
        loadComponent: () => import('./pages/player/ongoing-games.page').then((m) => m.OngoingGamesPage),
      },
      {
        path: 'ongoing/:id',
        loadComponent: () => import('./pages/player/game-detail.page').then((m) => m.GameDetailPage),
      },
      {
        path: 'venue/:id',
        loadComponent: () => import('./pages/player/venue-detail.page').then((m) => m.VenueDetailPage),
      },
      {
        path: 'venue/:id/book',
        loadComponent: () => import('./pages/player/venue-booking.page').then((m) => m.VenueBookingPage),
      },
      {
        path: 'venue/:id/summary',
        loadComponent: () => import('./pages/player/venue-booking-summary.page').then((m) => m.VenueBookingSummaryPage),
      },
      {
        path: 'my-bookings',
        loadComponent: () => import('./pages/player/my-bookings.page').then((m) => m.MyBookingsPage),
      },
      {
        path: 'notifications',
        loadComponent: () => import('./pages/player/notifications.page').then((m) => m.NotificationsPage),
      },
      {
        path: 'stats',
        loadComponent: () => import('./pages/player/stats.page').then((m) => m.StatsPage),
      },
      {
        path: 'team/manage',
        loadComponent: () => import('./pages/player/team-management.page').then((m) => m.TeamManagementPage),
      },
      {
        path: 'chat',
        loadComponent: () => import('./pages/player/chat-list.page').then((m) => m.ChatListPage),
      },
      {
        path: 'coach/chat',
        loadComponent: () => import('./pages/coach/coach-chat.page').then((m) => m.CoachChatPage),
      },
      {
        path: 'coach/profile',
        loadComponent: () => import('./pages/profile/profile.page').then((m) => m.ProfilePage),
      },
      {
        path: 'coach/teams',
        loadComponent: () => import('./pages/coach/teams/teams.page').then((m) => m.CoachTeamsPage),
      },
      {
        path: 'chat/:id',
        loadComponent: () => import('./pages/player/chat-room.page').then((m) => m.ChatRoomPage),
      },
      // Coach new routes
      {
        path: 'coach/complete-profile',
        loadComponent: () => import('./pages/coach/coach-complete-profile.page').then((m) => m.CoachCompleteProfilePage),
      },
      {
        path: 'coach/enroll-student',
        loadComponent: () => import('./pages/coach/coach-enroll-student.page').then((m) => m.CoachEnrollStudentPage),
      },
      {
        path: 'coach/create-session',
        loadComponent: () => import('./pages/coach/coach-create-session.page').then((m) => m.CoachCreateSessionPage),
      },
      {
        path: 'coach/book-venue',
        loadComponent: () => import('./pages/coach/coach-book-venue.page').then((m) => m.CoachBookVenuePage),
      },
      {
        path: 'coach/venue-booking',
        loadComponent: () => import('./pages/coach/coach-venue-booking.page').then((m) => m.CoachVenueBookingPage),
      },
      {
        path: 'coach/venue-collab/:id',
        loadComponent: () => import('./pages/coach/venue-collab-detail.page').then((m) => m.VenueCollabDetailPage),
      },
      {
        path: 'coach/settings',
        loadComponent: () => import('./pages/coach/coach-settings.page').then((m) => m.CoachSettingsPage),
      },
      {
        path: 'coach/earnings',
        loadComponent: () => import('./pages/coach/coach-earnings.page').then((m) => m.CoachEarningsPage),
      },
      {
        path: 'coach/insights',
        loadComponent: () => import('./pages/coach/coach-insights.page').then((m) => m.CoachInsightsPage),
      },
      {
        path: 'coach/students',
        loadComponent: () => import('./pages/coach/coach-students.page').then((m) => m.CoachStudentsPage),
      },
      {
        path: 'coach/student/:id',
        loadComponent: () => import('./pages/coach/coach-student-profile.page').then((m) => m.CoachStudentProfilePage),
      },
      {
        path: 'coach/session/:id',
        loadComponent: () => import('./pages/coach/coach-session-detail.page').then((m) => m.CoachSessionDetailPage),
      },
      {
        path: 'coach/notifications',
        loadComponent: () => import('./pages/coach/coach-notifications.page').then((m) => m.CoachNotificationsPage),
      },
      {
        path: 'venue/dashboard',
        loadComponent: () => import('./pages/venue/venue-dashboard.page').then((m) => m.VenueDashboardPage),
      },
      {
        path: 'venue/notifications',
        loadComponent: () => import('./pages/venue/venue-notifications.page').then((m) => m.VenueNotificationsPage),
      },
      {
        path: 'venue/complete-profile',
        loadComponent: () => import('./pages/venue/venue-complete-profile.page').then((m) => m.VenueCompleteProfilePage),
      },
      {
        path: 'venue/earnings',
        loadComponent: () => import('./pages/venue/earnings/earnings.page').then((m) => m.VenueEarningsPage),
      },
      {
        path: 'venue/profile',
        loadComponent: () => import('./pages/venue/venue-profile.page').then((m) => m.VenueProfilePage),
      },
      // Admin routes
      {
        path: 'admin/dashboard',
        loadComponent: () => import('./pages/admin/admin-dashboard.page').then((m) => m.AdminDashboardPage),
      },
      {
        path: 'admin/users',
        loadComponent: () => import('./pages/admin/admin-users.page').then((m) => m.AdminUsersPage),
      },
      {
        path: 'admin/venues',
        loadComponent: () => import('./pages/admin/admin-venues.page').then((m) => m.AdminVenuesPage),
      },
      {
        path: 'admin/revenue',
        loadComponent: () => import('./pages/admin/admin-revenue.page').then((m) => m.AdminRevenuePage),
      },
      {
        path: 'admin/disputes',
        loadComponent: () => import('./pages/admin/admin-disputes.page').then((m) => m.AdminDisputesPage),
      },
      {
        path: 'admin/settings',
        loadComponent: () => import('./pages/admin/admin-settings.page').then((m) => m.AdminSettingsPage),
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
