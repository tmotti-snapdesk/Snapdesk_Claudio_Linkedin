// ---------------------------------------------------------------------------
// POST /api/signup   (inscription en self-service, avec validation par un admin)
//
// N'IMPORTE QUI avec une adresse e-mail @snapdesk.co peut demander un compte.
//   body { firstName, lastName, email, password, role, bio? }
//   → crée user:<email> dans Supabase (mot de passe HACHÉ), NON admin,
//     EN ATTENTE (verified:false) : la connexion est bloquée tant qu'un admin
//     n'a pas approuvé la demande depuis la page Utilisateurs.
//
// Garde-fous : e-mail obligatoirement @snapdesk.co ; jamais admin ; refuse si
// le compte existe déjà (ou s'il s'agit du compte maître).
// ---------------------------------------------------------------------------

import { hashPassword } from '../lib/auth.js';
import { kvGet, kvSet, isConfigured } from '../lib/store.js';

export const ROLES = ['Marketing', 'Sales', 'Product Manager', 'Facility Manager', 'Architecte', 'Sourcing'];

const EMAIL_RE = /^[a-z0-9][a-z0-9._+-]*@snapdesk\.co$/;
const MIN_PASSWORD = 8;
const MAX_BIO = 4000;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Méthode non autorisée' });
  }

  if (!isConfigured()) {
    return res.status(500).json({
      ok: false,
      error: 'Inscription indisponible : stockage partagé (Supabase) non configuré.',
      code: 'NO_STORE',
    });
  }

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }

  const firstName = String((body && body.firstName) || '').trim();
  const lastName = String((body && body.lastName) || '').trim();
  const email = String((body && body.email) || '').trim().toLowerCase();
  const password = String((body && body.password) || '');
  const role = String((body && body.role) || '').trim();
  const bio = String((body && body.bio) || '').trim().slice(0, MAX_BIO);

  if (!firstName || !lastName) return res.status(400).json({ ok: false, error: 'Prénom et nom requis.' });
  if (!EMAIL_RE.test(email)) return res.status(400).json({ ok: false, error: 'Une adresse e-mail @snapdesk.co est requise.' });
  if (password.length < MIN_PASSWORD) return res.status(400).json({ ok: false, error: `Mot de passe : ${MIN_PASSWORD} caractères minimum.` });
  if (!ROLES.includes(role)) return res.status(400).json({ ok: false, error: 'Rôle invalide.' });

  // Ne jamais permettre de créer / écraser le compte maître (admin de secours).
  if (process.env.APP_USER && email === String(process.env.APP_USER).trim().toLowerCase()) {
    return res.status(409).json({ ok: false, error: 'Ce compte existe déjà. Connecte-toi.' });
  }

  try {
    const existing = await kvGet(`user:${email}`);
    if (existing) {
      const pendingMsg = existing.verified === false
        ? 'Une demande est déjà en attente pour cet e-mail. Un admin doit la valider.'
        : 'Un compte existe déjà avec cet e-mail. Connecte-toi.';
      return res.status(409).json({ ok: false, error: pendingMsg });
    }

    const name = `${firstName} ${lastName}`.trim();
    // Chaque utilisateur a SON PROPRE bloc : la clé du bloc = son e-mail. Sa voix
    // dérive de son rôle (style) + sa bio (au moment de la génération).
    const commercial = email;
    // Compte EN ATTENTE : un admin doit l'approuver (verified:true) pour l'activer.
    await kvSet(`user:${email}`, { hash: hashPassword(password), name, admin: false, commercial, role, bio, verified: false });

    return res.status(200).json({ ok: true, pending: true, email });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
