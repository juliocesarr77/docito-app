// ConfirmacaoPedido.js
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ConfirmacaoPedido.css';
import { Button } from './components/ui/button';
import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const ConfirmacaoPedido = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { pedidoData } = location.state || {};

    if (!pedidoData) {
        return <div className="confirmacao-container">Erro: Dados do pedido não encontrados.</div>;
    }

    const handleFinalizarCompra = async () => {
        try {
            await addDoc(collection(db, 'pedidos'), {
                ...pedidoData,
                status: 'pendente',
                createdAt: serverTimestamp(),
                data: Timestamp.now(),
            });
            navigate('/cliente/agradecimento');
        } catch (error) {
            console.error('Erro ao finalizar pedido:', error);
            alert('Erro ao finalizar seu pedido. Tente novamente.');
        }
    };

    return (
        <div className="confirmacao-container">
            <h1>Confirme seu Pedido</h1>
            <div className="detalhes-cliente">
                <h2>Dados do Cliente</h2>
                <p><strong>Nome:</strong> {pedidoData.nome}</p>
                <p><strong>Telefone:</strong> {pedidoData.telefone || 'Não informado'}</p>
                <p><strong>Endereço:</strong> {pedidoData.endereco}</p>
                <p><strong>Ponto de Referência:</strong> {pedidoData.pontoReferencia || 'Não informado'}</p>
                <p><strong>Data de Entrega:</strong> {pedidoData.dataEntrega}</p>
                <p><strong>Hora de Entrega:</strong> {pedidoData.horaEntrega}</p>
            </div>

            <div className="detalhes-pedido">
                <h2>Itens do Pedido</h2>
                <ul>
                    {pedidoData.itensCarrinho && pedidoData.itensCarrinho.map(item => (
                        <li key={item.id}>
                            {item.quantity} x {item.name} - R$ {(item.price * item.quantity).toFixed(2)}
                        </li>
                    ))}
                </ul>
                <p className="total"><strong>Valor Total: R$ {pedidoData.valor}</strong></p>
            </div>

            <div className="acoes-confirmacao">
                <Button onClick={() => navigate('/cliente/cadastro', { state: { ...pedidoData, cart: pedidoData.itensCarrinho } })} variant="outline">
                    Editar Dados
                </Button>
                <Button onClick={handleFinalizarCompra}>
                    Finalizar Compra
                </Button>
            </div>
        </div>
    );
};

export default ConfirmacaoPedido;