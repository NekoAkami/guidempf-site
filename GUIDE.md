# 🚀 Guide de Démarrage Rapide - Metropolice Force

## Pour les Utilisateurs

### 1️⃣ S'inscrire (Première Visite)
1. Allez sur **https://nekoakami.github.io/guidempf-site/**
2. Cliquez sur **"Connexion"** ou **"Commencer"**
3. Cliquez sur **"S'inscrire"**
4. Remplissez le formulaire :
   - **Email** : votre adresse email
   - **Matricule** : 3 chiffres (ex: 123, 456, 789)
   - **Mot de passe** : minimum 8 caractères
5. Cliquez sur **"S'inscrire"**
6. ⏳ Vous serez redirigé vers la page d'attente
7. 🎉 Attendez qu'un administrateur valide votre compte

### 2️⃣ Se Connecter
1. Allez sur **https://nekoakami.github.io/guidempf-site/**
2. Cliquez sur **"Connexion"**
3. Entrez votre **email** et **mot de passe**
4. Cliquez sur **"Se connecter"**
5. ✅ Si votre compte est approuvé, vous accédez au site
6. ⏳ Sinon, vous revenez à la page d'attente

### 3️⃣ Navigation
Une fois connecté :
- Votre **matricule** s'affiche en haut à droite
- Bouton **"Déconnexion"** disponible
- Accès à toutes les pages du guide :
  - 📋 **Présentation** : Structure de la MPF
  - 👮 **Unités** : Grades et codes radio
  - ⚔️ **Tactiques** : Formations et règles
  - 🛠️ **Équipement** : Armement et tech
  - 📞 **Contact** : Infos et communauté

---

## Pour les Administrateurs

### 🔐 Devenir le Premier Administrateur

**Méthode 1 : Via Firebase Console**
1. Inscrivez-vous sur le site normalement
2. Allez sur **Firebase Console** : https://console.firebase.google.com/
3. Sélectionnez le projet **"guidempf"**
4. Allez dans **Firestore Database**
5. Trouvez la collection **"users"**
6. Cliquez sur votre utilisateur
7. Modifiez les champs suivants :
   ```
   is_admin: true
   approved: true
   status: "APPROVED"
   ```
8. Sauvegardez
9. 🎉 Vous êtes maintenant administrateur !

**Méthode 2 : Via Script Admin (si disponible)**
```bash
node admin-setup.js [email]
```

### 📊 Utiliser le Panneau Admin

**Accès :** `/admin/panel.html` ou cliquez sur le bouton **"Admin"** dans le header

**Fonctionnalités :**

#### 1. Vue d'Ensemble
- 📈 **Statistiques en temps réel** :
  - Total d'utilisateurs inscrits
  - Nombre d'utilisateurs approuvés
  - Utilisateurs en attente
  - Nombre d'administrateurs

#### 2. Gestion des Utilisateurs
- 🔍 **Recherche** : Par email ou matricule
- 🎯 **Filtrage** : Par statut (Tous, Approuvé, En attente, Révoqué)
- 📋 **Liste complète** avec :
  - Email
  - Matricule
  - Badge Admin (si applicable)
  - Statut avec badge coloré
  - Date de création
  - Actions disponibles

#### 3. Actions Disponibles
- ✅ **Approuver** : Valider un utilisateur en attente
  - Change le statut à `APPROVED`
  - L'utilisateur peut maintenant se connecter
  - Notification de succès affichée

- ❌ **Révoquer** : Suspendre un utilisateur approuvé
  - Demande de confirmation
  - Change le statut à `REVOKED`
  - L'utilisateur ne peut plus se connecter

- ↻ **Réactiver** : Restaurer un utilisateur révoqué
  - Remet le statut à `APPROVED`
  - L'utilisateur retrouve l'accès

#### 4. Badges de Statut
- 🟢 **APPROUVÉ** : Utilisateur actif (badge cyan)
- 🟡 **EN ATTENTE** : Attente de validation (badge jaune)
- 🔴 **RÉVOQUÉ** : Accès suspendu (badge rouge)
- 🟠 **ADMIN** : Droits administrateur (badge orange)

