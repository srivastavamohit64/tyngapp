/**
 * Ambient typings for Laravel Echo + Pusher in the browser.
 */
import type Pusher from 'pusher-js';

declare global {
  interface Window {
    Pusher: typeof Pusher;
    Echo?: unknown;
  }
}

export {};
