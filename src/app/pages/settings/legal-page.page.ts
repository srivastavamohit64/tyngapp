import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { Subscription, firstValueFrom } from 'rxjs';

import { AccountSettingsService, CmsPage } from '../../core/services/account-settings.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

const FALLBACK_TITLES: Record<string, string> = {
  'privacy-policy': 'Privacy Policy',
  'terms-conditions': 'Terms & Conditions',
};

@Component({
  selector: 'app-legal-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent],
  styleUrls: ['./settings.page.scss', './settings-subpage.scss'],
  styles: [`
    .legal-card {
      margin: 16px 20px 0;
      padding: 20px;
      border: 1px solid #f3f4f6;
      border-radius: 22px;
      background: #fff;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
    }

    .legal-updated {
      margin: 0 0 14px;
      font-size: 11px;
      font-weight: 700;
      color: #9ca3af;
    }

    .legal-content {
      color: #374151;
      font-size: 14px;
      line-height: 1.65;
      overflow-wrap: anywhere;
    }

    .legal-content ::ng-deep :is(h1, h2, h3, h4) {
      margin: 20px 0 8px;
      color: #111827;
      font-weight: 900;
      line-height: 1.3;
    }

    .legal-content ::ng-deep :is(h1, h2) { font-size: 17px; }
    .legal-content ::ng-deep :is(h3, h4) { font-size: 15px; }
    .legal-content ::ng-deep > :first-child { margin-top: 0; }
    .legal-content ::ng-deep p { margin: 0 0 12px; }
    .legal-content ::ng-deep :is(ul, ol) { margin: 0 0 12px; padding-left: 20px; }
    .legal-content ::ng-deep li { margin-bottom: 4px; }
    .legal-content ::ng-deep a { color: #16a34a; font-weight: 700; }
    .legal-content ::ng-deep img { max-width: 100%; height: auto; border-radius: 12px; }
    .legal-content ::ng-deep table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .legal-content ::ng-deep :is(td, th) { border: 1px solid #e5e7eb; padding: 6px 8px; }

    .legal-skel { display: flex; flex-direction: column; gap: 10px; }
    .legal-skel span { display: block; height: 11px; border-radius: 999px; }
    .legal-skel .legal-skel-head { height: 16px; width: 55%; margin: 10px 0 4px; }
  `],
  template: `
    <ion-content fullscreen>
      <app-brand-header-shell [title]="page()?.title || fallbackTitle()">
      <main class="settings-page">
        <article class="legal-card" *ngIf="loading()">
          <div class="legal-skel" aria-busy="true">
            <span class="legal-skel-head sub-shimmer"></span>
            <span class="sub-shimmer" *ngFor="let w of [96, 88, 92, 70]" [style.width.%]="w"></span>
            <span class="legal-skel-head sub-shimmer"></span>
            <span class="sub-shimmer" *ngFor="let w of [90, 94, 82, 60, 86]" [style.width.%]="w"></span>
          </div>
        </article>

        <section class="settings-list" *ngIf="!loading() && error()">
          <div class="sub-empty">
            <ion-icon name="document-text-outline"></ion-icon>
            <p class="sub-empty-title">{{ error() }}</p>
            <p class="sub-empty-copy">Please try again in a little while.</p>
            <button type="button" class="sub-primary-btn" (click)="load()">Try again</button>
          </div>
        </section>

        <article class="legal-card" *ngIf="!loading() && page() as p">
          <p class="legal-updated" *ngIf="p.updatedAt">Last updated {{ p.updatedAt | date: 'd MMM yyyy' }}</p>
          <div class="legal-content" [innerHTML]="p.content"></div>
        </article>
      </main>
      </app-brand-header-shell>
    </ion-content>
  `,
})
export class LegalPagePage implements OnInit, OnDestroy {
  private readonly api = inject(AccountSettingsService);
  private readonly route = inject(ActivatedRoute);
  private sub?: Subscription;
  private slug = '';

  readonly page = signal<CmsPage | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly fallbackTitle = signal('');

  ngOnInit(): void {
    this.sub = this.route.paramMap.subscribe((params) => {
      this.slug = params.get('slug') || '';
      this.fallbackTitle.set(FALLBACK_TITLES[this.slug] ?? 'Policy');
      void this.load();
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    this.page.set(null);
    try {
      const res = await firstValueFrom(this.api.getPage(this.slug));
      this.page.set(res.data ?? null);
      if (!res.data) this.error.set('This page is not available yet.');
    } catch (err: unknown) {
      const status = (err as { status?: number })?.status;
      this.error.set(status === 404 ? 'This page is not available yet.' : "Couldn't load this page.");
    } finally {
      this.loading.set(false);
    }
  }
}
