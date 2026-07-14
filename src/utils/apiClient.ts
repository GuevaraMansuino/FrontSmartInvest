import { getApiUrl } from './api';

let isRefreshing = false;
let refreshSubscribers: ((success: boolean) => void)[] = [];

function subscribeTokenRefresh(cb: (success: boolean) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(success: boolean) {
  refreshSubscribers.forEach((cb) => cb(success));
  refreshSubscribers = [];
}

/**
 * Formatea el detalle de error (`detail`) retornado por FastAPI/Pydantic en un mensaje legible.
 * Evita errores en React al intentar renderizar objetos o arrays provenientes de respuestas 422.
 */
export function formatApiError(detail: any, fallback: string): string {
  if (!detail) return fallback;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const msgs = detail
      .map((err) => {
        if (typeof err === 'string') return err;
        if (err && typeof err === 'object') {
          let msg = err.msg || err.message || JSON.stringify(err);
          if (typeof msg === 'string') {
            msg = msg.replace(/^Value error,\s*/i, '');
          }
          return msg;
        }
        return String(err);
      })
      .filter(Boolean);
    return msgs.length > 0 ? msgs.join('. ') : fallback;
  }
  if (typeof detail === 'object') {
    let msg = detail.msg || detail.message || detail.detail;
    if (typeof msg === 'string') {
      return msg.replace(/^Value error,\s*/i, '');
    }
  }
  return String(detail);
}

/**
 * Cliente HTTP autenticado para Smart Invest.
 * - Adjunta automáticamente `credentials: 'include'` para enviar las Cookies HttpOnly.
 * - Intercepta respuestas 401 Unauthorized y rota el Refresh Token de forma automática y transparente.
 */
export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const url = getApiUrl(path);
  const headers = new Headers(options.headers || {});

  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const mergedOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include',
  };

  const response = await fetch(url, mergedOptions);

  // No interceptar endpoints propios de login/registro/refresh/logout
  const isAuthEndpoint =
    path.includes('/api/auth/login') ||
    path.includes('/api/auth/register') ||
    path.includes('/api/auth/refresh') ||
    path.includes('/api/auth/logout');

  if (response.status === 401 && !isAuthEndpoint) {
    if (isRefreshing) {
      return new Promise<Response>((resolve) => {
        subscribeTokenRefresh(async (success) => {
          if (success) {
            resolve(await fetch(url, mergedOptions));
          } else {
            resolve(response);
          }
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshRes = await fetch(getApiUrl('/api/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
      });

      if (refreshRes.ok) {
        onRefreshed(true);
        isRefreshing = false;
        return await fetch(url, mergedOptions);
      } else {
        onRefreshed(false);
        isRefreshing = false;
        return response;
      }
    } catch {
      onRefreshed(false);
      isRefreshing = false;
      return response;
    }
  }

  return response;
}
