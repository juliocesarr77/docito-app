import app from "./firebaseConfig";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const db = getFirestore(app);
export const auth = getAuth(app);