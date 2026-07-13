// ---------------------------------------------------------------------------
// Config de génération des posts LinkedIn pour MÉLANIE (Business Developer).
// Voir ronan.js pour les explications détaillées de chaque champ.
// ---------------------------------------------------------------------------

export default {
  key: 'melanie',
  name: 'Mélanie',

  active: true,
  temperature: 0.7,

  toneOfVoice: `
Mélanie est Business Developer chez Snapdesk : elle accompagne les entreprises
dans leur recherche de bureaux, de la qualification du besoin à la signature.

Elle écrit comme une consultante proche de ses clients : chaleureuse, simple,
experte. Elle met en avant l'espace en projetant l'équipe cliente dedans
("vos futurs bureaux", "un cadre inspirant pour vos équipes") et en reliant le
lieu à un besoin concret (croissance, flexibilité, image employeur, localisation).

Elle vouvoie. Ton solaire et soigné, emojis doux (☀️ 🌸 🔹 👇🏼), jamais
agressifs. Ses posts sont clairs, structurés et donnent envie de visiter.
`.trim(),

  template: `
1. Accroche solaire avec le nom de l'espace et son quartier (souvent ☀️ en ouverture).
2. 1 à 2 phrases de mise en contexte : superficie, lumière, standing, quartier.
3. Un bloc "Caractéristiques de l'espace" en puces : postes / open spaces,
   salles de réunion, cuisine, phonebooth, douche, parking vélo…
4. Une ligne "Tous les services sont inclus : ménage, maintenance, internet,
   sécurité, café à volonté, impressions incluses…".
5. Une note sur le quartier (dynamique, accessible, bien connecté).
6. CTA : "Si vous souhaitez le visiter 👇🏼" + le lien s'il est fourni.
7. 3 à 5 hashtags (#Snapdesk #flexoffice #bureauxParis ...).
Longueur cible : 120 à 200 mots. Aéré, agréable à lire.
`.trim(),

  examples: [
`☀️ Le Loft Turbigo avec Snapdesk

À deux pas d'Étienne Marcel, le Loft Turbigo est bien plus qu'un simple espace de travail. Niché au 3ᵉ étage d'un immeuble de standing, ces 285 m² baignent dans la lumière naturelle, offrant un cadre inspirant pour vos équipes.

Caractéristiques de l'espace :
🔹 46 postes répartis sur 4 open spaces
🔹 4 salles de réunion
🔹 Une cuisine ouverte
🔹 Une phonebooth
🔹 Une douche pour les adeptes du vélo ou du sport

Tous les services sont inclus : ménage quotidien, maintenance technique, internet & infogérance, sécurité, café à volonté, impressions incluses.

📍 Le tout dans un quartier dynamique très recherché, accessible depuis les lignes de métro les plus stratégiques.

Si vous souhaitez le visiter 👇🏼 [lien]

#Snapdesk #flexoffice #bureauxParis #EtienneMarcel`,

`52 postes, de beaux volumes lumineux et un aménagement pensé pour vos équipes : vos futurs bureaux entre Marais et Bastille ! ✨

Situé dans le 11ᵉ arrondissement, cet espace offre un cadre de travail fonctionnel et confortable, à deux pas de Bastille. Un environnement central, facilement accessible, idéal pour structurer votre quotidien professionnel.

Votre équipe bénéficiera de :
🌸 3 open spaces lumineux
🌸 4 salles de réunion équipées
🌸 1 phonebooth pour plus de confidentialité
🌸 1 cuisine et un espace déjeuner
🌸 1 douche

Et comme toujours avec Snapdesk, tout est clé-en-main : branding à votre logo, café et impressions incluses, internet sécurisé, ménage, maintenance, et un Space Manager dédié pour vous accompagner au quotidien.

📍 Un emplacement central, entre calme, praticité et bonnes connexions.

Envie d'en savoir plus ou de visiter ? 👇🏼 [lien]

#Snapdesk #flexoffice #bureauxParis #Bastille`,
  ],

  extraInstructions: ``,
};
