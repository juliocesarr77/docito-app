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
  const [email, setEmail] = useState('');
  const [endereco, setEndereco] = useState('');
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [produto, setProduto] = useState(''); // Este campo será gerado a partir de itensCarrinho
  const [valor, setValor] = useState(''); // Este campo será gerado a partir de itensCarrinho
  const [status, setStatus] = useState('pendente');
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
      setEmail(pedidoEditar.email || '');
      setEndereco(pedidoEditar.endereco || '');
      setPontoReferencia(pedidoEditar.pontoReferencia || '');
      setProduto(pedidoEditar.produto); // Produto aqui deve ser o texto descritivo
      setValor(pedidoEditar.valor.toString());
      setStatus(pedidoEditar.status || 'pendente');
      setDataEntrega(pedidoEditar.dataEntrega || '');
      setHoraEntrega(pedidoEditar.horaEntrega || '');
    } else if (cart.length > 0) {
      // Quando vem do carrinho, pré-preenche produto e valor
      const produtosCarrinho = cart.map(item => `${item.quantity || 1}x ${item.name} (R$ ${item.price.toFixed(2)})`).join('\n');
      setProduto(produtosCarrinho);
      const valorTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
      setValor(valorTotal.toFixed(2));
      setStatus('pendente');
    }
  }, [isEditando, pedidoEditar, cart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!nome || !email || cart.length === 0) { // Agora validamos o carrinho diretamente
      setNotificacao({ mensagem: 'Preencha o nome, email e adicione itens ao carrinho.', tipo: 'erro' });
      return;
    }

    // O valor total e a descrição do produto serão calculados a partir do 'cart'
    const valorNumericoTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    const produtosDescricao = cart.map(item => `${item.quantity || 1}x ${item.name}`).join('\n');

    setLoading(true);
    setNotificacao(null);

    try {
      // Dados do cliente, conforme esperado pela Netlify Function (clienteData)
      const clienteData = {
        nome,
        telefone,
        email,
        endereco,
        pontoReferencia,
        dataEntrega,
        horaEntrega,
        // Adicionando valor e produto aqui para salvar no documento raiz do pedido também,
        // mas o principal é itensCarrinho
        valorTotal: valorNumericoTotal,
        produtoDescricao: produtosDescricao,
      };

      // Itens do carrinho para serem enviados, conforme esperado pela Netlify Function (itensCarrinho)
      // Certifique-se de que cada item do carrinho tenha as propriedades esperadas pela função,
      // como id, nome, preco, quantidade.
      const itensCarrinhoParaEnviar = cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          // Adicione outras propriedades dos itens do carrinho que você queira salvar no Firestore
      }));


      if (isEditando) {
        // Lógica de edição (permanece no Firebase diretamente, não passa pela Netlify Function)
        const pedidoDocRef = doc(db, 'pedidos', pedidoEditar.id);
        await updateDoc(pedidoDocRef, {
            ...clienteData,
            itensCarrinho: itensCarrinhoParaEnviar, // Atualiza também os itens do carrinho se necessário
            updatedAt: serverTimestamp(), // Adiciona um timestamp de atualização
        });
        setNotificacao({ mensagem: 'Pedido atualizado com sucesso!', tipo: 'sucesso' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Lógica de novo pedido:
        // 1. Chamar a Netlify Function para gerar o próximo número sequencial E salvar o pedido completo
        console.log('Enviando dados para a Netlify Function:', { clienteData, itensCarrinho: itensCarrinhoParaEnviar });

        const response = await fetch('/.netlify/functions/gerar-numero-pedido', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ // AGORA ENVIAMOS OS DADOS COMPLETOS!
            clienteData: clienteData,
            itensCarrinho: itensCarrinhoParaEnviar,
          }),
        });

        const responseData = await response.json(); // Pega a resposta JSON da função

        if (!response.ok) {
          // Se a resposta não for OK (status 4xx ou 5xx)
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

        // Redirecionar para a página de agradecimento
        navigate(`/agradecimento?pedidoId=${pedidoIdFirestore}&numeroPedido=${numeroPedidoCliente}`);
      }
    } catch (error) {
      console.error('Erro ao salvar pedido ou iniciar processo:', error);
      setNotificacao({ mensagem: `Erro ao salvar ou iniciar processo: ${error.message}.`, tipo: 'erro' });
      setLoading(false);
    } finally {
      // Para novos pedidos, o navigate já "encerra" a execução visualmente
      // Para edição, garantimos que o loading seja false
      if (isEditando && !notificacao) { // Apenas se não houver notificação de erro ou sucesso ainda
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

        <label className="cadastro-label">Email do Cliente</label>
        <input
          className="cadastro-input"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
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

        {/* Produto e Valor agora são apenas para exibição/edição se vierem de um pedido existente */}
        {/* Se o pedido vem do carrinho, esses campos não são editáveis diretamente aqui */}
        {cart.length === 0 ? (
          <>
            <label className="cadastro-label">Produto</label>
            <textarea
              className="cadastro-input"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              placeholder="Digite os produtos separados por linha"
              rows="5"
              required // Mantém o required se não for via carrinho
            />

            <label className="cadastro-label">Valor (R$)</label>
            <input
              className="cadastro-input"
              type="number"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              required // Mantém o required se não for via carrinho
            />
          </>
        ) : (
          <>
            <label className="cadastro-label">Produtos do Carrinho</label>
            <textarea
              className="cadastro-input"
              value={produto} // `produto` já foi preenchido no useEffect
              readOnly // Torna o campo somente leitura
              rows="5"
            />
            <label className="cadastro-label">Valor Total do Pedido (R$)</label>
            <input
              className="cadastro-input"
              type="text" // Pode ser text agora que é readonly
              value={valor} // `valor` já foi preenchido no useEffect
              readOnly // Torna o campo somente leitura
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