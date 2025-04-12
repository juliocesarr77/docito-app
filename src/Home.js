import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './components/ui/button';
import { motion } from 'framer-motion';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <motion.img
        src="/logo.png"
        alt="Logo da Docito"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        style={styles.logo}
      />

      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={styles.titulo}
      >
        Bem-vindo(a) à Docito 🍬
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={styles.subtitulo}
      >
        Deixe seus pedidos mais doces com a gente!
      </motion.p>

      <motion.div
        style={styles.botoes}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Button onClick={() => navigate('/login')} className="bg-pink-400 hover:bg-pink-500 text-white m-2">
          Entrar
        </Button>
        <Button onClick={() => navigate('/cadastro')} className="bg-yellow-300 hover:bg-yellow-400 text-black m-2">
          Novo Pedido
        </Button>
        <Button onClick={() => navigate('/dashboard')} className="bg-green-300 hover:bg-green-400 text-black m-2">
          Ver Dashboard
        </Button>
      </motion.div>
    </div>
  );
};

const styles = {
  container: {
    padding: '50px 20px',
    minHeight: '100vh',
    backgroundColor: '#fff7f1',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontFamily: "'Segoe UI', cursive, sans-serif",
    textAlign: 'center',
  },
  logo: {
    width: '150px',
    height: 'auto',
    marginBottom: '20px',
  },
  titulo: {
    fontSize: '2.4rem',
    color: '#5a2a0c',
    marginBottom: '10px',
  },
  subtitulo: {
    fontSize: '1.2rem',
    color: '#a05f3c',
    marginBottom: '40px',
  },
  botoes: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '15px',
  },
};

export default Home;

