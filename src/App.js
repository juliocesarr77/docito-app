import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CorrigirStatus from './CorrigirStatus';
import Login from './Login'; // Tela de login do administrador
import CustomerLogin from './CustomerLogin';
import CustomerSignup from './components/CustomerSignup';
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
// import ClientLayout from './layouts/ClientLayout'; // Remova a importação

function App() {
  return (
    <AuthProvider>
      <PedidosProvider>
        <Router>
          <Routes>
            {/* Rotas Públicas (Acessíveis a todos) */}
            <Route path="/" element={<Home />} /> {/* Home para o cliente - SEM ClientLayout */}
            <Route path="/customer/login" element={<CustomerLogin />} />
            <Route path="/customer/signup" element={<CustomerSignup />} />
            <Route path="/vendas" element={<Vendas />} /> {/* Cliente vê os produtos/vendas aqui - SEM ClientLayout */}
            <Route path="/carrinho" element={<Carrinho />} />
            <Route path="/cliente/cadastro" element={<CadastroCliente />} />
            <Route path="/cliente/confirmacao" element={<ConfirmacaoPedido />} />
            <Route path="/cliente/agradecimento" element={<AgradecimentoPedido />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<PaginaNaoEncontrada />} />

            {/* Rotas Privadas */}
            <Route path="/admin/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/admin/pedidos" element={<PrivateRoute><Vendas /></PrivateRoute>} />
            <Route path="/admin/novo-pedido" element={<PrivateRoute><CadastroPedido /></PrivateRoute>} />
            <Route path="/admin/editar/:id" element={<PrivateRoute><CadastroPedido /></PrivateRoute>} />
            <Route path="/admin/cadastro-produto" element={<PrivateRoute><CadastroProduto /></PrivateRoute>} />
            <Route path="/admin/corrigir-status" element={<PrivateRoute><CorrigirStatus /></PrivateRoute>} />
          </Routes>
        </Router>
      </PedidosProvider>
    </AuthProvider>
  );
}

export default App;