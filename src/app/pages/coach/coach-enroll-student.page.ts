import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';
import { ActionSheetController, IonicModule } from '@ionic/angular';
import { CoachService } from '../../core/services/coach.service';
import { NativeMediaPickerService } from '../../core/services/native-media-picker.service';
import { resolveMediaUrl } from '../../core/utils/media-url.util';

type EnrollmentType = 'existing' | 'invite' | 'managed';

interface StudentSearchResult {
  id: number;
  name: string;
  username?: string;
  phoneMasked?: string;
  profileImage?: string | null;
  sports?: string[];
  level?: number;
  location?: string;
}

interface BatchOption {
  id: string;
  label: string;
  sport?: string;
  members: number;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];
const ALL_SPORTS = ['Cricket', 'Football', 'Basketball', 'Badminton', 'Tennis', 'Volleyball', 'Swimming'];
const ALLERGY_OPTIONS = ['Dust', 'Pollen', 'Nuts', 'Dairy', 'Latex', 'Penicillin', 'Other'];
const SESSION_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const FREQUENCIES = ['Once Weekly', 'Twice Weekly', 'Three Times Weekly', 'Custom'];
const MEMBERSHIPS = ['Trial Student', 'Regular Student', 'Academy Student', 'Private Coaching', 'Camp Participant'];

