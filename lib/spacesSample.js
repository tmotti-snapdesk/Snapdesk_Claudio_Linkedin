// ---------------------------------------------------------------------------
// Jeu de données de secours (fallback) pour la mini app.
//
// Reprend le catalogue réel du Google Sheet Snapdesk (au moment de la mise à
// jour). Utilisé UNIQUEMENT quand SHEET_CSV_URL n'est pas défini.
//
// 👉 Pour des données toujours à jour, publie le Google Sheet en CSV et
//    renseigne SHEET_CSV_URL (voir README §1bis). L'app lira alors le Sheet en
//    direct, colonnes : URL Hubspot | Localisation | Espace | Prix | Postes |
//    Superficies | Disponibilité | Description.
//
// Chaque objet = une ligne du Sheet = un "espace".
// ---------------------------------------------------------------------------

export const SAMPLE_SPACES = [
  { id: 'sous-loc-iena-12', espace: 'Sous loc Iéna', localisation: '75016', prix: '6 600 €', postes: '12', superficie: '', disponibilite: 'DISPO', url: 'https://hubs.ly/Q04jlpRJ0', description: "Bureaux opérés Snapdesk à Paris 75016, pour 12 postes. 6 600 €/mois, disponible immédiatement." },
  { id: 'jasmin-16', espace: 'Jasmin', localisation: '75016', prix: '7 000 €', postes: '16', superficie: '78 m²', disponibilite: '', url: '', description: "Bureaux opérés Snapdesk à Paris 75016. 78 m², 16 postes, 7 000 €/mois." },
  { id: '11-rue-aux-ours', espace: '11 rue aux Ours', localisation: '75003', prix: '8 000 €', postes: '16', superficie: '80 m²', disponibilite: 'DISPO', url: 'https://hubs.ly/Q04bBjpC0', description: "Superbes bureaux opérés Snapdesk au 11 rue aux Ours, cœur du 3e (75003). 80 m² optimisés, 16 postes, 8 000 €/mois, disponible immédiatement." },
  { id: 'jasmin-18', espace: 'Jasmin', localisation: '75016', prix: '8 100 €', postes: '18', superficie: '117 m²', disponibilite: 'DISPO', url: 'https://hubs.ly/Q047hK1k0', description: "Jasmin — superbes bureaux opérés Snapdesk à Paris 75016. 117 m², 18 postes, 8 100 €/mois, disponible immédiatement." },
  { id: 'ribot', espace: 'Ribot', localisation: '75017', prix: '12 500 €', postes: '22', superficie: '', disponibilite: '', url: '', description: "Bureaux opérés Snapdesk à Paris 75017. 22 postes, 12 500 €/mois." },
  { id: 'antin-3g', espace: 'Antin 3G', localisation: '75002', prix: '13 500 €', postes: '20', superficie: '126 m²', disponibilite: 'octobre 26', url: 'https://hubs.ly/Q04nLRKy0', description: "Bureaux opérés Snapdesk à Paris 75002. 126 m², 20 postes, 13 500 €/mois, disponible à partir d'octobre 2026." },
  { id: 'sous-loc-iena-24', espace: 'Sous loc Iéna', localisation: '75016', prix: '13 200 €', postes: '24', superficie: '', disponibilite: 'DISPO', url: 'https://hubs.ly/Q04jlpRJ0', description: "Bureaux opérés Snapdesk à Paris 75016, pour 24 postes. 13 200 €/mois, disponible immédiatement." },
  { id: '55-ecuries', espace: '55 Écuries', localisation: '75010', prix: '13 900 €', postes: '24', superficie: '132 m²', disponibilite: 'DISPO', url: 'https://hubs.ly/Q047hK8T0', description: "Bureaux opérés Snapdesk à Paris 75010. 132 m², 24 postes, 13 900 €/mois, disponible immédiatement." },
  { id: '102-reaumur', espace: '102 Réaumur', localisation: '75002', prix: '14 900 €', postes: '24', superficie: '130 m²', disponibilite: 'DISPO', url: 'https://hubs.ly/Q047ymB20', description: "Espace exceptionnel de bureaux opérés Snapdesk au cœur du 75002. 130 m², 24 postes, 14 900 €/mois, disponible immédiatement." },
  { id: 'barbes-marcadet', espace: 'Barbès-Marcadet', localisation: '75018', prix: '16 000 €', postes: '42', superficie: '225 m²', disponibilite: 'DISPO', url: 'https://hubs.ly/Q047ymLp0', description: "Bureaux opérés Snapdesk à Paris 75018. 225 m², 42 postes, 16 000 €/mois, disponible immédiatement." },
  { id: '10-mont-thabor', espace: '10 Mont Thabor', localisation: '75001', prix: '18 900 €', postes: '28', superficie: '190 m²', disponibilite: '', url: 'https://hubs.ly/Q04fPVX60', description: "Superbes bureaux opérés Snapdesk au cœur du 75001. 190 m², 28 postes, 18 900 €/mois." },
  { id: 'ponthieu', espace: 'Ponthieu', localisation: '75008', prix: '19 650 €', postes: '30', superficie: '170 m²', disponibilite: 'janvier 2027', url: 'https://hubs.ly/Q04nLVQw0', description: "Bureaux opérés Snapdesk à Paris 75008. 170 m², 30 postes, 19 650 €/mois, disponible en janvier 2027." },
  { id: 'sous-loc-iena-36', espace: 'Sous loc Iéna', localisation: '75016', prix: '19 800 €', postes: '36', superficie: '', disponibilite: 'DISPO', url: 'https://hubs.ly/Q04jlpRJ0', description: "Bureaux opérés Snapdesk à Paris 75016, pour 36 postes. 19 800 €/mois, disponible immédiatement." },
  { id: 'bergere-r2', espace: 'Bergère R+2', localisation: '75009', prix: '19 900 €', postes: '32', superficie: '190 m²', disponibilite: 'DISPO', url: 'https://hubs.ly/Q047hJRR0', description: "Bureaux opérés Snapdesk à Paris 75009. 190 m², 32 postes, 19 900 €/mois, disponible immédiatement." },
  { id: '63-sabin', espace: '63 Sabin', localisation: '75011', prix: '25 900 €', postes: '52', superficie: '357 m²', disponibilite: '16/07/2026', url: 'https://hubs.ly/Q047yp4T0', description: "Bureaux opérés Snapdesk à Paris 75011. 357 m², 52 postes, 25 900 €/mois, disponible dès le 16/07/2026." },
  { id: 'breguet-r2', espace: 'Bréguet R+2', localisation: '75011', prix: '28 000 €', postes: '48', superficie: '344 m²', disponibilite: 'DISPO', url: 'https://hubs.ly/Q047ylxl0', description: "Superbe espace de bureaux opérés Snapdesk de 344 m² à Paris 75011. 48 postes, 28 000 €/mois, disponible immédiatement." },
  { id: '30-boetie', espace: '30 Boétie', localisation: '75008', prix: '49 900 €', postes: '72', superficie: '500 m²', disponibilite: '30/06/2026', url: 'https://hubs.ly/Q04cXz9L0', description: "Superbe espace de bureaux opérés Snapdesk à Paris 75008. 500 m², 72 postes, 49 900 €/mois, disponible dès le 30/06/2026." },
  { id: '197-malesherbes', espace: '197 Malesherbes', localisation: '75017', prix: '51 800 €', postes: '74', superficie: '569 m²', disponibilite: 'APRES ACCORD', url: 'https://5180714.fs1.hubspotusercontent-na1.net/hubfs/5180714/202603%20-%20Pr%C3%A9sentation%20commerciale%20-%20Espace%20197%20Bd%20Malesherbes%20(1).pdf', description: "Bureaux opérés Snapdesk à Paris 75017. 569 m², 74 postes, 51 800 €/mois, disponible après accord." },
  { id: '62-hauteville', espace: '62 Hauteville R+7/8', localisation: '75010', prix: '67 000 €', postes: '92', superficie: '651 m²', disponibilite: 'DISPO', url: 'https://hubs.ly/Q04cXyGK0', description: "Espace exceptionnel de bureaux opérés Snapdesk de 651 m² à Paris 75010. 92 postes, 67 000 €/mois, disponible immédiatement." },
  { id: '131-aboukir', espace: '131 Aboukir', localisation: '75002', prix: '75 600 €', postes: '90', superficie: '704 m²', disponibilite: 'APRES ACCORD', url: 'https://hubs.ly/Q04fN48t0', description: "Bureaux opérés Snapdesk de 704 m² à Paris 75002. 90 postes, 75 600 €/mois, disponible après accord." },
  { id: '2-breguet', espace: '2 Bréguet', localisation: '75011', prix: '105 000 €', postes: '168', superficie: '1 405 m²', disponibilite: '01/10/2026', url: 'https://hubs.ly/Q04cXzDg0', description: "Superbe espace de bureaux opérés Snapdesk de 1 405 m² à Paris 75011. 168 postes, 105 000 €/mois, disponible dès le 01/10/2026." },
];
