import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Home.css';
import { db } from './firebase/config';
import { collection, getDocs, limit, query } from 'firebase/firestore';
import { FaInstagram, FaWhatsapp } from 'react-icons/fa'; // Importando os ícones

const Home = () => {
  const navigate = useNavigate();
  const [destaques, setDestaques] = useState([]);

  useEffect(() => {
    const buscarDestaques = async () => {
      try {
        const produtosRef = collection(db, 'products');
        const primeirosTres = query(produtosRef, limit(3));
        const snapshot = await getDocs(primeirosTres);
        const produtos = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDestaques(produtos);
      } catch (error) {
        console.error('Erro ao buscar produtos em destaque:', error);
        // Lidar com o erro, talvez exibir uma mensagem ao usuário
      }
    };

    buscarDestaques();
  }, []);

  const mensagemWhatsApp = encodeURIComponent("Olá! Gostaria de fazer um pedido ou tirar alguma dúvida sobre os doces da Delícias Docito.");
  const linkWhatsApp = `https://wa.me//5537999965194?text=${mensagemWhatsApp}`;

  return (
    <div className="home-container">
      <div className="home-header">
        <img src="/logo.png" alt="Logo Docito" className="home-logo-header" />
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <section className="hero">
          <div className="hero-content">
            <h1>Bem-vindo à Delícias Docito 🍬</h1>
            <p>Os melhores doces da região, feitos com amor e ingredientes de qualidade.</p>
            <button onClick={() => navigate('/vendas')} className="cta-button">
              Ver Produtos
            </button>
          </div>
          <div className="hero-image">
            {/* Adicione aqui o caminho para a sua imagem principal */}
          </div>
        </section>

        <section className="featured-products">
          <h2>Nossos Produtos Mais Queridos</h2>
          <div className="products-list">
            {destaques.map(produto => (
              <div className="product-card" key={produto.id}>
                <img src={produto.imageURL || '/images/produto_padrao.png'} alt={produto.name} />
                <h3>{produto.name}</h3>
                <p>{produto.description || 'Descrição do produto'}</p>
                <button className="view-button" onClick={() => navigate('/vendas')}>Ver Mais</button>
              </div>
            ))}
            {destaques.length < 3 && Array.from({ length: 3 - destaques.length }).map((_, index) => (
              <div className="product-card placeholder" key={`placeholder-${index}`}>
                <div className="image-placeholder"></div>
                <h3>Em breve</h3>
                <p>Novas delícias chegando!</p>
                <button className="view-button disabled">Ver Mais</button>
              </div>
            ))}
          </div>
        </section>

        <section className="about-us">
          <h2>Sobre Nós</h2>
          <p>A Delícias Docito nasceu da paixão por confeitaria e do desejo de levar alegria através de doces saborosos e feitos com carinho. Utilizamos ingredientes frescos e selecionados para garantir a melhor experiência para nossos clientes.</p>
        </section>

        <section className="contact-us">
          <h2>Entre em Contato</h2>
          <p>Estamos ansiosos para adoçar o seu dia! Entre em contato conosco para encomendas e informações.</p>
          <button className="whatsapp-button" onClick={() => window.open(linkWhatsApp, '_blank')}>
            <FaWhatsapp className="whatsapp-icon" /> Fale conosco no WhatsApp
          </button>
          <button className="instagram-button" onClick={() => window.open('https://www.instagram.com/seu_perfil_aqui', '_blank')}>
            <FaInstagram className="instagram-icon" /> Siga-nos no Instagram
          </button>
        </section>
      </motion.div>
    </div>
  );
};

export default Home;