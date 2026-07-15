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
  return `${durationMinutes} min`;
}

export function formatStartsIn(date?: string | null, startTime?: string | null): string | null {
  if (!date || !startTime) return null;
  const start = toDateTime(date, startTime);
  if (!start) return null;

  const diff = start.getTime() - Date.now();
  if (diff <= 0) return null;

  const totalMinutes = Math.floor(diff / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) return `Starts in ${minutes}m`;
  return `Starts in ${hours}h ${minutes}m`;
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
