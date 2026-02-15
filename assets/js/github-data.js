/**
 * Data Store — Firestore avec sous-collections
 * Rapports/Absences/Dépôts : un document par item (scalable, pas de limite 1 MiB)
 * Units/Playtime : document unique (petits datasets)
 * Auto-migration : ancien format (tableau unique) → sous-collections
 * Rate limiting : max 5 écritures/minute par session
 */

import { db } from './auth.js';
import {
  doc, getDoc, setDoc, deleteDoc,
  collection, getDocs, addDoc
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

// ========== RATE LIMITER ==========
const _rateLimitWindow = 60000; // 1 minute
const _rateLimitMax = 10; // max 10 écritures par minute
let _writeTimestamps = [];

function _checkRateLimit() {
  const now = Date.now();
  _writeTimestamps = _writeTimestamps.filter(t => now - t < _rateLimitWindow);
  if (_writeTimestamps.length >= _rateLimitMax) {
    throw new Error('Trop de requêtes. Veuillez patienter avant de réessayer.');
  }
  _writeTimestamps.push(now);
}

// ========== CORE READ (single document — Firestore → fallback GitHub) ==========
async function readData(key) {
  try {
    const snap = await getDoc(doc(db, FS_COLLECTION, key));
    if (snap.exists()) {
      return snap.data().items || [];
    }
  } catch (e) {
    console.warn(`[DataStore] Firestore read '${key}' failed:`, e.message);
    // IMPORTANT : Ne PAS fallback sur GitHub si Firestore a échoué transitoirement,
    // car cela écraserait les données récentes avec des données potentiellement obsolètes.
    // On retente une fois avant de fallback.
    try {
      const snap2 = await getDoc(doc(db, FS_COLLECTION, key));
      if (snap2.exists()) {
        return snap2.data().items || [];
      }
    } catch (e2) {
      console.warn(`[DataStore] Firestore retry '${key}' also failed:`, e2.message);
    }
  }

  // Fallback GitHub — lecture seule, SANS réécriture dans Firestore
  // (évite d'écraser des données récentes avec un fichier statique obsolète)
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/${key}.json?t=${Date.now()}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const items = await resp.json();
      console.warn(`[DataStore] '${key}' chargé depuis GitHub (lecture seule, pas de migration)`);
      return Array.isArray(items) ? items : [];
    }
  } catch (e) {
    console.warn(`[DataStore] GitHub fallback '${key}' failed:`, e.message);
  }
  return [];
}

// ========== CORE WRITE (single document) ==========
async function writeData(key, items, message) {
  _checkRateLimit();
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

// ========== SUB-COLLECTION READ (all items) ==========
async function readSubCollection(parentKey, sortField, sortDir) {
  const colRef = collection(db, FS_COLLECTION, parentKey, 'items');

  // 1. Essayer de lire la sous-collection
  try {
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      const items = snapshot.docs.map(d => ({ ...d.data(), _id: d.id }));
      // Tri côté client
      if (sortField) {
        items.sort((a, b) => {
          const va = a[sortField] || '';
          const vb = b[sortField] || '';
          return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });
      }
      return items;
    }
  } catch (e) {
    console.warn(`[DataStore] Sub-collection read '${parentKey}/items' failed:`, e.message);
  }

  // 2. Vérifier si les données existent dans l'ancien format (document unique)
  try {
    const snap = await getDoc(doc(db, FS_COLLECTION, parentKey));
    if (snap.exists() && snap.data().items && snap.data().items.length > 0) {
      const oldItems = snap.data().items;
      console.log(`[DataStore] Migration '${parentKey}' : ${oldItems.length} items → sous-collection...`);
      // Migrer vers la sous-collection
      const migrated = [];
      for (const item of oldItems) {
        try {
          const newDoc = await addDoc(colRef, item);
          migrated.push({ ...item, _id: newDoc.id });
        } catch (_) {}
      }
      // Marquer l'ancien document comme migré
      if (migrated.length > 0) {
        try {
          await setDoc(doc(db, FS_COLLECTION, parentKey), {
            migrated_to_subcollection: true,
            migrated_count: migrated.length,
            migrated_at: new Date().toISOString(),
            items: [] // Vider l'ancien tableau
          });
          console.log(`[DataStore] Migration '${parentKey}' terminée : ${migrated.length} items`);
        } catch (_) {}
      }
      if (sortField) {
        migrated.sort((a, b) => {
          const va = a[sortField] || '';
          const vb = b[sortField] || '';
          return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
        });
      }
      return migrated;
    }
  } catch (e) {
    console.warn(`[DataStore] Old format check '${parentKey}' failed:`, e.message);
  }

  // 3. Fallback GitHub JSON — lecture seule, PAS de migration automatique
  // (évite les doublons si Firestore était temporairement indisponible)
  try {
    const url = `https://raw.githubusercontent.com/${GITHUB_OWNER}/${GITHUB_REPO}/${GITHUB_BRANCH}/data/${parentKey}.json?t=${Date.now()}`;
    const resp = await fetch(url);
    if (resp.ok) {
      const items = await resp.json();
      if (Array.isArray(items) && items.length > 0) {
        console.warn(`[DataStore] '${parentKey}' chargé depuis GitHub (lecture seule, ${items.length} items)`);
        return items.map((item, i) => ({ ...item, _id: '__gh_' + i }));
      }
    }
  } catch (e) {
    console.warn(`[DataStore] GitHub fallback '${parentKey}' failed:`, e.message);
  }

  return [];
}

