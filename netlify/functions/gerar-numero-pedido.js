const { GoogleSpreadsheet } = require('google-spreadsheet');

// O ID da sua planilha Google Sheets (pegue da URL da planilha)
// ATENÇÃO: NÃO É O LINK COMPLETO, APENAS O ID ALFANUMÉRICO!
const SPREADSHEET_ID = '1P7HAqHzVAvHubaNfEaP0nWNib0R4u20K9_cs8UAGXuk'; 

// As credenciais da conta de serviço do Google (JSON completo da variável de ambiente)
const CREDENTIALS = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS);

// Inicialize o documento da planilha
const doc = new GoogleSpreadsheet(SPREADSHEET_ID);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Método não permitido' };
  }

  try {
    // Autentica com a conta de serviço
    await doc.useServiceAccountAuth(CREDENTIALS);
    await doc.loadInfo(); // Carrega as informações da planilha

    // Acessa a primeira aba da planilha (ou a que você designar para o contador)
    // Você pode criar uma aba chamada "Contador" e ter o número na célula A1
    const sheet = doc.sheetsByIndex[0]; // Ou doc.sheetsByTitle['Contador']
    await sheet.loadCells('A1'); // Carrega a célula onde o contador está

    // Lê o valor atual da célula A1. Se for nulo/vazio, inicia em 1132.
    // Isso garante que o primeiro pedido será 1133.
    let currentCounter = parseInt(sheet.getCellByA1('A1').value || '1132'); 
    currentCounter++; // Incrementa para o próximo número

    // Atualiza a célula A1 com o novo contador
    sheet.getCellByA1('A1').value = currentCounter;
    await sheet.saveCells(); // Salva as alterações na planilha

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ numeroPedido: currentCounter }),
    };

  } catch (error) {
    console.error('Erro ao gerar número do pedido:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ details: 'Erro interno ao gerar número do pedido.', error: error.message }),
    };
  }
};