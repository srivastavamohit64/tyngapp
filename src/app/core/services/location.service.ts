import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Geolocation, Position, PermissionStatus } from '@capacitor/geolocation';
import { GoogleMapsService } from './google-maps.service';

const LOCATION_STORAGE_KEY = 'tyng_user_location';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  postalArea?: string;
  pincode?: string;
  city?: string;
  shortLabel?: string;
  timestamp: number;
}

export interface ReverseGeocodeDetails {
  address: string;
  postalArea: string;
  pincode: string;
  city: string;
  shortLabel: string;
}

/**
 * Error types for location operations.
 */
export enum LocationErrorType {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PERMISSION_PERMANENTLY_DENIED = 'PERMISSION_PERMANENTLY_DENIED',
  GPS_DISABLED = 'GPS_DISABLED',
  POSITION_UNAVAILABLE = 'POSITION_UNAVAILABLE',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

export class LocationError extends Error {
  constructor(
    public type: LocationErrorType,
    message: string
  ) {
    super(message);
    this.name = 'LocationError';
  }
}

/**
 * Permission states for location operations.
 */
export interface LocationPermissionStatus {
  granted: boolean;
  permanentlyDenied: boolean;
  needsRationale: boolean;
}

type LocationPermissionValue = PermissionStatus['location'];

@Injectable({ providedIn: 'root' })
export class LocationService {
  private geocoder?: google.maps.Geocoder;
  private lastPermissionRequestTime = 0;
  private readonly PERMISSION_REQUEST_COOLDOWN = 5000; // 5 seconds

  constructor(private googleMapsService: GoogleMapsService) {}

  /**
   * Check location permission without prompting.
   * On web, browsers only prompt inside getCurrentPosition — do not treat
   * prompt/denied as "permanently denied" here.
   */
  async checkLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      const { location } = await Geolocation.checkPermissions();

      if (location === 'granted') {
        return { granted: true, permanentlyDenied: false, needsRationale: false };
      }

      if (location === 'prompt' || location === 'prompt-with-rationale') {
        return { granted: false, permanentlyDenied: false, needsRationale: location === 'prompt-with-rationale' };
      }

