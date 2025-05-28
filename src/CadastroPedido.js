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
  const [email, setEmail] = useState(''); // NOVO ESTADO PARA EMAIL
  const [endereco, setEndereco] = useState('');
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [produto, setProduto] = useState(''); // Este continua sendo a string do textarea
  const [valor, setValor] = useState(''); // Valor em Reais
  const [status, setStatus] = useState('pendente'); // Status inicial
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [notificacao, setNotificacao] = useState(null);
  const [loading, setLoading] = useState(false); // Estado para indicar carregamento
  const navigate = useNavigate();
  const location = useLocation();

  const cart = useMemo(() => location.state?.cart || [], [location.state?.cart]);
  const pedidoEditar = location.state?.pedido || null;
  const isEditando = !!pedidoEditar;

  useEffect(() => {
    if (isEditando) {
      setNome(pedidoEditar.nome);
      setTelefone(pedidoEditar.telefone || '');
      setEmail(pedidoEditar.email || ''); // Carregar Email ao editar
      setEndereco(pedidoEditar.endereco || '');
      setPontoReferencia(pedidoEditar.pontoReferencia || '');
      setProduto(pedidoEditar.produto);
      setValor(pedidoEditar.valor.toString());
      setStatus(pedidoEditar.status || 'pendente');
      setDataEntrega(pedidoEditar.dataEntrega || '');
      setHoraEntrega(pedidoEditar.horaEntrega || '');
    } else if (cart.length > 0) {
      const produtosCarrinho = cart.map(item => `${item.quantity || 1} ${item.name}`).join('\n');
      setProduto(produtosCarrinho); // CORREÇÃO: produtosCarrinhos para produtosCarrinho
      const valorTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      setValor(valorTotal.toFixed(2));
      setStatus('pendente'); // Status inicial para novo pedido
    }
  }, [isEditando, pedidoEditar, cart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Evita cliques múltiplos

    // Validação agora sem CPF, mas com Email
    if (!nome || !produto || !valor || !email) {
      setNotificacao({ mensagem: 'Preencha todos os campos obrigatórios (Nome, Produto, Valor, Email).', tipo: 'erro' });
      return;
    }

    if (isNaN(parseFloat(valor))) {
      setNotificacao({ mensagem: 'Valor inválido. Use um número.', tipo: 'erro' });
      return;
    }

    setLoading(true); // Inicia o estado de carregamento
    setNotificacao(null); // Limpa notificações anteriores

    try {
      const valorNumerico = parseFloat(valor);
      const pedidoData = {
        nome,
        telefone,
        email, // Incluir Email nos dados do pedido
        endereco,
        pontoReferencia,
        produto, // A string do textarea
        valor: valorNumerico,
        status: status, // Manter o status inicial (pendente para novos)
        dataEntrega,
        horaEntrega,
        // pagSeguroTransactionId: '', // Será preenchido pelo webhook
        // pagamentoStatus: 'pendente', // Será preenchido/atualizado pelo webhook
        // ... outros campos que você quiser
      };

      let pedidoDocRef; // Para armazenar a referência do documento do pedido
      let pedidoId; // Para armazenar o ID do pedido no Firestore

      if (isEditando) {
        // Lógica de edição: apenas atualiza o pedido no Firebase
        pedidoDocRef = doc(db, 'pedidos', pedidoEditar.id);
        await updateDoc(pedidoDocRef, pedidoData);
        setNotificacao({ mensagem: 'Pedido atualizado com sucesso!', tipo: 'sucesso' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Lógica de novo pedido: salva no Firebase E inicia o pagamento
        pedidoDocRef = await addDoc(collection(db, 'pedidos'), {
          ...pedidoData,
          createdAt: serverTimestamp(),
          data: Timestamp.now(),
          pagamentoStatus: 'aguardando_pagamento', // Status inicial para PagSeguro
          pagSeguroTransactionId: '', // Inicializa vazio
        });
        pedidoId = pedidoDocRef.id; // Pega o ID do pedido recém-criado

        // --- INÍCIO DA INTEGRAÇÃO PAGSEGURO ---
        console.log('Iniciando pagamento PagSeguro para Pedido ID:', pedidoId);

        const clienteDataParaPagamento = {
          nome: nome,
          email: email, // Usando o email do formulário agora
          telefone: telefone.replace(/\D/g, ''), // Remover não-dígitos
        };

        const itensCarrinhoParaPagamento = cart.map(item => ({
          id: item.id, // ID do item no seu sistema
          name: item.name,
          quantity: item.quantity || 1,
          amount: (item.price * 100).toFixed(0), // Valor em centavos
        }));

        // URL para onde o PagSeguro deve redirecionar o cliente após o pagamento
        // Ajuste para a sua página de agradecimento, passando o pedidoId
        const redirectUrlPagSeguro = `${window.location.origin}/agradecimento?pedidoId=${pedidoId}`;

        // Chama a Netlify Function que cria o pagamento no PagSeguro
        const response = await fetch('/.netlify/functions/criar-pagamento-pagseguro', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            pedidoId: pedidoId,
            valorTotal: (valorNumerico * 100).toFixed(0), // Enviar valor total em centavos
            cliente: clienteDataParaPagamento,
            itensCarrinho: itensCarrinhoParaPagamento,
            redirect_url: redirectUrlPagSeguro,
          }),
        });

        const data = await response.json();

        if (response.ok && data.paymentLink) {
          setNotificacao({ mensagem: 'Pedido criado. Redirecionando para pagamento...', tipo: 'sucesso' });
          // Redireciona o cliente para o link de pagamento do PagSeguro
          window.location.href = data.paymentLink;
          // Não navegue para o dashboard imediatamente, deixe o PagSeguro fazer o redirecionamento
        } else {
          setNotificacao({ mensagem: `Erro ao gerar link de pagamento: ${data.details || 'Verifique os logs.'}`, tipo: 'erro' });
          console.error('Erro na resposta da Netlify Function criar-pagamento-pagseguro:', data.details);
          setLoading(false); // Libera o botão se houver erro
        }
        // --- FIM DA INTEGRAÇÃO PAGSEGURO ---
      }
    } catch (error) {
      console.error('Erro ao salvar pedido ou iniciar pagamento:', error);
      setNotificacao({ mensagem: `Erro ao salvar ou iniciar pagamento: ${error.message}.`, tipo: 'erro' });
      setLoading(false); // Libera o botão se houver erro
    } finally {
      // Se não houver redirecionamento imediato (apenas em caso de erro ou edição),
      // certifique-se de definir loading para false.
      // No caso de sucesso de novo pedido, o window.location.href já fará o redirecionamento,
      // então o `finally` não será atingido antes disso.
      if (isEditando || !loading) {
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
          required // Campo obrigatório
        />

        <label className="cadastro-label">Telefone</label>
        <input
          className="cadastro-input"
          type="tel"
          value={telefone}
          onChange={(e) => setTelefone(e.target.value)}
        />

        {/* NOVO CAMPO PARA EMAIL */}
        <label className="cadastro-label">Email do Cliente</label>
        <input
          className="cadastro-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required // Email é obrigatório para o PagSeguro
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
          required // Campo obrigatório
        />

        <label className="cadastro-label">Valor (R$)</label>
        <input
          className="cadastro-input"
          type="number"
          step="0.01"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          required // Campo obrigatório
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

        <Button type="submit" className="cadastro-botao" disabled={loading}>
          {loading ? 'Processando...' : (isEditando ? 'Salvar Alterações' : 'Cadastrar e Pagar')}
        </Button>
      </motion.form>
    </div>
  );
};

export default CadastroPedido;