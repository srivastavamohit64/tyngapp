import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output, signal, SimpleChanges } from '@angular/core';
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
          *ngIf="hasCurrentImage; else imageFallback"
          [src]="images[current()]" 
          alt="Venue visual" 
          class="carousel-img"
          (error)="imageFailed = true"
        />
        <ng-template #imageFallback>
          <div class="carousel-fallback" aria-label="Image unavailable">
            <ion-icon name="image-outline"></ion-icon>
            <span>Image unavailable</span>
          </div>
        </ng-template>
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
      <div *ngIf="images.length" class="carousel-counter">
        <span>{{ current() + 1 }}/{{ images.length }}</span>
      </div>

      <!-- Pagination dots -->
      <div *ngIf="images.length > 1" class="carousel-dots">
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

      .carousel-fallback {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 10px;
        color: rgba(255, 255, 255, 0.8);
        background: linear-gradient(145deg, #334155, #111827);
        font-size: 13px;
        font-weight: 700;
      }

      .carousel-fallback ion-icon { font-size: 30px; }

      .carousel-overlay {
        position: absolute;
        inset: 0;
        background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, transparent 40%, rgba(0, 0, 0, 0.5) 100%);
        pointer-events: none;
      }

      .carousel-btn {
        position: absolute;
        top: calc(12px + var(--safe-area-top));
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
        transition: transform var(--app-motion-fast) var(--app-motion-ease), background var(--app-motion-fast) ease;
      }

      .carousel-btn:active {
        transform: scale(0.94);
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
        top: calc(18px + var(--safe-area-top));
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
        transition: width var(--app-motion-base) var(--app-motion-ease), background-color var(--app-motion-base) ease;
      }

      .carousel-dot-active {
        width: 20px;
        background: var(--app-primary);
      }

      @keyframes fadeIn {
        from { opacity: 0.7; }
        to { opacity: 1; }
      }
    `,
  ],
})
export class ImageCarouselComponent implements OnChanges {
  @Input() images: string[] = [];
  @Input() showBack = true;
  @Input() showFavourite = true;

  @Output() backClick = new EventEmitter<void>();
  @Output() favouriteChange = new EventEmitter<boolean>();

  readonly current = signal(0);
  readonly favourited = signal(false);
  imageFailed = false;

  get hasCurrentImage(): boolean {
    return !this.imageFailed && !!this.images[this.current()];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images']) {
      this.current.set(Math.max(0, Math.min(this.current(), Math.max(0, this.images.length - 1))));
      this.imageFailed = false;
    }
  }

  private touchStartX = 0;

  setCurrent(idx: number) {
    this.current.set(idx);
    this.imageFailed = false;
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
    if (this.images.length < 2) return;
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
