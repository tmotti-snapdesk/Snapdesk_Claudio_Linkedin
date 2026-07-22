// ---------------------------------------------------------------------------
// Envoi d'e-mails via Resend (https://resend.com) — API REST, aucune dépendance.
//
// Config (côté serveur uniquement, jamais commit) :
//   RESEND_API_KEY   = clé API Resend (secrète)
//   RESEND_FROM      = expéditeur, ex. "Snapdesk <no-reply@snapdesk.co>"
//                      (par défaut "Snapdesk <onboarding@resend.dev>", qui, en
//                      mode test Resend, ne peut écrire qu'au propriétaire du
//                      compte Resend — vérifie ton domaine pour écrire à tous).
// ---------------------------------------------------------------------------

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export function emailConfigured() {
  return !!process.env.RESEND_API_KEY;
}

/** Envoie un e-mail. Lève une erreur si la clé manque ou si Resend renvoie une erreur. */
export async function sendEmail({ to, subject, html }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error('RESEND_API_KEY manquant');
  const from = process.env.RESEND_FROM || 'Snapdesk <onboarding@resend.dev>';

  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${detail.slice(0, 200)}`);
  }
  return res.json().catch(() => ({}));
}

/** Gabarit HTML de l'e-mail de vérification. */
export function verificationEmailHtml({ name, link }) {
  const hi = name ? `Bonjour ${escapeHtml(name)},` : 'Bonjour,';
  return `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;color:#2b2e2b;">
    <h2 style="color:#2b2e2b;margin:0 0 12px;">Confirme ton adresse e-mail</h2>
    <p style="font-size:15px;line-height:1.6;">${hi}</p>
    <p style="font-size:15px;line-height:1.6;">Bienvenue sur le générateur de posts LinkedIn de Snapdesk. Clique sur le bouton ci-dessous pour activer ton compte :</p>
    <p style="margin:24px 0;">
      <a href="${link}" style="background:#aabcb7;color:#223028;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:10px;display:inline-block;">Activer mon compte</a>
    </p>
    <p style="font-size:13px;color:#8a8e86;line-height:1.6;">Si le bouton ne fonctionne pas, copie ce lien dans ton navigateur :<br><a href="${link}" style="color:#5e7a6f;">${link}</a></p>
    <p style="font-size:13px;color:#8a8e86;">Ce lien expire dans 24 h. Si tu n'es pas à l'origine de cette demande, ignore cet e-mail.</p>
  </div>`;
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}
