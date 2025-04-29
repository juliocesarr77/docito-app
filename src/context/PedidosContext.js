// src/context/PedidosContext.js
import { createContext, useContext, useEffect, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';

const PedidosContext = createContext();

export const usePedidos = () => useContext(PedidosContext);

export const PedidosProvider = ({ children }) => {
  const [pedidos, setPedidos] = useState([]);
  const [filtroStatus, setFiltroStatus] = useState('todos');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null); // Adicionado estado para erros

  // Usando onSnapshot para escutar as mudanças em tempo real
  useEffect(() => {
    const q = collection(db, 'pedidos');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const dados = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setPedidos(dados);
        setCarregando(false);
        setErro(null); // Limpa qualquer erro anterior
      },
      (error) => {
        console.error("Erro ao buscar pedidos:", error);
        setErro("Erro ao buscar os pedidos. Tente novamente mais tarde.");
        setCarregando(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const adicionarPedido = async (novoPedido) => {
    try {
      const docRef = await addDoc(collection(db, 'pedidos'), novoPedido);
      setPedidos(prev => [...prev, { id: docRef.id, ...novoPedido }]);
      setErro(null);
    } catch (error) {
      console.error("Erro ao adicionar pedido:", error);
      setErro("Erro ao adicionar o pedido. Tente novamente.");
    }
  };

  const atualizarStatus = async (id, novoStatus) => {
    try {
      await updateDoc(doc(db, 'pedidos', id), { status: novoStatus });
      setPedidos(prev =>
        prev.map(pedido => (pedido.id === id ? { ...pedido, status: novoStatus } : pedido))
      );
      setErro(null);
    } catch (error) {
      console.error("Erro ao atualizar status:", error);
      setErro("Erro ao atualizar o status do pedido. Tente novamente.");
    }
  };

  const excluirPedido = async (id) => {
    try {
      await deleteDoc(doc(db, 'pedidos', id));
      setPedidos(prev => prev.filter(pedido => pedido.id !== id));
      setErro(null);
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      setErro("Erro ao excluir o pedido. Tente novamente.");
    }
  };

    const atualizarPedido = async (id, dados) => {
    try {
      await updateDoc(doc(db, 'pedidos', id), dados);
      setPedidos(prev =>
        prev.map(p => (p.id === id ? { ...p, ...dados } : p))
      );
      setErro(null);
    } catch (error) {
      console.error("Erro ao atualizar pedido:", error);
      setErro("Erro ao atualizar o pedido. Tente novamente.");
    }
  };

  return (
    <PedidosContext.Provider
      value={{
        pedidos,
        carregando,
        filtroStatus,
        setFiltroStatus,
        adicionarPedido,
        atualizarStatus,
        excluirPedido,
        atualizarPedido,
        erro, // Adicionado o estado de erro ao contexto
      }}
    >
      {children}
    </PedidosContext.Provider>
  );
};
