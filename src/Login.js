import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase/config';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('adminToken', idToken); // Salva o token
      alert('Login realizado com sucesso!');
      navigate('/admin/dashboard'); // Redireciona para a página de administração APÓS o login
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const idToken = await userCredential.user.getIdToken();
      localStorage.setItem('adminToken', idToken); // Salva o token
      alert('Login com Google realizado com sucesso!');
      navigate('/admin'); // Redireciona para a página de administração APÓS o login
    } catch (err) {
      setError('Erro ao fazer login com o Google. Tente novamente.');
    }
  };

  return (
    <div className="login-container">
      <motion.div
        className="login-box"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="login-logo">
          <img src="/logo.png" alt="Logo" className="logo-image" />
        </div>

        <h2 className="login-title">Bem-vindo de volta!</h2>

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
            className="login-button"
          >
            Entrar
          </button>
        </form>

        {/* Botão para login com Google */}
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

export default Login;