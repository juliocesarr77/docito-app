import React, { useState } from 'react';
import { db, storage } from '../firebase/config';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import './CadastroProduto.css';

console.log("Objeto storage no CadastroProduto:", storage); // <----- LINHA ADICIONADA PARA INSPEÇÃO

const CadastroProduto = () => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imageURL, setImageURL] = useState('');
  const [category, setCategory] = useState('');
  const [error, setError] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!imageFile) {
      setError('Por favor, selecione uma imagem para o produto.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setImageURL(''); // Limpa a URL anterior

    try {
      const storageRef = ref(storage, `products/${imageFile.name}_${Date.now()}`);
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log('Upload is ' + progress + '% done');
          switch (snapshot.state) {
            case 'paused':
              console.log('Upload is paused');
              break;
            case 'running':
              console.log('Upload is running');
              break;
            default: // Adicionado o default case para satisfazer a regra default-case do ESLint
              console.log('Upload is in an unknown state:', snapshot.state);
              break;
          }
        },
        (error) => {
          setIsUploading(false);
          setError('Erro ao enviar a imagem.');
          console.error('Erro no upload da imagem:', error);
          return;
        },
        async () => {
          // Upload concluído, obtenha a URL de download
          getDownloadURL(uploadTask.snapshot.ref).then(async (downloadURL) => {
            console.log('File available at', downloadURL);
            setImageURL(downloadURL);
            setIsUploading(false);

            // Agora, salve os dados do produto no Firestore com a URL da imagem
            const productsCollectionRef = collection(db, 'products');
            await addDoc(productsCollectionRef, {
              name,
              description,
              price: parseFloat(price),
              imageURL: downloadURL, // Use a URL de download obtida do Storage
              category,
              createdAt: new Date(),
            });
            alert('Produto cadastrado com sucesso!');
            navigate('/admin/dashboard'); // <----- REDIRECIONA PARA O DASHBOARD CORRETO
            setName('');
            setDescription('');
            setPrice('');
            setImageFile(null);
            setUploadProgress(0);
            setCategory('');
          });
        }
      );
    } catch (err) {
      setIsUploading(false);
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
          <label htmlFor="imageFile">Imagem do Produto:</label>
          <input
            type="file"
            id="imageFile"
            accept="image/*" // Aceita apenas arquivos de imagem
            onChange={(e) => setImageFile(e.target.files[0])}
            required
          />
          {imageFile && <p>Arquivo selecionado: {imageFile.name}</p>}
          {isUploading && <p>Enviando imagem: {uploadProgress.toFixed(0)}%</p>}
          {imageURL && !isUploading && <img src={imageURL} alt="Preview" style={{ maxWidth: '100px', marginTop: '10px' }} />}
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
        <button type="submit" className="cadastro-produto-button" disabled={isUploading}>
          Cadastrar Produto
        </button>
      </form>
      <button onClick={() => navigate('/admin/dashboard')} className="dashboard-button">
        Ir para o Dashboard
      </button>
    </div>
  );
};

export default CadastroProduto;