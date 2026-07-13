# Snapdesk — Générateur de posts LinkedIn

Génère automatiquement des posts LinkedIn **personnalisés par commercial**
(Ronan, Mélanie, Florian, Thomas) à partir des espaces de bureaux listés dans
un Google Sheet.

```
┌──────────────┐   coche "Générer"   ┌──────────────┐   POST /api/generate   ┌──────────┐
│ Google Sheet │ ──────────────────▶ │ Apps Script  │ ─────────────────────▶ │  Vercel  │
│  (Espaces)   │ ◀────────────────── │ (le "colle") │ ◀───────────────────── │ (cerveau)│
└──────────────┘   4 posts écrits    └──────────────┘   { posts par commercial }└────┬─────┘
                                                                                     │ appelle
                                                                                ┌────▼─────┐
                                                                                │  Claude  │
                                                                                └──────────┘
```

- **Le déclencheur** est une case à cocher « Générer » sur chaque ligne d'espace.
- **Chaque commercial** a son propre fichier de config (`lib/commercials/*.js`)
  avec son *tone of voice* et son *template*. On les remplit un par un.
- La **clé API Anthropic** reste côté Vercel (jamais dans le Sheet).

---

## 1. Déployer le backend sur Vercel

1. Pousse ce dossier sur un repo GitHub (ou glisse-le directement dans Vercel).
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importe le repo.
3. Framework preset : **Other** (rien à configurer, ce sont des fonctions dans `/api`).
4. Avant de déployer, ajoute les **Environment Variables** (onglet *Settings → Environment Variables*) :

   | Nom | Valeur |
   |---|---|
   | `ANTHROPIC_API_KEY` | ta clé `sk-ant-...` (console.anthropic.com) |
   | `API_SECRET` | une longue chaîne aléatoire que tu inventes |
   | `MODEL` *(optionnel)* | `claude-sonnet-5` par défaut |
   | `SHEET_CSV_URL` *(optionnel)* | URL CSV publiée de ton Google Sheet, pour la mini app web (voir §1bis). Sans elle, la mini app affiche un jeu de données d'exemple. |

5. Déploie. Note l'URL du projet, ex. `https://snapdesk-linkedin.vercel.app`.
   → Ton endpoint est donc `https://snapdesk-linkedin.vercel.app/api/generate`.

> 💡 Génère un `API_SECRET` costaud, par ex. via `openssl rand -hex 32`.

---

## 1bis. La mini app web (interface de génération)

En plus du flux Google Sheet → Apps Script, le projet embarque une **petite
interface web** servie par le même déploiement Vercel :

- **`/`** — la liste de tous les espaces (lus depuis ta base). Recherche + bouton
  *Recharger la liste*.
- **`/space.html?id=…`** — la page d'un espace : **un post LinkedIn par commercial**,
  avec un bouton **Copier** et un bouton **🔄 Régénérer** (change le post si le
  format ne te plaît pas). Le bouton **↻ Recharger l'espace** relit les infos de
  la base pour cet espace **et** régénère les posts.

À la première génération, l'interface te demande le **secret** (`API_SECRET`),
stocké uniquement dans l'onglet courant, puis envoyé au backend (`x-api-secret`).

### D'où viennent les espaces ? (la « BDD Excel »)

L'endpoint `GET /api/spaces` lit les espaces depuis :

1. **ton Google Sheet publié en CSV** si la variable `SHEET_CSV_URL` est définie ;
2. sinon, un **jeu de données d'exemple** (`lib/spacesSample.js`) — pratique pour
   tester l'interface immédiatement.

**Publier ton Sheet en CSV :** dans le Google Sheet → *Fichier → Partager →
Publier sur le web* → choisis l'onglet des espaces + format **CSV** → copie l'URL
obtenue et mets-la dans `SHEET_CSV_URL` sur Vercel.

Colonnes reconnues (insensible aux accents/casse) : `espace` (ou `nom`),
`localisation`, `prix`, `postes`, `superficie`, `disponibilite`, `url`
(lien Hubspot), `description`. Toute ligne sans nom d'espace est ignorée.

---

## 2. Brancher le Google Sheet (Apps Script)

1. Ouvre ton Google Sheet → menu **Extensions → Apps Script**.
2. Colle le contenu de [`apps-script/Code.gs`](apps-script/Code.gs) dans le fichier `Code.gs`.
   *(optionnel : Projet → afficher `appsscript.json` et coller son contenu pour figer les autorisations)*
3. En haut du fichier, règle **deux constantes** :
   - `CONFIG.BACKEND_URL` = l'URL de ton endpoint Vercel (étape 1.5).
   - `CONFIG.SHEET_NAME` = le **nom exact** de l'onglet qui contient tes espaces
     (par défaut `"Espaces"` — renomme ton onglet ou change cette valeur).
