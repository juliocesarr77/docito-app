// CadastroCliente.js
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './CadastroPedido.css';
import { Button } from './components/ui/button';

const Notificacao = ({ mensagem, tipo }) => (
    <div className={`notificacao ${tipo}`}>
        {mensagem}
    </div>
);

const CadastroCliente = () => {
    const [nome, setNome] = useState('');
    const [telefone, setTelefone] = useState('');
    const [endereco, setEndereco] = useState('');
    const [pontoReferencia, setPontoReferencia] = useState('');
    const [produto, setProduto] = useState('');
    const [valor, setValor] = useState('');
    const [dataEntrega, setDataEntrega] = useState('');
    const [horaEntrega, setHoraEntrega] = useState('');
    const [notificacao, setNotificacao] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const cart = useMemo(() => location.state?.cart || [], [location.state?.cart]);
    const clienteData = location.state; // Recebe todos os dados passados via estado

    useEffect(() => {
        if (clienteData) {
            setNome(clienteData.nome || '');
            setTelefone(clienteData.telefone || '');
            setEndereco(clienteData.endereco || '');
            setPontoReferencia(clienteData.pontoReferencia || '');
            setDataEntrega(clienteData.dataEntrega || '');
            setHoraEntrega(clienteData.horaEntrega || '');
            setValor(clienteData.valor || (cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0)).toFixed(2));
            setProduto(clienteData.itensCarrinho ? clienteData.itensCarrinho.map(item => `${item.quantity || 1} ${item.name}`).join('\n') : cart.map(item => `${item.quantity || 1} ${item.name}`).join('\n'));
        } else if (cart.length > 0) {
            const produtosCarrinho = cart.map(item => `${item.quantity || 1} ${item.name}`).join('\n');
            setProduto(produtosCarrinho);
            const valorTotal = cart.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
            setValor(valorTotal.toFixed(2));
        }
    }, [clienteData, cart]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!nome || !endereco || !dataEntrega || !horaEntrega) {
            setNotificacao({ mensagem: 'Preencha nome, endereço, data e hora de entrega.', tipo: 'erro' });
            return;
        }

        try {
            const valorNumerico = parseFloat(valor);
            const pedidoData = {
                nome,
                telefone,
                endereco,
                pontoReferencia,
                produto,
                valor: valorNumerico,
                dataEntrega,
                horaEntrega,
                itensCarrinho: cart,
            };

            navigate('/cliente/confirmacao', { state: { pedidoData } });
            setNotificacao({ mensagem: 'Dados do cliente registrados. Confirme seu pedido.', tipo: 'sucesso' });

        } catch (error) {
            console.error('Erro ao registrar dados do cliente:', error);
            setNotificacao({ mensagem: 'Erro ao registrar seus dados. Tente novamente.', tipo: 'erro' });
        }
    };

    return (
        <div className="cadastro-container">
            {notificacao && (
                <Notificacao mensagem={notificacao.mensagem} tipo={notificacao.tipo} />
            )}
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="cadastro-titulo"
            >
                Dados para Entrega 🚚
            </motion.h1>

            <motion.form
                onSubmit={handleSubmit}
                className="cadastro-form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
            >
                <label className="cadastro-label">Nome Completo</label>
                <input
                    className="cadastro-input"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                />

                <label className="cadastro-label">Telefone</label>
                <input
                    className="cadastro-input"
                    type="tel"
                    value={telefone}
                    onChange={(e) => setTelefone(e.target.value)}
                />

                <label className="cadastro-label">Endereço de Entrega</label>
                <input
                    className="cadastro-input"
                    type="text"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    required
                />

                <label className="cadastro-label">Ponto de Referência (Opcional)</label>
                <input
                    className="cadastro-input"
                    type="text"
                    value={pontoReferencia}
                    onChange={(e) => setPontoReferencia(e.target.value)}
                />

                <label className="cadastro-label">Produtos Selecionados</label>
                <textarea
                    className="cadastro-input"
                    value={produto}
                    readOnly
                    rows="5"
                />

                <label className="cadastro-label">Valor Total (R$)</label>
                <input
                    className="cadastro-input"
                    type="number"
                    step="0.01"
                    value={valor}
                    readOnly
                />

                <label className="cadastro-label">Data de Entrega</label>
                <input
                    className="cadastro-input"
                    type="date"
                    value={dataEntrega}
                    onChange={(e) => setDataEntrega(e.target.value)}
                    required
                />
                <label className="cadastro-label">Hora de Entrega</label>
                <input
                    className="cadastro-input"
                    type="time"
                    value={horaEntrega}
                    onChange={(e) => setHoraEntrega(e.target.value)}
                    required
                />

                <Button type="submit" className="cadastro-botao">
                    Continuar para Confirmação
                </Button>
            </motion.form>
        </div>
    );
};

export default CadastroCliente;