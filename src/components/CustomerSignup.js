import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../firebase/config'; // Certifique-se do caminho correto
import './CustomerSignup.css'; // Crie um arquivo CSS para o registro do cliente (opcional)

const CustomerSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    try {
      await createUserWithEmailAndPassword(auth, email, password);
      alert('Cadastro realizado com sucesso!');
      navigate('/customer/login'); // Redirecionar para a página de login do cliente
    } catch (err) {
      setError(getErrorMessage(err.code));
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      alert('Cadastro com Google realizado com sucesso!');
      navigate('/customer/login'); // Redirecionar para a página de login do cliente
    } catch (err) {
      setError('Erro ao cadastrar com o Google. Tente novamente.');
    }
  };

  const getErrorMessage = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Este e-mail já está em uso.';
      case 'auth/invalid-email':
        return 'O e-mail digitado não é válido.';
      case 'auth/weak-password':
        return 'A senha deve ter pelo menos 6 caracteres.';
      default:
        return 'Ocorreu um erro ao tentar cadastrar. Tente novamente.';
    }
  };

  return (
    <div className="customer-signup-container">
      <motion.div
        className="customer-signup-box"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="customer-signup-logo">
          <img src="/logo_cliente_signup.png" alt="Logo Cliente Cadastro" className="customer-signup-logo-image" />
        </div>

        <h2 className="customer-signup-title">Crie sua conta</h2>

        <form onSubmit={handleSignup}>
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

          <div className="form-group">
            <label className="form-label" htmlFor="confirmPassword">Confirmar Senha</label>
            <input
              type="password"
              id="confirmPassword"
              className="form-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button
            type="submit"
            className="customer-signup-button"
          >
            Cadastrar
          </button>
        </form>

        <div className="login-link">
          <Link to="/customer/login" className="link">
            Já tem uma conta? Faça login aqui.
          </Link>
        </div>

        <div className="google-signup">
          <button
            onClick={handleGoogleSignup}
            className="google-button"
          >
            Cadastrar com o Google
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default CustomerSignup;