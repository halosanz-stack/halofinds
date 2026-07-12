// Proxy de imagenes Yupoo (Cloudflare Pages Function) -> /img?u=https://photo.yupoo.com/....jpg
export async function onRequest({ request }) {
  const u = new URL(request.url).searchParams.get('u');
  if (!u) return new Response('falta ?u=', { status: 400 });

  let target;
  try { target = new URL(u); } catch { return new Response('url mala', { status: 400 }); }
  if (!/(^|\.)yupoo\.com$/i.test(target.hostname))
    return new Response('dominio no permitido', { status: 403 });

  const upstream = await fetch(target.toString(), {
    headers: {
      'Referer': 'https://' + target.hostname + '/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/*,*/*;q=0.8'
    },
    cf: { cacheTtl: 2592000, cacheEverything: true }
  });

  if (!upstream.ok) return new Response('no cargo', { status: 502 });

  return new Response(upstream.body, {
    headers: {
      'Content-Type': upstream.headers.get('Content-Type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=2592000, immutable',
      'Access-Control-Allow-Origin': '*'
    }
  });
}
