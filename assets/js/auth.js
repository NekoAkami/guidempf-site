// Script d'authentification global pour Metropolice Force Guide
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, collection, getDocs, deleteDoc, serverTimestamp, query, where, Timestamp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { initializeAppCheck, ReCaptchaV3Provider } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-check.js";

const firebaseConfig = {
  apiKey: "AIzaSyDPs4x2EE1pyeQTC_V-Ze5uyZ8Rs2N8qF4",
  authDomain: "guidempf.firebaseapp.com",
  projectId: "guidempf",
  storageBucket: "guidempf.firebasestorage.app",
  messagingSenderId: "806309770965",
  appId: "1:806309770965:web:3621f58bfb252446c1945c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// App Check — reCAPTCHA v3 (protection anti-bot)
const appCheck = initializeAppCheck(app, {
  provider: new ReCaptchaV3Provider('6LevHWksAAAAAGe27JsdRTpIJ6NCT1T0Ekiyuqah'),
  isTokenAutoRefreshEnabled: true
});

// Export pour utilisation dans d'autres scripts
export { app, auth, db };

// Signal pour les scripts non-module (global-nav.js) que Firebase est prêt
window._mpfDbReady = true;

// ========== CHARGEMENT DES UNITÉS (Firestore → fallback GitHub) ==========
let _unitsCacheData = null;
let _unitsCacheTime = 0;
const _UNITS_CACHE_TTL = 30000; // 30s cache

async function _loadUnitsLive() {
  // 1. Firestore (source de vérité)
  try {
    const snap = await getDoc(doc(db, 'mpf_data', 'units'));
    if (snap.exists() && snap.data().items) {
      const items = snap.data().items;
      _unitsCacheData = items;
      _unitsCacheTime = Date.now();
      return items;
    }
  } catch (e) {
    console.warn('[Auth] Firestore units read failed:', e.message);
  }
  // 2. Fallback GitHub (lecture seule)
  try {
    const res = await fetch('https://raw.githubusercontent.com/NekoAkami/guidempf-site/main/data/units.json?t=' + Date.now());
    if (res.ok) {
      const items = await res.json();
      if (Array.isArray(items)) return items;
    }
  } catch (_) {}
  return [];
}

export async function loadUnitsLive() {
  if (_unitsCacheData && (Date.now() - _unitsCacheTime) < _UNITS_CACHE_TTL) {
    return _unitsCacheData;
  }
  return await _loadUnitsLive();
}

// Expose pour les scripts non-module
window._mpfLoadUnitsLive = loadUnitsLive;

// Détection automatique du chemin de base (pour les sous-dossiers comme admin/)
const _basePath = (() => {
    const s = document.querySelector('script[src*="auth.js"]');
    if (s) return (s.getAttribute('src') || '').replace('assets/js/auth.js', '');
    return '';
})();

// Fonction pour vérifier si l'utilisateur est authentifié et approuvé
export async function requireAuth(redirectToLogin = true) {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (redirectToLogin) {
          window.location.href = _basePath + 'login.html';
        }
        reject(new Error('Non authentifié'));
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          if (redirectToLogin) {
            await signOut(auth);
            window.location.href = _basePath + 'login.html';
          }
          reject(new Error('Utilisateur non trouvé'));
          return;
        }

        const userData = userDoc.data();
        if (userData.approved !== true) {
          if (redirectToLogin) {
            window.location.href = _basePath + 'pending.html';
          }
          reject(new Error('Utilisateur non approuvé'));
          return;
        }

        resolve({
          uid: user.uid,
          email: user.email,
          ...userData
        });
      } catch (err) {
        reject(err);
      }
    });
  });
}

