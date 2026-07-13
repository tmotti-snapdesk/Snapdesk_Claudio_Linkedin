/**
 * ==========================================================================
 *  SNAPDESK — Générateur de posts LinkedIn
 *  Google Sheet  →  Vercel  →  Claude  →  Google Sheet
 * ==========================================================================
 *
 *  INSTALLATION (une seule fois) :
 *   1. Renseigne CONFIG.BACKEND_URL ci-dessous (URL Vercel + /api/generate).
 *   2. Vérifie CONFIG.SHEET_NAME (le nom exact de ton onglet d'espaces).
 *   3. Recharge le Sheet → menu "Snapdesk LinkedIn" → "🔑 Définir le secret API"
 *      (colle la MÊME valeur que API_SECRET sur Vercel).
 *   4. Menu "Snapdesk LinkedIn" → "⚙️ Installer / Configurer" (autorise à la 1re fois).
 *   5. Coche la case "Générer" sur une ligne d'espace → les 4 posts se génèrent.
 * ==========================================================================
 */

const CONFIG = {
  // ⚠️ Le nom EXACT de l'onglet qui contient les espaces (renomme ton onglet ou adapte ici).
  SHEET_NAME: 'Espaces',
  HEADER_ROW: 1,

  // Colonnes SOURCE (1 = A, 2 = B, ...) — d'après ton Sheet actuel :
  COL_URL: 1,          // A - URL Hubspot
  COL_LOCALISATION: 2, // B - Localisation
  COL_ESPACE: 3,       // C - Espace
  COL_PRIX: 4,         // D - Prix
  COL_POSTES: 5,       // E - Postes
  COL_SUPERFICIE: 6,   // F - Superficies
  COL_DISPO: 7,        // G - Disponibilité
  COL_DESCRIPTION: 8,  // H - Description

  // Colonnes créées / gérées par le script :
  COL_TRIGGER: 9,      // I - ☑️ Générer (case à cocher)
  COL_STATUS: 10,      // J - Statut
  OUTPUT_START_COL: 11,// K - 1re colonne de sortie (un commercial par colonne, dans l'ordre ci-dessous)

  COMMERCIALS: ['ronan', 'melanie', 'florian', 'thomas'],
  COMMERCIAL_LABELS: { ronan: 'Ronan', melanie: 'Mélanie', florian: 'Florian', thomas: 'Thomas' },

  // ⚠️ URL de ton déploiement Vercel :
  BACKEND_URL: 'https://TON-PROJET.vercel.app/api/generate',
};

/** Menu ajouté à l'ouverture du Sheet. */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Snapdesk LinkedIn')
    .addItem('▶️ Générer pour la ligne active', 'generateForActiveRow')
    .addSeparator()
    .addItem('⚙️ Installer / Configurer', 'setup')
    .addItem('🔑 Définir le secret API', 'setApiSecret')
    .addItem('🧪 Tester la connexion au backend', 'testBackend')
    .addToUi();
}

/** Enregistre le secret partagé dans les propriétés du script (pas dans le code). */
function setApiSecret() {
  const ui = SpreadsheetApp.getUi();
  const res = ui.prompt('Secret API', 'Colle la même valeur que API_SECRET sur Vercel :', ui.ButtonSet.OK_CANCEL);
  if (res.getSelectedButton() !== ui.Button.OK) return;
  const secret = res.getResponseText().trim();
  if (!secret) { ui.alert('Secret vide — annulé.'); return; }
  PropertiesService.getScriptProperties().setProperty('API_SECRET', secret);
  ui.alert('Secret enregistré ✅');
}

/** Configure les en-têtes, les cases à cocher et le trigger installable. À lancer une fois. */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = getSheet_(ss);

  // 1) En-têtes des colonnes gérées
  sheet.getRange(CONFIG.HEADER_ROW, CONFIG.COL_TRIGGER).setValue('Générer');
  sheet.getRange(CONFIG.HEADER_ROW, CONFIG.COL_STATUS).setValue('Statut');
  CONFIG.COMMERCIALS.forEach((key, i) => {
    sheet.getRange(CONFIG.HEADER_ROW, CONFIG.OUTPUT_START_COL + i)
      .setValue('Post ' + (CONFIG.COMMERCIAL_LABELS[key] || key));
  });

  // 2) Cases à cocher sur toute la colonne déclencheur (lignes de données existantes + futures)
  const startRow = CONFIG.HEADER_ROW + 1;
  const nRows = sheet.getMaxRows() - CONFIG.HEADER_ROW;
  sheet.getRange(startRow, CONFIG.COL_TRIGGER, nRows, 1).insertCheckboxes();

  // 3) Trigger INSTALLABLE onEdit — indispensable : un simple onEdit ne peut pas
  //    appeler d'URL externe (UrlFetchApp). On (re)crée proprement le trigger.
  const handler = 'onEditInstallable';
  ScriptApp.getProjectTriggers()
    .filter((t) => t.getHandlerFunction() === handler)
    .forEach((t) => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger(handler).forSpreadsheet(ss).onEdit().create();

  SpreadsheetApp.getUi().alert('Configuration terminée ✅\n\nCoche la case "Générer" sur une ligne d\u2019espace pour lancer la génération.');
}

