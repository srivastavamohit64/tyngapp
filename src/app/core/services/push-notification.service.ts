import { Injectable, inject } from '@angular/core';
import { App } from '@capacitor/app';
import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  ActionPerformed,
  PushNotifications,
  PushNotificationSchema,
  Token,
} from '@capacitor/push-notifications';
import { firstValueFrom } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';
import { ForegroundNotificationService } from './foreground-notification.service';

const DEVICE_ID_KEY = 'tyng_device_id';
const LOG_PREFIX = '[TYNG Push]';
/** Must match android/app/.../strings.xml default_notification_channel_id */
const ANDROID_CHANNEL_ID = 'tyng_default';

interface DeviceInfoLike {
  model?: string;
  manufacturer?: string;
  osVersion?: string;
}

interface DeviceIdLike {
  identifier?: string;
}

interface DevicePluginLike {
  getInfo: () => Promise<DeviceInfoLike>;
  getId: () => Promise<DeviceIdLike>;
}

const Device = registerPlugin<DevicePluginLike>('Device');

@Injectable({ providedIn: 'root' })
export class PushNotificationService {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly foregroundNotifications = inject(ForegroundNotificationService);

  private initialized = false;
  private listenersAttached = false;
  private currentToken: string | null = null;
  private deviceId: string | null = null;

  getCurrentToken(): string | null {
    return this.currentToken;
  }

  getDeviceId(): string | null {
    return this.deviceId || localStorage.getItem(DEVICE_ID_KEY);
  }

  /**
   * Register for FCM on native platforms. Safe to call multiple times;
   * re-attempts if a previous run failed before registration completed.
   */
  async init(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      console.info(`${LOG_PREFIX} skip init — not a native platform (${Capacitor.getPlatform()})`);
      return;
    }

    if (this.initialized) {
      console.info(`${LOG_PREFIX} already initialized`, {
        tokenPreview: this.previewToken(this.currentToken),
      });
      return;
    }

    await this.ensureDeviceId();
    this.foregroundNotifications.bindAppState();
    console.info(`${LOG_PREFIX} init start`, {
      platform: Capacitor.getPlatform(),
      deviceId: this.getDeviceId(),
    });

    try {
      let perm = await PushNotifications.checkPermissions();
      console.info(`${LOG_PREFIX} checkPermissions`, perm);

      if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
        console.info(`${LOG_PREFIX} requesting POST_NOTIFICATIONS permission`);
        perm = await PushNotifications.requestPermissions();
        console.info(`${LOG_PREFIX} requestPermissions result`, perm);
      }

      if (perm.receive !== 'granted') {
        // Do not mark initialized — user can grant later in system settings.
        // App + realtime chat continue; in-app banners still work if events arrive another way.
        console.warn(`${LOG_PREFIX} permission not granted — system pushes disabled`, perm);
        return;
      }

      await this.ensureAndroidChannel();
      await this.attachListeners();

      console.info(`${LOG_PREFIX} calling PushNotifications.register()`);
      await PushNotifications.register();
      console.info(`${LOG_PREFIX} register() resolved (token arrives via "registration" listener)`);

