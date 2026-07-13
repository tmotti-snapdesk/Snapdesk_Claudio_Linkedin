// ---------------------------------------------------------------------------
// Config de génération des posts LinkedIn pour RONAN.
//
// -> Passe `active` à true UNE FOIS que tu as rempli `toneOfVoice` + `template`.
// -> Tant que `active` est false, le backend renvoie un texte "à compléter"
//    (utile pour tester toute la chaîne Sheet → Vercel → Sheet sans consommer d'API).
// ---------------------------------------------------------------------------

export default {
  key: 'ronan',
  name: 'Ronan',

  // Passe à true quand son script est prêt :
  active: false,

  // Créativité (0 = très cadré, 1 = très libre). 0.7 est un bon départ pour du copywriting.
  temperature: 0.7,

  // ---- LE TONE OF VOICE de Ronan ---------------------------------------
  // Sa personnalité, sa façon d'écrire, son vocabulaire, ce qu'il aime / évite,
  // son niveau d'emojis, s'il tutoie/vouvoie, s'il signe, etc.
  toneOfVoice: ``,

  // ---- LE TEMPLATE / STRUCTURE de ses posts ----------------------------
  // La structure type : accroche, corps, appel à l'action, hashtags,
  // longueur cible, placement du lien Hubspot, etc.
  template: ``,

  // ---- (Optionnel) 1 à 3 vrais posts de Ronan pour caler le style (few-shot)
  examples: [],

  // ---- (Optionnel) consignes ponctuelles supplémentaires
  extraInstructions: ``,
};
