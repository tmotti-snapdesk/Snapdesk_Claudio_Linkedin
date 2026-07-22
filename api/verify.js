// ---------------------------------------------------------------------------
// GET/POST /api/verify?token=<jeton>
//
// Valide l'adresse e-mail d'un compte créé via /api/signup : marque le compte
// comme "vérifié" (verified:true) pour autoriser la connexion.
// ---------------------------------------------------------------------------

import { verifyEmailToken } from '../lib/auth.js';
import { kvGet, kvSet, isConfigured } from '../lib/store.js';

export default async function handler(req, res) {
  if (!isConfigured()) {
    return res.status(500).json({ ok: false, error: 'Stockage partagé (Supabase) non configuré.', code: 'NO_STORE' });
  }

  const token = String((req.query && req.query.token) || '').trim();
  const email = verifyEmailToken(token);
  if (!email) {
    return res.status(400).json({ ok: false, error: 'Lien de vérification invalide ou expiré.' });
  }

  try {
    const rec = await kvGet(`user:${email}`);
    if (!rec) return res.status(404).json({ ok: false, error: 'Compte introuvable.' });
    if (rec.verified !== true) {
      await kvSet(`user:${email}`, { ...rec, verified: true });
    }
    return res.status(200).json({ ok: true, email, name: rec.name || '' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
