# 🔥 Configuration Firebase - Guide Complet

## 📋 Prérequis

- Compte Google/Gmail
- Accès à Firebase Console : https://console.firebase.google.com/

---

## 🚀 Configuration Initiale du Projet

### 1. Créer le Projet Firebase (Déjà fait)

Le projet **guidempf** est déjà configuré avec :
- Project ID : `guidempf`
- Auth Domain : `guidempf.firebaseapp.com`
- Region : Europe (par défaut)

### 2. Vérifier Authentication

1. Allez sur **Firebase Console** → Sélectionnez **guidempf**
2. Dans le menu latéral → **Build** → **Authentication**
3. Vérifiez que l'onglet **Sign-in method** est activé
4. **Email/Password** doit être activé :
   - Si non activé : Cliquez sur **Email/Password** → **Enable** → **Save**

### 3. Vérifier Firestore Database

1. Dans le menu → **Build** → **Firestore Database**
2. Si la base n'existe pas :
   - Cliquez **Create database**
   - Sélectionnez **Start in production mode**
   - Choisir la région (europe-west par défaut)
   - Créer

---

## 🔒 Règles de Sécurité Firestore

### Configuration Actuelle (Production)

Allez dans **Firestore Database** → **Rules** et vérifiez/modifiez :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Collection users - Lecture publique, écriture restreinte
    match /users/{userId} {
      // Tout le monde peut lire les profils publics (pour affichage)
      allow read: if true;
      
      // Seul l'utilisateur ou un admin peut créer/modifier son profil
      allow create: if request.auth != null && request.auth.uid == userId;
      
      // Seul un admin peut modifier les champs admin/approved
      allow update: if request.auth != null && (
        request.auth.uid == userId ||
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.is_admin == true
      );
      
      // Seul un admin peut supprimer
      allow delete: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.is_admin == true;
    }
  }
}
```

### Configuration Alternative (Développement - Plus Permissif)

⚠️ **NE PAS UTILISER EN PRODUCTION** ⚠️

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;  // Tout le monde peut tout faire (DANGER!)
    }
  }
}
```

---

## 👤 Créer le Premier Administrateur

### Méthode 1 : Via Interface Firebase Console

1. **Inscrivez-vous sur le site** d'abord via `/register.html`
   - Cela créera automatiquement l'utilisateur dans Authentication et Firestore

2. **Allez sur Firebase Console** : https://console.firebase.google.com/
   
3. **Sélectionnez le projet** : `guidempf`

4. **Naviguez dans Firestore** :
   - Menu → **Build** → **Firestore Database**
   - Cliquez sur la collection **users**
   - Trouvez votre utilisateur (par UID)

5. **Modifiez les champs** :
   - Cliquez sur le document utilisateur
   - Modifiez ou ajoutez les champs :
     ```
     is_admin: true (type: boolean)
     approved: true (type: boolean)
     status: "APPROVED" (type: string)
     ```
   - Cliquez **Update**

6. **✅ Terminé !** Reconnectez-vous sur le site

### Méthode 2 : Via Script (Si disponible localement)

```bash
node admin-setup.js your-email@example.com
```

Ce script :
- Recherche l'utilisateur par email
- Met à jour les champs admin
- Affiche un message de confirmation

---

## 🗄️ Structure des Collections Firestore

### Collection : `users`

Chaque document représente un utilisateur :

```javascript
{
  // ID du document = UID Firebase Authentication
  email: "user@example.com",              // string (requis)
  matricule: "123",                       // string (3 chiffres, requis)
  is_admin: false,                        // boolean (défaut: false)
  approved: false,                        // boolean (défaut: false)
  status: "PENDING",                      // string: PENDING | APPROVED | REVOKED
  created_at: "2026-02-10T12:00:00.000Z", // string ISO timestamp
  approved_at: "2026-02-10T13:00:00.000Z",// string ISO timestamp (optionnel)
  revoked_at: null,                       // string ISO timestamp (optionnel)
  reactivated_at: null                    // string ISO timestamp (optionnel)
}
```

### Indexes (Optionnel mais Recommandé)

Pour améliorer les performances des requêtes :

1. Allez dans **Firestore Database** → **Indexes**
2. Créez des index composites si nécessaire :
   - `status` + `created_at` (descending)
   - `approved` + `created_at` (descending)

---

## 🔐 Configuration Authentication

### Paramètres Email/Password

1. **Firestore Console** → **Authentication** → **Settings**
2. **Authorized domains** :
   - `localhost` (pour dev)
   - `guidempf.firebaseapp.com`
   - `nekoakami.github.io` (pour GitHub Pages)
   - Ajoutez votre domaine personnalisé si applicable

### Gestion des Utilisateurs

**Voir tous les utilisateurs :**
- **Authentication** → **Users** → Liste complète

**Actions disponibles via console :**
- Désactiver un compte
- Supprimer un compte
- Réinitialiser le mot de passe
- Modifier l'email

---

## 📊 Monitoring & Analytics

### Firebase Analytics (Optionnel)

1. Allez dans **Analytics** → **Dashboard**
2. Activez Google Analytics si souhaité
3. Suivez :
   - Nombre d'utilisateurs actifs
   - Pages les plus visitées
   - Durée des sessions

### Usage & Quotas

1. Menu → **Usage and billing**
2. Vérifiez les limites :
   - **Authentication** : 10K inscriptions/jour (gratuit)
   - **Firestore** : 50K lectures/jour (gratuit)
   - **Hosting** : 10GB stockage + 360MB/jour transfer (gratuit)

---

## 🚨 Dépannage

### Erreur : "Permission denied"

**Cause :** Règles Firestore trop restrictives  
**Solution :** Vérifiez les règles Firestore (voir plus haut)

### Erreur : "User not found in Firestore"

**Cause :** Le document user n'existe pas dans Firestore  
**Solution :**
1. Vérifiez que l'inscription a bien créé le document
2. Vérifiez que l'UID correspond entre Auth et Firestore

### Les utilisateurs n'apparaissent pas dans le panneau admin

**Cause :** Collection Firestore vide ou mal nommée  
**Solution :**
1. Vérifiez que la collection s'appelle exactement `users`
2. Inscrivez un utilisateur test pour créer la collection

### L'admin ne peut pas approuver d'utilisateurs

**Cause :** Règles Firestore ou champ `is_admin` manquant  
**Solution :**
1. Vérifiez que votre utilisateur a `is_admin: true`
2. Vérifiez les règles Firestore
3. Consultez la console navigateur (F12) pour les erreurs

---

## 🔄 Migration & Backup

### Exporter les Données

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Exporter Firestore
firebase firestore:export gs://guidempf.appspot.com/backups/$(date +%Y%m%d)
```

### Importer les Données

```bash
firebase firestore:import gs://guidempf.appspot.com/backups/[DATE]
```

---

## 📞 Support Firebase

- **Documentation officielle** : https://firebase.google.com/docs
- **Community** : https://firebase.google.com/community
- **Stack Overflow** : Tag `firebase`

---

## ✅ Checklist de Configuration

- [ ] Projet Firebase créé (`guidempf`)
- [ ] Authentication activée (Email/Password)
- [ ] Firestore Database créée
- [ ] Règles de sécurité configurées
- [ ] Domaines autorisés ajoutés
- [ ] Premier admin créé et testé
- [ ] Panneau admin accessible
- [ ] Inscription/connexion testées
- [ ] Approbation utilisateur testée

---

**Configuration Firebase terminée ! 🎉**
