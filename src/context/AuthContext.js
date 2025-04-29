// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { auth } from './../firebase/config'; // Importe a instância do Firebase Auth

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe(); // Limpe o listener ao desmontar
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser }}>
      {children}
    </AuthContext.Provider>
  );
};
