// server/setAdminClaim.js
const admin = require('firebase-admin');
const serviceAccount = require('./docito--doceria-firebase-adminsdk-fbsvc-9818909c5a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const adminUID = 'Q1n7kvdXOraN2kZOIyXANH7o5p43'; // Substitua pelo UID do administrador no Firebase Auth

admin.auth()
  .setCustomUserClaims(adminUID, { isAdmin: true })
  .then(() => {
    console.log('Claim isAdmin definida com sucesso para o UID:', adminUID);
    process.exit(); // Encerra o script após a conclusão
  })
  .catch((error) => {
    console.error('Erro ao definir claim isAdmin:', error);
    process.exit(1); // Encerra o script com um código de erro
  });