// ---------------------------------------------------------------------------
// /api/users  — gestion des comptes (réservé aux ADMIN). Stockés dans Supabase.
//
// GET    /api/users                → { ok, users: [{ username, name, admin, commercial }] }
// POST   /api/users  { username, password?, name?, admin?, commercial? }  → crée / met à jour
// DELETE /api/users?username=<u>   → supprime
//
// `commercial` = bloc/persona attribué à un compte NON admin : c'est le seul bloc
// qu'il voit et peut générer dans les espaces. Ignoré pour les admins (voient tout).
// ---------------------------------------------------------------------------

import { requireActiveAdmin, hashPassword } from '../lib/auth.js';
import { kvGet, kvList, kvSet, kvDel, isConfigured } from '../lib/store.js';
import { COMMERCIAL_KEYS } from '../lib/commercials/index.js';

export default async function handler(req, res) {
  const session = await requireActiveAdmin(req, res);
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
          commercial: (r.value && r.value.commercial) || '',
          role: (r.value && r.value.role) || '',
          bio: (r.value && r.value.bio) || '',
          verified: (r.value && r.value.verified) !== false,
        }))
        .sort((a, b) => a.username.localeCompare(b.username));
      return res.status(200).json({ ok: true, users });
    }

    if (req.method === 'POST') {
      let body = req.body;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
      const username = String((body && body.username) || '').trim().toLowerCase();
      const password = String((body && body.password) || '');

      // Approuver une demande d'inscription en attente (préserve tous les champs).
      if (body && body.action === 'approve') {
        if (!username) return res.status(400).json({ ok: false, error: 'Pseudo requis' });
        const rec = await kvGet(`user:${username}`);
        if (!rec) return res.status(404).json({ ok: false, error: 'Compte introuvable' });
        await kvSet(`user:${username}`, { ...rec, verified: true });
        return res.status(200).json({ ok: true, user: { username, verified: true } });
      }
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

      // Bloc/persona. Un persona statique choisi (ronan…) OU, par défaut, le bloc
      // PERSONNEL de l'utilisateur (clé = son pseudo). Absent du corps → conservé.
      let commercial;
      if (body && Object.prototype.hasOwnProperty.call(body, 'commercial')) {
        const c = String(body.commercial || '').trim().toLowerCase();
        commercial = COMMERCIAL_KEYS.includes(c) ? c : username; // vide/invalide → bloc perso
      } else {
        commercial = (existing && existing.commercial) || username;
      }

      // Rôle (métadonnée, ex. inscription self-service). Absent du corps → conservé.
      const role = (body && Object.prototype.hasOwnProperty.call(body, 'role'))
        ? String(body.role || '').trim()
        : ((existing && existing.role) || '');

      // Métadonnées conservées si non fournies (bio & état de vérification).
      const bio = (existing && existing.bio) || '';
      const verified = existing ? (existing.verified !== false) : true;

      // Nouveau mot de passe si fourni, sinon on conserve le hash existant.
      const hash = password ? hashPassword(password) : existing.hash;
      await kvSet(`user:${username}`, { hash, name, admin, commercial, role, bio, verified });
      return res.status(200).json({ ok: true, user: { username, name, admin, commercial, role } });
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