// ========== SUB-COLLECTION ADD ==========
async function addToSubCollection(parentKey, item) {
  _checkRateLimit();
  _pendingWrites++;
  _notifySync('syncing');
  try {
    const colRef = collection(db, FS_COLLECTION, parentKey, 'items');
    const newDoc = await addDoc(colRef, item);
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('synced');
    return { ...item, _id: newDoc.id };
  } catch (err) {
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('error');
    throw err;
  }
}

// ========== SUB-COLLECTION UPDATE ==========
async function updateInSubCollection(parentKey, docId, item) {
  _checkRateLimit();
  _pendingWrites++;
  _notifySync('syncing');
  try {
    const docRef = doc(db, FS_COLLECTION, parentKey, 'items', docId);
    const { _id, ...cleanItem } = item; // Retirer _id avant de sauvegarder
    await setDoc(docRef, cleanItem);
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('synced');
    return { ...cleanItem, _id: docId };
  } catch (err) {
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('error');
    throw err;
  }
}

// ========== SUB-COLLECTION DELETE ==========
async function deleteFromSubCollection(parentKey, docId) {
  _checkRateLimit();
  _pendingWrites++;
  _notifySync('syncing');
  try {
    const docRef = doc(db, FS_COLLECTION, parentKey, 'items', docId);
    await deleteDoc(docRef);
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

// ========== UNITS (document unique — petit dataset) ==========
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

// ========== PLAYTIME (document unique) ==========
async function loadPlaytime() {
  return await readData('playtime');
}

async function savePlaytime(playtime, message) {
  await writeData('playtime', playtime, message || 'Mise à jour playtime');
  return playtime;
}

// ========== PLAYTIME HISTORY (document unique) ==========
async function loadPlaytimeHistory() {
  return await readData('playtime_history');
}

async function savePlaytimeHistory(history, message) {
  history.sort((a, b) => (b.import_date || '').localeCompare(a.import_date || ''));
  await writeData('playtime_history', history, message || 'Mise à jour archives heures');
  return history;
}

// ========== ABSENCES (sous-collection) ==========
async function loadAbsences() {
  return await readSubCollection('absences', 'debut', 'desc');
}

async function saveAbsences(absences, message) {
  // COMPAT : utilisé par l'admin panel pour save all — on écrit chaque item individuellement
  // Pour les nouveaux usages, préférer addAbsence / deleteAbsence / updateAbsence
  absences.sort((a, b) => (b.debut || '').localeCompare(a.debut || ''));
  await writeData('absences', absences, message || 'Mise à jour absences');
  return absences;
}

async function addAbsence(absence) {
  return await addToSubCollection('absences', absence);
}

async function deleteAbsence(docId) {
  return await deleteFromSubCollection('absences', docId);
}

async function updateAbsence(docId, absence) {
  return await updateInSubCollection('absences', docId, absence);
}

// ========== RAPPORTS (sous-collection) ==========
async function loadReports() {
  return await readSubCollection('reports', 'created_at', 'desc');
}

async function saveReports(reports, message) {
  // COMPAT : utilisé par l'admin — écriture document unique
  reports.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  await writeData('reports', reports, message || 'Mise à jour rapports');
  return reports;
}

async function addReport(report) {
  return await addToSubCollection('reports', report);
}

async function deleteReport(docId) {
  return await deleteFromSubCollection('reports', docId);
}

async function updateReport(docId, report) {
  return await updateInSubCollection('reports', docId, report);
}

// ========== DEPOTS (sous-collection) ==========
async function loadDeposits() {
  return await readSubCollection('deposits', 'created_at', 'desc');
}

async function saveDeposits(deposits, message) {
  deposits.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''));
  await writeData('deposits', deposits, message || 'Mise à jour dépôts');
  return deposits;
}

