import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { IonicModule, ToastController } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { VenueService } from '../../core/services/venue.service';

export interface VenueDocRow {
  id: string;
  label: string;
  required: boolean;
  status: string;
  name?: string | null;
  url?: string | null;
  rejectionReason?: string | null;
}

@Component({
  selector: 'app-venue-required-docs-modal',
  standalone: true,
  imports: [CommonModule, IonicModule],
  template: `
    <div class="backdrop" *ngIf="open">
      <div class="sheet" role="dialog" aria-modal="true">
        <div class="head">
          <h2>{{ isRejectedMode ? 'Re-submit Documents' : 'Complete Your Documents' }}</h2>
          <p>
            Your venue account has been approved, but
            {{ isRejectedMode ? 'some required documents were rejected.' : 'some required documents are still missing.' }}
            Please submit all required documents before your account can be fully activated.
          </p>
        </div>

        <div class="list">
          <div class="doc" *ngFor="let doc of actionableDocs">
            <div class="doc-top">
              <div>
                <div class="label">{{ doc.label }}</div>
                <div class="status" [class.ok]="doc.status === 'pending' || !!pendingLocal[doc.id]"
                     [class.bad]="doc.status === 'rejected'">
                  <ng-container *ngIf="doc.status === 'rejected'">Status: Rejected</ng-container>
                  <ng-container *ngIf="doc.status !== 'rejected' && (pendingLocal[doc.id] || doc.url)">Uploaded ✓</ng-container>
                  <ng-container *ngIf="doc.status !== 'rejected' && !pendingLocal[doc.id] && !doc.url">Required</ng-container>
                </div>
                <div class="reason" *ngIf="doc.rejectionReason">Reason: {{ doc.rejectionReason }}</div>
                <div class="fname" *ngIf="fileName(doc)">{{ fileName(doc) }}</div>
              </div>
              <label class="pick">
                <input type="file" accept="image/*,.pdf,application/pdf" (change)="onFile($event, doc)" hidden />
                {{ pendingLocal[doc.id] || doc.url ? 'Replace' : 'Select File' }}
              </label>
            </div>
            <div class="busy" *ngIf="uploadingId() === doc.id">Uploading…</div>
          </div>
        </div>

        <p class="err" *ngIf="error()">{{ error() }}</p>

        <button type="button" class="submit" (click)="submit()" [disabled]="submitting() || !canSubmit()">
          {{ submitting() ? 'Submitting…' : 'Submit Documents' }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .backdrop {
      position: fixed; inset: 0; z-index: 10000;
      background: rgba(17, 24, 39, 0.55);
      display: flex; align-items: flex-end; justify-content: center;
      padding: 16px; padding-bottom: calc(16px + var(--safe-area-bottom));
    }
    .sheet {
      width: min(480px, 100%); max-height: min(88vh, 720px); overflow: auto;
      background: #fff; border-radius: 24px; padding: 22px 20px 18px;
      box-shadow: 0 20px 50px rgba(0,0,0,.2);
    }
    .head h2 { margin: 0 0 8px; font-size: 20px; font-weight: 900; color: #111827; }
    .head p { margin: 0 0 18px; font-size: 13px; line-height: 1.45; color: #6B7280; font-weight: 600; }
    .list { display: grid; gap: 12px; margin-bottom: 14px; }
    .doc { border: 1px solid #E5E7EB; border-radius: 16px; padding: 12px 14px; background: #FAFBFC; }
    .doc-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
    .label { font-size: 14px; font-weight: 800; color: #111827; }
    .status { margin-top: 4px; font-size: 12px; font-weight: 700; color: #9CA3AF; }
    .status.ok { color: #16A34A; }
    .status.bad { color: #DC2626; }
    .reason { margin-top: 6px; font-size: 12px; color: #B91C1C; font-weight: 600; }
    .fname { margin-top: 4px; font-size: 11px; color: #6B7280; word-break: break-all; }
    .pick {
      flex-shrink: 0; height: 36px; padding: 0 12px; border-radius: 12px;
      background: #111827; color: #fff; font-size: 12px; font-weight: 800;
      display: inline-flex; align-items: center; cursor: pointer;
    }
    .busy { margin-top: 8px; font-size: 12px; font-weight: 700; color: #2563EB; }
    .err { color: #DC2626; font-size: 13px; font-weight: 700; margin: 0 0 10px; }
    .submit {
      width: 100%; height: 48px; border: none; border-radius: 16px;
      background: linear-gradient(135deg, var(--app-primary), var(--app-primary-to));
      color: #111827; font-size: 15px; font-weight: 900; cursor: pointer;
    }
    .submit:disabled { opacity: .55; cursor: not-allowed; }
  `],
})
export class VenueRequiredDocsModalComponent implements OnChanges {
  private readonly venueService = inject(VenueService);
  private readonly toast = inject(ToastController);

  @Input() open = false;
  @Input() documents: VenueDocRow[] = [];
  @Output() submitted = new EventEmitter<void>();
  @Output() refreshed = new EventEmitter<VenueDocRow[]>();

  readonly uploadingId = signal<string | null>(null);
  readonly submitting = signal(false);
  readonly error = signal('');
  pendingLocal: Record<string, string> = {};

  get actionableDocs(): VenueDocRow[] {
    return (this.documents || []).filter((d) => d.required && d.status !== 'approved');
  }

  get isRejectedMode(): boolean {
    return this.actionableDocs.some((d) => d.status === 'rejected');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['documents']) {
      this.pendingLocal = {};
      this.error.set('');
    }
  }

  fileName(doc: VenueDocRow): string {
    return this.pendingLocal[doc.id] || doc.name || '';
  }

  canSubmit(): boolean {
    return this.actionableDocs.every((d) => !!this.pendingLocal[d.id] || !!d.url);
  }

  async onFile(event: Event, doc: VenueDocRow): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;

    this.error.set('');
    this.uploadingId.set(doc.id);
    try {
      const res = await firstValueFrom(this.venueService.uploadDocument(doc.id, file));
      if (!res.success) {
        this.error.set(res.message || 'Upload failed.');
        return;
      }
      this.pendingLocal = { ...this.pendingLocal, [doc.id]: file.name };
      const toast = await this.toast.create({
        message: `${doc.label} uploaded`,
        duration: 1800,
        color: 'success',
      });
      await toast.present();
      this.refreshed.emit(this.mergeUpload(doc.id, file.name, res.data));
    } catch (e: any) {
      this.error.set(e?.message || 'Upload failed.');
    } finally {
      this.uploadingId.set(null);
    }
  }

  private mergeUpload(docId: string, name: string, data: any): VenueDocRow[] {
    return this.documents.map((d) => {
      if (d.id !== docId) return d;
      const uploaded = data?.document;
      return {
        ...d,
        status: 'pending',
        name: uploaded?.name || name,
        url: uploaded?.url || d.url || 'local',
        rejectionReason: null,
      };
    });
  }

  async submit(): Promise<void> {
    if (!this.canSubmit() || this.submitting()) return;
    this.submitting.set(true);
    this.error.set('');
    try {
      const res = await firstValueFrom(this.venueService.submitDocuments());
      if (!res.success) {
        this.error.set(res.message || 'Could not submit documents.');
        return;
      }
      this.submitted.emit();
    } catch (e: any) {
      this.error.set(e?.message || 'Could not submit documents.');
    } finally {
      this.submitting.set(false);
    }
  }
}
