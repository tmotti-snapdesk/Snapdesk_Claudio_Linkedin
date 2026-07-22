// ---------------------------------------------------------------------------
// /api/persona  — voir / éditer le persona (voix) d'un utilisateur. Admin only.
//
// GET  /api/persona?key=<pseudo>  → { ok, persona }
// POST /api/persona  { key, name?, role?, temperature?, toneOfVoice?, template?,
//                      examples? (texte séparé par lignes vides), extraInstructions? }
//   → met à jour et enregistre persona:<key>.
// ---------------------------------------------------------------------------

import { requireActiveAdmin } from '../lib/auth.js';
import { kvGet, kvSet, isConfigured } from '../lib/store.js';
import { buildUserPersona, applyPersonaEdits } from '../lib/persona.js';

export default async function handler(req, res) {
  const session = await requireActiveAdmin(req, res);
  if (!session) return;

  if (!isConfigured()) {
    return res.status(500).json({ ok: false, error: 'Stockage partagé (Supabase) non configuré.', code: 'NO_STORE' });
  }

  try {
    if (req.method === 'GET') {
      const key = String((req.query && req.query.key) || '').trim().toLowerCase();
      if (!key) return res.status(400).json({ ok: false, error: 'key requis' });
      let persona = await kvGet(`persona:${key}`);
      if (!persona) {
        const rec = await kvGet(`user:${key}`);
        if (!rec) return res.status(404).json({ ok: false, error: 'Utilisateur introuvable' });
        persona = buildUserPersona({ key, name: rec.name, role: rec.role, bio: rec.bio });
      }
      return res.status(200).json({ ok: true, persona });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const key = String((body && body.key) || '').trim().toLowerCase();
      if (!key) return res.status(400).json({ ok: false, error: 'key requis' });

      let base = await kvGet(`persona:${key}`);
      if (!base) {
        const rec = await kvGet(`user:${key}`);
        base = buildUserPersona({ key, name: (rec && rec.name) || key, role: (rec && rec.role) || '', bio: (rec && rec.bio) || '' });
      }
      const updated = applyPersonaEdits(base, body);
      updated.key = key;
      await kvSet(`persona:${key}`, updated);
      return res.status(200).json({ ok: true, persona: updated });
    }

    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
