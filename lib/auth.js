// ---------------------------------------------------------------------------
// Authentification par login (pseudo + mot de passe).
//
// Multi-utilisateurs : les comptes sont stockés dans Supabase (clé user:<pseudo>,
// mot de passe HACHÉ). Le compte APP_USER / APP_PASSWORD de Vercel reste un
// "compte maître" (admin de secours) pour démarrer et gérer les autres.
//
// Après login réussi, on émet un jeton signé (HMAC) qui porte le pseudo + le rôle.
// Aucune dépendance externe.
// ---------------------------------------------------------------------------

import crypto from 'node:crypto';

// Durée de validité d'une session (12 h).
const TTL_MS = 12 * 60 * 60 * 1000;

function signingSecret() {
  return process.env.SESSION_SECRET || process.env.APP_PASSWORD || 'snapdesk-dev-secret';
}

// Comparaison à temps constant (sûre si tailles ≠).
function safeEqual(a, b) {
  const ba = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return crypto.timingSafeEqual(ba, bb);
}

// Le compte maître (bootstrap) est-il configuré côté Vercel ?
export function isConfigured() {
  return Boolean(process.env.APP_USER && process.env.APP_PASSWORD);
}

/** Vérifie le couple (pseudo, mot de passe) contre le compte maître Vercel. */
export function checkCredentials(user, pass) {
  if (!isConfigured()) return false;
  const okUser = safeEqual(
    String(user || '').trim().toLowerCase(),
    String(process.env.APP_USER).trim().toLowerCase()
  );
  const okPass = safeEqual(String(pass || ''), String(process.env.APP_PASSWORD));
  return okUser && okPass;
}

// ---- Hachage des mots de passe (scrypt, natif) ----
export function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(String(pw), salt, 32);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}
export function verifyPassword(pw, stored) {
  try {
    const [scheme, saltHex, hashHex] = String(stored).split('$');
    if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
    const expected = Buffer.from(hashHex, 'hex');
    const got = crypto.scryptSync(String(pw), Buffer.from(saltHex, 'hex'), expected.length);
    return got.length === expected.length && crypto.timingSafeEqual(got, expected);
  } catch {
    return false;
  }
}

/** Émet un jeton de session signé pour l'utilisateur (avec son rôle admin). */
export function issueToken(user, admin = false) {
  const exp = Date.now() + TTL_MS;
  const u = String(user).trim().toLowerCase();
  const a = admin ? '1' : '0';
  const payload = `${u}|${a}|${exp}`;
  const sig = crypto.createHmac('sha256', signingSecret()).update(payload).digest('hex');
  return Buffer.from(`${payload}|${sig}`, 'utf8').toString('base64url');
}

/** Vérifie un jeton ; renvoie { user, admin } si valide, sinon null. */
export function verifyToken(token) {
  try {
    if (!token) return null;
    const decoded = Buffer.from(String(token), 'base64url').toString('utf8');
    const parts = decoded.split('|');
    if (parts.length !== 4) return null;
    const [user, admin, exp, sig] = parts;
    const expected = crypto.createHmac('sha256', signingSecret()).update(`${user}|${admin}|${exp}`).digest('hex');
    if (!safeEqual(sig, expected)) return null;
    if (!Number(exp) || Date.now() > Number(exp)) return null;
    return { user, admin: admin === '1' };
  } catch {
    return null;
  }
}

/** Extrait le jeton d'une requête. */
export function tokenFromRequest(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'] || '';
  if (typeof auth === 'string' && auth.startsWith('Bearer ')) return auth.slice(7).trim();
  return (req.headers['x-session-token'] || '').toString().trim();
}

/** Garde d'authentification. Renvoie l'objet session, ou false (et répond 401). */
export function requireAuth(req, res) {
  const session = verifyToken(tokenFromRequest(req));
  if (!session) {
    res.status(401).json({ ok: false, error: 'Non authentifié', code: 'AUTH' });
    return false;
  }
  return session;
}

/** Garde "admin". Renvoie la session admin, ou false (401/403). */
export function requireAdmin(req, res) {
  const session = verifyToken(tokenFromRequest(req));
  if (!session) {
    res.status(401).json({ ok: false, error: 'Non authentifié', code: 'AUTH' });
    return false;
  }
  if (!session.admin) {
    res.status(403).json({ ok: false, error: 'Réservé aux administrateurs', code: 'ADMIN' });
    return false;
  }
  return session;
}
