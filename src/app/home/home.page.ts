import { Component, OnInit } from '@angular/core';
import { LocationService, UserLocation, LocationError, LocationErrorType } from '../core/services/location.service';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit {
  currentLocation?: UserLocation;
  isLoadingLocation = false;
  locationError?: string;
  showErrorAction = false;
  errorActionLabel = '';
  errorActionHandler?: () => void;

  constructor(private locationService: LocationService) {}

  ngOnInit() {
    // Load location when page initializes
    this.loadLocation();
  }

  async loadLocation() {
    this.isLoadingLocation = true;
    this.locationError = undefined;
    this.showErrorAction = false;
    this.errorActionLabel = '';

    try {
      console.log('location data'); 
      // Get current location with address and save it
      this.currentLocation = await this.locationService.getAndSaveLocation();
      console.log('Location retrieved and saved:', this.currentLocation);
    } catch (error: any) {
      console.error('Failed to get location:', error);

      // Handle specific error types
      if (error instanceof LocationError) {
        switch (error.type) {
          case LocationErrorType.PERMISSION_DENIED:
            this.locationError = 'Location permission denied. Please enable location access.';
            this.showErrorAction = true;
            this.errorActionLabel = 'Open Settings';
            this.errorActionHandler = () => this.openAppSettings();
            break;

          case LocationErrorType.PERMISSION_PERMANENTLY_DENIED:
            this.locationError = 'Location permission permanently denied. Please enable location in app settings.';
            this.showErrorAction = true;
            this.errorActionLabel = 'Open Settings';
            this.errorActionHandler = () => this.openAppSettings();
            break;

          case LocationErrorType.GPS_DISABLED:
            this.locationError = 'Location services are turned off. Please enable Location/GPS to continue.';
            this.showErrorAction = true;
            this.errorActionLabel = 'Open Location Settings';
            this.errorActionHandler = () => this.openLocationSettings();
            break;

          case LocationErrorType.TIMEOUT:
            this.locationError = 'Location request timed out. Please try again.';
            break;

          case LocationErrorType.POSITION_UNAVAILABLE:
            this.locationError = 'Unable to determine location. Please check your device settings.';
            break;

          default:
            this.locationError = error.message || 'Failed to get location';
            break;
        }
      } else {
        this.locationError = error instanceof Error ? error.message : 'Failed to get location';
      }

      // Try to load saved location as fallback (unless GPS disabled or permission denied)
      if (
        !this.showErrorAction ||
        (error instanceof LocationError && 
          error.type !== LocationErrorType.PERMISSION_DENIED &&
          error.type !== LocationErrorType.PERMISSION_PERMANENTLY_DENIED &&
          error.type !== LocationErrorType.GPS_DISABLED)
      ) {
        const savedLocation = this.locationService.getSavedLocation();
        if (savedLocation) {
          this.currentLocation = savedLocation;
          this.locationError = this.locationError ? `${this.locationError} Using last known location.` : 'Using last known location';
        }
      }
    } finally {
      this.isLoadingLocation = false;
    }
  }

  async refreshLocation() {
    await this.loadLocation();
  }

  async openAppSettings() {
    try {
      const { App } = await import('@capacitor/app');
      await App.openUrl('android.settings.APPLICATION_SETTINGS');
    } catch (error) {
      console.error('Failed to open app settings:', error);
    }
  }

  async openLocationSettings() {
    try {
      const { App } = await import('@capacitor/app');
      await App.openUrl('android.settings.LOCATION_SOURCE_SETTINGS');
    } catch (error) {
      console.error('Failed to open location settings:', error);
    }
  }
}
