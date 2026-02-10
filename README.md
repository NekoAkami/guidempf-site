# Guide Metropolice Force 🚨

Site web interactif avec système d'authentification et validation par administrateur pour le guide de la Metropolice Force (univers fictif inspiré de Half-Life 2).

## 🚀 Accès au Site

**Hébergé via GitHub Pages :**
👉 **https://nekoakami.github.io/guidempf-site/**

Le site est automatiquement déployé à chaque `git push` sur la branche `main`.

---

## ✨ Fonctionnalités

### 🔐 Système d'Authentification Complet
- **Inscription** : Création de compte avec email, matricule (3 chiffres) et mot de passe
- **Validation Admin** : Les nouveaux utilisateurs doivent être approuvés par un administrateur
- **Statuts Utilisateurs** :
  - `PENDING` : En attente de validation
  - `APPROVED` : Approuvé et accès complet
  - `REVOKED` : Accès révoqué
- **Panneau Admin** : Interface de gestion complète pour les administrateurs

### 📱 Interface Moderne
- Design cyberpunk avec animations fluides
- Responsive et optimisé mobile
- Navigation intuitive avec indicateurs visuels
- Bouton d'authentification dynamique dans le header

### 📚 Contenu Enrichi
- **Accueil** : Vue d'ensemble du guide
- **Présentation** : Structure et doctrine opérationnelle de la MPF
- **Unités** : Hiérarchie, grades et codes radio
- **Tactiques** : Formations, règles d'engagement et procédures
- **Équipement** : Armement, protection et communication
- **Contact** : Informations et liens communauté

---

## 📁 Structure du Projet

```
├── index.html                 # Page d'accueil
├── about.html                 # Présentation de la MPF
├── units.html                 # Unités & Grades
├── tactics.html               # Tactiques opérationnelles
├── equipment.html             # Équipement standard
├── contact.html               # Contact & À propos
├── login.html                 # Connexion Firebase
├── register.html              # Inscription Firebase
├── pending.html               # Page d'attente de validation
├── admin/
│   └── panel.html             # Panneau d'administration
├── assets/
│   ├── css/
│   │   └── style.css          # Styles globaux avec animations
│   └── js/
│       └── auth.js            # Script d'authentification global
├── package.json               # Dépendances
├── server.js                  # Serveur Express (dev local)
└── README.md                  # Documentation

```

---

## 🔧 Configuration Firebase

Le site utilise Firebase pour l'authentification et le stockage des données utilisateurs.

### Configuration actuelle :
```javascript
Project ID: guidempf
Auth Domain: guidempf.firebaseapp.com
```

### Structure Firestore :
Collection `users` :
```javascript
{
  email: string,
  matricule: string,
  is_admin: boolean,
  approved: boolean,
  status: "PENDING" | "APPROVED" | "REVOKED",
  created_at: timestamp,
  approved_at: timestamp (optionnel),
  revoked_at: timestamp (optionnel)
}
```

---

## 👥 Gestion des Utilisateurs

### Inscription Nouvelle Utilisateur
1. Visitez `register.html`
2. Remplissez email, matricule (3 chiffres) et mot de passe (min 8 caractères)
3. Soumettez → Redirection vers `pending.html`
4. Attendez l'approbation d'un administrateur

### Connexion
1. Visitez `login.html`
2. Entrez email et mot de passe
3. Si approuvé → Accès au site
4. Si non approuvé → Redirection vers `pending.html`

### Panneau Administrateur
Accessible uniquement aux utilisateurs avec `is_admin: true`

**Fonctionnalités :**
- 📊 Statistiques en temps réel (total, approuvés, en attente, admins)
- 🔍 Recherche et filtrage des utilisateurs
- ✓ Approbation des nouveaux utilisateurs
- ✗ Révocation d'accès
- ↻ Réactivation d'utilisateurs révoqués

**Accès :** `/admin/panel.html`

---

## 💻 Développement Local

### Installation
```bash
# Cloner le dépôt
git clone https://github.com/NekoAkami/guidempf-site.git
cd guidempf-site

# Installer les dépendances (optionnel, pour le serveur Express)
npm install
```

### Lancement
```bash
# Option 1 : Ouvrir directement les fichiers HTML dans un navigateur
# (Firebase fonctionne en mode statique)

# Option 2 : Serveur Express (dev)
npm start
# → http://localhost:3000
```

