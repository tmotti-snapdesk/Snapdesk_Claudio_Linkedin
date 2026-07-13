// ---------------------------------------------------------------------------
// Lecture du contenu d'une fiche Hubspot (lien de l'espace).
//
// Le générateur s'appuie EN PRIORITÉ sur ces informations : on suit le lien
// (souvent un raccourci hubs.ly), on récupère la page, on en extrait le texte
// lisible, et on l'injecte dans le prompt.
//
// Robuste par conception : timeout, erreurs et types non-HTML (PDF…) renvoient
// une chaîne vide → la génération continue avec les infos du Sheet.
// Aucune dépendance npm.
// ---------------------------------------------------------------------------

const MAX_CHARS = 4000;
const TIMEOUT_MS = 12000;

// Extraction texte grossière mais efficace d'un HTML.
export function stripHtml(html) {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&rsquo;|&lsquo;|&apos;/gi, "'")
    .replace(/&eacute;/gi, 'é').replace(/&egrave;/gi, 'è').replace(/&agrave;/gi, 'à')
    .replace(/&ecirc;/gi, 'ê').replace(/&ccedil;/gi, 'ç').replace(/&ugrave;/gi, 'ù')
    .replace(/&sup2;/gi, '²').replace(/&deg;/gi, '°').replace(/&euro;/gi, '€')
    .replace(/&hellip;/gi, '…').replace(/&ndash;/gi, '–').replace(/&mdash;/gi, '—')
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/&#\d+;/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]*\n[ \t]*/g, '\n')
    .trim();
}

/**
 * Récupère le texte de la fiche Hubspot pointée par `url`.
 * Renvoie '' si absent, en erreur, ou si le contenu n'est pas du HTML/texte.
 */
export async function fetchHubspotContext(url) {
  if (!url || !/^https?:\/\//i.test(String(url).trim())) return '';

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(String(url).trim(), {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 (compatible; SnapdeskBot/1.0; +https://snapdesk.co)' },
    });
    if (!res.ok) return '';

    const ct = (res.headers.get('content-type') || '').toLowerCase();
    // PDF / binaire : pas d'extraction sans dépendance → on ignore proprement.
    if (ct && !ct.includes('text/html') && !ct.includes('text/plain') && !ct.includes('xml')) {
      return '';
    }

    const body = await res.text();
    const text = ct.includes('text/html') || /<[a-z!]/i.test(body) ? stripHtml(body) : body.trim();
    return text.slice(0, MAX_CHARS);
  } catch {
    return '';
  } finally {
    clearTimeout(timer);
  }
}
