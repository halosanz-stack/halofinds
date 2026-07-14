const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

export async function onRequest({ request }) {
  const H = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=604800' };
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^[0-9]+$/.test(id)) return new Response(JSON.stringify({ error: 'id' }), { status: 400, headers: H });
  try {
    const r = await fetch('https://weidian.com/item.html?itemID=' + id, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 604800, cacheEverything: true } });
    const html = await r.text();
    const clean = html.replace(/&#x3D;/g,'=').replace(/&amp;/g,'&');
    let t = null;
    const m1 = clean.match(/<title>([^<]{2,120})<\/title>/i);
    const m2 = clean.match(/\"itemName\"\s*:\s*\"([^\"]{2,120})\"/);
    const m3 = clean.match(/\"title\"\s*:\s*\"([^\"]{2,120})\"/);
    t = (m2 && m2[1]) || (m3 && m3[1]) || (m1 && m1[1]) || null;
    if (t) t = t.replace(/\\u[0-9a-f]{4}/gi, x => String.fromCharCode(parseInt(x.slice(2), 16)));
    return new Response(JSON.stringify({ id: id, title: t }), { headers: H });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'fail' }), { status: 502, headers: H });
  }
}
