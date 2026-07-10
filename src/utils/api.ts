/**
 * Utilidad para resolver URLs de la API del Backend.
 * - En desarrollo local (Vite dev server): devuelve la ruta relativa (ej: '/api/market/featured') y el proxy de Vite la redirige a localhost:8000.
 * - En producción (Vercel): utiliza la variable de entorno VITE_API_URL apuntando al backend en Render (ej: 'https://smart-invest-backend.onrender.com').
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const baseUrl = import.meta.env.VITE_API_URL || '';

  if (!baseUrl) {
    return cleanPath;
  }

  const cleanBaseUrl = baseUrl.replace(/\/$/, '');
  return `${cleanBaseUrl}${cleanPath}`;
}
