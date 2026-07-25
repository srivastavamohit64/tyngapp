import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { firstValueFrom } from 'rxjs';
import { VenueService } from '../../../core/services/venue.service';

interface MaintFacility {
  id: string;
  name: string;
  sport: string;
  emoji: string;
  status: string;
  photo: string;
}

interface StatusOption {
  id: string;
  label: string;
  emoji: string;
  color: string;
  bg: string;
}

const SURFACES = ['Artificial Turf', 'Natural Grass', 'Wooden Court', 'Synthetic Court', 'Clay', 'Concrete'];

const STATUS_OPTIONS: StatusOption[] = [
  { id: 'open', label: 'Open', emoji: '🟢', color: '#22C55E', bg: '#F0FDF4' },
  { id: 'maintenance', label: 'Maintenance', emoji: '🟡', color: '#D97706', bg: '#FFFBEB' },
  { id: 'closed', label: 'Closed', emoji: '🔴', color: '#DC2626', bg: '#FEF2F2' },
  { id: 'reserved', label: 'Reserved', emoji: '🟠', color: '#C2410C', bg: '#FFF7ED' },
];

@Component({
  selector: 'app-venue-facilities-page',
  standalone: true,
  imports: [CommonModule, IonicModule, FormsModule],
  template: `
    <ion-content [fullscreen]="true" class="has-tabs">
      <div class="facilities-page pb-36 text-left">
        
        <!-- Header -->
        <div class="sticky-header bg-white border-b border-[#F3F4F6]">
          <div class="flex items-center justify-between px-5 h-14">
            <button (click)="goBack()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#F3F4F6] border-none">
              <ion-icon name="chevron-back-outline" class="text-xl text-[#111827]"></ion-icon>
            </button>
            <p class="text-[17px] font-black text-[#111827] m-0">Facilities</p>
            <button (click)="addFacility()" class="w-10 h-10 flex items-center justify-center rounded-xl bg-[#8CF000]/12 border-none">
              <ion-icon name="add-outline" class="text-xl text-[#111827] font-bold"></ion-icon>
            </button>
          </div>

          <!-- Horizontal Facility Selector list track -->
          <div class="flex gap-3 px-5 pb-4 overflow-x-auto no-scrollbar">
            <button *ngFor="let f of facilityList()" (click)="selectFacility(f.id)" class="flex-shrink-0 w-[130px] rounded-[18px] overflow-hidden text-left border-none p-0"
              [style.border]="selectedId() === f.id ? '2px solid #8CF000' : '2px solid transparent'"
              [style.boxShadow]="selectedId() === f.id ? '0 2px 12px rgba(140,240,0,0.25)' : '0 1px 6px rgba(0,0,0,0.08)'">
              <div class="relative h-[68px] bg-slate-200">
                <img [src]="f.photo" class="w-full h-full object-cover" />
                <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                <span class="absolute bottom-1.5 left-2 text-white text-[10px] font-black drop-shadow-md m-0 leading-none">{{ f.emoji }} {{ f.name }}</span>
                <div *ngIf="selectedId() === f.id" class="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#8CF000] flex items-center justify-center">
                  <ion-icon name="checkmark-outline" class="text-[#111827] text-xs font-black"></ion-icon>
                </div>
              </div>
              <div class="bg-white px-2 py-1.5 flex items-center justify-between">
                <span class="text-[9px] font-black text-[#9CA3AF] uppercase tracking-wide">{{ f.sport }}</span>
                <span class="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                  [style.backgroundColor]="getStatusStyle(f.status).bg"
                  [style.color]="getStatusStyle(f.status).color">
                  {{ f.status }}
                </span>
              </div>
            </button>
          </div>
        </div>

        <div class="px-5 pt-4 space-y-4">
          <p *ngIf="loading()" class="text-[13px] font-bold text-[#9CA3AF] text-center m-0 py-6">Loading facilities…</p>
          <div *ngIf="saveError()" class="rounded-2xl bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-[13px] font-bold text-[#DC2626]">
            {{ saveError() }}
          </div>

          <div *ngIf="!loading() && facilityList().length === 0" class="section-card p-5 bg-white text-center">
            <p class="text-[15px] font-black text-[#111827] m-0">No facilities yet</p>
            <p class="text-[12px] text-[#9CA3AF] mt-2 mb-4 m-0 font-bold">Add your first court so players can book it.</p>
            <button type="button" (click)="addFacility()" class="h-11 px-5 rounded-2xl text-[13px] font-black border-none btn-green-gradient">
              Add facility
            </button>
          </div>

          <!-- Form Section 1: Info -->
          <div class="section-card p-5 bg-white text-left" *ngIf="!loading() && (facilityList().length || selectedId())">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Facility Information</p>
            <div class="space-y-4">
              <div>
                <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Facility Name <span class="text-red-500">*</span></p>
                <input [(ngModel)]="facilityName" (ngModelChange)="onChange()" placeholder="Enter facility name" class="text-input-field" />
              </div>
              <div>
                <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Sport <span class="text-red-500">*</span></p>
                <input [(ngModel)]="sport" (ngModelChange)="onChange()" placeholder="Enter sport type" class="text-input-field" />
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Court Number</p>
                  <input [(ngModel)]="courtNumber" (ngModelChange)="onChange()" placeholder="Enter court number" class="text-input-field" />
                </div>
                <div>
                  <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Type</p>
                  <div class="flex gap-2">
                    <button *ngFor="let t of ['Indoor', 'Outdoor']" (click)="isIndoor.set(t === 'Indoor'); onChange()" class="flex-grow py-2.5 rounded-xl text-[12px] font-bold border-none"
                      [style.backgroundColor]="isIndoor() === (t === 'Indoor') ? 'rgba(140,240,0,0.12)' : '#F9FAFB'"
                      [style.color]="isIndoor() === (t === 'Indoor') ? '#111827' : '#6B7280'"
                      [style.border]="isIndoor() === (t === 'Indoor') ? '1.5px solid #8CF000' : 'none'">
                      {{ t }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Surface types selection -->
              <div>
                <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Playing Surface</p>
                <div class="flex flex-wrap gap-2">
                  <button *ngFor="let s of surfaces" (click)="surface.set(s); onChange()" class="px-3 py-1.5 rounded-full text-[11px] font-bold border-none"
                    [style.backgroundColor]="surface() === s ? 'rgba(140,240,0,0.14)' : '#F3F4F6'"
                    [style.color]="surface() === s ? '#111827' : '#6B7280'"
                    [style.border]="surface() === s ? '1.5px solid #8CF000' : 'none'">
                    {{ s }}
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Dimensions</p>
                  <input [(ngModel)]="dimensions" (ngModelChange)="onChange()" placeholder="Enter dimensions" class="text-input-field" />
                </div>
                <div>
                  <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Max Capacity <span class="text-red-500">*</span></p>
                  <input type="number" [(ngModel)]="capacity" (ngModelChange)="onChange()" placeholder="Enter capacity" class="text-input-field" />
                </div>
              </div>
            </div>
          </div>

          <!-- Form Section 2: Status -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Facility Status</p>
            <div class="grid grid-cols-2 gap-2.5">
              <button *ngFor="let opt of statusOptions" (click)="status.set(opt.id); onChange()" class="flex items-center gap-3 px-4 py-3.5 rounded-2xl border-none transition-all text-left"
                [style.backgroundColor]="status() === opt.id ? opt.bg : '#F9FAFB'"
                [style.border]="status() === opt.id ? '2px solid ' + opt.color : '2px solid transparent'">
                <span class="text-xl leading-none">{{ opt.emoji }}</span>
                <p class="text-[13px] font-bold text-[#111827] m-0">{{ opt.label }}</p>
                <div *ngIf="status() === opt.id" class="ml-auto w-5 h-5 rounded-full flex items-center justify-center" [style.backgroundColor]="opt.color">
                  <ion-icon name="checkmark-outline" class="text-white text-xs font-black"></ion-icon>
                </div>
              </button>
            </div>
            <div *ngIf="status() === 'maintenance' || status() === 'closed'" class="bg-[#FFF7ED] rounded-xl px-3.5 py-2.5 flex items-start gap-2 mt-3">
              <span class="text-base leading-none">⚠️</span>
              <p class="text-[11px] text-[#C2410C] leading-relaxed m-0 font-bold">Facilities marked as Maintenance or Closed will not accept new bookings.</p>
            </div>
          </div>

          <!-- Form Section 4: Equipment rentals count plus/minus -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Equipment Available</p>
            <div class="space-y-3">
              <div *ngFor="let eq of equipmentOptions()" class="flex items-center gap-3">
                <div class="w-9 h-9 rounded-xl bg-[#F3F4F6] flex items-center justify-center flex-shrink-0 text-xl">{{ eq.emoji }}</div>
                <div class="flex-grow min-w-0">
                  <p class="text-[13px] font-bold text-[#111827] m-0">{{ eq.label }}</p>
                  <input *ngIf="getEquipQty(eq.id) > 0" [(ngModel)]="rentalPrices[eq.id]" (ngModelChange)="onChange()" placeholder="₹ Rental price (optional)" class="rental-price-input" />
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <button (click)="decQty(eq.id)" class="w-8 h-8 rounded-full flex items-center justify-center border border-[#E5E7EB] bg-white border-none shadow-sm">
                    <ion-icon name="remove-outline" class="text-[#6B7280] text-xs font-bold"></ion-icon>
                  </button>
                  <span class="w-6 text-center text-[14px] font-black text-[#111827]">{{ getEquipQty(eq.id) }}</span>
                  <button (click)="incQty(eq.id)" class="w-8 h-8 rounded-full flex items-center justify-center border-none btn-green-gradient shadow-sm">
                    <ion-icon name="add-outline" class="text-[#111827] text-xs font-bold"></ion-icon>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Form Section 5: Cleaning & Maintenance logs dates -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Cleaning & Maintenance</p>
            <div class="space-y-4">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Last Cleaned</p>
                  <input type="date" [(ngModel)]="lastCleaned" (ngModelChange)="onChange()" class="text-input-field" />
                </div>
                <div>
                  <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Next Cleaning</p>
                  <input type="date" [(ngModel)]="nextCleaning" (ngModelChange)="onChange()" class="text-input-field" />
                </div>
              </div>
              <div>
                <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Maintenance Notes</p>
                <textarea [(ngModel)]="maintNotes" (ngModelChange)="onChange()" rows="2" placeholder="Any issues, upcoming maintenance or special notes..." class="notes-textarea"></textarea>
              </div>
            </div>
          </div>

          <!-- Form Section 6: Supervisor -->
          <div class="section-card p-5 bg-white text-left">
            <p class="text-[12px] font-black text-[#111827] uppercase tracking-widest mb-4 m-0">Turf Supervisor</p>
            <div class="space-y-3">
              <div>
                <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Full Name <span class="text-red-500">*</span></p>
                <input [(ngModel)]="supName" (ngModelChange)="onChange()" placeholder="Enter supervisor name" class="text-input-field" />
              </div>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Mobile <span class="text-red-500">*</span></p>
                  <input [(ngModel)]="supPhone" (ngModelChange)="onChange()" placeholder="Enter mobile number" class="text-input-field" />
                </div>
                <div>
                  <p class="field-label mb-1.5 m-0 font-bold text-[#9CA3AF]">Shift Timing</p>
                  <input [(ngModel)]="supShift" (ngModelChange)="onChange()" placeholder="Enter shift timing" class="text-input-field" />
                </div>
              </div>
            </div>
          </div>

          <!-- Attendance QR illustration scans -->
          <div class="section-card bg-gradient-to-br from-[#111827] to-[#1F2937] text-white p-5 text-left relative overflow-hidden">
            <div class="absolute -top-10 -right-10 w-24 h-24 rounded-full bg-white/5"></div>
            <div class="flex items-center gap-2 mb-2">
              <div class="w-9 h-9 rounded-xl bg-[#8CF000]/20 flex items-center justify-center">
                <ion-icon name="qr-code-outline" class="text-[#8CF000] text-lg font-bold"></ion-icon>
              </div>
              <p class="text-[15px] font-black text-white m-0">QR Check-In</p>
              <span class="text-[9px] bg-[#8CF000]/20 text-[#8CF000] font-black px-2 py-0.5 rounded-full">AUTO</span>
            </div>
            <p class="text-[12px] text-white/50 mb-4 m-0 leading-relaxed font-semibold">The supervisor scans TYNG booking QR codes at the entrance to verify players and coaches.</p>

            <div class="space-y-2 mb-4">
              <div *ngFor="let s of ['Verify booking status in real-time','Mark attendance automatically','Record entry time & player details']" class="flex items-center gap-2.5">
                <div class="w-4 h-4 rounded-full bg-[#8CF000] flex items-center justify-center flex-shrink-0">
                  <ion-icon name="checkmark-outline" class="text-[#111827] text-[10px] font-black"></ion-icon>
                </div>
                <span class="text-[12px] text-white/70 font-semibold">{{ s }}</span>
              </div>
            </div>

            <button class="w-full h-11 rounded-2xl text-[14px] font-black btn-green-gradient border-none">
              Open QR Scanner
            </button>
          </div>
        </div>

        <!-- Discard/Save floating footer track -->
        <div *ngIf="hasChanges() || saved()" class="venue-safe-footer fixed bottom-0 left-0 right-0 z-30 bg-white max-w-md mx-auto px-5 pt-4 shadow-2xl border-t border-[#F3F4F6]">
          <div class="flex gap-3">
            <button (click)="discardChanges()" [disabled]="saving()" class="flex-1 h-12 rounded-2xl text-[14px] font-bold text-[#6B7280] bg-[#F3F4F6] border-none flex items-center justify-center gap-1">
              <ion-icon name="close-outline" class="text-base"></ion-icon>Discard
            </button>
            <button (click)="saveChanges()" [disabled]="saving()" class="flex-[2] h-12 rounded-2xl text-[16px] font-black border-none text-white flex items-center justify-center gap-1.5 transition-all"
              [style.background]="saved() ? 'linear-gradient(135deg,#22C55E,#16A34A)' : 'linear-gradient(135deg,#FF7A00,#FF9A40)'"
              [style.boxShadow]="saved() ? 'none' : '0 4px 16px rgba(255,122,0,0.40)'">
              <ion-icon [name]="saved() ? 'checkmark-circle-outline' : 'save-outline'" class="text-lg"></ion-icon>
              <span>{{ saving() ? 'Saving…' : (saved() ? 'Saved!' : 'Save Facility') }}</span>
            </button>
          </div>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .facilities-page {
      background: #FAFBFC;
      min-height: 100%;
      padding-bottom: calc(144px + env(safe-area-inset-bottom, 0px));
    }

    .sticky-header {
      position: sticky;
      top: 0;
      z-index: 30;
      padding-top: env(safe-area-inset-top, 0px);
      box-shadow: 0 2px 10px rgba(0,0,0,0.02);
    }

    .section-card {
      border-radius: 24px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.05);
    }

    .no-scrollbar {
      scrollbar-width: none;
      &::-webkit-scrollbar {
        display: none;
      }
    }

    .text-input-field {
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      border: 2px solid #F3F4F6;
      background: #F9FAFB;
      font-size: 14px;
      font-weight: 600;
      color: #111827;
      outline: none;
      box-sizing: border-box;

      &:focus {
        border-color: #8CF000;
        background: white;
      }
    }

    .notes-textarea {
      width: 100%;
      padding: 12px 14px;
      border-radius: 12px;
      border: 2px solid #F3F4F6;
      background: #F9FAFB;
      font-size: 14px;
      font-weight: 500;
      color: #111827;
      outline: none;
      box-sizing: border-box;
      resize: none;

      &:focus {
        border-color: #8CF000;
        background: white;
      }
    }

    .rental-price-input {
      width: 100%;
      margin-top: 6px;
      padding: 8px 10px;
      border-radius: 8px;
      border: 1px solid #F3F4F6;
      background: #F9FAFB;
      font-size: 11px;
      font-weight: 600;
      color: #111827;
      outline: none;
      box-sizing: border-box;

      &:focus {
        border-color: #8CF000;
      }
    }

    .btn-green-gradient {
      background: linear-gradient(135deg, #8CF000, #A3E635);
      box-shadow: 0 4px 12px rgba(140,240,0,0.30);
      color: #111827;
    }
  `]
})
export class VenueFacilitiesPage implements OnInit {
  private readonly router = inject(Router);
  private readonly venueService = inject(VenueService);

