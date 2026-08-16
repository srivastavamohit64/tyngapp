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

  if (/^(data:|blob:)/i.test(value)) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    const rewritten = rewriteAppOriginMediaUrl(value);
    return rewritten || value;
  }

  const origin = mediaOriginFromApiUrl(environment.apiUrl);
  let relative = value.replace(/^\/+/, '');

  if (!relative.startsWith('storage/')) {
    relative = `storage/${relative}`;
  }

  return `${origin}/${relative}`;
}

/** Relative media paths that the browser already resolved against Ionic (localhost:8100). */
function rewriteAppOriginMediaUrl(value: string): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = new URL(value);
    if (parsed.origin !== window.location.origin) return null;
    const path = parsed.pathname.replace(/^\/+/, '');
    if (!/^(storage\/|profile-images\/|venue-|gallery)/i.test(path)) return null;
    const origin = mediaOriginFromApiUrl(environment.apiUrl);
    const relative = path.startsWith('storage/') ? path : `storage/${path}`;
    return `${origin}/${relative}`;
  } catch {
    return null;
  }
}

function mediaOriginFromApiUrl(apiUrl: string): string {
  const trimmed = (apiUrl || '').trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  return trimmed.replace(/\/api$/i, '');
}
