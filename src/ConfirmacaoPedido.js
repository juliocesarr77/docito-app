import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ConfirmacaoPedido.css';
import { Button } from './components/ui/button';
import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

// Não precisamos mais do logo do PagSeguro aqui, mas se quiser manter no rodapé...
// import pagSeguroLogo from './assets/pagseguro_logo_uol.png';

const ConfirmacaoPedido = () => {
    const location = useLocation();
    const navigate = useNavigate();
    // Certifique-se de que clienteData e cart estão vindo corretamente do state
    const { state } = location; 
    const clienteData = useMemo(() => state || {}, [state]); // Assume que dados do cliente (nome, telefone, endereco, etc.) vêm daqui
    const itensCarrinho = useMemo(() => clienteData.itensCarrinho || [], [clienteData.itensCarrinho]); // Pega itens do carrinho do state

    // Não precisamos mais desses estados para email e CEP, pois eles virão do clienteData
    // Se precisar coletar email/CEP especificamente nesta tela, me avise para readicionar.
    // const [email, setEmail] = useState('');
    // const [cep, setCep] = useState('');
    const [erroConfirmacao, setErroConfirmacao] = useState(''); // Novo estado para erros na confirmação
    const [loading, setLoading] = useState(false); // Estado para controlar o carregamento do botão

    // FUNÇÕES AUXILIARES
    const calcularTotalPedido = useCallback(() => {
        if (itensCarrinho.length === 0) {
            return '0.00';
        }
        const subtotal = itensCarrinho.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        return (subtotal + (clienteData.valorFrete || 0)).toFixed(2);
    }, [itensCarrinho, clienteData.valorFrete]);

    // A função formatarItensPedido foi removida, pois não está sendo utilizada
    // no fluxo atual de confirmação de pedido para o cliente.

    // O handleConfirmarPedido AGORA é o botão de "Confirmar Pedido"
    const handleConfirmarPedido = async () => { // Adicionado 'async' aqui!
        setLoading(true);
        setErroConfirmacao('');

        try {
            // 1. Chamar a Netlify Function para gerar o próximo número sequencial
            const numeroPedidoResponse = await fetch('/.netlify/functions/gerar-numero-pedido', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ /* Nenhum dado essencial aqui por enquanto */ }),
            });

            const numeroPedidoData = await numeroPedidoResponse.json();

            if (!numeroPedidoResponse.ok || !numeroPedidoData.numeroPedido) {
                setErroConfirmacao(`Erro ao gerar número do pedido: ${numeroPedidoData.details || 'Verifique os logs da função.'}`);
                setLoading(false);
                return;
            }

            const numeroPedidoCliente = numeroPedidoData.numeroPedido;
            console.log('Número sequencial gerado para o cliente:', numeroPedidoCliente);

            // 2. Preparar os dados completos do pedido para salvar no Firebase
            const valorNumerico = parseFloat(calcularTotalPedido());
            const pedidoParaSalvar = {
                ...clienteData,
                itensCarrinho: itensCarrinho, // Certifica-se que os itens do carrinho estão incluídos
                valor: valorNumerico,
                status: 'pendente', // Status interno inicial do pedido
                pagamentoStatus: 'aguardando_contato', // Status de pagamento para o fluxo WhatsApp
                numeroPedido: numeroPedidoCliente, // O ID sequencial amigável
                createdAt: serverTimestamp(),
                data: Timestamp.now(),
                pagSeguroTransactionId: '', // Mantém, mas será vazio neste fluxo
                pagSeguroStatus: '', // Mantém, mas será vazio neste fluxo
            };

            // 3. Salvar o pedido no Firebase
            const docRef = await addDoc(collection(db, 'pedidos'), pedidoParaSalvar);
            const pedidoIdFirestore = docRef.id; // ID do Firestore gerado

            console.log('Pedido salvo no Firebase com ID:', pedidoIdFirestore, 'e Número do Pedido para o cliente:', numeroPedidoCliente);

            // 4. Redirecionar para a página de agradecimento
            navigate(`/agradecimento?pedidoId=${pedidoIdFirestore}&numeroPedido=${numeroPedidoCliente}`);

        } catch (error) {
            console.error('Erro ao confirmar pedido:', error);
            setErroConfirmacao(`Ocorreu um erro ao confirmar seu pedido: ${error.message}. Por favor, tente novamente.`);
        } finally {
            setLoading(false);
        }
    };

    // UseEffect para validação inicial de dados (se houver carrinho vazio, etc.)
    useEffect(() => {
        if (!clienteData || !itensCarrinho || itensCarrinho.length === 0) {
            setErroConfirmacao('Sua sessão expirou ou o carrinho está vazio. Volte para a loja.');
            // Opcional: redirecionar para a página inicial ou de produtos
            // navigate('/vendas'); 
        }
    }, [clienteData, itensCarrinho]); // Dependências do useEffect

    // Se o pedido já foi confirmado e estamos na página de agradecimento ou dados estão ausentes
    // Este bloco vai lidar com o redirecionamento ou exibição de erro se não houver dados.
    if (erroConfirmacao && itensCarrinho.length === 0) {
        return (
            <div className="confirmacao-container-erro">
                <p>{erroConfirmacao}</p>
                <Button onClick={() => navigate('/vendas')}>Voltar para Produtos</Button>
            </div>
        );
    }
    
    // Se a página de agradecimento for visitada diretamente sem um pedidoId na URL,
    // ou se o processo de confirmação ainda não iniciou,
    // este componente renderiza a tela de confirmação.

    return (
        <div style={{ backgroundColor: '#fff7f1' }}>
            <div className="confirmacao-container">
                <div className="confirmacao-header">
                    <img src="/logo.png" alt="Logo Delícias Docito" className="confirmacao-logo-header" />
                </div>
                <h1>Confirme seu Pedido</h1>
                {erroConfirmacao && <p className="erro-mensagem">{erroConfirmacao}</p>}

                <div className="detalhes-cliente">
                    <h2>Dados do Cliente</h2>
                    <p><strong>Nome:</strong> {clienteData.nome}</p>
                    <p><strong>Telefone:</strong> {clienteData.telefone || 'Não informado'}</p>
                    <p><strong>Email:</strong> {clienteData.email || 'Não informado'}</p> {/* Adicionado Email */}
                    <p><strong>Endereço:</strong> {clienteData.endereco}</p>
                    <p><strong>Número:</strong> {clienteData.numero || 'Não informado'}</p>
                    <p><strong>CEP:</strong> {clienteData.cep || 'Não informado'}</p> {/* Adicionado CEP */}
                    <p><strong>Ponto de Referência:</strong> {clienteData.pontoReferencia || 'Não informado'}</p>
                    <p><strong>Data de Entrega:</strong> {clienteData.dataEntrega}</p>
                    <p><strong>Hora de Entrega:</strong> {clienteData.horaEntrega}</p>
                </div>

                <div className="detalhes-pedido">
                    <h2>Itens do Pedido</h2>
                    <ul>
                        {itensCarrinho.map(item => (
                            <li key={item.id}>
                                {item.quantity} x {item.name} - R$ {(item.price * item.quantity).toFixed(2)}
                            </li>
                        ))}
                    </ul>
                    {clienteData.valorFrete > 0 && (
                        <p className="frete"><strong>Frete: R$ {clienteData.valorFrete.toFixed(2)}</strong></p>
                    )}
                    <p className="total"><strong>Valor Total: R$ {calcularTotalPedido()}</strong></p>
                </div>

                <div className="informacoes-pagamento">
                    <h2>Próximos Passos</h2>
                    <p>Ao confirmar o pedido, ele será registrado e você será direcionado para uma página com o número do seu pedido e um botão para nos contatar via WhatsApp.</p>
                    <p>Nesse contato, finalizaremos os detalhes do pagamento (Pix ou outras formas) e da entrega.</p>
                </div>

                <div className="acoes-confirmacao">
                    <Button onClick={() => navigate('/cliente/cadastro', { state: clienteData })} variant="outline">
                        Editar Dados
                    </Button>
                    {/* Botão de Pagamento com PagSeguro REMOVIDO */}
                    {/* <Button onClick={handlePagarComPagSeguro} className="pagseguro-button">
                        <img src={pagSeguroButtonIcon} alt="PagSeguro" className="pagseguro-button-icon" />
                        Pagar com PagSeguro
                    </Button> */}

                    <Button onClick={handleConfirmarPedido} disabled={loading}>
                        {loading ? 'Confirmando Pedido...' : 'Confirmar Pedido'}
                    </Button>
                </div>
            </div>

            {/* O rodapé pode ser removido daqui se ele for um componente global ou não precisar do logo do PagSeguro */}
            {/* <div className="confirmacao-footer">
                <img src={pagSeguroLogo} alt="PagSeguro" className="pagseguro-footer-logo" />
            </div> */}
        </div>
    );
};

export default ConfirmacaoPedido;