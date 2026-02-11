/**
 * GitHub Data Manager
 * Remplace Firestore : lit/écrit des fichiers JSON dans le repo GitHub.
 * Utilisé par les pages admin pour gérer units, playtime, playtime_history, absences.
 *
 * Optimisations :
 *  - Cache SHA : évite un GET avant chaque PUT
 *  - File d'attente par fichier : sérialise les écritures pour éviter les conflits SHA
 *  - Callbacks de statut de sync pour afficher un indicateur sur la page
 */

const GITHUB_OWNER = 'NekoAkami';
const GITHUB_REPO = 'guidempf-site';
const GITHUB_BRANCH = 'main';

// ========== SHA CACHE ==========
const _shaCache = {};   // path → sha
const _writeQueue = {};  // path → Promise chain
let _syncListeners = []; // callbacks(status) : 'syncing' | 'synced' | 'error'
let _pendingWrites = 0;

function onSyncStatus(fn) { _syncListeners.push(fn); }
function _notifySync(status) { _syncListeners.forEach(fn => fn(status)); }

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
 * Écriture interne — ne pas appeler directement, utiliser writeJsonFile()
 */
async function _doWrite(path, data, message) {
  const token = getToken();
  if (!token) {
    throw new Error('Token GitHub non configuré. Cliquez sur "⚙ TOKEN" pour le configurer.');
  }

  const apiUrl = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

  // 1) Utiliser le SHA en cache, sinon le récupérer
  let sha = _shaCache[path] || null;
  if (!sha) {
    try {
      const getResp = await fetch(apiUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (getResp.ok) {
        const info = await getResp.json();
        sha = info.sha;
        _shaCache[path] = sha;
      }
    } catch (e) {
      // File might not exist yet
    }
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
    // Si conflit SHA (409), invalider le cache et réessayer une fois
    if (putResp.status === 409 || putResp.status === 422) {
      delete _shaCache[path];
      // Retry: refetch SHA
      try {
        const getResp2 = await fetch(apiUrl, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (getResp2.ok) {
          const info2 = await getResp2.json();
          body.sha = info2.sha;
          const retry = await fetch(apiUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
          });
          if (retry.ok) {
            const result = await retry.json();
            _shaCache[path] = result.content.sha;
            return result;
          }
        }
      } catch (e2) { /* fall through to error */ }
    }
    const errData = await putResp.json().catch(() => ({}));
    throw new Error(`Erreur écriture ${path}: ${putResp.status} — ${errData.message || 'Inconnu'}`);
  }

  // 3) Mettre à jour le cache SHA avec le nouveau sha
  const result = await putResp.json();
  if (result.content && result.content.sha) {
    _shaCache[path] = result.content.sha;
  }
  return result;
}

/**
 * Écrire un fichier JSON — sérialisé via file d'attente par path
 */
async function writeJsonFile(path, data, message) {
  // Chaîner les écritures au même fichier pour éviter les conflits
  const prev = _writeQueue[path] || Promise.resolve();
  const next = prev.then(
    () => _wrappedWrite(path, data, message),
    () => _wrappedWrite(path, data, message)  // continue même si la précédente a échoué
  );
  _writeQueue[path] = next.catch(() => {}); // empêcher unhandled rejection dans la chaîne
  return next;
}

async function _wrappedWrite(path, data, message) {
  _pendingWrites++;
  _notifySync('syncing');
  try {
    const result = await _doWrite(path, data, message);
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('synced');
    return result;
  } catch (err) {
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('error');
    throw err;
  }
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

// ========== ABSENCES ==========
async function loadAbsences() {
  const data = await readJsonFile('data/absences.json');
  return data || [];
}

async function saveAbsences(absences, message) {
  absences.sort((a, b) => (b.debut || '').localeCompare(a.debut || ''));
  await writeJsonFile('data/absences.json', absences, message || 'Mise à jour absences');
  return absences;
}

// ========== EXPORT ==========
export {
  getToken, setToken, hasToken, promptToken,
  readJsonFile, writeJsonFile, onSyncStatus,
  loadUnits, saveUnits,
  loadPlaytime, savePlaytime,
  loadPlaytimeHistory, savePlaytimeHistory,
  loadAbsences, saveAbsences,
  GITHUB_OWNER, GITHUB_REPO
};
