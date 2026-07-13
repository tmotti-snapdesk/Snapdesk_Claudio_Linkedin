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

  const system = [
    `Tu rédiges un post LinkedIn en français pour ${commercial.name}, commercial chez Snapdesk (bureaux opérés / flex office à Paris).`,
    `Le post est publié depuis le compte LinkedIn personnel de ${commercial.name} : écris à la première personne, dans SA voix.`,
    ``,
    `Règles générales :`,
    `- Français, prêt à copier-coller, sans balises ni guillemets autour du post.`,
    `- L'espace fourni est TOUJOURS le sujet central du post : ta différence tient à ton angle propre, pas au sujet.`,
    `- NE MENTIONNE JAMAIS le prix, le loyer ou le tarif — même s'il apparaît dans la fiche Hubspot. Aucune référence au coût, ni chiffre, ni fourchette.`,
    `- Mets en avant AU MAXIMUM les atouts concrets du lieu : nombre d'open spaces, nombre de salles de réunion, présence d'une salle détente, d'un espace informel / de convivialité, cuisine, terrasse, douche, luminosité, quartier… — mais UNIQUEMENT ce qui est réellement mentionné (fiche Hubspot ou champs fournis).`,
    `- NE MENS JAMAIS. La fiche Hubspot est ta source de vérité : appuie-toi dessus et n'écris rien qui la contredise. Si une info n'y figure pas (et n'est pas dans les champs fournis), ne l'invente pas.`,
    `- N'évoque JAMAIS d'"impression illimitée" / "impressions illimitées" : ce service n'existe pas chez Snapdesk.`,
    `- Reste factuel sur les chiffres fournis (postes, superficie, dispo). N'invente aucune donnée.`,
    `- Si une info manque, ne l'invente pas et n'écris pas "non communiqué" : contourne naturellement.`,
    `- Pas de promesses irréalistes ni de superlatifs vides à la chaîne.`,
    ``,
    `=== TONE OF VOICE DE ${commercial.name.toUpperCase()} ===`,
    tone,
    ``,
    `=== STRUCTURE / TEMPLATE ===`,
    template,
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

  const user =
    `Rédige LE post LinkedIn de ${commercial.name} pour l'espace ci-dessous.\n\n` +
    formatSpace(space) +
    examplesBlock +
    dailyBlock +
    `\n\nRéponds UNIQUEMENT avec le texte du post, prêt à publier.`;

  return { system, messages: [{ role: 'user', content: user }] };
}
