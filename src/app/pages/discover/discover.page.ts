import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, MenuController, RefresherCustomEvent, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { DiscoverPlayer } from '../../core/models/api.model';
import { SocialService } from '../../core/services/social.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

interface PlayerSportBadge {
  name: string;
  emoji: string;
  level: string;
}

interface DiscoverPlayerCard {
  id: string;
  name: string;
  age: number;
  photo: string;
  sports: PlayerSportBadge[];
  tp: number;
  reliabilityScore: number;
  winRate: number;
  distance: number;
  availability: string;
  mascotBadges: string[];
  bio: string;
  gamesPlayed: number;
  gender: string;
  city: string;
  rating: number;
  preferredPosition: string;
  preferredTime: string;
  mutualFriends: number;
}

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule, BrandHeaderShellComponent],
  styleUrls: ['./discover.page.scss'],
  templateUrl: './discover.page.html',
})
export class DiscoverPage {
  private readonly router = inject(Router);
  private readonly menu = inject(MenuController);
  private readonly social = inject(SocialService);
  private readonly toastCtrl = inject(ToastController);

  currentIndex = 0;
  swipeDirection: 'left' | 'right' | null = null;
  swiping = false;
  loading = true;
  loadingMore = false;
  errorMessage = '';

  // Drag gesture states
  startX = 0;
  currentX = 0;
  isDragging = false;

  // Pagination
  page = 1;
  lastPage = 1;

  // Advanced Filters State
  showFilters = false;
  filters = {
    sport: 'All',
    skill: 'All',
    gender: 'All',
    distance: 15,
    ageMin: 18,
    ageMax: 45,
    competitiveLevel: 'All',
    availability: 'All',
  };

  players: DiscoverPlayerCard[] = [];

  constructor() {
    void this.fetchDiscoverPlayers(true);
  }

  get filteredPlayers() {
    return this.players.filter((player) => {
      const matchesSport =
        this.filters.sport === 'All' || player.sports.some((s) => s.name === this.filters.sport);
      const matchesSkill =
        this.filters.skill === 'All' || player.sports.some((s) => s.level === this.filters.skill);
      const matchesDistance = player.distance <= this.filters.distance;
      const matchesAge = player.age >= this.filters.ageMin && player.age <= this.filters.ageMax;
      const matchesAvailability =
        this.filters.availability === 'All' || player.availability === this.filters.availability;
      const matchesGender = this.filters.gender === 'All' || player.gender === this.filters.gender;

      return matchesSport && matchesSkill && matchesDistance && matchesAge && matchesAvailability && matchesGender;
    });
  }

  get currentPlayer() {
    return this.filteredPlayers[this.currentIndex];
  }

  async fetchDiscoverPlayers(reset = false): Promise<void> {
    if (reset) {
      this.loading = true;
      this.errorMessage = '';
      this.page = 1;
      this.lastPage = 1;
      this.players = [];
      this.currentIndex = 0;
    } else {
      this.loadingMore = true;
    }

    try {
      const query = new URLSearchParams({
        page: String(this.page),
        per_page: '20',
        sport: this.filters.sport,
        skill: this.filters.skill,
        gender: this.filters.gender,
      });

      const response = await firstValueFrom(this.social.getDiscoverPlayers(query.toString()));
      if (!response.success || !response.data) {
        this.errorMessage = response.message || 'Failed to load discover players.';
        return;
      }

      const cards = response.data.items.map((player) => this.mapPlayer(player));
      this.players = reset ? cards : [...this.players, ...cards];
      this.lastPage = response.data.pagination.lastPage;
      this.page = response.data.pagination.currentPage;
    } catch (error: any) {
      this.errorMessage = error?.error?.message || 'Unable to fetch players right now.';
    } finally {
      this.loading = false;
      this.loadingMore = false;
    }
  }

  async refresh(event: Event): Promise<void> {
    await this.fetchDiscoverPlayers(true);
    (event as RefresherCustomEvent).target.complete();
  }

  toggleFilters(show: boolean) {
    this.showFilters = show;
  }

  async applyFilters() {
    this.showFilters = false;
    await this.fetchDiscoverPlayers(true);
  }

  resetFilters() {
    this.filters = {
      sport: 'All',
      skill: 'All',
      gender: 'All',
      distance: 15,
      ageMin: 18,
      ageMax: 45,
      competitiveLevel: 'All',
      availability: 'All',
    };
  }

  getTransformStyle() {
    if (this.swiping) {
      if (this.swipeDirection === 'left') {
        return 'translateX(-150%) rotate(-30deg)';
      }
      if (this.swipeDirection === 'right') {
        return 'translateX(150%) rotate(30deg)';
      }
    }
    if (this.isDragging) {
      return `translateX(${this.currentX}px) rotate(${this.currentX * 0.08}deg)`;
    }
    return 'none';
  }

