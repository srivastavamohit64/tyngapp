import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, AlertController, ToastController, ViewWillEnter } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { VenueService } from '../../core/services/venue.service';
import { normalizeSlotInterval, type SlotIntervalMinutes } from '../../core/utils/booking.utils';

interface StatItem {
  label: string;
  value: string;
  icon: string;
}

interface HourItem {
  day: string;
  hours: string;
}

interface DetailRow {
  label: string;
  value: string;
}

interface VerDocPreview {
  id: string;
  label: string;
  name: string;
  url: string;
  isImage: boolean;
  isPdf: boolean;
  locked: boolean;
  editAllowed: boolean;
  pendingEdit: boolean;
  status: string;
  rejectionReason: string | null;
  required: boolean;
}

const DOC_LABELS: Record<string, string> = {
  biz: 'Business Registration',
  gst: 'GST Certificate',
  aadhaar: 'Aadhaar Card',
  pan: 'PAN Card',
  cheque: 'Cancelled Cheque',
  bank: 'Bank Details',
  id: 'Owner Government ID',
  licence: 'Venue Licence',
  insurance: 'Insurance',
};

@Component({
  selector: 'app-venue-profile',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <div class="venue-profile-page pb-32 text-left">

        <div class="sticky-header flex items-center justify-between px-5 h-14 bg-white border-b border-[#F3F4F6]">
          <button type="button" (click)="back()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
            <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
          <p class="text-[17px] font-black text-[#111827] m-0">Venue Profile</p>
          <button type="button" (click)="editProfile()" class="edit-icon-btn" aria-label="Edit profile">
            <ion-icon name="create-outline"></ion-icon>
          </button>
        </div>

        <div *ngIf="showSkeleton()" class="venue-profile-skel" aria-busy="true" aria-label="Loading profile">
          <div class="profile-hero bg-gradient-to-b from-[var(--app-primary)]/10 to-transparent px-6 pt-6 pb-8 flex flex-col items-center text-center">
            <ion-skeleton-text animated class="skel-avatar"></ion-skeleton-text>
            <ion-skeleton-text animated class="skel-name"></ion-skeleton-text>
            <ion-skeleton-text animated class="skel-location"></ion-skeleton-text>
            <ion-skeleton-text animated class="skel-rating-pill"></ion-skeleton-text>
          </div>

          <div class="px-5 space-y-6">
            <section *ngFor="let section of skeletonSections">
              <ion-skeleton-text animated class="skel-section-title"></ion-skeleton-text>
              <div class="detail-card">
                <div class="detail-row skel-detail-row" *ngFor="let row of section.rows">
                  <ion-skeleton-text animated class="skel-label"></ion-skeleton-text>
                  <ion-skeleton-text animated class="skel-value"></ion-skeleton-text>
                </div>
              </div>
            </section>

            <section>
              <ion-skeleton-text animated class="skel-section-title"></ion-skeleton-text>
              <div class="grid grid-cols-3 gap-3">
                <div class="bg-white p-4 rounded-2xl border border-slate-50 text-center shadow-sm" *ngFor="let i of [1,2,3]">
                  <ion-skeleton-text animated class="skel-stat-icon"></ion-skeleton-text>
                  <ion-skeleton-text animated class="skel-stat-value"></ion-skeleton-text>
                  <ion-skeleton-text animated class="skel-stat-label"></ion-skeleton-text>
                </div>
              </div>
            </section>

            <section>
              <ion-skeleton-text animated class="skel-section-title"></ion-skeleton-text>
              <div class="detail-card">
                <div class="detail-row skel-detail-row" *ngFor="let i of [1,2,3]">
                  <ion-skeleton-text animated class="skel-label"></ion-skeleton-text>
                  <ion-skeleton-text animated class="skel-value"></ion-skeleton-text>
                </div>
              </div>
            </section>
          </div>
        </div>

        <ng-container *ngIf="hasProfile()">
          <div class="profile-hero bg-gradient-to-b from-[var(--app-primary)]/10 to-transparent px-6 pt-6 pb-8 flex flex-col items-center text-center">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-[var(--app-primary)] to-[var(--app-primary-to)] flex items-center justify-center text-5xl mb-4 shadow-sm border border-white overflow-hidden">
              <img *ngIf="avatarUrl(); else venueEmoji" [src]="avatarUrl()!" [alt]="venueName()" class="w-full h-full object-cover" />
              <ng-template #venueEmoji>🏟️</ng-template>
            </div>
            <h1 class="text-[24px] font-black text-[#111827] m-0 leading-none">{{ venueName() }}</h1>
            <div class="flex items-center gap-1.5 text-[#9CA3AF] text-sm mt-2 mb-3 font-semibold max-w-full px-2">
              <ion-icon name="location-outline" class="text-[var(--app-primary)] flex-shrink-0"></ion-icon>
              <span class="truncate">{{ locationLabel() }}</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-50 shadow-sm">
              <ion-icon name="star" class="text-[#F59E0B] text-base"></ion-icon>
              <span class="text-[13px] font-bold text-[#111827]">
                {{ rating() }} <span class="text-[#9CA3AF]">({{ reviewCount() }} reviews)</span>
              </span>
            </div>
          </div>

          <div class="px-5 space-y-6">
            <section>
              <p class="section-title">Business details</p>
              <div class="detail-card">
                <div *ngFor="let row of businessRows()" class="detail-row">
                  <span class="detail-label">{{ row.label }}</span>
                  <span class="detail-value">{{ row.value }}</span>
                </div>
              </div>
            </section>

            <section>
              <p class="section-title">Contact & location</p>
              <div class="detail-card">
                <div *ngFor="let row of contactRows()" class="detail-row">
                  <span class="detail-label">{{ row.label }}</span>
                  <span class="detail-value">{{ row.value }}</span>
                </div>
              </div>
            </section>

            <section *ngIf="gallery().length">
              <p class="section-title">Photos</p>
              <div class="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  *ngFor="let photo of gallery()"
                  class="photo-thumb"
                  (click)="openUrl(photo)"
                >
                  <img [src]="photo" alt="" />
                </button>
              </div>
            </section>

            <section *ngIf="verificationDocs().length">
              <p class="section-title">Verification documents</p>
              <p class="text-[12px] text-[#9CA3AF] font-bold m-0 mb-3">
                Required documents must be approved by admin. Locked files need edit permission to replace.
              </p>
              <div class="space-y-3">
                <div *ngFor="let doc of verificationDocs()" class="doc-card">
                  <div class="doc-preview" (click)="doc.url && openUrl(doc.url)">
                    <img *ngIf="doc.isImage && doc.url" [src]="doc.url" [alt]="doc.label" />
                    <div *ngIf="!doc.isImage || !doc.url" class="doc-file-fallback">
                      <ion-icon [name]="doc.isPdf ? 'document-text-outline' : 'document-outline'"></ion-icon>
                      <span>{{ doc.url ? (doc.isPdf ? 'PDF' : 'FILE') : 'MISSING' }}</span>
                    </div>
                  </div>
                  <div class="doc-meta">
                    <strong>{{ doc.label }}{{ doc.required ? ' *' : '' }}</strong>
                    <p>{{ doc.name || 'Not uploaded' }}</p>
                    <p class="text-[11px] font-bold m-0 mt-1"
                      [style.color]="doc.status === 'approved' ? '#166534' : doc.status === 'rejected' ? '#B91C1C' : doc.status === 'pending' ? '#B45309' : '#6B7280'">
                      Status: {{ doc.status === 'not_submitted' ? 'Missing' : (doc.status | titlecase) }}
                    </p>
                    <p *ngIf="doc.rejectionReason" class="text-[11px] font-bold text-[#B91C1C] m-0 mt-1">
                      Reason: {{ doc.rejectionReason }}
                    </p>
                    <p *ngIf="doc.locked" class="text-[11px] font-bold text-[#92400E] m-0 mt-1">Locked</p>
                    <p *ngIf="doc.editAllowed" class="text-[11px] font-bold text-[#166534] m-0 mt-1">Edit allowed — open Edit Profile to re-upload</p>
                    <p *ngIf="doc.pendingEdit" class="text-[11px] font-bold text-[#F59E0B] m-0 mt-1">Edit request pending</p>
                    <button *ngIf="doc.url" type="button" class="doc-open" (click)="openUrl(doc.url)">
                      Preview / Open
                    </button>
                    <button
                      *ngIf="doc.locked && !doc.pendingEdit"
                      type="button"
                      class="doc-open"
                      (click)="requestDocEdit(doc.id)"
                    >
                      Request edit
                    </button>
                  </div>
                </div>
              </div>
            </section>

            <section *ngIf="!verificationDocs().length">
              <p class="section-title">Verification documents</p>
              <div class="empty-card">
                No verification documents uploaded yet.
                <button type="button" class="link-btn" (click)="editProfile()">Upload now</button>
              </div>
            </section>

            <section>
              <p class="section-title">Performance stats</p>
              <div class="grid grid-cols-3 gap-3">
                <div *ngFor="let stat of stats()" class="bg-white p-4 rounded-2xl border border-slate-50 text-center shadow-sm">
                  <div class="w-8 h-8 rounded-xl bg-[var(--app-primary)]/10 flex items-center justify-center mx-auto mb-2">
                    <ion-icon [name]="stat.icon" class="text-[var(--app-primary)] text-base"></ion-icon>
                  </div>
                  <div class="text-[18px] font-black text-[#111827] mb-0.5 leading-none">{{ stat.value }}</div>
                  <div class="text-[10px] text-[#9CA3AF] font-bold mt-1.5 uppercase leading-none">{{ stat.label }}</div>
                </div>
              </div>
            </section>

            <section>
              <p class="section-title">Booking slots</p>
              <div class="detail-card slot-card">
                <div class="slot-copy">
                  <span class="detail-label">Gap between 1-hour slots</span>
                  <span class="detail-value">e.g. 7:00–8:00, then {{ slotIntervalMinutes() === 30 ? '8:30–9:30' : '8:15–9:15' }}</span>
                </div>
                <div class="slot-toggle">
                  <button
                    type="button"
                    class="slot-opt"
                    [class.active]="slotIntervalMinutes() === 15"
                    [disabled]="savingSlotInterval()"
                    (click)="setSlotInterval(15)"
                  >
                    15 min
                  </button>
                  <button
                    type="button"
                    class="slot-opt"
                    [class.active]="slotIntervalMinutes() === 30"
                    [disabled]="savingSlotInterval()"
                    (click)="setSlotInterval(30)"
                  >
                    30 min
                  </button>
                </div>
              </div>
            </section>

            <section>
              <p class="section-title">Operating hours</p>
              <div class="detail-card">
                <div *ngFor="let schedule of operatingHours()" class="detail-row">
                  <span class="detail-label">{{ schedule.day }}</span>
                  <span class="detail-value">{{ schedule.hours }}</span>
                </div>
              </div>
            </section>
          </div>
        </ng-container>
      </div>
    </ion-content>
  `,
  styles: [`
    .venue-profile-page {
      background: #FAFBFC;
      min-height: 100%;
      padding-bottom: calc(112px + var(--safe-area-bottom));
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      padding-top: var(--app-chrome-top-inset, var(--safe-area-top));
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .edit-icon-btn {
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      border-radius: 12px;
      background: #111827;
      color: #fff;
      padding: 0;
    }

    .edit-icon-btn ion-icon {
      font-size: 20px;
      color: #fff;
    }

    .section-title {
      margin: 0 0 10px;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #111827;
    }

    .detail-card {
      background: #fff;
      border: 1px solid #F3F4F6;
      border-radius: 16px;
      padding: 4px 14px;
      box-shadow: 0 1px 4px rgba(17, 24, 39, 0.03);
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 0;
      border-bottom: 1px solid #F9FAFB;
    }

    .detail-row:last-child { border-bottom: none; }

    .detail-label {
      color: #9CA3AF;
      font-size: 12px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .detail-value {
      color: #111827;
      font-size: 13px;
      font-weight: 800;
      text-align: right;
      word-break: break-word;
    }

    .venue-profile-skel ion-skeleton-text {
      display: block;
      margin: 0;
      --border-radius: 6px;
      --background: #d1d5db;
      --background-rgb: 209, 213, 219;
      background: #d1d5db;
    }

    .venue-profile-skel .profile-hero {
      gap: 14px;
    }

    .venue-profile-skel .skel-avatar {
      width: 96px;
      height: 96px;
      border-radius: 999px;
      margin: 0 0 2px;
      --border-radius: 999px;
    }

    .venue-profile-skel .skel-name {
      width: 200px;
      max-width: 72%;
      height: 20px;
      border-radius: 6px;
      margin: 0;
    }

    .venue-profile-skel .skel-location {
      width: 220px;
      max-width: 78%;
      height: 12px;
      border-radius: 5px;
      margin: 0;
    }

    .venue-profile-skel .skel-rating-pill {
      width: 148px;
      height: 36px;
      border-radius: 999px;
      margin: 2px 0 0;
      --border-radius: 999px;
    }

    .venue-profile-skel .skel-section-title {
      width: 118px;
      height: 10px;
      border-radius: 4px;
      margin: 0 0 12px;
    }

    .skel-detail-row {
      align-items: center;
      gap: 20px;
      min-height: 0;
      padding: 11px 0;
    }

    .venue-profile-skel .skel-label {
      width: 96px;
      max-width: 38%;
      height: 10px;
      border-radius: 4px;
      flex-shrink: 0;
      margin: 0;
    }

    .venue-profile-skel .skel-value {
      width: 108px;
      max-width: 44%;
      height: 11px;
      border-radius: 4px;
      margin-left: auto;
      flex-shrink: 0;
    }

    .venue-profile-skel .skel-stat-icon {
      width: 32px;
      height: 32px;
      border-radius: 12px;
      margin: 0 auto 10px;
      --border-radius: 12px;
    }

    .venue-profile-skel .skel-stat-value {
      width: 40px;
      height: 15px;
      border-radius: 5px;
      margin: 0 auto 8px;
    }

    .venue-profile-skel .skel-stat-label {
      width: 54px;
      height: 8px;
      border-radius: 4px;
      margin: 0 auto;
    }

    .slot-card {
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .slot-copy {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .slot-copy .detail-value {
      text-align: left;
      font-size: 12px;
      font-weight: 700;
      color: #6B7280;
    }

    .slot-toggle {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .slot-opt {
      border: 1.5px solid #E5E7EB;
      background: #F9FAFB;
      color: #6B7280;
      border-radius: 12px;
      padding: 10px 0;
      font-size: 13px;
      font-weight: 800;
    }

    .slot-opt.active {
      border-color: var(--app-primary);
      background: rgba(var(--app-primary-rgb), 0.12);
      color: #111827;
    }

    .photo-thumb {
      width: 112px;
      height: 80px;
      border-radius: 12px;
      overflow: hidden;
      flex-shrink: 0;
      border: none;
      padding: 0;
      background: #e5e7eb;
    }

    .photo-thumb img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }

    .doc-card {
      display: flex;
      gap: 12px;
      background: #fff;
      border: 1px solid #F3F4F6;
      border-radius: 16px;
      padding: 12px;
      box-shadow: 0 1px 4px rgba(17, 24, 39, 0.03);
    }

    .doc-preview {
      width: 72px;
      height: 72px;
      border-radius: 12px;
      overflow: hidden;
      background: #F3F4F6;
      flex-shrink: 0;
      display: grid;
      place-items: center;
    }

    .doc-preview img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .doc-file-fallback {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      color: #6B7280;
      font-size: 10px;
      font-weight: 800;
    }

    .doc-file-fallback ion-icon { font-size: 22px; }

    .doc-meta {
      min-width: 0;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 2px;
    }

    .doc-meta strong {
      font-size: 14px;
      color: #111827;
    }

    .doc-meta p {
      margin: 0;
      font-size: 12px;
      color: #9CA3AF;
      font-weight: 600;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .doc-open {
      align-self: flex-start;
      margin-top: 6px;
      border: none;
      background: transparent;
      color: #2563EB;
      font-size: 12px;
      font-weight: 800;
      padding: 0;
    }

    .empty-card {
      background: #fff;
      border: 1px dashed #E5E7EB;
      border-radius: 16px;
      padding: 16px;
      color: #9CA3AF;
      font-size: 13px;
      font-weight: 700;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .link-btn {
      align-self: flex-start;
      border: none;
      background: transparent;
      color: #2563EB;
      font-weight: 800;
      font-size: 13px;
      padding: 0;
    }
  `]
})
export class VenueProfilePage implements OnInit, ViewWillEnter {
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  private readonly venueService = inject(VenueService);
  private readonly toastCtrl = inject(ToastController);
  private readonly alertCtrl = inject(AlertController);

  readonly loading = signal(true);
  readonly savingSlotInterval = signal(false);
  readonly skeletonSections = [
    { rows: [1, 2, 3, 4, 5, 6, 7] },
    { rows: [1, 2, 3, 4, 5] },
  ];
  private readonly detail = signal<Record<string, unknown> | null>(null);
  private readonly editableDocuments = signal<string[]>([]);
  private readonly pendingEditDocIds = signal<string[]>([]);

  readonly showSkeleton = computed(() => this.loading() && !this.detail());
  readonly hasProfile = computed(() => !!this.detail());

  readonly slotIntervalMinutes = computed<SlotIntervalMinutes>(() =>
    normalizeSlotInterval(this.detail()?.['slotIntervalMinutes'] as number | null),
  );

  readonly venueName = computed(() => {
    const d = this.detail();
    return String(d?.['displayName'] || d?.['venueName'] || d?.['name'] || this.auth.user()?.name || 'Venue');
  });

  readonly locationLabel = computed(() => {
    const d = this.detail();
    return String(d?.['address'] || d?.['location'] || this.auth.user()?.location || 'Add location');
  });

  readonly avatarUrl = computed(() => {
    const d = this.detail();
    const fromDetail = d?.['profileImage'] ? String(d['profileImage']) : null;
    const fromGallery = Array.isArray(d?.['gallery']) && (d!['gallery'] as string[]).length
      ? String((d!['gallery'] as string[])[0])
      : null;
    return fromDetail || fromGallery || this.auth.user()?.profileImage || null;
  });

  readonly gallery = computed(() => {
    const raw = this.detail()?.['gallery'];
    return Array.isArray(raw) ? raw.map((u) => String(u)).filter(Boolean) : [];
  });

  readonly verificationDocs = computed<VerDocPreview[]>(() => {
    const d = this.detail();
    const editable = new Set(this.editableDocuments());
    const pending = new Set(this.pendingEditDocIds());
    const statuses = Array.isArray(d?.['documentStatuses'])
      ? (d!['documentStatuses'] as Array<Record<string, unknown>>)
      : null;

    if (statuses?.length) {
      return statuses
        .filter((row) => row['required'] || row['url'])
        .map((row) => {
          const id = String(row['id'] || '');
          const url = String(row['url'] || '');
          const name = String(row['name'] || id || '—');
          const isImage = /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url) || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(name);
          const isPdf = /\.pdf(\?|$)/i.test(url) || /\.pdf(\?|$)/i.test(name);
          const editAllowed = editable.has(id) || String(row['status'] || '') === 'rejected';
          const locked = !!url && !editAllowed && String(row['status'] || '') !== 'rejected';
          return {
            id,
            label: String(row['label'] || DOC_LABELS[id] || this.titleCase(id)),
            name,
            url,
            isImage,
            isPdf,
            locked,
            editAllowed,
            pendingEdit: pending.has(id),
            status: String(row['status'] || 'not_submitted'),
            rejectionReason: row['rejectionReason'] ? String(row['rejectionReason']) : null,
            required: !!row['required'],
          };
        });
    }

    const raw = d?.['verificationDocuments'];
    if (!raw || typeof raw !== 'object') return [];

    return Object.entries(raw as Record<string, Record<string, unknown>>)
      .map(([id, doc]) => {
        const url = String(doc?.['url'] || '');
        const name = String(doc?.['name'] || id);
        const mime = String(doc?.['mime'] || '').toLowerCase();
        const isImage = mime.startsWith('image/') || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url) || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(name);
        const isPdf = mime.includes('pdf') || /\.pdf(\?|$)/i.test(url) || /\.pdf(\?|$)/i.test(name);
        const editAllowed = editable.has(id);
        const locked = !!url && !editAllowed;
        return {
          id,
          label: DOC_LABELS[id] || this.titleCase(id),
          name,
          url,
          isImage,
          isPdf,
          locked,
          editAllowed,
          pendingEdit: pending.has(id),
          status: String(doc?.['status'] || (url ? 'pending' : 'not_submitted')),
          rejectionReason: doc?.['rejectionReason'] ? String(doc['rejectionReason']) : null,
          required: false,
        };
      })
      .filter((doc) => !!doc.url);
  });

  readonly businessRows = computed<DetailRow[]>(() => {
    const d = this.detail();
    return [
      { label: 'Business name', value: String(d?.['businessName'] || d?.['name'] || '—') },
      { label: 'Display name', value: String(d?.['displayName'] || d?.['venueName'] || '—') },
      { label: 'Owner / manager', value: String(d?.['ownerName'] || '—') },
      { label: 'Ownership', value: String(d?.['ownershipType'] || '—') },
      { label: 'GST', value: String(d?.['gstNumber'] || '—') },
      { label: 'PAN', value: String(d?.['panNumber'] || '—') },
      { label: 'Established', value: String(d?.['yearEstablished'] || '—') },
    ];
  });

  readonly contactRows = computed<DetailRow[]>(() => {
    const d = this.detail();
    return [
      { label: 'Mobile', value: String(d?.['phone'] || this.auth.user()?.phone || '—') },
      { label: 'Email', value: String(d?.['email'] || this.auth.user()?.email || '—') },
      { label: 'City', value: String(d?.['city'] || '—') },
      { label: 'State', value: String(d?.['state'] || '—') },
      { label: 'Pincode', value: String(d?.['pincode'] || '—') },
      { label: 'Address', value: String(d?.['address'] || d?.['location'] || '—') },
      { label: 'Landmark', value: String(d?.['landmark'] || '—') },
    ];
  });

  readonly rating = computed(() => Number(this.detail()?.['rating'] ?? 4.5).toFixed(1));
  readonly reviewCount = computed(() => Number(this.detail()?.['gamesPlayed'] ?? 0) || 0);

  readonly stats = computed<StatItem[]>(() => {
    const courts = Array.isArray(this.detail()?.['courts']) ? (this.detail()!['courts'] as unknown[]) : [];
    const sports = Array.isArray(this.detail()?.['sports'])
      ? (this.detail()!['sports'] as unknown[]).length
      : (this.auth.user()?.sports || []).length;
    return [
      { label: 'Total Bookings', value: String(this.detail()?.['gamesPlayed'] ?? 0), icon: 'trending-up-outline' },
      { label: 'Active Courts', value: String(courts.length), icon: 'ribbon-outline' },
      { label: 'Sports', value: String(sports || '—'), icon: 'football-outline' },
    ];
  });

  readonly operatingHours = computed<HourItem[]>(() => {
    const d = this.detail();
    const open = String(d?.['openTime'] || '6:00 AM');
    const close = String(d?.['closeTime'] || '10:00 PM');
    const days = Array.isArray(d?.['operatingDays']) ? (d!['operatingDays'] as string[]) : [];
    if (!days.length) {
      return [
        { day: 'Monday - Friday', hours: `${open} - ${close}` },
        { day: 'Saturday - Sunday', hours: `${open} - ${close}` },
      ];
    }
    return [{ day: days.join(', '), hours: `${open} - ${close}` }];
  });

  ngOnInit() {
    void this.load();
  }

  ionViewWillEnter() {
    // Refresh quietly when profile is already on screen — no skeleton flash.
    if (this.detail()) {
      void this.load();
    }
  }

  private async load() {
    const initial = !this.detail();
    if (initial) {
      this.loading.set(true);
    }
    try {
      const [profileRes, editRes] = await Promise.all([
        firstValueFrom(this.venueService.getMyProfile()),
        firstValueFrom(this.venueService.getDocumentEditRequests()).catch(() => null),
        firstValueFrom(this.auth.fetchMe()).catch(() => null),
      ]);
      if (profileRes.success && profileRes.data) {
        const data = profileRes.data as Record<string, unknown>;
        this.detail.set(data);
        if (Array.isArray(data['editableDocuments'])) {
          this.editableDocuments.set((data['editableDocuments'] as unknown[]).map(String));
        }
      }
      if (editRes?.success && editRes.data) {
        this.pendingEditDocIds.set(
          (editRes.data.requests || [])
            .filter((r) => r.status === 'pending')
            .map((r) => String(r.docId)),
        );
        if (Array.isArray(editRes.data.editableDocuments)) {
          this.editableDocuments.set(editRes.data.editableDocuments.map(String));
        }
      }
    } catch {
      if (!this.detail()) {
        this.detail.set({
          name: this.auth.user()?.name,
          location: this.auth.user()?.location,
          profileImage: this.auth.user()?.profileImage,
        });
      }
    } finally {
      this.loading.set(false);
    }
  }

  async requestDocEdit(docId: string) {
    const alert = await this.alertCtrl.create({
      header: 'Request document edit',
      message: 'Tell admin why you need to replace this document.',
      inputs: [{ name: 'reason', type: 'textarea', placeholder: 'Reason (optional)' }],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit',
          handler: (data) => {
            void this.submitDocEdit(docId, String(data?.reason || '').trim());
          },
        },
      ],
    });
    await alert.present();
  }

  private async submitDocEdit(docId: string, reason: string) {
    try {
      const res = await firstValueFrom(this.venueService.requestDocumentEdit(docId, reason || undefined));
      const toast = await this.toastCtrl.create({
        message: res.success ? 'Edit request sent to admin.' : (res.message || 'Request failed.'),
        duration: 2000,
        color: res.success ? 'dark' : 'danger',
        position: 'bottom',
      });
      await toast.present();
      if (res.success) {
        this.pendingEditDocIds.update((ids) => (ids.includes(docId) ? ids : [...ids, docId]));
      }
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.error?.message || 'Unable to submit edit request.',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    }
  }

  back() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }

  editProfile() {
    const ready = this.auth.user()?.venueProfileReady === true;
    void this.router.navigateByUrl(
      ready ? '/app/venue/complete-profile' : '/app/venue/complete-profile?resume=1',
    );
  }

  async setSlotInterval(minutes: SlotIntervalMinutes) {
    if (this.slotIntervalMinutes() === minutes || this.savingSlotInterval()) return;
    this.savingSlotInterval.set(true);
    try {
      const response = await firstValueFrom(this.venueService.updateMyProfile({ slotIntervalMinutes: minutes }));
      if (!response.success) {
        throw new Error(response.message || 'Unable to update slot interval.');
      }
      const venue = (response.data as { venue?: Record<string, unknown> } | undefined)?.venue;
      if (venue) {
        this.detail.set({ ...(this.detail() || {}), ...venue });
      } else {
        this.detail.set({ ...(this.detail() || {}), slotIntervalMinutes: minutes });
      }
      const toast = await this.toastCtrl.create({
        message: `Slot gap is now ${minutes} minutes (7–8, then ${minutes === 30 ? '8:30–9:30' : '8:15–9:15'}).`,
        duration: 1800,
        color: 'dark',
        position: 'bottom',
      });
      await toast.present();
    } catch (error: any) {
      const toast = await this.toastCtrl.create({
        message: error?.error?.message || error?.message || 'Unable to update slot interval.',
        duration: 2200,
        color: 'danger',
        position: 'bottom',
      });
      await toast.present();
    } finally {
      this.savingSlotInterval.set(false);
    }
  }

  openUrl(url: string) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  private titleCase(value: string): string {
    return value
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