async function addDeposit(deposit) {
  return await addToSubCollection('deposits', deposit);
}

async function deleteDeposit(docId) {
  return await deleteFromSubCollection('deposits', docId);
}

// ========== PAYROLL CONFIG (document unique) ==========
async function loadPayrollConfig() {
  try {
    const snap = await getDoc(doc(db, FS_COLLECTION, 'payroll_config'));
    if (snap.exists()) return snap.data();
  } catch (e) {
    console.warn('[DataStore] Payroll config read failed:', e.message);
  }
  // Valeurs par défaut
  return {
    report_values: {
      'Patrouille': 2.0,
      'Opération': 4.0,
      'Fouille mineur': 1.0,
      'Fouille majeur': 2.0,
      'Point Passage': 1.5,
      'Protection VIP': 3.0,
      'Distribution ration': 1.5,
      'Formation': 3.0,
      'Conscription': 2.0,
      'Session de travail': 1.5,
      'Déblayage': 1.0,
      'Interrogatoire': 2.5,
      'Test de loyauté': 2.0,
      'Autre': 1.0
    }
  };
}

async function savePayrollConfig(config) {
  _checkRateLimit();
  _pendingWrites++;
  _notifySync('syncing');
  try {
    await setDoc(doc(db, FS_COLLECTION, 'payroll_config'), {
      ...config,
      updated_at: new Date().toISOString()
    });
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('synced');
  } catch (err) {
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('error');
    throw err;
  }
}

// ========== PAYROLL ARCHIVES (sous-collection) ==========
async function loadPayrollArchives() {
  return await readSubCollection('payroll', 'week_end', 'desc');
}

async function addPayrollArchive(payroll) {
  return await addToSubCollection('payroll', payroll);
}

async function updatePayrollArchive(docId, payroll) {
  return await updateInSubCollection('payroll', docId, payroll);
}

async function deletePayrollArchive(docId) {
  return await deleteFromSubCollection('payroll', docId);
}

// ========== EARNINGS (sous-collection) ==========
async function loadEarnings() {
  return await readSubCollection('earnings', 'created_at', 'desc');
}

async function addEarning(earning) {
  return await addToSubCollection('earnings', earning);
}

async function deleteEarning(docId) {
  return await deleteFromSubCollection('earnings', docId);
}

// ========== TESTS DE LOYAUTÉ (sous-collection) ==========
async function loadLoyaltyTests() {
  return await readSubCollection('loyalty_tests', 'created_at', 'desc');
}

async function addLoyaltyTest(test) {
  return await addToSubCollection('loyalty_tests', test);
}

async function deleteLoyaltyTest(docId) {
  return await deleteFromSubCollection('loyalty_tests', docId);
}

// ========== PLAINTES (sous-collection) ==========
async function loadComplaints() {
  return await readSubCollection('complaints', 'created_at', 'desc');
}

async function addComplaint(complaint) {
  return await addToSubCollection('complaints', complaint);
}

async function deleteComplaint(docId) {
  return await deleteFromSubCollection('complaints', docId);
}

async function updateComplaint(docId, complaint) {
  return await updateInSubCollection('complaints', docId, complaint);
}

// ========== TESTS D'UNITÉ (sous-collection) ==========
async function loadUnitTests() {
  return await readSubCollection('unit_tests', 'created_at', 'desc');
}

async function addUnitTest(test) {
  return await addToSubCollection('unit_tests', test);
}

async function deleteUnitTest(docId) {
  return await deleteFromSubCollection('unit_tests', docId);
}

async function updateUnitTest(docId, test) {
  return await updateInSubCollection('unit_tests', docId, test);
}

// ========== FORMATIONS (sous-collection) ==========
async function loadFormations() {
  return await readSubCollection('formations', 'created_at', 'desc');
}

async function addFormation(formation) {
  return await addToSubCollection('formations', formation);
}

async function deleteFormation(docId) {
  return await deleteFromSubCollection('formations', docId);
}

async function updateFormation(docId, formation) {
  return await updateInSubCollection('formations', docId, formation);
}

// ========== UNITÉS VIRÉES (sous-collection) ==========
async function loadFiredUnits() {
  return await readSubCollection('fired_units', 'fired_at', 'desc');
}

