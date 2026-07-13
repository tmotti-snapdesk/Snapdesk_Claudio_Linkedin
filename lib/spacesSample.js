// ---------------------------------------------------------------------------
// Jeu de données d'exemple (fallback) pour la mini app.
//
// Utilisé quand la variable d'environnement SHEET_CSV_URL n'est pas définie.
// Dès que tu publies ton Google Sheet en CSV et que tu renseignes SHEET_CSV_URL,
// ces données sont ignorées au profit des vraies lignes du Sheet.
//
// Chaque objet = une ligne du Sheet = un "espace".
// ---------------------------------------------------------------------------

export const SAMPLE_SPACES = [
  {
    id: 'loft-turbigo',
    espace: 'Loft Turbigo',
    localisation: '75002 · Étienne Marcel',
    prix: '18 400 €',
    postes: '46',
    superficie: '285 m²',
    disponibilite: 'DISPO',
    url: 'https://app.hubspot.com/…',
    description:
      "3ᵉ étage d'un immeuble de standing, baigné de lumière naturelle. 4 open spaces, 4 salles de réunion, cuisine ouverte, phonebooth, douche. Parking vélo à moins de 300 m.",
  },
  {
    id: 'canal-saint-martin',
    espace: 'Bureau Canal Saint-Martin',
    localisation: '75010 · République / Canal',
    prix: '9 600 €',
    postes: '24',
    superficie: '160 m²',
    disponibilite: 'DISPO',
    url: 'https://app.hubspot.com/…',
    description:
      "Bureau privatif installé dans l'ancien siège de la Lithographie Parisienne, entre le Faubourg du Temple et le Canal Saint-Martin. Lieu chargé d'histoire, très lumineux. Open space, salles de réunion, cuisine équipée, douche.",
  },
  {
    id: 'duplex-hauteville',
    espace: 'Duplex Hauteville',
    localisation: '75010 · Cité Paradis',
    prix: 'Sur demande',
    postes: '92',
    superficie: '2 plateaux climatisés',
    disponibilite: 'BIENTÔT',
    url: 'https://app.hubspot.com/…',
    description:
      "7ᵉ et 8ᵉ étages avec vue panoramique sur Paris. 6 terrasses, 2 douches, 4 open spaces et 8 salles de réunion. Jusqu'à 92 personnes. Prêt dans quelques semaines.",
  },
  {
    id: 'petites-ecuries',
    espace: 'Petites Écuries',
    localisation: '75010 · Bonne Nouvelle',
    prix: '7 200 €',
    postes: '24',
    superficie: '140 m²',
    disponibilite: 'DISPO',
    url: 'https://app.hubspot.com/…',
    description:
      "140 m² entièrement rénovés, baignés de lumière naturelle, à deux pas de Bonne Nouvelle. 1 open space, 1 salle de réunion + 1 phonebox duo, 1 cuisine conviviale, accès sécurisé 24/7. Calme et immédiatement opérationnel.",
  },
  {
    id: 'espace-iena',
    espace: 'Iéna',
    localisation: '75016 · Iéna',
    prix: '6 600 €',
    postes: '12',
    superficie: '80 m²',
    disponibilite: 'DISPO',
    url: 'https://app.hubspot.com/…',
    description: 'Bel espace lumineux proche métro Iéna, refait à neuf.',
  },
  {
    id: 'marais-bastille',
    espace: 'Bureaux Marais / Bastille',
    localisation: '75011 · Bastille',
    prix: '20 000 €',
    postes: '52',
    superficie: '3 open spaces',
    disponibilite: 'DISPO',
    url: 'https://app.hubspot.com/…',
    description:
      "Beaux volumes lumineux dans le 11ᵉ, à deux pas de Bastille et du Marais. 3 open spaces, 4 salles de réunion équipées, phonebooth, cuisine et espace déjeuner, douche. Clé-en-main avec Space Manager dédié.",
  },
];
