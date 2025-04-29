// src/CorrigirStatus.js
import React, { useEffect } from 'react';
import { db } from './firebase/config';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const CorrigirStatus = () => {
  useEffect(() => {
    const corrigirStatus = async () => {
      try {
        const pedidosRef = collection(db, 'pedidos');
        const snapshot = await getDocs(pedidosRef);

        const updates = snapshot.docs.map(async (docSnap) => {
          const statusAtual = docSnap.data().status;

          if (statusAtual && typeof statusAtual === 'string') {
            const novoStatus = statusAtual.toLowerCase();
            await updateDoc(doc(db, 'pedidos', docSnap.id), {
              status: novoStatus,
            });
            console.log(`Pedido ${docSnap.id} atualizado para: ${novoStatus}`);
          }
        });

        await Promise.all(updates);
        alert('Todos os status foram atualizados com sucesso!');
      } catch (error) {
        console.error('Erro ao atualizar status:', error);
        alert('Erro ao atualizar os status. Verifique o console.');
      }
    };

    corrigirStatus();
  }, []);

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h2>Corrigindo os status dos pedidos...</h2>
      <p>Essa página pode ser fechada após a conclusão.</p>
    </div>
  );
};

export default CorrigirStatus;
