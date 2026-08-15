// /data -> CSV del catalogo cacheado en el edge de Cloudflare.
// Evita que cada visita tenga que esperar a los servidores de Google.
const SHEET = '1HbVY700zq3phSeUj68GUn59XM6iLTZBCU67_8OM8MNo';
const GID = '795941508';

export async function onRequest({ request }) {
  const src = 'https://docs.google.com/spreadsheets/d/' + SHEET + '/gviz/tq?tqx=out:csv&gid=' + GID;
  try {
    const r = await fetch(src, { cf: { cacheTtl: 600, cacheEverything: true }, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return new Response('upstream ' + r.status, { status: 502 });
    const txt = await r.text();
    if (txt.length < 50000) return new Response('too short', { status: 502 });
    return new Response(txt, { headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Cache-Control': 'public, max-age=600, s-maxage=600',
      'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response('error', { status: 502 });
  }
}