---

## 🛠️ Workflow Complet

### Scénario : Nouveau Utilisateur
```
1. Utilisateur → Inscription (register.html)
   ↓
2. Firebase → Création compte + Firestore entry
   Status: PENDING, approved: false
   ↓
3. Utilisateur → Redirection vers pending.html
   ↓
4. Admin → Voit l'utilisateur dans le panneau admin
   ↓
5. Admin → Clique "Approuver"
   Firebase update: approved: true, status: "APPROVED"
   ↓
6. Utilisateur → Peut maintenant se connecter
   ↓
7. Utilisateur → Accès complet au site
```

### Scénario : Révocation d'Accès
```
1. Admin → Panneau d'administration
   ↓
2. Admin → Trouve l'utilisateur à révoquer
   ↓
3. Admin → Clique "Révoquer" + Confirme
   Firebase update: approved: false, status: "REVOKED"
   ↓
4. Utilisateur → Prochaine connexion = Redirection vers pending.html
```

---

## 🎓 Conseils & Bonnes Pratiques

### Pour les Utilisateurs
- ✅ Utilisez un mot de passe fort (min 8 caractères)
- ✅ Choisissez un matricule unique
- ✅ Vérifiez votre boîte email pour les notifications (si configurées)
- ✅ Patience : l'approbation peut prendre quelques minutes à quelques heures

### Pour les Administrateurs
- ✅ Vérifiez l'identité avant d'approuver (vérifiez le matricule, l'email)
- ✅ Révoquez immédiatement les comptes suspects
- ✅ Gardez toujours au moins 2 administrateurs actifs
- ✅ Utilisez la recherche pour trouver rapidement des utilisateurs
- ✅ Surveillez régulièrement les demandes en attente

---

## 🆘 FAQ - Questions Fréquentes

### Utilisateurs

**Q: Combien de temps prend l'approbation ?**
R: Cela dépend de la disponibilité des administrateurs. Généralement quelques minutes à quelques heures.

**Q: J'ai oublié mon mot de passe, que faire ?**
R: Utilisez la fonction "Mot de passe oublié" sur la page de connexion (si configurée), ou contactez un administrateur.

**Q: Puis-je changer mon matricule ?**
R: Non, le matricule est unique et permanent. Choisissez-le avec soin lors de l'inscription.

**Q: Que se passe-t-il si je suis révoqué ?**
R: Vous ne pourrez plus accéder au site. Contactez un administrateur pour discuter de la situation.

### Administrateurs

**Q: Comment ajouter un nouvel administrateur ?**
R: Depuis Firebase Console → Firestore → users → Sélectionnez l'utilisateur → Modifiez `is_admin: true`

**Q: Puis-je supprimer définitivement un utilisateur ?**
R: Oui, via Firebase Console → Firestore ou Firebase Authentication. Soyez prudent, c'est irréversible.

**Q: Les statistiques sont-elles en temps réel ?**
R: Oui, elles se mettent à jour à chaque chargement de la page et après chaque action.

**Q: Comment voir l'historique des actions ?**
R: Consultez Firestore pour voir les timestamps (created_at, approved_at, revoked_at, etc.)

---

## 🔗 Liens Utiles

- 🌐 **Site Principal** : https://nekoakami.github.io/guidempf-site/
- 📁 **GitHub Repository** : https://github.com/NekoAkami/guidempf-site
- 🔥 **Firebase Console** : https://console.firebase.google.com/
- 📝 **Documentation** : README.md dans le repository

---

## 📞 Besoin d'Aide ?

1. **Documentation** : Consultez README.md pour plus de détails techniques
2. **Issues GitHub** : Ouvrez une issue pour signaler un problème
3. **Contact** : Utilisez la page Contact du site

---

**Bon jeu de rôle dans l'univers de Half-Life 2 ! 🎮**
