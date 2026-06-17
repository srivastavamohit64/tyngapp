import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { ChatBubbleComponent } from '../../shared/components/chat-bubble/chat-bubble.component';
import { HeaderComponent } from '../../shared/components/header/header.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HeaderComponent, ChatBubbleComponent],
  template: `
    <ion-content fullscreen>
      <main class="flex min-h-full flex-col bg-background text-white">
        <app-header title="Team Chat" subtitle="6 members" [showBack]="true" (back)="router.navigateByUrl('/app/home')"></app-header>
        <section class="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          <app-chat-bubble *ngFor="let message of data.messages" [message]="message"></app-chat-bubble>
        </section>
        <section class="border-t border-white/10 bg-background px-6 py-3">
          <div class="flex gap-2">
            <input class="h-12 flex-1 rounded-xl border border-white/10 bg-card px-4 outline-none" placeholder="Type a message..." [(ngModel)]="message" />
            <button class="grid h-12 w-12 place-items-center rounded-full bg-primary"><ion-icon name="send-outline"></ion-icon></button>
          </div>
        </section>
      </main>
    </ion-content>
  `,
})
export class ChatPage {
  readonly data = inject(DesignDataService);
  readonly router = inject(Router);
  message = '';
}
