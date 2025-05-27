import React, { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { useNavigate, useLocation } from 'react-router-dom';
import './Vendas.css';
import Notification from './Notification'; // Importe o componente de notificação

const Vendas = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState(location.state?.cart || []);
  const [selectedQuantities, setSelectedQuantities] = useState(() => {
    const storedQuantities = localStorage.getItem('selectedQuantities');
    return storedQuantities ? JSON.parse(storedQuantities) : {};
  });
  const [notificationMessage, setNotificationMessage] = useState(''); // Estado para a mensagem da notificação
  const [notificationType, setNotificationType] = useState('');     // Estado para o tipo da notificação
  const localStorageKey = 'selectedQuantities';

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const app = getApp();
        const db = getFirestore(app);
        const productsRef = collection(db, 'products');
        const snapshot = await getDocs(productsRef);
        const productsList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProducts(productsList);
        setLoading(false);

        const storedQuantities = localStorage.getItem('selectedQuantities');
        if (storedQuantities) {
          setSelectedQuantities(JSON.parse(storedQuantities));
          console.log('Carregado do localStorage (montagem):', JSON.parse(storedQuantities));
        }
      } catch (e) {
        setError('Erro ao carregar os produtos.');
        console.error('Erro ao buscar produtos:', e);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    console.log('Salvando estado (quantidades):', selectedQuantities);
    localStorage.setItem(localStorageKey, JSON.stringify(selectedQuantities));
  }, [selectedQuantities]);

  useEffect(() => {
    if (location.state?.cart) {
      const cartFromState = location.state.cart;
      const initialQuantities = {};
      cartFromState.forEach(item => {
        initialQuantities[item.id] = item.quantity || 0;
      });
      setSelectedQuantities(initialQuantities);
      console.log('Sincronizando selectedQuantities com o carrinho:', initialQuantities);
      navigate(location.pathname, { replace: true, state: null });
      setCart(cartFromState);
      console.log('Estado do carrinho atualizado ao retornar:', cartFromState);
    }
  }, [location, navigate]);

  useEffect(() => {
    const handleFocus = () => {
      console.log('Página focada, recarregando estado (focus)');
      const storedQuantities = localStorage.getItem(localStorageKey);
      if (storedQuantities) {
        setSelectedQuantities(JSON.parse(storedQuantities));
        console.log('Estado recarregado (focus):', JSON.parse(storedQuantities));
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleQuantityChange = (productId, quantity) => {
    const value = parseInt(quantity, 10) || 0;
    setSelectedQuantities(prevQuantities => ({ ...prevQuantities, [productId]: value }));
  };

  const handleAddToCart = (product) => {
    const quantityToAdd = selectedQuantities[product.id];
    if (quantityToAdd > 0 && quantityToAdd % 25 === 0) {
      const existingItemIndex = cart.findIndex(item => item.id === product.id);
      let updatedCart;
      if (existingItemIndex !== -1) {
        updatedCart = [...cart];
        updatedCart[existingItemIndex].quantity += quantityToAdd;
      } else {
        updatedCart = [...cart, { ...product, quantity: quantityToAdd }];
      }
      setCart(updatedCart);
      setNotificationMessage(`${quantityToAdd} "${product.name}(s)" adicionado(s) ao carrinho!`);
      setNotificationType('success');
      setSelectedQuantities(prevQuantities => ({ ...prevQuantities, [product.id]: 0 }));
    } else if (quantityToAdd > 0) {
      setNotificationMessage('Por favor, selecione uma quantidade que seja múltiplo de 25.');
      setNotificationType('error');
    } else if (quantityToAdd === 0) {
      setNotificationMessage('Selecione a quantidade desejada antes de adicionar ao carrinho.');
      setNotificationType('error');
    }
  };

  const handleQuantitySuggestion = (productId, quantity) => {
    setSelectedQuantities(prevQuantities => ({ ...prevQuantities, [productId]: quantity }));
  };

  const handleCheckout = () => {
    console.log('handleCheckout chamado, carrinho atual:', cart);
    navigate('/carrinho', { state: { cart } });
  };

  if (loading) {
    return <div className="loading-message">Carregando os produtos...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="vendas-container">
      <div className="vendas-header">
        <img src="/logo.png" alt="Logo Delícias Docito" className="vendas-logo-header" />
      </div>
      <h1 className="vendas-title">Delícias Docito ❤️</h1>
      <p className="vendas-subtitle">Os melhores doces da região, feitos com amor e ingredientes de qualidade.</p>
      <Notification message={notificationMessage} type={notificationType} />
      <div className="cart-indicator" onClick={handleCheckout} style={{ cursor: 'pointer' }}>
        🛒 Carrinho: {cart.reduce((total, item) => total + (item.quantity || 0), 0)} item(s)
      </div>
      <div className="products-grid">
        {products.map(product => (
         <div key={product.id} className="produto-container"> {/* Mudamos a classe */}
            {product.imageURL && <img src={product.imageURL} alt={product.name} className="product-image" />}
            <h2 className="product-name">{product.name}</h2>
            <p className="product-price">R$ {product.price.toFixed(2)}</p>
            <p className="product-description">{product.description || 'Delicioso produto Docito!'}</p>
            <div className="product-options">
              <div className="quantity-selector">
                <label htmlFor={`quantity-${product.id}`}>Quantidade (múltiplos de 25):</label>
                <input
                  type="number"
                  id={`quantity-${product.id}`}
                  min="0"
                  step="25"
                  value={selectedQuantities[product.id] || 0}
                  onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                />
              </div>
              <div className="quantity-suggestions">
                <button type="button" onClick={() => handleQuantitySuggestion(product.id, 25)}>25</button>
                <button type="button" onClick={() => handleQuantitySuggestion(product.id, 50)}>50</button>
                <button type="button" onClick={() => handleQuantitySuggestion(product.id, 75)}>75</button>
                <button type="button" onClick={() => handleQuantitySuggestion(product.id, 100)}>100</button>
              </div>
              <button className="add-to-cart-button" onClick={() => handleAddToCart(product)}>
                Adicionar ao Carrinho
              </button>
            </div>
          </div>
        ))}
      </div>
      {cart.length > 0 && (
        <button className="checkout-button" onClick={handleCheckout}>
          Finalizar Pedido ➔
        </button>
      )}
    </div>
  );
};

export default Vendas;