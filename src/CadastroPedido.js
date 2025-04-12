import React, { useState } from 'react';
import { db } from './firebase/config';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const CadastroPedido = () => {
  const [nome, setNome] = useState('');
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !produto || !valor) return alert('Preencha todos os campos');

    try {
      await addDoc(collection(db, 'pedidos'), {
        nome,
        produto,
        valor: parseFloat(valor),
        status: 'Pendente',
        data: Timestamp.now(),
      });
      alert('Pedido cadastrado com sucesso!');
      navigate('/');
    } catch (error) {
      console.error('Erro ao cadastrar pedido:', error);
      alert('Erro ao cadastrar. Tente novamente.');
    }
  };

  return (
    <div style={styles.container}>
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        style={styles.titulo}
      >
        Novo Pedido 🍫
      </motion.h1>

      <motion.form
        onSubmit={handleSubmit}
        style={styles.form}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <label style={styles.label}>Nome do Cliente</label>
        <input
          style={styles.input}
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <label style={styles.label}>Produto</label>
        <input
          style={styles.input}
          type="text"
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
        />

        <label style={styles.label}>Valor (R$)</label>
        <input
          style={styles.input}
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <button type="submit" style={styles.botao}>
          Cadastrar
        </button>
      </motion.form>
    </div>
  );
};

const styles = {
  container: {
    padding: '40px 20px',
    backgroundColor: '#fff7f1',
    minHeight: '100vh',
    fontFamily: "'Segoe UI', cursive, sans-serif",
  },
  titulo: {
    fontSize: '2rem',
    textAlign: 'center',
    color: '#5a2a0c',
    marginBottom: '30px',
  },
  form: {
    maxWidth: '400px',
    margin: '0 auto',
    background: '#fff',
    padding: '30px',
    borderRadius: '16px',
    boxShadow: '0 0 12px rgba(0, 0, 0, 0.05)',
  },
  label: {
    display: 'block',
    marginBottom: '6px',
    color: '#5a2a0c',
    fontWeight: 'bold',
    fontSize: '0.95rem',
  },
  input: {
    width: '100%',
    padding: '10px',
    marginBottom: '20px',
    borderRadius: '10px',
    border: '1px solid #ccc',
    fontSize: '1rem',
  },
  botao: {
    backgroundColor: '#ff6b6b',
    color: '#fff',
    border: 'none',
    padding: '12px 20px',
    fontSize: '1rem',
    borderRadius: '12px',
    cursor: 'pointer',
    transition: '0.3s',
    width: '100%',
  },
};

export default CadastroPedido;