// Fonction pour mettre à jour le bouton d'authentification dans le header
export async function updateAuthButton() {
  const authBtn = document.getElementById('authBtn');
  if (!authBtn) return;

  onAuthStateChanged(auth, async (user) => {
    if (user) {
      try {
        const snap = await getDoc(doc(db, 'users', user.uid));
        const userData = snap.exists() ? snap.data() : null;
        
        if (userData && userData.approved) {
          const isAdmin = userData.is_admin === true;
          const matricule = userData.matricule || '???';

          // Enrichir avec les données d'unité (rang + division + accréditation)
          let gradeMatDiv = 'C17.' + matricule;
          let accredLine = '';
          let unitRang = '';
          const _accredMap = { 'RCT': 'Recrue', '.05': 'MPF', '.04': 'MPF', '.03': 'MPF', 'STB': 'MPF', '.02': 'MPEF', '.01': 'MPEF', 'DvL': 'MPEF', 'STBE': 'MPEF', 'CABAL': 'MPEF', 'Ofc': 'HautGradé', 'Cmd': 'HautGradé' };
          const _formateurLabel = (acc) => (acc === 'MPF' || acc === 'Recrue') ? 'Unité Formatrice MPF' : (acc === 'MPEF' || acc === 'HautGradé') ? 'Unité Formatrice MPEF' : '';
          try {
            const units = await loadUnitsLive();
            const unit = units.find(u => u.matricule === matricule);
            if (unit) {
              unitRang = unit.rang || '';
              const isUnitHG = unit.rang === 'Ofc' || unit.rang === 'Cmd';
              const r = unit.rang && unit.rang !== 'MISSING' ? unit.rang : '';
              const d = !isUnitHG && unit.division && unit.division !== 'N/A' ? unit.division : '';
              // Format : C17.grade.division.matricule (ou C17.grade.matricule pour HG)
              gradeMatDiv = ['C17', r, d, matricule].filter(Boolean).join('.');
              const acc = _accredMap[unit.rang] || '';
              if (acc) {
                accredLine = 'Accréditation : ' + acc;
                if (unit.formateur) accredLine += ' — ' + _formateurLabel(acc);
              }
            }
          } catch (_) {}

          const isHG = unitRang === 'Ofc' || unitRang === 'Cmd';
          const showPanelBtn = isAdmin || isHG;
          authBtn.innerHTML = `
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.72rem;color:var(--text-muted);margin-right:0.8rem;letter-spacing:0.5px;display:inline-flex;flex-direction:column;line-height:1.4;">
              <span>Unité Connecté au terminal : <span style="color:var(--accent-cyan);font-weight:700;">${gradeMatDiv}</span></span>
              ${accredLine ? `<span style="font-size:0.65rem;opacity:0.7;">${accredLine}</span>` : ''}
            </span>
            ${showPanelBtn ? `<a href="${_basePath}admin/${isAdmin ? 'panel' : 'maintenance-admin'}.html" class="btn" style="margin-right:.5rem">${isAdmin ? 'Admin' : 'Maintenance'}</a>` : ''}
            <button onclick="window.logoutUser()" class="btn secondary">Déconnexion</button>
          `;
          // Démarrer la présence en ligne
          startPresence(user.uid, matricule, userData.nom_steam || userData.pseudo || user.displayName || '');
        } else {
          authBtn.innerHTML = `<a href="${_basePath}login.html" class="btn">Connexion</a>`;
          injectOnlineCounter();
          updateOnlineCounter();
        }
      } catch (err) {
        authBtn.innerHTML = `<a href="${_basePath}login.html" class="btn">Connexion</a>`;
        injectOnlineCounter();
        updateOnlineCounter();
      }
    } else {
      authBtn.innerHTML = `<a href="${_basePath}login.html" class="btn">Connexion</a>`;
      injectOnlineCounter();
      updateOnlineCounter();
    }
  });
}

// Fonction de déconnexion globale
window.logoutUser = async () => {
  try {
    await signOut(auth);
    window.location.href = _basePath + 'index.html';
  } catch (err) {
    console.error('Erreur de déconnexion:', err);
  }
};

// ========== PRÉSENCE EN LIGNE ==========
let _presenceInterval = null;
let _presenceData = {};

