import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import {
  ApiResponse,
  BookingCalendarEvent,
  BookingParticipant,
  BookingRecord,
  BookingSlot,
  DiscoverPlayer,
  MyBookingsResponse,
} from '../models/api.model';
import { ApiService } from './api.service';

@Injectable({ providedIn: 'root' })
export class BookingService {
  private readonly api = inject(ApiService);

  getMyBookings(): Observable<ApiResponse<MyBookingsResponse>> {
    return this.api.get<MyBookingsResponse>('/my-bookings');
  }

  getNearbyGames(limit = 20, options?: { matchLocation?: boolean; location?: string; q?: string }): Observable<ApiResponse<BookingRecord[]>> {
    const params = new URLSearchParams({ limit: String(limit) });
    if (options?.matchLocation) params.set('match_location', '1');
    if (options?.location) params.set('location', options.location);
    if (options?.q) params.set('q', options.q);
    return this.api.get<BookingRecord[]>(`/nearby-games?${params.toString()}`);
  }

  search(query: string, limit = 8): Observable<ApiResponse<{ games: BookingRecord[]; players: DiscoverPlayer[] }>> {
    const params = new URLSearchParams({
      q: query,
      limit: String(limit),
    });
    return this.api.get<{ games: BookingRecord[]; players: DiscoverPlayer[] }>(`/search?${params.toString()}`);
  }

  getBooking(id: string): Observable<ApiResponse<BookingRecord>> {
    return this.api.get<BookingRecord>(`/booking/${id}`);
  }

  bookGame(payload: {
    sport: string;
    venue_id: number | string;
    date: string;
    time: string;
    team_size: string;
    duration_hours?: number;
    price?: number;
    payment_method?: 'online' | 'at_venue';
    coupon_code?: string | null;
    coupon_discount?: number;
    rental_details?: unknown;
    court_name?: string | null;
  }): Observable<ApiResponse<BookingRecord>> {
    return this.api.post<BookingRecord>('/book-game', payload);
  }

  validateCoupon(code: string, amount: number): Observable<ApiResponse<{
    code: string;
    title?: string;
    description?: string;
    type: 'percent' | 'flat';
    value: number;
    discount: number;
  }>> {
    return this.api.post('/coupons/validate', { code, amount });
  }

  joinBooking(bookingId: string): Observable<ApiResponse<BookingRecord>> {
    return this.api.post<BookingRecord>('/join-booking', { booking_id: bookingId });
  }

  leaveBooking(bookingId: string): Observable<ApiResponse<BookingRecord>> {
    return this.api.post<BookingRecord>('/leave-booking', { booking_id: bookingId });
  }

  cancelBooking(bookingId: string): Observable<ApiResponse<BookingRecord>> {
    return this.api.delete<BookingRecord>('/cancel-booking', { booking_id: bookingId });
  }

  updateBooking(payload: Record<string, unknown>): Observable<ApiResponse<BookingRecord>> {
    return this.api.put<BookingRecord>('/update-booking', payload);
  }

  getVenueSlots(query = ''): Observable<ApiResponse<BookingSlot[]>> {
    const suffix = query ? `?${query}` : '';
    return this.api.get<BookingSlot[]>(`/venue-slots${suffix}`);
  }

  getCalendar(query = ''): Observable<ApiResponse<BookingCalendarEvent[]>> {
    const suffix = query ? `?${query}` : '';
    return this.api.get<BookingCalendarEvent[]>(`/calendar${suffix}`);
  }

  getUpcomingBookings(): Observable<ApiResponse<BookingRecord[]>> {
    return this.api.get<BookingRecord[]>('/upcoming-bookings');
  }

  getPastBookings(): Observable<ApiResponse<BookingRecord[]>> {
    return this.api.get<BookingRecord[]>('/past-bookings');
  }

  getBookingPlayers(bookingId: string): Observable<ApiResponse<{
    players: BookingParticipant[];
    invitedPlayers: BookingParticipant[];
    acceptedPlayers: BookingParticipant[];
    pendingInvitations: number;
    availableSlots: number;
    currentPlayers: number;
    maximumPlayers: number;
  }>> {
    return this.api.get(`/booking/${bookingId}/players`);
  }

  invitePlayers(bookingId: string, playerIds: string[]): Observable<ApiResponse<BookingRecord>> {
    return this.api.post<BookingRecord>(`/booking/${bookingId}/invite`, {
      player_ids: playerIds,
    });
  }

  updateBookingPlayer(bookingId: string, playerId: string, payload: { status?: 'invited' | 'joined' | 'declined'; replacement_player_id?: string; }): Observable<ApiResponse<BookingRecord>> {
    return this.api.put<BookingRecord>(`/booking/${bookingId}/player/${playerId}`, payload);
  }

  removeBookingPlayer(bookingId: string, playerId: string): Observable<ApiResponse<BookingRecord>> {
    return this.api.delete<BookingRecord>(`/booking/${bookingId}/player/${playerId}`);
  }

  getMyInvitedBookings(): Observable<ApiResponse<BookingRecord[]>> {
    return this.api.get<BookingRecord[]>('/my-invited-bookings');
  }

  acceptInvite(bookingId: string): Observable<ApiResponse<BookingRecord>> {
    return this.api.post<BookingRecord>('/booking/invite/accept', { booking_id: bookingId });
  }

  rejectInvite(bookingId: string): Observable<ApiResponse<BookingRecord>> {
    return this.api.post<BookingRecord>('/booking/invite/reject', { booking_id: bookingId });
  }
}
