import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, OnDestroy, AfterViewInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { BookingService } from '../../core/services/booking.service';
import { MediaPermissionService } from '../../core/services/media-permission.service';

type BarcodeDetectorLike = {
  detect: (src: CanvasImageSource) => Promise<Array<{ rawValue: string }>>;
};

@Component({
  selector: 'app-check-in',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true">
      <div class="ci-page">
        <header>
          <button type="button" class="back" (click)="goBack()"><ion-icon name="chevron-back-outline"></ion-icon></button>
          <h1>Scan to Check In</h1>
        </header>

        <p class="lead">Point your camera at the <strong>venue QR</strong> displayed at the court. This marks you present for this booking.</p>

        <div class="preview-wrap">
          <video #video class="preview" playsinline muted autoplay></video>
          <button type="button" class="flip" (click)="toggleCamera()" [disabled]="busy()">
            <ion-icon name="camera-reverse-outline"></ion-icon>
            {{ facing() === 'environment' ? 'Front camera' : 'Back camera' }}
          </button>
        </div>
        <p class="cam-label">Using {{ facing() === 'environment' ? 'back' : 'front' }} camera</p>
        <p *ngIf="cameraError()" class="hint">{{ cameraError() }}</p>

        <input class="token" [(ngModel)]="token" placeholder="Or paste check-in token / URL" />

        <button type="button" class="go" [disabled]="busy()" (click)="submit()">
          {{ busy() ? 'Checking in…' : 'Check In' }}
        </button>
        <p *ngIf="success()" class="ok">You’re checked in for this session.</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .ci-page { padding: 16px 18px calc(24px + env(safe-area-inset-bottom, 0px)); }
    header { display: flex; align-items: center; gap: 8px; }
    h1 { margin: 0; font-size: 20px; font-weight: 900; }
    .back { border: none; background: #F3F4F6; width: 36px; height: 36px; border-radius: 50%; }
    .lead { color: #6B7280; font-weight: 600; }
    .preview-wrap { position: relative; }
    .preview { width: 100%; height: 280px; background: #111827; border-radius: 18px; object-fit: cover; }
    .flip {
      position: absolute; right: 12px; bottom: 12px; height: 40px; padding: 0 12px;
      border: 0; border-radius: 999px; background: rgba(17, 24, 39, 0.82); color: #fff;
      font-weight: 800; font-size: 12px; display: inline-flex; align-items: center; gap: 6px;
    }
    .flip ion-icon { font-size: 18px; }
    .cam-label { margin: 8px 0 0; font-size: 12px; font-weight: 700; color: #6B7280; }
    .hint, .ok { font-size: 13px; font-weight: 700; }
    .ok { color: #16A34A; }
    .token {
      width: 100%; margin-top: 14px; height: 48px; border-radius: 14px; border: 1px solid #E5E7EB;
      padding: 0 12px; font-weight: 700;
    }
    .go {
      margin-top: 12px; width: 100%; height: 50px; border: none; border-radius: 16px;
      font-weight: 900; background: #111827; color: #8cf000;
    }
  `],
})
export class CheckInPage implements AfterViewInit, OnDestroy {
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly location = inject(Location);
  private readonly bookings = inject(BookingService);
  private readonly toastCtrl = inject(ToastController);
  private readonly media = inject(MediaPermissionService);

  token = '';
  readonly busy = signal(false);
  readonly success = signal(false);
  readonly cameraError = signal('');
  readonly facing = signal<'environment' | 'user'>('environment');
  private stream: MediaStream | null = null;
  private scanTimer: ReturnType<typeof setInterval> | null = null;
  private submittedValue = '';
  private deviceIds: { environment?: string; user?: string } = {};

  ngAfterViewInit(): void {
    const q = this.route.snapshot.queryParamMap;
    const raw = q.get('t') || q.get('token') || '';
    this.token = raw;
    if (raw) {
      void this.submit();
      return;
    }
    void this.startCamera();
  }

  ngOnDestroy(): void {
    this.stopCamera();
  }

  goBack(): void {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      this.location.back();
      return;
    }
    void this.router.navigateByUrl('/app/my-bookings');
  }

  toggleCamera(): void {
    this.facing.set(this.facing() === 'environment' ? 'user' : 'environment');
    void this.startCamera(true);
  }

  async submit(): Promise<void> {
    const token = this.extractToken(this.token);
    if (!token || this.busy()) return;
    if (token === this.submittedValue) return;
    this.busy.set(true);
    this.submittedValue = token;
    try {
      const res = await firstValueFrom(this.bookings.playerCheckIn(token));
      if (res.success) {
        this.success.set(true);
        this.stopCamera();
        await this.toast('Checked in successfully.');
        const id = res.data?.id || this.route.snapshot.queryParamMap.get('b');
        if (id) {
          setTimeout(() => void this.router.navigateByUrl(`/app/my-bookings/${id}`), 800);
        }
        return;
      }
      this.submittedValue = '';
      await this.toast(res.message || 'Check-in failed.');
    } catch (error: any) {
      this.submittedValue = '';
      await this.toast(error?.error?.message || 'Check-in failed.');
    } finally {
      this.busy.set(false);
    }
  }

  private extractToken(value: string): string {
    const raw = String(value || '').trim();
    if (!raw) return '';
    if (raw.startsWith('{')) {
      try {
        const parsed = JSON.parse(raw) as { tyng?: string; t?: string };
        if (parsed.tyng === 'checkin' && !parsed.t) {
          this.cameraError.set('That is your player QR. Scan the venue QR at the court instead.');
          return '';
        }
      } catch {
        return raw;
      }
    }
    try {
      if (raw.includes('t=') || raw.includes('/app/check-in')) {
        const url = new URL(raw, window.location.origin);
        return url.searchParams.get('t') || url.searchParams.get('token') || '';
      }
    } catch {
      // plain token
    }
    return raw;
  }

  private async startCamera(restart = false): Promise<void> {
    const granted = await this.media.ensureCamera();
    if (!granted && Capacitor.isNativePlatform()) {
      this.cameraError.set('Camera permission is needed to scan the QR code.');
      return;
    }
    this.stopStream();
    const facing = this.facing();
    try {
      this.stream = await this.openStream(facing);
      const video = this.videoRef?.nativeElement;
      if (video) {
        video.srcObject = this.stream;
        video.setAttribute('playsinline', 'true');
        await video.play();
      }
      await this.rememberDevices();
      this.cameraError.set('');
      this.startDetector(restart);
    } catch {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        const video = this.videoRef?.nativeElement;
        if (video) {
          video.srcObject = this.stream;
          await video.play();
        }
        this.cameraError.set('Could not switch cameras. Check camera permission.');
        this.startDetector(restart);
      } catch {
        this.cameraError.set('Camera permission is needed to scan the QR code.');
      }
    }
  }

  private async openStream(facing: 'environment' | 'user'): Promise<MediaStream> {
    const deviceId = this.deviceIds[facing];
    if (deviceId) {
      return navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
        audio: false,
      });
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { exact: facing } },
        audio: false,
      });
    } catch {
      return navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing },
        audio: false,
      });
    }
  }

  private async rememberDevices(): Promise<void> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videos = devices.filter((d) => d.kind === 'videoinput');
      const back = videos.find((d) => /back|rear|environment/i.test(d.label));
      const front = videos.find((d) => /front|user|face/i.test(d.label));
      if (back?.deviceId) this.deviceIds.environment = back.deviceId;
      if (front?.deviceId) this.deviceIds.user = front.deviceId;
      if (!this.deviceIds.environment && videos[videos.length - 1]?.deviceId) {
        this.deviceIds.environment = videos[videos.length - 1].deviceId;
      }
      if (!this.deviceIds.user && videos[0]?.deviceId) {
        this.deviceIds.user = videos[0].deviceId;
      }
    } catch {
      // labels may be empty until permission is granted
    }
  }

  private startDetector(restart: boolean): void {
    if (this.scanTimer && !restart) return;
    if (this.scanTimer) {
      clearInterval(this.scanTimer);
      this.scanTimer = null;
    }
    const detector = this.barcodeDetector();
    if (!detector) {
      this.cameraError.set('Live QR scan is not supported here. Paste the check-in link instead, or try another device.');
      return;
    }
    this.scanTimer = setInterval(() => {
      const el = this.videoRef?.nativeElement;
      if (!el || el.readyState < 2) return;
      void detector.detect(el).then((codes) => {
        const value = codes[0]?.rawValue;
        if (value) {
          this.token = value;
          void this.submit();
        }
      }).catch(() => undefined);
    }, 700);
  }

  private barcodeDetector(): BarcodeDetectorLike | null {
    const Detector = (window as unknown as {
      BarcodeDetector?: new (opts: { formats: string[] }) => BarcodeDetectorLike;
    }).BarcodeDetector;
    if (!Detector) return null;
    return new Detector({ formats: ['qr_code'] });
  }

  private stopStream(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private stopCamera(): void {
    if (this.scanTimer) clearInterval(this.scanTimer);
    this.scanTimer = null;
    this.stopStream();
  }

  private async toast(message: string): Promise<void> {
    const toast = await this.toastCtrl.create({ message, duration: 1800, color: 'dark' });
    await toast.present();
  }
}
