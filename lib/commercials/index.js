import ronan from './ronan.js';
import melanie from './melanie.js';
import florian from './florian.js';
import thomas from './thomas.js';

// L'ordre ici définit l'ordre par défaut de génération et des colonnes de sortie.
export const COMMERCIALS = { ronan, melanie, florian, thomas };

// Liste ordonnée des clés (ronan, melanie, florian, thomas)
export const COMMERCIAL_KEYS = Object.keys(COMMERCIALS);

export function getCommercial(key) {
  return COMMERCIALS[String(key || '').toLowerCase()] || null;
}
