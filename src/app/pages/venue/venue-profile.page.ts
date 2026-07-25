import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule, ViewWillEnter } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { VenueService } from '../../core/services/venue.service';

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
}

const DOC_LABELS: Record<string, string> = {
  biz: 'Business Registration',
  gst: 'GST Certificate',
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
          <button type="button" (click)="editProfile()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none" aria-label="Edit profile">
            <ion-icon name="create-outline" class="text-xl text-[#111827]"></ion-icon>
          </button>
        </div>

        <div *ngIf="loading()" class="px-6 py-10 text-center text-[#9CA3AF] font-semibold">Loading profile…</div>

        <ng-container *ngIf="!loading()">
          <div class="profile-hero bg-gradient-to-b from-[#8CF000]/10 to-transparent px-6 pt-6 pb-8 flex flex-col items-center text-center">
            <div class="w-24 h-24 rounded-full bg-gradient-to-br from-[#8CF000] to-[#A3E635] flex items-center justify-center text-5xl mb-4 shadow-sm border border-white overflow-hidden">
              <img *ngIf="avatarUrl(); else venueEmoji" [src]="avatarUrl()!" [alt]="venueName()" class="w-full h-full object-cover" />
              <ng-template #venueEmoji>🏟️</ng-template>
            </div>
            <h1 class="text-[24px] font-black text-[#111827] m-0 leading-none">{{ venueName() }}</h1>
            <div class="flex items-center gap-1.5 text-[#9CA3AF] text-sm mt-2 mb-3 font-semibold max-w-full px-2">
              <ion-icon name="location-outline" class="text-[#8CF000] flex-shrink-0"></ion-icon>
              <span class="truncate">{{ locationLabel() }}</span>
            </div>
            <div class="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-50 shadow-sm">
              <ion-icon name="star" class="text-[#F59E0B] text-base"></ion-icon>
              <span class="text-[13px] font-bold text-[#111827]">
                {{ rating() }} <span class="text-[#9CA3AF]">({{ reviewCount() }} reviews)</span>
              </span>
            </div>
            <button type="button" class="edit-cta mt-4" (click)="editProfile()">
              <ion-icon name="create-outline"></ion-icon>
              Edit profile details
            </button>
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
              <div class="space-y-3">
                <div *ngFor="let doc of verificationDocs()" class="doc-card">
                  <div class="doc-preview" (click)="openUrl(doc.url)">
                    <img *ngIf="doc.isImage" [src]="doc.url" [alt]="doc.label" />
                    <div *ngIf="!doc.isImage" class="doc-file-fallback">
                      <ion-icon [name]="doc.isPdf ? 'document-text-outline' : 'document-outline'"></ion-icon>
                      <span>{{ doc.isPdf ? 'PDF' : 'FILE' }}</span>
                    </div>
                  </div>
                  <div class="doc-meta">
                    <strong>{{ doc.label }}</strong>
                    <p>{{ doc.name }}</p>
                    <button type="button" class="doc-open" (click)="openUrl(doc.url)">
                      Preview / Open
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
                  <div class="w-8 h-8 rounded-xl bg-[#8CF000]/10 flex items-center justify-center mx-auto mb-2">
                    <ion-icon [name]="stat.icon" class="text-[#8CF000] text-base"></ion-icon>
                  </div>
                  <div class="text-[18px] font-black text-[#111827] mb-0.5 leading-none">{{ stat.value }}</div>
                  <div class="text-[10px] text-[#9CA3AF] font-bold mt-1.5 uppercase leading-none">{{ stat.label }}</div>
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
      padding-bottom: calc(112px + env(safe-area-inset-bottom, 0px));
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      padding-top: env(safe-area-inset-top, 0px);
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .edit-cta {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: none;
      background: #111827;
      color: #fff;
      font-size: 13px;
      font-weight: 800;
      border-radius: 999px;
      padding: 10px 16px;
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

  readonly loading = signal(true);
  private readonly detail = signal<Record<string, unknown> | null>(null);

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
    const raw = this.detail()?.['verificationDocuments'];
    if (!raw || typeof raw !== 'object') return [];

    return Object.entries(raw as Record<string, Record<string, unknown>>)
      .map(([id, doc]) => {
        const url = String(doc?.['url'] || '');
        const name = String(doc?.['name'] || id);
        const mime = String(doc?.['mime'] || '').toLowerCase();
        const isImage = mime.startsWith('image/') || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url) || /\.(jpe?g|png|webp|gif)(\?|$)/i.test(name);
        const isPdf = mime.includes('pdf') || /\.pdf(\?|$)/i.test(url) || /\.pdf(\?|$)/i.test(name);
        return {
          id,
          label: DOC_LABELS[id] || this.titleCase(id),
          name,
          url,
          isImage,
          isPdf,
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
    void this.load();
  }

  private async load() {
    this.loading.set(true);
    try {
      const [profileRes] = await Promise.all([
        firstValueFrom(this.venueService.getMyProfile()),
        firstValueFrom(this.auth.fetchMe()).catch(() => null),
      ]);
      if (profileRes.success && profileRes.data) {
        this.detail.set(profileRes.data as Record<string, unknown>);
      }
    } catch {
      this.detail.set({
        name: this.auth.user()?.name,
        location: this.auth.user()?.location,
        profileImage: this.auth.user()?.profileImage,
      });
    } finally {
      this.loading.set(false);
    }
  }

  back() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }

  editProfile() {
    void this.router.navigateByUrl('/app/venue/complete-profile');
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
