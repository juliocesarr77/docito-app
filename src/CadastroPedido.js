// CadastroPedido.js
import React, { useEffect, useState, useMemo } from 'react';
import { db } from './firebase/config'; // Ajuste o caminho se necessário
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CadastroPedido.css';
import { Button } from './components/ui/button';

const Notificacao = ({ mensagem, tipo }) => (
  <div className={`notificacao ${tipo}`}>
    {mensagem}
  </div>
);

const CadastroPedido = () => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');
  const [status, setStatus] = useState('pendente');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [notificacao, setNotificacao] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const cart = useMemo(() => location.state?.cart || [], [location.state?.cart]);
  const pedidoEditar = location.state?.pedido || null;
  const isEditando = !!pedidoEditar;

  useEffect(() => {
    if (isEditando) {
      setNome(pedidoEditar.nome);
      setTelefone(pedidoEditar.telefone || '');
      setEndereco(pedidoEditar.endereco || '');
      setPontoReferencia(pedidoEditar.pontoReferencia || '');
      setProduto(pedidoEditar.produto);
      setValor(pedidoEditar.valor.toString());
      setStatus(pedidoEditar.status || 'pendente');
      setDataEntrega(pedidoEditar.dataEntrega || '');
      setHoraEntrega(pedidoEditar.horaEntrega || '');
    } else if (cart.length > 0) {
      const produtosCarrinho = cart.map(item => `${item.quantity || 1} ${item.name}`).join('\n');
      setProduto(produtosCarrinho);
      const valorTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      setValor(valorTotal.toFixed(2));
    }
  }, [isEditando, pedidoEditar, cart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nome || !produto || !valor) {
      setNotificacao({ mensagem: 'Preencha todos os campos', tipo: 'erro' });
      return;
    }

    if (isNaN(parseFloat(valor))) {
      setNotificacao({ mensagem: 'Valor inválido. Use um número.', tipo: 'erro' });
      return;
    }

    try {
      const valorNumerico = parseFloat(valor);
      const pedidoData = {
        nome,
        telefone,
        endereco,
        pontoReferencia,
        produto,
        valor: valorNumerico,
        status,
        dataEntrega,
        horaEntrega,
      };

      if (isEditando) {
        await updateDoc(doc(db, 'pedidos', pedidoEditar.id), pedidoData);
        setNotificacao({ mensagem: 'Pedido atualizado com sucesso!', tipo: 'sucesso' });
      } else {
        await addDoc(collection(db, 'pedidos'), {
          ...pedidoData,
          createdAt: serverTimestamp(),
          data: Timestamp.now(),
        });
        setNotificacao({ mensagem: 'Pedido cadastrado com sucesso!', tipo: 'sucesso' });
      }
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      console.error('Erro ao salvar pedido:', error);
      setNotificacao({ mensagem: 'Erro ao salvar. Tente novamente.', tipo: 'erro' });
    }
  };

  return (
    <div className="cadastro-container">
      {notificacao && (
        <Notificacao mensagem={notificacao.mensagem} tipo={notificacao.tipo} />
      )}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="cadastro-titulo"
      >
        {isEditando ? 'Editar Pedido ✏️' : 'Novo Pedido 🍫'}
      </motion.h1>

      <motion.form
        onSubmit={handleSubmit}
        className="cadastro-form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <label className="cadastro-label">Nome do Cliente</label>
        <input
          className="cadastro-input"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
        />

        <label className="cadastro-label">Telefone</label>
        <input
          className="cadastro-input"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        <label className="cadastro-label">Endereço</label>
        <input
          className="cadastro-input"
          type="text"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />

        <label className="cadastro-label">Ponto de Referência</label>
        <input
          className="cadastro-input"
          type="text"
          value={pontoReferencia}
          onChange={(e) => setPontoReferencia(e.target.value)}
        />

        <label className="cadastro-label">Produto</label>
        <textarea
          className="cadastro-input"
          value={produto}
          onChange={(e) => setProduto(e.target.value)}
          placeholder="Digite os produtos separados por linha"
          rows="5"
        />

        <label className="cadastro-label">Valor (R$)</label>
        <input
          className="cadastro-input"
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
        />

        <label className="cadastro-label">Data de Entrega</label>
        <input
          className="cadastro-input"
          type="date"
          value={dataEntrega}
          onChange={(e) => setDataEntrega(e.target.value)}
        />
        <label className="cadastro-label">Hora de Entrega</label>
        <input
          className="cadastro-input"
          type="time"
          value={horaEntrega}
          onChange={(e) => setHoraEntrega(e.target.value)}
        />

        <Button type="submit" className="cadastro-botao">
          {isEditando ? 'Salvar Alterações' : 'Cadastrar'}
        </Button>
      </motion.form>
    </div>
  );
};

export default CadastroPedido;