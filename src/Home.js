import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './components/ui/button';
import { motion } from 'framer-motion';
import './Home.css';
import Header from './components/Header'; // Importe o Header

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <Header /> {/* Adicione o Header aqui */}
      <motion.img
        src="/logo.png"
        alt="Logo da Docito"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="home-logo"
      />

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="home-title"
      >
        Bem-vindo(a) à Docito 🍬
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="home-subtitle"
      >
        Deixe seus pedidos mais doces com a gente!
      </motion.p>

      <motion.div
        className="home-buttons"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button onClick={() => navigate('/login')} className="home-button home-button-entrar">
          Entrar
        </Button>
        <Button onClick={() => navigate('/cadastro')} className="home-button home-button-novo-pedido">
          Novo Pedido
        </Button>
        <Button onClick={() => navigate('/dashboard')} className="home-button home-button-ver-dashboard">
          Ver Dashboard
        </Button>
      </motion.div>
    </div>
  );
};

export default Home;
