# guidempf-site

Site statique fan-made : guide pour la Metropolice Force (inspiré de Half-Life 2).

Fichiers créés :
- `index.html` (accueil)
- `about.html` (présentation)
- `units.html` (unités & grades)
- `tactics.html` (tactiques)
- `equipment.html` (équipement)
- `contact.html` (contact/contrib)
- `assets/css/style.css` (styles)

Pour lancer localement :

```bash
# depuis le dossier du projet
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

Contenu : création originale de fans — n'inclut pas de reproduction textuelle protégée par le droit d'auteur. Remplacez ou enrichissez le contenu selon vos besoins.

Serveur d'authentification (dev)

J'ai ajouté un petit serveur Node.js pour l'authentification, la gestion des utilisateurs et un panneau admin minimal.

Installation :

```bash
npm install
node server.js
# par défaut le serveur écoute sur http://localhost:3000
```

Comportement important :
- Les mots de passe sont stockés hachés avec bcrypt.
- Une session serveur (MemoryStore) est utilisée — pas adaptée à la production ; remplacer par un store persistant.
- Un compte admin est semé automatiquement : `admin@example.com` / `adminpass` (modifiable via variables d'environnement `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_MATRICULE`).

Endpoints utiles :
- `POST /api/register` : body JSON `{email, matricule, password}`
- `POST /api/login` : body JSON `{email, password}`
- `GET /api/admin/users` : liste des utilisateurs (protégé, admin uniquement)

Pour production : utilisez HTTPS, un store de session persistant, et configurez correctement `SESSION_SECRET`.

Validation administrateur

- Le flux courant enregistre l'utilisateur via Firebase Auth et crée un document Firestore `users/{uid}` avec `approved: false` et `status: 'PENDING'`.
- Un administrateur peut approuver ou révoquer un compte depuis `admin/panel.html` (boutons Approuver / Révoquer) qui mettent à jour le champ `approved` dans Firestore.
- Lors de la connexion, l'application vérifie `users/{uid}.approved` : si `false`, l'utilisateur est déconnecté et redirigé vers `pending.html`.

Règles Firestore recommandées (exemple minimal)

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId; // chaque utilisateur peut lire son doc
      allow write: if request.auth != null && request.auth.uid == userId; // chaque utilisateur peut modifier son doc (selon besoin)

      // les actions d'approbation doivent être réservées aux admins
      // pour cela utilisez soit des custom claims (admin) côté serveur, soit
      // un champ `is_admin` avec vérification en lecture côté client mais
      // attention : un champ stocké dans le document peut être modifié par l'utilisateur.
      // Exemple avec custom claims (recommandé) :
      // allow update: if request.auth.token.admin == true;
    }
  }
}
```

Notes : pour garantir qu'un utilisateur non-admin ne modifie pas `is_admin` ou `approved`, utilisez des custom claims côté serveur (Admin SDK) et des règles Firestore qui vérifient `request.auth.token.admin`.

## Script d'administration Firebase

Pour gérer les utilisateurs, les approbations et les rôles admin, utilisez `admin-setup.js` :

### Étapes préalables

1. **Télécharge la clé privée du compte de service**
   - Va sur https://console.firebase.google.com
   - Sélectionne le projet `guidempf`
   - Onglet `Project Settings` (engrenage en haut à gauche)
   - Onglet `Service Accounts`
   - Clique `Generate New Private Key`
   - Sauvegarde le fichier JSON sous le nom `serviceAccountKey.json` à la racine du projet

2. **Installe les dépendances**
   ```bash
   npm install
   ```

### Utilisation

```bash
# Rendre un utilisateur administrateur
node admin-setup.js setAdmin admin@example.com

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

