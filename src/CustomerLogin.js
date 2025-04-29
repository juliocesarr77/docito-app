import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase/config'; // Certifique-se do caminho correto
import './CustomerLogin.css'; // Crie um arquivo CSS para o login do cliente (opcional)

const CustomerLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert('Login do cliente realizado com sucesso!');
      navigate('/vendas'); // Redirecionar para a página de vendas do cliente
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert('Login do cliente com Google realizado com sucesso!');
      navigate('/vendas'); // Redirecionar para a página de vendas do cliente
    } catch (err) {
      setError('Erro ao fazer login com o Google. Tente novamente.');
    }
  };

  return (
    <div className="customer-login-container">
      <motion.div
        className="customer-login-box"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="customer-login-logo">
          <img src="/logo_cliente.png" alt="Logo Cliente" className="customer-logo-image" />
        </div>

        <h2 className="customer-login-title">Acesse sua conta</h2>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="customer-login-button"
          >
            Entrar
          </button>
        </form>

        <div className="signup-link">
          <Link to="/customer/signup" className="link">
            Não tem uma conta? Crie uma aqui.
          </Link>
        </div>

        <div className="google-login">
          <button
            onClick={handleGoogleLogin}
            className="google-button"
          >
            Entrar com o Google
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerLogin;