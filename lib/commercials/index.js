import ronan from './ronan.js';
import cyril from './cyril.js';
import melanie from './melanie.js';
import florian from './florian.js';
import thomas from './thomas.js';
import snapdesk from './snapdesk.js';

// L'ordre ici définit l'ordre par défaut de génération et des colonnes de sortie.
export const COMMERCIALS = { ronan, cyril, melanie, florian, thomas, snapdesk };

// Liste ordonnée des clés (ronan, cyril, melanie, florian, thomas, snapdesk)
export const COMMERCIAL_KEYS = Object.keys(COMMERCIALS);

export function getCommercial(key) {
  return COMMERCIALS[String(key || '').toLowerCase()] || null;
}
