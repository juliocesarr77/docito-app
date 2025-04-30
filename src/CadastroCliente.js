// CadastroCliente.js
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CadastroPedido.css';
import { Button } from './components/ui/button';

const Notificacao = ({ mensagem, tipo }) => (
  <div className={`notificacao ${tipo}`}>
    {mensagem}
  </div>
);

const CadastroCliente = () => {
  const [nome, setNome] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');
  const [numero, setNumero] = useState('');
  const [pontoReferencia, setPontoReferencia] = useState('');
  const [dataEntrega, setDataEntrega] = useState('');
  const [horaEntrega, setHoraEntrega] = useState('');
  const [notificacao, setNotificacao] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  const cart = useMemo(() => location.state?.cart || [], [location.state?.cart]);
  const valorFrete = useMemo(() => location.state?.valorFrete || 0, [location.state?.valorFrete]);
  const clienteData = location.state;

  useEffect(() => {
    if (clienteData) {
      setNome(clienteData.nome || '');
      setTelefone(clienteData.telefone || '');
      setEndereco(clienteData.endereco || '');
      setNumero(clienteData.numero || '');
      setPontoReferencia(clienteData.pontoReferencia || '');
      setDataEntrega(clienteData.dataEntrega || '');
      setHoraEntrega(clienteData.horaEntrega || '');
    }
  }, [clienteData]);

  const formatTelefoneInput = (value) => {
    const cleanedValue = value.replace(/\D/g, '');
    let formattedValue = '';

    if (cleanedValue.length > 0) {
      formattedValue += '(' + cleanedValue.substring(0, 2);
    }
    if (cleanedValue.length > 2) {
      formattedValue += ') ' + cleanedValue.substring(2, 11);
    }

    return formattedValue;
  };

  const handleTelefoneChange = (e) => {
    const formattedValue = formatTelefoneInput(e.target.value);
    setTelefone(formattedValue);
  };

  const getTelefoneNumerico = (formattedValue) => {
    return formattedValue.replace(/\D/g, '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const telefoneNumerico = getTelefoneNumerico(telefone);
    if (!nome || telefoneNumerico.length !== 11 || !endereco || !numero || !dataEntrega || !horaEntrega) {
      setNotificacao({ mensagem: 'Preencha nome, telefone (DDD + 9 dígitos), endereço, número, data e hora de entrega.', tipo: 'erro' });
      return;
    }

    try {
      const pedidoData = {
        nome,
        telefone: telefoneNumerico,
        endereco,
        numero,
        pontoReferencia,
        dataEntrega,
        horaEntrega,
        itensCarrinho: cart,
        valorFrete: valorFrete,
        valor: (cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) + valorFrete).toFixed(2),
      };

      navigate('/cliente/confirmacao', { state: pedidoData });
      setNotificacao({ mensagem: 'Dados do cliente registrados. Confirme seu pedido.', tipo: 'sucesso' });

    } catch (error) {
      console.error('Erro ao registrar dados do cliente:', error);
      setNotificacao({ mensagem: 'Erro ao registrar seus dados. Tente novamente.', tipo: 'erro' });
    }
  };

  const produtosCarrinho = useMemo(() => cart.map(item => `${item.quantity || 1} ${item.name}`).join('\n'), [cart]);
  const valorTotalComFrete = useMemo(() => (cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0) + valorFrete).toFixed(2), [cart, valorFrete]);

  return (
    <div className="cadastro-container">
      <div className="cadastro-header">
        <img src="/logo.png" alt="Logo Delícias Docito" className="cadastro-logo-header" />
      </div>
      {notificacao && (
        <Notificacao mensagem={notificacao.mensagem} tipo={notificacao.tipo} />
      )}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="cadastro-titulo"
      >
        Dados para Entrega 🚚
      </motion.h1>

      <motion.form
        onSubmit={handleSubmit}
        className="cadastro-form"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <label className="cadastro-label">Nome Completo</label>
        <input
          className="cadastro-input"
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />

        <label className="cadastro-label">Celular</label>
        <input
          className="cadastro-input"
          type="tel"
          placeholder="(DD) 9XXXXXXXX"
          value={telefone}
          onChange={handleTelefoneChange}
          maxLength="14" // (DD) 9XXXXXXXX
          required
        />

        <label className="cadastro-label">Endereço de Entrega</label>
        <input
          className="cadastro-input"
          type="text"
          value={endereco}
          onChange={(e) => setEndereco(e.target.value)}
          required
        />

        <label className="cadastro-label">Número</label>
        <input
          className="cadastro-input"
          type="text"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          required
        />

        <label className="cadastro-label">Ponto de Referência (Opcional)</label>
        <input
          className="cadastro-input"
          type="text"
          value={pontoReferencia}
          onChange={(e) => setPontoReferencia(e.target.value)}
        />

        <label className="cadastro-label">Produtos Selecionados</label>
        <textarea
          className="cadastro-input"
          value={produtosCarrinho}
          readOnly
          rows="5"
        />

        <label className="cadastro-label">Valor Total (R$)</label>
        <input
          className="cadastro-input"
          type="number"
          step="0.01"
          value={valorTotalComFrete}
          readOnly
        />

        <label className="cadastro-label">Data de Entrega</label>
        <input
          className="cadastro-input"
          type="date"
          value={dataEntrega}
          onChange={(e) => setDataEntrega(e.target.value)}
          required
        />
        <label className="cadastro-label">Hora de Entrega</label>
        <input
          className="cadastro-input"
          type="time"
          value={horaEntrega}
          onChange={(e) => setHoraEntrega(e.target.value)}
          required
        />

        <Button type="submit" className="cadastro-botao">
          Continuar para Confirmação
        </Button>
      </motion.form>
    </div>
  );
};

export default CadastroCliente;