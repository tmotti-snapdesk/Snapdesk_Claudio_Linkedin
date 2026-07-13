// ---------------------------------------------------------------------------
// Authentification par login (pseudo + mot de passe) — compte unique.
//
// Les identifiants NE SONT PAS dans le code : ils vivent dans les variables
// d'environnement Vercel APP_USER / APP_PASSWORD. Un seul compte est possible ;
// il est impossible de se connecter autrement.
//
// Après login réussi, on émet un jeton signé (HMAC) sans dépendance externe.
// ---------------------------------------------------------------------------

import crypto from 'node:crypto';

// Durée de validité d'une session (12 h).
const TTL_MS = 12 * 60 * 60 * 1000;

// Secret de signature des jetons. Idéalement SESSION_SECRET (aléatoire) ;
// à défaut on dérive du mot de passe pour rester fonctionnel sans config extra.
function signingSecret() {
  return process.env.SESSION_SECRET || process.env.APP_PASSWORD || 'snapdesk-dev-secret';
}

// Comparaison à temps constant (évite les attaques temporelles), sûre si tailles ≠.
function safeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

export function isConfigured() {
  return Boolean(process.env.APP_USER && process.env.APP_PASSWORD);
}

/** Vérifie un couple (pseudo, mot de passe) contre l'unique compte configuré. */
export function checkCredentials(user, pass) {
  if (!isConfigured()) return false;
  // Pseudo insensible à la casse / espaces ; mot de passe strict.
  const okUser = safeEqual(
    String(user || '').trim().toLowerCase(),
    String(process.env.APP_USER).trim().toLowerCase()
  );
  const okPass = safeEqual(String(pass || ''), String(process.env.APP_PASSWORD));
  return okUser && okPass;
}

/** Émet un jeton de session signé pour l'utilisateur. */
export function issueToken(user) {
  const exp = Date.now() + TTL_MS;
  const payload = `${String(user).trim().toLowerCase()}|${exp}`;
  const sig = crypto.createHmac('sha256', signingSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`, 'utf8').toString('base64url');
}

/** Vérifie un jeton ; renvoie { user } si valide, sinon null. */
export function verifyToken(token) {
  try {
    if (!token) return null;
    const decoded = Buffer.from(String(token), 'base64url').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 3) return null;
    const [user, exp, sig] = parts;
    const expected = crypto.createHmac('sha256', signingSecret()).update(`${user}|${exp}`).digest('hex');
    if (!safeEqual(sig, expected)) return null;
    if (!Number(exp) || Date.now() > Number(exp)) return null;
    // Le jeton doit correspondre à l'unique compte configuré.
    if (isConfigured() && user !== String(process.env.APP_USER).trim().toLowerCase()) return null;
    return { user };
  } catch {
    return null;
  }
}

/** Extrait le jeton d'une requête (header Authorization: Bearer … ou x-session-token). */
export function tokenFromRequest(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return (req.headers['x-session-token'] || '').toString().trim();
}

/** Garde d'authentification pour un handler d'API. Renvoie true si la requête peut continuer. */
export function requireAuth(req, res) {
  if (!verifyToken(tokenFromRequest(req))) {
    res.status(401).json({ ok: false, error: 'Non authentifié', code: 'AUTH' });
    return false;
  }
  return true;
}
