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

5. Déploie. Note l'URL du projet, ex. `https://snapdesk-linkedin.vercel.app`.
   → Ton endpoint est donc `https://snapdesk-linkedin.vercel.app/api/generate`.

> 💡 Génère un `API_SECRET` costaud, par ex. via `openssl rand -hex 32`.

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
├── api/
│   └── generate.js          # endpoint POST (auth + orchestration)
├── lib/
│   ├── anthropic.js         # appel API Anthropic (fetch natif + retry)
│   ├── prompt.js            # construction du prompt (système + user)
│   └── commercials/
│       ├── index.js         # registre des commerciaux
│       ├── ronan.js         # ← à remplir
│       ├── melanie.js       # ← à remplir
│       ├── florian.js       # ← à remplir
│       └── thomas.js        # ← à remplir
├── apps-script/
│   ├── Code.gs              # à coller dans Extensions → Apps Script
│   └── appsscript.json      # (optionnel) autorisations explicites
├── vercel.json
├── package.json
├── .env.example
└── README.md
```
