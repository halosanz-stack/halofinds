// /wimg?id=ITEMID -> foto real del producto desde Weidian (para productos sin album Yupoo)
const UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

export async function onRequest({ request }) {
  const id = new URL(request.url).searchParams.get('id');
  if (!id || !/^[0-9]+$/.test(id)) return new Response('id malo', { status: 400 });
  try {
    const page = await fetch('https://weidian.com/item.html?itemID=' + id, { headers: { 'User-Agent': UA }, cf: { cacheTtl: 86400, cacheEverything: true } });
    const html = await page.text();
    const clean = html.replace(/&#x3D;/g,'=').replace(/&amp;/g,'&').replace(/\\u002F/g,'/').replace(/\\/g,'');
    const m = clean.match(/https?:\/\/si\.geilicdn\.com\/[A-Za-z0-9_.:%-]+\.(jpg|jpeg|png|webp)/i)
           || clean.match(/https?:\/\/[a-z0-9.-]*geilicdn\.com\/[A-Za-z0-9_.:%-]+\.(jpg|jpeg|png|webp)/i);
    if (!m) return new Response('sin foto', { status: 404, headers: { 'Cache-Control': 'public, max-age=3600' } });
    const img = await fetch(m[0], { cf: { cacheTtl: 2592000, cacheEverything: true } });
    if (!img.ok) return new Response('img fail', { status: 502 });
    return new Response(img.body, { headers: {
      'Content-Type': img.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=2592000, immutable',
      'Access-Control-Allow-Origin': '*' } });
  } catch (e) {
    return new Response('error', { status: 502 });
  }
}
