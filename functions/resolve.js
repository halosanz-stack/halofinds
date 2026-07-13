const UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export async function onRequest({ request }) {
  const u = new URL(request.url).searchParams.get('u');
  const H = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };
  if (!u) return new Response(JSON.stringify({ error: 'falta u' }), { status: 400, headers: H });
  let t;
  try { t = new URL(u); } catch { return new Response(JSON.stringify({ error: 'url mala' }), { status: 400, headers: H }); }
  if (!/(youshop10[.]com|weidian[.]com|kdt[.]im|koudaitong[.]com)$/i.test(t.hostname))
    return new Response(JSON.stringify({ error: 'dominio no permitido' }), { status: 403, headers: H });
  try {
    const r = await fetch(t.toString(), { headers: { 'User-Agent': UA }, redirect: 'follow', cf: { cacheTtl: 86400, cacheEverything: true } });
    const finalUrl = r.url || '';
    const html = await r.text();
    const clean = html.replace(/&#x3D;/g, '=').replace(/&amp;/g, '&');
    const m = finalUrl.match(/itemI[dD]=(\d+)/) || clean.match(/itemI[dD]=(\d+)/) || clean.match(/itemId[^0-9]{0,6}(\d{8,})/);
    return new Response(JSON.stringify({ url: finalUrl, itemID: m ? m[1] : null }), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'fallo' }), { status: 502, headers: H });
  }
}
