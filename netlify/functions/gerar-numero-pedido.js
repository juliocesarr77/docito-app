// netlify/functions/gerar-numero-pedido.js

// Importa as bibliotecas necessárias
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Variáveis para armazenar as instâncias inicializadas (para reuso)
let db;
let initialized = false; // Flag para controlar a inicialização única

// Função assíncrona para inicializar Firebase
async function initializeFirebase() {
    if (initialized) {
        console.log("Firebase já inicializado.");
        return;
    }

    console.log("Iniciando Firebase...");

    try {
        const serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);

        // Inicializar Firebase Admin SDK
        // Acessa initializeApp.apps para verificar se já foi inicializado
        if (!initializeApp.apps.length) { 
            initializeApp({
                credential: cert(serviceAccountCredentials),
            });
        }
        db = getFirestore();
        console.log("Firebase Admin SDK inicializado com sucesso.");
        initialized = true;

    } catch (e) {
        console.error("Erro na inicialização do Firebase (initializeFirebase):", e.message, e.stack);
        initialized = false;
        throw new Error(`Falha na inicialização do Firebase: ${e.message}`);
    }
}

// Handler principal da Netlify Function
exports.handler = async (event, context) => {
    console.log("Função gerar-numero-pedido acionada.");

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Método não permitido.' }) };
    }

    try {
        // Garante que o Firebase esteja inicializado
        await initializeFirebase();

        if (!db) {
            throw new Error("Firebase Firestore não foi inicializado corretamente.");
        }

        // Parseia o corpo da requisição para obter os dados do pedido do frontend
        let requestBody;
        try {
            requestBody = JSON.parse(event.body);
            if (!requestBody || !requestBody.clienteData || !requestBody.itensCarrinho) {
                throw new Error("Corpo da requisição inválido: clienteData ou itensCarrinho ausentes.");
            }
        } catch (parseError) {
            console.error("Erro ao parsear o corpo da requisição:", parseError);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Erro na requisição: corpo JSON inválido ou dados ausentes." }),
            };
        }

        let novoNumeroPedido;

        // --- Lógica para gerar o número sequencial no Firestore usando uma transação ---
        const counterRef = db.collection('counters').doc('pedidoIdCounter');

        await db.runTransaction(async (transaction) => {
            const counterDoc = await transaction.get(counterRef);

            if (!counterDoc.exists) {
                // Se o documento do contador não existir, cria-o com o valor inicial
                // ou ajusta conforme sua necessidade
                novoNumeroPedido = 1133; 
                transaction.set(counterRef, { currentNumber: novoNumeroPedido });
                console.log("Contador de pedido inicializado no Firestore.");
            } else {
                let currentNumber = counterDoc.data().currentNumber;
                if (typeof currentNumber !== 'number') {
                    // Lidar com o caso de currentNumber não ser um número
                    console.warn("currentNumber no Firestore não é um número. Reiniciando contador.");
                    currentNumber = 1132; 
                }
                novoNumeroPedido = currentNumber + 1;
                transaction.update(counterRef, { currentNumber: novoNumeroPedido });
            }
        });

        console.log(`Número de pedido sequencial gerado no Firestore: ${novoNumeroPedido}`);

        // --- Lógica para salvar o pedido completo no Firestore ---
        const pedidoParaSalvar = {
            ...requestBody.clienteData,
            itensCarrinho: requestBody.itensCarrinho,
            numeroPedido: novoNumeroPedido, // O número sequencial gerado pelo Firestore
            status: 'pendente',
            pagamentoStatus: 'aguardando_contato',
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection('pedidos').add(pedidoParaSalvar);
        console.log(`Pedido salvo no Firestore com ID: ${docRef.id}`);

        // Retorna o número do pedido e o ID do Firestore para o frontend
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numeroPedido: novoNumeroPedido, pedidoIdFirestore: docRef.id }),
        };

    } catch (error) {
        console.error('Erro geral na função gerar-numero-pedido:', error.message, error.stack);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: 'Erro interno ao processar o pedido.', 
                details: error.message 
            }),
        };
    }
};