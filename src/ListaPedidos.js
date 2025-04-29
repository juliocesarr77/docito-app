// src/ListaPedidos.js
import React, { useEffect, useState } from 'react';
import { db } from './firebase/firebaseConfig';
import { collection, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';

const statusCores = {
  "Pendente": "#ffecb3",
  "Em produção": "#bbdefb",
  "Pronto": "#c8e6c9",
  "Entregue": "#e0e0e0"
};

const ListaPedidos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [editandoId, setEditandoId] = useState(null);
  const [editData, setEditData] = useState({
    cliente: '',
    docinhos: '',
    valor: '',
    status: ''
  });

  useEffect(() => {
    const pedidosRef = collection(db, 'pedidos');
    const unsubscribe = onSnapshot(pedidosRef, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPedidos(lista);
    });

    return () => unsubscribe();
  }, []);

  const excluirPedido = async (id) => {
    const confirmacao = window.confirm("Tem certeza que deseja excluir este pedido?");
    if (!confirmacao) return;

    try {
      await deleteDoc(doc(db, 'pedidos', id));
    } catch (error) {
      console.error("Erro ao excluir pedido:", error);
      alert("Erro ao excluir pedido.");
    }
  };

  const editarPedido = (pedido) => {
    setEditandoId(pedido.id);
    setEditData({
      cliente: pedido.cliente,
      docinhos: pedido.docinhos,
      valor: pedido.valor,
      status: pedido.status
    });
  };

  const cancelarEdicao = () => {
    setEditandoId(null);
    setEditData({ cliente: '', docinhos: '', valor: '', status: '' });
  };

  const salvarEdicao = async (id) => {
    try {
      const pedidoRef = doc(db, 'pedidos', id);
      await updateDoc(pedidoRef, {
        cliente: editData.cliente,
        docinhos: editData.docinhos,
        valor: editData.valor,
        status: editData.status
      });
      cancelarEdicao();
    } catch (error) {
      console.error("Erro ao salvar edição:", error);
      alert("Erro ao salvar edição.");
    }
  };

  // Agrupar os pedidos por status
  const pedidosPorStatus = pedidos.reduce((acc, pedido) => {
    const status = pedido.status || "Pendente";
    if (!acc[status]) acc[status] = [];
    acc[status].push(pedido);
    return acc;
  }, {});

  return (
    <div style={{ padding: '20px', maxWidth: '900px', margin: 'auto' }}>
      <h2>Lista de Pedidos</h2>
      {Object.keys(pedidosPorStatus).length === 0 ? (
        <p>Nenhum pedido cadastrado ainda.</p>
      ) : (
        Object.entries(pedidosPorStatus).map(([status, pedidosDoStatus]) => (
          <div key={status} style={{ marginBottom: '30px' }}>
            <h3 style={{ background: statusCores[status] || '#f0f0f0', padding: '10px', borderRadius: '5px' }}>
              {status} ({pedidosDoStatus.length})
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: '1px solid #ccc' }}>Cliente</th>
                  <th style={{ borderBottom: '1px solid #ccc' }}>Docinhos</th>
                  <th style={{ borderBottom: '1px solid #ccc' }}>Valor (R$)</th>
                  <th style={{ borderBottom: '1px solid #ccc' }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pedidosDoStatus.map((pedido) => (
                  <tr key={pedido.id}>
                    {editandoId === pedido.id ? (
                      <>
                        <td>
                          <input
                            type="text"
                            value={editData.cliente}
                            onChange={(e) => setEditData({ ...editData, cliente: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            value={editData.docinhos}
                            onChange={(e) => setEditData({ ...editData, docinhos: e.target.value })}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editData.valor}
                            onChange={(e) => setEditData({ ...editData, valor: e.target.value })}
                          />
                        </td>
                        <td>
                          <select
                            value={editData.status}
                            onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Em produção">Em produção</option>
                            <option value="Pronto">Pronto</option>
                            <option value="Entregue">Entregue</option>
                          </select>
                          <br />
                          <button onClick={() => salvarEdicao(pedido.id)} style={{ color: 'green', marginTop: '5px' }}>
                            Salvar
                          </button>
                          <button onClick={cancelarEdicao} style={{ marginLeft: '8px', marginTop: '5px' }}>
                            Cancelar
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ padding: '8px' }}>{pedido.cliente}</td>
                        <td style={{ padding: '8px' }}>{pedido.docinhos}</td>
                        <td style={{ padding: '8px' }}>{pedido.valor}</td>
                        <td style={{ padding: '8px' }}>
                          <button onClick={() => editarPedido(pedido)}>Editar</button>
                          <button
                            onClick={() => excluirPedido(pedido.id)}
                            style={{ marginLeft: '8px', color: 'red' }}
                          >
                            Excluir
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}
    </div>
  );
};

export default ListaPedidos;
