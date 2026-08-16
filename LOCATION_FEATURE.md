# GPS Location Feature Documentation

## Overview
This feature implements GPS location tracking with reverse geocoding using Google Maps API. The location is automatically retrieved when the home page loads, displayed to the user, and saved to local storage.

## Features Implemented

### 1. Location Service (`location.service.ts`)
Located at: `src/app/core/services/location.service.ts`

**Key Methods:**
- `getCurrentPosition()` - Gets GPS coordinates using Capacitor Geolocation
- `reverseGeocode(lat, lng)` - Converts coordinates to a human-readable address
- `getCurrentLocationWithAddress()` - Gets GPS location and address in one call
- `saveLocation(location)` - Saves location to localStorage
- `getSavedLocation()` - Retrieves saved location from localStorage
- `getAndSaveLocation()` - Gets location and automatically saves it

**Storage Key:** `tyng_user_location`

### 2. Home Page Integration
The home page (`src/app/home/`) has been updated to:
- Automatically request location on page load
- Display current address
- Show latitude, longitude, and timestamp
- Provide a refresh button to update location
- Handle loading and error states
- Link to Google Maps for viewing the location

### 3. Permissions
The app handles location permissions automatically:
- Checks if permission is granted
- Requests permission if needed
- Handles permission denial gracefully

**Android Permissions** (already configured in `AndroidManifest.xml`):
```xml
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## Configuration Requirements

### 1. Google Maps API Key
Ensure you have a Google Maps API Key configured in your `.env` file:

```bash
GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

The API key needs these Google Cloud APIs enabled:
- **Geocoding API** (for reverse geocoding)
- **Maps JavaScript API** (for the maps service)

### 2. Environment Setup
The Google Maps API key is loaded from environment variables through:
- `.env` file → `environment.generated.ts` → `environment.ts`

## How It Works

### Flow Diagram
```
1. User opens home page (http://localhost:8100/app/home)
   ↓
2. ngOnInit() triggers loadLocation()
   ↓
3. LocationService.getAndSaveLocation()
   ↓
4. Request location permissions (if needed)
   ↓
5. Get GPS coordinates via Capacitor Geolocation
   ↓
6. Reverse geocode coordinates via Google Maps API
   ↓
7. Save to localStorage (lat, lng, address, timestamp)
   ↓
8. Display on UI
```

### Data Structure
```typescript
interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  timestamp: number;
}
```

Example stored data:
```json
{
  "latitude": 12.9716,
  "longitude": 77.5946,
  "address": "Bengaluru, Karnataka, India",
  "timestamp": 1734567890123
}
```

## Usage Examples

### In a Component
```typescript
import { LocationService, UserLocation } from '../core/services/location.service';

export class MyComponent {
  constructor(private locationService: LocationService) {}

  async getLocation() {
    try {
      // Get and save location
      const location = await this.locationService.getAndSaveLocation();
      console.log('Current location:', location);
      
      // Or just get coordinates
      const position = await this.locationService.getCurrentPosition();
      console.log('Lat:', position.coords.latitude);
      console.log('Lng:', position.coords.longitude);
      
      // Get saved location
      const saved = this.locationService.getSavedLocation();
      console.log('Previously saved:', saved);
    } catch (error) {
      console.error('Location error:', error);
    }
  }
}
```

### Just Reverse Geocoding
```typescript
async getAddressFromCoords() {
  const address = await this.locationService.reverseGeocode(12.9716, 77.5946);
  console.log(address); // "Bengaluru, Karnataka, India"
}
```

## Testing

### Testing on Web (Browser)
1. Start the dev server: `npm start`
2. Navigate to `http://localhost:8100/app/home`
3. Allow location permissions when prompted
4. The browser will use your actual location

**Note:** The browser's geolocation is less accurate than native GPS.

### Testing on Android Device
1. Build the app: `npm run build`
2. Sync with Android: `npx cap sync android`
3. Open in Android Studio: `npx cap open android`
4. Run on a physical device (GPS doesn't work well on emulators)
5. Grant location permissions when prompted

### Testing on Android Emulator
1. Open the emulator's extended controls (three dots)
2. Go to Location
3. Set a custom location (e.g., Bengaluru: 12.9716, 77.5946)
4. The app will use this simulated location

## Error Handling

The service handles various error scenarios:

1. **Permission Denied**: Shows error message, tries to load last saved location
2. **GPS Unavailable**: Falls back to cached location if available
3. **Geocoding Failed**: Still saves and displays coordinates, address shows as "Address not available"
4. **Network Offline**: Coordinates work, but geocoding requires internet

## Local Storage

**Key:** `tyng_user_location`

**Data Persistence:**
- Survives app restarts
- Survives browser refresh
- Cleared only when user clears app data or explicitly deleted

**Access:**
```typescript
// Read
const location = this.locationService.getSavedLocation();

// Clear
this.locationService.clearSavedLocation();
```

## UI Components

The home page displays:
- Loading spinner while fetching location
- Error/warning messages if location fails
- Address card with formatted address
- Coordinates card with lat/lng and timestamp
- Refresh button in the header
- "View on Google Maps" button linking to Google Maps

## Performance Considerations

1. **High Accuracy GPS**: Configured with `enableHighAccuracy: true` for best results
2. **Timeout**: 15 second timeout prevents indefinite waiting
3. **Caching**: Google Maps geocoding results are cached to reduce API calls
4. **Lazy Loading**: Location only loads when home page is visited

## Security & Privacy

- Location data is stored locally only (not sent to external servers)
- User must explicitly grant permission
- Permission request explains why location is needed
- Users can view exactly what location data is stored

## Troubleshooting

### "Location permission denied"
- User declined permission
- Go to app settings and manually enable location permission

### "Geocoding failed"
- Check if Google Maps API key is valid
- Ensure Geocoding API is enabled in Google Cloud Console
- Check internet connection

### Location not updating
- Click the refresh button in the header
- Check if GPS is enabled on device
- Try moving to a location with better GPS signal

### "Google Maps API key is not configured"
- Ensure `.env` file exists with `GOOGLE_MAPS_API_KEY`
- Run `npm start` to regenerate environment.generated.ts
- Restart dev server

## Future Enhancements

Potential improvements:
- Watch position for continuous tracking
- Distance calculation between locations
- Location history/timeline
- Geofencing capabilities
- Custom map view with marker
- Background location tracking
- Share location functionality

## Dependencies

```json
{
  "@capacitor/geolocation": "^8.2.2",
  "@googlemaps/js-api-loader": "^2.1.1",
  "@types/google.maps": "^3.65.2"
}
```

All dependencies are already installed in the project.

## Files Modified/Created

**Created:**
- `src/app/core/services/location.service.ts`
- `LOCATION_FEATURE.md` (this file)

**Modified:**
- `src/app/home/home.page.ts`
- `src/app/home/home.page.html`
- `src/app/home/home.page.scss`

## Support

For issues or questions:
1. Check browser/device console for error messages
2. Verify Google Maps API configuration
3. Check location permissions in device settings
4. Review this documentation

---

**Last Updated:** August 15, 2026
**Version:** 1.0
