import { environment } from '../../../environments/environment';

/**
 * Turn API media paths into absolute URLs for <img src>.
 * Relative paths like "profile-images/x.jpg" resolve against Ionic (localhost:8100)
 * and 404 — they must be prefixed with the API host + /storage.
 */
export function resolveMediaUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;

  const value = String(pathOrUrl).trim();
  if (!value) return null;

  if (/^(https?:|data:|blob:)/i.test(value)) {
    return value;
  }

  const origin = mediaOriginFromApiUrl(environment.apiUrl);
  let relative = value.replace(/^\/+/, '');

  if (!relative.startsWith('storage/')) {
    relative = `storage/${relative}`;
  }

  return `${origin}/${relative}`;
}

function mediaOriginFromApiUrl(apiUrl: string): string {
  const trimmed = (apiUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.replace(/\/api$/i, '');
}
