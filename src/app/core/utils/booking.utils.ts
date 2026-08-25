import { BookingStatus } from '../models/api.model';

const SPORT_EMOJIS: Record<string, string> = {
  cricket: '🏏',
  football: '⚽',
  basketball: '🏀',
  tennis: '🎾',
  badminton: '🏸',
  volleyball: '🏐',
};

export function sportEmoji(sport?: string | null): string {
  if (!sport) return '🎮';
  return SPORT_EMOJIS[sport.toLowerCase()] ?? '🏟️';
}

export function formatBookingDate(date?: string | null): string {
  if (!date) return '—';
  const bookingDate = new Date(`${date}T00:00:00`);
  const today = startOfDay(new Date());
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const prefix = isSameDate(bookingDate, today)
    ? 'Today'
    : isSameDate(bookingDate, tomorrow)
      ? 'Tomorrow'
      : new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(bookingDate);

  const sub = new Intl.DateTimeFormat('en-US', { day: '2-digit', month: 'short' }).format(bookingDate);
  return `${prefix}, ${sub}`;
}

export function formatBookingTime(time?: string | null): string {
  if (!time) return '—';
  const [hours = '0', minutes = '0'] = time.split(':');
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function formatBookingTimeRange(startTime?: string | null, endTime?: string | null): string {
  return `${formatBookingTime(startTime)} · ${formatBookingTime(endTime)}`;
}

export function formatDurationLabel(durationMinutes?: number | null): string {
  if (!durationMinutes) return '—';
  if (durationMinutes % 60 === 0) {
    const hours = durationMinutes / 60;
    return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
  }
  if (durationMinutes > 60) {
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    return `${hours}h ${minutes}m`;
  }
  return `${durationMinutes} min`;
}

export type SlotIntervalMinutes = 15 | 30;

export function normalizeSlotInterval(value?: number | string | null): SlotIntervalMinutes {
  return Number(value) === 30 ? 30 : 15;
}

export function parseClockToMinutes(time: string): number | null {
  const normalized = String(time || '').trim();
  if (!normalized) return null;

  const ampmMatch = normalized.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (ampmMatch) {
    let hours = Number(ampmMatch[1]);
    const minutes = Number(ampmMatch[2]);
    const period = ampmMatch[3].toUpperCase();
    if (period === 'PM' && hours !== 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const twentyFour = normalized.match(/^(\d{1,2}):(\d{2})$/);
  if (twentyFour) {
    return Number(twentyFour[1]) * 60 + Number(twentyFour[2]);
  }

  return null;
}

export function formatMinutesToClock(totalMinutes: number): string {
  const wrapped = ((totalMinutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours24 = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  const period = hours24 >= 12 ? 'PM' : 'AM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/** Each bookable slot is 1 hour. `slotIntervalMinutes` is the gap after it (15 or 30). */
export const BOOKING_SLOT_MINUTES = 60;

export function slotStepMinutes(gapMinutes?: number | string | null): number {
  return BOOKING_SLOT_MINUTES + normalizeSlotInterval(gapMinutes);
}

export function buildBookingSlots(openTime: string, closeTime: string, gapMinutes?: number | string | null): string[] {
  const step = slotStepMinutes(gapMinutes);
  const opening = parseClockToMinutes(openTime) ?? 6 * 60;
  const closing = parseClockToMinutes(closeTime) ?? 22 * 60;
  if (closing <= opening) return [];

  const slots: string[] = [];
  for (let start = opening; start + BOOKING_SLOT_MINUTES <= closing; start += step) {
    slots.push(formatMinutesToClock(start));
  }
  return slots;
}

export function formatSlotRange(startClock: string, durationMinutes = BOOKING_SLOT_MINUTES): string {
  const start = parseClockToMinutes(startClock);
  if (start == null) return startClock;
  return `${formatMinutesToClock(start)} – ${formatMinutesToClock(start + durationMinutes)}`;
}

export function slotEndClock(startClock: string, durationMinutes = BOOKING_SLOT_MINUTES): string {
  const start = parseClockToMinutes(startClock);
  if (start == null) return '';
  return formatMinutesToClock(start + durationMinutes);
}

export function playMinutesForSlots(slotCount: number): number {
  return Math.max(0, slotCount) * BOOKING_SLOT_MINUTES;
}

export function blockedMinutesForSlots(slotCount: number, gapMinutes?: number | string | null): number {
  if (slotCount <= 0) return 0;
  return playMinutesForSlots(slotCount) + (slotCount - 1) * normalizeSlotInterval(gapMinutes);
}

export function courtCostFromMinutes(pricePerHour: number, durationMinutes: number): number {
  return Math.round(Number(pricePerHour || 0) * (Math.max(0, durationMinutes) / 60));
}

export function formatStartsIn(date?: string | null, startTime?: string | null, now = Date.now()): string | null {
  if (!date || !startTime) return null;
  const start = toDateTime(date, startTime);
  if (!start) return null;

  const diff = start.getTime() - now;
  if (diff <= 0) return null;

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `Starts in ${minutes}m`;
  return `Starts in ${hours}h ${String(minutes).padStart(2, '0')}m`;
}

export function bookingTitle(booking: { title?: string | null; sport?: string | null; bookingDate?: string | null }): string {
  if (booking.title) return booking.title;
  const sport = booking.sport
    ? booking.sport.charAt(0).toUpperCase() + booking.sport.slice(1)
    : 'Game';
  if (!booking.bookingDate) return `${sport} Match`;
  const date = new Date(`${booking.bookingDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) return `${sport} Match`;
  const day = date.getDay();
  if (day === 0 || day === 6) return `Weekend ${sport} Match`;
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
  return `${weekday} ${sport} Game`;
}

export function bookingReference(booking: { reference?: string | null; id?: string | number; sport?: string | null; bookingDate?: string | null }): string {
  if (booking.reference) return booking.reference;
  const sport = String(booking.sport || 'GM').replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2) || 'GM';
  const stamp = (booking.bookingDate || '').replace(/-/g, '').slice(2) || '000000';
  const id = String(booking.id || '0').padStart(3, '0');
  return `TY-${sport}-${stamp}-${id}`;
}

export function bookingPaymentLabel(booking: {
  isHost?: boolean;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
  playerShareAmount?: number;
}): string {
  const paid = String(booking.paymentStatus || '').toLowerCase();
  if (!booking.isHost && (paid === 'paid' || paid === 'completed')) return 'Paid ✓';
  if (Number(booking.playerShareAmount || 0) > 0) return 'Split Equally';
  const method = String(booking.paymentMethod || '').toLowerCase();
  if (method === 'online') return 'Online';
  if (method === 'wallet') return 'Wallet';
  if (method === 'at_venue') return 'At venue';
  if (paid === 'paid' || paid === 'completed') return 'Paid ✓';
  return paid ? paid.charAt(0).toUpperCase() + paid.slice(1) : 'Pending';
}

export function isUpcomingStatus(status?: string | null): boolean {
  const value = String(status || '').toLowerCase();
  return value === 'pending' || value === 'confirmed' || value === 'full';
}

export function isBookingGameDay(date?: string | null, now = Date.now()): boolean {
  if (!date) return false;
  const bookingDate = new Date(`${date}T00:00:00`);
  if (Number.isNaN(bookingDate.getTime())) return false;
  return isSameDate(bookingDate, new Date(now));
}

/** HTTPS origin used in venue attendance QR so native apps don't encode capacitor://localhost. */
export function checkInAppOrigin(apiUrl?: string): string {
  const candidates = [apiUrl, typeof window !== 'undefined' ? window.location.origin : ''];
  for (const raw of candidates) {
    try {
      const url = new URL(String(raw || ''));
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
          continue;
        }
        return url.origin;
      }
    } catch {
      // try next
    }
  }
  if (typeof window !== 'undefined' && /^https?:$/.test(window.location.protocol)) {
    return window.location.origin;
  }
  return 'https://tyngpeople.com';
}

export function gameChatMemberIds(booking: {
  hostUserId?: string | number | null;
  venueId?: string | number | null;
  host?: { id?: string | number | null } | null;
  acceptedPlayers?: Array<{ status?: string | null; user?: { id?: string | number | null } | null }>;
  players?: Array<{ status?: string | null; user?: { id?: string | number | null } | null }>;
}): string[] {
  const ids = new Set<string>();
  const add = (value?: string | number | null) => {
    if (value == null || value === '') return;
    ids.add(String(value));
  };
  add(booking.hostUserId);
  add(booking.host?.id);
  add(booking.venueId);
  for (const player of [...(booking.acceptedPlayers || []), ...(booking.players || [])]) {
    const status = String(player.status || '').toLowerCase();
    if (status && !['joined', 'host', 'accepted'].includes(status)) continue;
    add(player.user?.id);
  }
  return Array.from(ids);
}

export function bookingStatusTone(status: BookingStatus | string): { bg: string; text: string; border: string } {
  switch (status) {
    case 'confirmed':
      return { bg: '#DCFCE7', text: '#16A34A', border: '#BBF7D0' };
    case 'full':
      return { bg: '#E0F2FE', text: '#0284C7', border: '#BAE6FD' };
    case 'cancelled':
      return { bg: '#FEE2E2', text: '#DC2626', border: '#FECACA' };
    case 'completed':
      return { bg: '#EDE9FE', text: '#7C3AED', border: '#DDD6FE' };
    case 'expired':
      return { bg: '#F3F4F6', text: '#6B7280', border: '#E5E7EB' };
    default:
      return { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' };
  }
}

function startOfDay(date: Date): Date {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function isSameDate(first: Date, second: Date): boolean {
  return first.getFullYear() === second.getFullYear()
    && first.getMonth() === second.getMonth()
    && first.getDate() === second.getDate();
}

function toDateTime(date: string, time: string): Date | null {
  const [hours = '0', minutes = '0'] = time.split(':');
  const result = new Date(`${date}T00:00:00`);
  if (Number.isNaN(result.getTime())) return null;
  result.setHours(Number(hours), Number(minutes), 0, 0);
  return result;
}
