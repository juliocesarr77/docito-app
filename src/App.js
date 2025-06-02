// src/App.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CorrigirStatus from './CorrigirStatus';
import Login from './Login'; // Tela de login do administrador
import Vendas from './components/Vendas'; // Página de "Vendas" para o cliente (listagem de produtos?)
import CadastroProduto from './components/CadastroProduto';
import { PedidosProvider } from './context/PedidosContext';
import Dashboard from './Dashboard';
import CadastroPedido from './CadastroPedido';
import PrivateRoute from './PrivateRoute';
import Home from './Home';
import PaginaNaoEncontrada from './PaginaNaoEncontrada';
import { AuthProvider } from './context/AuthContext';
import Carrinho from './Carrinho';
// import CadastroCliente from './CadastroCliente'; // Já deve ter sido removido
import ConfirmacaoPedido from './ConfirmacaoPedido';
import AgradecimentoPedido from './AgradecimentoPedido'; // Importação da página de agradecimento
import PaginaDepoimentoSecreto from './components/PaginaDepoimentoSecreto';
import AdminPage from './pages/AdminPage';
import GerenciarDepoimentos from './admin/GerenciarDepoimentos';

function App() {
  return (
    <AuthProvider>
      <PedidosProvider>
        <Router>
          <Routes>
            {/* Rotas Públicas (Acessíveis a todos) */}
            <Route path="/" element={<Home />} />
            <Route path="/vendas" element={<Vendas />} />
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/cliente/cadastro" element={<CadastroPedido />} />
            <Route path="/cliente/confirmacao" element={<ConfirmacaoPedido />} />
            {/* CORREÇÃO AQUI: MUDANDO A ROTA PARA CORRESPONDER AO NAVIGATE */}
            <Route path="/agradecimento" element={<AgradecimentoPedido />} /> 
            <Route path="/login" element={<Login />} />
            <Route path="/depoimento/:token" element={<PaginaDepoimentoSecreto />} />
            <Route path="*" element={<PaginaNaoEncontrada />} />

            {/* Rotas Privadas */}
            <Route path="/admin/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/admin/pedidos" element={<PrivateRoute><Vendas /></PrivateRoute>} />
            <Route path="/admin/novo-pedido" element={<PrivateRoute><CadastroPedido /></PrivateRoute>} />
            <Route path="/admin/editar/:id" element={<PrivateRoute><CadastroPedido /></PrivateRoute>} />
            <Route path="/admin/cadastro-produto" element={<PrivateRoute><CadastroProduto /></PrivateRoute>} />
            <Route path="/admin/corrigir-status" element={<PrivateRoute><CorrigirStatus /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} />
            <Route path="/admin/depoimentos" element={<PrivateRoute><GerenciarDepoimentos /></PrivateRoute>} />
          </Routes>
        </Router>
      </PedidosProvider>
    </AuthProvider>
  );
}

export default App;