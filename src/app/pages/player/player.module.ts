import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { IonicModule } from '@ionic/angular';

import { PlayerTabsPage } from './player-tabs.page';
import { PlayerHomePage } from './player-home.page';
import { PlayerDiscoverPage } from './player-discover.page';
import { PlayerVenuesPage } from './player-venues.page';
import { PlayerLeaderboardPage } from './player-leaderboard.page';
import { PlayerProfilePage } from './player-profile.page';
import { CreateGamePage } from './create-game.page';
import { LiveMapPage } from './live-map.page';

const routes: Routes = [
  {
    path: '',
    component: PlayerTabsPage,
    children: [
      { path: 'home', component: PlayerHomePage },
      { path: 'discover', component: PlayerDiscoverPage },
      { path: 'venues', component: PlayerVenuesPage },
      { path: 'leaderboard', component: PlayerLeaderboardPage },
      { path: 'profile', component: PlayerProfilePage },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
  { path: 'game/create', component: CreateGamePage },
  { path: 'map', component: LiveMapPage },
];

@NgModule({
  declarations: [
    PlayerTabsPage,
    PlayerHomePage,
    PlayerDiscoverPage,
    PlayerVenuesPage,
    PlayerLeaderboardPage,
    PlayerProfilePage,
    CreateGamePage,
    LiveMapPage,
  ],
  imports: [CommonModule, FormsModule, IonicModule, RouterModule.forChild(routes)],
})
export class PlayerModule {}
