import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { DesignDataService } from '../../core/services/design-data.service';
import { ChatBubbleComponent } from '../../shared/components/chat-bubble/chat-bubble.component';

@Component({
  selector: 'app-chat-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ChatBubbleComponent],
  template: `
    <ion-content fullscreen>
      <main class="chat-page">
        <header class="chat-header">
          <button type="button" class="back" (click)="router.navigateByUrl('/app/chat')">
            <ion-icon name="chevron-back"></ion-icon>
          </button>
          <div>
            <h2>Team Chat</h2>
            <p>6 members</p>
          </div>
        </header>

        <section class="messages">
          <app-chat-bubble *ngFor="let message of data.messages" [message]="message"></app-chat-bubble>
        </section>

        <section class="input-bar">
          <input
            type="text"
            placeholder="Type a message..."
            [(ngModel)]="message"
          />
          <button type="button" class="send" (click)="message = ''">
            <ion-icon name="send"></ion-icon>
          </button>
        </section>
      </main>
    </ion-content>
  `,
  styles: [
    `
      .chat-page {
        min-height: 100%;
        display: flex;
        flex-direction: column;
        background: #fafbfc;
      }

      .chat-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: calc(12px + env(safe-area-inset-top, 0px)) 16px 12px;
        background: #fff;
        border-bottom: 1px solid #e5e7eb;
      }

      .back {
        width: 40px;
        height: 40px;
        min-height: unset;
        border-radius: 12px;
        background: #f3f4f6;
        display: grid;
        place-items: center;
        font-size: 20px;
        color: #111827;
      }

      h2 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #111827;
      }

      p {
        margin: 2px 0 0;
        font-size: 12px;
        color: #6b7280;
      }

      .messages {
        flex: 1;
        padding: 16px 24px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .input-bar {
        display: flex;
        gap: 8px;
        padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
        background: #fff;
        border-top: 1px solid #e5e7eb;
      }

      .input-bar input {
        flex: 1;
        height: 48px;
        border-radius: 14px;
        border: 1px solid #e5e7eb !important;
        background: #f9fafb !important;
        padding: 0 16px;
        color: #111827 !important;
        box-shadow: none !important;
        outline: none;
      }

      .send {
        width: 48px;
        height: 48px;
        min-height: unset;
        border-radius: 50%;
        background: #8cf000;
        color: #111827;
        display: grid;
        place-items: center;
        font-size: 18px;
      }
    `,
  ],
})
export class ChatPage {
  readonly data = inject(DesignDataService);
  readonly router = inject(Router);
  message = '';
}
