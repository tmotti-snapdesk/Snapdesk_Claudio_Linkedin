// ---------------------------------------------------------------------------
// /api/state  — mémoire de travail (posts générés/édités, note du jour,
// historique des accroches). Protégé par la session.
//
// GET  /api/state?space=<id>  → { ok, posts:{commercial:content}, dailyNote, history:[{author,hook}] }
// POST /api/state  body { op, space, commercial?, content?, author?, hook? }
//   op = savePost | deletePost | saveDaily | appendHook
//
// VISIBILITÉ / ISOLATION (mémoire partagée uniquement avec soi-même + les admins) :
//   - Chaque contenu (post, note du jour, historique d'accroches) est rangé sous
//     une clé PROPRE à l'utilisateur qui l'a créé (…:<user>).
//   - Un utilisateur NON admin ne voit / ne modifie QUE ses propres contenus.
//     Deux utilisateurs qui génèrent le même persona sur le même espace ne se
//     marchent donc pas dessus (pas d'écrasement mutuel).
//   - Un ADMIN a une vue générale : il voit tout le contenu généré (le plus
//     récent par persona, tous utilisateurs confondus) et peut le supprimer.
//   - Les contenus « legacy » (créés avant cette isolation, sans propriétaire)
//     restent visibles uniquement des admins.
// ---------------------------------------------------------------------------

import { requireAuth } from '../lib/auth.js';
import { kvGet, kvList, kvSet, kvDel, isConfigured } from '../lib/store.js';

const HISTORY_MAX = 60;

// Identifiant d'utilisateur sûr pour composer une clé (pas de ':').
const uid = (u) => String(u || '').toLowerCase().replace(/:/g, '_');
const tsOf = (r) => (r && r.updated_at ? (Date.parse(r.updated_at) || 0) : 0);

export default async function handler(req, res) {
  const session = requireAuth(req, res);
  if (!session) return;
  const me = uid(session.user);

  if (!isConfigured()) {
    return res.status(500).json({
      ok: false,
      error: 'Stockage partagé non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).',
      code: 'NO_STORE',
    });
  }

  try {
    if (req.method === 'GET') {
      const space = String((req.query && req.query.space) || '').trim();
      const out = { ok: true, posts: {}, dailyNote: '', history: [] };

      // Historique des accroches : propre à l'utilisateur (anti-répétition perso).
      const hist = await kvGet(`history:${me}`);
      out.history = hist && Array.isArray(hist.items) ? hist.items : [];

      if (space) {
        const rows = await kvList(`post:${space}:`);
        if (session.admin) {
          // Admin : vue générale = le contenu le plus récent par persona.
          const latest = {}; // commercial -> { content, ts }
          for (const r of rows) {
            const parts = String(r.key).split(':'); // [post, space, commercial, (user?)]
            const commercial = parts[2];
            if (!commercial || !r.value || typeof r.value.content !== 'string') continue;
            const ts = tsOf(r);
            if (!(commercial in latest) || ts >= latest[commercial].ts) latest[commercial] = { content: r.value.content, ts };
          }
          for (const c of Object.keys(latest)) out.posts[c] = latest[c].content;
        } else {
          // Non-admin : uniquement SES posts (clé …:<user>). Les legacy (3 segments) sont exclus.
          for (const r of rows) {
            const parts = String(r.key).split(':');
            if (parts.length < 4) continue;
            const commercial = parts[2];
            const owner = parts.slice(3).join(':');
            if (owner !== me) continue;
            if (!commercial || !r.value || typeof r.value.content !== 'string') continue;
            out.posts[commercial] = r.value.content;
          }
        }

        // Note du jour : propre à l'utilisateur (oriente SA génération).
        const daily = await kvGet(`daily:${space}:${me}`);
        out.dailyNote = daily && typeof daily.text === 'string' ? daily.text : '';
      }
      return res.status(200).json(out);
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const { op, space, commercial, content, author, hook } = body || {};

      if (op === 'savePost') {
        if (!space || !commercial) return res.status(400).json({ ok: false, error: 'space + commercial requis' });
        if (session.admin) {
          // Un admin édite le contenu AFFICHÉ (le plus récent) : on réécrit SUR
          // LA CLÉ D'ORIGINE (celle de l'utilisateur) pour que la modification
          // apparaisse chez lui. Si aucun contenu n'existe encore, l'admin crée le sien.
          const rows = await kvList(`post:${space}:${commercial}:`);
          const candidates = rows.map((r) => ({ key: r.key, by: (r.value && r.value.by) || '', ts: tsOf(r) }));
          const legacy = await kvGet(`post:${space}:${commercial}`);
          if (legacy) candidates.push({ key: `post:${space}:${commercial}`, by: legacy.by || '', ts: 0 });
          candidates.sort((a, b) => b.ts - a.ts);
          if (candidates.length) {
            const t = candidates[0];
            await kvSet(t.key, { content: String(content == null ? '' : content), by: t.by || session.user });
          } else {
            await kvSet(`post:${space}:${commercial}:${me}`, { content: String(content == null ? '' : content), by: session.user });
          }
        } else {
          await kvSet(`post:${space}:${commercial}:${me}`, { content: String(content == null ? '' : content), by: session.user });
        }
      } else if (op === 'deletePost') {
        if (!space || !commercial) return res.status(400).json({ ok: false, error: 'space + commercial requis' });
        if (session.admin) {
          // Admin : supprime le contenu affiché = le plus récent (tous utilisateurs).
          const rows = await kvList(`post:${space}:${commercial}:`);
          const candidates = rows.map((r) => ({ key: r.key, ts: tsOf(r) }));
          const legacy = await kvGet(`post:${space}:${commercial}`);
          if (legacy) candidates.push({ key: `post:${space}:${commercial}`, ts: 0 });
          candidates.sort((a, b) => b.ts - a.ts);
          if (candidates.length) await kvDel(candidates[0].key);
        } else {
          // Non-admin : ne supprime que SON propre contenu.
          await kvDel(`post:${space}:${commercial}:${me}`);
        }
      } else if (op === 'saveDaily') {
        if (!space) return res.status(400).json({ ok: false, error: 'space requis' });
        await kvSet(`daily:${space}:${me}`, { text: String(content == null ? '' : content) });
      } else if (op === 'appendHook') {
        const hkey = `history:${me}`;
        const cur = await kvGet(hkey);
        let items = cur && Array.isArray(cur.items) ? cur.items : [];
        items.push({ author: String(author || ''), hook: String(hook || '') });
        // dédoublonne (author|hook) en gardant les plus récents, puis plafonne.
        const seen = new Set();
        const dedup = [];
        for (let i = items.length - 1; i >= 0; i--) {
          const kk = items[i].author + '|' + items[i].hook;
          if (seen.has(kk)) continue;
          seen.add(kk);
          dedup.unshift(items[i]);
        }
        await kvSet(hkey, { items: dedup.slice(-HISTORY_MAX) });
      } else {
        return res.status(400).json({ ok: false, error: 'op inconnue' });
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
