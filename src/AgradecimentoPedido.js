// AgradecimentoPedido.js
import React, { useEffect, useState } from 'react'; // Adicionado useState
import { useNavigate, useSearchParams } from 'react-router-dom';
import './AgradecimentoPedido.css';
import { Button } from './components/ui/button';
import instagramLogo from './assets/instagram-logo.png';
// As linhas abaixo relacionadas ao Firebase e atualização de status
// serão mantidas caso você queira registrar o pedidoId do Firestore,
// mas a lógica de 'pagamentoStatus' do PagSeguro/InfinitePay será removida.
// import { db } from './firebase/config';
// import { doc, updateDoc } from 'firebase/firestore';

const AgradecimentoPedido = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const pedidoIdFirestore = searchParams.get('pedidoId'); // ID do Firestore (longo)
  const numeroPedidoCliente = searchParams.get('numeroPedido'); // O ID sequencial (curto)

  // Estados para controlar o que será exibido e o link do WhatsApp
  const [pedidoExibicaoId, setPedidoExibicaoId] = useState('');
  const [whatsappLink, setWhatsappLink] = useState('');

  const instagramURL = 'https://www.instagram.com/docito_doceria123?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw==';
  const SEU_TELEFONE_WHATSAPP = '5537998376688'; // Lembre-se de substituir pelo seu número com DDI+DDD

  useEffect(() => {
    // Priorizamos o numeroPedidoCliente
    if (numeroPedidoCliente) {
      setPedidoExibicaoId(numeroPedidoCliente);
      const msgWhatsapp = `Olá! Meu pedido de número ${numeroPedidoCliente} foi realizado. Gostaria de conversar sobre o pagamento e a entrega.`;
      setWhatsappLink(`https://wa.me/${SEU_TELEFONE_WHATSAPP}?text=${encodeURIComponent(msgWhatsapp)}`);
    } else if (pedidoIdFirestore) {
      // Fallback: se por algum motivo o numeroPedidoCliente não veio, use o ID do Firestore
      setPedidoExibicaoId(pedidoIdFirestore);
      const msgWhatsapp = `Olá! Meu pedido (ID interno: ${pedidoIdFirestore}) foi realizado. Gostaria de conversar sobre o pagamento e a entrega.`;
      setWhatsappLink(`https://wa.me/${SEU_TELEFONE_WHATSAPP}?text=${encodeURIComponent(msgWhatsapp)}`);
    }

    // --- REMOÇÃO DA LÓGICA DE VERIFICAÇÃO DE PAGAMENTO INFINITE PAY/PAGSEGURO ---
    // Todo este bloco abaixo deve ser removido ou comentado, pois não faremos mais
    // a verificação automática de pagamento por aqui.
    /*
    const transactionId = searchParams.get('transaction_id');
    const slug = searchParams.get('slug');
    const orderNsu = searchParams.get('order_nsu');

    const atualizarStatusPagamento = async (novoStatus) => {
        try {
            if (pedidoIdFirestore) {
                const pedidoRef = doc(db, 'pedidos', pedidoIdFirestore);
                await updateDoc(pedidoRef, { pagamentoStatus: novoStatus });
                console.log(`Status de pagamento do pedido ${pedidoIdFirestore} atualizado para: ${novoStatus}`);
            }
        } catch (error) {
            console.error('Erro ao atualizar status de pagamento:', error);
        }
    };

    if (pedidoIdFirestore && transactionId && slug && orderNsu) {
        console.log('ID do Pedido Recebido na Agradecimento:', pedidoIdFirestore);
        console.log('Parâmetros da InfinitePay Recebidos:', { transactionId, slug, orderNsu });

        fetch(`/api/verificar-pagamento/${pedidoIdFirestore}?transaction_id=${transactionId}&slug=${slug}&order_nsu=${orderNsu}`)
            .then(response => response.json())
            .then(data => {
                if (data.pago) {
                    atualizarStatusPagamento('pago');
                } else {
                    atualizarStatusPagamento('não pago');
                }
            })
            .catch(error => console.error('Erro ao verificar pagamento:', error));
    } else if (pedidoIdFirestore && !numeroPedidoCliente) { // !numeroPedidoCliente para evitar logs desnecessários no fluxo Pix/WhatsApp
        console.log('ID do Pedido Recebido na Agradecimento, mas parâmetros de pagamento ausentes (esperado para o fluxo Pix/WhatsApp).');
    }
    */
    // --- FIM DA REMOÇÃO DA LÓGICA DE VERIFICAÇÃO DE PAGAMENTO ---

  }, [searchParams, numeroPedidoCliente, pedidoIdFirestore, navigate, SEU_TELEFONE_WHATSAPP]); // Adicionado SEU_TELEFONE_WHATSAPP às dependências do useEffect

  const handleVoltarParaVendas = () => {
    navigate('/vendas');
  };

  return (
    <div style={{ backgroundColor: '#fff7f1', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="agradecimento-container">
        <h1>Obrigado pela sua compra! 🎉</h1>
        <p>Seu pedido foi registrado com sucesso.</p>
        {pedidoExibicaoId && <p>Seu número de pedido é: <strong>{pedidoExibicaoId}</strong></p>}
        
        <p>Aguardamos seu contato via WhatsApp para finalizarmos os detalhes do pagamento e da entrega.</p>
        
        {whatsappLink && (
          <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="whatsapp-link-btn">
            <Button className="whatsapp-button">
              <img src={instagramLogo} alt="WhatsApp Logo" className="whatsapp-logo" style={{ marginRight: '8px', width: '24px', height: '24px' }} /> {/* Reutilizando o logo por enquanto, mas o ideal seria um logo de WhatsApp */}
              Converse conosco no WhatsApp!
            </Button>
          </a>
        )}

        <div className="seguir-instagram" style={{ marginTop: '20px' }}>
          <p>📸 Siga nosso Instagram e marque sua encomenda nos stories para repostarmos!</p>
          <a href={instagramURL} target="_blank" rel="noopener noreferrer" className="instagram-link">
            <Button className="instagram-button">
              <img src={instagramLogo} alt="Instagram Logo" className="instagram-logo" />
              Siga-nos no Instagram
            </Button>
          </a>
        </div>
        <div className="voltar-vendas" style={{ marginTop: '20px' }}>
          <Button onClick={handleVoltarParaVendas} variant="outline">
            Voltar para Produtos
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgradecimentoPedido;