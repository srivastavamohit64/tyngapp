import { Injectable } from '@angular/core';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class GoogleMapsService {
  private loadPromise?: Promise<typeof google>;
  private optionsSet = false;

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
}
