// Script d'authentification global pour Metropolice Force Guide
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// Export pour utilisation dans d'autres scripts
export { app, auth, db };

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

          // Enrichir avec les données d'unité (rang + division)
          let identParts = [matricule];
          try {
            const res = await fetch('https://raw.githubusercontent.com/NekoAkami/guidempf-site/main/data/units.json');
            if (res.ok) {
              const units = await res.json();
              const unit = units.find(u => u.matricule === matricule);
              if (unit) {
                const r = unit.rang && unit.rang !== 'MISSING' ? unit.rang : '';
                const d = unit.division && unit.division !== 'N/A' ? unit.division : '';
                identParts = [r, d, matricule].filter(Boolean);
              }
            }
          } catch (_) {}
          const identLabel = identParts.map(p => `<span style="color:var(--accent-cyan);font-weight:700;">${p}</span>`).join(' ');

          authBtn.innerHTML = `
            <span style="font-family:'Share Tech Mono',monospace;font-size:0.75rem;color:var(--text-muted);margin-right:0.8rem;letter-spacing:1px;">${identLabel}</span>
            ${isAdmin ? `<a href="${_basePath}admin/panel.html" class="btn" style="margin-right:.5rem">Admin</a>` : ''}
            <button onclick="window.logoutUser()" class="btn secondary">Déconnexion</button>
          `;
        } else {
          authBtn.innerHTML = `<a href="${_basePath}login.html" class="btn">Connexion</a>`;
        }
      } catch (err) {
        authBtn.innerHTML = `<a href="${_basePath}login.html" class="btn">Connexion</a>`;
      }
    } else {
      authBtn.innerHTML = `<a href="${_basePath}login.html" class="btn">Connexion</a>`;
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
