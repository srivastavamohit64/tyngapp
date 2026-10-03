export const AVATAR_COLORS = ['#8CF000', '#38BDF8', '#FF7A00', '#7C3AED', '#F59E0B'];

export function avatarColor(id: number): string {
  return AVATAR_COLORS[Math.abs(id) % AVATAR_COLORS.length];
}

const READABLE_TEXT: Record<string, string> = { '#8CF000': '#4D7C0F', '#F59E0B': '#B45309', '#38BDF8': '#0284C7' };

export function avatarTextColor(id: number): string {
  const c = avatarColor(id);
  return READABLE_TEXT[c] ?? c;
}

export function initials(name: string | null | undefined): string {
  const parts = (name || '?').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '?') + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}

export function money(value: number | null | undefined): string {
  return '₹' + Math.round(Number(value) || 0).toLocaleString('en-IN');
}

export function shortMoney(value: number | null | undefined): string {
  const v = Number(value) || 0;
  if (v >= 100000) return `₹${(v / 100000).toFixed(v % 100000 === 0 ? 0 : 1)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(v % 1000 === 0 ? 0 : 1)}K`;
  return `₹${Math.round(v)}`;
}

export const DUTY_META: Record<string, { label: string; color: string }> = {
  on_duty: { label: 'On Duty', color: '#FF7A00' },
  available: { label: 'Available', color: '#8CF000' },
  leave: { label: 'On Leave', color: '#EF4444' },
};

export const PAYOUT_COLORS: Record<string, string> = { paid: '#8CF000', processing: '#FF7A00', pending: '#EF4444' };

export function apiErrorMessage(e: unknown, fallback: string): string {
  const err = e as { error?: { message?: string; errors?: Record<string, string[]> } };
  const first = err?.error?.errors ? Object.values(err.error.errors)[0]?.[0] : null;
  return first || err?.error?.message || fallback;
}
