import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  forwardRef,
  inject,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';
import { ControlValueAccessor, FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { GoogleMapsService } from '../../../core/services/google-maps.service';
import {
  LocationError,
  LocationErrorType,
  LocationService,
} from '../../../core/services/location.service';
import {
  NativeGoogleMapComponent,
  NativeMapCoordinate,
} from '../native-google-map/native-google-map.component';

const DEFAULT_CENTER: NativeMapCoordinate = { lat: 26.8467, lng: 80.9462 };
/** Wait this long for GPS before showing a fallback center, then pan if GPS arrives. */
const GPS_OPEN_WAIT_MS = 3000;

type GpsRead = { center: NativeMapCoordinate } | { error: unknown };

@Component({
  selector: 'app-location-field',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, NativeGoogleMapComponent],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => LocationFieldComponent),
      multi: true,
    },
  ],
  template: `
    <div class="location-field">
      <div
        class="field"
        [class.focused]="focused"
        [class.filled]="!!value"
        [class.floating]="focused || !!value"
        [class.disabled]="disabled"
        (click)="focusInput()"
      >
        <span class="float-label">{{ label }}</span>
        <div class="field-row">
          <ion-icon name="location-outline" class="field-icon"></ion-icon>
          <input
            #inputEl
            type="text"
            [placeholder]="focused && !value ? placeholder : ''"
            [disabled]="disabled"
            [value]="value"
            (input)="onInput($event)"
            (focus)="focused = true"
            (blur)="onBlur()"
          />
        </div>
      </div>

      <button
        *ngIf="mapsAvailable"
        type="button"
        class="map-link"
        (click)="openMap()"
      >
        <ion-icon name="map-outline"></ion-icon>
        Choose from map
      </button>

      <p *ngIf="!mapsAvailable && mapsChecked" class="maps-hint">
        Add GOOGLE_MAPS_API_KEY to .env for autocomplete and map picker.
      </p>
    </div>

    <ion-modal [isOpen]="mapOpen" (didDismiss)="closeMap()" [initialBreakpoint]="1" [breakpoints]="[0, 1]">
      <ng-template>
        <ion-header>
          <ion-toolbar>
            <ion-title>Choose location</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closeMap()">Cancel</ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="map-modal-content">
          <div class="map-stage">
            <app-native-google-map
              *ngIf="mapMounted"
              #pickerMap
              mode="picker"
              [center]="pickerCenter"
              [zoom]="pickerZoom"
              (centerIdle)="onCenterIdle($event)"
              (mapReady)="onMapReady()"
              (mapError)="onMapError($event)"
            ></app-native-google-map>

            <button
              *ngIf="mapMounted"
              type="button"
              class="locate-btn"
              [disabled]="locating"
              (click)="goToCurrentLocation()"
              aria-label="Use current location"
            >
              <ion-icon [name]="locating ? 'hourglass-outline' : 'locate-outline'"></ion-icon>
            </button>

            <div *ngIf="!mapMounted && mapLoading" class="map-overlay">
              <p>{{ locating ? 'Finding your location...' : 'Loading map...' }}</p>
            </div>
          </div>

          <div class="map-footer">
            <p *ngIf="mapHint" class="map-hint">{{ mapHint }}</p>
            <p *ngIf="mapAddress" class="map-address">{{ mapAddress }}</p>
            <p *ngIf="addressLoading" class="map-status">Updating address...</p>
            <p *ngIf="mapError" class="map-error">{{ mapError }}</p>
            <button
              type="button"
              class="confirm-btn"
              [disabled]="!canConfirm"
              (click)="confirmMap()"
            >
              Use this location
            </button>
          </div>
        </ion-content>
      </ng-template>
    </ion-modal>
  `,
  styles: [
    `
      .location-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .field {
        display: block;
        position: relative;
        background: #f9fafb;
        border: 2px solid #f3f4f6;
        border-radius: 16px;
        padding: 14px 16px;
        transition: border-color 0.15s ease, background 0.15s ease, padding 0.15s ease;
        cursor: text;
      }

      .field.floating {
        padding: 8px 16px 10px;
      }

      .field.focused {
        background: #ffffff;
        border-color: var(--app-primary);
      }

      .field.disabled {
        opacity: 0.55;
        pointer-events: none;
      }

      .float-label {
        display: block;
        font-size: 15px;
        font-weight: 500;
        color: #9ca3af;
        line-height: 1.2;
        pointer-events: none;
        transition: font-size 0.15s ease, color 0.15s ease, margin 0.15s ease;
        margin-bottom: 0;
      }

      .field.floating .float-label {
        font-size: 11px;
        font-weight: 600;
        color: #9ca3af;
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 4px;
      }

      .field.focused.floating .float-label {
        color: var(--app-primary);
      }

      .field-row {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 0;
        max-height: 0;
        overflow: hidden;
        opacity: 0;
        transition: max-height 0.15s ease, opacity 0.15s ease, min-height 0.15s ease;
      }

      .field.floating .field-row {
        min-height: 22px;
        max-height: 40px;
        opacity: 1;
        overflow: visible;
      }

      .field-icon {
        font-size: 17px;
        color: #9ca3af;
        flex-shrink: 0;
      }

      .field.focused .field-icon {
        color: var(--app-primary);
      }

      input {
        flex: 1;
        min-width: 0;
        border: none !important;
        background: transparent !important;
        box-shadow: none !important;
        outline: none;
        font-size: 15px;
        font-weight: 500;
        color: #111827;
        padding: 0;
        margin: 0;
        min-height: 22px;
        border-radius: 0;
        line-height: 1.3;
      }

      input::placeholder {
        color: #c4c9d4;
        font-weight: 500;
      }

      .map-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        align-self: flex-start;
        border: none;
        background: transparent;
        padding: 0;
        font-size: 13px;
        font-weight: 700;
        color: #2563eb;
        cursor: pointer;
      }

      .map-link ion-icon {
        font-size: 16px;
      }

      .maps-hint {
        margin: 0;
        font-size: 12px;
        color: #9ca3af;
      }

      .map-modal-content {
        --background: #fafbfc;
      }

      .map-stage {
        position: relative;
        width: 100%;
        height: 55vh;
        min-height: 280px;
        background: #e8eef5;
      }

      .map-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #e8eef5;
        color: #6b7280;
        font-size: 14px;
        font-weight: 600;
        z-index: 2;
      }

      .locate-btn {
        position: absolute;
        right: 14px;
        bottom: 14px;
        z-index: 5;
        width: 44px;
        height: 44px;
        border: none;
        border-radius: 50%;
        background: #ffffff;
        color: #111827;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(17, 24, 39, 0.18);
        cursor: pointer;
      }

      .locate-btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .locate-btn ion-icon {
        font-size: 22px;
      }

      .map-footer {
        padding: 16px 20px calc(16px + var(--safe-area-bottom));
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .map-address {
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #111827;
        line-height: 1.4;
      }

      .map-hint,
      .map-status {
        margin: 0;
        font-size: 13px;
        color: #6b7280;
      }

      .map-error {
        margin: 0;
        font-size: 13px;
        color: #dc2626;
      }

      .confirm-btn {
        width: 100%;
        border: none;
        border-radius: 999px;
        padding: 14px 20px;
        background: var(--app-primary);
        color: #111827;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(var(--app-primary-rgb), 0.35);
      }

      .confirm-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    `,
  ],
})
export class LocationFieldComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  private readonly googleMaps = inject(GoogleMapsService);
  private readonly locationService = inject(LocationService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('pickerMap') pickerMap?: NativeGoogleMapComponent;

  @Input() label = 'Location';
  @Input() placeholder = 'City e.g. Lucknow';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();

  value = '';
  focused = false;
  /** Resolved before first CD so *ngIf does not flip mid-cycle (NG0100). */
  mapsAvailable = this.googleMaps.isConfigured();
  mapsChecked = true;
  mapOpen = false;
  mapMounted = false;
  mapLoading = false;
  addressLoading = false;
  locating = false;
  mapError = '';
  mapHint = '';
  mapAddress = '';
  pickerCenter: NativeMapCoordinate = DEFAULT_CENTER;
  pickerZoom = 15;

  private autocomplete?: google.maps.places.Autocomplete;
  private autocompleteListener?: google.maps.MapsEventListener;
  private pendingCenter: NativeMapCoordinate | null = null;
  private geocodedCenter: NativeMapCoordinate | null = null;
  private geocodeSeq = 0;
  private openSeq = 0;

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  get canConfirm(): boolean {
    return !!this.mapAddress && !this.mapLoading && !this.addressLoading && !!this.pendingCenter;
  }

  async ngAfterViewInit() {
    if (!this.mapsAvailable) {
      return;
    }

    try {
      await this.googleMaps.load();
      this.initAutocomplete();
    } catch {
      // Defer so we don't trip ExpressionChangedAfterItHasBeenCheckedError.
      queueMicrotask(() => {
        this.mapsAvailable = false;
        this.cdr.markForCheck();
      });
    }
  }

  ngOnDestroy() {
    this.autocompleteListener?.remove();
    this.openSeq += 1;
    this.geocodeSeq += 1;
  }

  writeValue(value: string): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  focusInput() {
    this.inputEl?.nativeElement.focus();
  }

  onInput(event: Event) {
    const next = (event.target as HTMLInputElement).value;
    this.setValue(next);
  }

  onBlur() {
    this.focused = false;
    this.onTouched();
  }

  openMap() {
    this.mapError = '';
    this.mapHint = '';
    this.mapAddress = this.value;
    this.pendingCenter = null;
    this.geocodedCenter = null;
    this.mapMounted = false;
    this.mapLoading = true;
    this.addressLoading = false;
    this.locating = true;
    this.mapOpen = true;
    const seq = ++this.openSeq;
    const gpsTask = this.readGpsCenter();
    setTimeout(() => void this.preparePicker(seq, gpsTask), 80);
  }

  closeMap() {
    this.mapOpen = false;
    this.mapMounted = false;
    this.mapLoading = false;
    this.addressLoading = false;
    this.locating = false;
    this.mapError = '';
    this.mapHint = '';
    this.pendingCenter = null;
    this.geocodedCenter = null;
    this.openSeq += 1;
    this.geocodeSeq += 1;
  }

  async confirmMap() {
    // Always read live map center at confirm time (not an outdated GPS/saved point).
    const center = (await this.pickerMap?.getCenter()) || this.pendingCenter;
    if (!center) {
      this.mapError = 'Could not read map location. Please try again.';
      return;
    }

    this.pendingCenter = center;

    const addressMatchesCenter =
      !!this.mapAddress &&
      !!this.geocodedCenter &&
      this.sameCoordinate(this.geocodedCenter, center);

    if (!addressMatchesCenter) {
      this.addressLoading = true;
      this.cdr.markForCheck();
      try {
        this.mapAddress = await this.locationService.reverseGeocode(center.lat, center.lng);
        this.geocodedCenter = center;
      } catch {
        this.mapError = 'Could not resolve address for this point.';
        this.addressLoading = false;
        this.cdr.markForCheck();
        return;
      }
      this.addressLoading = false;
    }

    this.setValue(this.mapAddress);
    this.closeMap();
  }

  onMapReady() {
    this.mapLoading = false;
    this.cdr.markForCheck();
  }

  onMapError(message: string) {
    this.mapLoading = false;
    this.mapError = message || 'Unable to load map.';
    this.cdr.markForCheck();
  }

  onCenterIdle(center: NativeMapCoordinate) {
    this.pendingCenter = center;
    void this.reverseGeocodeCenter(center);
  }

  async goToCurrentLocation() {
    if (this.locating) {
      return;
    }

    this.locating = true;
    this.mapError = '';
    this.mapHint = '';

    try {
      const position = await this.locationService.getCurrentPosition();
      const next: NativeMapCoordinate = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      this.pickerCenter = next;
      this.pickerZoom = 16;
      await this.pickerMap?.animateTo(next, 16);
      // idle → reverse geocode; do not auto-save profile location
    } catch (error) {
      this.mapHint = this.permissionMessage(error);
    } finally {
      this.locating = false;
      this.cdr.markForCheck();
    }
  }

  private async preparePicker(seq: number, gpsTask: Promise<GpsRead>) {
    const fallbackTask = this.resolveFallbackCenter();

    try {
      const quick = await Promise.race([
        gpsTask.then((result) => ({ kind: 'gps' as const, result })),
        new Promise<{ kind: 'wait' }>((resolve) =>
          setTimeout(() => resolve({ kind: 'wait' }), GPS_OPEN_WAIT_MS),
        ),
      ]);

      if (seq !== this.openSeq) {
        return;
      }

      if (quick.kind === 'gps' && 'center' in quick.result) {
        this.applyPickerCenter(quick.result.center, 16, '');
        this.locating = false;
        this.mountPicker();
        return;
      }

      const fallback = await fallbackTask;
      if (seq !== this.openSeq) {
        return;
      }

      if (quick.kind === 'gps' && !('center' in quick.result)) {
        this.applyPickerCenter(
          fallback.center,
          fallback.zoom,
          this.permissionMessage(quick.result.error),
        );
        this.locating = false;
        this.mountPicker();
        return;
      }

      this.applyPickerCenter(fallback.center, fallback.zoom, '');
      this.locating = true;
      this.mountPicker();

      const gps = await gpsTask;
      if (seq !== this.openSeq) {
        return;
      }

      this.locating = false;
      if ('center' in gps) {
        this.pickerCenter = gps.center;
        this.pickerZoom = 16;
        this.mapHint = '';
        await this.pickerMap?.animateTo(gps.center, 16);
      } else {
        this.mapHint = this.permissionMessage(gps.error);
      }
    } catch (e) {
      if (seq !== this.openSeq) {
        return;
      }
      this.applyPickerCenter(DEFAULT_CENTER, 13, '');
      this.mapError = String(e);
      this.locating = false;
      this.mountPicker();
    }
    this.cdr.markForCheck();
  }

  private async readGpsCenter(): Promise<GpsRead> {
    try {
      const position = await this.locationService.getCurrentPosition();
      return {
        center: {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
      };
    } catch (error) {
      return { error };
    }
  }

  private async resolveFallbackCenter(): Promise<{
    center: NativeMapCoordinate;
    zoom: number;
  }> {
    const existing = this.value.trim();
    if (existing) {
      try {
        const geocoded = await this.googleMaps.geocode(existing, DEFAULT_CENTER);
        if (geocoded) {
          return { center: geocoded, zoom: 15 };
        }
      } catch {
        // Fall through to saved / default.
      }
    }

    const saved = this.locationService.getSavedLocation();
    if (saved && Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude)) {
      return {
        center: { lat: saved.latitude, lng: saved.longitude },
        zoom: 14,
      };
    }

    return { center: DEFAULT_CENTER, zoom: 13 };
  }

  private applyPickerCenter(center: NativeMapCoordinate, zoom: number, hint: string) {
    this.pickerCenter = center;
    this.pickerZoom = zoom;
    this.pendingCenter = center;
    this.mapHint = hint;
  }

  private mountPicker() {
    this.mapMounted = true;
    this.mapLoading = false;
    this.cdr.markForCheck();
  }

  private async reverseGeocodeCenter(center: NativeMapCoordinate) {
    const seq = ++this.geocodeSeq;
    this.addressLoading = true;
    this.mapError = '';
    this.cdr.markForCheck();

    try {
      const address = await this.locationService.reverseGeocode(center.lat, center.lng);
      if (seq !== this.geocodeSeq) {
        return;
      }
      this.mapAddress = address;
      this.geocodedCenter = center;
    } catch {
      if (seq !== this.geocodeSeq) {
        return;
      }
      this.mapError = 'Could not resolve address for this point.';
    } finally {
      if (seq === this.geocodeSeq) {
        this.addressLoading = false;
        this.cdr.markForCheck();
      }
    }
  }

  private sameCoordinate(a: NativeMapCoordinate, b: NativeMapCoordinate): boolean {
    return Math.abs(a.lat - b.lat) < 1e-6 && Math.abs(a.lng - b.lng) < 1e-6;
  }

  private permissionMessage(error: unknown): string {
    if (error instanceof LocationError) {
      switch (error.type) {
        case LocationErrorType.PERMISSION_DENIED:
        case LocationErrorType.PERMISSION_PERMANENTLY_DENIED:
          return 'Location permission denied. Move the map to choose a place, or enable location access.';
        case LocationErrorType.GPS_DISABLED:
          return 'GPS is turned off. Move the map to choose a place, or enable location services.';
        case LocationErrorType.TIMEOUT:
          return 'Could not get your current location in time. Move the map to choose a place.';
        default:
          return 'Current location unavailable. Move the map to choose a place.';
      }
    }
    return 'Current location unavailable. Move the map to choose a place.';
  }

  private setValue(next: string) {
    this.value = next;
    this.onChange(next);
    this.valueChange.emit(next);
  }

  private initAutocomplete() {
    const input = this.inputEl?.nativeElement;
    if (!input || this.autocomplete) {
      return;
    }

    this.autocomplete = new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: 'in' },
      fields: ['formatted_address', 'name', 'geometry'],
    });

    this.autocompleteListener = this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete?.getPlace();
      const address = place?.formatted_address || place?.name || '';
      if (address) {
        this.setValue(address);
      }
    });
  }
}
