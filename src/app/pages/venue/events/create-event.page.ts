import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { VenueEventService } from '../../../core/services/venue-event.service';
import { VenueService } from '../../../core/services/venue.service';

const STEPS = [
  'Choose Event Type',
  'Basic Details',
  'Schedule',
  'Pricing',
  'Competition Setup',
  'Prizes & Awards',
  'Sponsors',
  'Review & Publish',
];

const TYPES = [
  { id: 'community_game', emoji: '🟢', title: 'Community Game', sub: 'Grow your sports community.' },
  { id: 'hosted_match', emoji: '🔵', title: 'Hosted Match', sub: 'Subsidised play for your community.' },
  { id: 'competition', emoji: '🏆', title: 'Competition', sub: 'Compete for prizes and rankings.' },
  { id: 'festival', emoji: '🎉', title: 'Festival', sub: 'Create unforgettable experiences.' },
];

@Component({
  selector: 'app-venue-create-event',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true" class="ce-content">
      <div class="ce-page">
        <button type="button" class="back" (click)="back()"><ion-icon name="chevron-back-outline"></ion-icon></button>
        <div class="stepper">
          <i *ngFor="let s of steps; let i = index" [class.on]="i <= step()"></i>
        </div>
        <h1>{{ steps[step()] }}</h1>

        <ng-container [ngSwitch]="step()">
          <div *ngSwitchCase="0" class="stack">
            <button type="button" class="pick" *ngFor="let t of types" [class.on]="draft.type === t.id" (click)="draft.type = t.id">
              <span>{{ t.emoji }}</span>
              <div><strong>{{ t.title }}</strong><p>{{ t.sub }}</p></div>
            </button>
          </div>

          <div *ngSwitchCase="1" class="form">
            <label>Event Name</label>
            <input [(ngModel)]="draft.name" placeholder="e.g. City Football Championship" />
            <label>Cover Image</label>
            <button type="button" class="upload" (click)="pickCover()">📷 Upload cover image</button>
            <div class="two">
              <div><label>Sport</label>
                <select [(ngModel)]="draft.sport"><option *ngFor="let s of sports" [value]="s">{{ s | titlecase }}</option></select>
              </div>
              <div><label>Facility</label>
                <select [(ngModel)]="draft.facility"><option *ngFor="let c of courts" [value]="c">{{ c }}</option></select>
              </div>
            </div>
            <label>Description</label>
            <textarea [(ngModel)]="draft.description" placeholder="Describe your event..."></textarea>
            <div class="two">
              <div><label>Skill Level</label>
                <select [(ngModel)]="draft.skillLevel"><option value="open">Open</option><option value="beginner">Beginner</option><option value="intermediate">Intermediate</option><option value="advanced">Advanced</option></select>
              </div>
              <div><label>Visibility</label>
                <select [(ngModel)]="draft.visibility"><option value="public">Public</option><option value="private">Private</option></select>
              </div>
            </div>
            <label>Gender</label>
            <div class="chips">
              <button type="button" *ngFor="let g of genders" [class.on]="draft.gender === g" (click)="draft.gender = g">{{ g | titlecase }}</button>
            </div>
          </div>

          <div *ngSwitchCase="2" class="form">
            <label>Date</label>
            <input type="date" [(ngModel)]="draft.eventDate" />
            <div class="two">
              <div><label>Start Time</label><input type="time" [(ngModel)]="draft.startTime" /></div>
              <div><label>End Time</label><input type="time" [(ngModel)]="draft.endTime" /></div>
            </div>
            <label>Registration Deadline</label>
            <input type="date" [(ngModel)]="draft.registrationDeadline" />
            <div class="two">
              <div><label>Max Participants</label><input type="number" [(ngModel)]="draft.maxParticipants" /></div>
              <div><label>Min Participants</label><input type="number" [(ngModel)]="draft.minParticipants" /></div>
            </div>
            <label>Recurring</label>
            <div class="chips">
              <button type="button" *ngFor="let r of recurring" [class.on]="draft.recurring === r" (click)="draft.recurring = r">{{ r | titlecase }}</button>
            </div>
          </div>

          <div *ngSwitchCase="3" class="form">
            <div class="two">
              <div><label>Venue Cost (₹)</label><input type="number" [(ngModel)]="draft.venueCost" /></div>
              <div><label>Entry Fee (₹)</label><input type="number" [(ngModel)]="draft.entryFee" /></div>
              <div><label>Venue Subsidy (₹)</label><input type="number" [(ngModel)]="draft.venueSubsidy" /></div>
              <div><label>Early Bird (₹)</label><input type="number" [(ngModel)]="draft.earlyBird" placeholder="Optional" /></div>
            </div>
            <label>Promo Code</label>
            <input [(ngModel)]="draft.promoCode" placeholder="e.g. TYNG20" />
            <div class="proj">
              <div><span>Max Registrations</span><strong>{{ draft.maxParticipants }}</strong></div>
              <div><span>Entry Fee</span><strong>₹{{ draft.entryFee }}</strong></div>
              <div><span>Gross Revenue</span><strong>₹{{ money(gross()) }}</strong></div>
              <div><span>Venue Cost</span><strong>-₹{{ money(draft.venueCost) }}</strong></div>
              <div class="profit"><span>Estimated Profit</span><strong>₹{{ money(profit()) }}</strong></div>
            </div>
            <p class="note">TYNG platform fee: ₹{{ fee }} per player (collected by platform separately).</p>
          </div>

          <div *ngSwitchCase="4" class="form">
            <div class="hint">This step is optional for non-competition events. You can skip to the next step.</div>
            <label>Tournament Format</label>
            <div class="chips wrap">
              <button type="button" *ngFor="let f of formats" [class.on]="draft.tournamentFormat === f" (click)="draft.tournamentFormat = f">{{ f }}</button>
            </div>
            <div class="two">
              <div><label>Number of Teams</label>
                <select [(ngModel)]="draft.teamCount"><option *ngFor="let n of [4,8,16,32]" [ngValue]="n">{{ n }}</option></select>
              </div>
              <div><label>Match Duration</label>
                <select [(ngModel)]="draft.matchDuration"><option [ngValue]="20">20 min</option><option [ngValue]="30">30 min</option><option [ngValue]="45">45 min</option></select>
              </div>
            </div>
            <label>Score Verification</label>
            <div class="chips wrap">
              <button type="button" *ngFor="let v of verify" [class.on]="draft.scoreVerification === v" (click)="draft.scoreVerification = v">{{ v }}</button>
            </div>
            <div class="auto">⚡ <div><strong>Auto Bracket Generation</strong><p>Fixtures are automatically created based on {{ draft.teamCount }} teams and {{ draft.tournamentFormat }} format.</p></div></div>
          </div>

          <div *ngSwitchCase="5" class="form">
            <div class="two">
              <div><label>Total Prize Pool (₹)</label><input type="number" [(ngModel)]="draft.prizePool" /></div>
              <div><label>Cash Prize (₹)</label><input type="number" [(ngModel)]="draft.cashPrize" /></div>
            </div>
            <label>Award Types</label>
            <div class="chips wrap">
              <button type="button" *ngFor="let a of awards" [class.on]="hasAward(a.id)" (click)="toggleAward(a.id)">{{ a.label }}</button>
            </div>
            <label>Prize Images</label>
            <div class="upload">📷 Upload prize photos</div>
            <div class="proj"><div class="profit"><span>PRIZE SUMMARY</span><strong>₹{{ money(draft.prizePool) }}</strong></div></div>
          </div>

          <div *ngSwitchCase="6" class="form">
            <p class="sub">Add sponsors to display on the event page and attract corporate partners.</p>
            <div class="sponsor" *ngFor="let s of draft.sponsors; let i = index">
              <div class="av">{{ (s.name || 'S').charAt(0) }}</div>
              <div><strong>{{ s.name }}</strong><p>{{ s.package || 'Sponsor' }}</p></div>
              <button type="button" class="x" (click)="removeSponsor(i)">×</button>
            </div>
            <div class="add-box">
              <input [(ngModel)]="sponsorName" placeholder="Sponsor name" />
              <input [(ngModel)]="sponsorPkg" placeholder="Banner + Booth" />
              <button type="button" class="add" (click)="addSponsor()">+ Add Sponsor</button>
            </div>
          </div>

          <div *ngSwitchCase="7" class="form">
            <div class="review">
              <div *ngFor="let row of reviewRows()"><span>{{ row.l }}</span><strong>{{ row.v }}</strong></div>
            </div>
            <div class="proj">
              <p class="k">PROJECTIONS</p>
              <div><span>Est. Participants</span><strong>{{ draft.maxParticipants }}</strong></div>
              <div><span>Est. Revenue</span><strong>₹{{ money(gross()) }}</strong></div>
              <div><span>Venue Cost</span><strong>-₹{{ money(draft.venueCost) }}</strong></div>
              <div class="profit"><span>Profit Projection</span><strong>₹{{ money(profit()) }}</strong></div>
            </div>
          </div>
        </ng-container>
      </div>
    </ion-content>
    <div class="ce-foot">
      <button type="button" class="go" [disabled]="busy()" (click)="next()">{{ cta() }}</button>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .ce-content { --background: #fff; }
    .ce-page { padding: 12px 18px calc(100px + env(safe-area-inset-bottom, 0px)); padding-top: calc(12px + env(safe-area-inset-top, 0px)); }
    .back { width: 36px; height: 36px; border: none; border-radius: 50%; background: #F3F4F6; }
    .stepper { display: flex; gap: 4px; margin: 12px 0; }
    .stepper i { flex: 1; height: 4px; border-radius: 99px; background: #E5E7EB; }
    .stepper i.on { background: #8cf000; }
    h1 { margin: 8px 0 16px; font-size: 26px; font-weight: 900; color: #111827; }
    .stack { display: flex; flex-direction: column; gap: 10px; }
    .pick { display: flex; gap: 12px; align-items: center; text-align: left; border: 1.5px solid #E5E7EB; background: #fff; border-radius: 16px; padding: 14px; }
    .pick.on { border-color: #8cf000; background: #F7FEE7; }
    .pick p { margin: 2px 0 0; color: #6B7280; font-size: 12px; }
    .form label { display: block; margin: 12px 0 6px; font-size: 13px; font-weight: 800; }
    .form input, .form select, .form textarea {
      width: 100%; border: 1.5px solid #E5E7EB; border-radius: 12px; height: 46px; padding: 0 12px; font-weight: 700;
    }
    .form textarea { height: 88px; padding: 10px 12px; }
    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .chips { display: flex; gap: 8px; flex-wrap: wrap; }
    .chips button { border: none; border-radius: 999px; padding: 8px 12px; background: #F3F4F6; font-weight: 800; font-size: 12px; }
    .chips button.on { background: #8cf000; }
    .upload { width: 100%; border: 1.5px dashed #D1D5DB; border-radius: 14px; padding: 22px; background: #FAFAFA; font-weight: 700; color: #6B7280; }
    .proj { background: #111827; color: #fff; border-radius: 18px; padding: 14px; margin-top: 14px; }
    .proj > div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; }
    .proj .k { margin: 0 0 8px; color: #9CA3AF; letter-spacing: .12em; font-size: 11px; font-weight: 800; }
    .profit strong { color: #8cf000; font-size: 18px; }
    .note { font-size: 12px; color: #6B7280; font-weight: 600; }
    .hint { background: #FEF9C3; border-radius: 14px; padding: 10px 12px; font-size: 12px; font-weight: 700; color: #854D0E; }
    .auto { display: flex; gap: 8px; background: #ECFCCB; border-radius: 14px; padding: 12px; margin-top: 12px; text-align: left; }
    .auto p { margin: 4px 0 0; font-size: 12px; color: #3F6212; }
    .sponsor { display: flex; gap: 10px; align-items: center; background: #fff; border-radius: 14px; padding: 10px; box-shadow: 0 2px 10px rgba(17,24,39,.05); margin-bottom: 8px; }
    .av { width: 40px; height: 40px; border-radius: 50%; background: #E5E7EB; display: grid; place-items: center; font-weight: 900; }
    .x { border: none; width: 28px; height: 28px; border-radius: 50%; background: #F3F4F6; }
    .add-box { display: flex; flex-direction: column; gap: 8px; border: 1.5px dashed #93C5FD; border-radius: 14px; padding: 12px; }
    .add { border: none; background: none; color: #2563EB; font-weight: 800; }
    .review { background: #fff; border-radius: 16px; padding: 8px 4px; }
    .review div { display: flex; justify-content: space-between; padding: 8px 4px; border-bottom: 1px solid #F3F4F6; font-size: 13px; }
    .sub { color: #6B7280; font-weight: 600; }
    .ce-foot { position: fixed; left: 0; right: 0; bottom: 0; padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px)); background: #fff; }
    .go { width: 100%; height: 52px; border: none; border-radius: 18px; background: #8cf000; color: #111827; font-weight: 900; font-size: 16px; }
  `],
})
export class VenueCreateEventPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly eventsApi = inject(VenueEventService);
  private readonly venue = inject(VenueService);
  private readonly toastCtrl = inject(ToastController);

  readonly steps = STEPS;
  readonly types = TYPES;
  readonly step = signal(0);
  readonly busy = signal(false);
  readonly fee = 49;
  sports = ['football', 'cricket', 'badminton', 'basketball', 'tennis'];
  courts = ['Court 1'];
  genders = ['all', 'men', 'women', 'mixed'];
  recurring = ['no', 'weekly', 'monthly', 'seasonal', 'league'];
  formats = ['Knockout', 'League', 'Round Robin', 'Swiss', 'Double Elimination'];
  verify = ['Manual', 'Captain Sign-off', 'Referee', 'Automatic'];
  awards = [
    { id: 'trophy', label: '🏆 Trophy' },
    { id: 'medals', label: '🏅 Medals' },
    { id: 'certificates', label: '📜 Certificates' },
    { id: 'merchandise', label: '👕 Merchandise' },
    { id: 'coaching', label: '🎓 Coaching' },
    { id: 'vouchers', label: '🎁 Vouchers' },
  ];
  sponsorName = '';
  sponsorPkg = 'Sponsor - Banner + Booth';

  draft: {
    type: string;
    name: string;
    coverImage: string;
    sport: string;
    facility: string;
    description: string;
    skillLevel: string;
    visibility: string;
    gender: string;
    eventDate: string;
    startTime: string;
    endTime: string;
    registrationDeadline: string;
    maxParticipants: number;
    minParticipants: number;
    recurring: string;
    venueCost: number;
    entryFee: number;
    venueSubsidy: number;
    earlyBird: number | null;
    promoCode: string;
    tournamentFormat: string;
    teamCount: number;
    matchDuration: number;
    scoreVerification: string;
    prizePool: number;
    cashPrize: number;
    awardTypes: string[];
    sponsors: Array<{ name: string; package: string }>;
  } = {
    type: 'community_game',
    name: '',
    coverImage: '',
    sport: 'football',
    facility: 'Court 1',
    description: '',
    skillLevel: 'open',
    visibility: 'public',
    gender: 'all',
    eventDate: '',
    startTime: '06:00',
    endTime: '08:00',
    registrationDeadline: '',
    maxParticipants: 22,
    minParticipants: 10,
    recurring: 'no',
    venueCost: 2400,
    entryFee: 299,
    venueSubsidy: 0,
    earlyBird: null,
    promoCode: '',
    tournamentFormat: 'Knockout',
    teamCount: 8,
    matchDuration: 20,
    scoreVerification: 'Manual',
    prizePool: 10000,
    cashPrize: 6000,
    awardTypes: [],
    sponsors: [],
  };

  ngOnInit(): void {
    const type = this.route.snapshot.queryParamMap.get('type');
    if (type) this.draft.type = type;
    void this.loadCourts();
  }

  cta(): string {
    const labels = [
      'Continue to Details',
      'Continue to Schedule',
      'Continue to Pricing',
      'Continue to Competition',
      'Continue to Prizes',
      'Continue to Sponsors',
      'Continue to Review',
      '🚀 Publish Event',
    ];
    return labels[this.step()] || 'Continue';
  }

  back(): void {
    if (this.step() === 0) {
      void this.router.navigateByUrl('/app/venue/events');
      return;
    }
    this.step.set(this.step() - 1);
  }

  async next(): Promise<void> {
    if (this.step() < 7) {
      this.step.set(this.step() + 1);
      return;
    }
    this.busy.set(true);
    try {
      const res = await firstValueFrom(this.eventsApi.publish({ ...this.draft, status: 'published' }));
      if (res.success) {
        const toast = await this.toastCtrl.create({ message: 'Event published.', duration: 1600, color: 'dark' });
        await toast.present();
        void this.router.navigateByUrl('/app/venue/events');
        return;
      }
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.error?.message || 'Unable to publish event.',
        duration: 1800,
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.busy.set(false);
    }
  }

  gross(): number {
    return Math.max(0, Number(this.draft.entryFee) - this.fee) * Number(this.draft.maxParticipants || 0);
  }

  profit(): number {
    return this.gross() - Number(this.draft.venueCost || 0) + Number(this.draft.venueSubsidy || 0);
  }

  money(n: number | null): string {
    return Number(n || 0).toLocaleString('en-IN');
  }

  hasAward(id: string): boolean {
    return this.draft.awardTypes.includes(id);
  }

  toggleAward(id: string): void {
    this.draft.awardTypes = this.hasAward(id)
      ? this.draft.awardTypes.filter((x) => x !== id)
      : [...this.draft.awardTypes, id];
  }

  addSponsor(): void {
    const name = this.sponsorName.trim();
    if (!name) return;
    this.draft.sponsors = [...this.draft.sponsors, { name, package: this.sponsorPkg || 'Sponsor' }];
    this.sponsorName = '';
  }

  removeSponsor(i: number): void {
    this.draft.sponsors = this.draft.sponsors.filter((_, idx) => idx !== i);
  }

  pickCover(): void {
    this.draft.coverImage = 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800';
  }

  reviewRows(): Array<{ l: string; v: string }> {
    const t = TYPES.find((x) => x.id === this.draft.type)?.title || this.draft.type;
    return [
      { l: 'Event Type', v: t },
      { l: 'Name', v: this.draft.name || '—' },
      { l: 'Sport', v: this.title(this.draft.sport) },
      { l: 'Facility', v: this.draft.facility || '—' },
      { l: 'Date', v: this.draft.eventDate || '—' },
      { l: 'Time', v: `${this.draft.startTime} – ${this.draft.endTime}` },
      { l: 'Capacity', v: `${this.draft.minParticipants}–${this.draft.maxParticipants} players` },
      { l: 'Entry Fee', v: `₹${this.draft.entryFee}` },
      { l: 'Format', v: this.draft.tournamentFormat },
      { l: 'Recurring', v: this.title(this.draft.recurring) },
    ];
  }

  private title(v: string): string {
    return String(v || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private async loadCourts(): Promise<void> {
    try {
      const res = await firstValueFrom(this.venue.getMyProfile());
      const courts = ((res.data as any)?.courts || []) as Array<{ name?: string; courtName?: string }>;
      const names = courts.map((c) => String(c.name || c.courtName || '')).filter(Boolean);
      if (names.length) {
        this.courts = names;
        this.draft.facility = names[0];
      }
    } catch {
      // keep default
    }
  }
}