  facilityList = signal<MaintFacility[]>([]);
  selectedId = signal('');
  loading = signal(false);
  saving = signal(false);
  saveError = signal('');

  hasChanges = signal(false);
  saved = signal(false);

  facilityName = '';
  sport = 'Football';
  courtNumber = '1';
  isIndoor = signal(false);
  surface = signal('Artificial Turf');
  dimensions = '';
  capacity = 22;
  status = signal('open');
  pricePerHour = 0;

  equipQty = signal<Record<string, number>>({});
  rentalPrices: Record<string, string> = {};

  lastCleaned = '';
  nextCleaning = '';
  maintNotes = '';

  supName = '';
  supShift = '';
  supPhone = '';

  readonly surfaces = SURFACES;
  readonly statusOptions = STATUS_OPTIONS;
  equipmentOptions = signal<Array<{ id: string; label: string; emoji: string; defaultPrice: number }>>([]);
  readonly Math = Math;

  private courtsRaw: any[] = [];

  ngOnInit() {
    void this.bootstrap();
  }

  private async bootstrap() {
    this.loading.set(true);
    this.saveError.set('');
    try {
      const [equipRes, profileRes] = await Promise.all([
        firstValueFrom(this.venueService.getEquipmentCatalog()),
        firstValueFrom(this.venueService.getMyProfile()),
      ]);

      const equipItems = Array.isArray(equipRes.data) ? equipRes.data : [];
      this.equipmentOptions.set(
        equipItems.map((item) => ({
          id: item.id,
          label: item.label || item.name,
          emoji: item.emoji || '🎾',
          defaultPrice: Number(item.defaultPricePerHour || 0),
        })),
      );

      if (!profileRes.success || !profileRes.data) {
        this.saveError.set(profileRes.message || 'Unable to load facilities.');
        return;
      }

      const data = profileRes.data as Record<string, any>;

      const rental = Array.isArray(data['rentalEquipment']) ? data['rentalEquipment'] : [];
      const qty: Record<string, number> = {};
      const prices: Record<string, string> = {};
      rental.forEach((item: any) => {
        const id = String(item?.id || '');
        if (!id) return;
        qty[id] = Number(item?.qty || 0);
        prices[id] = String(item?.price ?? 0);
      });
      this.equipQty.set(qty);
      this.rentalPrices = prices;

      const courts = Array.isArray(data['courts']) ? data['courts'] : [];
      this.courtsRaw = courts;
      const mapped: MaintFacility[] = courts.map((court: any, index: number) => {
        const sport = this.titleCase(String(court.sport || 'Sport'));
        return {
          id: String(court.id ?? `new-${index}`),
          name: String(court.courtName || court.name || `Court ${index + 1}`),
          sport,
          emoji: this.sportEmoji(sport),
          status: String(court.status || 'open').toLowerCase(),
          photo: String(court.image || court.imageUrl || DEFAULT_PHOTOS[sport.toLowerCase()] || DEFAULT_PHOTOS['football']),
        };
      });

      this.facilityList.set(mapped);
      if (mapped.length) {
        this.selectFacility(mapped[0].id);
      } else {
        this.resetFormForNew();
      }
    } catch (error: any) {
      this.saveError.set(error?.error?.message || 'Unable to load facilities.');
    } finally {
      this.loading.set(false);
    }
  }

