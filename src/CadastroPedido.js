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
  const [produto, setProduto] = useState('');
  const [valor, setValor] = useState('');
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
      setStatus('pendente');
    }
  }, [isEditando, pedidoEditar, cart]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    if (!nome || !produto || !valor || !email) {
      setNotificacao({ mensagem: 'Preencha todos os campos obrigatórios (Nome, Produto, Valor, Email).', tipo: 'erro' });
      return;
    }

    if (isNaN(parseFloat(valor))) {
      setNotificacao({ mensagem: 'Valor inválido. Use um número.', tipo: 'erro' });
      return;
    }

    setLoading(true);
    setNotificacao(null);

    try {
      const valorNumerico = parseFloat(valor);
      const pedidoData = {
        nome,
        telefone,
        email,
        endereco,
        pontoReferencia,
        produto,
        valor: valorNumerico,
        status: status,
        dataEntrega,
        horaEntrega,
      };

      let pedidoDocRef;
      let pedidoIdFirestore; // Variável para o ID gerado pelo Firestore
      let numeroPedidoCliente; // Variável para o ID sequencial que o cliente verá

      if (isEditando) {
        // Lógica de edição
        pedidoDocRef = doc(db, 'pedidos', pedidoEditar.id);
        await updateDoc(pedidoDocRef, pedidoData);
        setNotificacao({ mensagem: 'Pedido atualizado com sucesso!', tipo: 'sucesso' });
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        // Lógica de novo pedido:
        // 1. Chamar a Netlify Function para gerar o próximo número sequencial
        const numeroPedidoResponse = await fetch('/.netlify/functions/gerar-numero-pedido', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ /* Nenhum dado essencial aqui por enquanto */ }),
        });

        const numeroPedidoData = await numeroPedidoResponse.json();

        if (!numeroPedidoResponse.ok || !numeroPedidoData.numeroPedido) {
          setNotificacao({ mensagem: `Erro ao gerar número do pedido: ${numeroPedidoData.details || 'Verifique os logs da função.'}`, tipo: 'erro' });
          setLoading(false);
          return;
        }

        numeroPedidoCliente = numeroPedidoData.numeroPedido;
        console.log('Número sequencial gerado para o cliente:', numeroPedidoCliente);

        // 2. Salvar o pedido no Firebase com o ID do Firestore E o novo numeroPedido
        pedidoDocRef = await addDoc(collection(db, 'pedidos'), {
          ...pedidoData,
          createdAt: serverTimestamp(),
          data: Timestamp.now(),
          numeroPedido: numeroPedidoCliente, // NOVO CAMPO: O ID sequencial para o cliente
          pagamentoStatus: 'aguardando_contato', // Novo status
          pagSeguroTransactionId: '', // Não será usado para PagSeguro
        });
        pedidoIdFirestore = pedidoDocRef.id; // Pega o ID do Firestore para referência interna

        console.log('Pedido salvo no Firestore com ID:', pedidoIdFirestore, 'e Número do Pedido para o cliente:', numeroPedidoCliente);

        setNotificacao({ mensagem: `Pedido ${numeroPedidoCliente} criado! Redirecionando para a confirmação...`, tipo: 'sucesso' });

        // 3. Redirecionar para a página de agradecimento, passando o numeroPedido (e o pedidoId do Firestore, se precisar)
        navigate(`/agradecimento?pedidoId=${pedidoIdFirestore}&numeroPedido=${numeroPedidoCliente}`);
      }
    } catch (error) {
      console.error('Erro ao salvar pedido ou iniciar processo:', error);
      setNotificacao({ mensagem: `Erro ao salvar ou iniciar processo: ${error.message}.`, tipo: 'erro' });
      setLoading(false);
    } finally {
      // O 'finally' só é importante se não houver um redirecionamento ou retorno explícito antes.
      // Neste caso, o `Maps` já muda a tela, mas é bom ter em mente para outros fluxos.
      if (isEditando) { // Apenas garante que o loading seja false se estiver editando e não houver navegação
        setLoading(false);
      }
      // Para novos pedidos, o navigate já "encerra" a execução visualmente
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