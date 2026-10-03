import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnDestroy, Output, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import jsQR from 'jsqr';

type Detector = { detect(source: CanvasImageSource): Promise<{ rawValue: string }[]> };

/** Camera QR reader. Uses the built-in BarcodeDetector when the WebView has it, otherwise jsQR. */
@Component({
  selector: 'app-qr-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <div class="qs">
      <div class="qs-frame">
        <video #video playsinline muted></video>
        <div class="qs-corners" *ngIf="!error()"><i></i><i></i><i></i><i></i></div>
        <div class="qs-msg" *ngIf="error() as err">
          <ion-icon name="camera-outline"></ion-icon>
          <p>{{ err }}</p>
          <button type="button" (click)="start()">Try again</button>
        </div>
      </div>
      <p class="qs-hint">{{ hint }}</p>
      <div class="qs-manual">
        <input type="text" [(ngModel)]="manual" placeholder="Or type the code" autocapitalize="off" autocomplete="off" spellcheck="false" (keyup.enter)="submitManual()" />
        <button type="button" [disabled]="!manual.trim() || busy" (click)="submitManual()">Use code</button>
      </div>
    </div>
  `,
  styles: [`
    .qs { display: flex; flex-direction: column; gap: 14px; }
    .qs-frame { position: relative; aspect-ratio: 1; width: 100%; max-width: 340px; margin: 0 auto; border-radius: 24px; overflow: hidden; background: #111827; }
    video { width: 100%; height: 100%; object-fit: cover; display: block; }
    .qs-corners i { position: absolute; width: 36px; height: 36px; border: 4px solid #8cf000; }
    .qs-corners i:nth-child(1) { top: 18%; left: 18%; border-right: 0; border-bottom: 0; border-radius: 10px 0 0 0; }
    .qs-corners i:nth-child(2) { top: 18%; right: 18%; border-left: 0; border-bottom: 0; border-radius: 0 10px 0 0; }
    .qs-corners i:nth-child(3) { bottom: 18%; left: 18%; border-right: 0; border-top: 0; border-radius: 0 0 0 10px; }
    .qs-corners i:nth-child(4) { bottom: 18%; right: 18%; border-left: 0; border-top: 0; border-radius: 0 0 10px 0; }
    .qs-msg { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; padding: 24px; text-align: center; color: #fff; }
    .qs-msg ion-icon { font-size: 36px; color: #8cf000; }
    .qs-msg p { margin: 0; font-size: 13px; line-height: 1.5; color: rgba(255,255,255,0.75); }
    .qs-msg button { border: 0; border-radius: 14px; padding: 9px 16px; background: #8cf000; color: #111827; font-weight: 800; font-size: 13px; }
    .qs-hint { margin: 0; text-align: center; font-size: 13px; color: #6b7280; }
    .qs-manual { display: flex; gap: 8px; }
    .qs-manual input { flex: 1; min-width: 0; border: 1px solid #e5e7eb; border-radius: 14px; padding: 11px 12px; font-size: 13px; color: #111827; background: #fff; }
    .qs-manual button { border: 0; border-radius: 14px; padding: 0 14px; background: #111827; color: #fff; font-weight: 700; font-size: 13px; }
    .qs-manual button:disabled { opacity: 0.4; }
  `],
})
export class QrScannerComponent implements AfterViewInit, OnDestroy {
  @Input() hint = 'Point the camera at the QR code.';
  @Input() busy = false;
  @Output() scanned = new EventEmitter<string>();
  @ViewChild('video', { static: true }) video!: ElementRef<HTMLVideoElement>;

  private readonly zone = inject(NgZone);
  readonly error = signal<string | null>(null);
  manual = '';
  private stream: MediaStream | null = null;
  private frame = 0;
  private canvas = document.createElement('canvas');
  private detector: Detector | null = null;
  private lastValue = '';
  private lastAt = 0;

  ngAfterViewInit(): void {
    const Ctor = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector }).BarcodeDetector;
    if (Ctor) {
      try { this.detector = new Ctor({ formats: ['qr_code'] }); } catch { this.detector = null; }
    }
    void this.start();
  }

  ngOnDestroy(): void {
    this.stop();
  }

  async start(): Promise<void> {
    this.stop();
    this.error.set(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      this.error.set('The camera is not available here. Type the code below instead.');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      const el = this.video.nativeElement;
      el.srcObject = this.stream;
      await el.play();
      this.zone.runOutsideAngular(() => this.loop());
    } catch {
      this.error.set('Allow camera access to scan, or type the code below.');
    }
  }

  submitManual(): void {
    const code = this.manual.trim();
    if (code) this.scanned.emit(code);
  }

  private stop(): void {
    cancelAnimationFrame(this.frame);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private loop(): void {
    this.frame = requestAnimationFrame(() => void this.tick());
  }

  private async tick(): Promise<void> {
    const el = this.video.nativeElement;
    if (!this.stream) return;
    if (el.readyState >= 2 && el.videoWidth) {
      const value = await this.read(el);
      if (value && !this.busy && (value !== this.lastValue || Date.now() - this.lastAt > 3000)) {
        this.lastValue = value;
        this.lastAt = Date.now();
        this.zone.run(() => this.scanned.emit(value));
      }
    }
    this.loop();
  }

  private async read(el: HTMLVideoElement): Promise<string | null> {
    if (this.detector) {
      try {
        const found = await this.detector.detect(el);
        return found[0]?.rawValue || null;
      } catch {
        this.detector = null;
      }
    }
    const w = Math.min(640, el.videoWidth);
    const h = Math.round((el.videoHeight / el.videoWidth) * w);
    this.canvas.width = w;
    this.canvas.height = h;
    const ctx = this.canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(el, 0, 0, w, h);
    const image = ctx.getImageData(0, 0, w, h);
    return jsQR(image.data, w, h, { inversionAttempts: 'dontInvert' })?.data || null;
  }
}
