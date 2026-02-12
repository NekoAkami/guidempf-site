// assets/js/maintenance.js
// Gestion du mode maintenance (admin)
import { db, auth } from './auth.js';
import { doc, getDoc, setDoc, onSnapshot, collection, addDoc, getDocs, query, orderBy, limit, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const MAINTENANCE_DOC = doc(db, 'config', 'maintenance');
const MAINTENANCE_LOG_COL = collection(db, 'config', 'maintenance', 'logs');

/**
 * Active ou désactive le mode maintenance.
 * @param {boolean} enabled
 * @param {object} options - { message, estimated_return, activated_by }
 */
export async function setMaintenanceMode(enabled, options = {}) {
  const data = {
    enabled,
    updated_at: new Date().toISOString()
  };
  if (enabled) {
    data.message = options.message || 'Le site est temporairement indisponible pour maintenance.';
    data.estimated_return = options.estimated_return || '';
    data.activated_by = options.activated_by || '';
    data.activated_at = new Date().toISOString();
  } else {
    data.message = '';
    data.estimated_return = '';
    data.deactivated_at = new Date().toISOString();
    data.deactivated_by = options.activated_by || '';
  }
  await setDoc(MAINTENANCE_DOC, data, { merge: true });

  // Ajouter au journal
  try {
    await addDoc(MAINTENANCE_LOG_COL, {
      action: enabled ? 'ACTIVATION' : 'DÉSACTIVATION',
      by: options.activated_by || 'inconnu',
      message: data.message,
      estimated_return: data.estimated_return || '',
      timestamp: new Date().toISOString()
    });
  } catch (e) { console.warn('Log maintenance échoué:', e); }
}

/**
 * Écoute les changements d'état maintenance en temps réel.
 * Le callback reçoit l'objet complet { enabled, message, estimated_return, ... }
 */
export function listenMaintenanceMode(cb) {
  return onSnapshot(MAINTENANCE_DOC, (snap) => {
    if (!snap.exists()) { cb({ enabled: false }); return; }
    cb(snap.data());
  });
}

/**
 * Vérifie si le mode maintenance est actif.
 * @returns {Promise<boolean>}
 */
export async function isMaintenanceMode() {
  try {
    const snap = await getDoc(MAINTENANCE_DOC);
    return snap.exists() && snap.data().enabled === true;
  } catch { return false; }
}

/**
 * Récupère les infos complètes de maintenance (message, heure de retour, etc.)
 * @returns {Promise<object>}
 */
export async function getMaintenanceInfo() {
  try {
    const snap = await getDoc(MAINTENANCE_DOC);
    if (!snap.exists()) return { enabled: false };
    return snap.data();
  } catch { return { enabled: false }; }
}

/**
 * Récupère le journal des activations/désactivations.
 * @param {number} maxEntries
 * @returns {Promise<Array>}
 */
export async function getMaintenanceLogs(maxEntries = 20) {
  try {
    const q = query(MAINTENANCE_LOG_COL, orderBy('timestamp', 'desc'), limit(maxEntries));
    const snap = await getDocs(q);
    const logs = [];
    snap.forEach(d => logs.push({ id: d.id, ...d.data() }));
    return logs;
  } catch { return []; }
}

/**
 * Supprime les anciens logs de maintenance.
 */
export async function clearMaintenanceLogs() {
  try {
    const snap = await getDocs(MAINTENANCE_LOG_COL);
    const batch = [];
    snap.forEach(d => batch.push(deleteDoc(d.ref)));
    await Promise.all(batch);
  } catch (e) { console.warn('Nettoyage logs échoué:', e); }
}

// Exposer globalement pour l'admin et global-nav
window.setMaintenanceMode = setMaintenanceMode;
window.listenMaintenanceMode = listenMaintenanceMode;
window.isMaintenanceMode = isMaintenanceMode;
window.getMaintenanceInfo = getMaintenanceInfo;
window.getMaintenanceLogs = getMaintenanceLogs;