### Créer un Premier Admin
Pour créer le premier administrateur avec Firebase :

1. Inscrivez-vous sur le site via `register.html`
2. Accédez à la console Firebase : https://console.firebase.google.com/
3. Allez dans **Firestore Database**
4. Trouvez votre utilisateur dans la collection `users`
5. Modifiez manuellement :
   ```
   is_admin: true
   approved: true
   status: "APPROVED"
   ```

---

## 🚀 Déploiement GitHub Pages

Le site est déployé automatiquement via GitHub Pages.

### Configuration GitHub Pages
1. Allez sur **Settings** → **Pages**
2. **Source** : `Deploy from a branch`
3. **Branch** : `main` / **folder** : `/ (root)`
4. Sauvegardez

✅ Le site sera disponible à : `https://nekoakami.github.io/guidempf-site/`

### Mise à Jour
```bash
git add .
git commit -m "Amélioration du site"
git push origin main
```
→ Déploiement automatique en quelques secondes

---

## 🎨 Personnalisation

### Thème de Couleurs (CSS)
Modifiez les variables dans `assets/css/style.css` :
```css
:root {
  --bg: #0a0e1a;           /* Fond principal */
  --bg-alt: #0f1420;       /* Fond secondaire */
  --accent: #00d4ff;       /* Couleur d'accentuation */
  --accent-dark: #0088bb;  /* Accent foncé */
  --text: #e6f2ff;         /* Texte principal */
  --muted: #99aacc;        /* Texte secondaire */
  --warning: #ff6b35;      /* Alertes/warnings */
  --success: #00ff88;      /* Messages de succès */
}
```

### Animations
Les animations sont définies avec `@keyframes` dans le CSS :
- `fadeInUp` / `fadeInDown` : Apparitions fluides
- `pulse` : Effet de pulsation sur les titres
- `glow` : Effet lumineux

---

## 📊 Statuts & Badges

Le système utilise des badges visuels pour identifier rapidement les statuts :

| Badge | Signification | Couleur |
|-------|---------------|---------|
| 🟢 APPROUVÉ | Utilisateur validé | Cyan |
| 🟡 EN ATTENTE | Validation nécessaire | Jaune |
| 🔴 RÉVOQUÉ | Accès suspendu | Orange/Rouge |
| 🟠 ADMIN | Droits administrateur | Orange |

---

## 🔒 Sécurité

### Bonnes Pratiques Implémentées
- ✅ Authentification Firebase sécurisée
- ✅ Validation côté client avant soumission
- ✅ Rate limiting sur les endpoints critiques (dans server.js)
- ✅ Hashage des mots de passe avec bcrypt
- ✅ Sessions sécurisées avec express-session
- ✅ Vérification du statut utilisateur à chaque connexion

### Recommandations
- 🔐 Changez les clés secrètes en production
- 🔐 Activez HTTPS sur le domaine personnalisé
- 🔐 Configurez les règles de sécurité Firestore appropriées
- 🔐 Limitez l'accès aux clés Firebase

---

## 🐛 Résolution de Problèmes

### L'utilisateur ne peut pas se connecter
1. Vérifiez que le statut est `APPROVED` dans Firestore
2. Vérifiez que `approved: true`
3. Supprimez le cache du navigateur

### Le panneau admin ne s'affiche pas
1. Vérifiez que `is_admin: true` dans Firestore
2. Vérifiez la connexion Firebase
3. Consultez la console du navigateur (F12)

### Les animations ne fonctionnent pas
1. Vérifiez que le CSS est bien chargé
2. Testez sur un navigateur récent
3. Désactivez les extensions navigateur qui bloquent les animations

---

## 📞 Support & Contributions

