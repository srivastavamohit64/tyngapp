import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { ChatService } from '../../core/services/chat.service';

@Component({
  selector: 'app-coach-community-page',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content fullscreen class="has-tabs">
      <main class="min-h-full grid place-items-center bg-[#FAFBFC] px-6 text-center">
        <div *ngIf="loading" class="space-y-3">
          <ion-spinner name="crescent" color="success"></ion-spinner>
          <p class="m-0 text-sm font-bold text-slate-600">Opening Coach Community…</p>
        </div>
        <div *ngIf="!loading" class="max-w-xs space-y-3">
          <ion-icon name="people-outline" class="text-5xl text-[var(--app-primary)]"></ion-icon>
          <h1 class="m-0 text-xl font-black text-slate-900">Coach Community</h1>
          <p class="m-0 text-sm text-slate-500">{{ error || 'Connect with other active TYNG coaches.' }}</p>
          <button class="rounded-xl bg-[#111827] px-5 py-3 text-sm font-bold text-white" (click)="open()">Retry</button>
        </div>
      </main>
    </ion-content>
  `,
})
export class CoachCommunityPage implements OnInit {
  private readonly chat = inject(ChatService);
  private readonly router = inject(Router);

  loading = true;
  error = '';

  ngOnInit(): void { void this.open(); }

  async open(): Promise<void> {
    this.loading = true;
    this.error = '';
    const result = await this.chat.openCoachCommunity();
    if (result.success && result.data?.id) {
      void this.router.navigateByUrl(`/app/coach/chat/${encodeURIComponent(result.data.id)}`, { replaceUrl: true });
      return;
    }
    this.error = result.message || 'Unable to open Coach Community.';
    this.loading = false;
  }
}