  selectFacility(id: string) {
    const f = this.facilityList().find((x) => x.id === id);
    if (!f) return;
    this.selectedId.set(id);
    const court = this.courtsRaw.find((c) => String(c.id) === id) || {};
    const meta = (court.meta && typeof court.meta === 'object') ? court.meta : {};

    this.facilityName = f.name;
    this.sport = f.sport;
    this.status.set(f.status);
    this.courtNumber = String(meta['courtNumber'] || '');
    this.isIndoor.set(!!court.isIndoor);
    this.surface.set(String(court.surface || meta['surface'] || 'Artificial Turf'));
    this.dimensions = String(meta['dimensions'] || '');
    this.capacity = Number(court.maxPlayers || meta['capacity'] || 22);
    this.pricePerHour = Number(court.pricePerHour || 0);
    this.lastCleaned = String(meta['lastCleaned'] || '');
    this.nextCleaning = String(meta['nextCleaning'] || '');
    this.maintNotes = String(meta['maintNotes'] || '');
    this.supName = String(meta['supervisorName'] || '');
    this.supPhone = String(meta['supervisorPhone'] || '');
    this.supShift = String(meta['supervisorShift'] || '');

    this.hasChanges.set(false);
    this.saved.set(false);
    this.saveError.set('');
  }

