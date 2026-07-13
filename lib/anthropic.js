// ---------------------------------------------------------------------------
// Appel de l'API Anthropic (Messages) via fetch natif — aucune dépendance npm.
// ---------------------------------------------------------------------------

import { buildMessages } from './prompt.js';

export const MODEL = process.env.MODEL || 'claude-sonnet-5';

const API_URL = 'https://api.anthropic.com/v1/messages';
const API_VERSION = '2023-06-01';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function callClaude({ system, messages, maxTokens = 1500, temperature = 0.7 }) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquante (à définir dans les env vars Vercel).');

  const body = JSON.stringify({
    model: MODEL,
    max_tokens: maxTokens,
    temperature,
    system,
    messages,
  });

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': API_VERSION,
        },
        body,
      });

      // Erreurs transitoires : on retente
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`API Anthropic ${res.status}`);
        await sleep(600 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API Anthropic ${res.status} : ${txt.slice(0, 300)}`);
      }

      const data = await res.json();
      const text = (data.content || [])
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();

      if (!text) throw new Error('Réponse vide de l\u2019API.');
      return text;
    } catch (err) {
      lastError = err;
      if (attempt === 2) throw err;
      await sleep(500 * (attempt + 1));
    }
  }
  throw lastError;
}

/**
 * Génère le post LinkedIn d'un commercial pour un espace.
 */
export async function generatePost(commercial, space) {
  const { system, messages } = buildMessages(commercial, space);
  return callClaude({
    system,
    messages,
    temperature: typeof commercial.temperature === 'number' ? commercial.temperature : 0.7,
  });
}
