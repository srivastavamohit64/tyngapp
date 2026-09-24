import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { CoachService } from '../../core/services/coach.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

@Component({
  selector: 'app-coach-invite',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <main class="invite-page">
        <header>
          <button type="button" (click)="back()" aria-label="Go back"><ion-icon name="chevron-back-outline"></ion-icon></button>
          <h1>Coaching Invitation</h1>
          <span></span>
        </header>

        <div *ngIf="loading()" class="state"><ion-spinner name="crescent"></ion-spinner><p>Loading invitation...</p></div>
        <div *ngIf="error()" class="state error">
          <ion-icon name="alert-circle-outline"></ion-icon>
          <h2>Invitation unavailable</h2>
          <p>{{ error() }}</p>
          <button type="button" (click)="load()">Try again</button>
        </div>

        <section *ngIf="!loading() && invitation() as invite" class="invite-card">
          <div class="coach-avatar">
            <img *ngIf="invite.coach?.profileImage; else fallback" [src]="media(invite.coach.profileImage)" alt="" />
            <ng-template #fallback><ion-icon name="person-outline"></ion-icon></ng-template>
          </div>
          <p class="eyebrow">COACH INVITATION</p>
          <h2>{{ invite.coach?.name || 'Your coach' }} invited you</h2>
          <p class="copy">Join their TYNG coaching roster to share training sessions, evaluations, progress and messages.</p>
          <div class="details">
            <div><span>Player</span><strong>{{ invite.name }}</strong></div>
            <div><span>Sports</span><strong>{{ sports(invite.coach?.sports) }}</strong></div>
            <div><span>Status</span><strong class="status">{{ statusLabel(invite.status) }}</strong></div>
          </div>

          <section *ngIf="invite.status === 'pending'" class="join-steps">
            <h3>Complete your invitation</h3>
            <ol>
              <li *ngFor="let step of visibleJoinSteps(invite); let index = index"><b>{{ index + 1 }}</b><span>{{ step }}</span></li>
            </ol>
          </section>

          <ng-container *ngIf="invite.status === 'pending'; else answered">
            <p *ngIf="actionError()" class="action-error">{{ actionError() }}</p>
            <button type="button" class="accept" [disabled]="saving()" (click)="respond('accepted')">
              <ion-spinner *ngIf="saving()" name="crescent"></ion-spinner>
              <ion-icon *ngIf="!saving()" name="checkmark-outline"></ion-icon>
              Accept Invitation
            </button>
            <button type="button" class="decline" [disabled]="saving()" (click)="respond('declined')">Decline</button>
          </ng-container>
          <ng-template #answered>
            <div class="answered"><ion-icon [name]="invite.status === 'accepted' ? 'checkmark-circle-outline' : 'close-circle-outline'"></ion-icon><span>This invitation was {{ invite.status }}.</span></div>
            <button type="button" class="accept" (click)="goHome()">Continue</button>
          </ng-template>
        </section>
      </main>
    </ion-content>
  `,
  styles: [`
    :host{display:block;--lime:var(--app-primary,#7cf000);--ink:#101828;--muted:#667085;--line:#e5e9ee}
    ion-content{--background:#f8fafb}.invite-page{min-height:100%;padding-bottom:calc(28px + env(safe-area-inset-bottom));color:var(--ink)}
    header{height:calc(58px + env(safe-area-inset-top));padding:env(safe-area-inset-top) 16px 0;display:grid;grid-template-columns:40px 1fr 40px;align-items:center;background:#fff;border-bottom:1px solid var(--line)}
    header button{width:38px;height:38px;padding:0;border:0;border-radius:13px;display:grid;place-items:center;background:#f2f4f7;font-size:20px}header h1{margin:0;text-align:center;font-size:17px}
    .state{min-height:420px;padding:30px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px;color:var(--muted);text-align:center}.state ion-spinner{color:var(--lime)}.state>ion-icon{color:#f04438;font-size:36px}.state h2,.state p{margin:0}.state h2{color:var(--ink);font-size:18px}.state p{font-size:12px;line-height:1.5}.state button{margin-top:8px;padding:11px 17px;border:0;border-radius:13px;background:var(--lime);font-weight:800}
    .invite-card{width:min(calc(100% - 32px),420px);margin:35px auto 0;padding:26px 19px;box-sizing:border-box;border:1px solid var(--line);border-radius:24px;background:#fff;text-align:center;box-shadow:0 8px 26px rgba(16,24,40,.05)}
    .coach-avatar{width:76px;height:76px;margin:0 auto 16px;border:3px solid var(--lime);border-radius:50%;overflow:hidden;display:grid;place-items:center;background:#f2f4f7;font-size:30px}.coach-avatar img{width:100%;height:100%;object-fit:cover}
    .eyebrow{margin:0 0 5px;color:#68cd04;font-size:10px;font-weight:900;letter-spacing:.11em}.invite-card h2{margin:0;font-size:22px}.copy{margin:9px auto 20px;max-width:330px;color:var(--muted);font-size:12px;line-height:1.5}
    .details{margin-bottom:17px;overflow:hidden;border:1px solid var(--line);border-radius:15px;text-align:left}.details div{min-height:43px;padding:0 12px;display:flex;align-items:center;justify-content:space-between;gap:12px;border-bottom:1px solid #f2f4f7}.details div:last-child{border:0}.details span{color:#98a2b3;font-size:10px}.details strong{font-size:11px;text-align:right}.status{color:#65c900}
    .join-steps{margin:0 0 17px;padding:13px;border-radius:15px;background:#f7ffed;text-align:left}.join-steps h3{margin:0 0 10px;font-size:12px}.join-steps ol{margin:0;padding:0;display:grid;gap:8px;list-style:none}.join-steps li{display:grid;grid-template-columns:21px minmax(0,1fr);gap:8px;align-items:start;color:#475467;font-size:10px;line-height:1.35}.join-steps li b{width:21px;height:21px;border-radius:50%;display:grid;place-items:center;color:#263700;background:var(--lime);font-size:9px}.join-steps li span{padding-top:3px}
    .accept,.decline{width:100%;height:48px;border-radius:15px;font:inherit;font-size:12px;font-weight:850}.accept{border:0;display:flex;align-items:center;justify-content:center;gap:7px;color:#172100;background:var(--lime)}.accept ion-spinner{width:17px;height:17px}.decline{margin-top:8px;border:1px solid #fda29b;color:#b42318;background:#fff}.accept:disabled,.decline:disabled{opacity:.55}
    .action-error{padding:9px;border-radius:10px;color:#b42318;background:#fef3f2;font-size:10px}.answered{margin-bottom:13px;padding:11px;border-radius:12px;display:flex;align-items:center;justify-content:center;gap:7px;color:#344054;background:#f2f4f7;font-size:11px;font-weight:750}.answered ion-icon{color:#6bd20a;font-size:18px}
  `],
})
export class CoachInvitePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly coach = inject(CoachService);
  private token = '';

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly actionError = signal('');
  readonly invitation = signal<any | null>(null);

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.load();
  }

  load(): void {
    if (!this.token) {
      this.loading.set(false);
      this.error.set('The invitation link is incomplete.');
      return;
    }
    this.loading.set(true);
    this.error.set('');
    this.coach.getCoachInvitation(this.token).subscribe({
      next: response => {
        this.invitation.set(response.data);
        this.loading.set(false);
      },
      error: error => {
        this.loading.set(false);
        this.error.set(error?.error?.message || 'This invitation is invalid, expired, or belongs to another player.');
      },
    });
  }

  respond(status: 'accepted' | 'declined'): void {
    this.saving.set(true);
    this.actionError.set('');
    this.coach.respondCoachInvitation(this.token, status).subscribe({
      next: response => {
        this.invitation.set(response.data);
        this.saving.set(false);
      },
      error: error => {
        this.actionError.set(error?.error?.message || 'Unable to update the invitation.');
        this.saving.set(false);
      },
    });
  }

  media(value: string): string { return resolveMediaUrl(value) || 'assets/icon/avatar-placeholder.svg'; }
  sports(value: unknown): string { return Array.isArray(value) && value.length ? value.join(', ') : 'Coaching'; }
  statusLabel(value: string): string { return value === 'pending' ? 'Waiting for you' : value.charAt(0).toUpperCase() + value.slice(1); }
  visibleJoinSteps(invite: any): string[] {
    const steps = Array.isArray(invite?.joinSteps) ? invite.joinSteps : [];
    return steps.slice(0, 4);
  }
  back(): void { void this.router.navigateByUrl('/app/home'); }
  goHome(): void { void this.router.navigateByUrl('/app/home'); }
}