  getStatusStyle(status: string) {
    if (status === 'open') return { bg: '#F0FDF4', color: '#16A34A' };
    if (status === 'maintenance') return { bg: '#FFFBEB', color: '#D97706' };
    if (status === 'closed') return { bg: '#FEF2F2', color: '#DC2626' };
    return { bg: '#FFF7ED', color: '#C2410C' };
  }

  getEquipQty(id: string): number {
    return this.equipQty()[id] ?? 0;
  }

  incQty(id: string) {
    this.equipQty.update((eq) => ({ ...eq, [id]: (eq[id] ?? 0) + 1 }));
    if (!this.rentalPrices[id]) {
      const item = this.equipmentOptions().find((e) => e.id === id);
      this.rentalPrices[id] = String(item?.defaultPrice ?? 0);
    }
    this.onChange();
  }

  decQty(id: string) {
    this.equipQty.update((eq) => {
      const copy = { ...eq };
      if ((copy[id] ?? 0) > 0) copy[id]--;
      return copy;
    });
    this.onChange();
  }

  onChange() {
    this.hasChanges.set(true);
    this.saved.set(false);
  }

  async saveChanges() {
    if (this.saving()) return;
    this.saving.set(true);
    this.saveError.set('');
    try {
      const selectedId = this.selectedId();
      const numericId = Number(selectedId);
      const meta = {
        courtNumber: this.courtNumber,
        dimensions: this.dimensions,
        capacity: this.capacity,
        lastCleaned: this.lastCleaned,
        nextCleaning: this.nextCleaning,
        maintNotes: this.maintNotes,
        supervisorName: this.supName,
        supervisorPhone: this.supPhone,
        supervisorShift: this.supShift,
      };

      const courtPayload = {
        name: this.facilityName.trim() || 'Court',
        sport: this.sport.toLowerCase(),
        isIndoor: this.isIndoor(),
        pricePerHour: Number(this.pricePerHour || 0),
        hasRentalGear: Object.values(this.equipQty()).some((q) => q > 0),
        status: this.status(),
        surface: this.surface(),
        maxPlayers: Number(this.capacity || 0) || null,
        meta,
      };

      if (Number.isFinite(numericId) && numericId > 0) {
        await firstValueFrom(this.venueService.updateCourt(numericId, courtPayload));
      } else {
        const created = await firstValueFrom(this.venueService.createCourt(courtPayload as any));
        if (created.data?.id) {
          this.selectedId.set(String(created.data.id));
        }
      }

      await firstValueFrom(
        this.venueService.updateMyProfile({
          rentalEquipment: this.equipmentOptions()
            .filter((item) => (this.equipQty()[item.id] || 0) > 0)
            .map((item) => ({
              id: item.id,
              label: item.label,
              emoji: item.emoji,
              qty: this.equipQty()[item.id] || 0,
              price: Number(this.rentalPrices[item.id] || item.defaultPrice || 0),
            })),
        }),
      );

      await this.bootstrap();
      this.hasChanges.set(false);
      this.saved.set(true);
      setTimeout(() => this.saved.set(false), 2000);
    } catch (error: any) {
      this.saveError.set(error?.error?.message || 'Unable to save facility.');
    } finally {
      this.saving.set(false);
    }
  }