async function updatePresence(uid) {
  try {
    await setDoc(doc(db, 'presence', uid), {
      matricule: _presenceData.matricule || '???',
      pseudo: _presenceData.pseudo || '',
      last_seen: serverTimestamp(),
      page: (window.location.pathname.split('/').pop() || 'index.html'),
      uid
    });
  } catch (_) {}
}

async function countOnlineUsers() {
  try {
    const cutoff = Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 1000)); // 2 min
    const snap = await getDocs(query(collection(db, 'presence'), where('last_seen', '>', cutoff)));
    return snap.size;
  } catch (_) { return 0; }
}

async function updateOnlineCounter() {
  const el = document.getElementById('onlineCount');
  if (!el) return;
  const count = await countOnlineUsers();
  el.textContent = count;
}

function injectOnlineCounter() {
  const headerContent = document.querySelector('.header-content');
  if (!headerContent || document.getElementById('onlineCounter')) return;
  // Rendre le header-content position:relative pour le centrage absolu
  headerContent.style.position = 'relative';
  const counter = document.createElement('div');
  counter.id = 'onlineCounter';
  counter.style.cssText = 'position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);display:flex;flex-direction:column;align-items:center;font-family:"Share Tech Mono",monospace;pointer-events:none;z-index:1;';
  counter.innerHTML = `
    <span style="font-size:1.4rem;font-weight:700;color:var(--accent-cyan);line-height:1;" id="onlineCount">-</span>
    <span style="font-size:0.6rem;color:var(--text-muted);letter-spacing:1.5px;text-transform:uppercase;">En ligne</span>
  `;
  headerContent.appendChild(counter);
}

function startPresence(uid, matricule, pseudo) {
  _presenceData = { matricule: matricule || '???', pseudo: pseudo || '' };
  updatePresence(uid);
  _presenceInterval = setInterval(() => updatePresence(uid), 45000); // heartbeat chaque 45s

  injectOnlineCounter();
  updateOnlineCounter();
  setInterval(updateOnlineCounter, 30000); // refresh compteur chaque 30s

  // Cleanup au départ
  window.addEventListener('beforeunload', () => {
    clearInterval(_presenceInterval);
    // Supprimer la présence via sendBeacon
    try {
      navigator.sendBeacon(
        `https://firestore.googleapis.com/v1/projects/guidempf/databases/(default)/documents/presence/${uid}`,
        ''
      );
    } catch (_) {}
    deleteDoc(doc(db, 'presence', uid)).catch(() => {});
  });
}

