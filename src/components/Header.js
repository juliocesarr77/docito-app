// src/components/Header.js
import React, { useContext } from 'react';
import { AuthContext } from './../context/AuthContext';

const Header = () => {
  const { currentUser } = useContext(AuthContext);

  return (
    <header style={{
      backgroundColor: '#ffedd3', // Laranja claro
      padding: '10px',
      textAlign: 'right',
      position: 'fixed', // Fixa o cabeçalho no topo
      top: 0,
      right: 0,
      width: '100%', // Garante que o cabeçalho ocupe toda a largura
      zIndex: 100, // Garante que o cabeçalho fique acima de outros elementos
    }}>
      {currentUser ? (
        <span>Logado como <strong style={{ color: '#d97706' }}>{currentUser.email}</strong></span>
      ) : (
        <span>Não Logado</span>
      )}
    </header>
  );
};

export default Header;
