import { Injectable, NgZone, computed, inject, signal } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'tel', 'url', 'password', 'number', 'date', 'time', 'datetime-local']);

@Injectable({ providedIn: 'root' })
export class UiChromeService {
  private readonly zone = inject(NgZone);
  private readonly overlays = signal(0);
  readonly overlayOpen = computed(() => this.overlays() > 0);
  readonly keyboardOpen = signal(false);

  constructor() {
    if (Capacitor.isNativePlatform()) {
      this.watchNativeKeyboard();
    } else if (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches) {
      this.watchWebKeyboard();
    }
  }

  openOverlay(): void {
    this.overlays.update((n) => n + 1);
  }

  closeOverlay(): void {
    this.overlays.update((n) => Math.max(0, n - 1));
  }

  private setKeyboardOpen(open: boolean): void {
    this.zone.run(() => this.keyboardOpen.set(open));
  }

  private watchNativeKeyboard(): void {
    void Keyboard.addListener('keyboardWillShow', () => this.setKeyboardOpen(true));
    void Keyboard.addListener('keyboardDidShow', () => this.setKeyboardOpen(true));
    void Keyboard.addListener('keyboardWillHide', () => this.setKeyboardOpen(false));
    void Keyboard.addListener('keyboardDidHide', () => this.setKeyboardOpen(false));
  }

  /** Mobile browsers have no keyboard events, so treat a focused text field as an open keyboard. */
  private watchWebKeyboard(): void {
    document.addEventListener('focusin', (event) => {
      if (this.isTextField(event.target)) this.setKeyboardOpen(true);
    });
    document.addEventListener('focusout', () => {
      setTimeout(() => this.setKeyboardOpen(this.isTextField(document.activeElement)), 50);
    });
  }

  private isTextField(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement)) return false;
    if (target.isContentEditable || target instanceof HTMLTextAreaElement) return true;
    if (target instanceof HTMLInputElement) {
      return !target.readOnly && TEXT_INPUT_TYPES.has((target.type || 'text').toLowerCase());
    }
    return false;
  }
}
