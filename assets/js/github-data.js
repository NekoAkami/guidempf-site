/**
 * Data Store — Firestore (rapide ~200ms)
 * Remplace l'approche GitHub API (~2-3s par écriture).
 * Auto-migration : si Firestore vide, charge depuis les JSON GitHub et migre.
 * Fallback : si Firestore inaccessible, lit depuis GitHub raw.
 */

import { db } from './auth.js';
import {
  doc, getDoc, setDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const GITHUB_OWNER = 'NekoAkami';
const GITHUB_REPO  = 'guidempf-site';
const GITHUB_BRANCH = 'main';
const FS_COLLECTION = 'mpf_data';

// ========== SYNC STATUS ==========
let _syncListeners = [];
let _pendingWrites = 0;

function onSyncStatus(fn) { _syncListeners.push(fn); }
function _notifySync(status) { _syncListeners.forEach(fn => fn(status)); }

// ========== CORE READ (Firestore → fallback GitHub → auto-migrate) ==========
async function readData(key) {
  // 1. Lire depuis Firestore
  try {
    const snap = await getDoc(doc(db, FS_COLLECTION, key));
    if (snap.exists()) {
      return snap.data().items || [];
    }
  } catch (e) {
    console.warn(`[DataStore] Firestore read '${key}' failed:`, e.message);
  }

  // 2. Fallback : JSON GitHub raw
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/${key}.json?t=${Date.now()}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const items = await resp.json();
      // Auto-migration vers Firestore si possible
      if (Array.isArray(items) && items.length > 0) {
        try {
          await setDoc(doc(db, FS_COLLECTION, key), {
            items,
            migrated_at: new Date().toISOString()
          });
          console.log(`[DataStore] Migré '${key}' → Firestore (${items.length} items)`);
        } catch (_me) {
          // Pas authentifié pour écrire → migration échoue, on retourne quand même les data
        }
      }
      return items || [];
    }
  } catch (e) {
    console.warn(`[DataStore] GitHub fallback '${key}' failed:`, e.message);
  }

  return [];
}

// ========== CORE WRITE (Firestore direct) ==========
async function writeData(key, items, message) {
  _pendingWrites++;
  _notifySync('syncing');
  try {
    await setDoc(doc(db, FS_COLLECTION, key), {
      items,
      updated_at: new Date().toISOString(),
      message: message || ''
    });
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('synced');
  } catch (err) {
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('error');
    throw err;
  }
}

// ========== COMPAT readJsonFile / writeJsonFile ==========
async function readJsonFile(path) {
  const key = path.replace(/^data\//, '').replace(/\.json$/, '');
  return readData(key);
}

async function writeJsonFile(path, data, message) {
  const key = path.replace(/^data\//, '').replace(/\.json$/, '');
  return writeData(key, data, message);
}

// ========== UNITS ==========
async function loadUnits() {
  return await readData('units');
}

async function saveUnits(units, message) {
  units.sort((a, b) => {
    const ra = a.rang || 'zzz';
    const rb = b.rang || 'zzz';
    if (ra !== rb) return ra.localeCompare(rb);
    return (a.matricule || '').localeCompare(b.matricule || '');
  });
  await writeData('units', units, message || 'Mise à jour unités');
  return units;
}

// ========== PLAYTIME ==========
async function loadPlaytime() {
  return await readData('playtime');
}

async function savePlaytime(playtime, message) {
  await writeData('playtime', playtime, message || 'Mise à jour playtime');
  return playtime;
}

// ========== PLAYTIME HISTORY ==========
async function loadPlaytimeHistory() {
  return await readData('playtime_history');
}

async function savePlaytimeHistory(history, message) {
  history.sort((a, b) => (b.import_date || '').localeCompare(a.import_date || ''));
  await writeData('playtime_history', history, message || 'Mise à jour archives heures');
  return history;
}

// ========== ABSENCES ==========
async function loadAbsences() {
  return await readData('absences');
}

async function saveAbsences(absences, message) {
  absences.sort((a, b) => (b.debut || '').localeCompare(a.debut || ''));
  await writeData('absences', absences, message || 'Mise à jour absences');
  return absences;
}

// ========== RAPPORTS ==========
async function loadReports() {
  return await readData('reports');
}

async function saveReports(reports, message) {
  reports.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  await writeData('reports', reports, message || 'Mise à jour rapports');
  return reports;
}

// ========== DEPOTS ==========
async function loadDeposits() {
  return await readData('deposits');
}

async function saveDeposits(deposits, message) {
  deposits.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  await writeData('deposits', deposits, message || 'Mise à jour dépôts');
  return deposits;
}

// ========== EXPORT ==========
export {
  readJsonFile, writeJsonFile, onSyncStatus,
  loadUnits, saveUnits,
  loadPlaytime, savePlaytime,
  loadPlaytimeHistory, savePlaytimeHistory,
  loadAbsences, saveAbsences,
  loadReports, saveReports,
  loadDeposits, saveDeposits,
  GITHUB_OWNER, GITHUB_REPO
};