      // Native "denied" after Don't ask again. On web this means the site is blocked.
      return {
        granted: false,
        permanentlyDenied: Capacitor.getPlatform() !== 'web',
        needsRationale: false,
      };
    } catch {
      return { granted: false, permanentlyDenied: false, needsRationale: false };
    }
  }

  /**
   * Request location permission. On web this is a no-op — the browser prompt
   * appears when getCurrentPosition runs.
   */
  async requestLocationPermission(): Promise<boolean> {
    if (Capacitor.getPlatform() === 'web') {
      return true;
    }

    const now = Date.now();
    if (now - this.lastPermissionRequestTime < this.PERMISSION_REQUEST_COOLDOWN) {
      return false;
    }

    try {
      this.lastPermissionRequestTime = now;
      const { location } = await Geolocation.requestPermissions();
      return location === 'granted';
    } catch (error) {
      if (error instanceof LocationError) {
        throw error;
      }
      return false;
    }
  }

  /**
   * Check if Android location services (GPS) are enabled.
   * Returns true if location services are available.
   */
  async areLocationServicesEnabled(): Promise<boolean> {
    try {
      if (Capacitor.getPlatform() !== 'android') {
        return true;
      }

      // Try to get current position with zero timeout to check if GPS is available
      // This is the only reliable way to detect if location services are disabled
      await Geolocation.getCurrentPosition({
        timeout: 1000,
        maximumAge: 0,
        enableHighAccuracy: false,
      });

      return true;
    } catch (error) {
      const err = error as { message?: string; code?: number };
      
      // Check for GPS disabled error codes
      // Error code 2 from Geolocation plugin = POSITION_UNAVAILABLE
      if (err.code === 2 || /location.*service.*disabled|gps.*disabled/i.test(err.message || '')) {
        return false;
      }

      // Other errors (timeout, unknown) might still have GPS enabled
      return true;
    }
  }

  /**
   * Get current GPS location. On web, getCurrentPosition itself shows the
   * browser permission prompt — do not pre-fail as permanently denied.
   */
  async getCurrentPosition(): Promise<Position> {
    const servicesEnabled = await this.areLocationServicesEnabled();
    if (!servicesEnabled) {
      throw new LocationError(
        LocationErrorType.GPS_DISABLED,
        'Location services are disabled. Please enable GPS to continue.'
      );
    }

    const isWeb = Capacitor.getPlatform() === 'web';
    if (!isWeb) {
      const permissionStatus = await this.checkLocationPermission();
      if (permissionStatus.permanentlyDenied) {
        throw new LocationError(
          LocationErrorType.PERMISSION_PERMANENTLY_DENIED,
          'Location permission permanently denied. Please enable location in app settings.'
        );
      }
      if (!permissionStatus.granted) {
        const permissionGranted = await this.requestLocationPermission();
        if (!permissionGranted) {
          throw new LocationError(
            LocationErrorType.PERMISSION_DENIED,
            'Location permission denied. Please enable location access to continue.'
          );
        }
      }
    }

    try {
      return await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });
    } catch (error) {
      const err = error as { message?: string; code?: number };
      const message = err.message || '';

      if (err.code === 1 || /denied/i.test(message)) {
        throw new LocationError(
          LocationErrorType.PERMISSION_DENIED,
          'Location permission denied. Please allow location access and try again.'
        );
      }
      if (err.code === 3 || /timeout/i.test(message)) {
        throw new LocationError(
          LocationErrorType.TIMEOUT,
          'Location request timed out. Please try again.'
        );
      }
      if (err.code === 2) {
        throw new LocationError(
          LocationErrorType.POSITION_UNAVAILABLE,
          'Unable to determine location. Please check your device settings.'
        );
      }
      throw new LocationError(
        LocationErrorType.UNKNOWN,
        message || 'Failed to get location'
      );
    }
  }

  /**
   * Reverse geocode coordinates to get address
   */
  async reverseGeocode(lat: number, lng: number): Promise<string> {
    const details = await this.reverseGeocodeDetails(lat, lng);
    return details.address;
  }

  /**
   * Reverse geocode to postal area + PIN for profile/home display.
   */
  async reverseGeocodeDetails(lat: number, lng: number): Promise<ReverseGeocodeDetails> {
    await this.googleMapsService.load();

    if (!this.geocoder) {
      this.geocoder = new google.maps.Geocoder();
    }

    const results = await new Promise<google.maps.GeocoderResult[]>((resolve, reject) => {
      this.geocoder!.geocode(
        { location: { lat, lng } },
        (geocodeResults, status) => {
          if (status === 'OK' && geocodeResults?.length) {
            resolve(geocodeResults);
            return;
          }
          reject(new Error(`Geocoding failed: ${status}`));
        }
      );
    });

    return this.parseGeocodeResults(results);
  }

  private parseGeocodeResults(results: google.maps.GeocoderResult[]): ReverseGeocodeDetails {
    const withPin =
      results.find((result) => this.component(result, 'postal_code')) || results[0];
    const address = withPin.formatted_address || results[0]?.formatted_address || '';
    const pincode = this.component(withPin, 'postal_code');
    const postalArea =
      this.component(withPin, 'sublocality_level_1') ||
      this.component(withPin, 'sublocality_level_2') ||
      this.component(withPin, 'sublocality') ||
      this.component(withPin, 'neighborhood') ||
      this.component(withPin, 'administrative_area_level_3') ||
      this.component(withPin, 'locality');
    const city =
      this.component(withPin, 'locality') ||
      this.component(withPin, 'administrative_area_level_2');

    const shortLabel = [postalArea, pincode].filter(Boolean).join(' > ')
      || [postalArea, city].filter(Boolean).join(' > ')
      || [city, pincode].filter(Boolean).join(' > ')
      || address;

    return { address, postalArea, pincode, city, shortLabel };
  }

  private component(result: google.maps.GeocoderResult, type: string): string {
    return result.address_components?.find((part) => part.types.includes(type))?.long_name?.trim() || '';
  }

  /**
   * Get current location with address
   * Throws LocationError on permission/service issues
   */
  async getCurrentLocationWithAddress(): Promise<UserLocation> {
    try {
      const position = await this.getCurrentPosition();
      const { latitude, longitude } = position.coords;

      let details: ReverseGeocodeDetails | undefined;
      try {
        details = await this.reverseGeocodeDetails(latitude, longitude);
      } catch (error) {
        console.warn('Could not get address, but location retrieved:', error);
      }

      return {
        latitude,
        longitude,
        address: details?.address,
        postalArea: details?.postalArea,
        pincode: details?.pincode,
        city: details?.city,
        shortLabel: details?.shortLabel,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save location to storage
   */
  saveLocation(location: UserLocation): void {
    try {
      localStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('Error saving location to storage:', error);
    }
  }

  /**
   * Get saved location from storage
   */
  getSavedLocation(): UserLocation | null {
    try {
      const stored = localStorage.getItem(LOCATION_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return null;
    } catch (error) {
      console.error('Error reading location from storage:', error);
      return null;
    }
  }

  /**
   * Clear saved location
   */
  clearSavedLocation(): void {
    try {
      localStorage.removeItem(LOCATION_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing location from storage:', error);
    }
  }

  /**
   * Get location and save it
   * Throws LocationError on permission/service issues
   */
  async getAndSaveLocation(): Promise<UserLocation> {
    const location = await this.getCurrentLocationWithAddress();
    this.saveLocation(location);
    return location;
  }

  /**
   * Get location, handling permission errors gracefully.
   * Returns the location if successful, or the saved location if permission was denied.
   */
  async getLocationWithFallback(): Promise<UserLocation | null> {
    try {
      return await this.getAndSaveLocation();
    } catch (error) {
      if (error instanceof LocationError) {
        // If permission was denied or GPS disabled, return saved location as fallback
        if (
          error.type === LocationErrorType.PERMISSION_DENIED ||
          error.type === LocationErrorType.PERMISSION_PERMANENTLY_DENIED ||
          error.type === LocationErrorType.GPS_DISABLED
        ) {
          const saved = this.getSavedLocation();
          if (saved) {
            return saved;
          }
        }
      }
      return null;
    }
  }
}
