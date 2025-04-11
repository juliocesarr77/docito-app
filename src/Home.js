// src/Home.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import logo from './logo.png'; // Substitua por sua imagem se desejar

const Home = () => {
  const navigate = useNavigate();

  const irParaDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div style={styles.container}>
      <img
        src={logo}
        alt="Logo Docito"
        style={styles.logo}
      />
      <h1 style={styles.titulo}>Bem-vindo à Docito Doceria!</h1>
      <p style={styles.texto}>Gerencie seus pedidos com carinho e doçura 🍫</p>
      <button onClick={irParaDashboard} style={styles.botao}>
        Ir para o Dashboard
      </button>
    </div>
  );
};

const styles = {
  container: {
    backgroundColor: '#fbd2aa', // fundo caramelo claro
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Segoe UI', cursive, sans-serif",
  },
  logo: {
    width: '120px',
    marginBottom: '20px',
  },
  titulo: {
    color: '#5a2a0c', // marrom escuro
    fontSize: '2rem',
    margin: 0,
  },
  texto: {
    color: '#a64b2a',
    fontSize: '1.1rem',
    marginBottom: '30px',
  },
  botao: {
    backgroundColor: '#ff6b6b',
    color: 'white',
    border: 'none',
    borderRadius: '10px',
    padding: '12px 24px',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.1)',
  },
};

export default Home;