// ---------------------------------------------------------------------------
// Construction du prompt envoyé à Claude pour UN commercial et UN espace.
// ---------------------------------------------------------------------------

// Ton / structure génériques utilisés tant qu'un commercial n'a pas encore
// son propre `toneOfVoice` / `template`. Quand tu remplis le fichier d'un
// commercial, ses valeurs remplacent ces défauts.
const DEFAULT_TONE = `
Écris à la première personne, comme un commercial de Snapdesk enthousiaste et
professionnel qui présente un espace à louer. Ton chaleureux mais crédible, pas
"markéteux". Quelques emojis pertinents (2 à 4 max), jamais à outrance.
`.trim();

const DEFAULT_TEMPLATE = `
Structure attendue :
1. Une accroche courte qui donne envie (1 phrase).
2. 2 à 4 phrases qui mettent en avant l'espace : quartier/adresse, nombre de
   postes, superficie, disponibilité — de façon fluide, pas en liste brute.
3. Un appel à l'action clair (prise de contact / visite).
4. Le lien Hubspot s'il est fourni.
5. 3 à 5 hashtags pertinents (#bureaux #flexoffice #Paris #Snapdesk ...).
Longueur cible : 80 à 150 mots. Format LinkedIn natif (retours à la ligne aérés).
`.trim();

function clean(v) {
  return v == null ? '' : String(v).trim();
}

function formatSpace(s) {
  const rows = [
    ['Nom de l\u2019espace', s.espace],
    ['Localisation (arrondissement/CP)', s.localisation],
    ['Nombre de postes', s.postes],
    ['Superficie', s.superficie],
    ['Disponibilité', s.disponibilite],
    ['Lien Hubspot', s.url],
  ].filter(([, v]) => clean(v) !== '');

  let out = 'Informations sur l\u2019espace :\n' +
    rows.map(([k, v]) => `- ${k} : ${clean(v)}`).join('\n');

  if (clean(s.description) !== '') {
    out += `\n\nDescription existante (matière première — reformule-la avec le ton du commercial, ne la recopie pas telle quelle) :\n"""\n${clean(s.description)}\n"""`;
  }

  if (clean(s.hubspotContext) !== '') {
    out += `\n\n=== Informations issues de la fiche Hubspot de l'espace (SOURCE À PRIVILÉGIER) ===\n` +
      `Ce sont les infos les plus riches et à jour sur ce lieu. Appuie-toi EN PRIORITÉ dessus pour rédiger ` +
      `(équipements, services, ambiance, quartier, atouts…), tout en restant factuel. Reformule avec le ton du ` +
      `commercial, ne recopie pas mot à mot, et n'invente rien qui ne soit ni ici ni dans les champs ci-dessus :\n"""\n${clean(s.hubspotContext)}\n"""`;
  }
  return out;
}

/**
 * @param {object} commercial - config depuis lib/commercials/*.js
 * @param {object} space - { url, localisation, espace, prix, postes, superficie, disponibilite, description }
 * @returns {{ system: string, messages: Array<{role: string, content: string}> }}
 */
