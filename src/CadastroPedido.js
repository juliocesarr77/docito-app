import React, { useState } from 'react';
import { db } from "./firebase/config";
import { collection, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const CadastroPedido = () => {
  const [nome, setNome] = useState('');
  const [produto, setProduto] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [status, setStatus] = useState('Pendente');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "pedidos"), {
        nome,
        produto,
        quantidade,
        status,
        data: new Date().toLocaleDateString()
      });

      alert("Pedido cadastrado com sucesso!");
      setNome('');
      setProduto('');
      setQuantidade('');
      setStatus('Pendente');
      navigate('/dashboard');
    } catch (error) {
      console.error("Erro ao cadastrar pedido:", error);
      alert("Erro ao cadastrar pedido.");
    }
  };

  return (
    <div className="min-h-screen bg-[#fff5ea] p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#5a2a0c] mb-6 text-center">📋 Cadastro de Pedido</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#5a2a0c] font-medium mb-1">Nome do Cliente:</label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
              className="w-full px-4 py-2 border border-orange-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-[#5a2a0c] font-medium mb-1">Produto (Docinhos):</label>
            <input
              type="text"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              required
              className="w-full px-4 py-2 border border-orange-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-[#5a2a0c] font-medium mb-1">Quantidade:</label>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              required
              className="w-full px-4 py-2 border border-orange-300 rounded-md"
            />
          </div>
          <div>
            <label className="block text-[#5a2a0c] font-medium mb-1">Status:</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-4 py-2 border border-orange-300 rounded-md"
            >
              <option value="Pendente">Pendente</option>
              <option value="Produção">Produção</option>
              <option value="Concluído">Concluído</option>
            </select>
          </div>
          <button
            type="submit"
            className="w-full bg-[#ff9248] text-white py-2 rounded-md hover:bg-[#ff7300] transition"
          >
            Cadastrar Pedido
          </button>
        </form>
      </div>
    </div>
  );
};

export default CadastroPedido;