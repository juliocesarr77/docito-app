// netlify/functions/gerar-numero-pedido.js

// Importa as bibliotecas necessárias
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore'); // Importa FieldValue também

// Variáveis para armazenar as instâncias inicializadas (para reuso)
let db;
let docSheet;
let initialized = false; // Flag para controlar a inicialização única

// Função assíncrona para inicializar Firebase e Google Sheets
async function initializeServices() {
    // Se já inicializado, apenas retorna (otimização para "hot starts")
    if (initialized) {
        console.log("Serviços já inicializados.");
        return;
    }

    console.log("Iniciando serviços...");

    try {
        // As credenciais vêm de GOOGLE_SERVICE_ACCOUNT_CREDENTIALS
        const serviceAccountCredentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);

        // 1. Inicializar Firebase Admin SDK
        // Verifica se o app do Firebase já foi inicializado para evitar erro de reinicialização
        if (!initializeApp.apps.length) { // Usando .apps.length para verificar se há apps inicializados
            initializeApp({
                credential: cert(serviceAccountCredentials),
            });
        }
        db = getFirestore();
        console.log("Firebase Admin SDK inicializado.");

        // 2. Inicializar Google Spreadsheet
        const spreadsheetId = process.env.GOOGLE_SHEET_ID;
        if (!spreadsheetId) {
            throw new Error("Variável de ambiente GOOGLE_SHEET_ID não está definida.");
        }

        docSheet = new GoogleSpreadsheet(spreadsheetId);
        // Autentica com a conta de serviço
        await docSheet.useServiceAccountAuth(serviceAccountCredentials);
        // Carrega as informações da planilha (necessário antes de acessar as abas)
        await docSheet.loadInfo(); 
        console.log("Google Spreadsheet inicializado e autenticado. Título da Planilha:", docSheet.title);

        // Marca como inicializado com sucesso
        initialized = true;
        console.log("Serviços inicializados com sucesso.");

    } catch (e) {
        // Loga o erro detalhado e relança para que o handler possa tratá-lo
        console.error("Erro na inicialização dos serviços (initializeServices):", e.message, e.stack);
        initialized = false; // Garante que será tentado novamente se falhar
        throw new Error(`Falha na inicialização dos serviços: ${e.message}`);
    }
}

// Handler principal da Netlify Function
exports.handler = async (event, context) => {
    console.log("Função gerar-numero-pedido acionada.");

    // Verifica o método HTTP
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: JSON.stringify({ message: 'Método não permitido.' }) };
    }

    try {
        // Garante que os serviços estejam inicializados antes de prosseguir
        await initializeServices();

        // Verifica se os serviços estão realmente prontos
        if (!db) {
            throw new Error("Firebase Firestore não foi inicializado corretamente.");
        }
        if (!docSheet) {
            throw new Error("Google Spreadsheet não foi inicializado corretamente.");
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

        // --- Lógica para o Google Sheets (gerar número sequencial) ---
        const sheet = docSheet.sheetsByIndex[0]; // Assume que você quer a primeira aba (índice 0)
                                                 // Se você tiver uma aba específica para o contador,
                                                 // use: const sheet = docSheet.sheetsByTitle['NomeDaSuaAbaContador'];
        if (!sheet) {
            throw new Error("Primeira aba da planilha não encontrada. Verifique o índice ou título.");
        }

        // Carrega a célula onde o contador está (A1 na sua configuração)
        await sheet.loadCells('A1'); 
        const cell = sheet.getCellByA1('A1');

        // Lê o valor atual da célula A1. Se for nulo/vazio, inicia em 1132 para que o próximo seja 1133.
        let currentCounter = parseInt(cell.value || '1132'); 
        currentCounter++; // Incrementa para o próximo número sequencial

        // Atualiza a célula A1 com o novo contador
        cell.value = currentCounter;
        await sheet.saveCells(); // Salva as alterações na planilha

        console.log(`Número de pedido sequencial gerado: ${currentCounter}`);

        // --- Lógica para o Firebase (salvar o pedido completo) ---
        const pedidoParaSalvar = {
            ...requestBody.clienteData, // Dados do cliente vindo do frontend
            itensCarrinho: requestBody.itensCarrinho, // Itens do carrinho vindo do frontend
            numeroPedido: currentCounter, // O número sequencial gerado
            status: 'pendente', // Status inicial do pedido
            pagamentoStatus: 'aguardando_contato', // Para o fluxo do WhatsApp
            createdAt: FieldValue.serverTimestamp(), // Timestamp do servidor Firestore
            // Adicione outros campos necessários aqui
        };

        const docRef = await db.collection('pedidos').add(pedidoParaSalvar);
        console.log(`Pedido salvo no Firestore com ID: ${docRef.id}`);

        // Retorna o número do pedido para o frontend
        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ numeroPedido: currentCounter, pedidoIdFirestore: docRef.id }),
        };

    } catch (error) {
        console.error('Erro geral na função gerar-numero-pedido:', error.message, error.stack);
        return {
            statusCode: 500,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: 'Erro interno ao gerar número do pedido e salvar.', 
                details: error.message 
            }),
        };
    }
};