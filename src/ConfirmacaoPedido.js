// ConfirmacaoPedido.js
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ConfirmacaoPedido.css';
import { Button } from './components/ui/button';
import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { FaWhatsapp } from 'react-icons/fa';
import infinityPayLogo from './assets/infinitepay.png'; // Logo do rodapé
import infinityPayButtonIcon from './assets/Logo_InfinitePay.svg.png'; // Ícone da logo para o botão

const ConfirmacaoPedido = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const clienteData = state || {};

  const [email, setEmail] = useState('');
  const [cep, setCep] = useState('');
  const [erroPagamento, setErroPagamento] = useState('');

  if (!clienteData || !clienteData.itensCarrinho) {
    return <div className="confirmacao-container">Erro: Dados do pedido não encontrados.</div>;
  }

  const calcularTotalPedido = () => {
    const subtotal = clienteData.itensCarrinho.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
    return (subtotal + (clienteData.valorFrete || 0)).toFixed(2);
  };

  const formatarItensPedido = () => {
    return clienteData.itensCarrinho.map(item => `${item.quantity} x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n');
  };

  const handleFinalizarCompra = async () => {
    try {
      const valorNumerico = parseFloat(calcularTotalPedido());
      const pedido = {
        ...clienteData,
        email: email,
        cep: cep,
        valor: valorNumerico,
        status: 'pendente',
        createdAt: serverTimestamp(),
        data: Timestamp.now(),
      };

      await addDoc(collection(db, 'pedidos'), pedido);

      // Formatar a mensagem para o WhatsApp
      const mensagemCliente = `Novo pedido recebido!\n\n*Dados do Cliente:*\nNome: ${clienteData.nome}\nTelefone: ${clienteData.telefone || 'Não informado'}\nEndereço: ${clienteData.endereco}, ${clienteData.numero} ${clienteData.pontoReferencia ? `(Ref: ${clienteData.pontoReferencia})` : ''}\nData de Entrega: ${clienteData.dataEntrega}\nHora de Entrega: ${clienteData.horaEntrega}\nEmail: ${email}\nCEP: ${cep}\n\n*Itens do Pedido:*\n${formatarItensPedido()}\n\n*Valor Total: R$ ${calcularTotalPedido()}*`;
      const mensagemWhatsApp = encodeURIComponent(mensagemCliente);

      window.open(`https://wa.me//5537999965194?text=${mensagemWhatsApp}`, '_blank');

    } catch (error) {
      console.error('Erro ao finalizar pedido:', error);
      alert('Erro ao finalizar seu pedido. Tente novamente.');
    }
  };

  const handlePagarComInfinityPay = () => {
    if (!email || !cep) {
      setErroPagamento('Por favor, preencha o e-mail e o CEP para pagar com InfinityPay.');
      return;
    }
    setErroPagamento(''); // Limpa qualquer erro anterior

    const items = clienteData.itensCarrinho.map(item => ({
      name: item.name,
      quantity: item.quantity || 1,
      amount: (item.price * 100).toFixed(0),
    }));
    const encodedItems = encodeURIComponent(JSON.stringify(items));
    const redirectUrl = encodeURIComponent('https://www.docito.online/cliente/agradecimento');
    const customerName = clienteData.nome ? encodeURIComponent(clienteData.nome) : '';
    const customerCellphone = clienteData.telefone ? encodeURIComponent(clienteData.telefone) : '';
    const address = clienteData.endereco ? encodeURIComponent(clienteData.endereco) : '';
    const addressNumber = clienteData.numero ? encodeURIComponent(clienteData.numero) : '';
    const addressComplement = clienteData.pontoReferencia ? encodeURIComponent(clienteData.pontoReferencia) : '';
    const customerEmail = encodeURIComponent(email); // Usa o estado email
    const addressCep = encodeURIComponent(cep.replace('-', '')); // Usa o estado cep
    const amount = (parseFloat(calcularTotalPedido()) * 100).toFixed(0);

    let infinityPayUrl = `https://checkout.infinitepay.io/julio_cesar_r77?items=${encodedItems}&redirect_url=${redirectUrl}`;
    if (customerName) infinityPayUrl += `&customer_name=${customerName}`;
    if (customerCellphone) infinityPayUrl += `&customer_cellphone=${customerCellphone}`;
    if (address) infinityPayUrl += `&address=${address}`;
    if (addressNumber) infinityPayUrl += `&address_number=${addressNumber}`;
    if (addressComplement) infinityPayUrl += `&address_complement=${addressComplement}`;
    if (customerEmail) infinityPayUrl += `&customer_email=${customerEmail}`;
    if (addressCep) infinityPayUrl += `&address_cep=${addressCep}`;
    infinityPayUrl += `&amount=${amount}`;

    console.log('URL de pagamento InfinityPay:', infinityPayUrl);
    window.location.href = infinityPayUrl;
  };

  return (
    <div style={{ backgroundColor: '#fff7f1' }}> {/* Adicionando estilo inline ao div pai */}
      <div className="confirmacao-container">
        <div className="confirmacao-header">
          <img src="/logo.png" alt="Logo Delícias Docito" className="confirmacao-logo-header" />
        </div>
        <h1>Confirme seu Pedido</h1>
        <div className="detalhes-cliente">
          <h2>Dados do Cliente</h2>
          <p><strong>Nome:</strong> {clienteData.nome}</p>
          <p><strong>Telefone:</strong> {clienteData.telefone || 'Não informado'}</p>
          <p><strong>Endereço:</strong> {clienteData.endereco}</p>
          <p><strong>Número:</strong> {clienteData.numero || 'Não informado'}</p>
          <p><strong>Ponto de Referência:</strong> {clienteData.pontoReferência || 'Não informado'}</p>
          <p><strong>Data de Entrega:</strong> {clienteData.dataEntrega}</p>
          <p><strong>Hora de Entrega:</strong> {clienteData.horaEntrega}</p>
        </div>

        <div className="detalhes-pedido">
          <h2>Itens do Pedido</h2>
          <ul>
            {clienteData.itensCarrinho && clienteData.itensCarrinho.map(item => (
              <li key={item.id}>
                {item.quantity} x {item.name} - R$ {(item.price * item.quantity).toFixed(2)}
              </li>
            ))}
          </ul>
          {clienteData.valorFrete > 0 && (
            <p className="frete"><strong>Frete: R$ {clienteData.valorFrete.toFixed(2)}</strong></p>
          )}
          <p className="total"><strong>Valor Total: R$ {calcularTotalPedido()}</strong></p>
        </div>

        <div className="informacoes-pagamento">
          <h2>Informações para Pagamento</h2>
          {erroPagamento && <p className="erro-mensagem">{erroPagamento}</p>}
          <label htmlFor="email" className="confirmacao-label">Email:</label>
          <input
            type="email"
            id="email"
            className="confirmacao-input"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label htmlFor="cep" className="confirmacao-label">CEP:</label>
          <input
            type="text"
            id="cep"
            className="confirmacao-input"
            value={cep}
            onChange={(e) => setCep(e.target.value)}
            required
          />
        </div>

        {/* Nova seção informativa sobre o pagamento */}
        <div className="info-pagamento">
          <h2>Opções de Pagamento</h2>
          <p>Pague com Pix ou cartão de crédito/débito online através do InfinityPay. É rápido e seguro!</p>
        </div>

        <div className="acoes-confirmacao">
          <Button onClick={() => navigate('/cliente/cadastro', { state: clienteData })} variant="outline">
            Editar Dados
          </Button>
          <Button onClick={handlePagarComInfinityPay} className="infinitypay-button">
            <img src={infinityPayButtonIcon} alt="InfinityPay" className="infinitypay-button-icon" />
            Pagar com InfinityPay
          </Button>
          <Button onClick={handleFinalizarCompra} variant="secondary">
            <FaWhatsapp className="whatsapp-icon-confirmacao" /> Finalizar Pedido (WhatsApp)
          </Button>
        </div>
      </div>

      {/* Rodapé com a imagem - MOVIDO PARA FORA do confirmacao-container */}
      <div className="confirmacao-footer">
        <img src={infinityPayLogo} alt="InfinityPay" style={{ maxWidth: '450px', height: 'auto' }} />
      </div>
    </div>
  );
};

export default ConfirmacaoPedido;