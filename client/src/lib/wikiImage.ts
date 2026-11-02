// Images d'illustration servies par Wikipédia (cartes d'univers du menu) : une entrée de
// `showcase` peut valoir "wiki:Titre de l'article" au lieu d'une URL. Le navigateur demande
// alors l'image principale de l'article à l'API REST publique de Wikimedia (CORS ouvert), une
// seule fois par titre. Si l'API ne répond pas, l'image est simplement masquée.

const WIKI_SUMMARY = 'https://en.wikipedia.org/api/rest_v1/page/summary';
const cache = new Map<string, Promise<string | null>>();

export function isWikiRef(src: string): boolean {
  return src.startsWith('wiki:');
}

export function resolveWikiImage(ref: string): Promise<string | null> {
  const title = ref.slice('wiki:'.length);
  let pending = cache.get(title);
  if (!pending) {
    pending = fetch(`${WIKI_SUMMARY}/${encodeURIComponent(title.replace(/ /g, '_'))}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { thumbnail?: { source?: string } } | null) => data?.thumbnail?.source ?? null)
      .catch(() => null);
    cache.set(title, pending);
  }
  return pending;
}
