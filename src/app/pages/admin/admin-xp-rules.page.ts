import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { AdminXpRule, XpService } from '../../core/services/xp.service';

@Component({
  selector: 'app-admin-xp-rules',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content fullscreen>
      <main class="page">
        <header class="header">
          <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back"></ion-icon></button>
          <div><h1>XP Rules</h1><p>Control rewards, penalties and earning limits.</p></div>
        </header>

        <div class="state" *ngIf="loading">Loading rules…</div>
        <div class="state error" *ngIf="error">{{ error }}</div>
        <section class="rule-card" *ngFor="let rule of rules">
          <div class="rule-head">
            <div><strong>{{ rule.name }}</strong><span>{{ rule.ruleCode }} · {{ rule.category }}</span></div>
            <label class="toggle"><input type="checkbox" [(ngModel)]="rule.isEnabled"><span></span></label>
          </div>
          <div class="fields">
            <label>XP amount<input type="number" [(ngModel)]="rule.xpAmount"></label>
            <label>Frequency cap<input type="number" min="1" [(ngModel)]="rule.frequencyCap" placeholder="No cap"></label>
            <label>Min. session (minutes)<input type="number" min="0" [(ngModel)]="rule.minSessionMinutes" placeholder="No minimum"></label>
            <label>Period<select [(ngModel)]="rule.frequencyPeriod">
              <option value="none">None</option><option value="once">Once</option><option value="daily">Daily</option>
              <option value="weekly">Weekly</option><option value="per_booking">Per booking</option>
            </select></label>
          </div>
          <button type="button" class="save" [disabled]="savingId === rule.id" (click)="save(rule)">
            {{ savingId === rule.id ? 'Saving…' : 'Save rule' }}
          </button>
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    .page { min-height: 100%; background: #fafbfc; padding: calc(16px + var(--safe-area-top)) 20px calc(112px + var(--safe-area-bottom)); }
    .header { display:flex; align-items:center; gap:12px; margin-bottom:18px; } .back { width:40px; height:40px; min-height:unset; border:0; border-radius:12px; background:#f3f4f6; font-size:20px; color:#111827; }
    h1 { margin:0; font-size:22px; color:#111827; } .header p { margin:4px 0 0; color:#6b7280; font-size:12px; }
    .rule-card { background:#fff; border:1px solid #e5e7eb; border-radius:18px; padding:16px; margin-bottom:12px; } .rule-head { display:flex; justify-content:space-between; gap:12px; }
    .rule-head strong { display:block; color:#111827; font-size:15px; } .rule-head span { color:#6b7280; font-size:11px; } .fields { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin:16px 0 12px; }
    label { display:block; color:#6b7280; font-size:11px; font-weight:700; } input, select { display:block; box-sizing:border-box; width:100%; margin-top:5px; padding:10px; border:1px solid #d1d5db; border-radius:10px; background:#fff; color:#111827; font:inherit; font-size:14px; } .fields label:last-child { grid-column:1/-1; }
    .save { width:100%; min-height:40px; border:0; border-radius:10px; background:var(--app-primary); color:#111827; font-weight:800; } .save:disabled { opacity:.6; }
    .state { padding:30px 8px; text-align:center; color:#6b7280; } .error { color:#dc2626; }
    .toggle input { display:none; } .toggle span { display:block; width:42px; height:24px; border-radius:20px; background:#d1d5db; position:relative; } .toggle span::after { content:''; width:18px; height:18px; border-radius:50%; background:#fff; position:absolute; top:3px; left:3px; transition:.15s; } .toggle input:checked + span { background:var(--app-primary); } .toggle input:checked + span::after { left:21px; }
  `],
})
export class AdminXpRulesPage {
  private readonly router = inject(Router);
  private readonly xp = inject(XpService);
  private readonly toast = inject(ToastController);
  rules: AdminXpRule[] = [];
  loading = true;
  error = '';
  savingId: number | null = null;

  constructor() {
    this.xp.adminRules().subscribe({ next: (rules) => { this.rules = rules; this.loading = false; }, error: (err) => { this.error = err?.error?.message || 'Unable to load XP rules.'; this.loading = false; } });
  }

  save(rule: AdminXpRule): void {
    this.savingId = rule.id;
    this.xp.updateAdminRule(rule).subscribe({
      next: (updated) => { if (updated) Object.assign(rule, updated); this.savingId = null; void this.showToast('XP rule updated.'); },
      error: (err) => { this.savingId = null; void this.showToast(err?.error?.message || 'Unable to update XP rule.', true); },
    });
  }

  back(): void { void this.router.navigateByUrl('/app/admin/dashboard'); }

  private async showToast(message: string, isError = false): Promise<void> {
    const toast = await this.toast.create({ message, duration: 1800, color: isError ? 'danger' : 'success', position: 'top' });
    await toast.present();
  }
}
