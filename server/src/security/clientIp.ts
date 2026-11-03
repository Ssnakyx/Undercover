// IP réelle d'un client derrière Render. Render passe par Cloudflare, qui ajoute
// True-Client-IP / CF-Connecting-IP avec l'IP vue par Cloudflare : un client ne peut pas les
// falsifier (Cloudflare les écrase). X-Forwarded-For, lui, n'est jamais filtré par Render :
// sa PREMIÈRE entrée est celle que le client envoie lui-même, donc inventable à volonté — la
// lire permettait de contourner toutes les limites par IP. En repli (hors Cloudflare, en
// local), on prend l'avant-dernière entrée, celle écrite par le proxy le plus proche.

type Headers = Record<string, string | string[] | undefined>;

function header(headers: Headers, name: string): string | undefined {
  const v = headers[name];
  const raw = Array.isArray(v) ? v[0] : v;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

export function clientIpFromHeaders(headers: Headers, remoteAddress: string | undefined): string {
  const cf = header(headers, 'true-client-ip') ?? header(headers, 'cf-connecting-ip');
  if (cf) return cf;
  const fwd = header(headers, 'x-forwarded-for');
  if (fwd) {
    const hops = fwd.split(',').map((h) => h.trim()).filter(Boolean);
    const trusted = hops.length >= 2 ? hops[hops.length - 2] : hops[0];
    if (trusted) return trusted;
  }
  return remoteAddress || 'unknown';
}