async function addFiredUnit(unit) {
  return await addToSubCollection('fired_units', unit);
}

async function deleteFiredUnit(docId) {
  return await deleteFromSubCollection('fired_units', docId);
}

// ========== PLANNING ==========
async function loadPlanning() {
  return await readSubCollection('planning', 'date', 'asc');
}

async function addPlanningEntry(entry) {
  return await addToSubCollection('planning', entry);
}

async function deletePlanningEntry(docId) {
  return await deleteFromSubCollection('planning', docId);
}

async function updatePlanningEntry(docId, entry) {
  return await updateInSubCollection('planning', docId, entry);
}

// ========== BLACKLIST (sous-collection) ==========
async function loadBlacklist() {
  return await readSubCollection('blacklist', 'created_at', 'desc');
}

async function addBlacklistEntry(entry) {
  return await addToSubCollection('blacklist', entry);
}

async function deleteBlacklistEntry(docId) {
  return await deleteFromSubCollection('blacklist', docId);
}

async function updateBlacklistEntry(docId, entry) {
  return await updateInSubCollection('blacklist', docId, entry);
}

// ========== RECRUTEMENT (sous-collection) ==========
async function loadRecruitments() {
  return await readSubCollection('recruitments', 'created_at', 'desc');
}

async function addRecruitment(entry) {
  return await addToSubCollection('recruitments', entry);
}

async function deleteRecruitment(docId) {
  return await deleteFromSubCollection('recruitments', docId);
}

async function updateRecruitment(docId, entry) {
  return await updateInSubCollection('recruitments', docId, entry);
}

// ========== COMPETENCES (suivi des formations par unité) ==========
async function loadCompetences() {
  try {
    const docRef = doc(db, FS_COLLECTION, 'competences');
    const snap = await getDoc(docRef);
    if (snap.exists()) return snap.data().units || {};
    return {};
  } catch (err) {
    console.warn('[DataStore] loadCompetences failed:', err.message);
    return {};
  }
}

async function saveCompetences(unitsData) {
  _checkRateLimit();
  _pendingWrites++;
  _notifySync('syncing');
  try {
    const docRef = doc(db, FS_COLLECTION, 'competences');
    await setDoc(docRef, { units: unitsData, updated_at: new Date().toISOString() });
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('synced');
  } catch (err) {
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('error');
    throw err;
  }
}

async function updateUnitCompetence(matricule, field, value) {
  _checkRateLimit();
  _pendingWrites++;
  _notifySync('syncing');
  try {
    const docRef = doc(db, FS_COLLECTION, 'competences');
    const snap = await getDoc(docRef);
    const data = snap.exists() ? (snap.data().units || {}) : {};
    if (!data[matricule]) data[matricule] = {};
    data[matricule][field] = value;
    data[matricule].updated_at = new Date().toISOString();
    await setDoc(docRef, { units: data, updated_at: new Date().toISOString() });
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('synced');
    return data[matricule];
  } catch (err) {
    _pendingWrites--;
    if (_pendingWrites === 0) _notifySync('error');
    throw err;
  }
}

// ========== EXPORT ==========
export {
  readJsonFile, writeJsonFile, onSyncStatus,
  loadUnits, saveUnits,
  loadPlaytime, savePlaytime,
  loadPlaytimeHistory, savePlaytimeHistory,
  loadAbsences, saveAbsences, addAbsence, deleteAbsence, updateAbsence,
  loadReports, saveReports, addReport, deleteReport, updateReport,
  loadDeposits, saveDeposits, addDeposit, deleteDeposit,
  loadPayrollConfig, savePayrollConfig,
  loadPayrollArchives, addPayrollArchive, updatePayrollArchive, deletePayrollArchive,
  loadEarnings, addEarning, deleteEarning,
  loadLoyaltyTests, addLoyaltyTest, deleteLoyaltyTest,
  loadComplaints, addComplaint, deleteComplaint, updateComplaint,
  loadUnitTests, addUnitTest, deleteUnitTest, updateUnitTest,
  loadFormations, addFormation, deleteFormation, updateFormation,
  loadPlanning, addPlanningEntry, deletePlanningEntry, updatePlanningEntry,
  loadFiredUnits, addFiredUnit, deleteFiredUnit,
  loadBlacklist, addBlacklistEntry, deleteBlacklistEntry, updateBlacklistEntry,
  loadRecruitments, addRecruitment, deleteRecruitment, updateRecruitment,
  loadCompetences, saveCompetences, updateUnitCompetence,
  GITHUB_OWNER, GITHUB_REPO
};
