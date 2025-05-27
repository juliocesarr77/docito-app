import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage'; // Importe getStorage

// Verifique se as variáveis de ambiente estão definidas
if (!process.env.REACT_APP_FIREBASE_API_KEY ||
    !process.env.REACT_APP_FIREBASE_AUTH_DOMAIN ||
    !process.env.REACT_APP_FIREBASE_PROJECT_ID ||
    !process.env.REACT_APP_FIREBASE_STORAGE_BUCKET ||
    !process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID ||
    !process.env.REACT_APP_FIREBASE_APP_ID) {
  console.error("Erro: Variáveis de ambiente do Firebase não estão definidas. Certifique-se de que o arquivo .env está na raiz do projeto e que as variáveis estão definidas com o prefixo REACT_APP_.");
}

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET, // <----- DEVE SER "docito--doceria.firebasestorage.app" NO SEU .ENV
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

let db, auth, storage; // Declare storage

try {
  db = getFirestore(app);
} catch (error) {
  console.error("Erro ao inicializar o Firestore:", error);
}

try {
  auth = getAuth(app);
} catch (error) {
  console.error("Erro ao inicializar o Authentication:", error);
}

try {
  storage = getStorage(app); // Inicialize o Storage
} catch (error) {
  console.error("Erro ao inicializar o Storage:", error);
}

export { db, auth, storage, app }; // Export storage