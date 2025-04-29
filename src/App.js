// App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CorrigirStatus from './CorrigirStatus';
import Login from './Login';
import CustomerLogin from './CustomerLogin';
import CustomerSignup from './components/CustomerSignup';
import Vendas from './components/Vendas';
import CadastroProduto from './components/CadastroProduto';
import { PedidosProvider } from './context/PedidosContext';
import Dashboard from './Dashboard';
import CadastroPedido from './CadastroPedido';
import PrivateRoute from './PrivateRoute';
import Home from './Home';
import PaginaNaoEncontrada from './PaginaNaoEncontrada';
import { AuthProvider } from './context/AuthContext';
import Carrinho from './Carrinho';
import CadastroCliente from './CadastroCliente'; // Importe o componente CadastroCliente
import ConfirmacaoPedido from './ConfirmacaoPedido'; // Importe o componente ConfirmacaoPedido
import AgradecimentoPedido from './AgradecimentoPedido'; // Importe o componente AgradecimentoPedido

function App() {
    return (
        <AuthProvider>
            <PedidosProvider>
                <Router>
                    <Routes>
                        <Route path="/corrigir-status" element={<CorrigirStatus />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/customer/login" element={<CustomerLogin />} />
                        <Route path="/customer/signup" element={<CustomerSignup />} />
                        <Route path="/vendas" element={<Vendas />} />
                        <Route path="/cadastro" element={<PrivateRoute><CadastroPedido /></PrivateRoute>} /> {/* Seu cadastro pessoal */}
                        <Route path="/editar/:id" element={<PrivateRoute><CadastroPedido /></PrivateRoute>} />
                        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
                        <Route path="/cadastro-produto" element={<PrivateRoute><CadastroProduto /></PrivateRoute>} />
                        <Route path="/carrinho" element={<Carrinho />} />
                        <Route path="/cliente/cadastro" element={<CadastroCliente />} /> {/* Cadastro do cliente */}
                        <Route path="/cliente/confirmacao" element={<ConfirmacaoPedido />} /> {/* Confirmação do pedido */}
                        <Route path="/cliente/agradecimento" element={<AgradecimentoPedido />} /> {/* Agradecimento */}
                        <Route path="*" element={<PaginaNaoEncontrada />} />
                    </Routes>
                </Router>
            </PedidosProvider>
        </AuthProvider>
    );
}

export default App;