import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiChromeService {
  private readonly overlays = signal(0);
  readonly overlayOpen = computed(() => this.overlays() > 0);

  openOverlay(): void {
    this.overlays.update((n) => n + 1);
  }

  closeOverlay(): void {
    this.overlays.update((n) => Math.max(0, n - 1));
  }
}
