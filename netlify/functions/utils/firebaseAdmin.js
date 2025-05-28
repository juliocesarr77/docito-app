// netlify/functions/utils/firebaseAdmin.js

const { initializeApp } = require('firebase/app');
const { getFirestore } = require('firebase/firestore');
const { getStorage } = require('firebase/storage');

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY, // ATENÇÃO: SEM REACT_APP_
    authDomain: process.env.FIREBASE_AUTH_DOMAIN, // ATENÇÃO: SEM REACT_APP_
    projectId: process.env.FIREBASE_PROJECT_ID, // ATENÇÃO: SEM REACT_APP_
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // ATENÇÃO: SEM REACT_APP_
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID, // ATENÇÃO: SEM REACT_APP_
    appId: process.env.FIREBASE_APP_ID // ATENÇÃO: SEM REACT_APP_
};

// Inicialize Firebase
// Verifique se o app já foi inicializado para evitar erros
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

module.exports = { db, storage };