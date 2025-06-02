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

    // --- NOVA LÓGICA DE VALIDAÇÃO ---
    // Apenas 'nome' é obrigatório.
    // Se não há itens no carrinho, então 'produto' e 'valor' manual são obrigatórios.
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
    // --- FIM NOVA LÓGICA DE VALIDAÇÃO ---


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
        // email, // REMOVIDO: Não é mais coletado aqui
        endereco,
        numero, // Incluído o número
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

      // --- NOVO LOGS NO FRONTEND AQUI ---
      console.log("FRONTEND: Dados do cliente (clienteData):", clienteData);
      console.log("FRONTEND: Itens do carrinho (itensCarrinhoParaEnviar):", itensCarrinhoParaEnviar);
      // O objeto que será enviado no body
      const dataParaEnviar = {
        clienteData: clienteData,
        itensCarrinho: itensCarrinhoParaEnviar,
      };
      console.log("FRONTEND: Objeto completo a ser stringificado e enviado:", dataParaEnviar);
      console.log("FRONTEND: JSON stringificado para o body FINAL:", JSON.stringify(dataParaEnviar));
      // --- FIM DOS NOVOS LOGS ---

      if (isEditando) {
        const pedidoDocRef = doc(db, 'pedidos', pedidoEditar.id);
        await updateDoc(pedidoDocRef, {
            ...clienteData,
            itensCarrinho: itensCarrinhoParaEnviar,
            updatedAt: serverTimestamp(),
        });
        setNotificacao({ mensagem: 'Pedido atualizado com sucesso!', tipo: 'sucesso' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        console.log('Enviando dados para a Netlify Function...');

        const response = await fetch('/.netlify/functions/gerar-numero-pedido', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(dataParaEnviar), // Removi o `|| {}` pois o JSON.stringify(dataParaEnviar) agora deve ser sempre um objeto válido
        });

        const responseData = await response.json();

        if (!response.ok) {
          setNotificacao({
              mensagem: `Erro ao criar pedido: ${responseData.message || 'Verifique os logs da função.'} Detalhes: ${responseData.details || 'N/A'}`,
              tipo: 'erro'
          });
          setLoading(false);
          return;
        }

        const numeroPedidoCliente = responseData.numeroPedido;
        const pedidoIdFirestore = responseData.pedidoIdFirestore;

        console.log('Pedido criado com sucesso! Número sequencial:', numeroPedidoCliente, 'ID Firestore:', pedidoIdFirestore);

        setNotificacao({ mensagem: `Pedido ${numeroPedidoCliente} criado! Redirecionando para a confirmação...`, tipo: 'sucesso' });

        navigate(`/agradecimento?pedidoId=${pedidoIdFirestore}&numeroPedido=${numeroPedidoCliente}`);
      }
    } catch (error) {
      console.error('Erro ao salvar pedido ou iniciar processo:', error);
      setNotificacao({ mensagem: `Erro ao salvar ou iniciar processo: ${error.message}.`, tipo: 'erro' });
      setLoading(false);
    } finally {
      if (isEditando && !notificacao) {
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

        {/* REMOVENDO O CAMPO EMAIL */}
        {/* <label className="cadastro-label">Email do Cliente</label>
        <input
          className="cadastro-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        /> */}

        <label className="cadastro-label">Endereço</label>
        <input
          className="cadastro-input"
          type="text"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
        />

        {/* Adicionando o campo Número */}
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
              required // Agora é obrigatório se o carrinho estiver vazio
            />

            <label className="cadastro-label">Valor (R$)</label>
            <input
              className="cadastro-input"
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required // Agora é obrigatório se o carrinho estiver vazio
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
          {loading ? 'Processando...' : (isEditando ? 'Salvar Alterações' : 'Cadastrar Pedido')}
        </Button>
      </motion.form>
    </div>
  );
};

export default CadastroPedido;