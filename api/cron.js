/**
 * Vercel Serverless Function / Cron Handler
 * Ejecutado automáticamente según la programación de vercel.json ("0 * * * *")
 * Invoca el endpoint de keep-alive en el Backend de Render para que ni Render
 * ni la base de datos Supabase entren en inactividad.
 */
export default async function handler(req, res) {
  const backendUrl =
    process.env.VITE_API_URL ||
    process.env.BACKEND_URL ||
    'https://smart-invest-backend.onrender.com';

  const targetUrl = `${backendUrl.replace(/\/$/, '')}/api/cron/keep-alive`;

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Vercel-Cron-Job/1.0 (SmartInvest Keep-Alive)',
        ...(process.env.CRON_SECRET ? { 'X-Cron-Secret': process.env.CRON_SECRET } : {}),
      },
    });

    const data = await response.json();

    return res.status(response.status).json({
      vercel_cron: 'success',
      target: targetUrl,
      backend_response: data,
    });
  } catch (error) {
    return res.status(500).json({
      vercel_cron: 'error',
      target: targetUrl,
      error: error?.message || 'Unknown error contacting backend',
    });
  }
}
