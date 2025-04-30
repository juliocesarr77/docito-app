// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from 'react';
import { auth } from './../firebase/config'; // Importe a instância do Firebase Auth

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);

  const logout = async () => {
    try {
      await auth.signOut();
      setCurrentUser(null); // Opcional: já deve ser atualizado pelo onAuthStateChanged
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      // Adicione aqui alguma lógica para lidar com erros de logout (ex: exibir uma mensagem)
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe(); // Limpe o listener ao desmontar
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, logout }}> {/* Agora a função logout está no value */}
      {children}
    </AuthContext.Provider>
  );
};