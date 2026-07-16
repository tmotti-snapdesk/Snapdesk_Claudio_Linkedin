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
- La génération utilise **Google Gemini** par défaut (`lib/gemini.js`), sélectionné
  via `lib/llm.js` — on peut repasser sur Claude avec `LLM_PROVIDER=anthropic`.
- La **clé API** (Gemini ou Anthropic) reste côté Vercel (jamais dans le Sheet).

---

## 1. Déployer le backend sur Vercel

1. Pousse ce dossier sur un repo GitHub (ou glisse-le directement dans Vercel).
2. Sur [vercel.com](https://vercel.com) → **Add New… → Project** → importe le repo.
3. Framework preset : **Other** (rien à configurer, ce sont des fonctions dans `/api`).
4. Avant de déployer, ajoute les **Environment Variables** (onglet *Settings → Environment Variables*) :

   | Nom | Valeur |
   |---|---|
   | `GEMINI_API_KEY` | ta clé Google Gemini `AIza...` (https://aistudio.google.com/apikey) |
   | `APP_USER` | le pseudo du **seul** compte autorisé à utiliser l'app |
   | `APP_PASSWORD` | le mot de passe de ce compte (choisis-le fort) |
   | `SESSION_SECRET` *(optionnel)* | longue chaîne aléatoire pour signer les sessions (`openssl rand -hex 32`). Si absent, dérivé de `APP_PASSWORD`. |
   | `MODEL` *(optionnel)* | `gemini-flash-lite-latest` par défaut (alias toujours à jour, offre gratuite) |
   | `LLM_PROVIDER` *(optionnel)* | `gemini` par défaut. Mets `anthropic` (+ `ANTHROPIC_API_KEY`) pour repasser sur Claude. |
   | `SHEET_CSV_URL` *(optionnel)* | URL CSV publiée de ton Google Sheet, pour la mini app web (voir §1bis). Sans elle, la mini app affiche un jeu de données d'exemple. |

   > 🔐 **Connexion (multi-utilisateurs)** : `APP_USER` / `APP_PASSWORD` définissent le
   > **compte maître (admin)** — il permet d'entrer même si la base est vide et de
   > **créer/gérer les autres comptes depuis l'app** (page **Utilisateurs**, réservée
   > aux admins). Les autres utilisateurs sont stockés (mot de passe **haché**) dans
   > **Supabase**. Le login vérifie d'abord Supabase, puis le compte maître. Nécessite
   > donc Supabase configuré (voir §5bis) pour les comptes additionnels.

   | Nom (mémoire partagée) | Valeur |
   |---|---|
   | `SUPABASE_URL` *(optionnel)* | URL du projet Supabase (Settings → API → Project URL) |
   | `SUPABASE_SERVICE_ROLE_KEY` *(optionnel)* | clé `service_role` Supabase — **secrète, serveur uniquement** |

   > 🤝 **Mémoire partagée** : avec Supabase configuré, **tous les membres voient et
   > modifient le même travail** (posts générés, éditions, note du jour, historique
   > anti-répétition) depuis n'importe quel PC. **Sans** Supabase, l'app fonctionne
   > quand même mais la mémoire est **par navigateur** (localStorage). Setup en §7.

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

L'app s'ouvre sur une **page de connexion** (`/login.html`). Après login, un jeton
de session est stocké dans le navigateur et envoyé au backend (`Authorization: Bearer`).
Un bouton **Déconnexion** est disponible en haut de l'app. Un seul compte existe
(`APP_USER` / `APP_PASSWORD`).

### D'où viennent les espaces ? (la « BDD Excel »)

L'endpoint `GET /api/spaces` lit le Google Sheet Snapdesk **EN DIRECT** à chaque
appel (endpoint `gviz` CSV, ID du Sheet codé dans `lib/spaces.js`). Toute modif
du Sheet apparaît sur le site au rechargement de la page.

**Seul pré-requis (à faire une fois, côté Google) :** le Sheet doit être lisible
sans authentification. Dans le Sheet → **Partager** → *Accès général* → **Tous les
utilisateurs disposant du lien** → rôle **Lecteur**. (Un site ne peut pas lire un
Sheet privé — c'est une sécurité Google, impossible à contourner côté code.)

Repli : si le Sheet est injoignable (privé, hors-ligne, timeout), l'app affiche
le catalogue de secours `lib/spacesSample.js` — le site reste fonctionnel.

**Pointer un autre Sheet / onglet, ou une publication CSV :** définis la variable
d'env `SHEET_CSV_URL` (elle a priorité). Pour publier en CSV : *Fichier → Partager
→ Publier sur le web* → onglet + format **CSV** → copie l'URL dans `SHEET_CSV_URL`.

Colonnes reconnues (insensible aux accents/casse) : `espace` (ou `nom`),
`localisation`, `prix`, `postes`, `superficie(s)`, `disponibilite`, `url` /
`URL Hubspot`, `description`. L'ordre des colonnes n'importe pas ; toute ligne
sans nom d'espace est ignorée.

> ℹ️ Sans `SHEET_CSV_URL`, l'app affiche le catalogue réel figé dans
> `lib/spacesSample.js` (mis à jour depuis le Sheet). Publie le CSV pour un
> affichage **toujours à jour**.

### Le générateur lit aussi la fiche Hubspot 🔗

Au moment de générer, le backend **suit le lien Hubspot de l'espace** (colonne
`URL Hubspot`, souvent un raccourci `hubs.ly`), récupère la page et en extrait le
texte. Ces informations sont ensuite **la source à privilégier** dans le prompt
(équipements, services, ambiance, quartier…), en plus des champs du Sheet.

- La fiche est lue **une seule fois par espace** et réutilisée pour les 4 commerciaux.
- Robuste : si le lien est privé, en PDF, ou injoignable, la génération continue
  simplement avec les infos du Sheet (`hubspotUsed:false` dans la réponse).
- La réponse `/api/generate` indique `hubspotUsed: true/false`.

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

- **Changer de modèle** : variable d'env `MODEL`. Défaut `gemini-flash-lite-latest`
  (alias « latest » : jamais retiré, contrairement aux versions figées comme
  `gemini-2.5-flash-lite` que Google finit par bloquer). Autres options :
  `gemini-flash-latest` (plus costaud), ou avec un compte facturé `gemini-2.0-flash`.
  Pour changer de fournisseur : `LLM_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`
  (`claude-sonnet-5`…).
- **Où s'écrivent les posts** : par défaut, 4 colonnes sur la même ligne. Pour basculer vers
  un onglet-journal (une ligne par post, avec historique), c'est une petite adaptation du
  `Code.gs` — dis-moi si tu préfères ce mode.
- **Ordre des commerciaux** : défini par `COMMERCIALS` dans `lib/commercials/index.js`
  (backend) et `CONFIG.COMMERCIALS` dans `Code.gs` (colonnes). Garde les deux alignés.

---

## 5bis. Mémoire partagée entre tous (Supabase)

Par défaut, la mémoire (posts générés, éditions, note du jour, historique) est
stockée **dans le navigateur** de chacun → **non partagée** entre PC/personnes.
Pour que **toute l'équipe voie et modifie le même travail**, branche Supabase :

1. Crée un projet gratuit sur **https://supabase.com**.
2. Dans **SQL Editor**, exécute :
   ```sql
   create table if not exists snapdesk_state (
     key text primary key,
     value jsonb not null,
     updated_at timestamptz not null default now()
   );
   ```
3. Dans **Settings → API**, récupère :
   - **Project URL** → variable Vercel `SUPABASE_URL`
   - **service_role** (clé secrète) → variable Vercel `SUPABASE_SERVICE_ROLE_KEY`
4. Ajoute ces 2 variables dans **Vercel → Settings → Environment Variables**, puis **Redeploy**.

> La clé `service_role` reste **côté serveur uniquement** (endpoint `/api/state`),
> jamais exposée au navigateur. Les données transitent par le login de l'app.
> Les changements d'un membre apparaissent chez les autres **au rechargement** de la page.

---

## 6. Dépannage

| Symptôme | Piste |
|---|---|
| `Identifiants invalides` (401) au login | Pseudo/mot de passe ≠ `APP_USER` / `APP_PASSWORD` sur Vercel. |
| `Connexion non configurée côté serveur` (500) | `APP_USER` / `APP_PASSWORD` absents sur Vercel (ou pas redéployé). |
| Renvoyé sans arrêt vers la page de login | Session expirée (12 h) ou `SESSION_SECRET` modifié après émission du jeton → reconnecte-toi. |
| `BACKEND_URL non configurée` | Tu as laissé `TON-PROJET` dans `Code.gs`. |
| `Onglet "Espaces" introuvable` | `CONFIG.SHEET_NAME` ≠ nom réel de l'onglet. |
| Rien ne se passe en cochant | L'étape ⚙️ *Installer / Configurer* n'a pas été faite (trigger absent). |
| `GEMINI_API_KEY manquante` / `API Gemini 400/403` | Clé Gemini absente/incorrecte côté Vercel (ou quota dépassé). |
| Timeout | Le plan Vercel limite la durée : `vercel.json` monte déjà `maxDuration` à 60 s. |

---

## Structure du projet

```
snapdesk-linkedin/
├── login.html               # mini app : page de connexion (pseudo + mdp)
├── users.html               # admin : gestion des comptes (créer / supprimer)
├── index.html               # mini app : liste des espaces
├── space.html               # mini app : posts d'un espace (copier / régénérer)
├── assets/
│   ├── styles.css           # styles de la mini app (thème clair + sombre)
│   └── auth.js              # helpers de session côté client (jeton, logout)
├── api/
│   ├── login.js             # endpoint POST (connexion multi-user → jeton de session)
│   ├── users.js             # endpoint GET/POST/DELETE (gestion comptes, admin)
│   ├── generate.js          # endpoint POST (auth session + orchestration LLM)
│   ├── spaces.js            # endpoint GET (liste des espaces, protégé)
│   └── state.js             # endpoint GET/POST (mémoire partagée Supabase)
├── lib/
│   ├── auth.js              # login compte unique + jetons signés (HMAC)
│   ├── store.js             # accès Supabase (clé-valeur, mémoire partagée)
│   ├── llm.js               # sélecteur de fournisseur (Gemini par défaut / Claude)
│   ├── gemini.js            # appel API Google Gemini (fetch natif + retry)
│   ├── anthropic.js         # appel API Anthropic Claude (fallback via LLM_PROVIDER)
│   ├── prompt.js            # construction du prompt (système + user)
│   ├── spaces.js            # lecture de la base (Google Sheet CSV ou exemple)
│   ├── spacesSample.js      # catalogue réel figé (fallback si pas de CSV)
│   ├── hubspot.js           # lecture du contenu de la fiche Hubspot d'un espace
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
