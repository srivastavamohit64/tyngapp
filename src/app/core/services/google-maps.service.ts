import { Injectable } from '@angular/core';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';

const GEOCODE_CACHE_KEY = 'tyng_geocode_cache_v1';

@Injectable({ providedIn: 'root' })
export class GoogleMapsService {
  private loadPromise?: Promise<typeof google>;
  private optionsSet = false;
  private geocoder?: google.maps.Geocoder;
  private readonly memoryCache = new Map<string, google.maps.LatLngLiteral | null>();

  isConfigured(): boolean {
    return !!environment.googleMapsApiKey?.trim();
  }

  load(): Promise<typeof google> {
    if (!this.isConfigured()) {
      return Promise.reject(new Error('Google Maps API key is not configured. Add GOOGLE_MAPS_API_KEY to .env'));
    }

    if (!this.loadPromise) {
      if (!this.optionsSet) {
        setOptions({
          key: environment.googleMapsApiKey,
          v: 'weekly',
        });
        this.optionsSet = true;
      }

      this.loadPromise = Promise.all([
        importLibrary('maps'),
        importLibrary('places'),
      ]).then(() => google);
    }

    return this.loadPromise;
  }

  /**
   * Shared defaults for every Google Map in the app:
   * VECTOR rendering + clean roadmap basemap.
   */
  baseMapOptions(overrides: google.maps.MapOptions = {}): google.maps.MapOptions {
    return {
      renderingType: google.maps.RenderingType.VECTOR,
      mapTypeId: 'roadmap',
      ...overrides,
    };
  }

  async geocode(address: string, bias?: google.maps.LatLngLiteral): Promise<google.maps.LatLngLiteral | null> {
    const query = address.trim();
    if (!query) return null;

    const cacheKey = query.toLowerCase();
    if (this.memoryCache.has(cacheKey)) {
      return this.memoryCache.get(cacheKey) ?? null;
    }

    const stored = this.readStoredCache()[cacheKey];
    if (stored) {
      this.memoryCache.set(cacheKey, stored);
      return stored;
    }

    await this.load();
    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }

    const request: google.maps.GeocoderRequest = {
      address: query,
      componentRestrictions: { country: 'IN' },
      region: 'in',
    };

    if (bias) {
      request.bounds = new google.maps.LatLngBounds(
        { lat: bias.lat - 0.35, lng: bias.lng - 0.35 },
        { lat: bias.lat + 0.35, lng: bias.lng + 0.35 },
      );
    }

    const result = await new Promise<google.maps.LatLngLiteral | null>((resolve) => {
      this.geocoder!.geocode(request, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          resolve({ lat: loc.lat(), lng: loc.lng() });
          return;
        }
        resolve(null);
      });
    });

    this.memoryCache.set(cacheKey, result);
    if (result) {
      this.writeStoredCache(cacheKey, result);
    }
    return result;
  }

  private readStoredCache(): Record<string, google.maps.LatLngLiteral> {
    try {
      const raw = localStorage.getItem(GEOCODE_CACHE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }

  private writeStoredCache(key: string, value: google.maps.LatLngLiteral) {
    try {
      const cache = this.readStoredCache();
      cache[key] = value;
      const keys = Object.keys(cache);
      if (keys.length > 200) {
        keys.slice(0, keys.length - 200).forEach((oldKey) => delete cache[oldKey]);
      }
      localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache));
    } catch {
      // Ignore quota / private mode failures.
    }
  }
}
