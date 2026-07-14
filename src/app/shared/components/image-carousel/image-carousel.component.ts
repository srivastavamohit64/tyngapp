import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-image-carousel',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="carousel-container">
      <!-- Swipeable image area -->
      <div 
        class="carousel-slides" 
        (touchstart)="onTouchStart($event)"
        (touchend)="onTouchEnd($event)"
      >
        <img 
          [src]="images[current()]" 
          alt="Venue visual" 
          class="carousel-img" 
        />
        <div class="carousel-overlay"></div>
      </div>

      <!-- Back button -->
      <button 
        *ngIf="showBack"
        type="button" 
        class="carousel-btn btn-left" 
        (click)="onBackClick()"
      >
        <ion-icon name="chevron-back-outline" class="btn-icon"></ion-icon>
      </button>

      <!-- Favourite button -->
      <button 
        *ngIf="showFavourite"
        type="button" 
        class="carousel-btn btn-right" 
        (click)="toggleFavourite()"
      >
        <ion-icon 
          [name]="favourited() ? 'heart' : 'heart-outline'" 
          [class.heart-active]="favourited()"
          class="btn-icon"
        ></ion-icon>
      </button>

      <!-- Image counter -->
      <div class="carousel-counter">
        <span>{{ current() + 1 }}/{{ images.length }}</span>
      </div>

      <!-- Pagination dots -->
      <div class="carousel-dots">
        <button
          *ngFor="let img of images; let idx = index"
          type="button"
          class="carousel-dot"
          [class.carousel-dot-active]="idx === current()"
          (click)="setCurrent(idx)"
        ></button>
      </div>
    </div>
  `,
  styles: [
    `
      .carousel-container {
        position: relative;
        height: 300px;
        background: #111827;
        overflow: hidden;
      }

      .carousel-slides {
        width: 100%;
        height: 100%;
        position: relative;
      }

      .carousel-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        animation: fadeIn 0.3s ease-out;
      }

      .carousel-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 40%, rgba(0, 0, 0, 0.5) 100%);
        pointer-events: none;
      }

      .carousel-btn {
        position: absolute;
        top: calc(12px + env(safe-area-inset-top, 0px));
        z-index: 10;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 0;
        outline: none;
        transition: transform 0.1s ease;
      }

      .carousel-btn:active {
        transform: scale(0.9);
      }

      .btn-left {
        left: 16px;
      }

      .btn-right {
        right: 16px;
      }

      .btn-icon {
        font-size: 18px;
        color: #ffffff;
      }

      .heart-active {
        color: #f87171 !important;
      }

      .carousel-counter {
        position: absolute;
        top: calc(18px + env(safe-area-inset-top, 0px));
        right: 68px;
        z-index: 10;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        padding: 4px 10px;
        border-radius: 999px;
        line-height: 1;
      }

      .carousel-counter span {
        color: #ffffff;
        font-size: 11px;
        font-weight: 600;
      }

      .carousel-dots {
        position: absolute;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        gap: 6px;
        z-index: 10;
      }

      .carousel-dot {
        height: 6px;
        width: 6px;
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.6);
        border: none;
        padding: 0;
        cursor: pointer;
        outline: none;
        transition: width 0.22s ease, background-color 0.22s ease;
      }

      .carousel-dot-active {
        width: 20px;
        background: #8cf000;
      }

      @keyframes fadeIn {
        from { opacity: 0.7; }
        to { opacity: 1; }
      }
    `,
  ],
})
export class ImageCarouselComponent {
  @Input() images: string[] = [];
  @Input() showBack = true;
  @Input() showFavourite = true;

  @Output() backClick = new EventEmitter<void>();
  @Output() favouriteChange = new EventEmitter<boolean>();

  readonly current = signal(0);
  readonly favourited = signal(false);

  private touchStartX = 0;

  setCurrent(idx: number) {
    this.current.set(idx);
  }

  toggleFavourite() {
    const val = !this.favourited();
    this.favourited.set(val);
    this.favouriteChange.emit(val);
  }

  onBackClick() {
    this.backClick.emit();
  }

  onTouchStart(event: TouchEvent) {
    this.touchStartX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent) {
    const touchEndX = event.changedTouches[0].clientX;
    const diff = this.touchStartX - touchEndX;

    if (diff > 50) {
      // Swiped left -> next image
      this.current.update(c => Math.min(this.images.length - 1, c + 1));
    } else if (diff < -50) {
      // Swiped right -> prev image
      this.current.update(c => Math.max(0, c - 1));
    }
  }
}
