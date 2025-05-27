const express = require('express');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');
const admin = require('firebase-admin');
const serviceAccount = require('./docito--doceria-firebase-adminsdk-fbsvc-9818909c5a.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

// Middleware para verificar se o usuário é administrador
async function isAdmin(req, res, next) {
  console.log('Middleware isAdmin chamado'); // <---------------------- LOG ADICIONADO
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader || !authorizationHeader.startsWith('Bearer ')) {
    console.log('Header de autorização ausente ou inválido:', authorizationHeader); // <---------------------- LOG ADICIONADO
    return res.status(401).json({ erro: 'Não autorizado.' });
  }

  const idToken = authorizationHeader.split('Bearer ')[1];
  console.log('Token recebido:', idToken); // <---------------------- LOG ADICIONADO

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('Token decodificado:', decodedToken); // <---------------------- LOG ADICIONADO
    // Verifique se a claim isAdmin está presente e é true
    if (decodedToken && decodedToken.isAdmin === true) {
      req.admin = decodedToken;
      console.log('Usuário é administrador'); // <---------------------- LOG ADICIONADO
      next();
    } else {
      console.log('Usuário não é administrador:', decodedToken); // <---------------------- LOG ADICIONADO
      return res.status(403).json({ erro: 'Acesso negado. Requer privilégios de administrador.' }); // 403 Forbidden
    }
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return res.status(401).json({ erro: 'Não autorizado.' });
  }
}

// Função para gerar token único
function gerarTokenUnico() {
  return uuidv4();
}

// Função para gerar token único e salvar no banco
async function criarNovoToken() {
  const token = gerarTokenUnico();
  try {
    await db.collection('depoimento_tokens').doc(token).set({
      usado: false,
      data_criacao: new Date(),
    });
    console.log(`Token gerado e salvo: ${token}`);
    return token;
  } catch (error) {
    console.error('Erro ao salvar o token:', error);
    return null;
  }
}

// Rota para gerar um link de depoimento (agora protegida pelo middleware isAdmin)
app.post('/api/admin/gerar-link-depoimento', isAdmin, async (req, res) => {
  const token = await criarNovoToken();
  if (token) {
    const linkDepoimento = `http://localhost:3000/depoimento/${token}`;
    res.status(200).json({ link: linkDepoimento });
  } else {
    res.status(500).json({ erro: 'Falha ao gerar o link de depoimento.' });
  }
});

// Rota para verificar o token
app.get('/api/depoimentos/verificar-token/:token', async (req, res) => {
  const { token } = req.params;

  try {
    const tokenRef = db.collection('depoimento_tokens').doc(token);
    const doc = await tokenRef.get();
    if (doc.exists && !doc.data().usado) {
      res.status(200).json({ valido: true });
    } else {
      res.status(400).json({ valido: false, erro: 'Token inválido ou já utilizado.' });
    }
  } catch (error) {
    console.error('Erro ao verificar o token:', error);
    res.status(500).json({ valido: false, erro: 'Ocorreu um erro ao verificar o token.' });
  }
});

// Rota para receber o formulário de depoimento
app.post('/api/depoimentos/enviar', async (req, res) => {
  const { nome_completo, email, avaliacao, depoimento, publicar_nome, token } = req.body;

  try {
    if (!nome_completo || !avaliacao || !depoimento || !token) {
      return res.status(400).json({ erro: 'Por favor, preencha todos os campos obrigatórios e forneça o token.' });
    }

    const tokenRef = db.collection('depoimento_tokens').doc(token);
    const tokenDoc = await tokenRef.get();

    if (!tokenDoc.exists || tokenDoc.data().usado) {
      return res.status(400).json({ erro: 'Token inválido ou já utilizado.' });
    }

    let nome_publico = nome_completo;
    if (publicar_nome === false) {
      const partesDoNome = nome_completo.split(' ');
      nome_publico = partesDoNome.map((parte, index) => {
        if (index === 0 || index === partesDoNome.length - 1) {
          return parte.charAt(0) + '*'.repeat(parte.length - 1);
        } else if (partesDoNome.length > 2) {
          return '*'.repeat(parte.length);
        } else {
          return parte.charAt(0) + '*'.repeat(parte.length - 1);
        }
      }).join(' ');
    }

    const novoDepoimento = {
      nome_completo,
      email: email || null,
      avaliacao: parseInt(avaliacao),
      depoimento,
      publicar_nome: publicar_nome === false ? false : true,
      data_criacao: new Date(),
      status: 'pendente',
      nome_publico,
    };

    const depoimentoRef = await db.collection('depoimentos').add(novoDepoimento);

    await tokenRef.update({ usado: true });

    res.status(201).json({ mensagem: 'Depoimento enviado com sucesso!', id: depoimentoRef.id });

  } catch (erro) {
    console.error('Erro ao receber e salvar o depoimento:', erro);
    res.status(500).json({ erro: 'Ocorreu um erro ao salvar o seu depoimento. Tente novamente.' });
  }
});

// Rota para buscar depoimentos aprovados
app.get('/api/depoimentos/aprovados', async (req, res) => {
  try {
    const depoimentosRef = db.collection('depoimentos');
    const snapshot = await depoimentosRef.where('status', '==', 'aprovado').get();
    const depoimentosAprovados = [];
    snapshot.forEach(doc => {
      depoimentosAprovados.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(depoimentosAprovados);
  } catch (error) {
    console.error('Erro ao buscar depoimentos aprovados:', error);
    res.status(500).json({ erro: 'Ocorreu um erro ao buscar os depoimentos.' });
  }
});

// Rota para buscar todos os depoimentos (protegida por autenticação de administrador)
app.get('/api/admin/depoimentos', isAdmin, async (req, res) => {
  try {
    const depoimentosRef = db.collection('depoimentos');
    const snapshot = await depoimentosRef.orderBy('data_criacao', 'desc').get();
    const todosDepoimentos = [];
    snapshot.forEach(doc => {
      todosDepoimentos.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(todosDepoimentos);
  } catch (error) {
    console.error('Erro ao buscar todos os depoimentos:', error);
    res.status(500).json({ erro: 'Ocorreu um erro ao buscar os depoimentos.' });
  }
});

// Rota para atualizar o status de um depoimento (protegida por autenticação de administrador)
app.post('/api/admin/depoimentos/:id/atualizar-status', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status || (status !== 'pendente' && status !== 'aprovado' && status !== 'rejeitado')) {
    return res.status(400).json({ erro: 'Status inválido.' });
  }

  try {
    const depoimentoRef = db.collection('depoimentos').doc(id);
    const doc = await depoimentoRef.get();
    if (!doc.exists) {
      return res.status(404).json({ erro: 'Depoimento não encontrado.' });
    }

    await depoimentoRef.update({ status });
    res.status(200).json({ mensagem: `Status do depoimento ${id} atualizado para ${status}.` });
  } catch (error) {
    console.error(`Erro ao atualizar o status do depoimento ${id}:`, error);
    res.status(500).json({ erro: 'Ocorreu um erro ao atualizar o status do depoimento.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor backend rodando na porta ${port}`);
});