@Component({
  selector: 'app-coach-enroll-student',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true" class="enrollment-content">
      <main *ngIf="isSuccess(); else enrollmentWizard" class="success-page">
        <div class="success-mark"><ion-icon [name]="enrollType === 'invite' ? 'paper-plane-outline' : 'checkmark-outline'"></ion-icon></div>
        <p class="eyebrow">{{ enrollType === 'invite' ? 'INVITATION READY' : 'ENROLMENT COMPLETE' }}</p>
        <h1>{{ enrollType === 'invite' ? 'Invitation Created' : 'Student Enrolled' }}</h1>
        <p class="success-copy">{{ resultMessage() }}</p>

        <section class="result-card">
          <div *ngFor="let item of successItems()" class="result-row">
            <span><ion-icon name="checkmark-outline"></ion-icon></span>
            <p>{{ item }}</p>
          </div>
        </section>

        <section *ngIf="enrollType === 'invite'" class="join-guide">
          <div class="join-guide-heading">
            <span><ion-icon name="phone-portrait-outline"></ion-icon></span>
            <div><h2>How the player joins</h2><p>These steps are included in the shared message.</p></div>
          </div>
          <ol>
            <li *ngFor="let step of invitationJoinSteps(); let index = index">
              <b>{{ index + 1 }}</b><span>{{ step }}</span>
            </li>
          </ol>
          <p class="secure-note"><ion-icon name="shield-checkmark-outline"></ion-icon>They must use the same mobile number or email entered in this invitation.</p>
        </section>

        <button *ngIf="sharePath()" type="button" class="primary-action" (click)="shareInvitation()">
          <ion-icon name="share-social-outline"></ion-icon>
          {{ shareFeedback() || 'Share with social apps' }}
        </button>
        <button *ngIf="resultStudentId()" type="button" class="primary-action" (click)="openStudentProfile()">
          <ion-icon name="person-outline"></ion-icon>
          View Student Profile
        </button>

        <div class="success-actions">
          <button type="button" (click)="go('/app/coach/students')">
            <ion-icon name="people-outline"></ion-icon><span>My Students</span>
          </button>
          <button *ngIf="resultStudentId()" type="button" (click)="go('/app/coach/plan')">
            <ion-icon name="calendar-outline"></ion-icon><span>Plan Training</span>
          </button>
          <button type="button" (click)="resetEnrollment()">
            <ion-icon name="person-add-outline"></ion-icon><span>Enrol Another</span>
          </button>
          <button type="button" (click)="go('/app/coach/dashboard')">
            <ion-icon name="home-outline"></ion-icon><span>Dashboard</span>
          </button>
        </div>
      </main>

      <ng-template #enrollmentWizard>
        <main class="enroll-page">
          <header class="page-header">
            <button type="button" (click)="handleBack()" aria-label="Go back">
              <ion-icon name="chevron-back-outline"></ion-icon>
            </button>
            <div>
              <h1>Enroll Student</h1>
              <p *ngIf="enrollType === 'managed'">Step {{ managedStep }} of 6</p>
            </div>
            <button type="button" (click)="go('/app/coach/dashboard')" aria-label="Close enrolment">
              <ion-icon name="close-outline"></ion-icon>
            </button>
          </header>

          <div *ngIf="enrollType === 'managed'" class="progress-track" aria-label="Managed profile progress">
            <span *ngFor="let step of managedSteps" [class.done]="managedStep > step" [class.current]="managedStep === step"></span>
          </div>

          <div class="page-body">
            <div *ngIf="error()" class="error-banner" role="alert">
              <ion-icon name="alert-circle-outline"></ion-icon>
              <span>{{ error() }}</span>
              <button type="button" (click)="error.set('')" aria-label="Dismiss error"><ion-icon name="close-outline"></ion-icon></button>
            </div>

            <section *ngIf="!enrollType" class="type-step">
              <div class="section-heading">
                <h2>How would you like to enrol?</h2>
                <p>Choose the option that matches this player.</p>
              </div>
              <button type="button" class="type-card" (click)="chooseType('existing')">
                <span class="type-icon"><ion-icon name="search-outline"></ion-icon></span>
                <span class="type-copy"><strong>Existing TYNG User</strong><small>Find and connect a registered player.</small></span>
                <ion-icon name="chevron-forward-outline"></ion-icon>
              </button>
              <button type="button" class="type-card" (click)="chooseType('invite')">
                <span class="type-icon"><ion-icon name="paper-plane-outline"></ion-icon></span>
                <span class="type-copy"><strong>Invite to TYNG</strong><small>Create a secure invitation to share.</small></span>
                <ion-icon name="chevron-forward-outline"></ion-icon>
              </button>
              <button type="button" class="type-card" (click)="chooseType('managed')">
                <span class="type-icon"><ion-icon name="person-add-outline"></ion-icon></span>
                <span class="type-copy"><strong>Coach Managed Profile</strong><small>Create a profile for a child or academy student.</small></span>
                <ion-icon name="chevron-forward-outline"></ion-icon>
              </button>
            </section>

            <section *ngIf="enrollType === 'existing'" class="flow-step">
              <div class="section-heading">
                <h2>Find a TYNG player</h2>
                <p>Search by name, mobile number, username or email.</p>
              </div>
              <label class="search-field">
                <ion-icon name="search-outline"></ion-icon>
                <input
                  [ngModel]="searchQ"
                  (ngModelChange)="onSearchChange($event)"
                  placeholder="Search available players"
                  autocomplete="off" />
                <ion-spinner *ngIf="searching()" name="crescent"></ion-spinner>
              </label>

              <div *ngIf="!searching() && !searchResults().length" class="inline-state">
                <ion-icon name="search-outline"></ion-icon>
                <p>{{ searchQ.trim() ? 'No eligible TYNG players match your search.' : 'No available TYNG players found.' }}</p>
              </div>

              <div class="student-results">
                <button
                  *ngFor="let student of searchResults(); trackBy: trackStudent"
                  type="button"
                  class="student-row"
                  [class.selected]="selExisting?.id === student.id"
                  (click)="selExisting = student">
                  <img *ngIf="student.profileImage; else playerFallback" [src]="media(student.profileImage)" alt="" />
                  <ng-template #playerFallback><span class="avatar-fallback">{{ initials(student.name) }}</span></ng-template>
                  <span class="student-copy">
                    <strong>{{ student.name }}</strong>
                    <small>{{ playerMeta(student) }}</small>
                  </span>
                  <ion-icon [name]="selExisting?.id === student.id ? 'checkmark-circle' : 'ellipse-outline'"></ion-icon>
                </button>
              </div>
            </section>

            <section *ngIf="enrollType === 'invite'" class="flow-step">
              <div class="section-heading">
                <h2>Invite to TYNG</h2>
                <p>Enter their details, then share the secure joining link through WhatsApp, Messages, email or another app.</p>
              </div>
              <div class="form-card">
                <label>Full name <b>*</b><input [(ngModel)]="invName" placeholder="Student name" autocomplete="name" /></label>
                <label>Mobile number <b>*</b><input [(ngModel)]="invPhone" type="tel" placeholder="10-15 digit number" autocomplete="tel" /></label>
                <label>Email address<input [(ngModel)]="invEmail" type="email" placeholder="Optional" autocomplete="email" /></label>
              </div>
            </section>

            <ng-container *ngIf="enrollType === 'managed'">
              <section *ngIf="managedStep === 1" class="flow-step">
                <div class="section-heading"><h2>Student information</h2><p>Create the player’s core profile.</p></div>
                <div class="photo-card">
                  <div class="photo-preview">
                    <img *ngIf="photoPreview()" [src]="photoPreview()" alt="Selected student" />
                    <ion-icon *ngIf="!photoPreview()" name="camera-outline"></ion-icon>
                  </div>
                  <div>
                    <strong>Profile photo</strong>
                    <small>JPG, PNG or WebP up to 5 MB.</small>
                    <div class="photo-actions">
                      <button type="button" (click)="pickPhoto('library')">Upload</button>
                      <button type="button" (click)="pickPhoto('camera')">Camera</button>
                    </div>
                  </div>
                  <input #libraryInput type="file" accept="image/*" hidden (change)="onPhotoFile($event)" />
                  <input #cameraInput type="file" accept="image/*" capture="environment" hidden (change)="onPhotoFile($event)" />
                </div>
                <div class="form-card">
                  <label>Full name <b>*</b><input [(ngModel)]="sName" placeholder="Student name" /></label>
                  <label>Date of birth <b>*</b><input [(ngModel)]="sDob" type="date" [max]="maxDob" /></label>
                  <div class="field-group"><span>Gender</span><div class="chips"><button *ngFor="let option of genderOptions" type="button" [class.active]="sGender === option" (click)="sGender = option">{{ option }}</button></div></div>
                  <div class="field-group"><span>Sports <b>*</b></span><div class="chips"><button *ngFor="let option of sportsOptions" type="button" [class.active]="sSports.includes(option)" (click)="toggleSportSelection(option)">{{ option }}</button></div></div>
                  <div class="field-group"><span>Skill level</span><div class="chips"><button *ngFor="let option of skillOptions" type="button" [class.active]="sSkill === option" (click)="sSkill = option">{{ option }}</button></div></div>
                  <label>Preferred playing position<input [(ngModel)]="sPos" placeholder="Optional" /></label>
                  <label>School or academy<input [(ngModel)]="sSchool" placeholder="Optional" /></label>
                </div>
              </section>

              <section *ngIf="managedStep === 2" class="flow-step">
                <div class="section-heading"><h2>Guardian details</h2><p>Add the primary contact for this student.</p></div>
                <div class="form-card">
                  <label>Guardian name <b>*</b><input [(ngModel)]="gName" placeholder="Full name" /></label>
                  <label>Relationship<input [(ngModel)]="gRel" placeholder="Parent, guardian, etc." /></label>
                  <label>Mobile number <b>*</b><input [(ngModel)]="gPhone" type="tel" placeholder="10-15 digit number" /></label>
                  <label>Alternate number<input [(ngModel)]="gPhone2" type="tel" placeholder="Optional" /></label>
                  <label>Email address<input [(ngModel)]="gEmail" type="email" placeholder="Optional" /></label>
                  <label>Home address<textarea [(ngModel)]="gAddr" rows="3" placeholder="Optional"></textarea></label>
                </div>
              </section>

              <section *ngIf="managedStep === 3" class="flow-step">
                <div class="section-heading"><h2>Medical information</h2><p>Keep safety information available to the coach.</p></div>
                <div class="form-card">
                  <div class="field-group"><span>Blood group</span><div class="chips"><button *ngFor="let option of bloodOptions" type="button" [class.active]="blood === option" (click)="blood = option">{{ option }}</button></div></div>
                  <div class="field-group"><span>Allergies</span><div class="chips"><button *ngFor="let option of allergyOptions" type="button" [class.active]="allergies.includes(option)" (click)="toggleAllergy(option)">{{ option }}</button></div></div>
                  <div class="add-allergy"><input [(ngModel)]="newAllergy" placeholder="Add another allergy" /><button type="button" (click)="addCustomAllergy()"><ion-icon name="add-outline"></ion-icon></button></div>
                  <label>Medical conditions<textarea [(ngModel)]="medicalConditions" rows="2" placeholder="Optional"></textarea></label>
                  <label>Current injuries<textarea [(ngModel)]="injuries" rows="2" placeholder="Optional"></textarea></label>
                  <label>Medications<textarea [(ngModel)]="medications" rows="2" placeholder="Optional"></textarea></label>
                  <label>Emergency notes<textarea [(ngModel)]="emergencyNotes" rows="2" placeholder="Optional"></textarea></label>
                </div>
              </section>

              <section *ngIf="managedStep === 4" class="flow-step">
                <div class="section-heading"><h2>Notes and access</h2><p>Add coaching context and phone access.</p></div>
                <div class="form-card">
                  <label>Coach notes<textarea [(ngModel)]="coachNotes" rows="4" placeholder="Goals, initial observations or important context"></textarea></label>
                  <div class="field-group">
                    <span>Does the student or parent have a smartphone?</span>
                    <div class="choice-grid">
                      <button type="button" [class.active]="hasPhone === true" (click)="hasPhone = true"><ion-icon name="phone-portrait-outline"></ion-icon>Yes</button>
                      <button type="button" [class.active]="hasPhone === false" (click)="hasPhone = false; accessPhone = ''"><ion-icon name="close-circle-outline"></ion-icon>No</button>
                    </div>
                  </div>
                  <label *ngIf="hasPhone === true">Access mobile number <b>*</b><input [(ngModel)]="accessPhone" type="tel" placeholder="10-15 digit number" /></label>
                </div>
              </section>

              <section *ngIf="managedStep === 5" class="flow-step">
                <div class="section-heading"><h2>Training details</h2><p>Use real previous batches or leave the batch blank.</p></div>
                <div class="form-card">
                  <div class="field-group">
                    <span>Training batch</span>
                    <p *ngIf="loadingBatches()" class="field-help">Loading batches...</p>
                    <p *ngIf="!loadingBatches() && !batchOptions().length" class="field-help">No reusable group sessions found yet.</p>
                    <div class="batch-list">
                      <button *ngFor="let batch of batchOptions()" type="button" [class.active]="selBatch === batch.id" (click)="selBatch = selBatch === batch.id ? '' : batch.id">
                        <ion-icon name="people-outline"></ion-icon>
                        <span><strong>{{ batch.label }}</strong><small>{{ batch.sport || 'Training' }} · {{ batch.members }} players</small></span>
                        <ion-icon [name]="selBatch === batch.id ? 'checkmark-circle' : 'ellipse-outline'"></ion-icon>
                      </button>
                    </div>
                  </div>
                  <div class="field-group"><span>Preferred session days</span><div class="chips"><button *ngFor="let option of daysOptions" type="button" [class.active]="sessionDays.includes(option)" (click)="toggleDay(option)">{{ option }}</button></div></div>
                  <div class="field-group"><span>Training frequency</span><div class="chips"><button *ngFor="let option of frequencyOptions" type="button" [class.active]="frequency === option" (click)="frequency = option">{{ option }}</button></div></div>
                  <div class="field-group"><span>Membership type</span><div class="membership-list"><button *ngFor="let option of membershipOptions" type="button" [class.active]="membership === option" (click)="membership = option">{{ option }}<ion-icon [name]="membership === option ? 'checkmark-circle' : 'ellipse-outline'"></ion-icon></button></div></div>
                </div>
              </section>

              <section *ngIf="managedStep === 6" class="flow-step">
                <div class="section-heading"><h2>Review and enrol</h2><p>Confirm the profile before creating it.</p></div>
                <article class="review-profile">
                  <div class="review-person">
                    <div class="photo-preview">
                      <img *ngIf="photoPreview()" [src]="photoPreview()" alt="" />
                      <span *ngIf="!photoPreview()">{{ initials(sName || 'Student') }}</span>
                    </div>
                    <div><h3>{{ sName }}</h3><p>{{ sSports.join(' · ') }}<ng-container *ngIf="sSkill"> · {{ sSkill }}</ng-container></p></div>
                  </div>
                  <dl>
                    <div><dt>Guardian</dt><dd>{{ gName }}</dd></div>
                    <div><dt>Contact</dt><dd>{{ gPhone }}</dd></div>
                    <div><dt>Batch</dt><dd>{{ getBatchLabel() }}</dd></div>
                    <div><dt>Membership</dt><dd>{{ membership || 'Not selected' }}</dd></div>
                  </dl>
                </article>
                <button type="button" class="automation-card" [class.active]="automationEnabled" (click)="automationEnabled = !automationEnabled">
                  <span><ion-icon name="flash-outline"></ion-icon></span>
                  <span><strong>Automatic progress tracking</strong><small>Keep sessions, evaluations and attendance connected to this profile.</small></span>
                  <ion-icon [name]="automationEnabled ? 'checkmark-circle' : 'ellipse-outline'"></ion-icon>
                </button>
              </section>
            </ng-container>
          </div>

          <footer *ngIf="enrollType" class="bottom-action">
            <button type="button" [disabled]="!canProceed() || saving()" (click)="handleNext()">
              <ion-spinner *ngIf="saving()" name="crescent"></ion-spinner>
              <ion-icon *ngIf="!saving()" [name]="managedStep === 6 || enrollType !== 'managed' ? 'checkmark-outline' : 'chevron-forward-outline'"></ion-icon>
              {{ saving() ? 'Saving...' : ctaLabel() }}
            </button>
          </footer>
        </main>
      </ng-template>
    </ion-content>
  `,
  styleUrls: ['./coach-enroll-student.page.scss'],
})
export class CoachEnrollStudentPage implements OnInit, OnDestroy {
  @ViewChild('libraryInput') libraryInput?: ElementRef<HTMLInputElement>;
  @ViewChild('cameraInput') cameraInput?: ElementRef<HTMLInputElement>;

  private readonly router = inject(Router);
  private readonly coach = inject(CoachService);
  private readonly mediaPicker = inject(NativeMediaPickerService);
  private readonly actionSheet = inject(ActionSheetController);
  private searchTimer?: ReturnType<typeof setTimeout>;

  readonly managedSteps = [1, 2, 3, 4, 5, 6];
  readonly genderOptions = GENDERS;
  readonly sportsOptions = ALL_SPORTS;
  readonly skillOptions = SKILL_LEVELS;
  readonly bloodOptions = BLOOD_GROUPS;
  readonly allergyOptions = ALLERGY_OPTIONS;
  readonly daysOptions = SESSION_DAYS;
  readonly frequencyOptions = FREQUENCIES;
  readonly membershipOptions = MEMBERSHIPS;
  readonly maxDob = new Date().toISOString().slice(0, 10);

  enrollType: EnrollmentType | null = null;
  managedStep = 1;
  searchQ = '';
  selExisting: StudentSearchResult | null = null;
  invName = '';
  invPhone = '';
  invEmail = '';

  sName = '';
  sDob = '';
  sGender = '';
  sSports: string[] = [];
  sSkill = '';
  sPos = '';
  sSchool = '';
  gName = '';
  gRel = '';
  gPhone = '';
  gPhone2 = '';
  gEmail = '';
  gAddr = '';
  blood = '';
  allergies: string[] = [];
  newAllergy = '';
  medicalConditions = '';
  injuries = '';
  medications = '';
  emergencyNotes = '';
  coachNotes = '';
  hasPhone: boolean | null = null;
  accessPhone = '';
  selBatch = '';
  sessionDays: string[] = [];
  frequency = '';
  membership = '';
  automationEnabled = true;
  photoFile: File | null = null;

  readonly isSuccess = signal(false);
  readonly saving = signal(false);
  readonly searching = signal(false);
  readonly loadingBatches = signal(false);
  readonly error = signal('');
  readonly searchResults = signal<StudentSearchResult[]>([]);
  readonly batchOptions = signal<BatchOption[]>([]);
  readonly photoPreview = signal('');
  readonly resultMessage = signal('');
  readonly resultStudentId = signal<number | null>(null);
  readonly sharePath = signal('');
  readonly shareUrl = signal('');
  readonly shareMessage = signal('');
  readonly shareFeedback = signal('');
  readonly invitationJoinSteps = signal<string[]>([]);
  readonly successItems = signal<string[]>([]);

  ngOnInit(): void {
    this.loadBatches();
  }

  ngOnDestroy(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    const preview = this.photoPreview();
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
  }

  chooseType(type: EnrollmentType): void {
    this.enrollType = type;
    this.error.set('');
    if (type === 'existing') this.searchPlayers('');
  }

  handleBack(): void {
    this.error.set('');
    if (this.enrollType === 'managed' && this.managedStep > 1) {
      this.managedStep -= 1;
      return;
    }
    if (this.enrollType) {
      this.enrollType = null;
      this.managedStep = 1;
      return;
    }
    void this.router.navigateByUrl('/app/coach/dashboard');
  }

  canProceed(): boolean {
    if (this.enrollType === 'existing') return !!this.selExisting;
    if (this.enrollType === 'invite') return this.invName.trim().length >= 2 && this.validPhone(this.invPhone);
    if (this.enrollType !== 'managed') return false;
    if (this.managedStep === 1) return this.sName.trim().length >= 2 && !!this.sDob && this.sSports.length > 0;
    if (this.managedStep === 2) return this.gName.trim().length >= 2 && this.validPhone(this.gPhone);
    if (this.managedStep === 4 && this.hasPhone === true) return this.validPhone(this.accessPhone);
    return true;
  }

  handleNext(): void {
    this.error.set('');
    if (!this.canProceed() || this.saving()) return;
    if (this.enrollType === 'managed' && this.managedStep < 6) {
      this.managedStep += 1;
      return;
    }
    this.submit();
  }

  ctaLabel(): string {
    if (this.enrollType === 'existing') return 'Connect Student';
    if (this.enrollType === 'invite') return 'Create Invitation';
    if (this.managedStep === 6) return 'Enroll Student';
    return 'Continue';
  }

  onSearchChange(value: string): void {
    this.searchQ = value;
    this.selExisting = null;
    this.error.set('');
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.searchPlayers(value), value.trim() ? 350 : 0);
  }

  private searchPlayers(query: string): void {
    this.searching.set(true);
    this.coach.searchEnrollmentPlayers(query).subscribe({
      next: response => {
        this.searchResults.set(Array.isArray(response.data) ? response.data : []);
        this.searching.set(false);
      },
      error: error => {
        this.searchResults.set([]);
        this.searching.set(false);
        this.error.set(this.apiError(error, 'Unable to search TYNG players.'));
      },
    });
  }

  private loadBatches(): void {
    this.loadingBatches.set(true);
    this.coach.getSessionBatches().subscribe({
      next: response => {
        const rows = Array.isArray(response.data) ? response.data : [];
        this.batchOptions.set(rows.map((row: any) => ({
          id: String(row.id),
          label: row.label || row.title || 'Training batch',
          sport: row.sport,
          members: Number(row.members || row.studentIds?.length || 0),
        })));
        this.loadingBatches.set(false);
      },
      error: () => this.loadingBatches.set(false),
    });
  }

  private submit(): void {
    if (!this.enrollType) return;
    this.saving.set(true);
    this.error.set('');

    if (this.enrollType === 'existing' && this.selExisting) {
      this.coach.enrollExistingStudent(this.selExisting.id, this.coachNotes).subscribe({
        next: response => this.finishEnrollment(response, [
          'Existing TYNG account connected',
          'Added to My Students',
          'Private coach chat enabled',
        ]),
        error: error => this.failSave(error),
      });
      return;
    }

    if (this.enrollType === 'invite') {
      this.coach.inviteStudent({
        name: this.invName.trim(),
        phone: this.invPhone.trim(),
        email: this.invEmail.trim() || undefined,
      }).subscribe({
        next: response => {
          const invitation = (response.data as any) || {};
          this.sharePath.set(invitation.sharePath || '');
          this.shareUrl.set(invitation.shareUrl || '');
          this.shareMessage.set(invitation.shareMessage || '');
          this.invitationJoinSteps.set(Array.isArray(invitation.joinSteps) ? invitation.joinSteps : this.defaultJoinSteps());
          this.resultMessage.set(response.message || 'Invitation created and ready to share.');
          this.successItems.set([
            'Invitation saved securely',
            'Player acceptance link created',
            'Invitation is visible in My Students',
          ]);
          this.saving.set(false);
          this.isSuccess.set(true);
          setTimeout(() => void this.shareInvitation(), 150);
        },
        error: error => this.failSave(error),
      });
      return;
    }

    this.coach.enrollManagedStudent(this.managedForm()).subscribe({
      next: response => {
        const linked = Number((response.data as any)?.linkedSessionsCount || 0);
        const items = [
          'Coach-managed player profile created',
          'Guardian and safety details saved',
          'Added to My Students',
        ];
        if (linked > 0) items.push(linked + ' upcoming session' + (linked === 1 ? '' : 's') + ' linked');
        this.finishEnrollment(response, items);
      },
      error: error => this.failSave(error),
    });
  }

  private managedForm(): FormData {
    const form = new FormData();
    const values: Record<string, string | number | boolean | null> = {
      mode: 'managed',
      name: this.sName.trim(),
      dob: this.sDob,
      gender: this.sGender || null,
      skill_level: this.sSkill || null,
      preferred_position: this.sPos.trim() || null,
      school_academy: this.sSchool.trim() || null,
      guardian_name: this.gName.trim(),
      guardian_relationship: this.gRel.trim() || null,
      guardian_phone: this.gPhone.trim(),
      guardian_alternate_phone: this.gPhone2.trim() || null,
      guardian_email: this.gEmail.trim() || null,
      home_address: this.gAddr.trim() || null,
      blood_group: this.blood || null,
      medical_conditions: this.medicalConditions.trim() || null,
      current_injuries: this.injuries.trim() || null,
      medications: this.medications.trim() || null,
      emergency_notes: this.emergencyNotes.trim() || null,
      coach_notes: this.coachNotes.trim() || null,
      has_phone_access: this.hasPhone,
      access_phone: this.accessPhone.trim() || null,
      batch_session_id: this.selBatch || null,
      training_frequency: this.frequency || null,
      membership_type: this.membership || null,
      automation_enabled: this.automationEnabled,
    };
    Object.entries(values).forEach(([key, value]) => {
      if (value === null || value === '') return;
      form.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    });
    this.sSports.forEach(value => form.append('sports[]', value));
    this.allergies.forEach(value => form.append('allergies[]', value));
    this.sessionDays.forEach(value => form.append('session_days[]', value));
    if (this.photoFile) form.append('photo', this.photoFile, this.photoFile.name);
    return form;
  }

  private finishEnrollment(response: any, items: string[]): void {
    const data = response.data || {};
    this.resultStudentId.set(Number(data.studentId || data.student?.id) || null);
    this.resultMessage.set(response.message || (this.getStudentName() + ' has been added to your roster.'));
    this.successItems.set(items);
    this.saving.set(false);
    this.isSuccess.set(true);
  }

  private failSave(error: any): void {
    this.saving.set(false);
    this.error.set(this.apiError(error, 'Unable to complete enrolment. Please try again.'));
  }

  async pickPhoto(source: 'camera' | 'library'): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      (source === 'camera' ? this.cameraInput : this.libraryInput)?.nativeElement.click();
      return;
    }
    const file = source === 'camera'
      ? await this.mediaPicker.takePhoto('student-camera')
      : await this.mediaPicker.pickPhoto('student-profile');
    if (file) this.setPhoto(file);
  }

  onPhotoFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.setPhoto(file);
    input.value = '';
  }

  private setPhoto(file: File): void {
    if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
      this.error.set('Choose a JPG, PNG or WebP image smaller than 5 MB.');
      return;
    }
    const current = this.photoPreview();
    if (current.startsWith('blob:')) URL.revokeObjectURL(current);
    this.photoFile = file;
    this.photoPreview.set(URL.createObjectURL(file));
    this.error.set('');
  }

  toggleSportSelection(value: string): void {
    this.sSports = this.toggleValue(this.sSports, value);
  }

  toggleAllergy(value: string): void {
    this.allergies = this.toggleValue(this.allergies, value);
  }

  addCustomAllergy(): void {
    const value = this.newAllergy.trim();
    if (value && !this.allergies.includes(value)) this.allergies = [...this.allergies, value];
    this.newAllergy = '';
  }

  toggleDay(value: string): void {
    this.sessionDays = this.toggleValue(this.sessionDays, value);
  }

  private toggleValue(list: string[], value: string): string[] {
    return list.includes(value) ? list.filter(item => item !== value) : [...list, value];
  }

  getBatchLabel(): string {
    return this.batchOptions().find(batch => batch.id === this.selBatch)?.label || 'No batch selected';
  }

  getStudentName(): string {
    if (this.enrollType === 'existing') return this.selExisting?.name || 'Student';
    if (this.enrollType === 'invite') return this.invName || 'Student';
    return this.sName || 'Student';
  }

  playerMeta(student: StudentSearchResult): string {
    const sport = student.sports?.length ? student.sports.join(', ') : 'Player';
    return [sport, student.username ? '@' + student.username : null, student.phoneMasked].filter(Boolean).join(' · ');
  }

  trackStudent(_index: number, student: StudentSearchResult): number {
    return student.id;
  }

  initials(name: string): string {
    return name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part.charAt(0)).join('').toUpperCase() || 'P';
  }

  media(path?: string | null): string {
    return resolveMediaUrl(path) || 'assets/icon/avatar-placeholder.svg';
  }

  async shareInvitation(): Promise<void> {
    if (!this.invitationUrl()) return;
    const sheet = await this.actionSheet.create({
      header: 'Share TYNG invitation',
      subHeader: 'Choose how you want to send the secure joining link.',
      buttons: [
        { text: 'WhatsApp', icon: 'logo-whatsapp', handler: () => { this.openShareUrl(`https://wa.me/?text=${encodeURIComponent(this.invitationText())}`); } },
        { text: 'Messages', icon: 'chatbubble-ellipses-outline', handler: () => { this.openShareUrl(`sms:?&body=${encodeURIComponent(this.invitationText())}`); } },
        { text: 'Email', icon: 'mail-outline', handler: () => { this.openShareUrl(`mailto:?subject=${encodeURIComponent('TYNG coaching invitation')}&body=${encodeURIComponent(this.invitationText())}`); } },
        { text: 'More apps', icon: 'share-social-outline', handler: () => { void this.openNativeShare(); } },
        { text: 'Copy invitation', icon: 'copy-outline', handler: () => { void this.copyInvitation(); } },
        { text: 'Cancel', role: 'cancel' },
      ],
    });
    await sheet.present();
  }

  private invitationUrl(): string {
    if (this.shareUrl()) return this.shareUrl();
    try {
      return new URL(this.sharePath(), window.location.origin).toString();
    } catch {
      return this.sharePath();
    }
  }

  private invitationText(): string {
    if (this.shareMessage()) return this.shareMessage();
    return [
      `Hi ${this.invName.trim() || 'there'},`,
      '',
      'You have been invited to join a coaching roster on TYNG.',
      '',
      'How to join:',
      ...this.defaultJoinSteps().slice(0, 4).map((step, index) => `${index + 1}. ${step}`),
      '',
      this.invitationUrl(),
    ].join('\n');
  }

  private openShareUrl(url: string): void {
    window.open(url, '_blank');
    this.shareFeedback.set('Invitation ready to send');
  }

  private async openNativeShare(): Promise<void> {
    try {
      if (navigator.share) {
        await navigator.share({ title: 'TYNG coaching invitation', text: this.invitationText() });
        this.shareFeedback.set('Invitation Shared');
      } else {
        await this.copyInvitation();
      }
    } catch (error: any) {
      if (!String(error?.name || '').includes('Abort')) {
        this.error.set('Unable to share automatically. Please copy the invitation link.');
      }
    }
  }

  private async copyInvitation(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.invitationText());
      this.shareFeedback.set('Invitation copied');
    } catch {
      this.error.set('Unable to copy automatically. Please use WhatsApp, Messages or email.');
    }
  }

  private defaultJoinSteps(): string[] {
    return [
      'Open the secure invitation link.',
      'Sign up or sign in as a Player with the invited mobile number or email.',
      'Complete the TYNG player profile if prompted.',
      'Tap Accept Invitation to join the coach.',
      'The player is then added automatically to the coach\'s My Students list.',
    ];
  }

  openStudentProfile(): void {
    const id = this.resultStudentId();
    if (id) void this.router.navigateByUrl('/app/coach/student/' + id);
  }

  resetEnrollment(): void {
    this.enrollType = null;
    this.managedStep = 1;
    this.isSuccess.set(false);
    this.error.set('');
    this.resultStudentId.set(null);
    this.resultMessage.set('');
    this.sharePath.set('');
    this.shareUrl.set('');
    this.shareMessage.set('');
    this.shareFeedback.set('');
    this.invitationJoinSteps.set([]);
    this.successItems.set([]);
    this.searchQ = '';
    this.searchResults.set([]);
    this.selExisting = null;
    this.invName = '';
    this.invPhone = '';
    this.invEmail = '';
    this.sName = '';
    this.sDob = '';
    this.sGender = '';
    this.sSports = [];
    this.sSkill = '';
    this.sPos = '';
    this.sSchool = '';
    this.gName = '';
    this.gRel = '';
    this.gPhone = '';
    this.gPhone2 = '';
    this.gEmail = '';
    this.gAddr = '';
    this.blood = '';
    this.allergies = [];
    this.medicalConditions = '';
    this.injuries = '';
    this.medications = '';
    this.emergencyNotes = '';
    this.coachNotes = '';
    this.hasPhone = null;
    this.accessPhone = '';
    this.selBatch = '';
    this.sessionDays = [];
    this.frequency = '';
    this.membership = '';
    this.automationEnabled = true;
    this.photoFile = null;
    const preview = this.photoPreview();
    if (preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    this.photoPreview.set('');
  }

  go(path: string): void {
    void this.router.navigateByUrl(path);
  }

  private validPhone(value: string): boolean {
    return value.replace(/\D/g, '').length >= 10 && value.replace(/\D/g, '').length <= 15;
  }

  private apiError(error: any, fallback: string): string {
    const errors = error?.error?.errors;
    if (errors && typeof errors === 'object') {
      for (const value of Object.values(errors)) {
        const first = Array.isArray(value) ? value[0] : value;
        if (first) return String(first);
      }
    }
    return error?.error?.message || fallback;
  }
}
