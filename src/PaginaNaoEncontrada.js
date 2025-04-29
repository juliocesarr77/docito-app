// PaginaNaoEncontrada.js
import React from 'react';
import { Link } from 'react-router-dom';

function PaginaNaoEncontrada() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      textAlign: 'center',
      backgroundColor: '#f0f0f0'
    }}>
      <h1 style={{ fontSize: '3em', marginBottom: '20px' }}>404 - Página não encontrada</h1>
      <p style={{ fontSize: '1.2em', color: '#666', marginBottom: '30px' }}>
        A página que você está procurando não existe.
      </p>
      <Link
        to="/"
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: '#fff',
          textDecoration: 'none',
          borderRadius: '5px',
          fontSize: '1.1em'
        }}
      >
        Voltar para a página inicial
      </Link>
    </div>
  );
}

export default PaginaNaoEncontrada;
