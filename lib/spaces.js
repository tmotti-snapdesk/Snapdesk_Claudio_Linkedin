// ---------------------------------------------------------------------------
// Lecture de la "BDD" des espaces = ton Google Sheet / Excel.
//
// Deux sources possibles :
//   1. SHEET_CSV_URL défini  -> on lit le Google Sheet publié en CSV (les vraies lignes).
//   2. sinon                 -> on retombe sur SAMPLE_SPACES (données d'exemple).
//
// Aucune dépendance npm : parsing CSV maison + fetch natif.
// ---------------------------------------------------------------------------

import { SAMPLE_SPACES } from './spacesSample.js';

// Normalise un libellé de colonne : minuscules, sans accents, espaces compactés.
function norm(s) {
  return String(s == null ? '' : s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Alias de colonnes acceptés dans le Sheet (ordre = priorité).
const HEADER_MAP = [
  { field: 'espace',        keys: ['espace', 'nom espace', 'nom de l espace', 'nom'] },
  { field: 'localisation',  keys: ['localisation', 'arrondissement', 'code postal', 'cp', 'quartier', 'adresse'] },
  { field: 'prix',          keys: ['prix', 'loyer', 'tarif'] },
  { field: 'postes',        keys: ['postes', 'nombre de postes', 'nb postes', 'capacite'] },
  { field: 'superficie',    keys: ['superficie', 'surface', 'm2'] },
  { field: 'disponibilite', keys: ['disponibilite', 'dispo'] },
  { field: 'url',           keys: ['url', 'lien', 'lien hubspot', 'hubspot', 'lien de visite'] },
  { field: 'description',   keys: ['description', 'descriptif', 'notes'] },
];

export function slugify(s) {
  return (
    norm(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 50) || 'espace'
  );
}

// Parseur CSV minimal gérant les guillemets, virgules et retours à la ligne échappés.
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(field); field = '';
    } else if (c === '\n') {
      row.push(field); rows.push(row); row = []; field = '';
    } else {
      field += c;
    }
  }
  // Dernier champ / dernière ligne
  if (field !== '' || row.length) { row.push(field); rows.push(row); }
  return rows;
}

// Transforme les lignes CSV brutes en objets "espace".
export function rowsToSpaces(rows) {
  if (!rows || !rows.length) return [];
  const header = rows[0].map(norm);

  const idx = {};
  for (const { field, keys } of HEADER_MAP) {
    const i = header.findIndex((h) => keys.some((k) => h === norm(k) || h.includes(norm(k))));
    if (i >= 0) idx[field] = i;
  }

  const out = [];
  for (let r = 1; r < rows.length; r++) {
    const cells = rows[r];
    if (!cells || cells.every((c) => String(c).trim() === '')) continue;

    const sp = {};
    for (const { field } of HEADER_MAP) {
      sp[field] = idx[field] != null ? String(cells[idx[field]] ?? '').trim() : '';
    }
    if (!sp.espace) continue; // ligne sans nom d'espace = ignorée
    sp.id = `${slugify(sp.espace)}-${r}`;
    out.push(sp);
  }
  return out;
}

/**
 * Retourne { source, spaces }.
 * source = 'sheet' (vraies données) ou 'sample' (données d'exemple).
 */
export async function getSpaces() {
  const url = process.env.SHEET_CSV_URL;
  if (url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`SHEET_CSV_URL : HTTP ${res.status}`);
    const text = await res.text();
    return { source: 'sheet', spaces: rowsToSpaces(parseCsv(text)) };
  }
  return {
    source: 'sample',
    spaces: SAMPLE_SPACES.map((s, i) => ({ ...s, id: s.id || `${slugify(s.espace)}-${i}` })),
  };
}