/** Déclenché à chaque édition (via le trigger installable). */
function onEditInstallable(e) {
  try {
    if (!e || !e.range) return;
    const sheet = e.range.getSheet();
    if (sheet.getName() !== CONFIG.SHEET_NAME) return;
    if (e.range.getColumn() !== CONFIG.COL_TRIGGER) return; // seule la colonne "Générer" déclenche
    const row = e.range.getRow();
    if (row <= CONFIG.HEADER_ROW) return;
    if (e.range.getValue() !== true) return;                // seulement quand on COCHE (pas quand on décoche)
    generateForRow_(sheet, row);
  } catch (err) {
    try { setStatus_(e.range.getSheet(), e.range.getRow(), 'Erreur : ' + err.message); } catch (_) {}
  }
}

/** Lance la génération pour la ligne actuellement sélectionnée (menu / test manuel). */
function generateForActiveRow() {
  const sheet = SpreadsheetApp.getActiveSheet();
  if (sheet.getName() !== CONFIG.SHEET_NAME) {
    SpreadsheetApp.getUi().alert('Place-toi sur l\u2019onglet "' + CONFIG.SHEET_NAME + '".');
    return;
  }
  const row = sheet.getActiveRange().getRow();
  if (row <= CONFIG.HEADER_ROW) {
    SpreadsheetApp.getUi().alert('Sélectionne une ligne d\u2019espace (sous les en-têtes).');
    return;
  }
  generateForRow_(sheet, row);
}

/** Cœur du traitement : lit la ligne, appelle le backend, écrit les posts. */
function generateForRow_(sheet, row) {
  const space = readSpace_(sheet, row);

  if (!isValidSpaceRow_(space)) {
    setStatus_(sheet, row, 'Ligne ignorée (espace / prix / postes manquant)');
    sheet.getRange(row, CONFIG.COL_TRIGGER).setValue(false);
    return;
  }

  setStatus_(sheet, row, '⏳ Génération en cours…');
  SpreadsheetApp.flush();

  try {
    const resp = callBackend_({ space: space, commercials: CONFIG.COMMERCIALS });
    const posts = (resp && resp.posts) || {};

    CONFIG.COMMERCIALS.forEach((key, i) => {
      const cell = sheet.getRange(row, CONFIG.OUTPUT_START_COL + i);
      const r = posts[key] || {};
      cell.setValue(r.post || (r.error ? '⚠️ ' + r.error : '—'));
      cell.setWrap(true);
    });

    setStatus_(sheet, row, '✅ Généré le ' + new Date().toLocaleString('fr-FR'));
  } catch (err) {
    setStatus_(sheet, row, '❌ ' + err.message);
  } finally {
    // On décoche pour pouvoir relancer plus tard.
    sheet.getRange(row, CONFIG.COL_TRIGGER).setValue(false);
  }
}

/** Test rapide de la connexion au backend (menu). */
function testBackend() {
  try {
    const resp = callBackend_({
      space: { espace: 'Test Iéna', localisation: '75016', prix: '6 600 €', postes: '12', superficie: '', disponibilite: 'DISPO', url: '', description: '' },
      commercials: CONFIG.COMMERCIALS,
    });
    const keys = Object.keys((resp && resp.posts) || {});
    SpreadsheetApp.getUi().alert('Connexion OK ✅\nModèle : ' + (resp.model || '?') + '\nRéponses pour : ' + keys.join(', '));
  } catch (err) {
    SpreadsheetApp.getUi().alert('Échec ❌\n' + err.message);
  }
}

/* ----------------------------- Helpers -------------------------------- */

function getSheet_(ss) {
  const sheet = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sheet) {
    throw new Error('Onglet "' + CONFIG.SHEET_NAME + '" introuvable. Renomme ton onglet ou modifie CONFIG.SHEET_NAME.');
  }
  return sheet;
}

function readSpace_(sheet, row) {
  const val = (c) => sheet.getRange(row, c).getDisplayValue();
  return {
    url: val(CONFIG.COL_URL),
    localisation: val(CONFIG.COL_LOCALISATION),
    espace: val(CONFIG.COL_ESPACE),
    prix: val(CONFIG.COL_PRIX),
    postes: val(CONFIG.COL_POSTES),
    superficie: val(CONFIG.COL_SUPERFICIE),
    disponibilite: val(CONFIG.COL_DISPO),
    description: val(CONFIG.COL_DESCRIPTION),
  };
}

function isValidSpaceRow_(s) {
  const has = (v) => v && String(v).trim() !== '';
  return has(s.espace) && (has(s.prix) || has(s.postes));
}

function setStatus_(sheet, row, msg) {
  sheet.getRange(row, CONFIG.COL_STATUS).setValue(msg);
}

function callBackend_(payload) {
  const secret = PropertiesService.getScriptProperties().getProperty('API_SECRET');
  if (!secret) throw new Error('Secret API non défini (menu → 🔑 Définir le secret API).');
  if (!CONFIG.BACKEND_URL || CONFIG.BACKEND_URL.indexOf('TON-PROJET') !== -1) {
    throw new Error('BACKEND_URL non configurée dans le script.');
  }

  const res = UrlFetchApp.fetch(CONFIG.BACKEND_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-api-secret': secret },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });

  const code = res.getResponseCode();
  const text = res.getContentText();
  if (code !== 200) throw new Error('Backend ' + code + ' : ' + text.slice(0, 300));

  return JSON.parse(text);
}