  discardChanges() {
    if (this.selectedId()) this.selectFacility(this.selectedId());
    this.hasChanges.set(false);
  }

  addFacility() {
    const nextId = `new-${Date.now()}`;
    const newFac: MaintFacility = {
      id: nextId,
      name: 'New Court',
      sport: 'Basketball',
      emoji: '🏀',
      status: 'open',
      photo: DEFAULT_PHOTOS['basketball'],
    };
    this.facilityList.update((list) => [...list, newFac]);
    this.courtsRaw = [...this.courtsRaw, { id: nextId, meta: {} }];
    this.selectFacility(nextId);
    this.onChange();
  }

  goBack() {
    void this.router.navigateByUrl('/app/venue/dashboard');
  }

  private resetFormForNew() {
    this.selectedId.set('');
    this.facilityName = '';
    this.sport = 'Football';
    this.status.set('open');
    this.courtNumber = '1';
    this.isIndoor.set(false);
    this.surface.set('Artificial Turf');
    this.dimensions = '';
    this.capacity = 22;
    this.pricePerHour = 0;
  }

  private titleCase(value: string): string {
    return value.replace(/\b\w/g, (c) => c.toUpperCase());
  }

  private sportEmoji(sport: string): string {
    const key = sport.toLowerCase();
    if (key.includes('foot')) return '⚽';
    if (key.includes('basket')) return '🏀';
    if (key.includes('badminton')) return '🏸';
    if (key.includes('cricket')) return '🏏';
    if (key.includes('tennis')) return '🎾';
    return '🏟️';
  }
}

const DEFAULT_PHOTOS: Record<string, string> = {
  football: 'https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=300&h=200&fit=crop&auto=format',
  basketball: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=300&h=200&fit=crop&auto=format',
  badminton: 'https://images.unsplash.com/photo-1722087642932-9b070e9a066e?w=300&h=200&fit=crop&auto=format',
  cricket: 'https://images.unsplash.com/photo-1593341646782-e0b495cff86d?w=300&h=200&fit=crop&auto=format',
};

