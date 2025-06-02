// netlify/functions/gerar-numero-pedido.js

// Importa as bibliotecas necessárias
const admin = require('firebase-admin');

// Variáveis para armazenar as instâncias inicializadas (para reuso)
let db;
let firebaseInitialized = false; // Flag para controlar a inicialização única

// Função assínrona para inicializar Firebase
async function initializeFirebase() {
    console.log("--- INICIANDO initializeFirebase ---");

    // Teste 1: Verifica se 'admin' foi importado corretamente
    console.log("admin object:", typeof admin);
    if (typeof admin !== 'object' || admin === null) {
        console.error("ERRO CRÍTICO: 'admin' não é um objeto válido após require('firebase-admin').");
        throw new Error("Falha ao carregar o módulo 'firebase-admin'.");
    }
    
    // Teste 2: Verifica a natureza de admin.app e admin.credential.cert
    // O log mostra admin.app: function, o que significa que precisamos chamar admin.app()
    // para obter a interface do app.
    console.log("admin.app (antes da chamada):", typeof admin.app); // Isso ainda deve ser 'function'
    console.log("admin.credential.cert:", typeof admin.credential.cert);
    
    // CORREÇÃO AQUI: Não é mais admin.app.initializeApp, e sim admin.initializeApp
    // Se admin.app é uma função, a inicialização pode ser diretamente em admin.initializeApp
    // ou se admin.app é a forma de acessar a "app factory".
    // Pela documentação do firebase-admin v10+, a forma de inicializar é diretamente `admin.initializeApp`.

    if (firebaseInitialized) {
        console.log("Firebase já inicializado (via hot start). Retornando.");
        return;
    }

    console.log("Iniciando Firebase (cold start) - Prosseguindo com inicialização...");

    try {
        // --- DEPURANDO CREDENCIAIS ---
        console.log("Verificando GOOGLE_SERVICE_ACCOUNT_CREDENTIALS...");
        console.log("Variável de ambiente GOOGLE_SERVICE_ACCOUNT_CREDENTIALS está definida?", !!process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);
        
        const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;
        
        let serviceAccountCredentials;
        try {
            serviceAccountCredentials = JSON.parse(rawCredentials);
            console.log("Credenciais JSON parseadas com sucesso.");
        } catch (parseError) {
            console.error("!!! ERRO CRÍTICO AO PARSEAR JSON DAS CREDENCIAIS:", parseError.message);
            console.error("--- CONTEÚDO BRUTO (PRIMEIROS 200 CARACTERES) ---");
            console.error(rawCredentials ? rawCredentials.substring(0, 200) : "Vazio/Undefined");
            console.error("--- FIM CONTEÚDO BRUTO ---");
            throw new Error(`Falha ao parsear credenciais JSON: ${parseError.message}. Verifique o formato do JSON em Netlify.`);
        }

        if (!serviceAccountCredentials || typeof serviceAccountCredentials !== 'object' || !serviceAccountCredentials.private_key) {
            console.error("!!! ERRO CRÍTICO: Credenciais parseadas inválidas ou incompletas.");
            throw new Error("As credenciais do Firebase Admin SDK estão ausentes ou mal formatadas APÓS o parse. O JSON pode estar faltando 'private_key' ou ser de um tipo errado.");
        }
        console.log("Credenciais parseadas e verificadas: 'private_key' presente.");

        // Inicializar Firebase Admin SDK
        // CORREÇÃO: O initializeApp e cert são acessados diretamente do objeto 'admin' global.
        console.log("Tentando inicializar o aplicativo Firebase diretamente via admin.initializeApp...");
        const app = admin.initializeApp({ // AQUI ESTÁ A MUDANÇA PRINCIPAL
            credential: admin.credential.cert(serviceAccountCredentials),
        });
        console.log("Aplicativo Firebase inicializado com sucesso.");

        // CORREÇÃO: getFirestore é acessado diretamente de admin.firestore
        db = admin.firestore(app); // AQUI ESTÁ A OUTRA MUDANÇA PRINCIPAL
        console.log("Firebase Firestore inicializado com sucesso. Instância 'db' disponível.");
        firebaseInitialized = true; // Marca como inicializado

    } catch (e) {
        console.error("!!! ERRO CATASTRÓFICO na inicialização do Firebase (initializeFirebase):", e.message);
        console.error("STACK TRACE COMPLETO:", e.stack);
        firebaseInitialized = false; // Garante que será tentado novamente se falhar
        throw new Error(`Falha na inicialização do Firebase: ${e.message}. Um problema crítico ocorreu.`);
    } finally {
        console.log("--- FINALIZANDO initializeFirebase ---");
    }
}

