import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./Login";
import Dashboard from "./Dashboard";
import CadastroPedido from "./CadastroPedido";
import PrivateRoute from "./PrivateRoute";
import Home from "./Home"; // 👈 adiciona isso

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} /> {/* 👈 rota inicial */}
        <Route path="/login" element={<Login />} />
        <Route path="/cadastro" element={<PrivateRoute><CadastroPedido /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      </Routes>
    </Router>
  );
}

export default App;
