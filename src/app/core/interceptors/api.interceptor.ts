import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'tyng_auth_token';

const normalizeUrl = (url: string): string =>
  url.replace('tyngpeaople.com', 'tyngpeople.com');

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  const rewrittenUrl = normalizeUrl(req.url);
  const apiBase = normalizeUrl(environment.apiUrl);
  const isApiRequest = rewrittenUrl.startsWith(apiBase);

  if (!isApiRequest) {
    return next(req.url === rewrittenUrl ? req : req.clone({ url: rewrittenUrl }));
  }

  const token = localStorage.getItem(TOKEN_KEY);
  let headers = req.headers.set('Accept', 'application/json');

  if (token) {
    headers = headers.set('Authorization', `Bearer ${token}`);
  }

  return next(req.clone({ url: rewrittenUrl, headers }));
};
