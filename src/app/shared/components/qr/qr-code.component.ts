import { Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
import { toCanvas } from 'qrcode';

@Component({
  selector: 'app-qr-code',
  standalone: true,
  template: `<canvas #canvas [attr.aria-label]="label" role="img"></canvas>`,
  styles: [`
    :host { display: inline-flex; }
    canvas { display: block; width: var(--qr-size, 200px) !important; height: var(--qr-size, 200px) !important; border-radius: 12px; }
  `],
})
export class QrCodeComponent implements OnChanges {
  @Input({ required: true }) value = '';
  @Input() size = 200;
  @Input() label = 'QR code';
  @ViewChild('canvas', { static: true }) canvas!: ElementRef<HTMLCanvasElement>;

  ngOnChanges(): void {
    if (!this.value) return;
    this.canvas.nativeElement.style.setProperty('--qr-size', `${this.size}px`);
    void toCanvas(this.canvas.nativeElement, this.value, {
      width: this.size * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#111827', light: '#ffffff' },
    });
  }
}