// ========== CONTRÔLE D'ACCÈS PAR PAGE ==========
// Retourne null si accès autorisé, ou un message d'erreur si refusé
async function _checkPageAccess(currentPage, userData) {
  try {
    // Admin bypass
    if (userData.is_admin === true) return null;

    // Construire le chemin relatif (pour pages dans sous-dossiers comme divisions/helix.html)
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    const filename = pathParts.pop() || 'index.html';
    const parentFolder = pathParts.length > 0 ? pathParts[pathParts.length - 1] : '';
    const pageCandidates = [filename];
    if (parentFolder && !['guidempf-site', 'workspaces', ''].includes(parentFolder)) {
      pageCandidates.push(parentFolder + '/' + filename);
    }

    // Charger la config d'accès (cache ou Firestore)
    let pageAccessConfig = null;
    try {
      const cached = localStorage.getItem('mpf_page_access');
      const ts = parseInt(localStorage.getItem('mpf_page_access_ts') || '0');
      if (cached && Date.now() - ts < 5 * 60 * 1000) { // 5 min cache
        pageAccessConfig = JSON.parse(cached);
      }
    } catch {}

    if (!pageAccessConfig) {
      try {
        const snap = await getDoc(doc(db, 'config', 'page_access'));
        if (snap.exists()) {
          pageAccessConfig = snap.data();
          localStorage.setItem('mpf_page_access', JSON.stringify(pageAccessConfig));
          localStorage.setItem('mpf_page_access_ts', Date.now().toString());
        }
      } catch {}
    }

    if (!pageAccessConfig || !pageAccessConfig.pages) return null;

    // Trouver les restrictions pour cette page
    let rules = null;
    for (const candidate of pageCandidates) {
      if (pageAccessConfig.pages[candidate]) {
        rules = pageAccessConfig.pages[candidate];
        break;
      }
    }
    if (!rules) return null;
    if (!rules.rang_min && (!rules.divisions || rules.divisions.length === 0) && !rules.formateur_only) return null;

    // Charger les données d'unité pour vérifier rang/division/formateur
    const matricule = userData.matricule || '';
    let unit = null;
    try {
      const units = await loadUnitsLive();
      unit = units.find(u => u.matricule === matricule);
    } catch {}

    if (!unit) return 'Unité introuvable. Contactez un administrateur.';

    const rang = unit.rang || '';
    const division = unit.division || '';
    const isFormateur = unit.formateur || false;
    const isHG = rang === 'Ofc' || rang === 'Cmd';

    // HG contournent toutes les restrictions
    if (isHG) return null;

    // Vérifier le grade minimum
    if (rules.rang_min) {
      const rankOrder = ['RCT', '.05', '.04', '.03', 'STB', '.02', '.01', 'DvL', 'STBE', 'CABAL', 'Ofc', 'Cmd'];
      const userRankIdx = rankOrder.indexOf(rang);
      const minRankIdx = rankOrder.indexOf(rules.rang_min);
      if (userRankIdx === -1 || userRankIdx < minRankIdx) {
        return `Grade insuffisant. Minimum requis : ${rules.rang_min}+`;
      }
    }

    // Vérifier les divisions autorisées
    if (rules.divisions && rules.divisions.length > 0) {
      if (!rules.divisions.includes(division)) {
        return `Division non autorisée. Divisions requises : ${rules.divisions.join(', ')}`;
      }
    }

    // Vérifier formateur
    if (rules.formateur_only && !isFormateur) {
      return 'Accès réservé aux formateurs.';
    }

    return null; // Accès autorisé
  } catch (err) {
    console.warn('Page access check error:', err);
    return null; // En cas d'erreur, ne pas bloquer
  }
}

// Initialisation automatique du bouton d'authentification + protection des pages
function initAuth() {
  updateAuthButton();

  // Pages publiques (accessibles sans connexion)
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const publicPages = ['login.html', 'register.html', 'pending.html', 'index.html', 'viewtime.html'];
  
  if (publicPages.includes(currentPage)) return;

  // Protéger toutes les autres pages : masquer le contenu et vérifier l'auth
  const main = document.querySelector('main');
  if (main) main.style.opacity = '0';

  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      window.location.href = _basePath + 'login.html';
      return;
    }
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        window.location.href = _basePath + 'login.html';
        return;
      }
      const userData = userDoc.data();
      if (userData.approved !== true) {
        window.location.href = _basePath + 'pending.html';
        return;
      }

      // === Vérification des restrictions d'accès par page ===
      const accessDenied = await _checkPageAccess(currentPage, userData);
      if (accessDenied) {
        if (main) {
          main.innerHTML = `<div style="text-align:center;padding:3rem;">
            <h2 style="color:#ff4444;font-family:'Orbitron',sans-serif;font-size:1.2rem;">ACCÈS RESTREINT</h2>
            <p style="color:var(--text-muted);font-family:'Share Tech Mono',monospace;font-size:0.82rem;margin-top:1rem;">${accessDenied}</p>
            <a href="${_basePath}index.html" style="color:var(--accent-cyan);font-family:'Share Tech Mono',monospace;display:inline-block;margin-top:1rem;">→ RETOUR À L'ACCUEIL</a>
          </div>`;
          main.style.transition = 'opacity 0.3s';
          main.style.opacity = '1';
        }
        return;
      }

      // Utilisateur authentifié et approuvé — afficher le contenu
      if (main) {
        main.style.transition = 'opacity 0.3s';
        main.style.opacity = '1';
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      window.location.href = _basePath + 'login.html';
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuth);
} else {
  initAuth();
}
