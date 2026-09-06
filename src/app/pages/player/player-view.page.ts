import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DiscoverPlayer } from '../../core/models/api.model';
import { SocialService } from '../../core/services/social.service';
import { sportEmoji } from '../../core/utils/booking.utils';
import { PageSkeletonComponent } from '../../shared/components/skeleton';

@Component({
  selector: 'app-player-view',
  standalone: true,
  imports: [CommonModule, IonicModule, PageSkeletonComponent],
  template: `
    <ion-content fullscreen>
      <div class="page" *ngIf="loading">
        <header class="hdr">
          <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back"></ion-icon></button>
          <h1>Player</h1>
          <span class="spacer"></span>
        </header>
        <div class="px-4">
          <app-page-skeleton variant="profile" label="Loading player"></app-page-skeleton>
        </div>
      </div>

      <div class="page" *ngIf="!loading && error">
        <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back"></ion-icon></button>
        <div class="state">{{ error }}</div>
      </div>

      <div class="page" *ngIf="!loading && player">
        <header class="hdr">
          <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back"></ion-icon></button>
          <h1>Player</h1>
          <span class="spacer"></span>
        </header>

        <div class="hero">
          <img class="avatar" [src]="player.profileImage || fallbackPhoto" [alt]="player.name" />
          <h2>{{ player.name }}</h2>
          <p class="meta">
            <ion-icon name="location-outline"></ion-icon>
            {{ player.city || 'Location not set' }}
            <span *ngIf="player.distance != null"> · {{ player.distance }} km</span>
          </p>
          <p class="bio" *ngIf="player.bio">{{ player.bio }}</p>
        </div>

        <div class="card">
          <h3>Sports</h3>
          <div class="chips">
            <span *ngFor="let sport of player.sports">{{ sportEmoji(sport) }} {{ formatSport(sport) }}</span>
            <span *ngIf="!player.sports?.length">Not shared</span>
          </div>
        </div>

        <div class="card grid">
          <div>
            <span>Skill</span>
            <strong>{{ player.skillLevel || '—' }}</strong>
          </div>
          <div>
            <span>Rating</span>
            <strong>{{ player.rating || '—' }}</strong>
          </div>
          <div>
            <span>Games</span>
            <strong>{{ player.gamesPlayed || 0 }}</strong>
          </div>
          <div>
            <span>Position</span>
            <strong>{{ player.preferredPosition || 'Any' }}</strong>
          </div>
        </div>

        <button type="button" class="cta" (click)="goDiscover()">Find more players</button>
      </div>
    </ion-content>
  `,
  styles: [
    `
      .page {
        min-height: 100%;
        background: #fafbfc;
        padding: calc(12px + var(--safe-area-top)) 20px 32px;
      }
      .hdr {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      }
      .hdr h1 {
        flex: 1;
        margin: 0;
        text-align: center;
        font-size: 17px;
        font-weight: 900;
        color: #111827;
      }
      .spacer {
        width: 40px;
      }
      .back {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #f3f4f6;
        display: grid;
        place-items: center;
        color: #111827;
        font-size: 20px;
      }
      .state {
        text-align: center;
        color: #6b7280;
        padding: 48px 16px;
        font-weight: 600;
      }
      .hero {
        text-align: center;
        margin-bottom: 20px;
      }
      .avatar {
        width: 96px;
        height: 96px;
        border-radius: 999px;
        object-fit: cover;
        margin-bottom: 12px;
        background: #e5e7eb;
      }
      h2 {
        margin: 0 0 6px;
        font-size: 24px;
        font-weight: 900;
        color: #111827;
      }
      .meta {
        margin: 0;
        color: #6b7280;
        font-size: 13px;
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }
      .bio {
        margin: 12px auto 0;
        max-width: 320px;
        color: #6b7280;
        font-size: 13px;
        line-height: 1.5;
      }
      .card {
        background: #fff;
        border: 1px solid #f3f4f6;
        border-radius: 20px;
        padding: 16px;
        margin-bottom: 12px;
      }
      .card h3 {
        margin: 0 0 10px;
        font-size: 12px;
        font-weight: 800;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: #9ca3af;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }
      .chips span {
        background: rgba(var(--app-primary-rgb), 0.12);
        color: #111827;
        border-radius: 999px;
        padding: 6px 12px;
        font-size: 12px;
        font-weight: 700;
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }
      .grid span {
        display: block;
        font-size: 11px;
        color: #9ca3af;
        margin-bottom: 4px;
      }
      .grid strong {
        color: #111827;
        font-size: 14px;
      }
      .cta {
        width: 100%;
        margin-top: 8px;
        min-height: 52px;
        border-radius: 999px;
        background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
        color: #111827;
        font-weight: 800;
      }
    `,
  ],
})
export class PlayerViewPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly social = inject(SocialService);

  player: DiscoverPlayer | null = null;
  loading = true;
  error = '';
  readonly fallbackPhoto = 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200';
  readonly sportEmoji = sportEmoji;

  ngOnInit() {
    const navPlayer = history.state?.player as DiscoverPlayer | undefined;
    const id = this.route.snapshot.paramMap.get('id') || '';
    if (navPlayer && String(navPlayer.id) === id) {
      this.player = navPlayer;
      this.loading = false;
      return;
    }
    void this.loadPlayer(id);
  }

  formatSport(sport: string) {
    return sport.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  back() {
    void this.router.navigateByUrl('/app/home');
  }

  goDiscover() {
    void this.router.navigateByUrl('/app/discover');
  }

  private async loadPlayer(id: string) {
    this.loading = true;
    this.error = '';
    try {
      const friends = await firstValueFrom(this.social.getFriends());
      const fromFriends = (friends.data || []).find((item) => String(item.id) === id);
      if (fromFriends) {
        this.player = {
          id: fromFriends.id,
          name: fromFriends.name,
          profileImage: fromFriends.profileImage,
          city: fromFriends.city,
          sports: fromFriends.sports || [],
          skillLevel: fromFriends.skill,
          bio: fromFriends.bio,
        };
        return;
      }

      const discover = await firstValueFrom(this.social.getDiscoverPlayers('per_page=50'));
      const match = discover.data?.items?.find((item) => String(item.id) === id);
      if (match) {
        this.player = match;
        return;
      }

      this.error = 'Player not found.';
    } catch {
      this.error = 'Unable to load player.';
    } finally {
      this.loading = false;
    }
  }
}
