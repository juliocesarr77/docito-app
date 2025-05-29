// netlify/functions/criar-pagamento-pagseguro.js

const axios = require('axios');
const xml2js = require('xml2js');
const { updateDoc, doc } = require('firebase/firestore');
const { db } = require('./utils/firebaseAdmin'); // <--- Caminho ATUALIZADO para o novo arquivo Firebase

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
        const URL_BASE = process.env.URL_BASE || 'https://seu-dominio.netlify.app';

        if (!PAGSEGURO_EMAIL_SANDBOX || !PAGSEGURO_TOKEN_SANDBOX) {
            console.error('Variáveis de ambiente do PagSeguro não configuradas.');
            return {
                statusCode: 500,
                body: JSON.stringify({ details: 'Configuração do PagSeguro faltando. Verifique PAGSEGURO_EMAIL_SANDBOX e PAGSEGURO_TOKEN_SANDBOX.' }),
            };
        }
        if (!URL_BASE || URL_BASE === 'https://seu-dominio.netlify.app') {
            console.error('Variável de ambiente URL_BASE não configurada corretamente ou ainda no valor padrão.');
            return {
                statusCode: 500,
                body: JSON.stringify({ details: 'Configuração da URL base do site faltando. Verifique URL_BASE nas variáveis de ambiente do Netlify.' }),
            };
        }

        const pagseguroBaseUrl = 'https://ws.sandbox.pagseguro.uol.com.br/v2/checkout/'; // SandBox
        // Para Produção: 'https://ws.pagseguro.uol.com.br/v2/checkout/'

        let xmlData = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<checkout>
    <currency>BRL</currency>
    <reference>${pedidoId}</reference>`;

        itensCarrinho.forEach((item) => {
            xmlData += `
    <item>
        <id>${item.id}</id>
        <description>${item.name}</description>
        <amount>${(item.amount / 100).toFixed(2)}</amount>
        <quantity>${item.quantity}</quantity>
    </item>`;
        });

        const cleanPhoneNumber = cliente.telefone ? cliente.telefone.replace(/\D/g, '') : '';
        let phoneAreaCode = '';
        let phoneNumber = '';

        if (cleanPhoneNumber.length >= 10 && cleanPhoneNumber.length <= 11) { // Telefone com DDD + número (10 ou 11 dígitos)
            phoneAreaCode = cleanPhoneNumber.substring(0, 2);
            phoneNumber = cleanPhoneNumber.substring(2);
        } else {
            console.warn(`Número de telefone (${cliente.telefone}) inválido ou incompleto para PagSeguro: ${cleanPhoneNumber}. Usando valores padrão.`);
            // Usar valores padrão para evitar erro, mas o ideal é garantir que o cliente forneça um telefone válido.
            phoneAreaCode = '11';
            phoneNumber = '999999999';
        }

        xmlData += `
    <sender>
        <name>${cliente.nome}</name>
        <email>${PAGSEGURO_EMAIL_SANDBOX}</email>
        <phone>
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

            if (db && updateDoc && doc) {
                try {
                    await updateDoc(doc(db, 'pedidos', pedidoId), {
                        pagSeguroTransactionCode: checkoutCode,
                        pagamentoStatus: 'aguardando_pagamento_pagseguro',
                    });
                    console.log(`Pedido ${pedidoId} atualizado no Firebase com o código do PagSeguro: ${checkoutCode}`);
                } catch (firebaseError) {
                    console.error('Erro ao atualizar pedido no Firebase:', firebaseError);
                }
            } else {
                console.warn("Firebase db, updateDoc ou doc não estão disponíveis para atualização do pedido.");
            }

            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ paymentLink }),
            };
        } else {
            // Se o PagSeguro retornar XML de erro, ele pode vir dentro de 'errors'
            console.error('Erro na resposta do PagSeguro (sem código de checkout):', result.errors || response.data);
            const errorDetails = result.errors ? JSON.stringify(result.errors) : 'Resposta desconhecida do PagSeguro.';
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ details: `Erro ao criar o checkout no PagSeguro: ${errorDetails}` }),
            };
        }

    } catch (error) {
        console.error('Erro na função criar-pagamento-pagseguro (catch geral):', error);
        let errorMessage = 'Erro interno do servidor.';
        if (error.response && error.response.data) {
            try {
                const parser = new xml2js.Parser({ explicitArray: false });
                const errorParsed = await parser.parseStringPromise(error.response.data);
                errorMessage = errorParsed.errors ? JSON.stringify(errorParsed.errors) : error.response.data;
            } catch (parseError) {
                errorMessage = error.response.data;
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