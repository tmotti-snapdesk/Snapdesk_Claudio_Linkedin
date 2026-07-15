// ---------------------------------------------------------------------------
// Stockage partagé (Supabase / PostgREST) — clé-valeur.
//
// Table attendue :
//   create table snapdesk_state (
//     key text primary key,
//     value jsonb not null,
//     updated_at timestamptz not null default now()
//   );
//
// Config via env (côté serveur uniquement) :
//   SUPABASE_URL                 = https://xxxx.supabase.co
//   SUPABASE_SERVICE_ROLE_KEY    = clé "service_role" (secrète, jamais exposée au navigateur)
//
// Aucune dépendance npm : appels REST via fetch natif.
// ---------------------------------------------------------------------------

const TABLE = 'snapdesk_state';

export function isConfigured() {
  return !!(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function cfg() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Stockage partagé non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).');
  return { base: `${url.replace(/\/$/, '')}/rest/v1/${TABLE}`, key };
}

function headers(key, extra) {
  return Object.assign(
    { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    extra || {}
  );
}

/** Lit une clé → renvoie la valeur (objet) ou null. */
export async function kvGet(k) {
  const { base, key } = cfg();
  const res = await fetch(`${base}?key=eq.${encodeURIComponent(k)}&select=value`, { headers: headers(key) });
  if (!res.ok) throw new Error(`store get ${res.status}`);
  const rows = await res.json();
  return rows.length ? rows[0].value : null;
}

/** Liste toutes les clés commençant par `prefix` → [{ key, value }]. */
export async function kvList(prefix) {
  const { base, key } = cfg();
  const res = await fetch(`${base}?key=like.${encodeURIComponent(prefix + '*')}&select=key,value`, { headers: headers(key) });
  if (!res.ok) throw new Error(`store list ${res.status}`);
  return await res.json();
}

/** Upsert (insert ou update) une clé. */
export async function kvSet(k, value) {
  const { base, key } = cfg();
  const res = await fetch(base, {
    method: 'POST',
    headers: headers(key, { Prefer: 'resolution=merge-duplicates' }),
    body: JSON.stringify([{ key: k, value }]),
  });
  if (!res.ok) throw new Error(`store set ${res.status} : ${(await res.text()).slice(0, 150)}`);
}

/** Supprime une clé. */
export async function kvDel(k) {
  const { base, key } = cfg();
  const res = await fetch(`${base}?key=eq.${encodeURIComponent(k)}`, { method: 'DELETE', headers: headers(key) });
  if (!res.ok) throw new Error(`store del ${res.status}`);
}
