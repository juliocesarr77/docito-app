import app from './firebaseConfig'; // Importando o app como default
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const db = getFirestore(app);
export const auth = getAuth(app);
