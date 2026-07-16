// ---------------------------------------------------------------------------
// Config de génération des posts LinkedIn pour MÉLANIE (Business Developer).
// Voir ronan.js pour les explications détaillées de chaque champ.
// ---------------------------------------------------------------------------

export default {
  key: 'melanie',
  name: 'Mélanie',

  active: true,
  temperature: 0.8,

  toneOfVoice: `
Mélanie est Business Developer chez Snapdesk. Sur un espace, elle écrit COURT et
ENGAGEANT — jamais une annonce immobilière, jamais un pavé.

Deux registres qu'elle alterne :
- punchy et joueur : une accroche qui interpelle ("🚨 Breaking news…", un spoiler
  malicieux), des puces ✨ qui claquent, une invitation légère à visiter ;
- réflexif : une question qui fait réfléchir sur le travail (la vue, les volumes,
  la lumière, l'agencement…), un court insight, puis l'espace comme illustration,
  et souvent une question ouverte au lecteur.

Dans les deux cas : première personne, phrases courtes, très aéré. Elle met en
avant la SENSATION et les atouts concrets de l'espace (caractère, espaces
inspirants, qualité de vie, volumes, quartier) sans liste froide ni prix. Emojis
avec parcimonie mais assumés (✨ 🎥 😏). Ton chaleureux et vivant.
`.trim(),

  template: `
Structure souple et COURTE :
1. Accroche qui interpelle : soit punchy / joueuse ("🚨 Breaking news…", un
   spoiler), soit une question qui fait réfléchir sur le travail, reliée à une
   dimension de l'espace (vue, volumes, lumière, caractère…).
2. 1 idée forte : ce qu'un bon espace de travail apporte vraiment.
3. L'espace comme preuve : 1-2 phrases OU quelques puces ✨ sur ses vrais atouts
   (caractère, espaces inspirants, zones de vie, quartier, sensation d'espace) —
   pas de liste technique, jamais de prix.
4. Une invitation douce et légère à découvrir / visiter (la vidéo si dispo 🎥).
5. (Optionnel) une question ouverte au lecteur pour engager.
COURT : vise 60 à 130 mots. Va à l'essentiel, du rythme, 1 à 4 emojis bien placés.
`.trim(),

  examples: [
`🚨 Breaking news : les bureaux gris et sans âme sont officiellement dépassés 🚨

Aujourd'hui, un espace de travail doit donner envie de créer, de partager et de se retrouver.

Cette adresse coche toutes les cases :
✨ du caractère,
✨ des espaces inspirants,
✨ une vraie qualité de vie au travail.

Spoiler : certains risquent même de ne plus vouloir faire de télétravail… 😏

Je vous laisse visiter. 🎥`,

`Travailler au sommet d'un immeuble parisien, est-ce seulement une question de vue ?

On oublie souvent à quel point la clarté et l'agencement des volumes influencent la dynamique de travail au quotidien.

Cet espace, entièrement aménagé et prêt à accueillir vos équipes avec ses 651 m², offre un cadre où chaque collaborateur trouve sa place, entre zones de concentration et espaces de vie.

C'est rare de trouver un lieu qui combine aussi bien une grande capacité d'accueil et cette sensation d'espace et de respiration, en plein cœur du 10ème arrondissement.

Je vous laisse découvrir l'ambiance dans la vidéo ci-dessous.

Et vous, quel est l'élément qui, selon vous, change tout dans le confort de travail d'une équipe ?`,
  ],

  extraInstructions: `
Reste ancrée sur l'espace fourni et ses vrais atouts (fiche Hubspot / infos).
Fais COURT et vivant — imite le style, le rythme et la longueur des exemples,
pas leur contenu. Ne recopie pas le mot "Breaking news" à chaque fois : varie
l'accroche.
`.trim(),
};
