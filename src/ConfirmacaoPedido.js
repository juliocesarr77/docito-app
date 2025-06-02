import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ConfirmacaoPedido.css';
import { Button } from './components/ui/button';
import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

const Notificacao = ({ mensagem, tipo }) => (
  <div className={`notificacao ${tipo}`}>
    {mensagem}
  </div>
);

const ConfirmacaoPedido = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Use useMemo para garantir que clienteData e itensCarrinho sejam estáveis
    // e extraia diretamente os dados passados pelo location.state
    const clienteData = useMemo(() => location.state?.clienteData || {}, [location.state?.clienteData]);
    const itensCarrinho = useMemo(() => location.state?.itensCarrinho || [], [location.state?.itensCarrinho]);

    const [erroConfirmacao, setErroConfirmacao] = useState('');
    const [loading, setLoading] = useState(false);

    // FUNÇÕES AUXILIARES
    const calcularTotalPedido = useCallback(() => {
        // Usa o valorTotal já calculado em clienteData ou recalcula se necessário
        if (clienteData.valorTotal !== undefined) {
            return parseFloat(clienteData.valorTotal).toFixed(2);
        }
        if (itensCarrinho.length === 0) {
            return '0.00';
        }
        const subtotal = itensCarrinho.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        return (subtotal + (clienteData.valorFrete || 0)).toFixed(2);
    }, [itensCarrinho, clienteData.valorFrete, clienteData.valorTotal]);

    const handleConfirmarPedido = async () => {
        setLoading(true);
        setErroConfirmacao('');

        // Validação adicional antes de enviar para a Netlify Function
        if (!clienteData || !clienteData.nome || itensCarrinho.length === 0) {
            setErroConfirmacao('Dados do pedido ausentes ou carrinho vazio. Por favor, volte e preencha os dados.');
            setLoading(false);
            return;
        }

        try {
            // Os dados a serem enviados para a Netlify Function são clienteData e itensCarrinho
            const dataParaEnviar = {
                clienteData: clienteData,
                itensCarrinho: itensCarrinho,
            };

            // LOGS PARA DEPURAR O PAYLOAD ENVIADO AQUI
            console.log("CONFIRMACAO: Dados do cliente (clienteData) ANTES do fetch:", clienteData);
            console.log("CONFIRMACAO: Itens do carrinho (itensCarrinho) ANTES do fetch:", itensCarrinho);
            console.log("CONFIRMACAO: Objeto completo a ser stringificado e enviado para a função:", dataParaEnviar);
            console.log("CONFIRMACAO: JSON stringificado para o body FINAL da função:", JSON.stringify(dataParaEnviar));


            // 1. Chamar a Netlify Function para gerar o próximo número sequencial E salvar o pedido
            const numeroPedidoResponse = await fetch('/.netlify/functions/gerar-numero-pedido', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                // *** AGORA ENVIAMOS OS DADOS CORRETOS NO BODY ***
                body: JSON.stringify(dataParaEnviar),
            });

            const responseData = await numeroPedidoResponse.json();

            if (!numeroPedidoResponse.ok) {
                setErroConfirmacao(`Erro ao criar pedido: ${responseData.message || 'Verifique os logs da função.'} Detalhes: ${responseData.details || 'N/A'}`);
                setLoading(false);
                return;
            }

            const numeroPedidoCliente = responseData.numeroPedido;
            const pedidoIdFirestore = responseData.pedidoIdFirestore;

            console.log('Pedido criado com sucesso! Número sequencial:', numeroPedidoCliente, 'ID Firestore:', pedidoIdFirestore);

            // 2. Redirecionar para a página de agradecimento
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
        // Verifica se os dados essenciais para exibir o pedido estão presentes
        if (!clienteData || !clienteData.nome || itensCarrinho.length === 0) {
            setErroConfirmacao('Sua sessão expirou ou os dados do pedido estão incompletos. Volte para a loja.');
            // Opcional: redirecionar para a página inicial ou de produtos
            // navigate('/vendas');
        }
    }, [clienteData, itensCarrinho]);

    // Se o pedido já foi confirmado e estamos na página de agradecimento ou dados estão ausentes
    if (erroConfirmacao) { // Melhor usar erroConfirmacao para controlar a exibição de erro
        return (
            <div className="confirmacao-container-erro">
                <Notificacao mensagem={erroConfirmacao} tipo="erro" />
                <Button onClick={() => navigate('/vendas')}>Voltar para Produtos</Button>
            </div>
        );
    }

    return (
        <div style={{ backgroundColor: '#fff7f1' }}>
            <div className="confirmacao-container">
                <div className="confirmacao-header">
                    <img src="/logo.png" alt="Logo Delícias Docito" className="confirmacao-logo-header" />
                </div>
                <h1>Confirme seu Pedido</h1>
                {/* Removido o <p className="erro-mensagem">{erroConfirmacao}</p> pois Notificacao já exibe */}

                <div className="detalhes-cliente">
                    <h2>Dados do Cliente</h2>
                    <p><strong>Nome:</strong> {clienteData.nome}</p>
                    <p><strong>Telefone:</strong> {clienteData.telefone || 'Não informado'}</p>
                    {/* REMOVIDO: <p><strong>Email:</strong> {clienteData.email || 'Não informado'}</p> */}
                    <p><strong>Endereço:</strong> {clienteData.endereco}</p>
                    <p><strong>Número:</strong> {clienteData.numero || 'Não informado'}</p>
                    {/* REMOVIDO: <p><strong>CEP:</strong> {clienteData.cep || 'Não informado'}</p> */}
                    <p><strong>Ponto de Referência:</strong> {clienteData.pontoReferencia || 'Não informado'}</p>
                    <p><strong>Data de Entrega:</strong> {clienteData.dataEntrega}</p>
                    <p><strong>Hora de Entrega:</strong> {clienteData.horaEntrega}</p>
                </div>

                <div className="detalhes-pedido">
                    <h2>Itens do Pedido</h2>
                    <ul>
                        {itensCarrinho.length > 0 ? (
                            itensCarrinho.map(item => (
                                <li key={item.id}>
                                    {item.quantity} x {item.name} - R$ {(item.price * item.quantity).toFixed(2)}
                                </li>
                            ))
                        ) : (
                            // Se o carrinho veio vazio, exibe os dados do produto/valor manual
                            <>
                                <p><strong>Produto:</strong> {clienteData.produtoDescricao}</p>
                                {/* O valor total já está em clienteData.valorTotal */}
                            </>
                        )}
                    </ul>
                    {clienteData.valorFrete > 0 && (
                        <p className="frete"><strong>Frete: R$ {parseFloat(clienteData.valorFrete).toFixed(2)}</strong></p>
                    )}
                    <p className="total"><strong>Valor Total: R$ {calcularTotalPedido()}</strong></p>
                </div>

                <div className="informacoes-pagamento">
                    <h2>Próximos Passos</h2>
                    <p>Ao confirmar o pedido, ele será registrado e você será direcionado para uma página com o número do seu pedido e um botão para nos contatar via WhatsApp.</p>
                    <p>Nesse contato, finalizaremos os detalhes do pagamento (Pix ou outras formas) e da entrega.</p>
                </div>

                <div className="acoes-confirmacao">
                    <Button onClick={() => navigate('/cliente/cadastro', { state: location.state })} variant="outline">
                        Editar Dados
                    </Button>

                    <Button onClick={handleConfirmarPedido} disabled={loading}>
                        {loading ? 'Confirmando Pedido...' : 'Confirmar Pedido'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmacaoPedido;