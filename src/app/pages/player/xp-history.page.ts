import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { XpLine, XpService } from '../../core/services/xp.service';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-xp-history-page',
  standalone: true,
  imports: [CommonModule, IonicModule, BrandHeaderShellComponent, PageHeaderComponent],
  template: `
    <ion-content fullscreen>
      <app-brand-header-shell>
        <main class="page-with-tab-bar min-h-full bg-[#FAFBFC] px-5 pb-8">
          <app-page-header title="XP History" [showBack]="true" (back)="router.navigateByUrl('/app/profile')"></app-page-header>
          <p class="hint">XP has no cash or TP value. This is your progression ledger.</p>
          <div class="row" *ngFor="let row of items()">
            <div>
              <strong>{{ row.label }}</strong>
              <p>{{ row.category }}</p>
            </div>
            <span [class.neg]="row.xpAmount < 0">{{ row.xpAmount > 0 ? '+' : '' }}{{ row.xpAmount }} XP</span>
          </div>
          <p class="hint" *ngIf="!items().length">No XP yet. Complete a verified game to start.</p>
        </main>
      </app-brand-header-shell>
    </ion-content>
  `,
  styles: [
    `
      .hint { color: #6b7280; font-size: 13px; }
      .row { display: flex; justify-content: space-between; align-items: center; background: #fff; border-radius: 16px; padding: 14px 16px; margin-bottom: 10px; border: 1px solid #f3f4f6; }
      .row p { margin: 4px 0 0; color: #9ca3af; font-size: 12px; }
      .row span { font-weight: 800; color: #16a34a; }
      .row span.neg { color: #dc2626; }
    `,
  ],
})
export class XpHistoryPage implements OnInit {
  readonly router = inject(Router);
  private readonly xp = inject(XpService);
  readonly items = signal<XpLine[]>([]);

  ngOnInit(): void {
    this.xp.history().subscribe((rows) => this.items.set(rows));
  }
}
