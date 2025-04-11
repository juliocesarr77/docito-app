import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDDlIoAUoxZAVpzAdfilpYhQ2NhthFtjn8",
  authDomain: "docito--doceria.firebaseapp.com",
  projectId: "docito--doceria",
  storageBucket: "docito--doceria.appspot.com",
  messagingSenderId: "389615804832",
  appId: "1:389615804832:web:5af5415c3fb66338f004c5"
};

const app = initializeApp(firebaseConfig);

export default app;