### Signaler un Problème
- Ouvrez une issue sur GitHub : [github.com/NekoAkami/guidempf-site/issues](https://github.com/NekoAkami/guidempf-site/issues)

### Contribuer
1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/amelioration`)
3. Committez vos changements (`git commit -m 'Ajout nouvelle fonctionnalité'`)
4. Push vers la branche (`git push origin feature/amelioration`)
5. Ouvrez une Pull Request

---

## 📄 Licence & Crédits

**À propos :**
Ce guide est une création de fans, créée à titre éducatif et créatif. Il n'est pas affilié à Valve Corporation ni au jeu Half-Life 2.

**Univers :** Half-Life 2 © Valve Corporation  
**Site créé par :** NekoAkami  
**Année :** 2026

---

## 🎯 Roadmap Future

- [ ] Mode sombre/clair toggle
- [ ] Système de notifications en temps réel
- [ ] Forum communautaire intégré
- [ ] API REST documentée
- [ ] Tests automatisés
- [ ] Système de badges/achievements utilisateur

---

**Made with ❤️ by the Half-Life 2 community**

## 🔐 Authentification Firebase

Le site utilise **Firebase** pour l'authentification et la validation d'accès.

### Flux utilisateur

1. **S'inscrire** (`register.html`) → compte créé, `approved: false`
2. **Attendre approbation** (`pending.html`)
3. **Admin approuve** (`admin/panel.html`) → `approved: true`
4. **Se connecter** (`login.html`) → accès au site

### Configuration Firebase

Déjà configurée dans les fichiers HTML :
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDPs4x2EE1pyeQTC_V-Ze5uyZ8Rs2N8qF4",
  authDomain: "guidempf.firebaseapp.com",
  projectId: "guidempf",
  storageBucket: "guidempf.firebasestorage.app",
  messagingSenderId: "806309770965",
  appId: "1:806309770965:web:3621f58bfb252446c1945c"
};
```

---

## 👨‍💼 Gestion Admin

### Script CLI (`admin-setup.js`)

Pour gérer les utilisateurs et rôles via terminal :

**Installation préalable :**
1. Télécharge la clé Firebase :
   - https://console.firebase.google.com
   - Projet `guidempf` → **Project Settings**
   - **Service Accounts** → **Generate New Private Key**
   - Sauvegarde `serviceAccountKey.json` à la racine

2. Installe les dépendances :
   ```bash
   npm install
   ```

**Utilisation :**
```bash
# Rendre admin
node admin-setup.js setAdmin email@example.com

# Approuver un utilisateur
node admin-setup.js approve email@example.com

# Révoquer un utilisateur
node admin-setup.js revoke email@example.com

# Lister les utilisateurs
node admin-setup.js list
```

### Panneau Admin Web (`admin/panel.html`)

Accessible après connexion pour les admins :
- Liste des utilisateurs
- Statut d'approbation
- Boutons Approuver / Révoquer
- Filtres et recherche

---

## 🎨 Design

- **Thème :** Metropolice Force (cyan #00d4ff, background sombre)
- **Style :** Responsive, moderne, cohérent
- **Polices :** Courier New (monospace futuriste)

---

## 🛠️ Développement Local (optionnel)

Si tu veux tester le serveur Express localement :

```bash
npm install
node server.js
# Ouvre http://localhost:3000
```

**Note :** Pour GitHub Pages, seul le contenu statique (HTML/CSS/JS) est servi — le serveur n'est pas utilisé.

---

## 📝 Contenu

Toutes les pages contiennent du contenu original, créé à titre éducatif et créatif. Pas de reproduction textuelle du jeu Half-Life 2.

---

## 📤 Publier des changements

```bash
# Faire des changements localement
git add .
git commit -m "Description du changement"
git push origin main
```

GitHub Pages met à jour automatiquement le site ! ✅

---

## 📄 License & Crédit

- **Fan-made** pour Half-Life 2
- **Contenu original** créé à titre éducatif
- **Pas d'affiliation** avec Valve Corporation
- © 2026 Metropolice Force Guide

# Retirer le rôle admin
node admin-setup.js removeAdmin admin@example.com

# Approuver un utilisateur (permet la connexion)
node admin-setup.js approve user@example.com

# Révoquer un utilisateur
node admin-setup.js revoke user@example.com

# Lister tous les utilisateurs
node admin-setup.js list
```

### Sécurité des règles Firestore (recommandé)

Après avoir attribué le claim admin via `setAdmin`, configure les règles Firestore pour empêcher les modifications non-autorisées :

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // Chaque utilisateur peut lire son propre document
      allow read: if request.auth.uid == userId;
      
      // Seul un admin peut modifier le champ 'approved'
      allow update: if request.auth.token.admin == true;
      
      // Les utilisateurs peuvent créer leur propre document lors de l'inscription
      allow create: if request.auth.uid == userId;
    }
  }
}
```

Applique ces règles dans la console Firebase : https://console.firebase.google.com > Firestore Database > Rules.