4. Enregistre, puis **recharge** le Google Sheet. Un menu **« Snapdesk LinkedIn »** apparaît.
5. Menu **🔑 Définir le secret API** → colle **exactement** la même valeur que `API_SECRET` sur Vercel.
6. Menu **⚙️ Installer / Configurer** → autorise le script à la première exécution
   (Google demandera l'accès au Sheet et aux « services externes » : c'est normal et nécessaire).
   Cette étape crée :
   - la colonne **☑️ Générer** (I),
   - la colonne **Statut** (J),
   - les 4 colonnes de posts (K, L, M, N),
   - le déclencheur automatique.
7. Menu **🧪 Tester la connexion au backend** pour vérifier que tout communique.

---

## 3. Utilisation

- Ajoute (ou complète) une ligne d'espace, puis **coche la case « Générer »** de la ligne.
- Les 4 posts s'écrivent dans les colonnes des commerciaux ; la colonne **Statut** indique
  l'avancement (`⏳`, `✅`, `❌`). La case se décoche seule → tu peux **relancer** quand tu veux.
- Tu peux aussi sélectionner une ligne et faire **▶️ Générer pour la ligne active**.

Tant qu'un commercial n'est pas encore configuré, sa colonne affiche
`⏳ Config … à compléter` (aucun appel API n'est fait pour lui).

---

## 4. Personnaliser un commercial

Chaque commercial a un fichier dans `lib/commercials/` :
`ronan.js`, `melanie.js`, `florian.js`, `thomas.js`.

Pour l'activer :

```js
export default {
  key: 'ronan',
  name: 'Ronan',
  active: true,               // ← passe à true
  temperature: 0.7,
  toneOfVoice: `...`,         // sa voix, son style, ses tics d'écriture
  template: `...`,            // la structure de ses posts
  examples: [ `...`, `...` ], // (optionnel) 1 à 3 vrais posts pour caler le style
  extraInstructions: ``,      // (optionnel)
};
```

Puis **redéploie sur Vercel** (un `git push` suffit si le projet est lié à GitHub).

---

## 5. Réglages utiles

- **Changer de modèle** : variable d'env `MODEL` (ex. `claude-opus-4-8` pour + de qualité,
  `claude-sonnet-5` pour le meilleur rapport qualité/coût — défaut).
- **Où s'écrivent les posts** : par défaut, 4 colonnes sur la même ligne. Pour basculer vers
  un onglet-journal (une ligne par post, avec historique), c'est une petite adaptation du
  `Code.gs` — dis-moi si tu préfères ce mode.
- **Ordre des commerciaux** : défini par `COMMERCIALS` dans `lib/commercials/index.js`
  (backend) et `CONFIG.COMMERCIALS` dans `Code.gs` (colonnes). Garde les deux alignés.

---

## 6. Dépannage

| Symptôme | Piste |
|---|---|
| `Secret invalide` (401) | La valeur du menu 🔑 ≠ `API_SECRET` sur Vercel. |
| `BACKEND_URL non configurée` | Tu as laissé `TON-PROJET` dans `Code.gs`. |
| `Onglet "Espaces" introuvable` | `CONFIG.SHEET_NAME` ≠ nom réel de l'onglet. |
| Rien ne se passe en cochant | L'étape ⚙️ *Installer / Configurer* n'a pas été faite (trigger absent). |
| `API Anthropic 401` | `ANTHROPIC_API_KEY` absente/incorrecte côté Vercel. |
| Timeout | Le plan Vercel limite la durée : `vercel.json` monte déjà `maxDuration` à 60 s. |

---

## Structure du projet

```
snapdesk-linkedin/
├── index.html               # mini app : liste des espaces
├── space.html               # mini app : posts d'un espace (copier / régénérer)
├── assets/
│   └── styles.css           # styles de la mini app (thème clair + sombre)
├── api/
│   ├── generate.js          # endpoint POST (auth + orchestration Claude)
│   └── spaces.js            # endpoint GET (liste des espaces)
├── lib/
│   ├── anthropic.js         # appel API Anthropic (fetch natif + retry)
│   ├── prompt.js            # construction du prompt (système + user)
│   ├── spaces.js            # lecture de la base (Google Sheet CSV ou exemple)
│   ├── spacesSample.js      # jeu de données d'exemple (fallback)
│   └── commercials/
│       ├── index.js         # registre des commerciaux
│       ├── ronan.js         # CEO — configuré
│       ├── melanie.js       # Business Developer — configuré
│       ├── florian.js       # Business Developer — configuré
│       └── thomas.js        # Head of Marketing — configuré (sans exemples)
├── apps-script/
│   ├── Code.gs              # à coller dans Extensions → Apps Script
│   └── appsscript.json      # (optionnel) autorisations explicites
├── vercel.json
├── package.json
├── .env.example
└── README.md
```
