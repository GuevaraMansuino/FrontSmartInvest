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

  // No interceptar endpoints propios de autenticación ni verificación inicial
  const isAuthEndpoint =
    path.includes('/api/auth/login') ||
    path.includes('/api/auth/register') ||
    path.includes('/api/auth/refresh') ||
    path.includes('/api/auth/logout') ||
    path.includes('/api/auth/me');

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
