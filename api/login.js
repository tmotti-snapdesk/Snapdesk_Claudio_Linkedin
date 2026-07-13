// ---------------------------------------------------------------------------
// POST /api/login
//
// Corps (JSON) : { username, password }
// Réponse OK   : { ok: true, token, user }
// Réponse KO   : 401 { ok:false, error }  ou 500 si non configuré côté serveur.
//
// Un seul compte est accepté (APP_USER / APP_PASSWORD dans les env vars Vercel).
// ---------------------------------------------------------------------------

import { checkCredentials, issueToken, isConfigured } from '../lib/auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  if (!isConfigured()) {
    return res.status(500).json({
      ok: false,
      error: 'Connexion non configurée côté serveur (APP_USER / APP_PASSWORD manquants).',
    });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const username = (body && body.username) || '';
  const password = (body && body.password) || '';

  if (!checkCredentials(username, password)) {
    return res.status(401).json({ ok: false, error: 'Identifiants invalides' });
  }

  const token = issueToken(username);
  return res.status(200).json({ ok: true, token, user: String(username).trim().toLowerCase() });
}
