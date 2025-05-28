// netlify/functions/criar-pagamento-pagseguro.js

const axios = require('axios');
const xml2js = require('xml2js'); // <-- AGORA ESTÁ NO LUGAR CERTO!
const { updateDoc, doc } = require('firebase/firestore');
const { db } = require('../../src/firebase/config'); // Ajuste o caminho se for diferente

exports.handler = async (event, context) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'Method Not Allowed' }),
        };
    }

    try {
        const { pedidoId, valorTotal, cliente, itensCarrinho, redirect_url } = JSON.parse(event.body);

        if (!pedidoId || !valorTotal || !cliente || !itensCarrinho || !redirect_url) {
            console.error('Dados de requisição inválidos:', { pedidoId, valorTotal, cliente, itensCarrinho, redirect_url });
            return {
                statusCode: 400,
                body: JSON.stringify({ details: 'Dados do pedido, valor, cliente, itens ou URL de redirecionamento ausentes.' }),
            };
        }

        const PAGSEGURO_EMAIL_SANDBOX = process.env.PAGSEGURO_EMAIL_SANDBOX;
        const PAGSEGURO_TOKEN_SANDBOX = process.env.PAGSEGURO_TOKEN_SANDBOX;
        const URL_BASE = process.env.URL_BASE || 'https://seu-dominio.netlify.app'; // Use seu domínio real aqui se for diferente

        if (!PAGSEGURO_EMAIL_SANDBOX || !PAGSEGURO_TOKEN_SANDBOX) {
            console.error('Variáveis de ambiente do PagSeguro não configuradas.');
            return {
                statusCode: 500,
                body: JSON.stringify({ details: 'Configuração do PagSeguro faltando. Verifique PAGSEGURO_EMAIL_SANDBOX e PAGSEGURO_TOKEN_SANDBOX.' }),
            };
        }
        if (!URL_BASE) { // Adicionei verificação para URL_BASE
            console.error('Variável de ambiente URL_BASE não configurada.');
            return {
                statusCode: 500,
                body: JSON.stringify({ details: 'Configuração da URL base do site faltando. Verifique URL_BASE.' }),
            };
        }


        const pagseguroBaseUrl = 'https://ws.sandbox.pagseguro.uol.com.br/v2/checkout/'; // SandBox
        // Para Produção: 'https://ws.pagseguro.uol.com.br/v2/checkout/'

        let xmlData = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<checkout>
    <currency>BRL</currency>
    <reference>${pedidoId}</reference>`; // Usando o ID do pedido como referência

        itensCarrinho.forEach((item, index) => {
            // O XML estava sem o fechamento da tag amount e faltava o price com 2 casas decimais,
            // e o item.amount era o valor em centavos vindo do frontend.
            // Aqui estamos usando o price em centavos e convertendo para reais.
            xmlData += `
    <item>
        <id>${item.id}</id>
        <description>${item.name}</description>
        <amount>${(item.amount / 100).toFixed(2)}</amount>
        <quantity>${item.quantity}</quantity>
    </item>`;
        });

        // Verifique se os dados do telefone estão chegando corretamente,
        // o PagSeguro é muito chato com isso.
        // O telefone deve ter 11 dígitos para celular (DDD + número)
        // ou 10 dígitos para fixo. Remover caracteres não numéricos.
        const cleanPhoneNumber = cliente.telefone ? cliente.telefone.replace(/\D/g, '') : '';
        const phoneAreaCode = cleanPhoneNumber.substring(0, 2);
        const phoneNumber = cleanPhoneNumber.substring(2);

        xmlData += `
    <sender>
        <name>${cliente.nome}</name>
        <email>${PAGSEGURO_EMAIL_SANDBOX}</email> <phone>
            <areaCode>${phoneAreaCode}</areaCode>
            <number>${phoneNumber}</number>
        </phone>
    </sender>
    <redirectURL>${redirect_url}</redirectURL>
    <notificationURL>${URL_BASE}/.netlify/functions/pagseguro-webhook</notificationURL>
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

        const parser = new xml2js.Parser({ explicitArray: false });
        const result = await parser.parseStringPromise(response.data);

        console.log('Resposta PagSeguro (XML parseado):', result);

        if (result.checkout && result.checkout.code) {
            const checkoutCode = result.checkout.code;
            const paymentLink = `${pagseguroBaseUrl}payment.html?code=${checkoutCode}`;

            // Opcional: Atualizar o pedido no Firebase com o código do PagSeguro
            // Remova os comentários se quiser usar essa funcionalidade e o Firebase estiver configurado
            /*
            if (db && updateDoc && doc) {
                try {
                    await updateDoc(doc(db, 'pedidos', pedidoId), {
                        pagSeguroTransactionCode: checkoutCode,
                        pagamentoStatus: 'aguardando_pagamento_pagseguro',
                    });
                    console.log(`Pedido ${pedidoId} atualizado no Firebase com o código do PagSeguro: ${checkoutCode}`);
                } catch (firebaseError) {
                    console.error('Erro ao atualizar pedido no Firebase:', firebaseError);
                    // Não impeça o fluxo de pagamento por um erro de atualização no Firebase
                }
            }
            */

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentLink }),
            };
        } else {
            console.error('Erro na resposta do PagSeguro (sem código de checkout):', result.errors || response.data);
            return {
                statusCode: 400, // Ou 500 se for um erro inesperado
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ details: 'Erro ao criar o checkout no PagSeguro (resposta inválida).', errors: result.errors || response.data }),
            };
        }

    } catch (error) {
        console.error('Erro na função criar-pagamento-pagseguro (catch geral):', error);
        let errorMessage = 'Erro interno do servidor.';
        if (error.response && error.response.data) {
            try {
                const parser = new xml2js.Parser({ explicitArray: false });
                const errorParsed = await parser.parseStringPromise(error.response.data);
                // O PagSeguro pode retornar erros XML em diferentes estruturas
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