// config.js
import { initializeApp, getApps } from 'firebase/app'; // Importa getApps
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from "firebase/storage"; // Importa getStorage

// Importe suas configurações do Firebase de um arquivo .env ou similar
const firebaseConfig = {
  apiKey: "AIzaSyDDlIoAUoxZAVpzAdfilpYhQ2NhthFtjn8",
  authDomain: "docito--doceria.firebaseapp.com",
  projectId: "docito--doceria",
  storageBucket: "docito--doceria.appspot.com",
  messagingSenderId: "389615804832",
  appId: "1:389615804832:web:5af5415c3fb66338f004c5"
};


// Inicialize o Firebase apenas se ele ainda não foi inicializado
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];


let db, auth, storage;

try {
  db = getFirestore(app);
} catch (error) {
  console.error("Erro ao inicializar o Firestore:", error);
  // Trate o erro adequadamente, como exibir uma mensagem para o usuário
}

try {
  auth = getAuth(app);
} catch (error) {
  console.error("Erro ao inicializar o Authentication:", error);
  // Trate o erro adequadamente, como exibir uma mensagem para o usuário
}

try {
  storage = getStorage(app); // Inicializa o Storage
} catch (error) {
  console.error("Erro ao inicializar o Storage:", error);
  // Trate o erro adequadamente
}

export { db, auth, storage }; // Exporta a instância do storage