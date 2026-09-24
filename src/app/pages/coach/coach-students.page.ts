import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { forkJoin } from 'rxjs';
import { CoachService } from '../../core/services/coach.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';
import { BrandHeaderShellComponent } from '../../shared/components/brand-header-shell/brand-header-shell.component';

@Component({
  selector: 'app-coach-students',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, BrandHeaderShellComponent],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <app-brand-header-shell>
        <main class="page">
          <header>
            <button type="button" (click)="back()" aria-label="Back"><ion-icon name="chevron-back-outline"></ion-icon></button>
            <h1>My Students</h1>
            <button type="button" (click)="openEnrollment()" aria-label="Enroll a student"><ion-icon name="person-add-outline"></ion-icon></button>
          </header>

          <div class="summary">
            <div><b>{{ active().length }}</b><span>Active students</span></div>
            <div><b>{{ requests().length + invitations().length }}</b><span>Pending connections</span></div>
          </div>

          <section *ngIf="invitations().length">
            <div class="title">
              <div><b>Invitations</b><span>Waiting for players to accept</span></div>
              <i>{{ invitations().length }}</i>
            </div>
            <article class="invitation" *ngFor="let invitation of invitations()">
              <span class="invite-icon"><ion-icon name="paper-plane-outline"></ion-icon></span>
              <div class="body">
                <b>{{ invitation.name }}</b>
                <span>{{ invitation.phoneMasked || invitation.email || 'Invitation pending' }}</span>
                <small>Sent {{ invitation.sentAt | date:'mediumDate' }}</small>
              </div>
              <button type="button" class="share-invite" (click)="shareInvitation(invitation, $event)">
                <ion-icon name="share-social-outline"></ion-icon>{{ invitation.shareFeedback || 'Share' }}
              </button>
            </article>
          </section>

          <section *ngIf="requests().length">
            <div class="title">
              <div><b>Student Requests</b><span>Players waiting for approval</span></div>
              <i>{{ requests().length }}</i>
            </div>
            <article class="request" *ngFor="let request of requests()">
              <button type="button" class="avatar-button" (click)="openStudentPreview(request.player_id || request.player?.id, $event)" [attr.aria-label]="'Preview ' + (request.player?.name || 'student') + ' profile'">
                <img *ngIf="request.player?.profile_image; else requestAvatar" [src]="media(request.player.profile_image)" alt="">
                <ng-template #requestAvatar><span class="avatar"><ion-icon name="person-outline"></ion-icon></span></ng-template>
              </button>
              <div class="body">
                <b>{{ request.player?.name || 'Player' }}</b>
                <span>{{ request.sport || 'Coaching request' }}</span>
                <p *ngIf="request.message">{{ request.message }}</p>
                <div class="actions">
                  <button type="button" class="no" (click)="respond(request.id, 'declined')">Decline</button>
                  <button type="button" class="yes" (click)="respond(request.id, 'accepted')">Accept student</button>
                </div>
              </div>
            </article>
          </section>

          <section>
            <div class="title"><div><b>My Students</b><span>Approved players in your program</span></div></div>
            <label class="search"><ion-icon name="search-outline"></ion-icon><input [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search students"></label>
            <div *ngIf="loading()" class="state">Loading students...</div>
            <div *ngIf="error()" class="state err">{{ error() }}</div>
            <div *ngIf="!loading() && !active().length" class="state"><ion-icon name="people-outline"></ion-icon><b>No students yet</b><span>Accept a player request to add them here.</span></div>
            <div *ngIf="!loading() && active().length && !filtered().length" class="state"><ion-icon name="search-outline"></ion-icon><b>No students found</b><span>Try a different name or sport.</span></div>
            <article class="student" *ngFor="let student of filtered()" (click)="open(student.student_id || student.student?.id)">
              <button type="button" class="avatar-button" (click)="openStudentPreview(student.student_id || student.student?.id, $event)" [attr.aria-label]="'Preview ' + (student.student?.name || 'student') + ' profile'">
                <img *ngIf="student.student?.profile_image; else studentAvatar" [src]="media(student.student.profile_image)" alt="">
                <ng-template #studentAvatar><span class="avatar"><ion-icon name="person-outline"></ion-icon></span></ng-template>
              </button>
              <div class="body"><b>{{ student.student?.name || 'Student' }}</b><span>{{ sports(student.student) }}</span><small>Joined {{ student.enrolled_at | date:'mediumDate' }}</small></div>
              <ion-icon name="chevron-forward-outline"></ion-icon>
            </article>
          </section>
        </main>
      </app-brand-header-shell>

      <ion-modal [isOpen]="previewOpen()" (didDismiss)="closeStudentPreview()" [initialBreakpoint]="0.58" [breakpoints]="[0, 0.58, 0.84]">
        <ng-template>
          <section class="student-preview" aria-live="polite">
            <div class="preview-handle"></div>
            <header class="preview-header">
              <div><p>STUDENT PROFILE</p><h2>Student preview</h2></div>
              <button type="button" (click)="closeStudentPreview()" aria-label="Close student profile"><ion-icon name="close-outline"></ion-icon></button>
            </header>

            <div *ngIf="previewLoading()" class="preview-loading"><ion-spinner name="crescent"></ion-spinner><span>Loading student profile...</span></div>
            <div *ngIf="previewError()" class="preview-error"><p>{{ previewError() }}</p><button type="button" (click)="retryStudentPreview()">Try again</button></div>

            <ng-container *ngIf="preview() as profile">
              <div class="preview-profile">
                <img *ngIf="profile.student?.profile_image; else previewAvatar" [src]="media(profile.student.profile_image)" alt="">
                <ng-template #previewAvatar><span class="preview-avatar"><ion-icon name="person-outline"></ion-icon></span></ng-template>
                <div><h3>{{ profile.student?.name || 'Student' }}</h3><p>{{ sports(profile.student) }}</p><span class="status" [class.pending]="profile.relationship?.status === 'pending'">{{ profile.relationship?.status === 'pending' ? 'Request pending' : 'Active student' }}</span></div>
              </div>
              <p class="bio" *ngIf="profile.student?.bio">{{ profile.student.bio }}</p>
              <p class="message" *ngIf="profile.request?.message">“{{ profile.request.message }}”</p>
              <div class="preview-stats">
                <div><b>{{ profile.stats?.sessions || 0 }}</b><span>Sessions</span></div>
                <div><b>{{ profile.stats?.completed_sessions || 0 }}</b><span>Completed</span></div>
                <div><b>{{ profile.stats?.evaluations || 0 }}</b><span>Evaluations</span></div>
              </div>
              <button *ngIf="profile.relationship?.status !== 'pending'" type="button" class="view-profile" (click)="viewFullProfile(profile.student?.id)">View full profile</button>
            </ng-container>
          </section>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .page{min-height:100%;padding:12px 16px 120px;background:#fafbfc;font-family:var(--app-font-family)}header{height:52px;display:flex;align-items:center;justify-content:space-between}header h1{font-size:18px;margin:0;font-weight:800}header button{width:40px;height:40px;border:0;border-radius:50%;background:#f3f4f6;font-size:20px}.summary{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:8px 0 20px}.summary div,.request,.student,.invitation{background:#fff;border:1px solid #edf0f2;border-radius:18px;padding:12px}.summary b{display:block;font-size:22px}.summary span,.title span,.body span,small{display:block;font-size:12px;color:#6b7280}.title{display:flex;justify-content:space-between;margin:0 4px 10px}.title b{font-size:16px}.title i{font-style:normal;padding:3px 8px;border-radius:20px;background:var(--app-primary);font-size:12px;font-weight:700}.request,.student,.invitation{display:flex;gap:12px;margin-bottom:10px}.invitation{align-items:center}.invite-icon{width:44px;height:44px;flex:0 0 44px;border-radius:14px;display:grid;place-items:center;color:#527d00;background:#efffdc;font-size:21px}.share-invite{min-width:58px;height:34px;padding:0 9px;border:0;border-radius:10px;display:flex;align-items:center;justify-content:center;gap:4px;color:#344054;background:#f2f4f7;font-size:10px;font-weight:800}.avatar-button{width:48px;height:48px;padding:0;border:0;border-radius:50%;background:transparent;flex:0 0 48px;overflow:hidden}.avatar-button:focus-visible{outline:2px solid var(--app-primary);outline-offset:2px}.avatar-button img,.avatar{display:grid;place-items:center;width:48px;height:48px;border-radius:50%;object-fit:cover;background:#f3f4f6;font-size:22px}.body{min-width:0;flex:1}.body b{display:block;font-size:14px}.body p{margin:6px 0;font-size:12px;color:#4b5563}.actions{display:flex;gap:8px;margin-top:10px}.actions button{height:36px;padding:0 13px;border-radius:10px;font-size:12px;font-weight:700}.no{background:#fff;border:1px solid #fecaca;color:#dc2626}.yes{border:0;background:var(--app-primary);color:#111827}.search{height:42px;display:flex;align-items:center;gap:8px;background:#fff;border:1px solid #edf0f2;border-radius:12px;padding:0 12px;margin-bottom:10px;color:#9ca3af}.search input{flex:1;border:0;outline:0;background:transparent;font:inherit;font-size:14px}.student{align-items:center;cursor:pointer}.student>ion-icon{color:#9ca3af}.state{min-height:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;text-align:center;color:#6b7280;font-size:13px}.state ion-icon{font-size:32px;color:var(--app-primary)}.err{color:#dc2626}.student-preview{min-height:320px;padding:8px 20px 26px;color:#101828}.preview-handle{width:38px;height:4px;margin:2px auto 14px;border-radius:10px;background:#d0d5dd}.preview-header{height:auto}.preview-header p{margin:0;color:#98a2b3;font-size:10px;font-weight:800;letter-spacing:.08em}.preview-header h2{margin:3px 0 0;font-size:20px}.preview-header button{width:36px;height:36px;background:#f2f4f7;font-size:20px}.preview-loading,.preview-error{min-height:230px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;color:#667085;font-size:14px;text-align:center}.preview-loading ion-spinner{width:34px;height:34px;color:var(--app-primary)}.preview-error p{margin:0}.preview-error button,.view-profile{height:42px;border:0;border-radius:12px;background:var(--app-primary);padding:0 18px;color:#101828;font-weight:800}.preview-profile{display:flex;align-items:center;gap:13px;margin:20px 0 14px}.preview-profile img,.preview-avatar{display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:#f2f4f7;object-fit:cover;font-size:28px}.preview-profile h3{margin:0 0 3px;font-size:18px}.preview-profile p{margin:0 0 7px;color:#667085;font-size:13px}.status{display:inline-block;padding:4px 8px;border-radius:999px;background:#ecfdf3;color:#067647;font-size:11px;font-weight:800}.status.pending{background:#fffaeb;color:#b54708}.bio,.message{margin:10px 0;color:#475467;font-size:13px;line-height:1.45}.message{padding:10px 12px;border-radius:10px;background:#f9fafb}.preview-stats{display:grid;grid-template-columns:repeat(3,1fr);margin:18px 0;overflow:hidden;border:1px solid #eaecf0;border-radius:14px}.preview-stats div{padding:12px 6px;text-align:center;border-right:1px solid #eaecf0}.preview-stats div:last-child{border:0}.preview-stats b,.preview-stats span{display:block}.preview-stats b{font-size:18px}.preview-stats span{margin-top:2px;color:#667085;font-size:10px}.view-profile{width:100%}
  `],
})
export class CoachStudentsPage implements ViewWillEnter {
  private readonly router = inject(Router);
  private readonly coach = inject(CoachService);

  students = signal<any[]>([]);
  requests = signal<any[]>([]);
  invitations = signal<any[]>([]);
  loading = signal(false);
  error = signal('');
  query = signal('');
  previewOpen = signal(false);
  previewLoading = signal(false);
  previewError = signal('');
  preview = signal<any | null>(null);
  previewStudentId = signal<number | null>(null);

  active = computed(() => this.students().filter(student => student.status === 'active'));
  filtered = computed(() => {
    const query = this.query().trim().toLowerCase();
    return this.active().filter(student => !query || (student.student?.name || '').toLowerCase().includes(query) || this.sports(student.student).toLowerCase().includes(query));
  });

  ionViewWillEnter() { this.load(); }

  load() {
    this.loading.set(true);
    this.error.set('');
    forkJoin({
      students: this.coach.getStudents(),
      requests: this.coach.getStudentRequests(),
      invitations: this.coach.getStudentInvitations(),
    }).subscribe({
      next: response => {
        const students: any = response.students.data;
        const requests: any = response.requests.data;
        this.students.set(Array.isArray(students) ? students : students?.data || []);
        this.requests.set(Array.isArray(requests) ? requests : requests?.data || []);
        this.invitations.set(Array.isArray(response.invitations.data) ? response.invitations.data : []);
        this.loading.set(false);
      },
      error: () => { this.error.set('Unable to load students and invitations.'); this.loading.set(false); },
    });
  }

  async shareInvitation(invitation: any, event: Event) {
    event.stopPropagation();
    const url = invitation.shareUrl || new URL(invitation.sharePath, window.location.origin).toString();
    const text = invitation.shareMessage || `Join my TYNG coaching roster.\n\n${url}`;
    const canShare = typeof navigator.share === 'function';
    try {
      if (canShare) await navigator.share({ title: 'TYNG coaching invitation', text });
      else await navigator.clipboard.writeText(text);
      invitation.shareFeedback = canShare ? 'Shared' : 'Copied';
      this.invitations.set([...this.invitations()]);
    } catch (error: any) {
      if (!String(error?.name || '').includes('Abort')) this.error.set('Unable to share this invitation.');
    }
  }

  respond(id: number, status: 'accepted' | 'declined') {
    this.coach.respondToStudentRequest(id, status).subscribe({ next: () => this.load(), error: () => this.error.set('Unable to update request.') });
  }

  openStudentPreview(id: unknown, event?: Event) {
    event?.stopPropagation();
    const studentId = Number(id);
    if (!studentId) return;
    this.previewStudentId.set(studentId);
    this.previewOpen.set(true);
    this.previewLoading.set(true);
    this.previewError.set('');
    this.preview.set(null);
    this.coach.getStudentPreview(studentId).subscribe({
      next: response => {
        if (!response.success || !response.data) this.previewError.set('Unable to load this student profile.');
        else this.preview.set(response.data);
        this.previewLoading.set(false);
      },
      error: () => { this.previewError.set('Unable to load this student profile.'); this.previewLoading.set(false); },
    });
  }

  retryStudentPreview() { const id = this.previewStudentId(); if (id) this.openStudentPreview(id); }
  closeStudentPreview() { this.previewOpen.set(false); this.previewLoading.set(false); }
  media(path: string | null | undefined) { return resolveMediaUrl(path) || 'assets/icon/avatar-placeholder.svg'; }
  sports(student: any) { return Array.isArray(student?.sports) && student.sports.length ? student.sports.join(', ') : 'Student'; }
  open(id: unknown) { if (id) void this.router.navigateByUrl('/app/coach/student/' + id); }
  viewFullProfile(id: unknown) { this.closeStudentPreview(); this.open(id); }
  openEnrollment() { void this.router.navigateByUrl('/app/coach/enroll-student'); }
  back() { void this.router.navigateByUrl('/app/coach/dashboard'); }
}
