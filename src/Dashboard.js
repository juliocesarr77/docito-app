import React, { useEffect, useState } from "react";
import { db } from "./firebase/config";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import PedidoCard from "./components/PedidoCard";
import ResumoPedidos from "./components/ResumoPedidos";

const Dashboard = () => {
  const [pedidos, setPedidos] = useState([]);

  const carregarPedidos = async () => {
    const querySnapshot = await getDocs(collection(db, "pedidos"));
    const pedidosFormatados = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    setPedidos(pedidosFormatados);
  };

  useEffect(() => {
    carregarPedidos();
  }, []);

  const handleStatusChange = async (id, novoStatus) => {
    const pedidoRef = doc(db, "pedidos", id);
    await updateDoc(pedidoRef, { status: novoStatus });
    carregarPedidos();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">📦 Painel de Pedidos</h1>
      <ResumoPedidos pedidos={pedidos} />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pedidos.map((pedido) => (
          <PedidoCard key={pedido.id} pedido={pedido} onStatusChange={handleStatusChange} />
        ))}
      </div>
    </div>
  );
};

export default Dashboard;