      this.initialized = true;
    } catch (error) {
      console.error(`${LOG_PREFIX} init failed`, error);
      this.initialized = false;
    }
  }

  async syncIfAuthenticated(): Promise<void> {
    if (!this.auth.getToken()) {
      console.info(`${LOG_PREFIX} syncIfAuthenticated skipped — user not authenticated`);
      return;
    }

    await this.init();

    if (this.currentToken) {
      await this.syncToken(this.currentToken);
    } else {
      console.info(`${LOG_PREFIX} waiting for FCM token before backend sync`);
    }
  }

  async unregister(): Promise<void> {
    const token = this.currentToken;
    const deviceId = this.getDeviceId();

    if (!this.auth.getToken()) {
      this.currentToken = null;
      return;
    }

    try {
      console.info(`${LOG_PREFIX} unregister / mark logged-out on backend`, {
        tokenPreview: this.previewToken(token),
        deviceId,
      });
      await firstValueFrom(
        this.api.delete('/device-token', {
          token: token || undefined,
          device_id: deviceId || undefined,
        }),
      );
    } catch {
      // Ignore unregister failures on logout.
    } finally {
      this.currentToken = null;
    }
  }

  private async ensureAndroidChannel(): Promise<void> {
    if (Capacitor.getPlatform() !== 'android') {
      return;
    }

    try {
      await PushNotifications.createChannel({
        id: ANDROID_CHANNEL_ID,
        name: 'TYNG Notifications',
        description: 'Booking, wallet, and account alerts',
        importance: 5, // IMPORTANCE_HIGH — heads-up eligible
        visibility: 1, // VISIBILITY_PUBLIC
        sound: 'default',
        vibration: true,
        lights: true,
        lightColor: '#2212CC',
      });
      console.info(`${LOG_PREFIX} Android notification channel ready`, { id: ANDROID_CHANNEL_ID });
    } catch (error) {
      console.warn(`${LOG_PREFIX} createChannel failed (non-fatal on older Android)`, error);
    }
  }

  private async attachListeners(): Promise<void> {
    if (this.listenersAttached) {
      return;
    }

    // Attach BEFORE register() so retained registration events are not missed.
    await PushNotifications.removeAllListeners();

    await PushNotifications.addListener('registration', (token: Token) => {
      const value = token?.value || '';
      console.info(`${LOG_PREFIX} FCM registration token received`, {
        length: value.length,
        preview: this.previewToken(value),
        looksLikeFcm: this.looksLikeFcmToken(value),
      });
      this.currentToken = value;
      void this.syncToken(value);
    });

    await PushNotifications.addListener('registrationError', (error) => {
      console.error(`${LOG_PREFIX} registrationError`, error);
    });

    await PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        // Foreground: show centralized in-app banner (OS alert disabled in capacitor.config).
        console.info(`${LOG_PREFIX} pushNotificationReceived (foreground)`, {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          data: notification.data,
        });
        this.foregroundNotifications.handleIncoming(notification);
      },
    );

    await PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        console.info(`${LOG_PREFIX} pushNotificationActionPerformed (opened)`, {
          actionId: action.actionId,
          notification: action.notification,
        });
        this.foregroundNotifications.navigateFromPush(action.notification);
      },
    );

    this.listenersAttached = true;
    console.info(`${LOG_PREFIX} listeners attached (registration, received, actionPerformed)`);
  }

  private async syncToken(token: string): Promise<void> {
    if (!this.auth.getToken()) {
      console.info(`${LOG_PREFIX} token held locally — backend sync deferred until login`);
      return;
    }

    try {
      const details = await this.collectDeviceDetails();
      console.info(`${LOG_PREFIX} syncing token to backend /device-token`, {
        tokenPreview: this.previewToken(token),
        ...details,
      });
      await firstValueFrom(
        this.api.post('/device-token', {
          token,
          ...details,
        }),
      );
      console.info(`${LOG_PREFIX} backend token sync OK`);
    } catch (error) {
      console.warn(`${LOG_PREFIX} Failed to sync device token`, error);
    }
  }

  private async collectDeviceDetails(): Promise<{
    platform: string;
    device_id: string | null;
    device_model: string | null;
    device_manufacturer: string | null;
    os_version: string | null;
    app_version: string | null;
  }> {
    await this.ensureDeviceId();

    let deviceModel: string | null = null;
    let deviceManufacturer: string | null = null;
    let osVersion: string | null = null;
    let appVersion: string | null = null;

    try {
      if (Capacitor.isNativePlatform()) {
        const [device, app] = await Promise.all([
          Device.getInfo().catch(() => ({}) as DeviceInfoLike),
          App.getInfo(),
        ]);
        deviceModel = device.model || null;
        deviceManufacturer = device.manufacturer || null;
        osVersion = device.osVersion || null;
        appVersion = app.version || null;
      }
    } catch {
      // Fall back to platform-only details.
    }

    return {
      platform: Capacitor.getPlatform() === 'ios' ? 'ios' : Capacitor.getPlatform() === 'web' ? 'web' : 'android',
      device_id: this.getDeviceId(),
      device_model: deviceModel,
      device_manufacturer: deviceManufacturer,
      os_version: osVersion,
      app_version: appVersion,
    };
  }

  private async ensureDeviceId(): Promise<void> {
    const existing = localStorage.getItem(DEVICE_ID_KEY);
    if (existing) {
      this.deviceId = existing;
      return;
    }

    let id: string | null = null;
    try {
      if (Capacitor.isNativePlatform()) {
        const deviceId = await Device.getId();
        id = deviceId.identifier || null;
      }
    } catch {
      id = null;
    }

    if (!id) {
      id = `web-${Math.random().toString(36).slice(2)}-${Date.now()}`;
    }

    localStorage.setItem(DEVICE_ID_KEY, id);
    this.deviceId = id;
  }

  private looksLikeFcmToken(token: string): boolean {
    // FCM registration tokens are long opaque strings (typically 140+ chars).
    return typeof token === 'string' && token.length >= 100 && !token.includes(' ');
  }

  private previewToken(token: string | null): string | null {
    if (!token) {
      return null;
    }
    if (token.length <= 16) {
      return token;
    }
    return `${token.slice(0, 8)}…${token.slice(-6)} (len=${token.length})`;
  }

}
