import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChatMessage } from '../../models/app.models';

@Component({
  selector: 'app-chat-bubble',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="message?.type === 'system'; else chat" class="flex justify-center">
      <span class="rounded-full bg-muted px-4 py-2 text-sm text-slate-400">{{ message?.text }}</span>
    </div>
    <ng-template #chat>
      <div class="flex gap-3" [class.flex-row-reverse]="message?.isSelf">
        <div *ngIf="!message?.isSelf" class="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-secondary">
          {{ message?.avatar }}
        </div>
        <div class="max-w-[78%]" [class.text-right]="message?.isSelf">
          <p *ngIf="!message?.isSelf" class="mb-1 text-sm text-slate-400">{{ message?.sender }}</p>
          <div class="rounded-2xl px-4 py-3" [class.bg-primary]="message?.isSelf" [class.bg-card]="!message?.isSelf">
            {{ message?.text }}
          </div>
          <p class="mt-1 text-xs text-slate-500">{{ message?.time }}</p>
        </div>
      </div>
    </ng-template>
  `,
})
export class ChatBubbleComponent {
  @Input() message?: ChatMessage;
}
