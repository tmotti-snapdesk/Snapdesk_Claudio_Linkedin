// ---------------------------------------------------------------------------
// POST /api/login   body { username, password }  → { ok, token, user, admin }
//
// Vérifie :
//   1) un compte utilisateur stocké dans Supabase (user:<pseudo>), OU
//   2) le compte maître Vercel (APP_USER / APP_PASSWORD) — admin de secours.
// ---------------------------------------------------------------------------

import { checkCredentials, issueToken, isConfigured, verifyPassword } from '../lib/auth.js';
import { kvGet, isConfigured as storeConfigured } from '../lib/store.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  if (!isConfigured() && !storeConfigured()) {
    return res.status(500).json({
      ok: false,
      error: 'Connexion non configurée (ni compte maître APP_USER/APP_PASSWORD, ni Supabase).',
    });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const username = String((body && body.username) || '').trim().toLowerCase();
  const password = String((body && body.password) || '');

  // 1) Compte utilisateur dans Supabase
  if (username && storeConfigured()) {
    try {
      const rec = await kvGet(`user:${username}`);
      if (rec && rec.hash && verifyPassword(password, rec.hash)) {
        // Compte en attente de validation par un administrateur (inscription self-service).
        if (rec.verified === false) {
          return res.status(403).json({ ok: false, code: 'PENDING', error: "Ton compte est en attente de validation par un administrateur." });
        }
        const admin = !!rec.admin;
        const commercial = admin ? '' : (rec.commercial || '');
        return res.status(200).json({ ok: true, token: issueToken(username, admin, commercial), user: username, admin, name: rec.name || '', role: rec.role || '', commercial });
      }
    } catch {
      /* Supabase indisponible → on tente le compte maître ci-dessous */
    }
  }

  // 2) Compte maître Vercel (toujours admin)
  if (checkCredentials(username, password)) {
    return res.status(200).json({ ok: true, token: issueToken(username, true), user: username, admin: true });
  }

  return res.status(401).json({ ok: false, error: 'Identifiants invalides' });
}
