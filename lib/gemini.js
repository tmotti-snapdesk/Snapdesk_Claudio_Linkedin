// ---------------------------------------------------------------------------
// Appel de l'API Google Gemini (generateContent) via fetch natif — aucune
// dépendance npm. Même interface que lib/anthropic.js : { MODEL, generatePost }.
// ---------------------------------------------------------------------------

import { buildMessages } from './prompt.js';

// Modèle par défaut : gemini-2.5-flash-lite (disponible en offre gratuite, rapide,
// économique). Surchargeable via la variable d'env MODEL (ex. gemini-flash-latest,
// gemini-2.0-flash… selon les quotas de ta clé).
export const MODEL = process.env.MODEL || 'gemini-2.5-flash-lite';

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const API_VERSION = '2023-06-01'; // non utilisé par Gemini, conservé pour cohérence

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Construit le corps de requête Gemini à partir du format interne
 * ({ system, messages: [{ role: 'user'|'assistant', content }] }).
 * Exporté pour permettre les tests unitaires.
 */
export function buildGeminiBody({ system, messages, maxTokens = 1500, temperature = 0.7 }) {
  const body = {
    contents: messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })),
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  };
  if (system && String(system).trim()) {
    body.system_instruction = { parts: [{ text: system }] };
  }
  return body;
}

export async function callGemini({ system, messages, maxTokens = 1500, temperature = 0.7 }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY manquante (à définir dans les env vars Vercel).');

  const url = `${API_BASE}/${encodeURIComponent(MODEL)}:generateContent`;
  const body = JSON.stringify(buildGeminiBody({ system, messages, maxTokens, temperature }));

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body,
      });

      // Erreurs transitoires : on retente
      if (res.status === 429 || res.status >= 500) {
        lastError = new Error(`API Gemini ${res.status}`);
        await sleep(600 * (attempt + 1));
        continue;
      }

      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`API Gemini ${res.status} : ${txt.slice(0, 300)}`);
      }

      const data = await res.json();

      // Contenu bloqué (sécurité) ?
      if (data.promptFeedback && data.promptFeedback.blockReason) {
        throw new Error(`Requête bloquée par Gemini (${data.promptFeedback.blockReason}).`);
      }

      const candidate = (data.candidates || [])[0];
      const parts = (candidate && candidate.content && candidate.content.parts) || [];
      const text = parts
        .filter((p) => typeof p.text === 'string')
        .map((p) => p.text)
        .join('\n')
        .trim();

      if (!text) {
        const reason = candidate && candidate.finishReason ? ` (finishReason: ${candidate.finishReason})` : '';
        throw new Error(`Réponse vide de Gemini${reason}.`);
      }
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
  return callGemini({
    system,
    messages,
    temperature: typeof commercial.temperature === 'number' ? commercial.temperature : 0.7,
  });
}
