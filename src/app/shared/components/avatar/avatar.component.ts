import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar" [style.width.px]="size" [style.height.px]="size" [style.font-size.px]="size * 0.42">
      <img *ngIf="src" [src]="src" [alt]="alt" />
      <span *ngIf="!src">{{ emoji || initials || '👤' }}</span>
    </div>
  `,
  styles: [
    `
      .avatar {
        border-radius: 50%;
        overflow: hidden;
        background: #f3f4f6;
        display: grid;
        place-items: center;
        flex-shrink: 0;
        color: #111827;
        font-weight: 700;
      }

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    `,
  ],
})
export class AvatarComponent {
  @Input() src = '';
  @Input() alt = '';
  @Input() emoji = '';
  @Input() initials = '';
  @Input() size = 44;
}