// Handler principal da Netlify Function
exports.handler = async (event, context) => {
    console.log("--- INICIANDO handler gerar-numero-pedido ---");

    if (event.httpMethod !== 'POST') {
        console.log("Método HTTP não permitido:", event.httpMethod);
        return { statusCode: 405, body: JSON.stringify({ message: 'Método não permitido.' }) };
    }

    try {
        console.log("Chamando initializeFirebase...");
        await initializeFirebase();
        console.log("initializeFirebase retornou.");

        if (!db) {
            console.error("!!! ERRO CRÍTICO: Instância 'db' do Firebase Firestore não foi inicializada corretamente.");
            throw new Error("Firebase Firestore não foi inicializado corretamente após `initializeFirebase`.");
        }
        console.log("Instância do Firestore (db) verificada.");

        let requestBody;
        try {
            console.log("Tentando parsear o corpo da requisição...");
            requestBody = JSON.parse(event.body);
            if (!requestBody || typeof requestBody !== 'object' || !requestBody.clienteData || !requestBody.itensCarrinho) {
                console.error("Corpo da requisição inválido: clienteData ou itensCarrinho ausentes ou JSON malformado.");
                throw new Error("Corpo da requisição inválido: JSON malformado ou campos 'clienteData'/'itensCarrinho' ausentes.");
            }
            console.log("Corpo da requisição parseado com sucesso.");
        } catch (parseError) {
            console.error("Erro ao parsear o corpo da requisição:", parseError.message);
            return {
                statusCode: 400,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: "Erro na requisição: corpo JSON inválido ou dados ausentes.", details: parseError.message }),
            };
        }

        let novoNumeroPedido;

        console.log("Iniciando lógica de transação para o contador de pedidos...");
        const counterRef = db.collection('counters').doc('pedidoIdCounter');

        await db.runTransaction(async (transaction) => {
            console.log("Iniciando transação Firestore...");
            const counterDoc = await transaction.get(counterRef);
            console.log("Documento do contador obtido.");

            if (!counterDoc.exists) {
                console.log("Documento do contador não existe. Criando com valor inicial.");
                novoNumeroPedido = 1133; 
                transaction.set(counterRef, { currentNumber: novoNumeroPedido });
                console.log("Contador de pedido inicializado no Firestore com valor:", novoNumeroPedido);
            } else {
                let currentNumber = counterDoc.data().currentNumber;
                console.log("Valor atual do contador:", currentNumber);
                if (typeof currentNumber !== 'number' || isNaN(currentNumber)) {
                    console.warn(`Valor de currentNumber no Firestore (${currentNumber}) não é um número válido. Reiniciando contador para 1132.`);
                    currentNumber = 1132; 
                }
                novoNumeroPedido = currentNumber + 1;
                transaction.update(counterRef, { currentNumber: novoNumeroPedido });
                console.log(`Contador atualizado para: ${novoNumeroPedido}`);
            }
            console.log("Transação Firestore concluída para o contador.");
        });

        console.log(`Número de pedido sequencial gerado e confirmado no Firestore: ${novoNumeroPedido}`);

        console.log("Iniciando salvamento do pedido no Firestore...");
        const pedidoParaSalvar = {
            ...requestBody.clienteData,
            itensCarrinho: requestBody.itensCarrinho,
            numeroPedido: novoNumeroPedido,
            status: 'pendente',
            pagamentoStatus: 'aguardando_contato',
            createdAt: FieldValue.serverTimestamp(),
        };

        const docRef = await db.collection('pedidos').add(pedidoParaSalvar);
        console.log(`Pedido salvo no Firestore com ID: ${docRef.id}`);

        console.log("Retornando resposta de sucesso.");
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numeroPedido: novoNumeroPedido, pedidoIdFirestore: docRef.id }),
        };

    } catch (error) {
        console.error('!!! ERRO FATAL NA FUNÇÃO GERAR-NUMERO-PEDIDO:', error.message);
        console.error('STACK TRACE COMPLETO DO ERRO FATAL:', error.stack);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Erro interno ao processar o pedido. Por favor, tente novamente.',
                details: error.message,
            }),
        };
    } finally {
        console.log("--- FINALIZANDO handler gerar-numero-pedido ---");
    }
};