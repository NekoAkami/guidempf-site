// assets/js/maintenance.js
// Gestion du mode maintenance (admin)
import { db, auth } from './auth.js';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const MAINTENANCE_DOC = doc(db, 'config', 'maintenance');

export async function setMaintenanceMode(enabled) {
  await setDoc(MAINTENANCE_DOC, { enabled }, { merge: true });
}

export function listenMaintenanceMode(cb) {
  return onSnapshot(MAINTENANCE_DOC, (snap) => {
    cb(snap.exists() && snap.data().enabled === true);
  });
}

export async function isMaintenanceMode() {
  const snap = await getDoc(MAINTENANCE_DOC);
  return snap.exists() && snap.data().enabled === true;
}

// Pour usage dans panel admin et global-nav
window.setMaintenanceMode = setMaintenanceMode;
window.listenMaintenanceMode = listenMaintenanceMode;
window.isMaintenanceMode = isMaintenanceMode;
