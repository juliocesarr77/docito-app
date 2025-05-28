import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './ConfirmacaoPedido.css';
import { Button } from './components/ui/button';
import { db } from './firebase/config';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { FaWhatsapp } from 'react-icons/fa';
// Removendo imports antigos do InfinityPay
// import infinityPayLogo from './assets/infinitepay.png';
// import infinityPayButtonIcon from './assets/Logo_InfinitePay.svg.png';
// Adicionando o novo import da logo do PagSeguro
import pagSeguroLogo from './assets/Logo-PagSeguro.webp'; // Certifique-se que o nome do arquivo e a extensão estão corretos

const ConfirmacaoPedido = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location; // Dados do cliente vêm do state
    const clienteData = state || {};

    const [email, setEmail] = useState('');
    const [cep, setCep] = useState('');
    const [erroPagamento, setErroPagamento] = useState('');
    const [pedidoId, setPedidoId] = useState(null); // ID do pedido salvo no Firebase
    const [pagamentoConcluido, setPagamentoConcluido] = useState(false); // Novo estado para controlar a exibição da tela de agradecimento
    const [mensagemAgradecimento, setMensagemAgradecimento] = useState('');

    // FUNÇÕES DECLARADAS AQUI, ANTES DE QUALQUER RETURN CONDICIONAL
    const calcularTotalPedido = () => {
        const subtotal = clienteData.itensCarrinho.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
        return (subtotal + (clienteData.valorFrete || 0)).toFixed(2);
    };

    const formatarItensPedido = () => {
        // Certifique-se que clienteData.itensCarrinho existe antes de tentar mapear
        if (!clienteData.itensCarrinho) {
            return '';
        }
        return clienteData.itensCarrinho.map(item => `${item.quantity} x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}`).join('\n');
    };

    const salvarPedidoNoFirebase = async (statusPagamentoInicial = 'não pago') => {
        try {
            const valorNumerico = parseFloat(calcularTotalPedido());
            const pedido = {
                ...clienteData,
                email: email, // Usando o email do estado
                cep: cep,   // Usando o cep do estado
                valor: valorNumerico,
                status: 'pendente',
                pagamentoStatus: statusPagamentoInicial, // Usando o status inicial
                createdAt: serverTimestamp(),
                data: Timestamp.now(),
                // Campos para PagSeguro, inicialmente vazios
                pagSeguroTransactionId: '',
                pagSeguroStatus: '', // Adicione um campo para o status específico do PagSeguro
            };

            const docRef = await addDoc(collection(db, 'pedidos'), pedido);
            console.log('Pedido salvo com ID:', docRef.id);
            setPedidoId(docRef.id); // Define o ID do pedido no estado
            return docRef.id; // Retorna o ID do pedido salvo
        } catch (error) {
            console.error('Erro ao salvar pedido:', error);
            alert('Erro ao salvar seu pedido. Tente novamente.');
            return null;
        }
    };

    const handleFinalizarCompra = async () => {
        const idDoPedido = await salvarPedidoNoFirebase('não pago'); // WhatsApp é "não pago" inicialmente
        if (idDoPedido) {
            const mensagemCliente = `Novo pedido recebido (ID: ${idDoPedido})!\n\n*Dados do Cliente:*\nNome: ${clienteData.nome}\nTelefone: ${clienteData.telefone || 'Não informado'}\nEndereço: ${clienteData.endereco}, ${clienteData.numero} ${clienteData.pontoReferencia ? `(Ref: ${clienteData.pontoReferencia})` : ''}\nData de Entrega: ${clienteData.dataEntrega}\nHora de Entrega: ${clienteData.horaEntrega}\nEmail: ${email}\nCEP: ${cep}\n\n*Itens do Pedido:*\n${formatarItensPedido()}\n\n*Valor Total: R$ ${calcularTotalPedido()}*`;
            const mensagemWhatsApp = encodeURIComponent(mensagemCliente);
            window.open(`https://wa.me//5537999965194?text=${mensagemWhatsApp}`, '_blank');

            // Após enviar para o WhatsApp, você pode querer ir para a tela de agradecimento
            setPagamentoConcluido(true);
            setMensagemAgradecimento('Seu pedido foi enviado via WhatsApp! Aguarde a confirmação.');
        }
    };

    // NOVA FUNÇÃO PARA PAGAR COM PAGSEGURO
    const handlePagarComPagSeguro = async () => {
        if (!email || !cep) {
            setErroPagamento('Por favor, preencha o e-mail e o CEP para pagar online.');
            return;
        }
        setErroPagamento(''); // Limpa qualquer erro anterior

        // Salva o pedido no Firebase com status inicial 'aguardando_pagamento'
        const idDoPedido = await salvarPedidoNoFirebase('aguardando_pagamento');
        if (idDoPedido) {
            try {
                const clientePagSeguro = {
                    nome: clienteData.nome,
                    email: email, // Usando o email do formulário de confirmação
                    telefone: clienteData.telefone ? clienteData.telefone.replace(/\D/g, '') : '',
                    // CPF NÃO É ENVIADO daqui, será coletado no PagSeguro
                };

                const itensPagSeguro = clienteData.itensCarrinho.map(item => ({
                    id: item.id || Math.random().toString(36).substr(2, 9), // Garante um ID único se não houver
                    name: item.name,
                    quantity: item.quantity || 1,
                    amount: (item.price * 100).toFixed(0), // Valor em centavos
                }));

                const valorTotalCentavos = (parseFloat(calcularTotalPedido()) * 100).toFixed(0);

                // URL para onde o PagSeguro deve redirecionar o cliente após o pagamento
                const redirectUrlPagSeguro = `${window.location.origin}/agradecimento?pedidoId=${idDoPedido}`;

                // Chama a Netlify Function que cria o pagamento no PagSeguro
                const response = await fetch('/.netlify/functions/criar-pagamento-pagseguro', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        pedidoId: idDoPedido,
                        valorTotal: valorTotalCentavos,
                        cliente: clientePagSeguro,
                        itensCarrinho: itensPagSeguro,
                        redirect_url: redirectUrlPagSeguro,
                    }),
                });

                const data = await response.json();

                if (response.ok && data.paymentLink) {
                    // Redireciona o cliente para o link de pagamento do PagSeguro
                    window.location.href = data.paymentLink;
                } else {
                    setErroPagamento(`Erro ao gerar link de pagamento: ${data.details || 'Verifique os logs.'}`);
                    console.error('Erro na resposta da Netlify Function criar-pagamento-pagseguro:', data.details);
                    // Opcional: Atualizar status do pedido no Firebase para "erro_pagamento"
                }
            } catch (error) {
                console.error('Erro ao iniciar pagamento PagSeguro:', error);
                setErroPagamento(`Erro ao iniciar pagamento: ${error.message}.`);
                // Opcional: Atualizar status do pedido no Firebase para "erro_pagamento"
            }
        }
    };
    // FIM DAS FUNÇÕES DECLARADAS AQUI

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const idFromUrl = queryParams.get('pedidoId');
        // Parâmetros do InfinitePay (AGORA REMOVIDOS COMPLETAMENTE DA LÓGICA)
        // const transactionIdFromUrl = queryParams.get('transaction_id');
        // const orderNsuFromUrl = queryParams.get('order_nsu');
        // const slugFromUrl = queryParams.get('slug');

        const verificarEAtualizarPagamento = async () => {
            if (idFromUrl) {
                setPedidoId(idFromUrl);
                setPagamentoConcluido(true);
                setMensagemAgradecimento('Obrigado pelo seu pedido! Verificando a confirmação do pagamento...');
                // Você pode adicionar uma chamada ao Firebase aqui para buscar o status mais recente do pedido
                // e exibir uma mensagem mais precisa, se o webhook do PagSeguro já tiver atualizado.
            } else if (location.pathname === '/agradecimento' || location.pathname.startsWith('/cliente/agradecimento')) {
                // Se chegou na página de agradecimento sem um pedidoId na URL (pode ser acesso direto ou erro)
                // E se ainda não está marcado como pagamento concluído
                if (!pagamentoConcluido) {
                    setPagamentoConcluido(true);
                    setMensagemAgradecimento('Obrigado pelo seu pedido! Aguardando a confirmação do pagamento.');
                }
            }
            // A lógica antiga do InfinitePay foi removida aqui.
        };

        // Chamamos a função de verificação apenas se for a página de agradecimento OU se tiver dados de cliente (primeira carga da Confirmação)
        // ESSA É A LINHA CORRIGIDA COM OS PARÊNTESES PARA ESLINT
        if ((location.pathname === '/agradecimento' || location.pathname.startsWith('/cliente/agradecimento')) || clienteData.itensCarrinho) {
            verificarEAtualizarPagamento();
        }

    }, [location.search, location.pathname, clienteData.itensCarrinho, pagamentoConcluido]); // Dependências do useEffect

    // INÍCIO DA VALIDAÇÃO E RENDERIZAÇÃO CONDICIONAL
    if (pagamentoConcluido) {
        return (
            <div style={{ backgroundColor: '#fff7f1', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '20px' }}>
                <div className="confirmacao-container" style={{ maxWidth: '600px', width: '100%', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 8px rgba(0,0,0,0.1)', backgroundColor: '#fff' }}>
                    <h1>Obrigado pelo seu pedido!</h1>
                    <p>{mensagemAgradecimento}</p>
                    {pedidoId && <p>ID do seu pedido: <strong>{pedidoId}</strong></p>}
                    <Button onClick={() => navigate('/')} className="mt-4">Voltar para a Loja</Button>
                </div>
                {/* Rodapé geral, agora com o logo do PagSeguro */}
                <div className="confirmacao-footer" style={{ marginTop: '50px' }}>
                    <img src={pagSeguroLogo} alt="PagSeguro" style={{ maxWidth: '450px', height: 'auto' }} />
                </div>
            </div>
        );
    }

    if (!clienteData || !clienteData.itensCarrinho || clienteData.itensCarrinho.length === 0) {
        // Se não houver dados de cliente ou itens no carrinho, é um acesso inválido.
        return <div className="confirmacao-container">Erro: Dados do pedido não encontrados ou sessão expirada.</div>;
    }

    return (
        <div style={{ backgroundColor: '#fff7f1' }}>
            <div className="confirmacao-container">
                <div className="confirmacao-header">
                    <img src="/logo.png" alt="Logo Delícias Docito" className="confirmacao-logo-header" />
                </div>
                <h1>Confirme seu Pedido</h1>
                <div className="detalhes-cliente">
                    <h2>Dados do Cliente</h2>
                    <p><strong>Nome:</strong> {clienteData.nome}</p>
                    <p><strong>Telefone:</strong> {clienteData.telefone || 'Não informado'}</p>
                    <p><strong>Endereço:</strong> {clienteData.endereco}</p>
                    <p><strong>Número:</strong> {clienteData.numero || 'Não informado'}</p>
                    <p><strong>Ponto de Referência:</strong> {clienteData.pontoReferencia || 'Não informado'}</p>
                    <p><strong>Data de Entrega:</strong> {clienteData.dataEntrega}</p>
                    <p><strong>Hora de Entrega:</strong> {clienteData.horaEntrega}</p>
                </div>

                <div className="detalhes-pedido">
                    <h2>Itens do Pedido</h2>
                    <ul>
                        {clienteData.itensCarrinho && clienteData.itensCarrinho.map(item => (
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
                    <h2>Informações para Contato e Entrega</h2> {/* Título mais genérico */}
                    {erroPagamento && <p className="erro-mensagem">{erroPagamento}</p>}
                    <label htmlFor="email" className="confirmacao-label">Email:</label>
                    <input
                        type="email"
                        id="email"
                        className="confirmacao-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    <label htmlFor="cep" className="confirmacao-label">CEP:</label>
                    <input
                        type="text"
                        id="cep"
                        className="confirmacao-input"
                        value={cep}
                        onChange={(e) => setCep(e.target.value)}
                        required
                    />
                </div>

                {/* Nova seção informativa sobre o pagamento - Focada no PagSeguro */}
                <div className="info-pagamento">
                    <h2>Opções de Pagamento</h2>
                    <p>Pague com Pix, cartão de crédito/débito ou boleto online através do PagSeguro. É rápido e seguro!</p>
                </div>

                <div className="acoes-confirmacao">
                    <Button onClick={() => navigate('/cliente/cadastro', { state: clienteData })} variant="outline">
                        Editar Dados
                    </Button>
                    {/* Botão para Pagamento com PagSeguro */}
                    <Button onClick={handlePagarComPagSeguro} className="pagseguro-button">
                        {/* Você pode adicionar um ícone do PagSeguro aqui se tiver, ex: <img src={pagSeguroButtonIcon} alt="PagSeguro" className="pagseguro-button-icon" /> */}
                        Pagar com PagSeguro
                    </Button>
                    <Button onClick={handleFinalizarCompra} variant="secondary">
                        <FaWhatsapp className="whatsapp-icon-confirmacao" /> Finalizar Pedido (WhatsApp)
                    </Button>
                </div>
            </div>

            {/* Rodapé geral, agora com o logo do PagSeguro */}
            <div className="confirmacao-footer">
                <img src={pagSeguroLogo} alt="PagSeguro" style={{ maxWidth: '450px', height: 'auto' }} />
            </div>
        </div>
    );
};

export default ConfirmacaoPedido;