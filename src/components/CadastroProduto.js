import React, { useState } from 'react';
import { db } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore'; // Import collection and addDoc directly from firebase/firestore
import './CadastroProduto.css';

console.log("DB object (top of component):", db);

const CadastroProduto = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    console.log("DB object (inside handleSubmit):", db);

    if (!imageURL) {
      setError('Por favor, insira a URL da imagem do produto.');
      return;
    }

    try {
      console.log("Attempting to use collection:", collection);
      console.log("DB object being passed to collection:", db);
      const productsCollectionRef = collection(db, 'products');
      console.log("productsCollectionRef:", productsCollectionRef);
      await addDoc(productsCollectionRef, {
        name,
        description,
        price: parseFloat(price),
        imageURL: imageURL,
        category,
        createdAt: new Date(),
      });
      alert('Produto cadastrado com sucesso!');
      navigate('/dashboard');
      setName('');
      setDescription('');
      setPrice('');
      setImageURL('');
      setCategory('');
    } catch (err) {
      setError('Erro ao cadastrar o produto.');
      console.error('Erro ao cadastrar produto:', err);
    }
  };

  return (
    <div className="cadastro-produto-container">
      <h1>Cadastrar Novo Produto</h1>
      {error && <p className="error-message">{error}</p>}
      <form onSubmit={handleSubmit} className="cadastro-produto-form">
        <div className="form-group">
          <label htmlFor="name">Nome:</label>
          <input
            type="text"
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="description">Descrição:</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="form-group">
          <label htmlFor="price">Preço:</label>
          <input
            type="number"
            id="price"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
            step="0.01"
          />
        </div>
        <div className="form-group">
          <label htmlFor="imageURL">URL da Imagem do Produto:</label>
          <input
            type="text"
            id="imageURL"
            value={imageURL}
            onChange={(e) => setImageURL(e.target.value)}
            required
          />
          {imageURL && <img src={imageURL} alt="Preview" style={{ maxWidth: '100px', marginTop: '10px' }} />}
        </div>
        <div className="form-group">
          <label htmlFor="category">Categoria:</label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <button type="submit" className="cadastro-produto-button">
          Cadastrar Produto
        </button>
      </form>
    </div>
  );
};

export default CadastroProduto;