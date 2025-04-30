import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AgradecimentoPedido.css';
import { Button } from './components/ui/button';
import instagramLogo from './assets/instagram-logo.png'; // Verifique se o caminho está correto!

const AgradecimentoPedido = () => {
  const navigate = useNavigate();
  const instagramURL = 'https://www.instagram.com/docito_doceria123?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=='; // Substitua pelo seu link real

  const handleVoltarParaVendas = () => {
    navigate('/vendas');
  };

  return (
    <div style={{ backgroundColor: '#fff7f1', minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div className="agradecimento-container">
        <h1>Obrigado pela sua compra! 🎉</h1>
        <p>Seu pedido foi registrado com sucesso e em breve entraremos em contato para os detalhes da entrega.</p>
        <div className="seguir-instagram">
          <p>📸 Siga nosso Instagram e marque sua encomenda nos stories para repostarmos!</p>
          <a href={instagramURL} target="_blank" rel="noopener noreferrer" className="instagram-link">
            <Button className="instagram-button">
              <img src={instagramLogo} alt="Instagram Logo" className="instagram-logo" />
              Siga-nos no Instagram
            </Button>
          </a>
        </div>

        {/* Adicionando o botão "Voltar para Produtos" */}
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