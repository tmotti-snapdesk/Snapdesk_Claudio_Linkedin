// ---------------------------------------------------------------------------
// POST /api/generate
//
// Corps attendu (JSON) :
// {
//   "space": {
//     "url": "...", "localisation": "75016", "espace": "Iéna",
//     "prix": "6 600 €", "postes": "12", "superficie": "80 m²",
//     "disponibilite": "DISPO", "description": "..."
//   },
//   "commercials": ["ronan", "melanie", "florian", "thomas"]   // optionnel
// }
//
// Réponse : { ok, space, model, posts: { ronan: { post } | { error } | { skipped }, ... } }
// ---------------------------------------------------------------------------

import { COMMERCIALS, COMMERCIAL_KEYS, getCommercial } from '../lib/commercials/index.js';
import { generatePost, MODEL } from '../lib/llm.js';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  // --- Authentification par session (login pseudo + mot de passe) ---
  if (!requireAuth(req, res)) return;

  // --- Parsing du corps (Vercel parse déjà le JSON, mais on gère la string au cas où) ---
  let payload = req.body;
  if (typeof payload === 'string') {
    try { payload = JSON.parse(payload); } catch { payload = {}; }
  }
  const space = payload && payload.space;
  if (!space || !space.espace) {
    return res.status(400).json({ ok: false, error: 'Champ "space.espace" requis' });
  }

  const requested =
    Array.isArray(payload.commercials) && payload.commercials.length
      ? payload.commercials.map((k) => String(k).toLowerCase())
      : COMMERCIAL_KEYS;

  // --- Génération en parallèle (une erreur sur un commercial n'impacte pas les autres) ---
  const entries = await Promise.all(
    requested.map(async (key) => {
      const commercial = getCommercial(key);
      if (!commercial) return [key, { error: 'Commercial inconnu' }];
      if (!commercial.active) {
        return [key, {
          skipped: true,
          post: `⏳ Config "${commercial.name}" à compléter (tone of voice + template pas encore renseignés).`,
        }];
      }
      try {
        const post = await generatePost(commercial, space);
        return [key, { post }];
      } catch (err) {
        return [key, { error: err.message || String(err) }];
      }
    })
  );

  const posts = Object.fromEntries(entries);
  return res.status(200).json({ ok: true, space: space.espace, model: MODEL, posts });
}
