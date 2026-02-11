/**
 * GitHub Data Manager
 * Remplace Firestore : lit/écrit des fichiers JSON dans le repo GitHub.
 * Utilisé par les pages admin pour gérer units, playtime, playtime_history.
 */

const GITHUB_OWNER = 'NekoAkami';
const GITHUB_REPO = 'guidempf-site';
const GITHUB_BRANCH = 'main';

// ========== TOKEN ==========
function getToken() {
  return localStorage.getItem('ghpat') || '';
}

function setToken(token) {
  localStorage.setItem('ghpat', token);
}

function hasToken() {
  return !!getToken();
}

/**
 * Prompt pour le token si pas encore défini
 */
function promptToken() {
  const token = prompt(
    'Entrez votre GitHub Personal Access Token (PAT).\n' +
    'Créez-le sur : github.com > Settings > Developer settings > Personal access tokens > Fine-grained tokens\n' +
    'Permissions requises : Contents (Read and Write) sur le repo ' + GITHUB_REPO
  );
  if (token && token.trim()) {
    setToken(token.trim());
    return true;
  }
  return false;
}

// ========== READ ==========
/**
 * Lire un fichier JSON depuis le repo (via raw content, pas besoin de token)
 */
async function readJsonFile(path) {
  // Use raw.githubusercontent.com for public repos (no token needed for read)
  const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/${path}?t=${Date.now()}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 404) return null;
    throw new Error(`Erreur lecture ${path}: ${resp.status}`);
  }
  return resp.json();
}

// ========== WRITE ==========
/**
 * Écrire un fichier JSON dans le repo via l'API GitHub
 */
async function writeJsonFile(path, data, message) {
  const token = getToken();
  if (!token) {
    throw new Error('Token GitHub non configuré. Cliquez sur "⚙ TOKEN" pour le configurer.');
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  // 1) Get current SHA (needed for update)
  let sha = null;
  try {
    const getResp = await fetch(apiUrl, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (getResp.ok) {
      const info = await getResp.json();
      sha = info.sha;
    }
  } catch (e) {
    // File might not exist yet, that's ok
  }

  // 2) Write file
  const content = btoa(unescape(encodeURIComponent(JSON.stringify(data, null, 2))));
  const body = {
    message: message || `Mise à jour ${path}`,
    content: content,
    branch: GITHUB_BRANCH
  };
  if (sha) body.sha = sha;

  const putResp = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!putResp.ok) {
    const errData = await putResp.json().catch(() => ({}));
    throw new Error(`Erreur écriture ${path}: ${putResp.status} — ${errData.message || 'Inconnu'}`);
  }

  return putResp.json();
}

// ========== UNITS ==========
async function loadUnits() {
  const data = await readJsonFile('data/units.json');
  return data || [];
}

async function saveUnits(units, message) {
  // Sort by rang then matricule
  units.sort((a, b) => {
    const ra = a.rang || 'zzz';
    const rb = b.rang || 'zzz';
    if (ra !== rb) return ra.localeCompare(rb);
    return (a.matricule || '').localeCompare(b.matricule || '');
  });
  await writeJsonFile('data/units.json', units, message || 'Mise à jour unités');
  return units;
}

// ========== PLAYTIME ==========
async function loadPlaytime() {
  const data = await readJsonFile('data/playtime.json');
  return data || [];
}

async function savePlaytime(playtime, message) {
  await writeJsonFile('data/playtime.json', playtime, message || 'Mise à jour playtime');
  return playtime;
}

// ========== PLAYTIME HISTORY ==========
async function loadPlaytimeHistory() {
  const data = await readJsonFile('data/playtime_history.json');
  return data || [];
}

async function savePlaytimeHistory(history, message) {
  history.sort((a, b) => (b.import_date || '').localeCompare(a.import_date || ''));
  await writeJsonFile('data/playtime_history.json', history, message || 'Mise à jour archives heures');
  return history;
}

// ========== EXPORT ==========
export {
  getToken, setToken, hasToken, promptToken,
  readJsonFile, writeJsonFile,
  loadUnits, saveUnits,
  loadPlaytime, savePlaytime,
  loadPlaytimeHistory, savePlaytimeHistory,
  GITHUB_OWNER, GITHUB_REPO
};
