import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
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

const DEFAULT_CENTER = { lat: 26.8467, lng: 80.9462 };

@Component({
  selector: 'app-location-field',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
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
          <div #mapContainer class="map-container"></div>
          <div class="map-footer">
            <p *ngIf="mapAddress" class="map-address">{{ mapAddress }}</p>
            <p *ngIf="mapLoading" class="map-status">Loading map...</p>
            <p *ngIf="mapError" class="map-error">{{ mapError }}</p>
            <button type="button" class="confirm-btn" [disabled]="!mapAddress || mapLoading" (click)="confirmMap()">
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
        border-color: #8cf000;
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
        color: #8cf000;
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
        color: #8cf000;
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

      .map-container {
        width: 100%;
        height: 55vh;
        min-height: 280px;
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
        background: #8cf000;
        color: #111827;
        font-size: 15px;
        font-weight: 800;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(140, 240, 0, 0.35);
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

  @ViewChild('inputEl') inputEl?: ElementRef<HTMLInputElement>;
  @ViewChild('mapContainer') mapContainer?: ElementRef<HTMLDivElement>;

  @Input() label = 'Location';
  @Input() placeholder = 'City e.g. Lucknow';
  @Input() disabled = false;

  @Output() valueChange = new EventEmitter<string>();

  value = '';
  focused = false;
  mapsAvailable = false;
  mapsChecked = false;
  mapOpen = false;
  mapLoading = false;
  mapError = '';
  mapAddress = '';

  private autocomplete?: google.maps.places.Autocomplete;
  private autocompleteListener?: google.maps.MapsEventListener;
  private map?: google.maps.Map;
  private marker?: google.maps.Marker;
  private geocoder?: google.maps.Geocoder;
  private mapClickListener?: google.maps.MapsEventListener;
  private markerDragListener?: google.maps.MapsEventListener;

  private onChange: (v: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  async ngAfterViewInit() {
    this.mapsAvailable = this.googleMaps.isConfigured();
    this.mapsChecked = true;

    if (!this.mapsAvailable) {
      return;
    }

    try {
      await this.googleMaps.load();
      this.initAutocomplete();
    } catch {
      this.mapsAvailable = false;
    }
  }

  ngOnDestroy() {
    this.autocompleteListener?.remove();
    this.mapClickListener?.remove();
    this.markerDragListener?.remove();
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
    this.mapAddress = this.value;
    this.mapOpen = true;
    setTimeout(() => void this.initMap(), 150);
  }

  closeMap() {
    this.mapOpen = false;
    this.mapLoading = false;
    this.mapError = '';
  }

  confirmMap() {
    if (this.mapAddress) {
      this.setValue(this.mapAddress);
    }
    this.closeMap();
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

  private async initMap() {
    const container = this.mapContainer?.nativeElement;
    if (!container) {
      return;
    }

    this.mapLoading = true;
    this.mapError = '';

    try {
      await this.googleMaps.load();
      this.geocoder = new google.maps.Geocoder();

      const center = await this.resolveInitialCenter();

      this.map = new google.maps.Map(container, {
        center,
        zoom: 13,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      this.marker = new google.maps.Marker({
        map: this.map,
        position: center,
        draggable: true,
      });

      this.mapClickListener = this.map.addListener('click', (event: google.maps.MapMouseEvent) => {
        if (!event.latLng || !this.marker) {
          return;
        }
        this.marker.setPosition(event.latLng);
        void this.reverseGeocode(event.latLng);
      });

      this.markerDragListener = this.marker.addListener('dragend', () => {
        const position = this.marker?.getPosition();
        if (position) {
          void this.reverseGeocode(position);
        }
      });

      void this.reverseGeocode(center);
    } catch (e) {
      this.mapError = String(e);
    } finally {
      this.mapLoading = false;
    }
  }

  private async resolveInitialCenter(): Promise<google.maps.LatLngLiteral> {
    if (this.value.trim()) {
      const geocoded = await this.geocodeAddress(this.value.trim());
      if (geocoded) {
        return geocoded;
      }
    }

    return DEFAULT_CENTER;
  }

  private geocodeAddress(address: string): Promise<google.maps.LatLngLiteral | null> {
    return new Promise((resolve) => {
      if (!this.geocoder) {
        this.geocoder = new google.maps.Geocoder();
      }

      this.geocoder.geocode({ address, componentRestrictions: { country: 'IN' } }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
        } else {
          resolve(null);
        }
      });
    });
  }

  private reverseGeocode(latLng: google.maps.LatLng | google.maps.LatLngLiteral) {
    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }

    this.mapLoading = true;
    this.geocoder.geocode({ location: latLng }, (results, status) => {
      this.mapLoading = false;
      if (status === 'OK' && results?.[0]?.formatted_address) {
        this.mapAddress = results[0].formatted_address;
        this.mapError = '';
      } else {
        this.mapError = 'Could not resolve address for this point.';
      }
    });
  }
}
