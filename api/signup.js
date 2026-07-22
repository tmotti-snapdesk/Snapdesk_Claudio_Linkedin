// ---------------------------------------------------------------------------
// POST /api/signup   (inscription en self-service)
//
// N'IMPORTE QUI avec une adresse e-mail @snapdesk.co peut créer un compte.
//   body { firstName, lastName, email, password, role, bio? }
//   → crée user:<email> dans Supabase (mot de passe HACHÉ), NON admin,
//     sans bloc attribué (un admin lui associera son persona ensuite).
//
// Vérification e-mail (Resend) :
//   - si RESEND_API_KEY est configuré : le compte est créé "non vérifié",
//     un e-mail de validation est envoyé, et la connexion est bloquée tant
//     que l'adresse n'est pas confirmée (→ réponse { ok, pending:true }).
//   - sinon : le compte est actif immédiatement (auto-connexion, jeton renvoyé).
//
// Garde-fous : e-mail obligatoirement @snapdesk.co ; jamais admin ; refuse si
// le compte existe déjà (ou s'il s'agit du compte maître).
// ---------------------------------------------------------------------------

import { issueToken, hashPassword, issueEmailToken } from '../lib/auth.js';
import { kvGet, kvSet, isConfigured } from '../lib/store.js';
import { emailConfigured, sendEmail, verificationEmailHtml } from '../lib/email.js';

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
      return res.status(409).json({ ok: false, error: 'Un compte existe déjà avec cet e-mail. Connecte-toi.' });
    }

    const name = `${firstName} ${lastName}`.trim();
    const mustVerify = emailConfigured();
    const record = { hash: hashPassword(password), name, admin: false, commercial: '', role, bio, verified: !mustVerify };
    await kvSet(`user:${email}`, record);

    // Vérification par e-mail (Resend) si configuré.
    if (mustVerify) {
      const token = issueEmailToken(email);
      const proto = (req.headers['x-forwarded-proto'] || 'https').toString().split(',')[0];
      const host = (req.headers['x-forwarded-host'] || req.headers.host || '').toString();
      const origin = process.env.SITE_URL || (host ? `${proto}://${host}` : '');
      const link = `${origin}/verify.html?token=${encodeURIComponent(token)}`;
      try {
        await sendEmail({
          to: email,
          subject: 'Active ton compte Snapdesk',
          html: verificationEmailHtml({ name, link }),
        });
      } catch (mailErr) {
        // L'e-mail n'est pas parti : on supprime le compte à moitié créé pour
        // permettre une nouvelle tentative, et on remonte une erreur claire.
        return res.status(502).json({ ok: false, error: "Compte créé mais l'e-mail de vérification n'a pas pu être envoyé. Réessaie ou contacte un admin. (" + mailErr.message + ')' });
      }
      return res.status(200).json({ ok: true, pending: true, email });
    }

    // Pas de vérification e-mail configurée → compte actif, auto-connexion.
    return res.status(200).json({ ok: true, token: issueToken(email, false, ''), user: email, admin: false, name, role });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message || String(err) });
  }
}
