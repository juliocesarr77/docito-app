// netlify/functions/criar-pagamento-pagseguro.js

const axios = require('axios'); // Se estiver usando axios para as chamadas externas
const { updateDoc, doc } = require('firebase/firestore'); // Se estiver usando para atualizar o pedido
const { db } = require('../../src/firebase/config'); // Ajuste o caminho se for diferente

exports.handler = async (event, context) => {
    // A função handler do Netlify Functions recebe (event, context)

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        const { pedidoId, valorTotal, cliente, itensCarrinho, redirect_url } = JSON.parse(event.body);

        // Validar dados básicos
        if (!pedidoId || !valorTotal || !cliente || !itensCarrinho || !redirect_url) {
            console.error('Dados de requisição inválidos:', { pedidoId, valorTotal, cliente, itensCarrinho, redirect_url });
            return {
                statusCode: 400,
                body: JSON.stringify({ details: 'Dados do pedido, valor, cliente, itens ou URL de redirecionamento ausentes.' }),
            };
        }

        const PAGSEGURO_EMAIL_SANDBOX = process.env.PAGSEGURO_EMAIL_SANDBOX;
        const PAGSEGURO_TOKEN_SANDBOX = process.env.PAGSEGURO_TOKEN_SANDBOX;

        if (!PAGSEGURO_EMAIL_SANDBOX || !PAGSEGURO_TOKEN_SANDBOX) {
            console.error('Variáveis de ambiente do PagSeguro não configuradas.');
            return {
                statusCode: 500,
                body: JSON.stringify({ details: 'Configuração do PagSeguro faltando.' }),
            };
        }

        const pagseguroBaseUrl = 'https://ws.sandbox.pagseguro.uol.com.br/v2/checkout/'; // SandBox
        // const pagseguroBaseUrl = 'https://ws.pagseguro.uol.com.br/v2/checkout/'; // Produção

        let xmlData = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<checkout>
    <currency>BRL</currency>
    <reference>${pedidoId}</reference>`; // Usando o ID do pedido como referência

        itensCarrinho.forEach((item, index) => {
            xmlData += `
    <item>
        <id>${item.id}</id>
        <description>${item.name}</description>
        <amount>${(item.amount / 100).toFixed(2)}</amount> <quantity>${item.quantity}</quantity>
    </item>`;
        });

        xmlData += `
    <sender>
        <name>${cliente.nome}</name>
        <email>${PAGSEGURO_EMAIL_SANDBOX}</email> <phone>
            <areaCode>${cliente.telefone.substring(0, 2)}</areaCode>
            <number>${cliente.telefone.substring(2)}</number>
        </phone>
    </sender>
    <redirectURL>${redirect_url}</redirectURL>
    <notificationURL>${process.env.URL_BASE}/.netlify/functions/pagseguro-webhook</notificationURL>
</checkout>`;

        console.log('XML de requisição PagSeguro:', xmlData);

        const response = await axios.post(
            `${pagseguroBaseUrl}?email=${PAGSEGURO_EMAIL_SANDBOX}&token=${PAGSEGURO_TOKEN_SANDBOX}`,
            xmlData,
            {
                headers: {
                    'Content-Type': 'application/xml; charset=ISO-8859-1',
                },
            }
        );

        const xml2js = require('xml2js'); // Certifique-se de ter xml2js instalado (npm install xml2js)
        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);

        console.log('Resposta PagSeguro (XML parseado):', result);

        if (result.checkout && result.checkout.code) {
            const checkoutCode = result.checkout.code;
            const paymentLink = `${pagseguroBaseUrl}payment.html?code=${checkoutCode}`;

            // Opcional: Atualizar o pedido no Firebase com o código do PagSeguro
            // (Assumindo que db e updateDoc estão configurados corretamente)
            // if (db && updateDoc && doc) {
            //     await updateDoc(doc(db, 'pedidos', pedidoId), {
            //         pagSeguroTransactionCode: checkoutCode,
            //         pagamentoStatus: 'aguardando_pagamento_pagseguro',
            //     });
            // }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentLink }),
            };
        } else {
            console.error('Erro na resposta do PagSeguro:', result.errors || response.data);
            return {
                statusCode: 400, // Ou 500 se for um erro inesperado
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ details: 'Erro ao criar o checkout no PagSeguro.', errors: result.errors || response.data }),
            };
        }

    } catch (error) {
        console.error('Erro na função criar-pagamento-pagseguro:', error);
        // Tentar capturar detalhes do erro do PagSeguro se for um erro de resposta HTTP
        let errorMessage = 'Erro interno do servidor.';
        if (error.response && error.response.data) {
            try {
                const xml2js = require('xml2js');
                const parser = new xml2js.Parser({ explicitArray: false });
                const errorParsed = await parser.parseStringPromise(error.response.data);
                errorMessage = errorParsed.errors ? JSON.stringify(errorParsed.errors) : error.response.data;
            } catch (parseError) {
                errorMessage = error.response.data; // Não conseguiu parsear XML de erro
            }
        } else if (error.message) {
            errorMessage = error.message;
        }

        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ details: `Erro ao processar pagamento: ${errorMessage}` }),
        };
    }
};