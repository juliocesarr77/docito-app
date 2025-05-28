// netlify/functions/criar-pagamento-pagseguro.js

import axios from 'axios';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido.' });
    }

    const {
        pedidoId,
        valorTotal, // Já em centavos
        cliente, // { nome, email, telefone } - CPF não será enviado
        itensCarrinho, // [{ name, quantity, amount (em centavos), reference_id }]
        redirect_url, // A URL para onde o cliente deve ser redirecionado no seu site
    } = req.body;

    // Credenciais do PagSeguro (Sandbox)
    // Configure essas variáveis de ambiente no Netlify:
    // PAGSEGURO_EMAIL_SANDBOX
    // PAGSEGURO_TOKEN_SANDBOX
    const pagseguroEmail = process.env.PAGSEGURO_EMAIL_SANDBOX;
    const pagseguroToken = process.env.PAGSEGURO_TOKEN_SANDBOX;

    if (!pagseguroEmail || !pagseguroToken) {
        console.error('Credenciais PagSeguro Sandbox não configuradas.');
        return res.status(500).json({ error: 'Erro de configuração do servidor. Credenciais PagSeguro faltando.' });
    }

    // URL da API de Checkout PagBank (Sandbox)
    const pagseguroCheckoutApiUrl = 'https://sandbox.api.pagseguro.com/checkouts';

    try {
        const payload = {
            reference_id: pedidoId, // Seu ID de referência para o pedido
            customer: {
                name: cliente.nome,
                email: cliente.email, // Email do cliente (coletado no seu formulário agora)
                phone: {
                    country: '+55',
                    area: cliente.telefone.substring(0, 2), // Pegar DDD
                    number: cliente.telefone.substring(2) // Pegar número
                }
                // tax_id (CPF) não é enviado para que o PagSeguro o colete na página deles.
            },
            items: itensCarrinho.map(item => ({
                reference_id: item.id || item.reference_id, // ID do item no seu sistema
                name: item.name,
                quantity: item.quantity,
                unit_amount: item.amount, // Já em centavos
            })),

            // URLs de redirecionamento e notificação
            redirect_url: redirect_url, // URL para onde o cliente volta após o pagamento
            notification_urls: [
                `https://effortless-sorbet-87113c.netlify.app/.netlify/functions/pagseguro-webhook` // A URL do seu webhook!
            ],
            // Garante que o cliente possa ajustar dados (incluindo CPF) na página do PagBank
            customer_modifiable: true,
        };

        console.log('Enviando payload para PagBank:', JSON.stringify(payload, null, 2));

        const headers = {
            'Authorization': `Bearer ${pagseguroToken}`, // Autenticação com Bearer Token
            'x-api-version': '2.0', // Versão da API, consulte a documentação
            'Content-Type': 'application/json'
        };

        const pagseguroResponse = await axios.post(pagseguroCheckoutApiUrl, payload, { headers });

        const checkoutId = pagseguroResponse.data.id;
        const paymentLink = pagseguroResponse.data.links.find(link => link.rel === 'PAY').href;

        if (!paymentLink) {
            throw new Error('Link de pagamento não encontrado na resposta do PagBank.');
        }

        console.log(`Checkout criado no PagBank: ID=${checkoutId}, Link=${paymentLink}`);

        return res.status(200).json({ paymentLink });

    } catch (error) {
        console.error('Erro ao criar pagamento PagSeguro:', error.response ? error.response.data : error.message);
        return res.status(500).json({
            error: 'Erro ao gerar link de pagamento PagSeguro.',
            details: error.response ? error.response.data : error.message
        });
    }
}