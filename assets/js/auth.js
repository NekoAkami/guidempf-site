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

// Fonction pour vérifier si l'utilisateur est authentifié et approuvé
export async function requireAuth(redirectToLogin = true) {
  return new Promise((resolve, reject) => {
    onAuthStateChanged(auth, async (user) => {
      if (!user) {
        if (redirectToLogin) {
          window.location.href = '/login.html';
        }
        reject(new Error('Non authentifié'));
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          if (redirectToLogin) {
            await signOut(auth);
            window.location.href = '/login.html';
          }
          reject(new Error('Utilisateur non trouvé'));
          return;
        }

        const userData = userDoc.data();
        if (userData.approved !== true) {
          if (redirectToLogin) {
            window.location.href = '/pending.html';
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
          authBtn.innerHTML = `
            <span style="color:var(--muted);margin-right:1rem">${userData.matricule || ''}</span>
            ${isAdmin ? '<a href="/admin/panel.html" class="btn" style="margin-right:.5rem">Admin</a>' : ''}
            <button onclick="window.logoutUser()" class="btn secondary">Déconnexion</button>
          `;
        } else {
          authBtn.innerHTML = `<a href="/login.html" class="btn">Connexion</a>`;
        }
      } catch (err) {
        authBtn.innerHTML = `<a href="/login.html" class="btn">Connexion</a>`;
      }
    } else {
      authBtn.innerHTML = `<a href="/login.html" class="btn">Connexion</a>`;
    }
  });
}

// Fonction de déconnexion globale
window.logoutUser = async () => {
  try {
    await signOut(auth);
    window.location.href = '/index.html';
  } catch (err) {
    console.error('Erreur de déconnexion:', err);
  }
};

// Initialisation automatique du bouton d'authentification
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', updateAuthButton);
} else {
  updateAuthButton();
}
