import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDDlIoAUoxZAVpzAdfilpYhQ2NhthFtjn8",
  authDomain: "docito--doceria.firebaseapp.com",
  projectId: "docito--doceria",
  storageBucket: "docito--doceria.appspot.com",
  messagingSenderId: "389615804832",
  appId: "1:389615804832:web:5af5415c3fb66338f004c5"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Exporta o app como default
export default app;

// Exporta auth e db para uso no app
export const auth = getAuth(app);
export const db = getFirestore(app);

