// src/Dashboard.js
import React, { useEffect, useState } from 'react';
import { db } from './firebase/config';
import { collection, getDocs } from 'firebase/firestore';
import { Card, CardContent } from './components/ui/card';
import { Button } from './components/ui/button';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const [pendentes, setPendentes] = useState(0);
  const [entregues, setEntregues] = useState(0);
  const navigate = useNavigate();

  const fetchPedidos = async () => {
    const pedidosRef = collection(db, 'pedidos');
    const snapshot = await getDocs(pedidosRef);
    const pedidos = snapshot.docs.map(doc => doc.data());

    const pendentesCount = pedidos.filter(p => p.status === 'pendente').length;
    const entreguesCount = pedidos.filter(p => p.status === 'entregue').length;

    setPendentes(pendentesCount);
    setEntregues(entreguesCount);
  };

  useEffect(() => {
    fetchPedidos();
  }, []);

  return (
    <div style={styles.container}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={styles.titulo}
      >
        Bem-vindo(a) à Docito 🍬
      </motion.h1>

      <div style={styles.grid}>
        <Card className="bg-pink-100">
          <CardContent>
            <h2 style={styles.cardTitulo}>Pedidos Pendentes</h2>
            <p style={styles.valor}>{pendentes}</p>
          </CardContent>
        </Card>
        <Card className="bg-green-100">
          <CardContent>
            <h2 style={styles.cardTitulo}>Entregues</h2>
            <p style={styles.valor}>{entregues}</p>
          </CardContent>
        </Card>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        style={{ marginTop: '30px', textAlign: 'center' }}
      >
        <Button onClick={() => navigate('/cadastro')}>
          Novo Pedido
        </Button>
      </motion.div>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 20px',
    fontFamily: "'Segoe UI', cursive, sans-serif",
    backgroundColor: '#fff7f1',
    minHeight: '100vh',
  },
  titulo: {
    fontSize: '2rem',
    color: '#5a2a0c',
    textAlign: 'center',
    marginBottom: '30px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  cardTitulo: {
    fontSize: '1.1rem',
    marginBottom: '8px',
    color: '#5a2a0c',
  },
  valor: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    color: '#e05b5b',
  },
};

export default Dashboard;

