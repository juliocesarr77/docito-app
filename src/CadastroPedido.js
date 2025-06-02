// src/CadastroPedido.js

import React, { useEffect, useState, useMemo } from 'react';
import { db } from './firebase/config';
import {
  updateDoc,
  doc,
  serverTimestamp,
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
  // REMOVENDO O CAMPO EMAIL, POIS NÃO É MAIS COLETADO NESTA TELA
  // const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState(''); // Adicionado o campo Número
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [notificacao, setNotificacao] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const cart = useMemo(() => location.state?.cart || [], [location.state?.cart]);
  const pedidoEditar = location.state?.pedido || null;
  const isEditando = !!pedidoEditar;

  useEffect(() => {
    if (isEditando) {
      setNome(pedidoEditar.nome);
      setTelefone(pedidoEditar.telefone || '');
      // setEmail(pedidoEditar.email || ''); // Removido
      setEndereco(pedidoEditar.endereco || '');
      setNumero(pedidoEditar.numero || ''); // Carrega o número
      setPontoReferencia(pedidoEditar.pontoReferencia || '');
      setProduto(pedidoEditar.produto);
      setValor(pedidoEditar.valor.toString());
      setDataEntrega(pedidoEditar.dataEntrega || '');
      setHoraEntrega(pedidoEditar.horaEntrega || '');
    } else if (cart.length > 0) {
      const produtosCarrinho = cart.map(item => `${item.quantity || 1}x ${item.name} (R$ ${item.price.toFixed(2)})`).join('\n');
      setProduto(produtosCarrinho);
      const valorTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      setValor(valorTotal.toFixed(2));
    }
  }, [isEditando, pedidoEditar, cart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // --- LÓGICA DE VALIDAÇÃO ---
    if (!nome) {
        setNotificacao({ mensagem: 'Preencha o nome do cliente.', tipo: 'erro' });
        console.log("VALIDAÇÃO: Nome vazio.");
        return;
    }

    if (cart.length === 0) {
        // Se o carrinho está vazio, verifica os campos 'Produto' e 'Valor' preenchidos manualmente
        if (!produto || parseFloat(valor) <= 0 || isNaN(parseFloat(valor))) {
            setNotificacao({ mensagem: 'Adicione itens ao carrinho ou preencha o produto e o valor total.', tipo: 'erro' });
            console.log("VALIDAÇÃO: Carrinho vazio E produto/valor manual não preenchido/inválido.");
            return;
        }
    }
    // --- FIM LÓGICA DE VALIDAÇÃO ---

    const valorNumericoTotal = cart.length > 0 ?
      cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) :
      parseFloat(valor); // Usa o valor do input se o carrinho estiver vazio

    const produtosDescricao = cart.length > 0 ?
      cart.map(item => `${item.quantity || 1}x ${item.name}`).join('\n') :
      produto; // Usa o texto do input se o carrinho estiver vazio

    setLoading(true);
    setNotificacao(null);

    try {
      const clienteData = {
        nome,
        telefone,
        endereco,
        numero,
        pontoReferencia,
        dataEntrega,
        horaEntrega,
        valorTotal: valorNumericoTotal,
        produtoDescricao: produtosDescricao,
      };

      const itensCarrinhoParaEnviar = cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
      }));

      // Objeto completo a ser enviado para a página de confirmação
      const dataParaEnviar = {
        clienteData: clienteData,
        itensCarrinho: itensCarrinhoParaEnviar,
      };

      // --- NOVOS LOGS DE DEPURACAO AQUI ---
      console.log("DEBUG-CADASTRO: Conteúdo final de clienteData:", clienteData);
      console.log("DEBUG-CADASTRO: Conteúdo final de itensCarrinhoParaEnviar:", itensCarrinhoParaEnviar);
      console.log("DEBUG-CADASTRO: dataParaEnviar (o objeto que será passado para ConfirmacaoPedido):", dataParaEnviar);
      // --- FIM NOVOS LOGS DE DEPURACAO ---


      if (isEditando) {
        // Lógica de edição de pedido (esta parte continua a mesma)
        const pedidoDocRef = doc(db, 'pedidos', pedidoEditar.id);
        await updateDoc(pedidoDocRef, {
            ...clienteData,
            itensCarrinho: itensCarrinhoParaEnviar,
            updatedAt: serverTimestamp(),
        });
        setNotificacao({ mensagem: 'Pedido atualizado com sucesso!', tipo: 'sucesso' });
        setTimeout(() => {
          navigate('/dashboard'); // Redireciona para o dashboard após edição
        }, 1500);
      } else {
        // --- ESTE É O PONTO CRÍTICO: SOMENTE NAVEGA PARA A CONFIRMAÇÃO, NÃO FAZ O FETCH AQUI ---
        console.log('CADASTRO: Navegando para ConfirmacaoPedido com os dados...');
        navigate('/cliente/confirmacao', { state: dataParaEnviar }); // <<-- CORREÇÃO DEFINITIVA AQUI!
      }
    } catch (error) {
      console.error('Erro ao processar pedido ou navegar:', error);
      setNotificacao({ mensagem: `Erro ao processar ou navegar: ${error.message}.`, tipo: 'erro' });
      setLoading(false); // Desativa loading em caso de erro
    } finally {
        // O loading aqui só será desativado se for um caso de edição ou erro.
        // Em caso de navegação para ConfirmacaoPedido, o loading será gerenciado lá.
        if (isEditando || notificacao) {
            setLoading(false);
        }
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
          required
        />

        <label className="cadastro-label">Telefone</label>
        <input
          className="cadastro-input"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        {/* REMOVIDO O CAMPO EMAIL */}

        <label className="cadastro-label">Endereço</label>
        <input
          className="cadastro-input"
          type="text"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />

        <label className="cadastro-label">Número</label>
        <input
          className="cadastro-input"
          type="text"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
        />

        <label className="cadastro-label">Ponto de Referência</label>
        <input
          className="cadastro-input"
          type="text"
          value={pontoReferencia}
          onChange={(e) => setPontoReferencia(e.target.value)}
        />

        {cart.length === 0 ? (
          <>
            <label className="cadastro-label">Produto</label>
            <textarea
              className="cadastro-input"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              placeholder="Digite os produtos separados por linha"
              rows="5"
              required
            />

            <label className="cadastro-label">Valor (R$)</label>
            <input
              className="cadastro-input"
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required
            />
          </>
        ) : (
          <>
            <label className="cadastro-label">Produtos do Carrinho</label>
            <textarea
              className="cadastro-input"
              value={produto}
              readOnly
              rows="5"
            />
            <label className="cadastro-label">Valor Total do Pedido (R$)</label>
            <input
              className="cadastro-input"
              type="text"
              value={valor}
              readOnly
            />
          </>
        )}

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

        <Button type="submit" className="cadastro-botao" disabled={loading}>
          {loading ? 'Processando...' : (isEditando ? 'Salvar Alterações' : 'Continuar para Confirmação')}
        </Button>
      </motion.form>
    </div>
  );
};

export default CadastroPedido;