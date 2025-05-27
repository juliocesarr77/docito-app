// AgradecimentoPedido.js
import React, { useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './AgradecimentoPedido.css';
import { Button } from './components/ui/button';
import instagramLogo from './assets/instagram-logo.png';
import { db } from './firebase/config';
import { doc, updateDoc } from 'firebase/firestore';

const AgradecimentoPedido = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoId = searchParams.get('pedidoId');
  const transactionId = searchParams.get('transaction_id'); // Extrai transaction_id
  const slug = searchParams.get('slug'); // Extrai slug
  const orderNsu = searchParams.get('order_nsu'); // Extrai order_nsu (deve ser igual ao pedidoId)
  const instagramURL = 'https://www.instagram.com/docito_doceria123?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';

  const atualizarStatusPagamento = useCallback(async (novoStatus) => {
    try {
      if (pedidoId) {
        const pedidoRef = doc(db, 'pedidos', pedidoId);
        await updateDoc(pedidoRef, { pagamentoStatus: novoStatus });
        console.log(`Status de pagamento do pedido ${pedidoId} atualizado para: ${novoStatus}`);
      }
    } catch (error) {
      console.error('Erro ao atualizar status de pagamento:', error);
    }
  }, [pedidoId]);

  useEffect(() => {
    if (pedidoId && transactionId && slug && orderNsu) {
      console.log('ID do Pedido Recebido na Agradecimento:', pedidoId);
      console.log('Parâmetros da InfinitePay Recebidos:', { transactionId, slug, orderNsu });

      // Chama o seu backend para verificar o pagamento
      fetch(`/api/verificar-pagamento/${pedidoId}?transaction_id=${transactionId}&slug=${slug}&order_nsu=${orderNsu}`)
        .then(response => response.json())
        .then(data => {
          if (data.pago) {
            atualizarStatusPagamento('pago');
          } else {
            atualizarStatusPagamento('não pago');
          }
        })
        .catch(error => console.error('Erro ao verificar pagamento:', error));
    } else if (pedidoId) {
      console.log('ID do Pedido Recebido na Agradecimento, mas parâmetros da InfinitePay ausentes.');
      // Talvez exibir uma mensagem de erro ou status pendente
    }
  }, [pedidoId, transactionId, slug, orderNsu, atualizarStatusPagamento]);

  const handleVoltarParaVendas = () => {
    navigate('/vendas');
  };

  return (
    <div style={{ backgroundColor: '#fff7f1', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="agradecimento-container">
        <h1>Obrigado pela sua compra! 🎉</h1>
        <p>Seu pedido foi registrado com sucesso e em breve entraremos em contato para os detalhes da entrega.</p>
        {pedidoId && <p>Seu número de pedido é: <strong>{pedidoId}</strong></p>}
        <div className="seguir-instagram">
          <p>📸 Siga nosso Instagram e marque sua encomenda nos stories para repostarmos!</p>
          <a href={instagramURL} target="_blank" rel="noopener noreferrer" className="instagram-link">
            <Button className="instagram-button">
              <img src={instagramLogo} alt="Instagram Logo" className="instagram-logo" />
              Siga-nos no Instagram
            </Button>
          </a>
        </div>
        <div className="voltar-vendas">
          <Button onClick={handleVoltarParaVendas} variant="outline">
            Voltar para Produtos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgradecimentoPedido;