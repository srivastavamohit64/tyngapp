import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { GoogleMapsService } from '../../../core/services/google-maps.service';

export type NativeMapMode = 'picker' | 'display';

export interface NativeMapCoordinate {
  lat: number;
  lng: number;
}

export interface NativeMapMarkerInput {
  id: string;
  coordinate: NativeMapCoordinate;
  title?: string;
  snippet?: string;
}

/** Soft, delivery-app style map — readable roads/labels, less POI clutter. */
const PICKER_MAP_STYLES: google.maps.MapTypeStyle[] = [
  { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.attraction', elementType: 'labels', stylers: [{ visibility: 'simplified' }] },
  { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ lightness: 10 }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', stylers: [{ color: '#c9e4f5' }] },
  { featureType: 'landscape', stylers: [{ color: '#f4f6f8' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ lightness: 40 }] },
];

@Component({
  selector: 'app-native-google-map',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="native-map-host" [class.native-map-host--picker]="mode === 'picker'">
      <div #mapEl class="native-map-el"></div>

      <div
        *ngIf="mode === 'picker'"
        class="center-pin"
        [class.is-moving]="pinMoving"
        [class.is-settling]="pinSettling"
        aria-hidden="true"
      >
        <div class="pin-glyph">
          <span class="pin-dot"></span>
        </div>
        <span class="pin-shadow"></span>
      </div>

      <ng-content></ng-content>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      .native-map-host {
        position: relative;
        width: 100%;
        height: 100%;
        min-height: inherit;
        background: #e8eef5;
        overflow: hidden;
      }

      .native-map-el {
        display: block;
        width: 100%;
        height: 100%;
        min-height: 160px;
      }

      .center-pin {
        position: absolute;
        left: 50%;
        top: 50%;
        z-index: 4;
        width: 40px;
        height: 52px;
        margin-left: -20px;
        margin-top: -48px;
        pointer-events: none;
        display: flex;
        flex-direction: column;
        align-items: center;
      }

      .pin-glyph {
        position: relative;
        width: 30px;
        height: 30px;
        background: #e11d48;
        border: 2.5px solid #ffffff;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        box-shadow: 0 6px 14px rgba(17, 24, 39, 0.28);
        transform-origin: center center;
        transition: transform 0.18s ease;
      }

      .pin-dot {
        position: absolute;
        top: 50%;
        left: 50%;
        width: 9px;
        height: 9px;
        margin: -4.5px 0 0 -4.5px;
        border-radius: 50%;
        background: #ffffff;
        transform: rotate(45deg);
      }

      .center-pin.is-moving .pin-glyph {
        transform: rotate(-45deg) translate(4px, -6px) scale(1.06);
      }

      .center-pin.is-settling .pin-glyph {
        animation: pin-settle 0.32s ease;
      }

      .pin-shadow {
        width: 16px;
        height: 6px;
        margin-top: 8px;
        border-radius: 50%;
        background: rgba(17, 24, 39, 0.3);
        transition: transform 0.18s ease, opacity 0.18s ease;
      }

      .center-pin.is-moving .pin-shadow {
        transform: scale(0.65);
        opacity: 0.16;
      }

      @keyframes pin-settle {
        0% {
          transform: rotate(-45deg) translate(4px, -6px) scale(1.06);
        }
        55% {
          transform: rotate(-45deg) translate(0, 2px) scale(0.97);
        }
        100% {
          transform: rotate(-45deg) translate(0, 0) scale(1);
        }
      }
    `,
  ],
})
export class NativeGoogleMapComponent implements AfterViewInit, OnChanges, OnDestroy {
  private readonly zone = inject(NgZone);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly googleMaps = inject(GoogleMapsService);

  @ViewChild('mapEl', { static: true }) mapEl?: ElementRef<HTMLElement>;

  @Input() mode: NativeMapMode = 'display';
  @Input() center: NativeMapCoordinate = { lat: 26.8467, lng: 80.9462 };
  @Input() zoom = 15;
  @Input() markers: NativeMapMarkerInput[] = [];
  @Input() interactive = true;
  @Input() autoFit = false;
  @Input() mapType: 'roadmap' | 'satellite' = 'roadmap';
  /** When true (default in picker), apply soft delivery-app map styles. */
  @Input() styled = true;

  @Output() mapReady = new EventEmitter<void>();
  @Output() centerIdle = new EventEmitter<NativeMapCoordinate>();
  @Output() markerClick = new EventEmitter<string>();
  @Output() mapError = new EventEmitter<string>();

  pinMoving = false;
  pinSettling = false;

  private map?: google.maps.Map;
  private created = false;
  private destroying = false;
  private idleTimer: ReturnType<typeof setTimeout> | null = null;
  private settleTimer: ReturnType<typeof setTimeout> | null = null;
  private markerObjects: google.maps.Marker[] = [];
  private listeners: google.maps.MapsEventListener[] = [];
  private resizeObserver?: ResizeObserver;
  private userInteracting = false;

  async ngAfterViewInit() {
    await this.ensureMap();
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (!this.created || !this.map) {
      return;
    }

    if (changes['markers'] && this.mode === 'display') {
      this.syncMarkers();
      if (this.autoFit) {
        this.fitToMarkers();
      }
    }

    if (changes['interactive'] && !changes['interactive'].firstChange) {
      this.map.setOptions({
        gestureHandling: this.interactive ? 'greedy' : 'none',
        draggable: this.interactive,
        zoomControl: this.interactive,
        scrollwheel: this.interactive,
      });
    }

    if (changes['mapType'] && !changes['mapType'].firstChange) {
      this.map.setMapTypeId(this.mapType === 'satellite' ? 'satellite' : 'roadmap');
    }

    if ((changes['center'] || changes['zoom']) && !changes['center']?.firstChange && !this.userInteracting) {
      // Parent-driven recenter (e.g. current-location / initial GPS). Skip while user pans.
      if (this.mode === 'display' && !this.autoFit) {
        this.map.setCenter(this.center);
        this.map.setZoom(this.zoom);
      } else if (this.mode === 'picker' && changes['center']) {
        const next = changes['center'].currentValue as NativeMapCoordinate | undefined;
        if (next && Number.isFinite(next.lat) && Number.isFinite(next.lng)) {
          this.map.panTo(next);
          if (changes['zoom']) {
            this.map.setZoom(this.zoom);
          }
        }
      }
    }
  }

  ngOnDestroy() {
    this.destroyMap();
  }

  async animateTo(coordinate: NativeMapCoordinate, zoom = this.zoom): Promise<void> {
    this.center = coordinate;
    this.zoom = zoom;
    if (!this.map) {
      return;
    }
    this.map.panTo(coordinate);
    this.map.setZoom(zoom);
  }

  async getCenter(): Promise<NativeMapCoordinate | null> {
    if (!this.map) {
      return null;
    }
    const c = this.map.getCenter();
    if (!c) {
      return null;
    }
    return { lat: c.lat(), lng: c.lng() };
  }

  async fitToMarkers(): Promise<void> {
    if (!this.map || this.markers.length === 0) {
      return;
    }
    if (this.markers.length === 1) {
      await this.animateTo(this.markers[0].coordinate, 14);
      return;
    }
    const bounds = new google.maps.LatLngBounds();
    this.markers.forEach((m) => bounds.extend(m.coordinate));
    this.map.fitBounds(bounds, 48);
  }

  private async ensureMap() {
    if (!this.googleMaps.isConfigured()) {
      this.zone.run(() => this.mapError.emit('Google Maps API key is not configured.'));
      return;
    }

    const element = this.mapEl?.nativeElement;
    if (!element || this.created || this.destroying) {
      return;
    }

    await this.waitForSize(element);
    if (this.destroying) {
      return;
    }

    try {
      await this.googleMaps.load();
      if (this.destroying) {
        return;
      }

      const options: google.maps.MapOptions = this.googleMaps.baseMapOptions({
        center: this.center,
        zoom: this.zoom,
        mapTypeId: this.mapType === 'satellite' ? 'satellite' : 'roadmap',
        disableDefaultUI: true,
        zoomControl: this.interactive,
        gestureHandling: this.interactive ? 'greedy' : 'none',
        draggable: this.interactive,
        scrollwheel: this.interactive,
        clickableIcons: false,
        fullscreenControl: false,
        streetViewControl: false,
        mapTypeControl: false,
        keyboardShortcuts: false,
      });

      if (this.styled && this.mode === 'picker') {
        options.styles = PICKER_MAP_STYLES;
      }

      this.map = new google.maps.Map(element, options);

      this.created = true;

      if (this.mode === 'picker') {
        this.listeners.push(
          this.map.addListener('dragstart', () => {
            this.userInteracting = true;
            this.setPinMoving(true);
          }),
          this.map.addListener('dragend', () => {
            this.userInteracting = false;
          }),
          this.map.addListener('idle', () => {
            this.setPinMoving(false);
            void this.emitIdleCenter();
          }),
        );
      } else {
        this.syncMarkers();
        if (this.autoFit) {
          this.fitToMarkers();
        }
      }

      // Trigger a resize after layout settles (common Android WebView fix).
      setTimeout(() => {
        if (this.map) {
          google.maps.event.trigger(this.map, 'resize');
          this.map.setCenter(this.center);
        }
      }, 120);

      this.zone.run(() => this.mapReady.emit());
      if (this.mode === 'picker') {
        void this.emitIdleCenter();
      }
    } catch (error) {
      this.created = false;
      this.map = undefined;
      const message =
        error instanceof Error
          ? error.message
          : 'Unable to create map. Enable Maps JavaScript API for this key.';
      this.zone.run(() => this.mapError.emit(message));
    }
  }

  private async emitIdleCenter() {
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
    }
    this.idleTimer = setTimeout(() => {
      this.idleTimer = null;
      void this.readAndEmitCenter();
    }, 280);
  }

  private async readAndEmitCenter() {
    const center = await this.getCenter();
    if (!center) {
      return;
    }
    this.zone.run(() => this.centerIdle.emit(center));
  }

  private syncMarkers() {
    if (!this.map || this.mode !== 'display') {
      return;
    }

    this.markerObjects.forEach((marker) => marker.setMap(null));
    this.markerObjects = [];

    if (!this.markers.length) {
      return;
    }

    this.markers.forEach((source) => {
      const marker = new google.maps.Marker({
        map: this.map,
        position: source.coordinate,
        title: source.title,
      });
      marker.addListener('click', () => {
        this.zone.run(() => this.markerClick.emit(source.id));
      });
      this.markerObjects.push(marker);
    });
  }

  private setPinMoving(moving: boolean) {
    if (moving) {
      if (this.settleTimer) {
        clearTimeout(this.settleTimer);
        this.settleTimer = null;
      }
      this.zone.run(() => {
        this.pinMoving = true;
        this.pinSettling = false;
      });
      return;
    }

    if (!this.pinMoving) {
      return;
    }

    this.zone.run(() => {
      this.pinMoving = false;
      this.pinSettling = true;
    });
    if (this.settleTimer) {
      clearTimeout(this.settleTimer);
    }
    this.settleTimer = setTimeout(() => {
      this.zone.run(() => {
        this.pinSettling = false;
      });
      this.settleTimer = null;
    }, 340);
  }

  private waitForSize(element: HTMLElement): Promise<void> {
    return new Promise((resolve) => {
      const ready = () => element.clientWidth > 8 && element.clientHeight > 8;
      if (ready()) {
        resolve();
        return;
      }

      this.resizeObserver = new ResizeObserver(() => {
        if (ready()) {
          this.resizeObserver?.disconnect();
          this.resizeObserver = undefined;
          resolve();
        }
      });
      this.resizeObserver.observe(element);
      this.resizeObserver.observe(this.host.nativeElement);
      setTimeout(() => {
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        resolve();
      }, 2500);
    });
  }

  private destroyMap() {
    this.destroying = true;
    if (this.idleTimer) {
      clearTimeout(this.idleTimer);
      this.idleTimer = null;
    }
    if (this.settleTimer) {
      clearTimeout(this.settleTimer);
      this.settleTimer = null;
    }
    this.resizeObserver?.disconnect();
    this.listeners.forEach((listener) => listener.remove());
    this.listeners = [];
    this.markerObjects.forEach((marker) => marker.setMap(null));
    this.markerObjects = [];
    this.map = undefined;
    this.created = false;
  }
}
