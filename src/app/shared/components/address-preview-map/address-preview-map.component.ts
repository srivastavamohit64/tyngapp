import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges, inject } from '@angular/core';
import { GoogleMapsService } from '../../../core/services/google-maps.service';
import {
  NativeGoogleMapComponent,
  NativeMapCoordinate,
  NativeMapMarkerInput,
} from '../native-google-map/native-google-map.component';

const FALLBACK: NativeMapCoordinate = { lat: 26.8467, lng: 80.9462 };

@Component({
  selector: 'app-address-preview-map',
  standalone: true,
  imports: [CommonModule, NativeGoogleMapComponent],
  template: `
    <div class="preview-map" [style.height]="height">
      <app-native-google-map
        *ngIf="ready"
        mode="display"
        [center]="center"
        [zoom]="14"
        [markers]="markers"
        [interactive]="interactive"
      ></app-native-google-map>
    </div>
  `,
  styles: [
    `
      .preview-map {
        width: 100%;
        min-height: 140px;
        border-radius: inherit;
        overflow: hidden;
        background: transparent;
      }
    `,
  ],
})
export class AddressPreviewMapComponent implements OnChanges {
  private readonly googleMaps = inject(GoogleMapsService);

  @Input() query = '';
  @Input() height = '180px';
  @Input() interactive = false;

  ready = false;
  center = FALLBACK;
  markers: NativeMapMarkerInput[] = [];

  async ngOnChanges(changes: SimpleChanges) {
    if (!changes['query']) {
      return;
    }
    await this.resolve();
  }

  private async resolve() {
    const query = this.query.trim();
    if (query.length < 4) {
      this.ready = false;
      this.markers = [];
      return;
    }

    const geocoded = await this.googleMaps.geocode(query, FALLBACK);
    this.center = geocoded || FALLBACK;
    this.markers = [
      {
        id: 'place',
        coordinate: this.center,
        title: query,
      },
    ];
    this.ready = true;
  }
}
