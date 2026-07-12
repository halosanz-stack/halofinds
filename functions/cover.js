// /cover?u=https://seller.x.yupoo.com/albums/123456?uid=1
// Abre el album en el servidor, saca la primera foto y la sirve con Referer falso.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

export async function onRequest({ request, waitUntil }) {
  const u = new URL(request.url).searchParams.get('u');
  if (!u) return new Response('falta ?u=', { status: 400 });

  let album;
  try { album = new URL(u); } catch { return new Response('url mala', { status: 400 }); }
  if (!/yupoo\.com$/i.test(album.hostname)) return new Response('no permitido', { status: 403 });

  const cache = caches.default;
  const key = new Request(request.url, { method: 'GET' });
  const hit = await cache.match(key);
  if (hit) return hit;

  let res;
  try {
    const html = await (await fetch(album.toString(), {
      headers: { 'User-Agent': UA, 'Referer': album.origin + '/', 'Accept-Language': 'es,en;q=0.8' },
      cf: { cacheTtl: 86400, cacheEverything: true }
    })).text();

    const clean = html.replace(/&#x3D;/g, '=').replace(/&amp;/g, '&').replace(/&#x2F;/g, '/');
    const m = clean.match(/(?:data-origin-src|data-src|data-path|src)=["'](\/\/photo\.yupoo\.com\/[^"']+?\.(?:jpe?g|png|webp))/i)
           || clean.match(/(https?:\/\/photo\.yupoo\.com\/[^"'\s]+?\.(?:jpe?g|png|webp))/i);
    if (!m) return miss('sin foto');

    let img = m[1].startsWith('//') ? 'https:' + m[1] : m[1];
    img = img.replace(/\/(small|thumb)\.(jpe?g|png|webp)$/i, '/medium.$2');

    const up = await fetch(img, {
      headers: { 'User-Agent': UA, 'Referer': album.origin + '/', 'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8' },
      cf: { cacheTtl: 2592000, cacheEverything: true }
    });
    if (!up.ok) return miss('img ' + up.status);

    res = new Response(up.body, {
      headers: {
        'Content-Type': up.headers.get('Content-Type') || 'image/jpeg',
        'Cache-Control': 'public, max-age=2592000, s-maxage=2592000, immutable',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (e) {
    return miss('error');
  }

  waitUntil(cache.put(key, res.clone()));
  return res;
}

function miss(reason) {
  return new Response(reason, {
    status: 404,
    headers: { 'Cache-Control': 'public, max-age=86400' }
  });
}
