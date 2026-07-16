// ---------------------------------------------------------------------------
// /api/users  — gestion des comptes (réservé aux ADMIN). Stockés dans Supabase.
//
// GET    /api/users                → { ok, users: [{ username, name, admin }] }
// POST   /api/users  { username, password?, name?, admin? }  → crée / met à jour
// DELETE /api/users?username=<u>   → supprime
// ---------------------------------------------------------------------------

import { requireAdmin, hashPassword } from '../lib/auth.js';
import { kvGet, kvList, kvSet, kvDel, isConfigured } from '../lib/store.js';

export default async function handler(req, res) {
  const session = requireAdmin(req, res);
  if (!session) return;

  if (!isConfigured()) {
    return res.status(500).json({
      ok: false,
      error: 'Gestion des utilisateurs indisponible : Supabase non configuré (SUPABASE_URL / SERVICE_ROLE_KEY).',
      code: 'NO_STORE',
    });
  }

  try {
    if (req.method === 'GET') {
      const rows = await kvList('user:');
      const users = rows
        .map((r) => ({
          username: String(r.key).slice('user:'.length),
          name: (r.value && r.value.name) || '',
          admin: !!(r.value && r.value.admin),
        }))
        .sort((a, b) => a.username.localeCompare(b.username));
      return res.status(200).json({ ok: true, users });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const username = String((body && body.username) || '').trim().toLowerCase();
      const password = String((body && body.password) || '');
      const name = String((body && body.name) || '').trim();
      const admin = !!(body && body.admin);
      if (!username) return res.status(400).json({ ok: false, error: 'Pseudo requis' });
      if (!/^[a-z0-9._@-]{2,60}$/.test(username)) {
        return res.status(400).json({ ok: false, error: 'Pseudo invalide (lettres, chiffres, . _ - @, 2 à 60 caractères)' });
      }

      const existing = await kvGet(`user:${username}`);
      if (!existing && !password) {
        return res.status(400).json({ ok: false, error: 'Mot de passe requis pour un nouveau compte' });
      }
      // Nouveau mot de passe si fourni, sinon on conserve le hash existant.
      const hash = password ? hashPassword(password) : existing.hash;
      await kvSet(`user:${username}`, { hash, name, admin });
      return res.status(200).json({ ok: true, user: { username, name, admin } });
    }

    if (req.method === 'DELETE') {
      const username = String((req.query && req.query.username) || '').trim().toLowerCase();
      if (!username) return res.status(400).json({ ok: false, error: 'Pseudo requis' });
      await kvDel(`user:${username}`);
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
