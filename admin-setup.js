/**
 * Script d'administration Firebase pour attribuer claims admin et gérer les approbations
 * Usage: node admin-setup.js <action> <email> [option]
 * 
 * Actions:
 *   - setAdmin <email>        : Rend un utilisateur administrateur (custom claim)
 *   - removeAdmin <email>     : Retire le claim admin
 *   - approve <email>         : Approuve un utilisateur (met à jour Firestore)
 *   - revoke <email>          : Révoque un utilisateur
 *   - list                    : Liste tous les utilisateurs
 * 
 * Exemple:
 *   node admin-setup.js setAdmin admin@example.com
 *   node admin-setup.js approve user@example.com
 *   node admin-setup.js list
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Download your service account key from https://console.firebase.google.com
// - go to Project Settings > Service Accounts > Generate New Private Key
// - Save the JSON file and reference it below

const serviceAccountPath = process.env.FIREBASE_KEY_PATH || path.join(__dirname, 'serviceAccountKey.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: 'guidempf'
  });
} catch (err) {
  console.error('❌ Erreur : fichier serviceAccountKey.json non trouvé.');
  console.error('   Télécharge la clé depuis https://console.firebase.google.com :');
  console.error('   Project Settings > Service Accounts > Generate New Private Key');
  process.exit(1);
}

const auth = admin.auth();
const db = admin.firestore();

const [, , action, email, option] = process.argv;

if (!action) {
  console.log('Usage: node admin-setup.js <action> [email]');
  console.log('\nActions:');
  console.log('  setAdmin <email>  : Rendre admin');
  console.log('  removeAdmin <email>: Retirer admin');
  console.log('  approve <email>   : Approuver l\'utilisateur');
  console.log('  revoke <email>    : Révoquer l\'utilisateur');
  console.log('  list              : Lister tous les utilisateurs');
  process.exit(1);
}

async function run() {
  try {
    switch (action) {
      case 'setAdmin': {
        if (!email) throw new Error('Email requis');
        const user = await auth.getUserByEmail(email);
        await auth.setCustomUserClaims(user.uid, { admin: true });
        console.log(`✓ Admin claim attribué à ${email}`);
        break;
      }
      case 'removeAdmin': {
        if (!email) throw new Error('Email requis');
        const user = await auth.getUserByEmail(email);
        await auth.setCustomUserClaims(user.uid, { admin: false });
        console.log(`✓ Admin claim retiré pour ${email}`);
        break;
      }
      case 'approve': {
        if (!email) throw new Error('Email requis');
        const user = await auth.getUserByEmail(email);
        await db.collection('users').doc(user.uid).update({
          approved: true,
          status: 'APPROVED',
          approved_at: new Date().toISOString()
        });
        console.log(`✓ Utilisateur ${email} approuvé`);
        break;
      }
      case 'revoke': {
        if (!email) throw new Error('Email requis');
        const user = await auth.getUserByEmail(email);
        await db.collection('users').doc(user.uid).update({
          approved: false,
          status: 'REVOKED',
          revoked_at: new Date().toISOString()
        });
        console.log(`✓ Utilisateur ${email} révoqué`);
        break;
      }
      case 'list': {
        const snapshot = await db.collection('users').get();
        console.log('\n📋 Utilisateurs enregistrés:\n');
        snapshot.forEach(doc => {
          const u = doc.data();
          console.log(`E-mail: ${u.email}`);
          console.log(`  Matricule: ${u.matricule}`);
          console.log(`  Admin: ${u.is_admin ? 'Oui' : 'Non'}`);
          console.log(`  Approuvé: ${u.approved ? 'Oui' : 'Non (en attente)'}`);
          console.log(`  Créé: ${u.created_at}`);
          console.log('');
        });
        break;
      }
      default:
        throw new Error(`Action inconnue: ${action}`);
    }
  } catch (err) {
    console.error('❌ Erreur:', err.message);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

run();
