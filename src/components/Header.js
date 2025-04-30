// src/components/Header.js
import React, { useContext } from 'react';
import { AuthContext } from './../context/AuthContext';
import { useNavigate } from 'react-router-dom'; // Importe useNavigate

const Header = () => {
  const { currentUser, logout } = useContext(AuthContext); // Obtenha a função de logout do contexto
  const navigate = useNavigate(); // Inicialize useNavigate

  const handleLogout = async () => {
    console.log("Botão de deslogar clicado!"); // Verificação

    try {
      await logout();
      navigate('/'); // Redirecione para a página inicial após o logout
    } catch (error) {
      console.error("Erro ao deslogar:", error);
      // Adicione aqui alguma lógica para lidar com erros de logout (ex: exibir uma mensagem)
    }
  };

  return (
    <header style={{
      backgroundColor: '#ffedd3',
      padding: '10px',
      textAlign: 'right',
      position: 'fixed',
      top: 0,
      right: 0,
      width: '100%',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
    }}>
      <div style={{ marginLeft: '10px' }}>
        {/* Você pode adicionar algum título ou logo aqui */}
      </div>
      <div>
        {currentUser ? (
          <>
            <span>Logado como <strong style={{ color: '#d97706' }}>{currentUser.email}</strong></span>
            <button onClick={handleLogout} style={{
              marginLeft: '15px',
              padding: '8px 12px',
              borderRadius: '5px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
            }}>
              Deslogar
            </button>
          </>
        ) : (
          <span>Não Logado</span>
        )}
      </div>
    </header>
  );
};

export default Header;