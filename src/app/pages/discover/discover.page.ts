import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-discover-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  styleUrls: ['./discover.page.scss'],
  templateUrl: './discover.page.html',
})
export class DiscoverPage {
  private readonly router = inject(Router);

  currentIndex = 0;
  swipeDirection: 'left' | 'right' | null = null;
  swiping = false;

  // Drag gesture states
  startX = 0;
  currentX = 0;
  isDragging = false;

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

  readonly players = [
    {
      id: 1,
      name: 'Arjun Sharma',
      age: 24,
      photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400',
      sports: [
        { name: 'Cricket', emoji: '🏏', level: 'Expert' },
        { name: 'Football', emoji: '⚽', level: 'Advanced' },
      ],
      tp: 1250,
      reliabilityScore: 98,
      winRate: 72,
      distance: 2.3,
      availability: 'Available Now',
      mascotBadges: ['🔥', '⚡', '🏆'],
      bio: 'Passionate cricketer looking for weekend matches. Love the competitive spirit!',
      gamesPlayed: 156,
    },
    {
      id: 2,
      name: 'Priya Verma',
      age: 22,
      photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
      sports: [
        { name: 'Tennis', emoji: '🎾', level: 'Advanced' },
        { name: 'Badminton', emoji: '🏸', level: 'Expert' },
      ],
      tp: 980,
      reliabilityScore: 95,
      winRate: 68,
      distance: 1.8,
      availability: 'Available Today',
      mascotBadges: ['🎯', '💪', '⭐'],
      bio: "Tennis enthusiast, always up for a challenge. Let's rally!",
      gamesPlayed: 89,
    },
    {
      id: 3,
      name: 'Vikram Singh',
      age: 28,
      photo: 'https://images.unsplash.com/photo-1557862921-37829c790f19?w=400',
      sports: [
        { name: 'Basketball', emoji: '🏀', level: 'Expert' },
        { name: 'Volleyball', emoji: '🏐', level: 'Advanced' },
      ],
      tp: 1580,
      reliabilityScore: 100,
      winRate: 81,
      distance: 4.2,
      availability: 'This Week',
      mascotBadges: ['👑', '🔥', '💎', '⚡'],
      bio: 'Pro basketball player. Looking for serious players only.',
      gamesPlayed: 234,
    },
    {
      id: 4,
      name: 'Ananya Patel',
      age: 26,
      photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
      sports: [
        { name: 'Badminton', emoji: '🏸', level: 'Advanced' },
        { name: 'Table Tennis', emoji: '🏓', level: 'Intermediate' },
      ],
      tp: 720,
      reliabilityScore: 92,
      winRate: 64,
      distance: 3.1,
      availability: 'Available Today',
      mascotBadges: ['🌟', '💫'],
      bio: 'Weekend warrior, love playing for fun and fitness!',
      gamesPlayed: 67,
    },
    {
      id: 5,
      name: 'Kabir Malhotra',
      age: 27,
      photo: 'https://images.unsplash.com/photo-1552058544-f2b08422138a?w=400',
      sports: [
        { name: 'Football', emoji: '⚽', level: 'Expert' },
        { name: 'Cricket', emoji: '🏏', level: 'Advanced' },
      ],
      tp: 1420,
      reliabilityScore: 96,
      winRate: 75,
      distance: 2.8,
      availability: 'Available Now',
      mascotBadges: ['⚡', '🎯', '💪'],
      bio: 'Football is life! Looking for competitive weekend matches.',
      gamesPlayed: 189,
    },
    {
      id: 6,
      name: 'Meera Krishnan',
      age: 23,
      photo: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400',
      sports: [
        { name: 'Badminton', emoji: '🏸', level: 'Expert' },
        { name: 'Tennis', emoji: '🎾', level: 'Advanced' },
      ],
      tp: 1100,
      reliabilityScore: 94,
      winRate: 70,
      distance: 1.5,
      availability: 'Available Today',
      mascotBadges: ['🏆', '⭐', '💎'],
      bio: 'Badminton champion seeking worthy opponents. Bring your A-game!',
      gamesPlayed: 134,
    },
  ];

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

      return matchesSport && matchesSkill && matchesDistance && matchesAge && matchesAvailability;
    });
  }

  get currentPlayer() {
    return this.filteredPlayers[this.currentIndex];
  }

  toggleFilters(show: boolean) {
    this.showFilters = show;
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
      this.swipe('right');
    } else if (this.currentX < -100) {
      this.swipe('left');
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

  swipe(direction: 'left' | 'right') {
    if (this.swiping) return;
    this.swiping = true;
    this.swipeDirection = direction;
    setTimeout(() => {
      this.currentIndex += 1;
      this.swiping = false;
      this.swipeDirection = null;
      this.currentX = 0;
    }, 300);
  }

  resetDiscovery() {
    this.currentIndex = 0;
    this.currentX = 0;
  }

  goHome() {
    this.router.navigateByUrl('/app/home');
  }
}
