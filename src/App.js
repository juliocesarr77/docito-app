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
import CadastroCliente from './CadastroCliente';
import ConfirmacaoPedido from './ConfirmacaoPedido';
import AgradecimentoPedido from './AgradecimentoPedido';
import PaginaDepoimentoSecreto from './components/PaginaDepoimentoSecreto'; // Importe o novo componente
import AdminPage from './pages/AdminPage'; // Importe a página de administração
import GerenciarDepoimentos from './admin/GerenciarDepoimentos'; // Importe o componente de gerenciamento de depoimentos

function App() {
  return (
    <AuthProvider>
      <PedidosProvider>
        <Router>
          <Routes>
            {/* Rotas Públicas (Acessíveis a todos) */}
            <Route path="/" element={<Home />} /> {/* Home para o cliente - SEM ClientLayout */}
            <Route path="/vendas" element={<Vendas />} /> {/* Cliente vê os produtos/vendas aqui - SEM ClientLayout */}
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/cliente/cadastro" element={<CadastroCliente />} />
            <Route path="/cliente/confirmacao" element={<ConfirmacaoPedido />} />
            <Route path="/cliente/agradecimento" element={<AgradecimentoPedido />} />
            <Route path="/login" element={<Login />} />
            <Route path="/depoimento/:token" element={<PaginaDepoimentoSecreto />} /> {/* Rota para o depoimento secreto */}
            <Route path="*" element={<PaginaNaoEncontrada />} />

            {/* Rotas Privadas */}
            <Route path="/admin/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/admin/pedidos" element={<PrivateRoute><Vendas /></PrivateRoute>} />
            <Route path="/admin/novo-pedido" element={<PrivateRoute><CadastroPedido /></PrivateRoute>} />
            <Route path="/admin/editar/:id" element={<PrivateRoute><CadastroPedido /></PrivateRoute>} />
            <Route path="/admin/cadastro-produto" element={<PrivateRoute><CadastroProduto /></PrivateRoute>} />
            <Route path="/admin/corrigir-status" element={<PrivateRoute><CorrigirStatus /></PrivateRoute>} />
            <Route path="/admin" element={<PrivateRoute><AdminPage /></PrivateRoute>} /> {/* Rota para a página de administração */}
            <Route path="/admin/depoimentos" element={<PrivateRoute><GerenciarDepoimentos /></PrivateRoute>} /> {/* Rota para gerenciar depoimentos */}
          </Routes>
        </Router>
      </PedidosProvider>
    </AuthProvider>
  );
}

export default App;