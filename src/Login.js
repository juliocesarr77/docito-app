import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from './firebase/firebaseConfig';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError('Erro ao fazer login. Tente novamente.');
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      setError('Erro ao fazer login com o Google. Tente novamente.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-salmon-50">
      <motion.div
        className="w-full max-w-md p-6 bg-white rounded-lg shadow-lg"
        initial={{ opacity: 0, y: -100 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="w-24 h-24" />
        </div>

        <h2 className="text-2xl font-bold text-center text-salmon-500 mb-6">Bem-vindo de volta!</h2>

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700" htmlFor="email">E-mail</label>
            <input
              type="email"
              id="email"
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-salmon-400"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700" htmlFor="password">Senha</label>
            <input
              type="password"
              id="password"
              className="w-full p-3 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-salmon-400"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

          <button
            type="submit"
            className="w-full bg-salmon-500 text-white p-3 rounded-md hover:bg-salmon-600 transition duration-200"
          >
            Entrar
          </button>
        </form>

        <div className="mt-4 text-center">
          <Link to="/signup" className="text-sm text-salmon-500 hover:underline">
            Ainda não tem uma conta? Crie uma aqui.
          </Link>
        </div>

        {/* Botão para login com Google */}
        <div className="mt-4 text-center">
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-orange-400 text-white p-3 rounded-md hover:bg-orange-500 transition duration-200"
          >
            Entrar com o Google
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;