export function buildMessages(commercial, space) {
  const tone = clean(commercial.toneOfVoice) || DEFAULT_TONE;
  const template = clean(commercial.template) || DEFAULT_TEMPLATE;
  const extra = clean(commercial.extraInstructions);

  const isGeneral = !!(space && space.general);

  // Règles communes aux deux modes (espace / général).
  const baseRules = [
    `- Français, prêt à copier-coller, sans balises ni guillemets autour du post.`,
    `- NE MENS JAMAIS et n'invente aucune donnée : pas de statistique, de pourcentage, de date, de nom d'étude ni de fait non vérifié.`,
    `- NE MENTIONNE JAMAIS de prix, de loyer ou de tarif.`,
    `- Pas de promesses irréalistes ni de superlatifs vides à la chaîne.`,
  ];
  // Règles spécifiques au mode "espace".
  const spaceRules = [
    `- L'espace fourni est TOUJOURS le sujet central du post : ta différence tient à ton angle propre, pas au sujet.`,
    `- Mets en avant AU MAXIMUM les atouts concrets du lieu : nombre d'open spaces, nombre de salles de réunion, présence d'une salle détente, d'un espace informel / de convivialité, cuisine, terrasse, douche, luminosité, quartier… — mais UNIQUEMENT ce qui est réellement mentionné (fiche Hubspot ou champs fournis).`,
    `- La fiche Hubspot est ta source de vérité : appuie-toi dessus et n'écris rien qui la contredise.`,
    `- N'évoque JAMAIS d'"impression illimitée" / "impressions illimitées" : ce service n'existe pas chez Snapdesk.`,
    `- Si une info manque, ne l'invente pas et n'écris pas "non communiqué" : contourne naturellement.`,
  ];
  // Note spécifique au mode "général".
  const generalRules = [
    `- Ce post est GÉNÉRAL : il n'est lié à AUCUN espace précis. Ne décris pas un bureau en particulier et n'invente pas d'espace, d'adresse ou de caractéristiques.`,
  ];

  const system = [
    commercial.isBrand
      ? `Tu rédiges un post LinkedIn en français pour le COMPTE OFFICIEL de Snapdesk (l'entreprise elle-même : bureaux opérés / flex office à Paris).`
      : `Tu rédiges un post LinkedIn en français pour ${commercial.name}, commercial chez Snapdesk (bureaux opérés / flex office à Paris).`,
    commercial.isBrand
      ? `Le post est publié depuis la page entreprise Snapdesk : écris au nom de la marque, à la première personne du PLURIEL ("nous", "on"), dans la voix Snapdesk. N'écris jamais en "je".`
      : `Le post est publié depuis le compte LinkedIn personnel de ${commercial.name} : écris à la première personne, dans SA voix.`,
    ``,
    `Règles générales :`,
    ...baseRules,
    ...(isGeneral ? generalRules : spaceRules),
    ``,
    `=== TONE OF VOICE DE ${commercial.name.toUpperCase()} ===`,
    tone,
    ``,
    isGeneral ? `=== FORMAT ===` : `=== STRUCTURE / TEMPLATE ===`,
    isGeneral
      ? `Écris un post LinkedIn autonome dans ta voix habituelle et ta façon de penser (inspire-toi de tes exemples pour le style et la structure). Format LinkedIn aéré.`
      : template,
    extra ? `\n=== CONSIGNES SUPPLÉMENTAIRES ===\n${extra}` : ``,
  ].join('\n');

  const examples = Array.isArray(commercial.examples) ? commercial.examples.filter(e => clean(e) !== '') : [];
  const examplesBlock = examples.length
    ? `\n\nVoici des exemples de posts déjà écrits par ${commercial.name}. Imite leur style, leur rythme et leur ton (PAS leur contenu) :\n\n` +
      examples.map((e, i) => `--- Exemple ${i + 1} ---\n${clean(e)}`).join('\n\n')
    : '';

  const dailyNote = clean(space.dailyNote);
  const dailyBlock = dailyNote
    ? `\n\n⚠️ CONSIGNE DU JOUR (saisie par l'utilisateur, à respecter EN PRIORITÉ pour orienter ce post précis — angle, actualité, promo, événement…) :\n"""\n${dailyNote}\n"""`
    : '';

  const recentHooks = Array.isArray(space.recentHooks)
    ? space.recentHooks.filter((h) => h && clean(h.hook) !== '')
    : [];
  const hooksBlock = recentHooks.length
    ? `\n\n=== ACCROCHES DÉJÀ PUBLIÉES RÉCEMMENT — À NE PAS RÉUTILISER ===\n` +
      `Pour rester naturel et éviter les répétitions dans le feed : ton accroche (la 1re phrase / l'angle d'ouverture) ` +
      `doit être NETTEMENT différente de TOUTES celles ci-dessous — les tiennes comme celles de tes collègues. ` +
      `Ne recycle ni la même idée, ni la même formulation, ni le même running gag (ex. ouvrir sur "le matin", ` +
      `"la tasse de café", "l'arrivée au bureau", une même stat…). Varie l'angle à chaque post.\n` +
      recentHooks.map((h) => `- [${clean(h.author) || '?'}] ${clean(h.hook)}`).join('\n')
    : '';

  const user = isGeneral
    ? `Rédige un post LinkedIn en français dans la voix de ${commercial.name}. Ce post est GÉNÉRAL : il n'est lié à aucun espace précis.` +
      (dailyNote
        ? `\n\nSUJET / BRIEF à traiter (imposé par l'utilisateur) :\n"""\n${dailyNote}\n"""`
        : `\n\nAucun sujet imposé : choisis un angle pertinent et fidèle à ta voix, dans l'univers de Snapdesk (bureaux opérés, flex office, futur du travail à Paris).`) +
      examplesBlock +
      hooksBlock +
      `\n\nRéponds UNIQUEMENT avec le texte du post, prêt à publier.`
    : `Rédige LE post LinkedIn de ${commercial.name} pour l'espace ci-dessous.\n\n` +
      formatSpace(space) +
      examplesBlock +
      dailyBlock +
      hooksBlock +
      `\n\nRéponds UNIQUEMENT avec le texte du post, prêt à publier.`;

  return { system, messages: [{ role: 'user', content: user }] };
}
