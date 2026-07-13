// ---------------------------------------------------------------------------
// GET /api/spaces
//
// Renvoie la liste des espaces lus depuis le Google Sheet (SHEET_CSV_URL)
// ou, à défaut, le jeu de données d'exemple.
//
// Réponse : { ok, source, count, spaces: [{ id, espace, localisation, prix,
//             postes, superficie, disponibilite, url, description }] }
// ---------------------------------------------------------------------------

import { getSpaces } from '../lib/spaces.js';
import { requireAuth } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  // --- Authentification par session ---
  if (!requireAuth(req, res)) return;

  try {
    const { source, spaces } = await getSpaces();
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ ok: true, source, count: spaces.length, spaces });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
