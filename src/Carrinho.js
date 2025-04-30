import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Carrinho.css';
import { Button } from './components/ui/button'; // Assumindo que você tem um componente Button estilizado

const Carrinho = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [cart, setCart] = useState(location.state?.cart || []);
  const [opcaoFrete, setOpcaoFrete] = useState('lagoa'); // Opções: 'lagoa', 'fora', 'rural'
  const [valorFrete, setValorFrete] = useState(0);
  const [cidadeFreteExterno, setCidadeFreteExterno] = useState('');
  const valorFreteRural = 15;

  // Valores de frete fixos por cidade
  const valoresFreteExterno = {
    'Luz-MG': 15.00,
    'Arcos-MG': 18.00,
    'Santo Antonio do Monte-MG': 20.00,
    'Formiga-MG': 22.00,
    'Moema-MG': 16.00,
    'Esteios-MG': 12.00,
    'Capoeirão-MG': 10.00,
    'Ilha-MG': 14.00,
    'Martins Guimarães-MG': 25.00,
  };

  const calcularSubtotalItem = (item) => item.price * (item.quantity || 0);

  const calcularTotalCarrinho = () =>
    cart.reduce((total, item) => total + calcularSubtotalItem(item), 0) + valorFrete;

  const handleRemoverItem = (itemToRemove) => {
    const updatedCart = cart.filter(item => item.id !== itemToRemove.id);
    setCart(updatedCart);
  };

  const handleAumentarQuantidade = (itemToUpdate) => {
    const updatedCart = cart.map(item =>
      item.id === itemToUpdate.id ? { ...item, quantity: (item.quantity || 0) + 25 } : item
    );
    setCart(updatedCart);
  };

  const handleDiminuirQuantidade = (itemToUpdate) => {
    const updatedCart = cart.map(item =>
      item.id === itemToUpdate.id && (item.quantity || 0) >= 25
        ? { ...item, quantity: item.quantity - 25 }
        : item
    );
    setCart(updatedCart);
  };

  const handleContinuarComprando = () => {
    navigate('/vendas', { state: { cart } });
  };

  const handleFinalizarPedido = () => {
    if (cart.length > 0) {
      // Navega para a tela de cadastro, passando o carrinho e o valor do frete
      navigate('/cliente/cadastro', { state: { cart: cart, valorFrete: valorFrete } });
    } else {
      alert('Seu carrinho está vazio. Adicione produtos antes de finalizar.');
    }
  };

  const handleOpcaoFreteChange = (event) => {
    const opcao = event.target.value;
    setOpcaoFrete(opcao);
    setValorFrete(0);
    setCidadeFreteExterno('');

    if (opcao === 'rural') {
      setValorFrete(valorFreteRural);
    } else if (opcao === 'lagoa') {
      const totalCarrinhoSemFrete = cart.reduce((total, item) => total + calcularSubtotalItem(item), 0);
      setValorFrete(totalCarrinhoSemFrete > 50 ? 0 : 10);
    } else if (opcao === 'fora' && cidadeFreteExterno) {
      setValorFrete(valoresFreteExterno[cidadeFreteExterno] || 0);
    }
  };

  const handleCidadeFreteExternoChange = (event) => {
    const cidadeSelecionada = event.target.value;
    setCidadeFreteExterno(cidadeSelecionada);
    if (opcaoFrete === 'fora' && valoresFreteExterno[cidadeSelecionada]) {
      setValorFrete(valoresFreteExterno[cidadeSelecionada]);
    } else {
      setValorFrete(0);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="carrinho-container">
        <div className="carrinho-wrapper">
          <div className="carrinho-header">
            <img src="/logo.png" alt="Logo Delícias Docito" className="carrinho-logo-header" />
          </div>
          <h1 className="carrinho-title">Seu Carrinho está Vazio</h1>
          <p className="carrinho-vazio-mensagem">Adicione produtos na página de vendas para começar.</p>
          <div className="carrinho-acoes">
            <Button onClick={handleContinuarComprando} className="continuar-comprando-button" variant="outline">
              Continuar Comprando
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="carrinho-container">
      <div className="carrinho-wrapper">
        <div className="carrinho-header">
          <img src="/logo.png" alt="Logo Delícias Docito" className="carrinho-logo-header" />
        </div>
        <h1 className="carrinho-title">Carrinho de Compras</h1>
        <ul className="carrinho-lista">
          {cart.map((item) => (
            <li key={item.id} className="carrinho-item">
              <div className="item-detalhes">
                <h3 className="item-nome">{item.name}</h3>
                <p className="item-preco">Preço Unitário: R$ {item.price.toFixed(2)}</p>
                <div className="quantidade-controle">
                  <button onClick={() => handleDiminuirQuantidade(item)}>-</button>
                  <span className="item-quantidade">{item.quantity || 0}</span>
                  <button onClick={() => handleAumentarQuantidade(item)}>+</button>
                </div>
                <p className="item-subtotal">
                  Subtotal: R$ {calcularSubtotalItem(item).toFixed(2)}
                </p>
              </div>
              <Button onClick={() => handleRemoverItem(item)} className="remover-item-button" variant="secondary">
                Remover
              </Button>
            </li>
          ))}
        </ul>

        <div className="frete-container">
          <h2>Opções de Frete</h2>
          <div className="opcao-frete">
            <input
              type="radio"
              id="lagoa"
              value="lagoa"
              checked={opcaoFrete === 'lagoa'}
              onChange={handleOpcaoFreteChange}
            />
            <label htmlFor="lagoa">Entrega em **Lagoa da Prata**</label>
          </div>
          <div className="opcao-frete">
            <input
              type="radio"
              id="rural"
              value="rural"
              checked={opcaoFrete === 'rural'}
              onChange={handleOpcaoFreteChange}
            />
            <label htmlFor="rural">Zona Rural (**R$ {valorFreteRural.toFixed(2)}**)</label>
          </div>
          <div className="opcao-frete">
            <input
              type="radio"
              id="fora"
              value="fora"
              checked={opcaoFrete === 'fora'}
              onChange={handleOpcaoFreteChange}
            />
            <label htmlFor="fora">Pedido Fora de Lagoa da Prata:</label>
            {opcaoFrete === 'fora' && (
              <select
                id="cidade-frete-externo"
                value={cidadeFreteExterno}
                onChange={handleCidadeFreteExternoChange}
              >
                <option value="">Selecione a Cidade</option>
                {Object.keys(valoresFreteExterno).map((cidade) => (
                  <option key={cidade} value={cidade}>
                    {cidade} (**R$ {valoresFreteExterno[cidade].toFixed(2)}**)
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {valorFrete > 0 && opcaoFrete !== 'rural' && opcaoFrete !== 'lagoa' && (
          <div className="frete-valor">
            <p>Frete: **R$ {valorFrete.toFixed(2)}**</p>
          </div>
        )}
        {opcaoFrete === 'rural' && (
          <div className="frete-valor">
            <p>Frete: **R$ {valorFrete.toFixed(2)}** (Zona Rural)</p>
          </div>
        )}
        {opcaoFrete === 'lagoa' && calcularTotalCarrinho() - valorFrete > 50 && valorFrete === 0 && (
          <div className="frete-gratis">
            <p><strong style={{ color: 'green' }}>Frete Grátis!</strong></p>
          </div>
        )}
        {opcaoFrete === 'lagoa' && calcularTotalCarrinho() - valorFrete <= 50 && valorFrete > 0 && (
          <div className="frete-valor">
            <p>Frete: **R$ {valorFrete.toFixed(2)}**</p>
          </div>
        )}
        {opcaoFrete === 'fora' && valorFrete > 0 && (
          <div className="frete-valor">
            <p>Frete para {cidadeFreteExterno}: **R$ {valorFrete.toFixed(2)}**</p>
          </div>
        )}

        <div className="carrinho-total">
          <h2>Total: R$ {calcularTotalCarrinho().toFixed(2)}</h2>
        </div>
        <div className="carrinho-acoes">
          <Button onClick={handleContinuarComprando} className="continuar-comprando-button" variant="outline">
            Continuar Comprando
          </Button>
          <Button onClick={handleFinalizarPedido} className="finalizar-pedido-button">
            Finalizar Pedido
          </Button>
          {/* O botão de pagar com InfinityPay agora estará na tela de ConfirmaçãoPedido */}
        </div>
      </div>
    </div>
  );
};

export default Carrinho;