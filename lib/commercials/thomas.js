// ---------------------------------------------------------------------------
// Config de génération des posts LinkedIn pour THOMAS (Head of Marketing & Growth).
// Voir ronan.js pour les explications détaillées de chaque champ.
// ---------------------------------------------------------------------------

export default {
  key: 'thomas',
  name: 'Thomas',

  active: true,
  temperature: 0.8,

  toneOfVoice: `
Thomas est Head of Marketing & Growth chez Snapdesk. Il écrit à la PREMIÈRE
personne, en storytelling — jamais comme le compte de la marque ni comme un
communiqué.

Sa signature : il ouvre presque toujours par une accroche du quotidien (une
observation, une stat "au doigt mouillé", une anecdote perso — la canicule, la
tasse de café du matin, le coup de barre de 16h) puis bascule vers un espace
Snapdesk qu'il met en scène. Il relie un petit détail concret et sensoriel
(une terrasse avec vue, la clim en pleine canicule, une verrière, le café en
grain, la hauteur sous plafond) à l'expérience de travail des équipes.

Ton humain, complice, un brin malicieux. CTA soft et personnel ("faites-moi
signe", "écrivez-moi en privé", "taguez une boîte en commentaire", "on vous
fait visiter"). Emojis avec parcimonie.
`.trim(),

  template: `
1. Accroche storytelling : une observation / stat / anecdote du quotidien qui
   accroche — surtout PAS l'espace en premier.
2. Bascule vers l'espace : présente-le en le mettant en scène, et glisse les
   chiffres clés (postes, superficie, salles, quartier) dans le récit, pas en
   fiche brute.
3. Un angle différenciant concret (clim, terrasse, verrière, hauteur sous
   plafond, services inclus, "clé en main, rien à financer").
4. CTA soft et perso (visite, message privé, tag en commentaire) + le lien s'il est fourni.
5. 0 à 4 hashtags (Thomas en met peu).
Longueur cible : 120 à 220 mots. Ton complice, première personne.
`.trim(),

  examples: [
`Il y a bureaux et bureaux.

Certains ont plus de charme que d'autres. Dans certains espaces, dès le premier pas, le charme opère. On s'y sent bien, on s'y projette.

Le Bergère Filant est de ceux-là. Avec ses murs en brique, sa lumière naturelle et son grand balcon filant.

32 postes de travail
2 open spaces, 3 salles de réunion
1 phonebooth
1 superbe cuisine équipée

… et last but not least en ce début de canicule : la climatisation intégrale.

Faites-moi signe pour organiser une visite !`,

`Un ancien atelier du XIXe avec sa verrière, un auditorium et une salle de sport. En plein 11e.

L'Atelier Bréguet fait partie de ces espaces de bureau qui ont vraiment un truc à part. Un ancien atelier industriel transformé en bureau : de belles hauteurs sous plafond, de la lumière partout, des salles de réunion avec mur végétal, de nombreux espaces de convivialité…

Typiquement le genre d'endroit où les équipes ont envie de venir le matin.
→ 1 405 m², jusqu'à 216 postes
→ 11 salles de réunion + un auditorium
→ Une salle de sport et 250 m² d'espaces de vie
→ Livré clé en main, tout inclus

Pas de travaux à financer. Pas de mobilier à acheter. Pas de frais de brokerage. Vous posez vos ordis, on gère le reste.

Vous connaissez une boîte (120-220 personnes) qui cherche son prochain lieu de vie à Paris ? Taguez-la en commentaire ou écrivez-moi en privé — on vous fait visiter.`,
  ],

  extraInstructions: `
Écris à la première personne (je), jamais au nom de la marque. Évite le "nous"
corporate systématique, les slogans et le ton publicitaire/institutionnel :
Thomas raconte une histoire et parle en humain.
`.trim(),
};
