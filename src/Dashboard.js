import React, { useEffect, useState, useMemo } from 'react';
import { db } from './firebase/config';
import {
    collection,
    doc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    query,
    orderBy,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { Button } from './components/ui/button';
import { motion } from 'framer-motion';
import {
    Pencil,
    Trash,
    ArrowUp,
    Clock,
    Factory,
    PackageCheck,
    CheckCircle,
    ShoppingCart,
    PlusCircle,
    UserPlus,
    ListChecks,
    FilePlus,
    MessageSquarePlus,
    House,
    Link as LinkIcon, // Importando o ícone de link
    // REMOVIDO: CreditCard, // Novo ícone para status de pagamento
} from 'lucide-react'; // Importando mais ícones
import './Dashboard.css';
import { format, differenceInDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Dashboard = () => {
    const [pedidos, setPedidos] = useState(null);
    const [filtro, setFiltro] = useState('todos');
    const navigate = useNavigate();

    // Pesquisa
    const [searchTerm, setSearchTerm] = useState('');
    // Paginação
    const [paginaAtual, setPaginaAtual] = useState(1);
    const [pedidosPorPagina] = useState(5);
    // Ordenação
    const [ordenarPor, setOrdenarPor] = useState('nome');
    const [direcao, setDirecao] = useState('asc');
    // Filtros avançados
    const [valorMinimo, setValorMinimo] = useState('');
    const [valorMaximo, setValorMaximo] = useState('');

    useEffect(() => {
        console.log('useEffect executado');

        const q = query(collection(db, 'pedidos'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(
            q,
            (snapshot) => {
                console.log('Dados do snapshot:', snapshot.docs);
                const lista = snapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => a.nome.localeCompare(b.nome));
                console.log('Lista de pedidos:', lista);
                setPedidos(lista);
            },
            (error) => {
                console.error('Erro ao buscar pedidos:', error);
                setPedidos([]);
            }
        );
        return () => unsubscribe();
    }, []);

    const contarPorStatus = (status) =>
        pedidos ? pedidos.filter((p) => p.status === status).length : 0;

    const proximoStatus = (statusAtual) => {
        const ordem = ['pendente', 'em produção', 'pronto', 'entregue'];
        const atual = ordem.indexOf(statusAtual.toLowerCase());
        return ordem[(atual + 1) % ordem.length];
    };

    const atualizarStatus = async (id, statusAtual) => {
        try {
            const novo = proximoStatus(statusAtual);
            await updateDoc(doc(db, 'pedidos', id), { status: novo });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
        }
    };

    const excluirPedido = async (id) => {
        if (window.confirm('Deseja excluir este pedido?')) {
            try {
                await deleteDoc(doc(db, 'pedidos', id));
            } catch (error) {
                console.error('Erro ao excluir pedido:', error);
            }
        }
    };

    const voltarAoTopo = () => window.scrollTo({ top: 0, behavior: 'smooth' });

    const filtrarPorStatus = (status) => {
        setFiltro(status);
    };

    const handleSearch = (event) => {
        setSearchTerm(event.target.value);
    };

    const handleOrdenar = (criterio) => {
        if (ordenarPor === criterio) {
            setDirecao(direcao === 'asc' ? 'desc' : 'asc');
        } else {
            setOrdenarPor(criterio);
            setDirecao('asc');
        }
    };

    const calcularDiasParaEntrega = (dataEntrega) => {
        try {
            const dataEntregaFormatada = new Date(dataEntrega);
            const hoje = new Date();
            const diffEmDias = differenceInDays(dataEntregaFormatada, hoje);
            return diffEmDias;
        } catch (error) {
            console.error("Erro ao calcular a diferença em dias:", error);
            return "Data inválida";
        }
    };

    const pedidosFiltrados = useMemo(() => {
        if (!pedidos) return [];

        let filtered = pedidos;

        if (filtro !== 'todos') {
            filtered = filtered.filter((p) => p.status === filtro);
        }

        if (searchTerm) {
            const lowerSearchTerm = searchTerm.toLowerCase();
            filtered = filtered.filter((pedido) =>
                pedido.nome.toLowerCase().includes(lowerSearchTerm) ||
                pedido.telefone?.toLowerCase().includes(lowerSearchTerm) ||
                pedido.endereco?.toLowerCase().includes(lowerSearchTerm) ||
                pedido.pontoReferencia?.toLowerCase().includes(lowerSearchTerm) ||
                pedido.produto?.toLowerCase().includes(lowerSearchTerm)
            );
        }
        if (valorMinimo) {
            filtered = filtered.filter((pedido) => pedido.valor >= parseFloat(valorMinimo));
        }

        if (valorMaximo) {
            filtered = filtered.filter((pedido) => pedido.valor <= parseFloat(valorMaximo));
        }
        if (ordenarPor === 'nome') {
            filtered.sort((a, b) => (direcao === 'asc' ? a.nome.localeCompare(b.nome) : b.nome.localeCompare(a.nome)));
        } else if (ordenarPor === 'valor') {
            filtered.sort((a, b) => (direcao === 'asc' ? a.valor - b.valor : b.valor - a.valor));
        } else if (ordenarPor === 'dataEntrega') {
            filtered.sort((a, b) => {
                const dataA = a.dataEntrega ? new Date(a.dataEntrega) : null;
                const dataB = b.dataEntrega ? new Date(b.dataEntrega) : null;

                if (!dataA && !dataB) return 0;
                if (!dataA) return direcao === 'asc' ? -1 : 1;
                if (!dataB) return direcao === 'asc' ? 1 : -1;

                return direcao === 'asc' ? dataA - dataB : dataB - dataA;
            });
        }

        return filtered;
    }, [pedidos, filtro, searchTerm, valorMinimo, valorMaximo, ordenarPor, direcao]);

    const ultimoPedidoIndex = paginaAtual * pedidosPorPagina;
    const primeiroPedidoIndex = ultimoPedidoIndex - pedidosPorPagina;
    const pedidosDaPagina = pedidosFiltrados.slice(primeiroPedidoIndex, ultimoPedidoIndex);

    const mudarPagina = (numeroPagina) => {
        setPaginaAtual(numeroPagina);
    };

    const getPaymentStatusColor = (statusPagamento) => {
        switch (statusPagamento) {
            case 'pago':
                return 'text-green-500';
            case 'pendente':
                return 'text-yellow-500';
            case 'não pago':
                return 'text-red-500';
            default:
                return 'text-gray-500';
        }
    };

    return (
        <div className="dashboard-container">
            <img src="/logo.png" alt="Docito Logo" className="dashboard-logo" />
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="dashboard-title"
            >
                Bem-vindo(a) à Docito 🍬
            </motion.h1>

            <div className="dashboard-navigation">
                <Button
                    variant="default"
                    className="dash-button"
                    onClick={() => navigate('/admin/pedidos')}
                >
                    <ListChecks className="button-icon" size={20} /> Listar Pedidos
                </Button>
                <Button
                    variant="default"
                    className="dash-button"
                    onClick={() => navigate('/admin/novo-pedido')}
                >
                    <FilePlus className="button-icon" size={20} /> Novo Pedido
                </Button>
                <Button
                    variant="default"
                    className="dash-button"
                    onClick={() => navigate('/admin/cadastro-produto')}
                >
                    <PlusCircle className="button-icon" size={20} /> Cadastrar Produto
                </Button>
                <Button
                    variant="default"
                    className="dash-button"
                    onClick={() => navigate('/admin/depoimentos')}
                >
                    <MessageSquarePlus className="button-icon" size={20} /> Gerenciar Depoimentos
                </Button>
            </div>

            <h2 className="text-xl font-semibold text-[#5a2a0c] mt-4 mb-2">Acesso Rápido</h2>
            <div className="dashboard-navigation">
                <Button
                    variant="default"
                    className="dash-button"
                    onClick={() => navigate('/')}
                >
                    <House className="button-icon" size={20} /> Página Inicial
                </Button>
                <Button
                    variant="default"
                    className="dash-button"
                    onClick={() => navigate('/vendas')}
                >
                    <ShoppingCart className="button-icon" size={20} /> Ver Vendas (Cliente)
                </Button>
                <Button
                    variant="default"
                    className="dash-button"
                    onClick={() => navigate('/cliente/cadastro')}
                >
                    <UserPlus className="button-icon" size={20} /> Cadastro Cliente
                </Button>
                {/* Botão para gerar o link */}
                <Button
                    variant="default"
                    className="dash-button"
                    onClick={() => window.location.href = 'http://localhost:3000/admin'}
                >
                    <LinkIcon className="button-icon" size={20} /> Gerar Link Admin
                </Button>
                {/* A rota /depoimento/:token é dinâmica, então talvez não faça sentido um botão genérico aqui */}
            </div>

            <div className="status-table">
                <Button
                    className="status-cell pendente"
                    onClick={() => filtrarPorStatus('pendente')}
                >
                    <h2 className="status-title">
                        <Clock className="status-icon" size={20} /> Pendente
                    </h2>
                    <p className="status-count">{contarPorStatus('pendente')}</p>
                </Button>
                <Button
                    className="status-cell em-produção"
                    onClick={() => filtrarPorStatus('em produção')}
                >
                    <h2 className="status-title">
                        <Factory className="status-icon" size={20} /> Em Produção
                    </h2>
                    <p className="status-count">{contarPorStatus('em produção')}</p>
                </Button>
                <Button
                    className="status-cell pronto"
                    onClick={() => filtrarPorStatus('pronto')}
                >
                    <h2 className="status-title">
                        <PackageCheck className="status-icon" size={20} /> Pronto
                    </h2>
                    <p className="status-count">{contarPorStatus('pronto')}</p>
                </Button>
                <Button
                    className="status-cell entregue"
                    onClick={() => filtrarPorStatus('entregue')}
                >
                    <h2 className="status-title">
                        <CheckCircle className="status-icon" size={20} /> Entregue
                    </h2>
                    <p className="status-count">{contarPorStatus('entregue')}</p>
                </Button>
            </div>

            <div className="dashboard-search">
                <input
                    type="text"
                    placeholder="Pesquisar pedidos..."
                    value={searchTerm}
                    onChange={handleSearch}
                />
            </div>

            <div className="dashboard-filter">
                <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="home-select"
                >
                    <option value="todos">Todos</option>
                    <option value="pendente">pendente</option>
                    <option value="em produção">em produção</option>
                    <option value="pronto">pronto</option>
                    <option value="entregue">entregue</option>
                </select>
            </div>

            <div className="dashboard-ordering">
                <Button size="sm" variant="outline" onClick={() => handleOrdenar('nome')}>
                    Ordenar por Nome {ordenarPor === 'nome' && (direcao === 'asc' ? '▲' : '▼')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleOrdenar('dataEntrega')}>
                    Ordenar por Data de Entrega {ordenarPor === 'dataEntrega' && (direcao === 'asc' ? '▲' : '▼')}
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleOrdenar('valor')}>
                    Ordenar por Valor {ordenarPor === 'valor' && (direcao === 'asc' ? '▲' : '▼')}
                </Button>
            </div>

            <div className="dashboard-filters">
                <input
                    type="number"
                    placeholder="Valor Mínimo"
                    value={valorMinimo}
                    onChange={(e) => setValorMinimo(e.target.value)}
                />
                <input
                    type="number"
                    placeholder="Valor Máximo"
                    value={valorMaximo}
                    onChange={(e) => setValorMaximo(e.target.value)}
                />
            </div>

            <h2 className="text-xl font-semibold text-[#5a2a0c] mb-2">Pedidos</h2>

            {pedidosFiltrados.length === 0 ? (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center text-gray-400"
                >
                    Nenhum pedido encontrado com o filtro atual.
                </motion.p>
            ) : (
                pedidosDaPagina.map((pedido) => (
                    <motion.li
                        key={pedido.id}
                        className={`pedido-card`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="cliente-nome">{pedido.nome}</p>
                                <p className="text-sm text-gray-600">
                                    <strong>Telefone:</strong> {pedido.telefone}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Endereço:</strong> {pedido.endereco}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Ponto de Referência:</strong> {pedido.pontoReferencia}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Data de Entrega:</strong>
                                    {pedido.dataEntrega && (
                                        <>
                                            {format(new Date(pedido.dataEntrega), 'dd/MM/yyyy', { locale: ptBR })}
                                            {pedido.horaEntrega && (
                                                <>
                                                    {' '}
                                                    {pedido.horaEntrega}
                                                </>
                                            )}
                                            <span>
                                                (Faltam {calcularDiasParaEntrega(pedido.dataEntrega)} dias)
                                            </span>
                                        </>
                                    )}
                                </p>
                                <p className="text-sm text-gray-600">
                                    <strong>Produto:</strong>
                                    {pedido.produto ? pedido.produto.split('\n').map((linha, i) => (
                                        <React.Fragment key={i}>
                                            {linha}
                                            <br />
                                        </React.Fragment>
                                    )) : null}
                                </p>
                                <p className="text-sm font-semibold mt-1">
                                    <strong>R$:</strong> {pedido.valor?.toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 capitalize">
                                    <strong>Status do Pedido:</strong> {pedido.status}
                                </p>
                                {/* Novo campo para exibir o status do pagamento */}
                                {pedido.pagamentoStatus && (
                                    <p className={`text-xs font-semibold mt-1 ${getPaymentStatusColor(pedido.pagamentoStatus)} capitalize`}>
                                        <strong>Pagamento:</strong> {pedido.pagamentoStatus}
                                    </p>
                                )}
                            </div>
                            <div className="flex gap-2 items-center">
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="home-button home-button-editar"
                                    onClick={() => navigate('/admin/editar/' + pedido.id, { state: { pedido } })}
                                >
                                    <Pencil size={16} />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="home-button home-button-excluir"
                                    onClick={() => excluirPedido(pedido.id)}
                                >
                                    <Trash size={16} />
                                </Button>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    className="home-button home-button-avancar"
                                    title="Avançar status"
                                    onClick={() => atualizarStatus(pedido.id, pedido.status)}
                                >
                                    <ArrowUp size={16} />
                                </Button>
                            </div>
                        </div>
                    </motion.li>
                ))
            )}

            <div className="dashboard-pagination">
                {Array.from({ length: Math.ceil(pedidosFiltrados.length / pedidosPorPagina) }).map((_, index) => (
                    <Button
                        key={index + 1}
                        variant="outline"
                        size="sm"
                        onClick={() => mudarPagina(index + 1)}
                    >
                        {index + 1}
                    </Button>
                ))}
            </div>

            <button
                onClick={voltarAoTopo}
                className="fixed bottom-6 right-6 bg-[#ff6b6b] text-white p-3 rounded-full shadow-lg hover:bg-[#e05b5b]"
            >
                <ArrowUp />
            </button>
        </div>
    );
};

export default Dashboard;