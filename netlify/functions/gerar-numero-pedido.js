// netlify/functions/gerar-numero-pedido.js

// Importa as bibliotecas necessárias
// Vamos tentar importar o pacote completo firebase-admin primeiro, e depois acessar os módulos.
// Isso às vezes pode contornar problemas de carregamento de módulos aninhados.
const admin = require('firebase-admin');

// Variáveis para armazenar as instâncias inicializadas (para reuso)
let db;
let firebaseInitialized = false; // Flag para controlar a inicialização única

// Função assíncrona para inicializar Firebase
async function initializeFirebase() {
    console.log("--- INICIANDO initializeFirebase ---");

    // Teste 1: Verifica se 'admin' foi importado corretamente
    console.log("admin object:", typeof admin);
    if (typeof admin !== 'object' || admin === null) {
        console.error("ERRO CRÍTICO: 'admin' não é um objeto válido após require('firebase-admin').");
        throw new Error("Falha ao carregar o módulo 'firebase-admin'.");
    }
    
    // Teste 2: Verifica se initializeApp e cert existem dentro de admin.app
    console.log("admin.app:", typeof admin.app);
    if (typeof admin.app !== 'object' || admin.app === null || typeof admin.app.initializeApp !== 'function' || typeof admin.credential.cert !== 'function') {
        console.error("ERRO CRÍTICO: admin.app ou admin.credential.cert não são válidos. Módulo 'firebase-admin' pode estar corrompido ou incompleto.");
        throw new Error("Dependências do Firebase Admin SDK não carregadas corretamente.");
    }

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

        // Inicializar Firebase Admin SDK usando admin.app e admin.credential
        // Esta é a parte CRÍTICA. O método initializeApp()
        // por si só já verifica se um app padrão já foi inicializado.
        // Se já estiver, ele retorna a instância existente sem erro.
        // Se não, ele inicializa um novo.
        console.log("Tentando inicializar o aplicativo Firebase...");
        const app = admin.app.initializeApp({
            credential: admin.credential.cert(serviceAccountCredentials),
        });
        console.log("Aplicativo Firebase inicializado com sucesso.");

        db = admin.firestore(app); // Passa a instância do app para getFirestore (agora admin.firestore)
        console.log("Firebase Firestore inicializado com sucesso. Instância 'db' disponível.");
        firebaseInitialized = true; // Marca como inicializado

    } catch (e) {
        // Loga o erro detalhado e relança para que o handler possa tratá-lo
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

    // 1. Verifica o método HTTP
    if (event.httpMethod !== 'POST') {
        console.log("Método HTTP não permitido:", event.httpMethod);
        return { statusCode: 405, body: JSON.stringify({ message: 'Método não permitido.' }) };
    }

    try {
        // 2. Garante que o Firebase esteja inicializado.
        // Qualquer erro na inicialização será capturado por este try/catch externo.
        console.log("Chamando initializeFirebase...");
        await initializeFirebase();
        console.log("initializeFirebase retornou.");

        // Verificação final para garantir que `db` está disponível
        if (!db) {
            console.error("!!! ERRO CRÍTICO: Instância 'db' do Firebase Firestore não foi inicializada corretamente.");
            throw new Error("Firebase Firestore não foi inicializado corretamente após `initializeFirebase`.");
        }
        console.log("Instância do Firestore (db) verificada.");

        // 3. Parseia o corpo da requisição para obter os dados do pedido do frontend
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

        // 4. Lógica para gerar o número sequencial no Firestore usando uma transação
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

        // 5. Lógica para salvar o pedido completo no Firestore
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

        // 6. Retorna o número do pedido e o ID do Firestore para o frontend
        console.log("Retornando resposta de sucesso.");
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numeroPedido: novoNumeroPedido, pedidoIdFirestore: docRef.id }),
        };

    } catch (error) {
        // Captura e loga erros gerais da função
        console.error('!!! ERRO FATAL NA FUNÇÃO GERAR-NUMERO-PEDIDO:', error.message);
        console.error('STACK TRACE COMPLETO DO ERRO FATAL:', error.stack);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: 'Erro interno ao processar o pedido. Por favor, tente novamente.',
                details: error.message,
                //stack: error.stack // Opcional: descomente em DEV para depuração profunda, mas remova em produção
            }),
        };
    } finally {
        console.log("--- FINALIZANDO handler gerar-numero-pedido ---");
    }
};