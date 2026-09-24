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
  ReverseGeocodeDetails,
} from '../../../core/services/location.service';
import {
  NativeGoogleMapComponent,
  NativeMapCoordinate,
} from '../native-google-map/native-google-map.component';

const DEFAULT_CENTER: NativeMapCoordinate = { lat: 26.8467, lng: 80.9462 };
/** Open quickly with a fallback; a later GPS fix automatically recenters the map. */
const GPS_OPEN_WAIT_MS = 700;

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
        background: var(--app-input);
        border: 1.5px solid var(--app-border-subtle);
        border-radius: var(--app-radius-input);
        padding: 14px 16px;
        transition: border-color var(--app-motion-fast) ease, background var(--app-motion-fast) ease, box-shadow var(--app-motion-fast) ease, padding var(--app-motion-fast) ease;
        cursor: text;
      }

      .field.floating {
        padding: 8px 16px 10px;
      }

      .field.focused {
        background: var(--app-surface);
        border-color: var(--app-primary);
        box-shadow: var(--app-focus-ring);
      }

      .field.disabled {
        opacity: 0.55;
        pointer-events: none;
      }

      .float-label {
        display: block;
        font-size: 15px;
        font-weight: 500;
        color: var(--app-foreground-muted);
        line-height: 1.2;
        pointer-events: none;
        transition: font-size 0.15s ease, color 0.15s ease, margin 0.15s ease;
        margin-bottom: 0;
      }

      .field.floating .float-label {
        font-size: 11px;
        font-weight: 600;
        color: var(--app-foreground-muted);
        text-transform: uppercase;
        letter-spacing: 0.04em;
        margin-bottom: 4px;
      }

      .field.focused.floating .float-label {
        color: var(--app-primary-ink);
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
        color: var(--app-foreground-muted);
        flex-shrink: 0;
      }

      .field.focused .field-icon {
        color: var(--app-primary-ink);
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
        color: var(--app-foreground);
        padding: 0;
        margin: 0;
        min-height: 22px;
        border-radius: 0;
        line-height: 1.3;
      }

      input::placeholder {
        color: var(--app-foreground-muted);
        font-weight: 500;
      }

      .map-link {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        align-self: flex-end;
        border: none;
        background: transparent;
        padding: 0;
        font-size: 13px;
        font-weight: 700;
        color: var(--app-primary-ink);
        cursor: pointer;
      }

      .map-link ion-icon {
        font-size: 16px;
      }

      .maps-hint {
        margin: 0;
        font-size: 12px;
        color: var(--app-foreground-muted);
      }

      .map-modal-content {
        --background: var(--app-background);
      }

      .map-stage {
        position: relative;
        width: 100%;
        height: 55vh;
        min-height: 280px;
        background: var(--app-surface-subtle);
      }

      .map-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--app-surface-subtle);
        color: var(--app-foreground-secondary);
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
        background: var(--app-surface);
        color: var(--app-foreground);
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: var(--app-shadow-float);
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
        color: var(--app-foreground);
        line-height: 1.4;
      }

      .map-hint,
      .map-status {
        margin: 0;
        font-size: 13px;
        color: var(--app-foreground-secondary);
      }

      .map-error {
        margin: 0;
        font-size: 13px;
        color: #b42318;
      }

      .confirm-btn {
        width: 100%;
        border: none;
        border-radius: var(--app-radius-button);
        padding: 14px 20px;
        background: var(--app-primary);
        color: var(--app-foreground);
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 6px 18px rgba(var(--app-primary-rgb), 0.28);
        transition: transform var(--app-motion-fast) var(--app-motion-ease), box-shadow var(--app-motion-fast) ease;
      }

      .confirm-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .confirm-btn:active:not(:disabled) {
        transform: translateY(1px) scale(0.99);
        box-shadow: 0 2px 8px rgba(var(--app-primary-rgb), 0.24);
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
  @Output() detailsChange = new EventEmitter<ReverseGeocodeDetails>();

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
  private mapDetails: ReverseGeocodeDetails | null = null;
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
      this.sameCoordinate(this.geocodedCenter, center) &&
      !!this.mapDetails;

    if (!addressMatchesCenter) {
      this.addressLoading = true;
      this.cdr.markForCheck();
      try {
        const details = await this.locationService.reverseGeocodeDetails(center.lat, center.lng);
        this.mapAddress = details.address;
        this.mapDetails = details;
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
    if (this.mapDetails) {
      this.detailsChange.emit(this.mapDetails);
    }
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

      const fallback = this.immediateFallbackCenter();
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
        void this.recenterOnExistingAddress(seq, fallback.center);
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
        void this.recenterOnExistingAddress(seq, fallback.center);
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

  private immediateFallbackCenter(): {
    center: NativeMapCoordinate;
    zoom: number;
  } {
    const saved = this.locationService.getSavedLocation();
    if (saved && Number.isFinite(saved.latitude) && Number.isFinite(saved.longitude)) {
      return {
        center: { lat: saved.latitude, lng: saved.longitude },
        zoom: 14,
      };
    }

    return { center: DEFAULT_CENTER, zoom: 13 };
  }

  /**
   * If GPS is unavailable, resolve the venue's existing address without
   * blocking the map from opening. Do not override a point the user moved to.
   */
  private async recenterOnExistingAddress(seq: number, initialCenter: NativeMapCoordinate) {
    const existing = this.value.trim();
    if (!existing) {
      return;
    }

    try {
      const geocoded = await this.googleMaps.geocode(existing, DEFAULT_CENTER);
      if (
        !geocoded ||
        seq !== this.openSeq ||
        (this.pendingCenter && !this.sameCoordinate(this.pendingCenter, initialCenter))
      ) {
        return;
      }
      this.pickerCenter = geocoded;
      this.pickerZoom = 15;
      await this.pickerMap?.animateTo(geocoded, 15);
    } catch {
      // Keep the already-visible saved/default center.
    }
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
      const details = await this.locationService.reverseGeocodeDetails(center.lat, center.lng);
      if (seq !== this.geocodeSeq) {
        return;
      }
      this.mapAddress = details.address;
      this.mapDetails = details;
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
      fields: ['formatted_address', 'name', 'geometry', 'address_components'],
    });

    this.autocompleteListener = this.autocomplete.addListener('place_changed', () => {
      const place = this.autocomplete?.getPlace();
      const address = place?.formatted_address || place?.name || '';
      if (!address) return;

      this.setValue(address);
      const details = this.detailsFromPlace(place);
      if (details) {
        this.mapDetails = details;
        this.detailsChange.emit(details);
      }
    });
  }

  private detailsFromPlace(place?: google.maps.places.PlaceResult | null): ReverseGeocodeDetails | null {
    if (!place?.address_components?.length) return null;
    const get = (type: string) =>
      place.address_components?.find((c) => c.types.includes(type))?.long_name?.trim() || '';
    const city = get('locality') || get('administrative_area_level_2');
    const state = get('administrative_area_level_1');
    const pincode = get('postal_code');
    const postalArea =
      get('sublocality_level_1') ||
      get('sublocality') ||
      get('neighborhood') ||
      get('administrative_area_level_3') ||
      city;
    const address = place.formatted_address || place.name || '';
    const shortLabel = [postalArea, city]
      .filter((part, index, all) =>
        Boolean(part) && all.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index,
      )
      .join(' > ') || address;
    return { address, postalArea, pincode, city, state, shortLabel };
  }
}