  getOpacityStyle() {
    if (this.swiping) return 0;
    if (this.isDragging) {
      const dragPercent = Math.min(Math.abs(this.currentX) / 250, 1);
      return 1 - dragPercent * 0.4;
    }
    return 1;
  }

  // Touch Event Handlers
  onTouchStart(event: TouchEvent) {
    this.startX = event.touches[0].clientX;
    this.isDragging = true;
    this.currentX = 0;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    this.currentX = event.touches[0].clientX - this.startX;
    if (Math.abs(this.currentX) > 10) {
      event.preventDefault();
    }
  }

  onTouchEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;

    if (this.currentX > 100) {
      void this.swipe('right');
    } else if (this.currentX < -100) {
      void this.swipe('left');
    } else {
      this.currentX = 0;
    }
  }

  // Mouse Event Handlers
  onMouseDown(event: MouseEvent) {
    if (event.button !== 0) return;
    this.startX = event.clientX;
    this.isDragging = true;
    this.currentX = 0;
    event.preventDefault();
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.currentX = event.clientX - this.startX;
  }

  onMouseUp() {
    this.onTouchEnd();
  }

  async swipe(direction: 'left' | 'right') {
    if (this.swiping || !this.currentPlayer) return;

    this.swiping = true;
    this.swipeDirection = direction;

    try {
      await firstValueFrom(this.social.swipePlayer(this.currentPlayer.id, direction));
    } catch (error: any) {
      await this.presentToast(error?.error?.message || 'Failed to save swipe action.', 'danger');
      this.swiping = false;
      this.swipeDirection = null;
      this.currentX = 0;
      return;
    }

    setTimeout(async () => {
      this.currentIndex += 1;
      this.swiping = false;
      this.swipeDirection = null;
      this.currentX = 0;

      if (this.currentIndex >= this.filteredPlayers.length && this.page < this.lastPage) {
        this.page += 1;
        await this.fetchDiscoverPlayers(false);
      }
    }, 300);
  }

  async resetDiscovery() {
    await this.fetchDiscoverPlayers(true);
  }

  goHome() {
    void this.router.navigateByUrl('/app/home');
  }

  async openMenu() {
    await this.menu.open();
  }

  openPlayer() {
    if (!this.currentPlayer) return;
    void this.router.navigateByUrl('/app/profile');
  }

  private mapPlayer(player: DiscoverPlayer): DiscoverPlayerCard {
    const sports = (player.sports?.length ? player.sports : ['Cricket']).slice(0, 3);

    return {
      id: player.id,
      name: player.name || 'Unknown Player',
      age: player.age ?? 24,
      photo: player.profileImage || 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      sports: sports.map((sport) => ({
        name: this.formatSportName(sport),
        emoji: this.sportEmoji(sport),
        level: player.skillLevel || 'Intermediate',
      })),
      tp: Math.max(100, Math.round((player.rating ?? 4.5) * 250)),
      reliabilityScore: Math.min(100, Math.max(80, Math.round((player.rating ?? 4.5) * 20))),
      winRate: Math.min(95, Math.max(40, Math.round((player.rating ?? 4.5) * 15))),
      distance: player.distance ?? 3.2,
      availability: this.resolveAvailability(player.availability),
      mascotBadges: this.resolveBadges(player.rating ?? 4.5, player.gamesPlayed ?? 0),
      bio: player.bio || 'Passionate player looking for quality matches and good team vibes.',
      gamesPlayed: player.gamesPlayed ?? 0,
      gender: player.gender || 'Not specified',
      city: player.city || 'City not shared',
      rating: player.rating ?? 4.5,
      preferredPosition: player.preferredPosition || 'Any Position',
      preferredTime: player.preferredTime || 'Flexible',
      mutualFriends: player.mutualFriends ?? 0,
    };
  }

  private resolveAvailability(availability?: string[]): string {
    if (!availability || availability.length === 0) return 'Available This Week';
    return availability[0] || 'Available This Week';
  }

  private formatSportName(value: string): string {
    return value
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  }

  private sportEmoji(sport: string): string {
    const key = sport.toLowerCase();
    if (key.includes('cricket')) return '🏏';
    if (key.includes('football')) return '⚽';
    if (key.includes('basketball')) return '🏀';
    if (key.includes('tennis')) return '🎾';
    if (key.includes('badminton')) return '🏸';
    if (key.includes('volleyball')) return '🏐';
    return '🎯';
  }

  private resolveBadges(rating: number, gamesPlayed: number): string[] {
    const badges: string[] = [];
    if (rating >= 4.7) badges.push('🏆');
    if (rating >= 4.4) badges.push('⭐');
    if (gamesPlayed >= 100) badges.push('🔥');
    if (gamesPlayed >= 50) badges.push('⚡');

    return badges.length ? badges : ['🌟'];
  }

  private async presentToast(message: string, color: 'danger' | 'success') {
    const toast = await this.toastCtrl.create({
      message,
      color,
      duration: 2200,
      position: 'bottom',
    });

    await toast.present();
  }
}
