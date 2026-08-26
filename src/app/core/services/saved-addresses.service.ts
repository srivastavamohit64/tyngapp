import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import type { UserLocation } from './location.service';

const SAVED_KEY = 'tyng_saved_addresses_v1';
const SELECTED_KEY = 'tyng_selected_address_id';

export const CURRENT_LOCATION_ID = 'current';

export interface SavedAddress {
  id: string;
  label: string;
  address: string;
  city?: string;
  postalArea?: string;
  pincode?: string;
  latitude?: number | null;
  longitude?: number | null;
  timestamp: number;
}

export interface ActiveLocationSelection {
  id: string;
  label: string;
  query: string;
  city: string;
  postalArea: string;
  latitude: number | null;
  longitude: number | null;
  isCurrent: boolean;
}

@Injectable({ providedIn: 'root' })
export class SavedAddressesService {
  private readonly addressesSubject = new BehaviorSubject<SavedAddress[]>(this.readAll());
  private readonly selectedIdSubject = new BehaviorSubject<string>(this.readSelectedId());

  readonly addresses$ = this.addressesSubject.asObservable();
  readonly selectedId$ = this.selectedIdSubject.asObservable();

  list(): SavedAddress[] {
    return this.addressesSubject.value;
  }

  selectedId(): string {
    return this.selectedIdSubject.value || CURRENT_LOCATION_ID;
  }

  select(id: string): void {
    const next = id === CURRENT_LOCATION_ID || this.list().some((a) => a.id === id)
      ? id
      : CURRENT_LOCATION_ID;
    localStorage.setItem(SELECTED_KEY, next);
    this.selectedIdSubject.next(next);
  }

  add(input: Omit<SavedAddress, 'id' | 'timestamp'> & { id?: string }): SavedAddress {
    const address: SavedAddress = {
      id: input.id || `addr_${Date.now()}`,
      label: (input.label || input.postalArea || input.city || input.address).trim(),
      address: input.address.trim(),
      city: input.city?.trim() || '',
      postalArea: input.postalArea?.trim() || '',
      pincode: input.pincode?.trim() || '',
      latitude: input.latitude ?? null,
      longitude: input.longitude ?? null,
      timestamp: Date.now(),
    };

    const withoutDup = this.list().filter(
      (item) => item.address.toLowerCase() !== address.address.toLowerCase(),
    );
    const next = [address, ...withoutDup].slice(0, 12);
    this.writeAll(next);
    this.select(address.id);
    return address;
  }

  remove(id: string): void {
    const next = this.list().filter((item) => item.id !== id);
    this.writeAll(next);
    if (this.selectedId() === id) {
      this.select(CURRENT_LOCATION_ID);
    }
  }

  addFromUserLocation(location: UserLocation, labelOverride?: string): SavedAddress | null {
    const address = (location.address || location.shortLabel || '').trim();
    if (!address) return null;
    return this.add({
      label: (labelOverride || location.postalArea || location.shortLabel || location.city || address).trim(),
      address,
      city: location.city,
      postalArea: location.postalArea,
      pincode: location.pincode,
      latitude: location.latitude,
      longitude: location.longitude,
    });
  }

  /**
   * Resolve what nearby games / bookings should use.
   * Default is current GPS snapshot; otherwise the selected saved address.
   */
  resolveActive(current?: UserLocation | null, profileLocation?: string | null): ActiveLocationSelection {
    const selected = this.selectedId();
    if (selected !== CURRENT_LOCATION_ID) {
      const saved = this.list().find((item) => item.id === selected);
      if (saved) {
        const query = [saved.postalArea, saved.city].filter(Boolean).join(', ')
          || saved.label
          || saved.address;
        return {
          id: saved.id,
          label: saved.label || saved.address,
          query,
          city: saved.city || '',
          postalArea: saved.postalArea || '',
          latitude: typeof saved.latitude === 'number' && saved.latitude !== 0 ? saved.latitude : null,
          longitude: typeof saved.longitude === 'number' && saved.longitude !== 0 ? saved.longitude : null,
          isCurrent: false,
        };
      }
    }

    const postalArea = (current?.postalArea || '').trim();
    const city = (current?.city || '').trim();
    const shortLabel = (current?.shortLabel || current?.address || '').trim();
    const profile = (profileLocation || '').trim();
    const query = [postalArea, city].filter(Boolean).join(', ') || shortLabel || profile;
    const label = postalArea || city || shortLabel || profile || 'Current location';

    return {
      id: CURRENT_LOCATION_ID,
      label,
      query,
      city,
      postalArea,
      latitude: typeof current?.latitude === 'number' && current.latitude !== 0 ? current.latitude : null,
      longitude: typeof current?.longitude === 'number' && current.longitude !== 0 ? current.longitude : null,
      isCurrent: true,
    };
  }

  private readAll(): SavedAddress[] {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll(list: SavedAddress[]): void {
    localStorage.setItem(SAVED_KEY, JSON.stringify(list));
    this.addressesSubject.next(list);
  }

  private readSelectedId(): string {
    try {
      return localStorage.getItem(SELECTED_KEY) || CURRENT_LOCATION_ID;
    } catch {
      return CURRENT_LOCATION_ID;
    }
  }
}
